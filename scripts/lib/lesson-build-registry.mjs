#!/usr/bin/env node
// scripts/lib/lesson-build-registry.mjs
//
// /lesson-build-registry NN の本体。data/lesson_NN.json が参照する全
// imageId / audioId について、master_image_registry / master_audio_registry に
// pending entry が無ければ提案する (dry-run) / 書き込む (--apply)。
//
// 走査対象:
//   (1) vocabulary.byPattern[*].words[].imageId / .audioId
//   (2) patterns[].examples[].imageId / .audioId
//   (3) flow[].materialNeeds[].type === 'auto_generated_vocab' の keywords[] →
//        該当 keyword が当課 vocabulary に無い時のみ vocab_{kw} を追加候補に出す
//        (vocabulary に既にあれば (1) で扱われるので二重登録しない)
//
// 既存 entry の扱い:
//   - 存在 + usedInLessons に NN 含む → skip
//   - 存在 + usedInLessons に NN 不在 → 提案: usedInLessons に NN 追加
//   - 不在 → 提案: pending entry を新規作成
//
// 使い方:
//   node scripts/lib/lesson-build-registry.mjs --no NN [--apply] [--json]

import fs from "node:fs";

const IMG_REGISTRY = "data/master_image_registry.json";
const AUD_REGISTRY = "data/master_audio_registry.json";

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
  console.log(`/lesson-build-registry helper

  --no NN     対象課 (1-99)。必須。
  --apply     master_*_registry.json を上書き (既定: dry-run)
  --json      JSON 出力
  --help      このヘルプ
`);
}

function zeroPad(n) { return String(n).padStart(2, "0"); }
function loadJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${zeroPad(d.getMonth() + 1)}-${zeroPad(d.getDate())}`;
}

// ---- 走査: lesson から (imageId, audioId, 補助情報) の集合を抽出 ----

function collectVocabRefs(doc) {
  // [{imageId, audioId, word, reading, en, jlptLevel, imageRole, vocabType, group}]
  const out = [];
  const byPattern = (doc.vocabulary && doc.vocabulary.byPattern) || {};
  for (const [group, g] of Object.entries(byPattern)) {
    if (group.startsWith("_") || !Array.isArray(g.words)) continue;
    for (const w of g.words) {
      out.push({
        imageId: w.imageId || null,
        audioId: w.audioId || null,
        word: w.word,
        reading: w.reading,
        en: w.en,
        jlptLevel: w.jlptLevel,
        imageRole: w.imageRole,
        vocabType: w.vocabType,
        group,
      });
    }
  }
  return out;
}

function collectExampleRefs(doc) {
  // [{imageId, audioId, sentence, sentenceEn, patternId, no, imageRole}]
  const out = [];
  for (const p of doc.patterns || []) {
    for (const ex of p.examples || []) {
      out.push({
        imageId: ex.imageId || null,
        audioId: ex.audioId || null,
        sentence: ex.sentence,
        sentenceEn: ex.sentenceEn,
        patternId: p.id,
        no: ex.no,
        imageRole: ex.imageRole,
      });
    }
  }
  return out;
}

function normalizeKeyword(raw) {
  // 「アインシュタイン（generic elderly man with white hair）」のような
  // 説明付き keyword は括弧以降を落として基底語にする。
  // 全/半角の括弧両方に対応。
  if (typeof raw !== "string") return null;
  const stripped = raw.replace(/[（(].*?[)）]/g, "").trim();
  if (!stripped) return null;
  return stripped;
}

function collectMaterialKeywords(doc, vocabIndex) {
  // [{imageIdGuess: 'vocab_{kw}'|'word_{kw}', keyword, sourceStepId, raw}]
  // vocabulary に既に存在する word は skip (vocabRefs で扱われる)
  const out = [];
  for (const step of doc.flow || []) {
    for (const m of step.materialNeeds || []) {
      if (m.type !== "auto_generated_vocab") continue;
      const kws = Array.isArray(m.keywords) ? m.keywords : [];
      for (const rawKw of kws) {
        const kw = normalizeKeyword(rawKw);
        if (!kw) continue;
        if (vocabIndex.has(kw)) continue;
        if (vocabIndex.has(rawKw)) continue; // raw 形でも一致するなら skip
        // 命名規則は lesson_01 = word_{kw}, lesson_02+ = vocab_{kw} だが、
        // lesson_NN.json の vocabulary が word_* を使っているなら同 prefix を使う
        out.push({
          imageIdGuess: vocabIndex.preferredPrefix + kw,
          keyword: kw,
          raw: rawKw === kw ? null : rawKw,
          sourceStepId: step.id,
        });
      }
    }
  }
  return out;
}

function buildVocabIndex(doc) {
  // word 文字列 → imageId の map + 課全体で使われている prefix を観測
  const idx = new Map();
  let preferredPrefix = "vocab_"; // default for lesson 2+
  const byPattern = (doc.vocabulary && doc.vocabulary.byPattern) || {};
  for (const g of Object.values(byPattern)) {
    if (!Array.isArray(g.words)) continue;
    for (const w of g.words) {
      idx.set(w.word, w.imageId);
      if (typeof w.imageId === "string" && w.imageId.startsWith("word_")) preferredPrefix = "word_";
    }
  }
  idx.preferredPrefix = preferredPrefix;
  return idx;
}

// ---- 提案ロジック ----

function deriveContext(imageRole, vocabType) {
  // image registry の context フィールドへの map (緩い推定)
  if (imageRole === "vocab_person") return "vocabulary_person";
  if (imageRole === "vocab_object") return "vocabulary_object";
  if (imageRole === "scene") return "vocabulary_scene";
  if (imageRole === "contrast") return "vocabulary_contrast";
  return null;
}

function proposeImageEntry(ref, lessonNo, kind) {
  // kind ∈ {'vocab', 'example', 'keyword'}
  const NN = lessonNo;
  if (kind === "example") {
    return {
      type: "example_images",
      lesson: NN,
      patternId: ref.patternId,
      sentence: ref.sentence,
      sentenceEn: ref.sentenceEn,
      slot: `文型${ref.patternId} 例文 ${ref.no}`,
      status: "pending",
      images: [{
        imageId: `${ref.imageId}_img`,
        filename: `${ref.imageId}.png`,
        imageUrl: null,
        promptRef: `image_prompts_lesson${NN}.json#${ref.imageId}`,
        generatedAt: null,
        regenerate: false,
      }],
    };
  }
  // vocab / keyword
  const ctx = deriveContext(ref.imageRole, ref.vocabType);
  return {
    type: "auto_generated_vocab",
    word: ref.word || ref.keyword,
    reading: ref.reading || null,
    en: ref.en || null,
    context: ctx,
    firstLesson: NN,
    usedInLessons: [NN],
    status: "pending",
    images: [{
      imageId: `${ref.imageId || ref.imageIdGuess}_001`,
      filename: `${ref.imageId || ref.imageIdGuess}.png`,
      imageUrl: null,
      promptRef: `image_prompts_lesson${zeroPad(NN)}.json#${ref.imageId || ref.imageIdGuess}`,
      generatedAt: null,
      regenerate: false,
    }],
  };
}

function proposeAudioEntry(ref, lessonNo, kind) {
  // audio registry は status field を使わない。pending 状態は
  // {audioUrl: null, _addedBy, _addedAt, _firstLesson} で表現する。
  if (kind === "example") {
    return {
      audioUrl: null,
      sentence: ref.sentence,
      _addedBy: "lesson-build-registry",
      _addedAt: today(),
      _firstLesson: lessonNo,
    };
  }
  return {
    audioUrl: null,
    word: ref.word || ref.keyword,
    reading: ref.reading || null,
    _addedBy: "lesson-build-registry",
    _addedAt: today(),
    _firstLesson: lessonNo,
  };
}

// ---- main ----

function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); process.exit(0); }
  if (args.no === null || Number.isNaN(args.no) || args.no < 1 || args.no > 99) {
    console.error("--no NN (1-99) は必須"); printHelp(); process.exit(2);
  }
  const lessonPath = `data/lesson_${zeroPad(args.no)}.json`;
  if (!fs.existsSync(lessonPath)) { console.error(`lesson file not found: ${lessonPath}`); process.exit(2); }
  if (!fs.existsSync(IMG_REGISTRY)) { console.error(`image registry not found: ${IMG_REGISTRY}`); process.exit(2); }
  if (!fs.existsSync(AUD_REGISTRY)) { console.error(`audio registry not found: ${AUD_REGISTRY}`); process.exit(2); }

  const doc = loadJson(lessonPath);
  const imgReg = loadJson(IMG_REGISTRY);
  const audReg = loadJson(AUD_REGISTRY);

  const vocabIdx = buildVocabIndex(doc);
  const vocabRefs = collectVocabRefs(doc);
  const exampleRefs = collectExampleRefs(doc);
  const keywordRefs = collectMaterialKeywords(doc, vocabIdx);

  const imgEntries = imgReg.entries || {};
  const audEntries = audReg.entries || {};

  const proposals = {
    image: { new: [], usedInUpdate: [], existsOk: [], missingId: [] },
    audio: { new: [], existsOk: [], missingId: [] },
  };

  // helper
  const addImg = (id, ref, kind) => {
    if (!id) { proposals.image.missingId.push({ kind, ref }); return; }
    const existing = imgEntries[id];
    if (existing) {
      if (Array.isArray(existing.usedInLessons) && !existing.usedInLessons.includes(args.no)) {
        proposals.image.usedInUpdate.push({ id, addLesson: args.no, currentUsedIn: existing.usedInLessons });
      } else {
        proposals.image.existsOk.push({ id, kind });
      }
      return;
    }
    proposals.image.new.push({ id, kind, entry: proposeImageEntry({ ...ref, imageId: id }, args.no, kind) });
  };
  const addAud = (id, ref, kind) => {
    if (!id) { proposals.audio.missingId.push({ kind, ref }); return; }
    const existing = audEntries[id];
    if (existing) {
      proposals.audio.existsOk.push({ id, kind });
      return;
    }
    proposals.audio.new.push({ id, kind, entry: proposeAudioEntry(ref, args.no, kind) });
  };

  for (const v of vocabRefs) {
    addImg(v.imageId, v, "vocab");
    addAud(v.audioId, v, "vocab");
  }
  for (const ex of exampleRefs) {
    addImg(ex.imageId, ex, "example");
    addAud(ex.audioId, ex, "example");
  }
  for (const kw of keywordRefs) {
    addImg(kw.imageIdGuess, kw, "keyword");
  }

  // --apply
  if (args.apply && (proposals.image.new.length || proposals.image.usedInUpdate.length || proposals.audio.new.length)) {
    for (const { id, entry } of proposals.image.new) imgEntries[id] = entry;
    for (const { id, addLesson } of proposals.image.usedInUpdate) {
      const e = imgEntries[id];
      if (e && Array.isArray(e.usedInLessons) && !e.usedInLessons.includes(addLesson)) {
        e.usedInLessons = [...e.usedInLessons, addLesson].sort((a, b) => a - b);
      }
    }
    for (const { id, entry } of proposals.audio.new) audEntries[id] = entry;

    // _meta lastModified bump
    if (imgReg._meta) {
      imgReg._meta.lastUpdated = today();
      imgReg._meta.lastModifiedBy = "lesson-build-registry";
      imgReg._meta.totalEntries = Object.keys(imgEntries).length;
    }
    if (audReg._meta) {
      audReg._meta.lastModified = today();
      audReg._meta.totalEntries = Object.keys(audEntries).length;
    }

    fs.writeFileSync(IMG_REGISTRY, JSON.stringify(imgReg, null, 2) + "\n", "utf8");
    fs.writeFileSync(AUD_REGISTRY, JSON.stringify(audReg, null, 2) + "\n", "utf8");
  }

  // 報告
  if (args.asJson) {
    process.stdout.write(JSON.stringify({
      file: lessonPath,
      mode: args.apply ? "apply" : "dry-run",
      counts: {
        image: {
          new: proposals.image.new.length,
          usedInUpdate: proposals.image.usedInUpdate.length,
          existsOk: proposals.image.existsOk.length,
          missingId: proposals.image.missingId.length,
        },
        audio: {
          new: proposals.audio.new.length,
          existsOk: proposals.audio.existsOk.length,
          missingId: proposals.audio.missingId.length,
        },
      },
      proposals,
    }, null, 2) + "\n");
  } else {
    const out = [];
    out.push(`target: ${lessonPath} (L${args.no})`);
    out.push(`mode:   ${args.apply ? "APPLY (registries modified)" : "dry-run (no changes written)"}`);
    out.push(``);
    out.push(`▼ image registry (${IMG_REGISTRY})`);
    out.push(`  new pending entries:    ${proposals.image.new.length}`);
    for (const x of proposals.image.new) out.push(`    + ${x.id}  (${x.kind})`);
    out.push(`  usedInLessons updates:  ${proposals.image.usedInUpdate.length}`);
    for (const x of proposals.image.usedInUpdate) out.push(`    ~ ${x.id}  + L${x.addLesson} (current: [${x.currentUsedIn.join(",")}])`);
    out.push(`  existing OK:            ${proposals.image.existsOk.length}`);
    out.push(`  lesson refs w/o id:     ${proposals.image.missingId.length}`);
    for (const x of proposals.image.missingId) out.push(`    ! ${x.kind} ref missing imageId: ${JSON.stringify({ word: x.ref.word, sentence: x.ref.sentence, keyword: x.ref.keyword })}`);
    out.push(``);
    out.push(`▼ audio registry (${AUD_REGISTRY})`);
    out.push(`  new pending entries:    ${proposals.audio.new.length}`);
    for (const x of proposals.audio.new) out.push(`    + ${x.id}  (${x.kind})`);
    out.push(`  existing OK:            ${proposals.audio.existsOk.length}`);
    out.push(`  lesson refs w/o id:     ${proposals.audio.missingId.length}`);
    if (!args.apply && (proposals.image.new.length || proposals.image.usedInUpdate.length || proposals.audio.new.length)) {
      out.push(``);
      out.push(`* dry-run のため未保存。書き戻すには --apply を付ける:`);
      out.push(`    node scripts/lib/lesson-build-registry.mjs --no ${args.no} --apply`);
    }
    process.stdout.write(out.join("\n") + "\n");
  }
  process.exit(0);
}

main();
