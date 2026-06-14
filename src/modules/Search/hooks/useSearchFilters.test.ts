/**
 * useSearchFilters hook test
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSearchFilters } from '@/modules/Search/hooks/useSearchFilters';

// 簡化的 mock router
const makeRouter = () => ({
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
});

// 簡化的 mock useSearchParams
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

describe('useSearchFilters', () => {
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
      useSearchFilters(
        { result: { video: [] }, list: ['2026-01-15'] },
        makeRouter() as never
      )
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
      useSearchFilters(
        { result: { video: [] }, list: ['2026-01-15'] },
        makeRouter() as never
      )
    );
    expect(result.current.searchValue).toBe('原神');
    expect(result.current.selectedChannels).toEqual([['游戏', '单机']]);
    expect(result.current.activeTag).toBe('评测');
    expect(result.current.selectedTime).toBe('2026-01-15');
  });

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
      useSearchFilters({ result, list: ['2026-01-15'] }, makeRouter() as never)
    );
    act(() => {
      h.current.setSearchValue('原神');
    });
    expect(h.current.filtered).toHaveLength(1);
  });

  it('handleReset clears all filters', () => {
    mockSearchParams = new URLSearchParams('q=原神&c=游戏&tag=评测');
    const { result } = renderHook(() =>
      useSearchFilters(
        { result: { video: [] }, list: ['2026-01-15'] },
        makeRouter() as never
      )
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
      useSearchFilters(
        { result: { video: [] }, list: ['2026-01-15', '2026-01-14'] },
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
      useSearchFilters(
        { result: { video: [] }, list: ['2026-01-15'] },
        makeRouter() as never
      )
    );
    act(() => {
      result.current.setSelectedChannels(() => [['游戏', '单机']]);
    });
    expect(result.current.selectedChannels).toEqual([['游戏', '单机']]);
  });

  it('loadMore increases visible count', () => {
    const videos = Array.from({ length: 50 }, (_, i) =>
      makeVideo({ bvid: `BV${i}`, title: `v${i}` })
    );
    const { result } = renderHook(() =>
      useSearchFilters(
        { result: { video: videos }, list: ['2026-01-15'] },
        makeRouter() as never
      )
    );
    // 初始 PAGE_SIZE = 24
    expect(result.current.visible.length).toBe(24);
    act(() => {
      result.current.loadMore();
    });
    expect(result.current.visible.length).toBe(48);
    act(() => {
      result.current.loadMore();
    });
    // 超過 50 → 50
    expect(result.current.visible.length).toBe(50);
  });

  it('filtered is empty when result is null', () => {
    const { result } = renderHook(() =>
      useSearchFilters(
        { result: null, list: ['2026-01-15'] },
        makeRouter() as never
      )
    );
    expect(result.current.filtered).toEqual([]);
  });

  it('setActiveTag updates the active tag', () => {
    const { result } = renderHook(() =>
      useSearchFilters(
        { result: { video: [] }, list: ['2026-01-15'] },
        makeRouter() as never
      )
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
