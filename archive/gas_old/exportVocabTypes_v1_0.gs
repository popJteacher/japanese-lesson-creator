// ================================================================
// exportVocabTypes.gs  v1.0  (2026-05-19)
// Vocabulary シートの word/imageId/reading/en/vocab_type/lessonRef を
// 課ごとに Drive JSON へエクスポートする。
// build_prompts.py（scripts/build_prompts.py）が読む正典化されたソース。
// 既存 syncRegistries の Drive 書き込みパターンと同型。
// ================================================================
//
// [archived 2026-05-20 — Phase 1 ④] gas/pipeline.gs v7.2 から退役。
//   後継: scripts/classify-and-translate.mjs が data/vocab_types_lessonNN.json
//   を直接書く。Drive 経由のエクスポートは不要になった。
//   外部依存: SYNC_SETTINGS.SPREADSHEET_ID / buildColIndex(headers)
//             ← これらは退役前は gas/pipeline.gs 内で定義されていた。
//
// 前提:
//   ScriptProperties に "VOCAB_TYPES_FOLDER_ID" を設定する。
//   このフォルダ内に `vocab_types_lessonNN.json` を課ごとに上書き出力する。
//   既存ファイルが無ければ新規作成。
//
// 実行例（人間）:
//   exportVocabTypesAll()    全課を書き出し
//
// 出力 JSON スキーマ:
//   {
//     "_meta": {
//       "lessonNo": 1,
//       "generatedAt": "YYYY-MM-DD",
//       "generator": "gas/pipeline.gs#exportVocabTypesAll",
//       "source": "Vocabulary sheet (SPREADSHEET_ID)",
//       "rowCount": 17
//     },
//     "vocabulary": [
//       { "imageId": "word_医者", "word": "医者", "reading": "いしゃ",
//         "en": "doctor", "vocab_type": "person", "lessonRef": "lesson_01" },
//       ...
//     ]
//   }

function exportVocabTypesAll() {
  Logger.log("===== exportVocabTypesAll 開始 =====");
  const folderId = PropertiesService.getScriptProperties().getProperty("VOCAB_TYPES_FOLDER_ID");
  if (!folderId) {
    Logger.log("ABORT: ScriptProperty VOCAB_TYPES_FOLDER_ID が未設定。");
    Logger.log("  → Drive にフォルダを作成し、その ID を ScriptProperty に設定してください。");
    return;
  }

  const ss    = SpreadsheetApp.openById(SYNC_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  if (!sheet) { Logger.log("✗ Vocabulary シートが見つかりません"); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const COL     = buildColIndex(headers);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) { Logger.log("空 (header のみ)"); return; }

  // 必須列の存在チェック
  const required = ["word", "reading", "en", "vocab_type", "imageId", "lessonRef"];
  for (const k of required) {
    if (COL[k] === undefined) {
      Logger.log("✗ Vocabulary シートに列 '" + k + "' が見つかりません");
      return;
    }
  }

  const data    = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const byLesson = {};  // lessonNN(string, zero-padded) → array of entries

  let skipped = 0;
  for (const row of data) {
    const word      = String(row[COL.word]       || "").trim();
    const reading   = String(row[COL.reading]    || "").trim();
    const en        = String(row[COL.en]         || "").trim();
    const vocabType = String(row[COL.vocab_type] || "").trim();
    const imageId   = String(row[COL.imageId]    || "").trim();
    const lessonRef = String(row[COL.lessonRef]  || "").trim();

    if (!word || !imageId || !vocabType || !lessonRef) { skipped++; continue; }

    // lessonRef は "lesson_01" / "lesson_2" 等 → zero-padded 2 桁にする
    const m = /lesson[_-]?(\d{1,3})/i.exec(lessonRef);
    if (!m) { skipped++; continue; }
    const lessonNN = String(parseInt(m[1], 10)).padStart(2, "0");

    if (!byLesson[lessonNN]) byLesson[lessonNN] = [];
    byLesson[lessonNN].push({
      imageId:    imageId,
      word:       word,
      reading:    reading,
      en:         en,
      vocab_type: vocabType,
      lessonRef:  "lesson_" + lessonNN,
    });
  }

  const folder = DriveApp.getFolderById(folderId);
  const today  = new Date().toISOString().slice(0, 10);

  for (const lessonNN of Object.keys(byLesson).sort()) {
    const filename = "vocab_types_lesson" + lessonNN + ".json";
    const out = {
      _meta: {
        lessonNo:    parseInt(lessonNN, 10),
        generatedAt: today,
        generator:   "gas/pipeline.gs#exportVocabTypesAll",
        source:      "Vocabulary sheet (SPREADSHEET_ID=" + SYNC_SETTINGS.SPREADSHEET_ID + ")",
        rowCount:    byLesson[lessonNN].length,
      },
      vocabulary: byLesson[lessonNN],
    };
    const content = JSON.stringify(out, null, 2);

    // 既存ファイル検索
    const existing = folder.getFilesByName(filename);
    if (existing.hasNext()) {
      const f = existing.next();
      f.setContent(content);
      Logger.log("  ✓ 上書き: " + filename + " (" + byLesson[lessonNN].length + " 件・" + f.getId() + ")");
    } else {
      const f = folder.createFile(filename, content, "application/json");
      Logger.log("  ✓ 新規作成: " + filename + " (" + byLesson[lessonNN].length + " 件・" + f.getId() + ")");
    }
  }
  Logger.log("===== exportVocabTypesAll 完了（" + Object.keys(byLesson).length + " 課 / skipped " + skipped + " 行）=====");
}
