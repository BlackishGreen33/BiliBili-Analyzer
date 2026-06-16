'use client';

import { motion } from 'framer-motion';
import React from 'react';

import { Card } from '@/common/components/ui/card';
import { fadeUp } from '@/common/styles/motion';

import DeltaChip from './DeltaChip';

type MetricCompareCardProps = {
  label: string;
  aValue: string;
  bValue: string;
  delta: number;
  deltaFormatter: (n: number) => string;
  aLabel: string;
  bLabel: string;
  sub?: string;
};

const MetricCompareCard: React.FC<MetricCompareCardProps> = React.memo(
  ({ label, aValue, bValue, delta, deltaFormatter, aLabel, bLabel, sub }) => (
    <motion.div variants={fadeUp}>
      <Card className="hover:border-primary/50 transition-base h-full p-5 hover:shadow-md">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </p>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div>
            <p className="text-2xl font-bold tabular-nums">{bValue}</p>
            <p className="text-muted-foreground text-[10px] uppercase">
              {bLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-lg font-medium tabular-nums">
              {aValue}
            </p>
            <p className="text-muted-foreground text-[10px] uppercase">
              {aLabel}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <DeltaChip delta={delta} formatter={deltaFormatter} />
          {sub && <p className="text-muted-foreground text-[10px]">{sub}</p>}
        </div>
      </Card>
    </motion.div>
  )
);
MetricCompareCard.displayName = 'MetricCompareCard';

export default MetricCompareCard;
