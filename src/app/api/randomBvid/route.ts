import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import { extractBvid } from '@/common/utils/format';

export async function GET() {
  try {
    const list = await fetchResultList();
    const filename = list[0];
    if (!filename) {
      throw new Error('Filename not found');
    }
    const allData = await fetchResultByName(filename);

    if (allData.video.length === 0) {
      throw new Error('No videos in latest crawl');
    }

    const randomIndex = Math.floor(Math.random() * allData.video.length);
    const video = allData.video[randomIndex];
    if (!video) {
      throw new Error('Video data not found');
    }

    const bvid = video.bvid || extractBvid(video.url);
    if (!bvid) {
      throw new Error('Cannot extract bvid from video url');
    }
    return new NextResponse(bvid, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('RANDOM_BVID_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
