/**
 * useWordCloud hook 測試
 *
 * 由於 useWordCloud 使用固定 URL (`/api/wordcloud`), SWR 的全域 cache
 * 會在多個 test 間共享而難以隔離。改用 vi.mock 直接替換 swr 模組,
 * 在每個 test 內完全控制 hook 的回傳值, 規避 cache 污染問題。
 */

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWordCloud } from '@/common/libs/use-wordcloud';

const mockUseSWR = vi.fn();

vi.mock('swr', async () => {
  const actual = await vi.importActual<typeof import('swr')>('swr');
  return {
    ...actual,
    default: (key: unknown, fetcher: unknown, opts: unknown) =>
      mockUseSWR(key, fetcher, opts),
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

    // 驗證 useSWR 用 /api/wordcloud 作為 cache key
    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/wordcloud',
      expect.any(Function),
      expect.objectContaining({ revalidateOnFocus: false })
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
      expect.any(Function),
      expect.objectContaining({ dedupingInterval: 60_000 })
    );
  });
});
