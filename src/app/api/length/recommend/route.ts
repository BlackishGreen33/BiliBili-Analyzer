import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

const MAX_WINDOW = 90;
const DEFAULT_WINDOW = 30;

const DURATION_BUCKETS = [
  { label: '<1 分钟', min: 0, max: 60 },
  { label: '1-3 分钟', min: 60, max: 180 },
  { label: '3-5 分钟', min: 180, max: 300 },
  { label: '5-10 分钟', min: 300, max: 600 },
  { label: '10-20 分钟', min: 600, max: 1200 },
  { label: '20-30 分钟', min: 1200, max: 1800 },
  { label: '>30 分钟', min: 1800, max: Infinity },
];

export type LengthDistribution = {
  label: string;
  min: number;
  max: number;
  share: number;
  count: number;
};

export type LengthRecommendPayload = {
  scope: { type: 'up' | 'channel' | 'tag'; value: string };
  window: number;
  primary: { label: string; share: number; count: number } | null;
  distribution: LengthDistribution[];
  sampleSize: number;
  confidence: 'low' | 'mid' | 'high';
};

function confidenceFor(sampleSize: number): 'low' | 'mid' | 'high' {
  if (sampleSize < 30) return 'low';
  if (sampleSize < 100) return 'mid';
  return 'high';
}

function matchVideo(
  type: string,
  value: string,
  v: {
    UP: string;
    mid?: number;
    tags?: {
      firstChannel: string;
      secondChannel: string;
      ordinaryTags: string[];
    };
  }
): boolean {
  if (type === 'up') {
    return v.UP === value || String(v.mid ?? '') === value;
  }
  if (type === 'channel') {
    return v.tags?.firstChannel === value;
  }
  if (type === 'tag') {
    return v.tags?.ordinaryTags?.includes(value) ?? false;
  }
  return false;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type') ?? '';
  const value = url.searchParams.get('value') ?? '';
  const rawWindow = parseInt(url.searchParams.get('window') ?? '', 10);
  const window =
    Number.isFinite(rawWindow) && rawWindow > 0
      ? Math.min(MAX_WINDOW, rawWindow)
      : DEFAULT_WINDOW;

  if (!['up', 'channel', 'tag'].includes(type)) {
    return new NextResponse('Invalid type', { status: 400 });
  }
  if (!value) {
    return new NextResponse('Missing value', { status: 400 });
  }

  const cacheKey = `length:${type}:${value}:${window}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.data);
  }

  try {
    const list = await fetchResultList();
    const target = list.slice(0, window);
    const matched: number[] = [];

    const results = await Promise.all(
      target.map((f) =>
        fetchResultByName(f).catch((e) => {
          console.error('LENGTH fetch failed', f, e);
          return null;
        })
      )
    );

    for (const r of results) {
      if (!r) continue;
      for (const v of r.video) {
        if (matchVideo(type, value, v)) {
          matched.push(typeof v.duration === 'number' ? v.duration : 0);
        }
      }
    }

    const counts = DURATION_BUCKETS.map((b) => ({ ...b, count: 0 }));
    for (const d of matched) {
      const bucket = counts.find((b) => d >= b.min && d < b.max);
      if (bucket) bucket.count++;
    }
    const total = matched.length;
    const distribution: LengthDistribution[] = counts.map((b) => ({
      label: b.label,
      min: b.min,
      max: b.max,
      count: b.count,
      share: total > 0 ? b.count / total : 0,
    }));

    const nonEmpty = distribution.filter((d) => d.count > 0);
    const primary =
      nonEmpty.length > 0
        ? nonEmpty.reduce((a, b) => (b.share > a.share ? b : a))
        : null;

    const payload: LengthRecommendPayload = {
      scope: { type: type as 'up' | 'channel' | 'tag', value },
      window,
      primary: primary
        ? { label: primary.label, share: primary.share, count: primary.count }
        : null,
      distribution,
      sampleSize: total,
      confidence: confidenceFor(total),
    };
    cache.set(cacheKey, { data: payload, at: now });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('LENGTH_RECOMMEND_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
