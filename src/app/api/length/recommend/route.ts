import { NextResponse } from 'next/server';

import { predictLength } from '@/common/libs/length-predictor';
import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  type LengthRecommendPayload,
  matchVideo,
  parseLengthParams,
} from '@/common/libs/routes/length-recommend';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = parseLengthParams(url);
  if (!parsed.ok) {
    return new NextResponse(parsed.message, { status: parsed.status });
  }
  const { type, value, window } = parsed;

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
      type,
      value,
      scopeSamples,
      globalSamples,
    });

    const payload: LengthRecommendPayload = {
      scope: { type, value },
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
