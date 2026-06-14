'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilter, FaSearch, FaTimes, FaUserAlt } from 'react-icons/fa';
import { LuShare2 } from 'react-icons/lu';

import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { Input } from '@/common/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/components/ui/select';
import { useToast } from '@/common/components/ui/use-toast';
import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useLatestCrawl, useResultList } from '@/common/libs/result-data';
import {
  containerStagger,
  EASE_OUT_EXPO,
  fadeUp,
} from '@/common/styles/motion';
import { cn } from '@/common/utils';
import {
  extractBvid,
  formatDateTime,
  formatViews,
} from '@/common/utils/format';
import { buildChannelOptions } from '@/common/utils/search-filters';

import { useInfiniteScroll, useSearchFilters } from '../hooks';

type VideoItem = {
  bvid: string;
  url: string;
  cover: string;
  title: string;
  UP: string;
  views: number;
  tags: {
    firstChannel: string;
    secondChannel: string;
    ordinaryTags: string[];
  };
};

const VideoCard: React.FC<{
  item: VideoItem;
  currentColor: string;
  onClick: () => void;
  onTagClick: (tag: string) => void;
}> = React.memo(({ item, currentColor, onClick, onTagClick }) => (
  <motion.div variants={fadeUp}>
    <Card
      className="hover:border-primary/50 group transition-base cursor-pointer overflow-hidden border-transparent hover:-translate-y-0.5 hover:shadow-md"
      onClick={onClick}
    >
      <div className="bg-muted relative aspect-video w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.cover}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="bg-black/60 text-white backdrop-blur"
          >
            {formatViews(item.views)}
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-2 p-4">
        <p className="line-clamp-2 text-sm leading-tight font-semibold">
          {item.title}
        </p>
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <FaUserAlt className="h-3 w-3" />
          <span className="truncate">{item.UP}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge
            variant="outline"
            style={{ borderColor: currentColor, color: currentColor }}
          >
            {item.tags.firstChannel}
          </Badge>
          <Badge variant="outline">{item.tags.secondChannel}</Badge>
          {item.tags.ordinaryTags.slice(0, 2).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="bg-muted hover:bg-muted/70 transition-base cursor-pointer rounded-full px-2 py-0.5 text-[10px] hover:scale-105 active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  </motion.div>
));
VideoCard.displayName = 'VideoCard';

const Search: React.FC = React.memo(() => {
  const router = useRouter();
  const { currentColor } = useThemeStore();
  const { screenSize } = useLayoutStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: list = [] } = useResultList();
  // 第一階段：先確定 effectiveTime（不需要 result）
  const fallbackFile = list[0] ?? null;
  const { data: result, isLoading } = useLatestCrawl(fallbackFile);

  const filters = useSearchFilters({ result: result ?? null, list }, router);
  const {
    searchValue,
    selectedChannels,
    activeTag,
    visible,
    filtered,
    effectiveTime,
    setSearchValue,
    setSelectedChannels,
    setActiveTag,
    handleReset,
    handleChangeDate,
    loadMore,
  } = filters;

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

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t('share.copied'),
        description: t('share.copiedHint'),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('share.copiedFail'),
        description: t('share.copiedFailHint'),
      });
    }
  }, [toast, t]);

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

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.06 }}
      >
        <Card className="mx-auto mb-8 max-w-5xl">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>{t('search.filter.title')}</CardTitle>
                <CardDescription>{t('search.filter.desc')}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="cursor-pointer active:scale-95"
                title={t('search.filter.share')}
              >
                <LuShare2 className="mr-1.5 h-3.5 w-3.5" />
                {t('search.filter.share')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t('search.filter.date')}
                </label>
                <Select
                  value={effectiveTime ?? ''}
                  onValueChange={handleChangeDate}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder={t('search.filter.date')} />
                  </SelectTrigger>
                  <SelectContent>
                    {list.map((f) => (
                      <SelectItem key={f} value={f} className="cursor-pointer">
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium">
                  {t('search.filter.keyword')}
                </label>
                <div className="relative">
                  <FaSearch className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder={t('search.filter.keywordPlaceholder')}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('search.filter.firstChannel')}
              </label>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedChannels([])}
                  className={cn(
                    'transition-base cursor-pointer rounded-full border px-3 py-1 text-xs',
                    selectedChannels.length === 0
                      ? 'border-transparent text-white shadow-sm'
                      : 'hover:bg-muted hover:scale-105'
                  )}
                  style={{
                    backgroundColor:
                      selectedChannels.length === 0 ? currentColor : undefined,
                  }}
                >
                  {t('search.filter.all')}
                </motion.button>
                {channelOptions.map((opt) => {
                  const active = selectedChannels.some(
                    ([first]) => first === opt.value
                  );
                  return (
                    <motion.button
                      type="button"
                      key={opt.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (active) {
                          setSelectedChannels((prev) =>
                            prev.filter(([first]) => first !== opt.value)
                          );
                        } else {
                          setSelectedChannels((prev) => [
                            ...prev,
                            [opt.value, ''],
                          ]);
                        }
                      }}
                      className={cn(
                        'transition-base cursor-pointer rounded-full border px-3 py-1 text-xs',
                        active
                          ? 'border-transparent text-white shadow-sm'
                          : 'hover:bg-muted hover:scale-105'
                      )}
                      style={{
                        backgroundColor: active ? currentColor : undefined,
                      }}
                    >
                      {opt.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {selectedChannels.length > 0 && (
                <motion.div
                  key="sub-channels"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-sm font-medium">
                    {t('search.filter.secondChannel')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {channelOptions
                      .filter((opt) =>
                        selectedChannels.some(([first]) => first === opt.value)
                      )
                      .flatMap((opt) =>
                        (opt.children ?? []).map((sub) => ({
                          parent: opt,
                          sub,
                        }))
                      )
                      .map(({ parent, sub }) => {
                        const active = selectedChannels.some(
                          ([first, second]) =>
                            first === parent.value && second === sub.value
                        );
                        return (
                          <motion.button
                            type="button"
                            key={`${parent.value}-${sub.value}`}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedChannels((prev) => {
                                const idx = prev.findIndex(
                                  ([first]) => first === parent.value
                                );
                                if (idx < 0) return prev;
                                const copy = [...prev];
                                if (copy[idx]![1] === sub.value) {
                                  copy[idx] = [copy[idx]![0]!, ''];
                                } else {
                                  copy[idx] = [parent.value, sub.value];
                                }
                                return copy;
                              });
                            }}
                            className={cn(
                              'transition-base cursor-pointer rounded-full border px-3 py-1 text-xs',
                              active
                                ? 'border-transparent text-white shadow-sm'
                                : 'hover:bg-muted hover:scale-105'
                            )}
                            style={{
                              backgroundColor: active
                                ? currentColor
                                : undefined,
                            }}
                          >
                            {sub.label}
                          </motion.button>
                        );
                      })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-muted-foreground text-sm">
                {t('search.filter.match', {
                  matched: filtered.length,
                  total: result?.video.length ?? 0,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={
                    !searchValue && selectedChannels.length === 0 && !activeTag
                  }
                  className="cursor-pointer active:scale-95"
                >
                  <FaTimes className="mr-1 h-3 w-3" />
                  {t('common.reset')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="mx-auto max-w-7xl">
        <AnimatePresence mode="wait">
          {activeTag && (
            <motion.div
              key="active-tag"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mb-4 flex items-center gap-2 text-sm"
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
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-muted-foreground flex h-64 flex-col items-center justify-center"
          >
            <p>{t('search.empty.title')}</p>
            <Button
              variant="link"
              onClick={handleReset}
              className="mt-2 cursor-pointer"
            >
              {t('search.empty.action')}
            </Button>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerStagger(0.02, 0)}
              initial="hidden"
              animate="show"
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
              }}
            >
              {visible.map((item) => (
                <VideoCard
                  key={(item as VideoItem).url}
                  item={item as VideoItem}
                  currentColor={currentColor}
                  onClick={() => handleRowClick((item as VideoItem).url)}
                  onTagClick={(tag) => setActiveTag(tag)}
                />
              ))}
            </motion.div>
            {visible.length < filtered.length && (
              <div className="mt-6 flex items-center justify-center py-4">
                <div
                  className="border-muted-foreground/30 border-t-foreground inline-block h-4 w-4 animate-spin rounded-full border-2"
                  role="status"
                  aria-label="加载中"
                />
                <span className="text-muted-foreground ml-2 text-xs">
                  {t('search.loadingMore', {
                    visible: visible.length,
                    total: filtered.length,
                  })}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
Search.displayName = 'Search';

export default Search;
