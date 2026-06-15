/**
 * useUpOverlap hook 測試
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUpOverlap } from '@/common/libs/use-up-overlap';
import { SwrTestWrapper } from '@/test/swr-test-wrapper';

const REAL_FETCH = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = REAL_FETCH;
  vi.restoreAllMocks();
});

describe('useUpOverlap', () => {
  it('builds cache key with window/minChannels/minCount params', async () => {
    let requestedUrl = '';
    globalThis.fetch = vi.fn(async (url: unknown) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          window: 7,
          minChannels: 2,
          minCount: 2,
          totalUps: 0,
          items: [],
        })
      );
    }) as unknown as typeof fetch;

    renderHook(() => useUpOverlap(7, 2, 2), { wrapper: SwrTestWrapper });

    await waitFor(() => {
      expect(requestedUrl).toBe(
        '/api/up/overlap?window=7&minChannels=2&minCount=2'
      );
    });
  });

  it('uses default minChannels=2, minCount=2 when not provided', async () => {
    let requestedUrl = '';
    globalThis.fetch = vi.fn(async (url: unknown) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          window: 14,
          minChannels: 2,
          minCount: 2,
          totalUps: 0,
          items: [],
        })
      );
    }) as unknown as typeof fetch;

    renderHook(() => useUpOverlap(14), { wrapper: SwrTestWrapper });

    await waitFor(() => {
      expect(requestedUrl).toBe(
        '/api/up/overlap?window=14&minChannels=2&minCount=2'
      );
    });
  });

  it('returns parsed overlap items', async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            window: 30,
            minChannels: 2,
            minCount: 2,
            totalUps: 1,
            items: [
              {
                name: '某UP',
                mid: 100,
                channelCount: 3,
                totalCount: 5,
                views: 10000,
                channels: [{ firstChannel: '游戏', count: 3 }],
              },
            ],
          })
        )
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useUpOverlap(30), {
      wrapper: SwrTestWrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0]?.channelCount).toBe(3);
  });

  it('exposes error on 500', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('Server down', { status: 500 })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useUpOverlap(60), {
      wrapper: SwrTestWrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.error?.message).toBe('Server down');
  });
});
