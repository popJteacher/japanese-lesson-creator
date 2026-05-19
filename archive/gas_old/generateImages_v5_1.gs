/**
 * ============================================================
 *  generateImages.gs  v5.1  (2026-05-18)
 *
 *  【このバージョンの主な変更点】
 *  ─────────────────────────────────────────
 *  v5.0 → v5.1:
 *  [変更1] switch-case を v2.6 準拠に拡張（テンプレートK〜T追加）
 *    pronoun / interjection / set_expression / adverb / counter /
 *    time / transportation / family / weather / sensory の
 *    10 vocab_type に対応する buildXxxPrompt_() 関数を追加。
 *
 *  [変更2] 補助列読み込みを拡張（A〜N → A〜R）
 *    O列: familyForm   （uchi / soto）
 *    P列: adverbType   （degree / frequency / manner / temporal）
 *    Q列: timeSubtype  （clock / weekday / month / season / relative / timeofday）
 *    R列: perceptionType（active / passive / emission）
 *    ※ setupSpreadsheet.gs でこれらの列を追加すること。
 *
 *  ─────────────────────────────────────────
 *  [v5.0 変更点（維持）]
 *  [変更1] 入力: JSON ファイル → Vocabulary シート（SS）直接読み込み
 *    imageStatus = "pending" の行を自動収集して処理する。
 *    新しい語彙が extractFromGoiList.gs / importFromLessonJson.gs で
 *    追加されるたびに自動で処理対象になる。
 *
 *  [変更2] プロンプト自動生成
 *    vocab_type（F列）に基づいてテンプレートを選択し、
 *    master_prompt_design_guide_v2_6_complete.py 準拠のプロンプトを生成する。
 *    vocab_type（v2.6 全20種）:
 *      person / building / concrete_object / action_verb / adjective /
 *      abstract_concept / spatial_relation / demonstrative /（A〜J: v2.5）
 *      pronoun / interjection / set_expression / adverb / counter /
 *      time / transportation / family / weather / sensory /（K〜T: v2.6 NEW）
 *      other（フォールバック）
 *
 *  [変更3] 完了後の書き込み
 *    imageStatus / imageUrl を SS に直接更新。
 *    registry への反映は syncRegistries.gs が担当。
 *
 *  ─────────────────────────────────────────
 *  使い方:
 *    1. ScriptProperties に GEMINI_API_KEY / SPREADSHEET_ID を設定
 *    2. IMAGE_SETTINGS.IMAGE_FOLDER_ID を設定
 *    3. Vocabulary シートに補助列 O〜R を追加（setupSpreadsheet.gs 参照）
 *    4. testSingleImage() で動作確認（1件だけ生成）
 *    5. generateImageBatch() を実行 or タイマートリガーに設定
 *    6. 完了後に syncRegistries.gs を実行（registry 反映）
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
// master_prompt_design_guide_v2_6_complete.py の各テンプレートに準拠
// v5.1: テンプレートK〜T（pronoun〜sensory）を追加
// ============================================================
function buildImagePrompt_(row) {
  const vt   = (row.vocabType || "other").toLowerCase();
  const word = row.word;
  const en   = row.en || word;

  switch (vt) {

    // ── テンプレートA〜J（v2.5 既存）──
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

    // ── テンプレートK〜T（v2.6 NEW）──
    case "pronoun":
      return buildPronounPrompt_(word, en);

    case "interjection":
      return buildInterjectionPrompt_(word, en);

    case "set_expression":
      return buildSetExpressionPrompt_(word, en);

    case "adverb":
      return buildAdverbPrompt_(word, en, row.adverbType);

    case "counter":
      return buildCounterPrompt_(word, en);

    case "time":
      return buildTimePrompt_(word, en, row.timeSubtype);

    case "transportation":
      return buildTransportPrompt_(word, en);

    case "family":
      return buildFamilyPrompt_(word, en, row.familyForm);

    case "weather":
      return buildWeatherPrompt_(word, en);

    case "sensory":
      return buildSensoryPrompt_(word, en, row.perceptionType);

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

// ── テンプレートK: 代名詞（PRONOUN_FRAMES） ──
// PRONOUN_FRAMES に基づき、代名詞の視点関係を図示する
// 人称・疑問代名詞ごとにアクター数と構図を切り替える
function buildPronounPrompt_(word, en) {

  // 語彙ごとの構図プロファイル
  const PRONOUN_LOOKUP = {
    "わたし": {
      core: (
        "Single person centered, facing camera directly. " +
        "Their right index finger points toward their own nose/face (Japanese self-reference gesture). " +
        "A curved self-referential arrow loops from the person back to themselves. " +
        "Solid white background, no other characters."
      )
    },
    "わたしたち": {
      core: (
        "3-4 diverse character silhouettes in a loose group, all facing camera. " +
        "One person in front points both index fingers back toward the whole group (including themselves). " +
        "A soft dashed circular boundary loosely encloses all figures. White background."
      )
    },
    "あなた": {
      core: (
        "TWO characters: LEFT speaker in 3/4 side view, index finger pointing directly at RIGHT character. " +
        "RIGHT listener facing forward with a highlight focus ring around them. " +
        "A bold straight arrow from speaker to listener. White background."
      )
    },
    "かれ": {
      core: (
        "THREE characters: FOREGROUND left=speaker, right=listener conversing. " +
        "BACKGROUND CENTER: a male figure slightly apart, highlighted with a teal focus ring. " +
        "A dotted arrow from the speaker points toward the background male figure. White background."
      )
    },
    "かのじょ": {
      core: (
        "THREE characters: FOREGROUND left=speaker, right=listener conversing. " +
        "BACKGROUND CENTER: a female figure (distinct hairstyle) slightly apart, highlighted with a teal focus ring. " +
        "A dotted arrow from the speaker points toward the background female figure. White background."
      )
    },
    "みんな": {
      core: (
        "4-5 diverse character silhouettes (varying sizes and hairstyles) spread across the frame, " +
        "all facing inward toward center. A soft dashed circular boundary encloses all figures. White background."
      )
    },
    "だれ": {
      core: (
        "A person-shaped blank silhouette with DASHED outline (unknown identity). " +
        "A large bold '?' symbol positioned at head level inside the silhouette. " +
        "Small searching character on the side looking toward the silhouette. White background."
      )
    },
    "なに": {
      core: (
        "An object-shaped blank silhouette with DASHED outline. " +
        "A large '?' symbol inside the silhouette. " +
        "Person leaning toward the mystery object, looking curiously. White background."
      )
    },
    "どこ": {
      core: (
        "A simplified map or abstract space layout. " +
        "A location pin with DASHED outline and '?' symbol at an uncertain spot. " +
        "Person looking at the map with hand shading eyes (searching gesture). White background."
      )
    },
    "いつ": {
      core: (
        "A clock face where the hands are replaced by a large '?' symbol, " +
        "OR a calendar grid where the specific date cell shows '?' instead of a number. White background."
      )
    },
  };

  const profile = PRONOUN_LOOKUP[word] || {
    core: (
      "Person centered in frame. " +
      "A bold directional arrow clearly indicating the referent of \"" + en + "\". " +
      "If personal pronoun: use self-pointing or other-pointing gesture as appropriate. " +
      "If interrogative pronoun: show a blank dashed silhouette of the referent type with '?' symbol. " +
      "White background, no text."
    )
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the pronoun/reference word \"" + word + "\" (" + en + ") at a glance.",
    "The directional relationship (who is referring to whom) must be crystal clear without any text.",
    "",
    "[SCENE & ACTION]",
    profile.core,
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
    "Directional arrows ARE permitted to show reference direction.",
    "Dashed outlines ARE permitted to show unknown/unspecified referents.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートL: 感動詞（INTERJECTION_FRAMES） ──
// 文化依存ジェスチャー単体に依存せず、発話バブル内の ISO 記号を併用する
function buildInterjectionPrompt_(word, en) {

  const INTERJECTION_LOOKUP = {
    "はい":  {
      core: (
        "Person with a gentle smile, mouth slightly open. " +
        "Short vertical motion lines above head to show nodding. " +
        "A speech bubble from mouth containing a large GREEN CHECKMARK ✓ (or double circle ◎)."
      )
    },
    "ええ": {
      core: (
        "Person with a gentle smile, mouth slightly open. " +
        "Short vertical motion lines above head to show nodding. " +
        "A speech bubble from mouth containing a large GREEN CHECKMARK ✓."
      )
    },
    "いいえ": {
      core: (
        "Person with slightly furrowed brows, one hand raised palm-outward in front of face. " +
        "Horizontal motion lines beside head to show head-shaking. " +
        "A speech bubble containing a large RED CROSS ✗."
      )
    },
    "あ": {
      core: (
        "Person with wide eyes and small round open mouth (discovery expression). " +
        "Above head: a yellow lightbulb or bold '!' exclamation icon. " +
        "Eyes directed upward-diagonally toward something just noticed."
      )
    },
    "ああ": {
      core: (
        "Person with wide eyes and small round open mouth (realization expression). " +
        "Above head: a bold '!' icon. Eyes directed toward a suddenly noticed object."
      )
    },
    "なるほど": {
      core: (
        "Person with a knowing expression (eyes slightly narrowed), " +
        "one index finger raised and touching palm of other hand (realization gesture). " +
        "Behind head: a graphic showing wavy confused lines transitioning to a clean straight arrow (clarity)."
      )
    },
    "そうですか": {
      core: (
        "Person in a slightly forward-leaning listening posture, " +
        "mouth in a neutral straight line, eyes focused on an implied speaker to the side. " +
        "A speech bubble containing a wavy 'acknowledgment' line or small ◎."
      )
    },
    "すみません": {
      core: (
        "Person in a slight bow (45 degrees forward). " +
        "A speech bubble containing a small heart with a crack line (apology), " +
        "or an exclamation mark (attention-getting)."
      )
    },
  };

  const profile = INTERJECTION_LOOKUP[word] || {
    core: (
      "Person with an expressive facial gesture appropriate for \"" + en + "\". " +
      "A speech bubble from their mouth containing a clear universally-understood symbol " +
      "(green checkmark for agreement, red cross for disagreement, '!' for surprise/discovery, " +
      "lightbulb for realization). " +
      "Body language reinforces the meaning. White background."
    )
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the interjection/response word \"" + word + "\" (" + en + ") at a glance.",
    "Use ISO-standard symbols inside speech bubbles — do NOT rely on culturally-specific gestures alone.",
    "",
    "[SCENE & ACTION]",
    profile.core,
    "White background, clean flat design.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "ISO symbols (✓, ✗, !, ?) inside speech bubbles ARE permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートM: 定型表現（SET_EXPR_FRAMES） ──
// 語ではなく「場面全体」を描く
function buildSetExpressionPrompt_(word, en) {

  const SET_EXPR_LOOKUP = {
    "おはようございます": {
      core: (
        "SCENE: morning setting with sunlight through a window (yellow-orange sunrise icon top-left). " +
        "TWO characters: one doing a slight bow greeting, the other responding with a smile."
      )
    },
    "こんにちは": {
      core: (
        "SCENE: daytime outdoors — bright sun icon at the top. " +
        "TWO characters meeting and bowing/waving to each other in a friendly daytime greeting."
      )
    },
    "こんばんは": {
      core: (
        "SCENE: evening setting — crescent moon and stars icon at the top. " +
        "TWO characters exchanging a bow or wave, warm interior lighting in the background."
      )
    },
    "いただきます": {
      core: (
        "SCENE: dining table with a simple meal (bowl/plate with steam rising). " +
        "Person(s) in HANDS-TOGETHER prayer/gratitude gesture before eating. " +
        "Chopsticks + fork icon or steam cloud above the food."
      )
    },
    "ごちそうさまでした": {
      core: (
        "SCENE: dining table with EMPTY clean plates (meal is finished). " +
        "Person(s) in hands-together gratitude gesture after the meal. " +
        "Empty bowl with a satisfied expression — contrasts with the full plate of 'itadakimasu'."
      )
    },
    "よろしくおねがいします": {
      core: (
        "Two characters bowing toward each other (formal Japanese greeting bow). " +
        "A small business card icon being exchanged between them, " +
        "OR a handshake gesture at the midpoint."
      )
    },
    "おつかれさまです": {
      core: (
        "SCENE: end of work day. One character looking tired (slumped posture, sweat drop). " +
        "Another character offering an encouraging pat on the shoulder or extending a hand. " +
        "Clock icon showing late afternoon/end-of-day time."
      )
    },
    "おじゃまします": {
      core: (
        "SCENE: front door/entrance. VISITOR outside the open door in a slight bow posture. " +
        "HOST inside the door welcoming them. " +
        "An arrow showing the transition from outside to inside."
      )
    },
    "さようなら": {
      core: (
        "SCENE: departure — doorway or gate in the background. " +
        "TWO characters: one waving goodbye, the other turning to leave. " +
        "A dotted arrow pointing away to show departure direction."
      )
    },
    "すみません": {
      core: (
        "Person in a slight bow (45 degrees forward), hand slightly raised to attract attention. " +
        "A speech bubble with a '!' symbol showing they are calling out to someone."
      )
    },
  };

  const profile = SET_EXPR_LOOKUP[word] || {
    core: (
      "SCENE showing the social context for saying \"" + en + "\" in Japanese. " +
      "Include all three scene elements: physical environment, character positions, and action context. " +
      "TWO characters interacting in the appropriate social situation. " +
      "One character performing a culturally appropriate gesture. White background."
    )
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the fixed social phrase \"" + word + "\" (" + en + ") at a glance.",
    "Draw the entire SCENE — not just a word or symbol. Context is the meaning.",
    "",
    "[SCENE & ACTION]",
    profile.core,
    "White background with minimal scene elements. Clean flat design.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Scene context elements (sun, moon, table, door) ARE permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートN: 副詞（ADVERB_FRAMES） ──
// 4分類（程度・頻度・様態・時制）ごとに戦略を切り替える
// adverbType が空の場合は語彙から自動推定する
function buildAdverbPrompt_(word, en, adverbType) {

  // adverbType が未設定の場合、語彙から自動推定するフォールバック
  const ADVERB_TYPE_FALLBACK = {
    "とても": "degree",   "すごく": "degree",  "たいへん": "degree",
    "すこし": "degree",   "ちょっと": "degree", "あまり": "degree",
    "ぜんぜん": "degree",
    "いつも": "frequency", "よく": "frequency", "ときどき": "frequency",
    "たまに": "frequency", "めったに": "frequency", "まったく": "degree",
    "ゆっくり": "manner",  "はやく": "manner",  "しずかに": "manner",
    "もう": "temporal",   "まだ": "temporal",   "もうすぐ": "temporal",
  };

  const resolvedType = (adverbType || ADVERB_TYPE_FALLBACK[word] || "degree").toLowerCase();

  let sceneCore = "";
  switch (resolvedType) {

    case "frequency":
      sceneCore = (
        "Strategy: CALENDAR_GRID — show a 7-cell weekly calendar grid. " +
        "Frequency indicator for \"" + en + "\": " +
        "  'always/every day' → ALL 7 cells filled with the same activity icon + ∞ loop arrow below. " +
        "  'often' → 5-6 cells filled, 1-2 empty. " +
        "  'sometimes' → 2-3 randomly placed cells filled, rest empty/gray. " +
        "  'rarely' → only 1 cell filled, rest empty with gray crosshatching. " +
        "Choose the appropriate fill density for \"" + en + "\". " +
        "ANCHOR: a small jogging person icon at the top-left to show what activity is being tracked. " +
        "White background, no text."
      );
      break;

    case "manner":
      sceneCore = (
        "Strategy: MOTION_COMPARISON — show a person performing an action, " +
        "with motion trail lines calibrated to indicate \"" + en + "\". " +
        "  'slowly/gently' → 1-2 thin, widely-spaced trail lines, long gradual arc. " +
        "  'quickly/fast' → 5-8 dense bold speed lines + 2-3 ghost motion trails. " +
        "  'quietly/softly' → person tiptoeing, minimal or no motion lines, 'Shhh' arc near feet. " +
        "ANCHOR: a walking or running person silhouette. White background, no text."
      );
      break;

    case "temporal":
      sceneCore = (
        "Strategy: TIMELINE — show a short horizontal timeline from left (past) to right (future/now). " +
        "For \"" + en + "\": " +
        "  'already' → a green checkmark stamp sits LEFT of the 'now' marker. Person in relaxed posture. " +
        "  'not yet' → an empty dashed circle sits RIGHT of the 'now' marker. Person in waiting posture. " +
        "  'soon' → a small clock/timer icon with an arrow pointing just right of the 'now' marker. " +
        "White background, no text."
      );
      break;

    case "degree":
    default:
      sceneCore = (
        "Strategy: DEGREE_METER — show an anchor object with a vertical scale bar (degree meter) beside it. " +
        "For \"" + en + "\", position the needle/fill at the appropriate level: " +
        "  'very/extremely' → meter at 90-100%, 3-5 radiating emphasis lines around the anchor object. " +
        "  'a little/slightly' → meter at 25-35%, only 1 thin emphasis line. " +
        "  'not very' → meter at 20-30% with a light diagonal line across the bar. " +
        "  'not at all' → meter at 0% with a bold red slash across the bar. " +
        "ANCHOR: a person reacting to hot soup (universal degree anchor). White background, no text."
      );
      break;
  }

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the adverb \"" + word + "\" (" + en + ") at a glance.",
    "CRITICAL: The adverb cannot stand alone. An ANCHOR subject (the thing being modified) MUST be present.",
    "",
    "[SCENE & ACTION]",
    sceneCore,
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Scale bars, calendar grids, timeline markers, and motion lines ARE permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートO: 助数詞（COUNTER_FRAMES） ──
// 物体カテゴリ × 数量の組み合わせで意味を伝える
function buildCounterPrompt_(word, en) {

  // 助数詞の種別と代表物体を定義
  const COUNTER_LOOKUP = {
    "ほん": { objectType: "long thin objects (pencils, bottles, or similar elongated items)", arrangement: "side by side vertically" },
    "本":   { objectType: "long thin objects (pencils, bottles, or similar elongated items)", arrangement: "side by side vertically" },
    "まい": { objectType: "flat thin objects (sheets of paper, stamps, or similar flat items)", arrangement: "fanned out showing multiple layers" },
    "枚":   { objectType: "flat thin objects (sheets of paper, stamps, or similar flat items)", arrangement: "fanned out showing multiple layers" },
    "さつ": { objectType: "bound books or notebooks (spines visible)", arrangement: "in a small stack or row" },
    "冊":   { objectType: "bound books or notebooks (spines visible)", arrangement: "in a small stack or row" },
    "ひき": { objectType: "small animals (cats, fish, or similar small creatures)", arrangement: "in a row" },
    "匹":   { objectType: "small animals (cats, fish, or similar small creatures)", arrangement: "in a row" },
    "とう": { objectType: "large animals (horses or cattle, simplified silhouettes)", arrangement: "in a row with scale cues" },
    "頭":   { objectType: "large animals (horses or cattle, simplified silhouettes)", arrangement: "in a row with scale cues" },
    "だい": { objectType: "machines or vehicles (cars, bicycles, or computers)", arrangement: "in a canonical view row" },
    "台":   { objectType: "machines or vehicles (cars, bicycles, or computers)", arrangement: "in a canonical view row" },
    "こ":   { objectType: "small round objects (apples, eggs, or similar items)", arrangement: "in a natural grouping" },
    "個":   { objectType: "small round objects (apples, eggs, or similar items)", arrangement: "in a natural grouping" },
    "はい": { objectType: "cups or bowls of liquid/food (with steam if hot)", arrangement: "in a row" },
    "杯":   { objectType: "cups or bowls of liquid/food (with steam if hot)", arrangement: "in a row" },
  };

  const profile = COUNTER_LOOKUP[word] || {
    objectType: "objects appropriate for the counter \"" + en + "\"",
    arrangement: "in a clear row or grouping",
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the counter suffix \"" + word + "\" (" + en + ") at a glance.",
    "The CATEGORY of object being counted is the core meaning — not just the number.",
    "",
    "[SCENE & ACTION]",
    "Display 3 " + profile.objectType + ", arranged " + profile.arrangement + ".",
    "The objects fill 70% of the frame.",
    "Bottom-right corner: a counter badge showing [small icon of the object × 3].",
    "All objects identical and clearly rendered. Solid white background.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "A simple [icon × N] counter badge IS permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートP: 時間語彙（TIME_FRAMES） ──
// 空間的時間写像を応用。テキストなしでカレンダー・時計・タイムラインを使う
// timeSubtype が空の場合は語彙から自動推定する
function buildTimePrompt_(word, en, timeSubtype) {

  // timeSubtype が未設定の場合、語彙から自動推定
  const TIME_SUBTYPE_FALLBACK = {
    "時": "clock",    "分": "clock",    "半": "clock",    "ごろ": "clock",
    "何時": "clock",
    "月曜日": "weekday", "火曜日": "weekday", "水曜日": "weekday",
    "木曜日": "weekday", "金曜日": "weekday", "土曜日": "weekday", "日曜日": "weekday",
    "何曜日": "weekday",
    "一月": "month",  "二月": "month",  "三月": "month",  "四月": "month",
    "五月": "month",  "六月": "month",  "七月": "month",  "八月": "month",
    "九月": "month",  "十月": "month",  "十一月": "month", "十二月": "month",
    "何月": "month",
    "春": "season",   "夏": "season",   "秋": "season",   "冬": "season",
    "今日": "relative", "明日": "relative", "あした": "relative",
    "昨日": "relative", "きのう": "relative",
    "来週": "relative", "先週": "relative", "再来週": "relative",
    "来月": "relative", "先月": "relative", "今月": "relative",
    "今年": "relative", "来年": "relative", "去年": "relative",
    "朝": "timeofday", "昼": "timeofday", "夜": "timeofday", "夕方": "timeofday",
    "午前": "timeofday", "午後": "timeofday",
    "毎日": "relative", "毎週": "relative", "毎月": "relative",
  };

  const resolvedSubtype = (timeSubtype || TIME_SUBTYPE_FALLBACK[word] || "clock").toLowerCase();

  let sceneCore = "";
  switch (resolvedSubtype) {

    case "weekday":
      sceneCore = (
        "Strategy: WEEKDAY_BAR — draw a 7-cell horizontal calendar bar (Mon through Sun). " +
        "Each cell contains a nature-element pictogram (NO text): " +
        "Mon=crescent moon icon, Tue=flame icon, Wed=water drop icon, Thu=tree icon, " +
        "Fri=coin/star icon, Sat=earth mound icon, Sun=sun circle icon. " +
        "The target day cell for \"" + en + "\" is highlighted in gold. " +
        "All other cells in light gray. White background."
      );
      break;

    case "month":
      sceneCore = (
        "Strategy: CALENDAR_WHEEL — draw a circular wheel divided into 12 equal sectors. " +
        "The target month sector for \"" + en + "\" is highlighted in gold. " +
        "Inside the highlighted sector: a tiny seasonal symbol appropriate for that month " +
        "(e.g., snowflake for Jan-Feb, cherry blossom for Mar-Apr, sunflower for Jul-Aug, " +
        "maple leaf for Oct-Nov). Other sectors in light gray. White background."
      );
      break;

    case "season":
      sceneCore = (
        "Strategy: SEASON_WHEEL — draw a circular 4-quadrant wheel: " +
        "TOP-LEFT Spring (pink #FFB7C5): cherry blossom petals. " +
        "TOP-RIGHT Summer (gold #FFD700): sunflower. " +
        "BOTTOM-RIGHT Autumn (brown #D2691E): maple leaf. " +
        "BOTTOM-LEFT Winter (light blue #87CEEB): snowflake. " +
        "The target season sector for \"" + en + "\" is at 100% opacity. " +
        "All other sectors at 40% opacity. White background."
      );
      break;

    case "relative":
      sceneCore = (
        "Strategy: RELATIVE_TIMELINE — draw a 3-cell horizontal calendar grid. " +
        "CENTER cell (today/this week/this month): outlined in gold with a downward pointer. " +
        "LEFT cell (yesterday/last week/last month): light blue with a leftward arrow from center. " +
        "RIGHT cell (tomorrow/next week/next month): light green with a rightward arrow from center. " +
        "Highlight the cell that corresponds to \"" + en + "\". " +
        "For weekly view, each cell shows 7 small squares. White background."
      );
      break;

    case "timeofday":
      sceneCore = (
        "Strategy: DAY_ARC — draw a semicircular arc representing the day cycle. " +
        "Position a sun or moon icon on the arc for \"" + en + "\": " +
        "Morning (朝): sun icon at lower-left on the arc, orange rays. " +
        "Noon (昼): sun icon at the apex (top center) of the arc, bright gold. " +
        "Evening (夕方): sun icon at lower-right, dim orange. " +
        "Night (夜): moon and stars icon, dark blue background. " +
        "午前 (AM): left half of the arc filled in gold; 午後 (PM): right half filled in indigo. " +
        "White background."
      );
      break;

    case "clock":
    default:
      sceneCore = (
        "Strategy: CONCEPT_CLOCK — draw a clock face in muted neutral gray at 70% opacity " +
        "(this indicates it represents the TIME CONCEPT, not a physical clock object). " +
        "Hour hand and minute hand pointing to the time indicated by \"" + en + "\" " +
        "highlighted in bold cyan. " +
        "If approximate (〜ごろ): add 2-3 concentric fuzzy ripple arcs around the hand tip " +
        "to show time ambiguity. " +
        "White background."
      );
      break;
  }

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the time word \"" + word + "\" (" + en + ") at a glance.",
    "Use calendar grids, clock faces, or timelines — NEVER text to convey time.",
    "",
    "[SCENE & ACTION]",
    sceneCore,
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
    "Calendar grids, clock hands, arcs, and directional arrows ARE permitted.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートQ: 交通手段（TRANSPORT_FRAMES） ──
// JIS Z 8210 準拠。類似乗り物の識別シグネチャーを厳守する
function buildTransportPrompt_(word, en) {

  const TRANSPORT_LOOKUP = {
    "電車":     {
      view: "true side profile",
      signatures: (
        "MANDATORY identification signatures: " +
        "(1) pantograph visible on roof, (2) overhead catenary wire above the train, " +
        "(3) ballast track (gravel bed with rail sleepers) beneath wheels. " +
        "These THREE elements together distinguish 電車 from shinkansen and subway."
      )
    },
    "新幹線":   {
      view: "true side profile",
      signatures: (
        "MANDATORY identification signatures: " +
        "(1) long aerodynamic nose (duck-bill shape), " +
        "(2) NO overhead pantograph visible (high-speed), " +
        "(3) elevated concrete viaduct track beneath. " +
        "These THREE elements distinguish 新幹線 from 電車."
      )
    },
    "地下鉄":   {
      view: "true side profile inside tunnel",
      signatures: (
        "MANDATORY identification signatures: " +
        "(1) semicircular dark tunnel arch framing the train, " +
        "(2) dark tunnel background (no sky), " +
        "(3) NO overhead wire or pantograph visible. " +
        "These THREE elements distinguish 地下鉄 from 電車."
      )
    },
    "バス":     {
      view: "3/4 front-side angle",
      signatures: (
        "Large rectangular body, front windshield, side windows in a row, " +
        "clearly visible bus stop sign in the background, " +
        "a passenger boarding at the front door."
      )
    },
    "タクシー": {
      view: "3/4 front-side angle",
      signatures: (
        "MANDATORY: roof-mounted 'andon' (行燈) illuminated sign (rectangular lamp on roof), " +
        "checker stripe pattern along the lower body, " +
        "sedan body shape with driver visible through windshield."
      )
    },
    "じてんしゃ": {
      view: "true side profile",
      signatures: (
        "Classic diamond frame (two triangles clearly visible), " +
        "two equal-size wheels, pedals and crank arm visible. " +
        "Optional: rider silhouette astride the saddle, leaning forward slightly."
      )
    },
    "自転車":   {
      view: "true side profile",
      signatures: (
        "Classic diamond frame (two triangles clearly visible), " +
        "two equal-size wheels, pedals and crank arm visible. " +
        "Optional: rider silhouette astride the saddle."
      )
    },
    "ひこうき": {
      view: "side view, slightly from below",
      signatures: (
        "Jet engines visible under the wings (cylindrical nacelles), " +
        "vertical and horizontal tail fins clearly shown, " +
        "a rising arc trajectory going toward upper right."
      )
    },
    "飛行機":   {
      view: "side view, slightly from below",
      signatures: (
        "Jet engines visible under the wings (cylindrical nacelles), " +
        "vertical and horizontal tail fins clearly shown, " +
        "a rising arc trajectory going toward upper right."
      )
    },
    "ふね": {
      view: "true side profile",
      signatures: "Water waves beneath the hull, smokestack with exhaust trail above, waterline clearly visible on the hull."
    },
    "船":   {
      view: "true side profile",
      signatures: "Water waves beneath the hull, smokestack with exhaust trail above, waterline clearly visible on the hull."
    },
  };

  const profile = TRANSPORT_LOOKUP[word] || {
    view: "canonical side profile or 3/4 view",
    signatures: "Most distinctive identifying visual features of a " + en + " clearly rendered.",
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must INSTANTLY and UNAMBIGUOUSLY identify the vehicle \"" + word + "\" (" + en + ") at a glance.",
    "A learner must distinguish this vehicle from visually similar ones without any text clues.",
    "",
    "[SUBJECT & VIEW]",
    "Vehicle: " + en + " (" + word + "). View: " + profile.view + ".",
    "The vehicle fills 70-80% of the frame.",
    "",
    "[IDENTIFICATION SIGNATURES]",
    profile.signatures,
    "",
    "[AFFORDANCE — USAGE HINT]",
    "Embed the sense of boarding/using the vehicle: show a door open OR a person-silhouette " +
    "with one foot stepping in/onto the vehicle (showing 〜で行きます usage context).",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Functional cues (track, tunnel, wires) ARE permitted to aid identification.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートR: 家族語彙（FAMILY_FRAMES） ──
// ウチ（uchi）形とソト（soto）形で構図を完全に切り替える
function buildFamilyPrompt_(word, en, familyForm) {

  // familyForm が空の場合は語彙から自動判定
  // ウチ形: テキスト形式（父・母・兄・弟・姉・妹）
  // ソト形: 敬語形式（お父さん・お母さん・お兄さん・お姉さん・おじいさん・おばあさん）
  const UCHI_WORDS = new Set([
    "父", "母", "兄", "弟", "姉", "妹", "祖父", "祖母", "夫", "妻",
    "息子", "娘", "親", "家族"
  ]);
  const resolvedForm = (familyForm || (UCHI_WORDS.has(word) ? "uchi" : "soto")).toLowerCase();

  // 家族の役割・外見プロファイル
  const FAMILY_APPEARANCE = {
    "父":    "a middle-aged male figure (40s) in casual smart clothes",
    "お父さん": "a middle-aged male figure (40s) in casual smart clothes",
    "母":    "a middle-aged female figure (40s) in casual smart clothes",
    "お母さん": "a middle-aged female figure (40s) in casual smart clothes",
    "兄":    "a young adult male figure (20s), slightly taller",
    "お兄さん": "a young adult male figure (20s), slightly taller",
    "弟":    "a young boy figure, shorter than Ego",
    "おとうとさん": "a young boy figure, shorter than Ego",
    "姉":    "a young adult female figure (20s), slightly taller",
    "おねえさん": "a young adult female figure (20s), slightly taller",
    "妹":    "a young girl figure, shorter than Ego",
    "いもうとさん": "a young girl figure, shorter than Ego",
    "おじいさん": "an elderly male figure (60s-70s) in comfortable everyday clothes",
    "おばあさん": "an elderly female figure (60s-70s) in comfortable everyday clothes",
    "祖父":  "an elderly male figure (60s-70s) in comfortable everyday clothes",
    "祖母":  "an elderly female figure (60s-70s) in comfortable everyday clothes",
  };

  const appearance = FAMILY_APPEARANCE[word]
    || ("a family member appropriate for \"" + en + "\"");

  let sceneCore = "";
  if (resolvedForm === "uchi") {
    // ウチ形: 実線暖色バブル内にEgoと家族を共存させる
    sceneCore = (
      "Strategy: UCHI_BUBBLE — draw a warm solid-line circular bubble (semi-transparent orange #FFE0E0). " +
      "INSIDE the bubble: small Ego silhouette on the LEFT and " + appearance + " on the RIGHT, " +
      "both smiling and leaning slightly toward each other. " +
      "A small heart icon between them shows closeness (uchi = in-group). " +
      "OUTSIDE the bubble: plain white background — no other characters. " +
      "This is the HUMBLE/IN-GROUP form of the family term."
    );
  } else {
    // ソト形: EgoはバブルEXIT、相手家族は点線バブル内
    sceneCore = (
      "Strategy: SOTO_BUBBLE — draw TWO zones: " +
      "LEFT zone (outside any bubble): Ego character in a respectful bow posture (30-45 degrees forward), " +
      "with a small respect-arrow pointing toward the right zone. " +
      "RIGHT zone: a DASHED-line cool circle (soto zone, semi-transparent gray #E0E8F0) containing " +
      appearance + ". " +
      "Clear spatial distance between the two zones shows respect/formality. " +
      "This is the RESPECTFUL/OUT-GROUP form of the family term."
    );
  }

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the family term \"" + word + "\" (" + en + ") at a glance.",
    "CRITICAL: \"" + word + "\" is the " + (resolvedForm === "uchi" ? "IN-GROUP (uchi)" : "RESPECTFUL OUT-GROUP (soto)") +
    " form. The composition MUST visually encode this distinction.",
    "",
    "[SCENE & ACTION]",
    sceneCore,
    "White background, clean flat design.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Bubble borders (solid=uchi / dashed=soto) ARE mandatory for family terms.",
    "Do NOT use the same composition for uchi and soto forms of the same family role.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートS: 天気・自然現象（WEATHER_FRAMES） ──
// 名詞天気（環境が主役）と体感形容詞（キャラの生理反応が主役）を分離
function buildWeatherPrompt_(word, en) {

  const WEATHER_LOOKUP = {
    "はれ":   {
      core: (
        "A clear golden yellow sun icon with uniform rays filling the upper center. " +
        "Light blue sky background. No clouds. " +
        "Optional: person in short sleeves enjoying the sunshine in lower-foreground."
      )
    },
    "晴れ":   {
      core: (
        "A clear golden yellow sun icon with uniform rays filling the upper center. " +
        "Light blue sky background. No clouds. " +
        "Optional: person in short sleeves enjoying the sunshine in lower-foreground."
      )
    },
    "くもり": {
      core: (
        "Multiple overlapping gray cloud icons covering most of the frame. " +
        "No sun visible. Light gray background. " +
        "Clouds vary slightly in size to show depth."
      )
    },
    "曇り":   {
      core: (
        "Multiple overlapping gray cloud icons covering most of the frame. " +
        "No sun visible. Light gray background."
      )
    },
    "あめ":   {
      core: (
        "Dense parallel diagonal cyan rain streaks falling from top to bottom. " +
        "At the ground: multiple concentric ripple circles (water impact rings) in puddles showing ongoing rain. " +
        "Optional: umbrella-holding silhouette in background as scale reference."
      )
    },
    "雨":     {
      core: (
        "Dense parallel diagonal cyan rain streaks falling from top to bottom. " +
        "At the ground: multiple concentric ripple circles (water impact rings) in puddles. " +
        "Optional: umbrella-holding silhouette in background."
      )
    },
    "ゆき":   {
      core: (
        "Various sizes of white circles and 6-pointed snowflake icons falling from top. " +
        "A white snow accumulation layer building up on the ground. " +
        "Soft blue-gray background to enhance snow visibility."
      )
    },
    "雪":     {
      core: (
        "Various sizes of white circles and 6-pointed snowflake icons falling from top. " +
        "A white snow accumulation layer building up on the ground. " +
        "Soft blue-gray background."
      )
    },
    "かぜ":   {
      core: (
        "Parallel horizontal stream curves (wind lines) sweeping from left to right. " +
        "A single tree on the left side bending sharply to the right. " +
        "Scattered flying leaves (5-7 leaf icons) in the air moving rightward."
      )
    },
    "風":     {
      core: (
        "Parallel horizontal stream curves (wind lines) sweeping from left to right. " +
        "A single tree bending sharply to the right. " +
        "Scattered flying leaves (5-7 leaf icons) moving rightward."
      )
    },
    "たいふう": {
      core: (
        "Large spiral/swirl icon in the center (storm system). " +
        "Heavy rain streaks and bold wind stream lines. " +
        "A broken inside-out umbrella on the ground showing intensity. " +
        "Dramatic dark gray sky background."
      )
    },
    "台風":   {
      core: (
        "Large spiral/swirl icon in the center (storm system). " +
        "Heavy rain streaks and bold wind stream lines. " +
        "A broken inside-out umbrella on the ground showing intensity. " +
        "Dramatic dark gray sky background."
      )
    },
    "あつい": {
      core: (
        "A large distorted red sun icon at the top. " +
        "Person fanning themselves vigorously with a uchiwa fan, flushed cheeks (diagonal lines on cheeks), " +
        "sweat drops flying from forehead. " +
        "Warm reddish-orange ambient overlay in background."
      )
    },
    "暑い":   {
      core: (
        "A large distorted red sun icon at the top. " +
        "Person fanning themselves vigorously, flushed cheeks, sweat drops flying from forehead. " +
        "Warm reddish-orange ambient overlay."
      )
    },
    "さむい": {
      core: (
        "Blue-lavender cool background. " +
        "Person hugging themselves tightly (arms crossed over chest), hunched posture. " +
        "White breath vapor (2-3 wavy lines) from their mouth. " +
        "Double outline silhouette showing shivering."
      )
    },
    "寒い":   {
      core: (
        "Blue-lavender cool background. " +
        "Person hugging themselves tightly, hunched posture. " +
        "White breath vapor from mouth. Double outline silhouette showing shivering."
      )
    },
  };

  const profile = WEATHER_LOOKUP[word] || {
    core: (
      "Flat vector illustration showing the weather/natural phenomenon \"" + en + "\". " +
      "If it is a NOUN weather word (rain, snow, wind): show the environmental phenomenon as the main subject, " +
      "with a human silhouette in the background only as scale reference. " +
      "If it is an ADJECTIVE weather word (hot, cold): show a person's physiological reaction " +
      "as the main subject (sweating, shivering), with the weather source as background context. " +
      "White or weather-appropriate background."
    )
  };

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the weather word \"" + word + "\" (" + en + ") at a glance.",
    "",
    "[SCENE & ACTION]",
    profile.core,
    "Clean flat design.",
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Weather icons (raindrops, snowflakes, sun rays, wind lines) ARE mandatory for identification.",
    "Generate as if this is part of a unified educational brand style guide.",
  ].join("\n");
}


// ── テンプレートT: 感覚語彙（SENSORY_FRAMES） ──
// 能動（見る/聞く）vs 受動（見える/聞こえる）vs 放出（〜がする）を矢印方向で区別する
function buildSensoryPrompt_(word, en, perceptionType) {

  // perceptionType が空の場合は語彙から自動推定
  const PERCEPTION_TYPE_FALLBACK = {
    "みます":     "active",  "見ます":     "active",
    "ききます":   "active",  "聞きます":   "active",
    "みえます":   "passive", "見えます":   "passive",
    "きこえます": "passive", "聞こえます": "passive",
    "においがします":  "emission",
    "おとがします":    "emission",
    "あじがします":    "emission",
    "においがします":  "emission",
    "〜がします": "emission",
  };

  const resolvedType = (perceptionType || PERCEPTION_TYPE_FALLBACK[word] || "active").toLowerCase();

  let sceneCore = "";
  switch (resolvedType) {

    case "passive":
      sceneCore = (
        "Strategy: PASSIVE_RECEPTION — show SPONTANEOUS/PASSIVE perception. " +
        "Person engaged in ANOTHER ACTIVITY (reading, walking, typing) facing AWAY from the sensory source. " +
        "BACKGROUND: the sensory source (e.g., a window showing Mt. Fuji for 見える; " +
        "birds outside a window for 聞こえる). " +
        "Semi-transparent pastel signal lines (light cone for vision, concentric sound arcs for hearing) " +
        "flow PASSIVELY FROM the source TO the person's sense organ (eye or ear). " +
        "The person's expression: neutral — they are NOT actively focusing. " +
        "White background. " +
        "CRITICAL: arrows point FROM source TO person (passive inward flow)."
      );
      break;

    case "emission":
      sceneCore = (
        "Strategy: SENSORY_EMISSION — show spontaneous emission of sensory signals FROM a source object. " +
        "CENTER: the sensory source object (e.g., piano or alarm for sound; bread or flower for smell; " +
        "cake or candy for taste). " +
        "The signals RADIATE OUTWARD from the source: " +
        "  Sound: colorful music notes + concentric sound wave arcs radiating outward. " +
        "  Smell: 3 gently wavy semi-transparent pink/green aroma lines rising upward, " +
        "          with small sparkle stars floating nearby. " +
        "  Taste: person taking a bite, star/heart-shaped eyes, sparkle pops around mouth. " +
        "Optional: a nearby person with a neutral expression receiving the signal at their sense organ. " +
        "White background."
      );
      break;

    case "active":
    default:
      sceneCore = (
        "Strategy: ACTIVE_PERCEPTION — show INTENTIONAL/ACTIVE perception. " +
        "Person facing DIRECTLY toward the sensory target, fully oriented toward it. " +
        "  For VISION (見ます): eyes wide open, bold yellow light-beam lines shoot " +
        "FROM the person's eyes TO the viewed object. Forward-leaning posture. " +
        "  For HEARING (聞きます): person turning head toward the sound source, " +
        "hand cupped behind ear, a bold direct arrow from the sound source to their ear (active reception). " +
        "Target object clearly visible in the frame. " +
        "White background. " +
        "CRITICAL: the active attention vector points FROM person TO target (outward active focus)."
      );
      break;
  }

  return [
    "[PURPOSE]",
    "Create a vocabulary card illustration for Japanese language learning materials.",
    "The image must instantly communicate the perception verb \"" + word + "\" (" + en + ") at a glance.",
    "CRITICAL: The DIRECTION of the perception arrow is the core meaning.",
    "Active (見る/聞く): arrows go FROM person TO target.",
    "Passive (見える/聞こえる): signals flow FROM target TO person.",
    "Emission (〜がする): signals radiate OUTWARD from source.",
    "",
    "[SCENE & ACTION]",
    sceneCore,
    "",
    "[STYLE RECIPE — DO NOT CHANGE]",
    STYLE_RECIPE,
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Directional arrows and signal lines ARE mandatory for this vocab type.",
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

  // A:R 列を一括取得（v5.1: 補助列 O〜R を追加）
  // 列数は最低14（A〜N）、補助列がない場合も安全に処理する
  const lastCol = Math.max(sheet.getLastColumn(), 14);
  const readCols = Math.min(lastCol, 18); // 最大18列（A〜R）
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, readCols).getValues();
  const rows = [];

  data.forEach(function(row, i) {
    const word        = String(row[0]  || "").trim();  // A: word
    const reading     = String(row[1]  || "").trim();  // B: reading
    const en          = String(row[2]  || "").trim();  // C: en
    const vocabType   = String(row[5]  || "").trim();  // F: vocab_type
    const imageId     = String(row[6]  || "").trim();  // G: imageId
    const imageStatus = String(row[7]  || "").trim();  // H: imageStatus
    // v5.1 追加: 補助列（列が存在しない場合は空文字で安全処理）
    const familyForm      = row.length > 14 ? String(row[14] || "").trim() : "";  // O
    const adverbType      = row.length > 15 ? String(row[15] || "").trim() : "";  // P
    const timeSubtype     = row.length > 16 ? String(row[16] || "").trim() : "";  // Q
    const perceptionType  = row.length > 17 ? String(row[17] || "").trim() : "";  // R

    if (!word) return;
    rows.push({
      rowIndex:       i + 2,
      word:           word,
      reading:        reading,
      en:             en,
      vocabType:      vocabType,
      imageId:        imageId || ("word_" + word),
      imageStatus:    imageStatus,
      // 補助フィールド（v5.1）
      familyForm:     familyForm,      // "uchi" | "soto"
      adverbType:     adverbType,      // "degree" | "frequency" | "manner" | "temporal"
      timeSubtype:    timeSubtype,     // "clock" | "weekday" | "month" | "season" | "relative" | "timeofday"
      perceptionType: perceptionType,  // "active" | "passive" | "emission"
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
