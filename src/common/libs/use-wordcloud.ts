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

export function useWordCloud() {
  return useSWR<WordCloudData>('/api/wordcloud', { dedupingInterval: 60_000 });
}
