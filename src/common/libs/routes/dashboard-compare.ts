/**
 * src/common/libs/routes/dashboard-compare.ts
 *
 * 給 `/api/dashboard/compare` route 用的純函數。
 * 把原本 200 行的 `computeDiff` 拆成 4 個小 helper,易於單獨測試。
 */

import type {
  CrawlVideo,
  DashboardAgg,
} from '@/common/libs/result-data.server';

export type CompareTotals = {
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagement: number;
};

export function extractBvidSets(
  rawA: CrawlVideo[],
  rawB: CrawlVideo[]
): {
  newBvids: string[];
  droppedBvids: string[];
  persistentBvids: string[];
  persistentCount: number;
} {
  const setA = new Set(rawA.map((v) => v.bvid));
  const setB = new Set(rawB.map((v) => v.bvid));
  const newBvids = rawB.map((v) => v.bvid).filter((b) => !setA.has(b));
  const droppedBvids = rawA.map((v) => v.bvid).filter((b) => !setB.has(b));
  const persistentBvids = rawA.map((v) => v.bvid).filter((b) => setB.has(b));
  return {
    newBvids,
    droppedBvids,
    persistentBvids,
    persistentCount: persistentBvids.length,
  };
}

export function totalsOf(agg: DashboardAgg): CompareTotals {
  return {
    totalVideos: agg.summary.totalVideos,
    totalUp: agg.summary.totalUp,
    totalViews: agg.summary.totalViews,
    totalEngagement:
      agg.summary.totalLike +
      agg.summary.totalCoin * 2 +
      agg.summary.totalFavorite * 2,
    avgEngagement: agg.summary.avgEngagement,
  };
}

export function computeTotalsDelta(
  tA: CompareTotals,
  tB: CompareTotals
): CompareTotals {
  return {
    totalVideos: tB.totalVideos - tA.totalVideos,
    totalUp: tB.totalUp - tA.totalUp,
    totalViews: tB.totalViews - tA.totalViews,
    totalEngagement: tB.totalEngagement - tA.totalEngagement,
    avgEngagement: tB.avgEngagement - tA.avgEngagement,
  };
}

export type ChannelShiftItem = {
  firstChannel: string;
  countA: number;
  countB: number;
  delta: number;
};

export function buildChannelShift(
  aggA: DashboardAgg,
  aggB: DashboardAgg
): ChannelShiftItem[] {
  const chMap = new Map<
    string,
    { firstChannel: string; countA: number; countB: number }
  >();
  for (const c of aggA.channels) {
    chMap.set(c.firstChannel, {
      firstChannel: c.firstChannel,
      countA: c.count,
      countB: 0,
    });
  }
  for (const c of aggB.channels) {
    const e = chMap.get(c.firstChannel) || {
      firstChannel: c.firstChannel,
      countA: 0,
      countB: 0,
    };
    e.countB = c.count;
    chMap.set(c.firstChannel, e);
  }
  return Array.from(chMap.values())
    .map((c) => ({ ...c, delta: c.countB - c.countA }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export type UpShiftItem = {
  name: string;
  mid?: number;
  countA: number;
  countB: number;
  delta: number;
};

export function buildUpShift(
  aggA: DashboardAgg,
  aggB: DashboardAgg,
  limit = 30
): UpShiftItem[] {
  const upMap = new Map<
    string,
    { name: string; mid?: number; countA: number; countB: number }
  >();
  for (const u of aggA.topUps) {
    const key = String(u.mid ?? u.name);
    upMap.set(key, {
      name: u.name,
      mid: u.mid,
      countA: u.count,
      countB: 0,
    });
  }
  for (const u of aggB.topUps) {
    const key = String(u.mid ?? u.name);
    const e = upMap.get(key) || {
      name: u.name,
      mid: u.mid,
      countA: 0,
      countB: 0,
    };
    e.countB = u.count;
    upMap.set(key, e);
  }
  return Array.from(upMap.values())
    .map((u) => ({ ...u, delta: u.countB - u.countA }))
    .filter((u) => u.countA > 0 || u.countB > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

export type TagShift = {
  newTags: string[];
  droppedTags: string[];
  commonTags: number;
};

export function buildTagShift(
  aggA: DashboardAgg,
  aggB: DashboardAgg
): TagShift {
  const tagSetA = new Set(aggA.topTags.map((t) => t.tag));
  const tagSetB = new Set(aggB.topTags.map((t) => t.tag));
  const newTags = Array.from(tagSetB).filter((t) => !tagSetA.has(t));
  const droppedTags = Array.from(tagSetA).filter((t) => !tagSetB.has(t));
  const commonTags = Array.from(tagSetA).filter((t) => tagSetB.has(t)).length;
  return { newTags, droppedTags, commonTags };
}

export type CompareDiff = {
  newBvids: string[];
  droppedBvids: string[];
  persistentBvids: string[];
  persistentCount: number;
  totals: CompareTotals;
  totalsDelta: CompareTotals;
  channelShift: ChannelShiftItem[];
  upShift: UpShiftItem[];
  tagShift: TagShift;
};

/**
 * 組合 4 個 helper,給 compare route 用。
 * 行為必須與原 route 內 computeDiff 完全等價（api-routes.test.ts 是 regression net）。
 */
export function computeDiff(
  rawA: CrawlVideo[],
  rawB: CrawlVideo[],
  aggA: DashboardAgg,
  aggB: DashboardAgg
): CompareDiff {
  const bvidSets = extractBvidSets(rawA, rawB);
  const tA = totalsOf(aggA);
  const tB = totalsOf(aggB);
  return {
    ...bvidSets,
    totals: tB,
    totalsDelta: computeTotalsDelta(tA, tB),
    channelShift: buildChannelShift(aggA, aggB),
    upShift: buildUpShift(aggA, aggB),
    tagShift: buildTagShift(aggA, aggB),
  };
}
