/**
 * src/common/aggregations/build.mjs
 *
 * Pure JS aggregation logic — shared between CrawlPopular.mjs (server-side
 * crawler writing agg-latest.json) and src/common/libs/result-data.server.ts
 * (Next.js API routes). Bug fixes happen in one place.
 *
 * Behavior is aligned to the original result-data.server.ts implementation
 * (topUps top 30, topTags top 60, channels sorted by count desc). Crawler's
 * previous looser limits (50/100/insertion-order) are dropped so agg-latest
 * and on-the-fly aggregations are byte-for-byte identical.
 */

const DEFAULT_CHANNEL = '未分类';

const DURATION_BUCKETS = [
  { label: '<1 分钟', min: 0, max: 60, count: 0 },
  { label: '1-3 分钟', min: 60, max: 180, count: 0 },
  { label: '3-5 分钟', min: 180, max: 300, count: 0 },
  { label: '5-10 分钟', min: 300, max: 600, count: 0 },
  { label: '10-20 分钟', min: 600, max: 1200, count: 0 },
  { label: '20-30 分钟', min: 1200, max: 1800, count: 0 },
  { label: '>30 分钟', min: 1800, max: Number.POSITIVE_INFINITY, count: 0 },
];

const TOP_UP_LIMIT = 30;
const TOP_TAG_LIMIT = 60;
const TOP_ENGAGEMENT_LIMIT = 10;
const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;

function safe(n) {
  return Number.isFinite(n) ? n : 0;
}

/**
 * Compute the 7 standard aggregation dimensions for a single day's crawl.
 *
 * @param {Array<object>} videos - Crawl video objects (must include
 *   statLike/Coin/Favorite/Reply/Danmaku/Share and tags.ordinaryTags).
 * @returns {object} summary, channels, topUps, duration, hourHeatmap,
 *   topTags, topEngagement
 */
export function buildAggregations(videos) {
  const channelMap = new Map();
  for (const v of videos) {
    const first = (v.tags && v.tags.firstChannel) || DEFAULT_CHANNEL;
    const second = (v.tags && v.tags.secondChannel) || DEFAULT_CHANNEL;
    const c = channelMap.get(first) || {
      firstChannel: first,
      count: 0,
      views: 0,
      like: 0,
      coin: 0,
      favorite: 0,
      secondChannels: new Map(),
    };
    c.count++;
    c.views += safe(v.views);
    c.like += safe(v.statLike);
    c.coin += safe(v.statCoin);
    c.favorite += safe(v.statFavorite);
    const sub = c.secondChannels.get(second) || {
      secondChannel: second,
      count: 0,
      views: 0,
    };
    sub.count++;
    sub.views += safe(v.views);
    c.secondChannels.set(second, sub);
    channelMap.set(first, c);
  }

  const upMap = new Map();
  for (const v of videos) {
    const key = String(v.UP || v.mid || '');
    if (!key) continue;
    const e = upMap.get(key) || {
      name: v.UP,
      mid: v.mid,
      count: 0,
      views: 0,
      followers: v.upMeta && v.upMeta.followers,
    };
    e.count++;
    e.views += safe(v.views);
    upMap.set(key, e);
  }

  const durationBuckets = DURATION_BUCKETS.map((b) => ({ ...b, count: 0 }));
  for (const v of videos) {
    const d = v.duration || 0;
    const bucket = durationBuckets.find((b) => d >= b.min && d < b.max);
    if (bucket) bucket.count++;
  }

  const hourHist = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: 0,
  }));
  for (const v of videos) {
    if (!v.pubdate) continue;
    const shifted = new Date(v.pubdate * 1000 + UTC8_OFFSET_MS);
    hourHist[shifted.getUTCHours()].count++;
  }

  const tagCount = new Map();
  for (const v of videos) {
    const tags = (v.tags && v.tags.ordinaryTags) || [];
    for (const t of tags) {
      tagCount.set(t, (tagCount.get(t) || 0) + 1);
    }
  }

  const totalViewsAll = videos.reduce((a, v) => a + safe(v.views), 0);
  const totalLikeAll = videos.reduce((a, v) => a + safe(v.statLike), 0);
  const totalCoinAll = videos.reduce((a, v) => a + safe(v.statCoin), 0);
  const totalFavoriteAll = videos.reduce(
    (a, v) => a + safe(v.statFavorite),
    0
  );
  const totalShareAll = videos.reduce((a, v) => a + safe(v.statShare), 0);
  const totalReplyAll = videos.reduce((a, v) => a + safe(v.statReply), 0);
  const totalDanmakuAll = videos.reduce(
    (a, v) => a + safe(v.statDanmaku),
    0
  );

  const topEngagement = videos
    .map((v) => {
      const views = safe(v.views);
      const eng =
        views > 0
          ? (safe(v.statLike) +
              safe(v.statCoin) * 2 +
              safe(v.statFavorite) * 2 +
              safe(v.statShare)) /
            views
          : 0;
      return {
        bvid: v.bvid,
        title: v.title,
        UP: v.UP,
        mid: v.mid,
        views,
        like: safe(v.statLike),
        coin: safe(v.statCoin),
        favorite: safe(v.statFavorite),
        share: safe(v.statShare),
        engagement: eng,
      };
    })
    .filter((v) => v.views > 0)
    .sort((a, b) => b.engagement - a.engagement || b.views - a.views)
    .slice(0, TOP_ENGAGEMENT_LIMIT);

  return {
    summary: {
      totalVideos: videos.length,
      totalUp: upMap.size,
      totalViews: totalViewsAll,
      totalLike: totalLikeAll,
      totalCoin: totalCoinAll,
      totalFavorite: totalFavoriteAll,
      totalReply: totalReplyAll,
      totalDanmaku: totalDanmakuAll,
      avgEngagement:
        totalViewsAll > 0
          ? (totalLikeAll +
              totalCoinAll * 2 +
              totalFavoriteAll * 2 +
              totalShareAll) /
            totalViewsAll
          : 0,
    },
    channels: Array.from(channelMap.values())
      .map((c) => ({
        firstChannel: c.firstChannel,
        count: c.count,
        views: c.views,
        avgViews: c.count > 0 ? Math.round(c.views / c.count) : 0,
        like: c.like,
        coin: c.coin,
        favorite: c.favorite,
        secondChannels: Array.from(c.secondChannels.values()).sort(
          (a, b) => b.count - a.count
        ),
      }))
      .sort((a, b) => b.count - a.count),
    topUps: Array.from(upMap.values())
      .sort((a, b) => b.count - a.count || b.views - a.views)
      .slice(0, TOP_UP_LIMIT),
    duration: durationBuckets,
    hourHeatmap: hourHist,
    topTags: Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_TAG_LIMIT),
    topEngagement,
  };
}

export const __TEST__ = { DURATION_BUCKETS, TOP_UP_LIMIT, TOP_TAG_LIMIT };
