import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { key: string; data: unknown; at: number } | null = null;

type CrawlVideo = {
  bvid: string;
  url: string;
  title: string;
  UP: string;
  mid?: number;
  views: number;
  duration?: number;
  pubdate?: number;
  tags: {
    firstChannel: string;
    secondChannel: string;
    ordinaryTags: string[];
  };
  upMeta?: { followers?: number | null };
  statLike?: number;
  statCoin?: number;
  statFavorite?: number;
  statReply?: number;
  statDanmaku?: number;
  statShare?: number;
};

function buildAggregations(videos: CrawlVideo[]) {
  const safe = (n: number | undefined) =>
    Number.isFinite(n) ? (n as number) : 0;

  const channelMap = new Map<
    string,
    {
      firstChannel: string;
      count: number;
      views: number;
      like: number;
      coin: number;
      favorite: number;
      secondChannels: Map<
        string,
        { secondChannel: string; count: number; views: number }
      >;
    }
  >();
  for (const v of videos) {
    const first: string = v.tags.firstChannel || '未分类';
    const second: string = v.tags.secondChannel || '未分类';
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

  const upMap = new Map<
    string,
    {
      name: string;
      mid?: number;
      count: number;
      views: number;
      followers?: number | null;
    }
  >();
  for (const v of videos) {
    const key: string = String(v.UP || v.mid || '');
    if (!key) continue;
    const e = upMap.get(key) || {
      name: v.UP,
      mid: v.mid,
      count: 0,
      views: 0,
      followers: v.upMeta?.followers,
    };
    e.count++;
    e.views += safe(v.views);
    upMap.set(key, e);
  }

  const durationBuckets = [
    { label: '<1 分钟', min: 0, max: 60, count: 0 },
    { label: '1-3 分钟', min: 60, max: 180, count: 0 },
    { label: '3-5 分钟', min: 180, max: 300, count: 0 },
    { label: '5-10 分钟', min: 300, max: 600, count: 0 },
    { label: '10-20 分钟', min: 600, max: 1200, count: 0 },
    { label: '20-30 分钟', min: 1200, max: 1800, count: 0 },
    { label: '>30 分钟', min: 1800, max: Infinity, count: 0 },
  ];
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
    const d = new Date(v.pubdate * 1000 + 8 * 60 * 60 * 1000);
    hourHist[d.getUTCHours()].count++;
  }

  const tagCount = new Map();
  for (const v of videos) {
    for (const t of v.tags.ordinaryTags || []) {
      tagCount.set(t, (tagCount.get(t) || 0) + 1);
    }
  }

  const totalViewsAll = videos.reduce(
    (a: number, v: CrawlVideo) => a + safe(v.views),
    0
  );
  const totalLikeAll = videos.reduce(
    (a: number, v: CrawlVideo) => a + safe(v.statLike),
    0
  );
  const totalCoinAll = videos.reduce(
    (a: number, v: CrawlVideo) => a + safe(v.statCoin),
    0
  );
  const totalFavoriteAll = videos.reduce(
    (a: number, v: CrawlVideo) => a + safe(v.statFavorite),
    0
  );
  const totalShareAll = videos.reduce(
    (a: number, v: CrawlVideo) => a + safe(v.statShare),
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
    .slice(0, 10);

  return {
    summary: {
      totalVideos: videos.length,
      totalUp: upMap.size,
      totalViews: totalViewsAll,
      totalLike: totalLikeAll,
      totalCoin: totalCoinAll,
      totalFavorite: totalFavoriteAll,
      totalReply: videos.reduce(
        (a: number, v: CrawlVideo) => a + safe(v.statReply),
        0
      ),
      totalDanmaku: videos.reduce(
        (a: number, v: CrawlVideo) => a + safe(v.statDanmaku),
        0
      ),
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
      .sort(
        (
          a: { count: number; views: number },
          b: { count: number; views: number }
        ) => b.count - a.count || b.views - a.views
      )
      .slice(0, 30),
    duration: durationBuckets,
    hourHeatmap: hourHist,
    topTags: Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 60),
    topEngagement,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filename = url.searchParams.get('file');

  try {
    let targetFile = filename;
    if (!targetFile) {
      const list = await fetchResultList();
      targetFile = list[0];
    }
    if (!targetFile) {
      return new NextResponse('No crawl data', { status: 404 });
    }

    const key = 'dashboard:' + targetFile;
    const now = Date.now();
    if (cached && cached.key === key && now - cached.at < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const allData = await fetchResultByName(targetFile);
    const agg = buildAggregations(allData.video);
    const payload = { file: targetFile, time: allData.time, ...agg };
    cached = { key, data: payload, at: now };
    return NextResponse.json(payload);
  } catch (error) {
    console.error('DASHBOARD_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
