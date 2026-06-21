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
const VIDEO_MODES = ['up', 'channel', 'tag'] as const;
const MAX_VIDEO_VALUE_LENGTH = 120;

function isVideoMode(mode: string): mode is (typeof VIDEO_MODES)[number] {
  return VIDEO_MODES.includes(mode as (typeof VIDEO_MODES)[number]);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');
  const value = url.searchParams.get('value')?.trim();
  const filename = url.searchParams.get('file');

  if (!mode || !value) {
    return new NextResponse('Missing mode or value', { status: 400 });
  }
  if (!isVideoMode(mode)) {
    return new NextResponse('Invalid mode', { status: 400 });
  }
  if (value.length > MAX_VIDEO_VALUE_LENGTH) {
    return new NextResponse('Value too long', { status: 400 });
  }

  return withRouteErrorHandler('VIDEO_RELATED', async () => {
    const list = await fetchResultList();
    const target = filename || list[0];
    if (filename && !list.includes(filename)) {
      return new NextResponse('Unknown filename', { status: 404 });
    }
    if (!target) {
      return new NextResponse('No crawl data', { status: 404 });
    }

    const cacheKey = `video:${mode}:${value}:${target}`;
    const hit = cache.get(cacheKey);
    if (hit) {
      return NextResponse.json(hit);
    }

    const data = await fetchResultByName(target);

    let matches: VideoResponse['video'] = [];
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
