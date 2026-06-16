'use client';

import { motion } from 'framer-motion';
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
import { fadeUp } from '@/common/styles/motion';

type TopUp = { name: string; count: number; followers?: number | null };

const UpBarCard: React.FC<{ topUps: ReadonlyArray<TopUp> }> = ({ topUps }) => {
  const { t } = useTranslation();
  const { currentColor } = useThemeStore();
  const countKey = t('dashboard.chart.upBarCount');

  const data = topUps.slice(0, 10).map((u) => ({
    name: u.name,
    [countKey]: u.count,
  }));

  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.chart.upBar')}</CardTitle>
          <CardDescription>{t('dashboard.chart.upBarDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
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
                  dataKey={countKey}
                  fill={currentColor}
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UpBarCard;
