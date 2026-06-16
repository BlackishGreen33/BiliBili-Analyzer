/**
 * src/common/utils/search-filters.ts
 *
 * Search 頁的純函數 filter / encode / decode 邏輯。
 * 抽出後易測試，Search.tsx 組件可專注於渲染。
 */

export type ChannelOption = {
  value: string;
  label: string;
  children?: ChannelOption[];
};

export type ChannelSelection = string[][]; // [[first, second], ...

export type VideoLike = {
  tags: { firstChannel: string; secondChannel: string; ordinaryTags: string[] };
  title: string;
  UP: string;
};

export const PAGE_SIZE = 24;

export function buildChannelOptions(
  videos: ReadonlyArray<VideoLike>
): ChannelOption[] {
  const map = new Map<string, ChannelOption>();
  for (const v of videos) {
    const first = v.tags.firstChannel;
    const second = v.tags.secondChannel;
    if (!first || !second) continue;
    let entry = map.get(first);
    if (!entry) {
      entry = { value: first, label: first, children: [] };
      map.set(first, entry);
    }
    if (!entry.children!.some((c) => c.value === second)) {
      entry.children!.push({ value: second, label: second });
    }
  }
  return Array.from(map.values());
}

export function encodeChannels(cs: ChannelSelection): string {
  return cs
    .map(([f, s]) => (s ? `${f}-${s}` : f))
    .filter((s): s is string => !!s && s.length > 0)
    .join(',');
}

export function decodeChannels(
  raw: string | null | undefined
): ChannelSelection {
  if (!raw) return [];
  return raw
    .split(',')
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => {
      const i = seg.indexOf('-');
      return i < 0 ? [seg, ''] : [seg.slice(0, i), seg.slice(i + 1)];
    });
}

export type FilterArgs<T extends VideoLike> = {
  videos: T[];
  q: string;
  channels: ChannelSelection;
  tag: string | null;
};

export function filterVideos<T extends VideoLike>(args: FilterArgs<T>): T[] {
  const { videos, q, channels, tag } = args;
  const kw = q.trim().toLowerCase();
  const matchTitle = (title: string) => title.toLowerCase().includes(kw);
  const matchTagText = (tags: string[]) =>
    tags.some((t) => t.toLowerCase().includes(kw));
  const matchChannel = (v: VideoLike) =>
    channels.length === 0 ||
    channels.some(
      ([first, second]) =>
        v.tags.firstChannel === first &&
        (v.tags.secondChannel === second || !second)
    );
  const matchTag = (tags: string[]) => !tag || tags.includes(tag);
  return videos.filter((v) => {
    const matchKw =
      !kw ||
      matchTitle(v.title) ||
      matchTitle(v.UP) ||
      matchTagText(v.tags.ordinaryTags);
    return matchKw && matchChannel(v) && matchTag(v.tags.ordinaryTags);
  });
}
