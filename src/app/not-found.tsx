'use client';

import { NextPage } from 'next';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const NotFound: NextPage = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <h1
        title="404"
        className="relative inline-block animate-pulse text-7xl font-bold tracking-tight"
      >
        404
      </h1>
      <p className="text-muted-foreground text-lg">{t('errors.notFound')}</p>
      <Link
        href="/"
        className="text-primary mt-2 text-sm underline-offset-4 hover:underline"
      >
        {t('errors.notFoundHint')}
      </Link>
    </div>
  );
};

export default NotFound;
