'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { EASE_OUT_EXPO } from '@/common/styles/motion';
import { formatDuration, formatPercent } from '@/common/utils/format';

type Props = {
  primary: { label: string; share: number; count: number };
  medianSeconds: number;
  p25: number;
  p75: number;
  rationaleKey: string;
};

const LengthRecommendPrimaryBlock: React.FC<Props> = React.memo(
  ({ primary, medianSeconds, p25, p75, rationaleKey }) => {
    const { t } = useTranslation();
    return (
      <>
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
          className="text-sm font-medium"
        >
          {t('length.recommendPrimary', {
            bucket: primary.label,
            share: formatPercent(primary.share, 0),
          })}
        </motion.p>
        <p className="text-muted-foreground mt-1 text-xs">
          {t('length.bucketShare', {
            count: primary.count,
            share: formatPercent(primary.share, 0),
          })}
        </p>
        {medianSeconds > 0 && (
          <p
            className="text-muted-foreground mt-1 text-[11px] tabular-nums"
            title={t(rationaleKey)}
          >
            median {formatDuration(medianSeconds)} · IQR {formatDuration(p25)}–
            {formatDuration(p75)}
          </p>
        )}
      </>
    );
  }
);
LengthRecommendPrimaryBlock.displayName = 'LengthRecommendPrimaryBlock';

export default LengthRecommendPrimaryBlock;
