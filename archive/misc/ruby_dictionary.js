/**
 * ruby_dictionary.js
 * -----------------------------------------------------------------------------
 * 全課共通のふりがな付与辞書(ふりがな系 SSOT)。
 * スライド/宿題HTML が参照する単一の真実の源(SSOT)。
 *
 * 生成元:
 *   - 第1課_宿題.html WORD_RUBY (プロトタイプ・7 人物語彙のみ)
 *   - 第1課_スライド.html ruby タグ実装(スライド全文の ruby パターン)
 *   - lesson_01.json v2.6 (人物名・組織名の正規ソース)
 *   - vocab_lesson1.json v1.1 (採用語彙 12 語の SSOT)
 *
 * 生成日: 2026-05-12 (Stage 1 タスク 5)
 *
 * 設計方針:
 *   - 案A: 単一の WORD_RUBY フラット辞書 + ヘルパー関数 3 つ(rubifyWord / rubifySentence / addEntries)
 *   - 第1課で必要な人物・語彙・組織を全網羅
 *   - 第2課以降はオプショナルでセクションを追加(addEntries で動的拡張可)
 *   - 長いキーから優先マッチ(複合語の優先処理)
 *   - ブラウザ(window.RubyDict)と Node.js(module.exports)の両対応
 *     → C+B ハイブリッド方針(SKILL.md v1.4)で flow_synthesizer.js と同じ純粋関数化
 *
 * 重要(SKILL.md v1.4 §伝播チェーンルール):
 *   - 起点 B(vocab_lessonN.json の word/reading 変更)時の下流確認対象。
 *   - 本ファイルを変更したらナレッジ再アップロード必須(shared/ 配下 = 全 session 影響)。
 *
 * 参照資料:
 *   - SKILL.md v1.4 §C+B ハイブリッド自動化方針
 *   - handoff_phase2_D_template_design_162_features.md §機能 #33 (WORD_RUBY 辞書)
 *   - 横断論点α: 学習者向け表示のみハイブリッド分かち書き(本辞書は単語単位のため適合)
 *
 * 採用しなかった代替案:
 *   - 案B(課別ファイル分割: ruby_lesson1.js / ruby_lesson2.js)
 *     → 重複と維持コスト増のため不採用。本ファイル内のセクション分けで対応。
 *   - 案C(Kuromoji等の形態素解析エンジン使用)
 *     → 教材で確実に出る語彙数(全 30 課で〜500 語想定)では辞書ベースで十分。
 *       バンドルサイズと初期化コストの増加を避けるため不採用。
 */
'use strict';

// ============================================================================
// SECTION 1: 第1課で登場する人物名
// ============================================================================
// 出典: lesson_01.json v2.6 examples + 第1課_スライド.html + 教案 docx
// 漢字を持つもののみ ruby を付与。カタカナ名はそのまま。
// ----------------------------------------------------------------------------
const PEOPLE_LESSON1 = {
  // 教科書原典・lesson_01 v2.6 で確定した人物名
  '田中さん': '<ruby>田中<rt>たなか</rt></ruby>さん',
  '鈴木さん': '<ruby>鈴木<rt>すずき</rt></ruby>さん',  // v2.6 で p1 例文に登場(教科書原典)
  'キムさん': 'キムさん',                              // カタカナ・v2.6 p2-3
  'リンさん': 'リンさん',                              // カタカナ
  'マリアさん': 'マリアさん',                          // カタカナ
  'ケリーさん': 'ケリーさん',                          // カタカナ
  // 教科書記号(Phase 1-F 以降の正規化)
  'Aさん': 'Aさん',
  'Bさん': 'Bさん',
};

// ============================================================================
// SECTION 2: 第1課の語彙(vocab_lesson1.json v1.1 SSOT・12 語)
// ============================================================================
// p1/p2 人物・職業(7 語) + p3 所属機関(5 語)
// 読みは vocab_lesson1.json v1.1 の reading をひらがな化(横断論点α 整合)。
// ----------------------------------------------------------------------------
const VOCAB_LESSON1 = {
  // p1/p2: 人物・職業(7 語)
  '医者': '<ruby>医者<rt>いしゃ</rt></ruby>',
  '男の人': '<ruby>男<rt>おとこ</rt></ruby>の<ruby>人<rt>ひと</rt></ruby>',
  '女の人': '<ruby>女<rt>おんな</rt></ruby>の<ruby>人<rt>ひと</rt></ruby>',
  '外国人': '<ruby>外国人<rt>がいこくじん</rt></ruby>',
  '会社員': '<ruby>会社員<rt>かいしゃいん</rt></ruby>',
  '学生': '<ruby>学生<rt>がくせい</rt></ruby>',
  '大学生': '<ruby>大学生<rt>だいがくせい</rt></ruby>',
  '先生': '<ruby>先生<rt>せんせい</rt></ruby>',
  // p3: 所属機関(5 語)
  '会社': '<ruby>会社<rt>かいしゃ</rt></ruby>',
  '学校': '<ruby>学校<rt>がっこう</rt></ruby>',
  '銀行': '<ruby>銀行<rt>ぎんこう</rt></ruby>',
  '大学': '<ruby>大学<rt>だいがく</rt></ruby>',
  'デパート': 'デパート',
};

// ============================================================================
// SECTION 3: 第1課で登場する組織名(複合語)
// ============================================================================
// lesson_01 v2.6 examples で実際に使用される固有名詞の所属名。
// 「東西大学」「さくら銀行」など、語彙(大学・銀行)よりも長いキーを先に登録し、
// マッチ優先順位を確保する(rubifySentence の sort 処理で自動的に長いキー優先)。
// ----------------------------------------------------------------------------
const ORGANIZATIONS_LESSON1 = {
  // 教科書原典の組織名(handoff_phase2_D_confirmed.md 第1課 image_prompts 整合)
  '東西大学': '<ruby>東西大学<rt>とうざいだいがく</rt></ruby>',
  '東西銀行': '<ruby>東西銀行<rt>とうざいぎんこう</rt></ruby>',
  // Phase 1-F 後の「さくら」系統(lesson_01 v2.6 p3 で採用)
  'さくら銀行': 'さくら<ruby>銀行<rt>ぎんこう</rt></ruby>',
  'さくら大学': 'さくら<ruby>大学<rt>だいがく</rt></ruby>',
  'さくらデパート': 'さくらデパート',
};

// ============================================================================
// SECTION 4: UI/メタ用語(共通)
// ============================================================================
// スライド・宿題・教案の UI 部品で使う見出し・操作語。全課共通。
// ----------------------------------------------------------------------------
const UI_TERMS = {
  // スライド見出し
  '第1課': '<ruby>第<rt>だい</rt></ruby>1<ruby>課<rt>か</rt></ruby>',
  '第2課': '<ruby>第<rt>だい</rt></ruby>2<ruby>課<rt>か</rt></ruby>',
  '第3課': '<ruby>第<rt>だい</rt></ruby>3<ruby>課<rt>か</rt></ruby>',
  '宿題': '<ruby>宿題<rt>しゅくだい</rt></ruby>',
  '練習': '<ruby>練習<rt>れんしゅう</rt></ruby>',
  '例文': '<ruby>例文<rt>れいぶん</rt></ruby>',
  '文型': '<ruby>文型<rt>ぶんけい</rt></ruby>',
  '語彙': '<ruby>語彙<rt>ごい</rt></ruby>',
  '所属機関': '<ruby>所属機関<rt>しょぞくきかん</rt></ruby>',
  '組織': '<ruby>組織<rt>そしき</rt></ruby>',
  '職業': '<ruby>職業<rt>しょくぎょう</rt></ruby>',
  '英語': '<ruby>英語<rt>えいご</rt></ruby>',
  '日本語': '<ruby>日本語<rt>にほんご</rt></ruby>',
  // 宿題のアクション
  '答え合わせ': '<ruby>答<rt>こた</rt></ruby>え<ruby>合<rt>あ</rt></ruby>わせ',
  '次へ': '<ruby>次<rt>つぎ</rt></ruby>へ',
  'もう一度': 'もう<ruby>一度<rt>いちど</rt></ruby>',
  '聞く': '<ruby>聞<rt>き</rt></ruby>く',
  '見る': '<ruby>見<rt>み</rt></ruby>る',
  '読む': '<ruby>読<rt>よ</rt></ruby>む',
  '書く': '<ruby>書<rt>か</rt></ruby>く',
  // 教案・学習目標で使うもの
  '学習目標': '<ruby>学習<rt>がくしゅう</rt></ruby><ruby>目標<rt>もくひょう</rt></ruby>',
  '会話例': '<ruby>会話例<rt>かいわれい</rt></ruby>',
  '導入': '<ruby>導入<rt>どうにゅう</rt></ruby>',
  '活動': '<ruby>活動<rt>かつどう</rt></ruby>',
  'まとめ': 'まとめ',
};

// ============================================================================
// SECTION 5: 助詞(将来拡張用・第1課では rubify 不要だが API 一貫性のため掲載)
// ============================================================================
// 助詞は本来ふりがな不要だが、辞書一覧で位置が分かるよう掲載。
// 値はキーと同一(ふりがな付与なし)。
// ----------------------------------------------------------------------------
const PARTICLES = {
  'は': 'は',
  'が': 'が',
  'を': 'を',
  'に': 'に',
  'で': 'で',
  'と': 'と',
  'の': 'の',
  'も': 'も',
  'か': 'か',
  'です': 'です',
  'です。': 'です。',
  'ですか': 'ですか',
  'ですか。': 'ですか。',
  'じゃありません': 'じゃありません',
  'じゃありません。': 'じゃありません。',
};

// ============================================================================
// SECTION 6: 第2課の語彙（lesson_02.json v2.11.7 SSOT・17語）
// ============================================================================
// 病院（びょういん）は VOCAB_LESSON1 に既収録のため除外。
// 消しゴムの reading は けしゴム（慣用的カタカナ）か けしごむ（ひらがな統一）かを
// 教師が決定する。下記は けしゴム を採用（ゴムはカタカナ語として定着）。
// v1.2: 犬・写真（p5_p6_object）を追加（15語→17語）。
// ----------------------------------------------------------------------------
const VOCAB_LESSON2 = {
  '時計':     '<ruby>時計<rt>とけい</rt></ruby>',
  '腕時計':   '<ruby>腕時計<rt>うでどけい</rt></ruby>',
  'ペン':     'ペン',
  '鉛筆':     '<ruby>鉛筆<rt>えんぴつ</rt></ruby>',
  'ケータイ': 'ケータイ',
  '本':       '<ruby>本<rt>ほん</rt></ruby>',
  '雑誌':     '<ruby>雑誌<rt>ざっし</rt></ruby>',
  '新聞':     '<ruby>新聞<rt>しんぶん</rt></ruby>',
  'かばん':   'かばん',
  '消しゴム': '<ruby>消<rt>け</rt></ruby>しゴム',
  'ビル':     'ビル',
  '市役所':   '<ruby>市役所<rt>しやくしょ</rt></ruby>',
  '山':       '<ruby>山<rt>やま</rt></ruby>',
  '人':       '<ruby>人<rt>ひと</rt></ruby>',
  'わたし':   'わたし',
  '犬':       '<ruby>犬<rt>いぬ</rt></ruby>',       // v1.2: p5_p6_object 追加
  '写真':     '<ruby>写真<rt>しゃしん</rt></ruby>',  // v1.2: p5_p6_object 追加
};

// ============================================================================
// SECTION 7: 第2課で登場する人物名・固有名詞
// ============================================================================
// A/B/鈴木/リン/キム/ケリー は PEOPLE_LESSON1 に既収録のため除外。
// v1.2: Cさん削除（例文から除去済み・v2.11.5で鈴木さんへ置換）。
//        タノムさん追加（第2課 p4 例文 4-3/4-4 に登場）。
// ----------------------------------------------------------------------------
const PEOPLE_LESSON2 = {
  'タノムさん':      'タノムさん',      // v1.2: 追加（第2課p4/4-3/4-4に登場）
  'アインシュタイン': 'アインシュタイン', // p5/p6 例文（著名人・さんなし）
};

// ============================================================================
// SECTION 8: 統合辞書(WORD_RUBY)
// ============================================================================
// 全セクションを単一の辞書にマージ。
// 重複キーが出た場合は後ろの定義が優先される(現状重複なし)。
// 第2課以降の追加は addEntries() で動的に拡張する。
// ----------------------------------------------------------------------------
const WORD_RUBY = Object.assign(
  {},
  PEOPLE_LESSON1,
  PEOPLE_LESSON2,
  VOCAB_LESSON1,
  VOCAB_LESSON2,
  ORGANIZATIONS_LESSON1,
  UI_TERMS,
  PARTICLES
);

// ============================================================================
// SECTION 9: ヘルパー関数
// ============================================================================

/**
 * 単語のふりがな付き HTML を取得する。
 * 辞書未登録ならそのまま返す。
 *
 * @param {string} word - 単語(例: '医者')
 * @returns {string} ふりがな付き HTML(例: '<ruby>医者<rt>いしゃ</rt></ruby>')
 */
function rubifyWord(word) {
  if (typeof word !== 'string') return '';
  return WORD_RUBY[word] || word;
}

/**
 * 任意の文字列内の登録単語を一括でルビ化する。
 *
 * 二段階置換アルゴリズム(2026-05-12 v1.0 で確定):
 *   1. 長いキーから順にプレースホルダー(\u0000{n}\u0000)へ置換する。
 *      これにより、置換済み箇所に短いキーが再マッチして二重 ruby が
 *      発生する事故を防ぐ。
 *      例: '東西大学' を先に置換 → 次の '大学' は元文字列の '東西大学' 内に
 *          含まれていたものとは別実体としてしか残らない。
 *   2. 全置換が完了した後、プレースホルダーを ruby HTML 値に戻す。
 *
 * 長いキー優先の効果(例):
 *   - '東西大学' を持つ文に対し、'東西大学' が '大学' より先にマッチする。
 *   - 結果: '<ruby>東西大学<rt>とうざいだいがく</rt></ruby>'
 *   - もし長さ順を逆にすると '大学' が先にマッチして
 *     '東西<ruby>大学</ruby>' という不適切な分解になる。
 *
 * 注意:
 *   - HTML タグ内の属性値もマッチ対象になる可能性があるため、
 *     プレーンテキスト or 既に ruby 化されていない文字列に対してのみ使うこと。
 *   - 既に <ruby> タグを含むテキストに再適用すると壊れる(冪等でない)。
 *
 * @param {string} text - 対象テキスト
 * @returns {string} ふりがな付き HTML
 */
function rubifySentence(text) {
  if (typeof text !== 'string' || text.length === 0) return '';
  // プレースホルダー文字に NULL 文字(\u0000)を使う。日本語教材テキストには
  // 出現し得ない制御文字のため、原文との衝突リスクがない。
  const PH_OPEN = '\u0000R';
  const PH_CLOSE = '\u0000';
  let result = text;
  const placeholderMap = []; // [{ph, value}, ...]

  // Step 1: 長いキーから順にプレースホルダーへ置換
  const keys = Object.keys(WORD_RUBY).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (result.indexOf(key) === -1) continue;
    const ph = PH_OPEN + placeholderMap.length + PH_CLOSE;
    placeholderMap.push({ ph: ph, value: WORD_RUBY[key] });
    result = result.split(key).join(ph);
  }

  // Step 2: プレースホルダーを ruby HTML 値へ戻す
  for (const entry of placeholderMap) {
    result = result.split(entry.ph).join(entry.value);
  }
  return result;
}

/**
 * 辞書にエントリを動的に追加する。
 * 第2課以降のセッション開始時に、その課固有の語彙を読み込むときに使う。
 *
 * 例:
 *   addEntries({
 *     '時計': '<ruby>時計<rt>とけい</rt></ruby>',
 *     'ABCビル': 'ABCビル',
 *   });
 *
 * @param {Object<string, string>} entries - キー(単語) → 値(ruby HTML)のマップ
 * @returns {number} 追加されたエントリ数(既存上書きを含む)
 */
function addEntries(entries) {
  if (!entries || typeof entries !== 'object') return 0;
  let count = 0;
  for (const key in entries) {
    if (Object.prototype.hasOwnProperty.call(entries, key)) {
      WORD_RUBY[key] = entries[key];
      count++;
    }
  }
  return count;
}

/**
 * 登録キーの一覧を返す(デバッグ・検証用)。
 * @returns {string[]} 辞書キー配列
 */
function listKeys() {
  return Object.keys(WORD_RUBY);
}

/**
 * 辞書のスナップショットを返す(変更不可・参照用)。
 * @returns {Object<string, string>} 辞書のコピー
 */
function getDictionary() {
  return Object.assign({}, WORD_RUBY);
}

// ============================================================================
// SECTION 10: エクスポート(ブラウザ + Node.js 両対応)
// ============================================================================
// C+B ハイブリッド方針(SKILL.md v1.4)に従い、ブラウザでも Node.js でも動く形に。
// ----------------------------------------------------------------------------
const RubyDict = {
  WORD_RUBY: WORD_RUBY,
  rubifyWord: rubifyWord,
  rubifySentence: rubifySentence,
  addEntries: addEntries,
  listKeys: listKeys,
  getDictionary: getDictionary,
  // セクション別アクセサ(将来の検証・テストで使用)
  _sections: {
    PEOPLE_LESSON1: PEOPLE_LESSON1,
    PEOPLE_LESSON2: PEOPLE_LESSON2,
    VOCAB_LESSON1: VOCAB_LESSON1,
    VOCAB_LESSON2: VOCAB_LESSON2,
    ORGANIZATIONS_LESSON1: ORGANIZATIONS_LESSON1,
    UI_TERMS: UI_TERMS,
    PARTICLES: PARTICLES,
  },
  // メタ情報
  _meta: {
    version: '1.2',
    createdAt: '2026-05-12',
    lastModified: '2026-05-17',
    source: 'shared/common/ruby_dictionary.js',
    entriesCount: Object.keys(WORD_RUBY).length,
    lessons: [1, 2], // 第1課・第2課。第3課以降は addEntries で追加
    changes: [
      'v1.0 (2026-05-12): 初版。第1課・第2課語彙(15語)・人物名を収録。',
      'v1.1 (2026-05-17): lesson_02.json v2.11.3 同期。第2課語彙15語確定。',
      'v1.2 (2026-05-17): handoff_v2_4.md §5 適用。VOCAB_LESSON2に犬・写真追加(15語→17語)。PEOPLE_LESSON2のCさん削除(v2.11.5で除去済み)・タノムさん追加(p4例文4-3/4-4に登場)。',
    ],
  },
};

// ブラウザ環境(window グローバル + 後方互換の WORD_RUBY/rubifyWord/rubifySentence)
if (typeof window !== 'undefined') {
  window.RubyDict = RubyDict;
  // 後方互換: 既存プロトタイプ HTML の WORD_RUBY/rubifyWord/rubifySentence を維持
  window.WORD_RUBY = WORD_RUBY;
  window.rubifyWord = rubifyWord;
  window.rubifySentence = rubifySentence;
}

// Node.js 環境(flow_synthesizer.js から require される)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RubyDict;
}
