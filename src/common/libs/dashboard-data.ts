'use client';

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

export type TrendPoint = {
  file: string;
  date: string;
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagement: number;
  avgViews: number;
  duration: Array<{ label: string; count: number }>;
};

export type TrendData = {
  window: number;
  isMock: boolean;
  realCount: number;
  points: TrendPoint[];
};

const trendFetcher = async (url: string): Promise<TrendData> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to load trend data');
  }
  return (await res.json()) as TrendData;
};

export function useDashboardTrend(window: number) {
  return useSWR<TrendData>(
    `/api/dashboard/trend?window=${window}`,
    trendFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
}

export type WordCloudToken = { word: string; count: number };

export type WordCloudData = {
  file: string;
  tokens: WordCloudToken[];
};

const wordcloudFetcher = async (url: string): Promise<WordCloudData> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to load wordcloud');
  }
  return (await res.json()) as WordCloudData;
};

export function useWordCloud() {
  return useSWR<WordCloudData>('/api/wordcloud', wordcloudFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}

export type UpOverlapItem = {
  name: string;
  mid?: number;
  channelCount: number;
  totalCount: number;
  views: number;
  channels: Array<{ firstChannel: string; count: number }>;
};

export type UpOverlapData = {
  window: number;
  minChannels: number;
  minCount: number;
  totalUps: number;
  items: UpOverlapItem[];
};

const upOverlapFetcher = async (url: string): Promise<UpOverlapData> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to load up overlap');
  }
  return (await res.json()) as UpOverlapData;
};

export function useUpOverlap(window: number, minChannels = 2, minCount = 2) {
  const params = new URLSearchParams({
    window: String(window),
    minChannels: String(minChannels),
    minCount: String(minCount),
  });
  return useSWR<UpOverlapData>(
    `/api/up/overlap?${params.toString()}`,
    upOverlapFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
}

export type LatencyBucketKey =
  | 'd0'
  | 'd1'
  | 'd2'
  | 'd3'
  | 'd4'
  | 'd5'
  | 'd6to7'
  | 'd8to14'
  | 'd15to30'
  | 'd30plus';

export type LatencyPoint = { key: LatencyBucketKey; count: number };

export type LatencyData = {
  window: number;
  total: number;
  buckets: LatencyPoint[];
  avgDays: number;
  medianDays: number;
};

const latencyFetcher = async (url: string): Promise<LatencyData> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to load latency');
  }
  return (await res.json()) as LatencyData;
};

export function useLatency(window: number) {
  return useSWR<LatencyData>(`/api/latency?window=${window}`, latencyFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
}

export type LengthDistribution = {
  label: string;
  min: number;
  max: number;
  share: number;
  count: number;
};

export type LengthRecommendData = {
  scope: { type: 'up' | 'channel' | 'tag'; value: string };
  window: number;
  primary: { label: string; share: number; count: number } | null;
  distribution: LengthDistribution[];
  sampleSize: number;
  confidence: 'low' | 'mid' | 'high';
  /** v2: 中位數 + IQR */
  medianSeconds: number;
  p25: number;
  p75: number;
  rationaleKey:
    | 'length.rationale.notEnough'
    | 'length.rationale.globalFallback'
    | 'length.rationale.scope';
};

const lengthFetcher = async (url: string): Promise<LengthRecommendData> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to load length recommend');
  }
  return (await res.json()) as LengthRecommendData;
};

export function useLengthRecommend(
  type: 'up' | 'channel' | 'tag',
  value: string,
  window: number
) {
  const params = new URLSearchParams({ type, value, window: String(window) });
  return useSWR<LengthRecommendData>(
    type && value ? `/api/length/recommend?${params.toString()}` : null,
    lengthFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
}
