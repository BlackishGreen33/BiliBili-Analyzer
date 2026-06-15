/**
 * src/common/aggregations/build.test.mjs
 *
 * Pure JS test of buildAggregations. Asserts the output shape matches the
 * server-side expectations (test/result-data.server.test.ts in TS already
 * exercises the same logic via the same .mjs implementation, but this file
 * runs without TS compilation as a fast sanity check during crawler runs).
 *
 * Run with: node --test src/common/aggregations/build.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAggregations } from './build.mjs';

function makeVideo(over = {}) {
  return {
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
  };
}

test('handles empty array', () => {
  const agg = buildAggregations([]);
  assert.equal(agg.summary.totalVideos, 0);
  assert.equal(agg.summary.totalUp, 0);
  assert.equal(agg.summary.totalViews, 0);
  assert.equal(agg.summary.avgEngagement, 0);
  assert.deepEqual(agg.channels, []);
  assert.deepEqual(agg.topUps, []);
  assert.deepEqual(agg.topTags, []);
  assert.deepEqual(agg.topEngagement, []);
  assert.equal(agg.duration.reduce((a, b) => a + b.count, 0), 0);
  assert.equal(agg.hourHeatmap.reduce((a, b) => a + b.count, 0), 0);
});

test('aggregates summary counters', () => {
  const agg = buildAggregations([makeVideo(), makeVideo(), makeVideo()]);
  assert.equal(agg.summary.totalVideos, 3);
  assert.equal(agg.summary.totalViews, 300_000);
  assert.equal(agg.summary.totalLike, 3000);
  assert.equal(agg.summary.totalCoin, 300);
  assert.equal(agg.summary.totalFavorite, 600);
});

test('avgEngagement = (like + 2*coin + 2*favorite + share) / view', () => {
  const agg = buildAggregations([makeVideo()]);
  const expected = (1000 + 200 + 400 + 10) / 100000;
  assert.ok(Math.abs(agg.summary.avgEngagement - expected) < 1e-9);
});

test('avgEngagement = 0 when no views', () => {
  const agg = buildAggregations([makeVideo({ views: 0 })]);
  assert.equal(agg.summary.avgEngagement, 0);
});

test('aggregates channels by firstChannel', () => {
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
  assert.equal(game?.count, 2);
  assert.equal(anime?.count, 1);
});

test('falls back to 未分类 when firstChannel empty', () => {
  const agg = buildAggregations([
    makeVideo({
      tags: { firstChannel: '', secondChannel: 'a', ordinaryTags: [] },
    }),
  ]);
  assert.equal(agg.channels[0].firstChannel, '未分类');
});

test('channels sorted by count desc', () => {
  const agg = buildAggregations([
    makeVideo({
      bvid: 'BV1',
      tags: { firstChannel: 'A', secondChannel: 'x', ordinaryTags: [] },
    }),
    makeVideo({
      bvid: 'BV2',
      tags: { firstChannel: 'B', secondChannel: 'y', ordinaryTags: [] },
    }),
    makeVideo({
      bvid: 'BV3',
      tags: { firstChannel: 'B', secondChannel: 'y', ordinaryTags: [] },
    }),
    makeVideo({
      bvid: 'BV4',
      tags: { firstChannel: 'B', secondChannel: 'z', ordinaryTags: [] },
    }),
  ]);
  // B has 3, A has 1
  assert.equal(agg.channels[0].firstChannel, 'B');
  assert.equal(agg.channels[1].firstChannel, 'A');
});

test('topUps grouped by mid', () => {
  const agg = buildAggregations([
    makeVideo({ bvid: 'BV1', mid: 100, UP: 'A' }),
    makeVideo({ bvid: 'BV2', mid: 100, UP: 'A' }),
    makeVideo({ bvid: 'BV3', mid: 200, UP: 'B' }),
  ]);
  const upA = agg.topUps.find((u) => u.mid === 100);
  const upB = agg.topUps.find((u) => u.mid === 200);
  assert.equal(upA?.count, 2);
  assert.equal(upB?.count, 1);
});

test('topUps limit = 30', () => {
  const vids = Array.from({ length: 50 }, (_, i) =>
    makeVideo({ bvid: `BV${i}`, mid: i + 1, UP: `U${i}` })
  );
  const agg = buildAggregations(vids);
  assert.equal(agg.topUps.length, 30);
});

test('topTags limit = 60', () => {
  const vids = Array.from({ length: 100 }, (_, i) =>
    makeVideo({
      bvid: `BV${i}`,
      tags: {
        firstChannel: 'a',
        secondChannel: 'b',
        ordinaryTags: [`tag-${i % 80}`],
      },
    })
  );
  const agg = buildAggregations(vids);
  assert.equal(agg.topTags.length, 60);
});

test('topEngagement excludes 0-view videos', () => {
  const agg = buildAggregations([makeVideo({ bvid: 'BV1', views: 0 })]);
  assert.deepEqual(agg.topEngagement, []);
});

test('topEngagement capped at 10', () => {
  const vids = Array.from({ length: 20 }, (_, i) =>
    makeVideo({ bvid: `BV${i}`, views: 100 })
  );
  const agg = buildAggregations(vids);
  assert.equal(agg.topEngagement.length, 10);
});

test('handles missing/NaN stats safely', () => {
  const agg = buildAggregations([
    makeVideo({
      statLike: undefined,
      statCoin: undefined,
      statFavorite: undefined,
      statShare: undefined,
    }),
  ]);
  assert.equal(agg.summary.totalLike, 0);
  assert.equal(agg.summary.avgEngagement, 0);
});

test('handles missing pubdate (no hour bucketing)', () => {
  const agg = buildAggregations([makeVideo({ pubdate: 0 })]);
  const total = agg.hourHeatmap.reduce((a, b) => a + b.count, 0);
  assert.equal(total, 0);
});

test('buckets durations correctly', () => {
  const agg = buildAggregations([
    makeVideo({ duration: 30 }),
    makeVideo({ duration: 120 }),
    makeVideo({ duration: 500 }),
    makeVideo({ duration: 1500 }),
  ]);
  assert.equal(agg.duration[0].count, 1);
  assert.equal(agg.duration[1].count, 1);
  assert.equal(agg.duration[3].count, 1);
  assert.equal(agg.duration[5].count, 1);
});
