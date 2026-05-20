// archive/gas_old/generateAudio_v2_0_phase3_retired.gs
//
// 2026-05-20 退役（gas/pipeline.gs v7.4 で削除）。
// Phase 3 ⑥：GAS generateAudioBatch 引退。後継：
//   scripts/generate-audio-local.mjs   ローカル Cloud TTS 呼び出し + registry 連携
//   scripts/lib/tts-client.mjs         Cloud TTS Neural2 クライアント（同一プロジェクト SA 流用）
//   scripts/lib/audio-qc.mjs           ffmpeg two-pass loudnorm + silenceremove + afade
//   scripts/validate-audio.mjs         invariants[D] = LUFS/TP/duration/codec 検証
//
// 元配置：
//   gas/pipeline.gs line 2521-2810（main block：AUDIO_SETTINGS / generateAudioBatch /
//                                   testSingleAudio / retryAudio / setupAudioDailyTrigger /
//                                   setupAudioTriggersX3 / processAudioEntry_ /
//                                   updateAudioStatus_ / getPendingAudioRows_ /
//                                   getAllAudioRows_ / callGoogleCloudTTS_ /
//                                   buildCloudTtsWavBlob_ / saveAudioToDrive_ /
//                                   writeAudioLog_）
//   gas/pipeline.gs line 2881-2896（resetToRegenerate：audio reset utility）
//   gas/pipeline.gs line 2898-2917（validateWavStructure_：WAV 整合性検査）
//
// 同値〜上位互換の確認（2026-05-20 ⑤）：
//   ローカル合成は WAV (24kHz) → MP3 (48kHz, 96kbps, mono) に変更。GAS 版にはなかった
//   QC（loudnorm -16 LUFS / silenceremove / afade）を新規獲得。validate-audio で
//   55/55 PASS（3 件 WARN は TP 制約による正常範囲・pipeline 破綻ではない）。
//   missing-assets null_audioUrl: 32 → 1（残 1 件 word_新聞 は sync 漏れの別案件）。
//
// 人間タスク：GAS Triggers から generateAudioBatch（毎日 10:00）の削除が必要。
//   この退役 commit 時点では GAS 側のトリガーはまだ生存中。Phase 3 完了宣言の
//   前提条件として人間が GAS エディタから削除する。

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
  else Logger.log("✓ 全件完了！ローカルで `npm run sync-registries` を実行してください。");
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

// ----------------------------------------------------------------
// 音声リセットユーティリティ（旧 pipeline.gs line 2881-2896）
// AUDIO_SETTINGS と getAllAudioRows_ に依存するため audio block と一緒に退役。
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// WAV 整合性検査（旧 pipeline.gs line 2898-2917）
// processAudioEntry_ からのみ呼ばれる。audio block と一緒に退役。
// ----------------------------------------------------------------

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
