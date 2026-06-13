'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaExchangeAlt, FaShareAlt, FaUserAlt } from 'react-icons/fa';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/components/ui/select';
import { useToast } from '@/common/components/ui/use-toast';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useDashboardCompare } from '@/common/libs/dashboard-data';
import { useResultList } from '@/common/libs/result-data';
import {
  containerStagger,
  EASE_OUT_EXPO,
  fadeUp,
} from '@/common/styles/motion';
import {
  formatCompact,
  formatDateTime,
  formatPercent,
} from '@/common/utils/format';

const DeltaChip: React.FC<{ delta: number; formatter: (n: number) => string }> =
  React.memo(({ delta, formatter }) => {
    if (delta === 0) {
      return (
        <span className="text-muted-foreground text-xs tabular-nums">—</span>
      );
    }
    const positive = delta > 0;
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
          positive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
        }`}
      >
        {positive ? '+' : ''}
        {formatter(delta)}
      </span>
    );
  });
DeltaChip.displayName = 'DeltaChip';

const MetricCompareCard: React.FC<{
  label: string;
  aValue: string;
  bValue: string;
  delta: number;
  deltaFormatter: (n: number) => string;
  aLabel: string;
  bLabel: string;
  sub?: string;
}> = React.memo(
  ({ label, aValue, bValue, delta, deltaFormatter, aLabel, bLabel, sub }) => (
    <motion.div variants={fadeUp}>
      <Card className="hover:border-primary/50 transition-base h-full p-5 hover:shadow-md">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </p>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div>
            <p className="text-2xl font-bold tabular-nums">{bValue}</p>
            <p className="text-muted-foreground text-[10px] uppercase">
              {bLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-lg font-medium tabular-nums">
              {aValue}
            </p>
            <p className="text-muted-foreground text-[10px] uppercase">
              {aLabel}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <DeltaChip delta={delta} formatter={deltaFormatter} />
          {sub && <p className="text-muted-foreground text-[10px]">{sub}</p>}
        </div>
      </Card>
    </motion.div>
  )
);
MetricCompareCard.displayName = 'MetricCompareCard';

const ComparePage: React.FC = React.memo(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentColor } = useThemeStore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: list = [] } = useResultList();

  // 預設 a = 較舊的日期（昨日），b = 最新（今日）
  // list[0] 是最新；list[1] 是昨日
  // a 為「基準日」、b 為「對比日」；delta = b - a = 「相對基準日的增減」
  const initialA = searchParams.get('a') ?? list[1] ?? list[0] ?? null;
  const initialB = searchParams.get('b') ?? list[0] ?? null;

  const [a, setA] = useState<string | null>(initialA);
  const [b, setB] = useState<string | null>(initialB);

  // 當 list 完成載入、且用戶尚未挑過（state 仍為 null）時，用預設補上
  // 透過 derived state（不是 useEffect setState）避免 cascading render
  const effectiveA =
    a ?? (list.length > 0 ? (list[1] ?? list[0] ?? null) : null);
  const effectiveB = b ?? (list.length > 0 ? (list[0] ?? null) : null);

  const { data, isLoading, error } = useDashboardCompare(
    effectiveA,
    effectiveB
  );

  // 同步 URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!effectiveA || !effectiveB) return;
    const params = new URLSearchParams();
    params.set('a', effectiveA);
    params.set('b', effectiveB);
    const target = `/dashboard/compare?${params.toString()}`;
    if (window.location.pathname + window.location.search !== target) {
      router.replace(target, { scroll: false });
    }
  }, [router, effectiveA, effectiveB]);

  const handleShare = React.useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t('share.copied') });
    } catch {
      toast({
        variant: 'destructive',
        title: t('share.copiedFail'),
        description: t('share.copiedFailHint'),
      });
    }
  }, [toast, t]);

  const handleSwap = () => {
    setA(b);
    setB(a);
  };

  const hasEnoughData =
    list.length >= 2 &&
    !!effectiveA &&
    !!effectiveB &&
    effectiveA !== effectiveB;

  // 計算衍生資料
  // 「今日/昨日」標籤：a=較舊、b=較新（list[0] 為最新）
  // list[0] = 最新 → 預設為 b（今日）
  // list[1] = 次新 → 預設為 a（昨日）
  // 但允許用戶任意挑選，所以這裡只取 a/b 的「相對時間」來標示
  const aIsNewer =
    data && new Date(data.a.time).getTime() > new Date(data.b.time).getTime();
  const newerLabel = aIsNewer ? 'A' : 'B';
  const olderLabel = aIsNewer ? 'B' : 'A';

  // Tag 計數 map（用於 badge 旁顯示 ×N）
  const tagMapB = useMemo(() => {
    if (!data) return new Map<string, number>();
    const m = new Map<string, number>();
    for (const t of data.b.topTags) m.set(t.tag, t.count);
    return m;
  }, [data]);
  const tagMapA = useMemo(() => {
    if (!data) return new Map<string, number>();
    const m = new Map<string, number>();
    for (const t of data.a.topTags) m.set(t.tag, t.count);
    return m;
  }, [data]);

  // 解析 UP 新增/落榜/持續
  const upBuckets = useMemo(() => {
    if (!data) return null;
    const nameKey = (n: string, m?: number) => String(m ?? n);
    const mapA = new Map<string, (typeof data.a.topUps)[number]>();
    const mapB = new Map<string, (typeof data.b.topUps)[number]>();
    for (const u of data.a.topUps) mapA.set(nameKey(u.name, u.mid), u);
    for (const u of data.b.topUps) mapB.set(nameKey(u.name, u.mid), u);
    const newUps: typeof data.b.topUps = [];
    const droppedUps: typeof data.a.topUps = [];
    const persistent: Array<{
      a: (typeof data.a.topUps)[number];
      b: (typeof data.b.topUps)[number];
      delta: number;
    }> = [];
    for (const [k, b] of mapB) {
      if (!mapA.has(k)) newUps.push(b);
    }
    for (const [k, a] of mapA) {
      if (!mapB.has(k)) droppedUps.push(a);
    }
    for (const [k, a] of mapA) {
      const b = mapB.get(k);
      if (b) persistent.push({ a, b, delta: b.count - a.count });
    }
    persistent.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
    return { newUps, droppedUps, persistent };
  }, [data]);

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <motion.div
        className="mx-auto mb-8 max-w-7xl"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {t('compare.title')}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t('compare.desc')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                {t('compare.selectA')}
              </label>
              <Select value={a ?? ''} onValueChange={setA}>
                <SelectTrigger className="w-44 cursor-pointer">
                  <SelectValue placeholder={t('compare.selectA')} />
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
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="cursor-pointer active:scale-95"
              title={t('common.swap')}
              aria-label={t('common.swap')}
            >
              <FaExchangeAlt className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                {t('compare.selectB')}
              </label>
              <Select value={b ?? ''} onValueChange={setB}>
                <SelectTrigger className="w-44 cursor-pointer">
                  <SelectValue placeholder={t('compare.selectB')} />
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="cursor-pointer active:scale-95"
            >
              <FaShareAlt className="mr-1.5 h-3.5 w-3.5" />
              {t('compare.share')}
            </Button>
          </div>
        </div>
      </motion.div>

      {!hasEnoughData ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-muted-foreground mx-auto flex h-64 max-w-7xl flex-col items-center justify-center gap-2"
        >
          <p className="text-sm">
            {list.length < 2 ? t('compare.needMoreData') : t('compare.sameDay')}
          </p>
          <p className="text-xs">
            {list.length < 2
              ? t('compare.needMoreDataHint', { count: list.length })
              : t('compare.sameDayHint', { count: list.length })}
          </p>
        </motion.div>
      ) : isLoading || !data ? (
        <div className="flex h-96 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {t('compare.loadingHint')}
          </p>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-muted-foreground mx-auto flex h-64 max-w-7xl flex-col items-center justify-center gap-2"
        >
          <p className="text-sm">
            {t('compare.errorHint', { message: error.message })}
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="mx-auto flex max-w-7xl flex-col gap-6"
          variants={containerStagger(0.06, 0.04)}
          initial="hidden"
          animate="show"
        >
          {/* === 1. 總量對比 === */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <MetricCompareCard
              label={t('dashboard.summary.videos')}
              aValue={formatCompact(data.a.summary.totalVideos)}
              bValue={formatCompact(data.b.summary.totalVideos)}
              delta={data.diff.totalsDelta.totalVideos}
              deltaFormatter={(n) => formatCompact(n)}
              aLabel={`A · ${data.a.file.slice(0, 10)}`}
              bLabel={`B · ${data.b.file.slice(0, 10)}`}
            />
            <MetricCompareCard
              label={t('dashboard.summary.ups')}
              aValue={formatCompact(data.a.summary.totalUp)}
              bValue={formatCompact(data.b.summary.totalUp)}
              delta={data.diff.totalsDelta.totalUp}
              deltaFormatter={(n) => formatCompact(n)}
              aLabel={`A · ${data.a.file.slice(0, 10)}`}
              bLabel={`B · ${data.b.file.slice(0, 10)}`}
            />
            <MetricCompareCard
              label={t('dashboard.summary.views')}
              aValue={formatCompact(data.a.summary.totalViews)}
              bValue={formatCompact(data.b.summary.totalViews)}
              delta={data.diff.totalsDelta.totalViews}
              deltaFormatter={(n) => formatCompact(n)}
              aLabel={`A · ${data.a.file.slice(0, 10)}`}
              bLabel={`B · ${data.b.file.slice(0, 10)}`}
            />
            <MetricCompareCard
              label={t('dashboard.summary.engagement')}
              aValue={formatCompact(
                data.a.summary.totalLike +
                  data.a.summary.totalCoin * 2 +
                  data.a.summary.totalFavorite * 2
              )}
              bValue={formatCompact(
                data.b.summary.totalLike +
                  data.b.summary.totalCoin * 2 +
                  data.b.summary.totalFavorite * 2
              )}
              delta={data.diff.totalsDelta.totalEngagement}
              deltaFormatter={(n) => formatCompact(n)}
              aLabel={`A · ${data.a.file.slice(0, 10)}`}
              bLabel={`B · ${data.b.file.slice(0, 10)}`}
            />
            <MetricCompareCard
              label={t('dashboard.summary.avgEngagement')}
              aValue={
                data.a.summary.avgEngagement > 0
                  ? formatPercent(data.a.summary.avgEngagement, 2)
                  : '—'
              }
              bValue={
                data.b.summary.avgEngagement > 0
                  ? formatPercent(data.b.summary.avgEngagement, 2)
                  : '—'
              }
              delta={data.diff.totalsDelta.avgEngagement}
              deltaFormatter={(n) => formatPercent(n, 2)}
              aLabel={`A · ${data.a.file.slice(0, 10)}`}
              bLabel={`B · ${data.b.file.slice(0, 10)}`}
            />
          </div>

          <p className="text-muted-foreground -mt-2 text-center text-[10px]">
            {t('compare.summaryHint', {
              aFile: data.a.file,
              aTime: formatDateTime(data.a.time),
              bFile: data.b.file,
              bTime: formatDateTime(data.b.time),
              count: data.diff.persistentCount,
            })}
          </p>

          {/* === 2. 分區占比差異 === */}
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>{t('compare.sections.channels')}</CardTitle>
                <CardDescription>
                  {t('compare.channelMeta', {
                    count: data.diff.channelShift.length,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.diff.channelShift.slice(0, 12).map((c) => (
                    <div
                      key={c.firstChannel}
                      className="hover:border-primary/50 transition-base flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-sm font-medium">
                        {c.firstChannel}
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground tabular-nums">
                          {c.countA}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold tabular-nums">
                          {c.countB}
                        </span>
                        <DeltaChip
                          delta={c.delta}
                          formatter={(n) => `${n > 0 ? '+' : ''}${n}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* === 3. UP 主榜變化 === */}
          {upBuckets && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('compare.sections.upMovement')}</CardTitle>
                  <CardDescription>
                    {t('compare.upBucket.newUps')} {upBuckets.newUps.length} ·{' '}
                    {t('compare.upBucket.droppedUps')}{' '}
                    {upBuckets.droppedUps.length} ·{' '}
                    {t('compare.upBucket.persistent')}{' '}
                    {upBuckets.persistent.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        >
                          {t('compare.upBucket.newUps')}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {t('compare.upBucket.countUps', {
                            count: upBuckets.newUps.length,
                          })}
                        </span>
                      </h4>
                      <div className="space-y-1">
                        {upBuckets.newUps.slice(0, 10).map((u) => (
                          <div
                            key={u.name + (u.mid ?? '')}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <FaUserAlt className="text-muted-foreground h-2.5 w-2.5" />
                              {u.name}
                            </span>
                            <span className="tabular-nums">{u.count} 次</span>
                          </div>
                        ))}
                        {upBuckets.newUps.length === 0 && (
                          <p className="text-muted-foreground text-xs">—</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                        <Badge
                          variant="secondary"
                          className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        >
                          {t('compare.upBucket.droppedUps')}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {t('compare.upBucket.countUps', {
                            count: upBuckets.droppedUps.length,
                          })}
                        </span>
                      </h4>
                      <div className="space-y-1">
                        {upBuckets.droppedUps.slice(0, 10).map((u) => (
                          <div
                            key={u.name + (u.mid ?? '')}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <FaUserAlt className="text-muted-foreground h-2.5 w-2.5" />
                              {u.name}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              {u.count} 次
                            </span>
                          </div>
                        ))}
                        {upBuckets.droppedUps.length === 0 && (
                          <p className="text-muted-foreground text-xs">—</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                        <Badge variant="secondary">
                          {t('compare.upBucket.persistent')}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {t('compare.upBucket.byAbsDelta')}
                        </span>
                      </h4>
                      <div className="space-y-1">
                        {upBuckets.persistent.slice(0, 10).map((p) => (
                          <div
                            key={p.a.name + (p.a.mid ?? '')}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <FaUserAlt className="text-muted-foreground h-2.5 w-2.5" />
                              <span className="max-w-[120px] truncate">
                                {p.a.name}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-muted-foreground tabular-nums">
                                {p.a.count}→{p.b.count}
                              </span>
                              <DeltaChip
                                delta={p.delta}
                                formatter={(n) => `${n > 0 ? '+' : ''}${n}`}
                              />
                            </span>
                          </div>
                        ))}
                        {upBuckets.persistent.length === 0 && (
                          <p className="text-muted-foreground text-xs">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* === 4. 時長分佈並排 === */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>A · {t('compare.sections.duration')}</CardTitle>
                  <CardDescription>{data.a.file}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.a.duration}
                        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="label"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--muted-foreground))"
                          radius={[4, 4, 0, 0]}
                          opacity={0.5}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>B · {t('compare.sections.duration')}</CardTitle>
                  <CardDescription>{data.b.file}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.b.duration}
                        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="label"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill={currentColor}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* === 5. 發布時段並排 === */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>A · {t('compare.sections.hour')}</CardTitle>
                  <CardDescription>{data.a.file}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.a.hourHeatmap}
                        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="hour"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(h: number) => `${h}h`}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          labelFormatter={(h: number) => `${h} 时`}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--muted-foreground))"
                          radius={[3, 3, 0, 0]}
                          opacity={0.5}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>B · {t('compare.sections.hour')}</CardTitle>
                  <CardDescription>{data.b.file}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.b.hourHeatmap}
                        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="hour"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(h: number) => `${h}h`}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          labelFormatter={(h: number) => `${h} 时`}
                        />
                        <Bar
                          dataKey="count"
                          fill={currentColor}
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* === 6. 標籤變化 === */}
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>{t('compare.sections.tags')}</CardTitle>
                <CardDescription>
                  {t('compare.tagsCommon', {
                    count: data.diff.tagShift.commonTags,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      >
                        {t('compare.tagsNew')}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {t('compare.countUnit', {
                          count: data.diff.tagShift.newTags.length,
                        })}
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {data.diff.tagShift.newTags.slice(0, 30).map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-emerald-700 dark:text-emerald-400"
                          style={{
                            borderColor: 'rgb(16 185 129 / 0.4)',
                          }}
                        >
                          {t}
                          {tagMapB.has(t) && (
                            <span className="text-muted-foreground ml-1.5 text-[10px]">
                              ×{tagMapB.get(t)}
                            </span>
                          )}
                        </Badge>
                      ))}
                      {data.diff.tagShift.newTags.length === 0 && (
                        <p className="text-muted-foreground text-xs">—</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                      <Badge
                        variant="secondary"
                        className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                      >
                        {t('compare.tagsDropped')}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {t('compare.countUnit', {
                          count: data.diff.tagShift.droppedTags.length,
                        })}
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {data.diff.tagShift.droppedTags.slice(0, 30).map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-rose-700 dark:text-rose-400"
                          style={{ borderColor: 'rgb(244 63 94 / 0.4)' }}
                        >
                          {t}
                          {tagMapA.has(t) && (
                            <span className="text-muted-foreground ml-1.5 text-[10px]">
                              ×{tagMapA.get(t)}
                            </span>
                          )}
                        </Badge>
                      ))}
                      {data.diff.tagShift.droppedTags.length === 0 && (
                        <p className="text-muted-foreground text-xs">—</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
});

ComparePage.displayName = 'ComparePage';

export default ComparePage;
