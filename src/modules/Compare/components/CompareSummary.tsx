'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import MetricCompareCard from '@/common/components/composed/MetricCompareCard';
import { containerStagger, fadeUp } from '@/common/styles/motion';
import { formatCompact, formatPercent } from '@/common/utils/format';

type SummaryA = {
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalLike: number;
  totalCoin: number;
  totalFavorite: number;
  avgEngagement: number;
  file: string;
};

type TotalsDelta = {
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagement: number;
};

type CompareSummaryProps = {
  a: SummaryA;
  b: SummaryA;
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
        aValue={formatCompact(a.totalVideos)}
        bValue={formatCompact(b.totalVideos)}
        delta={totalsDelta.totalVideos}
        deltaFormatter={(n) => formatCompact(n)}
        aLabel={`A · ${a.file.slice(0, 10)}`}
        bLabel={`B · ${b.file.slice(0, 10)}`}
      />
      <MetricCompareCard
        label={t('dashboard.summary.ups')}
        aValue={formatCompact(a.totalUp)}
        bValue={formatCompact(b.totalUp)}
        delta={totalsDelta.totalUp}
        deltaFormatter={(n) => formatCompact(n)}
        aLabel={`A · ${a.file.slice(0, 10)}`}
        bLabel={`B · ${b.file.slice(0, 10)}`}
      />
      <MetricCompareCard
        label={t('dashboard.summary.views')}
        aValue={formatCompact(a.totalViews)}
        bValue={formatCompact(b.totalViews)}
        delta={totalsDelta.totalViews}
        deltaFormatter={(n) => formatCompact(n)}
        aLabel={`A · ${a.file.slice(0, 10)}`}
        bLabel={`B · ${b.file.slice(0, 10)}`}
      />
      <MetricCompareCard
        label={t('dashboard.summary.engagement')}
        aValue={formatCompact(
          a.totalLike + a.totalCoin * 2 + a.totalFavorite * 2
        )}
        bValue={formatCompact(
          b.totalLike + b.totalCoin * 2 + b.totalFavorite * 2
        )}
        delta={totalsDelta.totalEngagement}
        deltaFormatter={(n) => formatCompact(n)}
        aLabel={`A · ${a.file.slice(0, 10)}`}
        bLabel={`B · ${b.file.slice(0, 10)}`}
      />
      <motion.div variants={fadeUp}>
        <MetricCompareCard
          label={t('dashboard.summary.avgEngagement')}
          aValue={a.avgEngagement > 0 ? formatPercent(a.avgEngagement, 2) : '—'}
          bValue={b.avgEngagement > 0 ? formatPercent(b.avgEngagement, 2) : '—'}
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
