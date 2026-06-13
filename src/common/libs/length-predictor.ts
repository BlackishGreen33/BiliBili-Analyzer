/**
 * src/common/libs/length-predictor.ts
 *
 * Length prediction v2: from "mode bucket" → "median + IQR"
 *
 * 設計：
 *   - 純函數、無副作用；可被 server / client / test 同時用
 *   - 樣本 < 5 → low confidence, primary=null
 *   - 樣本 5-29 → low confidence, 用 global fallback
 *   - 樣本 30-99 → mid confidence, 用 scope 計算
 *   - 樣本 >= 100 → high confidence, 用 scope 計算
 *   - median = P50, IQR = [P25, P75]
 *
 * 為什麼這版不上 ML：
 *   - 30 天資料尚未累積，硬上 regression 會 overfit
 *   - `predictLength()` 簽名已預留：未來換內部實作為 trained model，
 *     對外介面（LengthPrediction）不變，UI 不用動
 */

export type LengthDistribution = {
  label: string;
  min: number;
  max: number;
  share: number;
  count: number;
};

export const DURATION_BUCKETS: ReadonlyArray<{
  label: string;
  min: number;
  max: number;
}> = [
  { label: '<1 分钟', min: 0, max: 60 },
  { label: '1-3 分钟', min: 60, max: 180 },
  { label: '3-5 分钟', min: 180, max: 300 },
  { label: '5-10 分钟', min: 300, max: 600 },
  { label: '10-20 分钟', min: 600, max: 1200 },
  { label: '20-30 分钟', min: 1200, max: 1800 },
  { label: '>30 分钟', min: 1800, max: Infinity },
];

export type LengthFeatures = {
  type: 'up' | 'channel' | 'tag';
  value: string;
  /** 同 scope 的歷史秒數樣本 */
  scopeSamples: number[];
  /** 全站 fallback 樣本（必要） */
  globalSamples: number[];
};

export type LengthPrediction = {
  distribution: LengthDistribution[];
  primary: { label: string; share: number; count: number } | null;
  medianSeconds: number;
  p25: number;
  p75: number;
  confidence: 'low' | 'mid' | 'high';
  /** 給 UI 顯示的解釋（key，配合 i18n） */
  rationaleKey:
    | 'length.rationale.notEnough'
    | 'length.rationale.globalFallback'
    | 'length.rationale.scope';
  sampleSize: number;
};

/** 給定已排序的樣本，回 p 分位（0 ≤ p ≤ 1） */
export function percentile(
  sortedSamples: ReadonlyArray<number>,
  p: number
): number {
  if (sortedSamples.length === 0) return 0;
  if (sortedSamples.length === 1) return sortedSamples[0]!;
  const clamped = Math.max(0, Math.min(1, p));
  const idx = (sortedSamples.length - 1) * clamped;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedSamples[lo]!;
  const frac = idx - lo;
  return sortedSamples[lo]! * (1 - frac) + sortedSamples[hi]! * frac;
}

function confidenceFor(scopeSize: number): 'low' | 'mid' | 'high' {
  if (scopeSize < 30) return 'low';
  if (scopeSize < 100) return 'mid';
  return 'high';
}

function bucketize(samples: ReadonlyArray<number>): LengthDistribution[] {
  const counts = DURATION_BUCKETS.map((b) => ({ ...b, count: 0 }));
  for (const d of samples) {
    const dur = Number.isFinite(d) && d >= 0 ? d : 0;
    const b = counts.find((b) => dur >= b.min && dur < b.max);
    if (b) b.count++;
  }
  const total = samples.length;
  return counts.map((b) => ({
    label: b.label,
    min: b.min,
    max: b.max,
    count: b.count,
    share: total > 0 ? b.count / total : 0,
  }));
}

function medianOf(samples: ReadonlyArray<number>): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

function quartilesOf(samples: ReadonlyArray<number>): {
  p25: number;
  p75: number;
} {
  if (samples.length === 0) return { p25: 0, p75: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  return { p25: percentile(sorted, 0.25), p75: percentile(sorted, 0.75) };
}

/**
 * 根據特徵 + 樣本，輸出長度預測
 */
export function predictLength(features: LengthFeatures): LengthPrediction {
  const { scopeSamples, globalSamples } = features;
  const empty = {
    distribution: bucketize([]),
    primary: null,
    medianSeconds: 0,
    p25: 0,
    p75: 0,
    confidence: 'low' as const,
    rationaleKey: 'length.rationale.notEnough' as const,
    sampleSize: 0,
  };

  if (scopeSamples.length === 0 && globalSamples.length === 0) {
    return empty;
  }

  if (scopeSamples.length < 5) {
    if (globalSamples.length === 0) {
      return empty;
    }
    const med = medianOf(globalSamples);
    const { p25, p75 } = quartilesOf(globalSamples);
    return {
      distribution: bucketize(globalSamples),
      primary: null,
      medianSeconds: med,
      p25,
      p75,
      confidence: 'low',
      rationaleKey: 'length.rationale.notEnough',
      sampleSize: globalSamples.length,
    };
  }

  const usingScope = scopeSamples.length >= 30;
  const samples = usingScope ? scopeSamples : globalSamples;
  const med = medianOf(samples);
  const { p25, p75 } = quartilesOf(samples);
  const distribution = bucketize(scopeSamples);
  const nonEmpty = distribution.filter((b) => b.count > 0);
  const primary =
    nonEmpty.length > 0
      ? nonEmpty.reduce((a, b) => (b.share > a.share ? b : a))
      : null;
  const conf = usingScope
    ? confidenceFor(scopeSamples.length)
    : ('low' as const);

  return {
    distribution,
    primary: primary
      ? { label: primary.label, share: primary.share, count: primary.count }
      : null,
    medianSeconds: med,
    p25,
    p75,
    confidence: conf,
    rationaleKey: usingScope
      ? 'length.rationale.scope'
      : 'length.rationale.globalFallback',
    sampleSize: scopeSamples.length,
  };
}
