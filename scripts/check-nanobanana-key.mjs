#!/usr/bin/env node
// scripts/check-nanobanana-key.mjs
// Phase 4 後の人間タスク完了確認スクリプト（check-imagen-key.mjs と同位置付け）。
// .env の GEMINI_API_KEY が AI Studio の ListModels を通り、
// Nano Banana family（gemini-*-image / gemini-*-image-preview）が
// 一覧に含まれていれば PASS。
//
// 使い方:
//   node scripts/check-nanobanana-key.mjs
//   npm run check-nanobanana-key
//
// 成功条件:
//   - ListModels が 200 を返す
//   - 期待 Nano Banana モデル（gemini-2.5-flash-image）が models[] に含まれる
//
// 失敗時の典型メッセージと意味:
//   "GEMINI_API_KEY missing"        → .env 未設定
//   "API key not valid" / 400        → 鍵が無効・誤コピペ
//   "permission denied" / 403        → 鍵プロジェクトが Generative Language API 未許可
//   "gemini-2.5-flash-image not in models[]" → 鍵プロジェクトに Nano Banana アクセス権がない
//
// 注意: このスクリプトは ListModels しか叩かないため、
// 「billing が実際に通って 1 件生成できるか」は検証しない。
// 課金有効化の最終確認は scripts/_nanobanana-smoke.mjs（実生成 1 件）で行う。

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadEnv } from './lib/sheets-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

const LIST_MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Phase 4 後の本番利用モデル。既定は Nano Banana（gemini-2.5-flash-image・
// v3.11.1 で user 手動検証済）。Pro / 2 は将来検証用に把握。
const EXPECTED_NANOBANANA_MODELS = [
  'models/gemini-2.5-flash-image',
];
const OPTIONAL_NANOBANANA_MODELS = [
  'models/gemini-3-pro-image-preview',
  'models/gemini-3.1-flash-image-preview',
];

async function main() {
  await loadEnv(ROOT);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing (set in .env; .env.example 参照)');
  }

  const url = `${LIST_MODELS_URL}?key=${encodeURIComponent(apiKey)}&pageSize=200`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`ListModels HTTP ${resp.status}: ${body.slice(0, 400)}`);
  }
  const data = await resp.json();
  const models = Array.isArray(data.models) ? data.models : [];
  if (models.length === 0) {
    throw new Error('ListModels returned 0 models (API は通っているが応答が空)');
  }

  const names = models.map(m => m.name).sort();
  const banana = models.filter(m =>
    /(gemini-\d+(\.\d+)?-(?:flash|pro)-image|gemini-\d+(\.\d+)?-image-preview)/i.test(m.name || '')
  );

  console.log('✓ Google AI Studio ListModels OK');
  console.log(`  models total:        ${models.length}`);
  console.log(`  Nano Banana family:  ${banana.length}`);
  for (const m of banana) {
    console.log(`    - ${m.name}  (displayName: "${m.displayName || ''}")`);
  }

  const missingRequired = EXPECTED_NANOBANANA_MODELS.filter(n => !names.includes(n));
  if (missingRequired.length > 0) {
    console.error(`  ✗ 必須 Nano Banana モデル未検出: ${missingRequired.join(', ')}`);
    console.error('    → AI Studio コンソールでプロジェクトの Generative Language API を確認');
    process.exit(1);
  }
  console.log(`  ✓ 必須モデル検出:    ${EXPECTED_NANOBANANA_MODELS.join(', ')}`);

  const missingOptional = OPTIONAL_NANOBANANA_MODELS.filter(n => !names.includes(n));
  if (missingOptional.length > 0) {
    console.warn(`  ⚠ 任意モデル未検出:  ${missingOptional.join(', ')}`);
    console.warn('    （Pro / 2 は preview 段階。必須ではないので WARN 扱い）');
    if (process.exitCode === undefined) process.exitCode = 2;
  } else {
    console.log(`  ✓ 任意モデル全件検出: ${OPTIONAL_NANOBANANA_MODELS.join(', ')}`);
  }

  console.log('');
  console.log('  注: 課金 (billing) の有効化は ListModels では検証されません。');
  console.log('  scripts/_nanobanana-smoke.mjs で実生成 1 件を通して最終確認します。');
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
