'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  type ChannelSelection,
  decodeChannels,
  encodeChannels,
  filterVideos,
  PAGE_SIZE,
} from '@/common/utils/search-filters';

export type SearchFilters = {
  result: {
    video: Array<Parameters<typeof filterVideos>[0]['videos'][number]>;
  } | null;
  list: string[];
};

export type SearchFiltersApi = {
  searchValue: string;
  selectedChannels: ChannelSelection;
  activeTag: string | null;
  selectedTime: string | null;
  effectiveTime: string | null;
  filtered: unknown[];
  visible: unknown[];
  setSearchValue: (v: string) => void;
  setSelectedChannels: (
    cs: ChannelSelection | ((prev: ChannelSelection) => ChannelSelection)
  ) => void;
  setActiveTag: (t: string | null) => void;
  handleReset: () => void;
  handleChangeDate: (f: string) => void;
  loadMore: () => void;
};

/**
 * 封裝 Search 頁的 state + URL sync + 自動 reset on date change
 */
export function useSearchFilters(
  { result, list }: SearchFilters,
  router: ReturnType<typeof useRouter>
): SearchFiltersApi {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const initialTag = searchParams.get('tag') ?? '';
  const initialDate = searchParams.get('date') ?? '';
  const initialChannels = decodeChannels(searchParams.get('c'));

  const [selectedTime, setSelectedTime] = useState<string | null>(
    initialDate || null
  );
  const effectiveTime = selectedTime ?? list[0] ?? null;
  const [searchValue, setSearchValue] = useState(initialQ);
  const [selectedChannelsState, setSelectedChannelsState] =
    useState<ChannelSelection>(initialChannels);
  const [activeTag, setActiveTag] = useState<string | null>(initialTag || null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const setSelectedChannels = (
    cs: ChannelSelection | ((prev: ChannelSelection) => ChannelSelection)
  ) => {
    if (typeof cs === 'function') {
      setSelectedChannelsState((prev) =>
        (cs as (p: ChannelSelection) => ChannelSelection)(prev)
      );
    } else {
      setSelectedChannelsState(cs);
    }
  };

  const filtered = useMemo(() => {
    if (!result) return [];
    return filterVideos({
      videos: result.video as Parameters<typeof filterVideos>[0]['videos'],
      q: searchValue,
      channels: selectedChannelsState,
      tag: activeTag,
    });
  }, [result, searchValue, selectedChannelsState, activeTag]);

  // 當篩選後的清單變小，動態調整 visibleCount
  // 用 derived state 取代 setState-in-effect（避免 React 19 cascading render 警告）
  const effectiveVisibleCount =
    filtered.length > 0
      ? Math.min(visibleCount, filtered.length)
      : visibleCount;

  const visible = useMemo(
    () => filtered.slice(0, effectiveVisibleCount),
    [filtered, effectiveVisibleCount]
  );

  useEffect(() => {
    if (!effectiveTime) return;
    const params = new URLSearchParams();
    if (searchValue.trim()) params.set('q', searchValue.trim());
    if (selectedChannelsState.length > 0)
      params.set('c', encodeChannels(selectedChannelsState));
    if (activeTag) params.set('tag', activeTag);
    if (selectedTime) params.set('date', selectedTime);
    const qs = params.toString();
    const target = qs ? `/?${qs}` : '/';
    if (
      typeof window !== 'undefined' &&
      window.location.pathname + window.location.search !== target
    ) {
      router.replace(target, { scroll: false });
    }
  }, [
    router,
    searchValue,
    selectedChannelsState,
    activeTag,
    selectedTime,
    effectiveTime,
  ]);

  const handleReset = () => {
    setSearchValue('');
    setSelectedChannelsState([]);
    setActiveTag(null);
  };

  const handleChangeDate = (filename: string) => {
    setSelectedTime(filename);
    handleReset();
  };

  const loadMore = () => {
    setVisibleCount((c) => c + PAGE_SIZE);
  };

  return {
    searchValue,
    selectedChannels: selectedChannelsState,
    activeTag,
    selectedTime,
    effectiveTime,
    filtered,
    visible,
    setSearchValue,
    setSelectedChannels,
    setActiveTag,
    handleReset,
    handleChangeDate,
    loadMore,
  };
}
