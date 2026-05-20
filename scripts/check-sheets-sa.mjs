#!/usr/bin/env node
// scripts/check-sheets-sa.mjs
// Phase 2 ① の人間タスク完了確認スクリプト。
// SA JSON が secrets/sheets-sa.json に置かれ、SA メールが Vocabulary シートに
// 共有されていれば、Vocabulary ヘッダー行と先頭 3 行を出力する。
//
// 使い方:
//   node scripts/check-sheets-sa.mjs
//
// 成功条件:
//   - ヘッダー行が表示される（imageId / audioId / imageUrl 等の列が含まれる）
//   - 先頭 3 行のデータが見える
//   - SHEET_SCHEMAS.Vocabulary.required の必須列が揃っている
//
// 失敗時の典型メッセージと意味:
//   "ENOENT: secrets/sheets-sa.json"     → SA JSON を未配置
//   "permission denied" / "403"          → SA メールがシートに共有されていない
//   "API has not been used" / "disabled" → GCP プロジェクトで Sheets API 未有効化
//   "GOOGLE_APPLICATION_CREDENTIALS missing"
//                                        → .env に環境変数を未設定（.env.example 参照）
//   "Sheet ... missing required column(s): ..."
//                                        → Vocabulary シートの列構成が変わった

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  loadEnv,
  createSheetsClient,
  fetchSheet,
  requireColumns,
  SHEET_SCHEMAS,
} from './lib/sheets-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

async function main() {
  await loadEnv(ROOT);
  const client = await createSheetsClient({ rootDir: ROOT });

  // 全行ではなく先頭 4 行だけ取って表示（疎通確認だけが目的）
  const { headers, rows } = await fetchSheet(client, 'Vocabulary', { range: 'Vocabulary!A1:Z4' });
  requireColumns(headers, SHEET_SCHEMAS.Vocabulary.required, 'Vocabulary');

  console.log('✓ Sheets API 疎通 OK');
  console.log(`  spreadsheetId: ${client.spreadsheetId}`);
  console.log(`  credentials:   ${client.credentialsPath}`);
  console.log(`  header (${headers.length} 列): ${headers.slice(0, 12).join(' | ')}${headers.length > 12 ? ' | ...' : ''}`);
  for (let i = 0; i < rows.length; i++) {
    const cells = ['word', 'reading', 'en', 'jlptLevel', 'pos', 'vocab_type']
      .map(col => String(rows[i][col] ?? '').slice(0, 18));
    console.log(`  row ${i + 1}: ${cells.join(' | ')}`);
  }
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
