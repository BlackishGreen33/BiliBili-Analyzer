/**
 * useDashboard + useDashboardCompare hook 測試
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDashboard, useDashboardCompare } from '@/common/libs/use-dashboard';

const REAL_FETCH = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = REAL_FETCH;
  vi.restoreAllMocks();
});

const fakeDashboard = {
  file: '2026-01-15',
  time: 1700000000000,
  summary: {
    totalVideos: 100,
    totalUp: 50,
    totalViews: 1000000,
    totalLike: 5000,
    totalCoin: 500,
    totalFavorite: 1000,
    totalReply: 200,
    totalDanmaku: 2000,
    avgEngagement: 0.01,
  },
  channels: [],
  topUps: [],
  duration: [],
  hourHeatmap: [],
  topTags: [],
  topEngagement: [],
};

describe('useDashboard', () => {
  it('builds cache key with file param when filename provided', async () => {
    let requestedUrl = '';
    globalThis.fetch = vi.fn(async (url: unknown) => {
      requestedUrl = String(url);
      return new Response(JSON.stringify(fakeDashboard));
    }) as unknown as typeof fetch;

    renderHook(() => useDashboard('2026-01-15'));

    await waitFor(() => {
      expect(requestedUrl).toBe('/api/dashboard?file=2026-01-15');
    });
  });

  it('uses /api/dashboard without query when filename is null', async () => {
    let requestedUrl = '';
    globalThis.fetch = vi.fn(async (url: unknown) => {
      requestedUrl = String(url);
      return new Response(JSON.stringify(fakeDashboard));
    }) as unknown as typeof fetch;

    renderHook(() => useDashboard(null));

    await waitFor(() => {
      expect(requestedUrl).toBe('/api/dashboard');
    });
  });

  it('returns parsed dashboard data', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify(fakeDashboard))
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useDashboard('2026-01-15'));

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    expect(result.current.data?.summary.totalVideos).toBe(100);
  });

  it('exposes error on 500', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('boom', { status: 500 })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useDashboard('2026-01-99'));

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    // fetcher 不帶 body, 固定丟 'Failed to load dashboard'
    expect(result.current.error?.message).toBe('Failed to load dashboard');
  });
});

describe('useDashboardCompare', () => {
  it('builds cache key with a and b params', async () => {
    let requestedUrl = '';
    globalThis.fetch = vi.fn(async (url: unknown) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          a: fakeDashboard,
          b: fakeDashboard,
          diff: {
            newBvids: [],
            droppedBvids: [],
            persistentBvids: [],
            persistentCount: 0,
            totals: {
              totalVideos: 0,
              totalUp: 0,
              totalViews: 0,
              totalEngagement: 0,
              avgEngagement: 0,
            },
            totalsDelta: {
              totalVideos: 0,
              totalUp: 0,
              totalViews: 0,
              totalEngagement: 0,
              avgEngagement: 0,
            },
            channelShift: [],
            upShift: [],
            tagShift: { newTags: [], droppedTags: [], commonTags: 0 },
          },
        })
      );
    }) as unknown as typeof fetch;

    renderHook(() => useDashboardCompare('2026-01-14', '2026-01-15'));

    await waitFor(() => {
      expect(requestedUrl).toBe(
        '/api/dashboard/compare?a=2026-01-14&b=2026-01-15'
      );
    });
  });

  it('skips fetch when a is null', async () => {
    let called = false;
    globalThis.fetch = vi.fn(async () => {
      called = true;
      return new Response('{}');
    }) as unknown as typeof fetch;

    renderHook(() => useDashboardCompare(null, '2026-01-15'));

    await new Promise((r) => setTimeout(r, 100));
    expect(called).toBe(false);
  });

  it('skips fetch when a equals b', async () => {
    let called = false;
    globalThis.fetch = vi.fn(async () => {
      called = true;
      return new Response('{}');
    }) as unknown as typeof fetch;

    renderHook(() => useDashboardCompare('2026-01-15', '2026-01-15'));

    await new Promise((r) => setTimeout(r, 100));
    expect(called).toBe(false);
  });

  it('skips fetch when b is null', async () => {
    let called = false;
    globalThis.fetch = vi.fn(async () => {
      called = true;
      return new Response('{}');
    }) as unknown as typeof fetch;

    renderHook(() => useDashboardCompare('2026-01-14', null));

    await new Promise((r) => setTimeout(r, 100));
    expect(called).toBe(false);
  });
});
