#!/usr/bin/env node
// scripts/lib/lesson-goi-supplement.mjs
//
// /lesson-scaffold Step 4.5 (Goi_List N5 補強候補対話フェーズ) の本体。
// Phase 2 of Goi_List skill 統合 (2026-05-28+)。
//
// 2 モード:
//
//   (a) --candidates : 候補プール抽出 (read-only)
//       data/sources/goi_list_raw.json の N5 422 件から、
//         - 対象 lesson_NN の既存 vocab
//         - lesson_NN 以前の lesson_*.json 全ての既存 vocab
//       を除外したプールを emit する。pos1 (品詞) 別 group / 任意 filter 可。
//       出力は plain text (default) または JSON (--json)。
//
//       これを Claude が見て、pattern コンテキストに沿った候補を curate し、
//       user に y/n/skip で対話。最終 adopt list を JSON 化して (b) で書き戻す。
//
//   (b) --adopt <path> [--apply] : 採用語の書き戻し
//       adopt.json の adoptions[] を lesson_NN.json の vocabulary.byPattern に
//       merge する。各 word に _sourceTag="goi_list_n5_supplement" を自動付与。
//       書き込み前に Goi_List N5 実在 (B-16 相当) を helper 内で再検証。
//
//       adopt.json 形式:
//         {
//           "_meta": { "lesson": "03", "curatedBy": "claude+user", "createdAt": "..." },
//           "adoptions": [
//             {
//               "groupKey": "p1_thing",
//               "patternIds": ["p1"],
//               "description": "(新規 group の場合) 説明文",
//               "words": [
//                 {
//                   "word": "カメラ",
//                   "reading": "カメラ",
//                   "en": "camera",
//                   "vocabType": "actual_object",
//                   "imageRole": "vocab_object"
//                   // _sourceTag は付けない (helper が自動付与)
//                   // imageId / audioId は省略可 (helper が word_<word> で補完)
//                 }
//               ]
//             }
//           ]
//         }
//
//       既存 groupKey は append、存在しない groupKey は新規作成。dup word は
//       WARN で skip (idempotent)。--apply なしは dry-run。
//
// 使い方:
//   node scripts/lib/lesson-goi-supplement.mjs --no 03 --candidates [--json] [--pos1 名詞]
//   node scripts/lib/lesson-goi-supplement.mjs --no 03 --adopt path/to/adopt.json
//   node scripts/lib/lesson-goi-supplement.mjs --no 03 --adopt path/to/adopt.json --apply
//
// 終了コード:
//   0 = OK
//   1 = adopt 時の検証エラー (B-16 違反 / vocab schema 不正 / 必須 field 不足)
//   2 = 引数不正

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "")), "..", "..");

const VOCAB_TYPE_ENUM = ["vocabulary_card", "actual_object", "scene_picture", "contrast_picture"];
const IMAGE_ROLE_ENUM = ["vocab_person", "vocab_object", "scene", "contrast"];

function parseArgs(argv) {
  const args = {
    no: null,
    candidates: false,
    adopt: null,
    apply: false,
    json: false,
    pos1: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--candidates") args.candidates = true;
    else if (a === "--apply") args.apply = true;
    else if (a === "--json") args.json = true;
    else if (a === "--no") args.no = argv[++i];
    else if (a.startsWith("--no=")) args.no = a.slice(5);
    else if (a === "--adopt") args.adopt = argv[++i];
    else if (a.startsWith("--adopt=")) args.adopt = a.slice(8);
    else if (a === "--pos1") args.pos1 = argv[++i];
    else if (a.startsWith("--pos1=")) args.pos1 = a.slice(7);
    else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function printHelp() {
  console.log(`/lesson-scaffold Step 4.5 helper (Goi_List N5 補強候補)

  --no NN              対象課番号 (2 桁 zero-pad 推奨)。必須.
  --candidates         候補プールを emit (read-only)
  --json               候補プールを JSON で出す (--candidates 時)
  --pos1 <品詞>        候補を pos1 で絞る (例: 名詞 / イ形容詞 / 動詞1類)
  --adopt path.json    採用 list を読んで vocab に merge
  --apply              adopt mode で --apply 必要 (なしは dry-run)
`);
}

function zeroPad(n) {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}

// ---- N5 pool 構築 ----

function loadGoiListN5() {
  const goiPath = path.join(ROOT, "data/sources/goi_list_raw.json");
  if (!fs.existsSync(goiPath)) {
    console.error(`[FATAL] goi_list_raw.json not found at ${goiPath}`);
    process.exit(1);
  }
  const doc = JSON.parse(fs.readFileSync(goiPath, "utf-8"));
  return (doc.entries || []).filter((e) => e.jlpt === "N5");
}

// 対象 NN とそれ以前の全 lesson_*.json から vocab word の集合を作る
function collectIntroducedWords(currentNo) {
  const dataDir = path.join(ROOT, "data");
  const re = /^lesson_(\d{2})\.json$/;
  const files = fs.readdirSync(dataDir).filter((f) => re.test(f));
  const introduced = new Map(); // word → { lesson, sourceTag, group }
  for (const f of files) {
    const m = f.match(re);
    const lessonNo = m[1];
    // 対象 NN を含めて「同 or 以前」(currentNo を含めて exclude する。supplement は
    // 新規追加が前提)。
    if (parseInt(lessonNo, 10) > parseInt(currentNo, 10)) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf-8"));
    const groups = doc?.vocabulary?.byPattern || {};
    for (const [gk, g] of Object.entries(groups)) {
      if (gk.startsWith("_removed_")) continue;
      for (const w of g.words || []) {
        if (!w.word) continue;
        if (!introduced.has(w.word)) {
          introduced.set(w.word, { lesson: lessonNo, sourceTag: w._sourceTag, group: gk });
        }
      }
    }
  }
  return introduced;
}

function buildCandidatePool(no, pos1Filter) {
  const n5 = loadGoiListN5();
  const introduced = collectIntroducedWords(no);
  const filtered = n5.filter((e) => {
    if (introduced.has(e.word)) return false;
    if (pos1Filter && e.pos1 !== pos1Filter) return false;
    return true;
  });
  // pos1 → entries に group 化
  const byPos1 = {};
  for (const e of filtered) {
    const key = e.pos1 || "(未分類)";
    if (!byPos1[key]) byPos1[key] = [];
    byPos1[key].push({ word: e.word, reading: e.reading, pos1: e.pos1, pos2: e.pos2, goiShurui: e.goiShurui, no: e.no });
  }
  for (const k of Object.keys(byPos1)) {
    byPos1[k].sort((a, b) => a.reading.localeCompare(b.reading, "ja"));
  }
  return {
    lessonNo: no,
    totalN5: n5.length,
    excludedAsIntroduced: n5.length - filtered.filter((e) => !pos1Filter || e.pos1 === pos1Filter).length - (pos1Filter ? n5.filter((e) => e.pos1 !== pos1Filter).length : 0),
    totalCandidates: filtered.length,
    pos1Filter: pos1Filter || null,
    byPos1,
  };
}

function printCandidates(pool) {
  console.log(`# Goi_List N5 candidate pool for lesson_${pool.lessonNo}`);
  console.log(`# Total N5: ${pool.totalN5}`);
  console.log(`# Candidates (after dedup against lesson_${pool.lessonNo} and earlier): ${pool.totalCandidates}`);
  if (pool.pos1Filter) console.log(`# pos1 filter: ${pool.pos1Filter}`);
  console.log();
  for (const [pos1, entries] of Object.entries(pool.byPos1)) {
    console.log(`## ${pos1} (${entries.length})`);
    for (const e of entries) {
      console.log(`  ${e.word} (${e.reading}) [${e.pos2 || ""}${e.goiShurui ? " / " + e.goiShurui : ""}]`);
    }
    console.log();
  }
}

// ---- adopt mode ----

function loadAdoptDoc(adoptPath) {
  if (!fs.existsSync(adoptPath)) {
    console.error(`adopt file not found: ${adoptPath}`);
    process.exit(2);
  }
  try {
    return JSON.parse(fs.readFileSync(adoptPath, "utf-8"));
  } catch (e) {
    console.error(`adopt parse error: ${e.message}`);
    process.exit(2);
  }
}

function validateAdoption(adoption, n5Set, errors, warnings) {
  if (!adoption.groupKey || typeof adoption.groupKey !== "string") {
    errors.push(`adoption: groupKey 必須 (${JSON.stringify(adoption).slice(0, 100)}...)`);
    return;
  }
  if (!Array.isArray(adoption.patternIds) || adoption.patternIds.length === 0) {
    errors.push(`[${adoption.groupKey}] patternIds 必須 (非空配列)`);
  }
  if (!Array.isArray(adoption.words) || adoption.words.length === 0) {
    errors.push(`[${adoption.groupKey}] words 必須 (非空配列)`);
    return;
  }
  for (const w of adoption.words) {
    if (!w.word || !w.reading) {
      errors.push(`[${adoption.groupKey}] word/reading 必須: ${JSON.stringify(w)}`);
      continue;
    }
    if (!n5Set.has(w.word)) {
      errors.push(`[${adoption.groupKey}] ${w.word}(${w.reading}) は goi_list_raw.json の N5 範囲にない (B-16 違反)`);
    }
    if (!w.en) warnings.push(`[${adoption.groupKey}] ${w.word}: en 未指定 (TODO で seed する)`);
    if (w.vocabType && !VOCAB_TYPE_ENUM.includes(w.vocabType)) {
      errors.push(`[${adoption.groupKey}] ${w.word}: vocabType 不正 (${w.vocabType})`);
    }
    if (w.imageRole && !IMAGE_ROLE_ENUM.includes(w.imageRole)) {
      errors.push(`[${adoption.groupKey}] ${w.word}: imageRole 不正 (${w.imageRole})`);
    }
    if (w._sourceTag && w._sourceTag !== "goi_list_n5_supplement") {
      errors.push(`[${adoption.groupKey}] ${w.word}: _sourceTag は省略するか "goi_list_n5_supplement" のみ (got: ${w._sourceTag})`);
    }
  }
}

function mergeAdoption(lessonDoc, adoption, addedWords, skippedDup) {
  const groups = lessonDoc.vocabulary?.byPattern;
  if (!groups) {
    throw new Error("lesson.vocabulary.byPattern が見つからない");
  }
  const existing = groups[adoption.groupKey];
  const target = existing || {
    patternIds: adoption.patternIds.slice(),
    vocabCount: 0,
    description: adoption.description || `Goi_List N5 補強 (${adoption.patternIds.join("/")})`,
    words: [],
  };
  if (!existing) {
    groups[adoption.groupKey] = target;
  }
  // 既存 word の word 集合
  const existingWords = new Set((target.words || []).map((w) => w.word));
  for (const w of adoption.words) {
    if (existingWords.has(w.word)) {
      skippedDup.push({ groupKey: adoption.groupKey, word: w.word, reading: w.reading });
      continue;
    }
    const newWord = {
      word: w.word,
      reading: w.reading,
      en: w.en || "TODO",
      jlptLevel: "N5",
      isFirstAppearance: w.isFirstAppearance !== false,
      vocabType: w.vocabType || "vocabulary_card",
      imageRole: w.imageRole || "vocab_object",
      imageId: w.imageId || `word_${w.word}`,
      audioId: w.audioId || `word_${w.word}`,
      _sourceTag: "goi_list_n5_supplement",
      ...(w._note ? { _note: w._note } : {}),
    };
    target.words.push(newWord);
    existingWords.add(w.word);
    addedWords.push({ groupKey: adoption.groupKey, word: w.word, reading: w.reading });
  }
  target.vocabCount = target.words.length;
}

function recomputeTotalWords(lessonDoc) {
  let total = 0;
  for (const [k, g] of Object.entries(lessonDoc.vocabulary?.byPattern || {})) {
    if (k.startsWith("_removed_")) continue;
    total += (g.words || []).length;
  }
  lessonDoc.vocabulary.totalWords = total;
}

function appendMetaChange(lessonDoc, addedWords, no) {
  const meta = lessonDoc._meta;
  if (!meta) return;
  if (!Array.isArray(meta.changes)) meta.changes = [];
  const today = new Date().toISOString().slice(0, 10);
  const byGroup = {};
  for (const w of addedWords) {
    if (!byGroup[w.groupKey]) byGroup[w.groupKey] = [];
    byGroup[w.groupKey].push(`${w.word}(${w.reading})`);
  }
  const summary = Object.entries(byGroup)
    .map(([gk, ws]) => `${gk}: ${ws.join(", ")}`)
    .join(" / ");
  meta.changes.push(
    `goi-supplement (${today}): Goi_List N5 から ${addedWords.length} 語を _sourceTag="goi_list_n5_supplement" として追加 (Phase 2 of Goi_List skill 統合)。${summary}`
  );
  meta.lastModified = today;
}

function runAdopt(no, adoptPath, apply) {
  const adoptDoc = loadAdoptDoc(adoptPath);
  if (!Array.isArray(adoptDoc.adoptions) || adoptDoc.adoptions.length === 0) {
    console.error("adopt: adoptions[] が空");
    process.exit(2);
  }
  const lessonPath = path.join(ROOT, `data/lesson_${no}.json`);
  if (!fs.existsSync(lessonPath)) {
    console.error(`lesson file not found: ${lessonPath}`);
    process.exit(2);
  }
  const lessonDoc = JSON.parse(fs.readFileSync(lessonPath, "utf-8"));

  const n5 = loadGoiListN5();
  const n5Set = new Set(n5.map((e) => e.word));

  const errors = [];
  const warnings = [];
  for (const adoption of adoptDoc.adoptions) {
    validateAdoption(adoption, n5Set, errors, warnings);
  }

  if (errors.length > 0) {
    console.error("=== validation errors ===");
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
  if (warnings.length > 0) {
    console.error("=== validation warnings ===");
    for (const w of warnings) console.error(`  ${w}`);
  }

  const addedWords = [];
  const skippedDup = [];
  for (const adoption of adoptDoc.adoptions) {
    mergeAdoption(lessonDoc, adoption, addedWords, skippedDup);
  }

  if (addedWords.length === 0) {
    console.log(`no words added (all ${skippedDup.length} adoption words already existed in target lesson)`);
    return;
  }

  recomputeTotalWords(lessonDoc);
  appendMetaChange(lessonDoc, addedWords, no);

  console.log(`=== adopt result (lesson_${no}.json) ===`);
  console.log(`mode: ${apply ? "apply (writes file)" : "dry-run"}`);
  console.log(`added: ${addedWords.length}`);
  const byGroup = {};
  for (const w of addedWords) {
    if (!byGroup[w.groupKey]) byGroup[w.groupKey] = [];
    byGroup[w.groupKey].push(`${w.word}(${w.reading})`);
  }
  for (const [gk, ws] of Object.entries(byGroup)) {
    console.log(`  [${gk}] ${ws.join(", ")}`);
  }
  if (skippedDup.length > 0) {
    console.log(`skipped (already existed): ${skippedDup.length}`);
    for (const w of skippedDup) {
      console.log(`  [${w.groupKey}] ${w.word}(${w.reading})`);
    }
  }
  console.log(`new totalWords: ${lessonDoc.vocabulary.totalWords}`);

  if (apply) {
    fs.writeFileSync(lessonPath, JSON.stringify(lessonDoc, null, 2) + "\n", "utf-8");
    console.log(`\n✅ wrote ${lessonPath}`);
    console.log(`\n次のステップ:`);
    console.log(`  npm run validate                 # schema + invariants 検証`);
    console.log(`  node scripts/lib/lesson-check.mjs --no ${no}     # B-15/B-16 確認`);
  } else {
    console.log(`\n(dry-run) --apply を付けると書き戻します`);
  }
}

// ---- main ----

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (!args.no) {
    console.error("--no NN は必須");
    printHelp();
    process.exit(2);
  }
  const no = zeroPad(args.no);

  if (!args.candidates && !args.adopt) {
    console.error("--candidates か --adopt <path> のどちらかを指定");
    printHelp();
    process.exit(2);
  }
  if (args.candidates && args.adopt) {
    console.error("--candidates と --adopt は同時指定できない");
    process.exit(2);
  }

  if (args.candidates) {
    const pool = buildCandidatePool(no, args.pos1);
    if (args.json) {
      console.log(JSON.stringify(pool, null, 2));
    } else {
      printCandidates(pool);
    }
    return;
  }

  if (args.adopt) {
    runAdopt(no, args.adopt, args.apply);
    return;
  }
}

main();
