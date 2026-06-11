import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';

export async function POST(req: Request) {
  try {
    const { bvid } = (await req.json()) as { bvid?: string };
    if (!bvid) {
      return new NextResponse('Missing bvid', { status: 400 });
    }

    const list = await fetchResultList();
    const filename = list[0];
    if (!filename) {
      return new NextResponse('No crawl data available', { status: 404 });
    }
    const allData = await fetchResultByName(filename);

    const video = allData.video.find(
      (v) => v.bvid === bvid || v.url.endsWith('/' + bvid)
    );
    if (!video) {
      return new NextResponse('Video not found', { status: 404 });
    }

    return NextResponse.json(video.tags);
  } catch (error) {
    console.error('VIDEO_TAGS_POST', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
