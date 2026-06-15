export const CHART_PALETTE = [
  '#FB7299',
  '#03C9D7',
  '#7352FF',
  '#FF5C8E',
  '#1E4DB7',
  '#FB9678',
  '#1A97F5',
  '#00C292',
  '#FEC90F',
  '#0FC941',
] as const;

export type ChartPaletteColor = (typeof CHART_PALETTE)[number];
