import { NextResponse } from 'next/server';

import {
  buildAggregations,
  type CrawlVideo,
  type DashboardAgg,
  fetchAggByName,
  fetchAggLatest,
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';
import {
  createFiveMinCache,
  withRouteErrorHandler,
} from '@/common/libs/routes/create-cached-route';

const cache = createFiveMinCache<DashboardAgg>();

export async function GET(req: Request) {
  return withRouteErrorHandler('DASHBOARD', async () => {
    const url = new URL(req.url);
    const filename = url.searchParams.get('file');

    let targetFile = filename;
    if (!targetFile) {
      const list = await fetchResultList();
      targetFile = list[0] ?? null;
    }
    if (!targetFile) {
      return new NextResponse('No crawl data', { status: 404 });
    }

    const key = 'dashboard:' + targetFile;
    const hit = cache.get(key);
    if (hit) {
      return NextResponse.json(hit);
    }

    // Fast path: read pre-aggregated JSON (published by the crawler).
    // Skip buildAggregations() and skip the raw {date}.json fetch.
    const preAgg = filename
      ? await fetchAggByName(filename)
      : await fetchAggLatest();
    if (preAgg) {
      const final: DashboardAgg = {
        file: preAgg.file ?? targetFile,
        time: preAgg.time,
        summary: preAgg.summary,
        channels: preAgg.channels,
        topUps: preAgg.topUps,
        duration: preAgg.duration,
        hourHeatmap: preAgg.hourHeatmap,
        topTags: preAgg.topTags,
        topEngagement: preAgg.topEngagement,
      };
      cache.set(key, final);
      return NextResponse.json(final);
    }

    // Fallback: compute on the fly from raw data.
    const allData = await fetchResultByName(targetFile);
    const agg = buildAggregations(allData.video as CrawlVideo[]);
    const payload: DashboardAgg = {
      file: targetFile,
      time: allData.time,
      ...agg,
    };
    cache.set(key, payload);
    return NextResponse.json(payload);
  });
}
