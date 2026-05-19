/**
 * ============================================================
 *  日本語教材 音声生成スクリプト v3.0  (2026-05-18)
 *
 *  v2.0 からの主な変更点（handoff_audio_api_migration_v1.md v1.2 準拠）:
 *
 *  [変更1] TTS API を Gemini TTS → Google Cloud TTS（WaveNet）に切り替え
 *    v2.0: gemini-2.5-flash-preview-tts + Aoede（10件/日・日本語アクセント不安定）
 *    v3.0: Google Cloud TTS WaveNet + ja-JP-Wavenet-B
 *          → 日本語ピッチアクセント最適化・400万文字/月（無料枠）
 *
 *  [変更2] AUDIO_SETTINGS のフィールド変更
 *    【削除】MODEL（Gemini TTS 専用フィールド）
 *    【変更】VOICE_NAME: "Aoede" → "ja-JP-Wavenet-B"
 *    【追加】LANGUAGE_CODE / AUDIO_ENCODING / SAMPLE_RATE（Cloud TTS 専用）
 *    【変更】DELAY_MS: 6000 → 1000（Cloud TTS はレート制限が緩い）
 *    【変更】MAX_BATCH_SIZE: 9 → 50（日次上限なし・GAS 6分制限内）
 *
 *  [変更3] TTS 呼び出し関数を置き換え
 *    【削除】callGeminiTTS_()
 *    【追加】callGoogleCloudTTS_()（buildWavBlob_() との互換性を維持）
 *
 *  ─────────────────────────────────────────────────
 *  変更なし（コアロジック）:
 *    buildWavBlob_()     PCM → WAV 変換（LINEAR16 互換のため流用可）
 *    saveAudioToDrive()  Drive 保存
 *    updateAudioStatus_() SS 書き込み
 *  ─────────────────────────────────────────────────
 *
 *  使い方:
 *    1. ScriptProperties に GCP_TTS_KEY / SPREADSHEET_ID を設定
 *       （GEMINI_API_KEY は classifyBatch / generateImageBatch で引き続き使用）
 *    2. Cloud Console で billing 設定 + Cloud Text-to-Speech API を有効化
 *    3. testSingleAudio() で動作確認（1件だけ生成）
 *    4. generateAudioBatch() で通常実行（毎日 10:00 自動実行・50件/回）
 *    5. 完了後は syncRegistries.gs を実行（registry 反映）
 * ============================================================
 */

// ============================================================
// 設定
// ============================================================
const AUDIO_SETTINGS = {
  // ScriptProperties から取得（直接書き込み厳禁）
  SPREADSHEET_ID: PropertiesService.getScriptProperties()
                    .getProperty("SPREADSHEET_ID") || "YOUR_SPREADSHEET_ID_HERE",

  VOCAB_SHEET_NAME:    "Vocabulary",
  EXAMPLES_SHEET_NAME: "Examples",
  LOG_SHEET_NAME:      "Log",

  // 音声ファイルの保存先（Drive フォルダ ID）
  // Google Drive の audio/ フォルダを右クリック → 「リンクをコピー」→ URL末尾の ID
  AUDIO_FOLDER_ID: PropertiesService.getScriptProperties()
                     .getProperty("AUDIO_FOLDER_ID") || "YOUR_AUDIO_FOLDER_ID_HERE",

  // ── Google Cloud TTS 設定（v3.0: Gemini TTS から移行）──
  // 日本語 WaveNet 音声の選択肢（無料枠: 400万文字/月）
  //   ja-JP-Wavenet-B : 女性・明瞭・教材向き ★推奨
  //   ja-JP-Wavenet-A : 女性（別声質）
  //   ja-JP-Wavenet-C : 男性
  //   ja-JP-Wavenet-D : 男性（別声質）
  // Neural2（さらに自然・無料枠: 100万文字/月）
  //   ja-JP-Neural2-B : 女性
  //   ja-JP-Neural2-C : 男性
  VOICE_NAME:     "ja-JP-Wavenet-B",
  LANGUAGE_CODE:  "ja-JP",
  AUDIO_ENCODING: "LINEAR16",    // WAV互換PCM → buildWavBlob_() をそのまま流用可
  SAMPLE_RATE:    24000,         // 24kHz（WaveNetデフォルト）

  DELAY_MS:       1000,          // 旧: 6000ms → Cloud TTSはレート制限が緩いため短縮
  MAX_BATCH_SIZE: 50,            // 旧: 9件 → 日次上限なし・GAS 6分制限内に収める
};


// ============================================================
// 【メイン】generateAudioBatch() — タイマートリガーはこれに設定
// ============================================================
// 処理順序: Vocabulary（語彙）→ Examples（例文）
// スキップ: audioStatus が "pending" 以外は処理しない
// バッチ制限: MAX_BATCH_SIZE 件ずつ処理 → 次回自動継続
// ============================================================
function generateAudioBatch() {
  Logger.log("===== generateAudio.gs v3.0 開始 =====");
  Logger.log("API: Google Cloud TTS WaveNet / ボイス: " + AUDIO_SETTINGS.VOICE_NAME);

  const ss = SpreadsheetApp.openById(AUDIO_SETTINGS.SPREADSHEET_ID);

  // pending 行を収集（Vocabulary → Examples の順）
  const pending = getPendingAudioRows_(ss);

  if (pending.length === 0) {
    Logger.log("INFO: audioStatus = 'pending' の行はありません。処理をスキップします。");
    Logger.log("💡 全件完了後は syncRegistries.gs を実行して registry に反映してください。");
    return;
  }

  const batch     = pending.slice(0, AUDIO_SETTINGS.MAX_BATCH_SIZE);
  const remaining = pending.length - batch.length;

  Logger.log("未処理件数: " + pending.length
             + " → 今回: " + batch.length + " 件"
             + (remaining > 0 ? " / 残り: " + remaining + " 件（次回）" : ""));

  let successCount = 0;
  let errorCount   = 0;

  batch.forEach(function(row, i) {
    Logger.log("  [" + (i + 1) + "/" + batch.length + "] "
               + row.audioId + " (" + row.textToSpeak.substring(0, 20) + "...)");

    const result = processAudioEntry_(ss, row);
    if (result === "success") successCount++;
    else                      errorCount++;

    if (i < batch.length - 1) {
      Utilities.sleep(AUDIO_SETTINGS.DELAY_MS);
    }
  });

  Logger.log("===== バッチ完了 =====");
  Logger.log("成功: " + successCount + " / エラー: " + errorCount);

  if (remaining > 0) {
    Logger.log("残り " + remaining + " 件 → 次回 generateAudioBatch() で継続します");
  } else {
    Logger.log("✅ 全件処理完了！syncRegistries.gs を実行して registry に反映してください。");
  }
}


// ============================================================
// 【テスト】testSingleAudio() — 1件だけ生成して動作確認
// TARGET_AUDIO_ID に生成したい audioId を設定して実行する
// ============================================================
function testSingleAudio() {
  const TARGET_AUDIO_ID = "word_先生";  // ← テストしたい audioId に変更

  Logger.log("===== テスト生成: " + TARGET_AUDIO_ID + " =====");

  const ss      = SpreadsheetApp.openById(AUDIO_SETTINGS.SPREADSHEET_ID);
  const pending = getPendingAudioRows_(ss);
  const target  = pending.find(function(r) { return r.audioId === TARGET_AUDIO_ID; });

  if (!target) {
    Logger.log("ID '" + TARGET_AUDIO_ID + "' が pending 行に見つかりませんでした。");
    Logger.log("audioStatus が 'pending' であることを確認してください。");
    return;
  }

  processAudioEntry_(ss, target);
  Logger.log("===== テスト完了 =====");
}


// ============================================================
// 【補助】特定の audioId を強制再生成する（修正・再試行用）
// 使い方: retryAudio(["word_先生", "word_医者"])
// ============================================================
function retryAudio(targetAudioIds) {
  if (!targetAudioIds || targetAudioIds.length === 0) {
    Logger.log("ERROR: targetAudioIds が空です。例: retryAudio(['word_先生'])");
    return;
  }

  const ss          = SpreadsheetApp.openById(AUDIO_SETTINGS.SPREADSHEET_ID);
  const idSet       = new Set(targetAudioIds);
  const allRows     = getAllAudioRows_(ss);  // 全 status の行を取得
  const targets     = allRows.filter(function(r) { return idSet.has(r.audioId); });

  if (targets.length === 0) {
    Logger.log("INFO: 対象 ID が見つかりませんでした");
    return;
  }

  Logger.log("INFO: " + targets.length + " 件を再処理します");

  targets.forEach(function(row) {
    processAudioEntry_(ss, row);
    Utilities.sleep(AUDIO_SETTINGS.DELAY_MS);
  });
}


// ============================================================
// 【設定】タイマートリガーを登録する（初回のみ手動実行）
// ============================================================
function setupAudioDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "generateAudioBatch") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("generateAudioBatch")
    .timeBased()
    .everyDays(1)
    .atHour(10)  // 毎日10:00（classifyBatch の8:00より後）
    .create();

  Logger.log("INFO: generateAudioBatch の日次トリガーを設定しました（毎日 10:00）");
}


// ============================================================
// 1エントリを処理する（内部関数）
// 戻り値: "success" / "error"
// ============================================================
function processAudioEntry_(ss, row) {
  try {
    // 1. Google Cloud TTS API 呼び出し（v3.0: Gemini TTS から移行）
    const ttsResult = callGoogleCloudTTS_(row.textToSpeak);
    if (!ttsResult.success) {
      throw new Error(ttsResult.error);
    }

    // 2. PCM データ → WAV Blob に変換
    const wavBlob = buildWavBlob_(ttsResult.pcmBase64, ttsResult.sampleRate, row.filename);

    // 3. Google Drive に保存
    const driveResult = saveAudioToDrive_(wavBlob, row.filename);
    if (!driveResult.success) {
      throw new Error(driveResult.error);
    }

    // 4. スプレッドシートの audioStatus / audioUrl を直接更新
    updateAudioStatus_(ss, row, "generated", driveResult.directUrl);

    // 5. Log シートに記録
    writeAudioLog_(ss, row.audioId, "success", driveResult.directUrl, "");

    Logger.log("  ✅ 完了: " + row.filename + " → " + driveResult.directUrl);
    return "success";

  } catch (e) {
    // 失敗時は audioStatus を "failed" に更新
    updateAudioStatus_(ss, row, "failed", "");
    writeAudioLog_(ss, row.audioId, "failed", "", e.message);
    Logger.log("  ❌ エラー: " + row.audioId + " → " + e.message);
    return "error";
  }
}


// ============================================================
// SS の audioStatus / audioUrl を更新する（内部関数）
// ============================================================
function updateAudioStatus_(ss, row, status, url) {
  const sheet = ss.getSheetByName(row.sheetName);
  if (!sheet) return;

  sheet.getRange(row.rowIndex, row.audioStatusCol).setValue(status);
  sheet.getRange(row.rowIndex, row.audioUrlCol).setValue(url);
}


// ============================================================
// Vocabulary + Examples から audioStatus = "pending" の行を収集
// ============================================================
// 戻り値 Array<{
//   audioId, textToSpeak, filename,
//   sheetName, rowIndex, audioStatusCol, audioUrlCol
// }>
// ============================================================
function getPendingAudioRows_(ss) {
  return getAllAudioRows_(ss).filter(function(r) {
    return r.audioStatus === "pending";
  });
}

function getAllAudioRows_(ss) {
  const rows = [];

  // ── Vocabulary シート ──
  // 列: A=word B=reading J=audioId K=audioStatus L=audioUrl
  const vocabSheet = ss.getSheetByName(AUDIO_SETTINGS.VOCAB_SHEET_NAME);
  if (vocabSheet && vocabSheet.getLastRow() >= 2) {
    const data = vocabSheet.getRange(2, 1, vocabSheet.getLastRow() - 1, 12).getValues();
    data.forEach(function(row, i) {
      const word        = String(row[0]).trim();   // A
      const reading     = String(row[1]).trim();   // B
      const audioId     = String(row[9]).trim();   // J
      const audioStatus = String(row[10]).trim();  // K
      if (!word) return;
      rows.push({
        sheetName:      AUDIO_SETTINGS.VOCAB_SHEET_NAME,
        rowIndex:       i + 2,
        audioId:        audioId || ("word_" + word),
        textToSpeak:    reading || word,           // ひらがな読みで発音精度を確保
        filename:       (audioId || ("word_" + word)) + ".wav",
        audioStatus:    audioStatus,
        audioStatusCol: 11,  // K列
        audioUrlCol:    12,  // L列
      });
    });
  }

  // ── Examples シート ──
  // 列: A=id B=lessonNo C=patternId D=sentence E=sentenceEn
  //     F=textToSpeak G=audioStatus H=audioUrl I=isAnchor
  const exSheet = ss.getSheetByName(AUDIO_SETTINGS.EXAMPLES_SHEET_NAME);
  if (exSheet && exSheet.getLastRow() >= 2) {
    const data = exSheet.getRange(2, 1, exSheet.getLastRow() - 1, 8).getValues();
    data.forEach(function(row, i) {
      const id          = String(row[0]).trim();   // A
      const textToSpeak = String(row[5]).trim();   // F (TTS送信テキスト)
      const audioStatus = String(row[6]).trim();   // G
      if (!id) return;
      rows.push({
        sheetName:      AUDIO_SETTINGS.EXAMPLES_SHEET_NAME,
        rowIndex:       i + 2,
        audioId:        id,
        textToSpeak:    textToSpeak,
        filename:       id + ".wav",
        audioStatus:    audioStatus,
        audioStatusCol: 7,   // G列
        audioUrlCol:    8,   // H列
      });
    });
  }

  return rows;
}


// ============================================================
// Google Cloud TTS API を呼び出す（v3.0: callGeminiTTS_() を置き換え）
// 戻り値形式は buildWavBlob_() との互換性を維持（Gemini TTS と同一）
// ScriptProperties: GCP_TTS_KEY（Cloud Console発行・Cloud TTS API専用制限済み）
// ============================================================
function callGoogleCloudTTS_(text) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GCP_TTS_KEY");
  if (!apiKey) {
    return { success: false, error: "GCP_TTS_KEY が ScriptProperties に設定されていません" };
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
      // speakingRate: 1.0,   // 0.25〜4.0（必要に応じてコメントアウト解除）
      // pitch: 0.0,          // -20.0〜20.0半音単位
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
    return { success: false, error: "audioContent が空。GCP_TTS_KEY または VOICE_NAME を確認してください。" };
  }

  // buildWavBlob_() に渡す形式（Gemini TTS と互換）
  Logger.log("  TTS 成功 | VOICE: " + AUDIO_SETTINGS.VOICE_NAME + " | sampleRate: " + AUDIO_SETTINGS.SAMPLE_RATE);
  return {
    success:    true,
    pcmBase64:  json.audioContent,
    sampleRate: AUDIO_SETTINGS.SAMPLE_RATE,
  };
}


// ============================================================
// PCM base64 → WAV Blob に変換（v1.0 から流用・変更なし）
// ============================================================
function buildWavBlob_(pcmBase64, sampleRate, filename) {
  const pcmBytes      = Utilities.base64Decode(pcmBase64);
  const numChannels   = 1;
  const bitsPerSample = 16;
  const byteRate      = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign    = numChannels * bitsPerSample / 8;
  const dataSize      = pcmBytes.length;
  const chunkSize     = 36 + dataSize;

  const header = [];
  function ws(s)  { for (var i = 0; i < 4; i++) header.push(s.charCodeAt(i)); }
  function w32(n) { header.push(n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF); }
  function w16(n) { header.push(n & 0xFF, (n >> 8) & 0xFF); }

  ws("RIFF");  w32(chunkSize);  ws("WAVE");
  ws("fmt ");  w32(16);         w16(1);
  w16(numChannels);             w32(sampleRate);
  w32(byteRate);                w16(blockAlign);  w16(bitsPerSample);
  ws("data");  w32(dataSize);

  var wavBytes = header.concat(Array.from(pcmBytes));
  return Utilities.newBlob(wavBytes, "audio/wav", filename);
}


// ============================================================
// WAV Blob を Google Drive に保存（v1.0 から流用・変更なし）
// ============================================================
function saveAudioToDrive_(blob, filename) {
  try {
    const folder   = DriveApp.getFolderById(AUDIO_SETTINGS.AUDIO_FOLDER_ID);

    // 同名ファイルが既存なら上書き（トラッシュに移動してから再作成）
    const existing = folder.getFilesByName(filename);
    while (existing.hasNext()) {
      existing.next().setTrashed(true);
    }

    const savedFile = folder.createFile(blob);
    savedFile.setName(filename);
    savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = savedFile.getId();
    return {
      success:   true,
      fileUrl:   savedFile.getUrl(),
      directUrl: "https://drive.google.com/uc?id=" + fileId,
      fileId:    fileId,
    };
  } catch (e) {
    return { success: false, error: "Drive 保存エラー: " + e.message };
  }
}


// ============================================================
// Log シートに書き込む（classifyAndTranslate.gs と同形式）
// ============================================================
function writeAudioLog_(ss, audioId, status, url, errorMsg) {
  try {
    const logSheet = ss.getSheetByName(AUDIO_SETTINGS.LOG_SHEET_NAME);
    if (!logSheet) return;
    logSheet.appendRow([
      new Date(),
      "audio",
      audioId,
      status,
      url      || "",
      errorMsg || "",
    ]);
  } catch (e) {
    Logger.log("WARN: ログ書き込み失敗: " + e.message);
  }
}
