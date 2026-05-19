/**
 * slide_html.js
 * -----------------------------------------------------------------------------
 * 授業中に画面共有するスライド HTML を生成する。
 * 単一の自己完結型 HTML(CSS/JS インライン)を返すので、教師がローカルでも
 * GitHub Pages でも開ける。
 *
 * 入力 (ctx): main.js の processSessionFile が組み立てるオブジェクト
 *   - session, lesson, lessonsByNo, activityCatalog, imageRegistry
 *   - resolvedFlow, flowMeta, hasRequiredActivity
 *
 * 出力: HTML テキストの Blob (text/html;charset=utf-8)
 *
 * 設計判断:
 *   - resolvedFlow の各エントリを 1+ 枚のサブスライドへ展開する
 *     (Stage 1 既知問題 #8: 「subSlides 展開を最初から実装」への対応)
 *   - 学習目標スライドは teach[].patternId の canDo を集約 (#7)
 *   - ふりがな ON/OFF はトグル。OFF 時は `display:none` で完全に消す (#3)
 *     ふりがなの色は `color: inherit` で本文と一致 (#4)
 *     UI 要素には ruby を一切付けない (#5)
 *   - ラベル・段階名は日本語 (#6)
 *   - 画像は image_resolver で URL を解決 → 失敗時は emoji フォールバック (#1)
 *   - design_tokens.css 由来のトークンを <style> 内に埋め込む (#9: スライド/宿題/
 *     アクティビティで共通の design_tokens を参照)
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;

  // ── design tokens の埋め込みコピー (design_tokens.css と同一値) ──────
  // self-contained HTML にするため、外部 CSS を fetch せず文字列化する。
  // 値を変えたい時は src/styles/design_tokens.css と本変数の双方を更新する。
  const DESIGN_TOKENS_CSS = `
:root {
  --color-background-primary: #FAF8F0;
  --color-background-subtle:  #F5EFE0;
  --color-background-surface: #FFFFFF;
  --color-text-main:     #1B2C40;
  --color-text-subtle:   #6B7C85;
  --color-text-muted:    #8A95A0;
  --color-text-on-accent: #1B2C40;
  --color-ui-primary:       #7090B0;
  --color-ui-primary-hover: #5A7A9A;
  --color-ui-primary-dark:  #1B2C40;
  --color-ui-primary-muted: #EAF0F6;
  --color-ui-accent:        #E0B040;
  --color-ui-accent-muted:  #FAEEDA;
  --color-pos-noun-text:   #1B2C40;
  --color-pos-noun-bg:     #E8E5DC;
  --color-pos-noun-border: #1B2C40;
  --color-pos-particle-text:   #1B2C40;
  --color-pos-particle-bg:     #EEEAE0;
  --color-pos-particle-border: #A89B7A;
  --color-pos-verb-text:   #1B2C40;
  --color-pos-verb-bg:     #FAEEDA;
  --color-pos-verb-border: #E0B040;
  --font-family-sans: 'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic', sans-serif;
  --font-size-slide-title: clamp(3.0rem, 3vw + 1.5rem, 3.5rem);
  --font-size-heading:     clamp(2.625rem, 2.5vw + 1.5rem, 3.0rem);
  --font-size-body:        clamp(2.0rem, 2vw + 1rem, 2.5rem);
  --font-size-body-small:  clamp(1.5rem, 1.5vw + 0.875rem, 1.75rem);
  --font-size-ruby:        clamp(1.25rem, 1vw + 0.75rem, 1.5rem);
  --font-size-caption:     clamp(0.875rem, 0.4vw + 0.625rem, 1.0rem);
  --line-height-tight:  1.3;
  --line-height-normal: 1.5;
  --line-height-loose:  1.7;
  --font-weight-regular: 400;
  --font-weight-medium:  500;
  --font-weight-bold:    700;
  --border-radius-small:  8px;
  --border-radius-medium: 12px;
  --border-radius-large:  14px;
  --padding-md: 16px;
  --padding-lg: 24px;
  --padding-xl: 32px;
  --gap-tight:  6px;
  --gap-normal: 10px;
  --gap-loose:  16px;
  --gap-section: 24px;
  --shadow-default: 0 2px 12px rgba(27, 44, 64, 0.10);
  --shadow-strong:  0 4px 24px rgba(27, 44, 64, 0.15);
}
`;

  const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');`;

  // ── スライド固有 CSS ─────────────────────────────────────────────────
  const SLIDE_CSS = `
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: var(--color-background-primary);
  color: var(--color-text-main);
  font-family: var(--font-family-sans);
  line-height: var(--line-height-normal);
  width: 100vw; height: 100vh; overflow: hidden;
}

/* ── ふりがな (ruby) ─────────────────────────────────────
   #2: 本文に対して常に 50% の相対サイズ (em) で表示する。
       絶対値だと本文サイズが小さい要素 (語彙カード等) で相対的に大きく見えてしまうため、
       em で本文サイズに連動させる。
   #3: OFF 時は display:none で完全消去 (rp も含む)
   #4: 色は inherit で本文と同じ */
ruby {
  ruby-position: over;
  word-break: keep-all;
}
ruby rt {
  font-size: 0.5em;
  color: inherit;
  font-weight: var(--font-weight-regular);
  line-height: 1;
  /* rt 幅が base より広い時 (例: 単漢字 + 多文字読み) に rt 文字間を詰めて、
     ruby ボックスが横に大きく膨らむのを抑える。 */
  letter-spacing: -0.05em;
}
/* 隣接 ruby 同士が rt 幅で広がっても、視覚的に同じ語の一部として見えるよう
   左マージンを少しだけマイナスにする (kuromoji の分割マージで吸収しきれないケース対策)。 */
ruby + ruby {
  margin-left: -0.15em;
}
ruby rp { display: none; }
/* #3: ふりがな OFF — display:none !important で flex 子要素等の特定セレクタにも勝つ */
body.no-ruby ruby rt,
body.no-ruby ruby rp { display: none !important; }

/* ── 英語トグル ───────────────────────────────────────────
   トグル対象の英語要素は必ず .en-text を付ける。
   .en / .sentence-en / .name-en は装飾用クラスとしてのみ使い、トグル判定には使わない
   (単語カードのように常時表示したい英語と区別できるようにするため)。
   デフォルト body は no-en (英語非表示)。トグル ON で .en-text を表示する。 */
body.no-en .en-text { display: none !important; }

/* スライド本体 */
.slide {
  position: absolute; inset: 0;
  display: none;
  flex-direction: column;
  padding: 60px 80px 100px;
  background: var(--color-background-primary);
  /* slide 全体は overflow:hidden。スクロールは .slide-body 内で行う。 */
  overflow: hidden;
}
.slide.active { display: flex; }

.slide-stage {
  font-size: var(--font-size-body-small);
  color: var(--color-text-subtle);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--gap-section);
  display: flex; align-items: baseline; gap: var(--gap-normal);
}
.slide-stage .stage-no {
  background: var(--color-ui-accent-muted);
  color: var(--color-ui-primary-dark);
  padding: 4px 12px;
  border-radius: var(--border-radius-small);
  font-weight: var(--font-weight-bold);
}

.slide-title {
  font-size: var(--font-size-slide-title);
  font-weight: var(--font-weight-bold);
  /* タイトル→コンテンツの間隔を宿題見出しと同じ 16px (--gap-loose) に統一する。
     英語サブタイトルがある場合は下記 :has(+ .slide-title-en) で margin-bottom を 0 に下げ、
     代わりに title-en 側の margin-bottom 16px が間隔を担う。 */
  margin: 0 0 var(--gap-loose);
  line-height: var(--line-height-tight);
}
/* タイトル直後に英語サブタイトルがある場合: タイトル側の margin-bottom を 0 にして
   EN 側の margin-top (= 4px) のみが JA→EN の距離になるようにする (負マージン不使用)。 */
.slide-title:has(+ .slide-title-en) {
  margin-bottom: 0;
}
/* 英語 OFF (body.no-en) で .slide-title-en が display:none の場合、
   :has(+ .slide-title-en) は DOM 上で依然マッチしてしまい、上のルールで
   タイトル下が 0 になる。その状態でも宿題見出しと同じ 16px (--gap-loose)
   の呼吸を確保するため、英語 OFF 時のみタイトル下マージンを復活させる。 */
body.no-en .slide-title:has(+ .slide-title-en) {
  margin-bottom: var(--gap-loose);
}
/* スライドタイトル直下の英語(左揃え・小さめ)。
   JA→EN の距離は margin-top: 4px (spacing.xs)。
   EN→コンテンツの距離は margin-bottom: 16px (--gap-loose) で宿題見出しと統一。 */
.slide-title-en {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  margin: 4px 0 var(--gap-loose);
  text-align: left;
  font-weight: var(--font-weight-regular);
}
.slide-subtitle {
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-medium);
  margin: 0 0 var(--gap-loose);
  color: var(--color-text-main);
}
.slide-body {
  flex: 1;
  font-size: var(--font-size-body);
  display: flex; flex-direction: column;
  /* 全スライドでコンテンツを上揃え (flex-start) に統一する。
     垂直中央揃え (safe center) を使うとスライドごとに余白量が変わって
     タイトル下のスペースがバラバラになるため。スクロールは overflow-y: auto で対応。 */
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--gap-section);
  min-height: 0;
  overflow-y: auto;
}
.slide-body p { margin: 0; }
/* ul / li は箇条点を出さず、スライドタイトルと同じ左端 (slide-body のコンテンツ先頭) から始める。
   サマリースライドの箇条書きをタイトル左端と揃えるための統一指定。 */
.slide-body ul { margin: 0; padding-left: 0; list-style: none; }
.slide-body li { margin: 0.6em 0; }

/* 日英ペア: JA テキストと EN テキストを密に並べるためのラッパー。
   slide-body の flex gap (24px) によって離れないよう、JA と EN を 1 つのコンテナにまとめる。
   ペア内部の EN 側に margin-top: 4px (spacing.xs) を当てて 0〜4px の近接表示にする。 */
.ja-en-pair {
  display: block;
}

/* ── 例文ブロック ──── */
.example-card {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-large);
  padding: var(--padding-xl);
  box-shadow: var(--shadow-default);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-section);
  align-items: center;
  max-width: 1400px;
  margin: 0;
  width: 100%;
}
.example-card.no-image { grid-template-columns: 1fr; max-width: 1000px; }
.example-card .text-col {
  display: flex; flex-direction: column; gap: var(--gap-loose);
}
.example-card .sentence {
  font-size: var(--font-size-slide-title);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}
.example-card .sentence-en {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
.example-card .image-col {
  display: flex; align-items: center; justify-content: center;
}
.example-card img {
  max-width: 100%; max-height: 50vh;
  border-radius: var(--border-radius-medium);
  box-shadow: var(--shadow-default);
  background: #fff;
  display: block;
}
.example-card .image-fallback {
  font-size: 6rem;
  color: var(--color-text-muted);
}

/* ── 学習目標 ──── */
.canDo-list {
  /* 3 文型時に 3 カード が縦に並んだ際 1 画面に収まるよう gap を 8px に縮小。 */
  display: flex; flex-direction: column; gap: 8px;
  max-width: 1200px;
  margin: 0;
  margin-left: 0;
  width: 100%;
}
.canDo-item {
  background: var(--color-background-surface);
  border-left: 6px solid var(--color-ui-accent);
  border-radius: var(--border-radius-medium);
  /* コンパクト化: --padding-md (16px) → 12px */
  padding: 12px;
  box-shadow: var(--shadow-default);
}
.canDo-item .pattern-label {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  margin-bottom: var(--gap-tight);
  font-weight: var(--font-weight-regular);
  letter-spacing: 0.04em;
}
.canDo-item .pattern-label-en {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  margin-bottom: var(--gap-tight);
}
.canDo-item .canDo-text {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}
.canDo-item .canDo-text-en {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  margin-top: var(--gap-tight);
}

/* ── まとめ (wrapUp) ──── */
.summary-list {
  display: flex; flex-direction: column;
  gap: 8px;
  max-width: 1200px;
  margin: 0;
  margin-left: 0;
  width: 100%;
}
.summary-item {
  background: var(--color-background-surface);
  border-left: 6px solid var(--color-ui-accent);
  border-radius: var(--border-radius-medium);
  padding: 12px;
  box-shadow: var(--shadow-default);
}
.summary-item .summary-text {
  /* タイトル/副見出し/本文の階層を明確化するため body → body-small に縮小 */
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
}
.summary-item .summary-text-en {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  margin-top: var(--gap-tight);
}

/* ── 例文まとめ (1 文型 = 1 スライド・例文を全部リスト表示) ──── */
.example-summary-list {
  display: flex; flex-direction: column;
  /* 複数例文時のスクロール対策で gap を縮小 */
  gap: var(--gap-normal);
  max-width: 1400px; margin: 0; width: 100%;
}
.example-summary-item {
  display: grid;
  /* テキストを左・画像を右に配置。画像列は最低 280px、最大スライドの 35% を確保。 */
  grid-template-columns: 1fr minmax(280px, 35%);
  gap: var(--gap-section);
  /* 画像セルの高さにテキストセルを合わせ、テキスト側の .text 内で縦中央寄せにする。 */
  align-items: stretch;
  background: var(--color-background-surface);
  border-radius: var(--border-radius-large);
  /* スクロール対策で padding 縮小 */
  padding: var(--padding-md);
  box-shadow: var(--shadow-default);
}
.example-summary-item .text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.example-summary-item.no-image { grid-template-columns: 1fr; }
.example-summary-item img {
  width: 100%;
  /* 画像の縦は最大 40vh まで許容して、大きく見せる */
  max-height: 40vh;
  aspect-ratio: 1;
  object-fit: contain;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-medium);
}
.example-summary-item .img-fallback {
  display: flex; align-items: center; justify-content: center;
  width: 100%; aspect-ratio: 1;
  max-height: 40vh;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-medium);
  font-size: 4rem; color: var(--color-text-muted);
}
.example-summary-item .sentence {
  /* スクロール対策で heading → body に縮小 */
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}
.example-summary-item .sentence-en {
  font-size: var(--font-size-body-small);
  color: var(--color-text-muted);
  margin-top: 4px;
}
/* 例文の主語/述語ハイライト (color + border-bottom)。
   ふりがな表示時は ruby が span 内に入るが border-bottom は span 末端に出るので干渉しない。 */
.highlight-subject {
  color: var(--color-ui-primary-dark);
  border-bottom: 3px solid var(--color-ui-accent);
  padding-bottom: 2px;
}
.highlight-predicate {
  color: var(--color-ui-primary-dark);
  border-bottom: 3px solid var(--color-ui-primary);
  padding-bottom: 2px;
}

/* ── intro_activity スライド用の学習者向け説明 ── */
.intro-explain {
  background: var(--color-ui-accent-muted);
  border-left: 6px solid var(--color-ui-accent);
  border-radius: var(--border-radius-medium);
  padding: var(--padding-lg);
  margin: 0 0 var(--gap-section);
  margin-left: 0;
  /* 1200px の固定上限ではなく slide-body 幅一杯に伸ばす (語彙カードグリッドと右端を揃える) */
  max-width: 100%; width: 100%;
}
.intro-explain .label {
  font-size: var(--font-size-caption);
  color: var(--color-text-subtle);
  display: block; margin-bottom: var(--gap-tight);
  font-weight: var(--font-weight-bold); letter-spacing: 0.05em;
}
.intro-explain .ja {
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-medium);
}
.intro-explain .en-text {
  font-size: var(--font-size-body-small);
  color: var(--color-text-muted);
  margin-top: var(--gap-tight);
}

/* ── 文型構造ボックス (patternIntroSlide 用) ──── */
.pattern-structure-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--gap-loose);
  align-items: center;
  margin: 0;
  margin-left: 0;
  max-width: 1200px; width: 100%;
}
.pattern-structure-box {
  padding: var(--padding-lg);
  border-radius: var(--border-radius-medium);
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  /* 両ボックスを均等幅にし、テキストを中央揃え */
  flex: 1 1 0;
  text-align: center;
}
.pattern-structure-box.subject {
  background: var(--color-ui-accent-muted);
  border: 2px solid var(--color-ui-accent);
}
.pattern-structure-box.predicate {
  background: var(--color-ui-primary-muted);
  border: 2px solid var(--color-ui-primary);
}

/* ── 文型解説 (legacy・未使用) ──── */
.pattern-display {
  background: var(--color-pos-noun-bg);
  border: 3px solid var(--color-pos-noun-border);
  border-radius: var(--border-radius-large);
  padding: var(--padding-xl);
  font-size: var(--font-size-slide-title);
  font-weight: var(--font-weight-bold);
  text-align: center;
  max-width: 1200px; margin: 0;
}

/* ── 練習テンプレート ──── */
.practice-list {
  display: flex; flex-direction: column;
  /* テンプレ間隔も 8px に揃える */
  gap: 8px;
  max-width: 1200px;
  margin: 0;
  margin-left: 0;
  width: 100%;
}
.practice-template {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-medium);
  /* デフォルト: 例文カードと同じ padding-xl (32px)。
     テンプレ数が 3 以上の場合は .practice-template--compact で 12px に縮小。 */
  padding: var(--padding-xl);
  box-shadow: var(--shadow-default);
  font-size: var(--font-size-body);
  text-align: left;
  margin: 0;
  margin-left: 0;
  max-width: 1200px; width: 100%;
}
.practice-template--compact {
  /* 3 テンプレ以上のとき: 1 画面に収めるため padding を縮小 */
  padding: 12px;
}
.practice-template .hint {
  display: block;
  margin-top: var(--gap-loose);
  font-size: var(--font-size-body-small);
  color: var(--color-text-subtle);
  font-weight: var(--font-weight-regular);
}
/* 練習テンプレ中の穴埋め (＿＿＿) を inline-block のボックスに変換した時のスタイル。
   背景と下線を共に accent 系で統一し、視認性を上げる。 */
.blank-box {
  display: inline-block;
  min-width: 120px;
  border-bottom: 3px solid var(--color-ui-accent);
  background: var(--color-ui-accent-muted);
  border-radius: 4px 4px 0 0;
  padding: 2px 16px;
  vertical-align: bottom;
}

/* ── アクティビティ案内 ──── */
.activity-card {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-large);
  padding: var(--padding-xl);
  box-shadow: var(--shadow-default);
  max-width: 1200px;
  margin: 0;
  margin-left: 0;
  width: 100%;
}
.activity-card .name {
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--gap-loose);
}
.activity-card .desc {
  font-size: var(--font-size-body-small);
  line-height: var(--line-height-loose);
}
.activity-card .player-explain {
  margin-top: var(--gap-section);
  padding: var(--padding-md);
  background: var(--color-ui-accent-muted);
  border-left: 6px solid var(--color-ui-accent);
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-body-small);
}
.activity-card .player-explain .label {
  font-size: var(--font-size-caption);
  color: var(--color-text-subtle);
  display: block; margin-bottom: 4px;
  font-weight: var(--font-weight-bold); letter-spacing: 0.05em;
}

/* ── 表紙メタ情報 (トピック / 日付 / 学習者) を控えめにする ──── */
.cover-topic {
  font-size: var(--font-size-body-small);
  color: var(--color-text-subtle);
  font-weight: var(--font-weight-regular);
  margin-bottom: var(--gap-loose);
}
.cover-date,
.cover-student {
  font-size: var(--font-size-caption);
  color: var(--color-text-subtle);
  font-weight: var(--font-weight-regular);
  margin-bottom: var(--gap-tight);
}

/* ── 表紙の語彙プレビュー行 (3〜4 語を横並び・幅 120px・中央揃え) ──── */
.cover-vocab-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: var(--gap-normal);
  margin-top: var(--gap-section);
  flex-wrap: wrap;
}
.cover-vocab-row .vocab-card {
  width: 120px;
  flex: 0 0 120px;
}

/* ── 語彙カードグリッド (intro_activity 等) ──── */
.vocab-grid {
  display: grid;
  /* min-card 110px: 狭い viewport でも 2 列以上に並ぶ */
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: var(--gap-normal);
  /* intro-explain と右端を揃えるため上限なし (slide-body 幅一杯) */
  max-width: 100%; margin: 0; width: 100%;
}
.vocab-card {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-medium);
  padding: var(--padding-md);
  text-align: center;
  box-shadow: var(--shadow-default);
}
.vocab-card img {
  width: 100%; aspect-ratio: 1;
  object-fit: contain;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
  margin-bottom: var(--gap-normal);
}
.vocab-card .image-fallback {
  font-size: 4rem;
  display: block;
  width: 100%; aspect-ratio: 1;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
  margin-bottom: var(--gap-normal);
  display: flex; align-items: center; justify-content: center;
}
.vocab-card .word {
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-bold);
}
.vocab-card .en {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* ── ナビゲーションバー ──── */
.slide-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--color-background-subtle);
  display: flex; align-items: center;
  padding: 0 24px;
  gap: var(--gap-loose);
  z-index: 100;
}
.slide-nav button {
  font-family: var(--font-family-sans);
  font-size: 1rem;
  padding: 8px 18px;
  background: var(--color-ui-primary);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  min-height: 44px;
}
.slide-nav button:hover { background: var(--color-ui-primary-hover); }
.slide-nav button:disabled { opacity: 0.4; cursor: default; }
.slide-nav .counter {
  margin-left: auto;
  font-size: 0.95rem;
  color: var(--color-text-subtle);
  font-variant-numeric: tabular-nums;
}
.slide-nav .ruby-toggle,
.slide-nav .en-toggle {
  background: var(--color-background-surface);
  color: var(--color-text-main);
  border: 2px solid var(--color-ui-primary);
}
.slide-nav .ruby-toggle.off,
.slide-nav .en-toggle.off {
  background: var(--color-background-subtle);
  color: var(--color-text-muted);
  border-color: var(--color-text-muted);
}
.slide-nav .meta {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

/* ─────────────────────────────────────────────────────────
   Stage 6 追加スタイル: 文型・例文・導入アクティビティ・まとめ
───────────────────────────────────────────────────────── */

/* ── パターンボックス (pattern スライド) ───────────────────── */
.pattern-box {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--gap-tight);
  align-items: center;
  margin: 0 0 var(--gap-loose);
  max-width: 1200px;
  width: 100%;
  font-weight: var(--font-weight-bold);
}
.pattern-slot,
.pattern-plain {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-heading);
  line-height: var(--line-height-tight);
  font-weight: var(--font-weight-bold);
}
.pattern-plain {
  background: transparent;
  padding: 8px 4px;
}
.pattern-slot.slot-noun {
  background: var(--color-pos-noun-bg);
  color: var(--color-pos-noun-text);
  border: 2px solid var(--color-pos-noun-border);
  min-width: 80px;
  justify-content: center;
}
.pattern-slot.slot-particle {
  background: var(--color-pos-particle-bg);
  color: var(--color-pos-particle-text);
  border: 2px solid var(--color-pos-particle-border);
}
.pattern-slot.slot-verb {
  background: var(--color-pos-verb-bg);
  color: var(--color-pos-verb-text);
  border: 2px solid var(--color-pos-verb-border);
}
.pattern-cando {
  margin: 0 0 var(--gap-loose);
}
.pattern-cando .cando-text {
  margin: 0;
  font-size: var(--font-size-body-small);
  color: var(--color-text-subtle);
  font-weight: var(--font-weight-medium);
}
.pattern-cando .cando-text-en {
  margin: 4px 0 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
.pattern-vocab-grid {
  margin-top: var(--gap-tight);
}

/* ── example スライド: アンカー大カード + その他グリッド ── */
.example-slide-body {
  gap: var(--gap-loose);
}
.example-anchor-card {
  display: grid;
  grid-template-columns: 38% 1fr;
  gap: var(--gap-section);
  background: var(--color-background-surface);
  border-radius: var(--border-radius-large);
  border-left: 6px solid var(--color-ui-accent);
  padding: var(--padding-lg);
  box-shadow: var(--shadow-strong);
  align-items: center;
  width: 100%;
  max-width: 1400px;
}
.example-anchor-card .text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--gap-tight);
}
.example-anchor-card .anchor-mark {
  font-size: var(--font-size-caption);
  color: var(--color-ui-accent);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.05em;
}
.example-anchor-card .sentence {
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}
.example-anchor-card .sentence-en {
  font-size: var(--font-size-body-small);
  color: var(--color-text-muted);
}
.example-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap-loose);
  width: 100%;
  max-width: 1400px;
}
.example-grid-item {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-medium);
  padding: var(--padding-md);
  box-shadow: var(--shadow-default);
  display: flex;
  flex-direction: column;
  gap: var(--gap-tight);
}
.example-grid-item .text {
  display: flex; flex-direction: column; gap: 2px;
}
.example-grid-item .sentence {
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}
.example-grid-item .sentence-en {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

/* 例文画像のアスペクト比ラッパー */
.ex-img {
  width: 100%;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  background: var(--color-background-subtle);
  display: flex; align-items: center; justify-content: center;
}
.ex-img.aspect-16x9 { aspect-ratio: 16 / 9; }
.ex-img.aspect-1x1  { aspect-ratio: 1 / 1; }
.ex-img img {
  width: 100%; height: 100%;
  object-fit: contain;
  display: block;
}
.ex-img .img-fallback {
  font-size: 3rem;
  color: var(--color-text-muted);
}

/* ── intro_activity 共通 ─────────────────────────────────── */
.intro-activity-body {
  gap: var(--gap-loose);
}

/* キャラクター名前カード */
.named-character-card {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-medium);
  padding: var(--padding-md);
  text-align: center;
  box-shadow: var(--shadow-default);
  display: flex; flex-direction: column; align-items: center;
  gap: var(--gap-tight);
}
.named-character-card img {
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 220px;
  object-fit: contain;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
}
.named-character-card .image-fallback {
  font-size: 4rem;
  display: flex; align-items: center; justify-content: center;
  width: 100%; aspect-ratio: 1 / 1; max-height: 220px;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
}
.named-character-card .char-name {
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-bold);
}
.named-character-card .char-attr {
  font-size: var(--font-size-caption);
  color: var(--color-text-subtle);
}

/* レイアウト 1: character_card_grid (5枚 + 世界地図) */
.intro-activity-body .char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--gap-loose);
  width: 100%;
  max-width: 100%;
}
.world-map-area {
  width: 100%;
}
.world-map-placeholder {
  display: flex; align-items: center; gap: var(--gap-loose);
  background: var(--color-ui-primary-muted);
  border: 2px dashed var(--color-ui-primary);
  border-radius: var(--border-radius-medium);
  padding: var(--padding-md);
  color: var(--color-text-subtle);
}
.world-map-placeholder .ph-icon { font-size: 2rem; }
.world-map-placeholder .ph-label {
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
}
.world-map-placeholder .ph-label.en-text {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

/* レイアウト 2: qa_card_pair (キャラ1 + パターンボックス + 教師写真) */
.qa-pair {
  display: grid;
  grid-template-columns: minmax(220px, 30%) 1fr;
  gap: var(--gap-section);
  width: 100%;
  max-width: 1200px;
  align-items: center;
}
.qa-card-col {
  display: flex; justify-content: center;
}
.qa-pattern-col {
  display: flex; flex-direction: column;
  gap: var(--gap-normal);
}
.qa-pattern {
  padding: var(--padding-md) var(--padding-lg);
  border-radius: var(--border-radius-medium);
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-bold);
  border: 2px solid;
}
.qa-pattern.qa-q {
  background: var(--color-pos-particle-bg);
  border-color: var(--color-pos-particle-border);
}
.qa-pattern.qa-yes {
  background: var(--color-pos-verb-bg);
  border-color: var(--color-pos-verb-border);
}
.qa-pattern.qa-no {
  background: var(--color-pos-noun-bg);
  border-color: var(--color-pos-noun-border);
}
.teacher-photo-placeholder {
  display: flex; align-items: center; gap: var(--gap-loose);
  background: var(--color-background-subtle);
  border: 2px dashed var(--color-text-muted);
  border-radius: var(--border-radius-medium);
  padding: var(--padding-md);
  color: var(--color-text-subtle);
  width: 100%;
  max-width: 1200px;
}
.teacher-photo-placeholder .ph-icon { font-size: 2rem; }
.teacher-photo-placeholder .ph-label {
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
}
.teacher-photo-placeholder .ph-label.en-text {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

/* レイアウト 3: attribute_expansion (キャラ + buildings + 短→長) */
.attr-expansion {
  display: flex; flex-direction: column;
  gap: var(--gap-section);
  width: 100%;
  max-width: 1400px;
}
.attr-row {
  display: grid;
  grid-template-columns: minmax(180px, 25%) 1fr;
  gap: var(--gap-section);
  align-items: center;
}
.attr-buildings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--gap-normal);
}
.attr-expansion-text {
  display: flex; flex-direction: column;
  align-items: center;
  gap: var(--gap-tight);
  background: var(--color-background-surface);
  border-radius: var(--border-radius-medium);
  padding: var(--padding-lg);
  box-shadow: var(--shadow-default);
}
.attr-expansion-text .exp-short {
  font-size: var(--font-size-body);
  color: var(--color-text-subtle);
  font-weight: var(--font-weight-medium);
}
.attr-expansion-text .exp-arrow {
  font-size: var(--font-size-heading);
  color: var(--color-ui-accent);
  line-height: 1;
}
.attr-expansion-text .exp-long {
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

/* building カード (建物・施設) */
.building-card {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-medium);
  padding: var(--padding-md);
  text-align: center;
  box-shadow: var(--shadow-default);
}
.building-card img {
  width: 100%; aspect-ratio: 1;
  object-fit: contain;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
  margin-bottom: var(--gap-normal);
}
.building-card .image-fallback {
  font-size: 3rem;
  display: flex; align-items: center; justify-content: center;
  width: 100%; aspect-ratio: 1;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
  margin-bottom: var(--gap-normal);
}
.building-card .word {
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-bold);
}
.building-card .en {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* ── まとめスライドのアンカー例文 ────────────────────────── */
.summary-item .summary-anchor {
  margin-top: 6px;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.summary-item .summary-anchor .arrow {
  display: none; /* 視覚要素は .sentence に統合 */
}
.summary-item .summary-anchor .sentence {
  font-size: var(--font-size-body-small);
  color: var(--color-text-main);
  font-weight: var(--font-weight-regular);
  position: relative;
  padding-left: 1.2em;
}
.summary-item .summary-anchor .sentence::before {
  content: '→ ';
  position: absolute;
  left: 0;
  color: var(--color-ui-accent);
  font-weight: var(--font-weight-bold);
}
.summary-item .summary-anchor .sentence-en {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  padding-left: 1.2em;
}

/* main_activity 切替スライドの中央寄せ */
.main-activity-switch {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  min-height: 200px;
}
.main-activity-switch .name {
  font-size: var(--font-size-slide-title);
}

/* main_activity 複数選択時の番号付きリスト */
.main-activity-list {
  padding: var(--padding-xl);
  text-align: left;
  width: 100%;
  max-width: 1200px;
}
.main-activity-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap-loose);
}
.main-activity-item {
  display: flex;
  align-items: baseline;
  gap: var(--gap-section);
}
.main-activity-item .num {
  flex-shrink: 0;
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-bold);
  color: var(--color-ui-accent);
  min-width: 2em;
  line-height: 1;
}
.main-activity-item .text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.main-activity-item .name {
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}
.main-activity-item .name-en {
  font-size: var(--font-size-body-small);
  color: var(--color-text-muted);
}
`;

  // ── ナビゲーション JS (HTML 内に埋め込む) ──────────────────────────
  const NAV_JS = `
(function(){
  var slides = document.querySelectorAll('.slide');
  var counter = document.getElementById('counter');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var rubyToggle = document.getElementById('ruby-toggle');
  var enToggle = document.getElementById('en-toggle');
  var idx = 0;
  function show(i){
    if (i < 0 || i >= slides.length) return;
    slides[idx].classList.remove('active');
    idx = i;
    slides[idx].classList.add('active');
    counter.textContent = (idx + 1) + ' / ' + slides.length;
    prev.disabled = idx === 0;
    next.disabled = idx === slides.length - 1;
    location.hash = 's' + (idx + 1);
  }
  prev.addEventListener('click', function(){ show(idx - 1); });
  next.addEventListener('click', function(){ show(idx + 1); });
  rubyToggle.addEventListener('click', function(){
    document.body.classList.toggle('no-ruby');
    rubyToggle.classList.toggle('off');
    rubyToggle.textContent = document.body.classList.contains('no-ruby') ? 'ふりがな OFF' : 'ふりがな ON';
  });
  if (enToggle) {
    enToggle.addEventListener('click', function(){
      document.body.classList.toggle('no-en');
      enToggle.classList.toggle('off');
      enToggle.textContent = document.body.classList.contains('no-en') ? '英語 OFF' : '英語 ON';
    });
  }
  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); show(idx + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(idx - 1); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(slides.length - 1); }
  });
  // hash 起動
  var m = /^#s(\\d+)$/.exec(location.hash);
  var startIdx = m ? Math.max(0, Math.min(slides.length - 1, parseInt(m[1], 10) - 1)) : 0;
  if (startIdx !== 0) { slides[0].classList.remove('active'); }
  show(startIdx);

  // ── 仮名・全角ブラケット等の左サイドベアリング補正 ──────────────────
  // 「ま」「ア」「「」などは字形の左にデザイン上の余白を含むため、
  // 漢字や英字と並べたとき左端がずれて見える(計測値: 'ま' ≈ 9-14px / 'ア' ≈ 6px / '「' ≈ 26px @40-56px)。
  // canvas で実測してその px 分だけ text-indent を負方向に当て、字の見た目の左端を箱の左端に揃える。
  // Webフォント (Zen Kaku Gothic New) のロード完了後に実行しないと、フォールバックフォントで
  // 異なる bearing 値を測ってしまうので document.fonts.ready を待つ。
  function alignLeading(){
    var canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 100;
    var ctx = canvas.getContext('2d');
    function leftInk(text, font) {
      ctx.clearRect(0, 0, 100, 100);
      ctx.fillStyle = '#000';
      ctx.font = font;
      ctx.textBaseline = 'top';
      ctx.fillText(text, 0, 0);
      var d = ctx.getImageData(0, 0, 100, 100).data;
      for (var x = 0; x < 100; x++) {
        for (var y = 0; y < 100; y++) {
          if (d[(y * 100 + x) * 4 + 3] > 0) return x;
        }
      }
      return 0;
    }
    function firstChar(el) {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: function(n){ return n.nodeValue.replace(/\\s/g,'') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
      });
      var tn = w.nextNode();
      if (!tn) return null;
      var t = tn.nodeValue.replace(/^\\s+/, '');
      return t ? t[0] : null;
    }
    var targets = document.querySelectorAll('.slide-title, .slide-body > p, .canDo-item .canDo-text, .canDo-item .canDo-text-en, .slide-body li');
    targets.forEach(function(el){
      var c = firstChar(el);
      if (!c) return;
      var cs = getComputedStyle(el);
      var font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      var px = leftInk(c, font);
      if (px > 0) {
        el.style.textIndent = (-px) + 'px';
        // text-indent は子の block 要素の first-line に継承される。li 内の英語 div 等は
        // Latin 始まりで bearing が異なるため、明示的に 0 リセットして個別計測に任せる。
        Array.prototype.forEach.call(el.children, function(ch){
          if (ch.style) ch.style.textIndent = '0';
        });
      }
    });
  }
  if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
    document.fonts.ready.then(alignLeading);
  } else {
    // 古いブラウザのフォールバック: ある程度待ってから実行
    setTimeout(alignLeading, 500);
  }
})();
`;

  // ── ヘルパー: HTML エスケープ ─────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 例文の主語(は/が の前)と述語(は/が の後)を分割する簡易ヒューリスティック。
  // 文頭が「はい」「ははは」等の場合に誤検出しないよう、index 0 はスキップして最初の は/が を探す。
  // predicate の末尾に句点や疑問符が付いていれば highlight 範囲から外して trailing として返す。
  // 該当する助詞が見つからない場合は null を返す(ハイライトせず通常表示)。
  function splitForHighlight(sentence) {
    if (typeof sentence !== 'string' || sentence.length < 2) return null;
    let idx = -1;
    for (let i = 1; i < sentence.length; i++) {
      const c = sentence[i];
      if (c === 'は' || c === 'が') { idx = i; break; }
    }
    if (idx === -1) return null;
    let predicate = sentence.slice(idx + 1);
    let trailing = '';
    // 末尾の終止記号 (。．?？!！) を span 外に出す。
    const trailMatch = predicate.match(/[。．？\?！!]+$/);
    if (trailMatch) {
      trailing = trailMatch[0];
      predicate = predicate.slice(0, predicate.length - trailing.length);
    }
    return {
      subject: sentence.slice(0, idx),       // 「は/が の前まで」(ユーザー仕様)
      particle: sentence[idx],                // は or が (ハイライトなしで挿入)
      predicate: predicate,                   // 助詞の後 (= 名詞+です/だ・句点除く)
      trailing: trailing,                     // 句点/疑問符など (span の外に出す)
    };
  }

  // 例文 sentence をハイライト付きで描画する。
  // ex.highlight (subject/predicate) が data 側にあれば優先、なければ splitForHighlight で自動分割。
  function renderSentenceWithHighlight(ex) {
    const sentence = ex.sentence || '';
    const h = ex.highlight;
    if (h && (h.subject || h.predicate)) {
      const tr = h.trailing || '';
      return `<span class="highlight-subject">${ruby(h.subject || '')}</span>${h.particle ? ruby(h.particle) : ''}<span class="highlight-predicate">${ruby(h.predicate || '')}</span>${tr ? ruby(tr) : ''}`;
    }
    const split = splitForHighlight(sentence);
    if (!split) return ruby(sentence);
    return `<span class="highlight-subject">${ruby(split.subject)}</span>${ruby(split.particle)}<span class="highlight-predicate">${ruby(split.predicate)}</span>${split.trailing ? ruby(split.trailing) : ''}`;
  }

  // ふりがな化 — kuromoji が初期化済みなら全漢字に ruby 付与、未初期化なら辞書ベース、
  // どちらも無ければ素テキスト。既に <ruby> を含む文字列には再適用しない(壊れる)。
  function ruby(text) {
    if (text == null) return '';
    if (window.RubyKuromoji && typeof window.RubyKuromoji.rubify === 'function') {
      return window.RubyKuromoji.rubify(text);
    }
    if (window.RubyDict && typeof window.RubyDict.rubifySentence === 'function') {
      return window.RubyDict.rubifySentence(text);
    }
    return esc(text);
  }

  // 画像 URL 解決 (なければ null)
  // Stage 1 既知問題 #1 対策: Google Drive の `drive.google.com/uc?id=` は
  // 303 リダイレクトされて <img> から直接表示できないため、
  // CORS 対応済みの `lh3.googleusercontent.com/d/{id}=w{size}` 形式に正規化する。
  function normalizeImageUrl(url, sizeHint) {
    if (typeof url !== 'string') return url;
    // パターン1: drive.google.com/uc?id=ID  または  uc?export=...&id=ID
    let m = url.match(/^https?:\/\/drive\.google\.com\/uc\?(?:[^#]*&)?id=([\w-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w${sizeHint || 1024}`;
    // パターン2: drive.google.com/thumbnail?id=ID
    m = url.match(/^https?:\/\/drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([\w-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w${sizeHint || 1024}`;
    // パターン3: drive.google.com/file/d/ID/view
    m = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w${sizeHint || 1024}`;
    return url;
  }

  function imgUrl(imageId, registry, sizeHint) {
    if (!imageId) return null;
    if (window.ImageResolver && typeof window.ImageResolver.resolveImageUrl === 'function') {
      const u = window.ImageResolver.resolveImageUrl(imageId, { registry });
      return u ? normalizeImageUrl(u, sizeHint) : null;
    }
    return null;
  }

  // 「導入アクティビティ → 文型」の順番を強制する。
  // lesson.flow の定義順や教師の編集順に依存せず、
  // pattern エントリの直前に同 patternId を持つ intro_activity を必ず置く。
  function ensureIntroBeforePattern(flow) {
    const out = flow.slice();
    for (let i = 0; i < out.length; i++) {
      if (out[i].type !== 'pattern') continue;
      const pid = out[i].patternId;
      if (!pid) continue;
      // 対応する intro_activity を探す (前後どこでも)
      const introIdx = out.findIndex((e) => e.type === 'intro_activity' && (e.patternRef === pid || e.patternId === pid));
      if (introIdx === -1) continue;
      if (introIdx === i - 1) continue; // すでに直前
      const [intro] = out.splice(introIdx, 1);
      // splice で要素が前から1つ抜けたので i がずれる
      const targetI = introIdx < i ? i - 1 : i;
      out.splice(targetI, 0, intro);
    }
    return out;
  }

  // ── スライド生成: 各エントリを 1+ 枚に展開 ────────────────────────────
  function expandFlow(ctx) {
    const { resolvedFlow, session, lessonsByNo, activityCatalog, introActivityCatalog, imageRegistry, lesson, flowMeta } = ctx;
    const registryEntries = imageRegistry && imageRegistry.entries ? imageRegistry.entries : imageRegistry;
    const slides = [];

    // session が教える patternId のセット (例文・練習のフィルタ用)
    const teachIds = new Set((session.teach || []).map((t) => t.patternId));

    // 表紙スライド (どんな session でも先頭に 1 枚)
    slides.push({
      stage: '表紙',
      type: 'cover',
      html: coverSlide(session, lesson, registryEntries),
    });

    // 「導入アクティビティ → 文型」の順番固定
    const orderedFlow = ensureIntroBeforePattern(resolvedFlow);

    // main_activity スライド dedupe: FlowSynthesizer は session.mainActivities が複数件あると
    // main_act_1 / main_act_2 / ... と N 個の flow エントリを生成するが、
    // 学習者向けスライドは「アクティビティの時間」を 1 枚にまとめて活動名を列挙する仕様。
    // 最初の main_activity エントリだけスライド化し、それ以降はスキップする。
    let mainActivityRendered = false;

    orderedFlow.forEach((entry) => {
      if (entry.skipped === true) return;
      const stage = entry.stage || entry.type || entry.id;

      switch (entry.type) {
        case 'review':
          slides.push({ stage, type: 'review', html: reviewSlide(entry, lessonsByNo) });
          break;

        case 'intro_slide':
          // 学習目標 (canDo) を集約 (#7 対応)
          slides.push({
            stage,
            type: 'intro',
            html: introGoalsSlide(session, lessonsByNo),
          });
          break;

        case 'intro_activity': {
          const lessonForIA = lessonsByNo[entry.lessonNo] || lesson;
          slides.push({
            stage,
            type: 'intro_activity',
            html: introActivitySlide(entry, introActivityCatalog, activityCatalog, lessonForIA, registryEntries),
          });
          break;
        }

        case 'pattern': {
          // 文型タイトル + パターンボックス + canDo + 該当文型の語彙カードグリッド
          const lessonForPattern = lessonsByNo[entry.lessonNo] || lesson;
          const pat = (lessonForPattern.patterns || []).find((p) => p.id === entry.patternId);
          if (pat) {
            slides.push({ stage, type: 'pattern', html: patternIntroSlide(pat, lessonForPattern, registryEntries) });
          }
          break;
        }

        case 'example': {
          // 文型ブロック構造(v2.11): entry.patternRef があればその文型 1 枚のみ生成。
          // 後方互換: patternRef がなければ session.teach の全文型を順に並べる。
          const targetPatternId = entry.patternRef || null;
          if (targetPatternId) {
            const lessonForEx = lessonsByNo[entry.lessonNo] || lesson;
            const pat = (lessonForEx.patterns || []).find((p) => p.id === targetPatternId);
            if (pat && Array.isArray(pat.examples) && pat.examples.length > 0) {
              slides.push({
                stage: `${stage} (${pat.label || pat.pattern || pat.id})`,
                type: 'example',
                html: exampleSummarySlide(pat, registryEntries),
              });
            }
          } else {
            const teachLessonNos = new Set((session.teach || []).map((t) => t.lessonNo));
            for (const lessonNo of teachLessonNos) {
              const lessonForEx = lessonsByNo[lessonNo];
              if (!lessonForEx) continue;
              (lessonForEx.patterns || []).forEach((pat) => {
                if (!teachIds.has(pat.id)) return;
                if (!Array.isArray(pat.examples) || pat.examples.length === 0) return;
                slides.push({
                  stage: `${stage} (${pat.label || pat.pattern || pat.id})`,
                  type: 'example',
                  html: exampleSummarySlide(pat, registryEntries),
                });
              });
            }
          }
          break;
        }

        case 'practice': {
          // 文型ブロック構造(v2.11): entry.patternRef があればその文型 1 枚のみ生成。
          // 後方互換: patternRef がなければ session.teach の全文型を順に並べる。
          const targetPatternId = entry.patternRef || null;
          if (targetPatternId) {
            const lessonForP = lessonsByNo[entry.lessonNo] || lesson;
            const pat = (lessonForP.patterns || []).find((p) => p.id === targetPatternId);
            if (pat && Array.isArray(pat.practiceTemplates) && pat.practiceTemplates.length > 0) {
              slides.push({
                stage: `${stage} (${pat.label || pat.pattern || pat.id})`,
                type: 'practice',
                html: practiceSummarySlide(pat),
              });
            }
          } else {
            const teachLessonNos = new Set((session.teach || []).map((t) => t.lessonNo));
            for (const lessonNo of teachLessonNos) {
              const lessonForP = lessonsByNo[lessonNo];
              if (!lessonForP) continue;
              (lessonForP.patterns || []).forEach((pat) => {
                if (!teachIds.has(pat.id)) return;
                if (!Array.isArray(pat.practiceTemplates) || pat.practiceTemplates.length === 0) return;
                slides.push({
                  stage: `${stage} (${pat.label || pat.pattern || pat.id})`,
                  type: 'practice',
                  html: practiceSummarySlide(pat),
                });
              });
            }
          }
          break;
        }

        case 'main_activity':
          /* dedupe: 複数 main_activity エントリがあっても先頭の 1 件のみ生成。
             mainActivitySlide 内で session.mainActivities[] を全件列挙して描画する。 */
          if (mainActivityRendered) break;
          mainActivityRendered = true;
          slides.push({
            stage,
            type: 'main_activity',
            html: mainActivitySlide(entry, activityCatalog, session),
          });
          break;

        case 'wrapUp':
          slides.push({ stage, type: 'wrapUp', html: wrapUpSlide(session, lessonsByNo) });
          break;

        default:
          slides.push({ stage, type: entry.type, html: genericSlide(entry) });
      }
    });

    return slides;
  }

  // ── 各スライドの本文 HTML ────────────────────────────────────────────
  function coverSlide(session, lesson, registryEntries) {
    const l = lesson.lesson || {};
    const s = session.session || {};
    const dateStr = s.date ? `<div class="cover-date">${esc(s.date)}</div>` : '';
    const studentStr = s.studentId ? `<div class="cover-student">${ruby('学習者')}: ${esc(s.studentId)}</div>` : '';
    // 課の語彙から最初の 3〜4 語を取り出してプレビュー的に表示する。
    // 全 patterns の vocabulary を flat にし、最大 4 語まで採用。
    let coverVocabHtml = '';
    if (lesson.vocabulary && lesson.vocabulary.byPattern) {
      const allWords = [];
      Object.values(lesson.vocabulary.byPattern).forEach((g) => {
        if (Array.isArray(g.words)) allWords.push(...g.words);
      });
      const previewWords = allWords.slice(0, 4);
      if (previewWords.length > 0) {
        coverVocabHtml = `
          <div class="cover-vocab-row">
            ${previewWords.map((w) => vocabCardHtml(w, registryEntries)).join('')}
          </div>
        `;
      }
    }
    return `
      <h1 class="slide-title">${ruby('第' + (l.no || '?') + '課')}: ${ruby(l.title || '')}</h1>
      <div class="slide-body" style="justify-content:flex-start;">
        <div class="cover-topic">${ruby(l.topic || '')}</div>
        ${dateStr}${studentStr}
        ${coverVocabHtml}
      </div>
    `;
  }

  function reviewSlide(entry, lessonsByNo) {
    const patIds = entry.patterns || [];
    const items = patIds.map((pid) => {
      const lesson = lessonsByNo[entry.sourceLesson];
      const pat = lesson && (lesson.patterns || []).find((p) => p.id === pid);
      const label = pat ? `${pat.label || pat.pattern}${pat.canDo ? ' — ' + pat.canDo : ''}` : pid;
      const labelEn = pat && pat.canDoEn ? pat.canDoEn : '';
      return `<li>${ruby(label)}${labelEn ? `<div class="en-text" style="font-size: var(--font-size-body-small); color: var(--color-text-muted);">${esc(labelEn)}</div>` : ''}</li>`;
    }).join('');
    return `
      <h2 class="slide-title">${ruby('復習')}</h2>
      <div class="slide-title-en en-text">Review</div>
      <div class="slide-body">
        <ul>${items || `<li>${ruby('(復習項目なし)')}</li>`}</ul>
      </div>
    `;
  }

  function introGoalsSlide(session, lessonsByNo) {
    const items = (session.teach || []).map((t) => {
      const lesson = lessonsByNo[t.lessonNo];
      if (!lesson) return '';
      const pat = (lesson.patterns || []).find((p) => p.id === t.patternId);
      if (!pat) return '';
      // 文型ラベルの英語: grammarConcept + jlptLevel から合成 (短いキャプション扱い)。
      const labelEn = formatGrammarConcept(pat.grammarConcept, pat.jlptLevel);
      return `
        <div class="canDo-item">
          <div class="pattern-label">${ruby('第' + t.lessonNo + '課')} ${esc(pat.id)}: ${ruby(pat.label || pat.pattern || '')}</div>
          ${labelEn ? `<div class="pattern-label-en en-text">${esc(labelEn)}</div>` : ''}
          <div class="canDo-text">${ruby(pat.canDo || '')}</div>
          ${pat.canDoEn ? `<div class="canDo-text-en en-text">${esc(pat.canDoEn)}</div>` : ''}
        </div>
      `;
    }).filter(Boolean).join('');
    return `
      <h2 class="slide-title">${ruby('今日の目標')}</h2>
      <div class="slide-title-en en-text">Today's Goals</div>
      <div class="slide-body">
        <div class="canDo-list">${items || `<div>${ruby('(学習目標が登録されていません)')}</div>`}</div>
      </div>
    `;
  }

  // namedCharacters[0..n] を 1 枚のキャラクターカードに描画する。
  function characterCardHtml(char, registryEntries) {
    if (!char) return '';
    const url = imgUrl(char.imageId, registryEntries, 384);
    const imgHtml = url
      ? `<img src="${esc(url)}" alt="${esc(char.name || '')}" loading="eager" decoding="async" onerror="this.outerHTML='&lt;span class=image-fallback&gt;🧑&lt;/span&gt;'">`
      : `<span class="image-fallback">🧑</span>`;
    // 職業・国籍を「・」で連結。"——" (em dash) は職業未設定マーカーなのでスキップ。
    const attrParts = [];
    if (char.occupation && char.occupation !== '——' && char.occupation !== '--') attrParts.push(char.occupation);
    if (char.nationality && char.nationality !== '——' && char.nationality !== '--') attrParts.push(char.nationality);
    const attr = attrParts.join('・');
    return `
      <div class="named-character-card">
        ${imgHtml}
        <div class="char-name">${ruby(char.name || '')}</div>
        ${attr ? `<div class="char-attr">${ruby(attr)}</div>` : ''}
      </div>
    `;
  }

  // 建物・施設カード (vocab_object 等)
  function buildingCardHtml(w, registryEntries) {
    if (!w) return '';
    const word = w.word || '';
    const id = w.imageId || ('word_' + word);
    const url = imgUrl(id, registryEntries, 384);
    const imgHtml = url
      ? `<img src="${esc(url)}" alt="${esc(word)}" loading="eager" decoding="async" onerror="this.outerHTML='&lt;span class=image-fallback&gt;🏢&lt;/span&gt;'">`
      : `<span class="image-fallback">🏢</span>`;
    return `
      <div class="building-card">
        ${imgHtml}
        <div class="word">${ruby(word)}</div>
        ${w.en ? `<span class="en en-text">${esc(w.en)}</span>` : ''}
      </div>
    `;
  }

  function renderCharacterCardGridLayout(characters, registryEntries) {
    if (!characters || characters.length === 0) {
      return `<p style="color: var(--color-text-muted);">${ruby('(namedCharacters 未定義)')}</p>`;
    }
    const cards = characters.map((c) => characterCardHtml(c, registryEntries)).join('');
    return `
      <div class="char-grid">${cards}</div>
      <div class="world-map-area">
        <div class="world-map-placeholder">
          <span class="ph-icon">🌏</span>
          <span class="ph-label">${ruby('世界地図(国旗付き)')}</span>
          <span class="ph-label en-text">World Map (with flags)</span>
        </div>
      </div>
    `;
  }

  function renderQaCardPairLayout(characters, slideDisplay, registryEntries) {
    const firstChar = (characters && characters[0]) || null;
    const pd = (slideDisplay && slideDisplay.patternDisplay) || {};
    return `
      <div class="qa-pair">
        <div class="qa-card-col">
          ${firstChar ? characterCardHtml(firstChar, registryEntries) : `<p style="color: var(--color-text-muted);">${ruby('(namedCharacters 未定義)')}</p>`}
        </div>
        <div class="qa-pattern-col">
          ${pd.question ? `<div class="qa-pattern qa-q">${ruby(pd.question)}</div>` : ''}
          ${pd.affirmative ? `<div class="qa-pattern qa-yes">${ruby(pd.affirmative)}</div>` : ''}
          ${pd.negative ? `<div class="qa-pattern qa-no">${ruby(pd.negative)}</div>` : ''}
        </div>
      </div>
      <div class="teacher-photo-placeholder">
        <span class="ph-icon">📷</span>
        <span class="ph-label">${ruby('教師が用意した写真をここに表示')}</span>
        <span class="ph-label en-text">Teacher's prepared photo here</span>
      </div>
    `;
  }

  function renderAttributeExpansionLayout(characters, lesson, patternRef, slideDisplay, registryEntries) {
    const firstChar = (characters && characters[0]) || null;
    // 該当 patternRef を patternIds に含む語彙グループの単語を building_card として表示
    let buildings = [];
    if (patternRef && lesson && lesson.vocabulary && lesson.vocabulary.byPattern) {
      for (const g of Object.values(lesson.vocabulary.byPattern)) {
        if (g && Array.isArray(g.patternIds) && g.patternIds.includes(patternRef) && Array.isArray(g.words)) {
          buildings.push(...g.words);
        }
      }
    }
    const exp = (slideDisplay && slideDisplay.expansionDisplay) || {};
    return `
      <div class="attr-expansion">
        <div class="attr-row">
          ${firstChar ? characterCardHtml(firstChar, registryEntries) : ''}
          <div class="attr-buildings">
            ${buildings.map((w) => buildingCardHtml(w, registryEntries)).join('') || `<span style="color: var(--color-text-muted);">${ruby('(building 語彙なし)')}</span>`}
          </div>
        </div>
        ${(exp.shortForm || exp.longForm) ? `
          <div class="attr-expansion-text">
            ${exp.shortForm ? `<div class="exp-short">${ruby(exp.shortForm)}</div>` : ''}
            ${(exp.shortForm && exp.longForm) ? '<div class="exp-arrow">↓</div>' : ''}
            ${exp.longForm ? `<div class="exp-long">${ruby(exp.longForm)}</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  function introActivityFallbackSlide(entry, fallbackAct, lesson, registryEntries) {
    // intro_activity_catalog にエントリがない場合の旧来動作: 語彙カードグリッドのみ。
    const patternRef = entry.patternRef;
    const explain = fallbackAct && fallbackAct.playerExplanation;
    let explainHtml = '';
    if (explain && (explain.ja || explain.en)) {
      explainHtml = `
        <div class="intro-explain">
          ${explain.ja ? `<div class="ja">${ruby(explain.ja)}</div>` : ''}
          ${explain.en ? `<div class="en-text">${esc(explain.en)}</div>` : ''}
        </div>
      `;
    }
    let vocabCards = '';
    if (patternRef && lesson && lesson.vocabulary && lesson.vocabulary.byPattern) {
      const group = Object.values(lesson.vocabulary.byPattern).find(
        (g) => (g.patternIds || []).includes(patternRef)
      );
      if (group && Array.isArray(group.words) && group.words.length > 0) {
        vocabCards = `<div class="vocab-grid">${group.words.map((w) => vocabCardHtml(w, registryEntries)).join('')}</div>`;
      }
    }
    return `
      <div class="slide-body" style="justify-content:flex-start;">
        ${explainHtml}
        ${vocabCards || (explainHtml ? '' : `<p style="text-align:center; color: var(--color-text-muted);">${ruby('(語彙データなし)')}</p>`)}
      </div>
    `;
  }

  function introActivitySlide(entry, introActivityCatalog, activityCatalog, lesson, registryEntries) {
    // Stage 6-4: intro_activity_catalog.json の slideDisplay.layout を見て 3 種類のレイアウトに切替。
    //   character_card_grid : 名前付きキャラクターカードのグリッド + 世界地図(p1 用)
    //   qa_card_pair        : キャラクター1枚 + 応答パターン + 教師写真プレースホルダ(p2 用)
    //   attribute_expansion : キャラクター + building カード + 短文/長文の拡張表示(p3 用)
    // playerSteps はスライドに表示しない(素材提示が目的のため)。
    const patternRef = entry.patternRef;
    const activityId = entry.activityId;
    let catalogEntry = null;
    if (introActivityCatalog && Array.isArray(introActivityCatalog.activities)) {
      catalogEntry = introActivityCatalog.activities.find((a) => a.id === activityId);
    }
    if (!catalogEntry) {
      // フォールバック: 旧 activity_catalog の playerExplanation を流用
      const fallbackAct = activityCatalog
        ? (activityCatalog.activities || []).find((a) => a.id === activityId)
        : null;
      return introActivityFallbackSlide(entry, fallbackAct, lesson, registryEntries);
    }
    const layout = (catalogEntry.slideDisplay && catalogEntry.slideDisplay.layout) || 'character_card_grid';
    const slideTitle = (catalogEntry.slideDisplay && catalogEntry.slideDisplay.slideTitle) || '導入アクティビティ';
    const slideTitleEn = (catalogEntry.slideDisplay && catalogEntry.slideDisplay.slideTitleEn) || '';
    const instr = (catalogEntry.slideDisplay && catalogEntry.slideDisplay.instructionText) || {};
    const characters = (lesson && Array.isArray(lesson.namedCharacters)) ? lesson.namedCharacters : [];

    let layoutHtml;
    if (layout === 'qa_card_pair') {
      layoutHtml = renderQaCardPairLayout(characters, catalogEntry.slideDisplay, registryEntries);
    } else if (layout === 'attribute_expansion') {
      layoutHtml = renderAttributeExpansionLayout(characters, lesson, patternRef, catalogEntry.slideDisplay, registryEntries);
    } else {
      layoutHtml = renderCharacterCardGridLayout(characters, registryEntries);
    }

    const instructionHtml = (instr.ja || instr.en) ? `
      <div class="intro-explain">
        ${instr.ja ? `<div class="ja">${ruby(instr.ja)}</div>` : ''}
        ${instr.en ? `<div class="en-text">${esc(instr.en)}</div>` : ''}
      </div>
    ` : '';

    return `
      <h2 class="slide-title">${ruby(slideTitle)}</h2>
      ${slideTitleEn ? `<div class="slide-title-en en-text">${esc(slideTitleEn)}</div>` : ''}
      <div class="slide-body intro-activity-body" data-layout="${esc(layout)}">
        ${instructionHtml}
        ${layoutHtml}
      </div>
    `;
  }

  function vocabCardHtml(w, registryEntries) {
    const word = w.word || '';
    // Stage 1+2 完了後の命名規則(word_*)で参照する。imageId フィールドがあればそれを優先(SSOT)。
    const id = w.imageId || ('word_' + word);
    const url = imgUrl(id, registryEntries, 512);
    const imgHtml = url
      ? `<img src="${esc(url)}" alt="${esc(word)}" loading="eager" decoding="async" onerror="this.outerHTML='&lt;span class=image-fallback&gt;🖼️&lt;/span&gt;'">`
      : `<span class="image-fallback">🖼️</span>`;
    return `
      <div class="vocab-card">
        ${imgHtml}
        <div class="word">${ruby(word)}</div>
        ${w.en ? `<span class="en en-text">${esc(w.en)}</span>` : ''}
      </div>
    `;
  }

  // grammarConcept (snake_case 英語) と jlptLevel から表示用の英語ラベルを合成する。
  // 例: ("noun_predicate_affirmative", "N5") → "Noun-predicate (affirmative) — N5"
  function formatGrammarConcept(concept, jlptLevel) {
    if (!concept && !jlptLevel) return '';
    const parts = (concept || '').split('_').filter(Boolean);
    const modifierWords = new Set(['affirmative', 'negative', 'question', 'past', 'present', 'plain', 'polite', 'continuous', 'perfect']);
    const main = [];
    const mods = [];
    for (const p of parts) {
      if (modifierWords.has(p)) mods.push(p);
      else main.push(p);
    }
    const cap = (w) => w ? w[0].toUpperCase() + w.slice(1) : '';
    const mainPart = main.length ? main.map((w, i) => i === 0 ? cap(w) : w).join('-') : '';
    const modsPart = mods.length ? ` (${mods.join(', ')})` : '';
    const lvl = jlptLevel ? `${mainPart ? ' — ' : ''}${jlptLevel}` : '';
    return `${mainPart}${modsPart}${lvl}`.trim();
  }

  // パターンラベルを「名詞スロット(〜)」「助詞」「動詞・語尾」「平文」のトークンに分解する。
  // カラーコーディングのために段階的にパターンを認識する簡易トークナイザ。
  //
  // 認識優先順位 (長い・特定語句から):
  //   1) 名詞スロット記号 '〜'
  //   2) 応答語 (はい / いいえ) ← Bug② 対応: 助詞 'は' との誤マッチを防ぐため事前検出
  //   3) 動詞・語尾 (じゃありません > ではありません > ですか > です)
  //   4) 助詞 (は・の・を・が・に・で・と・も・へ・から・まで・よ・ね)
  //   5) 残り = 平文
  function tokenizePatternLabel(label) {
    if (!label) return [];
    const VERBS = ['じゃありません', 'ではありません', 'ですか', 'です'];
    const PARTICLES = ['は', 'の', 'を', 'が', 'に', 'で', 'と', 'も', 'へ', 'から', 'まで', 'よ', 'ね'];
    // Bug② 対応: 「はい」「いいえ」は助詞ではなく応答語。'は' より先にマッチさせる。
    // type を 'plain' にして特別な配色は与えない(語尾とも違うため)。
    const FIXED_PHRASES = ['いいえ', 'はい'];

    const tokens = [];
    let i = 0;
    while (i < label.length) {
      const c = label[i];
      // 1) 名詞スロット
      if (c === '〜') { tokens.push({ type: 'noun', text: '〜' }); i++; continue; }
      // 2) 応答語 (はい / いいえ) — 助詞 'は' との衝突回避
      let fixedMatched = false;
      for (const f of FIXED_PHRASES) {
        if (label.substr(i, f.length) === f) { tokens.push({ type: 'plain', text: f }); i += f.length; fixedMatched = true; break; }
      }
      if (fixedMatched) continue;
      // 3) 動詞・語尾
      let matched = false;
      for (const v of VERBS) {
        if (label.substr(i, v.length) === v) { tokens.push({ type: 'verb', text: v }); i += v.length; matched = true; break; }
      }
      if (matched) continue;
      // 4) 助詞
      let pMatched = false;
      for (const p of PARTICLES) {
        if (label.substr(i, p.length) === p) { tokens.push({ type: 'particle', text: p }); i += p.length; pMatched = true; break; }
      }
      if (pMatched) continue;
      // 5) 平文 (他のマーカーに到達するまで)
      let plain = '';
      while (i < label.length && label[i] !== '〜') {
        let isMarker = false;
        for (const f of FIXED_PHRASES) if (label.substr(i, f.length) === f) { isMarker = true; break; }
        if (isMarker) break;
        for (const v of VERBS) if (label.substr(i, v.length) === v) { isMarker = true; break; }
        if (isMarker) break;
        for (const p of PARTICLES) if (label.substr(i, p.length) === p) { isMarker = true; break; }
        if (isMarker) break;
        plain += label[i];
        i++;
      }
      if (plain) tokens.push({ type: 'plain', text: plain });
    }
    return tokens;
  }

  function renderPatternBox(label) {
    const tokens = tokenizePatternLabel(label || '');
    if (tokens.length === 0) return '';
    const inner = tokens.map((t) => {
      if (t.type === 'plain') return `<span class="pattern-plain">${ruby(t.text)}</span>`;
      const cls = t.type === 'noun' ? 'slot-noun' : t.type === 'particle' ? 'slot-particle' : 'slot-verb';
      return `<span class="pattern-slot ${cls}">${ruby(t.text)}</span>`;
    }).join('');
    return `<div class="pattern-box">${inner}</div>`;
  }

  // この文型用の語彙リストを取得する。
  // shareVocabWith が指定されていればそちらの文型を起点に検索。
  function getVocabForPattern(lesson, patternId) {
    if (!lesson || !lesson.vocabulary || !lesson.vocabulary.byPattern) return [];
    const groups = lesson.vocabulary.byPattern;
    const words = [];
    for (const key of Object.keys(groups)) {
      const g = groups[key];
      if (!g || typeof g !== 'object') continue;
      if (Array.isArray(g.patternIds) && g.patternIds.includes(patternId) && Array.isArray(g.words)) {
        words.push(...g.words);
      }
    }
    return words;
  }

  function patternIntroSlide(pat, lesson, registryEntries) {
    // Stage 6-5: パターンボックス(スロット式カラーコーディング)+ canDo(小さく)+ 語彙カードグリッド。
    // 表示しない: practiceTemplates / cautionNote / plusAlpha / conversationPhrases
    const labelEn = pat.label_en || formatGrammarConcept(pat.grammarConcept, pat.jlptLevel);
    const vocabPatId = pat.shareVocabWith || pat.id;
    const vocabWords = getVocabForPattern(lesson, vocabPatId);
    const vocabGrid = vocabWords.length > 0
      ? `<div class="vocab-grid pattern-vocab-grid">${vocabWords.map((w) => vocabCardHtml(w, registryEntries)).join('')}</div>`
      : '';
    return `
      <h2 class="slide-title">${ruby(pat.label || pat.pattern || '')}</h2>
      ${labelEn ? `<div class="slide-title-en en-text">${esc(labelEn)}</div>` : ''}
      <div class="slide-body">
        ${renderPatternBox(pat.label || pat.pattern || '')}
        ${(pat.canDo || pat.canDoEn) ? `
        <div class="ja-en-pair pattern-cando">
          ${pat.canDo ? `<p class="cando-text">${ruby(pat.canDo)}</p>` : ''}
          ${pat.canDoEn ? `<p class="cando-text-en en-text">${esc(pat.canDoEn)}</p>` : ''}
        </div>` : ''}
        ${vocabGrid}
      </div>
    `;
  }

  function exampleSummarySlide(pat, registryEntries) {
    // Stage 6-6: アンカー例文(isAnchor:true)を 16:9大カード、その他を 4列グリッド(16:9サムネイル) で表示。
    // 画像アスペクト比は imageRole で切替: 'scene' = 16:9 / それ以外('vocab_person' 等) = 1:1。
    const examples = pat.examples || [];
    const anchor = examples.find((ex) => ex.isAnchor === true);
    const others = examples.filter((ex) => ex.isAnchor !== true);

    function imgEl(ex, sizeHint) {
      const url = imgUrl(ex.imageId, registryEntries, sizeHint);
      const aspect = (ex.imageRole === 'scene') ? 'aspect-16x9' : 'aspect-1x1';
      if (url) {
        return `<div class="ex-img ${aspect}"><img src="${esc(url)}" alt="" loading="eager" decoding="async" onerror="this.outerHTML='&lt;span class=img-fallback&gt;🖼️&lt;/span&gt;'"></div>`;
      }
      return `<div class="ex-img ${aspect}"><span class="img-fallback">🖼️</span></div>`;
    }

    const anchorHtml = anchor ? `
      <div class="example-anchor-card">
        ${imgEl(anchor, 800)}
        <div class="text">
          <div class="anchor-mark">★ ${ruby('代表例文')}</div>
          <div class="sentence">${renderSentenceWithHighlight(anchor)}</div>
          ${anchor.sentenceEn ? `<div class="sentence-en en-text">${esc(anchor.sentenceEn)}</div>` : ''}
        </div>
      </div>
    ` : '';

    const othersHtml = others.length > 0 ? `
      <div class="example-grid">
        ${others.map((ex) => `
          <div class="example-grid-item">
            ${imgEl(ex, 360)}
            <div class="text">
              <div class="sentence">${renderSentenceWithHighlight(ex)}</div>
              ${ex.sentenceEn ? `<div class="sentence-en en-text">${esc(ex.sentenceEn)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

    const body = (anchorHtml || othersHtml) ? `${anchorHtml}${othersHtml}` : `<p>${ruby('(例文なし)')}</p>`;
    return `
      <h2 class="slide-title">${ruby('例文')} — ${ruby(pat.label || pat.pattern || '')}</h2>
      <div class="slide-title-en en-text">Examples</div>
      <div class="slide-body example-slide-body">
        ${body}
      </div>
    `;
  }

  function practiceSummarySlide(pat) {
    // その文型の全 practiceTemplate を 1 枚にまとめて縦に並べる。
    // テンプレート中の「＿＿＿」「___」を inline-block の .blank-box に置換する。
    // ruby() (kuromoji) が HTML を直接渡すと escape されてしまうため、
    // 私用領域のプレースホルダーで置換 → ruby 化 → blank-box に戻す方式。
    const PH_BLANK = '';
    const templates = pat.practiceTemplates || [];
    // テンプレ数が 3 以上のとき compact クラスで padding を縮小
    const compactClass = templates.length >= 3 ? ' practice-template--compact' : '';
    const items = templates.map((tpl) => {
      const raw = tpl.pattern || '';
      const tplWithPH = raw.replace(/[_＿]{2,}/g, PH_BLANK);
      const rubied = ruby(tplWithPH);
      const tplHtml = rubied.split(PH_BLANK).join('<span class="blank-box"></span>');
      return `
        <div class="practice-template${compactClass}">
          ${tplHtml}
          ${tpl.hint ? `<span class="hint">${ruby(tpl.hint)}</span>` : ''}
        </div>
      `;
    }).join('');
    return `
      <h2 class="slide-title">${ruby('練習しよう')} — ${ruby(pat.label || pat.pattern || '')}</h2>
      <div class="slide-title-en en-text">Let's Practice</div>
      <div class="slide-body">
        <div class="practice-list">${items || `<p>${ruby('(練習なし)')}</p>`}</div>
      </div>
    `;
  }

  function mainActivitySlide(entry, activityCatalog, session) {
    // Stage 6-2 + multi-activity 拡張:
    //   - mainActivities[] の件数にかかわらずスライドは常に 1 枚 (flow entry main_act_1 単位で 1 回呼ばれる)
    //   - 1 件選択: 中央に活動名 1 つを大きく表示
    //   - 複数選択: 番号付きリストで全活動名を列挙
    // 教師向け説明・playerExplanation・手順はアクティビティHTML側で扱うのでここでは出さない。
    // 選択順序:
    //   (1) session.mainActivities[] (フォーム/JSON で教師が選択。0/1/N 件すべて対応)
    //   (2) mainActivities が空のときは entry.activityId (lesson 既定の活動を 1 件として扱う)
    const mainActs = (session && Array.isArray(session.mainActivities)) ? session.mainActivities : [];

    // 活動 ID → { name, nameEn } のリストを構築
    function lookup(id) {
      if (!id) return null;
      const act = activityCatalog && (activityCatalog.activities || []).find((a) => a.id === id);
      return {
        id,
        name: (act && act.name) || id,
        nameEn: (act && act.nameEn) || '',
      };
    }

    const items = [];
    if (mainActs.length > 0) {
      for (const m of mainActs) {
        if (!m || !m.activityId) continue;
        const it = lookup(m.activityId);
        if (it) items.push(it);
      }
    } else if (entry && entry.activityId) {
      const it = lookup(entry.activityId);
      if (it) items.push(it);
    }

    let bodyHtml;
    if (items.length === 0) {
      // 万一空でもタイトルは出す(現状互換)
      bodyHtml = '<div class="activity-card main-activity-switch"></div>';
    } else if (items.length === 1) {
      // 単一: 中央に大きく
      const it = items[0];
      bodyHtml = `
        <div class="activity-card main-activity-switch">
          <div class="name" style="text-align:center;">${ruby(it.name)}</div>
          ${it.nameEn ? `<div class="name-en en-text" style="text-align:center; font-size: var(--font-size-body-small); color: var(--color-text-muted); margin-top: var(--gap-tight);">${esc(it.nameEn)}</div>` : ''}
        </div>
      `;
    } else {
      // 複数: 番号付きリスト
      const liHtml = items.map((it, i) => `
        <li class="main-activity-item">
          <span class="num">${i + 1}.</span>
          <div class="text">
            <div class="name">${ruby(it.name)}</div>
            ${it.nameEn ? `<div class="name-en en-text">${esc(it.nameEn)}</div>` : ''}
          </div>
        </li>
      `).join('');
      bodyHtml = `
        <div class="activity-card main-activity-list">
          <ol class="main-activity-items">
            ${liHtml}
          </ol>
        </div>
      `;
    }

    return `
      <h2 class="slide-title">${ruby('アクティビティの時間')}</h2>
      <div class="slide-title-en en-text">Activity Time</div>
      <div class="slide-body">
        ${bodyHtml}
      </div>
    `;
  }

  function wrapUpSlide(session, lessonsByNo) {
    // Stage 6-3: 各 canDo の下に該当文型のアンカー例文 (isAnchor: true) を表示する。
    // アンカー例文は文型の代表文として lesson_NN.json で isAnchor: true 指定されたもの。
    const goals = (session.teach || []).map((t) => {
      const lesson = lessonsByNo[t.lessonNo];
      const pat = lesson && (lesson.patterns || []).find((p) => p.id === t.patternId);
      if (!pat) return '';
      const ja = pat.canDo || pat.label || pat.pattern || '';
      const en = pat.canDoEn || '';
      const anchor = (pat.examples || []).find((ex) => ex.isAnchor === true);
      const anchorHtml = anchor ? `
        <div class="summary-anchor">
          <span class="arrow">→</span>
          <span class="sentence">${ruby(anchor.sentence || '')}</span>
          ${anchor.sentenceEn ? `<div class="sentence-en en-text">→ ${esc(anchor.sentenceEn)}</div>` : ''}
        </div>
      ` : '';
      return `
        <div class="summary-item">
          <div class="summary-text">${ruby(ja)}</div>
          ${en ? `<div class="summary-text-en en-text">${esc(en)}</div>` : ''}
          ${anchorHtml}
        </div>
      `;
    }).filter(Boolean).join('');
    return `
      <h2 class="slide-title">${ruby('まとめ')}</h2>
      <div class="slide-title-en en-text">Summary</div>
      <div class="slide-body">
        <div class="ja-en-pair">
          <p style="font-size: var(--font-size-body-small); margin: 0; font-weight: var(--font-weight-medium);">${ruby('今日できるようになったこと')}:</p>
          <p class="en-text" style="font-size: var(--font-size-caption); color: var(--color-text-muted); margin: 4px 0 0;">What you learned today:</p>
        </div>
        <div class="summary-list">${goals || '<div class="summary-item"><div class="summary-text">(なし)</div></div>'}</div>
      </div>
    `;
  }

  function genericSlide(entry) {
    return `
      <h2 class="slide-title">${ruby(entry.stage || entry.type || '')}</h2>
      <div class="slide-body">
        <p>${ruby(entry.content || '')}</p>
      </div>
    `;
  }

  // ── スライド配列 → HTML 文字列 ────────────────────────────────────────
  function renderSlides(slides) {
    // 各スライド先頭の stage ラベル (「表紙」「導入(スライド)」など) は学習者にとって
    // 情報密度が低いため出力しない。必要な情報は各 builder のタイトル/本文に集約する。
    return slides.map((s, i) => `
      <section class="slide${i === 0 ? ' active' : ''}" data-idx="${i}">
        ${s.html}
      </section>
    `).join('');
  }

  // ── ドキュメント全体組み立て ─────────────────────────────────────────
  function buildHtml(ctx) {
    const slides = expandFlow(ctx);
    const session = ctx.session.session || {};
    const l = ctx.lesson.lesson || {};
    const title = `第${l.no || '?'}課 スライド (${session.id || ''})`;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
${FONT_IMPORT}
${DESIGN_TOKENS_CSS}
${SLIDE_CSS}
</style>
</head>
<body class="no-ruby no-en">
${renderSlides(slides)}
<nav class="slide-nav">
  <button id="prev" type="button">← 前</button>
  <button id="next" type="button">次 →</button>
  <button id="ruby-toggle" class="ruby-toggle off" type="button">ふりがな OFF</button>
  <button id="en-toggle" class="en-toggle off" type="button">英語 OFF</button>
  <span class="meta">${esc(title)}</span>
  <span class="counter" id="counter">1 / ${slides.length}</span>
</nav>
<script>
${NAV_JS}
</script>
</body>
</html>`;
  }

  // ── 公開 API ─────────────────────────────────────────────────────────
  async function generate(ctx) {
    const html = buildHtml(ctx);
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  window.SlideHtml = {
    generate,
    _meta: {
      version: '0.1',
      createdAt: '2026-05-13',
    },
  };
})();
