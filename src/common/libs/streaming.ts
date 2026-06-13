/**
 * src/common/libs/streaming.ts
 *
 * NDJSON streaming helpers — shared between server (route handlers)
 * and client (consumers).
 *
 * 格式：每行一筆 JSON chunk，類型由 `type` 區分。
 *   {"type":"meta", ...}
 *   {"type":"chunk", ...}
 *   {"type":"done", ...}
 *
 * 為什麼選 NDJSON：
 *   - 不需要 SSE 的特殊 Content-Type
 *   - 任何 fetch 客戶端 + ReadableStream reader 都能 consume
 *   - CORS 友善
 *   - 易測試（mock response body）
 */

export type StreamEvent<T = Record<string, unknown>> =
  | ({ type: 'meta' } & T)
  | ({ type: 'chunk' } & T)
  | ({ type: 'done' } & T);

/** 把一筆 event 編碼成 NDJSON 一行（含尾端換行） */
export function encodeNdjsonLine(event: StreamEvent): string {
  return JSON.stringify(event) + '\n';
}

/**
 * 給 server 端：把 AsyncGenerator 包成 ReadableStream，回傳 Response
 */
export function ndjsonStream(generator: AsyncGenerator<StreamEvent>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await generator.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(encodeNdjsonLine(value)));
      } catch (err) {
        controller.error(err);
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** 把一個已知的完整 payload 當作 stream 一次性送出（給 cache hit 場景） */
export function ndjsonStreamFromEvents(
  events: ReadonlyArray<StreamEvent>
): Response {
  const encoder = new TextEncoder();
  const body = events.map(encodeNdjsonLine).join('');
  return new Response(encoder.encode(body), {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/**
 * 給 client 端：把 NDJSON response body 累積成一個最終物件
 *   - 'meta' event 合併進 base
 *   - 'chunk' event 的 `data` 欄位 push 到 base.data 陣列
 *   - 'done' event 合併進 base（覆蓋）
 * 適合 SWR-style 「分批拿、最終回傳單一物件」的情境
 */
export async function consumeNdjson<T extends Record<string, unknown>>(
  res: Response
): Promise<T> {
  if (!res.body) {
    throw new Error('Response has no body');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const result: Record<string, unknown> = {};
  const dataArr: unknown[] = [];
  let buffer = '';

  // 對齊 Server-Sent Events 的換行處理：每行一個 JSON
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as StreamEvent;
      if (event.type === 'chunk' && 'data' in event) {
        dataArr.push((event as unknown as { data: unknown }).data);
      } else {
        const { type: _type, ...rest } = event;
        void _type;
        Object.assign(result, rest);
      }
    }
  }
  if (buffer.trim()) {
    const event = JSON.parse(buffer) as StreamEvent;
    if (event.type === 'chunk' && 'data' in event) {
      dataArr.push((event as unknown as { data: unknown }).data);
    } else {
      const { type: _type, ...rest } = event;
      void _type;
      Object.assign(result, rest);
    }
  }
  if (dataArr.length > 0) {
    result.data = dataArr;
  }
  return result as T;
}
