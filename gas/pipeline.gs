/**
 * ================================================================
 * GASパイプライン 統合スクリプト
 * 最終更新: 2026-05-21 (v7.5)
 *
 * 変更履歴:
 *   v7.5: Phase 4 ⑥ — generateImages セクション（IMAGE_SETTINGS / STYLE_RECIPE /
 *         OBJECT_SIGNATURES / ABSTRACT_METAPHORS / BUILDING_CUES / PERSON_PROFILES /
 *         generateImageBatch / testSingleImage / previewPrompts / retryImages /
 *         setupImageTriggersX3 / setupImageDailyTrigger / processImageEntry_ /
 *         buildImagePrompt_ / build*Prompt_ × 19 / callImagenAPI_ /
 *         saveImageToDrive_ / get*ImageRows_ / writeImageLog_）、および関連
 *         Sheet 操作 utility 群（checkStyleRecipe / addAuxiliaryColumns /
 *         resetFailedToPending / resetFailedImagesToPending / addImagePromptColumn /
 *         importImagePrompts / importExamplesFromLesson02 /
 *         importImagePromptsFromDriveJson / clearImagePromptColumnValidation /
 *         loadJsonFromDriveById）を全面退役。
 *         archive/gas_old/generateImages_v5_3_phase4_retired.gs に保全。
 *         後継：scripts/generate-images-local.mjs（Imagen 4 ローカル呼び出し）+
 *               scripts/lib/imagen-client.mjs（AI Studio key 経由 client）+
 *               prompts/master_prompt_design_guide_v3_11_1.py（マスターガイド）。
 *         Sheet 操作 utility 群退役理由：Phase 2 で registry が SSOT 化されて以降
 *         Sheet 直接操作は anti-pattern。loadJsonFromDriveById は
 *         importExamplesFromLesson02 の唯一 consumer 退役で同時引退。
 *         人間タスク：GAS Triggers から generateImageBatch × 3 件
 *         （9 / 13 / 17 時）の削除が必要。
 *   v7.4: Phase 3 ⑥ — generateAudio セクション（AUDIO_SETTINGS / generateAudioBatch /
 *         testSingleAudio / retryAudio / setupAudioDailyTrigger / setupAudioTriggersX3 /
 *         processAudioEntry_ / updateAudioStatus_ / getPendingAudioRows_ /
 *         getAllAudioRows_ / callGoogleCloudTTS_ / buildCloudTtsWavBlob_ /
 *         saveAudioToDrive_ / writeAudioLog_ / resetToRegenerate / validateWavStructure_）
 *         を全面退役。archive/gas_old/generateAudio_v2_0_phase3_retired.gs に保全。
 *         後継：scripts/generate-audio-local.mjs（Cloud TTS ローカル呼び出し）+
 *               scripts/lib/audio-qc.mjs（ffmpeg two-pass loudnorm/silenceremove/afade）+
 *               scripts/validate-audio.mjs（invariants[D] = QC スペック検証）。
 *         人間タスク：GAS Triggers から generateAudioBatch（毎日 10:00）の削除が必要。
 *   v7.3: Phase 2 ⑥ — syncRegistries セクション（syncAll / syncImageRegistry /
 *         syncAudioRegistry / isProtected / buildColIndex / saveJsonToDriveById /
 *         setupSyncDailyTrigger / testProtectedKeys）を退役。
 *         loadJsonFromDriveById は importExamplesFromLesson02 が依存するため残置。
 *         旧セクション全体は archive/gas_old/syncRegistries_v_NA.gs に保全。
 *         後継: scripts/sync-registries-local.mjs（Sheets API でローカルから直接
 *         data/master_*_registry.json を書く）。
 *         人間タスク：GAS Triggers から syncAll（毎日 23:00）の削除が必要。
 *   v7.2: Phase 1 ④ — classifyAndTranslate.gs / exportVocabTypes.gs を
 *         ローカル版へ退役。コードは archive/gas_old/ に保全。
 *         後継: scripts/classify-and-translate.mjs（vocab_type 真実源を
 *         data/vocab_types_lessonNN.json に直接書く）。
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
// [REMOVED 2026-05-20 — Phase 1 ④] classifyAndTranslate.gs v1.1
//   退役済み。ローカル版 scripts/classify-and-translate.mjs が後継。
//   コードは archive/gas_old/classifyAndTranslate_v1_1.gs に保全。
//   退役した識別子（GAS スコープから消滅）:
//     CLASSIFY_SETTINGS / VALID_VOCAB_TYPES /
//     classifyBatch / previewClassify / reclassifyWords /
//     setupDailyTrigger / setupHourlyTrigger /
//     callGemmaAPI_ / buildPrompt_ / parseGemmaResponse_ /
//     getPendingRows_ / getAllVocabRows_ / logToSheet_
// ================================================================

// ================================================================
// generateImages.gs（退役済み）
// 2026-05-21: Phase 4 ⑥ で画像生成・トリガー・関連 Sheet 操作 utility 群を全面退役。後継：
//   scripts/generate-images-local.mjs  ローカル Imagen 4 + registry 連携 + バッチ
//   scripts/lib/imagen-client.mjs      Imagen 4 API クライアント（AI Studio key 経由）
//   scripts/check-imagen-key.mjs       AI Studio ListModels 疎通
//   scripts/_imagen-smoke.mjs          実機 1 件 PNG 生成 smoke
//   prompts/master_prompt_design_guide_v3_11_1.py
//                                      マスタープロンプトガイド本体
// 旧セクション全体（IMAGE_SETTINGS / STYLE_RECIPE / OBJECT_SIGNATURES /
// ABSTRACT_METAPHORS / BUILDING_CUES / PERSON_PROFILES / generateImageBatch /
// 主要 6 関数 + build*Prompt_ × 19 + callImagenAPI_ / saveImageToDrive_ /
// get*ImageRows_ / writeImageLog_）および Sheet 操作 utility 群
// （checkStyleRecipe / addAuxiliaryColumns / resetFailedToPending /
// resetFailedImagesToPending / addImagePromptColumn / importImagePrompts /
// importExamplesFromLesson02 / importImagePromptsFromDriveJson /
// clearImagePromptColumnValidation / loadJsonFromDriveById）は
// archive/gas_old/generateImages_v5_3_phase4_retired.gs 参照。
// Sheet 操作 utility 群の退役理由：Phase 2 で registry が SSOT 化されて以降、
// Sheet 直接操作は registry との drift を生む anti-pattern。Phase 4 で一掃。
// 人間タスク：GAS Triggers から generateImageBatch × 3 件（9 / 13 / 17 時）の削除が必要。
// ================================================================


// ================================================================
// generateAudio.gs（退役済み）
// 2026-05-20: Phase 3 ⑥ で生成・QC・トリガー含めて全面退役。後継：
//   scripts/generate-audio-local.mjs   ローカル Cloud TTS + registry 連携
//   scripts/lib/tts-client.mjs         Cloud TTS Neural2 クライアント
//   scripts/lib/audio-qc.mjs           ffmpeg two-pass loudnorm + silenceremove + afade
//   scripts/validate-audio.mjs         invariants[D] = QC スペック検証
// 旧セクション全体（AUDIO_SETTINGS / generateAudioBatch / processAudioEntry_ /
// callGoogleCloudTTS_ / saveAudioToDrive_ / resetToRegenerate /
// validateWavStructure_ ほか）は archive/gas_old/generateAudio_v2_0_phase3_retired.gs 参照。
// 人間タスク：GAS Triggers から generateAudioBatch（毎日 10:00）の削除が必要。
// ================================================================




// ================================================================
// [REMOVED 2026-05-20 — Phase 1 ④] exportVocabTypes.gs v1.0
//   退役済み。data/vocab_types_lessonNN.json は
//   scripts/classify-and-translate.mjs が直接書く。
//   コードは archive/gas_old/exportVocabTypes_v1_0.gs に保全。
//   退役した識別子: exportVocabTypesAll
// ================================================================



