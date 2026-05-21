#!/usr/bin/env node
// scripts/backfill-registries.mjs
// Phase 4：Sheet にあって registry に entry が無い id を空 stub で追加する。
//
// 動機:
//   registry-as-canon 規律により registry 未登録の id は generate-audio/images が
//   skip + warning する（sync-registries も "missing" カウントするだけで何もしない）。
//   現状 Sheet は 438 行（416 unique）、registry は audio 84 / image 109 件しか
//   無く、Phase 4 ④⑤⑥ の対象から漏れる。本スクリプトで Sheet ⇄ registry を一致させる。
//
// stub schema:
//   - audio_registry.entries[id] = { audioUrl: null }          ← word_新聞 と同形（最小）
//   - image_registry.entries[id] = {
//       type: 'auto_generated_vocab',
//       word, reading, en,                                      ← Sheet からコピー
//       context: 'vocabulary_{vocab_type}' if vocab_type        ← Sheet vocab_type を prefix
//       firstLesson: int(lessonRef) if lessonRef                ← Sheet lessonRef を int 化
//       usedInLessons: [int(lessonRef)] if lessonRef
//       status: 'pending',                                      ← 一律 pending（後段で上書き）
//       images: [{
//         imageId: '{id}_001', filename: '{id}.png',
//         imageUrl: null, generatedAt: null, regenerate: false
//       }]
//     }
//
// 規律:
//   - 既存 entry は touch しない（idempotent）
//   - vocab_* (14 件 word_/vocab_ 重複) には触らない。命名規則ドリフトは別タスク
//   - 例文 (ex_*) は Sheet に audioId が無いため backfill 対象外
//   - 実行後に `npm run sync-registries` を別途実行すれば status=generated の
//     行で Drive URL が registry に充填される（疎結合）
//
// 使い方:
//   npm run backfill-registries                          # 通常実行（書き込みあり）
//   npm run backfill-registries -- --dry-run             # 統計のみ
//   npm run backfill-registries -- --verbose             # 各追加行を出力
//   npm run backfill-registries -- --only image          # 画像 registry だけ
//   npm run backfill-registries -- --only audio          # 音声 registry だけ

import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEnv,
  createSheetsClient,
  fetchVocabulary,
} from './lib/sheets-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGE_REGISTRY = resolve(ROOT, 'data/master_image_registry.json');
const AUDIO_REGISTRY = resolve(ROOT, 'data/master_audio_registry.json');

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
// audio stub: { audioUrl: null }
// ────────────────────────────────────────────────────────────
function backfillAudio(registry, vocabRows, { verbose }) {
  let added = 0, existed = 0;
  for (const row of vocabRows) {
    const id = String(row.audioId || '').trim();
    if (!id) continue;
    if (registry.entries[id] !== undefined) { existed++; continue; }
    registry.entries[id] = { audioUrl: null };
    if (verbose) console.log(`  + audio: ${id}  (${row.word})`);
    added++;
  }
  return { added, existed };
}

// ────────────────────────────────────────────────────────────
// image stub: 既存 vocab_時計 パターン + word_* キー
// ────────────────────────────────────────────────────────────
function buildImageStub(id, row) {
  const stub = {
    type: 'auto_generated_vocab',
    word: row.word || '',
    reading: row.reading || '',
    en: row.en || '',
  };
  const vocabType = String(row.vocab_type || '').trim();
  if (vocabType) stub.context = `vocabulary_${vocabType}`;
  const lessonRef = String(row.lessonRef || '').trim();
  if (lessonRef && /^\d+$/.test(lessonRef)) {
    const n = parseInt(lessonRef, 10);
    stub.firstLesson = n;
    stub.usedInLessons = [n];
  }
  stub.status = 'pending';
  stub.images = [{
    imageId: `${id}_001`,
    filename: `${id}.png`,
    imageUrl: null,
    generatedAt: null,
    regenerate: false,
  }];
  return stub;
}

function backfillImage(registry, vocabRows, { verbose }) {
  let added = 0, existed = 0;
  for (const row of vocabRows) {
    const id = String(row.imageId || '').trim();
    if (!id) continue;
    if (registry.entries[id] !== undefined) { existed++; continue; }
    registry.entries[id] = buildImageStub(id, row);
    if (verbose) console.log(`  + image: ${id}  (${row.word} / ${row.vocab_type || 'no-type'} / ${row.imageStatus})`);
    added++;
  }
  return { added, existed };
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
      console.log('Usage: node scripts/backfill-registries.mjs [--dry-run] [--verbose] [--only image|audio]');
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

  console.log('===== backfill-registries 開始 =====');
  if (args.dryRun) console.log('  mode: --dry-run（registry には書き込まない）');
  if (args.only) console.log(`  scope: --only ${args.only}`);

  const vocab = await fetchVocabulary(client);
  console.log(`  fetched: Vocabulary ${vocab.rows.length} 行`);

  const today = todayISO();

  if (args.only !== 'audio') {
    console.log('\n--- 画像 registry ---');
    const imageReg = await readJson(IMAGE_REGISTRY);
    const before = Object.keys(imageReg.entries).length;
    const r = backfillImage(imageReg, vocab.rows, args);
    const after = before + r.added;
    const activeCount = Object.values(imageReg.entries)
      .filter((e) => e.status !== 'outdated').length;
    console.log(`  画像: ${r.added} 追加 / ${r.existed} 既存（${before} → ${after}・active=${activeCount}）`);
    if (!args.dryRun) {
      if (imageReg._meta) {
        imageReg._meta.lastUpdated = today;
        imageReg._meta.totalEntries = activeCount;
      }
      await writeJsonAtomic(IMAGE_REGISTRY, imageReg);
      console.log('  ✓ data/master_image_registry.json 書き込み完了');
    }
  }

  if (args.only !== 'image') {
    console.log('\n--- 音声 registry ---');
    const audioReg = await readJson(AUDIO_REGISTRY);
    const before = Object.keys(audioReg.entries).length;
    const r = backfillAudio(audioReg, vocab.rows, args);
    const after = before + r.added;
    // active = status != 'outdated' のエントリ数（missing-assets と同じ規約）
    const activeCount = Object.values(audioReg.entries)
      .filter((e) => e.status !== 'outdated').length;
    console.log(`  音声: ${r.added} 追加 / ${r.existed} 既存（${before} → ${after}・active=${activeCount}）`);
    if (!args.dryRun) {
      if (audioReg._meta) {
        audioReg._meta.lastModified = today;
        audioReg._meta.totalEntries = activeCount;
      }
      await writeJsonAtomic(AUDIO_REGISTRY, audioReg);
      console.log('  ✓ data/master_audio_registry.json 書き込み完了');
    }
  }

  console.log('\n===== backfill-registries 完了 =====');
  if (args.dryRun) console.log('（--dry-run のため registry には書き込んでいない）');
  else console.log('次のステップ: `npm run sync-registries` で status=generated 行の Drive URL を充填');
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
