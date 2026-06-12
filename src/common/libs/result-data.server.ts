import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import 'server-only';

import { CrawlResultSchema } from '@/common/types/schema';
import type { CrawlResult } from '@/common/types/video';

const RESULT_BASE_URL =
  'https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result';

const LIST_TTL_MS = 60 * 1000;

let cachedList: { filenames: string[]; fetchedAt: number } | null = null;
let inFlightList: Promise<string[]> | null = null;
const inFlightResults = new Map<string, Promise<CrawlResult>>();

/**
 * Dev-only escape hatch：當 `MOCK_LOCAL_FILES=1` 時，從本機 `result/` 讀資料
 * （給 `pnpm mock-second-day` 用）。Production 永遠走 GitHub raw。
 */
const useLocal =
  process.env.MOCK_LOCAL_FILES === '1' && process.env.NODE_ENV !== 'production';

function readLocalList(): string[] {
  const p = path.join(process.cwd(), 'result', 'list.json');
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as string[];
  } catch {
    return [];
  }
}

function readLocalResult(filename: string): CrawlResult {
  const p = path.join(process.cwd(), 'result', `${filename}.json`);
  if (!existsSync(p)) {
    throw new Error(`${filename}.json not found in local result/`);
  }
  const raw = JSON.parse(readFileSync(p, 'utf-8')) as CrawlResult;
  const parsed = CrawlResultSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      'CrawlResult validation failed (local)',
      parsed.error.format()
    );
    return raw;
  }
  return parsed.data as CrawlResult;
}

export async function fetchResultList(): Promise<string[]> {
  if (useLocal) return readLocalList();
  const now = Date.now();
  if (cachedList && now - cachedList.fetchedAt < LIST_TTL_MS) {
    return cachedList.filenames;
  }
  if (inFlightList) return inFlightList;
  inFlightList = fetch(`${RESULT_BASE_URL}/list.json`, { cache: 'no-store' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`list.json ${res.status}`);
      return (await res.json()) as string[];
    })
    .then((filenames) => {
      cachedList = { filenames, fetchedAt: Date.now() };
      return filenames;
    })
    .finally(() => {
      inFlightList = null;
    });
  return inFlightList;
}

export async function fetchResultByName(
  filename: string
): Promise<CrawlResult> {
  if (useLocal) return readLocalResult(filename);
  const cached = inFlightResults.get(filename);
  if (cached) return cached;
  const promise = fetch(`${RESULT_BASE_URL}/${filename}.json`, {
    cache: 'no-store',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`${filename}.json ${res.status}`);
      const raw = await res.json();
      const parsed = CrawlResultSchema.safeParse(raw);
      if (!parsed.success) {
        console.error(
          'CrawlResult validation failed (server)',
          parsed.error.format()
        );
        return raw as CrawlResult;
      }
      return parsed.data as CrawlResult;
    })
    .finally(() => {
      inFlightResults.delete(filename);
    });
  inFlightResults.set(filename, promise);
  return promise;
}

// === Aggregations（共用於 /api/dashboard 與 /api/dashboard/compare） ===

export type CrawlVideo = {
  bvid: string;
  url: string;
  title: string;
  UP: string;
  mid?: number;
  views: number;
  duration?: number;
  pubdate?: number;
  tags: {
    firstChannel: string;
    secondChannel: string;
    ordinaryTags: string[];
  };
  upMeta?: { followers?: number | null };
  statLike?: number;
  statCoin?: number;
  statFavorite?: number;
  statReply?: number;
  statDanmaku?: number;
  statShare?: number;
};

export type DashboardAgg = {
  file: string;
  time: number;
  summary: {
    totalVideos: number;
    totalUp: number;
    totalViews: number;
    totalLike: number;
    totalCoin: number;
    totalFavorite: number;
    totalReply: number;
    totalDanmaku: number;
    avgEngagement: number;
  };
  channels: Array<{
    firstChannel: string;
    count: number;
    views: number;
    avgViews: number;
    like: number;
    coin: number;
    favorite: number;
    secondChannels: Array<{
      secondChannel: string;
      count: number;
      views: number;
    }>;
  }>;
  topUps: Array<{
    name: string;
    mid?: number;
    count: number;
    views: number;
    followers?: number | null;
  }>;
  duration: Array<{ label: string; min: number; max: number; count: number }>;
  hourHeatmap: Array<{ hour: number; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
  topEngagement: Array<{
    bvid: string;
    title: string;
    UP: string;
    mid?: number;
    views: number;
    like: number;
    coin: number;
    favorite: number;
    share: number;
    engagement: number;
  }>;
};

const safe = (n: number | undefined) =>
  Number.isFinite(n) ? (n as number) : 0;

export function buildAggregations(
  videos: CrawlVideo[]
): Omit<DashboardAgg, 'file' | 'time'> {
  const channelMap = new Map<
    string,
    {
      firstChannel: string;
      count: number;
      views: number;
      like: number;
      coin: number;
      favorite: number;
      secondChannels: Map<
        string,
        { secondChannel: string; count: number; views: number }
      >;
    }
  >();
  for (const v of videos) {
    const first: string = v.tags.firstChannel || '未分类';
    const second: string = v.tags.secondChannel || '未分类';
    const c = channelMap.get(first) || {
      firstChannel: first,
      count: 0,
      views: 0,
      like: 0,
      coin: 0,
      favorite: 0,
      secondChannels: new Map(),
    };
    c.count++;
    c.views += safe(v.views);
    c.like += safe(v.statLike);
    c.coin += safe(v.statCoin);
    c.favorite += safe(v.statFavorite);
    const sub = c.secondChannels.get(second) || {
      secondChannel: second,
      count: 0,
      views: 0,
    };
    sub.count++;
    sub.views += safe(v.views);
    c.secondChannels.set(second, sub);
    channelMap.set(first, c);
  }

  const upMap = new Map<
    string,
    {
      name: string;
      mid?: number;
      count: number;
      views: number;
      followers?: number | null;
    }
  >();
  for (const v of videos) {
    const key: string = String(v.UP || v.mid || '');
    if (!key) continue;
    const e = upMap.get(key) || {
      name: v.UP,
      mid: v.mid,
      count: 0,
      views: 0,
      followers: v.upMeta?.followers,
    };
    e.count++;
    e.views += safe(v.views);
    upMap.set(key, e);
  }

  const durationBuckets = [
    { label: '<1 分钟', min: 0, max: 60, count: 0 },
    { label: '1-3 分钟', min: 60, max: 180, count: 0 },
    { label: '3-5 分钟', min: 180, max: 300, count: 0 },
    { label: '5-10 分钟', min: 300, max: 600, count: 0 },
    { label: '10-20 分钟', min: 600, max: 1200, count: 0 },
    { label: '20-30 分钟', min: 1200, max: 1800, count: 0 },
    { label: '>30 分钟', min: 1800, max: Infinity, count: 0 },
  ];
  for (const v of videos) {
    const d = v.duration || 0;
    const bucket = durationBuckets.find((b) => d >= b.min && d < b.max);
    if (bucket) bucket.count++;
  }

  const hourHist = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: 0,
  }));
  for (const v of videos) {
    if (!v.pubdate) continue;
    const d = new Date(v.pubdate * 1000 + 8 * 60 * 60 * 1000);
    hourHist[d.getUTCHours()].count++;
  }

  const tagCount = new Map();
  for (const v of videos) {
    for (const t of v.tags.ordinaryTags || []) {
      tagCount.set(t, (tagCount.get(t) || 0) + 1);
    }
  }

  const totalViewsAll = videos.reduce((a, v) => a + safe(v.views), 0);
  const totalLikeAll = videos.reduce((a, v) => a + safe(v.statLike), 0);
  const totalCoinAll = videos.reduce((a, v) => a + safe(v.statCoin), 0);
  const totalFavoriteAll = videos.reduce((a, v) => a + safe(v.statFavorite), 0);
  const totalShareAll = videos.reduce((a, v) => a + safe(v.statShare), 0);

  const topEngagement = videos
    .map((v) => {
      const views = safe(v.views);
      const eng =
        views > 0
          ? (safe(v.statLike) +
              safe(v.statCoin) * 2 +
              safe(v.statFavorite) * 2 +
              safe(v.statShare)) /
            views
          : 0;
      return {
        bvid: v.bvid,
        title: v.title,
        UP: v.UP,
        mid: v.mid,
        views,
        like: safe(v.statLike),
        coin: safe(v.statCoin),
        favorite: safe(v.statFavorite),
        share: safe(v.statShare),
        engagement: eng,
      };
    })
    .filter((v) => v.views > 0)
    .sort((a, b) => b.engagement - a.engagement || b.views - a.views)
    .slice(0, 10);

  return {
    summary: {
      totalVideos: videos.length,
      totalUp: upMap.size,
      totalViews: totalViewsAll,
      totalLike: totalLikeAll,
      totalCoin: totalCoinAll,
      totalFavorite: totalFavoriteAll,
      totalReply: videos.reduce((a, v) => a + safe(v.statReply), 0),
      totalDanmaku: videos.reduce((a, v) => a + safe(v.statDanmaku), 0),
      avgEngagement:
        totalViewsAll > 0
          ? (totalLikeAll +
              totalCoinAll * 2 +
              totalFavoriteAll * 2 +
              totalShareAll) /
            totalViewsAll
          : 0,
    },
    channels: Array.from(channelMap.values())
      .map((c) => ({
        firstChannel: c.firstChannel,
        count: c.count,
        views: c.views,
        avgViews: c.count > 0 ? Math.round(c.views / c.count) : 0,
        like: c.like,
        coin: c.coin,
        favorite: c.favorite,
        secondChannels: Array.from(c.secondChannels.values()).sort(
          (a, b) => b.count - a.count
        ),
      }))
      .sort((a, b) => b.count - a.count),
    topUps: Array.from(upMap.values())
      .sort((a, b) => b.count - a.count || b.views - a.views)
      .slice(0, 30),
    duration: durationBuckets,
    hourHeatmap: hourHist,
    topTags: Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 60),
    topEngagement,
  };
}
