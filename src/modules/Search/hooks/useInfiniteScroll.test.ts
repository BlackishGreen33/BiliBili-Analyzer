/**
 * useInfiniteScroll hook test
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInfiniteScroll } from '@/modules/Search/hooks/useInfiniteScroll';

describe('useInfiniteScroll', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('attaches a scroll listener on mount and removes on unmount', () => {
    const { unmount } = renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        visible: 0,
        total: 100,
        onLoadMore: () => {},
      })
    );
    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    });
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('does not call onLoadMore when hasMore is false (visible >= total)', () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: false,
        visible: 50,
        total: 50,
        onLoadMore,
      })
    );
    // simulate scroll past threshold
    act(() => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });
      window.scrollY = 2000;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not call onLoadMore when not scrolled close enough to bottom', () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        visible: 10,
        total: 100,
        onLoadMore,
      })
    );
    act(() => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });
      window.scrollY = 100; // far from bottom (max=1200, threshold=600)
      window.dispatchEvent(new Event('scroll'));
    });
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('calls onLoadMore when scrolled within threshold of bottom', () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        visible: 10,
        total: 100,
        onLoadMore,
      })
    );
    act(() => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 2000,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });
      // max = 2000 - 800 = 1200, threshold = 600, so scrollY > 600 triggers
      window.scrollY = 800;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does nothing when document is not scrollable (max <= 0)', () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll({
        hasMore: true,
        visible: 10,
        total: 100,
        onLoadMore,
      })
    );
    act(() => {
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 500,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });
      window.scrollY = 0;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
