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
//
// 失敗時の典型メッセージと意味:
//   "ENOENT: secrets/sheets-sa.json"     → SA JSON を未配置
//   "permission denied" / "403"          → SA メールがシートに共有されていない
//   "API has not been used" / "disabled" → GCP プロジェクトで Sheets API 未有効化
//   "GOOGLE_APPLICATION_CREDENTIALS missing in .env"
//                                        → .env に環境変数を未設定（.env.example 参照）

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

async function loadEnv() {
  const envPath = resolve(ROOT, '.env');
  try {
    const raw = await readFile(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
      if (!m) continue;
      const [, key, val] = m;
      if (process.env[key] === undefined) {
        process.env[key] = val.replace(/^["']|["']$/g, '');
      }
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

async function main() {
  await loadEnv();

  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;
  if (!credsPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS missing in .env');
  if (!spreadsheetId) throw new Error('SHEETS_SPREADSHEET_ID missing in .env');

  const absCreds = resolve(ROOT, credsPath);
  // 早期に存在確認（googleapis のエラーは分かりにくいため）
  await readFile(absCreds, 'utf8');

  const auth = new google.auth.GoogleAuth({
    keyFile: absCreds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Vocabulary!A1:Z4',
  });

  const rows = resp.data.values || [];
  if (rows.length === 0) {
    console.error('✗ 取得できたが行が 0 件。Vocabulary シートが空か別名の可能性。');
    process.exit(2);
  }

  console.log('✓ Sheets API 疎通 OK');
  console.log(`  spreadsheetId: ${spreadsheetId}`);
  console.log(`  credentials:   ${absCreds}`);
  console.log(`  header (${rows[0].length} 列): ${rows[0].slice(0, 12).join(' | ')}${rows[0].length > 12 ? ' | ...' : ''}`);
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].slice(0, 6).map(c => String(c).slice(0, 18));
    console.log(`  row ${i}: ${cells.join(' | ')}`);
  }
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
