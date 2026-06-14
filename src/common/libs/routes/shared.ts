/**
 * src/common/libs/routes/shared.ts
 *
 * 給 6 個 analytics route 共用的純函數：
 * - `parseWindowParam` 統一 4 處的 `parseInt ?? DEFAULT` + cap 鏈
 * - `parseIntInRange` 同上但帶 min / max 雙向裁剪（up-overlap 專用）
 */

export type WindowParseOpts = {
  default: number;
  /** 上限（>0 才生效），<=0 表示不裁 */
  max?: number;
};

/**
 * 從 URL 解析帶預設 + 上限的整數參數。
 *
 * 規則：
 * - null / 空字串 / 非數字 → 走 default
 * - 0 / 負數 → 走 default（window 至少 1）
 * - 超過 max → cap 在 max
 * - 合法正整數 → 原值
 */
export function parseWindowParam(
  url: URL,
  key: string,
  opts: WindowParseOpts
): number {
  const raw = parseInt(url.searchParams.get(key) ?? '', 10);
  if (!Number.isFinite(raw) || raw <= 0) return opts.default;
  return opts.max && opts.max > 0 ? Math.min(opts.max, raw) : raw;
}

export type IntRangeOpts = {
  default: number;
  min: number;
  max: number;
};

/**
 * 雙向裁剪的整數參數：min / max 邊界都夾。
 * 用於 up-overlap 的 minChannels / minCount / limit。
 */
export function parseIntInRange(
  url: URL,
  key: string,
  opts: IntRangeOpts
): number {
  const raw = parseInt(url.searchParams.get(key) ?? '', 10);
  const v = Number.isFinite(raw) && raw > 0 ? raw : opts.default;
  return Math.max(opts.min, Math.min(opts.max, v));
}
