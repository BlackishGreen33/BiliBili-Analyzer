/**
 * src/common/libs/use-latency.ts
 *
 * useLatency — 發布到上榜延遲分佈（SWR 變體；streaming 變體見 use-latency-stream.ts）。
 */

import useSWR from 'swr';

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
