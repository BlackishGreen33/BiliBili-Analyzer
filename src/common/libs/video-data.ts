'use client';

import useSWR from 'swr';

import type { VideoData } from '@/common/types/video';

const fetcher = async (
  url: string
): Promise<{ file: string; count: number; video: VideoData[] }> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed');
  return (await res.json()) as {
    file: string;
    count: number;
    video: VideoData[];
  };
};

export function useRelatedVideos(params: {
  mode: 'up' | 'channel' | 'tag';
  value: string;
}) {
  const { mode, value } = params;
  return useSWR(
    value ? `/api/video?mode=${mode}&value=${encodeURIComponent(value)}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
}
