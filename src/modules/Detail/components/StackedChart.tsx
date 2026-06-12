'use client';

import React, { useMemo } from 'react';
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
import type { BilibiliVideoStat } from '@/common/types/bilibili';
import { formatCompact } from '@/common/utils/format';

const METRIC_KEYS: Array<Exclude<keyof BilibiliVideoStat, 'aid'>> = [
  'view',
  'danmaku',
  'reply',
  'favorite',
  'coin',
  'share',
  'like',
];

interface StackedChartProps {
  stat: BilibiliVideoStat;
}

const StackedChart: React.FC<StackedChartProps> = React.memo(({ stat }) => {
  const { currentColor } = useThemeStore();
  const { t } = useTranslation();
  const data = useMemo(
    () =>
      METRIC_KEYS.map((key) => ({
        name: t(`detail.metrics.${key}`),
        value: stat[key],
      })),
    [stat, t]
  );

  const max = useMemo(
    () => Math.max(...METRIC_KEYS.map((key) => stat[key])),
    [stat]
  );

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{t('detail.stackedTitle')}</CardTitle>
        <CardDescription>
          {t('detail.stackedDesc', { max: formatCompact(max) })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatCompact(v)}
                width={60}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: number) => formatCompact(v)}
              />
              <Bar dataKey="value" fill={currentColor} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export default StackedChart;
