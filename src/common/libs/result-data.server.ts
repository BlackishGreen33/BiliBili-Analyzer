import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import 'server-only';

import type { AggregationResult } from '@/common/aggregations/build.d.ts';
import { buildAggregations as buildAggregationsRaw } from '@/common/aggregations/build.mjs';
import { CrawlResultSchema } from '@/common/types/schema';
import type { CrawlResult } from '@/common/types/video';

const RESULT_BASE_URL =
  'https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result';
const AGG_BASE_URL =
  'https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result';

const LIST_TTL_MS = 60 * 1000;
const AGG_TTL_MS = 5 * 60 * 1000;

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

// === Pre-aggregated dashboard fast path ===
//
// The crawler (CrawlPopular.mjs) publishes two JSON files alongside each
// raw {date}.json:
//   - agg-latest.json: DashboardAgg for the most recent day
//   - agg-{date}.json: per-day pre-aggregated snapshot
// Both include `time` so consumers can build a DashboardAgg without
// re-fetching the raw video list.

export type PreAggregatedDay = AggregationResult & {
  time: number;
  file: string;
};

type AggCacheEntry = { data: PreAggregatedDay | null; at: number };
let cachedAggLatest: AggCacheEntry | null = null;
let inFlightAggLatest: Promise<PreAggregatedDay | null> | null = null;
const aggByFileCache = new Map<string, AggCacheEntry>();
const aggInFlightByFile = new Map<string, Promise<PreAggregatedDay | null>>();

function readLocalAggLatest(): PreAggregatedDay | null {
  const p = path.join(process.cwd(), 'result', 'agg-latest.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as PreAggregatedDay;
  } catch {
    return null;
  }
}

function readLocalAggByName(filename: string): PreAggregatedDay | null {
  const p = path.join(process.cwd(), 'result', `agg-${filename}.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as PreAggregatedDay;
  } catch {
    return null;
  }
}

async function fetchAggRemote(url: string): Promise<PreAggregatedDay | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as PreAggregatedDay;
}

export async function fetchAggLatest(): Promise<PreAggregatedDay | null> {
  if (useLocal) return readLocalAggLatest();
  const now = Date.now();
  if (cachedAggLatest && now - cachedAggLatest.at < AGG_TTL_MS) {
    return cachedAggLatest.data;
  }
  if (inFlightAggLatest) return inFlightAggLatest;
  inFlightAggLatest = fetchAggRemote(`${AGG_BASE_URL}/agg-latest.json`)
    .catch(() => null)
    .finally(() => {
      inFlightAggLatest = null;
    });
  const data = await inFlightAggLatest;
  cachedAggLatest = { data, at: Date.now() };
  return data;
}

export async function fetchAggByName(
  filename: string
): Promise<PreAggregatedDay | null> {
  if (useLocal) return readLocalAggByName(filename);
  const now = Date.now();
  const hit = aggByFileCache.get(filename);
  if (hit && now - hit.at < AGG_TTL_MS) return hit.data;
  const inflight = aggInFlightByFile.get(filename);
  if (inflight) return inflight;
  const promise = fetchAggRemote(`${AGG_BASE_URL}/agg-${filename}.json`)
    .catch(() => null)
    .finally(() => {
      aggInFlightByFile.delete(filename);
    });
  aggInFlightByFile.set(filename, promise);
  const data = await promise;
  aggByFileCache.set(filename, { data, at: Date.now() });
  return data;
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
  summary: AggregationResult['summary'];
  channels: AggregationResult['channels'];
  topUps: AggregationResult['topUps'];
  duration: AggregationResult['duration'];
  hourHeatmap: AggregationResult['hourHeatmap'];
  topTags: AggregationResult['topTags'];
  topEngagement: AggregationResult['topEngagement'];
};

/**
 * Aggregation logic lives in src/common/aggregations/build.mjs so the
 * Crawler (CrawlPopular.mjs) and the API routes (this file) share one
 * implementation. This is a thin re-export with the existing
 * `Omit<DashboardAgg, 'file' | 'time'>` return shape.
 */
export function buildAggregations(
  videos: CrawlVideo[]
): Omit<DashboardAgg, 'file' | 'time'> {
  return buildAggregationsRaw(videos) as Omit<DashboardAgg, 'file' | 'time'>;
}
