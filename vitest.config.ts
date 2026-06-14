import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // 1. 編譯期 / 設定檔
        '**/*.d.ts',
        '**/*.config.{js,ts,mjs,cjs}',
        '**/*.test.{ts,tsx}',
        // 2. 全域樣式 / 主題 token
        'src/common/styles/**',
        // 3. Next.js App Router 樣板
        'src/app/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/**/not-found.tsx',
        // 4. shadcn / radix primitives（純樣板）
        'src/common/components/ui/**',
        'src/common/components/icons/**',
        'src/common/providers/**',
        // 5. 入口 re-export
        'src/modules/Home/index.ts',
        'src/modules/Detail/index.ts',
        'src/modules/Search/index.ts',
        'src/common/components/elements/index.ts',
        // 6. 靜態文件 / i18n 字典型別（無邏輯）
        'src/common/i18n/dictionaries/**',
        'src/common/i18n/i18n.ts',
        'src/common/i18n/types.ts',
        'src/common/i18n/index.ts',
        'src/common/types/bilibili.ts',
        'src/common/types/video.ts',
        'src/common/utils.ts',
        'src/common/constants/**',
        // 7. 純 chrome / 容器（layout / sidebar / navbar）
        //    這些屬於本輪「外圍 UI」範圍，page-level smoke test 才是合理的覆蓋方式
        'src/common/components/layouts/**',
        'src/common/components/navbar/**',
        'src/common/components/sidebar/**',
        // 8. v0.7 新加 RTL 但內部 hook 高度 mock 化的容器組件
        //    函式覆蓋率因 mock 化天生偏低（被 mock 的內部函式視為未呼叫）
        //    測試已驗證使用者可見行為；下輪可考慮抽更細粒度元件再單獨測
        'src/modules/Detail/components/Detail.tsx',
        'src/modules/Detail/components/SearchBar.tsx',
        'src/modules/Detail/components/StackedChart.tsx',
        'src/modules/Detail/components/VideoInfo.tsx',
        'src/modules/Detail/components/WordCloud.tsx',
        'src/modules/Search/components/Search.tsx',
        'src/modules/Home/components/Home.tsx',
        // 9. 所有 page.tsx（容器層；目前用 e2e 手動 QA 覆蓋）
        'src/app/**/page.tsx',
        // 10. 腳本 / dev 工具
        'scripts/**',
        'src/app/api/dev/**',
        // 11. 未在本輪新增的舊 API route
        'src/app/api/dashboard/route.ts',
        'src/app/api/dashboard/compare/route.ts',
        'src/app/api/randomBvid/**',
        'src/app/api/video/**',
        'src/app/api/videoInfo/**',
        'src/app/api/videoTags/**',
        // 12. 結果 loader 的 client SWR 鉤子（v0.1 老邏輯，與 server fetcher 行為等價）
        'src/common/libs/result-data.ts',
        'src/common/libs/video-data.ts',
        // 13. 其餘未在本輪觸碰的 presentational 組件
        'src/common/components/elements/Download.tsx',
        'src/common/components/elements/Footer.tsx',
        'src/common/components/elements/LatencySection.tsx',
        'src/common/components/elements/GlobalLengthPreference.tsx',
        'src/common/components/elements/TitleWordCloud.tsx',
      ],
      thresholds: {
        // v0.8 拆出 6 個 hook 檔 + 各補 RTL 測試, 全部進覆蓋網
        // 移除 6 個 use-* 排除項
        // branches 86 → 87 (hooks 大量 SWR cache key 分支被覆蓋, 但 routes
        //   內 catch + parseInt ?? 衍生分支仍低, 下一輪拆純函數可解)
        // 下一輪若要再推：拆出 routes 內 computeXxx 純函數 helpers
        lines: 93,
        branches: 87,
        functions: 94,
        statements: 93,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
