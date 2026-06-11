# Architecture

> Bilingual: [繁體中文](./architecture.md) · [English](./architecture.en.md)

## System overview

BiliBili-Analyzer is a **frontend-only + pre-rendered static** Next.js
application. All data is fetched from a GitHub `result` orphan branch via
`raw.githubusercontent.com`. There is no backend database.

```
┌────────────┐   ┌──────────────┐   ┌────────────┐
│   User     │   │   Next.js    │   │  Bilibili  │
│  Browser   │   │  App Router  │   │  API       │
│            │   │  (Vercel)    │   │  (crawler) │
└─────┬──────┘   └──────┬───────┘   └─────┬──────┘
      │                 │                 │
      │ HTTPS           │  cron trigger   │
      │ ───────────────▶│◀────────────────│
      │                 │                 │
      │   SSR/CSR       │  write result/  │
      │                 │ ───────▶        │
      │                 │   git push      │
      │                 │ ───────▶        │
      │                 ▼                 │
      │        GitHub:result branch       │
      │                 │                 │
      │   fetch json    │                 │
      │ ◀──────────────│                 │
      │                 │                 │
      │   render UI     │                 │
      │                 │                 │
      ▼                 ▼                 ▼
```

## Module layout

| Module                     | Responsibility                                      |
| -------------------------- | --------------------------------------------------- |
| `src/app/`                 | Next.js App Router (pages, API, loading, error)     |
| `src/common/components/`   | UI shell: sidebar, navbar, shadcn primitives        |
| `src/common/hooks/`        | Zustand stores (theme / layout / ui)                |
| `src/common/libs/`         | Data fetching layer (client hooks + server fetcher) |
| `src/common/providers/`    | Global Providers (next-themes only)                 |
| `src/common/styles/`       | `globals.css` (Tailwind v4 + custom CSS variables)  |
| `src/common/types/`        | TypeScript types + Zod schema                       |
| `src/common/utils/`        | Shared utilities (`cn`, `format`, `extractBvid`)    |
| `src/modules/Search/`      | Home (hero + filter + virtualized grid)             |
| `src/modules/Detail/`      | Detail page (player + analysis + related)           |
| `src/app/dashboard/`       | Aggregation analytics page                          |
| `CrawlPopular.cjs`         | Daily 12:00 UTC+8 Node.js crawler                   |
| `scripts/build-mobile.mjs` | Capacitor mobile build orchestration                |

## Routes

| Path                            | Type           | Content                             |
| ------------------------------- | -------------- | ----------------------------------- |
| `/`                             | static         | Popular video search + grid         |
| `/dashboard`                    | static         | Aggregation analytics               |
| `/details?bvid=...`             | dynamic        | Video detail                        |
| `/api/randomBvid`               | dynamic (GET)  | Random BV id                        |
| `/api/videoInfo`                | dynamic (POST) | Video metadata (live Bilibili)      |
| `/api/videoTags`                | dynamic (POST) | Video tags (from latest crawl)      |
| `/api/dashboard`                | dynamic (GET)  | Pre-aggregated analytics            |
| `/api/video?mode=...&value=...` | dynamic (GET)  | Related videos (up / channel / tag) |
| `/_not-found`                   | static         | 404 page                            |

## Data fetching layer

### Client (`src/common/libs/result-data.ts`)

SWR-powered hooks:

- `useResultList()` — list of all crawl filenames (60s dedup)
- `useResultByName(filename)` — one crawl file
- `useLatestCrawl(filename)` — alias for `useResultByName`
- `useRandomBvid()` — random BV id

All SWR responses are validated against a Zod schema. If validation
fails, the hook logs the error and falls back to the raw JSON so the
UI doesn't completely break.

### Server (`src/common/libs/result-data.server.ts`)

Marked with `'server-only'` to prevent accidental use in client bundles.
Provides:

- `fetchResultList()` — 60s in-memory cache + single-flight
- `fetchResultByName(filename)` — per-filename single-flight Map

Used by the 5 server-side API routes.

## State management

Zustand split into 3 independent stores to avoid global re-render from
a single mega-store:

| Store            | Persistence                | Purpose                            |
| ---------------- | -------------------------- | ---------------------------------- |
| `useThemeStore`  | `localStorage` (colorMode) | Accent color, theme settings panel |
| `useLayoutStore` | none                       | Window size, sidebar open/close    |
| `useUiStore`     | none                       | Download panel open/close          |

## Rendering strategy

- **/、/dashboard** — static pre-rendered (SSG); all data fetched client-side
- **/details?bvid=...** — client component wrapped in `<Suspense>` to avoid `useSearchParams()` SSR errors
- **/api/\*** — dynamic server functions (Node.js runtime)

## Design decisions

### Why not IndexedDB / localStorage for caching?

- Data only updates once a day; the CDN + GitHub raw is already the
  fastest source.
- SWR's `dedupingInterval: 60s` is sufficient.
- IndexedDB would add complexity for marginal gain.

### Why a `'server-only'` fetcher?

- `next/dynamic` and RSC are sensitive about module boundaries.
- Forcing a clean client/server split prevents accidental
  serialization of cache variables.

### Why not SWR's built-in Suspense streaming mode?

- Our data comes from a single remote JSON; no streaming benefit.
- The `isLoading` pattern is more direct for our form + list UX.

## Known limitations

- After 12:00 UTC+8, if GitHub Actions fails, the frontend will keep
  showing yesterday's data.
- The detail page calls Bilibili's live API; a network failure shows an
  empty state with a retry CTA (skeleton is already in place).
- Mobile build requires a Capacitor environment; it is not part of the
  web deploy flow.
