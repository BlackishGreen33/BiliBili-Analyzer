'use client';

import React, { useMemo } from 'react';
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
import type { BilibiliVideoStat } from '@/common/types/bilibili';
import { formatCompact } from '@/common/utils/format';

const METRIC_LABELS: Array<{ key: keyof BilibiliVideoStat; label: string }> = [
  { key: 'view', label: '观看' },
  { key: 'danmaku', label: '弹幕' },
  { key: 'reply', label: '评论' },
  { key: 'favorite', label: '收藏' },
  { key: 'coin', label: '投币' },
  { key: 'share', label: '分享' },
  { key: 'like', label: '点赞' },
];

interface StackedChartProps {
  stat: BilibiliVideoStat;
}

const StackedChart: React.FC<StackedChartProps> = React.memo(({ stat }) => {
  const data = useMemo(
    () =>
      METRIC_LABELS.map(({ key, label }) => ({
        name: label,
        value: stat[key],
      })),
    [stat]
  );

  const max = useMemo(
    () => Math.max(...METRIC_LABELS.map(({ key }) => stat[key])),
    [stat]
  );

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>互动指标</CardTitle>
        <CardDescription>
          视频核心数据一览（峰值 {formatCompact(max)}）
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
              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export default StackedChart;
