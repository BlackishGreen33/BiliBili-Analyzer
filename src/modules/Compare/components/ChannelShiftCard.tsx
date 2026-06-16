'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import DeltaChip from '@/common/components/composed/DeltaChip';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { fadeUp } from '@/common/styles/motion';

type ChannelShiftItem = {
  firstChannel: string;
  countA: number;
  countB: number;
  delta: number;
};

const ChannelShiftCard: React.FC<{
  items: ReadonlyArray<ChannelShiftItem>;
}> = ({ items }) => {
  const { t } = useTranslation();
  const top = items.slice(0, 12);
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader>
          <CardTitle>{t('compare.sections.channels')}</CardTitle>
          <CardDescription>
            {t('compare.channelMeta', { count: items.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {top.map((c) => (
              <div
                key={c.firstChannel}
                className="hover:border-primary/50 transition-base flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-sm font-medium">{c.firstChannel}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground tabular-nums">
                    {c.countA}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold tabular-nums">{c.countB}</span>
                  <DeltaChip
                    delta={c.delta}
                    formatter={(n) => `${n > 0 ? '+' : ''}${n}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ChannelShiftCard;
