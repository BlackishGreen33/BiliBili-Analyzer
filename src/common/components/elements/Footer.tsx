'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = React.memo(() => {
  const { t } = useTranslation();
  return (
    <footer className="text-muted-foreground mt-20 border-t py-6 text-center text-xs">
      <p>
        {t('footer.copyright', { year: 2026 })}
        <a
          href="https://www.bilibili.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground ml-1 cursor-pointer transition-colors duration-200 hover:underline"
        >
          {t('footer.source')}
        </a>
      </p>
      <p className="mt-1">{t('footer.disclaimer')}</p>
    </footer>
  );
});

export default Footer;
