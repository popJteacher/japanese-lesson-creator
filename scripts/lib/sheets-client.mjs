// scripts/lib/sheets-client.mjs
// Phase 2 ②：Sheets API ローカル読み出しクライアント。
// gas/pipeline.gs の syncAll が SpreadsheetApp で読んでいた範囲をローカルで等価に読む。
//
// 公開 API:
//   loadEnv(rootDir)              .env を process.env に流し込む（Phase 1 と同じ minimal loader）
//   createSheetsClient(opts)      認証込みの sheets v4 クライアントを返す
//   fetchSheet(client, sheetName) ヘッダー＋全行を { headers, rows } で返す
//                                 rows は { headerName: cellValue, ... } の配列
//   requireColumns(headers, req, sheetName)  必須列の不在をエラーにする
//   SHEET_SCHEMAS                 syncAll が依存する必須列の宣言

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { google } from 'googleapis';

// ────────────────────────────────────────────────────────────
// SYNC_SETTINGS と等価の宣言（gas/pipeline.gs line 2811-2820 由来）
// ────────────────────────────────────────────────────────────
export const SHEET_SCHEMAS = {
  Vocabulary: {
    required: ['imageId', 'imageStatus', 'imageUrl', 'audioId', 'audioStatus', 'audioUrl'],
  },
  Examples: {
    required: ['id', 'audioStatus', 'audioUrl'],
  },
};

// ────────────────────────────────────────────────────────────
// .env minimal loader（Phase 1 scripts/classify-and-translate.mjs と同形式）
// ────────────────────────────────────────────────────────────
export async function loadEnv(rootDir) {
  const envPath = resolve(rootDir, '.env');
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

// ────────────────────────────────────────────────────────────
// 認証クライアント生成
//   keyFile / spreadsheetId / readOnly を opts で受け取る（テスタビリティのため）
//   未指定なら process.env から拾う
// ────────────────────────────────────────────────────────────
export async function createSheetsClient({ rootDir, keyFile, spreadsheetId, readOnly = true } = {}) {
  const credsRel = keyFile || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const ssId = spreadsheetId || process.env.SHEETS_SPREADSHEET_ID;
  if (!credsRel) throw new Error('GOOGLE_APPLICATION_CREDENTIALS missing (set in .env or pass keyFile)');
  if (!ssId) throw new Error('SHEETS_SPREADSHEET_ID missing (set in .env or pass spreadsheetId)');

  const absCreds = rootDir ? resolve(rootDir, credsRel) : resolve(credsRel);
  // 早期に存在確認（googleapis のエラーは分かりにくいため）
  await readFile(absCreds, 'utf8');

  const scope = readOnly
    ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
    : 'https://www.googleapis.com/auth/spreadsheets';
  const auth = new google.auth.GoogleAuth({ keyFile: absCreds, scopes: [scope] });
  const sheets = google.sheets({ version: 'v4', auth });

  return { sheets, spreadsheetId: ssId, credentialsPath: absCreds };
}

// ────────────────────────────────────────────────────────────
// シート 1 枚の全行取得
//   戻り値: { headers: string[], rows: Array<Record<string,string>>, raw: string[][] }
//   - raw は ヘッダー除外の生 2 次元配列
//   - rows[i][headerName] でアクセスできる連想配列形式
//   - 空セルは空文字列に正規化（GAS の getValues() と挙動を合わせる）
// ────────────────────────────────────────────────────────────
export async function fetchSheet(client, sheetName, { range } = {}) {
  const { sheets, spreadsheetId } = client;
  const targetRange = range || `${sheetName}!A1:ZZ`;
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: targetRange,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const values = resp.data.values || [];
  if (values.length === 0) {
    return { headers: [], rows: [], raw: [] };
  }
  const headers = values[0].map(h => String(h ?? '').trim());
  const dataRows = values.slice(1);
  const rows = dataRows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      const cell = row[i];
      obj[headers[i]] = cell === undefined || cell === null ? '' : String(cell);
    }
    return obj;
  });
  return { headers, rows, raw: dataRows };
}

// ────────────────────────────────────────────────────────────
// 必須列の検証
//   schema/SHEET_SCHEMAS のキーと一致しない場合に「どの列が足りないか」を含む明確なエラーを投げる
// ────────────────────────────────────────────────────────────
export function requireColumns(headers, required, sheetName) {
  const missing = required.filter(c => !headers.includes(c));
  if (missing.length === 0) return;
  throw new Error(
    `Sheet "${sheetName}" is missing required column(s): ${missing.join(', ')}\n` +
    `  actual headers: ${headers.join(' | ')}`,
  );
}

// ────────────────────────────────────────────────────────────
// 高レベル API：宣言済みスキーマと共に読む
// ────────────────────────────────────────────────────────────
export async function fetchVocabulary(client) {
  const result = await fetchSheet(client, 'Vocabulary');
  requireColumns(result.headers, SHEET_SCHEMAS.Vocabulary.required, 'Vocabulary');
  return result;
}

export async function fetchExamples(client) {
  const result = await fetchSheet(client, 'Examples');
  requireColumns(result.headers, SHEET_SCHEMAS.Examples.required, 'Examples');
  return result;
}
