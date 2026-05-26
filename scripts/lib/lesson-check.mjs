#!/usr/bin/env node
// scripts/lib/lesson-check.mjs
//
// /lesson-check NN の本体。data/lesson_NN.json に対して 14 ルール lint を
// 適用する。schema 検査 (formatVersion / lessonVersion 等) は validate.mjs が
// 既に行うため、ここでは「教育設計ルール」に踏み込んだ check を行う。
//
// チェック対象 (14 ルール出典: archive/handoffs/lesson_master_rules_handoff_v2.md §3):
//   A-2  namedCharacters[] が空でない時、各エントリに何らかの出典/原典情報があるか warn
//   A-3  examples[].originalSources[] で originalSentence と sentence が異なるなら
//        replacementNote 非空必須 (TODO_A-3 は ERROR)
//   A-4  patterns[].canDo は「〜できる」「〜できます」で終わる 1 文 (句点 1 つ以下)
//   A-5  vocabulary.byPattern[*].words[].vocabType ∈ enum
//   A-6  examples[].imageRole + words[].imageRole ∈ enum (TODO_A-6 は ERROR)
//   B-5  jlptLevel ∈ N5-N1 (TODO は ERROR)
//   B-6  practiceTemplates.length >= 2 (validate.mjs でも一部見るがここで再確認)
//   B-7  intro_activity / main_activity の materialNeeds[] 必須かつ TODO_B-7 不可
//        review / intro_slide / example / wrapUp は materialNeeds 禁止 (=undefined)
//        pattern / practice は optional
//   B-8  flow[]._recommendedMinutes が目安範囲内か warn
//        review 3-5 / intro_activity 5-10 / pattern 3-7 / main_activity 10-20 / wrapUp 2-5
//   B-9  main_activity の ABCactivityRef = { activityName, fadingStage, taskType, playerSteps[] }
//        各 field が非空 (TODO は ERROR)
//   C-10 _meta.changes[] 各エントリは 30 文字以上 (理由を含めているか粗判定)
//   C-11 _meta.formatVersion + _meta.lessonVersion 両方存在 (validate.mjs と重複だが報告対象)
//
// + TODO スキャン: 全 string 値で "TODO_" / "TODO:" / "TODO " を含むものを集計し、
//   field path 一覧を warn として出す (人間 review 用)。
//
// 使い方:
//   node scripts/lib/lesson-check.mjs --no NN [--json]
//   node scripts/lib/lesson-check.mjs --file path/to/lesson.json
//
// 終了コード: ERROR > 0 で 1、それ以外 0 (WARN/TODO は 0)。

import fs from "node:fs";
import path from "node:path";

const VOCAB_TYPE_ENUM = ["vocabulary_card", "actual_object", "scene_picture", "contrast_picture"];
const IMAGE_ROLE_ENUM = ["vocab_person", "vocab_object", "scene", "contrast"];
const JLPT_ENUM = ["N5", "N4", "N3", "N2", "N1"];

// flow type → materialNeeds の扱い (B-7)
const MATERIAL_NEEDS_POLICY = {
  review: "forbidden",
  intro_slide: "forbidden",
  example: "forbidden",
  wrapUp: "forbidden",
  intro_activity: "required",
  main_activity: "required",
  pattern: "optional",
  practice: "optional",
};

// flow type → 推奨時間目安 (B-8) min-max in minutes
const RECOMMENDED_MINUTES_RANGE = {
  review: [3, 5],
  intro_activity: [5, 10],
  pattern: [3, 7],
  main_activity: [10, 20],
  wrapUp: [2, 5],
};

const TODO_RE = /TODO[_: ]|TODO$/;

function parseArgs(argv) {
  const args = { no: null, file: null, asJson: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--no") args.no = parseInt(argv[++i], 10);
    else if (a.startsWith("--no=")) args.no = parseInt(a.slice(5), 10);
    else if (a === "--file") args.file = argv[++i];
    else if (a.startsWith("--file=")) args.file = a.slice(7);
    else if (a === "--json") args.asJson = true;
    else { console.error(`unknown arg: ${a}`); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`/lesson-check helper

  --no NN     課番号 (1-99)
  --file P    lesson JSON を直接指定 (--no と排他)
  --json      JSON 出力
  --help      このヘルプ
`);
}

function zeroPad(n) { return String(n).padStart(2, "0"); }

function loadLesson(args) {
  if (args.file) {
    if (!fs.existsSync(args.file)) { console.error(`file not found: ${args.file}`); process.exit(2); }
    return { path: args.file, doc: JSON.parse(fs.readFileSync(args.file, "utf8")) };
  }
  if (args.no === null || Number.isNaN(args.no)) { console.error("--no NN 必須 (または --file)"); process.exit(2); }
  if (args.no < 1 || args.no > 99) { console.error(`--no は 1-99 の範囲 (received: ${args.no})`); process.exit(2); }
  const p = `data/lesson_${zeroPad(args.no)}.json`;
  if (!fs.existsSync(p)) { console.error(`lesson file not found: ${p}`); process.exit(2); }
  return { path: p, doc: JSON.parse(fs.readFileSync(p, "utf8")) };
}

// ---- check helpers ----

function pushTodo(report, where, value) {
  report.todos.push({ where, value: typeof value === "string" ? value : String(value) });
}

function scanTodos(report, value, prefix) {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    if (TODO_RE.test(value)) pushTodo(report, prefix, value);
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) scanTodos(report, value[i], `${prefix}[${i}]`);
    return;
  }
  if (typeof value === "object") {
    for (const k of Object.keys(value)) scanTodos(report, value[k], prefix ? `${prefix}.${k}` : k);
  }
}

// ---- 14 rule checks ----

function checkC11(doc, report) {
  const meta = doc._meta || {};
  if (!meta.formatVersion) report.errors.push({ rule: "C-11", msg: "_meta.formatVersion 不在" });
  if (!meta.lessonVersion) report.errors.push({ rule: "C-11", msg: "_meta.lessonVersion 不在" });
}

function checkC10(doc, report) {
  // _meta.changes は string 形式 (lesson_01 / lesson_02 前半) と
  // object 形式 { version, date, changes[] } (lesson_02 後半) が混在。
  // どちらも accept する。
  const changes = (doc._meta && doc._meta.changes) || [];
  if (!Array.isArray(changes) || changes.length === 0) {
    report.warns.push({ rule: "C-10", msg: "_meta.changes が空 (変更履歴を 1 件以上書く)" });
    return;
  }
  changes.forEach((c, i) => {
    if (typeof c === "string") {
      if (c.trim().length < 30) {
        report.warns.push({ rule: "C-10", msg: `_meta.changes[${i}] が短すぎる (理由を含めているか確認): "${c.slice(0, 40)}..."` });
      }
    } else if (c && typeof c === "object" && Array.isArray(c.changes)) {
      if (!c.version) report.warns.push({ rule: "C-10", msg: `_meta.changes[${i}] (object) に version が無い` });
      if (c.changes.length === 0) report.warns.push({ rule: "C-10", msg: `_meta.changes[${i}].changes が空配列` });
      c.changes.forEach((line, j) => {
        if (typeof line !== "string" || line.trim().length < 10) {
          report.warns.push({ rule: "C-10", msg: `_meta.changes[${i}].changes[${j}] が短すぎる: "${String(line).slice(0, 40)}..."` });
        }
      });
    } else {
      report.warns.push({ rule: "C-10", msg: `_meta.changes[${i}] が string でも { version, changes[] } object でもない` });
    }
  });
}

function checkA2(doc, report) {
  // A-2 の本質は「教科書にない人物を作らない」だが、これは機械判定不可。
  // 形式的 check: namedCharacters[] 各エントリに識別子 (name または id) が
  // ある + 何らかの記述 field (occupation/role/nationality/source/introduction)
  // がある。識別子なしは ERROR、記述なしは WARN。
  const named = doc.namedCharacters || [];
  if (!Array.isArray(named) || named.length === 0) return; // 0 件は OK
  named.forEach((c, i) => {
    const ident = c.name || c.id;
    if (!ident) {
      report.errors.push({ rule: "A-2", msg: `namedCharacters[${i}] に name/id がない` });
    }
    const hasDesc = c.occupation || c.role || c.nationality || c.source || c.introduction;
    if (!hasDesc) {
      report.warns.push({ rule: "A-2", msg: `namedCharacters[${i}](${ident || "?"}) に occupation/role/nationality/source/introduction いずれも無い` });
    }
  });
}

// 可能形 (potential form) で終わるか。「〜できる」だけでなく一段動詞の
// 「〜られる」、五段動詞の「〜える」、サ変・カ変の派生形等も含める。
// 14 ルール A-4 の良い例「指し示せる」(五段可能) も accept する。
const POTENTIAL_FORM_RE = /(できる|できます|られる|られます|える|えます|せる|せます|れる|れます|ける|けます|げる|げます|てる|てます|でる|でます|べる|べます|める|めます|ねる|ねます|ぺる|ぺます)。?$/;

function splitSentences(s) {
  // 「」内の 。 は無視する素朴な実装
  const out = [];
  let buf = "";
  let inQuote = 0;
  for (const ch of s) {
    if (ch === "「" || ch === "『") inQuote++;
    else if (ch === "」" || ch === "』") inQuote = Math.max(0, inQuote - 1);
    if ((ch === "。" || ch === "！" || ch === "？" || ch === "!" || ch === "?") && inQuote === 0) {
      const t = buf.trim();
      if (t) out.push(t);
      buf = "";
    } else {
      buf += ch;
    }
  }
  const t = buf.trim();
  if (t) out.push(t);
  return out;
}

function checkA4(doc, report) {
  const patterns = doc.patterns || [];
  patterns.forEach((p) => {
    if (typeof p.canDo !== "string" || p.canDo.length === 0) {
      report.errors.push({ rule: "A-4", msg: `patterns[${p.id}].canDo が無い` });
      return;
    }
    if (TODO_RE.test(p.canDo)) return; // TODO スキャンに任せる
    const segs = splitSentences(p.canDo);
    // 形式 check (各文の末尾が可能形か) — ERROR
    if (segs.length === 0 || !POTENTIAL_FORM_RE.test(segs[segs.length - 1])) {
      report.errors.push({ rule: "A-4", msg: `patterns[${p.id}].canDo が可能形 (〜できる/られる/える 等) で終わらない: "${p.canDo}"` });
    }
    // 文数 check (1 文制約) — WARN (project の lesson_01/02 は意図的に複数文を持つ)
    if (segs.length > 1) {
      report.warns.push({ rule: "A-4", msg: `patterns[${p.id}].canDo が ${segs.length} 文 (ルール上は 1 文。意図的なら無視可)` });
    }
  });
}

function checkB6(doc, report) {
  const patterns = doc.patterns || [];
  patterns.forEach((p) => {
    const t = Array.isArray(p.practiceTemplates) ? p.practiceTemplates : [];
    if (t.length < 2) report.errors.push({ rule: "B-6", msg: `patterns[${p.id}].practiceTemplates が ${t.length} 件 (≥2 必須)` });
  });
}

function checkA3(doc, report) {
  const patterns = doc.patterns || [];
  patterns.forEach((p) => {
    (p.examples || []).forEach((ex) => {
      const srcs = Array.isArray(ex.originalSources) ? ex.originalSources : [];
      srcs.forEach((s, i) => {
        if (typeof s.originalSentence === "string" && typeof ex.sentence === "string"
            && s.originalSentence !== ex.sentence
            && (!s.replacementNote || TODO_RE.test(s.replacementNote))) {
          report.errors.push({ rule: "A-3", msg: `patterns[${p.id}].examples[no=${ex.no}].originalSources[${i}] で sentence と originalSentence が異なるが replacementNote が無い/TODO` });
        }
      });
    });
  });
}

function checkA5A6Vocab(doc, report) {
  const byPattern = (doc.vocabulary && doc.vocabulary.byPattern) || {};
  for (const [group, g] of Object.entries(byPattern)) {
    if (group.startsWith("_")) continue;
    const words = Array.isArray(g.words) ? g.words : [];
    words.forEach((w, i) => {
      const tag = `vocabulary.byPattern[${group}].words[${i}](word=${w.word})`;
      // A-5 vocabType
      if (!w.vocabType || TODO_RE.test(w.vocabType)) {
        report.errors.push({ rule: "A-5", msg: `${tag} vocabType 不在/TODO: ${w.vocabType}` });
      } else if (!VOCAB_TYPE_ENUM.includes(w.vocabType)) {
        report.errors.push({ rule: "A-5", msg: `${tag} vocabType "${w.vocabType}" が enum 外 (${VOCAB_TYPE_ENUM.join("|")})` });
      }
      // A-6 imageRole (vocab)
      if (!w.imageRole || TODO_RE.test(w.imageRole)) {
        report.errors.push({ rule: "A-6", msg: `${tag} imageRole 不在/TODO: ${w.imageRole}` });
      } else if (!IMAGE_ROLE_ENUM.includes(w.imageRole)) {
        report.errors.push({ rule: "A-6", msg: `${tag} imageRole "${w.imageRole}" が enum 外 (${IMAGE_ROLE_ENUM.join("|")})` });
      }
    });
  }
}

function checkA6Examples(doc, report) {
  (doc.patterns || []).forEach((p) => {
    (p.examples || []).forEach((ex) => {
      if (!ex.imageRole || TODO_RE.test(ex.imageRole)) {
        report.errors.push({ rule: "A-6", msg: `patterns[${p.id}].examples[no=${ex.no}].imageRole 不在/TODO: ${ex.imageRole}` });
      } else if (!IMAGE_ROLE_ENUM.includes(ex.imageRole)) {
        report.errors.push({ rule: "A-6", msg: `patterns[${p.id}].examples[no=${ex.no}].imageRole "${ex.imageRole}" が enum 外 (${IMAGE_ROLE_ENUM.join("|")})` });
      }
    });
  });
}

function checkB5(doc, report) {
  const byPattern = (doc.vocabulary && doc.vocabulary.byPattern) || {};
  for (const [group, g] of Object.entries(byPattern)) {
    if (group.startsWith("_")) continue;
    const words = Array.isArray(g.words) ? g.words : [];
    words.forEach((w, i) => {
      const tag = `vocabulary.byPattern[${group}].words[${i}](word=${w.word})`;
      // ① jlptLevel
      if (!w.jlptLevel || TODO_RE.test(w.jlptLevel)) {
        report.errors.push({ rule: "B-5", msg: `${tag} jlptLevel 不在/TODO` });
      } else if (!JLPT_ENUM.includes(w.jlptLevel)) {
        report.errors.push({ rule: "B-5", msg: `${tag} jlptLevel "${w.jlptLevel}" が enum 外 (${JLPT_ENUM.join("|")})` });
      }
      // ② isFirstAppearance
      if (typeof w.isFirstAppearance !== "boolean") {
        report.errors.push({ rule: "B-5", msg: `${tag} isFirstAppearance が boolean でない` });
      }
      // ③ _note: 「絵カード化できない語」かは機械判定不可なので warn 出さない (人間 review 領域)
    });
  }
}

function checkB7(doc, report) {
  const flow = Array.isArray(doc.flow) ? doc.flow : [];
  flow.forEach((step) => {
    const type = step.type;
    const policy = MATERIAL_NEEDS_POLICY[type];
    if (!policy) return; // 知らない type は skip
    const mn = step.materialNeeds;
    if (policy === "forbidden") {
      if (Array.isArray(mn) && mn.length > 0) {
        report.errors.push({ rule: "B-7", msg: `flow[${step.id}](type=${type}) は materialNeeds 禁止 (schema 規則) だが ${mn.length} 件付いている` });
      }
    } else if (policy === "required") {
      if (!Array.isArray(mn) || mn.length === 0) {
        report.errors.push({ rule: "B-7", msg: `flow[${step.id}](type=${type}) に materialNeeds[] が必要` });
        return;
      }
      mn.forEach((m, i) => {
        if (!m.type || TODO_RE.test(m.type)) {
          report.errors.push({ rule: "B-7", msg: `flow[${step.id}].materialNeeds[${i}].type が TODO/不在: ${m.type}` });
        }
      });
    }
  });
}

function checkB8(doc, report) {
  const flow = Array.isArray(doc.flow) ? doc.flow : [];
  flow.forEach((step) => {
    const range = RECOMMENDED_MINUTES_RANGE[step.type];
    if (!range) return;
    const rm = step._recommendedMinutes;
    if (typeof rm !== "number") return;
    if (rm === 0 && step.skipped === true) return; // skip 時の 0 は OK
    if (rm < range[0] || rm > range[1]) {
      report.warns.push({ rule: "B-8", msg: `flow[${step.id}](type=${step.type}) _recommendedMinutes=${rm} 分が目安範囲 ${range[0]}-${range[1]} 分の外 (絶対基準ではないので状況による)` });
    }
  });
}

function checkB9(doc, report) {
  const flow = Array.isArray(doc.flow) ? doc.flow : [];
  flow.forEach((step) => {
    if (step.type !== "main_activity") return;
    if (step.skipped === true) return; // skip 中の main は B-9 から除外
    const ref = step.ABCactivityRef;
    if (!ref) { report.errors.push({ rule: "B-9", msg: `flow[${step.id}] ABCactivityRef 不在` }); return; }
    for (const f of ["activityName", "fadingStage", "taskType"]) {
      if (!ref[f] || TODO_RE.test(ref[f])) {
        report.errors.push({ rule: "B-9", msg: `flow[${step.id}].ABCactivityRef.${f} 不在/TODO: ${ref[f]}` });
      }
    }
    if (!Array.isArray(ref.playerSteps) || ref.playerSteps.length === 0) {
      report.errors.push({ rule: "B-9", msg: `flow[${step.id}].ABCactivityRef.playerSteps[] が空 (1 件以上)` });
    }
  });
}

// ---- main check runner ----

function runChecks(doc) {
  const report = { errors: [], warns: [], todos: [] };
  checkC11(doc, report);
  checkC10(doc, report);
  checkA2(doc, report);
  checkA3(doc, report);
  checkA4(doc, report);
  checkA5A6Vocab(doc, report);
  checkA6Examples(doc, report);
  checkB5(doc, report);
  checkB6(doc, report);
  checkB7(doc, report);
  checkB8(doc, report);
  checkB9(doc, report);
  // TODO scan は最後 (lint ERROR 化されたものも検出されるが、それは重複ではなく
  // 「全 TODO の全体像」を見せる別軸)。
  scanTodos(report, doc, "");
  return report;
}

function formatText(filePath, report) {
  const out = [];
  out.push(`checked: ${filePath}`);
  out.push(`ERROR: ${report.errors.length}`);
  for (const e of report.errors) out.push(`  [${e.rule}] ${e.msg}`);
  out.push(`WARN:  ${report.warns.length}`);
  for (const w of report.warns) out.push(`  [${w.rule}] ${w.msg}`);
  out.push(`TODO:  ${report.todos.length}`);
  for (const t of report.todos) out.push(`  ${t.where} = ${t.value}`);
  return out.join("\n") + "\n";
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); process.exit(0); }
  const { path: filePath, doc } = loadLesson(args);
  const report = runChecks(doc);

  if (args.asJson) {
    process.stdout.write(JSON.stringify({ file: filePath, ...report }, null, 2) + "\n");
  } else {
    process.stdout.write(formatText(filePath, report));
  }
  process.exit(report.errors.length > 0 ? 1 : 0);
}

main();
