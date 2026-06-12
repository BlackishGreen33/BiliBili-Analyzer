'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import React from 'react';
import '@/common/i18n';

import Layout from '@/common/components/layouts';

type Props = {
  children: React.ReactNode;
};

const Providers: React.FC<Props> = React.memo(({ children }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Layout>{children}</Layout>
    </NextThemesProvider>
  );
});

export default Providers;
