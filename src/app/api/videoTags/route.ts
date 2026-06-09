import axios from 'axios';
import { NextResponse } from 'next/server';

import type { CrawlResult } from '@/common/types/video';

const preUrl = 'https://www.bilibili.com/video/';
const githubResultBranch =
  'https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result';

export async function POST(req: Request) {
  try {
    const { bvid } = await req.json();
    const url = preUrl + bvid;

    const listRes = await axios.get(githubResultBranch + '/list.json');
    const filename = listRes.data[0];
    if (!filename) {
      throw new Error('Filename not found');
    }
    const dataRes = await axios.get(`${githubResultBranch}/${filename}.json`);
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
