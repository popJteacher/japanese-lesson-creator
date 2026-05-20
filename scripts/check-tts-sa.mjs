#!/usr/bin/env node
// scripts/check-tts-sa.mjs
// Phase 3 ① の人間タスク完了確認スクリプト。
// secrets/sheets-sa.json（Phase 2 流用 SA）に Cloud Text-to-Speech 呼び出し権限が
// 付与されていれば、ja-JP の声一覧と Neural2 検出結果が出る。
//
// 使い方:
//   node scripts/check-tts-sa.mjs
//   npm run check-tts-sa
//
// 成功条件:
//   - ja-JP のボイスが 1 件以上一覧される
//   - 期待 Neural2 ボイスが含まれている
//
// 失敗時の典型メッセージと意味:
//   "ENOENT: secrets/sheets-sa.json"      → SA JSON を未配置
//   "permission denied" / "403"           → SA に Cloud TTS の呼び出し権限なし
//                                           （GCP IAM で roles/texttospeech.user 追加）
//   "API has not been used" / "disabled"  → GCP で Cloud TTS API 未有効化
//                                           （GAS 時代から有効化済みのはず・要確認）
//   "GOOGLE_APPLICATION_CREDENTIALS missing"
//                                         → .env 未設定（.env.example 参照）

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { google } from 'googleapis';
import { loadEnv } from './lib/sheets-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

// Phase 3 で実利用する想定の Neural2 ボイス（GAS generateAudioBatch と
// 同じ系統。最終的に ②／③ で固定する。ここでは存在確認のみ）。
const EXPECTED_NEURAL2_VOICES = [
  'ja-JP-Neural2-B',
  'ja-JP-Neural2-C',
  'ja-JP-Neural2-D',
];

async function main() {
  await loadEnv(ROOT);

  const credsRel = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credsRel) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS missing (set in .env; .env.example 参照)');
  }
  const absCreds = resolve(ROOT, credsRel);
  await readFile(absCreds, 'utf8');

  const auth = new google.auth.GoogleAuth({
    keyFile: absCreds,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const tts = google.texttospeech({ version: 'v1', auth });

  const resp = await tts.voices.list({ languageCode: 'ja-JP' });
  const voices = resp.data.voices || [];
  if (voices.length === 0) {
    throw new Error('voices.list returned 0 voices for ja-JP (API は通っているが応答が空)');
  }

  const names = voices.map(v => v.name).sort();
  const neural2 = names.filter(n => n.includes('Neural2'));

  console.log('✓ Cloud TTS API 疎通 OK');
  console.log(`  credentials:        ${absCreds}`);
  console.log(`  ja-JP voices total: ${voices.length}`);
  console.log(`  Neural2 voices:     ${neural2.length}${neural2.length ? ` (${neural2.join(', ')})` : ''}`);

  const missing = EXPECTED_NEURAL2_VOICES.filter(n => !names.includes(n));
  if (missing.length > 0) {
    console.warn(`  ⚠ 期待ボイス未検出: ${missing.join(', ')}`);
    process.exitCode = 2;
  } else {
    console.log(`  ✓ 期待ボイス全件検出: ${EXPECTED_NEURAL2_VOICES.join(', ')}`);
  }
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
