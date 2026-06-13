// @vitest-environment node
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const REAL_FETCH = globalThis.fetch;
const REAL_ENV = { ...process.env };
const RESULT_DIR = join(process.cwd(), 'result');

describe('result-data.server (dev MOCK_LOCAL_FILES branch)', () => {
  beforeAll(() => {
    process.env.MOCK_LOCAL_FILES = '1';
    process.env.NODE_ENV = 'development';
    if (!existsSync(RESULT_DIR)) {
      mkdirSync(RESULT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    process.env.MOCK_LOCAL_FILES = REAL_ENV.MOCK_LOCAL_FILES;
    process.env.NODE_ENV = REAL_ENV.NODE_ENV;
    globalThis.fetch = REAL_FETCH;
    // 還原全域 fetch
  });

  beforeEach(() => {
    // 清掉本機 mock 檔避免污染其他測試
    rmSync(join(RESULT_DIR, '2026-01-15.json'), { force: true });
    rmSync(join(RESULT_DIR, '2026-01-14.json'), { force: true });
    writeFileSync(
      join(RESULT_DIR, 'list.json'),
      JSON.stringify(['2026-01-15', '2026-01-14'])
    );
  });

  it('returns local list when MOCK_LOCAL_FILES=1 and list.json exists', async () => {
    const { fetchResultList } =
      await import('@/common/libs/result-data.server');
    const list = await fetchResultList();
    expect(list).toEqual(['2026-01-15', '2026-01-14']);
  });

  it('returns [] when list.json is malformed JSON', async () => {
    writeFileSync(join(RESULT_DIR, 'list.json'), 'not-valid-json');
    // 重新 import 模組以觸發 in-memory cache miss（module-scope cache 用 Date.now 防 stale）
    const { fetchResultList: fr } =
      await import('@/common/libs/result-data.server');
    // bypass 60s cache by using a fresh module (vi.resetModules)
    vi.resetModules();
    const reloaded = await import('@/common/libs/result-data.server');
    const list = await reloaded.fetchResultList();
    expect(list).toEqual([]);
    void fr;
  });

  it('returns [] when list.json is missing', async () => {
    rmSync(join(RESULT_DIR, 'list.json'), { force: true });
    vi.resetModules();
    const { fetchResultList } =
      await import('@/common/libs/result-data.server');
    const list = await fetchResultList();
    expect(list).toEqual([]);
  });

  it('throws when fetchResultByName is called for a missing local file', async () => {
    vi.resetModules();
    const { fetchResultByName } =
      await import('@/common/libs/result-data.server');
    await expect(fetchResultByName('not-found')).rejects.toThrow();
  });

  it('returns parsed data when local file exists and validates schema', async () => {
    writeFileSync(
      join(RESULT_DIR, '2026-01-15.json'),
      JSON.stringify({
        time: 1736899200000,
        video: [
          {
            bvid: 'BV1wEEg62EDP',
            url: 'https://www.bilibili.com/video/BV1wEEg62EDP',
            cover: 'https://i0.hdslb.com/bfs/archive/abc.jpg',
            title: 'Test',
            UP: 'Tester',
            views: 100,
            tags: {
              firstChannel: '游戏',
              secondChannel: 'a',
              ordinaryTags: [],
            },
          },
        ],
      })
    );
    vi.resetModules();
    const { fetchResultByName } =
      await import('@/common/libs/result-data.server');
    const r = await fetchResultByName('2026-01-15');
    expect(r.time).toBe(1736899200000);
    expect(r.video).toHaveLength(1);
  });
});
