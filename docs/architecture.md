# 架构文档 / Architecture

> 双语：[简体中文](./architecture.md) · [English](./architecture.en.md)

## 系统概览

BiliBili-Analyzer 是一个**纯前端 + 预渲染静态**的 Next.js 应用，所有数据
从 GitHub `result` orphan 分支的 `raw.githubusercontent.com` 拉取，
不需要后端数据库。

```
┌────────────┐   ┌──────────────┐   ┌────────────┐
│  使用者     │   │  Next.js     │   │  B 站 API   │
│  Browser   │   │  App Router  │   │  (爬虫)     │
│            │   │  (Vercel)    │   │            │
└─────┬──────┘   └──────┬───────┘   └─────┬──────┘
      │                 │                 │
      │ HTTPS           │ 抓取（CI 触发）  │
      │ ───────────────▶│◀────────────────│
      │                 │                 │
      │   SSR/CSR       │  写入 result/   │
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

## 模块划分

| 模块                       | 职责                                                 |
| -------------------------- | ---------------------------------------------------- |
| `src/app/`                 | Next.js App Router 路由（页面、API、loading、error） |
| `src/common/components/`   | UI shell：sidebar、navbar、shadcn primitives         |
| `src/common/hooks/`        | Zustand stores（theme / layout / ui）                |
| `src/common/libs/`         | 数据获取层（client hooks + server fetcher）          |
| `src/common/providers/`    | 全局 Provider（目前只有 next-themes）                |
| `src/common/styles/`       | `globals.css`（Tailwind v4 + 自定义 CSS 变量）       |
| `src/common/types/`        | TypeScript 类型 + Zod schema                         |
| `src/common/utils/`        | 公共工具（`cn`、`format`、`extractBvid`）            |
| `src/modules/Search/`      | 首页（hero + 筛选 + 虚拟化网格）                     |
| `src/modules/Detail/`      | 详情页（player + 分析 + 同分区推荐）                 |
| `src/app/dashboard/`       | 聚合分析页                                           |
| `CrawlPopular.cjs`         | 每日 12:00 UTC+8 触发的 Node 爬虫                    |
| `scripts/build-mobile.mjs` | Capacitor 移动端构建工具                             |

## 路由

| 路径                                 | 类型              | 内容                             |
| ------------------------------------ | ----------------- | -------------------------------- |
| `/`                                  | 静态 (/)          | 热门视频检索 + 列表              |
| `/dashboard`                         | 静态 (/dashboard) | 聚合分析（单日）                 |
| `/dashboard/trend?window=30`         | 静态              | 跨日时序图（Recharts LineChart） |
| `/dashboard/ups?window=30`           | 静态              | UP 主跨分区排行                  |
| `/dashboard/compare?a=&b=`           | 静态              | 跨日趋势比较（2 天 diff）        |
| `/details?bvid=...`                  | 动态              | 视频详情（含长度预测）           |
| `/api/randomBvid`                    | 动态 (GET)        | 随机 BV 号                       |
| `/api/videoInfo`                     | 动态 (POST)       | 视频元数据（B 站实时）           |
| `/api/videoTags`                     | 动态 (POST)       | 视频标签（从最新爬取）           |
| `/api/dashboard?file=...`            | 动态 (GET)        | 预聚合分析数据（单日）           |
| `/api/dashboard/compare?a=&b=`       | 动态 (GET)        | 两天预聚合 + diff                |
| `/api/dashboard/trend?window=30`     | 动态 (GET)        | N 天时序数据                     |
| `/api/up/overlap?window=30`          | 动态 (GET)        | UP 主跨分区排行                  |
| `/api/latency?window=30`             | 动态 (GET)        | 发布到上榜延迟直方图             |
| `/api/wordcloud`                     | 动态 (GET)        | CJK 标题分词词云                 |
| `/api/length/recommend?type=&value=` | 动态 (GET)        | 视频长度预测                     |
| `/api/video?mode=&value=&file=`      | 动态 (GET)        | 同 UP / 同分区 / 同标签视频      |
| `/api/dev/result-list`               | 动态 (GET, dev)   | 本机 `result/list.json`          |
| `/_not-found`                        | 静态              | 404 页                           |

## 数据获取层

### Client（`src/common/libs/result-data.ts`）

使用 **SWR** hooks：

- `useResultList()` — 取得所有爬取文件名清单（60s 内 dedup）
- `useResultByName(filename)` — 取得单一爬取文件
- `useLatestCrawl(filename)` — 别名，等同 `useResultByName`
- `useRandomBvid()` — 随机 BV 号

所有 SWR response 自动通过 Zod schema 验证；验证失败时降级为原始数据
（log 错误但仍 render）。

### Server（`src/common/libs/result-data.server.ts`）

使用 `'server-only'` 标记避免被误用于 client bundle。提供：

- `fetchResultList()` — 60s 内 in-memory cache + single-flight
- `fetchResultByName(filename)` — per-filename single-flight Map
- `buildAggregations(videos)` — 公共聚合 helper（`/api/dashboard` 与 `/api/dashboard/compare` 都用它）

被 `src/app/api/*` 内部使用。

**Dev-only escape hatch**：当 `MOCK_LOCAL_FILES=1` 时（且
`NODE_ENV !== 'production'`），会从本机 `result/` 读数据，给
`pnpm mock-second-day` 的 QA 流使用。Production build 永远走 GitHub raw。

## 状态管理

Zustand 拆分为 3 个独立 store，避免单一 mega-store 带来的全局 re-render：

| Store            | 持久化                      | 用途                   |
| ---------------- | --------------------------- | ---------------------- |
| `useThemeStore`  | `localStorage`（colorMode） | 主题颜色、设置面板开关 |
| `useLayoutStore` | 无                          | 窗口尺寸、侧边栏开关   |
| `useUiStore`     | 无                          | 下载面板开关           |

## 渲染策略

- **/、/dashboard** — 静态预渲染（SSG），所有数据在 client 端用 SWR 拉取
- **/details?bvid=...** — Client component，由 `Suspense` 包住避免 `useSearchParams()` 报错
- **/api/\*** — Dynamic Server Functions（Node.js runtime）

## 设计决策

### 为什么不用 IndexedDB / localStorage 存缓存？

- 数据每天才更新一次，CDN + GitHub raw 已是最快来源
- SWR 的 `dedupingInterval` 60s 已足够
- 引入 IndexedDB 增加复杂度但收益有限

### 为什么用 server-only 的 fetcher？

- `next/dynamic` 与 RSC 对边界敏感
- 强制区分 client/server fetch 逻辑，避免缓存变量意外序列化

### 为什么不用 SWR 内建 React Suspense 模式？

- 我们的数据来自远程 JSON 文件，不需要 streaming
- `isLoading` 模式对小型表单 + 列表的 UX 更直接

## 已知限制

- 每日 12:00 UTC+8 之后若 GitHub Actions 失败，前端会持续读到昨日数据
- 详情页的 `videoInfo` 走 B 站实时 API，网络失败时会显示空状态（已有 skeleton）
- 移动端构建需要 Capacitor 环境；不在 web 部署流程中
- i18n 切换器写 cookie 后，`app/layout.tsx` 通过 `cookies()` 读 lang 设
  `<html lang>`；这让所有页面从 static (`○`) 变 dynamic (`ƒ`) 渲染。
  对小流量 B 站 analyzer 影响可忽略；若未来流量大、可改用 client
  `useEffect` 设 `document.documentElement.lang` 换回 static，trade-off
  是初次 paint 的 lang 属性会错 ~50ms
