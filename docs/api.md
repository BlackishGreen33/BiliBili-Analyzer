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

**Response** (`200` `application/json`): 見 [data-schema.md](./data-schema.md#預聚合檔agglatestjson) 的 `DashboardAgg` 結構

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

## 範例：取得某支視頻的所有同分區視頻

```bash
$ curl 'https://bilibili-analyzer.vercel.app/api/video?mode=channel&value=动画'
```

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
