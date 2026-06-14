import { describe, expect, it } from 'vitest';

import {
  buildChannelOptions,
  decodeChannels,
  encodeChannels,
  filterVideos,
  PAGE_SIZE,
} from '@/common/utils/search-filters';

const sampleVideos = [
  {
    bvid: 'BV1',
    title: '原神 5.0 评测',
    UP: 'UP1',
    tags: {
      firstChannel: '游戏',
      secondChannel: '单机游戏',
      ordinaryTags: ['原神', '评测'],
    },
  },
  {
    bvid: 'BV2',
    title: '明日方舟攻略',
    UP: 'UP2',
    tags: {
      firstChannel: '游戏',
      secondChannel: '手游',
      ordinaryTags: ['明日方舟', '攻略'],
    },
  },
  {
    bvid: 'BV3',
    title: 'Python 教學',
    UP: 'UP3',
    tags: {
      firstChannel: '知识',
      secondChannel: '编程',
      ordinaryTags: ['Python', '编程'],
    },
  },
];

describe('PAGE_SIZE', () => {
  it('is 24', () => {
    expect(PAGE_SIZE).toBe(24);
  });
});

describe('buildChannelOptions', () => {
  it('groups by firstChannel and dedupes secondChannel', () => {
    const opts = buildChannelOptions(sampleVideos);
    const game = opts.find((o) => o.value === '游戏');
    expect(game).toBeDefined();
    expect(game!.children!.map((c) => c.value).sort()).toEqual([
      '单机游戏',
      '手游',
    ]);
  });

  it('skips videos with missing first/second channel', () => {
    const opts = buildChannelOptions([
      {
        tags: { firstChannel: '', secondChannel: 'a', ordinaryTags: [] },
        title: '',
        UP: '',
      },
      {
        tags: { firstChannel: '游戏', secondChannel: '', ordinaryTags: [] },
        title: '',
        UP: '',
      },
    ]);
    expect(opts).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(buildChannelOptions([])).toEqual([]);
  });
});

describe('encodeChannels / decodeChannels', () => {
  it('round-trips channel selections', () => {
    const original: string[][] = [
      ['游戏', '单机游戏'],
      ['知识', '编程'],
    ];
    expect(decodeChannels(encodeChannels(original))).toEqual(original);
  });

  it('handles first-only (empty second) entries', () => {
    const original: string[][] = [
      ['游戏', ''],
      ['知识', '编程'],
    ];
    expect(decodeChannels(encodeChannels(original))).toEqual(original);
  });

  it('returns [] for null/empty input', () => {
    expect(decodeChannels(null)).toEqual([]);
    expect(decodeChannels(undefined)).toEqual([]);
    expect(decodeChannels('')).toEqual([]);
  });

  it('decodes segments without dash as [value, ""]', () => {
    expect(decodeChannels('游戏')).toEqual([['游戏', '']]);
  });

  it('decodes multi-segment (comma separated)', () => {
    expect(decodeChannels('游戏-单机,知识-编程')).toEqual([
      ['游戏', '单机'],
      ['知识', '编程'],
    ]);
  });
});

describe('filterVideos', () => {
  it('returns all videos when no filters set', () => {
    expect(
      filterVideos({ videos: sampleVideos, q: '', channels: [], tag: null })
    ).toHaveLength(3);
  });

  it('filters by keyword (title match, case-insensitive)', () => {
    const r = filterVideos({
      videos: sampleVideos,
      q: 'python',
      channels: [],
      tag: null,
    });
    expect(r).toHaveLength(1);
    expect(r[0]!.bvid).toBe('BV3');
  });

  it('filters by keyword (UP match)', () => {
    const r = filterVideos({
      videos: sampleVideos,
      q: 'UP1',
      channels: [],
      tag: null,
    });
    expect(r.map((v) => v.bvid)).toEqual(['BV1']);
  });

  it('filters by keyword (tag match)', () => {
    const r = filterVideos({
      videos: sampleVideos,
      q: '明日方舟',
      channels: [],
      tag: null,
    });
    expect(r.map((v) => v.bvid)).toEqual(['BV2']);
  });

  it('filters by first channel (without second)', () => {
    const r = filterVideos({
      videos: sampleVideos,
      q: '',
      channels: [['游戏', '']],
      tag: null,
    });
    expect(r.map((v) => v.bvid).sort()).toEqual(['BV1', 'BV2']);
  });

  it('filters by first + second channel (exact match)', () => {
    const r = filterVideos({
      videos: sampleVideos,
      q: '',
      channels: [['游戏', '单机游戏']],
      tag: null,
    });
    expect(r.map((v) => v.bvid)).toEqual(['BV1']);
  });

  it('filters by tag (ordinaryTags exact match)', () => {
    const r = filterVideos({
      videos: sampleVideos,
      q: '',
      channels: [],
      tag: '原神',
    });
    expect(r.map((v) => v.bvid)).toEqual(['BV1']);
  });

  it('combines keyword + channel + tag (AND logic)', () => {
    const r = filterVideos({
      videos: sampleVideos,
      q: '评测',
      channels: [['游戏', '']],
      tag: '原神',
    });
    expect(r.map((v) => v.bvid)).toEqual(['BV1']);
  });

  it('returns [] when no match', () => {
    const r = filterVideos({
      videos: sampleVideos,
      q: '不存在的关键词',
      channels: [],
      tag: null,
    });
    expect(r).toEqual([]);
  });

  it('handles empty q (whitespace only)', () => {
    const r = filterVideos({
      videos: sampleVideos,
      q: '   ',
      channels: [],
      tag: null,
    });
    expect(r).toHaveLength(3);
  });
});
