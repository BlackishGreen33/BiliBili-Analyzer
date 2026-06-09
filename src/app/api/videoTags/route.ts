import { NextResponse } from 'next/server';

import { fetchResultByName, fetchResultList } from '@/common/libs/result-data';

const preUrl = 'https://www.bilibili.com/video/';

export async function POST(req: Request) {
  try {
    const { bvid } = await req.json();
    const url = preUrl + bvid;

    const list = await fetchResultList();
    const filename = list[0];
    if (!filename) {
      throw new Error('Filename not found');
    }
    const allData = await fetchResultByName(filename);

    const video = allData.video.find((obj) => obj.url === url);

    if (!video) {
      throw new Error('Video data not found');
    }

    return NextResponse.json(video.tags);
  } catch (error) {
    console.error('VIDEO_TAGS_POST', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
