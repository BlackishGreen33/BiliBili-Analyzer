'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Badge } from '@/common/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { fadeUp } from '@/common/styles/motion';
import { CHART_PALETTE } from '@/common/styles/palette';

type ChannelAgg = { firstChannel: string; count: number };

const ChannelsCard: React.FC<{ channels: ReadonlyArray<ChannelAgg> }> = ({
  channels,
}) => {
  const { t } = useTranslation();
  const data = channels.slice(0, 8).map((c, i) => ({
    name: c.firstChannel,
    value: c.count,
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.chart.channels')}</CardTitle>
          <CardDescription>{t('dashboard.chart.channelsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {data.map((entry, idx) => (
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
            {data.map((c) => (
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
  );
};

export default ChannelsCard;
