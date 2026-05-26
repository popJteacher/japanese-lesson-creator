#!/usr/bin/env node
// scripts/lib/lesson-scaffold.mjs
//
// /lesson-scaffold NN の本体。data/lesson_NN.json に v2.7 schema の
// placeholder skeleton を書き出す。seed JSON が渡されれば該当 field を
// pre-fill する。skeleton 生成は決定論的（LLM 不要）。
//
// 使い方:
//   node scripts/lib/lesson-scaffold.mjs --no NN [--patterns p1,p2,p3] [--force]
//                                        [--seed path/to/seed.json]
//
// seed.json 形式（全 field optional・存在するものだけ pre-fill する）:
//   {
//     "lesson": { "title": "こそあど", "topic": "...", "level": "..." },
//     "textbook_lesson_section": "第2課: こそあど",
//     "patterns": [
//       { "id": "p1", "pattern": "これ/それ/あれは〜です",
//         "label": "これ・それ・あれ", "jlptLevel": "N5",
//         "canDo": "...", "canDoEn": "...",
//         "grammarConcept": "...",
//         "practiceImageSource": "vocabulary",
//         "examples": [ { "no": "1-1", "sentence": "これは時計です。",
//                         "sentenceEn": "...", "isAnchor": true } ],
//         "vocabGroupKey": "p1"
//       }
//     ],
//     "vocabulary": {
//       "<groupKey>": {
//         "patternIds": ["p1"],
//         "description": "身近なもの",
//         "words": [
//           { "word": "時計", "reading": "とけい", "en": "clock",
//             "jlptLevel": "N5", "vocabType": "actual_object",
//             "imageRole": "vocab_object" }
//         ]
//       }
//     },
//     "namedCharacters": [],
//     "mainActivity": {
//       "activityName": "落としもの返しごっこ",
//       "fadingStage": "stage4〜5",
//       "taskType": "実物操作"
//     }
//   }
//
// 出力ファイル: data/lesson_NN.json
// 既存ファイルがあれば --force なしでは exit 1（事故防止）。

import fs from "node:fs";
import path from "node:path";

const TARGET_FORMAT_VERSION = "2.7";
const TARGET_LESSON_VERSION = "1.0";

function parseArgs(argv) {
  const args = {
    no: null,
    patterns: null,
    force: false,
    seed: null,
    out: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--force") args.force = true;
    else if (a === "--no") args.no = parseInt(argv[++i], 10);
    else if (a.startsWith("--no=")) args.no = parseInt(a.slice(5), 10);
    else if (a === "--patterns") args.patterns = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith("--patterns=")) args.patterns = a.slice(11).split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--seed") args.seed = argv[++i];
    else if (a.startsWith("--seed=")) args.seed = a.slice(7);
    else if (a === "--out") args.out = argv[++i];
    else if (a.startsWith("--out=")) args.out = a.slice(6);
    else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function printHelp() {
  console.log(`/lesson-scaffold helper

  --no NN              課番号 (1-99). 必須.
  --patterns p1,p2,p3  生成する pattern ID (既定: p1)
  --seed path.json     PDF 抽出 seed (optional)
  --force              data/lesson_NN.json が既存でも上書き
  --out path           出力先を上書き (既定: data/lesson_NN.json)
  --help               このヘルプ
`);
}

function zeroPad(n) {
  return String(n).padStart(2, "0");
}

function today() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${zeroPad(d.getUTCMonth() + 1)}-${zeroPad(d.getUTCDate())}`;
}

function loadSeed(seedPath) {
  if (!seedPath) return {};
  if (!fs.existsSync(seedPath)) {
    console.error(`seed file not found: ${seedPath}`);
    process.exit(2);
  }
  try {
    return JSON.parse(fs.readFileSync(seedPath, "utf8"));
  } catch (e) {
    console.error(`seed parse error: ${e.message}`);
    process.exit(2);
  }
}

// ---- skeleton builders ----

function buildMeta(no, seed) {
  return {
    formatVersion: TARGET_FORMAT_VERSION,
    lessonVersion: TARGET_LESSON_VERSION,
    description: "各課の設定ファイル(教育設計系 SSOT)。lesson_NN.json を編集するだけで全教材(教案・スライド・宿題・アクティビティ・image_prompts)の内容が変わる。",
    createdAt: today(),
    lastModified: today(),
    changes: [
      `v1.0 (${today()}): 初版 scaffold by /lesson-scaffold NN${seed?.__seeded ? " (PDF seed あり)" : ""}. 課マスター作成ルール 14 項目 (archive/handoffs/lesson_master_rules_handoff_v2.md §3) に従って 1a→1e の順で埋めること。`,
    ],
  };
}

function buildLesson(no, seed) {
  const ls = seed?.lesson || {};
  return {
    no,
    title: ls.title || `TODO_A-1: 第${no}課のテーマ (PDF 確認後)`,
    topic: ls.topic || "TODO_A-1: トピック",
    level: ls.level || "TODO: 初級前半(Lv.N) 等",
    target: ls.target || "TODO: 完全初心者(ひらがな学習済み)、年齢混在、マンツーマン・オンライン 等",
    _recommendedDuration: 50,
    _recommendedDuration_note: "目安値 (B-8)。session_NNN.json の session.duration で実時間を指定。",
    grammarMemo: {
      _note: "教師が文法上の注意点を集約するメモ。教科書本文の逐語コピーは行わないが、複数の参考文献を統合した教師の解釈・要約は推奨される。teacher_notes(教案docx)生成時に参照される。",
      general: ls.grammarGeneral || "TODO_C-12: 文法上の制約・注意点を集約",
      teacherNotes: "",
      _teacherNotes_note: "教師個人のメモ(授業を重ねて気づいたこと等)。教師のみが記入する自由記述欄。",
      references: [
        { label: `日本語の教え方ABC 第${no}課 文法知識の整理`, type: "textbook" },
      ],
    },
  };
}

function buildTextbookSources(no, seed) {
  return [
    {
      id: "ABC",
      name: "日本語の教え方ABC",
      publisher: null,
      lesson: no,
      section: seed?.textbook_lesson_section || `第${no}課`,
      isPrimary: true,
      narrativeStyle: "non_narrative",
      _comment: "現時点での主参考教科書。物語性なし(課ごとに単発キャラ)のため、例文に登場する固有名詞は教科書原典または教科書記号(Aさん・Bさん)を使用する。",
    },
  ];
}

function buildVocabulary(patternIds, seed) {
  const seedVocab = seed?.vocabulary || {};
  const byPattern = {};
  let totalWords = 0;

  // seed が指定する group key を優先採用 (例: "p1_p2_nationality" 等)。
  // seed なしの場合は pattern ごとに 1 group ずつ生成。
  const seedKeys = Object.keys(seedVocab);
  if (seedKeys.length > 0) {
    for (const key of seedKeys) {
      const group = seedVocab[key];
      const words = (group.words || []).map((w) => ({
        word: w.word || "TODO",
        reading: w.reading || "TODO",
        en: w.en || "TODO",
        jlptLevel: w.jlptLevel || "N5",
        isFirstAppearance: w.isFirstAppearance !== false,
        vocabType: w.vocabType || "vocabulary_card",
        imageRole: w.imageRole || "vocab_object",
        imageId: w.imageId || `word_${w.word || "TODO"}`,
        audioId: w.audioId || `word_${w.word || "TODO"}`,
        ...(w._note ? { _note: w._note } : {}),
        ...(w._inheritedFromLessonX ? { _inheritedFromLessonX: w._inheritedFromLessonX } : {}),
      }));
      byPattern[key] = {
        patternIds: group.patternIds || [key],
        vocabCount: words.length,
        description: group.description || "TODO_1b: PDF 読了後に語彙を埋める",
        words: words.length > 0 ? words : [makeWordPlaceholder()],
      };
      totalWords += byPattern[key].vocabCount;
    }
  } else {
    for (const pid of patternIds) {
      byPattern[pid] = {
        patternIds: [pid],
        vocabCount: 0,
        description: `TODO_1b: ${pid} で使用する語彙を PDF 読了後に追加`,
        words: [makeWordPlaceholder()],
      };
    }
  }

  return {
    _comment: "本課の採用語彙。派生物(スライド・宿題・materials・image_prompts)はこのリストに従う。",
    totalWords,
    readingNotation: "ひらがな(学習者向け表示と統一)",
    byPattern,
  };
}

function makeWordPlaceholder() {
  return {
    word: "TODO",
    reading: "TODO",
    en: "TODO",
    jlptLevel: "N5",
    isFirstAppearance: true,
    vocabType: "TODO_A-5: vocabulary_card | actual_object | scene_picture | contrast_picture",
    imageRole: "TODO_A-6: vocab_person | vocab_object | scene | contrast",
    imageId: "word_TODO",
    audioId: "word_TODO",
    _note: "B-5③: 絵カード化できない語の場合は理由をここに書く",
  };
}

function buildNamedCharacters(seed) {
  // A-2/A-3: 独自キャラ禁止。教科書原典固有名詞 or A/Bさん記号のみ。
  // 空配列で出力。コメントは _meta に書けないので外部で印字。
  return seed?.namedCharacters || [];
}

function buildPatterns(patternIds, no, seed) {
  const seedPatterns = seed?.patterns || [];
  const seedByPid = Object.fromEntries(seedPatterns.map((p) => [p.id, p]));

  return patternIds.map((pid, idx) => {
    const sp = seedByPid[pid] || {};
    const patternIdx = idx + 1; // 1-based for example numbering
    const examples = sp.examples && sp.examples.length > 0
      ? sp.examples.map((ex, j) => buildExample(ex, no, patternIdx, j))
      : [buildExample({}, no, patternIdx, 0, true)];

    return {
      id: pid,
      pattern: sp.pattern || `TODO: 〜は〜です 等の文型表現`,
      label: sp.label || `TODO: スライド表示用の短い label`,
      grammarConcept: sp.grammarConcept || "TODO: 文法概念 ID (例: noun_predicate_affirmative)",
      _grammarConcept_note: "教科書非依存の文法概念 ID。複数教科書対応の基盤。",
      jlptLevel: sp.jlptLevel || "N5",
      canDo: sp.canDo || "TODO_A-4: 「〜できる」で 1 文 (例: 自分の名前を「〜です」で言える)",
      canDoEn: sp.canDoEn || "TODO: Can ~",
      vocabCount: sp.vocabCount || 0,
      shareVocabWith: sp.shareVocabWith || null,
      examples,
      practiceImageSource: sp.practiceImageSource || "TODO_v19: vocabulary | namedCharacters | namedCharacters+vocab",
      practiceTemplates: sp.practiceTemplates && sp.practiceTemplates.length >= 2
        ? sp.practiceTemplates
        : [
            { pattern: "＿＿＿は＿＿＿です。", hint: "(肯定)" },
            { pattern: "＿＿＿は＿＿＿ですか。", hint: "(疑問)" },
          ],
      conversationPhrases: sp.conversationPhrases || [],
      plusAlpha: sp.plusAlpha || [],
      cautionNote: sp.cautionNote || [],
    };
  });
}

function buildExample(seedEx, no, patternIdx, exIdx, isPlaceholder = false) {
  const seqNo = seedEx.no || `${patternIdx}-${exIdx + 1}`;
  const imageIdx = String(patternIdx * 100 + exIdx + 1).padStart(3, "0");
  const imageId = seedEx.imageId || `ex_L${zeroPad(no)}_${imageIdx}`;
  return {
    no: seqNo,
    pattern: seedEx.pattern || "TODO",
    vocab: seedEx.vocab || null,
    sentence: seedEx.sentence || "TODO_A-1: PDF 照合後に記入",
    sentenceEn: seedEx.sentenceEn || "TODO",
    imageId,
    imageRole: seedEx.imageRole || "TODO_A-6: vocab_person | vocab_object | scene | contrast",
    originalSources: [
      {
        textbookId: "ABC",
        textbookName: "日本語の教え方ABC",
        lesson: no,
        originalSentence: seedEx.originalSentence || seedEx.sentence || "TODO_A-1",
        replacementNote: seedEx.replacementNote || "TODO_A-3: 原典固有名詞を変えた場合はここに理由",
      },
    ],
    _comment: seedEx._comment || (isPlaceholder ? "TODO_1c: PDF 照合後に例文を記入" : ""),
    audioId: `sentence_${imageId}`,
    isAnchor: seedEx.isAnchor === true,
    // optional γ2: ふりがな下に POS 線を引きたい例文だけ追加
    // "highlight": { "subject": "...", "particle": "は", "predicate": "...", "trailing": "です" }
  };
}

function buildFlow(patternIds, seed) {
  const flow = [
    {
      id: "review",
      type: "review",
      stage: "復習",
      _recommendedMinutes: 0,
      _recommendedMinutes_note: "目安値。session で実時間を指定。",
      enabled: false,
      optional: true,
      skipped: true,
      sourceLesson: null,
      patterns: [],
      materials: "スライド",
      _note: "次の課で前課を復習する場合に enabled: true・skipped: false にして使う。materialNeeds は review type の schema 規則により付与しない。",
    },
    {
      id: "intro_slide",
      type: "intro_slide",
      stage: "導入(スライド)",
      _recommendedMinutes: 3,
      _recommendedMinutes_note: "目安値。",
      optional: false,
      skipped: false,
      materials: "スライド",
      content: "今日のテーマ・学習目標を提示する。",
      _materialNeeds_note: "intro_slide type は materialNeeds 付与対象外(schema 規則)。",
    },
  ];

  for (const pid of patternIds) {
    flow.push(buildIntroActivityEntry(pid));
    flow.push(buildPatternEntry(pid));
    flow.push(buildExampleEntry(pid));
    flow.push(buildPracticeEntry(pid));
  }

  flow.push(buildMainActivityEntry(seed));
  flow.push(buildWrapUpEntry());

  return flow;
}

function buildIntroActivityEntry(pid) {
  return {
    id: `intro_act_${pid}`,
    type: "intro_activity",
    stage: `導入アクティビティ(${pid})`,
    patternRef: pid,
    activityId: "TODO_1e: intro_activity_catalog から選択 (act_picture_card_vocab_intro 等)",
    _recommendedMinutes: 5,
    _recommendedMinutes_note: "目安値。",
    optional: true,
    skipped: false,
    materials: "TODO_1d",
    materialNeeds: [
      {
        type: "TODO_B-7: auto_generated_vocab | named_character_card | special_slide | teacher_photo | world_map | special_handout | none",
        description: "TODO_1d: 例文確定後に必要素材を記入",
      },
    ],
    ABCactivityRef: {
      activityName: "TODO_1e",
      fadingStage: "TODO (stage1 〜 stage5)",
      taskType: "TODO",
      playerSteps: [],
    },
  };
}

function buildPatternEntry(pid) {
  return {
    id: `pattern_${pid}`,
    type: "pattern",
    stage: `文型(${pid})`,
    patternId: pid,
    _recommendedMinutes: 7,
    _recommendedMinutes_note: "目安値。",
    optional: false,
    skipped: false,
    materials: "スライド",
    content: "文型説明 → 語彙提示 → モデル → リピート。",
    materialNeeds: [
      {
        type: "none",
        description: "TODO_1d: 必要なら絵カード等を追加。板書のみで完結する場合は type: 'none' のまま。",
        _note: "pattern type の materialNeeds は optional (B-7)。",
      },
    ],
  };
}

function buildExampleEntry(pid) {
  return {
    id: `example_${pid}`,
    type: "example",
    stage: `例文まとめ (${pid})`,
    patternRef: pid,
    _recommendedMinutes: 2,
    _recommendedMinutes_note: "目安値。",
    optional: false,
    skipped: false,
    materials: "スライド",
    content: `${pid}の例文を確認する。`,
    _materialNeeds_note: "example type は materialNeeds 付与対象外(schema 規則)。",
  };
}

function buildPracticeEntry(pid) {
  return {
    id: `practice_${pid}`,
    type: "practice",
    stage: `練習しよう (${pid})`,
    patternRef: pid,
    _recommendedMinutes: 2,
    _recommendedMinutes_note: "目安値。",
    optional: false,
    skipped: false,
    materials: "スライド",
    content: `${pid}の practiceTemplates で口頭練習。`,
    _materialNeeds_note: "practice type の materialNeeds は極めて稀。第1課同様、口頭練習のみで完結する場合は省略。",
  };
}

function buildMainActivityEntry(seed) {
  const ma = seed?.mainActivity || {};
  return {
    id: "main_act_1",
    type: "main_activity",
    stage: "アクティビティ(メイン)",
    _recommendedMinutes: 0,
    _recommendedMinutes_note: "目安値。",
    optional: true,
    skipped: true,
    activityId: "TODO_1e: activity_catalog から選択",
    ABCactivityRef: {
      activityName: ma.activityName || "TODO_1e",
      fadingStage: ma.fadingStage || "TODO (stage1 〜 stage5)",
      taskType: ma.taskType || "TODO",
      playerSteps: ma.playerSteps || [],
    },
    materials: "(なし)",
    _skip_reason: "scaffold 初期値: skipped: true。教師が session で有効化するか、(a) 削除 (b) skipped: false に変更し activityId を catalog から選ぶ (c) 複数の main_activity エントリを追加する のいずれかが可能。",
    materialNeeds: [
      {
        type: "TODO_B-7: special_handout | named_character_card | none 等",
        description: "TODO_1d: アクティビティで必要な素材を記入。main_activity は materialNeeds 必須。",
      },
    ],
  };
}

function buildWrapUpEntry() {
  return {
    id: "wrapUp",
    type: "wrapUp",
    stage: "まとめ",
    _recommendedMinutes: 5,
    _recommendedMinutes_note: "目安値。",
    optional: false,
    skipped: false,
    materials: "スライド",
    content: "canDo を再確認しアンカー例文を読む。",
    _materialNeeds_note: "wrapUp type は materialNeeds 付与対象外(schema 規則)。",
  };
}

// ---- main ----

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (args.no === null || Number.isNaN(args.no) || args.no < 1 || args.no > 99) {
    console.error("--no NN (1-99) は必須");
    printHelp();
    process.exit(2);
  }

  const patternIds = args.patterns && args.patterns.length > 0 ? args.patterns : ["p1"];
  for (const pid of patternIds) {
    if (!/^p[1-9][0-9]?$/.test(pid)) {
      console.error(`invalid pattern id: ${pid} (expected p1, p2, ..., p99)`);
      process.exit(2);
    }
  }

  const seed = loadSeed(args.seed);
  if (args.seed) seed.__seeded = true;

  const outPath = args.out || `data/lesson_${zeroPad(args.no)}.json`;
  if (fs.existsSync(outPath) && !args.force) {
    console.error(`refuse to overwrite existing file: ${outPath}\n  --force を付けると上書きします。`);
    process.exit(1);
  }

  const lessonJson = {
    _meta: buildMeta(args.no, seed),
    lesson: buildLesson(args.no, seed),
    textbook_sources: buildTextbookSources(args.no, seed),
    textbook_compatibility_note: "教科書間の人物名差異は各課の examples[].originalSources で個別に管理する設計に統一。物語性のある教科書(みんなの日本語・げんき)を採用する場合は、examples[].sentence をその教科書の人物名で記述し、画像生成側は generic 人物として描画する。",
    vocabulary: buildVocabulary(patternIds, seed),
    namedCharacters: buildNamedCharacters(seed),
    patterns: buildPatterns(patternIds, args.no, seed),
    flow: buildFlow(patternIds, seed),
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(lessonJson, null, 2) + "\n", "utf8");
  console.log(`✅ wrote ${outPath} (patterns: ${patternIds.join(", ")}, seed: ${seed.__seeded ? "yes" : "no"})`);
}

main();
