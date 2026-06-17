#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'next.config.mjs');
const configBackupPath = path.join(root, 'next.config.mjs.bak');
const apiDir = path.join(root, 'src/app/api');
const apiBackupDir = path.join(root, 'src/app/_api_disabled_for_mobile_build');

const restoreApiDir = async () => {
  if (existsSync(apiBackupDir)) {
    await rename(apiBackupDir, apiDir);
  }
};

const restoreConfig = async (original) => {
  if (existsSync(configBackupPath)) {
    await rm(configBackupPath, { force: true });
  }
  await writeFile(configPath, original, 'utf-8');
  console.log(`  · next.config.mjs 還原完成（length=${original.length}）`);
};

async function main() {
  if (!existsSync(configPath)) {
    console.error('next.config.mjs not found');
    process.exit(1);
  }

  const originalConfig = await readFile(configPath, 'utf-8');

  console.log('▸ 备份 next.config.mjs');
  await writeFile(configBackupPath, originalConfig, 'utf-8');

  // Patch config to enable static export
  const patchedConfig = originalConfig.replace(
    /\/\/ output: "export"/,
    'output: "export"'
  );
  await writeFile(configPath, patchedConfig, 'utf-8');

  // Next.js `output: "export"` cannot include any non-static route handler.
  // The Capacitor mobile shell hits the live web API at runtime, so we
  // temporarily move `src/app/api/` out of the app tree during the build
  // and restore it afterwards.
  if (existsSync(apiDir)) {
    console.log('▸ 暂存 src/app/api → src/app/_api_disabled_for_mobile_build');
    if (existsSync(apiBackupDir)) {
      await rm(apiBackupDir, { recursive: true, force: true });
    }
    await rename(apiDir, apiBackupDir);
  }

  let exitCode = 0;
  try {
    console.log('▸ 运行 next build（静态导出）');
    execSync('npx next build', { stdio: 'inherit' });

    if (!existsSync(path.join(root, 'out'))) {
      throw new Error('out/ directory was not produced');
    }

    console.log('▸ capacitor sync');
    execSync('npx cap sync android ios', { stdio: 'inherit' });

    console.log(
      '▸ 移动端构建完成。运行 `npx cap open android` 或 `npx cap open ios` 继续。'
    );
  } catch (err) {
    exitCode = 1;
    throw err;
  } finally {
    console.log('▸ 还原 src/app/api');
    await restoreApiDir();
    console.log('▸ 还原 next.config.mjs');
    await restoreConfig(originalConfig);
  }
  process.exit(exitCode);
}

main().catch(async (err) => {
  console.error(err);
  try {
    await restoreApiDir();
    if (existsSync(configBackupPath)) {
      const original = await readFile(configBackupPath, 'utf-8');
      await restoreConfig(original);
    }
  } catch {
    // ignore secondary errors during best-effort restore
  }
  process.exit(1);
});
