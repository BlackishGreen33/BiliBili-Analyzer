# 分析指標 / Analysis

> 雙語：[繁體中文](./analysis.md) · [English](./analysis.en.md)

本文件說明 `/dashboard` 與詳情頁所有視覺化指標的**資料來源**、**計算公式**與**UI 對應位置**。

## 指標總覽

| 視圖          | 位置                  | 資料源                                                                       | 計算                                                     |
| ------------- | --------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| 總視頻數      | `/dashboard` summary  | `result/agg-latest.json::summary.totalVideos`                                | `video.length`                                           |
| 上榜 UP 數    | `/dashboard` summary  | `summary.totalUp`                                                            | `unique(UP).length`                                      |
| 總播放量      | `/dashboard` summary  | `summary.totalViews`                                                         | `Σ views`                                                |
| 互動量        | `/dashboard` summary  | `summary.totalLike + 2·totalCoin + 2·totalFavorite`                          | 加權後總和                                               |
| 平均互動率    | `/dashboard` summary  | `summary.avgEngagement`                                                      | `Σ(like + 2·coin + 2·favorite + share) / Σview`          |
| 分區占比      | `/dashboard` pie      | `channels[].count`                                                           | 一級分區熱門視頻數比例                                   |
| UP 主上榜榜   | `/dashboard` bar      | `topUps[0..9]`                                                               | 上榜次數降冪                                             |
| 時長分佈      | `/dashboard` bar      | `duration`                                                                   | 7 桶直方圖（<1, 1-3, 3-5, 5-10, 10-20, 20-30, >30 分鐘） |
| 發布時段      | `/dashboard` bar      | `hourHeatmap`                                                                | 24 小時發布數（UTC+8）                                   |
| 熱門標籤      | `/dashboard` badges   | `topTags[0..19]`                                                             | 標籤出現次數                                             |
| UP 主排行榜   | `/dashboard` table    | `topUps`                                                                     | 上榜數 + 總播放 + 粉絲                                   |
| 互動率 TOP 10 | `/dashboard` section  | `topEngagement[0..9]`                                                        | 互動率降冪 + 播放做 tie-break                            |
| 觀看次數      | 詳情頁                | `BilibiliVideoInfo.stat.view`                                                | 即時 B 站 API                                            |
| 互動 7 指標   | 詳情頁 `Analization`  | `BilibiliVideoInfo.stat.{view, danmaku, reply, favorite, coin, share, like}` | 即時 B 站 API                                            |
| 條形圖        | 詳情頁 `StackedChart` | 同上                                                                         | 7 項 bar，y 軸自適應                                     |
| 標籤雲        | 詳情頁 `WordCloud`    | 從 `/api/videoTags` 取得                                                     | 一級 300、二級 200、用戶 100 加權                        |

## 互動率

互動率公式：

```
engagement = (like + 2·coin + 2·favorite + share) / view
```

收藏與投幣加權 ×2，因為這兩個行為是**顯式 intent**（"我想回來看" 與
"我認可這作品"），權重應高於被動的 like。

### 加權平均（summary 級）

```
avgEngagement = Σ(like + 2·coin + 2·favorite + share) / Σview
```

寫入 `result/agg-latest.json::summary.avgEngagement`，由
`/api/dashboard` 暴露為第 5 張 summary 卡。

### 影片級排行（Top 10）

每支影片單獨算 `engagement` 後降冪（播放量做 tie-break），取前 10
寫入 `topEngagement[10]`：

```ts
type EngagementItem = {
  bvid: string;
  title: string;
  UP: string;
  mid?: number;
  views: number;
  like: number;
  coin: number;
  favorite: number;
  share: number;
  engagement: number; // 0–N（多數 0.01–0.30）
};
```

`/dashboard` 對應 section 用水平 bar chart + table 並列；點 row 跳
`/details?bvid=...`。

## 公式

### 7 桶時長分佈

```js
const DURATION_BUCKETS = [
  { label: '<1 分钟', min: 0, max: 60 },
  { label: '1-3 分钟', min: 60, max: 180 },
  { label: '3-5 分钟', min: 180, max: 300 },
  { label: '5-10 分钟', min: 300, max: 600 },
  { label: '10-20 分钟', min: 600, max: 1200 },
  { label: '20-30 分钟', min: 1200, max: 1800 },
  { label: '>30 分钟', min: 1800, max: Infinity },
];
```

### 24 小時發布時段

```js
const d = new Date(v.pubdate * 1000 + 8 * 60 * 60 * 1000); // UTC+8
hourHist[d.getUTCHours()].count++;
```

> 注意：因為 `pubdate` 是 UTC 秒數，而我們要的是「UTC+8 當地時間的小時數」，
> 所以要手動加 8 小時偏移。

### 分區聚合

```ts
const channelMap = new Map<string, ChannelAgg>();
for (const v of videos) {
  const first = v.tags.firstChannel || '未分类';
  const second = v.tags.secondChannel || '未分类';
  // 累計一級、二級分區的 count + views
}
```

`avgViews = Σ views / count`。

## 跨日趨勢（`/dashboard/compare`）

選擇兩個日期的爬取結果做對比，server 端計算 diff：

| 區塊         | 內容                                                            |
| ------------ | --------------------------------------------------------------- |
| 總量對比     | 5 個 metric（總視頻/UP/播放/互動量/平均互動率） × 2 天 + Δ chip |
| 分區占比差異 | 一級分區 countA → countB + Δ，按 \|Δ\| 排序                     |
| UP 主榜變化  | 新增 N · 落榜 N · 持續上榜 N（按 Δ 排序）                       |
| 時長分佈     | A、B 兩個 BarChart 並排                                         |
| 發布時段     | A、B 兩個 BarChart 並排                                         |
| 標籤變化     | 新增 N · 消失 N · 共 N 持續（badge 帶計數）                     |

需要至少 2 天資料；第一天上線時僅有 1 天，需等隔日 cron 觸發後才能用。QA 可用 `pnpm mock-second-day` 生成假昨日資料 + `MOCK_LOCAL_FILES=1 pnpm dev` 走本機路徑。

## 跨日時序（`/dashboard/trend`）

把每日 summary（總視頻/UP/播放/互動量/平均互動率/平均單支播放）按時間排序
畫 6 條 Recharts `LineChart`，加 1 條 7 桶時長分布堆疊 `AreaChart`。

API：`GET /api/dashboard/trend?window=N`（預設 30，可選 7/14/30/60/90，
超過 90 一律 cap 在 90）。不足 N 天時回 `isMock: true` 並標記 `realCount`，
UI 顯示「模擬資料」badge。

QA：`pnpm mock-n-days --days=30` 一次產 30 天假資料（idempotent）。

## UP 主跨分區（`/dashboard/ups`）

跨 N 天（預設 30）統計出現在 2+ 一級分區的 UP 主排行。視覺化採表格 +
heatmap badge（每個分區上榜次數用邊框顏色標出）。

API：`GET /api/up/overlap?window=30&minChannels=2&minCount=2&limit=50`。

## 發布到上榜延遲（`/dashboard` section）

從歷史 N 天的影片，計算 `delay = floor((crawlTime - pubdate) / 86400)`，
分 10 桶（0/1/2/3/4/5/6-7/8-14/15-30/30+ 天）。內嵌於 `/dashboard` 為
水平 bar chart，描述列顯示平均與中位數天數。

API：`GET /api/latency?window=30`。

## 全站標題分詞詞雲（`/dashboard` section）

對最新一天 1000 支影片的標題用 `Intl.Segmenter('zh', { granularity: 'word' })`
切詞，n-gram 2-3，過濾單字與 stopword，計算 top 200 詞頻。`react-d3-cloud`
渲染。

API：`GET /api/wordcloud`。

> **不引入 jieba / nodejieba**：`Intl.Segmenter` 是 Node 18+ / 瀏覽器內建，
> Vercel runtime 也支援。中文分詞品質足夠「高頻詞觀察」場景。

## 視頻長度預測（`/api/length/recommend`）

給定 `type=up|channel|tag` + `value`，從歷史 N 天（預設 30）所有
result 檔案中抓符合條件的影片，計算 7 桶時長分布，回傳：

- `primary` — 機率最高桶
- `distribution` — 7 桶 share + count
- `sampleSize` — 樣本數
- `confidence` — `low` (<30) / `mid` (30-100) / `high` (>100)

UI 兩處使用：

- **詳情頁**「同 UP 主」section 旁 — `LengthRecommendCard`（帶 confidence badge）
- **`/dashboard`** 全局視角 — `GlobalLengthPreference`（直接用 `data.duration`，
  不發 API）

QA：`pnpm mock-n-days --days=30` 後才有 30 天歷史。

## 設計原則

1. **單一資料源**：所有指標都從 `agg-latest.json`（server 端預聚合）
   或 `CrawlResult.video`（client 端 SWR 取得）衍生，**不重複計算**
2. **可重現**：所有公式都公開，可被審閱
3. **可回放**：選定日期後，所有指標應該可重新計算而結果一致
4. **最小依賴**：不引入 d3、lodash、numjs 等額外庫

## 已知缺口

- ❌ 跨日趨勢時間序列（要 30 天資料才能畫時序圖，現行為 2 天 diff）
- ❌ 視頻標題中文分詞詞雲（需要 `nodejieba` 之類）
- ❌ 跨分區 UP 主重疊分析
- ❌ 發布日 vs 上熱門日的延遲分析（"發布後 X 天上熱門"）

> 第 1 項已由 `/dashboard/compare` 覆蓋（2 天 diff 版本），時間序列為下輪 roadmap。
