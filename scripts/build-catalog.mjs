#!/usr/bin/env node
// build-catalog.mjs — Phase 5 ②
// data/sources/goi_list_raw.json と既存 data/lesson_NN.json の vocabulary を
// 一つの source-agnostic な vocab_catalog.json にマージする。
//
// 設計（CLAUDE.md / NEXT_ACTIONS.md Phase 5 ② に準拠）:
//   - dedup キー    : `${word}|${reading}`
//   - sourceIds[]   : この entry に寄与した source の ID 集合（重複時は和集合）
//   - lessonRefs[]  : この entry が登場する課（lesson_NN）の集合
//   - bySource      : 各 source 固有のメタを ID をキーにした配列で保持
//                     goi_list_raw は同一 word+reading が複数 jlpt level に重複し得る（413 件）
//                     ため配列で受ける。lesson_NN も将来複数同 word が出る可能性を考えて配列
//
// 入力:
//   data/sources/goi_list_raw.json             — Phase 5 ① 出力（17,908 entries）
//   data/lesson_01.json, data/lesson_02.json   — 既存 lesson の vocabulary.byPattern[*].words[*]
//
// 出力:
//   data/vocab_catalog.json
//
// 整合性チェック:
//   - lesson_NN の全 word+reading が catalog の entries に含まれていること
//   - 同 key で goi_list_raw 由来の jlpt と lesson 側 jlptLevel が食い違う場合は WARN
//
// 使い方:
//   node scripts/build-catalog.mjs               # 既定で書き出し
//   node scripts/build-catalog.mjs --dry-run     # 集計のみ
//   node scripts/build-catalog.mjs --verbose

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SCHEMA_VERSION = '1.0';
const SOURCE_GOI = 'goi_list_raw';
const LESSON_IDS = ['lesson_01', 'lesson_02'];

function parseArgs(argv) {
  const args = { dryRun: false, verbose: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--verbose' || a === '-v') args.verbose = true;
    else { console.error('Unknown arg:', a); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`build-catalog.mjs — Phase 5 ② vocab_catalog 構築

使い方:
  --dry-run   集計のみ。書き出しなし
  --verbose   ソース別件数・WARN 詳細を表示
  --help

入力:
  data/sources/goi_list_raw.json
  data/lesson_01.json, data/lesson_02.json

出力:
  data/vocab_catalog.json
`);
}

function dedupKey(word, reading) {
  return `${word}|${reading || ''}`;
}

async function loadGoiList() {
  const path = resolve(ROOT, 'data/sources/goi_list_raw.json');
  const json = JSON.parse(await readFile(path, 'utf8'));
  return { path, json };
}

async function loadLesson(lessonId) {
  const nn = lessonId.replace('lesson_', '');
  const path = resolve(ROOT, `data/lesson_${nn}.json`);
  const json = JSON.parse(await readFile(path, 'utf8'));
  const byPattern = json?.vocabulary?.byPattern || {};
  const words = [];
  for (const [patternKey, pat] of Object.entries(byPattern)) {
    for (const w of (pat?.words || [])) {
      words.push({ patternKey, ...w });
    }
  }
  return { path, lessonId, words };
}

function pushEntry(catalog, key, word, reading) {
  let e = catalog.get(key);
  if (!e) {
    e = {
      key,
      word,
      reading: reading || '',
      sourceIds: [],
      lessonRefs: [],
      bySource: {},
    };
    catalog.set(key, e);
  }
  return e;
}

function addSource(entry, sourceId, payload) {
  if (!entry.sourceIds.includes(sourceId)) entry.sourceIds.push(sourceId);
  if (!entry.bySource[sourceId]) entry.bySource[sourceId] = [];
  entry.bySource[sourceId].push(payload);
}

function addLessonRef(entry, lessonId) {
  if (!entry.lessonRefs.includes(lessonId)) entry.lessonRefs.push(lessonId);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); return; }

  const catalog = new Map(); // key → entry
  const warnings = [];

  // ── ソース ①: goi_list_raw ────────────────────────────────
  const goi = await loadGoiList();
  const goiEntries = goi.json?.entries || [];
  for (const e of goiEntries) {
    const word = e.word;
    const reading = e.reading || '';
    if (!word) continue;
    const key = dedupKey(word, reading);
    const entry = pushEntry(catalog, key, word, reading);
    addSource(entry, SOURCE_GOI, {
      no: e.no,
      level: e.level,
      jlpt: e.jlpt,
      pos1: e.pos1,
      pos: e.pos,
      pos2: e.pos2,
      goiShurui: e.goiShurui,
      readingRaw: e.readingRaw,
    });
  }

  // ── ソース ②〜: lesson_NN ─────────────────────────────────
  const lessonsLoaded = [];
  for (const lessonId of LESSON_IDS) {
    const l = await loadLesson(lessonId);
    lessonsLoaded.push(l);
    for (const w of l.words) {
      const word = w.word;
      const reading = w.reading || '';
      if (!word) continue;
      const key = dedupKey(word, reading);
      const entry = pushEntry(catalog, key, word, reading);
      addSource(entry, lessonId, {
        imageId: w.imageId,
        audioId: w.audioId,
        en: w.en,
        jlptLevel: w.jlptLevel,
        vocabType: w.vocabType,
        imageRole: w.imageRole,
        isFirstAppearance: w.isFirstAppearance,
        patternKey: w.patternKey,
      });
      addLessonRef(entry, lessonId);

      // 整合性: lesson 側 jlptLevel と goi_list 側 jlpt の不一致を WARN
      const goiPayloads = entry.bySource[SOURCE_GOI] || [];
      if (goiPayloads.length > 0 && w.jlptLevel) {
        const goiJlpts = [...new Set(goiPayloads.map(p => p.jlpt).filter(Boolean))];
        if (goiJlpts.length > 0 && !goiJlpts.includes(w.jlptLevel)) {
          warnings.push({
            type: 'jlpt_mismatch',
            key, word, reading,
            lesson: lessonId,
            lessonJlpt: w.jlptLevel,
            goiJlpts,
          });
        }
      }
    }
  }

  // ── 整合性: lesson の全 word+reading が catalog にあるか ─────
  const lessonCoverage = { covered: 0, missing: [] };
  for (const l of lessonsLoaded) {
    for (const w of l.words) {
      const key = dedupKey(w.word, w.reading);
      const e = catalog.get(key);
      if (e && e.lessonRefs.includes(l.lessonId)) lessonCoverage.covered++;
      else lessonCoverage.missing.push({ lessonId: l.lessonId, key, word: w.word, reading: w.reading });
    }
  }

  // ── 整理して出力 ────────────────────────────────────────
  const entries = [...catalog.values()];
  entries.sort((a, b) => a.key.localeCompare(b.key, 'ja'));

  const perSource = {
    [SOURCE_GOI]: goiEntries.length,
  };
  for (const l of lessonsLoaded) perSource[l.lessonId] = l.words.length;

  const out = {
    _meta: {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      generator: 'scripts/build-catalog.mjs',
      sources: [
        { id: SOURCE_GOI, path: 'data/sources/goi_list_raw.json' },
        ...lessonsLoaded.map(l => ({ id: l.lessonId, path: `data/lesson_${l.lessonId.replace('lesson_', '')}.json` })),
      ],
      totals: {
        uniqueEntries: entries.length,
        perSourceInput: perSource,
        warnings: warnings.length,
        lessonCoverageOk: lessonCoverage.missing.length === 0,
      },
    },
    entries,
  };

  // ── ログ ──────────────────────────────────────────────
  console.log(`unique entries: ${entries.length}`);
  console.log(`per source input:`);
  for (const [k, v] of Object.entries(perSource)) console.log(`  ${k}: ${v}`);
  console.log(`lesson coverage: ${lessonCoverage.covered} covered, ${lessonCoverage.missing.length} missing`);
  if (lessonCoverage.missing.length > 0) {
    console.error('  MISSING (lesson word+reading not in catalog):');
    for (const m of lessonCoverage.missing) {
      console.error(`    [${m.lessonId}] ${m.word}(${m.reading})`);
    }
  }
  console.log(`warnings: ${warnings.length}`);
  if (args.verbose && warnings.length > 0) {
    for (const w of warnings) {
      console.log(`  [${w.type}] ${w.lesson} ${w.word}(${w.reading}): lesson=${w.lessonJlpt} vs goi=[${w.goiJlpts.join(',')}]`);
    }
  }

  if (args.dryRun) {
    console.log('\n--dry-run: 書き出しスキップ');
    return;
  }

  const outPath = resolve(ROOT, 'data/vocab_catalog.json');
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nwrote: ${outPath}`);

  if (lessonCoverage.missing.length > 0) {
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
