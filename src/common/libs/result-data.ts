'use client';

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
 * SWR-based list of all crawl filenames, sorted newest first.
 */
export function useResultList() {
  return useSWR<string[]>('result-list', listFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
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
