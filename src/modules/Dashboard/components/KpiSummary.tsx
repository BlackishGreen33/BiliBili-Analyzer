'use client';

import { useTranslation } from 'react-i18next';

import { SummaryCard } from '@/common/components/elements';
import { formatCompact, formatPercent } from '@/common/utils/format';

type DashboardSummary = {
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalLike: number;
  totalCoin: number;
  totalFavorite: number;
  avgEngagement: number;
};

const KpiSummary: React.FC<{ summary: DashboardSummary }> = ({ summary }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <SummaryCard
        label={t('dashboard.summary.videos')}
        value={formatCompact(summary.totalVideos)}
      />
      <SummaryCard
        label={t('dashboard.summary.ups')}
        value={formatCompact(summary.totalUp)}
      />
      <SummaryCard
        label={t('dashboard.summary.views')}
        value={formatCompact(summary.totalViews)}
        sub={t('dashboard.summary.viewsSub')}
      />
      <SummaryCard
        label={t('dashboard.summary.engagement')}
        value={formatCompact(
          summary.totalLike + summary.totalCoin * 2 + summary.totalFavorite * 2
        )}
        sub={t('dashboard.summary.engagementSub', {
          like: formatCompact(summary.totalLike),
          coin: formatCompact(summary.totalCoin),
          favorite: formatCompact(summary.totalFavorite),
        })}
      />
      <SummaryCard
        label={t('dashboard.summary.avgEngagement')}
        value={
          summary.avgEngagement > 0
            ? formatPercent(summary.avgEngagement, 2)
            : '—'
        }
        sub={t('dashboard.summary.avgEngagementSub')}
      />
    </div>
  );
};

export default KpiSummary;
