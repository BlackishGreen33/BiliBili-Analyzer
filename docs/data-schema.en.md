# Data Schema

> Bilingual: [繁體中文](./data-schema.md) · [English](./data-schema.en.md)

## Storage

- **Format**: JSON (UTF-8)
- **Location**: GitHub `BlackishGreen33/BiliBili-Analyzer` `result` orphan branch
- **URL**: `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/{filename}.json`
- **List**: `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/list.json`
- **Aggregation**: `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/agg-latest.json`

## `list.json`

```ts
type ListFile = string[]; // newest first, e.g. ["2026-06-10T16-30-52+0800", ...]
```

## Per-day crawl file (`{ISO-timestamp}.json`)

```ts
type CrawlResult = {
  /** Crawl time, Unix ms (UTC+8) */
  time: number;
  video: VideoData[];
};

type VideoData = {
  /** Bilibili video id (`BV...`) */
  bvid: string;
  /** Full URL */
  url: string;
  /** Cover (hdslb 412x232 webp) */
  cover: string;
  title: string;
  /** UP 主 nickname */
  UP: string;
  /** UP 主 mid (optional) */
  mid?: number;
  /** View count (raw number) */
  views: number;
  /** Duration in seconds */
  duration?: number;
  /** Publish time, Unix seconds */
  pubdate?: number;
  tags: {
    /** Primary channel, e.g. "动画" */
    firstChannel: string;
    /** Secondary channel, e.g. "MAD·AMV" */
    secondChannel: string;
    /** User tags (from `/x/tag/archive/tags`) */
    ordinaryTags: string[];
  };
  /** Dimensions, only when present in the source API */
  dimension?: { width: number; height: number; rotate: number };
  /** Number of pages, only when present */
  pages?: number;
  /** Video description */
  desc?: string;
  /** Type ID (tid) */
  tid?: number;
  /** Type ID v2 */
  tid_v2?: number;
  /** Short link */
  shortLink?: string;
  /** Honor badges ("全站日榜最高第 X 名", etc.) */
  honors?: string[];
  rights?: {
    isCooperation: boolean;
    isSteinGate: boolean;
    is360: boolean;
  };
  /** Publish IP location, when available */
  pubLocation?: string;
  /** UP 主 metadata, from the second crawler pass */
  upMeta?: {
    mid: number;
    /** Follower count, `null` if the API did not return */
    followers: number | null;
    /** UP 主 signature */
    sign?: string;
    /** Level */
    level?: number;
    /** Verification type (-1 = none, 0 = personal, 1/2 = org) */
    official?: number;
  };
};
```

> **Important**: `views`, `duration`, `pubdate` are all **numbers**
> (the old version was a formatted string like "119.6 万"). The
> frontend applies `formatViews`, `formatDuration` etc. for display.

## Aggregation file (`agg-latest.json`)

Computed by `CrawlPopular.cjs` right after the crawl completes. The
`/api/dashboard` route caches it for 5 minutes.

```ts
type DashboardAgg = {
  /** Corresponding crawl filename (without `.json`) */
  file: string;
  /** Same as `CrawlResult.time` */
  time: number;
  summary: {
    totalVideos: number;
    totalUp: number;
    totalViews: number;
    totalLike: number;
    totalCoin: number;
    totalFavorite: number;
    totalReply: number;
    totalDanmaku: number;
  };
  channels: Array<{
    firstChannel: string;
    count: number;
    views: number;
    avgViews: number;
    like: number;
    coin: number;
    favorite: number;
    secondChannels: Array<{
      secondChannel: string;
      count: number;
      views: number;
    }>;
  }>;
  topUps: Array<{
    name: string;
    mid?: number;
    count: number;
    views: number;
    /** From the second crawler pass */
    followers?: number | null;
  }>;
  duration: Array<{
    label: string;
    min: number;
    max: number; // Infinity for the open-ended bucket
    count: number;
  }>;
  hourHeatmap: Array<{
    hour: number; // 0-23, UTC+8
    count: number;
  }>;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
};
```

## Zod schema

All client-side fetches validate against `CrawlResultSchema`
(`src/common/types/schema.ts`). If the crawler ever changes a field,
the client logs a `ZodError` in the console but still renders (with
raw JSON as fallback) so the UI never goes 100% dark.

## Changelog

- **v0.10** (2026-06-15):
  - README rewritten to Conventional OSS style (zh-CN + en dual-file, 11 sections, -89 lines total)
  - 3 screenshot hero (home / dashboard / detail)
  - Split LengthRecommendCard into 4 sub-components
  - Added 5 api-routes integration tests (latency 78→93 / up-overlap 72→100 / wordcloud 83→100 branches)
  - Playwright e2e scaffold + 13 smoke tests (4 page + 9 API route)
  - branches coverage 90.72 → 92.04
- **v0.9** (2026-06-14):
  - `formatDateTime` / `formatDate` explicitly set `timeZone: 'Asia/Shanghai'`,
    fixing CI failure on ubuntu-latest (UTC) environment
  - Extracted pure functions from 6 routes into `src/common/libs/routes/`
    (7 new helper files, each < 100 lines). Routes went from 140-220 lines
    to < 100 lines. 4 places of `parseInt ?? DEFAULT` chain unified to
    `parseWindowParam`.
  - 7 new RTL test files for the new pure helpers. `branches` coverage
    87 → 90.
- **v0.8** (2026-06-14):
  - Schema unchanged. Codebase: `dashboard-data.ts` split into 6
    single-responsibility hook files. Each hook now has its own
    RTL test. 304 tests, coverage 93/87/94/93.
- **v0.7** (2026-06-14):
  - Schema unchanged. Codebase: NDJSON streaming (`?stream=1`) added to
    `/api/latency` and `/api/dashboard/trend`; client hooks
    `useLatencyStream` / `useDashboardTrendStream` for progressive
    rendering. 277 tests, coverage 92/86/93/92.
- **v0.6** (2026-06-13):
  - Schema unchanged. Codebase: 5 commits, 224 tests. NDJSON streaming
    server-side, length prediction v2 (median + IQR), 5 missing en
    i18n keys added.
- **v0.2** (2026-06-11):
  - `views` is now `number` (was `string`)
  - Added `bvid`, `mid`, `duration`, `pubdate`, `dimension`, `pages`,
    `desc`, `tid`, `tid_v2`, `tnamev2`, `shortLink`, `honors`,
    `rights`, `pubLocation`, `upMeta`
  - Added `agg-latest.json` pre-aggregated file
- **v0.1** (2024): initial version with only `url/cover/title/UP/views/tags`
