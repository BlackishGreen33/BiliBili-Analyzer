import { NextResponse } from 'next/server';

import {
  buildAggregations,
  type CrawlVideo,
  type DashboardAgg,
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { key: string; data: DashboardAgg; at: number } | null = null;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filename = url.searchParams.get('file');

  try {
    let targetFile = filename;
    if (!targetFile) {
      const list = await fetchResultList();
      targetFile = list[0];
    }
    if (!targetFile) {
      return new NextResponse('No crawl data', { status: 404 });
    }

    const key = 'dashboard:' + targetFile;
    const now = Date.now();
    if (cached && cached.key === key && now - cached.at < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const allData = await fetchResultByName(targetFile);
    const agg = buildAggregations(allData.video as CrawlVideo[]);
    const payload: DashboardAgg = {
      file: targetFile,
      time: allData.time,
      ...agg,
    };
    cached = { key, data: payload, at: now };
    return NextResponse.json(payload);
  } catch (error) {
    console.error('DASHBOARD_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
