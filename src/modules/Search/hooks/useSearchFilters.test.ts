/**
 * useSearchState / useSearchFilters hook tests
 *
 * 拆成兩個 hook 的理由:useSearchState 不依賴 result,可以比 SWR 抓資料的
 * useLatestCrawl 更早呼叫,讓 useLatestCrawl 拿到 effectiveTime 作為 key。
 * useSearchFilters 變成純 filter + pagination,不接 router。
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSearchFilters } from '@/modules/Search/hooks/useSearchFilters';
import { useSearchState } from '@/modules/Search/hooks/useSearchState';

const makeRouter = () => ({
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
});

let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => makeRouter(),
}));

const makeVideo = (
  over: Partial<{
    bvid: string;
    title: string;
    UP: string;
    tags: {
      firstChannel: string;
      secondChannel: string;
      ordinaryTags: string[];
    };
  }> = {}
) => ({
  bvid: 'BV1',
  url: 'https://www.bilibili.com/video/BV1',
  cover: 'https://i0.hdslb.com/bfs/archive/abc.jpg',
  title: '测试',
  UP: 'UP1',
  views: 100,
  tags: { firstChannel: '游戏', secondChannel: '单机', ordinaryTags: ['原神'] },
  ...over,
});

describe('useSearchState', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes state from URL params (empty)', () => {
    const { result } = renderHook(() =>
      useSearchState({ list: ['2026-01-15'] }, makeRouter() as never)
    );
    expect(result.current.searchValue).toBe('');
    expect(result.current.selectedChannels).toEqual([]);
    expect(result.current.activeTag).toBeNull();
  });

  it('initializes state from URL params (with q/c/tag/date)', () => {
    mockSearchParams = new URLSearchParams(
      'q=原神&c=游戏-单机&tag=评测&date=2026-01-15'
    );
    const { result } = renderHook(() =>
      useSearchState({ list: ['2026-01-15'] }, makeRouter() as never)
    );
    expect(result.current.searchValue).toBe('原神');
    expect(result.current.selectedChannels).toEqual([['游戏', '单机']]);
    expect(result.current.activeTag).toBe('评测');
    expect(result.current.selectedTime).toBe('2026-01-15');
  });

  it('effectiveTime falls back to list[0] when no selectedTime', () => {
    const { result } = renderHook(() =>
      useSearchState(
        { list: ['2026-01-15', '2026-01-14'] },
        makeRouter() as never
      )
    );
    expect(result.current.effectiveTime).toBe('2026-01-15');
  });

  it('effectiveTime uses selectedTime when set', () => {
    const { result } = renderHook(() =>
      useSearchState(
        { list: ['2026-01-15', '2026-01-14'] },
        makeRouter() as never
      )
    );
    act(() => {
      result.current.handleChangeDate('2026-01-14');
    });
    expect(result.current.effectiveTime).toBe('2026-01-14');
  });

  it('handleReset clears all filters', () => {
    mockSearchParams = new URLSearchParams('q=原神&c=游戏&tag=评测');
    const { result } = renderHook(() =>
      useSearchState({ list: ['2026-01-15'] }, makeRouter() as never)
    );
    act(() => {
      result.current.handleReset();
    });
    expect(result.current.searchValue).toBe('');
    expect(result.current.selectedChannels).toEqual([]);
    expect(result.current.activeTag).toBeNull();
  });

  it('handleChangeDate triggers reset', () => {
    mockSearchParams = new URLSearchParams('q=原神');
    const { result } = renderHook(() =>
      useSearchState(
        { list: ['2026-01-15', '2026-01-14'] },
        makeRouter() as never
      )
    );
    act(() => {
      result.current.handleChangeDate('2026-01-14');
    });
    expect(result.current.selectedTime).toBe('2026-01-14');
    expect(result.current.searchValue).toBe('');
  });

  it('setSelectedChannels accepts a function updater', () => {
    const { result } = renderHook(() =>
      useSearchState({ list: ['2026-01-15'] }, makeRouter() as never)
    );
    act(() => {
      result.current.setSelectedChannels(() => [['游戏', '单机']]);
    });
    expect(result.current.selectedChannels).toEqual([['游戏', '单机']]);
  });

  it('setActiveTag updates the active tag', () => {
    const { result } = renderHook(() =>
      useSearchState({ list: ['2026-01-15'] }, makeRouter() as never)
    );
    act(() => {
      result.current.setActiveTag('测试标签');
    });
    expect(result.current.activeTag).toBe('测试标签');
    act(() => {
      result.current.setActiveTag(null);
    });
    expect(result.current.activeTag).toBeNull();
  });
});

describe('useSearchFilters', () => {
  it('filters videos by searchValue (keyword)', () => {
    const result = {
      video: [
        makeVideo({
          title: '原神评测',
          tags: {
            firstChannel: '游戏',
            secondChannel: '单机',
            ordinaryTags: [],
          },
        }),
        makeVideo({
          title: '明日方舟',
          tags: {
            firstChannel: '游戏',
            secondChannel: '手游',
            ordinaryTags: [],
          },
        }),
      ],
    };
    const { result: h } = renderHook(() =>
      useSearchFilters({
        result,
        searchValue: '原神',
        selectedChannels: [],
        activeTag: null,
      })
    );
    expect(h.current.filtered).toHaveLength(1);
  });

  it('filtered is empty when result is null', () => {
    const { result } = renderHook(() =>
      useSearchFilters({
        result: null,
        searchValue: '',
        selectedChannels: [],
        activeTag: null,
      })
    );
    expect(result.current.filtered).toEqual([]);
  });

  it('loadMore increases visible count', () => {
    const videos = Array.from({ length: 50 }, (_, i) =>
      makeVideo({ bvid: `BV${i}`, title: `v${i}` })
    );
    const { result } = renderHook(() =>
      useSearchFilters({
        result: { video: videos },
        searchValue: '',
        selectedChannels: [],
        activeTag: null,
      })
    );
    expect(result.current.visible.length).toBe(24);
    act(() => {
      result.current.loadMore();
    });
    expect(result.current.visible.length).toBe(48);
    act(() => {
      result.current.loadMore();
    });
    expect(result.current.visible.length).toBe(50);
  });

  it('changing searchValue re-filters', () => {
    const crawl = {
      video: [
        makeVideo({
          bvid: 'BV1',
          title: '原神评测',
          tags: {
            firstChannel: '游戏',
            secondChannel: '单机',
            ordinaryTags: [],
          },
        }),
        makeVideo({
          bvid: 'BV2',
          title: '明日方舟',
          tags: {
            firstChannel: '游戏',
            secondChannel: '手游',
            ordinaryTags: [],
          },
        }),
      ],
    };
    const { result, rerender } = renderHook(
      (props: { q: string }) =>
        useSearchFilters({
          result: crawl,
          searchValue: props.q,
          selectedChannels: [],
          activeTag: null,
        }),
      { initialProps: { q: '原神' } }
    );
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].bvid).toBe('BV1');
    rerender({ q: '明日' });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].bvid).toBe('BV2');
  });
});
