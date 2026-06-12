'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
import { useDashboard } from '@/common/libs/dashboard-data';
import { useResultList } from '@/common/libs/result-data';
import {
  containerStagger,
  EASE_OUT_EXPO,
  fadeUp,
} from '@/common/styles/motion';
import {
  formatCompact,
  formatDateTime,
  formatPercent,
  formatViews,
} from '@/common/utils/format';

const CHART_PALETTE = [
  '#FB7299',
  '#03C9D7',
  '#7352FF',
  '#FF5C8E',
  '#1E4DB7',
  '#FB9678',
  '#1A97F5',
  '#00C292',
  '#FEC90F',
  '#0FC941',
];

const SummaryCard: React.FC<{ label: string; value: string; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
  >
    <Card className="hover:border-primary/50 transition-base cursor-default p-5 hover:shadow-md">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-muted-foreground mt-1 text-xs">{sub}</p>}
    </Card>
  </motion.div>
);

const DashboardPage: React.FC = React.memo(() => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentColor } = useThemeStore();
  const { t } = useTranslation();
  const { data: list = [] } = useResultList();
  const initialFile = searchParams.get('file') || list[0] || null;
  const [file, setFile] = useState<string | null>(initialFile);

  const { data, isLoading } = useDashboard(file);

  const channelPieData = useMemo(
    () =>
      (data?.channels ?? []).slice(0, 8).map((c, i) => ({
        name: c.firstChannel,
        value: c.count,
        fill: CHART_PALETTE[i % CHART_PALETTE.length],
      })),
    [data?.channels]
  );

  const upBarData = useMemo(
    () =>
      (data?.topUps ?? []).slice(0, 10).map((u) => ({
        name: u.name,
        上榜: u.count,
        粉丝: u.followers ?? 0,
      })),
    [data?.topUps]
  );

  const tagBarData = useMemo(
    () =>
      (data?.topTags ?? [])
        .slice(0, 20)
        .map((t) => ({ name: t.tag, value: t.count })),
    [data?.topTags]
  );

  const engagementData = useMemo(
    () =>
      (data?.topEngagement ?? []).map((v) => ({
        ...v,
        // 截斷標題避免 label 太長
        shortTitle: v.title.length > 14 ? `${v.title.slice(0, 14)}…` : v.title,
      })),
    [data?.topEngagement]
  );

  const maxEngagement = useMemo(
    () =>
      engagementData.length > 0
        ? Math.max(...engagementData.map((v) => v.engagement))
        : 0,
    [engagementData]
  );

  const handleFileChange = (value: string) => {
    setFile(value);
    router.replace(`/dashboard?file=${value}`, { scroll: false });
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <SummaryCard
              label={t('dashboard.summary.videos')}
              value={formatCompact(data.summary.totalVideos)}
            />
            <SummaryCard
              label={t('dashboard.summary.ups')}
              value={formatCompact(data.summary.totalUp)}
            />
            <SummaryCard
              label={t('dashboard.summary.views')}
              value={formatCompact(data.summary.totalViews)}
              sub={t('dashboard.summary.viewsSub')}
            />
            <SummaryCard
              label={t('dashboard.summary.engagement')}
              value={formatCompact(
                data.summary.totalLike +
                  data.summary.totalCoin * 2 +
                  data.summary.totalFavorite * 2
              )}
              sub={t('dashboard.summary.engagementSub', {
                like: formatCompact(data.summary.totalLike),
                coin: formatCompact(data.summary.totalCoin),
                favorite: formatCompact(data.summary.totalFavorite),
              })}
            />
            <SummaryCard
              label={t('dashboard.summary.avgEngagement')}
              value={
                data.summary.avgEngagement > 0
                  ? formatPercent(data.summary.avgEngagement, 2)
                  : '—'
              }
              sub={t('dashboard.summary.avgEngagementSub')}
            />
          </div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.chart.engagementTop')}</CardTitle>
                <CardDescription>
                  {t('dashboard.chart.engagementTopDesc')}
                  {engagementData.length > 0 && (
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
                {engagementData.length === 0 ? (
                  <p className="text-muted-foreground py-12 text-center text-sm">
                    {t('dashboard.chart.engagementTopEmpty')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={engagementData}
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
                                | (typeof engagementData)[number]
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
                            <th className="py-3 pr-4">
                              {t('dashboard.table.rank')}
                            </th>
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
                          {engagementData.map((v, i) => (
                            <motion.tr
                              key={v.bvid}
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.22,
                                delay: i * 0.02,
                                ease: EASE_OUT_EXPO,
                              }}
                              onClick={() =>
                                router.push(`/details?bvid=${v.bvid}`)
                              }
                              className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                            >
                              <td className="py-3 pr-4 tabular-nums">
                                {i + 1}
                              </td>
                              <td className="max-w-[260px] py-3 pr-4">
                                <p className="line-clamp-1 font-medium">
                                  {v.title}
                                </p>
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.chart.channels')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.chart.channelsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelPieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={100}
                          paddingAngle={2}
                        >
                          {channelPieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {channelPieData.map((c) => (
                      <Badge
                        key={c.name}
                        variant="outline"
                        className="cursor-default gap-1.5"
                        style={{ borderColor: c.fill, color: c.fill }}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.fill }}
                        />
                        {c.name} · {c.value}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.chart.upBar')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.chart.upBarDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={upBarData}
                        layout="vertical"
                        margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          type="number"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="上榜"
                          fill={currentColor}
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.chart.duration')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.chart.durationDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.duration}
                        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="label"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
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
                        <Bar
                          dataKey="count"
                          fill={currentColor}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.chart.hour')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.chart.hourDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.hourHeatmap}
                        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="hour"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(h: number) => `${h}h`}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
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
                          labelFormatter={(h: number) => `${h} 时`}
                        />
                        <Bar
                          dataKey="count"
                          fill={currentColor}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.chart.tags')}</CardTitle>
                <CardDescription>
                  {t('dashboard.chart.tagsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tagBarData.map((t, i) => (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.24,
                        delay: i * 0.015,
                        ease: EASE_OUT_EXPO,
                      }}
                    >
                      <Badge
                        variant="secondary"
                        className="transition-base cursor-default px-3 py-1 text-sm hover:scale-105"
                        style={{
                          fontSize: `${Math.min(20, 12 + t.value * 0.5)}px`,
                          opacity: 0.5 + Math.min(0.5, t.value / 50),
                        }}
                      >
                        {t.name} · {t.value}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.chart.upTable')}</CardTitle>
                <CardDescription>
                  {t('dashboard.chart.upTableDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground border-b text-left text-xs uppercase">
                      <tr>
                        <th className="py-3 pr-4">
                          {t('dashboard.table.rank')}
                        </th>
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
                      {data.topUps.map((u, i) => (
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
        </motion.div>
      )}
    </div>
  );
});

export default DashboardPage;
