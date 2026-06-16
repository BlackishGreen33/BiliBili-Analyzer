'use client';

import { useTranslation } from 'react-i18next';

import RouteError from '@/common/components/feedback/RouteError';

export default function TrendError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <RouteError error={error} reset={reset} />
      <p className="text-muted-foreground mt-2 text-center text-[10px]">
        {t('common.retry')}
      </p>
    </div>
  );
}
