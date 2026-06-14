import { NextResponse } from 'next/server';

import {
  buildAggregations,
  type CrawlVideo,
  type DashboardAgg,
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import { computeDiff } from '@/common/libs/routes/dashboard-compare';

const CACHE_TTL_MS = 5 * 60 * 1000;
type CacheEntry = { data: unknown; at: number };
const cache = new Map<string, CacheEntry>();

type ComparePayload = {
  a: DashboardAgg;
  b: DashboardAgg;
  diff: ReturnType<typeof computeDiff>;
};

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
