#!/usr/bin/env node
/**
 * scripts/mock-second-day.mjs
 *
 * 從 result/ 最新檔拷貝一份、改 timestamp 為「昨天」，寫入 result/ 並
 * prepend 到 list.json。目的：QA `/dashboard/compare` 在只有 1 天資料時
 * 的行為，製造可觀察的 diff。
 *
 * 副作用：
 *   - 寫入 result/{yesterday}.json
 *   - 修改 result/list.json
 *
 * 不會：
 *   - 觸碰 src/、package.json、prod data
 *   - 推送 git（CrawPopular.cjs / GitHub Action 不會跑這個 script）
 *   - 寫入 result/agg-latest.json（/api/dashboard 端會即時重算）
 *
 * 注意：
 *   - result/ 已在 .gitignore，不會污染 commit
 *   - 真實的「第二天」資料會在隔日 12:00 UTC+8 cron 觸發後自然生成
 *
 * 使用：
 *   node scripts/mock-second-day.mjs
 *
 * 重置：
 *   rm result/{yesterday}.json
 *   # 從 git 還原 list.json：git checkout result/list.json
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const resultDir = path.join(root, 'result');
const listPath = path.join(resultDir, 'list.json');

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

// 計算「昨天」的 timestamp（比 latest 早 24h）
const latestData = JSON.parse(readFileSync(latestPath, 'utf-8'));
const latestTime = latestData.time;
const yesterdayTime = latestTime - 24 * 60 * 60 * 1000;
const yesterdayDate = new Date(yesterdayTime + 8 * 60 * 60 * 1000); // UTC+8
const yesterdayFile =
  yesterdayDate.toISOString().slice(0, -5).replace(/:/g, '-') + '+0800';

if (list.includes(yesterdayFile)) {
  console.log(
    `✓ ${yesterdayFile} 已在 list.json 中，無需重複生成。\n  打開 /dashboard/compare 直接看效果。`
  );
  process.exit(0);
}

console.log(`▸ 拷貝 ${latest}.json → ${yesterdayFile}.json`);

// 製造可觀察的 diff：
//   - 10% 影片下線（從昨日清單中移除）
//   - 30% 影片的 statLike / statCoin 微調 ±20%
//   - 5% 影片的 firstChannel 改為「未知」（用於觀察分區 shift）
//   - 全體 views × (0.85–0.95) 模擬「昨日整體稍低」
const viewsScale = 0.85 + Math.random() * 0.1;
const dropRatio = 0.1;
const statJitterRatio = 0.3;
const channelShiftRatio = 0.05;

const yesterdayVideos = latestData.video
  .map((v) => {
    const v2 = { ...v };
    v2.views = Math.max(1, Math.floor(v.views * viewsScale));
    if (Math.random() < statJitterRatio) {
      const j = 0.8 + Math.random() * 0.4;
      if (typeof v2.statLike === 'number') v2.statLike = Math.floor(v2.statLike * j);
      if (typeof v2.statCoin === 'number') v2.statCoin = Math.floor(v2.statCoin * j);
      if (typeof v2.statFavorite === 'number')
        v2.statFavorite = Math.floor(v2.statFavorite * j);
    }
    if (Math.random() < channelShiftRatio) {
      v2.tags = { ...v2.tags, firstChannel: '未知' };
    }
    return v2;
  });

// 模擬「昨日少 10% 影片」
const dropCount = Math.floor(yesterdayVideos.length * dropRatio);
yesterdayVideos.splice(0, dropCount);

const yesterdayData = {
  time: yesterdayTime,
  video: yesterdayVideos,
};

writeFileSync(
  path.join(resultDir, yesterdayFile + '.json'),
  JSON.stringify(yesterdayData, null, 2)
);

// prepend 到 list.json
list.unshift(yesterdayFile);
writeFileSync(listPath, JSON.stringify(list, null, 2));

console.log(`✓ ${yesterdayFile} 已寫入`);
console.log(`✓ list.json 已更新（${list.length} 天）`);
console.log(``);
console.log(`→ 打開 /dashboard/compare 即可看到 2 天 diff`);
console.log(`→ 預設 URL: /dashboard/compare?a=${yesterdayFile}&b=${latest}`);
console.log(``);
console.log(`重置：rm result/${yesterdayFile}.json && git checkout result/list.json`);
