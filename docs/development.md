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

## 怎麼跑跨日比對的 QA

`/dashboard/compare` 需要至少 2 天資料才能用；正式環境第一次上線時只有
1 天，要等隔日 12:00 UTC+8 cron 跑完才會有第二份。

QA 流程（不污染 production）：

```bash
# 1. 下載當日 prod 資料
mkdir -p result
curl -sL "https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/list.json" -o result/list.json
LATEST=$(node -e "console.log(require('./result/list.json')[0])")
curl -sL "https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/${LATEST}.json" -o "result/${LATEST}.json"

# 2. 生成「昨日」假資料（拷今日 + 10% 下線 + stat 微抖動）
pnpm mock-second-day

# 3. dev server 走本機路徑
MOCK_LOCAL_FILES=1 pnpm dev

# 4. 開 http://localhost:3000/dashboard/compare 看 diff
```

重置：

```bash
rm result/2026-06-11*.json  # 昨日 mock
# list.json 還原
git checkout result/list.json
```

## 怎麼加新 i18n key

字典 source of truth 是 `src/common/i18n/dictionaries/zh-CN.ts`（其他 locale
會 fallback 到它）。流程：

1. 在 `zh-CN.ts` 加新 key，例如 `dashboard.chart.foo: '新图表'`
2. 在 `zh-TW.ts` 與 `en.ts` 加同名 key（如果留空、會自動 fallback 到 zh-CN）
3. 在 UI 元件裡 `const { t } = useTranslation()` 後用 `t('dashboard.chart.foo')`
4. TypeScript 編譯會自動檢查 key 是否存在於 `zh-CN`（透過
   `src/common/i18n/types.ts` 的 `CustomTypeOptions.resources`）

切換器在 `src/common/components/elements/ThemeSettings.tsx` 的
「語言」Select。持久化用 cookie + localStorage（key =
`bili-analyzer-locale`），透過 `i18next-browser-languagedetector`
的 `lookupCookie` / `lookupLocalStorage` 設定。

## 設計系統

參考 [DESIGN.md](../DESIGN.md) — 所有視覺決策的單一來源。

新元件前先讀這份，確認字體、顏色、間距、互動模式與現有元件一致。

## 提問 / Issue

開 [GitHub Issue](https://github.com/BlackishGreen33/BiliBili-Analyzer/issues)：

- Bug：附上 `repro steps`、預期行為、實際行為
- Feature：先描述**為什麼需要**，再描述**要做什麼**
- Question：在 Discussions 開
