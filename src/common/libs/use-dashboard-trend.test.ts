/**
 * useDashboardTrend hook 測試
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDashboardTrend } from '@/common/libs/use-dashboard-trend';
import { SwrTestWrapper } from '@/test/swr-test-wrapper';

const REAL_FETCH = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = REAL_FETCH;
  vi.restoreAllMocks();
});

describe('useDashboardTrend', () => {
  it('builds cache key with window param', async () => {
    let requestedUrl = '';
    globalThis.fetch = vi.fn(async (url: unknown) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          window: 7,
          isMock: false,
          realCount: 7,
          points: [],
        })
      );
    }) as unknown as typeof fetch;

    renderHook(() => useDashboardTrend(7), { wrapper: SwrTestWrapper });

    await waitFor(() => {
      expect(requestedUrl).toBe('/api/dashboard/trend?window=7');
    });
  });

  it('returns parsed trend points', async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            window: 14,
            isMock: true,
            realCount: 3,
            points: [
              {
                file: '2026-01-15',
                date: '2026-01-15',
                totalVideos: 50,
                totalUp: 20,
                totalViews: 100000,
                totalEngagement: 1000,
                avgEngagement: 0.02,
                avgViews: 2000,
                duration: [],
              },
            ],
          })
        )
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useDashboardTrend(14), {
      wrapper: SwrTestWrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    expect(result.current.data?.isMock).toBe(true);
    expect(result.current.data?.points).toHaveLength(1);
    expect(result.current.data?.points[0]?.totalVideos).toBe(50);
  });

  it('exposes error on 500 with fallback message when body is empty', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('', { status: 500 })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useDashboardTrend(21), {
      wrapper: SwrTestWrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.error?.message).toBe('Request failed (500)');
  });
});
