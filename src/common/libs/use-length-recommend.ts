/**
 * src/common/libs/use-length-recommend.ts
 *
 * useLengthRecommend — 視頻長度預測（基於歷史 N 天資料）。
 */

import useSWR from 'swr';

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

export function useLengthRecommend(
  type: 'up' | 'channel' | 'tag',
  value: string,
  window: number
) {
  const params = new URLSearchParams({ type, value, window: String(window) });
  return useSWR<LengthRecommendData>(
    type && value ? `/api/length/recommend?${params.toString()}` : null
  );
}
