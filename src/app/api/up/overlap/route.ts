import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  createFiveMinCache,
  withRouteErrorHandler,
} from '@/common/libs/routes/create-cached-route';
import {
  aggregateUpOverlap,
  buildUpMap,
  parseOverlapParams,
  type UpOverlapPayload,
} from '@/common/libs/routes/up-overlap';

const cache = createFiveMinCache<UpOverlapPayload>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = parseOverlapParams(url);

  const cacheKey = `upoverlap:${params.window}:${params.minChannels}:${params.minCount}:${params.limit}`;
  const hit = cache.get(cacheKey);
  if (hit) {
    return NextResponse.json(hit);
  }

  return withRouteErrorHandler('UP_OVERLAP', async () => {
    const list = await fetchResultList();
    const target = list.slice(0, params.window);
    if (target.length === 0) {
      const empty: UpOverlapPayload = {
        window: params.window,
        minChannels: params.minChannels,
        minCount: params.minCount,
        totalUps: 0,
        items: [],
      };
      cache.set(cacheKey, empty);
      return NextResponse.json(empty);
    }

    const results = await Promise.all(
      target.map((f) =>
        fetchResultByName(f).catch((e) => {
          console.error('UP_OVERLAP fetch failed', f, e);
          return null;
        })
      )
    );

    const upMap = buildUpMap(
      results
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r) => r.video)
    );
    const payload: UpOverlapPayload = {
      window: params.window,
      ...aggregateUpOverlap(upMap, {
        minChannels: params.minChannels,
        minCount: params.minCount,
        limit: params.limit,
      }),
    };
    cache.set(cacheKey, payload);
    return NextResponse.json(payload);
  });
}
