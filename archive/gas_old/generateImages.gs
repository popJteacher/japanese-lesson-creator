/**
 * ============================================================
 *  generateImages.gs  v5.0  (2026-05-15)
 *
 *  【このバージョンの主な変更点】
 *  ─────────────────────────────────────────
 *  [変更1] 入力: JSON ファイル → Vocabulary シート（SS）直接読み込み
 *    imageStatus = "pending" の行を自動収集して処理する。
 *    新しい語彙が extractFromGoiList.gs / importFromLessonJson.gs で
 *    追加されるたびに自動で処理対象になる。
 *
 *  [変更2] プロンプト自動生成
 *    vocab_type（F列）に基づいてテンプレートを選択し、
 *    master_prompt_design_guide_v2_5.py 準拠のプロンプトを生成する。
 *    vocab_type: person / building / concrete_object / action_verb /
 *                adjective / abstract_concept / spatial_relation /
 *                demonstrative / other
 *
 *  [変更3] 完了後の書き込み
 *    imageStatus / imageUrl を SS に直接更新。
 *    registry への反映は syncRegistries.gs が担当。
 *
 *  ─────────────────────────────────────────
 *  使い方:
 *    1. ScriptProperties に GEMINI_API_KEY / SPREADSHEET_ID を設定
 *    2. IMAGE_SETTINGS.IMAGE_FOLDER_ID を設定
 *    3. testSingleImage() で動作確認（1件だけ生成）
 *    4. generateImageBatch() を実行 or タイマートリガーに設定
 *    5. 完了後に syncRegistries.gs を実行（registry 反映）
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
  // Google AI Studio 無料枠: Imagen 4 Generate / Imagen 4 Fast Generate 各 25 RPD
  // 【1回目】imagen-4.0-generate-exp（高品質）
  // 【2回目】imagen-4.0-fast-generate-exp（高速）に変更して再実行 → 合計 50件/日
  MODEL: "imagen-4.0-generate-exp",

  // 1 バッチあたりの最大処理件数（安全マージン 1 件を残す）
  MAX_BATCH_SIZE: 24,

  // API コール間のスリープ（ms）
  DELAY_MS: 2500,

  // 画像の出力サイズ（Imagen 4 対応値）
  // "1:1" → 語彙カード用（正方形）
  ASPECT_RATIO: "1:1",
};

// ============================================================
// STYLE_RECIPE（master_prompt_design_guide_v2_5.py STYLE_BIBLE 準拠）
// ⚠ この文字列は変更厳禁。STYLE_BIBLE の core_style と color_palette の完全転記。
// ============================================================
const STYLE_RECIPE = [
  "Minimalist flat vector illustration.",
  "Clean continuous black outlines with consistent line weight.",
  "Completely flat solid color fills only.",
  "Color palette: soft cream white background (similar to #FBFBFB, hex value FBFBFB),",
  "deep slate navy outlines (similar to #1B2C40, hex value 1B2C40),",
  "muted warm blue (similar to #4A7FB5, hex value 4A7FB5)",
  "and warm amber gold (similar to #FAD141, hex value FAD141) as accents.",
  "This should look like it belongs in a brand style guide, not like AI art.",
  "Keep line weights consistent.",
  "No gradients, no shadows, no 3D effects, no photoreal textures.",
  "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
].join(" ");

// ============================================================
// 建物ごとの視覚的手がかり辞書（テンプレートB用）
// BUILDING_CUES: { entrance_cue, user_action_cue, surrounding_anchor, signage }
// ============================================================
const BUILDING_CUES = {
  "病院":   { signage: "病院", entrance: "automatic sliding glass doors with medical cross symbol above entrance", userAction: "a patient figure approaching the entrance", surrounding: "red cross or caduceus symbol on the wall" },
  "学校":   { signage: "学校", entrance: "gate with stone pillars, school name plate", userAction: "child with randoseru backpack walking toward entrance", surrounding: "cherry blossom trees lining the path" },
  "大学":   { signage: "大学", entrance: "wide archway gate with university nameplate", userAction: "student with backpack walking on campus path", surrounding: "ginkgo trees lining the approach" },
  "銀行":   { signage: "銀行", entrance: "revolving door with security column beside it", userAction: "suited person entering the building", surrounding: "ATM kiosk visible on the side wall" },
  "デパート": { signage: "デパート", entrance: "wide automatic glass doors with display windows on both sides", userAction: "shopper carrying a bag entering", surrounding: "window displays with colorful goods visible" },
  "スーパー": { signage: "スーパー", entrance: "automatic glass sliding doors, shopping cart station outside", userAction: "shopper pushing a cart out of the entrance", surrounding: "price sign boards visible in windows" },
  "レストラン": { signage: "レストラン", entrance: "welcoming wooden door with menu board outside", userAction: "couple about to enter", surrounding: "warm interior light visible through windows" },
  "ホテル":  { signage: "ホテル", entrance: "revolving door with uniformed doorman figure", userAction: "guest with rolling suitcase approaching", surrounding: "canopy over the entrance with flag poles" },
  "図書館":  { signage: "図書館", entrance: "wide stone steps leading to large double doors", userAction: "person carrying books entering", surrounding: "stone columns framing the entrance" },
  "駅":     { signage: "駅", entrance: "ticket gate visible inside the entrance", userAction: "commuter passing through the gate with IC card", surrounding: "train schedule board above entrance" },
};

// ============================================================
// 役割ベースの人物描写辞書（テンプレートA用）
// pos（品詞）・en（英語訳）から人物のビジュアルを決定する
// ============================================================
const PERSON_PROFILES = {
  "医者":    "A doctor in a white coat with a stethoscope around the neck. Professional confident posture, holding a clipboard.",
  "会社員":  "An office worker in business casual attire — collared shirt and trousers. Standing upright with a relaxed confident posture.",
  "学生":    "A student wearing casual clothes and carrying a school bag or backpack. Young adult appearance, friendly expression.",
  "大学生":  "A university student in casual everyday clothes carrying a backpack. Young adult in their early 20s, relaxed friendly expression.",
  "先生":    "A teacher standing in front of an implied classroom space. Wearing smart casual clothes, holding a book or marker pen.",
  "銀行員":  "A bank employee in a formal business suit. Standing upright with a polite professional expression.",
  "看護師":  "A nurse in pale blue scrubs with a name badge. Caring expression, holding a clipboard or medical folder.",
  "警察官":  "A police officer in a dark navy uniform with cap and badge. Standing at attention with a calm authoritative posture.",
  "店員":    "A shop assistant in a neat store uniform with name badge. Standing with a welcoming gesture.",
  "料理人":  "A chef in white chef's jacket and tall chef's hat. Standing with a ladle or spatula, confident expression.",
  "運転手":  "A driver in a cap and casual uniform. Standing beside an implied vehicle silhouette.",
  "子ども":  "A young child (8-10 years old) in casual clothes. Cheerful expression and playful posture.",
  "男の人":  "A generic adult man in casual everyday clothes. Pleasant relaxed expression.",
  "女の人":  "A generic adult woman in casual everyday clothes. Warm friendly expression.",
  "男の子":  "A young boy (8-10 years old) in casual t-shirt and shorts. Playful energetic posture.",
  "女の子":  "A young girl (8-10 years old) in casual clothes. Cheerful bright expression.",
  "お父さん": "A middle-aged man (40s) in casual smart clothes — collared shirt and trousers. Warm paternal expression.",
  "お母さん": "A middle-aged woman (40s) in casual smart clothes. Warm caring expression.",
  "おじいさん": "An elderly man (60s-70s) in comfortable everyday clothes. Kind peaceful expression.",
  "おばあさん": "An elderly woman (60s-70s) in comfortable everyday clothes. Warm gentle expression.",
};
const PERSON_PROFILE_DEFAULT = "A generic person in everyday casual clothes. Friendly neutral expression. The role should be communicated through posture, props, and setting.";


// ============================================================
// 【メイン】generateImageBatch() — タイマートリガーはこれに設定
// ============================================================
function generateImageBatch() {
  Logger.log("===== generateImages.gs v5.0 開始 =====");
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
// TARGET_IMAGE_ID に生成したい imageId を設定して実行する
// ============================================================
function testSingleImage() {
  const TARGET_IMAGE_ID = "word_先生";  // ← テストしたい imageId に変更

  Logger.log("===== テスト生成: " + TARGET_IMAGE_ID + " =====");

  const ss      = SpreadsheetApp.openById(IMAGE_SETTINGS.SPREADSHEET_ID);
  const pending = getPendingImageRows_(ss);
  const target  = pending.find(function(r) { return r.imageId === TARGET_IMAGE_ID; });

  if (!target) {
    Logger.log("ID '" + TARGET_IMAGE_ID + "' が pending 行に見つかりませんでした。");
    Logger.log("imageStatus が 'pending' であることを確認してください。");
    return;
  }

  processImageEntry_(ss, target);
  Logger.log("===== テスト完了 =====");
}

// ============================================================
// 【プレビュー】previewPrompts() — 実際のAPI呼び出しなしでプロンプトだけ確認
// 最初の5件のプロンプトをログに出力する（デバッグ用）
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
    Logger.log(prompt.substring(0, 300) + "...");
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

  const ss    = SpreadsheetApp.openById(IMAGE_SETTINGS.SPREADSHEET_ID);
  const idSet = new Set(targetImageIds);
  const all   = getAllImageRows_(ss);
  const targets = all.filter(function(r) { return idSet.has(r.imageId); });

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
// 【設定】タイマートリガーを登録（初回のみ手動実行）
// ============================================================
function setupImageDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "generateImageBatch") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("generateImageBatch")
    .timeBased()
    .everyDays(1)
    .atHour(9)   // 毎日9:00（classifyBatch 8:00 → 画像9:00 → 音声10:00）
    .create();

  Logger.log("INFO: generateImageBatch の日次トリガーを設定しました（毎日 9:00）");
}


// ============================================================
// 1エントリを処理する（内部関数）
// 戻り値: "success" / "error"
// ============================================================
function processImageEntry_(ss, row) {
  try {
    // 1. プロンプト生成（vocab_type に基づく）
    const prompt = buildImagePrompt_(row);
    Logger.log("  prompt preview: " + prompt.substring(0, 100) + "...");

    // 2. Imagen 4 API 呼び出し
    const imgResult = callImagenAPI_(prompt);
    if (!imgResult.success) {
      throw new Error(imgResult.error);
    }

    // 3. Google Drive に保存
    const driveResult = saveImageToDrive_(imgResult.imageBase64, row.imageId + ".png");
    if (!driveResult.success) {
      throw new Error(driveResult.error);
    }

    // 4. SS の imageStatus / imageUrl を更新
    const sheet = ss.getSheetByName(IMAGE_SETTINGS.VOCAB_SHEET_NAME);
    sheet.getRange(row.rowIndex, 8).setValue("generated");         // H: imageStatus
    sheet.getRange(row.rowIndex, 9).setValue(driveResult.directUrl); // I: imageUrl

    // 5. Log シートに記録
    writeImageLog_(ss, row.imageId, "success", driveResult.directUrl, "");

    Logger.log("  ✅ 完了: " + row.imageId + ".png → " + driveResult.directUrl);
    return "success";

  } catch (e) {
    const sheet = ss.getSheetByName(IMAGE_SETTINGS.VOCAB_SHEET_NAME);
    if (sheet) sheet.getRange(row.rowIndex, 8).setValue("failed"); // H: imageStatus

    writeImageLog_(ss, row.imageId, "failed", "", e.message);
    Logger.log("  ❌ エラー: " + row.imageId + " → " + e.message);
    return "error";
  }
}


// ============================================================
// vocab_type に基づいてプロンプトを組み立てる（内部関数）
// master_prompt_design_guide_v2_5.py の各テンプレートに準拠
// ============================================================
function buildImagePrompt_(row) {
  const vt   = (row.vocabType || "other").toLowerCase();
  const word = row.word;
  const en   = row.en || word;

  switch (vt) {

    case "person":
      return buildPersonPrompt_(word, en);

    case "building":
      return buildBuildingPrompt_(word, en);

    case "concrete_object":
      return buildConcreteObjectPrompt_(word, en);

    case "action_verb":
      return buildActionVerbPrompt_(word, en);

    case "adjective":
      return buildAdjectivePrompt_(word, en);

    case "abstract_concept":
      return buildAbstractConceptPrompt_(word, en);

    case "spatial_relation":
      return buildSpatialRelationPrompt_(word, en);

    case "demonstrative":
      return buildDemonstrativePrompt_(word, en);

    default:  // "other" + 未知の vocab_type
      return buildDefaultPrompt_(word, en);
  }
}

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
    "No text, no letters, no numbers, no symbols inside the image.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}

// ── テンプレートB: 建物 ──
function buildBuildingPrompt_(word, en) {
  const cues = BUILDING_CUES[word] || {
    signage:      word,
    entrance:     "a clear identifiable entrance",
    userAction:   "a person approaching the entrance",
    surrounding:  "typical visual elements associated with the building type",
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

// ── テンプレートD: 具体物 ──
function buildConcreteObjectPrompt_(word, en) {
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly and UNAMBIGUOUSLY communicate the meaning of \"" + word + "\" (" + en + ") at a glance.",
    "A learner must distinguish this object from similar-shaped objects without any text clues.",
    "",
    "[SUBJECT]",
    "The subject is a " + en + " (" + word + ").",
    "Render its most distinctive identifying visual details clearly.",
    "",
    "[SCENE & ACTION]",
    "Display strategy: OBJECT_ALONE.",
    "The object is centered and fills 70-80% of the image.",
    "Camera angle: canonical 3/4 view — positioned 30-45 degrees above and slightly to one side.",
    "This angle reveals the top surface AND one side face simultaneously.",
    "Solid white background. No additional objects or context scene.",
    "Iconization level: Detailed Flat (level 3).",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
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
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}

// ── テンプレートI: 抽象概念 ──
function buildAbstractConceptPrompt_(word, en) {
  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must communicate the abstract concept \"" + word + "\" (" + en + ") through visual metaphor.",
    "",
    "[SUBJECT]",
    "Use a concrete visual metaphor or universally recognized symbol to represent \"" + en + "\".",
    "The metaphor must be immediately legible to a Japanese language learner.",
    "",
    "[SCENE & ACTION]",
    "TIAC method: show an OBJECT associated with the concept, with implied INTENT or FORM.",
    "The metaphor fills 70-80% of the frame. Solid white or minimal flat background.",
    "Canonical 3/4 view for objects. Eye-level for person-based metaphors.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
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
    "Minimal background.",
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
  // こ/そ/あ の判定
  var zone = "near speaker";
  if (word.startsWith("そ") || word === "そこ" || word === "そちら" || word === "それ") {
    zone = "near listener";
  } else if (word.startsWith("あ") || word === "あそこ" || word === "あちら" || word === "あれ") {
    zone = "far from both";
  }
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
    "Color-code the territory: こ-zone = warm amber, そ-zone = muted blue, あ-zone = gray.",
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
    "No text, no letters, no numbers, no symbols inside the image.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ============================================================
// Imagen 4 API を呼び出す（内部関数）
// 戻り値: { success, imageBase64, mimeType, error? }
// ============================================================
function callImagenAPI_(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY が ScriptProperties に設定されていません" };
  }

  const url = "https://generativelanguage.googleapis.com/v1beta/models/"
              + IMAGE_SETTINGS.MODEL
              + ":predict?key=" + apiKey;

  const payload = {
    instances: [
      { prompt: prompt }
    ],
    parameters: {
      sampleCount:   1,
      aspectRatio:   IMAGE_SETTINGS.ASPECT_RATIO,
      safetyFilterLevel: "block_only_high",
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
    return { success: false, error: "HTTP " + statusCode + ": "
             + response.getContentText().substring(0, 300) };
  }

  let json;
  try {
    json = JSON.parse(response.getContentText());
  } catch (e) {
    return { success: false, error: "JSON パースエラー: " + e.message };
  }

  // レスポンス構造: predictions[0].bytesBase64Encoded / mimeType
  const predictions = json && json.predictions;
  if (!predictions || predictions.length === 0) {
    return { success: false, error: "predictions が空です: " + JSON.stringify(json).substring(0, 200) };
  }

  const imageBase64 = predictions[0].bytesBase64Encoded;
  const mimeType    = predictions[0].mimeType || "image/png";

  if (!imageBase64) {
    return { success: false, error: "bytesBase64Encoded が空です" };
  }

  Logger.log("  Imagen API 成功 | mimeType: " + mimeType);
  return { success: true, imageBase64: imageBase64, mimeType: mimeType };
}


// ============================================================
// 画像を Google Drive に保存（内部関数）
// ============================================================
function saveImageToDrive_(imageBase64, filename) {
  try {
    const folder   = DriveApp.getFolderById(IMAGE_SETTINGS.IMAGE_FOLDER_ID);

    // 同名ファイルが存在する場合は上書き
    const existing = folder.getFilesByName(filename);
    while (existing.hasNext()) {
      existing.next().setTrashed(true);
    }

    const imageBytes = Utilities.base64Decode(imageBase64);
    const blob       = Utilities.newBlob(imageBytes, "image/png", filename);

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
// Vocabulary シートから imageStatus = "pending" の行を収集（内部関数）
// ============================================================
function getPendingImageRows_(ss) {
  return getAllImageRows_(ss).filter(function(r) {
    return r.imageStatus === "pending";
  });
}

function getAllImageRows_(ss) {
  const sheet = ss.getSheetByName(IMAGE_SETTINGS.VOCAB_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  // A:N 列を一括取得
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
  const rows = [];

  data.forEach(function(row, i) {
    const word        = String(row[0]).trim();   // A
    const reading     = String(row[1]).trim();   // B
    const en          = String(row[2]).trim();   // C
    const vocabType   = String(row[5]).trim();   // F
    const imageId     = String(row[6]).trim();   // G
    const imageStatus = String(row[7]).trim();   // H

    if (!word) return;
    rows.push({
      rowIndex:    i + 2,
      word:        word,
      reading:     reading,
      en:          en,
      vocabType:   vocabType,
      imageId:     imageId || ("word_" + word),
      imageStatus: imageStatus,
    });
  });

  return rows;
}


// ============================================================
// Log シートに書き込む
// ============================================================
function writeImageLog_(ss, imageId, status, url, errorMsg) {
  try {
    const logSheet = ss.getSheetByName(IMAGE_SETTINGS.LOG_SHEET_NAME);
    if (!logSheet) return;
    logSheet.appendRow([
      new Date(),
      "image",
      imageId,
      status,
      url      || "",
      errorMsg || "",
    ]);
  } catch (e) {
    Logger.log("WARN: ログ書き込み失敗: " + e.message);
  }
}
