'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { Spinner } from '@/common/components/ui/spinner';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useLatency } from '@/common/libs/dashboard-data';
import { EASE_OUT_EXPO, fadeUp } from '@/common/styles/motion';

const LatencySection: React.FC<{ file: string }> = React.memo(({ file }) => {
  const { t } = useTranslation();
  const { currentColor } = useThemeStore();
  const { data, isLoading } = useLatency(30);
  // 預設 30 天窗口
  void file;

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.buckets.map((b) => ({
    key: b.key,
    label: t(`latency.buckets.${b.key}`),
    count: b.count,
  }));

  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader>
          <CardTitle>{t('latency.title')}</CardTitle>
          <CardDescription>
            {t('latency.desc')} ·{' '}
            {data.total > 0
              ? t('latency.avgDays', { days: data.avgDays.toFixed(1) }) +
                ' · ' +
                t('latency.medianDays', { days: data.medianDays.toFixed(0) })
              : t('latency.empty')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.total === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t('latency.empty')}
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
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
                    interval={0}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={currentColor}
                        fillOpacity={0.6 + (i / chartData.length) * 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
LatencySection.displayName = 'LatencySection';

// suppress unused import warning
void EASE_OUT_EXPO;

export default LatencySection;
