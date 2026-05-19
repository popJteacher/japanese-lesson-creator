/**
 * extractFromGoiList.gs  v1.0
 * ============================================================
 * Goi_List.pdf（語彙難易度リスト）を Drive から読み込み、
 * N5語彙をVocabularyシートへバッチ投入する。
 *
 * 対象ファイルの実態：
 *   - 拡張子は .pdf だが UTF-8 テキストファイル
 *   - 文字化け：U+46F3〜U+471D のひらがな → offset -0x1690 で修正
 *   - 構造：本体チャンク（No/word/reading/level/pos1/pos2）と
 *     語種チャンク（語種）が46行単位で交互に出現
 *
 * 実行関数:
 *   extractN5()         → N5（初級前半）の語彙を投入（通常使用）
 *   extractByLevel()    → TARGET_LEVELS で指定レベルを投入（N4追加時等）
 *   previewExtract()    → SSには書き込まず、解析結果をログに表示
 *   testGoiListRead()   → ファイル読み込みと文字修正のテスト
 *
 * ============================================================
 *  ⚠ 実行前に以下の設定値を入力してください
 * ============================================================
 */

const EXTRACT_SETTINGS = {
  // setupSpreadsheet.gs と同じ値を使用
  SPREADSHEET_ID:   "YOUR_SPREADSHEET_ID_HERE",

  // Drive上のGoi_List.pdfのファイルID
  // Drive URLの末尾 /d/{ここ}/view から取得
  GOI_LIST_FILE_ID: "YOUR_GOI_LIST_FILE_ID_HERE",

  // 抽出するレベル（複数指定可）
  // 1.初級前半 = N5（421語）
  // 2.初級後半 = N4（788語）
  TARGET_LEVELS: ["1.初級前半"],

  // ログ書き込みの有効/無効（false でもコンソールには出る）
  WRITE_LOG: true,
};

// ============================================================
// 難易度 → JLPT マッピング
// ============================================================
const LEVEL_TO_JLPT = {
  "1.初級前半": "N5",
  "2.初級後半": "N4",
  "3.中級前半": "N3",
  "4.中級後半": "N2",
  "5.上級前半": "N2",
  "6.上級後半": "N1",
};

// ============================================================
// エントリーポイント：N5のみ投入（通常の使用方法）
// ============================================================
function extractN5() {
  const settings = Object.assign({}, EXTRACT_SETTINGS, {
    TARGET_LEVELS: ["1.初級前半"],
  });
  runExtract_(settings);
}

// ============================================================
// エントリーポイント：EXTRACT_SETTINGS.TARGET_LEVELS を使用
// ============================================================
function extractByLevel() {
  runExtract_(EXTRACT_SETTINGS);
}

// ============================================================
// エントリーポイント：ドライラン（SSへの書き込みなし）
// ============================================================
function previewExtract() {
  const rawContent = readGoiListFile_(EXTRACT_SETTINGS.GOI_LIST_FILE_ID);
  const allEntries = parseGoiList_(rawContent);
  const targetEntries = filterByLevel_(allEntries, EXTRACT_SETTINGS.TARGET_LEVELS);

  console.log(`\n=== previewExtract ===`);
  console.log(`総エントリ数: ${allEntries.length}`);
  console.log(`対象レベル: ${EXTRACT_SETTINGS.TARGET_LEVELS.join(", ")}`);
  console.log(`抽出エントリ数: ${targetEntries.length}`);
  console.log(`\n--- サンプル（先頭15件）---`);
  targetEntries.slice(0, 15).forEach((e, i) => {
    console.log(
      `[${i + 1}] word="${e.word}" reading="${e.reading}" ` +
      `jlpt="${LEVEL_TO_JLPT[e.level]}" pos="${e.pos1}" type="${e.goiShurui}"`
    );
  });

  // レベル別集計
  console.log(`\n--- レベル別集計 ---`);
  const levelCount = {};
  allEntries.forEach(e => {
    levelCount[e.level] = (levelCount[e.level] || 0) + 1;
  });
  Object.keys(levelCount).sort().forEach(lv => {
    console.log(`  ${lv} (${LEVEL_TO_JLPT[lv] || "?"}): ${levelCount[lv]}語`);
  });
}

// ============================================================
// エントリーポイント：ファイル読み込みテスト
// ============================================================
function testGoiListRead() {
  console.log("=== testGoiListRead ===");
  try {
    const content = readGoiListFile_(EXTRACT_SETTINGS.GOI_LIST_FILE_ID);
    const lines = content.split("\n");
    console.log(`✅ ファイル読み込み成功`);
    console.log(`  総行数: ${lines.length}`);
    console.log(`  先頭5行:`);
    lines.slice(0, 5).forEach((l, i) => console.log(`    [${i}] ${l.substring(0, 70)}`));
    console.log(`  文字化け修正確認（あさって）:`);
    const line = lines.find(l => /アサッテ/.test(l));
    console.log(`    ${line ? line.trim() : "（見つからず）"}`);
  } catch (e) {
    console.error(`❌ エラー: ${e.message}`);
  }
}

// ============================================================
// メイン処理
// ============================================================
function runExtract_(settings) {
  const startTime = Date.now();
  console.log(`\n=== extractFromGoiList 開始 ===`);
  console.log(`対象レベル: ${settings.TARGET_LEVELS.join(", ")}`);

  // 1. スプレッドシートを開く
  const ss    = SpreadsheetApp.openById(settings.SPREADSHEET_ID);
  const vocab = ss.getSheetByName("Vocabulary");
  if (!vocab) {
    throw new Error("Vocabularyシートが見つかりません。setupAll() を先に実行してください。");
  }

  // 2. Goi_List を読み込む
  console.log("▶ Goi_List.pdf を読み込み中...");
  const rawContent = readGoiListFile_(settings.GOI_LIST_FILE_ID);
  console.log(`  ✅ 読み込み完了（${rawContent.length.toLocaleString()} 文字）`);

  // 3. パース
  console.log("▶ パース中...");
  const allEntries    = parseGoiList_(rawContent);
  const targetEntries = filterByLevel_(allEntries, settings.TARGET_LEVELS);
  console.log(`  全エントリ数: ${allEntries.length}`);
  console.log(`  抽出対象: ${targetEntries.length}語`);

  // 4. 既存 word 列を取得して重複チェック用 Set を作成
  console.log("▶ 重複チェック中...");
  const existingWords = getExistingWords_(vocab);
  console.log(`  既存エントリ数: ${existingWords.size}`);

  // 5. 差分（未登録）のみ抽出
  const newEntries = targetEntries.filter(e => !existingWords.has(e.word));
  const skipped    = targetEntries.length - newEntries.length;
  console.log(`  スキップ（重複）: ${skipped}語`);
  console.log(`  新規追加対象: ${newEntries.length}語`);

  if (newEntries.length === 0) {
    console.log("✅ 追加すべき新規語彙はありません。処理を終了します。");
    if (settings.WRITE_LOG) {
      writeLog("extract_goi", "N/A", "✅ 追加なし（全スキップ）", "", "");
    }
    return;
  }

  // 6. Vocabulary シートへバッチ書き込み
  console.log("▶ Vocabulary シートへ書き込み中...");
  const rowsWritten = appendVocabRows_(vocab, newEntries);

  // 7. 結果サマリー
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const summary = `追加=${rowsWritten}語 スキップ=${skipped}語 / ${elapsed}s`;
  console.log(`\n✅ 完了: ${summary}`);
  console.log(`   対象レベル: ${settings.TARGET_LEVELS.map(l => LEVEL_TO_JLPT[l] || l).join(", ")}`);

  if (settings.WRITE_LOG) {
    writeLog("extract_goi", settings.TARGET_LEVELS.join(","), "✅ 完了", "", summary);
  }
}

// ============================================================
// Goi_List ファイルを Drive から読み込み、文字化けを修正して返す
// ============================================================
function readGoiListFile_(fileId) {
  const file    = DriveApp.getFileById(fileId);
  const raw     = file.getBlob().getDataAsString("UTF-8");
  return fixGoiListEncoding_(raw);
}

/**
 * Goi_List 固有の文字化けを修正する。
 *
 * PDF生成時のエンコーディング問題で、ひらがなの一部が
 * U+46F3〜U+471D に変換されている。全て offset 0x1690 を引けば
 * 正しいひらがな（U+3063〜U+308D）に戻る。
 *
 * 対象文字例：
 *   U+46F3 (䛳) → っ (U+3063)
 *   U+46FA (䛺) → な (U+306A)
 *   U+471B (䜛) → る (U+308B)
 */
function fixGoiListEncoding_(text) {
  // \u46F3-\u471D の範囲を一括置換（regex + charCodeAt で高速処理）
  return text.replace(/[\u46F3-\u471D]/g, function(c) {
    return String.fromCharCode(c.charCodeAt(0) - 0x1690);
  });
}

// ============================================================
// Goi_List テキストをパースして全エントリを返す
//
// ファイル構造（46行単位のチャンクが交互に出現）：
//   本体チャンク: No  word  reading  level  pos1  pos2
//   語種チャンク: goiShurui（和語/漢語/外来語/混種語）
//
// チャンク判定：
//   先頭行が数字で始まる → 本体チャンク
//   先頭行が「語種 更新情報」or 和語/漢語等 → 語種チャンク
// ============================================================
function parseGoiList_(content) {
  const rawLines = content.split("\n");

  // 空行でチャンクに分割（改行コード差異に対応：CR+LF / LF 両方）
  const chunks   = [];
  let current    = [];

  rawLines.forEach(function(line) {
    const trimmed = line.replace(/\r$/, "").trimEnd();
    if (trimmed === "") {
      if (current.length > 0) {
        chunks.push(current);
        current = [];
      }
    } else {
      current.push(trimmed);
    }
  });
  if (current.length > 0) chunks.push(current);

  // チャンク種別判定
  function isMainChunk(chunk) {
    if (chunk.length === 0) return false;
    const first = chunk[0];
    // ヘッダー行 "No 標準的な表記 ..." or データ行（数字始まり）
    if (first.startsWith("No ")) return true;
    const firstToken = first.split(" ")[0];
    return /^\d+$/.test(firstToken);
  }

  // 本体チャンクと語種チャンクを順番どおりにペアリング
  // → 本体チャンクが出たら mainQueue に積む
  // → 語種チャンクが出たら mainQueue の先頭と対応付ける
  const mainQueue = [];
  const goiPairs  = [];  // [{mainRows: [...], goiRows: [...]}]

  chunks.forEach(function(chunk) {
    if (isMainChunk(chunk)) {
      mainQueue.push(chunk);
    } else {
      // 語種チャンク
      const main = mainQueue.shift();
      goiPairs.push({ mainChunk: main || [], goiChunk: chunk });
    }
  });

  // mainQueue に残ったチャンク（末尾に語種チャンクが対応しない場合）
  mainQueue.forEach(function(chunk) {
    goiPairs.push({ mainChunk: chunk, goiChunk: [] });
  });

  // エントリの生成
  const entries = [];

  goiPairs.forEach(function(pair) {
    const mainRows = parseMainChunk_(pair.mainChunk);
    const goiRows  = parseGoiChunk_(pair.goiChunk);

    mainRows.forEach(function(row, i) {
      row.goiShurui = (goiRows[i] !== undefined) ? goiRows[i] : "";
      entries.push(row);
    });
  });

  return entries;
}

// 本体チャンクをパースして行オブジェクトの配列を返す
function parseMainChunk_(chunk) {
  const rows = [];
  chunk.forEach(function(line) {
    // ヘッダー行はスキップ
    if (line.startsWith("No ")) return;
    const firstToken = line.split(" ")[0];
    if (!/^\d+$/.test(firstToken)) return;

    // フィールド分割（最大5回 = 6要素）
    // フォーマット: No  word  reading  level  pos1  [pos2...]
    const parts = line.split(" ", 6);
    if (parts.length < 4) return;

    // pos2 は残り全体（"and" を含む複合品詞が入る）
    // → split(/ /, 6) の6番目は先頭5分割後の残り全部ではなく
    //   6番目のスペース区切りトークンのみなので、indexOf で取る
    const pos2Start = nthIndexOf_(line, " ", 5);
    const pos2      = pos2Start >= 0 ? line.substring(pos2Start + 1).trim() : "";

    rows.push({
      no:       parts[0],
      word:     parts[1],
      reading:  parts[2],
      level:    parts[3],
      pos1:     parts[4] || "",
      pos2:     pos2,
      goiShurui: "",  // 後から語種チャンクで埋める
    });
  });
  return rows;
}

// 語種チャンクをパースして語種文字列の配列を返す
function parseGoiChunk_(chunk) {
  const rows = [];
  chunk.forEach(function(line) {
    if (line === "語種 更新情報") return; // ヘッダー行スキップ
    const trimmed = line.trim();
    if (trimmed === "" || trimmed === "更新情報") return;
    rows.push(trimmed);
  });
  return rows;
}

// N番目のスペース位置を返すヘルパー（0-indexed）
function nthIndexOf_(str, ch, n) {
  let pos = -1;
  for (let i = 0; i < n; i++) {
    pos = str.indexOf(ch, pos + 1);
    if (pos === -1) return -1;
  }
  return pos;
}

// ============================================================
// 指定レベルでフィルタリング
// ============================================================
function filterByLevel_(entries, targetLevels) {
  const levelSet = new Set(targetLevels);
  return entries.filter(e => levelSet.has(e.level));
}

// ============================================================
// Vocabulary シートの既存 word 列を Set<string> で返す
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
// 新規エントリを Vocabulary シートへバッチ書き込み
//
// 列構成（setupSpreadsheet.gs に準拠）:
//   A: word          B: reading（ひらがな）  C: en（空）
//   D: jlptLevel     E: pos                  F: vocab_type（空）
//   G: imageId       H: imageStatus          I: imageUrl（空）
//   J: audioId       K: audioStatus          L: audioUrl（空）
//   M: lessonRef（空） N: source
// ============================================================
function appendVocabRows_(sheet, entries) {
  if (entries.length === 0) return 0;

  const rows = entries.map(function(e) {
    const wordKey   = "word_" + e.word;
    const jlpt      = LEVEL_TO_JLPT[e.level] || e.level;
    const reading   = katakanaToHiragana_(e.reading);
    const pos       = normalizePOS_(e.pos1);

    return [
      e.word,        // A: word
      reading,       // B: reading（カタカナ→ひらがな変換済み）
      "",            // C: en（classifyAndTranslate.gs で付与）
      jlpt,          // D: jlptLevel
      pos,           // E: pos
      "",            // F: vocab_type（classifyAndTranslate.gs で付与）
      wordKey,       // G: imageId
      "pending",     // H: imageStatus
      "",            // I: imageUrl
      wordKey,       // J: audioId
      "pending",     // K: audioStatus
      "",            // L: audioUrl
      "",            // M: lessonRef
      "goi_list",    // N: source
    ];
  });

  // バッチ書き込み（1回のAPI呼び出しで全行を投入）
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 14).setValues(rows);
  console.log(`  ✅ ${rows.length}行 を行${startRow}〜${startRow + rows.length - 1} に書き込みました`);
  return rows.length;
}

// ============================================================
// カタカナ → ひらがな 変換
// U+30A1（ァ）〜 U+30F6（ヶ）は offset -0x60 でひらがなに変換できる
// ============================================================
function katakanaToHiragana_(str) {
  return str.replace(/[\u30A1-\u30F6]/g, function(c) {
    return String.fromCharCode(c.charCodeAt(0) - 0x60);
  });
}

// ============================================================
// 品詞の正規化
// Goi_List の pos1 値を Vocabulary シートの標準形式に変換
// ============================================================
function normalizePOS_(pos1) {
  const map = {
    "動詞1類": "動詞",   // 五段活用
    "動詞2類": "動詞",   // 一段活用
    "動詞3類": "動詞",   // する・くる
    "イ形容詞": "形容詞",
    "ナ形容詞": "形容詞",
  };
  return map[pos1] || pos1;
}

// ============================================================
// ログ書き込み（setupSpreadsheet.gs の writeLog() を利用）
// 同一GASプロジェクト内で共有されるため直接呼び出し可能
// ============================================================
// ※ writeLog() は setupSpreadsheet.gs に定義済みのため、
//   ここでは再定義しない。
