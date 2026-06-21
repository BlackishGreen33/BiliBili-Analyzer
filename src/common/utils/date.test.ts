import { describe, expect, it } from 'vitest';

import { dateStringUTC8, hourUTC8FromUnixSeconds } from '@/common/utils/date';

describe('date UTC+8 helpers', () => {
  it('formats epoch milliseconds as a UTC+8 date string', () => {
    expect(dateStringUTC8(Date.UTC(2025, 0, 1, 16, 0, 0))).toBe('2025-01-02');
  });

  it('returns the UTC+8 hour for unix seconds', () => {
    expect(hourUTC8FromUnixSeconds(Date.UTC(2025, 0, 1, 16, 0, 0) / 1000)).toBe(
      0
    );
  });
});
