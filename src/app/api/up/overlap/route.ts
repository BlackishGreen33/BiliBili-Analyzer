import { NextResponse } from 'next/server';

import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data.server';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

const MAX_WINDOW = 90;
const DEFAULT_WINDOW = 30;
const DEFAULT_MIN_CHANNELS = 2;
const DEFAULT_MIN_COUNT = 2;
const DEFAULT_LIMIT = 50;

export type UpOverlapItem = {
  name: string;
  mid?: number;
  channelCount: number;
  totalCount: number;
  views: number;
  /** 一級分區 → 上榜次數 */
  channels: Array<{ firstChannel: string; count: number }>;
};

export type UpOverlapPayload = {
  window: number;
  minChannels: number;
  minCount: number;
  totalUps: number;
  items: UpOverlapItem[];
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawWindow = parseInt(url.searchParams.get('window') ?? '', 10);
  const window =
    Number.isFinite(rawWindow) && rawWindow > 0
      ? Math.min(MAX_WINDOW, rawWindow)
      : DEFAULT_WINDOW;
  const minChannels = Math.max(
    2,
    parseInt(url.searchParams.get('minChannels') ?? '', 10) ||
      DEFAULT_MIN_CHANNELS
  );
  const minCount = Math.max(
    1,
    parseInt(url.searchParams.get('minCount') ?? '', 10) || DEFAULT_MIN_COUNT
  );
  const limit = Math.max(
    1,
    Math.min(
      200,
      parseInt(url.searchParams.get('limit') ?? '', 10) || DEFAULT_LIMIT
    )
  );

  const cacheKey = `upoverlap:${window}:${minChannels}:${minCount}:${limit}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.data);
  }

  try {
    const list = await fetchResultList();
    const target = list.slice(0, window);
    if (target.length === 0) {
      const payload: UpOverlapPayload = {
        window,
        minChannels,
        minCount,
        totalUps: 0,
        items: [],
      };
      cache.set(cacheKey, { data: payload, at: now });
      return NextResponse.json(payload);
    }

    const results = await Promise.all(
      target.map((f) =>
        fetchResultByName(f).catch((e) => {
          console.error('UP_OVERLAP fetch failed', f, e);
          return null;
        })
      )
    );

    type UpAcc = {
      name: string;
      mid?: number;
      channelMap: Map<string, number>;
      totalCount: number;
      views: number;
    };

    const upMap = new Map<string, UpAcc>();
    for (const r of results) {
      if (!r) continue;
      for (const v of r.video) {
        const name = v.UP || '';
        if (!name && !v.mid) continue;
        const key = String(v.mid ?? name);
        const ch = v.tags?.firstChannel || '未分类';
        const e: UpAcc =
          upMap.get(key) ??
          ({
            name: v.UP,
            mid: v.mid,
            channelMap: new Map(),
            totalCount: 0,
            views: 0,
          } as UpAcc);
        e.totalCount++;
        e.views += Number.isFinite(v.views) ? v.views : 0;
        e.channelMap.set(ch, (e.channelMap.get(ch) ?? 0) + 1);
        upMap.set(key, e);
      }
    }

    const items: UpOverlapItem[] = [];
    for (const e of upMap.values()) {
      const channelCount = e.channelMap.size;
      if (channelCount < minChannels) continue;
      if (e.totalCount < minCount) continue;
      items.push({
        name: e.name,
        mid: e.mid,
        channelCount,
        totalCount: e.totalCount,
        views: e.views,
        channels: Array.from(e.channelMap.entries())
          .map(([firstChannel, count]) => ({ firstChannel, count }))
          .sort((a, b) => b.count - a.count),
      });
    }

    items.sort(
      (a, b) =>
        b.channelCount - a.channelCount ||
        b.totalCount - a.totalCount ||
        b.views - a.views
    );

    const payload: UpOverlapPayload = {
      window,
      minChannels,
      minCount,
      totalUps: upMap.size,
      items: items.slice(0, limit),
    };
    cache.set(cacheKey, { data: payload, at: now });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('UP_OVERLAP_GET', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
