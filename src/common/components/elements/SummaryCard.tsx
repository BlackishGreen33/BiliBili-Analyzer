'use client';

import { motion } from 'framer-motion';
import React from 'react';

import { Card } from '@/common/components/ui/card';
import { EASE_OUT_EXPO, fadeUp } from '@/common/styles/motion';

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
SummaryCard.displayName = 'SummaryCard';

export default SummaryCard;
