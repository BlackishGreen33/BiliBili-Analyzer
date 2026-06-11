module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix --no-warn-ignored'],
  '**/*.{js,jsx,tsx,ts,less,md,json}': ['prettier --write'],
};
