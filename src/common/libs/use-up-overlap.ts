/**
 * src/common/libs/use-up-overlap.ts
 *
 * useUpOverlap — UP 主跨分區排行。
 */

import useSWR from 'swr';

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

export function useUpOverlap(window: number, minChannels = 2, minCount = 2) {
  const params = new URLSearchParams({
    window: String(window),
    minChannels: String(minChannels),
    minCount: String(minCount),
  });
  return useSWR<UpOverlapData>(`/api/up/overlap?${params.toString()}`);
}
