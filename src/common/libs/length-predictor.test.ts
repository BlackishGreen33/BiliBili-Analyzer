import { describe, expect, it } from 'vitest';

import {
  DURATION_BUCKETS,
  percentile,
  predictLength,
} from '@/common/libs/length-predictor';

describe('percentile', () => {
  it('returns 0 for empty input', () => {
    expect(percentile([], 0.5)).toBe(0);
  });

  it('returns the only value for single-element input', () => {
    expect(percentile([42], 0.25)).toBe(42);
    expect(percentile([42], 0.5)).toBe(42);
    expect(percentile([42], 0.75)).toBe(42);
  });

  it('returns the lower-half value for p=0.25 of 4 elements', () => {
    expect(percentile([1, 2, 3, 4], 0.25)).toBe(1.75);
  });

  it('returns the median for p=0.5', () => {
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
  });

  it('interpolates between two values when p falls between two indices', () => {
    // 5 elements: idx = 4 * 0.5 = 2 → 排序後的 3
    expect(percentile([10, 20, 30, 40, 50], 0.5)).toBe(30);
    // 2 elements: idx = 1 * 0.5 = 0.5 → lo=0 hi=1 → 插值
    expect(percentile([10, 20], 0.5)).toBe(15);
  });

  it('clamps p to [0, 1]', () => {
    expect(percentile([1, 2, 3], -0.5)).toBe(1);
    expect(percentile([1, 2, 3], 1.5)).toBe(3);
  });
});

describe('predictLength', () => {
  it('returns empty prediction when both scope and global are empty', () => {
    const p = predictLength({
      type: 'up',
      value: 'UP1',
      scopeSamples: [],
      globalSamples: [],
    });
    expect(p.primary).toBeNull();
    expect(p.medianSeconds).toBe(0);
    expect(p.confidence).toBe('low');
    expect(p.rationaleKey).toBe('length.rationale.notEnough');
    expect(p.sampleSize).toBe(0);
    // 7 buckets, all 0 count
    expect(p.distribution.length).toBe(7);
    expect(p.distribution.reduce((a, b) => a + b.count, 0)).toBe(0);
  });

  it('uses notEnough rationale + global fallback when scope < 5 and global has data', () => {
    const p = predictLength({
      type: 'up',
      value: 'UP1',
      scopeSamples: [300, 600],
      globalSamples: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    });
    expect(p.rationaleKey).toBe('length.rationale.notEnough');
    expect(p.confidence).toBe('low');
    expect(p.sampleSize).toBeGreaterThan(0);
    // median of global = 550
    expect(p.medianSeconds).toBe(550);
  });

  it('falls back to global when scope is 5-29 (rationale=globalFallback)', () => {
    const global = Array.from({ length: 100 }, (_, i) => 100 + i * 10); // 100..1090
    const p = predictLength({
      type: 'up',
      value: 'UP1',
      scopeSamples: [300, 400, 500, 600, 700, 800, 900, 1000], // 8 samples
      globalSamples: global,
    });
    expect(p.rationaleKey).toBe('length.rationale.globalFallback');
    expect(p.confidence).toBe('low');
    // median of global = ~595
    expect(p.medianSeconds).toBeGreaterThan(500);
    // 分布用 scope 算
    expect(p.distribution.find((b) => b.label === '5-10 分钟')!.count).toBe(3);
  });

  it('uses scope samples when scope >= 30 (mid confidence)', () => {
    // 30 samples around 300s
    const scope = Array.from({ length: 30 }, () => 300);
    const global = Array.from({ length: 200 }, (_, i) => 100 + i * 5);
    const p = predictLength({
      type: 'up',
      value: 'UP1',
      scopeSamples: scope,
      globalSamples: global,
    });
    expect(p.rationaleKey).toBe('length.rationale.scope');
    expect(p.confidence).toBe('mid');
    expect(p.medianSeconds).toBe(300);
    expect(p.p25).toBe(300);
    expect(p.p75).toBe(300);
  });

  it('upgrades to high confidence when scope >= 100', () => {
    const scope = Array.from({ length: 150 }, () => 450);
    const p = predictLength({
      type: 'up',
      value: 'UP1',
      scopeSamples: scope,
      globalSamples: [],
    });
    expect(p.confidence).toBe('high');
    expect(p.medianSeconds).toBe(450);
  });

  it('primary bucket equals max-share bucket (backward compat with v1)', () => {
    // 30 samples: 20 in 5-10 min (300-600), 5 in 3-5 min, 5 in 10-20 min
    const scope = [
      ...Array.from({ length: 20 }, () => 400),
      ...Array.from({ length: 5 }, () => 200),
      ...Array.from({ length: 5 }, () => 800),
    ];
    const p = predictLength({
      type: 'up',
      value: 'UP1',
      scopeSamples: scope,
      globalSamples: [],
    });
    expect(p.primary).not.toBeNull();
    expect(p.primary!.label).toBe('5-10 分钟');
    expect(p.primary!.share).toBeCloseTo(20 / 30, 2);
  });

  it('computes IQR correctly', () => {
    // 100 samples uniformly 0..99 → P25=24.75, P75=74.25
    const scope = Array.from({ length: 100 }, (_, i) => i);
    const p = predictLength({
      type: 'up',
      value: 'UP1',
      scopeSamples: scope,
      globalSamples: [],
    });
    expect(p.medianSeconds).toBe(49.5);
    expect(p.p25).toBeCloseTo(24.75, 2);
    expect(p.p75).toBeCloseTo(74.25, 2);
  });

  it('handles non-finite / negative samples by coercing to 0', () => {
    const scope = [
      300,
      NaN,
      -1,
      Infinity,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
      300,
    ] as number[];
    const p = predictLength({
      type: 'up',
      value: 'UP1',
      scopeSamples: scope,
      globalSamples: [],
    });
    // 27 valid (300) + 3 coerced to 0 (NaN/-1/Infinity) → 3 in <1 分钟, 27 in 5-10 分钟
    expect(p.distribution.find((b) => b.label === '<1 分钟')!.count).toBe(3);
    expect(p.distribution.find((b) => b.label === '5-10 分钟')!.count).toBe(27);
  });

  it('distribution has exactly 7 buckets matching DURATION_BUCKETS', () => {
    const p = predictLength({
      type: 'channel',
      value: '游戏',
      scopeSamples: [100, 200, 300, 400, 500],
      globalSamples: [100, 200, 300],
    });
    expect(p.distribution.length).toBe(7);
    for (let i = 0; i < 7; i++) {
      expect(p.distribution[i]!.label).toBe(DURATION_BUCKETS[i]!.label);
      expect(p.distribution[i]!.min).toBe(DURATION_BUCKETS[i]!.min);
      expect(p.distribution[i]!.max).toBe(DURATION_BUCKETS[i]!.max);
    }
  });
});
