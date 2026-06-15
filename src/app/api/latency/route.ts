import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import { pLimit } from '@/common/libs/routes/concurrency';
import {
  createFiveMinCache,
  withRouteErrorHandler,
} from '@/common/libs/routes/create-cached-route';
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

const cache = createFiveMinCache<LatencyPayload>();
const LATENCY_CONCURRENCY = 10;

function streamErrorResponse(): Response {
  return ndjsonStream(
    (async function* () {
      yield { type: 'done' as const, error: 'Internal Error' };
    })()
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const window = parseWindowParam(url, 'window', { default: 30, max: 90 });
  const stream = url.searchParams.get('stream') === '1';

  const cacheKey = `latency:${window}`;
  const hit = cache.get(cacheKey);
  if (hit) {
    if (stream) {
      return ndjsonStreamFromEvents(payloadToEvents(hit));
    }
    return NextResponse.json(hit);
  }

  return withRouteErrorHandler(
    'LATENCY',
    async () => {
      const list = await fetchResultList();
      const target = list.slice(0, window);

      const counts = new Map<string, number>();
      for (const k of BUCKET_ORDER) counts.set(k, 0);
      const delays: number[] = [];

      if (target.length > 0) {
        const results = await pLimit(target, LATENCY_CONCURRENCY, (f) =>
          fetchResultByName(f).catch((e) => {
            console.error('LATENCY fetch failed', f, e);
            return null;
          })
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
      cache.set(cacheKey, payload);
      if (stream) {
        return ndjsonStreamFromEvents(payloadToEvents(payload));
      }
      return NextResponse.json(payload);
    },
    stream ? streamErrorResponse : undefined
  );
}
