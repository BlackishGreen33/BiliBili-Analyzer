# 部署 / Deployment

> 雙語：[繁體中文](./deployment.md) · [English](./deployment.en.md)

## Web 部署 (Vercel)

### 觸發

- `main` 分支 push
- `.github/workflows/build.yml` 跑 `pnpm build` 驗證
- 通過後 Vercel 自動部署 preview → production

### 環境變數

**不需要設定任何環境變數**。全部 API 都是公開的。

### Build command

```bash
pnpm build
```

### Vercel 設定

- **Framework**: Next.js
- **Build command**: `pnpm build`
- **Output directory**: `.next`
- **Node.js version**: 20

> **不要**啟用 `output: "export"`！會讓 API routes 失效，導致 dashboard
> 與詳情頁全部壞掉。

## 數據爬取 (GitHub Actions)

### 觸發

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
3. `pnpm run crawldata`（執行 `CrawlPopular.cjs`）
4. 把 `result/` 拷貝到 `/tmp`
5. 切到 `result` orphan 分支
6. 從 `/tmp` 套用 `result/`
7. `git add result/* -f && git commit && git push origin result`

### 失敗處理

- 如果 cron 失敗，當天沒有資料；前端的 SWR 會 fallback 到昨天
- `result` 分支的歷史無限期保留
- 監控：可在 repo 開 Issues 自動警報

## 移動端 (Capacitor)

### 為什麼不常駐啟用？

`next.config.mjs` 註解著 `// output: "export"`，因為 Vercel 部署時啟用會
導致 build 報錯（API routes 與 middleware 都不能 export）。

### 構建流程

```bash
pnpm build:mobile
```

此命令會：

1. 備份 `next.config.mjs` 到 `next.config.mjs.bak`
2. 把 `// output: "export"` 解開為 `output: "export"`
3. 跑 `npx next build`（靜態匯出到 `out/`）
4. `npx cap sync android ios`（把 `out/` 拷貝到原生殼）
5. **還原** `next.config.mjs`，刪除 `.bak`

### 構建原生 app

```bash
# Android
npx cap open android
# 在 Android Studio 中 build APK / AAB

# iOS
npx cap open ios
# 在 Xcode 中 archive
```

### 環境要求

- Android: Android Studio + JDK 17 + Android SDK
- iOS: macOS + Xcode 15+ + CocoaPods
- Capacitor 8

## 環境變數一覽

不需要任何環境變數。

## 監控

目前**沒有**整合 Sentry / LogRocket。如果需要：

```bash
pnpm add @sentry/nextjs
```

然後在 `next.config.mjs` 啟用。在 `src/app/error.tsx` 與每個 API
route 的 `console.error` 處接入 Sentry capture。

## 還原 / Rollback

- Vercel 後台 → Deployments → 找到上一個 production deployment →
  Promote to Production
- `result` 分支的歷史：用 `git revert` 或 reset

## CDN / 快取

Vercel 自動提供：

- 靜態資產 → 永久快取
- 頁面 → SWR 機制
- API routes → 無快取（已自帶 in-memory cache）

## 監控

> 尚未整合。未來加入 Sentry / Plausible Analytics。
