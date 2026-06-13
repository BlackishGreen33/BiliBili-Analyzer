import { NextResponse } from 'next/server';

import {
  buildAggregations,
  type CrawlVideo,
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  ndjsonStream,
  ndjsonStreamFromEvents,
  type StreamEvent,
} from '@/common/libs/streaming';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

const MAX_WINDOW = 90;
const DEFAULT_WINDOW = 30;

export type TrendPoint = {
  file: string;
  date: string; // YYYY-MM-DD（UTC+8）
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagement: number;
  avgViews: number;
  duration: Array<{ label: string; count: number }>;
};

export type TrendPayload = {
  window: number;
  /** 資料是否為 mock（< N 天時 fallback） */
  isMock: boolean;
  /** 真實天數（list[0..N]） */
  realCount: number;
  points: TrendPoint[];
};

function dateStringUTC8(time: number): string {
  const d = new Date(time + 8 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function computeTrend(window: number): Promise<TrendPayload> {
  const list = await fetchResultList();
  const target = list.slice(0, window);
  if (target.length === 0) {
    return {
      window,
      isMock: false,
      realCount: 0,
      points: [],
    };
  }

  const isMock = target.length < window;

  const results = await Promise.all(
    target.map(async (file) => {
      try {
        const r = await fetchResultByName(file);
        return r;
      } catch (e) {
        console.error('TREND fetch failed', file, e);
        return null;
      }
    })
  );

  const points: TrendPoint[] = [];
  for (let i = 0; i < target.length; i++) {
    const file = target[i];
    const data = results[i];
    if (!data) continue;
    const agg = buildAggregations(data.video as CrawlVideo[]);
    const totalEngagement =
      agg.summary.totalLike +
      agg.summary.totalCoin * 2 +
      agg.summary.totalFavorite * 2;
    points.push({
      file,
      date: dateStringUTC8(data.time),
      totalVideos: agg.summary.totalVideos,
      totalUp: agg.summary.totalUp,
      totalViews: agg.summary.totalViews,
      totalEngagement,
      avgEngagement: agg.summary.avgEngagement,
      avgViews:
        agg.summary.totalVideos > 0
          ? Math.round(agg.summary.totalViews / agg.summary.totalVideos)
          : 0,
      duration: agg.duration.map((b) => ({
        label: b.label,
        count: b.count,
      })),
    });
  }

  // 反轉：從舊到新（line chart x 軸習慣）
  points.reverse();

  return {
    window,
    isMock,
    realCount: target.length,
    points,
  };
}

function payloadToEvents(payload: TrendPayload): StreamEvent[] {
  const events: StreamEvent[] = [
    {
      type: 'meta',
      window: payload.window,
      isMock: payload.isMock,
      realCount: payload.realCount,
    },
  ];
  for (const p of payload.points) {
    events.push({ type: 'chunk', data: p });
  }
  events.push({ type: 'done', pointCount: payload.points.length });
  return events;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawWindow = parseInt(url.searchParams.get('window') ?? '', 10);
  const window =
    Number.isFinite(rawWindow) && rawWindow > 0
      ? Math.min(MAX_WINDOW, rawWindow)
      : DEFAULT_WINDOW;
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
    const payload = await computeTrend(window);
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
