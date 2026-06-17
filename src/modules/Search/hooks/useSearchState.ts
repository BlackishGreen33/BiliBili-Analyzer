'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  type ChannelSelection,
  decodeChannels,
  encodeChannels,
} from '@/common/utils/search-filters';

export type SearchStateApi = {
  searchValue: string;
  selectedChannels: ChannelSelection;
  activeTag: string | null;
  selectedTime: string | null;
  effectiveTime: string | null;
  setSearchValue: (v: string) => void;
  setSelectedChannels: (
    cs: ChannelSelection | ((prev: ChannelSelection) => ChannelSelection)
  ) => void;
  setActiveTag: (t: string | null) => void;
  handleReset: () => void;
  handleChangeDate: (f: string) => void;
};

/**
 * 封裝 Search 頁的 state + URL sync。
 *
 * 與 useSearchFilters 的差別:這裡不依賴 `result`,所以可以比 SWR 抓資料的
 * `useLatestCrawl` 更早呼叫,讓 useLatestCrawl 拿到使用者選的日期 (effectiveTime)
 * 作為 key,而不是固定抓最新一天的 list[0]。
 */
export function useSearchState(
  { list }: { list: string[] },
  router: ReturnType<typeof useRouter>
): SearchStateApi {
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

  return {
    searchValue,
    selectedChannels: selectedChannelsState,
    activeTag,
    selectedTime,
    effectiveTime,
    setSearchValue,
    setSelectedChannels,
    setActiveTag,
    handleReset,
    handleChangeDate,
  };
}
