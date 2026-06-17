# 部署 / Deployment

> 双语：[简体中文](./deployment.md) · [English](./deployment.en.md)

## Web 部署 (Vercel)

### 触发

- `main` 分支 push
- `.github/workflows/build.yml` 跑 `pnpm build` 验证
- 通过后 Vercel 自动部署 preview → production

### 环境变量

**不需要设置任何环境变量**。全部 API 都是公开的。

### Build command

```bash
pnpm build
```

### Vercel 设置

- **Framework**: Next.js
- **Build command**: `pnpm build`
- **Output directory**: `.next`
- **Node.js version**: 20

> **不要**启用 `output: "export"`！会让 API routes 失效，导致 dashboard
> 与详情页全部坏掉。

## 数据爬取 (GitHub Actions)

### 触发

`.github/workflows/crawl.yml`：

```yaml
on:
  schedule:
    - cron: '0 4 * * *' # 12:00 UTC+8
  push:
    branches: [main]
  workflow_dispatch:
```

### 流程

1. checkout `main`
2. `pnpm install`
3. `pnpm run crawldata`（执行 `CrawlPopular.cjs`）
4. 把 `result/` 拷贝到 `/tmp`
5. 切到 `result` orphan 分支
6. 从 `/tmp` 套用 `result/`
7. `git add result/* -f && git commit && git push origin result`

### 失败处理

- 如果 cron 失败，当天没有数据；前端的 SWR 会 fallback 到昨天
- `result` 分支的历史无限期保留
- 监控：可在 repo 开 Issues 自动警报

## 移动端 (Capacitor)

### 为什么不常驻启用？

`next.config.mjs` 注释着 `// output: "export"`，因为 Vercel 部署时启用会
导致 build 报错（API routes 与 middleware 都不能 export）。

### 构建流程

```bash
pnpm build:mobile
```

此命令会：

1. 备份 `next.config.mjs` 到 `next.config.mjs.bak`
2. 把 `// output: "export"` 解开为 `output: "export"`
3. **暂存** `src/app/api` → `src/app/_api_disabled_for_mobile_build`
   （`output: "export"` 不允许任何 dynamic route handler；mobile shell 不会
   真的执行这些 API，会直接打 `bilibili-analyzer.vercel.app` 的 live API）
4. 跑 `npx next build`（静态汇出到 `out/`）
5. `npx cap sync android ios`（把 `out/` 拷贝到原生壳）
6. **还原** `src/app/api` 与 `next.config.mjs`

> 暂存 / 还原都在 `try / finally` 里完成，即使 build 中途失败也会还
> 原工作树。

### Layout cookie 读取

`src/app/layout.tsx` 不再在 server 阶段读 `cookies()`，改为渲染默认值
（`zh-CN` / `#FB7299`）然后交给客户端组件 `src/common/components/HtmlAttrs.tsx`
在 hydration 后从 `document.cookie` 同步 `<html lang>` 与 `--accent-color`。
这样 layout 是完全静态的，可以被 `output: "export"` 静态汇出。代价是有自定
义 accent color 时首屏会有一次小闪烁（ThemeStore 重新计算后即恢复）。

### 构建原生 app

```bash
# Android
npx cap open android
# 在 Android Studio 中 build APK / AAB

# iOS
npx cap open ios
# 在 Xcode 中 archive
```

或者直接走 `.github/workflows/release.yml`：打 `v*.*.*` tag 后 CI 会自动
build APK / AAB + Chrome extension zip 并创建 GitHub Release。iOS Ad Hoc
IPA 仍需本地手動 `xcodebuild archive` → `gh release upload`。

### 版本号同步

| 文件                                    | 字段                                            |
| --------------------------------------- | ----------------------------------------------- |
| `package.json`                          | `version`                                       |
| `android/app/build.gradle`              | `versionCode` / `versionName`                   |
| `ios/App/App.xcodeproj/project.pbxproj` | `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION` |
| `extension/manifest.json`               | `version`                                       |

每次 release 前需要把四处都改到一致。

### 环境要求

- Android: Android Studio + JDK 17 + Android SDK 34
- iOS: macOS + Xcode 15+ + CocoaPods
- Capacitor 8

## 环境变量一览

不需要任何环境变量。

## 监控

目前**没有**整合 Sentry / LogRocket。如果需要：

```bash
pnpm add @sentry/nextjs
```

然后在 `next.config.mjs` 启用。在 `src/app/error.tsx` 与每个 API
route 的 `console.error` 处接入 Sentry capture。

## 还原 / Rollback

- Vercel 后台 → Deployments → 找到上一个 production deployment →
  Promote to Production
- `result` 分支的历史：用 `git revert` 或 reset

## CDN / 缓存

Vercel 自动提供：

- 静态资产 → 永久缓存
- 页面 → SWR 机制
- API routes → 无缓存（已自带 in-memory cache）

## 监控

> 尚未整合。未来加入 Sentry / Plausible Analytics。
