import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

const MAX_WINDOW = 90;
const DEFAULT_WINDOW = 30;

type LatencyBucketKey =
  | 'd0'
  | 'd1'
  | 'd2'
  | 'd3'
  | 'd4'
  | 'd5'
  | 'd6to7'
  | 'd8to14'
  | 'd15to30'
  | 'd30plus';

const BUCKET_ORDER: LatencyBucketKey[] = [
  'd0',
  'd1',
  'd2',
  'd3',
  'd4',
  'd5',
  'd6to7',
  'd8to14',
  'd15to30',
  'd30plus',
];

function bucketFor(days: number): LatencyBucketKey {
  if (days <= 0) return 'd0';
  if (days === 1) return 'd1';
  if (days === 2) return 'd2';
  if (days === 3) return 'd3';
  if (days === 4) return 'd4';
  if (days === 5) return 'd5';
  if (days <= 7) return 'd6to7';
  if (days <= 14) return 'd8to14';
  if (days <= 30) return 'd15to30';
  return 'd30plus';
}

export type LatencyPoint = { key: LatencyBucketKey; count: number };

export type LatencyPayload = {
  window: number;
  total: number;
  buckets: LatencyPoint[];
  avgDays: number;
  medianDays: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawWindow = parseInt(url.searchParams.get('window') ?? '', 10);
  const window =
    Number.isFinite(rawWindow) && rawWindow > 0
      ? Math.min(MAX_WINDOW, rawWindow)
      : DEFAULT_WINDOW;

  const cacheKey = `latency:${window}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.data);
  }

  try {
    const list = await fetchResultList();
    const target = list.slice(0, window);
    if (target.length === 0) {
      const payload: LatencyPayload = {
        window,
        total: 0,
        buckets: BUCKET_ORDER.map((k) => ({ key: k, count: 0 })),
        avgDays: 0,
        medianDays: 0,
      };
      cache.set(cacheKey, { data: payload, at: now });
      return NextResponse.json(payload);
    }

    const results = await Promise.all(
      target.map((f) =>
        fetchResultByName(f).catch((e) => {
          console.error('LATENCY fetch failed', f, e);
          return null;
        })
      )
    );

    const counts = new Map<LatencyBucketKey, number>();
    for (const k of BUCKET_ORDER) counts.set(k, 0);
    const delays: number[] = [];

    for (const r of results) {
      if (!r) continue;
      const crawlDay = r.time;
      for (const v of r.video) {
        if (!v.pubdate || v.pubdate <= 0) continue;
        const days = Math.floor((crawlDay / 1000 - v.pubdate) / 86400);
        if (days < 0) continue; // 還沒到發布就上榜 → 跳過
        const k = bucketFor(days);
        counts.set(k, (counts.get(k) ?? 0) + 1);
        delays.push(days);
      }
    }

    delays.sort((a, b) => a - b);
    const total = delays.length;
    const avgDays = total > 0 ? delays.reduce((a, b) => a + b, 0) / total : 0;
    const medianDays =
      total > 0
        ? total % 2 === 1
          ? delays[(total - 1) / 2]
          : (delays[total / 2 - 1] + delays[total / 2]) / 2
        : 0;

    const payload: LatencyPayload = {
      window,
      total,
      buckets: BUCKET_ORDER.map((k) => ({ key: k, count: counts.get(k) ?? 0 })),
      avgDays,
      medianDays,
    };
    cache.set(cacheKey, { data: payload, at: now });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('LATENCY_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
