#!/usr/bin/env node
// scripts/lib/lesson-fill-vocab.mjs
//
// /lesson-fill-vocab NN の本体。data/lesson_NN.json の
// vocabulary.byPattern[*].words[] に対して 2 種類の補完を行う：
//
//   (1) 既習語彙 (inheritance) マーク
//       - 過去課 (lesson_XX.json で XX < NN) に同じ (word, reading) が
//         登場していれば:
//           isFirstAppearance: false
//           _inheritedFromLessonX: "lesson_XX"   (最初に登場した課)
//
//   (2) jlptLevel の自動補完
//       - 既存値が "TODO" / 未定義 / enum 外なら vocab_catalog.json を引いて
//         埋める。bySource[*].jlpt の **最初に見つかった** 値を採用 (複数
//         source が disagree する場合は user 判断に委ねるため fill しない)。
//       - 既存値が N5-N1 のいずれかなら**上書きしない** (人間判断を尊重)。
//
// 動作モード:
//   --dry-run (default)  差分を表示するだけ。書き込まない。
//   --apply              data/lesson_NN.json を直接上書きする。
//
// 使い方:
//   node scripts/lib/lesson-fill-vocab.mjs --no NN [--apply] [--json]
//
// 終了コード: 補完候補が見つかった件数 > 0 なら 0、エラー時 1/2

import fs from "node:fs";
import path from "node:path";

const JLPT_ENUM = ["N5", "N4", "N3", "N2", "N1"];
const TODO_RE = /TODO[_: ]|^TODO$/;

function parseArgs(argv) {
  const args = { no: null, apply: false, asJson: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--apply") args.apply = true;
    else if (a === "--dry-run") args.apply = false;
    else if (a === "--json") args.asJson = true;
    else if (a === "--no") args.no = parseInt(argv[++i], 10);
    else if (a.startsWith("--no=")) args.no = parseInt(a.slice(5), 10);
    else { console.error(`unknown arg: ${a}`); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`/lesson-fill-vocab helper

  --no NN     対象課 (1-99)。必須。
  --apply     ファイルを上書き (既定: dry-run)
  --dry-run   差分のみ表示 (既定)
  --json      JSON 出力
  --help      このヘルプ
`);
}

function zeroPad(n) { return String(n).padStart(2, "0"); }

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// 過去課全体から (word|reading) → 最初に登場した課番号 を作る
function buildInheritanceIndex(targetNo) {
  const dataDir = "data";
  const re = /^lesson_(\d{2})\.json$/;
  const files = fs.readdirSync(dataDir)
    .map((n) => n.match(re))
    .filter((m) => m !== null)
    .map((m) => ({ no: parseInt(m[1], 10), file: m[0] }))
    .filter((x) => x.no < targetNo)
    .sort((a, b) => a.no - b.no);

  const idx = new Map();
  for (const { no, file } of files) {
    const doc = loadJson(path.join(dataDir, file));
    const byPattern = (doc.vocabulary && doc.vocabulary.byPattern) || {};
    for (const [group, g] of Object.entries(byPattern)) {
      if (group.startsWith("_") || !Array.isArray(g.words)) continue;
      for (const w of g.words) {
        const key = `${w.word}|${w.reading}`;
        if (!idx.has(key)) idx.set(key, { lesson: `lesson_${zeroPad(no)}`, no });
      }
    }
  }
  return idx;
}

// vocab_catalog から (word|reading) → 「source 横断で見つかった jlpt 集合」
function buildCatalogIndex() {
  const p = "data/vocab_catalog.json";
  if (!fs.existsSync(p)) {
    console.error(`vocab_catalog not found at ${p}`);
    return new Map();
  }
  const cat = loadJson(p);
  const idx = new Map();
  for (const e of cat.entries || []) {
    const key = `${e.word}|${e.reading}`;
    const jlpts = new Set();
    for (const arr of Object.values(e.bySource || {})) {
      for (const rec of arr) { if (rec.jlpt) jlpts.add(rec.jlpt); }
    }
    idx.set(key, [...jlpts]);
  }
  return idx;
}

function needsJlptFill(value) {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string") return true;
  if (TODO_RE.test(value)) return true;
  if (!JLPT_ENUM.includes(value)) return true;
  return false;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); process.exit(0); }
  if (args.no === null || Number.isNaN(args.no) || args.no < 1 || args.no > 99) {
    console.error("--no NN (1-99) は必須"); printHelp(); process.exit(2);
  }
  const targetPath = `data/lesson_${zeroPad(args.no)}.json`;
  if (!fs.existsSync(targetPath)) { console.error(`lesson file not found: ${targetPath}`); process.exit(2); }

  const doc = loadJson(targetPath);
  const inheritIdx = buildInheritanceIndex(args.no);
  const catIdx = buildCatalogIndex();

  const changes = []; // {group, word, reading, field, before, after, reason}
  const skipped = []; // {word, reading, reason}

  const byPattern = (doc.vocabulary && doc.vocabulary.byPattern) || {};
  for (const [group, g] of Object.entries(byPattern)) {
    if (group.startsWith("_") || !Array.isArray(g.words)) continue;
    for (const w of g.words) {
      const key = `${w.word}|${w.reading}`;

      // (1) inheritance
      const prev = inheritIdx.get(key);
      if (prev) {
        if (w.isFirstAppearance !== false) {
          changes.push({ group, word: w.word, reading: w.reading, field: "isFirstAppearance",
            before: w.isFirstAppearance, after: false,
            reason: `appeared in ${prev.lesson}` });
        }
        if (!w._inheritedFromLessonX) {
          changes.push({ group, word: w.word, reading: w.reading, field: "_inheritedFromLessonX",
            before: undefined, after: prev.lesson,
            reason: `set first-appearance lesson` });
        } else if (w._inheritedFromLessonX !== prev.lesson) {
          skipped.push({ word: w.word, reading: w.reading,
            reason: `_inheritedFromLessonX="${w._inheritedFromLessonX}" already set (catalog says ${prev.lesson}) — user value preserved` });
        }
      }

      // (2) jlptLevel
      if (needsJlptFill(w.jlptLevel)) {
        const candidates = catIdx.get(key) || [];
        if (candidates.length === 0) {
          skipped.push({ word: w.word, reading: w.reading,
            reason: `jlpt: vocab_catalog に entry 無し (現値=${w.jlptLevel})` });
        } else if (candidates.length > 1) {
          skipped.push({ word: w.word, reading: w.reading,
            reason: `jlpt: catalog 内 source 間で disagree (${candidates.join(", ")}) — 人間判断` });
        } else {
          changes.push({ group, word: w.word, reading: w.reading, field: "jlptLevel",
            before: w.jlptLevel, after: candidates[0],
            reason: `from vocab_catalog` });
        }
      }
    }
  }

  // --apply 時は適用
  if (args.apply && changes.length > 0) {
    for (const c of changes) {
      const words = doc.vocabulary.byPattern[c.group].words;
      const w = words.find((x) => x.word === c.word && x.reading === c.reading);
      if (!w) continue;
      if (c.field === "isFirstAppearance") {
        w.isFirstAppearance = c.after;
      } else if (c.field === "_inheritedFromLessonX") {
        w._inheritedFromLessonX = c.after;
      } else if (c.field === "jlptLevel") {
        w.jlptLevel = c.after;
      }
    }
    fs.writeFileSync(targetPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
  }

  // 報告
  if (args.asJson) {
    process.stdout.write(JSON.stringify({
      file: targetPath, mode: args.apply ? "apply" : "dry-run",
      changes, skipped,
    }, null, 2) + "\n");
  } else {
    const out = [];
    out.push(`target: ${targetPath}`);
    out.push(`mode:   ${args.apply ? "APPLY (file modified)" : "dry-run (no changes written)"}`);
    out.push(`changes: ${changes.length}`);
    for (const c of changes) {
      const before = c.before === undefined ? "(unset)" : JSON.stringify(c.before);
      out.push(`  [${c.group}] ${c.word}(${c.reading}) ${c.field}: ${before} → ${JSON.stringify(c.after)} (${c.reason})`);
    }
    out.push(`skipped: ${skipped.length}`);
    for (const s of skipped) {
      out.push(`  ${s.word}(${s.reading}): ${s.reason}`);
    }
    if (!args.apply && changes.length > 0) {
      out.push(``);
      out.push(`* dry-run のため未保存。書き戻すには --apply を付ける:`);
      out.push(`    node scripts/lib/lesson-fill-vocab.mjs --no ${args.no} --apply`);
    }
    process.stdout.write(out.join("\n") + "\n");
  }
  process.exit(0);
}

main();
