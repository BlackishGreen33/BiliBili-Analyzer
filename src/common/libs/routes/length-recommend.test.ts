import { describe, expect, it } from 'vitest';

import {
  LENGTH_TYPES,
  matchVideo,
  parseLengthParams,
} from '@/common/libs/routes/length-recommend';

const makeUrl = (qs: string) => new URL(`http://localhost/?${qs}`);

const v = {
  UP: '某UP',
  mid: 42,
  tags: {
    firstChannel: '游戏',
    secondChannel: '',
    ordinaryTags: ['原神', '评测'],
  },
};

describe('LENGTH_TYPES', () => {
  it('exposes the 3 supported scope types', () => {
    expect(LENGTH_TYPES).toEqual(['up', 'channel', 'tag']);
  });
});

describe('matchVideo', () => {
  it('matches by UP name', () => {
    expect(matchVideo('up', '某UP', v)).toBe(true);
    expect(matchVideo('up', '其他人', v)).toBe(false);
  });

  it('matches by mid as string when name differs', () => {
    expect(matchVideo('up', '42', v)).toBe(true);
  });

  it('matches by firstChannel', () => {
    expect(matchVideo('channel', '游戏', v)).toBe(true);
    expect(matchVideo('channel', '知识', v)).toBe(false);
  });

  it('matches by ordinary tag', () => {
    expect(matchVideo('tag', '原神', v)).toBe(true);
    expect(matchVideo('tag', '不存在', v)).toBe(false);
  });

  it('returns false for unknown type', () => {
    expect(matchVideo('foo', 'x', v)).toBe(false);
  });
});

describe('parseLengthParams', () => {
  it('returns ok with parsed values', () => {
    const r = parseLengthParams(makeUrl('type=up&value=foo&window=30'));
    expect(r).toEqual({ ok: true, type: 'up', value: 'foo', window: 30 });
  });

  it('trims value before returning it', () => {
    const r = parseLengthParams(makeUrl('type=up&value=%20foo%20'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('foo');
  });

  it('returns 400 for invalid type', () => {
    const r = parseLengthParams(makeUrl('type=foo&value=bar'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it('returns 400 when value is missing', () => {
    const r = parseLengthParams(makeUrl('type=up&value='));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it('returns 400 when value is only whitespace', () => {
    const r = parseLengthParams(makeUrl('type=up&value=%20%20'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it('returns 400 when value is too long', () => {
    const r = parseLengthParams(makeUrl(`type=up&value=${'x'.repeat(121)}`));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it('caps window at 90', () => {
    const r = parseLengthParams(makeUrl('type=up&value=x&window=9999'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.window).toBe(90);
  });

  it('falls back to default window 30', () => {
    const r = parseLengthParams(makeUrl('type=up&value=x'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.window).toBe(30);
  });

  it('accepts all 3 types', () => {
    for (const t of LENGTH_TYPES) {
      const r = parseLengthParams(makeUrl(`type=${t}&value=foo`));
      expect(r.ok).toBe(true);
    }
  });
});
