# 分析指標 / Analysis

> 雙語：[繁體中文](./analysis.md) · [English](./analysis.en.md)

本文件說明 `/dashboard` 與詳情頁所有視覺化指標的**資料來源**、**計算公式**與**UI 對應位置**。

## 指標總覽

| 視圖        | 位置                  | 資料源                                                                       | 計算                                                     |
| ----------- | --------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| 總視頻數    | `/dashboard` summary  | `result/agg-latest.json::summary.totalVideos`                                | `video.length`                                           |
| 上榜 UP 數  | `/dashboard` summary  | `summary.totalUp`                                                            | `unique(UP).length`                                      |
| 總播放量    | `/dashboard` summary  | `summary.totalViews`                                                         | `Σ views`                                                |
| 互動量      | `/dashboard` summary  | `summary.totalLike + 2·totalCoin + 2·totalFavorite`                          | 加權後總和                                               |
| 分區占比    | `/dashboard` pie      | `channels[].count`                                                           | 一級分區熱門視頻數比例                                   |
| UP 主上榜榜 | `/dashboard` bar      | `topUps[0..9]`                                                               | 上榜次數降冪                                             |
| 時長分佈    | `/dashboard` bar      | `duration`                                                                   | 7 桶直方圖（<1, 1-3, 3-5, 5-10, 10-20, 20-30, >30 分鐘） |
| 發布時段    | `/dashboard` bar      | `hourHeatmap`                                                                | 24 小時發布數（UTC+8）                                   |
| 熱門標籤    | `/dashboard` badges   | `topTags[0..19]`                                                             | 標籤出現次數                                             |
| UP 主排行榜 | `/dashboard` table    | `topUps`                                                                     | 上榜數 + 總播放 + 粉絲                                   |
| 觀看次數    | 詳情頁                | `BilibiliVideoInfo.stat.view`                                                | 即時 B 站 API                                            |
| 互動 7 指標 | 詳情頁 `Analization`  | `BilibiliVideoInfo.stat.{view, danmaku, reply, favorite, coin, share, like}` | 即時 B 站 API                                            |
| 條形圖      | 詳情頁 `StackedChart` | 同上                                                                         | 7 項 bar，y 軸自適應                                     |
| 標籤雲      | 詳情頁 `WordCloud`    | 從 `/api/videoTags` 取得                                                     | 一級 300、二級 200、用戶 100 加權                        |

## 互動率（保留但未上線）

互動率公式：

```
engagement = (like + 2·coin + 2·favorite + share) / view
```

收藏與投幣加權 ×2，因為這兩個行為是**顯式 intent**（"我想回來看" 與
"我認可這作品"），權重應高於被動的 like。

> **未來**：把 `engagement` 加到 `result/agg-latest.json::summary.avgEngagement`，
> 並在 `/dashboard` 加 Top 10 互動率榜。

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

## 設計原則

1. **單一資料源**：所有指標都從 `agg-latest.json`（server 端預聚合）
   或 `CrawlResult.video`（client 端 SWR 取得）衍生，**不重複計算**
2. **可重現**：所有公式都公開，可被審閱
3. **可回放**：選定日期後，所有指標應該可重新計算而結果一致
4. **最小依賴**：不引入 d3、lodash、numjs 等額外庫

## 已知缺口

- ❌ 跨日趨勢（要 30 天資料才能畫時間序列）
- ❌ 互動率即時排行（要做 Top 10 排行需要 client 端 reduce 1000 支視頻）
- ❌ 視頻標題中文分詞詞雲（需要 `nodejieba` 之類）
- ❌ 跨分區 UP 主重疊分析
- ❌ 發布日 vs 上熱門日的延遲分析（"發布後 X 天上熱門"）

> 前 3 項已在 Roadmap，未來再實作。
