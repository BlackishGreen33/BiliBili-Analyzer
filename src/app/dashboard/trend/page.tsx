'use client';

import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/common/components/ui/badge';
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
import { Spinner } from '@/common/components/ui/spinner';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useDashboardTrend } from '@/common/libs/dashboard-data';
import {
  containerStagger,
  EASE_OUT_EXPO,
  fadeUp,
} from '@/common/styles/motion';
import { formatCompact, formatPercent } from '@/common/utils/format';

const DURATION_COLORS = [
  '#FB7299',
  '#03C9D7',
  '#7352FF',
  '#FF5C8E',
  '#1E4DB7',
  '#FB9678',
  '#1A97F5',
];

const WINDOW_OPTIONS = [7, 14, 30, 60, 90] as const;

const TrendPage: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { currentColor } = useThemeStore();
  const [window, setWindow] = useState<number>(30);
  const { data, isLoading } = useDashboardTrend(window);

  const durationStackData = useMemo(() => {
    if (!data) return [];
    return data.points.map((p) => {
      const row: Record<string, number | string> = { date: p.date };
      for (const b of p.duration) {
        row[b.label] = b.count;
      }
      return row;
    });
  }, [data]);

  const durationKeys = useMemo(() => {
    if (!data || data.points.length === 0) return [];
    return data.points[0].duration.map((b) => b.label);
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
              {t('trend.title')}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t('trend.desc')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">{t('trend.window')}</label>
            <Select
              value={String(window)}
              onValueChange={(v) => setWindow(parseInt(v, 10))}
            >
              <SelectTrigger className="w-32 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((w) => (
                  <SelectItem
                    key={w}
                    value={String(w)}
                    className="cursor-pointer"
                  >
                    {w} {t('trend.days')}
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
      ) : data.points.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-muted-foreground mx-auto flex h-64 max-w-7xl items-center justify-center text-sm"
        >
          {t('trend.empty')}
        </motion.div>
      ) : (
        <motion.div
          className="mx-auto flex max-w-7xl flex-col gap-6"
          variants={containerStagger(0.06, 0.04)}
          initial="hidden"
          animate="show"
        >
          {data.isMock && (
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                {t('trend.isMockHint', {
                  have: data.realCount,
                  need: data.window,
                })}
              </Badge>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TrendLineCard
              title={t('trend.charts.totalVideos')}
              data={data.points}
              dataKey="totalVideos"
              yFormatter={(v) => formatCompact(v)}
              color={currentColor}
            />
            <TrendLineCard
              title={t('trend.charts.totalUp')}
              data={data.points}
              dataKey="totalUp"
              yFormatter={(v) => formatCompact(v)}
              color={currentColor}
            />
            <TrendLineCard
              title={t('trend.charts.totalViews')}
              data={data.points}
              dataKey="totalViews"
              yFormatter={(v) => formatCompact(v)}
              color={currentColor}
            />
            <TrendLineCard
              title={t('trend.charts.totalEngagement')}
              data={data.points}
              dataKey="totalEngagement"
              yFormatter={(v) => formatCompact(v)}
              color={currentColor}
            />
            <TrendLineCard
              title={t('trend.charts.avgEngagement')}
              data={data.points}
              dataKey="avgEngagement"
              yFormatter={(v) => formatPercent(v, 1)}
              color={currentColor}
            />
            <TrendLineCard
              title={t('trend.charts.avgViews')}
              data={data.points}
              dataKey="avgViews"
              yFormatter={(v) => formatCompact(v)}
              color={currentColor}
            />
          </div>

          {durationStackData.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('trend.charts.duration')}</CardTitle>
                  <CardDescription>{t('trend.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={durationStackData}
                        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
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
                        <Legend
                          wrapperStyle={{ fontSize: '11px' }}
                          iconType="circle"
                        />
                        {durationKeys.map((label, i) => (
                          <Area
                            key={label}
                            type="monotone"
                            dataKey={label}
                            stackId="1"
                            stroke={DURATION_COLORS[i % DURATION_COLORS.length]}
                            fill={DURATION_COLORS[i % DURATION_COLORS.length]}
                            fillOpacity={0.6}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
});
TrendPage.displayName = 'TrendPage';

const TrendLineCard: React.FC<{
  title: string;
  data: ReadonlyArray<Record<string, unknown>>;
  dataKey: string;
  yFormatter: (v: number) => string;
  color: string;
}> = React.memo(({ title, data, dataKey, yFormatter, color }) => (
  <motion.div variants={fadeUp}>
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data as Record<string, unknown>[]}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) => yFormatter(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: number) => yFormatter(v)}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </motion.div>
));
TrendLineCard.displayName = 'TrendLineCard';

export default TrendPage;
