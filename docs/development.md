# 開發指南 / Development

> 雙語：[繁體中文](./development.md) · [English](./development.en.md)

## 環境需求

- Node.js ≥ 20
- pnpm ≥ 9
- Git

## 第一次設定

```bash
git clone https://github.com/BlackishGreen33/BiliBili-Analyzer.git
cd BiliBili-Analyzer
pnpm install
pnpm dev
```

打開 http://localhost:3000。

## 常用指令

| 指令                | 用途                                                      |
| ------------------- | --------------------------------------------------------- |
| `pnpm dev`          | 開發伺服器（Turbopack）                                   |
| `pnpm build`        | 生產構建                                                  |
| `pnpm start`        | 跑生產 build                                              |
| `pnpm lint`         | ESLint flat config                                        |
| `pnpm prettier`     | 格式化全部檔案                                            |
| `pnpm crawldata`    | 跑爬蟲（會寫入 `result/`）                                |
| `pnpm build:mobile` | 構建 Capacitor 移動端（見 [deployment](./deployment.md)） |

## 程式碼風格

- **TypeScript** strict 模式
- **ESLint** flat config（`@typescript-eslint`、`simple-import-sort`、
  `unused-imports`）
- **Prettier** + Tailwind plugin + Organize Imports plugin
- **Husky** pre-commit → lint-staged
- 不允許 `any`（`@typescript-eslint/no-explicit-any: 'error'`）
- 不允許未使用 imports（`unused-imports/no-unused-imports: 'error'`）

## 命名

- 檔案：`PascalCase`（元件）、`camelCase`（utils/hooks/libs）、
  `kebab-case`（crawler script）
- 變數：`camelCase`
- 元件 props：`PascalCase + Props` 介面
- 常數：`UPPER_SNAKE_CASE`（僅頂層）
- 布林：`is*`、`has*`、`can*` 開頭

## 動畫 / Motion

- 共用 framer-motion variants 放在 `src/common/styles/motion.ts`
  （`fadeUp`、`scaleIn`、`slideInRight`、`containerStagger`）
- 所有進場/離場優先用 `AnimatePresence` + variants，避免
  條件渲染直接消失/出現
- 微互動（hover、tap）用 `whileHover` / `whileTap`，
  幅度控制在 `scale ≤ 1.08` / `rotate ≤ ±12°`
- 全域 `prefers-reduced-motion` 規則已寫在 `globals.css`，
  自動把 `*` 的 animation/transition 縮短到 0.01ms

## 目錄

| 路徑                                                      | 用途              | 規則                       |
| --------------------------------------------------------- | ----------------- | -------------------------- |
| `src/app/`                                                | Next.js 路由      | 一個路由一個資料夾         |
| `src/common/components/ui/`                               | shadcn primitives | 直接從 shadcn CLI 升級     |
| `src/common/components/{layout,sidebar,navbar,elements}/` | 共享 UI           | 業務無關                   |
| `src/common/hooks/`                                       | 全域 hooks        | Zustand 拆成 3 stores      |
| `src/common/libs/`                                        | 資料獲取          | client (SWR) / server 分開 |
| `src/common/types/`                                       | TS types + Zod    | 一個 schema 一個檔案       |
| `src/common/utils/`                                       | 工具函式          | 純函式優先                 |
| `src/modules/`                                            | 頁面業務邏輯      | 一個模組一個資料夾         |

## 怎麼加新功能

### 加一個新的 server API route

1. 在 `src/app/api/<name>/` 建立 `route.ts`
2. 對 `src/common/libs/result-data.server` 取資料
3. 用 Zod schema 驗證
4. 加到 [docs/api.md](./api.md) 文檔

### 加一個新的 client hook

1. 在 `src/common/libs/` 開新檔
2. 使用 SWR + Zod 驗證
3. Export hook 與 fetcher

### 加一個新的分析維度

1. 改 `CrawlPopular.cjs` 在 `buildAggregations` 加計算
2. 加到 `DashboardAgg` 型別（`src/common/libs/dashboard-data.ts`）
3. 在 `/dashboard` 加視覺化（Recharts）
4. 寫到 [docs/analysis.md](./analysis.md)

## 怎麼修 bug

1. 從 `pnpm dev` 開始；用瀏覽器 DevTools 重現
2. 在 source 加 `console.log`（僅本機，commit 前移除）
3. 寫 fix
4. 加 unit test（未來）
5. 跑 `pnpm lint` 確認通過
6. 跑 `pnpm build` 確認 production build 通過

## 怎麼上資料變更

> 數據變更需要兩個 PR：
>
> 1. 改 `CrawlPopular.cjs` → 自動觸發下一次 cron 寫新資料
> 2. 改 `src/common/types/schema.ts` 的 Zod schema → 保證 client 端驗證一致
>
> 兩個 PR 同時合併；先合併 schema 會導致 client 拒絕新資料。

## 設計系統

參考 [DESIGN.md](../DESIGN.md) — 所有視覺決策的單一來源。

新元件前先讀這份，確認字體、顏色、間距、互動模式與現有元件一致。

## 提問 / Issue

開 [GitHub Issue](https://github.com/BlackishGreen33/BiliBili-Analyzer/issues)：

- Bug：附上 `repro steps`、預期行為、實際行為
- Feature：先描述**為什麼需要**，再描述**要做什麼**
- Question：在 Discussions 開
