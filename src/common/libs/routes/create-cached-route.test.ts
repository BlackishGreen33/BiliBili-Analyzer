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
