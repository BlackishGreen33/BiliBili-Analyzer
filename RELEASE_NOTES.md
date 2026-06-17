# v1.1.0 Release Notes

## ✨ 主要內容 / Highlights

- **行動端（Android）**：基於 Capacitor 8 重建並打包，產出 `BiliBili-Analyzer-v1.1.0.apk` 與 `...-v1.1.0.aab`（debug keystore 簽名）
- **Chrome 瀏覽器插件**：源碼從舊的 `chrome-extension` 分支搬遷到 `main/extension/`，包成 zip 取代舊版 `.rar`
- **iOS（Ad Hoc IPA）**：首次出 iOS 殼，由維護者本地手動 archive 後上傳

## 🐛 修復 / Fixes

- `fix(api)`：保留 `+` 在檔名查詢參數中（不再被解碼為空白）
- `fix(schema)`：兼容舊 Puppeteer 時代缺少 `bvid` 的資料
- `fix(workflow)`：修復 `result` 分支 sparse-checkout 導致 crawler 看不到 list.json

## ♻️ 重構 / Refactors

- `refactor(search)`：拆 `useSearchFilters` 為 `useSearchState` + `useSearchFilters`
- `refactor(search)`：拆 `Search.tsx` 為 `FilterPanel` + `VideoGrid` + `VideoCard`
- `refactor(dashboard)`：拆 `dashboard/page.tsx` 為 `modules/Dashboard/`
- `refactor(compare)`：拆 `compare/page.tsx` 為 `modules/Compare/`
- `perf(wordcloud)`：用 `next/dynamic` lazy-load `react-d3-cloud`
- `feat(swr)`：`SWRConfig` 預設 fetcher，移除重複的 hook fetcher
- `perf(api)`：`/api/dashboard` 直接讀預聚合的 `agg-latest.json`
- `perf(api)`：`createCachedRoute` helper 統一 7 條 analytics route
- `chore(types)`：啟用 `noUncheckedIndexedAccess`
- `chore(shared)`：抽出 UTC+8 日期 helpers
- `chore(constants)`：集中 `CHART_PALETTE` 與 `SUPPORTED_LOCALES`

## 🧪 測試 / Tests

- `test(e2e)`：Playwright 4 個頁面 + 9 個 API route smoke
- `test`：補齊單元測試覆蓋率

## 🏗️ 構建基礎設施 / Build Infra

- `feat(workflow)`：新增 `.github/workflows/release.yml`，打 `v*.*.*` tag
  自動 build Android（APK + AAB）+ 打包 Chrome extension + 建立 GitHub Release
- `fix(scripts)`：`scripts/build-mobile.mjs` 修正 `copyFile(..., 'utf-8')`
  還原失敗的 bug（改為 `writeFile` 還原 in-memory content）
- `fix(scripts)`：`build:mobile` 自動暫存 / 還原 `src/app/api/`，繞過
  `output: "export"` 不支援 dynamic route handler 的限制
- `refactor(layout)`：移除 server 階段 `cookies()` 讀取，改由 client 端
  `HtmlAttrs` 在 hydration 後同步 `<html lang>` 與 `--accent-color`
  （首次渲染會以 `zh-CN` / `#FB7299` 為預設）

## 📦 下載 / Downloads

| 平台 Platform | 文件 File                                       |
| ------------- | ----------------------------------------------- |
| Android (APK) | `BiliBili-Analyzer-v1.1.0.apk`                  |
| Android (AAB) | `BiliBili-Analyzer-v1.1.0.aab`                  |
| iOS (Ad Hoc)  | `BiliBili-Analyzer-iOS-v1.1.0.ipa`              |
| Chrome 插件   | `BiliBili-Analyzer-Chrome-Extension-v1.1.0.zip` |

## 📱 安裝方式 / Install

- **Android APK**：下載後允許「未知來源」安裝 / Enable "Install unknown apps" first
- **Android AAB**：上傳 Google Play Console / Upload to Google Play Console
- **iOS IPA（Ad Hoc）**：需將裝置 UDID 加入 Provisioning Profile，透過 Xcode / Apple Configurator 安裝
- **Chrome 插件**：`chrome://extensions` → 開發者模式 → 載入解壓後的資料夾 / Load unpacked

## 🌐 Web

主站不變，仍在 <https://bilibili-analyzer.vercel.app>，Vercel 會在 `main` push
後自動部署 production。
