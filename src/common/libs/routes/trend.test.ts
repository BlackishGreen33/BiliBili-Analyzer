import { describe, expect, it } from 'vitest';

import {
  buildTrendPoint,
  dateStringUTC8,
  payloadToEvents,
  type TrendPayload,
} from '@/common/libs/routes/trend';

describe('dateStringUTC8', () => {
  it('formats Unix ms as YYYY-MM-DD in UTC+8', () => {
    // 2025-01-15 00:00:00 UTC == 2025-01-15 08:00:00 UTC+8
    expect(dateStringUTC8(Date.UTC(2025, 0, 15, 0, 0, 0))).toBe('2025-01-15');
  });

  it('rolls date forward when UTC time is past 16:00 (i.e. past midnight UTC+8)', () => {
    // 2025-01-15 17:00:00 UTC == 2025-01-16 01:00:00 UTC+8
    expect(dateStringUTC8(Date.UTC(2025, 0, 15, 17, 0, 0))).toBe('2025-01-16');
  });

  it('handles zero', () => {
    expect(dateStringUTC8(0)).toMatch(/^1970-01-01$/);
  });
});

const fakeAgg = {
  summary: {
    totalVideos: 100,
    totalUp: 50,
    totalViews: 1_000_000,
    totalLike: 5_000,
    totalCoin: 500,
    totalFavorite: 1_000,
    totalReply: 200,
    totalDanmaku: 2_000,
    avgEngagement: 0.01,
  },
  channels: [],
  topUps: [],
  duration: [
    { label: '<1 分钟', min: 0, max: 60, count: 5 },
    { label: '>30 分钟', min: 1800, max: Infinity, count: 1 },
  ],
  hourHeatmap: [],
  topTags: [],
  topEngagement: [],
};

describe('buildTrendPoint', () => {
  it('computes totalEngagement as like + 2·coin + 2·favorite', () => {
    const p = buildTrendPoint(
      '2025-01-15',
      Date.UTC(2025, 0, 15, 0, 0, 0),
      fakeAgg
    );
    expect(p.totalEngagement).toBe(5000 + 1000 + 2000);
    expect(p.file).toBe('2025-01-15');
    expect(p.date).toBe('2025-01-15');
  });

  it('avgViews rounds to integer', () => {
    const p = buildTrendPoint('f', Date.now(), fakeAgg);
    expect(p.avgViews).toBe(10000);
  });

  it('avgViews is 0 when totalVideos is 0', () => {
    const p = buildTrendPoint('f', Date.now(), {
      ...fakeAgg,
      summary: { ...fakeAgg.summary, totalVideos: 0, totalViews: 0 },
    });
    expect(p.avgViews).toBe(0);
  });

  it('preserves duration buckets verbatim', () => {
    const p = buildTrendPoint('f', Date.now(), fakeAgg);
    expect(p.duration).toEqual([
      { label: '<1 分钟', count: 5 },
      { label: '>30 分钟', count: 1 },
    ]);
  });
});

describe('trend payloadToEvents', () => {
  const payload: TrendPayload = {
    window: 7,
    isMock: false,
    realCount: 7,
    points: [],
  };

  it('emits meta + done when no points', () => {
    const events = payloadToEvents(payload);
    expect(events[0]).toEqual({
      type: 'meta',
      window: 7,
      isMock: false,
      realCount: 7,
    });
    expect(events[1]).toEqual({ type: 'done', pointCount: 0 });
  });

  it('emits one chunk per point', () => {
    const events = payloadToEvents({
      ...payload,
      points: [
        {
          file: 'a',
          date: '2025-01-15',
          totalVideos: 1,
          totalUp: 1,
          totalViews: 1,
          totalEngagement: 1,
          avgEngagement: 1,
          avgViews: 1,
          duration: [],
        },
        {
          file: 'b',
          date: '2025-01-16',
          totalVideos: 1,
          totalUp: 1,
          totalViews: 1,
          totalEngagement: 1,
          avgEngagement: 1,
          avgViews: 1,
          duration: [],
        },
      ],
    });
    expect(events[0].type).toBe('meta');
    expect(events[1]).toEqual({
      type: 'chunk',
      data: expect.objectContaining({ file: 'a' }),
    });
    expect(events[2]).toEqual({
      type: 'chunk',
      data: expect.objectContaining({ file: 'b' }),
    });
    expect(events[3]).toEqual({ type: 'done', pointCount: 2 });
  });
});
