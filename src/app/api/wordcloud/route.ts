import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  buildWordCloudPayload,
  type WordCloudPayload,
} from '@/common/libs/routes/wordcloud';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

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
      const empty: WordCloudPayload = buildWordCloudPayload('', []);
      cache.set(cacheKey, { data: empty, at: now });
      return NextResponse.json(empty);
    }
    const file = list[0];
    const data = await fetchResultByName(file);
    const payload: WordCloudPayload = buildWordCloudPayload(file, data.video);
    cache.set(cacheKey, { data: payload, at: now });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('WORDCLOUD_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
