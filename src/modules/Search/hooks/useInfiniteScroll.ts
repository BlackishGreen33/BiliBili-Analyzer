'use client';

import { useEffect, useRef } from 'react';

/**
 * 無限滾動：當捲動到接近底部時呼叫 onLoadMore。
 *
 * 用法：
 *   useInfiniteScroll({
 *     hasMore: visible.length < filtered.length,
 *     visible: visible.length,
 *     total: filtered.length,
 *     onLoadMore: () => setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length)),
 *   });
 */
export type UseInfiniteScrollArgs = {
  hasMore: boolean;
  visible: number;
  total: number;
  onLoadMore: () => void;
  threshold?: number;
};

export function useInfiniteScroll(args: UseInfiniteScrollArgs): void {
  const { hasMore, visible, total, onLoadMore, threshold = 600 } = args;
  const countsRef = useRef({ visible, total });
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    countsRef.current = { visible, total };
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      const { visible: v, total: t } = countsRef.current;
      if (v >= t) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      if (window.scrollY > max - threshold) {
        onLoadMoreRef.current();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasMore, threshold]);
}
