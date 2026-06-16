'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { Button } from '@/common/components/ui/button';

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Shared error component for Next.js App Router error boundaries.
 * Each app/(route)/error.tsx just renders this with the same shape.
 */
const RouteError = ({ error, reset }: RouteErrorProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-muted-foreground text-sm font-medium">
        {t('common.loading')}
      </p>
      <p className="text-muted-foreground max-w-md text-xs">
        {error.message || t('dashboard.error.hint')}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={reset}>
          {t('common.retry')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push('/')}>
          {t('errors.notFoundHint')}
        </Button>
      </div>
    </div>
  );
};

export default RouteError;
