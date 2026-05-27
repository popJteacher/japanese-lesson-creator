/**
 * homework_html.js
 * -----------------------------------------------------------------------------
 * 学習者が自宅で自習する宿題 HTML を生成する。
 * 単一の自己完結型 HTML(CSS/JS インライン)を返すので、ローカルでも
 * GitHub Pages でも開ける。
 *
 * 入力 (ctx): main.js の processSessionFile が組み立てるオブジェクト
 *   - session, lesson, lessonsByNo, activityCatalog, imageRegistry, audioRegistry
 *   - resolvedFlow, flowMeta, hasRequiredActivity
 *
 * 出力: HTML テキストの Blob (text/html;charset=utf-8)
 *
 * 設計判断:
 *   - スライドと違って 1 ページスクロール式(ナビなし)
 *   - フォーム入力欄(穴埋め・チェック)は学習者が直接記入できる
 *   - localStorage 保存はしない(自宅で使い切りの想定。Step 2 で検討)
 *   - ふりがなトグル、共通 design_tokens を埋め込み(Stage 1 既知問題 #9)
 *   - 画像 URL は Google Drive を lh3.googleusercontent.com に正規化(#1)
 *
 * v0.2 (2026-05-15):
 *   - lesson_NN.json v2.11+ の語彙 imageId="word_X" 体系に対応
 *     (旧 'vocab_X' プレフィックス参照を全廃)
 *   - patterns[].practiceImageSource による練習問題画像の分岐
 *     - "vocabulary"            → word.imageId (1:1語彙画像)
 *     - "namedCharacters"       → namedCharacters[].imageId
 *     - "namedCharacters+vocab" → 人物imageId と建物imageIdを横並び
 *   - 音声ボタン(audioRegistry 経由・audioUrl があれば再生、null ならグレーアウト)
 *   - 画像フォールバック: imgUrl が null を返したら空枠表示(エラーにしない)
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;

  // 共通 design tokens — slide_html.js と完全に同一値を保持(#9)
  const DESIGN_TOKENS_CSS = `
:root {
  --color-background-primary: #FAF8F0;
  --color-background-subtle:  #F5EFE0;
  --color-background-surface: #FFFFFF;
  --color-text-main:     #1B2C40;
  --color-text-subtle:   #6B7C85;
  --color-text-muted:    #8A95A0;
  --color-ui-primary:       #7090B0;
  --color-ui-primary-hover: #5A7A9A;
  --color-ui-primary-dark:  #1B2C40;
  --color-ui-accent:        #E0B040;
  --color-ui-accent-muted:  #FAEEDA;
  --color-pos-noun-text:   #1B2C40;
  --color-pos-noun-bg:     #E8E5DC;
  --color-pos-noun-border: #1B2C40;
  --font-family-sans: 'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic', sans-serif;
  /* 宿題は手元の端末(PC/タブレット/スマホ)で読むので、スライドより一段小さい固定値を採用 */
  --font-size-title:   2rem;     /* 32px */
  --font-size-h2:      1.5rem;   /* 24px */
  --font-size-h3:      1.25rem;  /* 20px */
  --font-size-body:    1.125rem; /* 18px */
  --font-size-small:   0.95rem;
  --font-size-caption: 0.8rem;
  /* ふりがな (#2): em 単位は ruby 内のブラウザ既定スタイルで意図せず膨らむため、
     必ず rem 固定値で「本文より明らかに小さい」サイズを保証する */
  --font-size-ruby:    0.7rem;   /* 11.2px (本文 18px の約 62%) */
  --line-height-normal: 1.7;
  --font-weight-regular: 400;
  --font-weight-medium:  500;
  --font-weight-bold:    700;
  --border-radius-small:  8px;
  --border-radius-medium: 12px;
  --border-radius-large:  14px;
  --shadow-default: 0 2px 12px rgba(27, 44, 64, 0.10);
}
`;

  const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');`;

  // 宿題固有 CSS
  const HOMEWORK_CSS = `
* { box-sizing: border-box; }
html, body {
  margin: 0;
  background: var(--color-background-primary);
  color: var(--color-text-main);
  font-family: var(--font-family-sans);
  line-height: var(--line-height-normal);
  font-size: var(--font-size-body);
}
main {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 20px 120px;
}

/* ── ふりがな (#2 #3 #4 対策) ──
   #2: rt は本文に対して常に 50% (em) で表示。
       絶対値だと本文サイズが異なる箇所 (語彙カード vs 説明文) で
       ふりがなの相対サイズが揃わないため em に統一。 */
ruby { ruby-position: over; }
ruby rt {
  font-size: 0.5em;
  color: inherit;             /* #4: 本文と同じ色 */
  font-weight: var(--font-weight-regular);
  line-height: 1;
}
ruby rp { display: none; }
body.no-ruby ruby rt,
body.no-ruby ruby rp { display: none; }   /* #3: 完全に消す */

/* 英語トグル — トグル対象の英語要素は必ず .en-text を付ける。
   .en / .sentence-en / .name-en は装飾用クラスとしてのみ使い、トグル判定には使わない。
   単語カードのように常時表示したい英語は .en-text を付けない。
   デフォルト body は no-en (英語非表示)。 */
body.no-en .en-text { display: none !important; }

/* ヒントラベルトグル — 練習問題の画像ラベル(.hint-cell-label) を表示/非表示切替。
   デフォルトは表示(見える状態)。学習者がボタンで隠して自分で答えを書く想定。 */
body.hide-labels .hint-cell-label { display: none; }

/* ── 表紙 ── */
.cover {
  background: var(--color-background-surface);
  padding: 24px;
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-default);
  margin-bottom: 32px;
  border-left: 6px solid var(--color-ui-accent);
}
.cover h1 {
  font-size: var(--font-size-title);
  margin: 0 0 16px;
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
}
.cover .meta {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 8px 12px;
  font-size: var(--font-size-small);
  color: var(--color-text-subtle);
}
.cover .meta dt {
  font-weight: var(--font-weight-medium);
  margin: 0;
}
.cover .meta dd {
  margin: 0;
  color: var(--color-text-main);
}
.cover .name-input {
  width: 200px; padding: 4px 8px;
  border: 1px solid var(--color-text-muted);
  border-radius: var(--border-radius-small);
  font-family: inherit; font-size: inherit;
  background: var(--color-background-subtle);
}

/* ── セクション ── */
section.lesson-section { margin-bottom: 40px; }
section.lesson-section h2 {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  margin: 0 0 4px;
  padding-bottom: 8px;
  border-bottom: 3px solid var(--color-ui-accent);
}
/* セクション見出し直下に置く英語サブタイトル(アクティビティ HTML 説明文と同等のサイズ感)。 */
section.lesson-section .section-h2-en {
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
  margin: 0 0 16px;
}
section.lesson-section h3 {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-medium);
  margin: 24px 0 4px;
  color: var(--color-ui-primary-dark);
}
section.lesson-section .section-h3-en {
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
  margin: 0 0 12px;
}
section.lesson-section p { margin: 0 0 12px; }

/* ── can-do カード ── */
.can-do {
  background: var(--color-ui-accent-muted);
  border-radius: var(--border-radius-medium);
  padding: 16px 20px;
  margin: 0 0 20px;
}
.can-do .label {
  font-size: var(--font-size-caption);
  color: var(--color-ui-primary-dark);
  letter-spacing: 0.1em;
  font-weight: var(--font-weight-bold);
  display: block;
  margin-bottom: 6px;
}
.can-do .can-do-en {
  display: block;
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* ── 例文ブロック (一覧) ── */
.example-list { display: grid; gap: 12px; }
.example-row {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-medium);
  padding: 14px 18px;
  display: grid;
  grid-template-columns: auto 1fr 80px;
  gap: 16px;
  align-items: center;
  box-shadow: var(--shadow-default);
}
.example-row .no {
  font-size: var(--font-size-caption);
  color: var(--color-ui-primary-dark);
  background: var(--color-ui-accent-muted);
  padding: 4px 10px;
  border-radius: var(--border-radius-small);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}
.example-row .text .sentence {
  font-weight: var(--font-weight-medium);
}
.example-row .text .en {
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
  margin-top: 4px;
}
.example-row img {
  width: 80px; height: 80px;
  object-fit: contain;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
}
.example-row .img-fallback {
  width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
  font-size: 2rem; color: var(--color-text-muted);
}

/* ── 練習問題 ── */
.exercise-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.exercise {
  background: var(--color-background-surface);
  padding: 16px 20px;
  border-radius: var(--border-radius-medium);
  margin: 0 0 16px;
  box-shadow: var(--shadow-default);
}
.exercise .question {
  font-size: var(--font-size-body);
  margin-bottom: 8px;
}
.exercise .hint {
  display: block;
  font-size: var(--font-size-small);
  color: var(--color-text-subtle);
  margin-top: 6px;
}
.exercise input[type="text"] {
  display: inline-block;
  width: 8em; padding: 2px 6px;
  border: none; border-bottom: 2px solid var(--color-ui-primary);
  background: var(--color-background-subtle);
  font: inherit;
  border-radius: 4px 4px 0 0;
}
.exercise input[type="text"]:focus { outline: 2px solid var(--color-ui-accent); }

/* ── 画像ヒント型練習問題 ── */
.exercise.hint-exercise {
  display: flex; flex-direction: column;
  align-items: center; gap: 12px;
  margin: 0;
}
/* 画像エリア。1枚 or 2枚(横並び) どちらも対応 */
.exercise.hint-exercise .hint-images {
  display: flex; flex-direction: row;
  align-items: center; justify-content: center;
  gap: 10px;
  width: 100%;
  max-width: 320px;
}
.exercise.hint-exercise .hint-images .hint-cell {
  flex: 1 1 0;
  display: flex; flex-direction: column;
  align-items: center; gap: 4px;
  min-width: 0;
}
.exercise.hint-exercise .hint-images .hint-cell-label {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
.exercise.hint-exercise .hint-images .hint-plus {
  flex: 0 0 auto;
  font-size: 1.5rem;
  color: var(--color-text-muted);
  padding: 0 4px;
}
.exercise.hint-exercise .hint-img,
.exercise.hint-exercise .img-fallback {
  width: 100%;
  max-width: 140px;
  aspect-ratio: 1;
  object-fit: contain;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
  display: block;
}
/* 1枚のみのときの単独画像はやや大きく */
.exercise.hint-exercise .hint-images.single .hint-img,
.exercise.hint-exercise .hint-images.single .img-fallback {
  max-width: 200px;
}
.exercise.hint-exercise .img-fallback {
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; color: var(--color-text-muted);
}
.exercise.hint-exercise .question {
  text-align: center;
  margin: 0;
}
/* v0.3: practiceTemplates 複数件を縦並びで表示するためのコンテナ */
.exercise.hint-exercise .templates-block {
  display: flex; flex-direction: column;
  gap: 6px;
  width: 100%;
  align-items: center;
}
.exercise.hint-exercise .template-row {
  text-align: center;
}
.exercise.hint-exercise .template-row.no-input {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

/* ── 音声ボタン ── */
.audio-btn {
  display: inline-flex;
  align-items: center; justify-content: center;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-ui-primary);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background .15s ease, opacity .15s ease;
  flex-shrink: 0;
}
.audio-btn:hover:not(:disabled) { background: var(--color-ui-primary-hover); }
.audio-btn:disabled,
.audio-btn.disabled {
  background: var(--color-background-subtle);
  color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}
.audio-btn-inline {
  width: 28px; height: 28px; font-size: .9rem;
  margin-left: 6px;
}

/* ── 語彙チェック (画像を大きく) ── */
.vocab-check {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.vocab-check .vocab-item {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-medium);
  padding: 16px;
  /* 縦並びにして画像を大きく */
  display: flex; flex-direction: column; gap: 10px; align-items: center;
  box-shadow: var(--shadow-default);
  text-align: center;
}
.vocab-check .vocab-item img {
  width: 100%;
  max-width: 180px;
  aspect-ratio: 1;
  object-fit: contain;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
}
.vocab-check .vocab-item .img-fallback {
  width: 100%;
  max-width: 180px;
  aspect-ratio: 1;
  background: var(--color-background-subtle);
  border-radius: var(--border-radius-small);
  display: flex; align-items: center; justify-content: center;
  font-size: 3rem; color: var(--color-text-muted);
}
.vocab-check .vocab-item .word-line {
  display: flex; align-items: center; gap: 6px;
  justify-content: center;
}
.vocab-check .vocab-item .word {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-h3);
}
.vocab-check .vocab-item .en {
  display: block;
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
}

/* ── 振り返りチェックリスト ── */
.reflect ul { list-style: none; padding: 0; margin: 0; }
.reflect li {
  background: var(--color-background-surface);
  border-radius: var(--border-radius-medium);
  padding: 12px 16px;
  margin: 0 0 10px;
  display: flex; gap: 12px; align-items: flex-start;
  box-shadow: var(--shadow-default);
}
.reflect li input[type="checkbox"] {
  margin-top: 4px;
  width: 18px; height: 18px;
  flex-shrink: 0;
}

/* ── 上部固定ツールバー ── */
.toolbar {
  position: sticky; top: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-background-subtle);
  padding: 8px 12px;
  display: flex; gap: 12px; align-items: center;
  z-index: 100;
  margin: 0 -20px 20px;
}
.toolbar button {
  font-family: var(--font-family-sans);
  font-size: 0.95rem;
  padding: 6px 14px;
  background: var(--color-background-surface);
  color: var(--color-text-main);
  border: 2px solid var(--color-ui-primary);
  border-radius: var(--border-radius-small);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  min-height: 40px;
}
.toolbar button.off {
  background: var(--color-background-subtle);
  color: var(--color-text-muted);
  border-color: var(--color-text-muted);
}
.toolbar .en-toggle.off {
  background: var(--color-background-subtle);
  color: var(--color-text-muted);
  border-color: var(--color-text-muted);
}
.toolbar .meta {
  margin-left: auto;
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
}

/* ── β1 採点 UI ── */
.exercise .judge-controls {
  display: flex; flex-wrap: wrap; gap: 8px;
  justify-content: center;
  margin-top: 4px;
}
.exercise .judge-btn {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-small);
  padding: 6px 14px;
  background: var(--color-background-surface);
  color: var(--color-ui-primary-dark);
  border: 2px solid var(--color-ui-primary);
  border-radius: var(--border-radius-small);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  min-height: 36px;
}
.exercise .judge-btn:hover { background: var(--color-background-subtle); }
.exercise .judge-btn.judge-check { color: #fff; background: var(--color-ui-primary); }
.exercise .judge-btn.judge-check:hover { background: var(--color-ui-primary-hover); }
.exercise .judge-feedback {
  min-height: 1.6em;
  text-align: center;
  font-weight: var(--font-weight-bold);
  font-size: 1.4rem;
  margin-top: 4px;
}
.exercise .judge-feedback.correct { color: #2a7a3e; }
.exercise .judge-feedback.wrong   { color: #c0392b; }
.exercise .answer-input.is-correct {
  border-bottom-color: #2a7a3e;
  background: #eaf6ee;
}
.exercise .answer-input.is-wrong {
  border-bottom-color: #c0392b;
  background: #fbeaea;
}
.exercise .judge-answer-list {
  background: var(--color-ui-accent-muted);
  border-radius: var(--border-radius-small);
  padding: 10px 14px;
  font-size: var(--font-size-small);
  width: 100%;
  margin-top: 4px;
}
.exercise .judge-answer-list .answer-list-label {
  font-weight: var(--font-weight-bold);
  color: var(--color-ui-primary-dark);
  margin-bottom: 4px;
}
.exercise .judge-answer-list ul {
  list-style: none; padding: 0; margin: 0;
}
.exercise .judge-answer-list li {
  padding: 2px 0;
  color: var(--color-text-main);
}

@media print {
  .toolbar { display: none; }
  .exercise .judge-controls,
  .exercise .judge-feedback,
  .exercise .judge-answer-list { display: none !important; }
  body { background: #fff; }
  main { padding-top: 0; }
}
`;

  // インライン JS (ふりがなトグル + プリント + 音声再生)
  const INLINE_JS = `
(function(){
  var btn = document.getElementById('ruby-toggle');
  if (btn) {
    btn.addEventListener('click', function(){
      document.body.classList.toggle('no-ruby');
      btn.classList.toggle('off');
      btn.textContent = document.body.classList.contains('no-ruby') ? 'ふりがな OFF' : 'ふりがな ON';
    });
  }
  var ebtn = document.getElementById('en-toggle');
  if (ebtn) {
    ebtn.addEventListener('click', function(){
      document.body.classList.toggle('no-en');
      ebtn.classList.toggle('off');
      ebtn.textContent = document.body.classList.contains('no-en') ? '英語 OFF' : '英語 ON';
    });
  }
  /* ヒントラベル(画像下の人物名/語彙名)の表示/非表示トグル。
     デフォルトは表示(body に .hide-labels なし)。クリックで切り替える。 */
  var hbtn = document.getElementById('hint-toggle');
  if (hbtn) {
    hbtn.addEventListener('click', function(){
      var hidden = document.body.classList.toggle('hide-labels');
      hbtn.textContent = hidden ? '💡 ヒントを見る' : '💡 ヒントを隠す';
    });
  }
  var pbtn = document.getElementById('print');
  if (pbtn) pbtn.addEventListener('click', function(){ window.print(); });

  /* 音声再生: audio-btn[data-src] をクリックしたら HTMLAudioElement で再生。
     data-src が空(audioUrl=null)のボタンは disabled なのでここに到達しない。 */
  document.querySelectorAll('.audio-btn[data-src]').forEach(function(b){
    b.addEventListener('click', function(){
      var src = b.getAttribute('data-src');
      if (!src) return;
      try {
        var a = new Audio(src);
        a.play().catch(function(err){
          console.warn('[homework] audio play failed:', err && err.message);
        });
      } catch (e) {
        console.warn('[homework] audio init failed:', e && e.message);
      }
    });
  });

  /* β1 採点: data-answers を持つ .exercise 単位で
     答え合わせ / もう一度 / 正解を表示 を制御。 */
  function normalize(s) {
    /* 末尾の「。」「.」と前後 whitespace（全角・半角）を除去。
       中の表記揺れ（ふりがな / 漢字 / さん有無）は正規化しない（user 指定）。 */
    return String(s == null ? '' : s)
      .replace(/[\\u3000\\s]+/g, '')
      .replace(/[。\\.]+$/, '');
  }
  function matchAny(userInputs, answerSets) {
    for (var i = 0; i < answerSets.length; i++) {
      var row = answerSets[i];
      if (row.length !== userInputs.length) continue;
      var ok = true;
      for (var j = 0; j < row.length; j++) {
        if (normalize(row[j]) !== normalize(userInputs[j])) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  }
  function perInputCorrectness(userInputs, answerSets) {
    /* 各 input が「いずれかの正解組のその位置」に一致しているか。
       ○の input は緑、×の input は赤。 */
    var flags = userInputs.map(function(){ return false; });
    for (var i = 0; i < answerSets.length; i++) {
      var row = answerSets[i];
      if (row.length !== userInputs.length) continue;
      for (var j = 0; j < row.length; j++) {
        if (normalize(row[j]) === normalize(userInputs[j])) flags[j] = true;
      }
    }
    return flags;
  }
  document.querySelectorAll('.exercise[data-answers]').forEach(function(ex){
    var answers;
    try { answers = JSON.parse(ex.getAttribute('data-answers')); }
    catch (e) { console.warn('[homework] answers parse failed', e); return; }
    if (!Array.isArray(answers) || answers.length === 0) return;

    var inputs = Array.prototype.slice.call(ex.querySelectorAll('.answer-input'));
    var checkBtn = ex.querySelector('.judge-check');
    var retryBtn = ex.querySelector('.judge-retry');
    var showBtn  = ex.querySelector('.judge-show');
    var feedback = ex.querySelector('.judge-feedback');
    var answerList = ex.querySelector('.judge-answer-list');

    function clearInputState() {
      inputs.forEach(function(i){ i.classList.remove('is-correct','is-wrong'); });
      feedback.classList.remove('correct','wrong');
      feedback.textContent = '';
    }

    if (checkBtn) checkBtn.addEventListener('click', function(){
      var values = inputs.map(function(i){ return i.value; });
      var allOk = matchAny(values, answers);
      var flags = perInputCorrectness(values, answers);
      inputs.forEach(function(inp, idx){
        inp.classList.remove('is-correct','is-wrong');
        inp.classList.add(flags[idx] ? 'is-correct' : 'is-wrong');
      });
      feedback.classList.remove('correct','wrong');
      if (allOk) {
        feedback.classList.add('correct');
        feedback.textContent = '○ 正解！';
        retryBtn.style.display = 'none';
      } else {
        feedback.classList.add('wrong');
        feedback.textContent = '× もう一度';
        retryBtn.style.display = '';
      }
    });

    if (retryBtn) retryBtn.addEventListener('click', function(){
      /* もう一度: ×だった input だけクリアして集中させる。
         正解済みの input は残す（部分正解を保持）。 */
      inputs.forEach(function(inp){
        if (inp.classList.contains('is-wrong')) inp.value = '';
      });
      clearInputState();
      retryBtn.style.display = 'none';
      var firstWrong = inputs.find(function(i){ return i.value === ''; });
      if (firstWrong) firstWrong.focus();
    });

    if (showBtn) showBtn.addEventListener('click', function(){
      var visible = answerList.style.display !== 'none';
      answerList.style.display = visible ? 'none' : '';
      showBtn.textContent = visible ? '正解を表示' : '正解を隠す';
    });
  });
})();
`;

  // ── HTML エスケープ ─────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ふりがな化 — kuromoji 全漢字 ruby を優先、なければ辞書ベースにフォールバック
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

  // grammarConcept (snake_case 英語) と jlptLevel から表示用の英語ラベルを合成する。
  // patterns データに canDo の英訳は無いので、文型紹介としてこの英語を併記する。
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

  // Google Drive URL を <img> から表示できる形に正規化(#1)
  function normalizeImageUrl(url, sizeHint) {
    if (typeof url !== 'string') return url;
    let m = url.match(/^https?:\/\/drive\.google\.com\/uc\?(?:[^#]*&)?id=([\w-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w${sizeHint || 512}`;
    m = url.match(/^https?:\/\/drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([\w-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w${sizeHint || 512}`;
    m = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w${sizeHint || 512}`;
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

  /** 音声 URL 解決。
   *  audioRegistry.entries[audioId].audioUrl を返す。
   *  audioId が無い・registry が無い・entry が無い・audioUrl が null
   *  のいずれでも null を返す(呼び出し側でグレーアウトに分岐)。 */
  function audioUrlOf(audioId, audioRegistry) {
    if (!audioId || !audioRegistry) return null;
    const entries = audioRegistry.entries || audioRegistry;
    const entry = entries && entries[audioId];
    if (!entry) return null;
    return entry.audioUrl || null;
  }

  /** 画像 <img>/フォールバック生成。url が null/空なら .img-fallback で空枠を出す。 */
  function imgHtml(url, alt, extraClass) {
    const cls = extraClass || 'hint-img';
    if (url) {
      return `<img class="${cls}" src="${esc(url)}" alt="${esc(alt || '')}" loading="eager" decoding="async" onerror="this.outerHTML='&lt;span class=img-fallback&gt;🖼️&lt;/span&gt;'">`;
    }
    return `<span class="img-fallback">🖼️</span>`;
  }

  /** 音声ボタン生成。url が null/空なら disabled でグレーアウト。 */
  function audioBtnHtml(audioUrl, label, extraClass) {
    const cls = 'audio-btn' + (extraClass ? ' ' + extraClass : '');
    if (audioUrl) {
      return `<button type="button" class="${cls}" data-src="${esc(audioUrl)}" title="${esc(label || '音声を聞く')}" aria-label="${esc(label || '音声を聞く')}">🔊</button>`;
    }
    return `<button type="button" class="${cls} disabled" disabled title="${esc(label || '音声未収録')}" aria-label="${esc(label || '音声未収録')}">🔇</button>`;
  }

  // ── セクション組み立て ──────────────────────────────────────────────
  function buildCover(session, lesson) {
    const s = session.session || {};
    const l = lesson.lesson || {};
    return `
      <div class="cover">
        <h1>${ruby('第' + (l.no || '?') + '課')} 宿題 — ${ruby(l.title || '')}</h1>
        <dl class="meta">
          <dt>テーマ</dt><dd>${ruby(l.topic || '')}</dd>
          <dt>日付</dt><dd>${esc(s.date || '—')}</dd>
          <dt>学習者</dt><dd>${esc(s.studentId || '')}</dd>
          <dt>名前</dt><dd><input class="name-input" type="text" placeholder="（自分の名前を書く）"></dd>
        </dl>
      </div>
    `;
  }

  /** vocabulary.byPattern からこの文型用の語彙を集める。
   *  shareVocabWith があれば優先して参照先の文型を見る。 */
  function collectVocabForPattern(lesson, pat) {
    const refPid = pat.shareVocabWith || pat.id;
    const groups = Object.values(lesson.vocabulary && lesson.vocabulary.byPattern || {})
      .filter((g) => (g.patternIds || []).includes(refPid));
    return groups.flatMap((g) => g.words || []);
  }

  /** practiceTemplate の '＿＿' を <input> に置換した HTML を作る。
   *  kuromoji の ruby 化と衝突しないよう、私用領域文字でプレースホルダー → ruby 後に戻す。 */
  function renderTemplate(tplText) {
    if (!tplText) return '';
    const PH_INPUT = '';
    const withPh = tplText.replace(/[_＿]{2,}/g, PH_INPUT);
    const rubied = ruby(withPh);
    return rubied.split(PH_INPUT).join('<input type="text" placeholder="" class="answer-input" autocomplete="off">');
  }

  /** β1 正解抽出 — examples[] から template ごとに「許容される正解配列」を作る。
   *  返り値は array<array<string>>（複数の有効な正解組）。 */
  /** namedCharacters の occupation/nationality に "——" のようなプレースホルダーが
   *  入っているケースを除外する（lesson_01 ケリーさんの occupation 等）。 */
  function isMeaningfulAttr(s) {
    if (typeof s !== 'string') return false;
    return s.replace(/[\s—\-–]/g, '').length > 0;
  }
  function extractAnswersP1(charName, examples, charObj) {
    const RE = /^(\S+?)さんは(\S+?)です。?$/;
    const out = [];
    const seen = new Set();
    for (const ex of examples || []) {
      const m = (ex.sentence || '').match(RE);
      if (!m) continue;
      if (m[1] !== charName) continue;
      if (seen.has(m[2])) continue;
      seen.add(m[2]);
      out.push([charName, m[2]]);
    }
    if (charObj) {
      if (isMeaningfulAttr(charObj.occupation)  && !seen.has(charObj.occupation))  { out.push([charName, charObj.occupation]);  seen.add(charObj.occupation); }
      if (isMeaningfulAttr(charObj.nationality) && !seen.has(charObj.nationality)) { out.push([charName, charObj.nationality]); seen.add(charObj.nationality); }
    }
    return out;
  }

  function extractAnswersP2Question(charName, charObj) {
    /* lesson_01 の p2 examples は「＿さんは＿ですか。」形式の文を含まないので、
     * namedCharacters の occupation/nationality から作る。 */
    const out = [];
    if (charObj && isMeaningfulAttr(charObj.occupation))  out.push([charName, charObj.occupation]);
    if (charObj && isMeaningfulAttr(charObj.nationality)) out.push([charName, charObj.nationality]);
    return out;
  }

  function extractAnswersP3(charName, buildingWord, occupation) {
    return [
      [charName, buildingWord, occupation],
      [charName, '東西' + buildingWord, occupation],
    ];
  }

  /** 1 つの練習エクササイズの HTML を組み立てる。
   *  images: [{ url, alt, label? }] の配列。1 件 → 単独画像、2 件 → 横並びで「＋」結合。
   *  templates: [{ html, blankCount }] の配列 — v0.3 で 1 件→N件に拡張。
   *    blankCount=0 の template は input なしで .template-row.no-input として灰色表示される。
   *  audioUrl: 音声 URL or null (null は disabled ボタン)。
   *  audioLabel: ツールチップ用ラベル。
   *  answers: array<array<string>> — 各要素は 1 組の正解（全 templates の input 数合計と同じ長さ）。
   *  any-match で○判定。null/undefined/[] のときは判定 UI を出さない。
   *  answerLabel: 「正解を表示」で表示する説明 — 省略時は answers から自動合成。 */
  function exerciseHtml({ index, images, templates, audioUrl, audioLabel, answers, answerLabel }) {
    const isPair = images.length >= 2;
    const wrapperCls = 'hint-images' + (isPair ? '' : ' single');
    let imagesHtml = '';
    if (isPair) {
      imagesHtml = `
        <div class="${wrapperCls}">
          <div class="hint-cell">
            ${imgHtml(images[0].url, images[0].alt)}
            ${images[0].label ? `<span class="hint-cell-label">${ruby(images[0].label)}</span>` : ''}
          </div>
          <span class="hint-plus">＋</span>
          <div class="hint-cell">
            ${imgHtml(images[1].url, images[1].alt)}
            ${images[1].label ? `<span class="hint-cell-label">${ruby(images[1].label)}</span>` : ''}
          </div>
        </div>
      `;
    } else if (images.length === 1) {
      imagesHtml = `
        <div class="${wrapperCls}">
          <div class="hint-cell">
            ${imgHtml(images[0].url, images[0].alt)}
            ${images[0].label ? `<span class="hint-cell-label">${ruby(images[0].label)}</span>` : ''}
          </div>
        </div>
      `;
    } else {
      imagesHtml = `<div class="${wrapperCls}"><span class="img-fallback">🖼️</span></div>`;
    }
    const tplArr = Array.isArray(templates) ? templates : [];
    const templatesHtml = tplArr.map((t) => {
      const noInputCls = (t && t.blankCount === 0) ? ' no-input' : '';
      return `<div class="template-row${noInputCls}">${t ? t.html : ''}</div>`;
    }).join('');
    const hasJudge = Array.isArray(answers) && answers.length > 0;
    const answersJson = hasJudge ? esc(JSON.stringify(answers)) : '';
    const judgeUi = hasJudge ? `
        <div class="judge-controls">
          <button type="button" class="judge-btn judge-check">${esc('答え合わせ')}</button>
          <button type="button" class="judge-btn judge-retry" style="display:none">${esc('もう一度')}</button>
          <button type="button" class="judge-btn judge-show">${esc('正解を表示')}</button>
        </div>
        <div class="judge-feedback" aria-live="polite"></div>
        <div class="judge-answer-list" style="display:none">${answerListHtml(answers, answerLabel)}</div>
    ` : '';
    /* β1: 例文・練習問題の音声は保留中のため出力しない。語彙チェックカードのみ
     * 音声ボタンを残す。再開する際は audioBtnHtml(audioUrl, audioLabel, ...) を戻す。 */
    return `
      <div class="exercise hint-exercise"${hasJudge ? ` data-answers="${answersJson}"` : ''}>
        ${imagesHtml}
        <div class="question">
          <strong>${index}.</strong>
          <div class="templates-block">${templatesHtml}</div>
        </div>
        ${judgeUi}
      </div>
    `;
  }

  /** 正解候補リストの表示 HTML を作る。
   *  answers: [[name, predicate], ...]
   *  answerLabel: 「鈴木さんは○○です。」のような template — {0},{1},... で置換 */
  function answerListHtml(answers, answerLabel) {
    if (!Array.isArray(answers) || answers.length === 0) return '';
    const items = answers.map((row) => {
      let line;
      if (answerLabel) {
        line = answerLabel.replace(/\{(\d+)\}/g, (_, i) => esc(row[+i] || ''));
      } else {
        line = row.map(esc).join(' / ');
      }
      return `<li>${line}</li>`;
    }).join('');
    return `<div class="answer-list-label">${esc('正解の例：')}</div><ul>${items}</ul>`;
  }

  /** v0.3: practiceTemplates 全件を 1 練習問題内に縦並び表示する。
   *  各 template の blank 数を解析し、blank≥1 のテンプレに input を出し、blank=0 のテンプレ
   *  (例: lesson_02 p2 「これは　なんですか。」 / p6 「どの人ですか。」) は input 無し
   *  テキスト hint として表示する。
   *
   *  judge UI (自動採点) は「全テンプレが同形 (blank 数が一致) かつ単一答え組を構成可能」
   *  なときのみ有効化する。異形 (例: lesson_01 p2 [2,1,1]) や blank=0 混在 (例: lesson_02 p6 [0,1])
   *  は judge UI を出さず生徒の自己採点に委ねる。 */
  function analyzeTemplates(rawTemplates) {
    return (rawTemplates || []).filter(t => t && t.pattern).map(t => {
      const blankCount = (t.pattern.match(/[_＿]{2,}/g) || []).length;
      return { pattern: t.pattern, html: renderTemplate(t.pattern), blankCount };
    });
  }
  /** 全 templates が同じ blank 数かどうか (judge UI 有効化条件)。 */
  function templatesAreUniform(tplInfos) {
    if (tplInfos.length === 0) return false;
    const first = tplInfos[0].blankCount;
    if (first === 0) return false;
    return tplInfos.every(t => t.blankCount === first);
  }
  /** singleTemplateAnswers ([[a,b], ...]) を N 個 つなげる (multi-template 統合答え)。
   *  例: single=[[name,attr]], N=3 → multi=[[name,attr,name,attr,name,attr]] */
  function expandAnswersForMultiTpl(singleTplAnswers, tplCount) {
    if (!Array.isArray(singleTplAnswers) || singleTplAnswers.length === 0) return null;
    if (tplCount <= 1) return singleTplAnswers;
    return singleTplAnswers.map(row => {
      const out = [];
      for (let i = 0; i < tplCount; i++) out.push(...row);
      return out;
    });
  }
  /** answerLabel を multi-template 用にコピーして連結 (改行で区切る)。 */
  function expandAnswerLabel(singleLabel, tplCount) {
    if (!singleLabel || tplCount <= 1) return singleLabel;
    return Array(tplCount).fill(singleLabel).join(' / ');
  }

  /** patterns[].practiceImageSource に応じて練習問題群の HTML を生成する。
   *   - "vocabulary"            : 語彙 1 件ごと 1 問 (画像: word.imageId)
   *   - "namedCharacters"       : 名前付きキャラ 1 件ごと 1 問 (画像: char.imageId)
   *   - "namedCharacters+vocab" : 人物 × 建物 のペア (画像 2 つ横並び)
   *   - 未指定                  : 後方互換で "vocabulary" として扱う */
  function buildExercisesFor(pat, lesson, registryEntries, audioRegistry) {
    const tplInfos = analyzeTemplates(pat.practiceTemplates);
    if (tplInfos.length === 0) return '';
    const tplCount = tplInfos.length;
    const uniform = templatesAreUniform(tplInfos);
    const source = pat.practiceImageSource || 'vocabulary';

    if (source === 'namedCharacters' || source === 'namedCharacters+vocab') {
      const chars = (lesson.namedCharacters || []);
      if (chars.length === 0) return '';

      if (source === 'namedCharacters') {
        return chars.map((c, i) => {
          const charNameShort = (c.name || '').replace('さん', '');
          /* β1: pat.id で答えロジック分岐。p1 は examples からも拾える。p2 は質問形式で
           * lesson_01 examples に該当形式が無いため namedCharacters fallback のみ。
           * v0.3: multi-template の場合、uniform (全 blank 数一致) のときのみ judge UI 有効。 */
          const singleAnswers = (pat.id === 'p2')
            ? extractAnswersP2Question(charNameShort, c)
            : extractAnswersP1(charNameShort, pat.examples, c);
          const singleLabel = (pat.id === 'p2')
            ? '{0}さんは{1}ですか。'
            : '{0}さんは{1}です。';
          const answers = uniform ? expandAnswersForMultiTpl(singleAnswers, tplCount) : null;
          const answerLabel = uniform ? expandAnswerLabel(singleLabel, tplCount) : null;
          return exerciseHtml({
            index: i + 1,
            images: [{
              url: imgUrl(c.imageId, registryEntries, 256),
              alt: c.name || '',
              label: c.name || '',
            }],
            templates: tplInfos,
            /* キャラクター名の音声(将来仕様・現状は audio registry に未収録 → グレーアウト) */
            audioUrl: audioUrlOf('char_' + charNameShort, audioRegistry),
            audioLabel: '人物名を聞く',
            answers,
            answerLabel,
          });
        }).join('');
      }

      /* namedCharacters+vocab: pattern.examples の文字列を直接データソースとする(v2.11.4 修正)。
         旧実装は namedCharacters[] と vocabulary.byPattern.p3.words[] を配列順 zip していたが、
         配列順序の意味が無いため誤ったペア(例: 鈴木+病院, ケリー+デパート 等)になっていた。
         例文「〇〇さんは東西XXのYYです。」から character/building/occupation を正規表現で抽出し、
         namedCharacters[] と vocabulary[].words[] を逆引きして imageId ペアを生成する。

         期待出力 (lesson_01 p3):
           タノムさん + 病院    (ex 3-1: タノムさんは東西病院の医者です)
           鈴木さん   + 学校    (ex 3-2: 鈴木さんは東西学校の先生です)
           キムさん   + 銀行    (ex 3-3: キムさんは東西銀行の会社員です)
           リンさん   + 大学    (ex 3-4: リンさんは東西大学の学生です)
           キムさん   + デパート (ex 3-5: キムさんは東西デパートの会社員です)
      */
      const RE_AFFIL = /^(\S+?)さんは(?:東西)?(\S+?)の(\S+?)です。?$/;
      const buildings = collectVocabForPattern(lesson, pat);
      const out = [];
      let n = 0;
      for (const ex of (pat.examples || [])) {
        const m = (ex.sentence || '').match(RE_AFFIL);
        if (!m) continue;
        const charNameShort = m[1];   /* 例: '鈴木' / 'リン' / 'タノム' (さん の前まで) */
        const buildingWord  = m[2];   /* 例: '病院' / '学校' (東西 を除いた語彙名) */
        const occupation    = m[3];   /* 例: '医者' / '先生' / '会社員' */

        const charObj = chars.find((c) => c && c.name && c.name.startsWith(charNameShort));
        const buildingObj = buildings.find((w) => w && w.word === buildingWord);
        if (!charObj || !buildingObj) continue;  /* 名前/語彙が見つからなければスキップ */

        const bImgId = buildingObj.imageId || ('word_' + buildingWord);
        n++;
        const singleAnswers = extractAnswersP3(charNameShort, buildingWord, occupation);
        const singleLabel = '{0}さんは{1}の{2}です。';
        out.push(exerciseHtml({
          index: n,
          images: [
            { url: imgUrl(charObj.imageId, registryEntries, 256),
              alt: charObj.name, label: charObj.name },
            { url: imgUrl(bImgId, registryEntries, 256),
              alt: buildingObj.word, label: buildingObj.word },
          ],
          templates: tplInfos,
          audioUrl: audioUrlOf(buildingObj.audioId || bImgId, audioRegistry),
          audioLabel: '語彙の音声を聞く',
          answers: uniform ? expandAnswersForMultiTpl(singleAnswers, tplCount) : null,
          answerLabel: uniform ? expandAnswerLabel(singleLabel, tplCount) : null,
        }));
      }
      return out.join('');
    }

    /* デフォルト = vocabulary: その文型(またはshareVocabWith先)の語彙 1 件ごと 1 問 */
    const words = collectVocabForPattern(lesson, pat);
    if (words.length === 0) return '';
    /* v0.3: uniform & blankCount=1 のとき、各 input に同じ vocab.word を埋める単一答え組。
     *   例: lesson_02 p1 (3 tpl, blank 1×3) → [[w, w, w]] が input 3 個に対応
     *   blank>=2 を含む / 異形 templates / blank=0 のみ は judge UI 出さない。 */
    const firstBlanks = tplInfos[0].blankCount;
    const canJudge = uniform && firstBlanks === 1;
    return words.map((w, i) => {
      const imgId = w.imageId || ('word_' + (w.word || ''));
      const answers = (canJudge && w.word) ? [Array(tplCount).fill(w.word)] : null;
      return exerciseHtml({
        index: i + 1,
        images: [{ url: imgUrl(imgId, registryEntries, 256), alt: w.word || '', label: w.word || '' }],
        templates: tplInfos,
        audioUrl: audioUrlOf(w.audioId || imgId, audioRegistry),
        audioLabel: (w.word || '') + ' を聞く',
        answers,
      });
    }).join('');
  }

  function buildPatternSection(t, lesson, registryEntries, audioRegistry) {
    const pat = (lesson.patterns || []).find((p) => p.id === t.patternId);
    if (!pat) return '';

    /* 例文リスト — 例文音声は保留中（pyopenjtalk/AivisSpeech 試用待ち）のため
     * β1 では再生ボタンを出さない。再開する際は audioBtnHtml を戻す。 */
    const examples = (pat.examples || []).map((ex) => {
      const url = imgUrl(ex.imageId, registryEntries, 256);
      return `
        <div class="example-row">
          <span class="no">${esc(ex.no || '')}</span>
          <div class="text">
            <div class="sentence">${ruby(ex.sentence || '')}</div>
            ${ex.sentenceEn ? `<div class="en en-text">${esc(ex.sentenceEn)}</div>` : ''}
          </div>
          ${imgHtml(url, ex.no || '', 'example-img')}
        </div>
      `;
    }).join('');

    /* 練習問題 (practiceImageSource で画像種類を分岐) */
    const exercises = buildExercisesFor(pat, lesson, registryEntries, audioRegistry);

    const labelEn = formatGrammarConcept(pat.grammarConcept, pat.jlptLevel);
    return `
      <section class="lesson-section">
        <h2>${ruby('文型')} ${esc(pat.id)}: ${ruby(pat.label || pat.pattern || '')}</h2>
        <div class="section-h2-en en-text">Pattern ${esc(pat.id)}${labelEn ? ' — ' + esc(labelEn) : ''}</div>

        ${pat.canDo ? `
        <div class="can-do">
          <span class="label">できるようになること</span>
          <span class="en-text" style="font-size: var(--font-size-caption); color: var(--color-text-muted); display: block; margin-bottom: 4px;">Can-do</span>
          ${ruby(pat.canDo)}
          ${pat.canDoEn ? `<span class="can-do-en en-text">${esc(pat.canDoEn)}</span>` : (labelEn ? `<span class="can-do-en en-text">${esc(labelEn)}</span>` : '')}
        </div>` : ''}

        ${examples ? `<h3>${ruby('例文')}を ${ruby('読')}んでみよう</h3>
        <div class="section-h3-en en-text">Read the example sentences</div>
        <div class="example-list">${examples}</div>` : ''}

        ${exercises ? `<h3>${ruby('練習問題')} (${ruby('絵')}を ${ruby('見')}て ${ruby('文')}を ${ruby('完成')}させよう)</h3>
        <div class="section-h3-en en-text">Practice exercises — look at the picture and complete the sentence</div>
        <div class="exercise-list">${exercises}</div>` : ''}
      </section>
    `;
  }

  function buildVocabSection(lesson, session, registryEntries, audioRegistry) {
    const vocab = lesson.vocabulary;
    if (!vocab || !vocab.byPattern) return '';
    const teachIds = new Set((session.teach || []).map((t) => t.patternId));
    const groups = Object.entries(vocab.byPattern).filter(([_, g]) =>
      (g.patternIds || []).some((id) => teachIds.has(id))
    );
    if (groups.length === 0) return '';

    const items = groups.flatMap(([_, group]) => group.words || []).map((w) => {
      const imgId = w.imageId || ('word_' + (w.word || ''));
      const url = imgUrl(imgId, registryEntries, 256);
      const cardImg = url
        ? `<img src="${esc(url)}" alt="${esc(w.word)}" loading="eager" decoding="async" onerror="this.outerHTML='&lt;span class=img-fallback&gt;🖼️&lt;/span&gt;'">`
        : `<span class="img-fallback">🖼️</span>`;
      const audioUrl = audioUrlOf(w.audioId || imgId, audioRegistry);
      // 語彙カードの読み (.reading) は HTML に直書きしない。
      // 漢字部分はふりがなトグルが管理する <ruby> 経由でのみ表示する。
      // 単語カードの英語は英語トグルに連動して表示/非表示 (.en-text を付ける)。
      return `
        <div class="vocab-item">
          ${cardImg}
          <div class="word-line">
            <div class="word">${ruby(w.word || '')}</div>
            ${audioBtnHtml(audioUrl, (w.word || '') + ' を聞く', 'audio-btn-inline')}
          </div>
          ${w.en ? `<span class="en en-text">${esc(w.en)}</span>` : ''}
        </div>
      `;
    }).join('');

    return `
      <section class="lesson-section">
        <h2>${ruby('語彙')}チェック</h2>
        <div class="section-h2-en en-text">Vocabulary check</div>
        <p>${ruby('絵')}を ${ruby('見')}て、${ruby('言')}えるか ${ruby('確認')}しよう。</p>
        <p class="en-text" style="font-size: var(--font-size-small); color: var(--color-text-muted); margin: -8px 0 12px;">Look at each picture and check whether you can say the word.</p>
        <div class="vocab-check">${items}</div>
      </section>
    `;
  }

  function buildReflectSection(session, lessonsByNo) {
    const teach = session.teach || [];
    const items = teach.map((t) => {
      const lesson = lessonsByNo[t.lessonNo];
      const pat = lesson && (lesson.patterns || []).find((p) => p.id === t.patternId);
      if (!pat || !pat.canDo) return '';
      return `
        <li>
          <input type="checkbox" id="cd-${esc(t.patternId)}">
          <label for="cd-${esc(t.patternId)}">
            ${ruby(pat.canDo)}
            ${pat.canDoEn ? `<div class="en-text" style="font-size: var(--font-size-small); color: var(--color-text-muted); margin-top: 4px;">${esc(pat.canDoEn)}</div>` : ''}
          </label>
        </li>
      `;
    }).filter(Boolean).join('');

    return `
      <section class="lesson-section reflect">
        <h2>${ruby('振')}り${ruby('返')}り</h2>
        <div class="section-h2-en en-text">Reflection</div>
        <p>${ruby('今日')}できるようになったことに ${ruby('印')}をつけよう。</p>
        <p class="en-text" style="font-size: var(--font-size-small); color: var(--color-text-muted); margin: -8px 0 12px;">Check the things you can now do.</p>
        <ul>${items || '<li>(項目なし)</li>'}</ul>
      </section>
    `;
  }

  // ── 全体組み立て ─────────────────────────────────────────────────────
  function buildHtml(ctx) {
    const { session, lesson, lessonsByNo, imageRegistry, audioRegistry } = ctx;
    const registryEntries = imageRegistry && imageRegistry.entries ? imageRegistry.entries : imageRegistry;
    const s = session.session || {};
    const l = lesson.lesson || {};
    const title = `第${l.no || '?'}課 宿題 (${s.id || ''})`;

    const teach = session.teach || [];
    const patternSections = teach.map((t) => {
      const sourceLesson = lessonsByNo[t.lessonNo] || lesson;
      return buildPatternSection(t, sourceLesson, registryEntries, audioRegistry);
    }).join('');

    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
${FONT_IMPORT}
${DESIGN_TOKENS_CSS}
${HOMEWORK_CSS}
</style>
</head>
<body class="no-ruby no-en">
<main>
  <div class="toolbar">
    <button id="ruby-toggle" class="off" type="button">ふりがな OFF</button>
    <button id="en-toggle" class="en-toggle off" type="button">英語 OFF</button>
    <button id="hint-toggle" type="button">💡 ヒントを隠す</button>
    <button id="print" type="button">印刷</button>
    <span class="meta">${esc(title)}</span>
  </div>

  ${buildCover(session, lesson)}
  ${buildVocabSection(lesson, session, registryEntries, audioRegistry)}
  ${patternSections}
  ${buildReflectSection(session, lessonsByNo)}
</main>
<script>
${INLINE_JS}
</script>
</body>
</html>`;
  }

  // ── 公開 API ─────────────────────────────────────────────────────────
  async function generate(ctx) {
    const html = buildHtml(ctx);
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  window.HomeworkHtml = {
    generate,
    _meta: { version: '0.3-multi-template-render', createdAt: '2026-05-27' },
  };
})();
