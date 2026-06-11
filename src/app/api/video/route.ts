import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');
  const value = url.searchParams.get('value');
  const filename = url.searchParams.get('file');

  if (!mode || !value) {
    return new NextResponse('Missing mode or value', { status: 400 });
  }

  try {
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

    return NextResponse.json({
      file: target,
      count: matches.length,
      video: matches,
    });
  } catch (error) {
    console.error('VIDEO_RELATED_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
