import 'server-only';

import { CrawlResultSchema } from '@/common/types/schema';
import type { CrawlResult } from '@/common/types/video';

const RESULT_BASE_URL =
  'https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result';

const LIST_TTL_MS = 60 * 1000;

let cachedList: { filenames: string[]; fetchedAt: number } | null = null;
let inFlightList: Promise<string[]> | null = null;
const inFlightResults = new Map<string, Promise<CrawlResult>>();

export async function fetchResultList(): Promise<string[]> {
  const now = Date.now();
  if (cachedList && now - cachedList.fetchedAt < LIST_TTL_MS) {
    return cachedList.filenames;
  }
  if (inFlightList) return inFlightList;
  inFlightList = fetch(`${RESULT_BASE_URL}/list.json`, { cache: 'no-store' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`list.json ${res.status}`);
      return (await res.json()) as string[];
    })
    .then((filenames) => {
      cachedList = { filenames, fetchedAt: Date.now() };
      return filenames;
    })
    .finally(() => {
      inFlightList = null;
    });
  return inFlightList;
}

export async function fetchResultByName(
  filename: string
): Promise<CrawlResult> {
  const cached = inFlightResults.get(filename);
  if (cached) return cached;
  const promise = fetch(`${RESULT_BASE_URL}/${filename}.json`, {
    cache: 'no-store',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`${filename}.json ${res.status}`);
      const raw = await res.json();
      const parsed = CrawlResultSchema.safeParse(raw);
      if (!parsed.success) {
        console.error(
          'CrawlResult validation failed (server)',
          parsed.error.format()
        );
        return raw as CrawlResult;
      }
      return parsed.data as CrawlResult;
    })
    .finally(() => {
      inFlightResults.delete(filename);
    });
  inFlightResults.set(filename, promise);
  return promise;
}
