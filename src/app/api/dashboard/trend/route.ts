import { NextResponse } from 'next/server';

import {
  buildAggregations,
  type CrawlVideo,
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import { pLimit } from '@/common/libs/routes/concurrency';
import {
  createFiveMinCache,
  withRouteErrorHandler,
} from '@/common/libs/routes/create-cached-route';
import { parseWindowParam } from '@/common/libs/routes/shared';
import {
  buildTrendPoint,
  payloadToEvents,
  type TrendPayload,
} from '@/common/libs/routes/trend';
import { ndjsonStream, ndjsonStreamFromEvents } from '@/common/libs/streaming';

const TREND_CONCURRENCY = 10;

const cache = createFiveMinCache<TrendPayload>();

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

  const cacheKey = `trend:${window}`;
  const hit = cache.get(cacheKey);
  if (hit) {
    if (stream) {
      return ndjsonStreamFromEvents(payloadToEvents(hit));
    }
    return NextResponse.json(hit);
  }

  return withRouteErrorHandler(
    'DASHBOARD_TREND',
    async () => {
      const list = await fetchResultList();
      const target = list.slice(0, window);
      if (target.length === 0) {
        const empty: TrendPayload = {
          window,
          isMock: false,
          realCount: 0,
          points: [],
        };
        cache.set(cacheKey, empty);
        if (stream) {
          return ndjsonStreamFromEvents(payloadToEvents(empty));
        }
        return NextResponse.json(empty);
      }

      const isMock = target.length < window;

      const results = await pLimit(target, TREND_CONCURRENCY, async (file) => {
        try {
          return { file, data: await fetchResultByName(file) };
        } catch (e) {
          console.error('TREND fetch failed', file, e);
          return null;
        }
      });

      const points = results
        .filter(
          (
            r
          ): r is {
            file: string;
            data: Awaited<ReturnType<typeof fetchResultByName>>;
          } => r !== null
        )
        .map(({ file, data }) => {
          const agg = buildAggregations(data.video as CrawlVideo[]);
          return buildTrendPoint(file, data.time, agg);
        });

      // 反轉：從舊到新（line chart x 軸習慣）
      points.reverse();

      const payload: TrendPayload = {
        window,
        isMock,
        realCount: target.length,
        points,
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
