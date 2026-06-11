'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

type ChannelOption = {
  value: string;
  label: string;
  children?: ChannelOption[];
};

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

function buildChannelOptions(
  videos: Array<{ tags: { firstChannel: string; secondChannel: string } }>
): ChannelOption[] {
  const map = new Map<string, ChannelOption>();
  for (const v of videos) {
    const first = v.tags.firstChannel;
    const second = v.tags.secondChannel;
    if (!first || !second) continue;
    let entry = map.get(first);
    if (!entry) {
      entry = { value: first, label: first, children: [] };
      map.set(first, entry);
    }
    if (!entry.children!.some((c) => c.value === second)) {
      entry.children!.push({ value: second, label: second });
    }
  }
  return Array.from(map.values());
}

const PAGE_SIZE = 24;

const encodeChannels = (cs: string[][]): string =>
  cs
    .map(([f, s]) => (s ? `${f}-${s}` : f))
    .filter((s) => s.length > 0)
    .join(',');

const decodeChannels = (raw: string | null | undefined): string[][] => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => {
      const i = seg.indexOf('-');
      return i < 0 ? [seg, ''] : [seg.slice(0, i), seg.slice(i + 1)];
    });
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
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const initialTag = searchParams.get('tag') ?? '';
  const initialDate = searchParams.get('date') ?? '';
  const initialChannels = decodeChannels(searchParams.get('c'));

  const { currentColor } = useThemeStore();
  const { screenSize } = useLayoutStore();
  const { toast } = useToast();

  const { data: list = [] } = useResultList();
  const [selectedTime, setSelectedTime] = useState<string | null>(
    initialDate || null
  );
  const effectiveTime = selectedTime ?? list[0] ?? null;
  const { data: result, isLoading } = useLatestCrawl(effectiveTime);

  const [searchValue, setSearchValue] = useState(initialQ);
  const [selectedChannels, setSelectedChannels] =
    useState<string[][]>(initialChannels);
  const [activeTag, setActiveTag] = useState<string | null>(initialTag || null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const channelOptions = useMemo(
    () => (result ? buildChannelOptions(result.video) : []),
    [result]
  );

  const filtered = useMemo(() => {
    if (!result) return [];
    const kw = searchValue.trim().toLowerCase();
    return result.video.filter((v) => {
      const matchKw =
        !kw ||
        v.title.toLowerCase().includes(kw) ||
        v.UP.toLowerCase().includes(kw) ||
        v.tags.ordinaryTags.some((t) => t.toLowerCase().includes(kw));
      const matchChannel =
        selectedChannels.length === 0 ||
        selectedChannels.some(
          ([first, second]) =>
            v.tags.firstChannel === first &&
            (v.tags.secondChannel === second || !second)
        );
      const matchTag = !activeTag || v.tags.ordinaryTags.includes(activeTag);
      return matchKw && matchChannel && matchTag;
    });
  }, [result, searchValue, selectedChannels, activeTag]);

  useEffect(() => {
    if (result && visibleCount > filtered.length && filtered.length > 0) {
      setVisibleCount(Math.min(PAGE_SIZE, filtered.length));
    }
  }, [result, filtered.length, visibleCount]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  useEffect(() => {
    if (!effectiveTime) return;
    const params = new URLSearchParams();
    if (searchValue.trim()) params.set('q', searchValue.trim());
    if (selectedChannels.length > 0)
      params.set('c', encodeChannels(selectedChannels));
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
    selectedChannels,
    activeTag,
    selectedTime,
    effectiveTime,
  ]);

  const handleRowClick = (url: string) => {
    const bvid = extractBvid(url);
    if (!bvid) {
      toast({
        variant: 'destructive',
        title: '无法从 URL 中获取 BV 号',
        description: '请确认输入的链接是否正确。',
      });
      return;
    }
    router.push('/details?bvid=' + bvid);
  };

  const handleReset = () => {
    setSearchValue('');
    setSelectedChannels([]);
    setActiveTag(null);
  };

  const handleChangeDate = (filename: string) => {
    setSelectedTime(filename);
    handleReset();
  };

  const stateRef = useRef({ visible: 0, filtered: 0 });
  useEffect(() => {
    stateRef.current = { visible: visible.length, filtered: filtered.length };
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      const { visible: v, filtered: f } = stateRef.current;
      if (v >= f) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      if (window.scrollY > max - 600) {
        setVisibleCount((c) => Math.min(c + PAGE_SIZE, f));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        title: '已复制分享链接',
        description: '他人打开链接即可还原当前筛选。',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: '复制失败',
        description: '请手动复制地址栏链接。',
      });
    }
  }, [toast]);

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <motion.div
        className="mx-auto mb-10 max-w-5xl"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight">
          哔哩哔哩近期热门视频
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          数据更新于 {result ? formatDateTime(result.time) : '加载中…'} · 共{' '}
          {result?.video.length ?? 0} 支视频
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
                <CardTitle>筛选条件</CardTitle>
                <CardDescription>
                  按日期、分区、关键字或标签过滤热门视频
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="cursor-pointer active:scale-95"
                title="复制当前筛选的分享链接"
              >
                <LuShare2 className="mr-1.5 h-3.5 w-3.5" />
                分享筛选
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">日期</label>
                <Select
                  value={effectiveTime ?? ''}
                  onValueChange={handleChangeDate}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="选择日期" />
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
                <label className="text-sm font-medium">搜索</label>
                <div className="relative">
                  <FaSearch className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="视频标题、UP 主名称、标签"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">一级分区</label>
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
                  全部
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
                  <label className="text-sm font-medium">二级分区</label>
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
                                if (copy[idx][1] === sub.value) {
                                  copy[idx] = [copy[idx][0], ''];
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
                命中{' '}
                <span className="text-foreground font-semibold tabular-nums">
                  {filtered.length}
                </span>{' '}
                / {result?.video.length ?? 0} 支
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
                  重置
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
              <span className="text-muted-foreground">当前标签：</span>
              <Badge variant="secondary">{activeTag}</Badge>
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors"
              >
                清除
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
            <p>没有匹配的视频</p>
            <Button
              variant="link"
              onClick={handleReset}
              className="mt-2 cursor-pointer"
            >
              清除筛选
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
                  key={item.url}
                  item={item}
                  currentColor={currentColor}
                  onClick={() => handleRowClick(item.url)}
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
                  正在加载更多（{visible.length} / {filtered.length}）…
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
