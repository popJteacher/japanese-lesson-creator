// ============================================================
// importFromLessonJson.gs  v1.0  (2026-05-15)
//
// 目的:
//   lesson_NN.json の vocabulary セクションを読み込み、
//   Vocabulary シートに未登録の語彙を差分追加する。
//
//   主なユースケース:
//   1. 国籍語彙（日本人・中国人・アメリカ人 等7語）の補完
//      → Goi_List に〜人形は独立収録なし、extractFromGoiList.gs では追加されない
//   2. Goi_List に未収録の語彙（借用語・固有名詞派生語 等）の追加
//   3. 将来の課（lesson_02 以降）の語彙を一括投入
//
// 使い方:
//   1. ScriptProperties に SPREADSHEET_ID を設定（他スクリプトと共通）
//   2. importLesson01() を実行（lesson_01.json を処理）
//   3. 他の課を処理する場合は importByFileId("FILE_ID") を使う
//   4. 実行前に previewImport("FILE_ID") でドライランを確認推奨
//
// 書き込み列（setupSpreadsheet.gs 準拠）:
//   A: word  B: reading  C: en  D: jlptLevel  E: pos  F: vocab_type
//   G: imageId  H: imageStatus  I: imageUrl
//   J: audioId  K: audioStatus  L: audioUrl
//   M: lessonRef  N: source
// ============================================================

// ============================================================
// 設定
// ============================================================
const IMPORT_SETTINGS = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties()
                    .getProperty("SPREADSHEET_ID") || "YOUR_SPREADSHEET_ID_HERE",

  VOCAB_SHEET_NAME: "Vocabulary",
  LOG_SHEET_NAME:   "Log",
};

// lesson_NN.json の Drive ファイル ID（よく使うものを定義しておく）
// Google Drive でファイルを右クリック → 「リンクをコピー」→ URL中の /d/{ここ}/view
const LESSON_FILE_IDS = {
  lesson_01: "YOUR_LESSON_01_JSON_FILE_ID_HERE",
  // lesson_02: "YOUR_LESSON_02_JSON_FILE_ID_HERE",
  // lesson_03: "YOUR_LESSON_03_JSON_FILE_ID_HERE",
};

// 建物タイプとして認識する語彙リスト（vocab_type: "building" に自動マッピング）
const BUILDING_WORDS = new Set([
  "病院", "学校", "大学", "銀行", "デパート", "スーパー",
  "レストラン", "ホテル", "図書館", "駅", "会社", "工場",
  "郵便局", "警察署", "消防署", "市役所", "空港",
]);


// ============================================================
// 【便利関数】lesson_01 を処理する（通常はこれを実行）
// ============================================================
function importLesson01() {
  const fileId = LESSON_FILE_IDS.lesson_01;
  if (fileId === "YOUR_LESSON_01_JSON_FILE_ID_HERE") {
    Logger.log("ERROR: LESSON_FILE_IDS.lesson_01 を設定してください");
    return;
  }
  importByFileId(fileId, "lesson_01");
}


// ============================================================
// 【メイン】任意の lesson_NN.json を処理する
// ============================================================
function importByFileId(lessonFileId, lessonName) {
  if (!lessonFileId) {
    Logger.log("ERROR: lessonFileId を指定してください");
    return;
  }
  lessonName = lessonName || "lesson_unknown";

  Logger.log("===== importFromLessonJson 開始: " + lessonName + " =====");

  // 1. lesson_NN.json を Drive から読み込む
  const lessonJson = loadJsonFromDrive_(lessonFileId);
  if (!lessonJson) {
    Logger.log("ERROR: JSON の読み込みに失敗しました（fileId: " + lessonFileId + "）");
    return;
  }

  // 2. vocabulary セクションから全語彙を抽出
  const allWords = extractWordsFromLesson_(lessonJson, lessonName);
  Logger.log("lesson JSON から抽出: " + allWords.length + " 語");

  if (allWords.length === 0) {
    Logger.log("INFO: vocabulary セクションが空か、読み取れませんでした");
    return;
  }

  // 3. Vocabulary シートの既存 word を取得
  const ss    = SpreadsheetApp.openById(IMPORT_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(IMPORT_SETTINGS.VOCAB_SHEET_NAME);

  if (!sheet) {
    Logger.log("ERROR: Vocabulary シートが見つかりません。setupAll() を先に実行してください");
    return;
  }

  const existingWords = getExistingWords_(sheet);
  Logger.log("シート既存語数: " + existingWords.size);

  // 4. 差分抽出（未登録語のみ）
  const newWords = allWords.filter(function(w) { return !existingWords.has(w.word); });
  Logger.log("新規追加対象: " + newWords.length + " 語 / スキップ（既存）: " + (allWords.length - newWords.length) + " 語");

  if (newWords.length === 0) {
    Logger.log("INFO: 追加する新規語彙はありません（全語が既にシートに存在）");
    return;
  }

  // スキップされた語彙をログに表示
  const skipped = allWords.filter(function(w) { return existingWords.has(w.word); });
  if (skipped.length > 0) {
    Logger.log("スキップした語彙: " + skipped.map(function(w) { return w.word; }).join(", "));
  }

  // 5. シートに一括書き込み
  const writtenCount = appendVocabRows_(sheet, newWords);
  Logger.log("書き込み完了: " + writtenCount + " 語");

  // 6. Log シートに記録
  writeImportLog_(ss, lessonName, writtenCount, newWords.map(function(w) { return w.word; }).join(", "));

  Logger.log("===== 完了 =====");
  Logger.log("追加語彙: " + newWords.map(function(w) { return w.word; }).join("、"));
  Logger.log("次のステップ: classifyAndTranslate.gs で vocab_type が空の行を処理してください");
}


// ============================================================
// 【ドライラン】previewImport() — 書き込みなしで差分を確認
// ============================================================
function previewImport(lessonFileId, lessonName) {
  if (!lessonFileId) {
    Logger.log("ERROR: lessonFileId を指定してください");
    Logger.log("例: previewImport(LESSON_FILE_IDS.lesson_01, 'lesson_01')");
    return;
  }
  lessonName = lessonName || "lesson_unknown";

  Logger.log("===== previewImport: " + lessonName + " (ドライラン) =====");

  const lessonJson = loadJsonFromDrive_(lessonFileId);
  if (!lessonJson) { Logger.log("ERROR: JSON 読み込み失敗"); return; }

  const allWords = extractWordsFromLesson_(lessonJson, lessonName);
  Logger.log("lesson JSON から抽出: " + allWords.length + " 語");

  const ss    = SpreadsheetApp.openById(IMPORT_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(IMPORT_SETTINGS.VOCAB_SHEET_NAME);
  if (!sheet) { Logger.log("ERROR: Vocabulary シートが見つかりません"); return; }

  const existingWords = getExistingWords_(sheet);

  Logger.log("─────────────────────────────");
  Logger.log("【新規追加される語彙】");
  var newCount = 0;
  allWords.forEach(function(w) {
    if (!existingWords.has(w.word)) {
      Logger.log("  ✚ " + w.word + " (" + w.reading + ") / " + w.en
                 + " / vocab_type: " + (w.vocab_type || "（空→classifyAndTranslateで付与）"));
      newCount++;
    }
  });
  if (newCount === 0) Logger.log("  なし（全語が既に登録済み）");

  Logger.log("【スキップされる語彙（既存）】");
  var skipCount = 0;
  allWords.forEach(function(w) {
    if (existingWords.has(w.word)) {
      Logger.log("  ─ " + w.word + " (既存)");
      skipCount++;
    }
  });
  if (skipCount === 0) Logger.log("  なし");

  Logger.log("─────────────────────────────");
  Logger.log("合計: " + newCount + " 語追加 / " + skipCount + " 語スキップ");
  Logger.log("（ドライランのため書き込みは行っていません）");
}

// 便利関数: lesson_01 のプレビュー
function previewImportLesson01() {
  previewImport(LESSON_FILE_IDS.lesson_01, "lesson_01");
}


// ============================================================
// lesson_NN.json の vocabulary セクションから語彙配列を抽出（内部関数）
//
// lesson_01.json の vocabulary 構造:
//   vocabulary.byPattern.{group}.words[] に語彙が格納されている
//
// 戻り値: Array<{
//   word, reading, en, jlptLevel, pos, vocab_type, lessonRef, source
// }>
// ============================================================
function extractWordsFromLesson_(lessonJson, lessonName) {
  const words = [];
  const seen  = new Set(); // 同一 lesson 内の重複排除

  // lessonName を "lesson_01" → "lesson_01" のまま使う
  // lessonNo を数値で取得（"lesson_01" → 1）
  const lessonNo = parseInt((lessonName || "lesson_01").replace(/[^0-9]/g, ""), 10) || 1;

  // vocabulary.byPattern の各グループを走査
  const byPattern = lessonJson &&
                    lessonJson.vocabulary &&
                    lessonJson.vocabulary.byPattern;

  if (!byPattern) {
    Logger.log("WARN: vocabulary.byPattern が見つかりません");
    return words;
  }

  Object.keys(byPattern).forEach(function(groupKey) {
    const group = byPattern[groupKey];
    if (!group || !group.words || !Array.isArray(group.words)) return;

    group.words.forEach(function(w) {
      const word = String(w.word || "").trim();
      if (!word || seen.has(word)) return;
      seen.add(word);

      // vocab_type の推定
      // lesson JSON の imageRole から SS の vocab_type にマッピングする
      const imageRole = String(w.imageRole || "").trim();
      var vocabType = inferVocabType_(word, imageRole);

      // en が空の場合は classifyAndTranslate.gs に任せる（空欄のまま）
      var en = String(w.en || "").trim();

      // jlptLevel の正規化（"N5" 形式に統一）
      var jlpt = String(w.jlptLevel || "N5").trim().toUpperCase();
      if (!jlpt.startsWith("N")) jlpt = "N5"; // フォールバック

      // 品詞: lesson_01 の語彙は全て名詞
      var pos = "名詞";

      words.push({
        word:      word,
        reading:   String(w.reading || "").trim(),
        en:        en,
        jlptLevel: jlpt,
        pos:       pos,
        vocab_type: vocabType,
        lessonRef:  "lesson_" + String(lessonNo).padStart(2, "0"),
        source:    "lesson_import",
      });
    });
  });

  return words;
}


// ============================================================
// imageRole と語彙から vocab_type を推定する（内部関数）
// ============================================================
function inferVocabType_(word, imageRole) {
  // 建物リストに含まれる場合は building（imageRole に関わらず）
  if (BUILDING_WORDS.has(word)) return "building";

  // imageRole から推定
  switch (imageRole) {
    case "vocab_person":
      return "person";
    case "vocab_object":
      return "concrete_object";
    case "vocab_action":
      return "action_verb";
    case "vocab_adjective":
      return "adjective";
    default:
      // 不明な場合は空欄にして classifyAndTranslate.gs に任せる
      return "";
  }
}


// ============================================================
// Vocabulary シートに語彙行をバッチ書き込み（内部関数）
// 戻り値: 書き込んだ行数
// ============================================================
function appendVocabRows_(sheet, entries) {
  if (!entries || entries.length === 0) return 0;

  const rows = entries.map(function(e) {
    const wordKey = "word_" + e.word;
    return [
      e.word,        // A: word
      e.reading,     // B: reading
      e.en,          // C: en（空の場合 classifyAndTranslate.gs が付与）
      e.jlptLevel,   // D: jlptLevel
      e.pos,         // E: pos
      e.vocab_type,  // F: vocab_type（空の場合 classifyAndTranslate.gs が付与）
      wordKey,       // G: imageId
      "pending",     // H: imageStatus
      "",            // I: imageUrl
      wordKey,       // J: audioId
      "pending",     // K: audioStatus
      "",            // L: audioUrl
      e.lessonRef,   // M: lessonRef
      e.source,      // N: source
    ];
  });

  // setValues で一括書き込み（appendRow × N より高速）
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 14).setValues(rows);

  return rows.length;
}


// ============================================================
// Vocabulary シートの既存 word を Set<string> で返す（内部関数）
// extractFromGoiList.gs と同じロジック（完全一致・全角/半角区別）
// ============================================================
function getExistingWords_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();

  const values  = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const wordSet = new Set();
  values.forEach(function(row) {
    const w = String(row[0]).trim();
    if (w) wordSet.add(w);
  });
  return wordSet;
}


// ============================================================
// Drive から JSON ファイルを読み込む（内部関数）
// ============================================================
function loadJsonFromDrive_(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return JSON.parse(file.getBlob().getDataAsString("utf-8"));
  } catch (e) {
    Logger.log("ERROR: JSON 読み込みエラー (fileId: " + fileId + "): " + e.message);
    return null;
  }
}


// ============================================================
// Log シートに記録（内部関数）
// ============================================================
function writeImportLog_(ss, lessonName, count, wordList) {
  try {
    const logSheet = ss.getSheetByName(IMPORT_SETTINGS.LOG_SHEET_NAME);
    if (!logSheet) return;
    logSheet.appendRow([
      new Date(),
      "import",
      lessonName,
      "success",
      count + "語追加",
      wordList,
    ]);
  } catch (e) {
    Logger.log("WARN: ログ書き込み失敗: " + e.message);
  }
}
