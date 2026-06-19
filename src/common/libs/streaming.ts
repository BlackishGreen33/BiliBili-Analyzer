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
        const chunk = encoder.encode(encodeNdjsonLine(value));
        controller.enqueue(chunk);
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

function parseNdjsonLine(line: string): StreamEvent | null {
  if (!line.trim()) return null;
  return JSON.parse(line) as StreamEvent;
}

async function* readNdjsonLines(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    yield* lines;
  }

  if (buffer) yield buffer;
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
  const result: Record<string, unknown> = {};
  const dataArr: unknown[] = [];
  for await (const event of parseNdjsonEvents(res.body)) {
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

/**
 * 給 client 端：把 NDJSON stream 解析成 AsyncIterable<StreamEvent>
 *
 * 設計重點：
 *   - 純函數 + AsyncGenerator，無外部副作用，易測試
 *   - 處理跨 chunk 的 partial line（buffer 機制）
 *   - 容忍無尾端換行的最後一行
 *   - 空行 / 純空白行自動跳過
 *
 * 給 useLatencyStream() / useDashboardTrendStream() 這類
 * 「要逐 chunk 推進 UI state」的情境用
 */
export async function* parseNdjsonEvents(
  body: ReadableStream<Uint8Array> | null
): AsyncGenerator<StreamEvent> {
  if (!body) {
    throw new Error('Stream has no body');
  }
  const reader = body.getReader();

  try {
    for await (const line of readNdjsonLines(reader)) {
      const event = parseNdjsonLine(line);
      if (event) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}
