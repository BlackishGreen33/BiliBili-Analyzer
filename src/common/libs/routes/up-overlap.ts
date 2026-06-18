/**
 * src/common/libs/routes/up-overlap.ts
 *
 * 給 `/api/up/overlap` route 用的純函數：
 * - `parseOverlapParams` 解析並裁剪 4 個 query 參數
 * - `buildUpMap` 跨日累積 UP 主 → 分區統計
 * - `aggregateUpOverlap` 篩選 + 排序 + slice
 */

import type { CrawlVideo } from '@/common/libs/result-data.server';
import {
  type IntRangeOpts,
  parseIntInRange,
} from '@/common/libs/routes/shared';

export type UpOverlapItem = {
  name: string;
  mid?: number;
  channelCount: number;
  totalCount: number;
  views: number;
  channels: Array<{ firstChannel: string; count: number }>;
};

export type UpOverlapPayload = {
  window: number;
  minChannels: number;
  minCount: number;
  totalUps: number;
  items: UpOverlapItem[];
};

export const OVERLAP_DEFAULTS = {
  window: { default: 30, min: 1, max: 90 } satisfies IntRangeOpts,
  minChannels: {
    default: 2,
    min: 2,
    max: Number.MAX_SAFE_INTEGER,
  } satisfies IntRangeOpts,
  minCount: {
    default: 2,
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
  } satisfies IntRangeOpts,
  limit: { default: 50, min: 1, max: 200 } satisfies IntRangeOpts,
};

export function parseOverlapParams(url: URL): {
  window: number;
  minChannels: number;
  minCount: number;
  limit: number;
} {
  return {
    window: parseIntInRange(url, 'window', OVERLAP_DEFAULTS.window),
    minChannels: parseIntInRange(
      url,
      'minChannels',
      OVERLAP_DEFAULTS.minChannels
    ),
    minCount: parseIntInRange(url, 'minCount', OVERLAP_DEFAULTS.minCount),
    limit: parseIntInRange(url, 'limit', OVERLAP_DEFAULTS.limit),
  };
}

type UpAcc = {
  name: string;
  mid?: number;
  channelMap: Map<string, number>;
  totalCount: number;
  views: number;
};

export function buildUpMap(videosList: CrawlVideo[][]): Map<string, UpAcc> {
  const upMap = new Map<string, UpAcc>();
  for (const v of videosList.flat()) {
    const name = v.UP || '';
    if (!name && !v.mid) continue;
    const key = String(v.mid ?? name);
    const ch = v.tags?.firstChannel || '未分类';
    const e: UpAcc =
      upMap.get(key) ??
      ({
        name: v.UP,
        mid: v.mid,
        channelMap: new Map(),
        totalCount: 0,
        views: 0,
      } as UpAcc);
    e.totalCount++;
    e.views += Number.isFinite(v.views) ? v.views : 0;
    e.channelMap.set(ch, (e.channelMap.get(ch) ?? 0) + 1);
    upMap.set(key, e);
  }
  return upMap;
}

export function aggregateUpOverlap(
  upMap: Map<string, UpAcc>,
  opts: { minChannels: number; minCount: number; limit: number }
): Omit<UpOverlapPayload, 'window'> {
  const items: UpOverlapItem[] = [];
  for (const e of upMap.values()) {
    const channelCount = e.channelMap.size;
    if (channelCount < opts.minChannels) continue;
    if (e.totalCount < opts.minCount) continue;
    items.push({
      name: e.name,
      mid: e.mid,
      channelCount,
      totalCount: e.totalCount,
      views: e.views,
      channels: Array.from(e.channelMap.entries())
        .map(([firstChannel, count]) => ({ firstChannel, count }))
        .sort((a, b) => b.count - a.count),
    });
  }

  items.sort(
    (a, b) =>
      b.channelCount - a.channelCount ||
      b.totalCount - a.totalCount ||
      b.views - a.views
  );

  return {
    minChannels: opts.minChannels,
    minCount: opts.minCount,
    totalUps: upMap.size,
    items: items.slice(0, opts.limit),
  };
}
