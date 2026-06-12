'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import { CrawlResultSchema } from '@/common/types/schema';
import type { CrawlResult } from '@/common/types/video';

const RESULT_BASE_URL =
  'https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result';

const listFetcher = async (): Promise<string[]> => {
  const res = await fetch(`${RESULT_BASE_URL}/list.json`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to load list.json');
  }
  return (await res.json()) as string[];
};

const devListFetcher = async (url: string): Promise<string[]> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const j = (await res.json()) as { list: string[] };
  return j.list;
};

const crawlFetcher = async (url: string): Promise<CrawlResult> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  const raw = await res.json();
  const parsed = CrawlResultSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('CrawlResult validation failed', parsed.error.format());
    // Fallback: still return raw data so the UI doesn't completely break,
    // but log so we can fix schema drift upstream.
    return raw as CrawlResult;
  }
  return parsed.data as CrawlResult;
};

/**
 * Dev-only: 從 `/api/dev/result-list` 拿本機 mock 檔名清單。
 * Production build 也會編進去，但 API 端會回空陣列（見 `route.ts`）。
 */
export function useDevResultList() {
  return useSWR<string[]>(
    process.env.NODE_ENV === 'production' ? null : '/api/dev/result-list',
    devListFetcher,
    { revalidateOnFocus: false, dedupingInterval: 10_000 }
  );
}

/**
 * SWR-based list of all crawl filenames, sorted newest first.
 * 在 dev 環境下會自動 prepend `useDevResultList()` 的本機 mock，
 * 讓 `MOCK_LOCAL_FILES=1` + `pnpm mock-second-day` 的 QA 流程對
 * 所有頁面都生效。
 */
export function useResultList() {
  const remote = useSWR<string[]>('result-list', listFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  const dev = useDevResultList();
  return useMergedResultList(remote.data, dev.data);
}

/**
 * Merge two filename lists (dev takes priority) while preserving order
 * and de-duplicating. Exposed for callers that already loaded `useResultList`
 * upstream (e.g. the compare page).
 */
export function useMergedResultList(
  remoteList: string[] | undefined,
  devList: string[] | undefined
): { data: string[]; isLoading: boolean; error: Error | undefined } {
  const data = useMemo(() => {
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const f of [...(devList ?? []), ...(remoteList ?? [])]) {
      if (!seen.has(f)) {
        seen.add(f);
        merged.push(f);
      }
    }
    return merged;
  }, [devList, remoteList]);
  return { data, isLoading: false, error: undefined };
}

/**
 * SWR-based loader for a specific crawl file. Pass `null` to disable.
 */
export function useResultByName(filename: string | null) {
  return useSWR<CrawlResult>(
    filename ? `${RESULT_BASE_URL}/${filename}.json` : null,
    crawlFetcher,
    { revalidateOnFocus: false }
  );
}

/**
 * Convenience hook that auto-selects the latest crawl file.
 */
export function useLatestCrawl(filename: string | null) {
  return useResultByName(filename);
}

export async function fetchRandomBvid(): Promise<string> {
  const res = await fetch('/api/randomBvid');
  if (!res.ok) {
    throw new Error('Failed to fetch random bvid');
  }
  return res.text();
}

export function useRandomBvid() {
  return useSWR<string>('random-bvid', fetchRandomBvid, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });
}
