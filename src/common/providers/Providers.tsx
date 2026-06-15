'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import React from 'react';
import { SWRConfig } from 'swr';
import '@/common/i18n';

import Layout from '@/common/components/layouts';

type Props = {
  children: React.ReactNode;
};

const swrFetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
};

const Providers: React.FC<Props> = React.memo(({ children }) => {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        dedupingInterval: 30_000,
      }}
    >
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Layout>{children}</Layout>
      </NextThemesProvider>
    </SWRConfig>
  );
});

export default Providers;
