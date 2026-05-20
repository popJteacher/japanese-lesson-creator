// archive/gas_old/syncRegistries_v_NA.gs
//
// 2026-05-20 退役（gas/pipeline.gs v7.3 で削除）。
// Phase 2 ⑥：GAS syncAll 引退。後継：
//   scripts/sync-registries-local.mjs
//   （ローカル Sheets API → data/master_*_registry.json を直接書く）
//
// 元配置：gas/pipeline.gs line 2804-2985（v7.2 時点）
// バージョン表記：GAS monolith 内のセクション（独立バージョンなし＝v_NA）
//
// 注：loadJsonFromDriveById は importExamplesFromLesson02（gas/pipeline.gs
//     line 3158）からも呼ばれるため、gas/pipeline.gs 側に残してある。
//     ここには参照保全のためコピーを含む（archive はライブ GAS には取り込まれない）。
//
// 同値検証（2026-05-20 ④）：
//   scripts/diff-registries.mjs で Drive snapshot（GAS syncAll 出力）と
//   scripts/sync-registries-local.mjs 出力を JSON 構造で deep diff した結果、
//   画像・音声 registry とも残差分 0 件（_meta 日付含む）。
//   protected キー・status 上書きルール・generatedAt 保持すべて等価。

// ================================================================
// syncRegistries.gs
// スプレッドシートの生成済みエントリを
// master_image_registry.json / master_audio_registry.json に書き戻す
// ================================================================

const SYNC_SETTINGS = {
  SPREADSHEET_ID:    "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk",
  // 2026-05-19: 新 Drive ID へ移行。旧 IMAGE_REGISTRY_ID="14NL_LqudXIQzY68klspH3SBlR21hiqbW" /
  // 旧 AUDIO_REGISTRY_ID="1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0" は破損したため superseded。
  IMAGE_REGISTRY_ID: "17WnltHEvymkua4hgfak2951f5BgphV9O",
  AUDIO_REGISTRY_ID: "1y0-mzxQGfZVHyj6tT1ttXzt0knlueb3M",
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
