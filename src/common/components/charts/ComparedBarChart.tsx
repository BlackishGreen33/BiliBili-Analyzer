'use client';

import React from 'react';
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

type ComparedBarChartProps = {
  /** "A" | "B" — shown in title; the "B" side gets the accent color */
  side: 'A' | 'B';
  title: string;
  description: string;
  data: ReadonlyArray<Record<string, unknown>>;
  xKey: string;
  /** Color for the bar (default: currentColor for B, muted for A) */
  barColor?: string;
  xTickFormatter?: (value: unknown) => string;
  height?: number;
  radius?: [number, number, number, number];
};

/**
 * Side-by-side A/B BarChart used by the compare page (duration / hour
 * distributions). Reusable for any "show two snapshots" comparison.
 */
const ComparedBarChart: React.FC<ComparedBarChartProps> = ({
  side,
  title,
  description,
  data,
  xKey,
  barColor,
  xTickFormatter,
  height = 256,
  radius = [4, 4, 0, 0],
}) => {
  const { currentColor } = useThemeStore();
  const fill =
    barColor ?? (side === 'B' ? currentColor : 'hsl(var(--muted-foreground))');
  const opacity = side === 'A' ? 0.5 : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {side} · {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data as Record<string, unknown>[]}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey={xKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={xTickFormatter as never}
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
              <Bar
                dataKey="count"
                fill={fill}
                radius={radius}
                opacity={opacity}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparedBarChart;
