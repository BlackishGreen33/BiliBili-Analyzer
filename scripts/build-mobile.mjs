#!/usr/bin/env node
import { readFile, writeFile, copyFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'next.config.mjs');
const backupPath = path.join(root, 'next.config.mjs.bak');

async function main() {
  if (!existsSync(configPath)) {
    console.error('next.config.mjs not found');
    process.exit(1);
  }

  console.log('▸ 备份 next.config.mjs');
  const original = await readFile(configPath, 'utf-8');
  await writeFile(backupPath, original, 'utf-8');

  // Patch config to enable static export
  const patched = original.replace(
    /\/\/ output: "export"/,
    'output: "export"'
  );
  await writeFile(configPath, patched, 'utf-8');

  try {
    console.log('▸ 运行 next build（静态导出）');
    execSync('npx next build', { stdio: 'inherit' });

    if (!existsSync(path.join(root, 'out'))) {
      throw new Error('out/ directory was not produced');
    }

    console.log('▸ capacitor sync');
    execSync('npx cap sync android ios', { stdio: 'inherit' });

    console.log('▸ 移动端构建完成。运行 `npx cap open android` 或 `npx cap open ios` 继续。');
  } finally {
    console.log('▸ 还原 next.config.mjs');
    await copyFile(backupPath, configPath, 'utf-8');
    await rm(backupPath, { force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
