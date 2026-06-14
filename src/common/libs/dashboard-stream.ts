/**
 * src/common/libs/dashboard-stream.ts
 *
 * NDJSON streaming 變體 — 對應 /api/latency 和 /api/dashboard/trend 的
 * ?stream=1 模式。與 SWR 風格的 useLatency / useDashboardTrend 不同，
 * 這裡用 useEffect + setState 推進 state，提供「桶一個一個長出來」
 * 的漸進渲染體驗。
 *
 * 設計取捨：
 *   - 不用 SWR：SWR 的 fetcher 是一次性回傳單一物件，不適合分批渲染
 *   - 不用 EventSource：NDJSON 走 fetch 即可，跨平台一致
 *   - 卸載時 abort 觸發 reader.cancel() 避免 leak
 *   - state 為 derived 累積型，不重新發 fetch
 */

import { useEffect, useState } from 'react';

import {
  type LatencyData,
  type LatencyPoint,
  type TrendData,
  type TrendPoint,
} from '@/common/libs/dashboard-data';
import { parseNdjsonEvents, type StreamEvent } from '@/common/libs/streaming';

export type LatencyStreamState = {
  meta: { window: number; total: number } | null;
  buckets: LatencyPoint[];
  isComplete: boolean;
  avgDays: number;
  medianDays: number;
  error: Error | null;
};

export type TrendStreamState = {
  meta: {
    window: number;
    isMock: boolean;
    realCount: number;
  } | null;
  points: TrendPoint[];
  isComplete: boolean;
  error: Error | null;
};

const initialLatencyState: LatencyStreamState = {
  meta: null,
  buckets: [],
  isComplete: false,
  avgDays: 0,
  medianDays: 0,
  error: null,
};

const initialTrendState: TrendStreamState = {
  meta: null,
  points: [],
  isComplete: false,
  error: null,
};

function applyLatencyEvent(
  state: LatencyStreamState,
  event: StreamEvent
): LatencyStreamState {
  if (event.type === 'meta') {
    const { type: _t, ...rest } = event;
    void _t;
    return {
      ...state,
      meta: rest as LatencyStreamState['meta'],
    };
  }
  if (event.type === 'chunk') {
    const data = (event as unknown as { data: LatencyPoint }).data;
    return {
      ...state,
      buckets: [...state.buckets, data],
    };
  }
  if (event.type === 'done') {
    const { type: _t, ...rest } = event;
    void _t;
    return {
      ...state,
      ...(rest as Pick<LatencyStreamState, 'avgDays' | 'medianDays'>),
      isComplete: true,
    };
  }
  return state;
}

function applyTrendEvent(
  state: TrendStreamState,
  event: StreamEvent
): TrendStreamState {
  if (event.type === 'meta') {
    const { type: _t, ...rest } = event;
    void _t;
    return {
      ...state,
      meta: rest as TrendStreamState['meta'],
    };
  }
  if (event.type === 'chunk') {
    const data = (event as unknown as { data: TrendPoint }).data;
    return {
      ...state,
      points: [...state.points, data],
    };
  }
  if (event.type === 'done') {
    return {
      ...state,
      isComplete: true,
    };
  }
  return state;
}

/**
 * 用 NDJSON 漸進式讀取 latency 資料。
 *
 * @param window 時間窗口天數
 */
export function useLatencyStream(window: number): LatencyStreamState {
  const [state, setState] = useState<LatencyStreamState>(initialLatencyState);

  useEffect(() => {
    const ac = new AbortController();
    setState(initialLatencyState);

    (async () => {
      try {
        const res = await fetch(`/api/latency?window=${window}&stream=1`, {
          signal: ac.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        if (!res.body) {
          throw new Error('Response has no body');
        }
        for await (const event of parseNdjsonEvents(res.body)) {
          if (ac.signal.aborted) break;
          setState((s) => applyLatencyEvent(s, event));
        }
      } catch (err) {
        if (ac.signal.aborted) return;
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err : new Error(String(err)),
          isComplete: true,
        }));
      }
    })();

    return () => ac.abort();
  }, [window]);

  return state;
}

/**
 * 用 NDJSON 漸進式讀取 dashboard trend 資料。
 */
export function useDashboardTrendStream(window: number): TrendStreamState {
  const [state, setState] = useState<TrendStreamState>(initialTrendState);

  useEffect(() => {
    const ac = new AbortController();
    setState(initialTrendState);

    (async () => {
      try {
        const res = await fetch(
          `/api/dashboard/trend?window=${window}&stream=1`,
          { signal: ac.signal }
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        if (!res.body) {
          throw new Error('Response has no body');
        }
        for await (const event of parseNdjsonEvents(res.body)) {
          if (ac.signal.aborted) break;
          setState((s) => applyTrendEvent(s, event));
        }
      } catch (err) {
        if (ac.signal.aborted) return;
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err : new Error(String(err)),
          isComplete: true,
        }));
      }
    })();

    return () => ac.abort();
  }, [window]);

  return state;
}

/** 給 LatencySection 用的便利轉接：把 streaming state 轉成 SWR 風格物件 */
export function latencyStreamToData(
  state: LatencyStreamState
): LatencyData | null {
  if (!state.meta) return null;
  return {
    window: state.meta.window,
    total: state.meta.total,
    buckets: state.buckets,
    avgDays: state.avgDays,
    medianDays: state.medianDays,
  };
}

/** 給 TrendPage 用的便利轉接 */
export function trendStreamToData(state: TrendStreamState): TrendData | null {
  if (!state.meta) return null;
  return {
    window: state.meta.window,
    isMock: state.meta.isMock,
    realCount: state.meta.realCount,
    points: state.points,
  };
}
