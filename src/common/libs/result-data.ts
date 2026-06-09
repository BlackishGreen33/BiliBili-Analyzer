import axios from 'axios';

import { RESULT_BASE_URL } from '@/common/constants/result';
import type { CrawlResult } from '@/common/types/video';

type CachedList = {
  filenames: string[];
  fetchedAt: number;
};

const LIST_TTL_MS = 60 * 1000;

let cachedList: CachedList | null = null;
let inFlightList: Promise<string[]> | null = null;

const inFlightResults = new Map<string, Promise<CrawlResult>>();

export async function fetchResultList(): Promise<string[]> {
  const now = Date.now();
  if (cachedList && now - cachedList.fetchedAt < LIST_TTL_MS) {
    return cachedList.filenames;
  }
  if (inFlightList) {
    return inFlightList;
  }
  inFlightList = axios
    .get<string[]>(`${RESULT_BASE_URL}/list.json`)
    .then((res) => {
      cachedList = { filenames: res.data, fetchedAt: Date.now() };
      return res.data;
    })
    .finally(() => {
      inFlightList = null;
    });
  return inFlightList;
}

export async function fetchResultByName(filename: string): Promise<CrawlResult> {
  const cached = inFlightResults.get(filename);
  if (cached) {
    return cached;
  }
  const promise = axios
    .get<CrawlResult>(`${RESULT_BASE_URL}/${filename}.json`)
    .then((res) => res.data)
    .finally(() => {
      inFlightResults.delete(filename);
    });
  inFlightResults.set(filename, promise);
  return promise;
}
