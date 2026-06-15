import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';

const swrFetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
};

/**
 * Test wrapper providing the same default SWR fetcher that the app uses
 * (see common/providers/Providers.tsx). Required for hooks rendered via
 * renderHook() outside the main app Providers tree.
 */
export function SwrTestWrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        dedupingInterval: 30_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
