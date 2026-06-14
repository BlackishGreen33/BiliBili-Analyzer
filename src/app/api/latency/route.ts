import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  BUCKET_ORDER,
  bucketFor,
  computeLatencyStats,
  type LatencyPayload,
  type LatencyPoint,
  payloadToEvents,
} from '@/common/libs/routes/latency';
import { parseWindowParam } from '@/common/libs/routes/shared';
import { ndjsonStream, ndjsonStreamFromEvents } from '@/common/libs/streaming';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const window = parseWindowParam(url, 'window', { default: 30, max: 90 });
  const stream = url.searchParams.get('stream') === '1';

  const cacheKey = `latency:${window}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    if (stream) {
      return ndjsonStreamFromEvents(
        payloadToEvents(hit.data as LatencyPayload)
      );
    }
    return NextResponse.json(hit.data);
  }

  try {
    const list = await fetchResultList();
    const target = list.slice(0, window);

    const counts = new Map<string, number>();
    for (const k of BUCKET_ORDER) counts.set(k, 0);
    const delays: number[] = [];

    if (target.length > 0) {
      const results = await Promise.all(
        target.map((f) =>
          fetchResultByName(f).catch((e) => {
            console.error('LATENCY fetch failed', f, e);
            return null;
          })
        )
      );

      for (const r of results) {
        if (!r) continue;
        const crawlDay = r.time;
        for (const v of r.video) {
          if (!v.pubdate || v.pubdate <= 0) continue;
          const days = Math.floor((crawlDay / 1000 - v.pubdate) / 86400);
          if (days < 0) continue;
          counts.set(bucketFor(days), (counts.get(bucketFor(days)) ?? 0) + 1);
          delays.push(days);
        }
      }
    }

    const stats = computeLatencyStats(delays);
    const buckets: LatencyPoint[] = BUCKET_ORDER.map((k) => ({
      key: k,
      count: counts.get(k) ?? 0,
    }));
    const payload: LatencyPayload = {
      window,
      total: stats.total,
      buckets,
      avgDays: stats.avgDays,
      medianDays: stats.medianDays,
    };
    cache.set(cacheKey, { data: payload, at: now });
    if (stream) {
      return ndjsonStreamFromEvents(payloadToEvents(payload));
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error('LATENCY_GET', error);
    if (stream) {
      return ndjsonStream(
        (async function* () {
          yield { type: 'done' as const, error: 'Internal Error' };
        })()
      );
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
