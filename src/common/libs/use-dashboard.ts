/**
 * src/common/libs/use-dashboard.ts
 *
 * useDashboard + useDashboardCompare — 載入 `/api/dashboard` 預聚合資料。
 * 「單日」與「跨日比較」分屬兩個 endpoint, 但都吃同一個 DashboardData shape。
 */

import useSWR from 'swr';

export type EngagementItem = {
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
};

export type DashboardData = {
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
    /** 加權平均互動率 = (Σ like + 2·coin + 2·favorite + share) / Σ view */
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
  /** 互動率 TOP 10 */
  topEngagement: EngagementItem[];
};

const fetcher = async (url: string): Promise<DashboardData> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load dashboard');
  return (await res.json()) as DashboardData;
};

export function useDashboard(filename: string | null) {
  return useSWR<DashboardData>(
    filename
      ? `/api/dashboard?file=${encodeURIComponent(filename)}`
      : '/api/dashboard',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
}

export type CompareData = {
  a: DashboardData;
  b: DashboardData;
  diff: {
    newBvids: string[];
    droppedBvids: string[];
    persistentBvids: string[];
    persistentCount: number;
    totals: {
      totalVideos: number;
      totalUp: number;
      totalViews: number;
      totalEngagement: number;
      avgEngagement: number;
    };
    totalsDelta: {
      totalVideos: number;
      totalUp: number;
      totalViews: number;
      totalEngagement: number;
      avgEngagement: number;
    };
    channelShift: Array<{
      firstChannel: string;
      countA: number;
      countB: number;
      delta: number;
    }>;
    upShift: Array<{
      name: string;
      mid?: number;
      countA: number;
      countB: number;
      delta: number;
    }>;
    tagShift: {
      newTags: string[];
      droppedTags: string[];
      commonTags: number;
    };
  };
};

const compareFetcher = async (url: string): Promise<CompareData> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to load compare data');
  }
  return (await res.json()) as CompareData;
};

export function useDashboardCompare(a: string | null, b: string | null) {
  return useSWR<CompareData>(
    a && b && a !== b
      ? `/api/dashboard/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`
      : null,
    compareFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
}
