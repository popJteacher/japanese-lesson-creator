/**
 * setupSpreadsheet.gs
 * ============================================================
 * Vocabulary / Examples / Log の3シートを作成し、
 * ヘッダー行・書式・列幅を初期化する。
 *
 * 使い方：
 *   1. SPREADSHEET_ID を自分のスプレッドシートIDに変更する
 *   2. setupAll() を実行する（1回のみ）
 *
 * 再実行しても安全：既存シートがある場合は書式のみ再適用し、
 * データ行は一切変更しない。
 * ============================================================
 */

// ▼▼▼ ここを自分のスプレッドシートIDに変更してください ▼▼▼
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ============================================================
// メイン関数：全シートをセットアップ
// ============================================================
function setupAll() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  console.log("▶ Vocabulary シート セットアップ開始...");
  setupVocabularySheet(ss);

  console.log("▶ Examples シート セットアップ開始...");
  setupExamplesSheet(ss);

  console.log("▶ Log シート セットアップ開始...");
  setupLogSheet(ss);

  console.log("✅ セットアップ完了");
}

// ============================================================
// Vocabulary シート
// ============================================================
function setupVocabularySheet(ss) {
  const SHEET_NAME = "Vocabulary";
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    console.log(`  → シート「${SHEET_NAME}」を新規作成しました`);
  } else {
    console.log(`  → シート「${SHEET_NAME}」は既存。ヘッダー行のみ再適用します`);
    // 既存データを保護するため、ヘッダー行だけクリアして書き直す
    sheet.getRange(1, 1, 1, 14).clearContent();
  }

  // ヘッダー定義
  const headers = [
    "word",       // A: 漢字表記
    "reading",    // B: ひらがな
    "en",         // C: 英語訳（Gemma自動生成）
    "jlptLevel",  // D: N5〜N1
    "pos",        // E: 品詞（名詞・動詞 等）
    "vocab_type", // F: person/building/concrete_object 等
    "imageId",    // G: master_image_registry キー
    "imageStatus",// H: pending/generated/approved/failed
    "imageUrl",   // I: GAS自動入力
    "audioId",    // J: master_audio_registry キー
    "audioStatus",// K: pending/generated/approved/failed
    "audioUrl",   // L: GAS自動入力
    "lessonRef",  // M: どの課で使われるか（任意）
    "source",     // N: goi_list / lesson_import / manual
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダー書式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#EAF4FF");   // 画像系は青系
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  // 列幅の設定
  sheet.setColumnWidth(1,  100); // A: word
  sheet.setColumnWidth(2,  120); // B: reading
  sheet.setColumnWidth(3,  150); // C: en
  sheet.setColumnWidth(4,   70); // D: jlptLevel
  sheet.setColumnWidth(5,   80); // E: pos
  sheet.setColumnWidth(6,  120); // F: vocab_type
  sheet.setColumnWidth(7,  150); // G: imageId
  sheet.setColumnWidth(8,  100); // H: imageStatus
  sheet.setColumnWidth(9,  300); // I: imageUrl
  sheet.setColumnWidth(10, 160); // J: audioId
  sheet.setColumnWidth(11, 100); // K: audioStatus
  sheet.setColumnWidth(12, 300); // L: audioUrl
  sheet.setColumnWidth(13, 100); // M: lessonRef
  sheet.setColumnWidth(14,  90); // N: source

  // imageStatus / audioStatus 列にドロップダウン検証を設定（H・K列）
  const statusValues = ["pending", "generated", "approved", "failed"];
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues, true)
    .setAllowInvalid(false)
    .build();
  // H列（imageStatus）: 2行目以降
  sheet.getRange(2, 8, 999, 1).setDataValidation(statusRule);
  // K列（audioStatus）: 2行目以降
  sheet.getRange(2, 11, 999, 1).setDataValidation(statusRule);

  // jlptLevel 列にドロップダウン検証（D列）
  const jlptRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["N5", "N4", "N3", "N2", "N1"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 4, 999, 1).setDataValidation(jlptRule);

  // source 列にドロップダウン検証（N列）
  const sourceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["goi_list", "lesson_import", "manual"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 14, 999, 1).setDataValidation(sourceRule);

  console.log(`  ✅ Vocabulary シート セットアップ完了（14列）`);
}

// ============================================================
// Examples シート
// ============================================================
function setupExamplesSheet(ss) {
  const SHEET_NAME = "Examples";
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    console.log(`  → シート「${SHEET_NAME}」を新規作成しました`);
  } else {
    console.log(`  → シート「${SHEET_NAME}」は既存。ヘッダー行のみ再適用します`);
    sheet.getRange(1, 1, 1, 9).clearContent();
  }

  // ヘッダー定義
  const headers = [
    "id",           // A: audio registry キー
    "lessonNo",     // B: 課番号
    "patternId",    // C: p1/p2/p3 等
    "sentence",     // D: 教科書原文
    "sentenceEn",   // E: 英語訳
    "textToSpeak",  // F: TTS送信テキスト（「／」「→」変換済み）
    "audioStatus",  // G: pending/generated/approved/failed
    "audioUrl",     // H: GAS自動入力
    "isAnchor",     // I: TRUE/FALSE（アンカー例文フラグ）
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダー書式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#E8F5E9");   // 音声系は緑系
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  // 列幅の設定
  sheet.setColumnWidth(1,  200); // A: id
  sheet.setColumnWidth(2,   70); // B: lessonNo
  sheet.setColumnWidth(3,   80); // C: patternId
  sheet.setColumnWidth(4,  300); // D: sentence
  sheet.setColumnWidth(5,  300); // E: sentenceEn
  sheet.setColumnWidth(6,  300); // F: textToSpeak
  sheet.setColumnWidth(7,  100); // G: audioStatus
  sheet.setColumnWidth(8,  300); // H: audioUrl
  sheet.setColumnWidth(9,   80); // I: isAnchor

  // G列（audioStatus）にドロップダウン
  const statusValues = ["pending", "generated", "approved", "failed"];
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 7, 999, 1).setDataValidation(statusRule);

  // I列（isAnchor）にチェックボックス
  sheet.getRange(2, 9, 999, 1).insertCheckboxes();

  console.log(`  ✅ Examples シート セットアップ完了（9列）`);
}

// ============================================================
// Log シート
// ============================================================
function setupLogSheet(ss) {
  const SHEET_NAME = "Log";
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    console.log(`  → シート「${SHEET_NAME}」を新規作成しました`);
  } else {
    console.log(`  → シート「${SHEET_NAME}」は既存。ヘッダー行のみ再適用します`);
    sheet.getRange(1, 1, 1, 6).clearContent();
  }

  // ヘッダー定義
  const headers = [
    "date",    // A: 実行日時
    "type",    // B: image / audio / classify
    "id",      // C: word_医者 等
    "status",  // D: ✅ 成功 / ❌ エラー
    "url",     // E: Drive URL
    "error",   // F: エラー詳細（失敗時）
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダー書式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#FFF3E0");   // ログはオレンジ系
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  // 列幅の設定
  sheet.setColumnWidth(1, 180); // A: date
  sheet.setColumnWidth(2,  90); // B: type
  sheet.setColumnWidth(3, 160); // C: id
  sheet.setColumnWidth(4,  90); // D: status
  sheet.setColumnWidth(5, 300); // E: url
  sheet.setColumnWidth(6, 400); // F: error

  console.log(`  ✅ Log シート セットアップ完了（6列）`);
}

// ============================================================
// ユーティリティ：ログ書き込み（他のGASスクリプトから呼び出す共通関数）
// ============================================================
function writeLog(type, id, status, url, error) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Log");
  if (!sheet) {
    console.warn("⚠ Log シートが見つかりません。setupAll() を先に実行してください。");
    return;
  }
  sheet.appendRow([
    new Date(),
    type   || "",
    id     || "",
    status || "",
    url    || "",
    error  || "",
  ]);
}
