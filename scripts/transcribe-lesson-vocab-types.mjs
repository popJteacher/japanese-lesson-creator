#!/usr/bin/env node
// transcribe-lesson-vocab-types.mjs — Phase 5 ④ Q2 A (worktree 専属・決定論)
//
// data/vocab_types_lesson{NN}.json の vocab_type を data/vocab_catalog.json の
// 該当 entry に転写する。Gemini 等の API は一切呼ばない（main 専属の Q2 B
// `scripts/classify-and-translate.mjs` とは別経路）。
//
// マッチング: dedupKey = `${word}|${reading}`（build-catalog.mjs と同一定義）
//
// 入力:
//   data/vocab_types_lesson*.json   — 存在するもののみ自動 discover
//   data/vocab_catalog.json
//
// 出力:
//   data/vocab_catalog.json         — 該当 entry に vocab_type 追記
//
// 安全性:
//   - 入力 vocab_types JSON の各 entry が catalog で見つからなければ ABORT
//   - catalog entry に既に異なる vocab_type が入っていれば ABORT（drift 検知）
//   - 同じ vocab_type なら no-op（idempotent）
//
// 使い方:
//   node scripts/transcribe-lesson-vocab-types.mjs               # 書き出しあり
//   node scripts/transcribe-lesson-vocab-types.mjs --dry-run     # 集計のみ
//   node scripts/transcribe-lesson-vocab-types.mjs --verbose

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

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
  console.log(`transcribe-lesson-vocab-types.mjs — Phase 5 ④ Q2 A
data/vocab_types_lesson*.json の vocab_type を data/vocab_catalog.json に転写。

Options:
  --dry-run   書き出しなし。集計のみ
  --verbose   per-entry 詳細を表示
  --help`);
}

function dedupKey(word, reading) {
  return `${word}|${reading || ''}`;
}

async function discoverVocabTypeFiles() {
  const dir = resolve(ROOT, 'data');
  const files = await readdir(dir);
  return files
    .filter(f => /^vocab_types_lesson\d+\.json$/.test(f))
    .sort()
    .map(f => resolve(dir, f));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); return; }

  const vtFiles = await discoverVocabTypeFiles();
  if (vtFiles.length === 0) {
    console.error('ABORT: data/vocab_types_lesson*.json が見つかりません');
    process.exit(1);
  }
  console.log(`discovered: ${vtFiles.length} vocab_types JSON file(s)`);
  for (const f of vtFiles) console.log(`  ${f.replace(ROOT + '\\', '').replace(ROOT + '/', '')}`);

  const catalogPath = resolve(ROOT, 'data/vocab_catalog.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const byKey = new Map();
  for (const e of catalog.entries) byKey.set(e.key, e);
  console.log(`catalog: ${catalog.entries.length} entries`);

  const stats = { transcribed: 0, alreadyCorrect: 0, conflicts: [], missing: [] };

  for (const vtFile of vtFiles) {
    const vt = JSON.parse(await readFile(vtFile, 'utf8'));
    const entries = vt.vocabulary || vt.entries || [];
    if (entries.length === 0) {
      console.error(`  WARN: ${vtFile}: vocabulary が空`);
      continue;
    }
    for (const v of entries) {
      const key = dedupKey(v.word, v.reading);
      const ce = byKey.get(key);
      if (!ce) {
        stats.missing.push({ file: vtFile, key, word: v.word, reading: v.reading });
        continue;
      }
      if (!v.vocab_type) {
        console.error(`  WARN: ${key}: vocab_type が source に無い（skip）`);
        continue;
      }
      if (ce.vocab_type && ce.vocab_type !== v.vocab_type) {
        stats.conflicts.push({
          key,
          existing: ce.vocab_type,
          incoming: v.vocab_type,
          source: vtFile,
        });
        continue;
      }
      if (ce.vocab_type === v.vocab_type) {
        stats.alreadyCorrect++;
        if (args.verbose) console.log(`  = ${key}: ${v.vocab_type} (already)`);
        continue;
      }
      ce.vocab_type = v.vocab_type;
      stats.transcribed++;
      if (args.verbose) console.log(`  + ${key}: ${v.vocab_type}`);
    }
  }

  console.log('');
  console.log(`transcribed:    ${stats.transcribed}`);
  console.log(`alreadyCorrect: ${stats.alreadyCorrect}`);
  console.log(`conflicts:      ${stats.conflicts.length}`);
  console.log(`missing:        ${stats.missing.length}`);

  if (stats.missing.length > 0) {
    console.error('\nMISSING (vocab_types entry が catalog に無い):');
    for (const m of stats.missing) {
      console.error(`  [${m.file}] ${m.word}(${m.reading})`);
    }
  }
  if (stats.conflicts.length > 0) {
    console.error('\nCONFLICT (catalog の既存 vocab_type と不一致):');
    for (const c of stats.conflicts) {
      console.error(`  ${c.key}: catalog=${c.existing} vs incoming=${c.incoming} (${c.source})`);
    }
  }

  if (stats.missing.length > 0 || stats.conflicts.length > 0) {
    console.error('\nABORT: 不整合があるため書き出しません');
    process.exit(1);
  }

  if (args.dryRun) {
    console.log('\n--dry-run: 書き出しスキップ');
    return;
  }

  if (stats.transcribed === 0) {
    console.log('\n(no changes — catalog 既に最新)');
    return;
  }

  await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log(`\nwrote: ${catalogPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
