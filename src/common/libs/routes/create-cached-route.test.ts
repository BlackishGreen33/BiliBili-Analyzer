import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createFiveMinCache,
  RouteCache,
  withRouteErrorHandler,
} from '@/common/libs/routes/create-cached-route';

describe('RouteCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns undefined on cache miss', () => {
    const c = new RouteCache<string>(1000);
    expect(c.get('nope')).toBeUndefined();
  });

  it('returns cached value within TTL', () => {
    const c = new RouteCache<string>(1000);
    c.set('a', 'value');
    vi.advanceTimersByTime(500);
    expect(c.get('a')).toBe('value');
  });

  it('expires value past TTL', () => {
    const c = new RouteCache<string>(1000);
    c.set('a', 'value');
    vi.advanceTimersByTime(1001);
    expect(c.get('a')).toBeUndefined();
  });

  it('evicts the oldest entry when max entries is exceeded', () => {
    const c = new RouteCache<string>(1000, 2);
    c.set('a', 'a');
    c.set('b', 'b');
    c.set('c', 'c');
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toBe('b');
    expect(c.get('c')).toBe('c');
  });

  it('cleans expired entries before set', () => {
    const c = new RouteCache<string>(1000, 3);
    c.set('a', 'a');
    vi.advanceTimersByTime(1001);
    c.set('b', 'b');
    const internal = c as unknown as { cache: Map<string, unknown> };
    expect(internal.cache.has('a')).toBe(false);
    expect(internal.cache.size).toBe(1);
  });

  it('refreshes an existing key before enforcing max entries', () => {
    const c = new RouteCache<string>(1000, 2);
    c.set('a', 'old');
    c.set('b', 'b');
    c.set('a', 'new');
    c.set('c', 'c');
    expect(c.get('a')).toBe('new');
    expect(c.get('b')).toBeUndefined();
    expect(c.get('c')).toBe('c');
  });

  it('createFiveMinCache uses 5-minute TTL', () => {
    const c = createFiveMinCache<string>();
    c.set('a', 'value');
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(c.get('a')).toBe('value');
    vi.advanceTimersByTime(61 * 1000);
    expect(c.get('a')).toBeUndefined();
  });
});

describe('withRouteErrorHandler', () => {
  it('passes through success response', async () => {
    const res = await withRouteErrorHandler('TEST', async () => {
      return new Response('ok', { status: 200 });
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });

  it('converts thrown error to 500', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await withRouteErrorHandler('TEST', async () => {
      throw new Error('boom');
    });
    expect(res.status).toBe(500);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
