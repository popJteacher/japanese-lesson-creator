#!/usr/bin/env node
// validate.mjs — data/lesson_NN.json の高価値スキーマ検査。
// 正典: data/lesson_NN.json（root の lesson_02_v2_11_11.json などは検査対象外）
//
// 検査内容（CLAUDE.md スキーマ要件・v2.11 以降）:
//   1. _meta.lessonVersion が存在し、誤名 lessonVer が無い
//   2. _meta.lastModified が存在し、誤名 lastUpdated が無い
//   3. patterns[] 必須フィールド: id/pattern/label/grammarConcept/jlptLevel/canDo/canDoEn/vocabCount/examples/practiceTemplates
//   4. examples[] 必須: no/sentence/sentenceEn/imageId/imageRole/audioId/isAnchor
//   5. isAnchor: true は 1 文型につき 1 件のみ
//   6. examples[].imageId 命名: /^ex_L\d{2}_\d{3}$/
//   7. examples[].audioId 命名: /^sentence_ex_L\d{2}_\d{3}$/
//   8. vocabulary.byPattern[*].words[] 必須: word/reading/en/jlptLevel/isFirstAppearance/vocabType/imageRole/imageId/audioId
//   9. flow[] が各文型分 intro_act_pN → pattern_pN → example_pN → practice_pN を含む
//
// 使い方:
//   node scripts/validate.mjs                       全 lesson_NN.json を検査
//   node scripts/validate.mjs --json                JSON 出力
//   node scripts/validate.mjs data/lesson_01.json   個別指定
//
// 終了コード: ERROR が 1 件以上なら 1、それ以外 0（WARN は 0）

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import { runAll as runInvariants } from './invariants.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'data');

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const explicit = args.filter((a) => !a.startsWith('--'));

const PATTERN_REQUIRED = [
  'id', 'pattern', 'label', 'grammarConcept', 'jlptLevel',
  'canDo', 'canDoEn', 'vocabCount', 'examples', 'practiceTemplates',
];
const EXAMPLE_REQUIRED = [
  'no', 'sentence', 'sentenceEn', 'imageId', 'imageRole', 'audioId', 'isAnchor',
];
const WORD_REQUIRED = [
  'word', 'reading', 'en', 'jlptLevel', 'isFirstAppearance',
  'vocabType', 'imageRole', 'imageId', 'audioId', '_sourceTag',
];

const SOURCE_TAG_ENUM = [
  'pdf_introduction',
  'goi_list_n5_supplement',
  'teacher_addition',
  'inherited_from_earlier_lesson',
  'practice_only',
];

const EX_IMAGE_ID_RE = /^ex_L\d{2}_\d{3}$/;
const EX_AUDIO_ID_RE = /^sentence_ex_L\d{2}_\d{3}$/;
const LESSON_FILE_RE = /^lesson_\d{2}\.json$/;
const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
const JLPT_RANK = { N5: 5, N4: 4, N3: 3, N2: 2, N1: 1 };

async function findLessonFiles() {
  const all = await readdir(DATA_DIR);
  return all.filter((n) => LESSON_FILE_RE.test(n)).sort().map((n) => resolve(DATA_DIR, n));
}

function checkLesson(path, doc, errors, warns) {
  const file = basename(path);
  const err = (msg) => errors.push({ file, msg });
  const warn = (msg) => warns.push({ file, msg });

  // 1-2. _meta
  const meta = doc._meta ?? {};
  if (!meta.lessonVersion) err(`_meta.lessonVersion 不在（${meta.lessonVer ? '誤名 lessonVer が存在' : ''}）`);
  if (meta.lessonVer) err('_meta.lessonVer は誤名。lessonVersion に統一する');
  if (!meta.lastModified) err(`_meta.lastModified 不在（${meta.lastUpdated ? '誤名 lastUpdated が存在' : ''}）`);
  if (meta.lastUpdated) err('_meta.lastUpdated は誤名。lastModified に統一する');

  // 2b. lesson.targetStudentLevel (X-b 導入): N5..N1 enum (推奨フィールド)
  const lessonNode = doc.lesson ?? {};
  if (lessonNode.targetStudentLevel == null) {
    warn('lesson.targetStudentLevel 不在 (X-b 導入推奨フィールド・"N5"〜"N1" enum)');
  } else if (!JLPT_LEVELS.includes(lessonNode.targetStudentLevel)) {
    err(`lesson.targetStudentLevel が不正値: ${JSON.stringify(lessonNode.targetStudentLevel)} (期待: N5/N4/N3/N2/N1)`);
  }

  // 3-7. patterns / examples
  const patterns = Array.isArray(doc.patterns) ? doc.patterns : [];
  if (patterns.length === 0) err('patterns[] 空または不在');

  const patternIds = new Set();
  for (const [i, pat] of patterns.entries()) {
    const tag = `patterns[${i}]${pat.id ? `(id=${pat.id})` : ''}`;
    for (const f of PATTERN_REQUIRED) {
      if (pat[f] === undefined || pat[f] === null) err(`${tag} 必須フィールド欠落: ${f}`);
    }
    if (pat.id) patternIds.add(pat.id);

    const exs = Array.isArray(pat.examples) ? pat.examples : [];
    let anchorCount = 0;
    for (const [j, ex] of exs.entries()) {
      const etag = `${tag}.examples[${j}]${ex.no ? `(no=${ex.no})` : ''}`;
      for (const f of EXAMPLE_REQUIRED) {
        if (ex[f] === undefined || ex[f] === null) err(`${etag} 必須フィールド欠落: ${f}`);
      }
      if (ex.imageId && !EX_IMAGE_ID_RE.test(ex.imageId)) {
        err(`${etag} imageId が命名規則外: ${ex.imageId}（期待: ex_LNN_NNN）`);
      }
      if (ex.audioId && !EX_AUDIO_ID_RE.test(ex.audioId)) {
        err(`${etag} audioId が命名規則外: ${ex.audioId}（期待: sentence_ex_LNN_NNN）`);
      }
      if (ex.isAnchor === true) anchorCount++;
    }
    if (exs.length > 0) {
      if (anchorCount === 0) err(`${tag} isAnchor: true の examples が無い（1 件必要）`);
      if (anchorCount > 1) err(`${tag} isAnchor: true が ${anchorCount} 件（1 件のみ可）`);
    }
  }

  // 8. vocabulary.byPattern[*].words[]
  const vocab = doc.vocabulary ?? {};
  const byPattern = vocab.byPattern ?? {};
  if (Object.keys(byPattern).length === 0) warn('vocabulary.byPattern 空または不在');
  for (const [key, group] of Object.entries(byPattern)) {
    const words = Array.isArray(group?.words) ? group.words : null;
    if (words === null) {
      // ignore meta-like keys
      if (key.startsWith('_')) continue;
      warn(`vocabulary.byPattern[${key}].words が配列でない`);
      continue;
    }
    for (const [i, w] of words.entries()) {
      const wtag = `vocabulary.byPattern[${key}].words[${i}]${w.word ? `(word=${w.word})` : ''}`;
      for (const f of WORD_REQUIRED) {
        if (w[f] === undefined || w[f] === null) err(`${wtag} 必須フィールド欠落: ${f}`);
      }
      if (w._sourceTag != null && !SOURCE_TAG_ENUM.includes(w._sourceTag)) {
        err(`${wtag} _sourceTag が不正値: ${JSON.stringify(w._sourceTag)} (期待: ${SOURCE_TAG_ENUM.join('/')})`);
      }
    }
  }

  // 9. flow per-pattern structure
  const flow = Array.isArray(doc.flow) ? doc.flow : [];
  for (const pid of patternIds) {
    const expected = [`intro_act_${pid}`, `pattern_${pid}`, `example_${pid}`, `practice_${pid}`];
    for (const id of expected) {
      const hit = flow.find((s) => s.id === id);
      if (!hit) warn(`flow に "${id}" が無い（per-pattern 構造の期待値）`);
    }
  }
}

async function main() {
  const files = explicit.length > 0
    ? explicit.map((p) => resolve(ROOT, p))
    : await findLessonFiles();

  const errors = [];
  const warns = [];
  for (const f of files) {
    try {
      const doc = JSON.parse(await readFile(f, 'utf-8'));
      checkLesson(f, doc, errors, warns);
    } catch (e) {
      errors.push({ file: basename(f), msg: `読み込み失敗: ${e.message}` });
    }
  }

  // invariants.mjs を内部で呼び出す（"npm run validate" 1 本に統合）
  const inv = await runInvariants();
  for (const e of inv.errors) errors.push({ file: 'invariants', msg: e });
  for (const w of inv.warns) warns.push({ file: 'invariants', msg: w });

  const fileNames = files.map((f) => basename(f));
  if (asJson) {
    process.stdout.write(JSON.stringify({
      files: fileNames, errors, warns, invariants_info: inv.infos,
    }, null, 2) + '\n');
  } else {
    const out = [];
    out.push(`checked: ${fileNames.join(', ')}`);
    out.push(`ERROR: ${errors.length}`);
    for (const e of errors) out.push(`  [${e.file}] ${e.msg}`);
    out.push(`WARN:  ${warns.length}`);
    for (const w of warns) out.push(`  [${w.file}] ${w.msg}`);
    out.push(`INFO:  ${inv.infos.length}`);
    for (const i of inv.infos) out.push(`  - ${i}`);
    process.stdout.write(out.join('\n') + '\n');
  }
  process.exit(errors.length > 0 ? 1 : 0);
}

await main();
