# Crawler

> Bilingual: [繁體中文](./crawler.md) · [English](./crawler.en.md)

## Trigger

`.github/workflows/crawl.yml`:

```yaml
on:
  schedule:
    - cron: '0 4 * * *' # 12:00 UTC+8
  push:
    branches: [main]
  workflow_dispatch: # manual trigger
```

## Flow

```
Step 1: Fetch popular list
  POPULAR_API = 'https://api.bilibili.com/x/web-interface/popular?ps=20&pn={n}'
  Up to 50 pages (~1000 videos)
  20 per page; stop early when a page is < 20

Step 2: Concurrent fetch tags for each video
  TAGS_API = 'https://api.bilibili.com/x/tag/archive/tags?bvid={bvid}'
  Concurrency TAG_CONCURRENCY = 8

Step 3: Dedupe UP 主; concurrent fetch followers / signature / verification
  UP_FOLLOWERS_API = 'https://api.bilibili.com/x/relation/stat?vmid={mid}'
  UP_INFO_API = 'https://api.bilibili.com/x/space/wbi/acc/info?mid={mid}'
  Concurrency UP_CONCURRENCY = 6
  1000 videos typically dedupe to ~700 UPs (~30-50s)

Step 4: Compute 7 aggregation dimensions
  summary / channels / topUps / duration / hourHeatmap / topTags
  Write result/agg-latest.json

Step 5: Write result/{ISO-timestamp}.json and update list.json
  Then git push to the result orphan branch
```

## Retry strategy

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

- Tag fetch failure: silently degrades to an empty array (other videos
  are unaffected).
- UP 元資料 failure: silently degrades to `followers: null` (the
  aggregation still works).

## Output structure

```
result/
├── 2026-06-10T16-30-52+0800.json     # today
├── 2026-06-09T16-30-45+0800.json
├── ...
├── list.json                          # sorted filenames (newest first)
└── agg-latest.json                    # pre-aggregated (always = latest day)
```

`list.json` is append-only — there is no cleanup. A future
`result:cleanup` workflow could retain only the last 30 days.

## Limitations

- B 站 popular list returns ~1000 videos per day.
- The UP 主 API rate-limits anonymous IPs to ~60 req/min; 6-way
  concurrency should be safe.
- On failure, the whole cron job fails, so that day's data is missing.
  Mitigation: the next day's cron catches up. Future: per-video
  `try/catch` isolation.

## Local run

```bash
pnpm run crawldata
```

Writes to `result/` in your working tree; commit and push manually.
