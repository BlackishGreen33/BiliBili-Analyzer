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

export function useLatency(window: number) {
  return useSWR<LatencyData>(`/api/latency?window=${window}`);
}
