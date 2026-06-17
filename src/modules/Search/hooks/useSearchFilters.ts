'use client';

import { useMemo, useState } from 'react';

import type { VideoData } from '@/common/types/video';
import {
  type ChannelSelection,
  filterVideos,
  PAGE_SIZE,
} from '@/common/utils/search-filters';

export type SearchFilters = {
  result: { video: VideoData[] } | null;
  searchValue: string;
  selectedChannels: ChannelSelection;
  activeTag: string | null;
};

export type SearchFiltersApi = {
  filtered: VideoData[];
  visible: VideoData[];
  loadMore: () => void;
};

/**
 * 純粹把 result + filter state 算出 visible / filtered。
 *
 * 與原本 useSearchFilters 的差別:不再擁有 selectedTime / searchValue / channel
 * state (改由 useSearchState 負責),也不再接 router 做 URL sync。
 * 這樣可以確保 useLatestCrawl 在 useSearchState 之後呼叫,並用 effectiveTime
 * 作為 SWR key,讓換日期能換資料。
 */
export function useSearchFilters({
  result,
  searchValue,
  selectedChannels,
  activeTag,
}: SearchFilters): SearchFiltersApi {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!result) return [];
    return filterVideos<VideoData>({
      videos: result.video,
      q: searchValue,
      channels: selectedChannels,
      tag: activeTag,
    });
  }, [result, searchValue, selectedChannels, activeTag]);

  const effectiveVisibleCount =
    filtered.length > 0
      ? Math.min(visibleCount, filtered.length)
      : visibleCount;

  const visible = useMemo(
    () => filtered.slice(0, effectiveVisibleCount),
    [filtered, effectiveVisibleCount]
  );

  const loadMore = () => {
    setVisibleCount((c) => c + PAGE_SIZE);
  };

  return { filtered, visible, loadMore };
}
