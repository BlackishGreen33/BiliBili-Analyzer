# API 合約 / API

> 雙語：[繁體中文](./api.md) · [English](./api.en.md)

所有路由位於 `src/app/api/*`，執行於 Node.js Runtime（不是 Edge）。

## `GET /api/randomBvid`

從最新一天的爬取中隨機取一支視頻，回傳 BV 號。

**Response**:

- `200` `text/plain` — BV 號字串，例如 `BV1wEEg62EDP`
- `500` `Internal Error`

```bash
$ curl https://bilibili-analyzer.vercel.app/api/randomBvid
BV1wEEg62EDP
```

## `POST /api/videoInfo`

即時查詢 B 站視頻元資料（繞過快取，呼叫 B 站 `/x/web-interface/view`）。

**Body**:

```json
{ "bvid": "BV1wEEg62EDP" }
```

**Response**:

- `200` `application/json` — 完整 B 站回應
- `400` `Missing bvid`
- `500` `Internal Error`

## `POST /api/videoTags`

從最新一天的爬取中查詢某支視頻的標籤。

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

回傳**預聚合**分析資料（5 分鐘 server-side 快取）。

**Query**:

- `file` (optional) — 指定爬取檔名（不含 `.json`）；省略時取最新

**Response** (`200` `application/json`): 見 [data-schema.md](./data-schema.md#預聚合檔agglatestjson) 的 `DashboardAgg` 結構。`summary.avgEngagement` 與 `topEngagement[10]` 為 v0.2 之後新增的互動率欄位。

## `GET /api/dashboard/compare?a=&b=`

回傳**兩天**聚合資料的對比結果（5 分鐘 server-side 快取，key
`compare:{a}:{b}`）。

**Query**:

- `a` (required) — 日期 A 檔名（不含 `.json`）
- `b` (required) — 日期 B 檔名（不含 `.json`）

**Response** (`200` `application/json`):

```ts
{
  a: { file: string; time: number; data: DashboardAgg };
  b: { file: string; time: number; data: DashboardAgg };
  diff: {
    newBvids: string[];            // B 有 A 沒有的 BV
    droppedBvids: string[];         // A 有 B 沒有的 BV
    persistentBvids: string[];      // 兩天都上榜
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

- `400` — 缺 `a` 或 `b`，或兩者相同
- `404` — 任一天無對應檔案
- `500` `Internal Error`

## `GET /api/video?mode=&value=&file=`

回傳相關視頻（用於詳情頁「同 UP 主」「同分區」section）。

**Query**:

- `mode` (required) — `up` / `channel` / `tag`
- `value` (required) — UP 名或 mid、分區名、標籤
- `file` (optional) — 預設最新

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

- 沒有 rate limit（Vercel 免費層自然限制）
- 沒有 auth（資料完全公開）
- 沒有 CORS 設定（只服務自家前端）
- Response 全部 JSON 格式除了 `/api/randomBvid` 是純文字

## `GET /api/dev/result-list`

**Dev-only**：回傳本機 `result/list.json` 內容。Production 永遠回
`{ "list": [] }`。給 `MOCK_LOCAL_FILES=1` + `pnpm mock-second-day`
QA 流用，`/dashboard/compare` 會用它把 mock 檔名 prepend 到 list 前面。

```bash
$ curl http://localhost:3000/api/dev/result-list
{"list":["2026-06-11T02-25-39+0800","2026-06-12T02-25-39+0800"]}
```

## 範例：取得某支視頻的所有同分區視頻

```bash
$ curl 'https://bilibili-analyzer.vercel.app/api/video?mode=channel&value=动画'
```

## `GET /api/dashboard/trend?window=30`

回傳 N 天每日 summary 的時序資料（最多 90 天）。

**Response** (`200` `application/json`):

```ts
{
  window: number; // 實際 window（已 cap 90）
  isMock: boolean; // 真實天數 < window 時為 true
  realCount: number; // 真實天數
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

回傳 N 天內出現在多個一級分區的 UP 主排行。

**Response** (`200` `application/json`):

```ts
{
  window: number;
  minChannels: number;
  minCount: number;
  totalUps: number; // 全部 UP 數
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

回傳 N 天影片「發布 → 進入熱門榜」的延遲直方圖。

**Response** (`200` `application/json`):

```ts
{
  window: number;
  total: number; // 有 pubdate 的影片數
  avgDays: number; // 平均延遲天數
  medianDays: number; // 中位數
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

回傳最新一天 1000 支影片標題的 CJK 分詞詞頻（top 200）。

**Response** (`200` `application/json`):

```ts
{
  file: string;
  tokens: Array<{ word: string; count: number }>;
}
```

## `GET /api/length/recommend?type=&value=&window=30`

視頻長度預測（最佳發布時長建議）。

**Query**:

- `type` (required) — `up` / `channel` / `tag`
- `value` (required) — UP 名或 mid / 分區名 / 標籤
- `window` (optional, 預設 30，最大 90)

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

## 分享篩選（深連結）

`/` 檢索頁的篩選條件會同步到 URL 的 query string，任何時候按下篩選卡
header 的「分享篩選」按鈕即可複製當前 URL；他人打開後還原完全相同的
狀態。

| Param  | 型別   | 範例                             | 說明                               |
| ------ | ------ | -------------------------------- | ---------------------------------- |
| `q`    | string | `?q=赛博`                        | 搜索關鍵字                         |
| `c`    | string | `?c=动画-动画综合,游戏-单机游戏` | 1+ 個分區；`,` 分隔，`-` 接一/二級 |
| `tag`  | string | `?tag=原神`                      | 當前高亮標籤                       |
| `date` | string | `?date=2026-06-11`               | 選中的爬取日期檔名                 |

完整範例：

```
https://bilibili-analyzer.vercel.app/?q=原神&c=游戏-单机游戏&tag=原神&date=2026-06-11
```

`router.replace` 不會污染歷史紀錄；reload 後 state 從 `useSearchParams()`
重新讀取，與初始訪問體驗一致。

## 版本控制

API 路徑沒有 `/v1/`，因為目前還在 0.x 階段。當第一個 1.0 釋出時，所有
breaking change 會發布到 `/api/v2/...`，舊的至少保留 6 個月。
