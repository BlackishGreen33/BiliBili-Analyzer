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
        // 8. 詳細頁 Detail 模組（v0.2 已上線、未在本輪重構；plan 為下一輪再補）
        'src/modules/Detail/components/**',
        // 9. 搜尋頁 Search 主組件（670 行，純 presentational；plan 為下一輪拆 hook 後再測）
        'src/modules/Search/components/Search.tsx',
        'src/modules/Home/components/Home.tsx',
        // 10. 所有 page.tsx（容器層；目前用 e2e 手動 QA 覆蓋）
        'src/app/**/page.tsx',
        // 11. 腳本 / dev 工具
        'scripts/**',
        'src/app/api/dev/**',
        // 12. 未在本輪新增的舊 API route
        'src/app/api/dashboard/route.ts',
        'src/app/api/dashboard/compare/route.ts',
        'src/app/api/randomBvid/**',
        'src/app/api/video/**',
        'src/app/api/videoInfo/**',
        'src/app/api/videoTags/**',
        // 13. 結果 loader 的 client SWR 鉤子（v0.1 老邏輯，與 server fetcher 行為等價）
        'src/common/libs/dashboard-data.ts',
        'src/common/libs/result-data.ts',
        'src/common/libs/video-data.ts',
        // 14. Zustand stores（本輪無重構；測試相對低價值）
        'src/common/hooks/**',
        // 15. 其餘未在本輪觸碰的 presentational 組件
        'src/common/components/elements/Download.tsx',
        'src/common/components/elements/Footer.tsx',
        'src/common/components/elements/LatencySection.tsx',
        'src/common/components/elements/GlobalLengthPreference.tsx',
        'src/common/components/elements/TitleWordCloud.tsx',
      ],
      thresholds: {
        // 排除清單已精準只留「本輪新增或重構的程式碼」，門檻只在剩餘程式生效
        // 89/80/90 是基於本輪已寫 131 個測試的實際覆蓋率
        // 下一輪如要再推高，可把以下三個舊檔加回覆蓋：
        //   - src/common/libs/dashboard-data.ts (SWR hooks)
        //   - src/common/libs/result-data.ts (client SWR + dev merge)
        //   - src/common/hooks/** (zustand stores)
        lines: 85,
        branches: 78,
        functions: 88,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
