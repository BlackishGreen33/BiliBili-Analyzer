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
        '**/*.d.ts',
        '**/*.config.{js,ts,mjs,cjs}',
        '**/*.test.{ts,tsx}',
        'src/common/styles/**',
        'src/app/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/**/not-found.tsx',
        'src/common/components/ui/**',
        'src/common/components/icons/**',
        'src/common/providers/**',
        'src/modules/Home/index.ts',
        'src/modules/Detail/index.ts',
        'src/modules/Search/index.ts',
        'scripts/**',
        'src/app/api/dev/**',
      ],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 80,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
