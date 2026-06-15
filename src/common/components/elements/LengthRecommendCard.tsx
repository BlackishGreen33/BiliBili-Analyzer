'use client';

import { motion } from 'framer-motion';
import React from 'react';

import { Card, CardContent } from '@/common/components/ui/card';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useLengthRecommend } from '@/common/libs/use-length-recommend';
import { fadeUp } from '@/common/styles/motion';

import LengthRecommendDistribution from './LengthRecommendDistribution';
import LengthRecommendEmpty from './LengthRecommendEmpty';
import LengthRecommendHeader from './LengthRecommendHeader';
import LengthRecommendPrimaryBlock from './LengthRecommendPrimaryBlock';

export type LengthRecommendScope = {
  type: 'up' | 'channel' | 'tag';
  value: string;
  label?: string;
  window?: number;
};

const LengthRecommendCard: React.FC<{ scope: LengthRecommendScope }> =
  React.memo(({ scope }) => {
    const { currentColor } = useThemeStore();
    const window = scope.window ?? 30;
    const { data, isLoading } = useLengthRecommend(
      scope.type,
      scope.value,
      window
    );

    if (isLoading || !data) {
      return null;
    }

    const {
      primary,
      distribution,
      sampleSize,
      confidence,
      medianSeconds,
      p25,
      p75,
      rationaleKey,
    } = data;
    const label = scope.label ?? scope.value;

    return (
      <motion.div variants={fadeUp}>
        <Card>
          <LengthRecommendHeader label={label} confidence={confidence} />
          <CardContent>
            {sampleSize === 0 || !primary ? (
              <LengthRecommendEmpty />
            ) : (
              <>
                <LengthRecommendPrimaryBlock
                  primary={primary}
                  medianSeconds={medianSeconds}
                  p25={p25}
                  p75={p75}
                  rationaleKey={rationaleKey}
                />
                <LengthRecommendDistribution
                  distribution={distribution}
                  primary={primary}
                  currentColor={currentColor}
                />
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  });
LengthRecommendCard.displayName = 'LengthRecommendCard';

export default LengthRecommendCard;
