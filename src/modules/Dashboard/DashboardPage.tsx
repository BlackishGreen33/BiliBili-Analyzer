'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  GlobalLengthPreference,
  LatencySection,
} from '@/common/components/elements';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/components/ui/select';
import { Spinner } from '@/common/components/ui/spinner';
import { useResultList } from '@/common/libs/result-data';
import { useDashboard } from '@/common/libs/use-dashboard';
import { containerStagger, EASE_OUT_EXPO } from '@/common/styles/motion';
import { formatDateTime } from '@/common/utils/format';

import ChannelsCard from './components/ChannelsCard';
import DashboardWordCloud from './components/DashboardWordCloud';
import DurationCard from './components/DurationCard';
import EngagementTopCard from './components/EngagementTopCard';
import HourHeatmapCard from './components/HourHeatmapCard';
import KpiSummary from './components/KpiSummary';
import TopTagsCard from './components/TopTagsCard';
import UpBarCard from './components/UpBarCard';
import UpRankingCard from './components/UpRankingCard';

const DashboardPage: React.FC = React.memo(() => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: list = [] } = useResultList();
  const initialFile = searchParams.get('file') || list[0] || null;
  const [file, setFile] = useState<string | null>(initialFile);

  const { data, isLoading } = useDashboard(file);

  const handleFileChange = (value: string) => {
    setFile(value);
    router.replace(`/dashboard?file=${encodeURIComponent(value)}`, {
      scroll: false,
    });
  };

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
              {t('dashboard.title')}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {data ? `${formatDateTime(data.time)}` : t('common.loading')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">{t('search.filter.date')}</label>
            <Select value={file ?? ''} onValueChange={handleFileChange}>
              <SelectTrigger className="w-44 cursor-pointer">
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
        </div>
      </motion.div>

      {isLoading || !data ? (
        <div className="flex h-96 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <motion.div
          className="mx-auto flex max-w-7xl flex-col gap-6"
          variants={containerStagger(0.06, 0.04)}
          initial="hidden"
          animate="show"
        >
          <KpiSummary summary={data.summary} />
          <EngagementTopCard items={data.topEngagement} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChannelsCard channels={data.channels} />
            <UpBarCard topUps={data.topUps} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DurationCard duration={data.duration} />
            <HourHeatmapCard hourHeatmap={data.hourHeatmap} />
          </div>
          <TopTagsCard topTags={data.topTags} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DashboardWordCloud file={data.file} />
            <LatencySection file={data.file} />
          </div>
          <GlobalLengthPreference
            buckets={data.duration}
            totalVideos={data.summary.totalVideos}
          />
          <UpRankingCard topUps={data.topUps} />
        </motion.div>
      )}
    </div>
  );
});

export default DashboardPage;
