#!/usr/bin/env node
/**
 * scripts/mock-n-days.mjs
 *
 * 從 result/ 最新檔拷貝 N 份（N 預設 30），往回倒推日期，寫入 result/ 並
 * prepend 到 list.json。目的：QA `/dashboard/trend` 與 `/dashboard/ups`
 * 在只有 1 天資料時的行為，製造可觀察的 30 天時序。
 *
 * 與 `mock-second-day.mjs` 的差異：
 *   - N 可調（CLI: `--days=30`）
 *   - 每一天的 jitter 用「相對於今日的隨機偏移」產生而非固定
 *   - 不重複生成 list 內已有的日期（idempotent）
 *
 * 副作用：
 *   - 寫入 result/{N 天前的日期}.json
 *   - 修改 result/list.json
 *
 * 不會：
 *   - 觸碰 src/、package.json、prod data
 *   - 推送 git（CrawlPopular.cjs / GitHub Action 不會跑這個 script）
 *   - 寫入 result/agg-latest.json（/api/dashboard 端會即時重算）
 *
 * 注意：
 *   - result/ 已在 .gitignore，不會污染 commit
 *   - 真實的歷史資料會在每日 12:00 UTC+8 cron 觸發後自然累積
 *
 * 使用：
 *   node scripts/mock-n-days.mjs
 *   node scripts/mock-n-days.mjs --days=14
 *
 * 重置：
 *   node scripts/mock-second-day.mjs  # 先把昨日 mock 也清掉（若有）
 *   rm result/2026-*.json             # 砍掉所有非最新檔
 *   git checkout result/list.json
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const resultDir = path.join(root, 'result');
const listPath = path.join(resultDir, 'list.json');

const args = process.argv.slice(2);
const daysArg = args.find((a) => a.startsWith('--days='));
const N = daysArg ? Math.max(1, parseInt(daysArg.split('=')[1], 10)) : 30;

if (!existsSync(resultDir)) {
  console.error('✗ result/ 目錄不存在。請先跑 pnpm crawldata 生成當日檔案。');
  process.exit(1);
}
if (!existsSync(listPath)) {
  console.error('✗ result/list.json 不存在。請先跑 pnpm crawldata。');
  process.exit(1);
}

const list = JSON.parse(readFileSync(listPath, 'utf-8'));
if (!Array.isArray(list) || list.length === 0) {
  console.error('✗ list.json 為空。');
  process.exit(1);
}

const latest = list[0];
const latestPath = path.join(resultDir, latest + '.json');
if (!existsSync(latestPath)) {
  console.error(`✗ 最新檔 ${latest}.json 不存在。`);
  process.exit(1);
}

const latestData = JSON.parse(readFileSync(latestPath, 'utf-8'));
const latestTime = latestData.time;

const jitter = (seed) => {
  // 簡易 LCG，給定 seed（天數偏移）回 0-1 之間的偽隨機
  let x = (seed * 9301 + 49297) % 233280;
  return x / 233280;
};

let generated = 0;
for (let d = 1; d <= N; d++) {
  const dayTime = latestTime - d * 24 * 60 * 60 * 1000;
  const dayDate = new Date(dayTime + 8 * 60 * 60 * 1000); // UTC+8
  const dayFile =
    dayDate.toISOString().slice(0, -5).replace(/:/g, '-') + '+0800';

  if (list.includes(dayFile)) continue;

  // 製造可觀察的 diff：
  //   - 整體 views × (0.80-0.98) 模擬「過去比今天稍低」
  //   - 每天 5% 影片下線
  //   - 30% 影片的 statLike/Coin/Favorite ±20%
  //   - 5% 影片 firstChannel 改為「未知」
  //   - pubdate 倒推 d 天（確保 latency 分析有資料）
  const viewsScale = 0.8 + jitter(d * 7) * 0.18;
  const dropRatio = 0.05;
  const statJitterRatio = 0.3;
  const channelShiftRatio = 0.05;
  const r1 = jitter(d * 13);
  const r2 = jitter(d * 19);
  const r3 = jitter(d * 23);

  const dayVideos = latestData.video.map((v) => {
    const v2 = { ...v };
    v2.views = Math.max(1, Math.floor(v.views * viewsScale));
    if (r1 < statJitterRatio) {
      const j = 0.8 + jitter(d * 31) * 0.4;
      if (typeof v2.statLike === 'number')
        v2.statLike = Math.floor(v2.statLike * j);
      if (typeof v2.statCoin === 'number')
        v2.statCoin = Math.floor(v2.statCoin * j);
      if (typeof v2.statFavorite === 'number')
        v2.statFavorite = Math.floor(v2.statFavorite * j);
    }
    if (r2 < channelShiftRatio) {
      v2.tags = { ...v2.tags, firstChannel: '未知' };
    }
    if (v2.pubdate) {
      v2.pubdate = v2.pubdate - d * 24 * 60 * 60;
    }
    return v2;
  });

  // 模擬「過去少 5% 影片」
  const dropCount = Math.floor(dayVideos.length * dropRatio);
  if (r3 < 0.5) {
    dayVideos.splice(0, dropCount);
  } else {
    dayVideos.splice(dayVideos.length - dropCount, dropCount);
  }

  const dayData = { time: dayTime, video: dayVideos };
  writeFileSync(
    path.join(resultDir, dayFile + '.json'),
    JSON.stringify(dayData)
  );

  list.unshift(dayFile);
  generated++;
}

writeFileSync(listPath, JSON.stringify(list));

console.log(
  `✓ 已生成 ${generated} 天假資料（目標 ${N} 天；已存在 ${N - generated} 天）`
);
console.log(`✓ list.json 現有 ${list.length} 天`);
console.log(``);
console.log(`→ 打開 /dashboard/trend 看時序圖`);
console.log(`→ 打開 /dashboard/ups 看 UP 主跨分區重疊`);
console.log(``);
console.log(`重置：rm result/2026-*.json && git checkout result/list.json`);
