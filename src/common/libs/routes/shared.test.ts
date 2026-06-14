import { describe, expect, it } from 'vitest';

import { parseIntInRange, parseWindowParam } from '@/common/libs/routes/shared';

const makeUrl = (qs: string) => new URL(`http://localhost/?${qs}`);

describe('parseWindowParam', () => {
  it('returns default when query is missing', () => {
    expect(parseWindowParam(makeUrl(''), 'window', { default: 30 })).toBe(30);
  });

  it('returns default when query is empty string', () => {
    expect(
      parseWindowParam(makeUrl('window='), 'window', { default: 30 })
    ).toBe(30);
  });

  it('returns default when query is not a finite number', () => {
    expect(
      parseWindowParam(makeUrl('window=abc'), 'window', { default: 30 })
    ).toBe(30);
  });

  it('returns default when query is zero or negative', () => {
    expect(
      parseWindowParam(makeUrl('window=0'), 'window', { default: 30 })
    ).toBe(30);
    expect(
      parseWindowParam(makeUrl('window=-5'), 'window', { default: 30 })
    ).toBe(30);
  });

  it('caps the value at max when it exceeds', () => {
    expect(
      parseWindowParam(makeUrl('window=9999'), 'window', {
        default: 30,
        max: 90,
      })
    ).toBe(90);
  });

  it('returns the raw value when it is in range', () => {
    expect(
      parseWindowParam(makeUrl('window=7'), 'window', { default: 30, max: 90 })
    ).toBe(7);
  });

  it('does not cap when max is 0 (caller opts out of clamping)', () => {
    expect(
      parseWindowParam(makeUrl('window=9999'), 'window', {
        default: 30,
        max: 0,
      })
    ).toBe(9999);
  });

  it('does not cap when max is undefined', () => {
    expect(
      parseWindowParam(makeUrl('window=9999'), 'window', { default: 30 })
    ).toBe(9999);
  });
});

describe('parseIntInRange', () => {
  it('falls back to default when missing / NaN / 0', () => {
    const opts = { default: 2, min: 2, max: 100 };
    expect(parseIntInRange(makeUrl(''), 'x', opts)).toBe(2);
    expect(parseIntInRange(makeUrl('x=abc'), 'x', opts)).toBe(2);
    expect(parseIntInRange(makeUrl('x=0'), 'x', opts)).toBe(2);
    expect(parseIntInRange(makeUrl('x=-3'), 'x', opts)).toBe(2);
  });

  it('clamps to min', () => {
    expect(
      parseIntInRange(makeUrl('x=1'), 'x', { default: 2, min: 2, max: 100 })
    ).toBe(2);
  });

  it('clamps to max', () => {
    expect(
      parseIntInRange(makeUrl('x=500'), 'x', { default: 2, min: 1, max: 200 })
    ).toBe(200);
  });

  it('returns the value when in range', () => {
    expect(
      parseIntInRange(makeUrl('x=50'), 'x', { default: 2, min: 1, max: 100 })
    ).toBe(50);
  });
});
