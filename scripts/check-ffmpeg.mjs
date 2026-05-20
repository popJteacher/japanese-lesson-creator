#!/usr/bin/env node
// scripts/check-ffmpeg.mjs
// Phase 3 ④ の人間タスク完了確認スクリプト。
// ffmpeg / ffprobe コマンドと QC パイプラインで使うフィルタの存在を確認する。
//
// 使い方:
//   npm run check-ffmpeg
//
// 成功条件:
//   - ffmpeg / ffprobe コマンドが起動できる
//   - 必須フィルタ silenceremove / loudnorm / afade / areverse が利用可能
//   - libmp3lame エンコーダが利用可能
//
// 失敗時の典型メッセージと意味:
//   "ENOENT" / "not found"  → ffmpeg 未インストール（または PATH 未反映）
//                             winget install Gyan.FFmpeg → PowerShell 再起動
//   "Missing filters:"     → ffmpeg ビルドが minimal で必要 filter が無い
//                             gyan.dev の full ビルドを使うこと
//   "Missing encoder:"     → libmp3lame 未同梱

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadEnv } from './lib/sheets-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FILTERS = ['silenceremove', 'loudnorm', 'afade', 'areverse'];
const REQUIRED_ENCODER = 'libmp3lame';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout + stderr);
      else reject(new Error(`${cmd} exit ${code}: ${stderr.trim().slice(-300)}`));
    });
  });
}

async function main() {
  await loadEnv(ROOT);
  const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
  const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';

  // ffmpeg / ffprobe バージョン
  const v1 = await run(ffmpegPath, ['-version']);
  const v2 = await run(ffprobePath, ['-version']);
  console.log('✓ ffmpeg:  ' + v1.split('\n')[0]);
  console.log('✓ ffprobe: ' + v2.split('\n')[0]);

  // フィルタ availability
  const filtersOut = await run(ffmpegPath, ['-hide_banner', '-filters']);
  const missingFilters = REQUIRED_FILTERS.filter(f => !new RegExp(`\\b${f}\\b`).test(filtersOut));
  if (missingFilters.length) {
    throw new Error('Missing filters: ' + missingFilters.join(', '));
  }
  console.log(`✓ filters: ${REQUIRED_FILTERS.join(', ')}`);

  // エンコーダ availability
  const encoders = await run(ffmpegPath, ['-hide_banner', '-encoders']);
  if (!new RegExp(`\\b${REQUIRED_ENCODER}\\b`).test(encoders)) {
    throw new Error(`Missing encoder: ${REQUIRED_ENCODER}`);
  }
  console.log(`✓ encoder: ${REQUIRED_ENCODER}`);
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
