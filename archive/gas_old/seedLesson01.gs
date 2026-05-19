/**
 * seedLesson01.gs  v1.1
 * ============================================================
 * lesson_01 の語彙17語・例文15件をスプレッドシートに投入する。
 *
 * 変更履歴：
 *   v1.0: 初版
 *   v1.1: imageId を vocab_* → word_* に統一（実装ライン側完了を受けて）
 *         isAnchor を lesson_01.json 確定値に修正
 *         （true: _001/p1:1-1、_008/p2:2-4、_014/p3:3-4 のみ）
 *
 * 前提：setupSpreadsheet.gs の setupAll() 実行済みであること。
 *
 * べき等設計：
 *   Vocabulary → word列（A列）でキー照合・既存行はスキップ
 *   Examples   → id列（A列）でキー照合・既存行はスキップ
 * ============================================================
 */

// ▼ setupSpreadsheet.gs と同じプロジェクトに置くこと（SPREADSHEET_ID 共有）

// ============================================================
// Vocabulary シートに lesson_01の17語を投入
// ============================================================
function seedVocabulary() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  if (!sheet) {
    console.error("❌ Vocabulary シートが見つかりません。setupAll() を先に実行してください。");
    return;
  }

  const existingWords = getExistingKeys(sheet, 1); // A列: word

  // カラム順:
  // A: word, B: reading, C: en, D: jlptLevel, E: pos, F: vocab_type
  // G: imageId, H: imageStatus, I: imageUrl
  // J: audioId, K: audioStatus, L: audioUrl
  // M: lessonRef, N: source
  const vocabData = [

    // ── 職業（Goi_List収録 / image: approved）──────────────────
    [
      "医者", "いしゃ", "doctor", "N5", "名詞", "person",
      "word_医者", "approved",
      "https://drive.google.com/uc?id=1cPNqVCE9yN86MoSmHl8c93lZJ_m2Hg-L",
      "word_医者", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "会社員", "かいしゃいん", "company employee", "N5", "名詞", "person",
      "word_会社員", "approved",
      "https://drive.google.com/uc?id=1ir_ehC66_O8wyThw6HnkyBM2952uw1db",
      "word_会社員", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "学生", "がくせい", "student", "N5", "名詞", "person",
      "word_学生", "approved",
      "https://drive.google.com/uc?id=1Yj33uWtHGy3cspUc7CDp8rkr-HiiWQub",
      "word_学生", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      // registry未登録 → Goi_List一括生成（④）で追加される
      "大学生", "だいがくせい", "university student", "N5", "名詞", "person",
      "word_大学生", "pending", "",
      "word_大学生", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "先生", "せんせい", "teacher", "N5", "名詞", "person",
      "word_先生", "approved",
      "https://drive.google.com/uc?id=1kaO3cq5VVapkRALMpjlTY59DPdKMJ6fP",
      "word_先生", "pending", "", "lesson_01", "lesson_import"
    ],

    // ── 国籍語彙（Goi_List未収録 / image: pending）──────────────
    // ⚠ 国名+人 の派生形はGoi_Listに独立収録なし。
    //   importFromLessonJson.gs（⑦）で画像生成タスクとして補完する。
    [
      "日本人", "にほんじん", "Japanese", "N5", "名詞", "person",
      "word_日本人", "pending", "",
      "word_日本人", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "中国人", "ちゅうごくじん", "Chinese", "N5", "名詞", "person",
      "word_中国人", "pending", "",
      "word_中国人", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "アメリカ人", "アメリカじん", "American", "N5", "名詞", "person",
      "word_アメリカ人", "pending", "",
      "word_アメリカ人", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "韓国人", "かんこくじん", "Korean", "N5", "名詞", "person",
      "word_韓国人", "pending", "",
      "word_韓国人", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "ブラジル人", "ブラジルじん", "Brazilian", "N5", "名詞", "person",
      "word_ブラジル人", "pending", "",
      "word_ブラジル人", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "ベトナム人", "ベトナムじん", "Vietnamese", "N5", "名詞", "person",
      "word_ベトナム人", "pending", "",
      "word_ベトナム人", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "スペイン人", "スペインじん", "Spanish", "N5", "名詞", "person",
      "word_スペイン人", "pending", "",
      "word_スペイン人", "pending", "", "lesson_01", "lesson_import"
    ],

    // ── 建物（Goi_List収録）─────────────────────────────────────
    [
      // registryに word_病院 は登録済みだが imageUrl:null（Goi_List生成待ち）
      "病院", "びょういん", "hospital", "N5", "名詞", "building",
      "word_病院", "pending", "",
      "word_病院", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "学校", "がっこう", "school", "N5", "名詞", "building",
      "word_学校", "approved",
      "https://drive.google.com/uc?id=1LXAQnSjEi51XszDgn-Q3T3jyLtD3z0AV",
      "word_学校", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "銀行", "ぎんこう", "bank", "N5", "名詞", "building",
      "word_銀行", "approved",
      "https://drive.google.com/uc?id=1nb__rAgExUL8hika2kO6Qi0vEKUbmyGF",
      "word_銀行", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "大学", "だいがく", "university", "N5", "名詞", "building",
      "word_大学", "approved",
      "https://drive.google.com/uc?id=1O0-ekEsDTXUUc2MGjhL7ftpfmjS2SM_h",
      "word_大学", "pending", "", "lesson_01", "lesson_import"
    ],
    [
      "デパート", "デパート", "department store", "N5", "名詞", "building",
      "word_デパート", "approved",
      "https://drive.google.com/uc?id=1gUyeTYx80SiUMAFArJf4tV3MLCWWhnIj",
      "word_デパート", "pending", "", "lesson_01", "lesson_import"
    ],
  ];

  let addedCount = 0, skippedCount = 0;
  for (const row of vocabData) {
    const word = row[0];
    if (existingWords.has(word)) {
      console.log(`  ⏭ スキップ（既存）: ${word}`);
      skippedCount++;
      continue;
    }
    sheet.appendRow(row);
    console.log(`  ✅ 追加: ${word}`);
    addedCount++;
  }

  console.log(`\n Vocabulary 投入完了: ${addedCount}件追加 / ${skippedCount}件スキップ`);
  writeLog("seed", "seedVocabulary", `✅ ${addedCount}追加/${skippedCount}スキップ`, "", "");
}

// ============================================================
// Examples シートに lesson_01の15例文を投入
// ============================================================
function seedExamples() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Examples");
  if (!sheet) {
    console.error("❌ Examples シートが見つかりません。setupAll() を先に実行してください。");
    return;
  }

  const existingIds = getExistingKeys(sheet, 1); // A列: id

  // カラム順: id, lessonNo, patternId, sentence, sentenceEn, textToSpeak,
  //           audioStatus, audioUrl, isAnchor
  //
  // isAnchor 確定値（lesson_01.json 2026-05-15 申し送り）
  //   true  → _001（p1:1-1）、_008（p2:2-4）、_014（p3:3-4）
  //   false → それ以外の12件
  const examplesData = [

    // ── 文型① p1 ────────────────────────────────────────────────
    ["sentence_ex_L01_001", 1, "p1",
      "鈴木さんは先生です。",
      "Suzuki-san is a teacher.",
      "鈴木さんは先生です。",
      "pending", "", true],          // ★ p1 アンカー（1-1）

    ["sentence_ex_L01_002", 1, "p1",
      "リンさんは大学生です。",
      "Lin-san is a university student.",
      "リンさんは大学生です。",
      "pending", "", false],

    ["sentence_ex_L01_003", 1, "p1",
      "キムさんは会社員です。",
      "Kim-san is a company employee.",
      "キムさんは会社員です。",
      "pending", "", false],

    ["sentence_ex_L01_004", 1, "p1",
      "鈴木さんは日本人です。",
      "Suzuki-san is Japanese.",
      "鈴木さんは日本人です。",
      "pending", "", false],

    ["sentence_ex_L01_005", 1, "p1",
      "リンさんは中国人です。",
      "Lin-san is Chinese.",
      "リンさんは中国人です。",
      "pending", "", false],

    // ── 文型② p2 ────────────────────────────────────────────────
    ["sentence_ex_L01_006", 1, "p2",
      "リンさんですか。",
      "Is it Lin-san?",
      "リンさんですか。",
      "pending", "", false],         // 2-1

    ["sentence_ex_L01_007", 1, "p2",
      "はい、リンさんです。／いいえ、リンさんじゃありません。",
      "Yes, it's Lin-san. / No, it's not Lin-san.",
      "はい、リンさんです。いいえ、リンさんじゃありません。",
      "pending", "", false],         // 2-2

    ["sentence_ex_L01_008", 1, "p2",
      "先生ですか。→ はい、先生です。／いいえ、先生じゃありません。",
      "Are you a teacher? → Yes, I am. / No, I'm not.",
      "先生ですか。はい、先生です。いいえ、先生じゃありません。",
      "pending", "", true],          // ★ p2 アンカー（2-4）

    ["sentence_ex_L01_009", 1, "p2",
      "韓国人ですか。→ はい、韓国人です。／いいえ、韓国人じゃありません。",
      "Are you Korean? → Yes, I am. / No, I'm not.",
      "韓国人ですか。はい、韓国人です。いいえ、韓国人じゃありません。",
      "pending", "", false],         // 2-5

    ["sentence_ex_L01_010", 1, "p2",
      "だれですか。→ キムさんです。",
      "Who is it? → It's Kim-san.",
      "だれですか。キムさんです。",
      "pending", "", false],         // 2-3

    // ── 文型③ p3 ────────────────────────────────────────────────
    ["sentence_ex_L01_011", 1, "p3",
      "タノムさんは東西病院の医者です。",
      "Tanom-san is a doctor at Tozai Hospital.",
      "タノムさんは東西病院の医者です。",
      "pending", "", false],

    ["sentence_ex_L01_012", 1, "p3",
      "鈴木さんは東西学校の先生です。",
      "Suzuki-san is a teacher at Tozai School.",
      "鈴木さんは東西学校の先生です。",
      "pending", "", false],

    ["sentence_ex_L01_013", 1, "p3",
      "キムさんは東西銀行の会社員です。",
      "Kim-san is an employee at Tozai Bank.",
      "キムさんは東西銀行の会社員です。",
      "pending", "", false],

    ["sentence_ex_L01_014", 1, "p3",
      "リンさんは東西大学の学生です。",
      "Lin-san is a student at Tozai University.",
      "リンさんは東西大学の学生です。",
      "pending", "", true],          // ★ p3 アンカー（3-4・PDF p.6原典）

    ["sentence_ex_L01_015", 1, "p3",
      "キムさんは東西デパートの会社員です。",
      "Kim-san is an employee at Tozai Department Store.",
      "キムさんは東西デパートの会社員です。",
      "pending", "", false],
  ];

  let addedCount = 0, skippedCount = 0;
  for (const row of examplesData) {
    const id = row[0];
    if (existingIds.has(id)) {
      console.log(`  ⏭ スキップ（既存）: ${id}`);
      skippedCount++;
      continue;
    }
    sheet.appendRow(row);
    console.log(`  ✅ 追加: ${id}`);
    addedCount++;
  }

  console.log(`\n Examples 投入完了: ${addedCount}件追加 / ${skippedCount}件スキップ`);
  writeLog("seed", "seedExamples", `✅ ${addedCount}追加/${skippedCount}スキップ`, "", "");
}

// ============================================================
// まとめて実行する便利関数
// ============================================================
function seedAll() {
  console.log("=== lesson_01 シードデータ投入 開始 ===");
  seedVocabulary();
  seedExamples();
  console.log("=== lesson_01 シードデータ投入 完了 ===");
}

// ============================================================
// ユーティリティ（setupSpreadsheet.gs と共有）
// ============================================================
function getExistingKeys(sheet, colIndex) {
  const keys    = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return keys;
  const values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (const [val] of values) {
    if (val !== "" && val !== null) keys.add(String(val));
  }
  return keys;
}
