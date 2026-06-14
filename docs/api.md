# API 合约 / API

> 双语：[简体中文](./api.md) · [English](./api.en.md)

所有路由位于 `src/app/api/*`，执行于 Node.js Runtime（不是 Edge）。

## `GET /api/randomBvid`

从最新一天的爬取中随机取一支视频，回传 BV 号。

**Response**:

- `200` `text/plain` — BV 号字符串，例如 `BV1wEEg62EDP`
- `500` `Internal Error`

```bash
$ curl https://bilibili-analyzer.vercel.app/api/randomBvid
BV1wEEg62EDP
```

## `POST /api/videoInfo`

实时查询 B 站视频元数据（绕过缓存，调用 B 站 `/x/web-interface/view`）。

**Body**:

```json
{ "bvid": "BV1wEEg62EDP" }
```

**Response**:

- `200` `application/json` — 完整 B 站响应
- `400` `Missing bvid`
- `500` `Internal Error`

## `POST /api/videoTags`

从最新一天的爬取中查询某支视频的标签。

**Body**:

```json
{ "bvid": "BV1wEEg62EDP" }
```

**Response**:

- `200` `application/json`:
  ```ts
  { firstChannel: string, secondChannel: string, ordinaryTags: string[] }
  ```
- `400` `Missing bvid`
- `404` `Video not found` / `No crawl data available`
- `500` `Internal Error`

## `GET /api/dashboard?file=...`

回传**预聚合**分析数据（5 分钟 server-side 缓存）。

**Query**:

- `file` (optional) — 指定爬取文件名（不含 `.json`）；省略时取最新

**Response** (`200` `application/json`): 见 [data-schema.md](./data-schema.md#预聚合文件agglatestjson) 的 `DashboardAgg` 结构。`summary.avgEngagement` 与 `topEngagement[10]` 为 v0.2 之后新增的互动率字段。

## `GET /api/dashboard/compare?a=&b=`

回传**两天**聚合数据的对比结果（5 分钟 server-side 缓存，key
`compare:{a}:{b}`）。

**Query**:

- `a` (required) — 日期 A 文件名（不含 `.json`）
- `b` (required) — 日期 B 文件名（不含 `.json`）

**Response** (`200` `application/json`):

```ts
{
  a: { file: string; time: number; data: DashboardAgg };
  b: { file: string; time: number; data: DashboardAgg };
  diff: {
    newBvids: string[];            // B 有 A 没有的 BV
    droppedBvids: string[];         // A 有 B 没有的 BV
    persistentBvids: string[];      // 两天都上榜
    persistentCount: number;
    totals: { totalVideos, totalUp, totalViews, totalEngagement, avgEngagement };
    totalsDelta: { totalVideos, totalUp, totalViews, totalEngagement, avgEngagement };
    channelShift: Array<{ firstChannel, countA, countB, delta }>;
    upShift:      Array<{ name, mid?, countA, countB, delta }>;
    tagShift:     { newTags, droppedTags, commonTags };
  };
}
```

**Errors**:

- `400` — 缺 `a` 或 `b`，或两者相同
- `404` — 任一天无对应文件
- `500` `Internal Error`

## `GET /api/video?mode=&value=&file=`

回传相关视频（用于详情页「同 UP 主」「同分区」section）。

**Query**:

- `mode` (required) — `up` / `channel` / `tag`
- `value` (required) — UP 名或 mid、分区名、标签
- `file` (optional) — 默认最新

**Response** (`200` `application/json`):

```ts
{
  file: string;
  count: number;
  video: VideoData[];   // 至多全部匹配
}
```

**Errors**:

- `400` `Missing mode or value` / `Invalid mode`
- `404` `No crawl data`
- `500` `Internal Error`

## 共用

- 没有 rate limit（Vercel 免费层自然限制）
- 没有 auth（数据完全公开）
- 没有 CORS 设置（只服务自家前端）
- Response 全部 JSON 格式除了 `/api/randomBvid` 是纯文本

## `GET /api/dev/result-list`

**Dev-only**：回传本机 `result/list.json` 内容。Production 永远回
`{ "list": [] }`。给 `MOCK_LOCAL_FILES=1` + `pnpm mock-second-day`
QA 流用，`/dashboard/compare` 会用它把 mock 文件名 prepend 到 list 前面。

```bash
$ curl http://localhost:3000/api/dev/result-list
{"list":["2026-06-11T02-25-39+0800","2026-06-12T02-25-39+0800"]}
```

## 示例：取得某支视频的所有同分区视频

```bash
$ curl 'https://bilibili-analyzer.vercel.app/api/video?mode=channel&value=动画'
```

## `GET /api/dashboard/trend?window=30`

回传 N 天每日 summary 的时序数据（最多 90 天）。

**Response** (`200` `application/json`):

```ts
{
  window: number; // 实际 window（已 cap 90）
  isMock: boolean; // 真实天数 < window 时为 true
  realCount: number; // 真实天数
  points: Array<{
    file: string;
    date: string; // YYYY-MM-DD (UTC+8)
    totalVideos: number;
    totalUp: number;
    totalViews: number;
    totalEngagement: number;
    avgEngagement: number;
    avgViews: number;
    duration: Array<{ label: string; count: number }>;
  }>;
}
```

## `GET /api/up/overlap?window=30&minChannels=2&minCount=2&limit=50`

回传 N 天内出现在多个一级分区的 UP 主排行。

**Response** (`200` `application/json`):

```ts
{
  window: number;
  minChannels: number;
  minCount: number;
  totalUps: number; // 全部 UP 数
  items: Array<{
    name: string;
    mid?: number;
    channelCount: number;
    totalCount: number;
    views: number;
    channels: Array<{ firstChannel: string; count: number }>;
  }>;
}
```

## `GET /api/latency?window=30`

回传 N 天视频「发布 → 进入热门榜」的延迟直方图。

**Response** (`200` `application/json`):

```ts
{
  window: number;
  total: number; // 有 pubdate 的视频数
  avgDays: number; // 平均延迟天数
  medianDays: number; // 中位数
  buckets: Array<{
    key:
      | 'd0'
      | 'd1'
      | 'd2'
      | 'd3'
      | 'd4'
      | 'd5'
      | 'd6to7'
      | 'd8to14'
      | 'd15to30'
      | 'd30plus';
    count: number;
  }>;
}
```

## `GET /api/wordcloud`

回传最新一天 1000 支视频标题的 CJK 分词词频（top 200）。

**Response** (`200` `application/json`):

```ts
{
  file: string;
  tokens: Array<{ word: string; count: number }>;
}
```

## `GET /api/length/recommend?type=&value=&window=30`

视频长度预测（最佳发布时长建议）。

**Query**:

- `type` (required) — `up` / `channel` / `tag`
- `value` (required) — UP 名或 mid / 分区名 / 标签
- `window` (optional, 默认 30，最大 90)

**Response** (`200` `application/json`):

```ts
{
  scope: { type: 'up' | 'channel' | 'tag'; value: string };
  window: number;
  primary: { label: string; share: number; count: number } | null;
  distribution: Array<{ label: string; share: number; count: number }>;
  sampleSize: number;
  confidence: 'low' | 'mid' | 'high';  // <30 / 30-100 / >100
}
```

**Errors**:

- `400` — 缺 `type` / `value`，或 `type` 非法

## 分享筛选（深链接）

`/` 检索页的筛选条件会同步到 URL 的 query string，任何时候按下筛选卡
header 的「分享筛选」按钮即可复制当前 URL；他人打开后还原完全相同的
状态。

| Param  | 类型   | 示例                             | 说明                               |
| ------ | ------ | -------------------------------- | ---------------------------------- |
| `q`    | string | `?q=赛博`                        | 搜索关键字                         |
| `c`    | string | `?c=动画-动画综合,游戏-单机游戏` | 1+ 个分区；`,` 分隔，`-` 接一/二级 |
| `tag`  | string | `?tag=原神`                      | 当前高亮标签                       |
| `date` | string | `?date=2026-06-11`               | 选中的爬取日期文件名               |

完整示例：

```
https://bilibili-analyzer.vercel.app/?q=原神&c=游戏-单机游戏&tag=原神&date=2026-06-11
```

`router.replace` 不会污染历史记录；reload 后 state 从 `useSearchParams()`
重新读取，与初始访问体验一致。

## 版本控制

API 路径没有 `/v1/`，因为目前还在 0.x 阶段。当第一个 1.0 释出时，所有
breaking change 会发布到 `/api/v2/...`，旧的至少保留 6 个月。
