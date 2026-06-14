# 爬虫设计 / Crawler

> 双语：[简体中文](./crawler.md) · [English](./crawler.en.md)

## 触发

`.github/workflows/crawl.yml`:

```yaml
on:
  schedule:
    - cron: '0 4 * * *' # 12:00 UTC+8
  push:
    branches: [main]
  workflow_dispatch: # 手动触发
```

## 流程

```
Step 1: 拉取热门列表
  POPULAR_API = 'https://api.bilibili.com/x/web-interface/popular?ps=20&pn={n}'
  最多 50 页（≈ 1000 支视频）
  每页 20 支；如该页 < 20 视频则停止

Step 2: 并发抓取每支视频的标签
  TAGS_API = 'https://api.bilibili.com/x/tag/archive/tags?bvid={bvid}'
  并发数 TAG_CONCURRENCY = 8

Step 3: 去重 UP 主，并发补抓粉丝 / 签名 / 认证
  UP_FOLLOWERS_API = 'https://api.bilibili.com/x/relation/stat?vmid={mid}'
  UP_INFO_API = 'https://api.bilibili.com/x/space/wbi/acc/info?mid={mid}'
  并发数 UP_CONCURRENCY = 6
  1000 支视频通常对应 ~700 唯一 UP，耗时 ~30-50s

Step 4: 计算 7 个预聚合维度
  summary / channels / topUps / duration / hourHeatmap / topTags
  写入 result/agg-latest.json

Step 5: 写入 result/{ISO-timestamp}.json 与 list.json
  然后 git push 到 result orphan 分支
```

## 失败重试

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

- 视频标签抓取失败：静默降级为空数组（不影响其他视频）
- UP 主元数据失败：静默降级为 `followers: null`（不影响聚合计算）

## 输出文件结构

```
result/
├── 2026-06-10T16-30-52+0800.json     # 当日爬取
├── 2026-06-09T16-30-45+0800.json
├── ...
├── list.json                          # 排序后的文件名清单（最新优先）
└── agg-latest.json                    # 预聚合（始终对应最新一天）
```

`list.json` 维护策略：

- 每次新爬取成功，unshift 新文件名到数组头
- 保留历史：理论上无限成长（CI 不会清理）

> 未来可考虑加 `result:cleanup` workflow，保留 30 天。

## 限制

- B 站热门榜每天约 1000 支视频
- UP 主 API 对匿名 IP 限流约 60 req/min；6 并发下应该安全
- 失败时整个 cron job 会 fail，导致当天数据缺失
  - **缓解**：fail-fast 后下次 cron 会补上
  - **未来**：可加 `try/catch` 对每支视频隔离

## 本地手动跑

```bash
pnpm run crawldata
```

会把 `result/` 写到 working tree，要 commit + push。
