/**
 * src/common/libs/routes/create-cached-route.ts
 *
 * Helpers that remove boilerplate around in-memory route caching.
 * Each analytics route was repeating the same 5-minute Map + try/catch
 * pattern; this consolidates the pattern without changing semantics.
 */

import { NextResponse } from 'next/server';

export type CacheEntry<T> = { data: T; at: number };

export class RouteCache<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 200
  ) {}

  get(key: string): T | undefined {
    const hit = this.cache.get(key);
    if (!hit) return undefined;
    if (Date.now() - hit.at >= this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    return hit.data;
  }

  set(key: string, data: T): void {
    const now = Date.now();
    for (const [entryKey, entry] of this.cache) {
      if (now - entry.at >= this.ttlMs) {
        this.cache.delete(entryKey);
      }
    }
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, { data, at: now });
    while (this.cache.size > this.maxEntries) {
      const oldest = this.cache.keys().next();
      if (oldest.done) break;
      this.cache.delete(oldest.value);
    }
  }
}

/**
 * Wrap a route handler so any thrown error is converted to a 500
 * NextResponse and logged with the supplied route name. Keeps the
 * handler body focused on the success path.
 *
 * `errorResponse` lets streaming routes return their own error shape
 * (e.g. NDJSON `{type:'done', error}`) instead of the default text 500.
 */
export async function withRouteErrorHandler(
  routeName: string,
  handler: () => Promise<Response>,
  errorResponse: () => Response = () =>
    new NextResponse('Internal Error', { status: 500 })
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error(`${routeName}_GET`, error);
    return errorResponse();
  }
}

/**
 * Convenience: create a fresh cache with a 5-minute TTL.
 * Centralizes the (previously duplicated) constant.
 */
export function createFiveMinCache<T>(maxEntries?: number): RouteCache<T> {
  return new RouteCache<T>(5 * 60 * 1000, maxEntries);
}
