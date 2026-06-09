import axios from 'axios';
import { NextResponse } from 'next/server';

import { RESULT_BASE_URL } from '@/common/constants/result';
import type { CrawlResult } from '@/common/types/video';

const preUrl = 'https://www.bilibili.com/video/';

export async function POST(req: Request) {
  try {
    const { bvid } = await req.json();
    const url = preUrl + bvid;

    const listRes = await axios.get(`${RESULT_BASE_URL}/list.json`);
    const filename = listRes.data[0];
    if (!filename) {
      throw new Error('Filename not found');
    }
    const dataRes = await axios.get(`${RESULT_BASE_URL}/${filename}.json`);
    const allData = dataRes.data as CrawlResult;

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
