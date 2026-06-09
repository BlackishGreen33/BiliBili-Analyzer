import axios from 'axios';
import { NextResponse } from 'next/server';

import type { CrawlResult } from '@/common/types/video';

const githubResultBranch =
  'https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result';

export async function GET(req: Request) {
  try {
    const listRes = await axios.get(githubResultBranch + '/list.json');
    const filename = listRes.data[0];
    if (!filename) {
      throw new Error('Filename not found');
    }
    const dataRes = await axios.get(`${githubResultBranch}/${filename}.json`);
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
