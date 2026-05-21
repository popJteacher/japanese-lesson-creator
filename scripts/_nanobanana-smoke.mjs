#!/usr/bin/env node
// scripts/_nanobanana-smoke.mjs
// Phase 4 後 ＝ Nano Banana 化のスモークテスト（_imagen-smoke.mjs と同位置付け）。
// gemini-2.5-flash-image（Nano Banana）で 1 件だけ生成し
// .tmp_verify/_nanobanana_smoke.png に書き出す。
// billing 有効化と単価（output tokens）の最終検証も兼ねる。
//
// 使い方:
//   node scripts/_nanobanana-smoke.mjs
//
// 成功条件:
//   - .tmp_verify/_nanobanana_smoke.png が出力される
//   - 先頭が PNG マジック（89 50 4E 47 0D 0A 1A 0A）で始まる
//   - usageMetadata から output token 数を報告し、cost 計算が走る
//
// 課金:
//   1 件 × Nano Banana = $30/M output tokens × ~1290 tokens ≈ $0.0387
//   失敗時（401/403/400 billing）は API 側で reject されるので課金はかからない。
//
// Imagen 4 smoke との差分:
//   - aspectRatio / imageSize / personGeneration は API パラメータ非対応
//     → プロンプト inline directive（"square 1:1 aspect ratio" 等）で代用
//   - cost が token ベース → usageMetadata から都度算出
//   - personGeneration 概念なし（Nano Banana は組み込み safety policy）

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import {
  loadEnv,
  generateNanobananaImage,
  DEFAULT_NANOBANANA_MODEL,
  NANOBANANA_IMAGE_TOKEN_ESTIMATE,
} from './lib/nanobanana-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

// _imagen-smoke と同じスタイル指定だが、aspect ratio を inline で明記
// （Nano Banana は API パラメータ非対応のため）。
const SMOKE_PROMPT = [
  'ASPECT RATIO: square 1:1, full frame composition.',
  'Minimalist flat vector illustration of a single coffee mug viewed from a 3/4 angle.',
  'Clean continuous black outlines with consistent line weight.',
  'Completely flat solid color fills only.',
  'Color palette: soft cream white background, deep slate navy outlines,',
  'muted warm blue main fill, warm amber gold accent.',
  'No gradients, no shadows, no 3D effects, no photoreal textures.',
  'Brand style guide aesthetic, not AI art.',
].join(' ');

const OUT_DIR = resolve(ROOT, '.tmp_verify');
const OUT_PATH = resolve(OUT_DIR, '_nanobanana_smoke.png');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isPng(buf) {
  if (buf.length < 8) return false;
  return buf.subarray(0, 8).equals(PNG_SIGNATURE);
}

async function main() {
  await loadEnv(ROOT);

  console.log(`  model:                ${DEFAULT_NANOBANANA_MODEL}`);
  console.log(`  estimated price/img:  ~$${(30 / 1_000_000 * NANOBANANA_IMAGE_TOKEN_ESTIMATE).toFixed(4)} (${NANOBANANA_IMAGE_TOKEN_ESTIMATE} tokens × $30/M)`);
  console.log('  → 実際の cost は usageMetadata から算出されます');
  console.log('');

  const result = await generateNanobananaImage({
    prompt: SMOKE_PROMPT,
    model: DEFAULT_NANOBANANA_MODEL,
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

  // 1024x1024 検証（先頭 24 byte 目から幅・高さを取り出す）
  let width = null, height = null, bitDepth = null, colorType = null;
  if (valid && result.bytes.length >= 26) {
    width    = (result.bytes[16] << 24) | (result.bytes[17] << 16) | (result.bytes[18] << 8) | result.bytes[19];
    height   = (result.bytes[20] << 24) | (result.bytes[21] << 16) | (result.bytes[22] << 8) | result.bytes[23];
    bitDepth = result.bytes[24];
    colorType = result.bytes[25];
  }

  console.log('✓ Nano Banana 生成 OK');
  console.log(`  model:           ${result.model}`);
  console.log(`  mime:            ${result.mimeType}`);
  console.log(`  size:            ${result.bytes.length} bytes`);
  console.log(`  dimensions:      ${width}×${height} (bit depth ${bitDepth}, color type ${colorType})`);
  console.log(`  duration:        ${result.durationMs} ms`);
  console.log(`  cost:            ${result.costUsd == null ? '(price not configured)' : '$' + result.costUsd.toFixed(4)}`);
  if (result.usageMetadata) {
    console.log(`  usage:           prompt=${result.usageMetadata.promptTokenCount ?? '?'} `
              + `candidates=${result.usageMetadata.candidatesTokenCount ?? '?'} `
              + `total=${result.usageMetadata.totalTokenCount ?? '?'} tokens`);
  }
  console.log(`  header:          ${headerHex} (png valid: ${valid})`);
  console.log(`  out:             ${OUT_PATH}`);

  if (!valid) {
    console.error('✗ Image header does not look like PNG');
    process.exit(2);
  }

  // v3.11.1 で前提していた 1024x1024 出力かを確認（aspect 1:1 inline directive 効果検証）
  if (width !== 1024 || height !== 1024) {
    console.warn(`  ⚠ dimensions が 1024x1024 ではない (${width}x${height})。`);
    console.warn(`    Nano Banana は aspect ratio が API パラメータ非対応のため、`);
    console.warn(`    プロンプト inline directive の効きが弱い可能性。v3.12 で要強化。`);
  }
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
