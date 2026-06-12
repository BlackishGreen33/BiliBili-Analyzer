import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import { segmentTitles,type SegToken } from '@/common/utils/cjk-segmenter';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

export type WordCloudPayload = {
  file: string;
  tokens: SegToken[];
};

export async function GET() {
  const cacheKey = 'wordcloud:latest';
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.data);
  }
  try {
    const list = await fetchResultList();
    if (list.length === 0) {
      const payload: WordCloudPayload = { file: '', tokens: [] };
      cache.set(cacheKey, { data: payload, at: now });
      return NextResponse.json(payload);
    }
    const file = list[0];
    const data = await fetchResultByName(file);
    const titles = data.video.map((v) => v.title).filter(Boolean);
    const tokens = segmentTitles(titles, { topN: 200 });
    const payload: WordCloudPayload = { file, tokens };
    cache.set(cacheKey, { data: payload, at: now });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('WORDCLOUD_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
