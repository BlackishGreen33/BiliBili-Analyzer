'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { EASE_OUT_EXPO, fadeUp } from '@/common/styles/motion';
import { formatPercent, formatViews } from '@/common/utils/format';

type EngagementItem = {
  bvid: string;
  title: string;
  UP: string;
  views: number;
  engagement: number;
};

const EngagementTopCard: React.FC<{
  items: ReadonlyArray<EngagementItem>;
}> = ({ items }) => {
  const { t } = useTranslation();
  const { currentColor } = useThemeStore();
  const router = useRouter();

  const data = useMemo(
    () =>
      items.map((v) => ({
        ...v,
        shortTitle: v.title.length > 14 ? `${v.title.slice(0, 14)}…` : v.title,
      })),
    [items]
  );

  const maxEngagement = useMemo(
    () => (data.length > 0 ? Math.max(...data.map((v) => v.engagement)) : 0),
    [data]
  );

  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.chart.engagementTop')}</CardTitle>
          <CardDescription>
            {t('dashboard.chart.engagementTopDesc')}
            {data.length > 0 && (
              <>
                {' · '}
                {t('dashboard.chart.engagementTopPeak', {
                  value: formatPercent(maxEngagement, 2),
                })}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              {t('dashboard.chart.engagementTopEmpty')}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickFormatter={(v: number) => formatPercent(v, 1)}
                      domain={[0, 'dataMax']}
                    />
                    <YAxis
                      type="category"
                      dataKey="shortTitle"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={120}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(v: number) => formatPercent(v, 2)}
                      labelFormatter={(_label, payload) => {
                        const item = payload?.[0]?.payload as
                          | (typeof data)[number]
                          | undefined;
                        return item?.title ?? '';
                      }}
                    />
                    <Bar
                      dataKey="engagement"
                      fill={currentColor}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b text-left text-xs uppercase">
                    <tr>
                      <th className="py-3 pr-4">{t('dashboard.table.rank')}</th>
                      <th className="py-3 pr-4">
                        {t('dashboard.table.video')}
                      </th>
                      <th className="py-3 pr-4 text-right">
                        {t('dashboard.table.engagement')}
                      </th>
                      <th className="py-3 pr-4 text-right">
                        {t('dashboard.table.play')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((v, i) => (
                      <motion.tr
                        key={v.bvid}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.22,
                          delay: i * 0.02,
                          ease: EASE_OUT_EXPO,
                        }}
                        onClick={() => router.push(`/details?bvid=${v.bvid}`)}
                        className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                      >
                        <td className="py-3 pr-4 tabular-nums">{i + 1}</td>
                        <td className="max-w-[260px] py-3 pr-4">
                          <p className="line-clamp-1 font-medium">{v.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {v.UP}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                          {formatPercent(v.engagement, 2)}
                        </td>
                        <td className="text-muted-foreground py-3 pr-4 text-right tabular-nums">
                          {formatViews(v.views)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EngagementTopCard;
