import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  createFiveMinCache,
  withRouteErrorHandler,
} from '@/common/libs/routes/create-cached-route';

type VideoResponse = {
  file: string;
  count: number;
  video: Awaited<ReturnType<typeof fetchResultByName>>['video'];
};

const cache = createFiveMinCache<VideoResponse>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');
  const value = url.searchParams.get('value');
  const filename = url.searchParams.get('file');

  if (!mode || !value) {
    return new NextResponse('Missing mode or value', { status: 400 });
  }

  const cacheKey = `video:${mode}:${value}:${filename ?? ''}`;
  const hit = cache.get(cacheKey);
  if (hit) {
    return NextResponse.json(hit);
  }

  return withRouteErrorHandler('VIDEO_RELATED', async () => {
    const list = await fetchResultList();
    const target = filename || list[0];
    if (!target) {
      return new NextResponse('No crawl data', { status: 404 });
    }
    const data = await fetchResultByName(target);

    let matches;
    if (mode === 'up') {
      matches = data.video.filter(
        (v) => v.UP === value || String(v.mid) === value
      );
    } else if (mode === 'channel') {
      matches = data.video.filter(
        (v) => v.tags.firstChannel === value || v.tags.secondChannel === value
      );
    } else if (mode === 'tag') {
      matches = data.video.filter((v) => v.tags.ordinaryTags.includes(value));
    } else {
      return new NextResponse('Invalid mode', { status: 400 });
    }

    const payload: VideoResponse = {
      file: target,
      count: matches.length,
      video: matches,
    };
    cache.set(cacheKey, payload);
    return NextResponse.json(payload);
  });
}
