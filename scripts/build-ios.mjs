#!/usr/bin/env node
/**
 * scripts/build-ios.mjs
 *
 * 給本地維護者跑 iOS Ad Hoc archive 用。CI runner 沒有 macOS / Xcode，
 * 所以 iOS IPA 無法在 GitHub Actions 上 build，需要在 macOS 上：
 *
 *   1. 先打 v*.*.* tag → 等 CI 跑完 Android + Chrome extension release
 *   2. 在 macOS 上 `git pull && pnpm install`
 *   3. `pnpm build:mobile`（產出 out/ 並 cap sync）
 *   4. `pnpm build:ios`（patch Podfile + pod install）
 *   5. `npx cap open ios` 開 Xcode，Product → Archive → Distribute App
 *      → Ad Hoc → 輸出 IPA
 *   6. `gh release upload vX.Y.Z BiliBili-Analyzer-iOS-vX.Y.Z.ipa`
 *
 * 此 script 只負責 (1) Podfile 路徑修正 + pod install。archive 還是要
 * 走 Xcode GUI / xcodebuild。
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const podfilePath = path.join(root, 'ios/App/Podfile');
const podfileBackupPath = path.join(root, 'ios/App/Podfile.bak');

const detectCapacitorIosVersion = () => {
  // pnpm 會把每個 package 隔離在不同資料夾，掃 .pnpm 找出實際路徑
  const pnpmDir = path.join(root, 'node_modules/.pnpm');
  if (!existsSync(pnpmDir)) return null;
  for (const entry of readdirSync(pnpmDir)) {
    if (entry.startsWith('@capacitor+ios@') && entry.includes('_@capacitor+core@')) {
      const candidate = path.join(
        pnpmDir,
        entry,
        'node_modules/@capacitor/ios/scripts/pods_helpers.rb'
      );
      if (existsSync(candidate)) {
        return entry;
      }
    }
  }
  return null;
};

async function main() {
  if (!existsSync(podfilePath)) {
    console.error(`找不到 ${podfilePath}，請先在含 ios/ 的 repo 根目錄下執行此 script。`);
    process.exit(1);
  }

  const original = await readFile(podfilePath, 'utf-8');
  const versioned = detectCapacitorIosVersion();
  if (!versioned) {
    console.error('找不到 @capacitor/ios 套件，請先 `pnpm install`。');
    process.exit(1);
  }

  if (original.includes(versioned)) {
    console.log(`▸ Podfile 已經指向 ${versioned}，無需 patch`);
  } else {
    console.log(`▸ 備份 Podfile → Podfile.bak`);
    await writeFile(podfileBackupPath, original, 'utf-8');
    const patched = original.replace(
      /@capacitor\+ios@[\d.]+_@capacitor\+core@[\d.]+/g,
      versioned
    );
    await writeFile(podfilePath, patched, 'utf-8');
    console.log(`▸ 已 patch Podfile → ${versioned}`);
  }

  try {
    console.log('▸ pod install');
    execSync('pod install', { cwd: path.join(root, 'ios/App'), stdio: 'inherit' });
    console.log(
      '▸ Pods 安裝完成。接下來請執行：\n' +
        '    npx cap open ios\n' +
        '  在 Xcode 中：\n' +
        '    Product → Archive → Distribute App → Ad Hoc → 輸出 .ipa\n' +
        '  然後上傳到 GitHub Release：\n' +
        '    gh release upload vX.Y.Z BiliBili-Analyzer-iOS-vX.Y.Z.ipa'
    );
  } finally {
    if (existsSync(podfileBackupPath)) {
      console.log('▸ 還原 Podfile');
      await writeFile(podfilePath, original, 'utf-8');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
