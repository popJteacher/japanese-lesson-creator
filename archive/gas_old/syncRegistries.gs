/**
 * syncRegistries.gs
 * ============================================================
 * スプレッドシートの生成済みエントリを
 * master_image_registry.json と master_audio_registry.json に書き戻す。
 *
 * 【スコープ（更新する対象）】
 *   ✅ Vocabulary シートの word_* エントリ
 *      → image_registry の imageUrl / status を更新
 *      → audio_registry の audioUrl を更新
 *   ✅ Examples シートの sentence_* エントリ
 *      → audio_registry の audioUrl を更新
 *
 * 【絶対に触れないエントリ（PROTECTED）】
 *   ❌ char_*   （char_鈴木〜char_ケリー：実URL存在・上書き禁止）
 *   ❌ ex_L*    （ex_L01_007〜015 等の例文画像：GASスコープ外）
 *   ❌ world_map（imageUrl: null のまま保持）
 *
 * 【実行タイミング】
 *   タイマートリガー：毎日 午後11:00（generateImages / generateAudio の後）
 *   手動実行：syncAll() を呼び出す
 *
 * 【その後の手順】
 *   syncAll() 完了後 → build-embedded-data.py を手動実行
 *   「画像があるのにHTMLに反映されない」はほぼ build 未実行が原因
 * ============================================================
 */

// ▼▼▼ ここを設定してください ▼▼▼
const SYNC_SETTINGS = {
  SPREADSHEET_ID:       "YOUR_SPREADSHEET_ID_HERE",     // ← スプレッドシートID
  IMAGE_REGISTRY_ID:    "YOUR_IMAGE_REGISTRY_FILE_ID",  // ← master_image_registry.json の DriveファイルID
  AUDIO_REGISTRY_ID:    "YOUR_AUDIO_REGISTRY_FILE_ID",  // ← master_audio_registry.json の DriveファイルID
};
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// 絶対に更新しないキーのプレフィックス / 完全一致リスト
const PROTECTED_PREFIXES = ["char_", "ex_L"];
const PROTECTED_EXACT    = ["world_map"];

// ============================================================
// メイン：image + audio を両方同期する
// ============================================================
function syncAll() {
  console.log("===== syncRegistries 開始 =====");

  const imageResult = syncImageRegistry();
  const audioResult = syncAudioRegistry();

  console.log("===== syncRegistries 完了 =====");
  console.log(`画像registry: ${imageResult.updated}件更新 / ${imageResult.skipped}件スキップ / ${imageResult.protected}件保護`);
  console.log(`音声registry: ${audioResult.updated}件更新 / ${audioResult.skipped}件スキップ / ${audioResult.protected}件保護`);
  console.log("次のステップ: build-embedded-data.py を手動実行してください");

  // Logシートに記録
  writeLog("sync", "syncAll",
    `✅ 画像:${imageResult.updated}更新 / 音声:${audioResult.updated}更新`,
    "", "");
}

// ============================================================
// master_image_registry.json の同期
// （Vocabulary シートの imageUrl が入った行のみ更新）
// ============================================================
function syncImageRegistry() {
  const registry = loadJsonFromDriveById(SYNC_SETTINGS.IMAGE_REGISTRY_ID);
  if (!registry) {
    console.error("❌ master_image_registry.json の読み込みに失敗しました");
    return { updated: 0, skipped: 0, protected: 0 };
  }

  const ss    = SpreadsheetApp.openById(SYNC_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  if (!sheet) {
    console.error("❌ Vocabulary シートが見つかりません");
    return { updated: 0, skipped: 0, protected: 0 };
  }

  // ヘッダー行からインデックスを動的取得（列順変更に対応）
  const headers    = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const COL        = buildColIndex(headers);
  const lastRow    = sheet.getLastRow();

  if (lastRow <= 1) {
    console.log("  Vocabulary シートにデータ行がありません");
    return { updated: 0, skipped: 0, protected: 0 };
  }

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  let updated = 0, skipped = 0, protected_ = 0;

  for (const row of data) {
    const imageId     = String(row[COL.imageId]     || "").trim();
    const imageStatus = String(row[COL.imageStatus] || "").trim();
    const imageUrl    = String(row[COL.imageUrl]    || "").trim();

    // imageId が空 → スキップ
    if (!imageId) { skipped++; continue; }

    // 保護対象チェック
    if (isProtected(imageId)) {
      console.log(`  🛡 保護スキップ: ${imageId}`);
      protected_++;
      continue;
    }

    // imageUrl が空、または pending → スキップ
    if (!imageUrl || imageStatus === "pending" || imageStatus === "failed") {
      skipped++;
      continue;
    }

    // registry に該当エントリが存在しない場合は警告してスキップ
    // （新エントリの追加は extractFromGoiList.gs / importFromLessonJson.gs の担当）
    if (!registry.entries || registry.entries[imageId] === undefined) {
      console.log(`  ⚠️ registry に未登録（スキップ）: ${imageId}`);
      skipped++;
      continue;
    }

    const entry = registry.entries[imageId];

    // images[] 配列の最初の要素を更新（なければ作成）
    if (!entry.images || entry.images.length === 0) {
      entry.images = [{}];
    }
    entry.images[0].imageUrl   = imageUrl;
    entry.images[0].generatedAt = entry.images[0].generatedAt ||
                                   new Date().toISOString().slice(0, 10);

    // status を更新（approved を degradeしない：approved → generated にしない）
    if (entry.status !== "approved") {
      entry.status = imageStatus;  // "generated" or "approved" がSSから来る
    }

    console.log(`  ✅ 画像更新: ${imageId} → ${imageUrl.slice(0, 50)}...`);
    updated++;
  }

  // _meta.lastUpdated を更新
  if (registry._meta) {
    registry._meta.lastUpdated = new Date().toISOString().slice(0, 10);
  }

  // Drive に書き戻し
  saveJsonToDriveById(SYNC_SETTINGS.IMAGE_REGISTRY_ID, registry);
  console.log(`  → master_image_registry.json 書き込み完了`);

  return { updated, skipped, protected: protected_ };
}

// ============================================================
// master_audio_registry.json の同期
// （Vocabulary + Examples シートの audioUrl が入った行を更新）
// ============================================================
function syncAudioRegistry() {
  const registry = loadJsonFromDriveById(SYNC_SETTINGS.AUDIO_REGISTRY_ID);
  if (!registry) {
    console.error("❌ master_audio_registry.json の読み込みに失敗しました");
    return { updated: 0, skipped: 0, protected: 0 };
  }

  const ss = SpreadsheetApp.openById(SYNC_SETTINGS.SPREADSHEET_ID);

  let updated = 0, skipped = 0, protected_ = 0;

  // ── Vocabulary シートの word_* エントリ ──────────────────────
  const vocabSheet = ss.getSheetByName("Vocabulary");
  if (vocabSheet && vocabSheet.getLastRow() > 1) {
    const headers  = vocabSheet.getRange(1, 1, 1, vocabSheet.getLastColumn()).getValues()[0];
    const COL      = buildColIndex(headers);
    const data     = vocabSheet.getRange(2, 1, vocabSheet.getLastRow() - 1, headers.length).getValues();

    for (const row of data) {
      const audioId     = String(row[COL.audioId]     || "").trim();
      const audioStatus = String(row[COL.audioStatus] || "").trim();
      const audioUrl    = String(row[COL.audioUrl]    || "").trim();

      if (!audioId) { skipped++; continue; }

      if (isProtected(audioId)) {
        console.log(`  🛡 保護スキップ: ${audioId}`);
        protected_++;
        continue;
      }

      if (!audioUrl || audioStatus === "pending" || audioStatus === "failed") {
        skipped++;
        continue;
      }

      if (!registry.entries || registry.entries[audioId] === undefined) {
        console.log(`  ⚠️ registry に未登録（スキップ）: ${audioId}`);
        skipped++;
        continue;
      }

      registry.entries[audioId].audioUrl = audioUrl;
      console.log(`  ✅ 音声更新（語彙）: ${audioId}`);
      updated++;
    }
  }

  // ── Examples シートの sentence_* エントリ ─────────────────────
  const exSheet = ss.getSheetByName("Examples");
  if (exSheet && exSheet.getLastRow() > 1) {
    const headers  = exSheet.getRange(1, 1, 1, exSheet.getLastColumn()).getValues()[0];
    const idIdx        = headers.indexOf("id");
    const audioStIdx   = headers.indexOf("audioStatus");
    const audioUrlIdx  = headers.indexOf("audioUrl");

    if (idIdx >= 0 && audioStIdx >= 0 && audioUrlIdx >= 0) {
      const data = exSheet.getRange(2, 1, exSheet.getLastRow() - 1, headers.length).getValues();

      for (const row of data) {
        const id          = String(row[idIdx]       || "").trim();
        const audioStatus = String(row[audioStIdx]  || "").trim();
        const audioUrl    = String(row[audioUrlIdx] || "").trim();

        if (!id) { skipped++; continue; }

        if (isProtected(id)) {
          protected_++;
          continue;
        }

        if (!audioUrl || audioStatus === "pending" || audioStatus === "failed") {
          skipped++;
          continue;
        }

        if (!registry.entries || registry.entries[id] === undefined) {
          console.log(`  ⚠️ registry に未登録（スキップ）: ${id}`);
          skipped++;
          continue;
        }

        registry.entries[id].audioUrl = audioUrl;
        console.log(`  ✅ 音声更新（例文）: ${id}`);
        updated++;
      }
    }
  }

  // _meta.lastModified を更新
  if (registry._meta) {
    registry._meta.lastModified = new Date().toISOString().slice(0, 10);
  }

  // Drive に書き戻し
  saveJsonToDriveById(SYNC_SETTINGS.AUDIO_REGISTRY_ID, registry);
  console.log(`  → master_audio_registry.json 書き込み完了`);

  return { updated, skipped, protected: protected_ };
}

// ============================================================
// 保護対象チェック
// char_*, ex_L*, world_map を絶対に更新しない
// ============================================================
function isProtected(key) {
  if (!key) return false;

  // 完全一致
  if (PROTECTED_EXACT.includes(key)) return true;

  // プレフィックス一致
  for (const prefix of PROTECTED_PREFIXES) {
    if (key.startsWith(prefix)) return true;
  }

  return false;
}

// ============================================================
// ヘッダー行から列インデックスマップを構築
// （列順変更への耐性を持たせる）
// ============================================================
function buildColIndex(headers) {
  const map = {};
  headers.forEach((h, i) => { map[h] = i; });
  return map;
}

// ============================================================
// ユーティリティ：Drive から JSON 読み込み
// ============================================================
function loadJsonFromDriveById(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return JSON.parse(file.getBlob().getDataAsString("utf-8"));
  } catch (e) {
    console.error(`JSON 読み込みエラー (${fileId}): ${e.message}`);
    return null;
  }
}

// ============================================================
// ユーティリティ：Drive に JSON 書き戻し
// ============================================================
function saveJsonToDriveById(fileId, data) {
  try {
    const file    = DriveApp.getFileById(fileId);
    const content = JSON.stringify(data, null, 2);
    file.setContent(content);
  } catch (e) {
    console.error(`JSON 書き込みエラー (${fileId}): ${e.message}`);
    throw e;
  }
}

// ============================================================
// タイマートリガー登録
// GASエディタで1回だけ手動実行する
// ============================================================
/**
 * setupSyncDailyTrigger()
 *
 * syncAll() を毎日 23:00 に実行するタイマートリガーを登録する。
 * 既存の syncAll トリガーをすべて削除してから再登録するため、
 * 重複実行しても安全。
 *
 * 【実行方法】
 *   GASエディタ → 関数選択「setupSyncDailyTrigger」→ ▶ 実行
 *   ※ 1回だけ実行すれば OK。再実行しても重複しない。
 */
function setupSyncDailyTrigger() {
  // 既存の syncAll トリガーを削除（重複防止）
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "syncAll") {
      ScriptApp.deleteTrigger(trigger);
      deletedCount++;
    }
  }
  if (deletedCount > 0) {
    console.log(`  既存の syncAll トリガーを ${deletedCount} 件削除しました`);
  }

  // 毎日 23:00 のトリガーを登録
  ScriptApp.newTrigger("syncAll")
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .create();

  console.log("✅ syncAll() のタイマートリガーを登録しました（毎日 23:00）");
  console.log("確認: GASエディタ → 時計アイコン「トリガー」→ syncAll が表示されていることを確認");
}

// ============================================================
// 動作確認用：保護チェックのテスト
// ============================================================
function testProtectedKeys() {
  const testCases = [
    // 保護されるべきキー
    { key: "char_鈴木",         expect: true  },
    { key: "char_リン",          expect: true  },
    { key: "ex_L01_007",        expect: true  },
    { key: "ex_L02_001",        expect: true  },
    { key: "world_map",         expect: true  },
    // 更新されるべきキー
    { key: "word_医者",          expect: false },
    { key: "word_日本人",        expect: false },
    { key: "sentence_ex_L01_001", expect: false },
  ];

  let pass = 0, fail = 0;
  for (const { key, expect } of testCases) {
    const result = isProtected(key);
    if (result === expect) {
      console.log(`  ✅ OK: "${key}" → isProtected=${result}`);
      pass++;
    } else {
      console.log(`  ❌ NG: "${key}" → 期待:${expect} 実際:${result}`);
      fail++;
    }
  }
  console.log(`\n保護チェック: ${pass}件OK / ${fail}件NG`);
}
