import { describe, expect, it } from 'vitest';

import { pLimit } from '@/common/libs/routes/concurrency';

describe('pLimit', () => {
  it('returns results in order', async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await pLimit(items, 2, async (n) => n * 2);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it('respects concurrency limit', async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);
    await pLimit(items, 4, async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return null;
    });
    expect(maxActive).toBeLessThanOrEqual(4);
    expect(maxActive).toBeGreaterThan(1);
  });

  it('handles empty array', async () => {
    const results = await pLimit([], 4, async (n: number) => n);
    expect(results).toEqual([]);
  });

  it('caps concurrency to array length', async () => {
    const results = await pLimit([1, 2], 10, async (n) => n);
    expect(results).toEqual([1, 2]);
  });

  it('passes index to fn', async () => {
    const items = ['a', 'b', 'c'];
    const seen: Array<[string, number]> = [];
    await pLimit(items, 1, async (item, idx) => {
      seen.push([item, idx]);
      return null;
    });
    expect(seen).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
  });
});
