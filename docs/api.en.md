# API

> Bilingual: [繁體中文](./api.md) · [English](./api.en.md)

All routes live under `src/app/api/*` and run on the **Node.js
runtime** (not Edge).

## `GET /api/randomBvid`

Pick a random video from the latest crawl and return its BV id.

**Response**:

- `200` `text/plain` — BV id, e.g. `BV1wEEg62EDP`
- `500` `Internal Error`

```bash
$ curl https://bilibili-analyzer.vercel.app/api/randomBvid
BV1wEEg62EDP
```

## `POST /api/videoInfo`

Live-fetch Bilibili video metadata (no caching; calls B 站 `/x/web-interface/view`).

**Body**:

```json
{ "bvid": "BV1wEEg62EDP" }
```

**Response**:

- `200` `application/json` — full Bilibili response
- `400` `Missing bvid`
- `500` `Internal Error`

## `POST /api/videoTags`

Look up a video's tags from the latest crawl.

**Body**:

```json
{ "bvid": "BV1wEEg62EDP" }
```

**Response**:

- `200` `application/json`:
  ```ts
  { firstChannel: string; secondChannel: string; ordinaryTags: string[] }
  ```
- `400` `Missing bvid`
- `404` `Video not found` / `No crawl data available`
- `500` `Internal Error`

## `GET /api/dashboard?file=...`

Return pre-aggregated analytics data (5-min server-side cache).

**Query**:

- `file` (optional) — crawl filename (without `.json`); defaults to the latest

**Response** (`200` `application/json`): see [data-schema.md](./data-schema.en.md#aggregation-file-agg-latestjson)

## `GET /api/video?mode=&value=&file=`

Return related videos (for the detail page's "same UP / same channel" sections).

**Query**:

- `mode` (required) — `up` / `channel` / `tag`
- `value` (required) — UP name or mid, channel name, or tag
- `file` (optional) — defaults to the latest

**Response** (`200` `application/json`):

```ts
{
  file: string;
  count: number;
  video: VideoData[];
}
```

**Errors**:

- `400` `Missing mode or value` / `Invalid mode`
- `404` `No crawl data`
- `500` `Internal Error`

## Common

- No rate limiting (relies on Vercel's free-tier limits).
- No auth (data is fully public).
- No CORS configured (only serves our own frontend).
- All responses are JSON except `/api/randomBvid` (plain text).

## Example: get all videos in the same channel

```bash
$ curl 'https://bilibili-analyzer.vercel.app/api/video?mode=channel&value=动画'
```

## Versioning

No `/v1/` prefix yet — we're in 0.x. The first 1.0 release will pin
all breaking changes to `/api/v2/...` and keep the old routes for at
least 6 months.
