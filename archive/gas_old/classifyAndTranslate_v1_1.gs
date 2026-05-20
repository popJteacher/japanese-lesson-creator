// ============================================================
// classifyAndTranslate.gs  v1.1  (2026-05-18)
//
// [archived 2026-05-20 — Phase 1 ④] gas/pipeline.gs v7.2 から退役。
//   後継: scripts/classify-and-translate.mjs（ローカル Gemini 呼び出し版）。
//   GAS 版は仕様の一次資料として保全（contracts: 入出力・モデル・generationConfig）。
//
// 目的:
//   Vocabulary シートの en（C列）と vocab_type（F列）が空の行に対して
//   Gemma 4 API を使って英語訳と語彙タイプを自動付与する。
//
// v1.0 → v1.1 変更点:
//   VALID_VOCAB_TYPES を v2.6 準拠に更新。
//   K〜T（pronoun/interjection/set_expression/adverb/counter/
//          time/transportation/family/weather/sensory）を追加。
//   Gemma 4 へのシステムプロンプトも v2.6 の20種を反映。
//
// 使い方:
//   1. ScriptProperties に GEMINI_API_KEY を設定する
//   2. ScriptProperties に SPREADSHEET_ID を設定する（または下記定数に直接入力）
//   3. classifyBatch() を実行する（1回 = 最大 BATCH_SIZE 語を処理）
//   4. タイマートリガーで毎日自動実行する場合は setupDailyTrigger() を使う
//
// 列構成（setupSpreadsheet.gs に準拠）:
//   A: word  B: reading  C: en  D: jlptLevel  E: pos  F: vocab_type
//   G: imageId  H: imageStatus  I: imageUrl
//   J: audioId  K: audioStatus  L: audioUrl
//   M: lessonRef  N: source
// ============================================================

// ============================================================
// 設定
// ============================================================
const CLASSIFY_SETTINGS = {
  // ScriptProperties から取得する（直接書き込み厳禁）
  SPREADSHEET_ID: PropertiesService.getScriptProperties()
                    .getProperty("SPREADSHEET_ID") || "YOUR_SPREADSHEET_ID_HERE",

  VOCAB_SHEET_NAME: "Vocabulary",
  LOG_SHEET_NAME:   "Log",

  // Gemma 4 モデル（26B が安定・推奨）
  MODEL: "gemma-4-26b-it",   // 代替: "gemma-4-31b-it"

  // 1実行あたりの処理語数上限
  // Gemma 4 26B: 1,500 RPD → 50語/回 × 30回/日 = 1,500（丁度上限）
  // 安全マージンを取り1回50語に制限
  BATCH_SIZE: 50,

  // APIコール間のスリープ（ms）
  // 過剰リクエストを避けるため各コールに設ける
  SLEEP_MS: 500,
};

// vocab_type の許容値（master_prompt_design_guide_v2_6_complete.py 準拠）
// v1.0（A〜J対応）→ v1.1（A〜T対応）
// テンプレートK〜T（pronoun/interjection/set_expression/adverb/counter/
//                   time/transportation/family/weather/sensory）を追加
const VALID_VOCAB_TYPES = [
  // ── v2.5 からの既存型（テンプレートA〜J）──
  "person",           // A: 人物
  "building",         // B: 建物
  "concrete_object",  // D: 具体物
  "action_verb",      // H: 動作語彙
  "adjective",        // J: 形容詞
  "abstract_concept", // I: 抽象概念
  "spatial_relation", // F: 空間関係
  "demonstrative",    // G: 指示語
  // ── v2.6 新規追加型（テンプレートK〜T）──
  "pronoun",          // K: 代名詞（わたし・あなた・だれ等）
  "interjection",     // L: 感動詞（はい・いいえ・あ等）
  "set_expression",   // M: 定型表現（いただきます・よろしく等）
  "adverb",           // N: 副詞（とても・いつも・ゆっくり等）
  "counter",          // O: 助数詞（〜本・〜枚・〜匹等）
  "time",             // P: 時間語彙（〜時・〜曜日・季節等）
  "transportation",   // Q: 交通手段（でんしゃ・しんかんせん等）
  "family",           // R: 家族語彙（父・お父さん等）
  "weather",          // S: 天気・自然現象（雨・暑い等）
  "sensory",          // T: 感覚語彙（見ます・見えます等）
  // ── フォールバック ──
  "other",
];

// ============================================================
// メイン関数：1バッチ分（最大 BATCH_SIZE 語）を処理する
// タイマートリガーはこの関数に設定する
// ============================================================
function classifyBatch() {
  const ss    = SpreadsheetApp.openById(CLASSIFY_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CLASSIFY_SETTINGS.VOCAB_SHEET_NAME);

  if (!sheet) {
    Logger.log("ERROR: シート '" + CLASSIFY_SETTINGS.VOCAB_SHEET_NAME + "' が見つかりません");
    return;
  }

  // en・vocab_type が両方空の行を取得
  const pendingRows = getPendingRows_(sheet);

  if (pendingRows.length === 0) {
    Logger.log("INFO: 未処理の行はありません。処理をスキップします。");
    return;
  }

  // バッチサイズに制限
  const batch = pendingRows.slice(0, CLASSIFY_SETTINGS.BATCH_SIZE);
  Logger.log("INFO: " + pendingRows.length + " 件が未処理 → 今回 " + batch.length + " 件を処理します");

  let successCount = 0;
  let failCount    = 0;

  batch.forEach(function(row, i) {
    try {
      Logger.log("  [" + (i + 1) + "/" + batch.length + "] " + row.word + " を処理中...");

      const result = callGemmaAPI_(row.word, row.reading, row.pos);

      // 結果をシートに書き込む
      sheet.getRange(row.rowIndex, 3).setValue(result.en);          // C: en
      sheet.getRange(row.rowIndex, 6).setValue(result.vocab_type);  // F: vocab_type

      logToSheet_(ss, "classify", row.word, "success",
                  result.en + " / " + result.vocab_type);
      successCount++;

    } catch (e) {
      Logger.log("  ERROR: " + row.word + " → " + e.message);
      logToSheet_(ss, "classify", row.word, "failed", e.message);
      failCount++;
    }

    // API間スリープ
    if (i < batch.length - 1) {
      Utilities.sleep(CLASSIFY_SETTINGS.SLEEP_MS);
    }
  });

  Logger.log("=== 完了 ===");
  Logger.log("  成功: " + successCount + " 件");
  Logger.log("  失敗: " + failCount   + " 件");
  Logger.log("  残り: " + (pendingRows.length - batch.length) + " 件（次回実行で処理）");
}

// ============================================================
// ドライラン：実際の書き込みは行わずログのみ表示する（テスト用）
// ============================================================
function previewClassify() {
  const ss    = SpreadsheetApp.openById(CLASSIFY_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CLASSIFY_SETTINGS.VOCAB_SHEET_NAME);

  if (!sheet) {
    Logger.log("ERROR: シートが見つかりません");
    return;
  }

  const pendingRows = getPendingRows_(sheet);
  Logger.log("未処理件数: " + pendingRows.length);

  // 最初の5件だけ実際にAPIを呼んで出力確認（書き込みはしない）
  const preview = pendingRows.slice(0, 5);
  preview.forEach(function(row, i) {
    try {
      const result = callGemmaAPI_(row.word, row.reading, row.pos);
      Logger.log("[" + (i + 1) + "] " + row.word +
                 " → en: " + result.en +
                 " / vocab_type: " + result.vocab_type);
    } catch (e) {
      Logger.log("[" + (i + 1) + "] " + row.word + " → ERROR: " + e.message);
    }
    Utilities.sleep(CLASSIFY_SETTINGS.SLEEP_MS);
  });
}

// ============================================================
// 特定の word のみ再処理する（修正・再試行用）
// 使い方: reclassifyWords(["医者", "病院"])
// ============================================================
function reclassifyWords(targetWords) {
  if (!targetWords || targetWords.length === 0) {
    Logger.log("ERROR: targetWords が空です。例: reclassifyWords(['医者', '病院'])");
    return;
  }

  const ss    = SpreadsheetApp.openById(CLASSIFY_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CLASSIFY_SETTINGS.VOCAB_SHEET_NAME);

  if (!sheet) {
    Logger.log("ERROR: シートが見つかりません");
    return;
  }

  const targetSet = new Set(targetWords);
  const allRows   = getAllVocabRows_(sheet);
  const targets   = allRows.filter(function(r) { return targetSet.has(r.word); });

  if (targets.length === 0) {
    Logger.log("INFO: 対象語が見つかりませんでした");
    return;
  }

  Logger.log("INFO: " + targets.length + " 件を再処理します");

  targets.forEach(function(row) {
    try {
      const result = callGemmaAPI_(row.word, row.reading, row.pos);
      sheet.getRange(row.rowIndex, 3).setValue(result.en);
      sheet.getRange(row.rowIndex, 6).setValue(result.vocab_type);
      Logger.log("  ✓ " + row.word + " → " + result.en + " / " + result.vocab_type);
      logToSheet_(ss, "reclassify", row.word, "success",
                  result.en + " / " + result.vocab_type);
    } catch (e) {
      Logger.log("  ERROR: " + row.word + " → " + e.message);
      logToSheet_(ss, "reclassify", row.word, "failed", e.message);
    }
    Utilities.sleep(CLASSIFY_SETTINGS.SLEEP_MS);
  });
}

// ============================================================
// タイマートリガーを設定する（1日1回 classifyBatch を実行）
// 初回のみ手動で実行する
// ============================================================
function setupDailyTrigger() {
  // 既存のトリガーを削除してから再登録する（重複防止）
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "classifyBatch") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("classifyBatch")
    .timeBased()
    .everyDays(1)
    .atHour(8)   // 毎日8:00に実行（JST）
    .create();

  Logger.log("INFO: classifyBatch の日次トリガーを設定しました（毎日 8:00）");
}

// ============================================================
// Gemma 4 API を呼び出してJSONを返す（内部関数）
//
// 戻り値: { en: string, vocab_type: string }
// ============================================================
function callGemmaAPI_(word, reading, pos) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が ScriptProperties に設定されていません");
  }

  const url = "https://generativelanguage.googleapis.com/v1beta/models/"
              + CLASSIFY_SETTINGS.MODEL
              + ":generateContent?key=" + apiKey;

  const prompt = buildPrompt_(word, reading, pos);

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature:     0.1,    // 低温で安定した出力
      maxOutputTokens: 100,    // JSONのみなので短くて十分
      topP:            0.9,
    }
  };

  const options = {
    method:      "post",
    contentType: "application/json",
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    throw new Error("API エラー: HTTP " + statusCode + " / " + response.getContentText());
  }

  const responseJson = JSON.parse(response.getContentText());
  return parseGemmaResponse_(responseJson, word);
}

// ============================================================
// Gemma 4 へのプロンプトを組み立てる（内部関数）
// ============================================================
function buildPrompt_(word, reading, pos) {
  const vocabTypeList = VALID_VOCAB_TYPES.join(", ");

  return [
    "You are a Japanese vocabulary classifier for JLPT learners.",
    "Given a Japanese word, return ONLY a JSON object with these two keys:",
    '- "en": English translation (short, 1-4 words, lowercase)',
    '- "vocab_type": one of [' + vocabTypeList + ']',
    "",
    "Vocab type guide (v2.6 — 20 types):",
    "── Core types (A-J) ──",
    "  person          ← words for people (医者, 学生, 先生, 会社員, etc.)",
    "  building        ← buildings / facilities (病院, 学校, 銀行, 大学, etc.)",
    "  concrete_object ← tangible everyday items (本, ペン, 財布, 電話, etc.)",
    "  action_verb     ← verbs / actions (食べる, 読む, 飲む, 行く, 見る, etc.)",
    "  adjective       ← i-adj / na-adj (大きい, 新しい, 便利, 静か, etc.)",
    "  abstract_concept← abstract nouns (時間, 気持ち, 意見, etc.)",
    "  spatial_relation← location words (上, 下, 右, 左, そば, 隣, etc.)",
    "  demonstrative   ← ko-so-a-do words (これ, それ, あれ, どれ, etc.)",
    "── New types (K-T) ──",
    "  pronoun         ← personal/interrogative pronouns (わたし, あなた, かれ, かのじょ, みんな, だれ, なに, どこ, いつ)",
    "  interjection    ← response/filler words (はい, いいえ, あ, ああ, おー, すごい, なるほど, そうですか, すみません)",
    "  set_expression  ← fixed social phrases (おはようございます, いただきます, ごちそうさまでした, よろしくおねがいします, おつかれさまです, おじゃまします)",
    "  adverb          ← adverbs of degree/frequency/manner/time (とても, すこし, いつも, ときどき, よく, ゆっくり, はやく, もう, まだ, ぜんぜん, あまり)",
    "  counter         ← counter suffixes (〜本, 〜枚, 〜冊, 〜匹, 〜頭, 〜台, 〜個, 〜杯)",
    "  time            ← time words (〜時, 〜分, 〜曜日, 〜月, 春夏秋冬, 今日, 明日, 昨日, 来週, 先週, 朝, 昼, 夜, 午前, 午後, 毎日, ごろ)",
    "  transportation  ← vehicles / transport (電車, 新幹線, 地下鉄, バス, タクシー, 自転車, 飛行機, 船, 自動車)",
    "  family          ← family terms (父, 母, 兄, 弟, 姉, 妹, お父さん, お母さん, お兄さん, お姉さん, おじいさん, おばあさん)",
    "  weather         ← weather / natural phenomena (雨, 雪, 風, 台風, 晴れ, 曇り, 暑い, 寒い)",
    "  sensory         ← perception verbs (見ます, 見えます, 聞きます, 聞こえます, 〜音がします, 〜においがします, 〜味がします)",
    "── Fallback ──",
    "  other           ← anything that doesn't fit the above 19 types",
    "",
    "Word:    " + word,
    "Reading: " + reading,
    "POS:     " + pos,
    "",
    "Return ONLY valid JSON. No explanation. No markdown. No backticks.",
    'Example: {"en": "doctor", "vocab_type": "person"}',
    'Example: {"en": "slowly", "vocab_type": "adverb"}',
    'Example: {"en": "I / me", "vocab_type": "pronoun"}',
  ].join("\n");
}

// ============================================================
// Gemma 4 のレスポンスをパースして { en, vocab_type } を返す
// JSON以外のテキストが混入しても対応できるよう堅牢に処理する
// ============================================================
function parseGemmaResponse_(responseJson, word) {
  // レスポンス構造: candidates[0].content.parts[0].text
  let rawText = "";
  try {
    rawText = responseJson.candidates[0].content.parts[0].text.trim();
  } catch (e) {
    throw new Error("レスポンス構造が不正: " + JSON.stringify(responseJson).substring(0, 200));
  }

  // マークダウンコードフェンスを除去（```json ... ``` が混入した場合）
  rawText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/,      "")
    .replace(/\s*```$/,      "")
    .trim();

  // JSON部分を抽出（前後にゴミテキストがある場合）
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("JSONが見つかりません。rawText: " + rawText.substring(0, 200));
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("JSONパース失敗: " + jsonMatch[0].substring(0, 200));
  }

  // 必須フィールドの検証
  if (!parsed.en || typeof parsed.en !== "string") {
    throw new Error("'en' フィールドが不正: " + JSON.stringify(parsed));
  }
  if (!parsed.vocab_type || typeof parsed.vocab_type !== "string") {
    throw new Error("'vocab_type' フィールドが不正: " + JSON.stringify(parsed));
  }

  // vocab_type が許容値かチェック（不正値は "other" にフォールバック）
  const vt = parsed.vocab_type.trim().toLowerCase();
  if (!VALID_VOCAB_TYPES.includes(vt)) {
    Logger.log("  WARN: '" + word + "' の vocab_type '" + vt
               + "' が未知の値です。'other' に変換します。");
    parsed.vocab_type = "other";
  } else {
    parsed.vocab_type = vt;
  }

  // en を小文字・トリムに正規化
  parsed.en = parsed.en.trim().toLowerCase();

  return {
    en:         parsed.en,
    vocab_type: parsed.vocab_type,
  };
}

// ============================================================
// Vocabulary シートから en・vocab_type が両方空の行を返す（内部関数）
//
// 戻り値: Array<{ rowIndex, word, reading, pos }>
// ============================================================
function getPendingRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // A:N 列を一括取得（setValues/getValues のコスト削減）
  const data = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
  const pending = [];

  data.forEach(function(row, i) {
    const word     = String(row[0]).trim();  // A
    const reading  = String(row[1]).trim();  // B
    const en       = String(row[2]).trim();  // C
    const pos      = String(row[4]).trim();  // E
    const vocabType = String(row[5]).trim(); // F

    // word が空ならスキップ
    if (!word) return;

    // en と vocab_type が両方空の場合のみ対象
    if (en === "" && vocabType === "") {
      pending.push({
        rowIndex: i + 2,  // 1-indexed、ヘッダー行(1行目)を加算
        word:     word,
        reading:  reading,
        pos:      pos,
      });
    }
  });

  return pending;
}

// ============================================================
// Vocabulary シートの全行を返す（reclassifyWords 用）
// ============================================================
function getAllVocabRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const rows = [];

  data.forEach(function(row, i) {
    const word = String(row[0]).trim();
    if (!word) return;
    rows.push({
      rowIndex: i + 2,
      word:     word,
      reading:  String(row[1]).trim(),
      pos:      String(row[4]).trim(),
    });
  });

  return rows;
}

// ============================================================
// Log シートに1行追記する（内部関数）
//
// Log シート列構成（setupSpreadsheet.gs 準拠）:
//   A: date  B: type  C: id  D: status  E: error
// ============================================================
function logToSheet_(ss, type, word, status, message) {
  try {
    const logSheet = ss.getSheetByName(CLASSIFY_SETTINGS.LOG_SHEET_NAME);
    if (!logSheet) return;

    logSheet.appendRow([
      new Date(),         // A: date
      type,               // B: type (classify / reclassify)
      "word_" + word,     // C: id
      status,             // D: status (success / failed)
      message || "",      // E: error / message
    ]);
  } catch (e) {
    // ログ書き込み失敗はサイレントに無視（メイン処理を止めない）
    Logger.log("WARN: ログ書き込み失敗: " + e.message);
  }
}
