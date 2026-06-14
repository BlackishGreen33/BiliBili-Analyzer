/**
 * src/common/libs/routes/length-recommend.ts
 *
 * 給 `/api/length/recommend` route 用的純函數：
 * - `parseLengthParams` 解析 + 校驗 type / value / window
 * - `matchVideo` 判斷影片是否符合 scope (up / channel / tag)
 */

import { parseWindowParam } from '@/common/libs/routes/shared';

export const LENGTH_TYPES = ['up', 'channel', 'tag'] as const;
export type LengthType = (typeof LENGTH_TYPES)[number];

type VideoLike = {
  UP: string;
  mid?: number;
  tags?: {
    firstChannel: string;
    secondChannel: string;
    ordinaryTags: string[];
  };
};

export function matchVideo(type: string, value: string, v: VideoLike): boolean {
  if (type === 'up') {
    return v.UP === value || String(v.mid ?? '') === value;
  }
  if (type === 'channel') {
    return v.tags?.firstChannel === value;
  }
  if (type === 'tag') {
    return v.tags?.ordinaryTags?.includes(value) ?? false;
  }
  return false;
}

export type ParseLengthResult =
  | { ok: true; type: LengthType; value: string; window: number }
  | { ok: false; status: 400; message: string };

export function parseLengthParams(url: URL): ParseLengthResult {
  const type = url.searchParams.get('type') ?? '';
  const value = url.searchParams.get('value') ?? '';
  if (!LENGTH_TYPES.includes(type as LengthType)) {
    return { ok: false, status: 400, message: 'Invalid type' };
  }
  if (!value) {
    return { ok: false, status: 400, message: 'Missing value' };
  }
  const window = parseWindowParam(url, 'window', { default: 30, max: 90 });
  return { ok: true, type: type as LengthType, value, window };
}
