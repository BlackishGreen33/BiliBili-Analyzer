# 架構文檔 / Architecture

> 雙語：[繁體中文](./architecture.md) · [English](./architecture.en.md)

## 系統概覽

BiliBili-Analyzer 是一個**純前端 + 預渲染靜態**的 Next.js 應用，所有資料
從 GitHub `result` orphan 分支的 `raw.githubusercontent.com` 拉取，
不需要後端資料庫。

```
┌────────────┐   ┌──────────────┐   ┌────────────┐
│  使用者     │   │  Next.js     │   │  B 站 API   │
│  Browser   │   │  App Router  │   │  (爬蟲)     │
│            │   │  (Vercel)    │   │            │
└─────┬──────┘   └──────┬───────┘   └─────┬──────┘
      │                 │                 │
      │ HTTPS           │ 抓取（CI 觸發）   │
      │ ───────────────▶│◀────────────────│
      │                 │                 │
      │   SSR/CSR       │  寫入 result/   │
      │                 │ ───────▶        │
      │                 │   git push      │
      │                 │ ───────▶        │
      │                 ▼                 │
      │        GitHub:result 分支         │
      │                 │                 │
      │   fetch json    │                 │
      │ ◀──────────────│                 │
      │                 │                 │
      │   渲染 UI       │                 │
      │                 │                 │
      ▼                 ▼                 ▼
```

## 模組劃分

| 模組                       | 職責                                                 |
| -------------------------- | ---------------------------------------------------- |
| `src/app/`                 | Next.js App Router 路由（頁面、API、loading、error） |
| `src/common/components/`   | UI shell：sidebar、navbar、shadcn primitives         |
| `src/common/hooks/`        | Zustand stores（theme / layout / ui）                |
| `src/common/libs/`         | 資料獲取層（client hooks + server fetcher）          |
| `src/common/providers/`    | 全域 Provider（目前只有 next-themes）                |
| `src/common/styles/`       | `globals.css`（Tailwind v4 + 自訂 CSS 變量）         |
| `src/common/types/`        | TypeScript 類型 + Zod schema                         |
| `src/common/utils/`        | 共用工具（`cn`、`format`、`extractBvid`）            |
| `src/modules/Search/`      | 首頁（hero + 篩選 + 虛擬化網格）                     |
| `src/modules/Detail/`      | 詳情頁（player + 分析 + 同分區推薦）                 |
| `src/app/dashboard/`       | 聚合分析頁                                           |
| `CrawlPopular.cjs`         | 每日 12:00 UTC+8 觸發的 Node 爬蟲                    |
| `scripts/build-mobile.mjs` | Capacitor 移動端構建工具                             |

## 路由

| 路徑                            | 類型              | 內容                        |
| ------------------------------- | ----------------- | --------------------------- |
| `/`                             | 靜態 (/)          | 熱門視頻檢索 + 列表         |
| `/dashboard`                    | 靜態 (/dashboard) | 聚合分析                    |
| `/details?bvid=...`             | 動態              | 視頻詳情                    |
| `/api/randomBvid`               | 動態 (GET)        | 隨機 BV 號                  |
| `/api/videoInfo`                | 動態 (POST)       | 視頻元資料（B 站即時）      |
| `/api/videoTags`                | 動態 (POST)       | 視頻標籤（從最新爬取）      |
| `/api/dashboard`                | 動態 (GET)        | 預聚合分析資料              |
| `/api/video?mode=...&value=...` | 動態 (GET)        | 同 UP / 同分區 / 同標籤視頻 |
| `/_not-found`                   | 靜態              | 404 頁                      |

## 資料獲取層

### Client（`src/common/libs/result-data.ts`）

使用 **SWR** hooks：

- `useResultList()` — 取得所有爬取檔名清單（60s 內 dedup）
- `useResultByName(filename)` — 取得單一爬取檔
- `useLatestCrawl(filename)` — 別名，等同 `useResultByName`
- `useRandomBvid()` — 隨機 BV 號

所有 SWR response 自動通過 Zod schema 驗證；驗證失敗時降級為原始資料
（log 錯誤但仍 render）。

### Server（`src/common/libs/result-data.server.ts`）

使用 `'server-only'` 標記避免被誤用於 client bundle。提供：

- `fetchResultList()` — 60s 內 in-memory cache + single-flight
- `fetchResultByName(filename)` — per-filename single-flight Map

被 `src/app/api/*` 內部使用。

## 狀態管理

Zustand 拆分為 3 個獨立 store，避免單一 mega-store 帶來的全域 re-render：

| Store            | 持久化                      | 用途                   |
| ---------------- | --------------------------- | ---------------------- |
| `useThemeStore`  | `localStorage`（colorMode） | 主題顏色、設定面板開關 |
| `useLayoutStore` | 無                          | 視窗尺寸、側邊欄開關   |
| `useUiStore`     | 無                          | 下載面板開關           |

## 渲染策略

- **/、/dashboard** — 靜態預渲染（SSG），所有資料在 client 端用 SWR 拉取
- **/details?bvid=...** — Client component，由 `Suspense` 包住避免 `useSearchParams()` 報錯
- **/api/\*** — Dynamic Server Functions（Node.js runtime）

## 設計決策

### 為什麼不用 IndexedDB / localStorage 存快取？

- 資料每天才更新一次，CDN + GitHub raw 已是最快來源
- SWR 的 `dedupingInterval` 60s 已足夠
- 引入 IndexedDB 增加複雜度但收益有限

### 為什麼用 server-only 的 fetcher？

- `next/dynamic` 與 RSC 對邊界敏感
- 強制區分 client/server fetch 邏輯，避免快取變數意外序列化

### 為什麼不用 SWR 內建 React Suspense 模式？

- 我們的資料來自遠端 JSON 檔，不需要 streaming
- `isLoading` 模式對小型表單 + 列表的 UX 更直接

## 已知限制

- 每日 12:00 UTC+8 之後若 GitHub Actions 失敗，前端會持續讀到昨日資料
- 詳情頁的 `videoInfo` 走 B 站即時 API，網路失敗時會顯示空狀態（已有 skeleton）
- 移動端構建需要 Capacitor 環境；不在 web 部署流程中
