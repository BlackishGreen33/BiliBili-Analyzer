'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import MetricCompareCard from '@/common/components/composed/MetricCompareCard';
import { containerStagger, fadeUp } from '@/common/styles/motion';
import { formatCompact, formatPercent } from '@/common/utils/format';

type CompareSummaryFields = {
  file: string;
  summary: {
    totalVideos: number;
    totalUp: number;
    totalViews: number;
    totalLike: number;
    totalCoin: number;
    totalFavorite: number;
    avgEngagement: number;
  };
};

type TotalsDelta = {
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagement: number;
};

type CompareSummaryProps = {
  a: CompareSummaryFields;
  b: CompareSummaryFields;
  totalsDelta: TotalsDelta;
};

const CompareSummary: React.FC<CompareSummaryProps> = ({
  a,
  b,
  totalsDelta,
}) => {
  const { t } = useTranslation();
  return (
    <motion.div
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      variants={containerStagger(0.06, 0.04)}
    >
      <MetricCompareCard
        label={t('dashboard.summary.videos')}
        aValue={formatCompact(a.summary.totalVideos)}
        bValue={formatCompact(b.summary.totalVideos)}
        delta={totalsDelta.totalVideos}
        deltaFormatter={(n) => formatCompact(n)}
        aLabel={`A · ${a.file.slice(0, 10)}`}
        bLabel={`B · ${b.file.slice(0, 10)}`}
      />
      <MetricCompareCard
        label={t('dashboard.summary.ups')}
        aValue={formatCompact(a.summary.totalUp)}
        bValue={formatCompact(b.summary.totalUp)}
        delta={totalsDelta.totalUp}
        deltaFormatter={(n) => formatCompact(n)}
        aLabel={`A · ${a.file.slice(0, 10)}`}
        bLabel={`B · ${b.file.slice(0, 10)}`}
      />
      <MetricCompareCard
        label={t('dashboard.summary.views')}
        aValue={formatCompact(a.summary.totalViews)}
        bValue={formatCompact(b.summary.totalViews)}
        delta={totalsDelta.totalViews}
        deltaFormatter={(n) => formatCompact(n)}
        aLabel={`A · ${a.file.slice(0, 10)}`}
        bLabel={`B · ${b.file.slice(0, 10)}`}
      />
      <MetricCompareCard
        label={t('dashboard.summary.engagement')}
        aValue={formatCompact(
          a.summary.totalLike +
            a.summary.totalCoin * 2 +
            a.summary.totalFavorite * 2
        )}
        bValue={formatCompact(
          b.summary.totalLike +
            b.summary.totalCoin * 2 +
            b.summary.totalFavorite * 2
        )}
        delta={totalsDelta.totalEngagement}
        deltaFormatter={(n) => formatCompact(n)}
        aLabel={`A · ${a.file.slice(0, 10)}`}
        bLabel={`B · ${b.file.slice(0, 10)}`}
      />
      <motion.div variants={fadeUp}>
        <MetricCompareCard
          label={t('dashboard.summary.avgEngagement')}
          aValue={
            a.summary.avgEngagement > 0
              ? formatPercent(a.summary.avgEngagement, 2)
              : '—'
          }
          bValue={
            b.summary.avgEngagement > 0
              ? formatPercent(b.summary.avgEngagement, 2)
              : '—'
          }
          delta={totalsDelta.avgEngagement}
          deltaFormatter={(n) => formatPercent(n, 2)}
          aLabel={`A · ${a.file.slice(0, 10)}`}
          bLabel={`B · ${b.file.slice(0, 10)}`}
        />
      </motion.div>
    </motion.div>
  );
};

export default CompareSummary;
