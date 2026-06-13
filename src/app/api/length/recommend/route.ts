import { NextResponse } from 'next/server';

import { predictLength } from '@/common/libs/length-predictor';
import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

const MAX_WINDOW = 90;
const DEFAULT_WINDOW = 30;

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
  /** v2: 中位數 + IQR 信賴區間 */
  medianSeconds: number;
  p25: number;
  p75: number;
  /** 給 UI 顯示的解釋（i18n key） */
  rationaleKey:
    | 'length.rationale.notEnough'
    | 'length.rationale.globalFallback'
    | 'length.rationale.scope';
};

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
    const scopeSamples: number[] = [];
    const globalSamples: number[] = [];

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
        const dur = typeof v.duration === 'number' ? v.duration : 0;
        globalSamples.push(dur);
        if (matchVideo(type, value, v)) {
          scopeSamples.push(dur);
        }
      }
    }

    const prediction = predictLength({
      type: type as 'up' | 'channel' | 'tag',
      value,
      scopeSamples,
      globalSamples,
    });

    const payload: LengthRecommendPayload = {
      scope: { type: type as 'up' | 'channel' | 'tag', value },
      window,
      primary: prediction.primary,
      distribution: prediction.distribution,
      sampleSize: prediction.sampleSize,
      confidence: prediction.confidence,
      medianSeconds: prediction.medianSeconds,
      p25: prediction.p25,
      p75: prediction.p75,
      rationaleKey: prediction.rationaleKey,
    };
    cache.set(cacheKey, { data: payload, at: now });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('LENGTH_RECOMMEND_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
