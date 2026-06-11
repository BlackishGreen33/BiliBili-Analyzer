'use client';

import useSWR from 'swr';

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
