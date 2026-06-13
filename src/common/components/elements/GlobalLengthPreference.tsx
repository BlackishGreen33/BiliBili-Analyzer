'use client';

import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { EASE_OUT_EXPO, fadeUp } from '@/common/styles/motion';
import { formatPercent } from '@/common/utils/format';

type DurationBucket = {
  label: string;
  min: number;
  max: number;
  count: number;
};

const GlobalLengthPreference: React.FC<{
  buckets: ReadonlyArray<DurationBucket>;
  totalVideos: number;
}> = React.memo(({ buckets, totalVideos }) => {
  const { t } = useTranslation();
  const { currentColor } = useThemeStore();

  const primary = useMemo(() => {
    if (totalVideos === 0) return null;
    return buckets.reduce<DurationBucket | null>((best, b) => {
      if (!best || b.count > best.count) return b;
      return best;
    }, null);
  }, [buckets, totalVideos]);

  if (totalVideos === 0) {
    return null;
  }

  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader>
          <CardTitle>{t('length.globalTitle')}</CardTitle>
          <CardDescription>{t('length.globalDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {primary && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
              className="text-sm font-medium"
            >
              {t('length.recommendPrimary', {
                bucket: primary.label,
                share: formatPercent(primary.count / totalVideos, 0),
              })}
            </motion.p>
          )}
          <div className="mt-4 space-y-1.5">
            {buckets.map((b, i) => (
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
                    animate={{
                      width: `${totalVideos > 0 ? (b.count / totalVideos) * 100 : 0}%`,
                    }}
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
        </CardContent>
      </Card>
    </motion.div>
  );
});
GlobalLengthPreference.displayName = 'GlobalLengthPreference';

export default GlobalLengthPreference;
