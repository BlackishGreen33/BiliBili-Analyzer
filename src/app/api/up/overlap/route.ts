import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  aggregateUpOverlap,
  buildUpMap,
  parseOverlapParams,
  type UpOverlapPayload,
} from '@/common/libs/routes/up-overlap';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = parseOverlapParams(url);

  const cacheKey = `upoverlap:${params.window}:${params.minChannels}:${params.minCount}:${params.limit}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.data);
  }

  try {
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
      cache.set(cacheKey, { data: empty, at: now });
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
    cache.set(cacheKey, { data: payload, at: now });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('UP_OVERLAP_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
