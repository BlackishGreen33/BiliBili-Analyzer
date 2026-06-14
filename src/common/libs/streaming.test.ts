import { describe, expect, it } from 'vitest';

import {
  consumeNdjson,
  encodeNdjsonLine,
  ndjsonStream,
  ndjsonStreamFromEvents,
} from '@/common/libs/streaming';

describe('encodeNdjsonLine', () => {
  it('appends a newline', () => {
    expect(encodeNdjsonLine({ type: 'meta', window: 30 })).toBe(
      '{"type":"meta","window":30}\n'
    );
  });

  it('handles chunk events with data', () => {
    expect(encodeNdjsonLine({ type: 'chunk', data: { x: 1, y: 2 } })).toBe(
      '{"type":"chunk","data":{"x":1,"y":2}}\n'
    );
  });
});

describe('ndjsonStreamFromEvents', () => {
  it('produces a Response with NDJSON body and correct headers', async () => {
    const res = ndjsonStreamFromEvents([
      { type: 'meta', window: 30, total: 100 },
      { type: 'chunk', data: { key: 'd0', count: 10 } },
      { type: 'done', avg: 1.5 },
    ]);
    expect(res.headers.get('Content-Type')).toBe(
      'application/x-ndjson; charset=utf-8'
    );
    const text = await res.text();
    expect(text).toBe(
      '{"type":"meta","window":30,"total":100}\n' +
        '{"type":"chunk","data":{"key":"d0","count":10}}\n' +
        '{"type":"done","avg":1.5}\n'
    );
  });

  it('handles empty events array', async () => {
    const res = ndjsonStreamFromEvents([]);
    const text = await res.text();
    expect(text).toBe('');
  });
});

describe('consumeNdjson', () => {
  it('merges meta + chunk.data[] + done into a single object', async () => {
    const src = ndjsonStreamFromEvents([
      { type: 'meta', window: 30, total: 100 },
      { type: 'chunk', data: { key: 'd0', count: 10 } },
      { type: 'chunk', data: { key: 'd1', count: 20 } },
      { type: 'done', avg: 1.5, median: 1 },
    ]);
    const result = (await consumeNdjson<{
      window: number;
      total: number;
      data: Array<{ key: string; count: number }>;
      avg: number;
      median: number;
    }>(src)) as {
      window: number;
      total: number;
      data: Array<{ key: string; count: number }>;
      avg: number;
      median: number;
    };
    expect(result.window).toBe(30);
    expect(result.total).toBe(100);
    expect(result.data).toEqual([
      { key: 'd0', count: 10 },
      { key: 'd1', count: 20 },
    ]);
    expect(result.avg).toBe(1.5);
    expect(result.median).toBe(1);
  });

  it('handles a single meta event', async () => {
    const src = ndjsonStreamFromEvents([{ type: 'meta', ok: true }]);
    const result = (await consumeNdjson<{ ok: boolean }>(src)) as {
      ok: boolean;
    };
    expect(result.ok).toBe(true);
  });

  it('handles a stream with no chunks (meta + done only)', async () => {
    const src = ndjsonStreamFromEvents([
      { type: 'meta', window: 7 },
      { type: 'done', points: 0 },
    ]);
    const result = (await consumeNdjson<{
      window: number;
      points: number;
    }>(src)) as { window: number; points: number };
    expect(result.window).toBe(7);
    expect(result.points).toBe(0);
    // 無 chunk → 不應有 data 屬性
    expect((result as Record<string, unknown>).data).toBeUndefined();
  });

  it('throws on response with no body', async () => {
    const fakeRes = new Response(null, { status: 200 });
    await expect(consumeNdjson(fakeRes)).rejects.toThrow();
  });

  it('handles a stream where final chunk has no trailing newline', async () => {
    // 手動建一個無尾端換行的 NDJSON body
    const body =
      '{"type":"meta","window":5}\n' +
      '{"type":"chunk","data":{"a":1}}\n' +
      '{"type":"done","ok":true}';
    const res = new Response(body, {
      headers: { 'Content-Type': 'application/x-ndjson' },
    });
    const result = (await consumeNdjson<{
      window: number;
      data: Array<{ a: number }>;
      ok: boolean;
    }>(res)) as { window: number; data: Array<{ a: number }>; ok: boolean };
    expect(result.window).toBe(5);
    expect(result.data).toEqual([{ a: 1 }]);
    expect(result.ok).toBe(true);
  });
});

describe('ndjsonStream', () => {
  it('converts an AsyncGenerator into a ReadableStream Response', async () => {
    async function* gen() {
      yield { type: 'meta' as const, window: 30 };
      yield { type: 'chunk' as const, data: { x: 1 } };
      yield { type: 'done' as const, ok: true };
    }
    const res = ndjsonStream(gen());
    expect(res.headers.get('Content-Type')).toBe(
      'application/x-ndjson; charset=utf-8'
    );
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    const text = await res.text();
    expect(text).toBe(
      '{"type":"meta","window":30}\n' +
        '{"type":"chunk","data":{"x":1}}\n' +
        '{"type":"done","ok":true}\n'
    );
  });

  it('handles an empty generator', async () => {
    async function* gen() {
      // 立即 return → 不 yield 任何東西
      return;
    }
    void gen;
    const res = ndjsonStream(
      (async function* () {
        return;
      })()
    );
    const text = await res.text();
    expect(text).toBe('');
  });

  it('propagates errors from the generator', async () => {
    const res = ndjsonStream(
      (async function* () {
        yield { type: 'meta' as const, ok: true };
        throw new Error('boom');
      })()
    );
    await expect(res.text()).rejects.toThrow('boom');
  });
});
