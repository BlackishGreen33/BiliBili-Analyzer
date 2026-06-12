'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Button } from '@/common/components/ui/button';
import { EASE_OUT_EXPO } from '@/common/styles/motion';

export default function UpsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-base font-semibold">{t('common.retry')}</p>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <motion.div
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="cursor-pointer"
        >
          {t('common.retry')}
        </Button>
      </motion.div>
    </div>
  );
}
