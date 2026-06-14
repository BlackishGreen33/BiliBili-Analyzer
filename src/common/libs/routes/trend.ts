/**
 * src/common/libs/routes/trend.ts
 *
 * 給 `/api/dashboard/trend` route 用的純函數。
 */

import type { DashboardAgg } from '@/common/libs/result-data.server';
import type { StreamEvent } from '@/common/libs/streaming';

/**
 * 從爬取時刻 (Unix ms) 取 UTC+8 的 YYYY-MM-DD 字串。
 */
export function dateStringUTC8(time: number): string {
  const d = new Date(time + 8 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

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
