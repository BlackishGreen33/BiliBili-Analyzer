# Analysis

> Bilingual: [繁體中文](./analysis.md) · [English](./analysis.en.md)

This document describes the **data source**, **formula**, and **UI
location** of every metric on `/dashboard` and the detail page.

## Metrics overview

| View               | Location              | Source                                               | Formula                             |
| ------------------ | --------------------- | ---------------------------------------------------- | ----------------------------------- |
| Total videos       | `/dashboard` summary  | `agg-latest.json::summary.totalVideos`               | `video.length`                      |
| Total UP 主        | `/dashboard` summary  | `summary.totalUp`                                    | `unique(UP).length`                 |
| Total views        | `/dashboard` summary  | `summary.totalViews`                                 | `Σ views`                           |
| Engagement         | `/dashboard` summary  | `summary.totalLike + 2·totalCoin + 2·totalFavorite`  | weighted sum                        |
| Channel share      | `/dashboard` pie      | `channels[].count`                                   | primary channel video count         |
| UP leaderboard     | `/dashboard` bar      | `topUps[0..9]`                                       | descending by `count`               |
| Duration histogram | `/dashboard` bar      | `duration`                                           | 7-bucket histogram                  |
| Publish hour       | `/dashboard` bar      | `hourHeatmap`                                        | 24-hour publish count (UTC+8)       |
| Top tags           | `/dashboard` badges   | `topTags[0..19]`                                     | tag occurrence count                |
| UP table           | `/dashboard` table    | `topUps`                                             | count + views + followers           |
| View count         | detail                | `BilibiliVideoInfo.stat.view`                        | live Bilibili API                   |
| 7-metric grid      | detail `Analization`  | `stat.{view,danmaku,reply,favorite,coin,share,like}` | live Bilibili API                   |
| Bar chart          | detail `StackedChart` | same as above                                        | 7 bars, adaptive y                  |
| Word cloud         | detail `WordCloud`    | `/api/videoTags`                                     | first=300, second=200, ordinary=100 |

## Engagement rate (designed but not yet shipped)

```
engagement = (like + 2·coin + 2·favorite + share) / view
```

Both favorite and coin are weighted ×2 because they are **explicit
intent** ("save for later" / "I endorse this") and deserve a stronger
weight than a passive like.

> **Future**: add `engagement` to `agg-latest.json::summary.avgEngagement`,
> and add a Top-10 engagement leaderboard to `/dashboard`.

## Formulas

### 7-bucket duration

```js
const DURATION_BUCKETS = [
  { label: '<1 min', min: 0, max: 60 },
  { label: '1-3 min', min: 60, max: 180 },
  { label: '3-5 min', min: 180, max: 300 },
  { label: '5-10 min', min: 300, max: 600 },
  { label: '10-20 min', min: 600, max: 1200 },
  { label: '20-30 min', min: 1200, max: 1800 },
  { label: '>30 min', min: 1800, max: Infinity },
];
```

### 24-hour publish hour

```js
const d = new Date(v.pubdate * 1000 + 8 * 60 * 60 * 1000); // UTC+8
hourHist[d.getUTCHours()].count++;
```

> `pubdate` is Unix seconds in UTC. To bucket by **local** UTC+8
> hours, we add 8h manually. This is intentionally explicit (vs.
> relying on `process.env.TZ`) because GitHub Actions' runner TZ is
> UTC.

### Channel aggregation

```ts
const channelMap = new Map<string, ChannelAgg>();
for (const v of videos) {
  const first = v.tags.firstChannel || '未分类';
  const second = v.tags.secondChannel || '未分类';
  // accumulate primary/secondary channel count + views
}
```

`avgViews = Σ views / count`.

## Design principles

1. **Single source of truth** — every metric is derived from
   `agg-latest.json` (server pre-aggregation) or `CrawlResult.video`
   (client SWR). No double-counting.
2. **Reproducible** — all formulas are public and reviewable.
3. **Replayable** — given a date, every metric can be recomputed and
   the result is deterministic.
4. **Minimal dependencies** — no d3, lodash, or numjs. Plain
   TypeScript only.

## Known gaps

- ❌ Cross-day trend (needs ≥ 30 days to draw a time series)
- ❌ Live engagement leaderboard (client-side reduce of 1000 videos)
- ❌ Chinese word segmentation for title word cloud (needs `nodejieba`)
- ❌ Cross-channel UP overlap
- ❌ Publish-to-popular latency analysis

> The first three are on the Roadmap and will be implemented in
> future iterations.
