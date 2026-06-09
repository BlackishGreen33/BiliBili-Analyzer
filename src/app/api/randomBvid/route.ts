import axios from 'axios';
import { NextResponse } from 'next/server';

import { RESULT_BASE_URL } from '@/common/constants/result';
import type { CrawlResult } from '@/common/types/video';

export async function GET(req: Request) {
  try {
    const listRes = await axios.get(`${RESULT_BASE_URL}/list.json`);
    const filename = listRes.data[0];
    if (!filename) {
      throw new Error('Filename not found');
    }
    const dataRes = await axios.get(`${RESULT_BASE_URL}/${filename}.json`);
    const allData = dataRes.data as CrawlResult;

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
