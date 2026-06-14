# 开发指南 / Development

> 双语：[简体中文](./development.md) · [English](./development.en.md)

## 环境需求

- Node.js ≥ 20
- pnpm ≥ 9
- Git

## 第一次设置

```bash
git clone https://github.com/BlackishGreen33/BiliBili-Analyzer.git
cd BiliBili-Analyzer
pnpm install
pnpm dev
```

打开 http://localhost:3000。

## 常用命令

| 命令                | 用途                                                      |
| ------------------- | --------------------------------------------------------- |
| `pnpm dev`          | 开发服务器（Turbopack）                                   |
| `pnpm build`        | 生产构建                                                  |
| `pnpm start`        | 跑生产 build                                              |
| `pnpm lint`         | ESLint flat config                                        |
| `pnpm prettier`     | 格式化全部文件                                            |
| `pnpm crawldata`    | 跑爬虫（会写入 `result/`）                                |
| `pnpm build:mobile` | 构建 Capacitor 移动端（见 [deployment](./deployment.md)） |

## 代码风格

- **TypeScript** strict 模式
- **ESLint** flat config（`@typescript-eslint`、`simple-import-sort`、
  `unused-imports`）
- **Prettier** + Tailwind plugin + Organize Imports plugin
- **Husky** pre-commit → lint-staged
- 不允许 `any`（`@typescript-eslint/no-explicit-any: 'error'`）
- 不允许未使用 imports（`unused-imports/no-unused-imports: 'error'`）

## 命名

- 文件：`PascalCase`（元件）、`camelCase`（utils/hooks/libs）、
  `kebab-case`（crawler script）
- 变量：`camelCase`
- 元件 props：`PascalCase + Props` 接口
- 常量：`UPPER_SNAKE_CASE`（仅顶层）
- 布尔：`is*`、`has*`、`can*` 开头

## 动画 / Motion

- 共用 framer-motion variants 放在 `src/common/styles/motion.ts`
  （`fadeUp`、`scaleIn`、`slideInRight`、`containerStagger`）
- 所有进场/离场优先用 `AnimatePresence` + variants，避免
  条件渲染直接消失/出现
- 微互动（hover、tap）用 `whileHover` / `whileTap`，
  幅度控制在 `scale ≤ 1.08` / `rotate ≤ ±12°`
- 全局 `prefers-reduced-motion` 规则已写在 `globals.css`，
  自动把 `*` 的 animation/transition 缩短到 0.01ms

## 目录

| 路径                                                      | 用途              | 规则                       |
| --------------------------------------------------------- | ----------------- | -------------------------- |
| `src/app/`                                                | Next.js 路由      | 一个路由一个文件夹         |
| `src/common/components/ui/`                               | shadcn primitives | 直接从 shadcn CLI 升级     |
| `src/common/components/{layout,sidebar,navbar,elements}/` | 共享 UI           | 业务无关                   |
| `src/common/hooks/`                                       | 全局 hooks        | Zustand 拆成 3 stores      |
| `src/common/libs/`                                        | 数据获取          | client (SWR) / server 分开 |
| `src/common/types/`                                       | TS types + Zod    | 一个 schema 一个文件       |
| `src/common/utils/`                                       | 工具函数          | 纯函数优先                 |
| `src/modules/`                                            | 页面业务逻辑      | 一个模块一个文件夹         |

## 怎么加新功能

### 加一个新的 server API route

1. 在 `src/app/api/<name>/` 建立 `route.ts`
2. 对 `src/common/libs/result-data.server` 取数据
3. 用 Zod schema 验证
4. 加到 [docs/api.md](./api.md) 文档

### 加一个新的 client hook

1. 在 `src/common/libs/` 开新文件
2. 使用 SWR + Zod 验证
3. Export hook 与 fetcher

### 加一个新的分析维度

1. 改 `CrawlPopular.cjs` 在 `buildAggregations` 加计算
2. 加到 `DashboardAgg` 类型（`src/common/libs/dashboard-data.ts`）
3. 在 `/dashboard` 加可视化（Recharts）
4. 写到 [docs/analysis.md](./analysis.md)

## 怎么修 bug

1. 从 `pnpm dev` 开始；用浏览器 DevTools 重现
2. 在 source 加 `console.log`（仅本机，commit 前移除）
3. 写 fix
4. 加 unit test（未来）
5. 跑 `pnpm lint` 确认通过
6. 跑 `pnpm build` 确认 production build 通过

## 怎么上数据变更

> 数据变更需要两个 PR：
>
> 1. 改 `CrawlPopular.cjs` → 自动触发下一次 cron 写新数据
> 2. 改 `src/common/types/schema.ts` 的 Zod schema → 保证 client 端验证一致
>
> 两个 PR 同时合并；先合并 schema 会导致 client 拒绝新数据。

## 怎么跑跨日对比的 QA

`/dashboard/compare` 需要至少 2 天数据才能用；正式环境第一次上线时只有
1 天，要等隔日 12:00 UTC+8 cron 跑完才会有第二份。

QA 流程（不污染 production）：

```bash
# 1. 下载当日 prod 数据
mkdir -p result
curl -sL "https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/list.json" -o result/list.json
LATEST=$(node -e "console.log(require('./result/list.json')[0])")
curl -sL "https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/${LATEST}.json" -o "result/${LATEST}.json"

# 2. 生成「昨日」假数据（拷今日 + 10% 下线 + stat 微抖动）
pnpm mock-second-day

# 3. dev server 走本机路径
MOCK_LOCAL_FILES=1 pnpm dev

# 4. 开 http://localhost:3000/dashboard/compare 看 diff
```

重置：

```bash
rm result/2026-06-11*.json  # 昨日 mock
# list.json 还原
git checkout result/list.json
```

## 怎么跑时序图 / UP 跨分区的 QA

`/dashboard/trend`、`/dashboard/ups` 需要 N 天历史（推荐 30 天）。正式
环境第一次上线时只有 1 天数据，UI 会显示「模拟数据」badge 并降阶到实际天数。

QA 流程（与 `mock-second-day` 类似但生成多天）：

```bash
# 1. 同上：下载当日 prod 数据
mkdir -p result
curl -sL "https://raw.githubusercontent.com/.../result/list.json" -o result/list.json
LATEST=$(node -e "console.log(require('./result/list.json')[0])")
curl -sL "https://.../${LATEST}.json" -o "result/${LATEST}.json"

# 2. 生成 30 天假数据（idempotent：已存在的不会重复生成）
pnpm mock-n-days --days=30

# 3. dev server 走本机路径
MOCK_LOCAL_FILES=1 pnpm dev

# 4. 开 http://localhost:3000/dashboard/trend 看时序图
#    开 http://localhost:3000/dashboard/ups 看 UP 主跨分区
```

重置：

```bash
rm result/2026-*.json  # 砍掉所有非最新文件
git checkout result/list.json
```

> `mock-n-days` 与 `mock-second-day` 共存，后者是前者的特例（`days=1`）。
> 但 `mock-second-day` 对 jitter 的参数不同（dropRatio 10% vs 5%），
> QA 可依需求选择。

## 怎么跑测试

```bash
pnpm test               # 跑一次
pnpm test:watch         # watch 模式
pnpm test:coverage      # 跑一次 + 输出 coverage
```

测试覆盖：

- `src/common/utils/format.test.ts` — `formatXxx` / `extractBvid` 边界值
- `src/common/utils/cjk-segmenter.test.ts` — `Intl.Segmenter` + n-gram 词频
- `src/common/types/schema.test.ts` — Zod schema accept/reject
- `src/common/libs/result-data.server.test.ts` — `buildAggregations` 7 个 metric
- `src/app/api/api-routes.test.ts` — 5 个 server route（vi.mock `result-data.server`）

覆盖率阈值写在 `vitest.config.ts`，目前 70% lines / 70% branches / 80% functions。
CI 会在 `pnpm lint` 之后跑 `pnpm test --coverage`，未达阈值会 fail。

## 怎么加新 i18n key

字典 source of truth 是 `src/common/i18n/dictionaries/zh-CN.ts`（其他 locale
会 fallback 到它）。流程：

1. 在 `zh-CN.ts` 加新 key，例如 `dashboard.chart.foo: '新图表'`
2. 在 `zh-TW.ts` 与 `en.ts` 加同名 key（如果留空、会自动 fallback 到 zh-CN）
3. 在 UI 元件里 `const { t } = useTranslation()` 后用 `t('dashboard.chart.foo')`
4. TypeScript 编译会自动检查 key 是否存在于 `zh-CN`（通过
   `src/common/i18n/types.ts` 的 `CustomTypeOptions.resources`）

切换器在 `src/common/components/elements/ThemeSettings.tsx` 的
「语言」Select。持久化用 cookie + localStorage（key =
`bili-analyzer-locale`），通过 `i18next-browser-languagedetector`
的 `lookupCookie` / `lookupLocalStorage` 设置。

## 设计系统

参考 [DESIGN.md](../DESIGN.md) — 所有视觉决策的单一来源。

新元件前先读这份，确认字体、颜色、间距、互动模式与现有元件一致。

## 提问 / Issue

开 [GitHub Issue](https://github.com/BlackishGreen33/BiliBili-Analyzer/issues)：

- Bug：附上 `repro steps`、预期行为、实际行为
- Feature：先描述**为什么需要**，再描述**要做什么**
- Question：在 Discussions 开
