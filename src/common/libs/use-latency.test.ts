/**
 * useLatency hook 測試
 *
 * 驗證 SWR cache key + fetcher 行為 + 錯誤處理。
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useLatency } from '@/common/libs/use-latency';

const REAL_FETCH = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = REAL_FETCH;
  vi.restoreAllMocks();
});

describe('useLatency', () => {
  it('builds cache key with window param', async () => {
    let requestedUrl = '';
    globalThis.fetch = vi.fn(async (url: unknown) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          window: 30,
          total: 5,
          buckets: [],
          avgDays: 0,
          medianDays: 0,
        })
      );
    }) as unknown as typeof fetch;

    renderHook(() => useLatency(30));

    await waitFor(() => {
      expect(requestedUrl).toBe('/api/latency?window=30');
    });
  });

  it('returns parsed data on success', async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            window: 7,
            total: 5,
            buckets: [{ key: 'd0', count: 5 }],
            avgDays: 1.2,
            medianDays: 1,
          })
        )
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useLatency(7));

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    expect(result.current.data?.total).toBe(5);
    expect(result.current.error).toBeUndefined();
  });

  it('exposes error with response body when response is not ok', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('Internal Error', { status: 500 })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useLatency(60));

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    // fetcher 將 response body 寫入 Error message
    expect(result.current.error?.message).toBe('Internal Error');
  });

  it('uses fallback message when body is empty', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('', { status: 500 })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useLatency(61));

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.error?.message).toBe('Failed to load latency');
  });
});
