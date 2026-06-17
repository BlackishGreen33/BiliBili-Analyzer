import next from 'eslint-config-next';
import reactPlugin from 'eslint-plugin-react';

const simpleImportSort = (await import('eslint-plugin-simple-import-sort'))
  .default;
const unusedImports = (await import('eslint-plugin-unused-imports')).default;
const tsPlugin = (await import('@typescript-eslint/eslint-plugin')).default;

const config = [
  ...next,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'public/**',
      'scripts/**',
      'CrawlPopular.cjs',
      'CrawlPopular.mjs',
      'src/common/aggregations/build.mjs',
      'src/common/aggregations/build.test.mjs',
      '.github/skills/**',
      '.agents/skills/**',
      'android/app/src/main/assets/**',
      'ios/App/App/public/**',
    ],
  },
  {
    plugins: {
      react: reactPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      '@typescript-eslint': tsPlugin,
    },
  },
  {
    rules: {
      'no-console': 'warn',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'react/jsx-curly-brace-presence': [
        'warn',
        { props: 'never', children: 'never' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/exports': 'warn',
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            ['^@?\\w', '^\\u0000'],
            ['^.+\\.s?css$'],
            ['^@/libs', '^@/hooks'],
            ['^@/data'],
            ['^@/components', '^@/container'],
            ['^@/store'],
            ['^@/'],
            [
              '^\\./?$',
              '^\\.(?!/?$)',
              '^\\.\\./?$',
              '^\\.\\.(?!/?$)',
              '^\\.\\./\\.\\./?$',
              '^\\.\\./\\.\\.(?!/?$)',
              '^\\.\\./\\.\\./\\.\\./?$',
              '^\\.\\./\\.\\./\\.\\.(?!/?$)',
            ],
            ['^@/types'],
            ['^'],
          ],
        },
      ],
    },
  },
];

export default config;
