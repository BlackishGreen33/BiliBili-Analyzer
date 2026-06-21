import { describe, expect, it } from 'vitest';

import type { CrawlVideo } from '@/common/libs/result-data.server';
import {
  aggregateUpOverlap,
  buildUpMap,
  parseOverlapParams,
} from '@/common/libs/routes/up-overlap';

const makeUrl = (qs: string) => new URL(`http://localhost/?${qs}`);

const v = (over: Partial<CrawlVideo> = {}): CrawlVideo => ({
  bvid: 'BV1',
  url: '',
  title: 't',
  UP: 'UP1',
  mid: 1,
  views: 100,
  duration: 60,
  pubdate: 0,
  tags: { firstChannel: '游戏', secondChannel: '', ordinaryTags: [] },
  ...over,
});

describe('parseOverlapParams', () => {
  it('returns all defaults when query is empty', () => {
    const p = parseOverlapParams(makeUrl(''));
    expect(p).toEqual({ window: 30, minChannels: 2, minCount: 2, limit: 50 });
  });

  it('parses and clamps each param', () => {
    const p = parseOverlapParams(
      makeUrl('window=9999&minChannels=1&minCount=1&limit=999')
    );
    expect(p.window).toBe(90);
    expect(p.minChannels).toBe(2);
    expect(p.minCount).toBe(1);
    expect(p.limit).toBe(200);
  });

  it('caps minChannels and minCount at domain-specific maxima', () => {
    const p = parseOverlapParams(makeUrl('minChannels=999999&minCount=999999'));
    expect(p.minChannels).toBe(20);
    expect(p.minCount).toBe(1000);
  });

  it('falls back to defaults for non-numeric', () => {
    const p = parseOverlapParams(
      makeUrl('window=abc&minChannels=xyz&minCount=NaN&limit=oops')
    );
    expect(p.window).toBe(30);
    expect(p.minChannels).toBe(2);
    expect(p.minCount).toBe(2);
    expect(p.limit).toBe(50);
  });
});

describe('buildUpMap', () => {
  it('aggregates channels and counts per UP across days', () => {
    const upMap = buildUpMap([
      [
        v({
          UP: 'A',
          mid: 1,
          tags: { firstChannel: '游戏', secondChannel: '', ordinaryTags: [] },
        }),
      ],
      [
        v({
          UP: 'A',
          mid: 1,
          tags: { firstChannel: '知识', secondChannel: '', ordinaryTags: [] },
        }),
      ],
    ]);
    const acc = upMap.get('1');
    expect(acc).toBeDefined();
    expect(acc!.channelMap.size).toBe(2);
    expect(acc!.totalCount).toBe(2);
  });

  it('uses "未分类" when firstChannel missing', () => {
    const upMap = buildUpMap([
      [
        v({
          UP: 'B',
          mid: 2,
          tags: { firstChannel: '', secondChannel: '', ordinaryTags: [] },
        }),
      ],
    ]);
    expect(upMap.get('2')!.channelMap.get('未分类')).toBe(1);
  });

  it('skips videos with no name and no mid', () => {
    const upMap = buildUpMap([
      [
        v({
          UP: '',
          mid: undefined,
          tags: { firstChannel: '', secondChannel: '', ordinaryTags: [] },
        }),
      ],
    ]);
    expect(upMap.size).toBe(0);
  });

  it('uses name as key when mid is undefined', () => {
    const upMap = buildUpMap([
      [
        v({
          UP: 'NoMid',
          mid: undefined,
          tags: { firstChannel: 'a', secondChannel: '', ordinaryTags: [] },
        }),
      ],
    ]);
    expect(upMap.has('NoMid')).toBe(true);
  });

  it('treats non-finite views as 0', () => {
    const upMap = buildUpMap([
      [
        v({
          UP: 'X',
          mid: 1,
          views: Number.NaN,
          tags: { firstChannel: 'a', secondChannel: '', ordinaryTags: [] },
        }),
      ],
    ]);
    expect(upMap.get('1')!.views).toBe(0);
  });
});

describe('aggregateUpOverlap', () => {
  it('filters by minChannels and minCount', () => {
    const upMap = buildUpMap([
      // UP1: 2 channels, 2 counts → keep
      [
        v({
          UP: 'X',
          mid: 10,
          tags: { firstChannel: 'a', secondChannel: '', ordinaryTags: [] },
        }),
      ],
      [
        v({
          UP: 'X',
          mid: 10,
          tags: { firstChannel: 'b', secondChannel: '', ordinaryTags: [] },
        }),
      ],
      // UP2: 1 channel, 2 counts → drop (channelCount < 2)
      [
        v({
          UP: 'Y',
          mid: 20,
          tags: { firstChannel: 'a', secondChannel: '', ordinaryTags: [] },
        }),
      ],
      [
        v({
          UP: 'Y',
          mid: 20,
          tags: { firstChannel: 'a', secondChannel: '', ordinaryTags: [] },
        }),
      ],
    ]);
    const agg = aggregateUpOverlap(upMap, {
      minChannels: 2,
      minCount: 1,
      limit: 50,
    });
    expect(agg.items.length).toBe(1);
    expect(agg.items[0].name).toBe('X');
    expect(agg.totalUps).toBe(2);
  });

  it('sorts by channelCount desc, then totalCount desc, then views desc', () => {
    const upMap = buildUpMap([
      [
        v({
          UP: 'A',
          mid: 1,
          tags: { firstChannel: 'x', secondChannel: '', ordinaryTags: [] },
        }),
      ],
      [
        v({
          UP: 'A',
          mid: 1,
          tags: { firstChannel: 'y', secondChannel: '', ordinaryTags: [] },
        }),
      ],
      [
        v({
          UP: 'B',
          mid: 2,
          tags: { firstChannel: 'x', secondChannel: '', ordinaryTags: [] },
        }),
      ],
      [
        v({
          UP: 'B',
          mid: 2,
          tags: { firstChannel: 'y', secondChannel: '', ordinaryTags: [] },
        }),
      ],
      [
        v({
          UP: 'B',
          mid: 2,
          tags: { firstChannel: 'z', secondChannel: '', ordinaryTags: [] },
        }),
      ],
    ]);
    const agg = aggregateUpOverlap(upMap, {
      minChannels: 1,
      minCount: 1,
      limit: 50,
    });
    expect(agg.items[0].name).toBe('B');
    expect(agg.items[0].channelCount).toBe(3);
  });

  it('limits results to N', () => {
    const upMap = new Map();
    for (let i = 0; i < 5; i++) {
      upMap.set(String(i), {
        name: `UP${i}`,
        channelMap: new Map([
          ['a', 1],
          ['b', 1],
        ]),
        totalCount: 2,
        views: 0,
      });
    }
    const agg = aggregateUpOverlap(upMap, {
      minChannels: 1,
      minCount: 1,
      limit: 3,
    });
    expect(agg.items.length).toBe(3);
    expect(agg.totalUps).toBe(5);
  });

  it('drops entries failing minCount even with enough channels', () => {
    const upMap = new Map();
    upMap.set('1', {
      name: 'Solo',
      channelMap: new Map([
        ['a', 1],
        ['b', 1],
        ['c', 1],
      ]),
      totalCount: 1,
      views: 0,
    });
    const agg = aggregateUpOverlap(upMap, {
      minChannels: 2,
      minCount: 2,
      limit: 50,
    });
    expect(agg.items.length).toBe(0);
  });
});
