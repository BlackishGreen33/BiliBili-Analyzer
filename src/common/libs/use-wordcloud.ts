/**
 * src/common/libs/use-wordcloud.ts
 *
 * useWordCloud — 全站標題分詞詞雲。
 */

import useSWR from 'swr';

export type WordCloudToken = { word: string; count: number };

export type WordCloudData = {
  file: string;
  tokens: WordCloudToken[];
};

const wordcloudFetcher = async (url: string): Promise<WordCloudData> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to load wordcloud');
  }
  return (await res.json()) as WordCloudData;
};

export function useWordCloud() {
  return useSWR<WordCloudData>('/api/wordcloud', wordcloudFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}
