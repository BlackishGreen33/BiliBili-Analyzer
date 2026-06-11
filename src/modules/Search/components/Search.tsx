'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useRef, useState } from 'react';
import { FaFilter, FaSearch, FaTimes, FaUserAlt } from 'react-icons/fa';

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
import { useToast } from '@/common/components/ui/use-toast';
import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useLatestCrawl, useResultList } from '@/common/libs/result-data';
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

const Search: React.FC = React.memo(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTag = searchParams.get('tag') ?? '';

  const { currentColor } = useThemeStore();
  const { screenSize } = useLayoutStore();
  const { toast } = useToast();

  const { data: list = [] } = useResultList();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const effectiveTime = selectedTime ?? list[0] ?? null;
  const { data: result, isLoading } = useLatestCrawl(effectiveTime);

  const [searchValue, setSearchValue] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[][]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(initialTag || null);

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

  // 虚拟化列表
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 360,
    overscan: 4,
  });

  const gridCols = useMemo(() => {
    const w = screenSize ?? 1280;
    if (w <= 768) return 1;
    if (w <= 1024) return 2;
    if (w <= 1280) return 3;
    return 4;
  }, [screenSize]);

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <div className="mx-auto mb-10 max-w-5xl">
        <h1 className="text-3xl font-extrabold tracking-tight">
          哔哩哔哩近期热门视频
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          数据更新于 {result ? formatDateTime(result.time) : '加载中…'} · 共{' '}
          {result?.video.length ?? 0} 支视频
        </p>
      </div>

      <Card className="mx-auto mb-8 max-w-5xl">
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>
            按日期、分区、关键字或标签过滤热门视频
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">日期</label>
              <select
                value={effectiveTime ?? ''}
                onChange={(e) => handleChangeDate(e.target.value)}
                className="bg-background focus:ring-ring h-9 w-full rounded-md border px-3 text-sm focus:ring-1 focus:outline-none"
              >
                {list.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
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
              <button
                type="button"
                onClick={() => setSelectedChannels([])}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  selectedChannels.length === 0
                    ? 'border-transparent text-white'
                    : 'hover:bg-muted'
                )}
                style={{
                  backgroundColor:
                    selectedChannels.length === 0 ? currentColor : undefined,
                }}
              >
                全部
              </button>
              {channelOptions.map((opt) => {
                const active = selectedChannels.some(
                  ([first]) => first === opt.value
                );
                return (
                  <button
                    type="button"
                    key={opt.value}
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
                      'rounded-full border px-3 py-1 text-xs transition',
                      active
                        ? 'border-transparent text-white'
                        : 'hover:bg-muted'
                    )}
                    style={{
                      backgroundColor: active ? currentColor : undefined,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedChannels.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">二级分区</label>
              <div className="flex flex-wrap gap-2">
                {channelOptions
                  .filter((opt) =>
                    selectedChannels.some(([first]) => first === opt.value)
                  )
                  .flatMap((opt) =>
                    (opt.children ?? []).map((sub) => ({ parent: opt, sub }))
                  )
                  .map(({ parent, sub }) => {
                    const active = selectedChannels.some(
                      ([first, second]) =>
                        first === parent.value && second === sub.value
                    );
                    return (
                      <button
                        type="button"
                        key={`${parent.value}-${sub.value}`}
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
                          'rounded-full border px-3 py-1 text-xs transition',
                          active
                            ? 'border-transparent text-white'
                            : 'hover:bg-muted'
                        )}
                        style={{
                          backgroundColor: active ? currentColor : undefined,
                        }}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-muted-foreground text-sm">
              命中{' '}
              <span className="text-foreground font-semibold">
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
              >
                <FaTimes className="mr-1 h-3 w-3" />
                重置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeTag && (
        <div className="mx-auto mb-4 flex max-w-5xl items-center gap-2 text-sm">
          <FaFilter className="text-muted-foreground h-3 w-3" />
          <span className="text-muted-foreground">当前标签：</span>
          <Badge variant="secondary">{activeTag}</Badge>
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            清除
          </button>
        </div>
      )}

      <div
        ref={parentRef}
        className="mx-auto h-[70vh] max-w-7xl overflow-auto rounded-xl"
      >
        {isLoading && !result ? (
          <div
            className="grid gap-4 p-4"
            style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
          >
            {Array.from({ length: gridCols * 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted h-[340px] animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
            <p>没有匹配的视频</p>
            <Button variant="link" onClick={handleReset} className="mt-2">
              清除筛选
            </Button>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((vRow) => {
              const itemsInRow: typeof filtered = [];
              for (let i = 0; i < gridCols; i++) {
                const idx = vRow.index * gridCols + i;
                if (idx < filtered.length) itemsInRow.push(filtered[idx]);
              }
              return (
                <div
                  key={vRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  <div
                    className="grid gap-4 p-1"
                    style={{
                      gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                    }}
                  >
                    {itemsInRow.map((item) => (
                      <Card
                        key={item.url}
                        className="cursor-pointer overflow-hidden transition hover:shadow-md"
                        onClick={() => handleRowClick(item.url)}
                      >
                        <div className="bg-muted relative aspect-video w-full overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.cover}
                            alt={item.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
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
                              style={{
                                borderColor: currentColor,
                                color: currentColor,
                              }}
                            >
                              {item.tags.firstChannel}
                            </Badge>
                            <Badge variant="outline">
                              {item.tags.secondChannel}
                            </Badge>
                            {item.tags.ordinaryTags.slice(0, 2).map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTag(tag);
                                }}
                                className="bg-muted hover:bg-muted/70 rounded-full px-2 py-0.5 text-[10px]"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default Search;
