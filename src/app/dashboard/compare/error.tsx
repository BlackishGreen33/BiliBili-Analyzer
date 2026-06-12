'use client';

import { NextPage } from 'next';
import { useTranslation } from 'react-i18next';

import { Button } from '@/common/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const CompareError: NextPage<ErrorProps> = ({ error, reset }) => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-muted-foreground text-sm font-medium">
        {t('common.loading')}
      </p>
      <p className="text-muted-foreground max-w-md text-xs">
        {error.message || t('dashboard.error.hint')}
      </p>
      <Button size="sm" onClick={reset}>
        {t('common.retry')}
      </Button>
    </div>
  );
};

export default CompareError;
