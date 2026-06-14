/**
 * src/common/libs/routes/wordcloud.ts
 *
 * 給 `/api/wordcloud` route 用的純函數。
 */

import { segmentTitles, type SegToken } from '@/common/utils/cjk-segmenter';

export type WordCloudPayload = {
  file: string;
  tokens: SegToken[];
};

export function buildWordCloudPayload(
  file: string,
  videos: Array<{ title: string }>,
  topN = 200
): WordCloudPayload {
  const titles = videos.map((v) => v.title).filter(Boolean);
  const tokens = segmentTitles(titles, { topN });
  return { file, tokens };
}
