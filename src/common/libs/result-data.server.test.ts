import { describe, expect, it } from 'vitest';

import {
  buildAggregations,
  type CrawlVideo,
} from '@/common/libs/result-data.server';

const makeVideo = (over: Partial<CrawlVideo> = {}): CrawlVideo => ({
  bvid: 'BV1wEEg62EDP',
  url: 'https://www.bilibili.com/video/BV1wEEg62EDP',
  title: '原神 5.0 评测',
  UP: '某UP主',
  mid: 1,
  views: 100000,
  duration: 600,
  pubdate: Math.floor(Date.now() / 1000) - 86400,
  tags: {
    firstChannel: '游戏',
    secondChannel: '单机游戏',
    ordinaryTags: ['原神', '评测'],
  },
  statLike: 1000,
  statCoin: 100,
  statFavorite: 200,
  statReply: 50,
  statDanmaku: 500,
  statShare: 10,
  ...over,
});

describe('buildAggregations', () => {
  it('handles an empty array', () => {
    const agg = buildAggregations([]);
    expect(agg.summary.totalVideos).toBe(0);
    expect(agg.summary.totalUp).toBe(0);
    expect(agg.summary.totalViews).toBe(0);
    expect(agg.summary.avgEngagement).toBe(0);
    expect(agg.channels).toEqual([]);
    expect(agg.topUps).toEqual([]);
    expect(agg.topTags).toEqual([]);
    expect(agg.topEngagement).toEqual([]);
    expect(agg.duration.reduce((a, b) => a + b.count, 0)).toBe(0);
    expect(agg.hourHeatmap.reduce((a, b) => a + b.count, 0)).toBe(0);
  });

  it('sums views, likes, coins, favorites correctly', () => {
    const agg = buildAggregations([makeVideo(), makeVideo(), makeVideo()]);
    expect(agg.summary.totalVideos).toBe(3);
    expect(agg.summary.totalViews).toBe(300_000);
    expect(agg.summary.totalLike).toBe(3000);
    expect(agg.summary.totalCoin).toBe(300);
    expect(agg.summary.totalFavorite).toBe(600);
  });

  it('computes weighted avgEngagement', () => {
    // engagement = (like + 2·coin + 2·favorite + share) / view
    // per video: (1000 + 200 + 400 + 10) / 100000 = 1610/100000 = 0.0161
    const agg = buildAggregations([makeVideo()]);
    expect(agg.summary.avgEngagement).toBeCloseTo(0.0161, 3);
  });

  it('avgEngagement handles zero views', () => {
    const agg = buildAggregations([makeVideo({ views: 0 })]);
    expect(agg.summary.avgEngagement).toBe(0);
  });

  it('aggregates channels by firstChannel', () => {
    const agg = buildAggregations([
      makeVideo({
        bvid: 'BV1',
        tags: { firstChannel: '游戏', secondChannel: 'a', ordinaryTags: [] },
      }),
      makeVideo({
        bvid: 'BV2',
        tags: { firstChannel: '游戏', secondChannel: 'a', ordinaryTags: [] },
      }),
      makeVideo({
        bvid: 'BV3',
        tags: { firstChannel: '动画', secondChannel: 'b', ordinaryTags: [] },
      }),
    ]);
    const game = agg.channels.find((c) => c.firstChannel === '游戏');
    const anime = agg.channels.find((c) => c.firstChannel === '动画');
    expect(game?.count).toBe(2);
    expect(anime?.count).toBe(1);
  });

  it('falls back to "未分类" when firstChannel is empty', () => {
    const agg = buildAggregations([
      makeVideo({
        tags: { firstChannel: '', secondChannel: 'a', ordinaryTags: [] },
      }),
    ]);
    expect(agg.channels[0].firstChannel).toBe('未分类');
  });

  it('aggregates UPs by mid', () => {
    const agg = buildAggregations([
      makeVideo({ bvid: 'BV1', mid: 100, UP: 'A' }),
      makeVideo({ bvid: 'BV2', mid: 100, UP: 'A' }),
      makeVideo({ bvid: 'BV3', mid: 200, UP: 'B' }),
    ]);
    const upA = agg.topUps.find((u) => u.mid === 100);
    const upB = agg.topUps.find((u) => u.mid === 200);
    expect(upA?.count).toBe(2);
    expect(upB?.count).toBe(1);
  });

  it('skips videos with no UP and no mid', () => {
    const agg = buildAggregations([
      makeVideo({ bvid: 'BV1', mid: undefined, UP: '' }),
      makeVideo({ bvid: 'BV2', mid: 100, UP: 'A' }),
    ]);
    expect(agg.summary.totalUp).toBe(1);
  });

  it('buckets durations correctly', () => {
    const agg = buildAggregations([
      makeVideo({ duration: 30 }), // <1 min (bucket 0)
      makeVideo({ duration: 120 }), // 1-3 min (bucket 1)
      makeVideo({ duration: 500 }), // 5-10 min (bucket 3)
      makeVideo({ duration: 1500 }), // 20-30 min (bucket 5)
    ]);
    const buckets = agg.duration;
    expect(buckets[0].count).toBe(1); // <1 分钟
    expect(buckets[1].count).toBe(1); // 1-3 分钟
    expect(buckets[3].count).toBe(1); // 5-10 分钟
    expect(buckets[5].count).toBe(1); // 20-30 分钟
  });

  it('handles missing duration as falling into <1 min bucket', () => {
    // duration undefined → 0 → bucket 0 (<1 分钟)
    const agg = buildAggregations([makeVideo({ duration: undefined })]);
    expect(agg.duration[0].count).toBe(1);
  });

  it('counts top tags', () => {
    const agg = buildAggregations([
      makeVideo({
        tags: {
          firstChannel: 'a',
          secondChannel: 'b',
          ordinaryTags: ['原神', '游戏'],
        },
      }),
      makeVideo({
        tags: { firstChannel: 'a', secondChannel: 'b', ordinaryTags: ['原神'] },
      }),
    ]);
    const yuanshen = agg.topTags.find((t) => t.tag === '原神');
    expect(yuanshen?.count).toBe(2);
  });

  it('produces topEngagement sorted desc', () => {
    const agg = buildAggregations([
      makeVideo({
        bvid: 'BV1',
        views: 1000,
        statLike: 100,
        statCoin: 0,
        statFavorite: 0,
        statShare: 0,
      }),
      makeVideo({
        bvid: 'BV2',
        views: 100,
        statLike: 100,
        statCoin: 0,
        statFavorite: 0,
        statShare: 0,
      }),
      makeVideo({
        bvid: 'BV3',
        views: 10000,
        statLike: 100,
        statCoin: 50,
        statFavorite: 50,
        statShare: 0,
      }),
    ]);
    expect(agg.topEngagement[0].bvid).toBe('BV2'); // engagement 1.0 > 0.02 > 0.015
  });

  it('topEngagement excludes videos with 0 views', () => {
    const agg = buildAggregations([makeVideo({ bvid: 'BV1', views: 0 })]);
    expect(agg.topEngagement).toEqual([]);
  });

  it('limits topEngagement to 10 items', () => {
    const vids = Array.from({ length: 20 }, (_, i) =>
      makeVideo({ bvid: `BV${i}`, views: 100 })
    );
    const agg = buildAggregations(vids);
    expect(agg.topEngagement.length).toBe(10);
  });

  it('handles NaN / undefined stats safely', () => {
    const agg = buildAggregations([
      makeVideo({
        statLike: undefined as unknown as number,
        statCoin: undefined as unknown as number,
        statFavorite: undefined as unknown as number,
        statShare: undefined as unknown as number,
      }),
    ]);
    expect(agg.summary.totalLike).toBe(0);
    expect(agg.summary.avgEngagement).toBe(0);
  });

  it('handles missing pubdate (no hour bucketing)', () => {
    const agg = buildAggregations([makeVideo({ pubdate: 0 })]);
    const total = agg.hourHeatmap.reduce((a, b) => a + b.count, 0);
    expect(total).toBe(0);
  });
});
