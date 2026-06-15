/**
 * src/common/libs/routes/trend.ts
 *
 * 給 `/api/dashboard/trend` route 用的純函數。
 */

import type { DashboardAgg } from '@/common/libs/result-data.server';
import type { StreamEvent } from '@/common/libs/streaming';
import { dateStringUTC8 } from '@/common/utils/date';

// Re-export for backwards compatibility (consumers in tests still reference it).
export { dateStringUTC8 };

export type TrendPoint = {
  file: string;
  date: string;
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagement: number;
  avgViews: number;
  duration: Array<{ label: string; count: number }>;
};

export type TrendPayload = {
  window: number;
  isMock: boolean;
  realCount: number;
  points: TrendPoint[];
};

export function buildTrendPoint(
  file: string,
  time: number,
  agg: Omit<DashboardAgg, 'file' | 'time'>
): TrendPoint {
  const totalEngagement =
    agg.summary.totalLike +
    agg.summary.totalCoin * 2 +
    agg.summary.totalFavorite * 2;
  return {
    file,
    date: dateStringUTC8(time),
    totalVideos: agg.summary.totalVideos,
    totalUp: agg.summary.totalUp,
    totalViews: agg.summary.totalViews,
    totalEngagement,
    avgEngagement: agg.summary.avgEngagement,
    avgViews:
      agg.summary.totalVideos > 0
        ? Math.round(agg.summary.totalViews / agg.summary.totalVideos)
        : 0,
    duration: agg.duration.map((b) => ({ label: b.label, count: b.count })),
  };
}

export function payloadToEvents(payload: TrendPayload): StreamEvent[] {
  const events: StreamEvent[] = [
    {
      type: 'meta',
      window: payload.window,
      isMock: payload.isMock,
      realCount: payload.realCount,
    },
  ];
  for (const p of payload.points) {
    events.push({ type: 'chunk', data: p });
  }
  events.push({ type: 'done', pointCount: payload.points.length });
  return events;
}
