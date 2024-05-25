const path = require('path');

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`;

module.exports = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand], // ESLint 校验
  '**/*.{js,jsx,tsx,ts,less,md,json}': ['prettier --write'], // prettier 格式化
};
