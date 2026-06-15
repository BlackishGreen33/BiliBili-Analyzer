import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  createFiveMinCache,
  withRouteErrorHandler,
} from '@/common/libs/routes/create-cached-route';
import {
  buildWordCloudPayload,
  type WordCloudPayload,
} from '@/common/libs/routes/wordcloud';

const cache = createFiveMinCache<WordCloudPayload>();
const CACHE_KEY = 'wordcloud:latest';

export async function GET() {
  return withRouteErrorHandler('WORDCLOUD', async () => {
    const hit = cache.get(CACHE_KEY);
    if (hit) {
      return NextResponse.json(hit);
    }
    const list = await fetchResultList();
    if (list.length === 0) {
      const empty: WordCloudPayload = buildWordCloudPayload('', []);
      cache.set(CACHE_KEY, empty);
      return NextResponse.json(empty);
    }
    const file = list[0];
    const data = await fetchResultByName(file);
    const payload: WordCloudPayload = buildWordCloudPayload(file, data.video);
    cache.set(CACHE_KEY, payload);
    return NextResponse.json(payload);
  });
}
