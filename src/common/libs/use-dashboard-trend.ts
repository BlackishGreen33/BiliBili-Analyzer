/**
 * src/common/libs/use-dashboard-trend.ts
 *
 * useDashboardTrend — 跨日時序趨勢（時間序列資料）。
 */

import useSWR from 'swr';

export type TrendPoint = {
  file: string;
  date: string; // YYYY-MM-DD（UTC+8）
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagement: number;
  avgViews: number;
  duration: Array<{ label: string; count: number }>;
};

export type TrendData = {
  window: number;
  isMock: boolean;
  realCount: number;
  points: TrendPoint[];
};

export function useDashboardTrend(window: number) {
  return useSWR<TrendData>(`/api/dashboard/trend?window=${window}`);
}
