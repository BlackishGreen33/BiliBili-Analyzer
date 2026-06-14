import { NextResponse } from 'next/server';

import {
  buildAggregations,
  type CrawlVideo,
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import { parseWindowParam } from '@/common/libs/routes/shared';
import {
  buildTrendPoint,
  payloadToEvents,
  type TrendPayload,
} from '@/common/libs/routes/trend';
import { ndjsonStream, ndjsonStreamFromEvents } from '@/common/libs/streaming';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const window = parseWindowParam(url, 'window', { default: 30, max: 90 });
  const stream = url.searchParams.get('stream') === '1';

  const cacheKey = `trend:${window}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    if (stream) {
      return ndjsonStreamFromEvents(payloadToEvents(hit.data as TrendPayload));
    }
    return NextResponse.json(hit.data);
  }

  try {
    const list = await fetchResultList();
    const target = list.slice(0, window);
    if (target.length === 0) {
      const empty: TrendPayload = {
        window,
        isMock: false,
        realCount: 0,
        points: [],
      };
      cache.set(cacheKey, { data: empty, at: now });
      if (stream) {
        return ndjsonStreamFromEvents(payloadToEvents(empty));
      }
      return NextResponse.json(empty);
    }

    const isMock = target.length < window;

    const results = await Promise.all(
      target.map(async (file) => {
        try {
          return { file, data: await fetchResultByName(file) };
        } catch (e) {
          console.error('TREND fetch failed', file, e);
          return null;
        }
      })
    );

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
    cache.set(cacheKey, { data: payload, at: now });
    if (stream) {
      return ndjsonStreamFromEvents(payloadToEvents(payload));
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error('DASHBOARD_TREND_GET', error);
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
