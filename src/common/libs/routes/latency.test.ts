import { describe, expect, it } from 'vitest';

import {
  BUCKET_ORDER,
  bucketFor,
  computeLatencyStats,
  type LatencyPayload,
  payloadToEvents,
} from '@/common/libs/routes/latency';

describe('bucketFor', () => {
  it('returns d0 for non-positive days', () => {
    expect(bucketFor(0)).toBe('d0');
    expect(bucketFor(-1)).toBe('d0');
  });

  it.each([
    [1, 'd1'],
    [2, 'd2'],
    [3, 'd3'],
    [4, 'd4'],
    [5, 'd5'],
    [6, 'd6to7'],
    [7, 'd6to7'],
    [8, 'd8to14'],
    [14, 'd8to14'],
    [15, 'd15to30'],
    [30, 'd15to30'],
    [31, 'd30plus'],
  ])('maps day %i to %s', (day, key) => {
    expect(bucketFor(day)).toBe(key);
  });
});

describe('computeLatencyStats', () => {
  it('returns zeros for empty array', () => {
    expect(computeLatencyStats([])).toEqual({
      total: 0,
      avgDays: 0,
      medianDays: 0,
    });
  });

  it('uses sorted median for odd-length arrays', () => {
    const stats = computeLatencyStats([3, 1, 2]);
    expect(stats.total).toBe(3);
    expect(stats.medianDays).toBe(2);
    expect(stats.avgDays).toBe(2);
  });

  it('averages two middles for even-length arrays', () => {
    const stats = computeLatencyStats([4, 1, 2, 3]);
    expect(stats.total).toBe(4);
    expect(stats.medianDays).toBe(2.5);
  });

  it('does not mutate the input array', () => {
    const arr = [3, 1, 2];
    const ref = [...arr];
    computeLatencyStats(arr);
    expect(arr).toEqual(ref);
  });
});

describe('latency payloadToEvents', () => {
  const payload: LatencyPayload = {
    window: 30,
    total: 3,
    buckets: BUCKET_ORDER.map((k) => ({
      key: k,
      count: k === 'd1' ? 2 : k === 'd3' ? 1 : 0,
    })),
    avgDays: 1.5,
    medianDays: 1,
  };

  it('emits meta + 10 chunks + done in order', () => {
    const events = payloadToEvents(payload);
    expect(events[0]).toEqual({ type: 'meta', window: 30, total: 3 });
    expect(events[1]).toEqual({
      type: 'chunk',
      data: { key: 'd0', count: 0 },
    });
    expect(events[events.length - 1]).toEqual({
      type: 'done',
      avgDays: 1.5,
      medianDays: 1,
    });
    expect(events.length).toBe(12);
  });
});
