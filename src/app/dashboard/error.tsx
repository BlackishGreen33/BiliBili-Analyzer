'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

import RouteError from '@/common/components/feedback/RouteError';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const DashboardError = ({ error, reset }: ErrorProps) => {
  const { t } = useTranslation();
  React.useEffect(() => {
    console.error('Dashboard error boundary caught:', error);
  }, [error]);
  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <RouteError error={error} reset={reset} />
      <p className="text-muted-foreground mt-2 text-center text-[10px]">
        {t('errors.serverError')}
      </p>
    </div>
  );
};

export default DashboardError;
