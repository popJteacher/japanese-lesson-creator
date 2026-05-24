#!/usr/bin/env node
// scripts/check-drive-sa.mjs
// Phase α4 ① 入口：master_audio_registry の Drive URL audio を SA が DL できるか smoke test。
//
// 既存 Sheets SA (secrets/sheets-sa.json) を再利用し、Drive API v3 で 1 ファイル
// メタデータ取得 + 実バイト DL を試行する。
//
// 成功時：tmp/drive_smoke/{audioId}.mp3 を書き出し、サイズ等を表示
// 失敗時：典型 status code とその意味を表示し、user に共有設定の指示を出す
//
// 使い方:
//   node scripts/check-drive-sa.mjs              # 先頭 1 件 smoke
//   node scripts/check-drive-sa.mjs --only ID    # 特定 audio ID で smoke

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { google } from 'googleapis';
import { loadEnv } from './lib/sheets-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REGISTRY = resolve(ROOT, 'data/master_audio_registry.json');
const OUT_DIR = resolve(ROOT, 'tmp/drive_smoke');

function parseArgs(argv) {
  const args = { only: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') args.only = argv[++i];
    else if (a.startsWith('--only=')) args.only = a.slice(7);
    else { console.error('Unknown arg:', a); process.exit(2); }
  }
  return args;
}

function extractFileId(url) {
  if (!url || typeof url !== 'string') return null;
  // 受容パターン: /uc?id=XXX / /file/d/XXX / /open?id=XXX
  const m = url.match(/[?&]id=([^&]+)|\/d\/([^\/?]+)|\/file\/d\/([^\/?]+)/);
  if (!m) return null;
  return m[1] || m[2] || m[3] || null;
}

async function main() {
  const args = parseArgs(process.argv);
  await loadEnv(ROOT);

  const credsRel = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credsRel) {
    console.error('✗ GOOGLE_APPLICATION_CREDENTIALS が .env に未設定');
    process.exit(1);
  }
  const credsAbs = resolve(ROOT, credsRel);
  try { await readFile(credsAbs, 'utf8'); }
  catch (e) {
    console.error(`✗ SA JSON が読めない: ${credsAbs}\n  ${e.message}`);
    process.exit(1);
  }
  // SA email を抽出（user 通知用）
  const saJson = JSON.parse(await readFile(credsAbs, 'utf8'));
  const saEmail = saJson.client_email || '(unknown)';

  // registry から Drive URL entry を取得
  const reg = JSON.parse(await readFile(REGISTRY, 'utf8'));
  const entries = reg.entries || {};
  const driveIds = Object.entries(entries)
    .filter(([_, v]) => v && typeof v.audioUrl === 'string' && v.audioUrl.includes('drive.google.com'));
  let target;
  if (args.only) {
    const found = driveIds.find(([id]) => id === args.only);
    if (!found) {
      console.error(`✗ --only ${args.only} は registry の Drive URL entry に見つからない`);
      process.exit(1);
    }
    target = found;
  } else {
    target = driveIds[0];
  }
  if (!target) {
    console.error('✗ registry に Drive URL の audio entry が無い');
    process.exit(1);
  }
  const [audioId, entry] = target;
  const fileId = extractFileId(entry.audioUrl);
  if (!fileId) {
    console.error(`✗ ${audioId}: audioUrl から fileId 抽出失敗: ${entry.audioUrl}`);
    process.exit(1);
  }

  console.log('===== Drive SA smoke test =====');
  console.log(`  SA email      : ${saEmail}`);
  console.log(`  target audio  : ${audioId}`);
  console.log(`  source url    : ${entry.audioUrl}`);
  console.log(`  file id       : ${fileId}`);
  console.log(`  total Drive  : ${driveIds.length} (α4 全件対象)`);
  console.log('');

  const scope = 'https://www.googleapis.com/auth/drive.readonly';
  const auth = new google.auth.GoogleAuth({ keyFile: credsAbs, scopes: [scope] });
  const drive = google.drive({ version: 'v3', auth });

  // Step 1: metadata
  console.log('Step 1: drive.files.get (metadata) ...');
  let meta;
  try {
    const r = await drive.files.get({ fileId, fields: 'id,name,size,mimeType,owners(emailAddress)' });
    meta = r.data;
    console.log(`  ✓ name=${meta.name} size=${meta.size}B mime=${meta.mimeType}`);
    if (Array.isArray(meta.owners)) {
      console.log(`  owners        : ${meta.owners.map(o => o.emailAddress).join(', ')}`);
    }
  } catch (e) {
    const code = e?.code || e?.response?.status;
    console.error(`  ✗ metadata 失敗 (status ${code}): ${e.message}`);
    diagnose(code, saEmail);
    process.exit(1);
  }

  // Step 2: download bytes
  console.log('\nStep 2: drive.files.get (alt=media) ...');
  try {
    const r = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    const buf = Buffer.from(r.data);
    await mkdir(OUT_DIR, { recursive: true });
    const outPath = resolve(OUT_DIR, `${audioId}.mp3`);
    await writeFile(outPath, buf);
    console.log(`  ✓ DL ${buf.length}B → tmp/drive_smoke/${audioId}.mp3`);
    if (Number(meta.size || 0) > 0 && buf.length !== Number(meta.size)) {
      console.warn(`  ⚠ size mismatch: meta=${meta.size} actual=${buf.length}`);
    }
  } catch (e) {
    const code = e?.code || e?.response?.status;
    console.error(`  ✗ download 失敗 (status ${code}): ${e.message}`);
    diagnose(code, saEmail);
    process.exit(1);
  }

  console.log('\n===== smoke PASS =====');
  console.log('一括 DL pipeline を実装可能。次は scripts/download-drive-audio.mjs を作る。');
}

function diagnose(status, saEmail) {
  switch (Number(status)) {
    case 403:
      console.error('  → SA がファイルにアクセス権を持っていない。Drive 側で対象ファイル（または親フォルダ）を SA メールに「閲覧者」共有してください:');
      console.error(`    ${saEmail}`);
      console.error('    ※ 親フォルダごと共有すれば 291 件すべて一括アクセス可能');
      break;
    case 404:
      console.error('  → fileId に対応するファイルが見つからない。URL pattern を確認');
      break;
    case 401:
      console.error('  → 認証失敗。SA JSON の有効期限・無効化を確認');
      break;
    case 429:
      console.error('  → Drive API レート上限。一括 DL pipeline ではスロットリング必要');
      break;
    default:
      console.error('  → 想定外。GCP プロジェクトで Drive API が有効化されているか確認');
  }
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
