/**
 * i18n shape consistency test
 *
 * 確保三語言檔 (zh-CN / zh-TW / en) 的 key 集合完全一致，
 * 並且 string 欄位都非空（除了明確豁免）。
 */

import { describe, expect, it } from 'vitest';

import en from '@/common/i18n/dictionaries/en';
import zhCN from '@/common/i18n/dictionaries/zh-CN';
import zhTW from '@/common/i18n/dictionaries/zh-TW';

/** 明確豁免：可為空字串的 key（含參數模板也算「非空」） */
const ALLOWED_EMPTY: ReadonlyArray<string> = [];

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== 'object') return [prefix];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenKeys(v, next));
    } else {
      out.push(next);
    }
  }
  return out;
}

function getNested(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

describe('i18n dictionary shape', () => {
  it('zh-CN, zh-TW and en have the same set of leaf keys', () => {
    const keysCN = new Set(flattenKeys(zhCN).sort());
    const keysTW = new Set(flattenKeys(zhTW).sort());
    const keysEN = new Set(flattenKeys(en).sort());

    const missingInTW = [...keysCN].filter((k) => !keysTW.has(k));
    const missingInCN = [...keysTW].filter((k) => !keysCN.has(k));
    const missingInEN = [...keysCN].filter((k) => !keysEN.has(k));
    const extraInEN = [...keysEN].filter((k) => !keysCN.has(k));

    expect({ missingInTW, missingInCN, missingInEN, extraInEN }).toEqual({
      missingInTW: [],
      missingInCN: [],
      missingInEN: [],
      extraInEN: [],
    });
  });

  it('every leaf in zh-CN has a non-empty string value (whitelisted keys excepted)', () => {
    for (const key of flattenKeys(zhCN)) {
      if (ALLOWED_EMPTY.includes(key)) continue;
      const v = getNested(zhCN, key);
      expect(typeof v, `${key} should be a string`).toBe('string');
      expect(v, `${key} should not be empty in zh-CN`).not.toBe('');
    }
  });

  it('every leaf in zh-TW has a non-empty string value (whitelisted keys excepted)', () => {
    for (const key of flattenKeys(zhTW)) {
      if (ALLOWED_EMPTY.includes(key)) continue;
      const v = getNested(zhTW, key);
      expect(typeof v, `${key} should be a string`).toBe('string');
      expect(v, `${key} should not be empty in zh-TW`).not.toBe('');
    }
  });

  it('every leaf in en has a non-empty string value (whitelisted keys excepted)', () => {
    for (const key of flattenKeys(en)) {
      if (ALLOWED_EMPTY.includes(key)) continue;
      const v = getNested(en, key);
      expect(typeof v, `${key} should be a string`).toBe('string');
      expect(v, `${key} should not be empty in en`).not.toBe('');
    }
  });

  it('common.year/month/day are filled in all three languages', () => {
    expect(getNested(en, 'common.year')).toBe('Year');
    expect(getNested(en, 'common.month')).toBe('Month');
    expect(getNested(en, 'common.day')).toBe('Day');
    expect(getNested(zhCN, 'common.year')).toBe('年');
    expect(getNested(zhCN, 'common.month')).toBe('月');
    expect(getNested(zhCN, 'common.day')).toBe('日');
    expect(getNested(zhTW, 'common.year')).toBe('年');
    expect(getNested(zhTW, 'common.month')).toBe('月');
    expect(getNested(zhTW, 'common.day')).toBe('日');
  });

  it('compare.countUnit is a parameterized template in all three languages', () => {
    expect(getNested(en, 'compare.countUnit')).toBe('{count} tags');
    expect(getNested(zhCN, 'compare.countUnit')).toBe('{count} 个');
    expect(getNested(zhTW, 'compare.countUnit')).toBe('{count} 個');
  });

  it('compare.countLabel is a parameterized template in all three languages', () => {
    expect(getNested(en, 'compare.countLabel')).toBe('{count} listings');
    expect(getNested(zhCN, 'compare.countLabel')).toBe('{count} 次');
    expect(getNested(zhTW, 'compare.countLabel')).toBe('{count} 次');
  });

  it('dashboard.chart.hourSuffix is a parameterized template in all three languages', () => {
    expect(getNested(en, 'dashboard.chart.hourSuffix')).toBe('{h}h');
    expect(getNested(zhCN, 'dashboard.chart.hourSuffix')).toBe('{h} 时');
    expect(getNested(zhTW, 'dashboard.chart.hourSuffix')).toBe('{h} 時');
  });
});
