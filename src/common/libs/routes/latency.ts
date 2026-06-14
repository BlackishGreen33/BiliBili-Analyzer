/**
 * src/common/libs/routes/latency.ts
 *
 * 給 `/api/latency` route 用的純函數：
 * - `bucketFor` 將發布到上榜的天數差對應到 10 桶
 * - `computeLatencyStats` 由 delays 數列算 avg / median
 * - `payloadToEvents` 拆成 NDJSON stream events
 */

import type { StreamEvent } from '@/common/libs/streaming';

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

export const BUCKET_ORDER: LatencyBucketKey[] = [
  'd0',
  'd1',
  'd2',
  'd3',
  'd4',
  'd5',
  'd6to7',
  'd8to14',
  'd15to30',
  'd30plus',
];

export function bucketFor(days: number): LatencyBucketKey {
  if (days <= 0) return 'd0';
  if (days === 1) return 'd1';
  if (days === 2) return 'd2';
  if (days === 3) return 'd3';
  if (days === 4) return 'd4';
  if (days === 5) return 'd5';
  if (days <= 7) return 'd6to7';
  if (days <= 14) return 'd8to14';
  if (days <= 30) return 'd15to30';
  return 'd30plus';
}

export function computeLatencyStats(delays: number[]): {
  total: number;
  avgDays: number;
  medianDays: number;
} {
  if (delays.length === 0) {
    return { total: 0, avgDays: 0, medianDays: 0 };
  }
  const sorted = [...delays].sort((a, b) => a - b);
  const total = sorted.length;
  const avgDays = sorted.reduce((a, b) => a + b, 0) / total;
  const medianDays =
    total % 2 === 1
      ? sorted[(total - 1) / 2]
      : (sorted[total / 2 - 1] + sorted[total / 2]) / 2;
  return { total, avgDays, medianDays };
}

export type LatencyPoint = { key: LatencyBucketKey; count: number };

export type LatencyPayload = {
  window: number;
  total: number;
  buckets: LatencyPoint[];
  avgDays: number;
  medianDays: number;
};

export function payloadToEvents(payload: LatencyPayload): StreamEvent[] {
  const events: StreamEvent[] = [
    { type: 'meta', window: payload.window, total: payload.total },
  ];
  for (const b of payload.buckets) {
    events.push({ type: 'chunk', data: b });
  }
  events.push({
    type: 'done',
    avgDays: payload.avgDays,
    medianDays: payload.medianDays,
  });
  return events;
}
