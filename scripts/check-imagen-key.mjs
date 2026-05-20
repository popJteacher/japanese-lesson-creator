#!/usr/bin/env node
// scripts/check-imagen-key.mjs
// Phase 4 ① の人間タスク完了確認スクリプト。
// .env の GEMINI_API_KEY（Phase 1 で導入済み）が AI Studio の ListModels を
// 通り、`imagen-4.0-generate-001` 系が一覧に含まれていれば PASS。
//
// 使い方:
//   node scripts/check-imagen-key.mjs
//   npm run check-imagen-key
//
// 成功条件:
//   - ListModels が 200 を返す
//   - 期待 Imagen モデルが models[] に含まれる
//
// 失敗時の典型メッセージと意味:
//   "GEMINI_API_KEY missing"        → .env 未設定（.env.example 参照）
//   "API key not valid" / 400        → 鍵が無効・誤コピペ
//   "permission denied" / 403        → 鍵プロジェクトが Generative Language API 未許可
//   "imagen-4.0-* not in models[]"   → 鍵プロジェクトに Imagen アクセス権がない
//                                      （AI Studio コンソールで Imagen を有効化する）
//
// 注意: このスクリプトは ListModels しか叩かないため、
// 「billing が実際に通って 1 件生成できるか」は検証しない。
// 課金有効化の最終確認は ② のスモーク（実生成 1 件）で行う。

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadEnv } from './lib/sheets-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

const LIST_MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Phase 4 で実利用する想定の Imagen 4 モデル群。
// 既定は GAS と同じ Standard（`imagen-4.0-generate-001`）。
// Fast / Ultra は将来のコスト調整用に把握しておく。
const EXPECTED_IMAGEN_MODELS = [
  'models/imagen-4.0-generate-001',
];
const OPTIONAL_IMAGEN_MODELS = [
  'models/imagen-4.0-fast-generate-001',
  'models/imagen-4.0-ultra-generate-001',
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
  const imagen = names.filter(n => /imagen-4\.0/.test(n));

  console.log('✓ Google AI Studio ListModels OK');
  console.log(`  models total:       ${models.length}`);
  console.log(`  Imagen 4 models:    ${imagen.length}${imagen.length ? ` (${imagen.join(', ')})` : ''}`);

  const missingRequired = EXPECTED_IMAGEN_MODELS.filter(n => !names.includes(n));
  if (missingRequired.length > 0) {
    console.error(`  ✗ 必須 Imagen モデル未検出: ${missingRequired.join(', ')}`);
    console.error('    → AI Studio コンソールでプロジェクトの Imagen アクセスを確認してください');
    process.exit(1);
  }
  console.log(`  ✓ 必須モデル検出:   ${EXPECTED_IMAGEN_MODELS.join(', ')}`);

  const missingOptional = OPTIONAL_IMAGEN_MODELS.filter(n => !names.includes(n));
  if (missingOptional.length > 0) {
    console.warn(`  ⚠ 任意モデル未検出: ${missingOptional.join(', ')}`);
    console.warn('    （Fast / Ultra はコスト調整用。必須ではないので WARN 扱い）');
    if (process.exitCode === undefined) process.exitCode = 2;
  } else {
    console.log(`  ✓ 任意モデル全件検出: ${OPTIONAL_IMAGEN_MODELS.join(', ')}`);
  }

  console.log('');
  console.log('  注: 課金 (billing) の有効化は ListModels では検証されません。');
  console.log('  Phase 4 ② のスモークで実生成 1 件を通して最終確認します。');
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
