import { describe, expect, it } from 'vitest';

import { CrawlResultSchema, VideoDataSchema } from '@/common/types/schema';

const minimalVideo = {
  bvid: 'BV1wEEg62EDP',
  url: 'https://www.bilibili.com/video/BV1wEEg62EDP',
  cover: 'https://i0.hdslb.com/bfs/archive/abc.jpg',
  title: '原神 5.0 评测',
  UP: '某UP主',
  views: 100000,
  tags: {
    firstChannel: '游戏',
    secondChannel: '单机游戏',
    ordinaryTags: ['原神', '评测'],
  },
};

describe('VideoDataSchema', () => {
  it('accepts a minimal valid video', () => {
    const r = VideoDataSchema.safeParse(minimalVideo);
    expect(r.success).toBe(true);
  });

  it('rejects a non-BV bvid', () => {
    const r = VideoDataSchema.safeParse({ ...minimalVideo, bvid: 'XX123' });
    expect(r.success).toBe(false);
  });

  it('rejects negative views', () => {
    const r = VideoDataSchema.safeParse({ ...minimalVideo, views: -1 });
    expect(r.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const r = VideoDataSchema.safeParse({ bvid: 'BV1wEEg62EDP' });
    expect(r.success).toBe(false);
  });

  it('passes through unknown fields', () => {
    const r = VideoDataSchema.safeParse({
      ...minimalVideo,
      extraField: 'whatever',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data as Record<string, unknown>).extraField).toBe('whatever');
    }
  });

  it('accepts all optional stat fields', () => {
    const r = VideoDataSchema.safeParse({
      ...minimalVideo,
      statLike: 1000,
      statCoin: 50,
      statFavorite: 200,
      statShare: 10,
      statReply: 30,
      statDanmaku: 500,
    });
    expect(r.success).toBe(true);
  });

  it('rejects negative stat values', () => {
    const r = VideoDataSchema.safeParse({
      ...minimalVideo,
      statLike: -1,
    });
    expect(r.success).toBe(false);
  });
});

describe('CrawlResultSchema', () => {
  it('accepts a valid crawl result', () => {
    const r = CrawlResultSchema.safeParse({
      time: Date.now(),
      video: [minimalVideo, minimalVideo],
    });
    expect(r.success).toBe(true);
  });

  it('rejects non-positive time', () => {
    const r = CrawlResultSchema.safeParse({
      time: 0,
      video: [],
    });
    expect(r.success).toBe(false);
  });

  it('accepts empty video array', () => {
    const r = CrawlResultSchema.safeParse({
      time: Date.now(),
      video: [],
    });
    expect(r.success).toBe(true);
  });
});
