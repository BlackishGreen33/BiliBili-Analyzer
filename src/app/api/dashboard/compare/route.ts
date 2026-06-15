import { NextResponse } from 'next/server';

import {
  buildAggregations,
  type CrawlVideo,
  type DashboardAgg,
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  createFiveMinCache,
  withRouteErrorHandler,
} from '@/common/libs/routes/create-cached-route';
import { computeDiff } from '@/common/libs/routes/dashboard-compare';

type ComparePayload = {
  a: DashboardAgg;
  b: DashboardAgg;
  diff: ReturnType<typeof computeDiff>;
};

const cache = createFiveMinCache<ComparePayload>();

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
  const hit = cache.get(cacheKey);
  if (hit) {
    return NextResponse.json(hit);
  }

  return withRouteErrorHandler('DASHBOARD_COMPARE', async () => {
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
    cache.set(cacheKey, payload);
    return NextResponse.json(payload);
  });
}
