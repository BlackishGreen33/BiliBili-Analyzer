# 分析指标 / Analysis

> 双语：[简体中文](./analysis.md) · [English](./analysis.en.md)

本文说明 `/dashboard` 与详情页所有可视化指标的**数据来源**、**计算公式**与**UI 对应位置**。

## 指标总览

| 视图          | 位置                  | 数据源                                                                       | 计算                                                     |
| ------------- | --------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| 总视频数      | `/dashboard` summary  | `result/agg-latest.json::summary.totalVideos`                                | `video.length`                                           |
| 上榜 UP 数    | `/dashboard` summary  | `summary.totalUp`                                                            | `unique(UP).length`                                      |
| 总播放量      | `/dashboard` summary  | `summary.totalViews`                                                         | `Σ views`                                                |
| 互动量        | `/dashboard` summary  | `summary.totalLike + 2·totalCoin + 2·totalFavorite`                          | 加权后总和                                               |
| 平均互动率    | `/dashboard` summary  | `summary.avgEngagement`                                                      | `Σ(like + 2·coin + 2·favorite + share) / Σview`          |
| 分区占比      | `/dashboard` pie      | `channels[].count`                                                           | 一级分区热门视频数比例                                   |
| UP 主上榜榜   | `/dashboard` bar      | `topUps[0..9]`                                                               | 上榜次数降序                                             |
| 时长分布      | `/dashboard` bar      | `duration`                                                                   | 7 桶直方图（<1, 1-3, 3-5, 5-10, 10-20, 20-30, >30 分钟） |
| 发布时段      | `/dashboard` bar      | `hourHeatmap`                                                                | 24 小时发布数（UTC+8）                                   |
| 热门标签      | `/dashboard` badges   | `topTags[0..19]`                                                             | 标签出现次数                                             |
| UP 主排行榜   | `/dashboard` table    | `topUps`                                                                     | 上榜数 + 总播放 + 粉丝数                                 |
| 互动率 TOP 10 | `/dashboard` section  | `topEngagement[0..9]`                                                        | 互动率降序 + 播放做 tie-break                            |
| 观看次数      | 详情页                | `BilibiliVideoInfo.stat.view`                                                | 实时 B 站 API                                            |
| 互动 7 指标   | 详情页 `Analization`  | `BilibiliVideoInfo.stat.{view, danmaku, reply, favorite, coin, share, like}` | 实时 B 站 API                                            |
| 条形图        | 详情页 `StackedChart` | 同上                                                                         | 7 项 bar，y 轴自适应                                     |
| 标签云        | 详情页 `WordCloud`    | 从 `/api/videoTags` 取得                                                     | 一级 300、二级 200、用户 100 加权                        |

## 互动率

互动率公式：

```
engagement = (like + 2·coin + 2·favorite + share) / view
```

收藏与投币加权 ×2，因为这两个行为是**显式 intent**（"我想回来看" 与
"我认可这作品"），权重应高于被动的 like。

### 加权平均（summary 级）

```
avgEngagement = Σ(like + 2·coin + 2·favorite + share) / Σview
```

写入 `result/agg-latest.json::summary.avgEngagement`，由
`/api/dashboard` 暴露为第 5 张 summary 卡。

### 视频级排行（Top 10）

每支视频单独算 `engagement` 后降序（播放量做 tie-break），取前 10
写入 `topEngagement[10]`：

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
  engagement: number; // 0–N（多数 0.01–0.30）
};
```

`/dashboard` 对应 section 用水平 bar chart + table 并列；点 row 跳
`/details?bvid=...`。

## 公式

### 7 桶时长分布

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

### 24 小时发布时段

```js
const d = new Date(v.pubdate * 1000 + 8 * 60 * 60 * 1000); // UTC+8
hourHist[d.getUTCHours()].count++;
```

> 注意：因为 `pubdate` 是 UTC 秒数，而我们要的是「UTC+8 当地时间的小时数」，
> 所以要手动加 8 小时偏移。

### 分区聚合

```ts
const channelMap = new Map<string, ChannelAgg>();
for (const v of videos) {
  const first = v.tags.firstChannel || '未分类';
  const second = v.tags.secondChannel || '未分类';
  // 累计一级、二级分区的 count + views
}
```

`avgViews = Σ views / count`。

## 跨日趋势（`/dashboard/compare`）

选择两个日期的爬取结果做对比，server 端计算 diff：

| 区块         | 内容                                                            |
| ------------ | --------------------------------------------------------------- |
| 总量对比     | 5 个 metric（总视频/UP/播放/互动量/平均互动率） × 2 天 + Δ chip |
| 分区占比差异 | 一级分区 countA → countB + Δ，按 \|Δ\| 排序                     |
| UP 主榜变化  | 新增 N · 落榜 N · 持续上榜 N（按 Δ 排序）                       |
| 时长分布     | A、B 两个 BarChart 并排                                         |
| 发布时段     | A、B 两个 BarChart 并排                                         |
| 标签变化     | 新增 N · 消失 N · 共 N 持续（badge 带计数）                     |

需要至少 2 天数据；第一天上线时仅有 1 天，需等隔日 cron 触发后才能用。QA 可用 `pnpm mock-second-day` 生成假昨日数据 + `MOCK_LOCAL_FILES=1 pnpm dev` 走本机路径。

## 跨日时序（`/dashboard/trend`）

把每日 summary（总视频/UP/播放/互动量/平均互动率/平均单支播放）按时间排序
画 6 条 Recharts `LineChart`，加 1 条 7 桶时长分布堆叠 `AreaChart`。

API：`GET /api/dashboard/trend?window=N`（默认 30，可选 7/14/30/60/90，
超过 90 一律 cap 在 90）。不足 N 天时回 `isMock: true` 并标记 `realCount`，
UI 显示「模拟数据」badge。

QA：`pnpm mock-n-days --days=30` 一次产 30 天假数据（idempotent）。

## UP 主跨分区（`/dashboard/ups`）

跨 N 天（默认 30）统计出现在 2+ 一级分区的 UP 主排行。可视化采表格 +
heatmap badge（每个分区上榜次数用边框颜色标出）。

API：`GET /api/up/overlap?window=30&minChannels=2&minCount=2&limit=50`。

## 发布到上榜延迟（`/dashboard` section）

从历史 N 天的视频，计算 `delay = floor((crawlTime - pubdate) / 86400)`，
分 10 桶（0/1/2/3/4/5/6-7/8-14/15-30/30+ 天）。内嵌于 `/dashboard` 为
水平 bar chart，描述列显示平均与中位数天数。

API：`GET /api/latency?window=30`。

## 全站标题分词词云（`/dashboard` section）

对最新一天 1000 支视频的标题用 `Intl.Segmenter('zh', { granularity: 'word' })`
切词，n-gram 2-3，过滤单词与 stopword，计算 top 200 词频。`react-d3-cloud`
渲染。

API：`GET /api/wordcloud`。

> **不引入 jieba / nodejieba**：`Intl.Segmenter` 是 Node 18+ / 浏览器内建，
> Vercel runtime 也支持。中文分词品质足够「高频词观察」场景。

## 视频长度预测（`/api/length/recommend`）

给定 `type=up|channel|tag` + `value`，从历史 N 天（默认 30）所有
result 文件中抓符合条件的视频，计算 7 桶时长分布，回传：

- `primary` — 概率最高桶
- `distribution` — 7 桶 share + count
- `sampleSize` — 样本数
- `confidence` — `low` (<30) / `mid` (30-100) / `high` (>100)

UI 两处使用：

- **详情页**「同 UP 主」section 旁 — `LengthRecommendCard`（带 confidence badge）
- **`/dashboard`** 全局视角 — `GlobalLengthPreference`（直接用 `data.duration`，
  不发 API）

QA：`pnpm mock-n-days --days=30` 后才有 30 天历史。

## 设计原则

1. **单一数据源**：所有指标都从 `agg-latest.json`（server 端预聚合）
   或 `CrawlResult.video`（client 端 SWR 取得）衍生，**不重复计算**
2. **可重现**：所有公式都公开，可被审阅
3. **可回放**：选定日期后，所有指标应该可重新计算而结果一致
4. **最小依赖**：不引入 d3、lodash、numjs 等额外库

## 已知缺口

- ❌ 跨日趋势时间序列（要 30 天数据才能画时序图，现行为 2 天 diff）
- ❌ 视频标题中文分词词云（需要 `nodejieba` 之类）
- ❌ 跨分区 UP 主重叠分析
- ❌ 发布日 vs 上热门日的延迟分析（"发布后 X 天上热门"）

> 第 1 项已由 `/dashboard/compare` 覆盖（2 天 diff 版本），时间序列为下轮 roadmap。
