/**
 * useWordCloud hook 測試
 *
 * 該 hook 使用 useSWR(key, options) 從全域 SWRConfig 抓 fetcher。
 * 這裡直接 vi.mock 替換 swr 模組, 驗證 hook 傳入的 key 與 options。
 */

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWordCloud } from '@/common/libs/use-wordcloud';

const mockUseSWR = vi.fn();

vi.mock('swr', async () => {
  const actual = await vi.importActual<typeof import('swr')>('swr');
  return {
    ...actual,
    default: (key: unknown, opts: unknown) => mockUseSWR(key, opts),
  };
});

afterEach(() => {
  mockUseSWR.mockReset();
});

describe('useWordCloud', () => {
  it('fetches /api/wordcloud with fixed URL', () => {
    mockUseSWR.mockReturnValue({
      data: {
        file: '2026-01-15',
        tokens: [{ word: '原神', count: 5 }],
      },
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useWordCloud());

    // 驗證 useSWR 用 /api/wordcloud 作為 cache key（fetcher 來自 SWRConfig）
    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/wordcloud',
      expect.objectContaining({ dedupingInterval: 60_000 })
    );
    expect(result.current.data?.file).toBe('2026-01-15');
    expect(result.current.data?.tokens).toHaveLength(1);
  });

  it('exposes error when SWR returns error', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('boom'),
      isLoading: false,
    });

    const { result } = renderHook(() => useWordCloud());

    expect(result.current.error?.message).toBe('boom');
    expect(result.current.data).toBeUndefined();
  });

  it('uses 60s dedupingInterval (slower refresh than dashboard hooks)', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    renderHook(() => useWordCloud());

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/wordcloud',
      expect.objectContaining({ dedupingInterval: 60_000 })
    );
  });
});
