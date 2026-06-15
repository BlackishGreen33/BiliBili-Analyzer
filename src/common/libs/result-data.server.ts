import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import 'server-only';

import type { AggregationResult } from '@/common/aggregations/build.d.ts';
import { buildAggregations as buildAggregationsImpl } from '@/common/aggregations/build.mjs';
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
  return buildAggregationsImpl(videos);
}
