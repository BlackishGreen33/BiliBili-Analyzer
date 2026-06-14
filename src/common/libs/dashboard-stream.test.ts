/**
 * dashboard-stream 測試
 *
 * 測試 useLatencyStream / useDashboardTrendStream 的漸進渲染邏輯：
 *   - meta 先到 → buckets 逐步累積 → done 收尾
 *   - unmount 時 abort 觸發
 *   - fetch 失敗時 error 設置
 *   - 輔助函式 applyXxxEvent / latencyStreamToData / trendStreamToData
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type LatencyStreamState,
  latencyStreamToData,
  trendStreamToData,
  useDashboardTrendStream,
  useLatencyStream,
} from '@/common/libs/dashboard-stream';

function ndjsonResponse(
  chunks: string[],
  init: { status?: number; ok?: boolean; signal?: AbortSignal } = {}
): Response {
  const { status = 200, ok = true, signal } = init;
  const encoder = new TextEncoder();
  let cancelled = false;
  signal?.addEventListener('abort', () => {
    cancelled = true;
  });
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (const c of chunks) {
        if (cancelled) {
          controller.error(new DOMException('Aborted', 'AbortError'));
          return;
        }
        controller.enqueue(encoder.encode(c));
        // 讓出 microtask 模擬網路分段
        await new Promise((r) => setTimeout(r, 0));
      }
      controller.close();
    },
  });
  return new Response(stream, { status, ok: status >= 200 && status < 300 });
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('useLatencyStream', () => {
  it('progressively accumulates buckets then completes', async () => {
    globalThis.fetch = vi.fn(async () =>
      ndjsonResponse([
        '{"type":"meta","window":30,"total":42}\n',
        '{"type":"chunk","data":{"key":"d0","count":10}}\n',
        '{"type":"chunk","data":{"key":"d1","count":12}}\n',
        '{"type":"done","avgDays":1.5,"medianDays":1}\n',
      ])
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useLatencyStream(30));

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    });

    expect(result.current.meta).toEqual({ window: 30, total: 42 });
    expect(result.current.buckets).toEqual([
      { key: 'd0', count: 10 },
      { key: 'd1', count: 12 },
    ]);
    expect(result.current.avgDays).toBe(1.5);
    expect(result.current.medianDays).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('captures fetch errors in state.error', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response('Internal Error', { status: 500, ok: false });
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useLatencyStream(30));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.error?.message).toContain('500');
    expect(result.current.isComplete).toBe(true);
  });

  it('aborts the in-flight fetch on unmount', async () => {
    let aborted = false;
    globalThis.fetch = vi.fn(
      async (_url: string, init: RequestInit | undefined) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal) {
          signal.addEventListener('abort', () => {
            aborted = true;
          });
        }
        // 回傳一個永不結束的 stream
        return new Response(
          new ReadableStream({
            start(controller) {
              // 不關閉,讓它等 abort
              signal?.addEventListener('abort', () => {
                controller.error(new DOMException('Aborted', 'AbortError'));
              });
            },
          }),
          { status: 200 }
        );
      }
    ) as unknown as typeof fetch;

    const { unmount } = renderHook(() => useLatencyStream(30));
    unmount();
    expect(aborted).toBe(true);
  });
});

describe('useDashboardTrendStream', () => {
  it('progressively accumulates points then completes', async () => {
    globalThis.fetch = vi.fn(async () =>
      ndjsonResponse([
        '{"type":"meta","window":7,"isMock":true,"realCount":2}\n',
        '{"type":"chunk","data":{"file":"2026-01-14","date":"2026-01-14","totalVideos":50,"totalUp":20,"totalViews":100000,"totalEngagement":1000,"avgEngagement":0.02,"avgViews":2000,"duration":[]}}\n',
        '{"type":"chunk","data":{"file":"2026-01-15","date":"2026-01-15","totalVideos":60,"totalUp":25,"totalViews":120000,"totalEngagement":1200,"avgEngagement":0.022,"avgViews":2200,"duration":[]}}\n',
        '{"type":"done","pointCount":2}\n',
      ])
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useDashboardTrendStream(7));

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    });

    expect(result.current.meta).toEqual({
      window: 7,
      isMock: true,
      realCount: 2,
    });
    expect(result.current.points).toHaveLength(2);
    expect(result.current.points[0].file).toBe('2026-01-14');
    expect(result.current.points[1].file).toBe('2026-01-15');
    expect(result.current.error).toBeNull();
  });

  it('captures fetch errors in state.error', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response('Internal Error', { status: 500, ok: false });
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useDashboardTrendStream(30));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
  });
});

describe('latencyStreamToData', () => {
  it('returns null when meta is missing', () => {
    const empty: LatencyStreamState = {
      meta: null,
      buckets: [],
      isComplete: false,
      avgDays: 0,
      medianDays: 0,
      error: null,
    };
    expect(latencyStreamToData(empty)).toBeNull();
  });

  it('converts stream state to LatencyData shape', () => {
    const state: LatencyStreamState = {
      meta: { window: 30, total: 42 },
      buckets: [
        { key: 'd0', count: 10 },
        { key: 'd1', count: 12 },
      ],
      isComplete: true,
      avgDays: 1.5,
      medianDays: 1,
      error: null,
    };
    expect(latencyStreamToData(state)).toEqual({
      window: 30,
      total: 42,
      buckets: [
        { key: 'd0', count: 10 },
        { key: 'd1', count: 12 },
      ],
      avgDays: 1.5,
      medianDays: 1,
    });
  });
});

describe('trendStreamToData', () => {
  it('returns null when meta is missing', () => {
    expect(
      trendStreamToData({
        meta: null,
        points: [],
        isComplete: false,
        error: null,
      })
    ).toBeNull();
  });

  it('converts stream state to TrendData shape', () => {
    const state = {
      meta: { window: 7, isMock: false, realCount: 7 },
      points: [
        {
          file: '2026-01-15',
          date: '2026-01-15',
          totalVideos: 60,
          totalUp: 25,
          totalViews: 120000,
          totalEngagement: 1200,
          avgEngagement: 0.022,
          avgViews: 2200,
          duration: [],
        },
      ],
      isComplete: true,
      error: null,
    };
    expect(trendStreamToData(state)).toEqual({
      window: 7,
      isMock: false,
      realCount: 7,
      points: [
        {
          file: '2026-01-15',
          date: '2026-01-15',
          totalVideos: 60,
          totalUp: 25,
          totalViews: 120000,
          totalEngagement: 1200,
          avgEngagement: 0.022,
          avgViews: 2200,
          duration: [],
        },
      ],
    });
  });
});
