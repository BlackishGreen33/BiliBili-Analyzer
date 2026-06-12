'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Accessibility helper: keyboard users land on this first and can jump
 * past the sidebar / navbar to the main content. Visually hidden until
 * focused (`:focus-visible`).
 */
const SkipToContent: React.FC = React.memo(() => {
  const { t } = useTranslation();
  return (
    <a
      href="#main"
      className="bg-popover text-popover-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:outline-none"
    >
      {t('a11y.skipToContent')}
    </a>
  );
});

export default SkipToContent;
