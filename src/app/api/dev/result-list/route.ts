import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Dev-only: 回傳 `result/list.json` 本機內容。
 * 給 `pnpm mock-second-day` 之後的 QA 用，merge 到 SWR 的 list 中。
 *
 * Production build 仍然會包含此檔，但因為 dev 環境下 list.json 才有資料，
 * prod 端只會回空陣列（且不會被呼叫到 — 沒有 UI hook）。
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ list: [] });
  }
  const p = path.join(process.cwd(), 'result', 'list.json');
  if (!existsSync(p)) {
    return NextResponse.json({ list: [] });
  }
  try {
    const list = JSON.parse(readFileSync(p, 'utf-8')) as string[];
    return NextResponse.json({ list });
  } catch {
    return NextResponse.json({ list: [] });
  }
}
