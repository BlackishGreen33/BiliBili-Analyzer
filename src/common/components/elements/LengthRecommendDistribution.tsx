'use client';

import { motion } from 'framer-motion';
import React from 'react';

import type { LengthDistribution } from '@/common/libs/use-length-recommend';
import { EASE_OUT_EXPO } from '@/common/styles/motion';

type Props = {
  distribution: LengthDistribution[];
  primary: { label: string; share: number; count: number } | null;
  currentColor: string;
};

const LengthRecommendDistribution: React.FC<Props> = React.memo(
  ({ distribution, primary, currentColor }) => (
    <div className="mt-4 space-y-1.5">
      {distribution.map((b, i) => (
        <motion.div
          key={b.label}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.2,
            delay: i * 0.04,
            ease: EASE_OUT_EXPO,
          }}
          className="flex items-center gap-2 text-xs"
        >
          <span className="text-muted-foreground w-20 shrink-0 tabular-nums">
            {b.label}
          </span>
          <div className="bg-muted relative h-4 flex-1 overflow-hidden rounded">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${b.share * 100}%` }}
              transition={{
                duration: 0.5,
                delay: 0.1 + i * 0.04,
                ease: EASE_OUT_EXPO,
              }}
              className="absolute inset-y-0 left-0"
              style={{
                backgroundColor: currentColor,
                opacity: b === primary ? 1 : 0.5,
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right tabular-nums">
            {b.count}
          </span>
        </motion.div>
      ))}
    </div>
  )
);
LengthRecommendDistribution.displayName = 'LengthRecommendDistribution';

export default LengthRecommendDistribution;
