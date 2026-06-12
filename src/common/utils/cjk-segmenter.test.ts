import { describe, expect, it } from 'vitest';

import {
  isCjkChar,
  isLatinOrDigitChar,
  isMeaningfulToken,
  isStopword,
  ngrams,
  segmentTitles,
  tokenizeText,
} from '@/common/utils/cjk-segmenter';

describe('isCjkChar', () => {
  it('returns true for CJK ideographs', () => {
    expect(isCjkChar('中')).toBe(true);
    expect(isCjkChar('文')).toBe(true);
  });
  it('returns false for non-CJK', () => {
    expect(isCjkChar('a')).toBe(false);
    expect(isCjkChar('1')).toBe(false);
    expect(isCjkChar(' ')).toBe(false);
  });
});

describe('isLatinOrDigitChar', () => {
  it('returns true for ASCII letters and digits', () => {
    expect(isLatinOrDigitChar('a')).toBe(true);
    expect(isLatinOrDigitChar('Z')).toBe(true);
    expect(isLatinOrDigitChar('0')).toBe(true);
  });
  it('returns false for others', () => {
    expect(isLatinOrDigitChar('中')).toBe(false);
    expect(isLatinOrDigitChar(' ')).toBe(false);
  });
});

describe('isStopword', () => {
  it('detects common Chinese stopwords', () => {
    expect(isStopword('的')).toBe(true);
    expect(isStopword('了')).toBe(true);
    expect(isStopword('是')).toBe(true);
  });
  it('detects common English stopwords (case-insensitive)', () => {
    expect(isStopword('the')).toBe(true);
    expect(isStopword('THE')).toBe(true);
    expect(isStopword('a')).toBe(true);
  });
  it('returns false for meaningful words', () => {
    expect(isStopword('视频')).toBe(false);
    expect(isStopword('Genshin')).toBe(false);
  });
  it('treats empty string as stopword', () => {
    expect(isStopword('')).toBe(true);
  });
});

describe('isMeaningfulToken', () => {
  it('rejects single-character tokens', () => {
    expect(isMeaningfulToken('中')).toBe(false);
  });
  it('rejects stopwords', () => {
    expect(isMeaningfulToken('的')).toBe(false);
  });
  it('accepts multi-char meaningful tokens', () => {
    expect(isMeaningfulToken('视频')).toBe(true);
    expect(isMeaningfulToken('原神')).toBe(true);
  });
});

describe('tokenizeText', () => {
  it('tokenizes a Chinese sentence into characters + multi-char words', () => {
    const tokens = tokenizeText('原神是一款游戏');
    expect(tokens.length).toBeGreaterThan(0);
    // 至少應包含「游戏」（Node Intl.Segmenter 唯一能切出的中文詞）
    expect(tokens).toContain('游戏');
  });
  it('handles empty input', () => {
    expect(tokenizeText('')).toEqual([]);
  });
  it('handles English + Chinese mixed', () => {
    const tokens = tokenizeText('Genshin 原神 5.0 评测');
    expect(tokens).toContain('Genshin');
    // 5.0 也應該被切出來（單獨的數字 token）
    expect(tokens).toContain('5.0');
  });
});

describe('ngrams', () => {
  it('produces 2-grams and 3-grams from CJK tokens', () => {
    const grams = ngrams(['原', '神', '评', '测', '视', '频', '解', '说']);
    // 應該有 原神, 神评, 评測, 測視, 视频 等
    expect(grams).toContain('原神');
    expect(grams).toContain('视频');
  });
  it('respects minN and maxN', () => {
    const grams = ngrams(['a', 'b', 'c', 'd'], 3, 3);
    // 因為 a/b/c/d 是純拉丁，會被過濾掉
    expect(grams).toEqual([]);
  });
  it('skips all-Latin n-grams (no CJK content)', () => {
    const grams = ngrams(['Hello', 'World', 'Test'], 2, 3);
    expect(grams).toEqual([]);
  });
  it('handles empty input', () => {
    expect(ngrams([])).toEqual([]);
  });
});

describe('segmentTitles', () => {
  it('returns top N tokens by count, with CJK 2-grams forming meaningful words', () => {
    const titles = ['原神评测', '原神解说', '原神视频', '明日方舟攻略'];
    const tokens = segmentTitles(titles, { topN: 10 });
    expect(tokens.length).toBeGreaterThan(0);
    // 應該出現 原神 這個 2-gram
    const yuanshen = tokens.find((t) => t.word === '原神');
    expect(yuanshen).toBeDefined();
    expect(yuanshen?.count).toBe(3);
  });

  it('sorts by count descending', () => {
    const titles = ['A 原神 B', 'A 原神', 'A', 'X Y Z'];
    const tokens = segmentTitles(titles, { topN: 20 });
    for (let i = 1; i < tokens.length; i++) {
      expect(tokens[i - 1].count).toBeGreaterThanOrEqual(tokens[i].count);
    }
  });

  it('filters out single chars and stopwords', () => {
    const titles = ['的视频的视频', '的视频'];
    const tokens = segmentTitles(titles, { topN: 20 });
    for (const t of tokens) {
      expect(t.word.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('handles empty input', () => {
    expect(segmentTitles([])).toEqual([]);
  });

  it('respects topN', () => {
    const titles = Array.from({ length: 5 }, (_, i) => `原神 ${i} 视频 解说`);
    const tokens = segmentTitles(titles, { topN: 3 });
    expect(tokens.length).toBeLessThanOrEqual(3);
  });
});
