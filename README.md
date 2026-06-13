<div align="center">
  <img width="130" src="https://github.com/BlackishGreen33/BiliBili-Analyzer/blob/main/public/icon.png?raw=true" alt="BiliBili-Analyzer logo">
  <h1 align="center">BiliBili-Analyzer</h1>
  <h3>B 站近期热门视频分类检索分析系统</h3>
  <a href="https://bilibili-analyzer.vercel.app/"><strong>在线体验</strong></a> · <a href="./docs/"><strong>浏览文档</strong></a> · <a href="https://github.com/BlackishGreen33/BiliBili-Analyzer/issues">报告 Bug</a>
  <br />
  <br />

![license](https://img.shields.io/github/license/BlackishGreen33/BiliBili-Analyzer)
![language](https://img.shields.io/github/languages/top/BlackishGreen33/BiliBili-Analyzer)
![last](https://img.shields.io/github/last-commit/BlackishGreen33/BiliBili-Analyzer)
![build](https://img.shields.io/badge/build-passing-brightgreen)

</div>

---

## ✨ 项目简介 / Overview

**简体中文**:
一个基于 [Bilibili](https://www.bilibili.com) 公开热门榜单的多维检索与聚合分析系统。每天 12:00 (UTC+8) 自动抓取当日热门 Top 1000 视频 + UP 主元数据，提供：

- 多维检索（关键字 + 一级/二级分区 + 标签 + 日期）
- 聚合分析（分区占比、UP 主上榜榜、互动率、发布时段、时长分布、标签云）
- 单视频深度页（7 项互动指标 + 同 UP 主 / 同分区其他上榜视频）

**English**:
A multi-dimensional retrieval and aggregation analytics system for
[Bilibili](https://www.bilibili.com)'s public popular-videos ranking.
A daily GitHub Actions cron crawls the top 1000 videos plus UP 主
metadata every day at 12:00 (UTC+8). The system provides:

- **Multi-dimensional search** by keyword, primary/secondary channel,
  tag, and date.
- **Aggregation dashboard** with channel distribution, UP 主
  leaderboard, engagement rate, publish-hour heatmap, duration
  histogram, and tag cloud.
- **Per-video detail page** with 7-metric engagement signature and
  related videos (same UP / same channel).

## 🚀 快速开始 / Quick start

```bash
$ git clone https://github.com/BlackishGreen33/BiliBili-Analyzer.git
$ cd BiliBili-Analyzer
$ pnpm install
$ pnpm dev
```

打开 http://localhost:3000 即可。

> 需要 `Node.js >= 20` 和 `pnpm >= 9`.

## 🛰️ 数据流 / Data flow

```mermaid
graph LR
  A[B 站热门 API<br>popular + tags + up] -->|每日 12:00 UTC+8| B[CrawlPopular.cjs]
  B -->|bvid / mid / stat / tags| C[result/yyyy-mm-dd.json]
  B -->|預聚合| D[result/agg-latest.json]
  C -->|git push| E[GitHub:result 分支]
  D -->|git push| E
  E -->|raw.githubusercontent.com| F[Next.js API routes]
  F -->|/api/dashboard 等| G[SWR hooks]
  G --> H[React UI]
```

> 完整說明見 [docs/architecture.md](./docs/architecture.md) (繁中) /
> [docs/architecture.en.md](./docs/architecture.en.md) (English).

## 🧱 技术栈 / Tech stack

| 範疇 / Concern         | 技術 / Stack                                            |
| ---------------------- | ------------------------------------------------------- |
| 框架 Framework         | Next.js 16 (App Router) / React 19 / TypeScript 5.9     |
| 樣式 Styling           | Tailwind CSS v4 + shadcn/ui (Radix Primitives)          |
| 圖表 Charts            | Recharts 2.15                                           |
| 詞雲 Word cloud        | react-d3-cloud                                          |
| 數據抓取 Data fetching | SWR 2 + Zod 3 schema validation                         |
| 狀態 State             | Zustand 5 (split into 3 stores)                         |
| 字體 Fonts             | Geist Sans + Geist Mono + Noto Sans SC                  |
| 數據採集 Crawler       | Node.js + axios, exponential backoff                    |
| 部署 Deployment        | Vercel + GitHub Actions (daily cron)                    |
| 移動端 Mobile          | Capacitor 8 (via `pnpm build:mobile`)                   |
| 程式碼品質 Quality     | ESLint 9 (flat config) + Prettier + Husky + lint-staged |

## 📂 目錄結構 / Directory structure

```
BiliBili-Analyzer/
├── CrawlPopular.cjs          # Daily Node.js crawler
├── public/                   # Static assets (icon, qrcode, OG image)
├── scripts/
│   └── build-mobile.mjs      # Capacitor build orchestration
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (main)/page.tsx  # / (search + grid)
│   │   ├── details/page.tsx  # /details?bvid=...
│   │   ├── dashboard/        # /dashboard (new)
│   │   ├── api/              # 5 server routes
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── layout.tsx
│   ├── common/
│   │   ├── components/      # UI shell (sidebar, navbar, ui primitives, ...)
│   │   ├── hooks/           # useThemeStore / useLayoutStore / useUiStore
│   │   ├── libs/            # result-data / result-data.server / dashboard-data / video-data
│   │   ├── providers/       # Providers (next-themes only)
│   │   ├── styles/          # globals.css
│   │   ├── types/           # video.ts / bilibili.ts / schema.ts (Zod)
│   │   └── utils.ts / utils/format.ts
│   └── modules/              # Page-level modules
│       ├── Home/             # Mounts Search (dynamic, ssr:false)
│       ├── Search/           # Filter + virtualized grid
│       └── Detail/           # Video player + 7 metrics + WordCloud + related
├── docs/                     # 双语文档 (繁中 + English)
├── PRODUCT.md                # Strategic product brief
├── DESIGN.md                 # Visual design tokens
├── next.config.mjs
├── tailwind.config           # v4 inline @theme
├── tsconfig.json             # strict + ES2022
├── eslint.config.mjs         # flat config, all rules re-enabled
└── package.json
```

## 🛠️ 可用脚本 / Available scripts

| 命令                   | 說明                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `pnpm dev`             | 启动开发服务器 (Turbopack)                                  |
| `pnpm build`           | 生产构建                                                    |
| `pnpm start`           | 启动生产服务                                                |
| `pnpm lint`            | ESLint (flat config)                                        |
| `pnpm prettier`        | Prettier 格式化                                             |
| `pnpm test`            | Vitest 跑一次所有 unit + RTL + API 測試                     |
| `pnpm test:watch`      | Vitest watch 模式                                           |
| `pnpm test:coverage`   | Vitest + v8 coverage report                                 |
| `pnpm crawldata`       | 抓取当日热门 + UP 主 + 预聚合 (写入 `result/`)              |
| `pnpm mock-second-day` | 拷昨日假資料（QA 跨日比對用）                               |
| `pnpm mock-n-days`     | 拷 N 天假資料（QA 時序圖 / 跨分區用，預設 30）              |
| `pnpm build:mobile`    | 临时 patch `next.config.mjs` → 静态导出 → `cap sync` → 还原 |

## 🧪 測試 / Tests

Vitest 2.x + happy-dom + @testing-library/react。122 個測試覆蓋：

- `src/common/utils/format.test.ts` — `formatXxx` / `extractBvid` 邊界值（33）
- `src/common/utils/cjk-segmenter.test.ts` — `Intl.Segmenter` + n-gram 詞頻（23）
- `src/common/types/schema.test.ts` — Zod schema accept/reject（10）
- `src/common/libs/result-data.server.test.ts` — `buildAggregations` 7 個 metric（16）
- `src/app/api/api-routes.test.ts` — 5 個 server route（trend/length/wordcloud/latency/up-overlap）（20）
- `src/common/components/elements/SkipToContent.test.tsx` — RTL smoke（4）
- `src/common/components/elements/ThemeSettings.test.tsx` — RTL smoke（6）
- `src/common/components/elements/SummaryCard.test.tsx` — RTL smoke（5）
- `src/common/components/elements/LengthRecommendCard.test.tsx` — RTL smoke（5）

Coverage 門檻見 `vitest.config.ts`（目前 **85% lines / 78% branches / 88% functions / 85% statements**，
含排除清單）。CI 會在 `pnpm lint` 後跑 `pnpm test:coverage`，未達門檻 fail。

> 排除清單精準只保留「本輪新增或重構的程式碼」。舊 API（`/api/dashboard`、
> `/api/dashboard/compare`、`/api/randomBvid`、`/api/video*`）與舊 client hooks
> （`useDashboard`、`useResultList` 等）與 legacy 頁面（`modules/Search/Search.tsx`、
> `modules/Detail/components/*`）本輪未觸碰，不算入覆蓋率。下一輪若要推高
> 覆蓋率，把它們加回 `include` 即可（相應要補測試）。

## 🛰️ 数据采集 / Data crawler

`CrawlPopular.cjs` 完整流程：

1. 拉取 B 站热门 `/x/web-interface/popular` 前 50 页（最多 1000 支）
2. 对每支视频并发请求 `/x/tag/archive/tags`（10 并发）补齐普通标签
3. 去重 UP 主后并发请求 `/x/relation/stat` + `/x/space/wbi/acc/info`
   （6 并发）补齐粉丝数、签名、认证类型
4. 计算 7 个预聚合维度（summary / channels / topUps / duration /
   hourHeatmap / topTags）写入 `result/agg-latest.json`
5. 维护 `result/list.json` 指针

所有请求使用 exponential backoff（1s → 2.5s → 5s）。GitHub Actions
`.github/workflows/crawl.yml` 每天 12:00 UTC+8 自动执行并 push 到
`result` orphan 分支。

> 完整說明見 [docs/crawler.md](./docs/crawler.md) / [docs/crawler.en.md](./docs/crawler.en.md).

## 📊 數據分析維度 / Data analysis dimensions

`/dashboard` 提供以下分析：

| 視圖                | 數據源   | 計算                                                    |
| ------------------- | -------- | ------------------------------------------------------- |
| 4 個關鍵指標卡      | 當日結果 | 總視頻、上榜 UP、總播放、互動量                         |
| 分區占比 (pie)      | 預聚合   | 一級分區熱門視頻數                                      |
| UP 主上榜榜 (bar)   | 預聚合   | 當日上榜次數 TOP 10                                     |
| 時長分佈 (bar)      | 預聚合   | 7 桶直方圖（<1 min, 1-3, 3-5, 5-10, 10-20, 20-30, >30） |
| 發布時段 (bar)      | 預聚合   | 24 小時（UTC+8）                                        |
| 熱門標籤 (badge)    | 預聚合   | 標籤出現次數 TOP 20                                     |
| UP 主排行榜 (table) | 預聚合   | 上榜次數 + 總播放 + 粉絲數                              |

## 🗂️ 文檔導航 / Documentation

| 文檔                 | 繁體中文                                       | English                                              |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| 架構 Architecture    | [docs/architecture.md](./docs/architecture.md) | [docs/architecture.en.md](./docs/architecture.en.md) |
| 資料字典 Data schema | [docs/data-schema.md](./docs/data-schema.md)   | [docs/data-schema.en.md](./docs/data-schema.en.md)   |
| 爬蟲設計 Crawler     | [docs/crawler.md](./docs/crawler.md)           | [docs/crawler.en.md](./docs/crawler.en.md)           |
| 分析指標 Analysis    | [docs/analysis.md](./docs/analysis.md)         | [docs/analysis.en.md](./docs/analysis.en.md)         |
| API 合約 API         | [docs/api.md](./docs/api.md)                   | [docs/api.en.md](./docs/api.en.md)                   |
| 部署 Deployment      | [docs/deployment.md](./docs/deployment.md)     | [docs/deployment.en.md](./docs/deployment.en.md)     |
| 開發指南 Development | [docs/development.md](./docs/development.md)   | [docs/development.en.md](./docs/development.en.md)   |

設計與產品語境：

- [PRODUCT.md](./PRODUCT.md) — 戰略層（受眾、品牌個性、反參考）
- [DESIGN.md](./DESIGN.md) — 視覺層（色彩、字體、間距、反 slop）

## 🛣️ Roadmap

- [x] 移除 antd / Syncfusion / styled-components / emotion / million 等未用依賴
- [x] 引入 Recharts + SWR + Zod + @tanstack/react-virtual
- [x] 拆分 Zustand store（3 個）
- [x] 修復 dark mode / `aid` 寫死 / `/quiz` 死鏈 / 數字未格式化 / y 軸寫死
- [x] 新增 `/dashboard` 聚合分析頁
- [x] 詳情頁加「同 UP 主」「同分區」推薦
- [x] Crawler Layer A + B + D1（保留更多欄位 + 預聚合）
- [x] Zod schema 驗證資料
- [x] Error boundary + loading skeleton
- [x] `pnpm build:mobile` Capacitor 打包
- [x] 服務端篩選支援（深連結分享）— `/` 篩選條件同步至 URL `?q=&c=&tag=&date=`
- [x] 體驗升級：Geist 字體 / framer-motion 動畫 / 自訂 Select / 自適應無限滾動
- [x] i18n（简体中文 / 繁體中文 / English，react-i18next，cookie 持久化 + SSR `<html lang>`）
- [x] 跨日趨勢比較（新頁 `/dashboard/compare?a=&b=` + `/api/dashboard/compare`）
- [x] 互動率即時排行（`/dashboard` 「互動率 TOP 10」bar + table；`summary.avgEngagement` 與 `topEngagement[10]`）
- [x] 視頻長度預測（`/api/length/recommend?type=up|channel|tag`；詳情頁「同 UP 主」下方 + `/dashboard` 全局視角；`/dashboard/ups` 跨分區排行；`/dashboard/trend` 跨日時序；發布到上榜延遲；CJK 標題分詞詞雲）

## 🧪 相容環境 / Browser support

- Chrome / Edge ≥ 90
- Firefox ≥ 90
- Safari ≥ 15
- iOS Safari ≥ 15
- Android Chrome ≥ 90

## 📝 授權 / License

MIT — 詳見 [LICENSE](./LICENSE) 文件。

> 本項目僅做 B 站公開熱門榜單檢索分析，**不存儲任何用戶隱私數據**。
> 數據源全部來自 B 站公開 API 與 GitHub `result` 分支。
