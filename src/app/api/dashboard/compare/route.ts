import { NextResponse } from 'next/server';

import {
  buildAggregations,
  type CrawlVideo,
  type DashboardAgg,
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';

const CACHE_TTL_MS = 5 * 60 * 1000;
type CacheEntry = { data: unknown; at: number };
const cache = new Map<string, CacheEntry>();

type ComparePayload = {
  a: DashboardAgg;
  b: DashboardAgg;
  diff: {
    newBvids: string[];
    droppedBvids: string[];
    persistentBvids: string[];
    persistentCount: number;
    totals: {
      totalVideos: number;
      totalUp: number;
      totalViews: number;
      totalEngagement: number;
      avgEngagement: number;
    };
    totalsDelta: {
      totalVideos: number;
      totalUp: number;
      totalViews: number;
      totalEngagement: number;
      avgEngagement: number;
    };
    channelShift: Array<{
      firstChannel: string;
      countA: number;
      countB: number;
      delta: number;
    }>;
    upShift: Array<{
      name: string;
      mid?: number;
      countA: number;
      countB: number;
      delta: number;
    }>;
    tagShift: {
      newTags: string[];
      droppedTags: string[];
      commonTags: number;
    };
  };
};

function computeDiff(
  rawA: CrawlVideo[],
  rawB: CrawlVideo[],
  aggA: DashboardAgg,
  aggB: DashboardAgg
): ComparePayload['diff'] {
  const setA = new Set(rawA.map((v) => v.bvid));
  const setB = new Set(rawB.map((v) => v.bvid));
  const newBvids = rawB.map((v) => v.bvid).filter((b) => !setA.has(b));
  const droppedBvids = rawA.map((v) => v.bvid).filter((b) => !setB.has(b));
  const persistentBvids = rawA.map((v) => v.bvid).filter((b) => setB.has(b));

  const totals = (agg: DashboardAgg) => ({
    totalVideos: agg.summary.totalVideos,
    totalUp: agg.summary.totalUp,
    totalViews: agg.summary.totalViews,
    totalEngagement:
      agg.summary.totalLike +
      agg.summary.totalCoin * 2 +
      agg.summary.totalFavorite * 2,
    avgEngagement: agg.summary.avgEngagement,
  });
  const tA = totals(aggA);
  const tB = totals(aggB);
  const totalsDelta = {
    totalVideos: tB.totalVideos - tA.totalVideos,
    totalUp: tB.totalUp - tA.totalUp,
    totalViews: tB.totalViews - tA.totalViews,
    totalEngagement: tB.totalEngagement - tA.totalEngagement,
    avgEngagement: tB.avgEngagement - tA.avgEngagement,
  };

  // 分區差異：union of first channels
  const chMap = new Map<
    string,
    { firstChannel: string; countA: number; countB: number }
  >();
  for (const c of aggA.channels) {
    chMap.set(c.firstChannel, {
      firstChannel: c.firstChannel,
      countA: c.count,
      countB: 0,
    });
  }
  for (const c of aggB.channels) {
    const e = chMap.get(c.firstChannel) || {
      firstChannel: c.firstChannel,
      countA: 0,
      countB: 0,
    };
    e.countB = c.count;
    chMap.set(c.firstChannel, e);
  }
  const channelShift = Array.from(chMap.values())
    .map((c) => ({ ...c, delta: c.countB - c.countA }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  // UP 主差異：union of (UP+mid)
  const upMap = new Map<
    string,
    { name: string; mid?: number; countA: number; countB: number }
  >();
  for (const u of aggA.topUps) {
    const key = String(u.mid ?? u.name);
    upMap.set(key, {
      name: u.name,
      mid: u.mid,
      countA: u.count,
      countB: 0,
    });
  }
  for (const u of aggB.topUps) {
    const key = String(u.mid ?? u.name);
    const e = upMap.get(key) || {
      name: u.name,
      mid: u.mid,
      countA: 0,
      countB: 0,
    };
    e.countB = u.count;
    upMap.set(key, e);
  }
  const upShift = Array.from(upMap.values())
    .map((u) => ({ ...u, delta: u.countB - u.countA }))
    .filter((u) => u.countA > 0 || u.countB > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 30);

  // 標籤差異
  const tagSetA = new Set(aggA.topTags.map((t) => t.tag));
  const tagSetB = new Set(aggB.topTags.map((t) => t.tag));
  const newTags = Array.from(tagSetB).filter((t) => !tagSetA.has(t));
  const droppedTags = Array.from(tagSetA).filter((t) => !tagSetB.has(t));
  const commonTags = Array.from(tagSetA).filter((t) => tagSetB.has(t)).length;

  return {
    newBvids,
    droppedBvids,
    persistentBvids,
    persistentCount: persistentBvids.length,
    totals: tB,
    totalsDelta,
    channelShift,
    upShift,
    tagShift: { newTags, droppedTags, commonTags },
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const a = url.searchParams.get('a');
  const b = url.searchParams.get('b');

  if (!a || !b) {
    return new NextResponse('Missing a or b', { status: 400 });
  }
  if (a === b) {
    return new NextResponse('a and b must differ', { status: 400 });
  }

  const cacheKey = `compare:${a}:${b}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.data);
  }

  try {
    const list = await fetchResultList();
    if (!list.includes(a) || !list.includes(b)) {
      return new NextResponse('Unknown filename', { status: 404 });
    }

    const [rawA, rawB] = await Promise.all([
      fetchResultByName(a),
      fetchResultByName(b),
    ]);

    const aggA: DashboardAgg = {
      file: a,
      time: rawA.time,
      ...buildAggregations(rawA.video as CrawlVideo[]),
    };
    const aggB: DashboardAgg = {
      file: b,
      time: rawB.time,
      ...buildAggregations(rawB.video as CrawlVideo[]),
    };
    const diff = computeDiff(
      rawA.video as CrawlVideo[],
      rawB.video as CrawlVideo[],
      aggA,
      aggB
    );

    const payload: ComparePayload = { a: aggA, b: aggB, diff };
    cache.set(cacheKey, { data: payload, at: now });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('DASHBOARD_COMPARE_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
