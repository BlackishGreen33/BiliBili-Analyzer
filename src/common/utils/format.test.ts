import { describe, expect, it } from 'vitest';

import {
  extractBvid,
  formatBytes,
  formatCompact,
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
  formatViews,
} from '@/common/utils/format';

describe('extractBvid', () => {
  it('extracts BV id from a full https URL', () => {
    expect(extractBvid('https://www.bilibili.com/video/BV1wEEg62EDP')).toBe(
      'BV1wEEg62EDP'
    );
  });

  it('extracts BV id from http URL', () => {
    expect(extractBvid('http://www.bilibili.com/video/BV1wEEg62EDP')).toBe(
      'BV1wEEg62EDP'
    );
  });

  it('extracts BV id from a /video/ path with query', () => {
    expect(
      extractBvid('https://www.bilibili.com/video/BV1wEEg62EDP?t=12.3')
    ).toBe('BV1wEEg62EDP');
  });

  it('returns null for a URL without a /video/ path', () => {
    expect(extractBvid('https://www.bilibili.com/')).toBeNull();
    expect(extractBvid('https://b23.tv/abc123')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(extractBvid('')).toBeNull();
  });

  it('lowercases the captured segment verbatim (no implicit casing)', () => {
    expect(extractBvid('https://www.bilibili.com/video/bv1weg62edp')).toBe(
      'bv1weg62edp'
    );
  });
});

describe('formatNumber', () => {
  it('formats with thousands separator', () => {
    expect(formatNumber(1234567)).toMatch(/1[,. ]234[,. ]567/);
  });
  it('handles non-finite input', () => {
    expect(formatNumber(NaN)).toBe('0');
    expect(formatNumber(Infinity)).toBe('0');
  });
});

describe('formatCompact', () => {
  it('formats small numbers as-is', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(999)).toBe('999');
  });

  it('formats 100K+ with 万 suffix (zh-CN locale)', () => {
    expect(formatCompact(100_000)).toBe('10万');
    expect(formatCompact(999_999)).toBe('100万');
  });

  it('formats 10M+ with 万 and one decimal', () => {
    expect(formatCompact(12_345_678)).toBe('1234.6万');
  });

  it('formats 1B+ with 亿 suffix', () => {
    expect(formatCompact(1_000_000_000)).toBe('10亿');
    expect(formatCompact(2_500_000_000)).toBe('25亿');
  });

  it('handles non-finite input', () => {
    expect(formatCompact(NaN)).toBe('0');
  });
});

describe('formatPercent', () => {
  it('formats a ratio as percent with default 2 digits', () => {
    expect(formatPercent(0.1234)).toBe('12.34%');
    expect(formatPercent(0.5)).toBe('50.00%');
  });

  it('respects custom digits', () => {
    expect(formatPercent(0.1234, 1)).toBe('12.3%');
    expect(formatPercent(0.1234, 0)).toBe('12%');
  });

  it('handles non-finite input', () => {
    expect(formatPercent(NaN)).toBe('0%');
  });
});

describe('formatViews', () => {
  it('formats 0', () => {
    expect(formatViews(0)).toBe('0');
  });

  it('formats small integers', () => {
    expect(formatViews(999)).toBe('999');
  });

  it('formats 10K+ as "X.X万" (Chinese unit)', () => {
    expect(formatViews(10000)).toBe('1万');
    expect(formatViews(12345)).toBe('1.2万');
    expect(formatViews(100000)).toBe('10万');
  });

  it('formats 100M+ as "X.X亿"', () => {
    expect(formatViews(100_000_000)).toBe('1亿');
    expect(formatViews(250_000_000)).toBe('2.5亿');
  });

  it('handles non-finite input', () => {
    expect(formatViews(NaN)).toBe('');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('formats minutes:seconds', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('formats hours:minutes:seconds', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('handles non-finite or negative input', () => {
    expect(formatDuration(NaN)).toBe('0:00');
    expect(formatDuration(-1)).toBe('0:00');
  });
});

describe('formatDateTime', () => {
  it('formats a unix ms timestamp to localized string (zh-CN)', () => {
    // 2025-01-15 00:00:00 UTC == 2025-01-15 08:00:00 UTC+8
    const ts = Date.UTC(2025, 0, 15, 0, 0, 0);
    const s = formatDateTime(ts);
    expect(s).toContain('2025');
    expect(s).toContain('08:00:00');
  });

  it('returns placeholder for non-positive input', () => {
    expect(formatDateTime(0)).toBe('—');
    expect(formatDateTime(-1)).toBe('—');
    expect(formatDateTime(NaN)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats date without time', () => {
    const ts = Date.UTC(2025, 0, 15, 12, 0, 0);
    const s = formatDate(ts);
    expect(s).toContain('2025');
    expect(s).not.toContain(':');
  });
  it('returns placeholder for non-positive input', () => {
    expect(formatDate(0)).toBe('—');
  });
});

describe('formatBytes', () => {
  it('formats 0', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats KB / MB / GB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  it('handles sub-KB as integer', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('handles non-finite or negative input', () => {
    expect(formatBytes(NaN)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
  });
});
