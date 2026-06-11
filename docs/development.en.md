# Development

> Bilingual: [繁體中文](./development.md) · [English](./development.en.md)

## Requirements

- Node.js ≥ 20
- pnpm ≥ 9
- Git

## First-time setup

```bash
git clone https://github.com/BlackishGreen33/BiliBili-Analyzer.git
cd BiliBili-Analyzer
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Common commands

| Command             | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `pnpm dev`          | dev server (Turbopack)                                        |
| `pnpm build`        | production build                                              |
| `pnpm start`        | run the production build                                      |
| `pnpm lint`         | ESLint flat config                                            |
| `pnpm prettier`     | format everything                                             |
| `pnpm crawldata`    | run the crawler (writes to `result/`)                         |
| `pnpm build:mobile` | build Capacitor mobile (see [deployment](./deployment.en.md)) |

## Code style

- **TypeScript** strict mode
- **ESLint** flat config (`@typescript-eslint`, `simple-import-sort`,
  `unused-imports`)
- **Prettier** + Tailwind plugin + Organize Imports plugin
- **Husky** pre-commit → lint-staged
- No `any` (`@typescript-eslint/no-explicit-any: 'error'`)
- No unused imports (`unused-imports/no-unused-imports: 'error'`)

## Naming

- Files: `PascalCase` (components), `camelCase` (utils/hooks/libs),
  `kebab-case` (crawler script)
- Variables: `camelCase`
- Component props: `PascalCase + Props` interface
- Constants: `UPPER_SNAKE_CASE` (top-level only)
- Booleans: prefix with `is*`, `has*`, `can*`

## Directory

| Path                                                      | Purpose             | Rules                           |
| --------------------------------------------------------- | ------------------- | ------------------------------- |
| `src/app/`                                                | Next.js routes      | one folder per route            |
| `src/common/components/ui/`                               | shadcn primitives   | upgrade via the shadcn CLI      |
| `src/common/components/{layout,sidebar,navbar,elements}/` | shared UI           | business-agnostic               |
| `src/common/hooks/`                                       | global hooks        | Zustand split into 3 stores     |
| `src/common/libs/`                                        | data fetching       | client (SWR) / server separated |
| `src/common/types/`                                       | TS types + Zod      | one schema per file             |
| `src/common/utils/`                                       | utility functions   | pure-first                      |
| `src/modules/`                                            | page business logic | one module per folder           |

## How to add a new feature

### New server API route

1. Create `src/app/api/<name>/route.ts`
2. Fetch data from `src/common/libs/result-data.server`
3. Validate with a Zod schema
4. Document in [docs/api.md](./api.en.md)

### New client hook

1. New file in `src/common/libs/`
2. Use SWR + Zod validation
3. Export both the hook and a fetcher

### New analysis dimension

1. Update `CrawlPopular.cjs` in `buildAggregations`
2. Add the field to `DashboardAgg` (`src/common/libs/dashboard-data.ts`)
3. Add the visualization to `/dashboard` (Recharts)
4. Update [docs/analysis.md](./analysis.en.md)

## How to fix a bug

1. Start with `pnpm dev`; reproduce in browser DevTools
2. Add `console.log` to the source (only locally, remove before commit)
3. Write the fix
4. Add a unit test (future)
5. Run `pnpm lint` to confirm it passes
6. Run `pnpm build` to confirm the production build passes

## How to ship a data change

> Data changes need two PRs, merged in this order:
>
> 1. Update `CrawlPopular.cjs` → the next cron will write new data
> 2. Update the Zod schema in `src/common/types/schema.ts` → guarantees
>    client-side validation matches
>
> Merging the schema first will cause the client to reject the new
> data.

## Design system

See [DESIGN.md](../DESIGN.md) — the single source of truth for all
visual decisions.

Before adding a new component, read this file to confirm that fonts,
colors, spacing, and interaction patterns are consistent with what
already exists.

## Questions / issues

Open a [GitHub Issue](https://github.com/BlackishGreen33/BiliBili-Analyzer/issues):

- **Bug**: include repro steps, expected behavior, actual behavior
- **Feature**: describe **why first**, then **what to build**
- **Question**: open a Discussion instead
