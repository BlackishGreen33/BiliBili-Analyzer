'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/common/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useLengthRecommend } from '@/common/libs/use-length-recommend';
import { EASE_OUT_EXPO, fadeUp } from '@/common/styles/motion';
import { formatDuration, formatPercent } from '@/common/utils/format';

export type LengthRecommendScope = {
  type: 'up' | 'channel' | 'tag';
  value: string;
  label?: string;
  window?: number;
};

const LengthRecommendCard: React.FC<{ scope: LengthRecommendScope }> =
  React.memo(({ scope }) => {
    const { t } = useTranslation();
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
    const isLowConfidence = confidence === 'low';

    return (
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">
                {t('length.recommendTitle')}
              </CardTitle>
              {isLowConfidence && (
                <Badge variant="outline" className="text-[10px]">
                  {t('length.recommendLowConfidence')}
                </Badge>
              )}
            </div>
            <CardDescription>
              {t('length.recommendDesc', { name: label })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sampleSize === 0 || !primary ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {t('length.recommendEmpty')}
              </p>
            ) : (
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
                    median {formatDuration(medianSeconds)} · IQR{' '}
                    {formatDuration(p25)}–{formatDuration(p75)}
                  </p>
                )}
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
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  });
LengthRecommendCard.displayName = 'LengthRecommendCard';

export default LengthRecommendCard;
