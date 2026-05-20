#!/usr/bin/env node
// scripts/_imagen-smoke.mjs
// Phase 4 ② のスモークテスト。imagen-4.0-generate-001（Standard）で 1 件だけ
// 生成し .tmp_verify/_imagen_smoke.png に書き出す。
// billing 有効化の最終検証も兼ねる（① の ListModels では検証できない）。
//
// 使い方:
//   node scripts/_imagen-smoke.mjs
//
// 成功条件:
//   - .tmp_verify/_imagen_smoke.png が出力される
//   - 先頭が PNG マジック（89 50 4E 47 0D 0A 1A 0A）で始まる
//
// 課金:
//   1 件 × Standard = $0.04（≒ 6 円）。実行は控えめに。
//   失敗時（401/403/400 billing）は API 側で reject されるので課金はかからない。
//
// プロンプト方針:
//   ③ で master prompt guide を取り込むまでは「教育コンテンツの一部として
//   採用するつもりのない」ニュートラルなテスト画像を使う。
//   人物生成は使わずスタイル動作確認に絞る。

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { loadEnv, generateImage, DEFAULT_IMAGEN_MODEL } from './lib/imagen-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

const SMOKE_PROMPT = [
  'Minimalist flat vector illustration of a single coffee mug viewed from a 3/4 angle.',
  'Clean continuous black outlines with consistent line weight.',
  'Completely flat solid color fills only.',
  'Color palette: soft cream white background, deep slate navy outlines,',
  'muted warm blue main fill, warm amber gold accent.',
  'No gradients, no shadows, no 3D effects, no photoreal textures.',
  'Brand style guide aesthetic, not AI art.',
].join(' ');

const OUT_DIR = resolve(ROOT, '.tmp_verify');
const OUT_PATH = resolve(OUT_DIR, '_imagen_smoke.png');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isPng(buf) {
  if (buf.length < 8) return false;
  return buf.subarray(0, 8).equals(PNG_SIGNATURE);
}

async function main() {
  await loadEnv(ROOT);

  const result = await generateImage({
    prompt: SMOKE_PROMPT,
    model: DEFAULT_IMAGEN_MODEL,
    aspectRatio: '1:1',
    imageSize: '1K',
    personGeneration: 'dont_allow',
    sampleCount: 1,
    onRetry: ({ attempt, status, delayMs }) => {
      console.warn(`  ⚠ HTTP ${status} on attempt ${attempt}; retrying in ${delayMs} ms…`);
    },
  });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, result.bytes);

  const headerHex = Array.from(result.bytes.subarray(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
  const valid = isPng(result.bytes);

  console.log('✓ Imagen 4 生成 OK');
  console.log(`  model:    ${result.model}`);
  console.log(`  mime:     ${result.mimeType}`);
  console.log(`  size:     ${result.bytes.length} bytes`);
  console.log(`  duration: ${result.durationMs} ms`);
  console.log(`  cost:     ${result.costUsd == null ? 'n/a' : '$' + result.costUsd.toFixed(4)}`);
  console.log(`  header:   ${headerHex} (png valid: ${valid})`);
  console.log(`  out:      ${OUT_PATH}`);

  if (!valid) {
    console.error('✗ Image header does not look like PNG');
    process.exit(2);
  }
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
