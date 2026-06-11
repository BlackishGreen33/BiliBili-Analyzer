# 爬蟲設計 / Crawler

> 雙語：[繁體中文](./crawler.md) · [English](./crawler.en.md)

## 觸發

`.github/workflows/crawl.yml`:

```yaml
on:
  schedule:
    - cron: '0 4 * * *' # 12:00 UTC+8
  push:
    branches: [main]
  workflow_dispatch: # 手動觸發
```

## 流程

```
Step 1: 拉取熱門列表
  POPULAR_API = 'https://api.bilibili.com/x/web-interface/popular?ps=20&pn={n}'
  最多 50 頁（≈ 1000 支視頻）
  每頁 20 支；如該頁 < 20 視頻則停止

Step 2: 並發抓取每支視頻的標籤
  TAGS_API = 'https://api.bilibili.com/x/tag/archive/tags?bvid={bvid}'
  並發數 TAG_CONCURRENCY = 8

Step 3: 去重 UP 主，並發補抓粉絲 / 簽名 / 認證
  UP_FOLLOWERS_API = 'https://api.bilibili.com/x/relation/stat?vmid={mid}'
  UP_INFO_API = 'https://api.bilibili.com/x/space/wbi/acc/info?mid={mid}'
  並發數 UP_CONCURRENCY = 6
  1000 支視頻通常對應 ~700 唯一 UP，耗時 ~30-50s

Step 4: 計算 7 個預聚合維度
  summary / channels / topUps / duration / hourHeatmap / topTags
  寫入 result/agg-latest.json

Step 5: 寫入 result/{ISO-timestamp}.json 與 list.json
  然後 git push 到 result orphan 分支
```

## 失敗重試

```js
const BACKOFF_MS = [1000, 2500, 5000];

fetchWithRetry(url) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try { return await axios.get(url, { headers, timeout: 10s }); }
    catch { await sleep(BACKOFF_MS[i]); }
  }
  throw new Error('MAX_RETRIES_EXCEEDED');
}
```

- 視頻標籤抓取失敗：靜默降級為空陣列（不影響其他視頻）
- UP 主元資料失敗：靜默降級為 `followers: null`（不影響聚合計算）

## 輸出檔案結構

```
result/
├── 2026-06-10T16-30-52+0800.json     # 當日爬取
├── 2026-06-09T16-30-45+0800.json
├── ...
├── list.json                          # 排序後的檔名清單（最新優先）
└── agg-latest.json                    # 預聚合（始終對應最新一天）
```

`list.json` 維護策略：

- 每次新爬取成功，unshift 新檔名到陣列頭
- 保留歷史：理論上無限成長（CI 不會清理）

> 未來可考慮加 `result:cleanup` workflow，保留 30 天。

## 限制

- B 站熱門榜每天約 1000 支視頻
- UP 主 API 對匿名 IP 限流約 60 req/min；6 並發下應該安全
- 失敗時整個 cron job 會 fail，導致當天資料缺失
  - **緩解**：fail-fast 後下次 cron 會補上
  - **未來**：可加 `try/catch` 對每支視頻隔離

## 本地手動跑

```bash
pnpm run crawldata
```

會把 `result/` 寫到 working tree，要 commit + push。
