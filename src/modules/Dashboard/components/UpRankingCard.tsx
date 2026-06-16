'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { EASE_OUT_EXPO, fadeUp } from '@/common/styles/motion';
import { formatCompact, formatViews } from '@/common/utils/format';

type UpRankingItem = {
  name: string;
  mid?: number;
  count: number;
  views: number;
  followers?: number | null;
};

const UpRankingCard: React.FC<{
  topUps: ReadonlyArray<UpRankingItem>;
}> = ({ topUps }) => {
  const { t } = useTranslation();
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.chart.upTable')}</CardTitle>
          <CardDescription>{t('dashboard.chart.upTableDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-left text-xs uppercase">
                <tr>
                  <th className="py-3 pr-4">{t('dashboard.table.rank')}</th>
                  <th className="py-3 pr-4">{t('dashboard.table.up')}</th>
                  <th className="py-3 pr-4 text-right">
                    {t('dashboard.table.count')}
                  </th>
                  <th className="py-3 pr-4 text-right">
                    {t('dashboard.table.views')}
                  </th>
                  <th className="py-3 pr-4 text-right">
                    {t('dashboard.table.followers')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topUps.map((u, i) => (
                  <motion.tr
                    key={u.name + (u.mid ?? '')}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.22,
                      delay: i * 0.02,
                      ease: EASE_OUT_EXPO,
                    }}
                    className="hover:bg-muted/50 border-b last:border-0"
                  >
                    <td className="py-3 pr-4 tabular-nums">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium">{u.name}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {u.count}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatViews(u.views)}
                    </td>
                    <td className="text-muted-foreground py-3 pr-4 text-right tabular-nums">
                      {u.followers ? formatCompact(u.followers) : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UpRankingCard;
