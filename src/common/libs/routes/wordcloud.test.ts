import { describe, expect, it } from 'vitest';

import { buildWordCloudPayload } from '@/common/libs/routes/wordcloud';

describe('buildWordCloudPayload', () => {
  it('returns empty tokens for empty input', () => {
    const p = buildWordCloudPayload('2025-01-15', []);
    expect(p).toEqual({ file: '2025-01-15', tokens: [] });
  });

  it('filters empty titles and segments remaining', () => {
    const p = buildWordCloudPayload('f', [
      { title: '原神 5.0 评测' },
      { title: '' },
      { title: '原神 4.0 复刻' },
    ]);
    expect(p.file).toBe('f');
    expect(p.tokens.length).toBeGreaterThan(0);
  });

  it('respects topN option', () => {
    const p = buildWordCloudPayload('f', [{ title: '原神 评测 复刻 内容' }], 2);
    expect(p.tokens.length).toBeLessThanOrEqual(2);
  });
});
