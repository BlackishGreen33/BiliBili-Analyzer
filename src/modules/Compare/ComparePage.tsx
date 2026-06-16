'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ComparedBarChart from '@/common/components/charts/ComparedBarChart';
import { Button } from '@/common/components/ui/button';
import { Spinner } from '@/common/components/ui/spinner';
import { useResultList } from '@/common/libs/result-data';
import { useDashboardCompare } from '@/common/libs/use-dashboard';
import { containerStagger } from '@/common/styles/motion';
import { formatDateTime } from '@/common/utils/format';

import ChannelShiftCard from './components/ChannelShiftCard';
import CompareSummary from './components/CompareSummary';
import DatePickers from './components/DatePickers';
import TagShiftCard from './components/TagShiftCard';
import UpMovementCard from './components/UpMovementCard';

type UpBucket = { name: string; mid?: number; count: number };

const ComparePage: React.FC = React.memo(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { data: list = [] } = useResultList();

  const initialA = searchParams.get('a') ?? list[1] ?? list[0] ?? null;
  const initialB = searchParams.get('b') ?? list[0] ?? null;

  const [a, setA] = useState<string | null>(initialA);
  const [b, setB] = useState<string | null>(initialB);

  const effectiveA =
    a ?? (list.length > 0 ? (list[1] ?? list[0] ?? null) : null);
  const effectiveB = b ?? (list.length > 0 ? (list[0] ?? null) : null);

  const { data, isLoading, error } = useDashboardCompare(
    effectiveA,
    effectiveB
  );

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

  const handleSwap = () => {
    setA(b);
    setB(a);
  };

  const hasEnoughData =
    list.length >= 2 &&
    !!effectiveA &&
    !!effectiveB &&
    effectiveA !== effectiveB;

  const tagMapB = useMemo(() => {
    if (!data) return new Map<string, number>();
    const m = new Map<string, number>();
    for (const tag of data.b.topTags) m.set(tag.tag, tag.count);
    return m;
  }, [data]);

  const tagMapA = useMemo(() => {
    if (!data) return new Map<string, number>();
    const m = new Map<string, number>();
    for (const tag of data.a.topTags) m.set(tag.tag, tag.count);
    return m;
  }, [data]);

  const upBuckets = useMemo(() => {
    if (!data) return null;
    const nameKey = (n: string, m?: number) => String(m ?? n);
    const mapA = new Map<string, UpBucket>();
    const mapB = new Map<string, UpBucket>();
    for (const u of data.a.topUps) mapA.set(nameKey(u.name, u.mid), u);
    for (const u of data.b.topUps) mapB.set(nameKey(u.name, u.mid), u);
    const newUps: UpBucket[] = [];
    const droppedUps: UpBucket[] = [];
    const persistent: Array<{ a: UpBucket; b: UpBucket; delta: number }> = [];
    for (const [k, val] of mapB) {
      if (!mapA.has(k)) newUps.push(val);
    }
    for (const [k, val] of mapA) {
      if (!mapB.has(k)) droppedUps.push(val);
    }
    for (const [k, val] of mapA) {
      const valB = mapB.get(k);
      if (valB)
        persistent.push({ a: val, b: valB, delta: valB.count - val.count });
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
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
          <DatePickers
            list={list}
            a={a}
            b={b}
            onAChange={setA}
            onBChange={setB}
            onSwap={handleSwap}
          />
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
          <Spinner size="lg" />
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
          <Button size="sm" onClick={() => router.refresh()}>
            {t('common.retry')}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          className="mx-auto flex max-w-7xl flex-col gap-6"
          variants={containerStagger(0.06, 0.04)}
          initial="hidden"
          animate="show"
        >
          <CompareSummary
            a={data.a}
            b={data.b}
            totalsDelta={data.diff.totalsDelta}
          />

          <p className="text-muted-foreground -mt-2 text-center text-[10px]">
            {t('compare.summaryHint', {
              aFile: data.a.file,
              aTime: formatDateTime(data.a.time),
              bFile: data.b.file,
              bTime: formatDateTime(data.b.time),
              count: data.diff.persistentCount,
            })}
          </p>

          <ChannelShiftCard items={data.diff.channelShift} />

          {upBuckets && <UpMovementCard buckets={upBuckets} />}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ComparedBarChart
              side="A"
              title={t('compare.sections.duration')}
              description={data.a.file}
              data={data.a.duration}
              xKey="label"
            />
            <ComparedBarChart
              side="B"
              title={t('compare.sections.duration')}
              description={data.b.file}
              data={data.b.duration}
              xKey="label"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ComparedBarChart
              side="A"
              title={t('compare.sections.hour')}
              description={data.a.file}
              data={data.a.hourHeatmap}
              xKey="hour"
              xTickFormatter={(h) => `${h}h`}
            />
            <ComparedBarChart
              side="B"
              title={t('compare.sections.hour')}
              description={data.b.file}
              data={data.b.hourHeatmap}
              xKey="hour"
              xTickFormatter={(h) => `${h}h`}
            />
          </div>

          <TagShiftCard
            shift={data.diff.tagShift}
            tagMapA={tagMapA}
            tagMapB={tagMapB}
          />
        </motion.div>
      )}
    </div>
  );
});

ComparePage.displayName = 'ComparePage';

export default ComparePage;
