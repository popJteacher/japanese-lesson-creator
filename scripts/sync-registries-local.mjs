#!/usr/bin/env node
// scripts/sync-registries-local.mjs
// Phase 2 ③：GAS syncAll のローカル等価実装。
// Vocabulary シート → data/master_image_registry.json + data/master_audio_registry.json
// Examples シート   → data/master_audio_registry.json（例文音声）
//
// 仕様は gas/pipeline.gs syncImageRegistry / syncAudioRegistry（line 2833-2929）の逐語再現：
//   - PROTECTED_PREFIXES = ["char_", "ex_L"] / PROTECTED_EXACT = ["world_map"] は上書きしない
//   - imageStatus / audioStatus が "pending" / "failed" / 空 → skip
//   - imageUrl / audioUrl が空 → skip
//   - registry.entries[key] に存在しないキーは skip（registry 側を先に拡張する規律）
//   - entry.images[0].generatedAt は既存値を維持、無ければ今日の日付（YYYY-MM-DD）
//   - entry.status は "approved" を維持、それ以外は imageStatus で上書き
//   - _meta.lastUpdated / lastModified は今日の日付で更新
//
// 出力は atomic write（.tmp 経由 rename）でクラッシュ時の半書きを防ぐ。
// JSON シリアライズは JSON.stringify(data, null, 2) のみ（GAS Drive と一致：LF・末尾改行なし）。
//
// 使い方:
//   npm run sync-registries                          # 通常実行（書き込みあり）
//   npm run sync-registries -- --dry-run             # 統計のみ出力（書き込みなし）
//   npm run sync-registries -- --verbose             # 各 skip 行の理由を出力
//   npm run sync-registries -- --only image          # 画像 registry だけ更新
//   npm run sync-registries -- --only audio          # 音声 registry だけ更新

import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEnv,
  createSheetsClient,
  fetchVocabulary,
  fetchExamples,
} from './lib/sheets-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGE_REGISTRY = resolve(ROOT, 'data/master_image_registry.json');
const AUDIO_REGISTRY = resolve(ROOT, 'data/master_audio_registry.json');

// gas/pipeline.gs line 2819-2820 由来
const PROTECTED_PREFIXES = ['char_', 'ex_L'];
const PROTECTED_EXACT = ['world_map'];

function isProtected(key) {
  if (!key) return false;
  if (PROTECTED_EXACT.includes(key)) return true;
  for (const p of PROTECTED_PREFIXES) if (key.startsWith(p)) return true;
  return false;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJsonAtomic(path, data) {
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, path);
}

// ────────────────────────────────────────────────────────────
// syncImageRegistry 等価
// ────────────────────────────────────────────────────────────
function syncImageRegistry(registry, vocabRows, { verbose }) {
  let updated = 0, skipped = 0, protectedCount = 0, missing = 0;
  for (const row of vocabRows) {
    const imageId = String(row.imageId || '').trim();
    const imageStatus = String(row.imageStatus || '').trim();
    const imageUrl = String(row.imageUrl || '').trim();
    if (!imageId) { skipped++; continue; }
    if (isProtected(imageId)) {
      if (verbose) console.log(`  🛡 protected (skip): ${imageId}`);
      protectedCount++;
      continue;
    }
    if (!imageUrl || imageStatus === 'pending' || imageStatus === 'failed') { skipped++; continue; }
    if (!registry.entries || registry.entries[imageId] === undefined) {
      if (verbose) console.log(`  ⚠️ not in registry: ${imageId}`);
      missing++;
      continue;
    }
    const entry = registry.entries[imageId];
    if (!entry.images || entry.images.length === 0) entry.images = [{}];
    entry.images[0].imageUrl = imageUrl;
    entry.images[0].generatedAt = entry.images[0].generatedAt || todayISO();
    if (entry.status !== 'approved') entry.status = imageStatus;
    updated++;
  }
  if (registry._meta) registry._meta.lastUpdated = todayISO();
  return { updated, skipped, protected: protectedCount, missing };
}

// ────────────────────────────────────────────────────────────
// syncAudioRegistry 等価（Vocabulary 由来 / Examples 由来）
// ────────────────────────────────────────────────────────────
function syncAudioFromVocab(registry, vocabRows, { verbose }) {
  let updated = 0, skipped = 0, protectedCount = 0, missing = 0;
  for (const row of vocabRows) {
    const audioId = String(row.audioId || '').trim();
    const audioStatus = String(row.audioStatus || '').trim();
    const audioUrl = String(row.audioUrl || '').trim();
    if (!audioId) { skipped++; continue; }
    if (isProtected(audioId)) { protectedCount++; continue; }
    if (!audioUrl || audioStatus === 'pending' || audioStatus === 'failed') { skipped++; continue; }
    if (!registry.entries || registry.entries[audioId] === undefined) {
      if (verbose) console.log(`  ⚠️ vocab audio not in registry: ${audioId}`);
      missing++;
      continue;
    }
    registry.entries[audioId].audioUrl = audioUrl;
    updated++;
  }
  return { updated, skipped, protected: protectedCount, missing };
}

function syncAudioFromExamples(registry, exRows, { verbose }) {
  let updated = 0, skipped = 0, protectedCount = 0, missing = 0;
  for (const row of exRows) {
    const id = String(row.id || '').trim();
    const audioStatus = String(row.audioStatus || '').trim();
    const audioUrl = String(row.audioUrl || '').trim();
    if (!id) { skipped++; continue; }
    if (isProtected(id)) { protectedCount++; continue; }
    if (!audioUrl || audioStatus === 'pending' || audioStatus === 'failed') { skipped++; continue; }
    if (!registry.entries || registry.entries[id] === undefined) {
      if (verbose) console.log(`  ⚠️ example audio not in registry: ${id}`);
      missing++;
      continue;
    }
    registry.entries[id].audioUrl = audioUrl;
    updated++;
  }
  return { updated, skipped, protected: protectedCount, missing };
}

// ────────────────────────────────────────────────────────────
// CLI
// ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { dryRun: false, verbose: false, only: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--verbose') args.verbose = true;
    else if (a === '--only') {
      const v = argv[++i];
      if (v !== 'image' && v !== 'audio') {
        console.error(`--only must be "image" or "audio" (got: ${v})`);
        process.exit(2);
      }
      args.only = v;
    } else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/sync-registries-local.mjs [--dry-run] [--verbose] [--only image|audio]');
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  await loadEnv(ROOT);
  const client = await createSheetsClient({ rootDir: ROOT });

  console.log('===== sync-registries-local 開始 =====');
  if (args.dryRun) console.log('  mode: --dry-run（registry には書き込まない）');
  if (args.only) console.log(`  scope: --only ${args.only}`);

  const vocab = await fetchVocabulary(client);
  const ex = await fetchExamples(client);
  console.log(`  fetched: Vocabulary ${vocab.rows.length} 行 / Examples ${ex.rows.length} 行`);

  if (args.only !== 'audio') {
    console.log('\n--- 画像 registry ---');
    const imageReg = await readJson(IMAGE_REGISTRY);
    const r = syncImageRegistry(imageReg, vocab.rows, args);
    console.log(`  画像: ${r.updated} 更新 / ${r.skipped} skip / ${r.protected} protected / ${r.missing} 未登録`);
    if (!args.dryRun) {
      await writeJsonAtomic(IMAGE_REGISTRY, imageReg);
      console.log('  ✓ data/master_image_registry.json 書き込み完了');
    }
  }

  if (args.only !== 'image') {
    console.log('\n--- 音声 registry ---');
    const audioReg = await readJson(AUDIO_REGISTRY);
    const rv = syncAudioFromVocab(audioReg, vocab.rows, args);
    const re = syncAudioFromExamples(audioReg, ex.rows, args);
    console.log(`  音声（語彙）: ${rv.updated} 更新 / ${rv.skipped} skip / ${rv.protected} protected / ${rv.missing} 未登録`);
    console.log(`  音声（例文）: ${re.updated} 更新 / ${re.skipped} skip / ${re.protected} protected / ${re.missing} 未登録`);
    if (audioReg._meta) audioReg._meta.lastModified = todayISO();
    if (!args.dryRun) {
      await writeJsonAtomic(AUDIO_REGISTRY, audioReg);
      console.log('  ✓ data/master_audio_registry.json 書き込み完了');
    }
  }

  console.log('\n===== sync-registries-local 完了 =====');
  if (args.dryRun) console.log('（--dry-run のため registry には書き込んでいない）');
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
