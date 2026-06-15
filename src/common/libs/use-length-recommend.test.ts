/**
 * useLengthRecommend hook 測試
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useLengthRecommend } from '@/common/libs/use-length-recommend';
import { SwrTestWrapper } from '@/test/swr-test-wrapper';

const REAL_FETCH = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = REAL_FETCH;
  vi.restoreAllMocks();
});

const fakeData = {
  scope: { type: 'up' as const, value: 'UP1' },
  window: 30,
  primary: { label: '5-10 分钟', share: 0.5, count: 5 },
  distribution: [
    { label: '<1 分钟', min: 0, max: 60, share: 0, count: 0 },
    { label: '1-3 分钟', min: 60, max: 180, share: 0, count: 0 },
    { label: '3-5 分钟', min: 180, max: 300, share: 0, count: 0 },
    { label: '5-10 分钟', min: 300, max: 600, share: 1, count: 10 },
    { label: '10-20 分钟', min: 600, max: 1200, share: 0, count: 0 },
    { label: '20-30 分钟', min: 1200, max: 1800, share: 0, count: 0 },
    { label: '>30 分钟', min: 1800, max: Infinity, share: 0, count: 0 },
  ],
  sampleSize: 10,
  confidence: 'low' as const,
  medianSeconds: 450,
  p25: 300,
  p75: 600,
  rationaleKey: 'length.rationale.scope' as const,
};

describe('useLengthRecommend', () => {
  it('builds cache key with type/value/window', async () => {
    let requestedUrl = '';
    globalThis.fetch = vi.fn(async (url: unknown) => {
      requestedUrl = String(url);
      return new Response(JSON.stringify(fakeData));
    }) as unknown as typeof fetch;

    renderHook(() => useLengthRecommend('up', 'UP1', 30), {
      wrapper: SwrTestWrapper,
    });

    await waitFor(() => {
      expect(requestedUrl).toBe(
        '/api/length/recommend?type=up&value=UP1&window=30'
      );
    });
  });

  it('skips fetch when type is empty', async () => {
    let called = false;
    globalThis.fetch = vi.fn(async () => {
      called = true;
      return new Response('{}');
    }) as unknown as typeof fetch;

    renderHook(() => useLengthRecommend('' as 'up', 'UP1', 30), {
      wrapper: SwrTestWrapper,
    });

    await new Promise((r) => setTimeout(r, 100));
    expect(called).toBe(false);
  });

  it('skips fetch when value is empty', async () => {
    let called = false;
    globalThis.fetch = vi.fn(async () => {
      called = true;
      return new Response('{}');
    }) as unknown as typeof fetch;

    renderHook(() => useLengthRecommend('up', '', 30), {
      wrapper: SwrTestWrapper,
    });

    await new Promise((r) => setTimeout(r, 100));
    expect(called).toBe(false);
  });

  it('returns parsed data on success', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify(fakeData))
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useLengthRecommend('up', 'UP1', 7), {
      wrapper: SwrTestWrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    expect(result.current.data?.sampleSize).toBe(10);
    expect(result.current.data?.medianSeconds).toBe(450);
  });

  it('exposes error on 500 with fallback message when body is empty', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('', { status: 500 })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useLengthRecommend('up', 'UP2', 7), {
      wrapper: SwrTestWrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.error?.message).toBe('Request failed (500)');
  });
});
