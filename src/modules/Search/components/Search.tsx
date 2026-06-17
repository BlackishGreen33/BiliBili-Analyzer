'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilter } from 'react-icons/fa';

import { Badge } from '@/common/components/ui/badge';
import { useToast } from '@/common/components/ui/use-toast';
import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useLatestCrawl, useResultList } from '@/common/libs/result-data';
import { containerStagger, EASE_OUT_EXPO } from '@/common/styles/motion';
import { extractBvid, formatDateTime } from '@/common/utils/format';
import { buildChannelOptions } from '@/common/utils/search-filters';

import FilterPanel from './FilterPanel';
import VideoGrid from './VideoGrid';
import { useInfiniteScroll, useSearchFilters, useSearchState } from '../hooks';

const Search: React.FC = React.memo(() => {
  const router = useRouter();
  const { currentColor } = useThemeStore();
  const { screenSize } = useLayoutStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: list = [] } = useResultList();
  // 先取 state (含 effectiveTime),再依 effectiveTime 去抓對應的 json,
  // 這樣換日期才會真的換資料 (舊版用 list[0] 永遠抓最新一天)。
  const state = useSearchState({ list }, router);
  const {
    effectiveTime,
    searchValue,
    selectedChannels,
    activeTag,
    setSearchValue,
    setSelectedChannels,
    setActiveTag,
    handleReset,
    handleChangeDate,
  } = state;
  const { data: result, isLoading } = useLatestCrawl(effectiveTime);

  const { filtered, visible, loadMore } = useSearchFilters({
    result: result ?? null,
    searchValue,
    selectedChannels,
    activeTag,
  });

  const channelOptions = useMemo(
    () => (result ? buildChannelOptions(result.video) : []),
    [result]
  );

  useInfiniteScroll({
    hasMore: visible.length < filtered.length,
    visible: visible.length,
    total: filtered.length,
    onLoadMore: loadMore,
  });

  const handleRowClick = useCallback(
    (url: string) => {
      const bvid = extractBvid(url);
      if (!bvid) {
        toast({
          variant: 'destructive',
          title: t('detail.bvidMissing.title'),
          description: t('detail.bvidMissing.desc'),
        });
        return;
      }
      router.push('/details?bvid=' + bvid);
    },
    [router, toast, t]
  );

  const gridCols = useMemo(() => {
    const w = screenSize ?? 1280;
    if (w <= 768) return 1;
    if (w <= 1024) return 2;
    if (w <= 1280) return 3;
    return 4;
  }, [screenSize]);

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <motion.div
        className="mx-auto mb-10 max-w-5xl"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t('search.hero.title')}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t('search.hero.hint', {
            time: result ? formatDateTime(result.time) : t('common.loading'),
            count: result?.video.length ?? 0,
          })}
        </p>
      </motion.div>

      <FilterPanel
        list={list}
        channelOptions={channelOptions}
        effectiveTime={effectiveTime}
        searchValue={searchValue}
        selectedChannels={selectedChannels}
        activeTag={activeTag}
        filteredCount={filtered.length}
        totalCount={result?.video.length ?? 0}
        setSearchValue={setSearchValue}
        setSelectedChannels={setSelectedChannels}
        handleReset={handleReset}
        handleChangeDate={handleChangeDate}
      />

      <AnimatePresence mode="wait">
        {activeTag && (
          <motion.div
            key="active-tag"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mb-4 flex max-w-7xl items-center gap-2 text-sm"
          >
            <FaFilter className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground">
              {t('search.filter.currentTag')}
            </span>
            <Badge variant="secondary">{activeTag}</Badge>
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors"
            >
              {t('common.clear')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && !result ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 p-4"
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {Array.from({ length: gridCols * 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted h-[340px] animate-pulse rounded-xl"
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={containerStagger(0.04, 0.02)}
          initial="hidden"
          animate="show"
        >
          <VideoGrid
            visible={visible}
            filteredCount={filtered.length}
            hasMore={visible.length < filtered.length}
            currentColor={currentColor}
            onCardClick={handleRowClick}
            onTagClick={setActiveTag}
            onReset={handleReset}
            gridCols={gridCols}
          />
        </motion.div>
      )}
    </div>
  );
});
Search.displayName = 'Search';

export default Search;
