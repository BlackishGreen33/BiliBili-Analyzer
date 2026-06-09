import { NextResponse } from 'next/server';

import { fetchResultByName, fetchResultList } from '@/common/libs/result-data';

export async function GET(req: Request) {
  try {
    const list = await fetchResultList();
    const filename = list[0];
    if (!filename) {
      throw new Error('Filename not found');
    }
    const allData = await fetchResultByName(filename);

    const randomIndex = Math.floor(Math.random() * allData.video.length);
    const video = allData.video[randomIndex];

    if (!video) {
      throw new Error('Video data not found');
    }

    const pattern = /video\/([a-zA-Z0-9]+)/;
    const matchResult = video.url.match(pattern);
    if (matchResult && matchResult[1]) {
      const bvid = matchResult[1];
      return NextResponse.json(bvid);
    } else {
      console.error('无法从 URL 中获取 BV 号');
    }
  } catch (error) {
    console.error('RANDOM_BVID_POST', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
