/**
 * ================================================================
 * GASパイプライン 統合スクリプト
 * 最終更新: 2026-05-16 (v7.1)
 *
 * 変更履歴:
 *   v7.1: STYLE_RECIPE完全化（sub_color #6B7C85 + skin_tones 追加）
 *         OBJECT_SIGNATURES 辞書追加（concrete_object 識別シグネチャー）
 *         ABSTRACT_METAPHORS 辞書追加（TIAC メタファー辞書）
 *         buildConcreteObjectPrompt_() OBJECT_SIGNATURES を参照するよう更新
 *         buildAbstractConceptPrompt_() ABSTRACT_METAPHORS を参照するよう更新
 *   v7.0: classifyBatch JSONパース失敗修正（buildPrompt_ 冒頭に指示追加）
 *         MODELs修正: gemma-4-26b-a4b-it / imagen-4.0-generate-001
 *         setupExamplesSheet の insertCheckboxes 問題根本修正済み
 *
 * 全スクリプトを1ファイルに統合（GASスコープ共有のため）
 * ================================================================
 */


// ================================================================
// ▼▼▼ 共通定数 ▼▼▼
// ================================================================
const SPREADSHEET_ID = "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk";


// ================================================================
// setupSpreadsheet.gs
// Vocabulary / Examples / Log の3シートを作成・初期化する
// ================================================================

function setupAll() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  console.log("▶ Vocabulary シート セットアップ開始...");
  setupVocabularySheet(ss);

  console.log("▶ Examples シート セットアップ開始...");
  setupExamplesSheet(ss);

  console.log("▶ Log シート セットアップ開始...");
  setupLogSheet(ss);

  console.log("✓ セットアップ完了");
}

function setupVocabularySheet(ss) {
  const SHEET_NAME = "Vocabulary";
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    console.log(`  ✓ シート「${SHEET_NAME}」を新規作成しました`);
  } else {
    console.log(`  ✓ シート「${SHEET_NAME}」は既存。ヘッダー行のみ再適用します`);
    sheet.getRange(1, 1, 1, 14).clearContent();
  }

  const headers = [
    "word", "reading", "en", "jlptLevel", "pos", "vocab_type",
    "imageId", "imageStatus", "imageUrl",
    "audioId", "audioStatus", "audioUrl",
    "lessonRef", "source",
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#EAF4FF");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1,  100); sheet.setColumnWidth(2,  120);
  sheet.setColumnWidth(3,  150); sheet.setColumnWidth(4,   70);
  sheet.setColumnWidth(5,   80); sheet.setColumnWidth(6,  120);
  sheet.setColumnWidth(7,  150); sheet.setColumnWidth(8,  100);
  sheet.setColumnWidth(9,  300); sheet.setColumnWidth(10, 160);
  sheet.setColumnWidth(11, 100); sheet.setColumnWidth(12, 300);
  sheet.setColumnWidth(13, 100); sheet.setColumnWidth(14,  90);

  const statusValues = ["pending", "generated", "approved", "failed"];
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues, true).setAllowInvalid(false).build();
  sheet.getRange(2, 8,  999, 1).setDataValidation(statusRule); // H: imageStatus
  sheet.getRange(2, 11, 999, 1).setDataValidation(statusRule); // K: audioStatus

  const jlptRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["N5", "N4", "N3", "N2", "N1"], true).setAllowInvalid(false).build();
  sheet.getRange(2, 4, 999, 1).setDataValidation(jlptRule);

  const sourceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["goi_list", "lesson_import", "manual"], true).setAllowInvalid(false).build();
  sheet.getRange(2, 14, 999, 1).setDataValidation(sourceRule);

  console.log(`  ✓ Vocabulary シート セットアップ完了（14列）`);
}

function setupExamplesSheet(ss) {
  const SHEET_NAME = "Examples";
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    console.log(`  ✓ シート「${SHEET_NAME}」を新規作成しました`);
  } else {
    console.log(`  ✓ シート「${SHEET_NAME}」は既存。ヘッダー行のみ再適用します`);
    sheet.getRange(1, 1, 1, 9).clearContent();
  }

  const headers = [
    "id", "lessonNo", "patternId", "sentence", "sentenceEn",
    "textToSpeak", "audioStatus", "audioUrl", "isAnchor",
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#E8F5E9");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1,  200); sheet.setColumnWidth(2,   70);
  sheet.setColumnWidth(3,   80); sheet.setColumnWidth(4,  300);
  sheet.setColumnWidth(5,  300); sheet.setColumnWidth(6,  300);
  sheet.setColumnWidth(7,  100); sheet.setColumnWidth(8,  300);
  sheet.setColumnWidth(9,   80);

  const statusValues = ["pending", "generated", "approved", "failed"];
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues, true).setAllowInvalid(false).build();
  sheet.getRange(2, 7, 999, 1).setDataValidation(statusRule);

  // ⚠ insertCheckboxes() をここで一括設定しない（1001行目問題の根本修正）
  // isAnchor チェックボックスは seedExamples() の appendRow 直後に1行ずつ追加する

  console.log(`  ✓ Examples シート セットアップ完了（9列）`);
}

function setupLogSheet(ss) {
  const SHEET_NAME = "Log";
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    console.log(`  ✓ シート「${SHEET_NAME}」を新規作成しました`);
  } else {
    console.log(`  ✓ シート「${SHEET_NAME}」は既存。ヘッダー行のみ再適用します`);
    sheet.getRange(1, 1, 1, 6).clearContent();
  }

  const headers = ["date", "type", "id", "status", "url", "error"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#FFF3E0");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 180); sheet.setColumnWidth(2,  90);
  sheet.setColumnWidth(3, 160); sheet.setColumnWidth(4,  90);
  sheet.setColumnWidth(5, 300); sheet.setColumnWidth(6, 400);

  console.log(`  ✓ Log シート セットアップ完了（6列）`);
}

function writeLog(type, id, status, url, error) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Log");
  if (!sheet) {
    console.warn("⚠ Log シートが見つかりません。setupAll() を先に実行してください。");
    return;
  }
  sheet.appendRow([new Date(), type || "", id || "", status || "", url || "", error || ""]);
}


// ================================================================
// seedLesson01.gs  v1.1
// lesson_01 の語彙17語・例文15件をスプレッドシートに投入する
// ================================================================

function seedVocabulary() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  if (!sheet) {
    console.error("✗ Vocabulary シートが見つかりません。setupAll() を先に実行してください。");
    return;
  }

  const existingWords = getExistingKeys(sheet, 1);

  const vocabData = [
    ["医者", "いしゃ", "doctor", "N5", "名詞", "person",
      "word_医者", "approved",
      "https://drive.google.com/uc?id=1cPNqVCE9yN86MoSmHl8c93lZJ_m2Hg-L",
      "word_医者", "pending", "", "lesson_01", "lesson_import"],
    ["会社員", "かいしゃいん", "company employee", "N5", "名詞", "person",
      "word_会社員", "approved",
      "https://drive.google.com/uc?id=1ir_ehC66_O8wyThw6HnkyBM2952uw1db",
      "word_会社員", "pending", "", "lesson_01", "lesson_import"],
    ["学生", "がくせい", "student", "N5", "名詞", "person",
      "word_学生", "approved",
      "https://drive.google.com/uc?id=1Yj33uWtHGy3cspUc7CDp8rkr-HiiWQub",
      "word_学生", "pending", "", "lesson_01", "lesson_import"],
    ["大学生", "だいがくせい", "university student", "N5", "名詞", "person",
      "word_大学生", "pending", "",
      "word_大学生", "pending", "", "lesson_01", "lesson_import"],
    ["先生", "せんせい", "teacher", "N5", "名詞", "person",
      "word_先生", "approved",
      "https://drive.google.com/uc?id=1kaO3cq5VVapkRALMpjlTY59DPdKMJ6fP",
      "word_先生", "pending", "", "lesson_01", "lesson_import"],
    ["日本人", "にほんじん", "Japanese", "N5", "名詞", "person",
      "word_日本人", "pending", "",
      "word_日本人", "pending", "", "lesson_01", "lesson_import"],
    ["中国人", "ちゅうごくじん", "Chinese", "N5", "名詞", "person",
      "word_中国人", "pending", "",
      "word_中国人", "pending", "", "lesson_01", "lesson_import"],
    ["アメリカ人", "アメリカじん", "American", "N5", "名詞", "person",
      "word_アメリカ人", "pending", "",
      "word_アメリカ人", "pending", "", "lesson_01", "lesson_import"],
    ["韓国人", "かんこくじん", "Korean", "N5", "名詞", "person",
      "word_韓国人", "pending", "",
      "word_韓国人", "pending", "", "lesson_01", "lesson_import"],
    ["ブラジル人", "ブラジルじん", "Brazilian", "N5", "名詞", "person",
      "word_ブラジル人", "pending", "",
      "word_ブラジル人", "pending", "", "lesson_01", "lesson_import"],
    ["ベトナム人", "ベトナムじん", "Vietnamese", "N5", "名詞", "person",
      "word_ベトナム人", "pending", "",
      "word_ベトナム人", "pending", "", "lesson_01", "lesson_import"],
    ["スペイン人", "スペインじん", "Spanish", "N5", "名詞", "person",
      "word_スペイン人", "pending", "",
      "word_スペイン人", "pending", "", "lesson_01", "lesson_import"],
    ["病院", "びょういん", "hospital", "N5", "名詞", "building",
      "word_病院", "pending", "",
      "word_病院", "pending", "", "lesson_01", "lesson_import"],
    ["学校", "がっこう", "school", "N5", "名詞", "building",
      "word_学校", "approved",
      "https://drive.google.com/uc?id=1LXAQnSjEi51XszDgn-Q3T3jyLtD3z0AV",
      "word_学校", "pending", "", "lesson_01", "lesson_import"],
    ["銀行", "ぎんこう", "bank", "N5", "名詞", "building",
      "word_銀行", "approved",
      "https://drive.google.com/uc?id=1nb__rAgExUL8hika2kO6Qi0vEKUbmyGF",
      "word_銀行", "pending", "", "lesson_01", "lesson_import"],
    ["大学", "だいがく", "university", "N5", "名詞", "building",
      "word_大学", "approved",
      "https://drive.google.com/uc?id=1O0-ekEsDTXUUc2MGjhL7ftpfmjS2SM_h",
      "word_大学", "pending", "", "lesson_01", "lesson_import"],
    ["デパート", "デパート", "department store", "N5", "名詞", "building",
      "word_デパート", "approved",
      "https://drive.google.com/uc?id=1gUyeTYx80SiUMAFArJf4tV3MLCWWhnIj",
      "word_デパート", "pending", "", "lesson_01", "lesson_import"],
  ];

  let addedCount = 0, skippedCount = 0;
  for (const row of vocabData) {
    const word = row[0];
    if (existingWords.has(word)) {
      console.log(`  ⏭ スキップ（既存）: ${word}`);
      skippedCount++;
      continue;
    }
    sheet.appendRow(row);
    console.log(`  ✓ 追加: ${word}`);
    addedCount++;
  }

  console.log(`\n Vocabulary 投入完了: ${addedCount}件追加 / ${skippedCount}件スキップ`);
  writeLog("seed", "seedVocabulary", `✓ ${addedCount}追加/${skippedCount}スキップ`, "", "");
}

function seedExamples() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Examples");
  if (!sheet) {
    console.error("✗ Examples シートが見つかりません。setupAll() を先に実行してください。");
    return;
  }

  const existingIds = getExistingKeys(sheet, 1);

  const examplesData = [
    ["sentence_ex_L01_001", 1, "p1", "鈴木さんは先生です。",
      "Suzuki-san is a teacher.", "鈴木さんは先生です。", "pending", "", true],
    ["sentence_ex_L01_002", 1, "p1", "リンさんは大学生です。",
      "Lin-san is a university student.", "リンさんは大学生です。", "pending", "", false],
    ["sentence_ex_L01_003", 1, "p1", "キムさんは会社員です。",
      "Kim-san is a company employee.", "キムさんは会社員です。", "pending", "", false],
    ["sentence_ex_L01_004", 1, "p1", "鈴木さんは日本人です。",
      "Suzuki-san is Japanese.", "鈴木さんは日本人です。", "pending", "", false],
    ["sentence_ex_L01_005", 1, "p1", "リンさんは中国人です。",
      "Lin-san is Chinese.", "リンさんは中国人です。", "pending", "", false],
    ["sentence_ex_L01_006", 1, "p2", "リンさんですか。",
      "Is it Lin-san?", "リンさんですか。", "pending", "", false],
    ["sentence_ex_L01_007", 1, "p2",
      "はい、リンさんです。/ いいえ、リンさんじゃありません。",
      "Yes, it's Lin-san. / No, it's not Lin-san.",
      "はい、リンさんです。いいえ、リンさんじゃありません。", "pending", "", false],
    ["sentence_ex_L01_008", 1, "p2",
      "先生ですか。→ はい、先生です。/ いいえ、先生じゃありません。",
      "Are you a teacher? → Yes, I am. / No, I'm not.",
      "先生ですか。はい、先生です。いいえ、先生じゃありません。", "pending", "", true],
    ["sentence_ex_L01_009", 1, "p2",
      "韓国人ですか。→ はい、韓国人です。/ いいえ、韓国人じゃありません。",
      "Are you Korean? → Yes, I am. / No, I'm not.",
      "韓国人ですか。はい、韓国人です。いいえ、韓国人じゃありません。", "pending", "", false],
    ["sentence_ex_L01_010", 1, "p2", "だれですか。→ キムさんです。",
      "Who is it? → It's Kim-san.", "だれですか。キムさんです。", "pending", "", false],
    ["sentence_ex_L01_011", 1, "p3", "タノムさんは東西病院の医者です。",
      "Tanom-san is a doctor at Tozai Hospital.", "タノムさんは東西病院の医者です。", "pending", "", false],
    ["sentence_ex_L01_012", 1, "p3", "鈴木さんは東西学校の先生です。",
      "Suzuki-san is a teacher at Tozai School.", "鈴木さんは東西学校の先生です。", "pending", "", false],
    ["sentence_ex_L01_013", 1, "p3", "キムさんは東西銀行の会社員です。",
      "Kim-san is an employee at Tozai Bank.", "キムさんは東西銀行の会社員です。", "pending", "", false],
    ["sentence_ex_L01_014", 1, "p3", "リンさんは東西大学の学生です。",
      "Lin-san is a student at Tozai University.", "リンさんは東西大学の学生です。", "pending", "", true],
    ["sentence_ex_L01_015", 1, "p3", "キムさんは東西デパートの会社員です。",
      "Kim-san is an employee at Tozai Department Store.",
      "キムさんは東西デパートの会社員です。", "pending", "", false],
  ];

  let addedCount = 0, skippedCount = 0;
  for (const row of examplesData) {
    const id = row[0];
    if (existingIds.has(id)) {
      console.log(`  ⏭ スキップ（既存）: ${id}`);
      skippedCount++;
      continue;
    }
    sheet.appendRow(row);
    // ✓ isAnchor（I列=9列目）のチェックボックスを1行ずつ追加（1001行目問題の根本修正）
    sheet.getRange(sheet.getLastRow(), 9).insertCheckboxes();
    console.log(`  ✓ 追加: ${id}`);
    addedCount++;
  }

  console.log(`\n Examples 投入完了: ${addedCount}件追加 / ${skippedCount}件スキップ`);
  writeLog("seed", "seedExamples", `✓ ${addedCount}追加/${skippedCount}スキップ`, "", "");
}

function seedAll() {
  console.log("=== lesson_01 シードデータ投入 開始 ===");
  seedVocabulary();
  seedExamples();
  console.log("=== lesson_01 シードデータ投入 完了 ===");
}

function getExistingKeys(sheet, colIndex) {
  const keys    = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return keys;
  const values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (const [val] of values) {
    if (val !== "" && val !== null) keys.add(String(val));
  }
  return keys;
}


// ================================================================
// extractFromGoiList.gs  v1.0
// Goi_List.pdf（テキスト形式）から N5語彙をすくって投入する
// ================================================================

const EXTRACT_SETTINGS = {
  SPREADSHEET_ID:   "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk",
  GOI_LIST_FILE_ID: "1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA",
  TARGET_LEVELS:    ["1.初級前半"],
  WRITE_LOG:        true,
};

const LEVEL_TO_JLPT = {
  "1.初級前半": "N5",
  "2.初級後半": "N4",
  "3.中級前半": "N3",
  "4.中級後半": "N2",
  "5.上級前半": "N2",
  "6.上級後半": "N1",
};

function extractN5() {
  const settings = Object.assign({}, EXTRACT_SETTINGS, { TARGET_LEVELS: ["1.初級前半"] });
  runExtract_(settings);
}

function extractByLevel() { runExtract_(EXTRACT_SETTINGS); }

function previewExtract() {
  const rawContent    = readGoiListFile_(EXTRACT_SETTINGS.GOI_LIST_FILE_ID);
  const allEntries    = parseGoiList_(rawContent);
  const targetEntries = filterByLevel_(allEntries, EXTRACT_SETTINGS.TARGET_LEVELS);
  console.log(`\n=== previewExtract ===`);
  console.log(`総エントリ数: ${allEntries.length} / 抽出: ${targetEntries.length}`);
  targetEntries.slice(0, 15).forEach((e, i) => {
    console.log(`[${i+1}] word="${e.word}" reading="${e.reading}" jlpt="${LEVEL_TO_JLPT[e.level]}" pos="${e.pos1}"`);
  });
}

function testGoiListRead() {
  console.log("=== testGoiListRead ===");
  try {
    const content = readGoiListFile_(EXTRACT_SETTINGS.GOI_LIST_FILE_ID);
    const lines = content.split("\n");
    console.log(`✓ 読み込み成功 / 総行数: ${lines.length}`);
    lines.slice(0, 5).forEach((l, i) => console.log(`  [${i}] ${l.substring(0, 70)}`));
  } catch (e) {
    console.error(`✗ エラー: ${e.message}`);
  }
}

function runExtract_(settings) {
  const startTime = Date.now();
  console.log(`\n=== extractFromGoiList 開始 / 対象: ${settings.TARGET_LEVELS.join(", ")} ===`);

  const ss    = SpreadsheetApp.openById(settings.SPREADSHEET_ID);
  const vocab = ss.getSheetByName("Vocabulary");
  if (!vocab) throw new Error("Vocabularyシートが見つかりません。setupAll() を先に実行してください。");

  const rawContent    = readGoiListFile_(settings.GOI_LIST_FILE_ID);
  const allEntries    = parseGoiList_(rawContent);
  const targetEntries = filterByLevel_(allEntries, settings.TARGET_LEVELS);
  const existingWords = getExistingWords_(vocab);
  const newEntries    = targetEntries.filter(e => !existingWords.has(e.word));
  const skipped       = targetEntries.length - newEntries.length;

  console.log(`全${allEntries.length}語 / 対象${targetEntries.length}語 / 新規${newEntries.length}語 / スキップ${skipped}語`);
  if (newEntries.length === 0) {
    console.log("✓ 追加すべき新規語彙はありません。");
    if (settings.WRITE_LOG) writeLog("extract_goi", "N/A", "✓ 追加なし（全スキップ）", "", "");
    return;
  }

  const rowsWritten = appendGoiVocabRows_(vocab, newEntries);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const summary = `追加=${rowsWritten}語 スキップ=${skipped}語 / ${elapsed}s`;
  console.log(`\n✓ 完了: ${summary}`);
  if (settings.WRITE_LOG) writeLog("extract_goi", settings.TARGET_LEVELS.join(","), "✓ 完了", "", summary);
}

function readGoiListFile_(fileId) {
  const file = DriveApp.getFileById(fileId);
  const raw  = file.getBlob().getDataAsString("UTF-8");
  return fixGoiListEncoding_(raw);
}

function fixGoiListEncoding_(text) {
  return text.replace(/[\u46F3-\u471D]/g, function(c) {
    return String.fromCharCode(c.charCodeAt(0) - 0x1690);
  });
}

function parseGoiList_(content) {
  const rawLines = content.split("\n");
  const chunks = [];
  let current  = [];
  rawLines.forEach(function(line) {
    const trimmed = line.replace(/\r$/, "").trimEnd();
    if (trimmed === "") { if (current.length > 0) { chunks.push(current); current = []; } }
    else current.push(trimmed);
  });
  if (current.length > 0) chunks.push(current);

  function isMainChunk(chunk) {
    if (chunk.length === 0) return false;
    const first = chunk[0];
    if (first.startsWith("No ")) return true;
    return /^\d+$/.test(first.split(" ")[0]);
  }

  const mainQueue = [], goiPairs = [];
  chunks.forEach(function(chunk) {
    if (isMainChunk(chunk)) mainQueue.push(chunk);
    else goiPairs.push({ mainChunk: mainQueue.shift() || [], goiChunk: chunk });
  });
  mainQueue.forEach(function(chunk) { goiPairs.push({ mainChunk: chunk, goiChunk: [] }); });

  const entries = [];
  goiPairs.forEach(function(pair) {
    const mainRows = parseMainChunk_(pair.mainChunk);
    const goiRows  = parseGoiChunk_(pair.goiChunk);
    mainRows.forEach(function(row, i) {
      row.goiShurui = (goiRows[i] !== undefined) ? goiRows[i] : "";
      entries.push(row);
    });
  });
  return entries;
}

function parseMainChunk_(chunk) {
  const rows = [];
  chunk.forEach(function(line) {
    if (line.startsWith("No ")) return;
    const firstToken = line.split(" ")[0];
    if (!/^\d+$/.test(firstToken)) return;
    const parts    = line.split(" ", 6);
    if (parts.length < 4) return;
    const pos2Start = nthIndexOf_(line, " ", 5);
    const pos2      = pos2Start >= 0 ? line.substring(pos2Start + 1).trim() : "";
    rows.push({ no: parts[0], word: parts[1], reading: parts[2],
                level: parts[3], pos1: parts[4] || "", pos2: pos2, goiShurui: "" });
  });
  return rows;
}

function parseGoiChunk_(chunk) {
  const rows = [];
  chunk.forEach(function(line) {
    if (line === "語種 更新情報") return;
    const trimmed = line.trim();
    if (trimmed === "" || trimmed === "更新情報") return;
    rows.push(trimmed);
  });
  return rows;
}

function nthIndexOf_(str, ch, n) {
  let pos = -1;
  for (let i = 0; i < n; i++) {
    pos = str.indexOf(ch, pos + 1);
    if (pos === -1) return -1;
  }
  return pos;
}

function filterByLevel_(entries, targetLevels) {
  const levelSet = new Set(targetLevels);
  return entries.filter(e => levelSet.has(e.level));
}

function getExistingWords_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();
  const values  = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const wordSet = new Set();
  values.forEach(function(row) { const w = String(row[0]).trim(); if (w) wordSet.add(w); });
  return wordSet;
}

function appendGoiVocabRows_(sheet, entries) {
  if (entries.length === 0) return 0;
  const rows = entries.map(function(e) {
    const wordKey = "word_" + e.word;
    const jlpt    = LEVEL_TO_JLPT[e.level] || e.level;
    const reading = katakanaToHiragana_(e.reading);
    const pos     = normalizePOS_(e.pos1);
    return [e.word, reading, "", jlpt, pos, "", wordKey, "pending", "",
            wordKey, "pending", "", "", "goi_list"];
  });
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 14).setValues(rows);
  console.log(`  ✓ ${rows.length}行 を行${startRow}〜${startRow + rows.length - 1} に書き込みました`);
  return rows.length;
}

function katakanaToHiragana_(str) {
  return str.replace(/[\u30A1-\u30F6]/g, function(c) {
    return String.fromCharCode(c.charCodeAt(0) - 0x60);
  });
}

function normalizePOS_(pos1) {
  const map = { "動詞1類": "動詞", "動詞2類": "動詞", "動詞3類": "動詞",
                "イ形容詞": "形容詞", "ナ形容詞": "形容詞" };
  return map[pos1] || pos1;
}


// ================================================================
// importFromLessonJson.gs  v1.0
// lesson_NN.json の vocabulary を Vocabulary シートに差分追加する
// ================================================================

const IMPORT_SETTINGS = {
  SPREADSHEET_ID:   PropertiesService.getScriptProperties()
                      .getProperty("SPREADSHEET_ID") || "YOUR_SPREADSHEET_ID_HERE",
  VOCAB_SHEET_NAME: "Vocabulary",
  LOG_SHEET_NAME:   "Log",
};

const LESSON_FILE_IDS = {
  lesson_01: "1vKN8hDNRvdPOXTqywu8Lyskf-xRI3f0c",
  lesson_02: "1GyrtTYe9b-sPy10L4_XwB6dMmQdsfT2z",
};

const BUILDING_WORDS = new Set([
  "病院", "学校", "大学", "銀行", "デパート", "スーパー",
  "レストラン", "ホテル", "図書館", "駅", "会社", "工場",
  "郵便局", "警察署", "消防署", "市役所", "空港",
]);

function importLesson01() {
  const fileId = LESSON_FILE_IDS.lesson_01;
  if (fileId === "YOUR_LESSON_01_JSON_FILE_ID_HERE") {
    Logger.log("ERROR: LESSON_FILE_IDS.lesson_01 を設定してください"); return;
  }
  importByFileId(fileId, "lesson_01");
}

function importByFileId(lessonFileId, lessonName) {
  if (!lessonFileId) { Logger.log("ERROR: lessonFileId を指定してください"); return; }
  lessonName = lessonName || "lesson_unknown";
  Logger.log("===== importFromLessonJson 開始: " + lessonName + " =====");

  const lessonJson = loadJsonFromDrive_(lessonFileId);
  if (!lessonJson) { Logger.log("ERROR: JSON 読み込み失敗"); return; }

  const allWords = extractWordsFromLesson_(lessonJson, lessonName);
  Logger.log("lesson JSON から抽出: " + allWords.length + " 語");
  if (allWords.length === 0) { Logger.log("INFO: vocabulary セクションが空です"); return; }

  const ss    = SpreadsheetApp.openById(IMPORT_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(IMPORT_SETTINGS.VOCAB_SHEET_NAME);
  if (!sheet) { Logger.log("ERROR: Vocabulary シートが見つかりません"); return; }

  const existingWords = getExistingWords_(sheet);
  const newWords      = allWords.filter(function(w) { return !existingWords.has(w.word); });
  Logger.log("新規追加: " + newWords.length + " 語 / スキップ（既存）: " + (allWords.length - newWords.length) + " 語");
  if (newWords.length === 0) { Logger.log("INFO: 追加する新規語彙はありません"); return; }

  const writtenCount = appendVocabRows_(sheet, newWords);
  writeImportLog_(ss, lessonName, writtenCount, newWords.map(function(w) { return w.word; }).join(", "));
  Logger.log("===== 完了: " + newWords.map(function(w) { return w.word; }).join("、") + " =====");
}

function previewImportLesson01() { previewImport(LESSON_FILE_IDS.lesson_01, "lesson_01"); }

function previewImport(lessonFileId, lessonName) {
  lessonName = lessonName || "lesson_unknown";
  Logger.log("===== previewImport: " + lessonName + " (ドライラン) =====");
  const lessonJson = loadJsonFromDrive_(lessonFileId);
  if (!lessonJson) { Logger.log("ERROR: JSON 読み込み失敗"); return; }
  const allWords      = extractWordsFromLesson_(lessonJson, lessonName);
  const ss            = SpreadsheetApp.openById(IMPORT_SETTINGS.SPREADSHEET_ID);
  const sheet         = ss.getSheetByName(IMPORT_SETTINGS.VOCAB_SHEET_NAME);
  if (!sheet) { Logger.log("ERROR: シートが見つかりません"); return; }
  const existingWords = getExistingWords_(sheet);
  let newCount = 0, skipCount = 0;
  allWords.forEach(function(w) {
    if (!existingWords.has(w.word)) { Logger.log("  ✓ " + w.word); newCount++; }
    else { Logger.log("  ✗ " + w.word + " (既存)"); skipCount++; }
  });
  Logger.log("合計: " + newCount + " 語追加 / " + skipCount + " 語スキップ（ドライラン）");
}

function extractWordsFromLesson_(lessonJson, lessonName) {
  const words    = [];
  const seen     = new Set();
  const lessonNo = parseInt((lessonName || "lesson_01").replace(/[^0-9]/g, ""), 10) || 1;
  const byPattern = lessonJson && lessonJson.vocabulary && lessonJson.vocabulary.byPattern;
  if (!byPattern) { Logger.log("WARN: vocabulary.byPattern が見つかりません"); return words; }

  Object.keys(byPattern).forEach(function(groupKey) {
    const group = byPattern[groupKey];
    if (!group || !group.words || !Array.isArray(group.words)) return;
    group.words.forEach(function(w) {
      const word = String(w.word || "").trim();
      if (!word || seen.has(word)) return;
      seen.add(word);
      const imageRole = String(w.imageRole || "").trim();
      const vocabType = inferVocabType_(word, imageRole);
      const en        = String(w.en || "").trim();
      let jlpt        = String(w.jlptLevel || "N5").trim().toUpperCase();
      if (!jlpt.startsWith("N")) jlpt = "N5";
      words.push({
        word: word, reading: String(w.reading || "").trim(),
        en: en, jlptLevel: jlpt, pos: "名詞", vocab_type: vocabType,
        lessonRef: "lesson_" + String(lessonNo).padStart(2, "0"), source: "lesson_import",
      });
    });
  });
  return words;
}

function inferVocabType_(word, imageRole) {
  if (BUILDING_WORDS.has(word)) return "building";
  switch (imageRole) {
    case "vocab_person":    return "person";
    case "vocab_object":    return "concrete_object";
    case "vocab_action":    return "action_verb";
    case "vocab_adjective": return "adjective";
    default:                return "";
  }
}

function appendVocabRows_(sheet, entries) {
  if (!entries || entries.length === 0) return 0;
  const rows = entries.map(function(e) {
    const wordKey = "word_" + e.word;
    return [e.word, e.reading, e.en, e.jlptLevel, e.pos, e.vocab_type,
            wordKey, "pending", "", wordKey, "pending", "", e.lessonRef, e.source];
  });
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 14).setValues(rows);
  return rows.length;
}

function loadJsonFromDrive_(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return JSON.parse(file.getBlob().getDataAsString("utf-8"));
  } catch (e) {
    Logger.log("ERROR: JSON 読み込みエラー (fileId: " + fileId + "): " + e.message);
    return null;
  }
}

function writeImportLog_(ss, lessonName, count, wordList) {
  try {
    const logSheet = ss.getSheetByName(IMPORT_SETTINGS.LOG_SHEET_NAME);
    if (!logSheet) return;
    logSheet.appendRow([new Date(), "import", lessonName, "success", count + "語追加", wordList]);
  } catch (e) { Logger.log("WARN: ログ書き込み失敗: " + e.message); }
}


// ================================================================
// classifyAndTranslate.gs  v1.1
// en / vocab_type を Gemma 4 API で自動付与する
//
// v1.1 変更点:
//   MODEL: gemma-4-26b-a4b-it に修正（gemma-4-26b-it は存在しない）
//   buildPrompt_() 冒頭に "Do not think out loud..." を追加
//   → Gemma 4 の thinking mode による JSON パース失敗を防止
// ================================================================

const CLASSIFY_SETTINGS = {
  SPREADSHEET_ID:   PropertiesService.getScriptProperties()
                      .getProperty("SPREADSHEET_ID") || "YOUR_SPREADSHEET_ID_HERE",
  VOCAB_SHEET_NAME: "Vocabulary",
  LOG_SHEET_NAME:   "Log",
  // ✓ v1.1 修正: gemma-4-26b-a4b-it（gemma-4-26b-it は不正なモデル名）
  MODEL:            "gemma-4-26b-a4b-it",  // 代替: "gemma-4-31b-it"
  BATCH_SIZE:       3,
  SLEEP_MS:         500,
};

const VALID_VOCAB_TYPES = [
  // v2.5 既存型
  "person", "building", "concrete_object", "action_verb", "adjective",
  "abstract_concept", "spatial_relation", "demonstrative",
  // v2.6 新規型
  "pronoun", "interjection", "set_expression", "adverb", "counter",
  "time", "transportation", "family", "weather", "sensory",
  // fallback
  "other",
];

function classifyBatch() {
  const ss    = SpreadsheetApp.openById(CLASSIFY_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CLASSIFY_SETTINGS.VOCAB_SHEET_NAME);
  if (!sheet) { Logger.log("ERROR: Vocabulary シートが見つかりません"); return; }

  const pendingRows = getPendingRows_(sheet);
  if (pendingRows.length === 0) { Logger.log("INFO: 未処理の行はありません。"); return; }

  const batch = pendingRows.slice(0, CLASSIFY_SETTINGS.BATCH_SIZE);
  Logger.log("INFO: " + pendingRows.length + " 件が未処理 → 今回 " + batch.length + " 件処理");

  let successCount = 0, failCount = 0;
  batch.forEach(function(row, i) {
    try {
      Logger.log("  [" + (i+1) + "/" + batch.length + "] " + row.word + " を処理中...");
      const result = callGemmaAPI_(row.word, row.reading, row.pos);
      sheet.getRange(row.rowIndex, 3).setValue(result.en);
      sheet.getRange(row.rowIndex, 6).setValue(result.vocab_type);
      logToSheet_(ss, "classify", row.word, "success", result.en + " / " + result.vocab_type);
      successCount++;
    } catch (e) {
      Logger.log("  ERROR: " + row.word + " → " + e.message);
      logToSheet_(ss, "classify", row.word, "failed", e.message);
      failCount++;
    }
    if (i < batch.length - 1) Utilities.sleep(CLASSIFY_SETTINGS.SLEEP_MS);
  });

  Logger.log("=== 完了 ===");
  Logger.log("  成功: " + successCount + " / 失敗: " + failCount);
  Logger.log("  残り: " + (pendingRows.length - batch.length) + " 件（次回実行で処理）");
}

function previewClassify() {
  const ss    = SpreadsheetApp.openById(CLASSIFY_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CLASSIFY_SETTINGS.VOCAB_SHEET_NAME);
  if (!sheet) { Logger.log("ERROR: シートが見つかりません"); return; }
  const pendingRows = getPendingRows_(sheet);
  Logger.log("未処理件数: " + pendingRows.length);
  pendingRows.slice(0, 5).forEach(function(row, i) {
    try {
      const result = callGemmaAPI_(row.word, row.reading, row.pos);
      Logger.log("[" + (i+1) + "] " + row.word + " → en: " + result.en + " / vocab_type: " + result.vocab_type);
    } catch (e) { Logger.log("[" + (i+1) + "] " + row.word + " → ERROR: " + e.message); }
    Utilities.sleep(CLASSIFY_SETTINGS.SLEEP_MS);
  });
}

function reclassifyWords(targetWords) {
  if (!targetWords || targetWords.length === 0) { Logger.log("ERROR: targetWords が空です"); return; }
  const ss        = SpreadsheetApp.openById(CLASSIFY_SETTINGS.SPREADSHEET_ID);
  const sheet     = ss.getSheetByName(CLASSIFY_SETTINGS.VOCAB_SHEET_NAME);
  if (!sheet) { Logger.log("ERROR: シートが見つかりません"); return; }
  const targetSet = new Set(targetWords);
  const targets   = getAllVocabRows_(sheet).filter(function(r) { return targetSet.has(r.word); });
  if (targets.length === 0) { Logger.log("INFO: 対象語が見つかりませんでした"); return; }
  Logger.log("INFO: " + targets.length + " 件を再処理します");
  targets.forEach(function(row) {
    try {
      const result = callGemmaAPI_(row.word, row.reading, row.pos);
      sheet.getRange(row.rowIndex, 3).setValue(result.en);
      sheet.getRange(row.rowIndex, 6).setValue(result.vocab_type);
      Logger.log("  ✓ " + row.word + " → " + result.en + " / " + result.vocab_type);
      logToSheet_(ss, "reclassify", row.word, "success", result.en + " / " + result.vocab_type);
    } catch (e) {
      Logger.log("  ERROR: " + row.word + " → " + e.message);
      logToSheet_(ss, "reclassify", row.word, "failed", e.message);
    }
    Utilities.sleep(CLASSIFY_SETTINGS.SLEEP_MS);
  });
}

// =====================================================================
// classifyBatch を毎日1回（8:00）実行するトリガーを登録する
// ※ 毎時実行が不要になった場合はこちらに切り替える
// =====================================================================
function setupDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "classifyBatch") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("classifyBatch")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  Logger.log("INFO: classifyBatch の日次トリガーを設定しました（毎日 8:00）");
}

function setupHourlyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "classifyBatch") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("classifyBatch").timeBased().everyHours(1).create();
  Logger.log("✓ classifyBatch を1時間ごとに設定しました");
}

function callGemmaAPI_(word, reading, pos) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY が ScriptProperties に設定されていません");

  const url     = "https://generativelanguage.googleapis.com/v1beta/models/"
                  + CLASSIFY_SETTINGS.MODEL + ":generateContent?key=" + apiKey;
  const prompt  = buildPrompt_(word, reading, pos);
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 100, topP: 0.9,},
  };
  const options = { method: "post", contentType: "application/json",
                    payload: JSON.stringify(payload), muteHttpExceptions: true,};

  const response   = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();
  if (statusCode !== 200) {
    throw new Error("API エラー: HTTP " + statusCode + " / " + response.getContentText());
  }
  return parseGemmaResponse_(JSON.parse(response.getContentText()), word);
}

function buildPrompt_(word, reading, pos) {
  const vocabTypeList = VALID_VOCAB_TYPES.join(", ");
  return [
    // ✓ v1.1 修正: thinking mode による余計な出力を抑制
    "You are a Japanese vocabulary classifier for JLPT learners. Do not think out loud. Do not self-correct. Output only the JSON object and nothing else.",
    "Given a Japanese word, return ONLY a JSON object with these two keys:",
    '- "en": English translation (short, 1-4 words, lowercase)',
    '- "vocab_type": one of [' + vocabTypeList + ']',
    "",
    "Vocab type guide:",
    "  person          → words for people (医者, 学生, 先生, 会社員, etc.)",
    "  building        → buildings / facilities (病院, 学校, 銀行, 大学, etc.)",
    "  concrete_object → tangible items (本, ペン, 財布, 電話, etc.)",
    "  action_verb     → verbs / actions (食べる, 読む, 飲む, 行く, etc.)",
    "  adjective       → i-adj / na-adj (大きい, 新しい, 便利, etc.)",
    "  abstract_concept→ abstract nouns (時間, 気持ち, 意見, etc.)",
    "  spatial_relation→ location words (上, 下, 右, 左, そば, etc.)",
    "  demonstrative   → ko-so-a-do words (これ, それ, あれ, どれ, etc.)",
    "── New types (K-T) ──",
    "  pronoun         ← personal/interrogative pronouns (わたし, あなた, だれ, etc.)",
    "  interjection    ← response/filler words (はい, いいえ, あ, etc.)",
    "  set_expression  ← fixed social phrases (おはよう, いただきます, etc.)",
    "  adverb          ← degree/frequency/manner/time adverbs (とても, いつも, etc.)",
    "  counter         ← counter suffixes (〜本, 〜枚, 〜冊, etc.)",
    "  time            ← time words (〜時, 〜曜日, 季節, etc.)",
    "  transportation  ← vehicles (電車, バス, タクシー, etc.)",
    "  family          ← family terms (父, 母, お父さん, etc.)",
    "  weather         ← weather/nature (雨, 雪, 晴れ, etc.)",
    "  sensory         ← perception verbs (見ます, 聞きます, etc.)",
    "  other           → anything that doesn't fit above",
    "",
    "Word:    " + word,
    "Reading: " + reading,
    "POS:     " + pos,
    "",
    "Return ONLY valid JSON. No explanation. No markdown. No backticks.",
    'Example: {"en": "doctor", "vocab_type": "person"}',
  ].join("\n");
}

function parseGemmaResponse_(responseJson, word) {
  let rawText = "";
  try { rawText = responseJson.candidates[0].content.parts[0].text.trim(); }
  catch (e) { throw new Error("レスポンス構造が不正: " + JSON.stringify(responseJson).substring(0, 200)); }

  rawText = rawText
    .replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();

  const start = rawText.indexOf('{');
if (start === -1) throw new Error("JSONが見つかりません: " + rawText.substring(0, 200));
const end = rawText.indexOf('}', start);
if (end === -1) throw new Error("JSONが見つかりません: " + rawText.substring(0, 200));
const jsonMatch = [rawText.substring(start, end + 1)];

  let parsed;
  try { parsed = JSON.parse(jsonMatch[0]); }
  catch (e) { throw new Error("JSONパース失敗: " + jsonMatch[0].substring(0, 200)); }

  if (!parsed.en || typeof parsed.en !== "string")
    throw new Error("'en' フィールドが不正: " + JSON.stringify(parsed));
  if (!parsed.vocab_type || typeof parsed.vocab_type !== "string")
    throw new Error("'vocab_type' フィールドが不正: " + JSON.stringify(parsed));

  const vt = parsed.vocab_type.trim().toLowerCase();
  if (!VALID_VOCAB_TYPES.includes(vt)) {
    Logger.log("  WARN: '" + word + "' の vocab_type '" + vt + "' が未知。'other' に変換します");
    parsed.vocab_type = "other";
  } else { parsed.vocab_type = vt; }

  return { en: parsed.en.trim().toLowerCase(), vocab_type: parsed.vocab_type };
}

function getPendingRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data    = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
  const pending = [];
  data.forEach(function(row, i) {
    const word      = String(row[0]).trim();
    const en        = String(row[2]).trim();
    const vocabType = String(row[5]).trim();
    if (!word) return;
    if (en === "" && vocabType === "")
      pending.push({ rowIndex: i + 2, word: word,
                     reading: String(row[1]).trim(), pos: String(row[4]).trim() });
  });
  return pending;
}

function getAllVocabRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const rows = [];
  data.forEach(function(row, i) {
    const word = String(row[0]).trim();
    if (!word) return;
    rows.push({ rowIndex: i + 2, word: word,
                reading: String(row[1]).trim(), pos: String(row[4]).trim() });
  });
  return rows;
}

function logToSheet_(ss, type, word, status, message) {
  try {
    const logSheet = ss.getSheetByName(CLASSIFY_SETTINGS.LOG_SHEET_NAME);
    if (!logSheet) return;
    logSheet.appendRow([new Date(), type, "word_" + word, status, message || ""]);
  } catch (e) { Logger.log("WARN: ログ書き込み失敗: " + e.message); }
}


/**
 * ============================================================
 *  generateImages.gs  v5.3  (2026-05-19)
 *
 *  【このバージョンの主な変更点】
 *  ─────────────────────────────────────────
 *  v5.2 → v5.3 パッチ (2026-05-19):
 *  [P1] フォールバック4関数（Person / ConcreteObject / AbstractConcept / Default）の
 *       CONSTRAINTS を「anywhere — including titles, labels, captions...」型に統一。
 *  [P2] S列有効判定を「50文字以上」に変更（§5 確定ルール）。
 *  [P3] resetFailedImagesToPending() を resetFailedToPending(lessonRef) に統一。
 *       旧関数名は後方互換エイリアスとして存続。
 *  [P4] PERSON_PROFILES["会社員"] を VISUAL_CANON 準拠（スーツ＋ブリーフケース）に修正。
 *  [P5] addImagePromptColumn() の二重定義を解消し、データ入力規則クリアを統合。
 *  [P6] STYLE_RECIPE 上部コメントを v2.9.1 相当の等価表現に書き換え。
 *
 *  ─────────────────────────────────────────
 *  v5.1 → v5.2 マージ:
 *  [追加1] STYLE_RECIPE 完全版（v7.1より）
 *    sub_color (#6B7C85) + skin_tones を追加。
 *    v5.1 では欠落していた2項目を補完。
 *
 *  [追加2] OBJECT_SIGNATURES 辞書（v7.1より）
 *    具体物（concrete_object）の識別シグネチャー辞書を追加。
 *    雑誌・本・新聞・ノート・ケータイ等の視覚的識別手がかりを定義。
 *    buildConcreteObjectPrompt_() がこの辞書を参照するよう更新。
 *
 *  [追加3] ABSTRACT_METAPHORS 辞書（v7.1より）
 *    抽象概念（abstract_concept）のTIACメタファー辞書を追加。
 *    好き・楽しい・悲しい等の感情/概念語に視覚メタファーを定義。
 *    buildAbstractConceptPrompt_() がこの辞書を参照するよう更新。
 *
 *  ─────────────────────────────────────────
 *  v5.0 → v5.1 変更点（維持）:
 *  [変更1] switch-case を v2.6 準拠に拡張（テンプレートK〜T追加）
 *    pronoun / interjection / set_expression / adverb / counter /
 *    time / transportation / family / weather / sensory の
 *    10 vocab_type に対応する buildXxxPrompt_() 関数を追加。
 *    各関数に語彙別ルックアップテーブル（PRONOUN_LOOKUP等）を内蔵。
 *
 *  [変更2] 補助列読み込みを拡張（A〜N → A〜R）
 *    O列: familyForm   （uchi / soto）
 *    P列: adverbType   （degree / frequency / manner / temporal）
 *    Q列: timeSubtype  （clock / weekday / month / season / relative / timeofday）
 *    R列: perceptionType（active / passive / emission）
 *    ※ setupSpreadsheet.gs で addAuxiliaryColumns() を実行してこれらの列を追加すること。
 *    ※ 補助列が空欄の場合は語彙名から自動推定するフォールバックを内蔵。
 *
 *  ─────────────────────────────────────────
 *  使い方:
 *    1. ScriptProperties に GEMINI_API_KEY / SPREADSHEET_ID を設定
 *    2. ScriptProperties に IMAGE_FOLDER_ID を設定
 *    3. Vocabulary シートに補助列 O〜R を追加（addAuxiliaryColumns() 実行）
 *    4. testSingleImage() で動作確認（1件だけ生成）
 *    5. generateImageBatch() を実行 or タイマートリガーに設定
 *    6. 完了後に syncRegistries.gs を実行（registry 反映）
 * ============================================================
 */

// ============================================================
// 設定
// ============================================================
const IMAGE_SETTINGS = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties()
                    .getProperty("SPREADSHEET_ID") || "YOUR_SPREADSHEET_ID_HERE",

  VOCAB_SHEET_NAME: "Vocabulary",
  LOG_SHEET_NAME:   "Log",

  // 画像ファイルの保存先（Drive フォルダ ID）
  IMAGE_FOLDER_ID: PropertiesService.getScriptProperties()
                     .getProperty("IMAGE_FOLDER_ID") || "YOUR_IMAGE_FOLDER_ID_HERE",

  // Imagen 4 モデル名
  // Google AI Studio 無料枠: 各モデル 25 RPD
  // 【1回目】imagen-4.0-generate-exp（高品質）
  // 【2回目】imagen-4.0-fast-generate-exp（高速）に変更して再実行 → 合計 50件/日
  // ※ 安定リリース版を使う場合: "imagen-4.0-generate-001"
  MODEL: "imagen-4.0-generate-001",

  // 1 バッチあたりの最大処理件数（安全マージン 1 件を残す）
  MAX_BATCH_SIZE: 24,

  // API コール間のスリープ（ms）
  DELAY_MS: 2500,

  // 画像の出力サイズ（Imagen 4 対応値）
  // "1:1" → 語彙カード用（正方形）
  ASPECT_RATIO: "1:1",
};

// ============================================================
// STYLE_RECIPE（v2.9.1 相当の等価表現）
// ⚠ この文字列は変更厳禁。core_style + color_palette（色名）+ ゼロライティング節を合成した等価表現。
// ============================================================
const STYLE_RECIPE = [
  "Minimalist flat vector illustration.",
  "Clean continuous black outlines with consistent line weight.",
  "Completely flat solid color fills only.",
  "Color palette: soft cream white background,",
  "deep slate navy outlines,",
  "muted warm blue as main fill color,",
  "warm amber gold as accent color,",
  "cool slate gray as sub-color for secondary elements.",
  // 肌色フレーズなし（diverse_unspecified: v2.7〜 全版共通ルール）
  "No gradients, no shadows, no 3D effects, no photoreal textures.",
  "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
  "This should look like it belongs in a brand style guide, not like AI art.",
  "Keep line weights consistent.",
].join(" ");

// ============================================================
// OBJECT_SIGNATURES（master_prompt_design_guide_v2_5.py PART 4.5 準拠）
// ✓ v5.2 追加（v7.1より）
// buildConcreteObjectPrompt_() の [SUBJECT] ブロックに転記する
// ============================================================
const OBJECT_SIGNATURES = {
  "雑誌": {
    signatures: "A bold magazine title/masthead banner across the very top of the cover. Multiple coverline headlines in different sizes layered over the cover. Visible physical thinness — thin spine.",
    avoid:      "Do not draw it as a thick hardcover book. Do not omit the masthead banner.",
    view:       "3/4 view from slightly above — shows front cover AND spine thickness.",
  },
  "本": {
    signatures: "Clearly visible thick spine with visible page edges on the opposite side. Hard or soft cover. Significantly thicker than a magazine. Page edge lines visible on the side.",
    avoid:      "Do not confuse with magazine (no masthead) or notebook (no cover art).",
    view:       "3/4 view — shows cover AND spine AND page edges simultaneously.",
  },
  "新聞": {
    signatures: "Large broadsheet format — significantly wider than a magazine. Multi-column layout visible (simplified as parallel vertical lines). Folded in half with a visible fold crease.",
    avoid:      "Do not show it as glossy (that is a magazine). Do not make it small.",
    view:       "Slight 3/4 from above — shows the fold and column layout.",
  },
  "ノート": {
    signatures: "Spiral binding coils clearly visible on the left or top edge. Ruled lines visible on the open pages.",
    avoid:      "Do not add a cover photo (that is a magazine). Do not use a thick spine.",
    view:       "3/4 from slightly above — shows spiral AND one page corner.",
  },
  "ケータイ": {
    signatures: "App icon grid visible on the screen (small colored rounded squares in 3×4 grid). Rear camera module: cluster of 2-3 circular lens openings in the top-left corner. Status bar at the top of the screen.",
    avoid:      "Do not render as a plain black rectangle with no screen content.",
    view:       "Slight 3/4 from above showing screen face AND one side edge.",
  },
  "スマートフォン": {
    signatures: "App icon grid visible on the screen (small colored rounded squares in 3×4 grid). Rear camera module: cluster of 2-3 circular lens openings in the top-left corner.",
    avoid:      "Do not render as a plain black rectangle with no screen content.",
    view:       "Slight 3/4 from above showing screen face AND one side edge.",
  },
  "パソコン": {
    signatures: "Open laptop: screen + keyboard visible at an obtuse angle. Screen shows simplified UI — window chrome or desktop wallpaper. Keyboard key grid visible.",
    avoid:      "Do not show a closed laptop (indistinguishable from a book).",
    view:       "3/4 eye-level — shows screen face AND keyboard at angle.",
  },
  "テレビ": {
    signatures: "Wide rectangular screen with a visible bezel frame. Flat stand or wall-mount base below the screen. A simplified image or pattern visible on the screen.",
    avoid:      "Do not draw old CRT shape unless context requires it.",
    view:       "Slight 3/4 from eye level — shows screen AND stand base.",
  },
  "カメラ": {
    signatures: "A prominent circular lens barrel protruding from the front face. A viewfinder bump on the top right. A shutter button clearly visible on the top surface. Concentric circles inside the lens barrel.",
    avoid:      "Do not flatten the lens — the circular protrusion is the key identifier.",
    view:       "3/4 from slightly above — shows lens front AND top shutter button.",
  },
  "財布": {
    signatures: "Dashed stitching lines along all edges — the single strongest leather identifier. Bi-fold structure with a visible center crease/fold line. Multiple card slot openings peeking out.",
    avoid:      "Do not render as a flat rectangle with no stitching detail.",
    view:       "3/4 from slightly above — shows front face AND top opening.",
  },
};

const OBJECT_SIGNATURE_DEFAULT = {
  signatures: "Render its most distinctive identifying visual details clearly. Iconization level 3 (Detailed Flat): include material texture hints and key structural features.",
  avoid:      "",
  view:       "Canonical 3/4 view — positioned 30-45 degrees above and slightly to one side.",
};

// ============================================================
// ABSTRACT_METAPHORS（master_prompt_design_guide_v2_5.py PART 4.8 準拠）
// ✓ v5.2 追加（v7.1より）
// buildAbstractConceptPrompt_() で参照する
// ============================================================
const ABSTRACT_METAPHORS = {
  "好き":   { metaphor: "A character holding a large glowing heart shape toward the viewer, or cradling an object with both hands in a protective gesture.", tone: "warm, inviting, gentle", color: "Increase warm amber gold and soft rose-pink tones." },
  "嫌い":   { metaphor: "A character turning away from an object with one hand held up (stop gesture), or an X mark hovering over the disliked object.", tone: "tense, rejecting", color: "Use cooler blue-gray tones; avoid warm colors." },
  "楽しい": { metaphor: "A character with arms raised, surrounded by small star or sparkle shapes; OR two characters doing an activity together with visible energy lines.", tone: "energetic, light, celebratory", color: "Bright amber gold accents; high visual energy." },
  "悲しい": { metaphor: "A character sitting with head bowed; OR a wilting flower; OR a single teardrop shape above the character.", tone: "quiet, heavy, withdrawn", color: "Dominant cool slate gray and muted blue; reduce warm tones." },
  "嬉しい": { metaphor: "A character with both hands raised in celebration; sparkle lines radiating outward.", tone: "bright, expansive, celebratory", color: "Maximum warm amber gold accents." },
  "怒る":   { metaphor: "A character with a furrowed brow, clenched fist raised, with jagged spike lines or steam lines radiating from the head.", tone: "tense, sharp, kinetic", color: "Red-orange accent lines; reduce soft tones." },
  "疲れる": { metaphor: "A character slumped in a chair or leaning against a wall, with downward drooping lines from the eyes or head.", tone: "heavy, slow, depleted", color: "Muted, desaturated palette; reduce bright accents." },
  "心配":   { metaphor: "A character with one hand on their chin looking upward at a large question mark cloud; OR a character looking at a clock with a worried posture.", tone: "uncertain, tense, inward", color: "Cool gray dominant; amber gold for the question mark symbol only." },
  "時間":   { metaphor: "A large clock face with hands pointing to a specific time, or an hourglass with falling sand (represented as dotted amber lines).", tone: "neutral, structured, measured", color: "Standard palette; amber gold for clock hands." },
  "お金":   { metaphor: "A stack of coins OR a banknote fanned out with simplified patterns — the thickness and quantity emphasize 'money as resource'.", tone: "matter-of-fact, clear", color: "Amber gold dominant for coins; cream with navy for notes." },
  "仕事":   { metaphor: "A desk with a laptop, stacked documents, and a coffee cup — the composition of a work environment.", tone: "focused, purposeful", color: "Standard palette; navy dominant for professionalism." },
  "勉強":   { metaphor: "An open book with a pencil beside it, or a character sitting at a desk leaning over a notebook.", tone: "concentrated, purposeful", color: "Standard palette; muted warm blue for the book." },
  "旅行":   { metaphor: "A rolling suitcase beside a world map outline or a departure board silhouette.", tone: "anticipatory, adventurous", color: "Amber gold and muted blue for map; navy outlines." },
};

const ABSTRACT_METAPHOR_DEFAULT = {
  metaphor: "Use a universally recognized concrete object or symbolic scene that directly represents the concept. The metaphor must be immediately legible to a Japanese language learner.",
  tone:     "neutral, clear",
  color:    "Standard palette.",
};

// ============================================================
// 建物ごとの視覚的手がかり辞書（テンプレートB用）
// ============================================================
const BUILDING_CUES = {
  "病院":      { signage: "病院",    entrance: "automatic sliding glass doors with medical cross symbol above entrance",        userAction: "a patient figure approaching the entrance",           surrounding: "red cross or caduceus symbol on the wall" },
  "学校":      { signage: "学校",    entrance: "gate with stone pillars, school name plate",                                    userAction: "child with randoseru backpack walking toward entrance", surrounding: "cherry blossom trees lining the path" },
  "大学":      { signage: "大学",    entrance: "wide archway gate with university nameplate",                                   userAction: "student with backpack walking on campus path",          surrounding: "ginkgo trees lining the approach" },
  "銀行":      { signage: "銀行",    entrance: "revolving door with security column beside it",                                 userAction: "suited person entering the building",                   surrounding: "ATM kiosk visible on the side wall" },
  "デパート":  { signage: "デパート", entrance: "wide automatic glass doors with display windows on both sides",                userAction: "shopper carrying a bag entering",                       surrounding: "window displays with colorful goods visible" },
  "スーパー":  { signage: "スーパー", entrance: "automatic glass sliding doors, shopping cart station outside",                 userAction: "shopper pushing a cart out of the entrance",            surrounding: "price sign boards visible in windows" },
  "レストラン":{ signage: "レストラン",entrance: "welcoming wooden door with menu board outside",                               userAction: "couple about to enter",                                 surrounding: "warm interior light visible through windows" },
  "ホテル":    { signage: "ホテル",   entrance: "revolving door with uniformed doorman figure",                                 userAction: "guest with rolling suitcase approaching",               surrounding: "canopy over the entrance with flag poles" },
  "図書館":    { signage: "図書館",   entrance: "wide stone steps leading to large double doors",                               userAction: "person carrying books entering",                        surrounding: "stone columns framing the entrance" },
  "駅":        { signage: "駅",      entrance: "ticket gate visible inside the entrance",                                       userAction: "commuter passing through the gate with IC card",        surrounding: "train schedule board above entrance" },
};

// ============================================================
// 役割ベースの人物描写辞書（テンプレートA用）
// ============================================================
const PERSON_PROFILES = {
  "医者": "A doctor wearing a white coat (open at the front) with a stethoscope around the neck — THIS IS THE ONLY REQUIRED PROP. DO NOT add a clipboard or any other medical tools. Professional and calm posture.",
  "会社員":    "An office worker in a navy blue or charcoal gray business suit, white shirt with a simple necktie or scarf, carrying a briefcase or laptop bag. Standing upright with a relaxed confident posture.",
  "学生":      "A student wearing casual clothes and carrying a school bag or backpack. Young adult appearance, friendly expression.",
  "大学生":    "A university student in casual everyday clothes carrying a backpack. Young adult in their early 20s, relaxed friendly expression.",
  "先生":      "A teacher standing in front of an implied classroom space. Wearing smart casual clothes, holding a book or marker pen.",
  "銀行員":    "A bank employee in a formal business suit. Standing upright with a polite professional expression.",
  "看護師":    "A nurse in pale blue scrubs with a name badge. Caring expression, holding a clipboard or medical folder.",
  "警察官":    "A police officer in a dark navy uniform with cap and badge. Standing at attention with a calm authoritative posture.",
  "店員":      "A shop assistant in a neat store uniform with name badge. Standing with a welcoming gesture.",
  "料理人":    "A chef in white chef's jacket and tall chef's hat. Standing with a ladle or spatula, confident expression.",
  "運転手":    "A driver in a cap and casual uniform. Standing beside an implied vehicle silhouette.",
  "子ども":    "A young child (8-10 years old) in casual clothes. Cheerful expression and playful posture.",
  "男の人":    "A generic adult man in casual everyday clothes. Pleasant relaxed expression.",
  "女の人":    "A generic adult woman in casual everyday clothes. Warm friendly expression.",
  "男の子":    "A young boy (8-10 years old) in casual t-shirt and shorts. Playful energetic posture.",
  "女の子":    "A young girl (8-10 years old) in casual clothes. Cheerful bright expression.",
  "お父さん":  "A middle-aged man (40s) in casual smart clothes — collared shirt and trousers. Warm paternal expression.",
  "お母さん":  "A middle-aged woman (40s) in casual smart clothes. Warm caring expression.",
  "おじいさん":"An elderly man (60s-70s) in comfortable everyday clothes. Kind peaceful expression.",
  "おばあさん":"An elderly woman (60s-70s) in comfortable everyday clothes. Warm gentle expression.",
};
const PERSON_PROFILE_DEFAULT =
  "A generic person in everyday casual clothes. Friendly neutral expression. " +
  "The role should be communicated through posture, props, and setting.";


// ============================================================
// 【メイン】generateImageBatch() — タイマートリガーはこれに設定
// ============================================================
function generateImageBatch() {
  Logger.log("===== generateImages.gs v5.3 開始 =====");
  Logger.log("モデル: " + IMAGE_SETTINGS.MODEL);

  const ss      = SpreadsheetApp.openById(IMAGE_SETTINGS.SPREADSHEET_ID);
  const pending = getPendingImageRows_(ss);

  if (pending.length === 0) {
    Logger.log("INFO: imageStatus = 'pending' の行はありません。処理をスキップします。");
    return;
  }

  const batch     = pending.slice(0, IMAGE_SETTINGS.MAX_BATCH_SIZE);
  const remaining = pending.length - batch.length;

  Logger.log("未処理件数: " + pending.length
             + " → 今回: " + batch.length + " 件"
             + (remaining > 0 ? " / 残り: " + remaining + " 件（次回）" : ""));

  let successCount = 0;
  let errorCount   = 0;

  batch.forEach(function(row, i) {
    Logger.log("  [" + (i + 1) + "/" + batch.length + "] "
               + row.imageId + " (vocab_type: " + row.vocabType + ")");

    const result = processImageEntry_(ss, row);
    if (result === "success") successCount++;
    else                      errorCount++;

    if (i < batch.length - 1) {
      Utilities.sleep(IMAGE_SETTINGS.DELAY_MS);
    }
  });

  Logger.log("===== バッチ完了 =====");
  Logger.log("成功: " + successCount + " / エラー: " + errorCount);
  if (remaining > 0) {
    Logger.log("残り " + remaining + " 件 → 次回 generateImageBatch() で継続します");
  } else {
    Logger.log("✅ 全件処理完了！syncRegistries.gs を実行して registry に反映してください。");
  }
}


// ============================================================
// 【テスト】testSingleImage() — 1件だけ生成して動作確認
// ============================================================
function testSingleImage() {
  const TARGET_IMAGE_ID = "word_先生";  // ← テストしたい imageId に変更

  Logger.log("===== テスト生成: " + TARGET_IMAGE_ID + " =====");

  const ss      = SpreadsheetApp.openById(IMAGE_SETTINGS.SPREADSHEET_ID);
  const pending = getPendingImageRows_(ss);
  const target  = pending.find(function(r) { return r.imageId === TARGET_IMAGE_ID; });

  if (!target) {
    Logger.log("ID '" + TARGET_IMAGE_ID + "' が pending 行に見つかりませんでした。");
    Logger.log("→ retryImages([\"" + TARGET_IMAGE_ID + "\"]) を使用してください（statusを問わず強制再生成）。");
    return;
  }

  processImageEntry_(ss, target);
  Logger.log("===== テスト完了 =====");
}


// ============================================================
// 【プレビュー】previewPrompts() — API呼び出しなしでプロンプトだけ確認
// ============================================================
function previewPrompts() {
  const ss      = SpreadsheetApp.openById(IMAGE_SETTINGS.SPREADSHEET_ID);
  const pending = getPendingImageRows_(ss);

  Logger.log("未処理件数: " + pending.length);
  pending.slice(0, 5).forEach(function(row, i) {
    const prompt = buildImagePrompt_(row);
    Logger.log("─────────────────");
    Logger.log("[" + (i + 1) + "] " + row.imageId
               + " (vocab_type: " + row.vocabType + ")");
    Logger.log(prompt.substring(0, 400) + "...");
  });
}


// ============================================================
// 【補助】特定の imageId を強制再生成（修正・再試行用）
// 使い方: retryImages(["word_先生", "word_医者"])
// ============================================================
function retryImages(targetImageIds) {
  if (!targetImageIds || targetImageIds.length === 0) {
    Logger.log("ERROR: targetImageIds が空です");
    return;
  }

  const ss      = SpreadsheetApp.openById(IMAGE_SETTINGS.SPREADSHEET_ID);
  const idSet   = new Set(targetImageIds);
  const targets = getAllImageRows_(ss).filter(function(r) { return idSet.has(r.imageId); });

  if (targets.length === 0) {
    Logger.log("INFO: 対象 ID が見つかりませんでした");
    return;
  }

  Logger.log("INFO: " + targets.length + " 件を再処理します");
  targets.forEach(function(row) {
    processImageEntry_(ss, row);
    Utilities.sleep(IMAGE_SETTINGS.DELAY_MS);
  });
}


// ============================================================
// 【設定】タイマートリガー登録（1日3回）
// ============================================================
function setupImageTriggersX3() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "generateImageBatch") {
      ScriptApp.deleteTrigger(t);
    }
  });

  [9, 13, 17].forEach(function(hour) {
    ScriptApp.newTrigger("generateImageBatch")
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .create();
  });

  Logger.log("✓ generateImageBatch を 9:00 / 13:00 / 17:00 の3回に設定しました");
}

function setupImageDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "generateImageBatch") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("generateImageBatch").timeBased().everyDays(1).atHour(9).create();
  Logger.log("INFO: generateImageBatch の日次トリガーを設定しました（毎日 9:00）");
}


// ============================================================
// 1エントリを処理する（内部関数）
// ============================================================
function processImageEntry_(ss, row) {
  try {
    const prompt = buildImagePrompt_(row);
    Logger.log("  prompt preview: " + prompt.substring(0, 100) + "...");

    const imgResult = callImagenAPI_(prompt);
    if (!imgResult.success) throw new Error(imgResult.error);

    const driveResult = saveImageToDrive_(imgResult.imageBase64, row.imageId + ".png");
    if (!driveResult.success) throw new Error(driveResult.error);

    const sheet = ss.getSheetByName(IMAGE_SETTINGS.VOCAB_SHEET_NAME);
    sheet.getRange(row.rowIndex, 8).setValue("generated");
    sheet.getRange(row.rowIndex, 9).setValue(driveResult.directUrl);

    writeImageLog_(ss, row.imageId, "success", driveResult.directUrl, "");
    Logger.log("  ✅ 完了: " + row.imageId + ".png → " + driveResult.directUrl);
    return "success";

  } catch (e) {
    const sheet = ss.getSheetByName(IMAGE_SETTINGS.VOCAB_SHEET_NAME);
    if (sheet) sheet.getRange(row.rowIndex, 8).setValue("failed");
    writeImageLog_(ss, row.imageId, "failed", "", e.message);
    Logger.log("  ❌ エラー: " + row.imageId + " → " + e.message);
    return "error";
  }
}


// ============================================================
// vocab_type に基づいてプロンプトを組み立てる（内部関数）
// v5.2: テンプレートA〜T 全対応
// ============================================================
// ✅ 変更後（S列にプロンプトがあれば最優先で使う）
function buildImagePrompt_(row) {
  // ① S列（imagePrompt）にカスタムプロンプトがあれば最優先
  // v5.3: §5確定ルール「S列有効判定：50文字以上」
  if (row.imagePrompt && row.imagePrompt.trim().length > 50) {
    return row.imagePrompt.trim();
  }
  // ② なければ従来のテンプレートにフォールバック
  const vt   = (row.vocabType || "other").toLowerCase();
  const word = row.word;
  const en   = row.en || word;

  switch (vt) {
    // ── テンプレートA〜J（v2.5 既存）──
    case "person":           return buildPersonPrompt_(word, en);
    case "building":         return buildBuildingPrompt_(word, en);
    case "concrete_object":  return buildConcreteObjectPrompt_(word, en);
    case "action_verb":      return buildActionVerbPrompt_(word, en);
    case "adjective":        return buildAdjectivePrompt_(word, en);
    case "abstract_concept": return buildAbstractConceptPrompt_(word, en);
    case "spatial_relation": return buildSpatialRelationPrompt_(word, en);
    case "demonstrative":    return buildDemonstrativePrompt_(word, en);

    // ── テンプレートK〜T（v2.6 NEW）──
    case "pronoun":          return buildPronounPrompt_(word, en);
    case "interjection":     return buildInterjectionPrompt_(word, en);
    case "set_expression":   return buildSetExpressionPrompt_(word, en);
    case "adverb":           return buildAdverbPrompt_(word, en, row.adverbType);
    case "counter":          return buildCounterPrompt_(word, en);
    case "time":             return buildTimePrompt_(word, en, row.timeSubtype);
    case "transportation":   return buildTransportPrompt_(word, en);
    case "family":           return buildFamilyPrompt_(word, en, row.familyForm);
    case "weather":          return buildWeatherPrompt_(word, en);
    case "sensory":          return buildSensoryPrompt_(word, en, row.perceptionType);

    default:                 return buildDefaultPrompt_(word, en);
  }
}


// ================================================================
// ▼ テンプレートA〜J（v2.5 既存）
// ================================================================

// ── テンプレートA: 人物 ──
function buildPersonPrompt_(word, en) {
  const profile = PERSON_PROFILES[word] || PERSON_PROFILE_DEFAULT;
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the meaning of \"" + word + "\" (" + en + ") at a glance.",
    "",
    "[SUBJECT]",
    profile,
    "The character's role must be immediately obvious from clothing, posture, and props alone.",
    "",
    "[SCENE & ACTION]",
    "Full-body shot. The character is centered and fills 70-80% of the image area.",
    "Camera angle: HORIZONTAL 3/4 view at EYE LEVEL — camera positioned at the",
    "subject's eye height, rotated approximately 30-45 degrees to one side.",
    "Solid white background. No other characters or objects in the frame.",
    "85mm portrait lens equivalent.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols anywhere — including titles, labels, captions, or any text overlay at any position in the rendered output.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}

// ── テンプレートB: 建物 ──
function buildBuildingPrompt_(word, en) {
  const cues = BUILDING_CUES[word] || {
    signage: word, entrance: "a clear identifiable entrance",
    userAction: "a person approaching the entrance",
    surrounding: "typical visual elements associated with the building type",
  };
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The building must be IMMEDIATELY and UNAMBIGUOUSLY recognizable as a " + word + " (" + en + ") at a glance.",
    "",
    "[SUBJECT]",
    "The main subject is a " + en + " building.",
    "A single Japanese signage word \"" + cues.signage + "\" is mounted clearly near the entrance.",
    "",
    "[SCENE & ACTION]",
    "Viewed from a slight three-quarter front angle at eye level, 35mm wide-angle lens equivalent.",
    "Straight vertical lines, natural perspective with no fisheye distortion.",
    "Pale blue or soft cream sky background.",
    "Functional cues:",
    "- Entrance cue: " + cues.entrance,
    "- User action cue: " + cues.userAction,
    "- Surrounding anchor: " + cues.surrounding,
    "The building fills 70% of the frame. Negative space in the top third.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "EXCEPTION: The single Japanese building signage word \"" + cues.signage + "\" is permitted on the building.",
    "No other text, letters, numbers anywhere in the image.",
    "No gradients, no shadows, no 3D effects.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}

// ── テンプレートD: 具体物 — v5.2更新: OBJECT_SIGNATURES 参照 ──
function buildConcreteObjectPrompt_(word, en) {
  const sig = OBJECT_SIGNATURES[word] || OBJECT_SIGNATURE_DEFAULT;
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly and UNAMBIGUOUSLY communicate the meaning of \"" + word + "\" (" + en + ") at a glance.",
    "A learner must distinguish this object from similar-shaped objects without any text clues.",
    "",
    "[SUBJECT]",
    "The subject is a " + en + " (" + word + ").",
    "Visual signatures to include: " + sig.signatures,
    sig.avoid ? ("AVOID: " + sig.avoid) : "",
    "",
    "[SCENE & ACTION]",
    "Display strategy: OBJECT_ALONE.",
    "The object is centered and fills 70-80% of the image.",
    "Camera angle: " + sig.view,
    "Solid white background. No additional objects or context scene.",
    "Iconization level: Detailed Flat (level 3) — include material texture hints and key structural features.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols anywhere — including titles, labels, captions, or any text overlay at any position in the rendered output.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].filter(Boolean).join("\n");
}

// ── テンプレートH: 動作語彙 ──
function buildActionVerbPrompt_(word, en) {
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the action \"" + word + "\" (" + en + ") at a glance.",
    "",
    "[SUBJECT]",
    "A generic adult person performing the action \"" + en + "\".",
    "The character uses no specific identifying features — generic adult appearance.",
    "",
    "[SCENE & ACTION]",
    "Strategy: MOTION_ARROW — single panel showing the peak moment of the action.",
    "The action occupies 70% of the frame. Motion direction is clearly readable.",
    "A simple directional arrow or motion line is PERMITTED to indicate the action direction.",
    "The character is centered. Minimal background — white or very simple single-color flat backdrop.",
    "85mm lens equivalent, 3/4 view at eye level.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Directional motion arrows ARE permitted to show action direction.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}

// ── テンプレートJ: 形容詞 ──
function buildAdjectivePrompt_(word, en) {
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the adjective \"" + word + "\" (" + en + ") at a glance.",
    "",
    "[SUBJECT]",
    "Show the quality \"" + en + "\" using one or two simple anchor objects.",
    "The adjective's meaning must be immediately readable without any text.",
    "",
    "[SCENE & ACTION]",
    "Strategy: PAIR_CONTRAST — show two versions of the same object side-by-side to contrast the quality.",
    "Left panel: the CONTRASTING (opposite) state — rendered in muted neutral tone (cool slate gray #6B7C85).",
    "Right panel: the TARGET state — rendered with full color palette and slight emphasis.",
    "If the adjective is absolute (e.g. 'round'), use SINGLE_HIGHLIGHT instead.",
    "Objects occupy 70-80% of the frame. For PAIR_CONTRAST: each panel occupies 50% with equal-sized subjects.",
    "Canonical 3/4 view (30-45 degrees above) for each object.",
    "Solid white background.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Do NOT use facial expressions to convey the adjective.",
    "Use only the objects' appearance and symbolic size/shape markers.",
    "A single thin vertical dividing line IS PERMITTED for PAIR_CONTRAST.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}

// ── テンプレートI: 抽象概念 — v5.2更新: ABSTRACT_METAPHORS 参照 ──
function buildAbstractConceptPrompt_(word, en) {
  const meta = ABSTRACT_METAPHORS[word] || ABSTRACT_METAPHOR_DEFAULT;
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must communicate the abstract Japanese concept \"" + word + "\" (" + en + ") through visual metaphor.",
    "There is no physical object to depict directly — use the metaphor defined below.",
    "",
    "[SUBJECT — TIAC Layer 2: Object]",
    "Conceptual definition: The concept of '" + en + "' in Japanese.",
    "Visual metaphor: " + meta.metaphor,
    "This metaphor is the concrete anchor that makes the abstract concept visible.",
    "Render it clearly and centrally. Do not add competing visual elements.",
    "",
    "[SCENE & ACTION — TIAC Layer 3: Form]",
    "Emotional tone: " + meta.tone,
    "Color tone adjustment: " + meta.color,
    "Convey the tone through character posture, spatial composition, and symbolic elements — NOT through facial expressions alone.",
    "Camera: Centered, eye-level or slight elevation. Subject fills 70% of frame.",
    "Background: minimal — flat color field suggestion of environment (no gradients).",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols anywhere — including titles, labels, captions, or any text overlay at any position in the rendered output.",
    "No gradients, no shadows, no 3D effects, no photoreal textures.",
    "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}

// ── テンプレートF: 空間関係 ──
function buildSpatialRelationPrompt_(word, en) {
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the spatial relationship \"" + word + "\" (" + en + ").",
    "",
    "[SUBJECT]",
    "Show a simple anchor object (e.g. a box or table) and a target object positioned to illustrate \"" + en + "\".",
    "The spatial relationship must be crystal clear.",
    "",
    "[SCENE & ACTION]",
    "Use a 3×3 grid layout. The anchor object is centered.",
    "The target object is clearly placed in the position indicated by \"" + en + "\".",
    "A simple dashed boundary line or arrow IS permitted to highlight the relationship.",
    "Minimal background — a suggestion of floor or shelf surface.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers.",
    "Boundary lines and directional arrows ARE permitted for spatial clarity.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}

// ── テンプレートG: 指示語 ──
function buildDemonstrativePrompt_(word, en) {
  var zone = "near speaker";
  if (word.startsWith("そ") || word === "それ" || word === "そちら" || word === "そこ")
    zone = "near listener";
  else if (word.startsWith("あ") || word === "あれ" || word === "あちら" || word === "あそこ")
    zone = "far from both";

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the demonstrative \"" + word + "\" (" + en + ").",
    "",
    "[SUBJECT]",
    "Two generic adult figures (speaker and listener) face each other.",
    "A simple object is positioned in the zone: " + zone + ".",
    "A colored territory boundary or arrow points from the speaker to the object.",
    "",
    "[SCENE & ACTION]",
    "Face-to-face layout. Speaker on the left, listener on the right.",
    "The object is in the \"" + zone + "\" zone.",
    "Color-code the territory: こ-zone = warm amber, そ-zone = muted blue, あ-zone = cool slate gray.",
    "A pointing arrow from the speaker clearly indicates the reference direction.",
    "Minimal white background.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers.",
    "Territory boundary lines and pointing arrows ARE permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ================================================================
// ▼ テンプレートK〜T（v2.6 NEW）
// ================================================================

// ── テンプレートK: 代名詞（PRONOUN_FRAMES） ──
function buildPronounPrompt_(word, en) {
  const PRONOUN_LOOKUP = {
    "わたし": {
      core: (
        "Single person centered, facing camera directly. " +
        "Their right index finger points toward their own nose/face (Japanese self-reference gesture). " +
        "A curved self-referential arrow loops from the person back to themselves. " +
        "Solid white background, no other characters."
      )
    },
    "わたしたち": {
      core: (
        "3-4 diverse character silhouettes in a loose group, all facing camera. " +
        "One person in front points both index fingers back toward the whole group (including themselves). " +
        "A soft dashed circular boundary loosely encloses all figures. White background."
      )
    },
    "あなた": {
      core: (
        "TWO characters: LEFT speaker in 3/4 side view, index finger pointing directly at RIGHT character. " +
        "RIGHT listener facing forward with a highlight focus ring around them. " +
        "A bold straight arrow from speaker to listener. White background."
      )
    },
    "かれ": {
      core: (
        "THREE characters: FOREGROUND left=speaker, right=listener conversing. " +
        "BACKGROUND CENTER: a male figure slightly apart, highlighted with a teal focus ring. " +
        "A dotted arrow from the speaker points toward the background male figure. White background."
      )
    },
    "かのじょ": {
      core: (
        "THREE characters: FOREGROUND left=speaker, right=listener conversing. " +
        "BACKGROUND CENTER: a female figure (distinct hairstyle) slightly apart, highlighted with a teal focus ring. " +
        "A dotted arrow from the speaker points toward the background female figure. White background."
      )
    },
    "みんな": {
      core: (
        "4-5 diverse character silhouettes (varying sizes and hairstyles) spread across the frame, " +
        "all facing inward toward center. A soft dashed circular boundary encloses all figures. White background."
      )
    },
    "だれ": {
      core: (
        "A person-shaped blank silhouette with DASHED outline (unknown identity). " +
        "A large bold '?' symbol positioned at head level inside the silhouette. " +
        "Small searching character on the side looking toward the silhouette. White background."
      )
    },
    "なに": {
      core: (
        "An object-shaped blank silhouette with DASHED outline. " +
        "A large '?' symbol inside the silhouette. " +
        "Person leaning toward the mystery object, looking curiously. White background."
      )
    },
    "どこ": {
      core: (
        "A simplified map or abstract space layout. " +
        "A location pin with DASHED outline and '?' symbol at an uncertain spot. " +
        "Person looking at the map with hand shading eyes (searching gesture). White background."
      )
    },
    "いつ": {
      core: (
        "A clock face where the hands are replaced by a large '?' symbol, " +
        "OR a calendar grid where the specific date cell shows '?' instead of a number. White background."
      )
    },
  };

  const profile = PRONOUN_LOOKUP[word] || {
    core: (
      "Person centered in frame. " +
      "A bold directional arrow clearly indicating the referent of \"" + en + "\". " +
      "If personal pronoun: use self-pointing or other-pointing gesture as appropriate. " +
      "If interrogative pronoun: show a blank dashed silhouette of the referent type with '?' symbol. " +
      "White background, no text."
    )
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the pronoun/reference word \"" + word + "\" (" + en + ") at a glance.",
    "The directional relationship (who is referring to whom) must be crystal clear without any text.",
    "",
    "[SCENE & ACTION]",
    profile.core,
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
    "Directional arrows ARE permitted to show reference direction.",
    "Dashed outlines ARE permitted to show unknown/unspecified referents.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートL: 感動詞（INTERJECTION_FRAMES） ──
function buildInterjectionPrompt_(word, en) {
  const INTERJECTION_LOOKUP = {
    "はい": {
      core: (
        "Person with a gentle smile, mouth slightly open. " +
        "Short vertical motion lines above head to show nodding. " +
        "A speech bubble from mouth containing a large GREEN CHECKMARK ✓ (or double circle ◎)."
      )
    },
    "ええ": {
      core: (
        "Person with a gentle smile, mouth slightly open. " +
        "Short vertical motion lines above head to show nodding. " +
        "A speech bubble from mouth containing a large GREEN CHECKMARK ✓."
      )
    },
    "いいえ": {
      core: (
        "Person with slightly furrowed brows, one hand raised palm-outward in front of face. " +
        "Horizontal motion lines beside head to show head-shaking. " +
        "A speech bubble containing a large RED CROSS ✗."
      )
    },
    "あ": {
      core: (
        "Person with wide eyes and small round open mouth (discovery expression). " +
        "Above head: a yellow lightbulb or bold '!' exclamation icon. " +
        "Eyes directed upward-diagonally toward something just noticed."
      )
    },
    "ああ": {
      core: (
        "Person with wide eyes and small round open mouth (realization expression). " +
        "Above head: a bold '!' icon. Eyes directed toward a suddenly noticed object."
      )
    },
    "なるほど": {
      core: (
        "Person with a knowing expression (eyes slightly narrowed), " +
        "one index finger raised and touching palm of other hand (realization gesture). " +
        "Behind head: a graphic showing wavy confused lines transitioning to a clean straight arrow (clarity)."
      )
    },
    "そうですか": {
      core: (
        "Person in a slightly forward-leaning listening posture, " +
        "mouth in a neutral straight line, eyes focused on an implied speaker to the side. " +
        "A speech bubble containing a wavy 'acknowledgment' line or small ◎."
      )
    },
    "すみません": {
      core: (
        "Person in a slight bow (45 degrees forward). " +
        "A speech bubble containing a small heart with a crack line (apology), " +
        "or an exclamation mark (attention-getting)."
      )
    },
  };

  const profile = INTERJECTION_LOOKUP[word] || {
    core: (
      "Person with an expressive facial gesture appropriate for \"" + en + "\". " +
      "A speech bubble from their mouth containing a clear universally-understood symbol " +
      "(green checkmark for agreement, red cross for disagreement, '!' for surprise/discovery, " +
      "lightbulb for realization). " +
      "Body language reinforces the meaning. White background."
    )
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the interjection/response word \"" + word + "\" (" + en + ") at a glance.",
    "Use ISO-standard symbols inside speech bubbles — do NOT rely on culturally-specific gestures alone.",
    "",
    "[SCENE & ACTION]",
    profile.core,
    "White background, clean flat design.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "ISO symbols (✓, ✗, !, ?) inside speech bubbles ARE permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートM: 定型表現（SET_EXPR_FRAMES） ──
function buildSetExpressionPrompt_(word, en) {
  const SET_EXPR_LOOKUP = {
    "おはようございます": {
      core: (
        "SCENE: morning setting with sunlight through a window (yellow-orange sunrise icon top-left). " +
        "TWO characters: one doing a slight bow greeting, the other responding with a smile."
      )
    },
    "こんにちは": {
      core: (
        "SCENE: daytime outdoors — bright sun icon at the top. " +
        "TWO characters meeting and bowing/waving to each other in a friendly daytime greeting."
      )
    },
    "こんばんは": {
      core: (
        "SCENE: evening setting — crescent moon and stars icon at the top. " +
        "TWO characters exchanging a bow or wave, warm interior lighting in the background."
      )
    },
    "いただきます": {
      core: (
        "SCENE: dining table with a simple meal (bowl/plate with steam rising). " +
        "Person(s) in HANDS-TOGETHER prayer/gratitude gesture before eating. " +
        "Chopsticks + fork icon or steam cloud above the food."
      )
    },
    "ごちそうさまでした": {
      core: (
        "SCENE: dining table with EMPTY clean plates (meal is finished). " +
        "Person(s) in hands-together gratitude gesture after the meal. " +
        "Empty bowl with a satisfied expression — contrasts with the full plate of 'itadakimasu'."
      )
    },
    "よろしくおねがいします": {
      core: (
        "Two characters bowing toward each other (formal Japanese greeting bow). " +
        "A small business card icon being exchanged between them, " +
        "OR a handshake gesture at the midpoint."
      )
    },
    "おつかれさまです": {
      core: (
        "SCENE: end of work day. One character looking tired (slumped posture, sweat drop). " +
        "Another character offering an encouraging pat on the shoulder or extending a hand. " +
        "Clock icon showing late afternoon/end-of-day time."
      )
    },
    "おじゃまします": {
      core: (
        "SCENE: front door/entrance. VISITOR outside the open door in a slight bow posture. " +
        "HOST inside the door welcoming them. " +
        "An arrow showing the transition from outside to inside."
      )
    },
    "さようなら": {
      core: (
        "SCENE: departure — doorway or gate in the background. " +
        "TWO characters: one waving goodbye, the other turning to leave. " +
        "A dotted arrow pointing away to show departure direction."
      )
    },
    "すみません": {
      core: (
        "Person in a slight bow (45 degrees forward), hand slightly raised to attract attention. " +
        "A speech bubble with a '!' symbol showing they are calling out to someone."
      )
    },
  };

  const profile = SET_EXPR_LOOKUP[word] || {
    core: (
      "SCENE showing the social context for saying \"" + en + "\" in Japanese. " +
      "Include all three scene elements: physical environment, character positions, and action context. " +
      "TWO characters interacting in the appropriate social situation. " +
      "One character performing a culturally appropriate gesture. White background."
    )
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the fixed social phrase \"" + word + "\" (" + en + ") at a glance.",
    "Draw the entire SCENE — not just a word or symbol. Context is the meaning.",
    "",
    "[SCENE & ACTION]",
    profile.core,
    "White background with minimal scene elements. Clean flat design.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Scene context elements (sun, moon, table, door) ARE permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートN: 副詞（ADVERB_FRAMES） ──
function buildAdverbPrompt_(word, en, adverbType) {
  const ADVERB_TYPE_FALLBACK = {
    "とても": "degree",   "すごく": "degree",  "たいへん": "degree",
    "すこし": "degree",   "ちょっと": "degree", "あまり": "degree",
    "ぜんぜん": "degree",
    "いつも": "frequency", "よく": "frequency", "ときどき": "frequency",
    "たまに": "frequency", "めったに": "frequency", "まったく": "degree",
    "ゆっくり": "manner",  "はやく": "manner",  "しずかに": "manner",
    "もう": "temporal",   "まだ": "temporal",   "もうすぐ": "temporal",
  };

  const resolvedType = (adverbType || ADVERB_TYPE_FALLBACK[word] || "degree").toLowerCase();

  let sceneCore = "";
  switch (resolvedType) {
    case "frequency":
      sceneCore = (
        "Strategy: CALENDAR_GRID — show a 7-cell weekly calendar grid. " +
        "Frequency indicator for \"" + en + "\": " +
        "  'always/every day' → ALL 7 cells filled with the same activity icon + ∞ loop arrow below. " +
        "  'often' → 5-6 cells filled, 1-2 empty. " +
        "  'sometimes' → 2-3 randomly placed cells filled, rest empty/gray. " +
        "  'rarely' → only 1 cell filled, rest empty with gray crosshatching. " +
        "Choose the appropriate fill density for \"" + en + "\". " +
        "ANCHOR: a small jogging person icon at the top-left to show what activity is being tracked. " +
        "White background, no text."
      );
      break;

    case "manner":
      sceneCore = (
        "Strategy: MOTION_COMPARISON — show a person performing an action, " +
        "with motion trail lines calibrated to indicate \"" + en + "\". " +
        "  'slowly/gently' → 1-2 thin, widely-spaced trail lines, long gradual arc. " +
        "  'quickly/fast' → 5-8 dense bold speed lines + 2-3 ghost motion trails. " +
        "  'quietly/softly' → person tiptoeing, minimal or no motion lines, 'Shhh' arc near feet. " +
        "ANCHOR: a walking or running person silhouette. White background, no text."
      );
      break;

    case "temporal":
      sceneCore = (
        "Strategy: TIMELINE — show a short horizontal timeline from left (past) to right (future/now). " +
        "For \"" + en + "\": " +
        "  'already' → a green checkmark stamp sits LEFT of the 'now' marker. Person in relaxed posture. " +
        "  'not yet' → an empty dashed circle sits RIGHT of the 'now' marker. Person in waiting posture. " +
        "  'soon' → a small clock/timer icon with an arrow pointing just right of the 'now' marker. " +
        "White background, no text."
      );
      break;

    case "degree":
    default:
      sceneCore = (
        "Strategy: DEGREE_METER — show an anchor object with a vertical scale bar (degree meter) beside it. " +
        "For \"" + en + "\", position the needle/fill at the appropriate level: " +
        "  'very/extremely' → meter at 90-100%, 3-5 radiating emphasis lines around the anchor object. " +
        "  'a little/slightly' → meter at 25-35%, only 1 thin emphasis line. " +
        "  'not very' → meter at 20-30% with a light diagonal line across the bar. " +
        "  'not at all' → meter at 0% with a bold red slash across the bar. " +
        "ANCHOR: a person reacting to hot soup (universal degree anchor). White background, no text."
      );
      break;
  }

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the adverb \"" + word + "\" (" + en + ") at a glance.",
    "CRITICAL: The adverb cannot stand alone. An ANCHOR subject (the thing being modified) MUST be present.",
    "",
    "[SCENE & ACTION]",
    sceneCore,
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Scale bars, calendar grids, timeline markers, and motion lines ARE permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートO: 助数詞（COUNTER_FRAMES） ──
function buildCounterPrompt_(word, en) {
  const COUNTER_LOOKUP = {
    "ほん": { objectType: "long thin objects (pencils, bottles, or similar elongated items)", arrangement: "side by side vertically" },
    "本":   { objectType: "long thin objects (pencils, bottles, or similar elongated items)", arrangement: "side by side vertically" },
    "まい": { objectType: "flat thin objects (sheets of paper, stamps, or similar flat items)", arrangement: "fanned out showing multiple layers" },
    "枚":   { objectType: "flat thin objects (sheets of paper, stamps, or similar flat items)", arrangement: "fanned out showing multiple layers" },
    "さつ": { objectType: "bound books or notebooks (spines visible)", arrangement: "in a small stack or row" },
    "冊":   { objectType: "bound books or notebooks (spines visible)", arrangement: "in a small stack or row" },
    "ひき": { objectType: "small animals (cats, fish, or similar small creatures)", arrangement: "in a row" },
    "匹":   { objectType: "small animals (cats, fish, or similar small creatures)", arrangement: "in a row" },
    "とう": { objectType: "large animals (horses or cattle, simplified silhouettes)", arrangement: "in a row with scale cues" },
    "頭":   { objectType: "large animals (horses or cattle, simplified silhouettes)", arrangement: "in a row with scale cues" },
    "だい": { objectType: "machines or vehicles (cars, bicycles, or computers)", arrangement: "in a canonical view row" },
    "台":   { objectType: "machines or vehicles (cars, bicycles, or computers)", arrangement: "in a canonical view row" },
    "こ":   { objectType: "small round objects (apples, eggs, or similar items)", arrangement: "in a natural grouping" },
    "個":   { objectType: "small round objects (apples, eggs, or similar items)", arrangement: "in a natural grouping" },
    "はい": { objectType: "cups or bowls of liquid/food (with steam if hot)", arrangement: "in a row" },
    "杯":   { objectType: "cups or bowls of liquid/food (with steam if hot)", arrangement: "in a row" },
  };

  const profile = COUNTER_LOOKUP[word] || {
    objectType: "objects appropriate for the counter \"" + en + "\"",
    arrangement: "in a clear row or grouping",
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the counter suffix \"" + word + "\" (" + en + ") at a glance.",
    "The CATEGORY of object being counted is the core meaning — not just the number.",
    "",
    "[SCENE & ACTION]",
    "Display 3 " + profile.objectType + ", arranged " + profile.arrangement + ".",
    "The objects fill 70% of the frame.",
    "Bottom-right corner: a counter badge showing [small icon of the object × 3].",
    "All objects identical and clearly rendered. Solid white background.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "A simple [icon × N] counter badge IS permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートP: 時間語彙（TIME_FRAMES） ──
function buildTimePrompt_(word, en, timeSubtype) {
  const TIME_SUBTYPE_FALLBACK = {
    "時": "clock",    "分": "clock",    "半": "clock",    "ごろ": "clock",
    "何時": "clock",
    "月曜日": "weekday", "火曜日": "weekday", "水曜日": "weekday",
    "木曜日": "weekday", "金曜日": "weekday", "土曜日": "weekday", "日曜日": "weekday",
    "何曜日": "weekday",
    "一月": "month",  "二月": "month",  "三月": "month",  "四月": "month",
    "五月": "month",  "六月": "month",  "七月": "month",  "八月": "month",
    "九月": "month",  "十月": "month",  "十一月": "month", "十二月": "month",
    "何月": "month",
    "春": "season",   "夏": "season",   "秋": "season",   "冬": "season",
    "今日": "relative", "明日": "relative", "あした": "relative",
    "昨日": "relative", "きのう": "relative",
    "来週": "relative", "先週": "relative", "再来週": "relative",
    "来月": "relative", "先月": "relative", "今月": "relative",
    "今年": "relative", "来年": "relative", "去年": "relative",
    "朝": "timeofday", "昼": "timeofday", "夜": "timeofday", "夕方": "timeofday",
    "午前": "timeofday", "午後": "timeofday",
    "毎日": "relative", "毎週": "relative", "毎月": "relative",
  };

  const resolvedSubtype = (timeSubtype || TIME_SUBTYPE_FALLBACK[word] || "clock").toLowerCase();

  let sceneCore = "";
  switch (resolvedSubtype) {
    case "weekday":
      sceneCore = (
        "Strategy: WEEKDAY_BAR — draw a 7-cell horizontal calendar bar (Mon through Sun). " +
        "Each cell contains a nature-element pictogram (NO text): " +
        "Mon=crescent moon icon, Tue=flame icon, Wed=water drop icon, Thu=tree icon, " +
        "Fri=coin/star icon, Sat=earth mound icon, Sun=sun circle icon. " +
        "The target day cell for \"" + en + "\" is highlighted in gold. " +
        "All other cells in light gray. White background."
      );
      break;

    case "month":
      sceneCore = (
        "Strategy: CALENDAR_WHEEL — draw a circular wheel divided into 12 equal sectors. " +
        "The target month sector for \"" + en + "\" is highlighted in gold. " +
        "Inside the highlighted sector: a tiny seasonal symbol appropriate for that month " +
        "(e.g., snowflake for Jan-Feb, cherry blossom for Mar-Apr, sunflower for Jul-Aug, " +
        "maple leaf for Oct-Nov). Other sectors in light gray. White background."
      );
      break;

    case "season":
      sceneCore = (
        "Strategy: SEASON_WHEEL — draw a circular 4-quadrant wheel: " +
        "TOP-LEFT Spring (pink #FFB7C5): cherry blossom petals. " +
        "TOP-RIGHT Summer (gold #FFD700): sunflower. " +
        "BOTTOM-RIGHT Autumn (brown #D2691E): maple leaf. " +
        "BOTTOM-LEFT Winter (light blue #87CEEB): snowflake. " +
        "The target season sector for \"" + en + "\" is at 100% opacity. " +
        "All other sectors at 40% opacity. White background."
      );
      break;

    case "relative":
      sceneCore = (
        "Strategy: RELATIVE_TIMELINE — draw a 3-cell horizontal calendar grid. " +
        "CENTER cell (today/this week/this month): outlined in gold with a downward pointer. " +
        "LEFT cell (yesterday/last week/last month): light blue with a leftward arrow from center. " +
        "RIGHT cell (tomorrow/next week/next month): light green with a rightward arrow from center. " +
        "Highlight the cell that corresponds to \"" + en + "\". " +
        "For weekly view, each cell shows 7 small squares. White background."
      );
      break;

    case "timeofday":
      sceneCore = (
        "Strategy: DAY_ARC — draw a semicircular arc representing the day cycle. " +
        "Position a sun or moon icon on the arc for \"" + en + "\": " +
        "Morning (朝): sun icon at lower-left on the arc, orange rays. " +
        "Noon (昼): sun icon at the apex (top center) of the arc, bright gold. " +
        "Evening (夕方): sun icon at lower-right, dim orange. " +
        "Night (夜): moon and stars icon, dark blue background. " +
        "午前 (AM): left half of the arc filled in gold; 午後 (PM): right half filled in indigo. " +
        "White background."
      );
      break;

    case "clock":
    default:
      sceneCore = (
        "Strategy: CONCEPT_CLOCK — draw a clock face in muted neutral gray at 70% opacity " +
        "(this indicates it represents the TIME CONCEPT, not a physical clock object). " +
        "Hour hand and minute hand pointing to the time indicated by \"" + en + "\" " +
        "highlighted in bold cyan. " +
        "If approximate (〜ごろ): add 2-3 concentric fuzzy ripple arcs around the hand tip " +
        "to show time ambiguity. " +
        "White background."
      );
      break;
  }

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the time word \"" + word + "\" (" + en + ") at a glance.",
    "Use calendar grids, clock faces, or timelines — NEVER text to convey time.",
    "",
    "[SCENE & ACTION]",
    sceneCore,
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
    "Calendar grids, clock hands, arcs, and directional arrows ARE permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートQ: 交通手段（TRANSPORT_FRAMES） ──
function buildTransportPrompt_(word, en) {
  const TRANSPORT_LOOKUP = {
    "電車": {
      view: "true side profile",
      signatures: (
        "MANDATORY identification signatures: " +
        "(1) pantograph visible on roof, (2) overhead catenary wire above the train, " +
        "(3) ballast track (gravel bed with rail sleepers) beneath wheels. " +
        "These THREE elements together distinguish 電車 from shinkansen and subway."
      )
    },
    "新幹線": {
      view: "true side profile",
      signatures: (
        "MANDATORY identification signatures: " +
        "(1) long aerodynamic nose (duck-bill shape), " +
        "(2) NO overhead pantograph visible (high-speed), " +
        "(3) elevated concrete viaduct track beneath. " +
        "These THREE elements distinguish 新幹線 from 電車."
      )
    },
    "地下鉄": {
      view: "true side profile inside tunnel",
      signatures: (
        "MANDATORY identification signatures: " +
        "(1) semicircular dark tunnel arch framing the train, " +
        "(2) dark tunnel background (no sky), " +
        "(3) NO overhead wire or pantograph visible. " +
        "These THREE elements distinguish 地下鉄 from 電車."
      )
    },
    "バス": {
      view: "3/4 front-side angle",
      signatures: (
        "Large rectangular body, front windshield, side windows in a row, " +
        "clearly visible bus stop sign in the background, " +
        "a passenger boarding at the front door."
      )
    },
    "タクシー": {
      view: "3/4 front-side angle",
      signatures: (
        "MANDATORY: roof-mounted 'andon' (行燈) illuminated sign (rectangular lamp on roof), " +
        "checker stripe pattern along the lower body, " +
        "sedan body shape with driver visible through windshield."
      )
    },
    "じてんしゃ": {
      view: "true side profile",
      signatures: (
        "Classic diamond frame (two triangles clearly visible), " +
        "two equal-size wheels, pedals and crank arm visible. " +
        "Optional: rider silhouette astride the saddle, leaning forward slightly."
      )
    },
    "自転車": {
      view: "true side profile",
      signatures: (
        "Classic diamond frame (two triangles clearly visible), " +
        "two equal-size wheels, pedals and crank arm visible. " +
        "Optional: rider silhouette astride the saddle."
      )
    },
    "ひこうき": {
      view: "side view, slightly from below",
      signatures: (
        "Jet engines visible under the wings (cylindrical nacelles), " +
        "vertical and horizontal tail fins clearly shown, " +
        "a rising arc trajectory going toward upper right."
      )
    },
    "飛行機": {
      view: "side view, slightly from below",
      signatures: (
        "Jet engines visible under the wings (cylindrical nacelles), " +
        "vertical and horizontal tail fins clearly shown, " +
        "a rising arc trajectory going toward upper right."
      )
    },
    "ふね": {
      view: "true side profile",
      signatures: "Water waves beneath the hull, smokestack with exhaust trail above, waterline clearly visible on the hull."
    },
    "船": {
      view: "true side profile",
      signatures: "Water waves beneath the hull, smokestack with exhaust trail above, waterline clearly visible on the hull."
    },
  };

  const profile = TRANSPORT_LOOKUP[word] || {
    view: "canonical side profile or 3/4 view",
    signatures: "Most distinctive identifying visual features of a " + en + " clearly rendered.",
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must INSTANTLY and UNAMBIGUOUSLY identify the vehicle \"" + word + "\" (" + en + ") at a glance.",
    "A learner must distinguish this vehicle from visually similar ones without any text clues.",
    "",
    "[SUBJECT & VIEW]",
    "Vehicle: " + en + " (" + word + "). View: " + profile.view + ".",
    "The vehicle fills 70-80% of the frame.",
    "",
    "[IDENTIFICATION SIGNATURES]",
    profile.signatures,
    "",
    "[AFFORDANCE — USAGE HINT]",
    "Embed the sense of boarding/using the vehicle: show a door open OR a person-silhouette " +
    "with one foot stepping in/onto the vehicle (showing 〜で行きます usage context).",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Functional cues (track, tunnel, wires) ARE permitted to aid identification.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートR: 家族語彙（FAMILY_FRAMES） ──
function buildFamilyPrompt_(word, en, familyForm) {
  const UCHI_WORDS = new Set([
    "父", "母", "兄", "弟", "姉", "妹", "祖父", "祖母", "夫", "妻",
    "息子", "娘", "親", "家族"
  ]);
  const resolvedForm = (familyForm || (UCHI_WORDS.has(word) ? "uchi" : "soto")).toLowerCase();

  const FAMILY_APPEARANCE = {
    "父":       "a middle-aged male figure (40s) in casual smart clothes",
    "お父さん": "a middle-aged male figure (40s) in casual smart clothes",
    "母":       "a middle-aged female figure (40s) in casual smart clothes",
    "お母さん": "a middle-aged female figure (40s) in casual smart clothes",
    "兄":       "a young adult male figure (20s), slightly taller",
    "お兄さん": "a young adult male figure (20s), slightly taller",
    "弟":       "a young boy figure, shorter than Ego",
    "姉":       "a young adult female figure (20s), slightly taller",
    "お姉さん": "a young adult female figure (20s), slightly taller",
    "妹":       "a young girl figure, shorter than Ego",
    "おじいさん": "an elderly male figure (60s-70s) in comfortable everyday clothes",
    "おばあさん": "an elderly female figure (60s-70s) in comfortable everyday clothes",
    "祖父":     "an elderly male figure (60s-70s) in comfortable everyday clothes",
    "祖母":     "an elderly female figure (60s-70s) in comfortable everyday clothes",
  };

  const appearance = FAMILY_APPEARANCE[word]
    || ("a family member appropriate for \"" + en + "\"");

  let sceneCore = "";
  if (resolvedForm === "uchi") {
    sceneCore = (
      "Strategy: UCHI_BUBBLE — draw a warm solid-line circular bubble (semi-transparent orange #FFE0E0). " +
      "INSIDE the bubble: small Ego silhouette on the LEFT and " + appearance + " on the RIGHT, " +
      "both smiling and leaning slightly toward each other. " +
      "A small heart icon between them shows closeness (uchi = in-group). " +
      "OUTSIDE the bubble: plain white background — no other characters. " +
      "This is the HUMBLE/IN-GROUP form of the family term."
    );
  } else {
    sceneCore = (
      "Strategy: SOTO_BUBBLE — draw TWO zones: " +
      "LEFT zone (outside any bubble): Ego character in a respectful bow posture (30-45 degrees forward), " +
      "with a small respect-arrow pointing toward the right zone. " +
      "RIGHT zone: a DASHED-line cool circle (soto zone, semi-transparent gray #E0E8F0) containing " +
      appearance + ". " +
      "Clear spatial distance between the two zones shows respect/formality. " +
      "This is the RESPECTFUL/OUT-GROUP form of the family term."
    );
  }

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the family term \"" + word + "\" (" + en + ") at a glance.",
    "CRITICAL: \"" + word + "\" is the " + (resolvedForm === "uchi" ? "IN-GROUP (uchi)" : "RESPECTFUL OUT-GROUP (soto)") +
    " form. The composition MUST visually encode this distinction.",
    "",
    "[SCENE & ACTION]",
    sceneCore,
    "White background, clean flat design.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Bubble borders (solid=uchi / dashed=soto) ARE mandatory for family terms.",
    "Do NOT use the same composition for uchi and soto forms of the same family role.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートS: 天気・自然現象（WEATHER_FRAMES） ──
function buildWeatherPrompt_(word, en) {
  const WEATHER_LOOKUP = {
    "はれ":   { core: "A clear golden yellow sun icon with uniform rays filling the upper center. Light blue sky background. No clouds. Optional: person in short sleeves enjoying the sunshine in lower-foreground." },
    "晴れ":   { core: "A clear golden yellow sun icon with uniform rays filling the upper center. Light blue sky background. No clouds. Optional: person in short sleeves enjoying the sunshine in lower-foreground." },
    "くもり": { core: "Multiple overlapping gray cloud icons covering most of the frame. No sun visible. Light gray background. Clouds vary slightly in size to show depth." },
    "曇り":   { core: "Multiple overlapping gray cloud icons covering most of the frame. No sun visible. Light gray background." },
    "あめ":   { core: "Dense parallel diagonal cyan rain streaks falling from top to bottom. At the ground: multiple concentric ripple circles (water impact rings) in puddles showing ongoing rain. Optional: umbrella-holding silhouette in background as scale reference." },
    "雨":     { core: "Dense parallel diagonal cyan rain streaks falling from top to bottom. At the ground: multiple concentric ripple circles (water impact rings) in puddles. Optional: umbrella-holding silhouette in background." },
    "ゆき":   { core: "Various sizes of white circles and 6-pointed snowflake icons falling from top. A white snow accumulation layer building up on the ground. Soft blue-gray background to enhance snow visibility." },
    "雪":     { core: "Various sizes of white circles and 6-pointed snowflake icons falling from top. A white snow accumulation layer building up on the ground. Soft blue-gray background." },
    "かぜ":   { core: "Parallel horizontal stream curves (wind lines) sweeping from left to right. A single tree on the left side bending sharply to the right. Scattered flying leaves (5-7 leaf icons) in the air moving rightward." },
    "風":     { core: "Parallel horizontal stream curves (wind lines) sweeping from left to right. A single tree bending sharply to the right. Scattered flying leaves (5-7 leaf icons) moving rightward." },
    "たいふう":{ core: "Large spiral/swirl icon in the center (storm system). Heavy rain streaks and bold wind stream lines. A broken inside-out umbrella on the ground showing intensity. Dramatic dark gray sky background." },
    "台風":   { core: "Large spiral/swirl icon in the center (storm system). Heavy rain streaks and bold wind stream lines. A broken inside-out umbrella on the ground showing intensity. Dramatic dark gray sky background." },
    "あつい": { core: "A large distorted red sun icon at the top. Person fanning themselves vigorously with a uchiwa fan, flushed cheeks (diagonal lines on cheeks), sweat drops flying from forehead. Warm reddish-orange ambient overlay in background." },
    "暑い":   { core: "A large distorted red sun icon at the top. Person fanning themselves vigorously, flushed cheeks, sweat drops flying from forehead. Warm reddish-orange ambient overlay." },
    "さむい": { core: "Blue-lavender cool background. Person hugging themselves tightly (arms crossed over chest), hunched posture. White breath vapor (2-3 wavy lines) from their mouth. Double outline silhouette showing shivering." },
    "寒い":   { core: "Blue-lavender cool background. Person hugging themselves tightly, hunched posture. White breath vapor from mouth. Double outline silhouette showing shivering." },
  };

  const profile = WEATHER_LOOKUP[word] || {
    core: (
      "Flat vector illustration showing the weather/natural phenomenon \"" + en + "\". " +
      "If it is a NOUN weather word (rain, snow, wind): show the environmental phenomenon as the main subject. " +
      "If it is an ADJECTIVE weather word (hot, cold): show a person's physiological reaction as the main subject. " +
      "White or weather-appropriate background."
    )
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the weather word \"" + word + "\" (" + en + ") at a glance.",
    "",
    "[SCENE & ACTION]",
    profile.core,
    "Clean flat design.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Weather icons (raindrops, snowflakes, sun rays, wind lines) ARE mandatory for identification.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートT: 感覚語彙（SENSORY_FRAMES） ──
function buildSensoryPrompt_(word, en, perceptionType) {
  const PERCEPTION_TYPE_FALLBACK = {
    "みます":     "active",  "見ます":     "active",
    "ききます":   "active",  "聞きます":   "active",
    "みえます":   "passive", "見えます":   "passive",
    "きこえます": "passive", "聞こえます": "passive",
    "においがします":  "emission",
    "おとがします":    "emission",
    "あじがします":    "emission",
    "〜がします": "emission",
  };

  const resolvedType = (perceptionType || PERCEPTION_TYPE_FALLBACK[word] || "active").toLowerCase();

  let sceneCore = "";
  switch (resolvedType) {
    case "passive":
      sceneCore = (
        "Strategy: PASSIVE_RECEPTION — show SPONTANEOUS/PASSIVE perception. " +
        "Person engaged in ANOTHER ACTIVITY (reading, walking, typing) facing AWAY from the sensory source. " +
        "BACKGROUND: the sensory source (e.g., a window showing Mt. Fuji for 見える; birds outside a window for 聞こえる). " +
        "Semi-transparent pastel signal lines flow PASSIVELY FROM the source TO the person's sense organ (eye or ear). " +
        "The person's expression: neutral — they are NOT actively focusing. " +
        "White background. CRITICAL: arrows point FROM source TO person (passive inward flow)."
      );
      break;

    case "emission":
      sceneCore = (
        "Strategy: SENSORY_EMISSION — show spontaneous emission of sensory signals FROM a source object. " +
        "CENTER: the sensory source object (e.g., piano or alarm for sound; bread or flower for smell; cake or candy for taste). " +
        "The signals RADIATE OUTWARD from the source: " +
        "  Sound: colorful music notes + concentric sound wave arcs radiating outward. " +
        "  Smell: 3 gently wavy semi-transparent pink/green aroma lines rising upward, with small sparkle stars floating nearby. " +
        "  Taste: person taking a bite, star/heart-shaped eyes, sparkle pops around mouth. " +
        "Optional: a nearby person with a neutral expression receiving the signal at their sense organ. " +
        "White background."
      );
      break;

    case "active":
    default:
      sceneCore = (
        "Strategy: ACTIVE_PERCEPTION — show INTENTIONAL/ACTIVE perception. " +
        "Person facing DIRECTLY toward the sensory target, fully oriented toward it. " +
        "  For VISION (見ます): eyes wide open, bold yellow light-beam lines shoot FROM the person's eyes TO the viewed object. Forward-leaning posture. " +
        "  For HEARING (聞きます): person turning head toward the sound source, hand cupped behind ear, a bold direct arrow from the sound source to their ear (active reception). " +
        "Target object clearly visible in the frame. " +
        "White background. CRITICAL: the active attention vector points FROM person TO target (outward active focus)."
      );
      break;
  }

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the perception verb \"" + word + "\" (" + en + ") at a glance.",
    "CRITICAL: The DIRECTION of the perception arrow is the core meaning.",
    "Active (見る/聞く): arrows go FROM person TO target.",
    "Passive (見える/聞こえる): signals flow FROM target TO person.",
    "Emission (〜がする): signals radiate OUTWARD from source.",
    "",
    "[SCENE & ACTION]",
    sceneCore,
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Directional arrows and signal lines ARE mandatory for this vocab type.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── デフォルト: other ──
function buildDefaultPrompt_(word, en) {
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the meaning of \"" + word + "\" (" + en + ") at a glance.",
    "",
    "[SCENE & ACTION]",
    "The main subject fills 70-80% of the image. Solid white background.",
    "Canonical 3/4 view (30-45 degrees above for objects; eye-level for persons).",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols anywhere — including titles, labels, captions, or any text overlay at any position in the rendered output.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ============================================================
// Imagen 4 API を呼び出す（内部関数）
// ============================================================
function callImagenAPI_(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY が ScriptProperties に設定されていません" };
  }

  const url = "https://generativelanguage.googleapis.com/v1beta/models/"
              + IMAGE_SETTINGS.MODEL + ":predict?key=" + apiKey;

  const payload = {
    instances:  [{ prompt: prompt }],
    parameters: { sampleCount: 1, aspectRatio: IMAGE_SETTINGS.ASPECT_RATIO, safetyFilterLevel: "block_only_high" },
  };
  const options = {
    method: "post", contentType: "application/json",
    payload: JSON.stringify(payload), muteHttpExceptions: true,
  };

  const response   = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();
  if (statusCode !== 200) {
    return { success: false, error: "HTTP " + statusCode + ": " + response.getContentText().substring(0, 300) };
  }

  let json;
  try { json = JSON.parse(response.getContentText()); }
  catch (e) { return { success: false, error: "JSON パースエラー: " + e.message }; }

  const predictions = json && json.predictions;
  if (!predictions || predictions.length === 0)
    return { success: false, error: "predictions が空です: " + JSON.stringify(json).substring(0, 200) };

  const imageBase64 = predictions[0].bytesBase64Encoded;
  const mimeType    = predictions[0].mimeType || "image/png";
  if (!imageBase64) return { success: false, error: "bytesBase64Encoded が空です" };

  Logger.log("  Imagen API 成功 | mimeType: " + mimeType);
  return { success: true, imageBase64: imageBase64, mimeType: mimeType };
}


// ============================================================
// 画像を Google Drive に保存（内部関数）
// ============================================================
function saveImageToDrive_(imageBase64, filename) {
  try {
    const folder   = DriveApp.getFolderById(IMAGE_SETTINGS.IMAGE_FOLDER_ID);
    const existing = folder.getFilesByName(filename);
    while (existing.hasNext()) existing.next().setTrashed(true);

    const imageBytes = Utilities.base64Decode(imageBase64);
    const blob       = Utilities.newBlob(imageBytes, "image/png", filename);
    const savedFile  = folder.createFile(blob);
    savedFile.setName(filename);
    savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = savedFile.getId();
    return { success: true, fileUrl: savedFile.getUrl(),
             directUrl: "https://drive.google.com/uc?id=" + fileId, fileId: fileId };
  } catch (e) { return { success: false, error: "Drive 保存エラー: " + e.message }; }
}


// ============================================================
// Vocabulary シートから pending 行を収集（内部関数）
// v5.1/v5.2: vocabType が空の場合は生成対象外（分類待ち）
// ============================================================
function getPendingImageRows_(ss) {
  return getAllImageRows_(ss).filter(function(r) {
    return r.imageStatus === "pending" && r.vocabType !== "";
  });
}

function getAllImageRows_(ss) {
  const sheet = ss.getSheetByName(IMAGE_SETTINGS.VOCAB_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  // A〜R（最大18列）まで安全に読み込む
  const lastCol  = Math.max(sheet.getLastColumn(), 14);
  const readCols = Math.min(lastCol, 19); // ← 18 → 19 に変更
const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, readCols).getValues();
  const rows = [];

  data.forEach(function(row, i) {
    const word        = String(row[0]  || "").trim();  // A
    const reading     = String(row[1]  || "").trim();  // B
    const en          = String(row[2]  || "").trim();  // C
    const vocabType   = String(row[5]  || "").trim();  // F
    const imageId     = String(row[6]  || "").trim();  // G
    const imageStatus = String(row[7]  || "").trim();  // H
    // 補助列（列が存在しない場合は空文字で安全処理）
    const familyForm      = row.length > 14 ? String(row[14] || "").trim() : "";  // O
    const adverbType      = row.length > 15 ? String(row[15] || "").trim() : "";  // P
    const timeSubtype     = row.length > 16 ? String(row[16] || "").trim() : "";  // Q
    const perceptionType  = row.length > 17 ? String(row[17] || "").trim() : "";  // R

    if (!word) return;
    rows.push({
      rowIndex:        i + 2,
      word:            word,
      reading:         reading,
      en:              en,
      vocabType:       vocabType,
      imageId:         imageId || ("word_" + word),
      imageStatus:     imageStatus,
      familyForm:      familyForm,
      adverbType:      adverbType,
      timeSubtype:     timeSubtype,
      perceptionType:  perceptionType,
imagePrompt:     row.length > 18 ? String(row[18] || "").trim() : "",  // S列 ← 追加
    });
  });
  return rows;
}


// ============================================================
// Log シートに書き込む（内部関数）
// ============================================================
function writeImageLog_(ss, imageId, status, url, errorMsg) {
  try {
    const logSheet = ss.getSheetByName(IMAGE_SETTINGS.LOG_SHEET_NAME);
    if (!logSheet) return;
    logSheet.appendRow([new Date(), "image", imageId, status, url || "", errorMsg || ""]);
  } catch (e) { Logger.log("WARN: ログ書き込み失敗: " + e.message); }
}


// ================================================================
// generateAudio.gs  v2.0
// 語彙・例文の音声を Gemini TTS API で自動生成する
// ================================================================

// =====================================================================
// 【変更後】AUDIO_SETTINGS（Google Cloud TTS 用）
// =====================================================================
const AUDIO_SETTINGS = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties()
                    .getProperty("SPREADSHEET_ID") || "YOUR_SPREADSHEET_ID_HERE",
  VOCAB_SHEET_NAME:    "Vocabulary",
  EXAMPLES_SHEET_NAME: "Examples",
  LOG_SHEET_NAME:      "Log",
  AUDIO_FOLDER_ID: PropertiesService.getScriptProperties()
                     .getProperty("AUDIO_FOLDER_ID") || "YOUR_AUDIO_FOLDER_ID_HERE",

  // ── Google Cloud TTS 設定 ──
  // 日本語 Neural2 音声の選択肢（全て無料枠: 100万文字/月）
  //   ja-JP-Neural2-B : 女性・明瞭・成人女性 ←推奨
  //   ja-JP-Neural2-C : 男性・落ち着いた声
  //   ja-JP-Neural2-D : 男性・若めの声
  // WaveNet（さらに自然だが無料枠）
  //   ja-JP-Wavenet-A : 女性
  //   ja-JP-Wavenet-B : 男性
  VOICE_NAME:    "ja-JP-Neural2-B",
  LANGUAGE_CODE: "ja-JP",
  AUDIO_ENCODING: "LINEAR16",   // WAV互換PCM → buildWavBlob_() がそのまま流用
  SAMPLE_RATE:    24000,        // 24kHz（Neural2デフォルト）

  // 生成間隔（ms）
  // Cloud TTS はレート制限が緩いため短縮可（1秒で十分）
  DELAY_MS: 1000,

  // 1バッチあたりの最大処理件数
  // 日次上限なし・月100万文字の枠内なら何バッチでも生成可
  // GAS の 6分制限に合わせて設定（1件1秒 × 50 = 約50秒）
  MAX_BATCH_SIZE: 50,
};

function generateAudioBatch() {
  Logger.log("===== generateAudio.gs v2.0 開始 =====");
  Logger.log("API: Google Cloud TTS / ボイス: " + AUDIO_SETTINGS.VOICE_NAME
             + " / バッチ上限: " + AUDIO_SETTINGS.MAX_BATCH_SIZE + "件");

  const ss      = SpreadsheetApp.openById(AUDIO_SETTINGS.SPREADSHEET_ID);
  const pending = getPendingAudioRows_(ss);
  if (pending.length === 0) { Logger.log("INFO: pending 行はありません。"); return; }

  const batch     = pending.slice(0, AUDIO_SETTINGS.MAX_BATCH_SIZE);
  const remaining = pending.length - batch.length;
  Logger.log("未処理: " + pending.length + " → 今回: " + batch.length + " 件"
             + (remaining > 0 ? " / 残り: " + remaining + " 件（次回）" : ""));

  let successCount = 0, errorCount = 0;
  batch.forEach(function(row, i) {
    Logger.log("  [" + (i+1) + "/" + batch.length + "] " + row.audioId);
    const result = processAudioEntry_(ss, row);
    if (result === "success") successCount++;
    else errorCount++;
    if (i < batch.length - 1) Utilities.sleep(AUDIO_SETTINGS.DELAY_MS);
  });

  Logger.log("===== バッチ完了 ===== 成功: " + successCount + " / エラー: " + errorCount);
  if (remaining > 0) Logger.log("残り " + remaining + " 件 → 次回継続");
  else Logger.log("✓ 全件完了！syncRegistries.gs を実行してください。");
}

function testSingleAudio() {
  const TARGET_AUDIO_ID = "word_医者";
  Logger.log("===== テスト生成: " + TARGET_AUDIO_ID + " =====");
  const ss      = SpreadsheetApp.openById(AUDIO_SETTINGS.SPREADSHEET_ID);
  const pending = getPendingAudioRows_(ss);
  const target  = pending.find(function(r) { return r.audioId === TARGET_AUDIO_ID; });
  if (!target) {
    Logger.log("ID '" + TARGET_AUDIO_ID + "' が pending 行に見つかりませんでした。");
    Logger.log("→ retryAudio([\"" + TARGET_AUDIO_ID + "\"]) を使用してください。");
    return;
  }
  processAudioEntry_(ss, target);
  Logger.log("===== テスト完了 =====");
}

function retryAudio(targetAudioIds) {
  if (!targetAudioIds || targetAudioIds.length === 0) { Logger.log("ERROR: targetAudioIds が空です"); return; }
  const ss      = SpreadsheetApp.openById(AUDIO_SETTINGS.SPREADSHEET_ID);
  const idSet   = new Set(targetAudioIds);
  const targets = getAllAudioRows_(ss).filter(function(r) { return idSet.has(r.audioId); });
  if (targets.length === 0) { Logger.log("INFO: 対象 ID が見つかりませんでした"); return; }
  Logger.log("INFO: " + targets.length + " 件を再処理します");
  targets.forEach(function(row) { processAudioEntry_(ss, row); Utilities.sleep(AUDIO_SETTINGS.DELAY_MS); });
}

function setupAudioDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "generateAudioBatch") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("generateAudioBatch").timeBased().everyDays(1).atHour(10).create();
  Logger.log("INFO: generateAudioBatch の日次トリガーを設定しました（毎日 10:00）");
}

function setupAudioTriggersX3() {
  // 既存の generateAudioBatch トリガーをすべて削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "generateAudioBatch") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // 10:00 / 14:00 / 18:00 の3回に設定
  [10, 14, 18].forEach(function(hour) {
    ScriptApp.newTrigger("generateAudioBatch")
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .create();
  });

  Logger.log("✓ generateAudioBatch を 10:00 / 14:00 / 18:00 の3回に設定しました");
  Logger.log("確認: GASエディタ → 時計アイコン（トリガー）→ generateAudioBatch が3件あること");
}

function processAudioEntry_(ss, row) {
  try {
    const ttsResult = callGoogleCloudTTS_(row.textToSpeak);
    if (!ttsResult.success) throw new Error(ttsResult.error);

    const wavBlob = buildCloudTtsWavBlob_(ttsResult.audioBase64, row.filename);
    validateWavStructure_(wavBlob, row.audioId, ss);
    const driveResult = saveAudioToDrive_(wavBlob, row.filename);
    if (!driveResult.success) throw new Error(driveResult.error);

    updateAudioStatus_(ss, row, "generated", driveResult.directUrl);
    writeAudioLog_(ss, row.audioId, "success", driveResult.directUrl, "");
    Logger.log("  ✓ 完了: " + row.filename + " → " + driveResult.directUrl);
    return "success";
  } catch (e) {
    updateAudioStatus_(ss, row, "failed", "");
    writeAudioLog_(ss, row.audioId, "failed", "", e.message);
    Logger.log("  ✗ エラー: " + row.audioId + " → " + e.message);
    return "error";
  }
}

function updateAudioStatus_(ss, row, status, url) {
  const sheet = ss.getSheetByName(row.sheetName);
  if (!sheet) return;
  sheet.getRange(row.rowIndex, row.audioStatusCol).setValue(status);
  sheet.getRange(row.rowIndex, row.audioUrlCol).setValue(url);
}

function getPendingAudioRows_(ss) {
  return getAllAudioRows_(ss).filter(function(r) { return r.audioStatus === "pending"; });
}

function getAllAudioRows_(ss) {
  const rows = [];

  const vocabSheet = ss.getSheetByName(AUDIO_SETTINGS.VOCAB_SHEET_NAME);
  if (vocabSheet && vocabSheet.getLastRow() >= 2) {
    const data = vocabSheet.getRange(2, 1, vocabSheet.getLastRow() - 1, 12).getValues();
    data.forEach(function(row, i) {
      const word        = String(row[0]).trim();
      const reading     = String(row[1]).trim();
      const audioId     = String(row[9]).trim();
      const audioStatus = String(row[10]).trim();
      if (!word) return;
      rows.push({
        sheetName: AUDIO_SETTINGS.VOCAB_SHEET_NAME, rowIndex: i + 2,
        audioId: audioId || ("word_" + word),
        textToSpeak: reading || word,
        filename: (audioId || ("word_" + word)) + ".wav",
        audioStatus: audioStatus, audioStatusCol: 11, audioUrlCol: 12,
      });
    });
  }

  const exSheet = ss.getSheetByName(AUDIO_SETTINGS.EXAMPLES_SHEET_NAME);
  if (exSheet && exSheet.getLastRow() >= 2) {
    const data = exSheet.getRange(2, 1, exSheet.getLastRow() - 1, 8).getValues();
    data.forEach(function(row, i) {
      const id          = String(row[0]).trim();
      const textToSpeak = String(row[5]).trim();
      const audioStatus = String(row[6]).trim();
      if (!id) return;
      rows.push({
        sheetName: AUDIO_SETTINGS.EXAMPLES_SHEET_NAME, rowIndex: i + 2,
        audioId: id, textToSpeak: textToSpeak, filename: id + ".wav",
        audioStatus: audioStatus, audioStatusCol: 7, audioUrlCol: 8,
      });
    });
  }
  return rows;
}

// =====================================================================
// Google Cloud Text-to-Speech API 呼び出し
// 戻り値: { success: true, audioBase64, sampleRate }
//       | { success: false, error }
// ※ buildWavBlob_() との互換性を維持するため、
//   Gemini TTS と同じ戻り値形式で返す
// =====================================================================
function callGoogleCloudTTS_(text) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GCP_TTS_API_KEY");
  if (!apiKey) {
    return { success: false, error: "GCP_TTS_API_KEY が ScriptProperties に設定されていません" };
  }

  const url = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey;

  const payload = {
    input: { text: text },
    voice: {
      languageCode: AUDIO_SETTINGS.LANGUAGE_CODE,
      name:         AUDIO_SETTINGS.VOICE_NAME,
    },
    audioConfig: {
      audioEncoding:   AUDIO_SETTINGS.AUDIO_ENCODING,
      sampleRateHertz: AUDIO_SETTINGS.SAMPLE_RATE,
      // ── 音声調整パラメータ（任意）──
      // speakingRate: 1.0,  // 0.25〜4.0（1.0=標準、0.85=ゆっくり目）
      // pitch: 0.0,         // -20.0〜20.0（半音単位）
      // volumeGainDb: 0.0,  // 音量調整
    }
  };

  const options = {
    method:      "post",
    contentType: "application/json",
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response   = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    return {
      success: false,
      error: "HTTP " + statusCode + ": " + response.getContentText().substring(0, 300)
    };
  }

  let json;
  try {
    json = JSON.parse(response.getContentText());
  } catch (e) {
    return { success: false, error: "JSON パースエラー: " + e.message };
  }

  if (!json.audioContent) {
    return { success: false, error: "audioContent が空です。APIキーまたはモデル名を確認してください。" };
  }

  // buildWavBlob_() に渡す形式に合わせて返す（Gemini TTS と互換）
  return {
    success:     true,
    audioBase64: json.audioContent,
    sampleRate:  AUDIO_SETTINGS.SAMPLE_RATE,
  };
}

function buildCloudTtsWavBlob_(audioBase64, filename) {
  const audioBytes = Utilities.base64Decode(audioBase64);
  return Utilities.newBlob(audioBytes, "audio/wav", filename);
}

function saveAudioToDrive_(blob, filename) {
  try {
    const folder   = DriveApp.getFolderById(AUDIO_SETTINGS.AUDIO_FOLDER_ID);
    const existing = folder.getFilesByName(filename);
    while (existing.hasNext()) existing.next().setTrashed(true);
    const savedFile = folder.createFile(blob);
    savedFile.setName(filename);
    savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileId = savedFile.getId();
    return { success: true, fileUrl: savedFile.getUrl(),
             directUrl: "https://drive.google.com/uc?id=" + fileId, fileId: fileId };
  } catch (e) { return { success: false, error: "Drive 保存エラー: " + e.message }; }
}

function writeAudioLog_(ss, audioId, status, url, errorMsg) {
  try {
    const logSheet = ss.getSheetByName(AUDIO_SETTINGS.LOG_SHEET_NAME);
    if (!logSheet) return;
    logSheet.appendRow([new Date(), "audio", audioId, status, url || "", errorMsg || ""]);
  } catch (e) { Logger.log("WARN: ログ書き込み失敗: " + e.message); }
}


// ================================================================
// syncRegistries.gs
// スプレッドシートの生成済みエントリを
// master_image_registry.json / master_audio_registry.json に書き戻す
// ================================================================

const SYNC_SETTINGS = {
  SPREADSHEET_ID:    "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk",
  IMAGE_REGISTRY_ID: "14NL_LqudXIQzY68klspH3SBlR21hiqbW",
  AUDIO_REGISTRY_ID: "1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0",
};

const PROTECTED_PREFIXES = ["char_", "ex_L"];
const PROTECTED_EXACT    = ["world_map"];

function syncAll() {
  console.log("===== syncRegistries 開始 =====");
  const imageResult = syncImageRegistry();
  const audioResult = syncAudioRegistry();
  console.log("===== syncRegistries 完了 =====");
  console.log(`画像registry: ${imageResult.updated}件更新 / ${imageResult.skipped}件スキップ / ${imageResult.protected}件保護`);
  console.log(`音声registry: ${audioResult.updated}件更新 / ${audioResult.skipped}件スキップ / ${audioResult.protected}件保護`);
  console.log("次のステップ: build-embedded-data.py を手動実行してください");
  writeLog("sync", "syncAll", `✓ 画像:${imageResult.updated}更新 / 音声:${audioResult.updated}更新`, "", "");
}

function syncImageRegistry() {
  const registry = loadJsonFromDriveById(SYNC_SETTINGS.IMAGE_REGISTRY_ID);
  if (!registry) { console.error("✗ master_image_registry.json の読み込みに失敗"); return { updated: 0, skipped: 0, protected: 0 }; }

  const ss    = SpreadsheetApp.openById(SYNC_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  if (!sheet) { console.error("✗ Vocabulary シートが見つかりません"); return { updated: 0, skipped: 0, protected: 0 }; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const COL     = buildColIndex(headers);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { updated: 0, skipped: 0, protected: 0 };

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  let updated = 0, skipped = 0, protected_ = 0;

  for (const row of data) {
    const imageId     = String(row[COL.imageId]     || "").trim();
    const imageStatus = String(row[COL.imageStatus] || "").trim();
    const imageUrl    = String(row[COL.imageUrl]    || "").trim();

    if (!imageId) { skipped++; continue; }
    if (isProtected(imageId)) { console.log(`  🛡 保護スキップ: ${imageId}`); protected_++; continue; }
    if (!imageUrl || imageStatus === "pending" || imageStatus === "failed") { skipped++; continue; }
    if (!registry.entries || registry.entries[imageId] === undefined) {
      console.log(`  ⚠️ registry に未登録（スキップ）: ${imageId}`); skipped++; continue;
    }

    const entry = registry.entries[imageId];
    if (!entry.images || entry.images.length === 0) entry.images = [{}];
    entry.images[0].imageUrl    = imageUrl;
    entry.images[0].generatedAt = entry.images[0].generatedAt || new Date().toISOString().slice(0, 10);
    if (entry.status !== "approved") entry.status = imageStatus;
    console.log(`  ✓ 画像更新: ${imageId}`);
    updated++;
  }

  if (registry._meta) registry._meta.lastUpdated = new Date().toISOString().slice(0, 10);
  saveJsonToDriveById(SYNC_SETTINGS.IMAGE_REGISTRY_ID, registry);
  console.log(`  ✓ master_image_registry.json 書き込み完了`);
  return { updated, skipped, protected: protected_ };
}

function syncAudioRegistry() {
  const registry = loadJsonFromDriveById(SYNC_SETTINGS.AUDIO_REGISTRY_ID);
  if (!registry) { console.error("✗ master_audio_registry.json の読み込みに失敗"); return { updated: 0, skipped: 0, protected: 0 }; }

  const ss = SpreadsheetApp.openById(SYNC_SETTINGS.SPREADSHEET_ID);
  let updated = 0, skipped = 0, protected_ = 0;

  const vocabSheet = ss.getSheetByName("Vocabulary");
  if (vocabSheet && vocabSheet.getLastRow() > 1) {
    const headers = vocabSheet.getRange(1, 1, 1, vocabSheet.getLastColumn()).getValues()[0];
    const COL     = buildColIndex(headers);
    const data    = vocabSheet.getRange(2, 1, vocabSheet.getLastRow() - 1, headers.length).getValues();
    for (const row of data) {
      const audioId     = String(row[COL.audioId]     || "").trim();
      const audioStatus = String(row[COL.audioStatus] || "").trim();
      const audioUrl    = String(row[COL.audioUrl]    || "").trim();
      if (!audioId) { skipped++; continue; }
      if (isProtected(audioId)) { protected_++; continue; }
      if (!audioUrl || audioStatus === "pending" || audioStatus === "failed") { skipped++; continue; }
      if (!registry.entries || registry.entries[audioId] === undefined) { skipped++; continue; }
      registry.entries[audioId].audioUrl = audioUrl;
      console.log(`  ✓ 音声更新（語彙）: ${audioId}`);
      updated++;
    }
  }

  const exSheet = ss.getSheetByName("Examples");
  if (exSheet && exSheet.getLastRow() > 1) {
    const headers    = exSheet.getRange(1, 1, 1, exSheet.getLastColumn()).getValues()[0];
    const idIdx      = headers.indexOf("id");
    const audioStIdx = headers.indexOf("audioStatus");
    const audioUrlIdx= headers.indexOf("audioUrl");
    if (idIdx >= 0 && audioStIdx >= 0 && audioUrlIdx >= 0) {
      const data = exSheet.getRange(2, 1, exSheet.getLastRow() - 1, headers.length).getValues();
      for (const row of data) {
        const id          = String(row[idIdx]        || "").trim();
        const audioStatus = String(row[audioStIdx]   || "").trim();
        const audioUrl    = String(row[audioUrlIdx]  || "").trim();
        if (!id) { skipped++; continue; }
        if (isProtected(id)) { protected_++; continue; }
        if (!audioUrl || audioStatus === "pending" || audioStatus === "failed") { skipped++; continue; }
        if (!registry.entries || registry.entries[id] === undefined) { skipped++; continue; }
        registry.entries[id].audioUrl = audioUrl;
        console.log(`  ✓ 音声更新（例文）: ${id}`);
        updated++;
      }
    }
  }

  if (registry._meta) registry._meta.lastModified = new Date().toISOString().slice(0, 10);
  saveJsonToDriveById(SYNC_SETTINGS.AUDIO_REGISTRY_ID, registry);
  console.log(`  ✓ master_audio_registry.json 書き込み完了`);
  return { updated, skipped, protected: protected_ };
}

function isProtected(key) {
  if (!key) return false;
  if (PROTECTED_EXACT.includes(key)) return true;
  for (const prefix of PROTECTED_PREFIXES) { if (key.startsWith(prefix)) return true; }
  return false;
}

function buildColIndex(headers) {
  const map = {};
  headers.forEach((h, i) => { map[h] = i; });
  return map;
}

function loadJsonFromDriveById(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return JSON.parse(file.getBlob().getDataAsString("utf-8"));
  } catch (e) { console.error(`JSON 読み込みエラー (${fileId}): ${e.message}`); return null; }
}

function saveJsonToDriveById(fileId, data) {
  try {
    DriveApp.getFileById(fileId).setContent(JSON.stringify(data, null, 2));
  } catch (e) { console.error(`JSON 書き込みエラー (${fileId}): ${e.message}`); throw e; }
}

function setupSyncDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "syncAll") { ScriptApp.deleteTrigger(trigger); deletedCount++; }
  }
  if (deletedCount > 0) console.log(`  既存の syncAll トリガーを ${deletedCount} 件削除しました`);
  ScriptApp.newTrigger("syncAll").timeBased().everyDays(1).atHour(23).create();
  console.log("✓ syncAll() のタイマートリガーを登録しました（毎日 23:00）");
}

function testProtectedKeys() {
  const testCases = [
    { key: "char_鈴木",           expect: true  },
    { key: "ex_L01_007",          expect: true  },
    { key: "world_map",           expect: true  },
    { key: "word_医者",           expect: false },
    { key: "sentence_ex_L01_001", expect: false },
  ];
  let pass = 0, fail = 0;
  for (const { key, expect } of testCases) {
    const result = isProtected(key);
    if (result === expect) { console.log(`  ✓ OK: "${key}" → ${result}`); pass++; }
    else { console.log(`  ✗ NG: "${key}" → 期待:${expect} 実際:${result}`); fail++; }
  }
  console.log(`\n保護チェック: ${pass}件OK / ${fail}件NG`);
}


// ================================================================
// ユーティリティ・メンテナンス関数
// ================================================================

function checkStyleRecipe() {
  Logger.log(STYLE_RECIPE);
}

// =====================================================================
// 補助列 O〜R を追加する（v5.1 対応・2026-05-18）
// 既存データ（A〜N）は一切変更しない。
// 既に O〜R が存在する場合はヘッダーのみ再適用する。
// 実行: addAuxiliaryColumns() を手動で1回だけ実行する
// =====================================================================
function addAuxiliaryColumns() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");

  if (!sheet) {
    Logger.log("ERROR: Vocabulary シートが見つかりません。");
    return;
  }

  // ✅ getMaxColumns() で物理列数を確認して一括挿入
  const requiredCols  = 18;
  const currentMax    = sheet.getMaxColumns();
  if (currentMax < requiredCols) {
    sheet.insertColumnsAfter(currentMax, requiredCols - currentMax);
    Logger.log("列を追加しました: " + (requiredCols - currentMax) + " 列");
  }

  // ヘッダーを4列まとめて1回で書き込む
  sheet.getRange(1, 15, 1, 4).setValues([[
    "familyForm", "adverbType", "timeSubtype", "perceptionType"
  ]]);

  // 書式も4列まとめて1回
  const headerRange = sheet.getRange(1, 15, 1, 4);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#FFF3E0");
  headerRange.setHorizontalAlignment("center");

  // 列幅（これだけ個別）
  sheet.setColumnWidth(15, 100);
  sheet.setColumnWidth(16, 120);
  sheet.setColumnWidth(17, 130);
  sheet.setColumnWidth(18, 120);

  // ✅ データ検証は省略（generateImages.gs v5.1 は空欄でも自動推定するため不要）
  Logger.log("✅ 補助列 O〜R 追加完了（familyForm / adverbType / timeSubtype / perceptionType）");
}

function resetToRegenerate() {
  const ss   = SpreadsheetApp.openById(AUDIO_SETTINGS.SPREADSHEET_ID);
  const rows = getAllAudioRows_(ss);
  let count  = 0;
  rows.forEach(function(row) {
    if (row.audioStatus === "outdated") return;
    if (row.audioStatus === "generated" || row.audioStatus === "failed") {
      const sheet = ss.getSheetByName(row.sheetName);
      if (!sheet) return;
      sheet.getRange(row.rowIndex, row.audioStatusCol).setValue("pending");
      sheet.getRange(row.rowIndex, row.audioUrlCol).setValue("");
      count++;
    }
  });
  Logger.log("✅ " + count + " 件を pending に戻しました。outdated は変更していません。");
}

function validateWavStructure_(wavBlob, audioId, ss) {
  try {
    const bytes = wavBlob.getBytes();
    const outerRiff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    if (outerRiff !== "RIFF") {
      Logger.log("  ⚠️  validateWav [" + audioId + "]: 先頭が RIFF でありません");
      return;
    }
    for (var i = 12; i < bytes.length - 3; i++) {
      if (bytes[i] === 0x52 && bytes[i+1] === 0x49 &&
          bytes[i+2] === 0x46 && bytes[i+3] === 0x46) {
        Logger.log("  ⚠️  validateWav [" + audioId + "]: nested WAV 検出 byte " + i);
        return;
      }
    }
    Logger.log("  ✅ validateWav [" + audioId + "]: WAV構造 OK");
  } catch (e) {
    Logger.log("  WARN: validateWav エラー: " + e.message);
  }
}

function resetFailedToPending(lessonRef) {
  const ss      = SpreadsheetApp.openById(IMAGE_SETTINGS.SPREADSHEET_ID);
  const sheet   = ss.getSheetByName(IMAGE_SETTINGS.VOCAB_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log("データがありません"); return; }

  // H列(8)=imageStatus, I列(9)=imageUrl, M列(13)=lessonRef を一括で読み取り
  const range = sheet.getRange(2, 8, lastRow - 1, 6); // H～M
  const data  = range.getValues();
  let count   = 0;

  for (let i = 0; i < data.length; i++) {
    const imageStatus = String(data[i][0] || "").trim(); // H列
    const lessonRefVal = String(data[i][5] || "").trim(); // M列 (13 - 8 = 5)
    if (imageStatus !== "failed") continue;
    if (lessonRef && lessonRefVal !== lessonRef) continue;
    data[i][0] = "pending"; // imageStatus
    data[i][1] = "";        // imageUrl
    count++;
  }

  range.setValues(data);
  const scope = lessonRef ? " (lessonRef=\"" + lessonRef + "\")" : "";
  Logger.log("✅ " + count + " 件の failed → pending に変更しました" + scope);
}

// 後方互換エイリアス
function resetFailedImagesToPending() { resetFailedToPending(); }

// S列（imagePrompt）をVocabularyシートに追加する
// 1回だけ実行すれば OK
function addImagePromptColumn() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  if (!sheet) { Logger.log("ERROR: Vocabulary シートが見つかりません"); return; }

  const S_COL = 19;
  if (sheet.getMaxColumns() < S_COL) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), S_COL - sheet.getMaxColumns());
  }
  const cell = sheet.getRange(1, S_COL);
  cell.setValue("imagePrompt");
  cell.setFontWeight("bold");
  cell.setBackground("#E8F5E9");
  sheet.setColumnWidth(S_COL, 600);

  // v5.3: S列に誤ってデータ入力規則が設定されないよう明示的にクリア
  sheet.getRange(2, S_COL, sheet.getMaxRows() - 1, 1).clearDataValidations();
  Logger.log("✅ S列（imagePrompt）追加完了");
}

// Claude が生成した JSON をS列に一括投入する
// 使い方: importImagePromptsFromJson() を実行する（下のラッパー関数）
function importImagePrompts(jsonData) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  if (!sheet) { Logger.log("ERROR: シートが見つかりません"); return; }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log("データ行がありません"); return; }

  // G列（imageId）とS列（imagePrompt）を取得
  const imageIds = sheet.getRange(2, 7, lastRow - 1, 1).getValues(); // G列
  let count = 0;

  for (var i = 0; i < imageIds.length; i++) {
    const imageId = String(imageIds[i][0] || "").trim();
    if (!imageId || !jsonData[imageId]) continue;
    sheet.getRange(i + 2, 19).setValue(jsonData[imageId]); // S列に書き込み
    count++;
  }
  Logger.log("✅ " + count + " 件のプロンプトを S列に投入しました");
}

// lesson_02.json の例文28件を Examples シートに投入する
// 既に登録済みの id はスキップ（差分のみ追加）
function importExamplesFromLesson02() {
  const lessonFileId = LESSON_FILE_IDS.lesson_02;
  Logger.log("===== importExamplesFromLesson02 開始 =====");

  // lesson_02.json を Drive から読み込む
  const lessonJson = loadJsonFromDriveById(lessonFileId);
  if (!lessonJson) { Logger.log("ERROR: lesson_02.json の読み込みに失敗"); return; }

  // patterns[*].examples[] から全例文を抽出
  const examples = [];
  const seen = new Set();
  (lessonJson.patterns || []).forEach(function(pat) {
    (pat.examples || []).forEach(function(ex) {
      const id = String(ex.audioId || "").trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      // textToSpeak: 「—」を「→」に変換（TTS読み上げ用）
      const textToSpeak = String(ex.sentence || "").replace(/\s*—\s*/g, "→ ").trim();
      examples.push([
        id,                              // A: id
        lessonJson.lessonNo || 2,        // B: lessonNo
        pat.id || "",                    // C: patternId
        String(ex.sentence   || ""),     // D: sentence
        String(ex.sentenceEn || ""),     // E: sentenceEn
        textToSpeak,                     // F: textToSpeak
        "pending",                       // G: audioStatus
        "",                              // H: audioUrl
        ex.isAnchor === true,            // I: isAnchor
      ]);
    });
  });
  Logger.log("抽出した例文数: " + examples.length);

  // Examples シートの既存 id を確認（差分チェック）
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Examples");
  if (!sheet) { Logger.log("ERROR: Examples シートが見つかりません"); return; }

  const existingIds = getExistingKeys(sheet, 1); // A列のidを取得
  const newRows = examples.filter(function(e) { return !existingIds.has(e[0]); });
  Logger.log("新規追加: " + newRows.length + "件 / スキップ: " + (examples.length - newRows.length) + "件");

  if (newRows.length === 0) { Logger.log("INFO: 追加する例文はありません"); return; }

  // シートに書き込み
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, newRows.length, 9).setValues(newRows);

  // I列（isAnchor）にチェックボックスを1行ずつ追加
  for (var i = 0; i < newRows.length; i++) {
    sheet.getRange(startRow + i, 9).insertCheckboxes();
  }

  Logger.log("===== 完了: " + newRows.length + "件を追加 =====");
}

// ================================================================
// Drive上の image_prompts_lessonXX.json（配列形式）をS列に一括投入する
//
// 使い方:
//   1. image_prompts_lesson01_v1_0.json を Google Drive にアップロード
//   2. そのファイルのIDを PROMPT_JSON_FILE_ID に設定
//   3. importImagePromptsFromDriveJson() を実行
//
// JSONの期待フォーマット（Claude生成の配列形式）:
//   { "vocabulary": [ { "imageId": "word_医者", "prompt": "..." }, ... ] }
// ================================================================
function importImagePromptsFromDriveJson() {
  const PROMPT_JSON_FILE_ID = "1EDD46wQIPL6VsxxY5YNCYKqBY7ACaCSH"; // ← 要設定

  if (PROMPT_JSON_FILE_ID === "ここにDriveファイルIDを入れる") {
    Logger.log("ERROR: PROMPT_JSON_FILE_ID を設定してから実行してください。");
    return;
  }

  // Drive から JSON を読み込む
  let json;
  try {
    const file = DriveApp.getFileById(PROMPT_JSON_FILE_ID);
    json = JSON.parse(file.getBlob().getDataAsString("utf-8"));
  } catch (e) {
    Logger.log("ERROR: JSON読み込み失敗 — " + e.message);
    return;
  }

  // 配列形式 → { imageId: prompt } のフラット形式に変換
  const flat = {};
  const vocab = json.vocabulary || [];
  vocab.forEach(function(entry) {
    if (entry.imageId && entry.prompt) {
      flat[entry.imageId] = entry.prompt;
    }
  });

  if (Object.keys(flat).length === 0) {
    Logger.log("ERROR: vocabulary 配列が空、または imageId/prompt フィールドが見つかりません。");
    return;
  }

  Logger.log("変換完了: " + Object.keys(flat).length + " 件のプロンプトを読み込みました。");

  // 既存の importImagePrompts() を呼び出してS列に書き込む
  importImagePrompts(flat);
}

function clearImagePromptColumnValidation() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  if (!sheet) { Logger.log("ERROR: シートが見つかりません"); return; }

  sheet.getRange(1, 19, sheet.getLastRow(), 1).clearDataValidations();
  Logger.log("✅ S列のデータ入力規則をクリアしました");
}

