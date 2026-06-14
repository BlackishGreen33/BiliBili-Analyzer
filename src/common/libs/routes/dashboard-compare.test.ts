import { describe, expect, it } from 'vitest';

import type {
  CrawlVideo,
  DashboardAgg,
} from '@/common/libs/result-data.server';
import {
  buildChannelShift,
  buildTagShift,
  buildUpShift,
  type CompareTotals,
  computeDiff,
  computeTotalsDelta,
  extractBvidSets,
  totalsOf,
} from '@/common/libs/routes/dashboard-compare';

const v = (over: Partial<CrawlVideo> = {}): CrawlVideo => ({
  bvid: 'BV1',
  url: '',
  title: 't',
  UP: 'UP',
  mid: 1,
  views: 100,
  duration: 60,
  pubdate: 0,
  tags: { firstChannel: '游戏', secondChannel: '', ordinaryTags: [] },
  ...over,
});

const baseAgg = (over: Partial<DashboardAgg> = {}): DashboardAgg => ({
  file: 'f',
  time: 0,
  summary: {
    totalVideos: 10,
    totalUp: 5,
    totalViews: 1000,
    totalLike: 100,
    totalCoin: 10,
    totalFavorite: 20,
    totalReply: 5,
    totalDanmaku: 50,
    avgEngagement: 0.1,
  },
  channels: [],
  topUps: [],
  duration: [],
  hourHeatmap: [],
  topTags: [],
  topEngagement: [],
  ...over,
});

describe('extractBvidSets', () => {
  it('classifies bvids into new / dropped / persistent', () => {
    const a = [v({ bvid: '1' }), v({ bvid: '2' })];
    const b = [v({ bvid: '2' }), v({ bvid: '3' })];
    const r = extractBvidSets(a, b);
    expect(r.newBvids).toEqual(['3']);
    expect(r.droppedBvids).toEqual(['1']);
    expect(r.persistentBvids).toEqual(['2']);
    expect(r.persistentCount).toBe(1);
  });
});

describe('totalsOf', () => {
  it('computes totalEngagement as like + 2·coin + 2·favorite', () => {
    const t = totalsOf(baseAgg());
    expect(t.totalEngagement).toBe(100 + 20 + 40);
    expect(t.totalVideos).toBe(10);
  });
});

describe('computeTotalsDelta', () => {
  it('subtracts A from B for every field', () => {
    const tA: CompareTotals = {
      totalVideos: 5,
      totalUp: 3,
      totalViews: 100,
      totalEngagement: 50,
      avgEngagement: 0.1,
    };
    const tB: CompareTotals = {
      totalVideos: 8,
      totalUp: 4,
      totalViews: 200,
      totalEngagement: 80,
      avgEngagement: 0.2,
    };
    expect(computeTotalsDelta(tA, tB)).toEqual({
      totalVideos: 3,
      totalUp: 1,
      totalViews: 100,
      totalEngagement: 30,
      avgEngagement: 0.1,
    });
  });
});

describe('buildChannelShift', () => {
  it('handles disjoint channels (A only / B only)', () => {
    const a = baseAgg({
      channels: [
        {
          firstChannel: '游戏',
          count: 5,
          views: 0,
          avgViews: 0,
          like: 0,
          coin: 0,
          favorite: 0,
          secondChannels: [],
        },
      ],
    });
    const b = baseAgg({
      channels: [
        {
          firstChannel: '知识',
          count: 3,
          views: 0,
          avgViews: 0,
          like: 0,
          coin: 0,
          favorite: 0,
          secondChannels: [],
        },
      ],
    });
    const shift = buildChannelShift(a, b);
    expect(shift.length).toBe(2);
    expect(shift[0].firstChannel).toBe('游戏');
    expect(shift[0].delta).toBe(-5);
  });

  it('handles overlap with positive and negative deltas', () => {
    const a = baseAgg({
      channels: [
        {
          firstChannel: '游戏',
          count: 5,
          views: 0,
          avgViews: 0,
          like: 0,
          coin: 0,
          favorite: 0,
          secondChannels: [],
        },
      ],
    });
    const b = baseAgg({
      channels: [
        {
          firstChannel: '游戏',
          count: 7,
          views: 0,
          avgViews: 0,
          like: 0,
          coin: 0,
          favorite: 0,
          secondChannels: [],
        },
      ],
    });
    const shift = buildChannelShift(a, b);
    expect(shift[0].delta).toBe(2);
  });
});

describe('buildUpShift', () => {
  it('unions UP by mid ?? name and computes delta', () => {
    const a = baseAgg({
      topUps: [{ name: 'UP1', mid: 1, count: 5, views: 0 }],
    });
    const b = baseAgg({
      topUps: [{ name: 'UP1', mid: 1, count: 8, views: 0 }],
    });
    const shift = buildUpShift(a, b);
    expect(shift[0].delta).toBe(3);
  });

  it('falls back to name when mid is undefined', () => {
    const a = baseAgg({
      topUps: [{ name: 'NoMid', count: 2, views: 0 }],
    });
    const b = baseAgg({
      topUps: [{ name: 'NoMid', count: 5, views: 0 }],
    });
    const shift = buildUpShift(a, b);
    expect(shift[0].delta).toBe(3);
  });

  it('drops entries that are zero on both sides', () => {
    const a = baseAgg({
      topUps: [{ name: 'A', mid: 1, count: 1, views: 0 }],
    });
    const b = baseAgg({
      topUps: [{ name: 'B', mid: 2, count: 1, views: 0 }],
    });
    const shift = buildUpShift(a, b);
    expect(shift.length).toBe(2);
  });

  it('limits to N entries', () => {
    const topUps = Array.from({ length: 50 }, (_, i) => ({
      name: `UP${i}`,
      mid: i,
      count: 1,
      views: 0,
    }));
    const a = baseAgg({ topUps });
    const b = baseAgg({ topUps: [] });
    const shift = buildUpShift(a, b, 5);
    expect(shift.length).toBe(5);
  });
});

describe('buildTagShift', () => {
  it('diffs tag sets', () => {
    const a = baseAgg({
      topTags: [
        { tag: 'a', count: 1 },
        { tag: 'b', count: 1 },
      ],
    });
    const b = baseAgg({
      topTags: [
        { tag: 'b', count: 1 },
        { tag: 'c', count: 1 },
      ],
    });
    const shift = buildTagShift(a, b);
    expect(shift.newTags).toEqual(['c']);
    expect(shift.droppedTags).toEqual(['a']);
    expect(shift.commonTags).toBe(1);
  });
});

describe('computeDiff (integration)', () => {
  it('assembles all 4 helpers into a diff object', () => {
    const aRaw = [v({ bvid: '1' })];
    const bRaw = [v({ bvid: '1' }), v({ bvid: '2' })];
    const aAgg = baseAgg();
    const bAgg = baseAgg();
    const diff = computeDiff(aRaw, bRaw, aAgg, bAgg);
    expect(diff.newBvids).toEqual(['2']);
    expect(diff.persistentCount).toBe(1);
    expect(diff.totalsDelta.totalVideos).toBe(0);
    expect(diff.channelShift).toBeDefined();
    expect(diff.upShift).toBeDefined();
    expect(diff.tagShift).toBeDefined();
  });
});
