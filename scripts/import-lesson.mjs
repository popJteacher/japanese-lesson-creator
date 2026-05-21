#!/usr/bin/env node
// import-lesson.mjs — Phase 5 ③
// GAS seedLesson01.gs（seedVocabulary 部のみ）のローカル等価実装。
// data/lesson_NN.json の vocabulary を:
//   (1) data/vocab_catalog.json に追記
//       - 既存 entry → sourceIds / lessonRefs / bySource.lesson_NN に追記
//       - 新規 entry → 通常通り作成
//   (2) data/master_image_registry.json に pending 行追加
//       - 既存 entry → usedInLessons のみ追加（firstLesson / status / images[] は不変）
//       - 新規 entry → status:pending の stub を作成
//   (3) data/master_audio_registry.json に pending 行追加
//       - 既存 entry → 触らない（audioUrl がそのまま）
//       - 新規 entry → { audioUrl: null }
//
// vocab のみ（例文 / sentence_ex_* は Phase 5 ⑤ で実装する）。
//
// 入出力（in-place）:
//   data/lesson_NN.json                       [読み取りのみ]
//   data/vocab_catalog.json                   [読み書き]
//   data/master_image_registry.json           [読み書き]
//   data/master_audio_registry.json           [読み書き]
//
// べき等性（Phase 5 ③ 完了条件）:
//   既に build-catalog 経由で catalog に入っている lesson_01 / lesson_02 に対しては
//   実行しても 0 変更で完了する（差分カウンタ totalDelta === 0 → 書き出しスキップ）。
//
// 使い方:
//   npm run import-lesson -- --lesson 01
//   npm run import-lesson -- --lesson 01 --dry-run

import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CATALOG_PATH = resolve(ROOT, 'data/vocab_catalog.json');
const IMG_PATH = resolve(ROOT, 'data/master_image_registry.json');
const AUD_PATH = resolve(ROOT, 'data/master_audio_registry.json');

// ────────────────────────────────────────────────────────────
// CLI
// ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { lesson: null, dryRun: false, verbose: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--verbose' || a === '-v') args.verbose = true;
    else if (a.startsWith('--lesson=')) args.lesson = a.slice('--lesson='.length);
    else if (a === '--lesson') args.lesson = argv[++i];
    else { console.error('Unknown arg:', a); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`import-lesson.mjs — Phase 5 ③ lesson_NN.json → catalog + registry 配線

使い方:
  --lesson NN     対象課（必須・例: 01）
  --dry-run       差分カウンタのみ表示・書き込みなし
  --verbose       各 entry の追加詳細を表示
  --help

入力:
  data/lesson_NN.json
入出力 (in-place / atomic):
  data/vocab_catalog.json
  data/master_image_registry.json
  data/master_audio_registry.json

vocab のみ。例文 / sentence_* は Phase 5 ⑤ で扱う。
`);
}

// ────────────────────────────────────────────────────────────
// I/O
// ────────────────────────────────────────────────────────────
async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

// catalog は build-catalog.mjs に合わせて末尾改行あり
async function writeJsonAtomic(path, data, { trailingNewline = false } = {}) {
  const tmp = path + '.tmp';
  const body = JSON.stringify(data, null, 2) + (trailingNewline ? '\n' : '');
  await writeFile(tmp, body, 'utf8');
  await rename(tmp, path);
}

// ────────────────────────────────────────────────────────────
// 入力ハーベスト
// ────────────────────────────────────────────────────────────
function dedupKey(word, reading) {
  return `${word}|${reading || ''}`;
}

function harvestVocab(lessonJson) {
  const byPattern = lessonJson?.vocabulary?.byPattern || {};
  const out = [];
  for (const [patternKey, pat] of Object.entries(byPattern)) {
    for (const w of (pat?.words || [])) {
      if (!w.word) continue;
      out.push({ patternKey, ...w });
    }
  }
  return out;
}

// ────────────────────────────────────────────────────────────
// 等価比較（key 順依存。catalog payload は固定順で組むので決定的）
// ────────────────────────────────────────────────────────────
function eq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ────────────────────────────────────────────────────────────
// catalog 更新
// ────────────────────────────────────────────────────────────
function buildCatalogPayload(w) {
  // build-catalog.mjs の addSource() 呼び出しと完全同形（key 順含む）。
  // 既存 catalog 値との JSON 完全一致でべき等判定する。
  return {
    imageId: w.imageId,
    audioId: w.audioId,
    en: w.en,
    jlptLevel: w.jlptLevel,
    vocabType: w.vocabType,
    imageRole: w.imageRole,
    isFirstAppearance: w.isFirstAppearance,
    patternKey: w.patternKey,
  };
}

function updateCatalog(catalog, words, lessonId, stats, { verbose }) {
  const byKey = new Map();
  for (const e of catalog.entries) byKey.set(e.key, e);

  for (const w of words) {
    const key = dedupKey(w.word, w.reading);
    let entry = byKey.get(key);
    let created = false;
    if (!entry) {
      entry = {
        key,
        word: w.word,
        reading: w.reading || '',
        sourceIds: [],
        lessonRefs: [],
        bySource: {},
      };
      catalog.entries.push(entry);
      byKey.set(key, entry);
      stats.newEntry++;
      created = true;
      if (verbose) console.log(`  + catalog new entry: ${key}`);
    }

    let touched = created;

    if (!entry.sourceIds.includes(lessonId)) {
      entry.sourceIds.push(lessonId);
      stats.sourceAdded++;
      touched = true;
    }
    if (!entry.lessonRefs.includes(lessonId)) {
      entry.lessonRefs.push(lessonId);
      stats.lessonRefAdded++;
      touched = true;
    }

    const payload = buildCatalogPayload(w);
    if (!entry.bySource[lessonId]) entry.bySource[lessonId] = [];
    const arr = entry.bySource[lessonId];
    const idx = arr.findIndex(p => p.imageId === payload.imageId);
    if (idx === -1) {
      arr.push(payload);
      stats.payloadAdded++;
      touched = true;
    } else if (!eq(arr[idx], payload)) {
      if (verbose) {
        console.log(`  ~ catalog payload changed: ${key} imageId=${payload.imageId}`);
      }
      arr[idx] = payload;
      stats.payloadUpdated++;
      touched = true;
    }
    if (!touched) stats.unchanged++;
  }

  // build-catalog と同じ並び（key 昇順・ja locale）
  catalog.entries.sort((a, b) => a.key.localeCompare(b.key, 'ja'));
}

// ────────────────────────────────────────────────────────────
// image registry 更新
// ────────────────────────────────────────────────────────────
function updateImageRegistry(imgReg, words, lessonNoInt, stats, { verbose }) {
  if (!imgReg.entries) imgReg.entries = {};
  for (const w of words) {
    if (!w.imageId) { stats.missingImageId++; continue; }
    const existing = imgReg.entries[w.imageId];
    if (existing) {
      if (!Array.isArray(existing.usedInLessons)) existing.usedInLessons = [];
      if (!existing.usedInLessons.includes(lessonNoInt)) {
        existing.usedInLessons.push(lessonNoInt);
        existing.usedInLessons.sort((a, b) => a - b);
        stats.usedInLessonsUpdated++;
        if (verbose) console.log(`  ~ image +usedInLessons[${lessonNoInt}]: ${w.imageId}`);
      } else {
        stats.unchanged++;
      }
      continue;
    }
    const context = w.imageRole
      ? `vocabulary_${w.imageRole.replace(/^vocab_/, '')}`
      : 'vocabulary';
    imgReg.entries[w.imageId] = {
      type: 'auto_generated_vocab',
      word: w.word,
      reading: w.reading || '',
      en: w.en || '',
      context,
      firstLesson: lessonNoInt,
      usedInLessons: [lessonNoInt],
      status: 'pending',
      images: [
        {
          imageId: `${w.imageId}_001`,
          filename: `${w.imageId}.png`,
          imageUrl: null,
          promptRef: `image_prompts_lesson${lessonNoInt}.json#${w.imageId}`,
          generatedAt: null,
          regenerate: false,
        },
      ],
    };
    stats.newEntry++;
    if (verbose) console.log(`  + image new pending: ${w.imageId}`);
  }
}

// ────────────────────────────────────────────────────────────
// audio registry 更新
// ────────────────────────────────────────────────────────────
function updateAudioRegistry(audReg, words, stats, { verbose }) {
  if (!audReg.entries) audReg.entries = {};
  for (const w of words) {
    if (!w.audioId) { stats.missingAudioId++; continue; }
    if (audReg.entries[w.audioId]) {
      stats.unchanged++;
      continue;
    }
    audReg.entries[w.audioId] = { audioUrl: null };
    stats.newEntry++;
    if (verbose) console.log(`  + audio new pending: ${w.audioId}`);
  }
}

// ────────────────────────────────────────────────────────────
// メイン
// ────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.lesson) {
    printHelp();
    process.exit(args.help ? 0 : 2);
  }

  const lessonNN = String(args.lesson).padStart(2, '0');
  const lessonId = `lesson_${lessonNN}`;
  const lessonNoInt = parseInt(lessonNN, 10);
  if (!Number.isFinite(lessonNoInt) || lessonNoInt < 1) {
    console.error(`invalid --lesson value: ${args.lesson}`);
    process.exit(2);
  }

  // 入力
  const lessonPath = resolve(ROOT, `data/lesson_${lessonNN}.json`);
  const lessonJson = await readJson(lessonPath);
  const words = harvestVocab(lessonJson);
  console.log(`${lessonId}: vocabulary ${words.length} entries`);

  // 既存資産
  const catalog = await readJson(CATALOG_PATH);
  const imgReg = await readJson(IMG_PATH);
  const audReg = await readJson(AUD_PATH);

  const stats = {
    catalog: { newEntry: 0, sourceAdded: 0, lessonRefAdded: 0, payloadAdded: 0, payloadUpdated: 0, unchanged: 0 },
    image:   { newEntry: 0, usedInLessonsUpdated: 0, unchanged: 0, missingImageId: 0 },
    audio:   { newEntry: 0, unchanged: 0, missingAudioId: 0 },
  };

  updateCatalog(catalog, words, lessonId, stats.catalog, args);
  updateImageRegistry(imgReg, words, lessonNoInt, stats.image, args);
  updateAudioRegistry(audReg, words, stats.audio, args);

  const totalDelta =
    stats.catalog.newEntry + stats.catalog.sourceAdded + stats.catalog.lessonRefAdded +
    stats.catalog.payloadAdded + stats.catalog.payloadUpdated +
    stats.image.newEntry + stats.image.usedInLessonsUpdated +
    stats.audio.newEntry;

  console.log('\n=== diff ===');
  console.log(`catalog: new=${stats.catalog.newEntry} +sourceId=${stats.catalog.sourceAdded} +lessonRef=${stats.catalog.lessonRefAdded} +payload=${stats.catalog.payloadAdded} ~payload=${stats.catalog.payloadUpdated} unchanged=${stats.catalog.unchanged}`);
  console.log(`image  : new=${stats.image.newEntry} +usedInLessons=${stats.image.usedInLessonsUpdated} unchanged=${stats.image.unchanged}` + (stats.image.missingImageId ? ` (missingImageId=${stats.image.missingImageId})` : ''));
  console.log(`audio  : new=${stats.audio.newEntry} unchanged=${stats.audio.unchanged}` + (stats.audio.missingAudioId ? ` (missingAudioId=${stats.audio.missingAudioId})` : ''));
  console.log(`total delta: ${totalDelta}`);

  if (args.dryRun) {
    console.log('\n--dry-run: 書き出しスキップ');
    return;
  }
  if (totalDelta === 0) {
    console.log('\n変更なし。書き出しスキップ（べき等保証）。');
    return;
  }

  // _meta 更新
  catalog._meta.totals.uniqueEntries = catalog.entries.length;
  catalog._meta.generatedAt = new Date().toISOString();

  const today = new Date().toISOString().slice(0, 10);
  if (imgReg._meta) {
    imgReg._meta.totalEntries = Object.keys(imgReg.entries).length;
    imgReg._meta.lastModified = today;
  }
  if (audReg._meta) {
    audReg._meta.totalEntries = Object.keys(audReg.entries).length;
    audReg._meta.lastModified = today;
  }

  await writeJsonAtomic(CATALOG_PATH, catalog, { trailingNewline: true });
  await writeJsonAtomic(IMG_PATH, imgReg);
  await writeJsonAtomic(AUD_PATH, audReg);
  console.log('\nwrote: catalog + image + audio registries');
}

main().catch(e => { console.error(e); process.exit(1); });
