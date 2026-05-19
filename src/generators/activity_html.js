/**
 * activity_html.js  —  アクティビティ HTML ジェネレーター
 *
 * Step 3 実装：8件のアクティビティ UI を実装
 * データ駆動・特定の課にハードコードしない
 *
 * Exports (ブラウザ埋め込み用グローバル):
 *   buildActivityHtml(session, lessonDataMap, imageRegistry, activityCatalog)
 *   → HTML string | null
 */

'use strict';

/* ════════════════════════════════════════════════════
   PUBLIC ENTRY POINT
   ════════════════════════════════════════════════════ */

/**
 * @param {Object} session           - session_NNN.json のパース済みオブジェクト
 * @param {Object} lessonDataMap     - { 1: lesson_01_data, 2: lesson_02_data, ... }
 * @param {Object} imageRegistry     - master_image_registry.json のパース済みオブジェクト
 * @param {Object} activityCatalog   - activity_catalog.json のパース済みオブジェクト
 * @returns {string|null}
 */
function buildActivityHtml(session, lessonDataMap, imageRegistry, activityCatalog) {
  /* --- 授業で扱う課・文型を収集 (single/multi 共通) --- */
  const taughtItems  = session.teach || [];
  const lessonNos    = [...new Set(taughtItems.map(t => t.lessonNo))];
  const lessons      = lessonNos.map(no => lessonDataMap[no]).filter(Boolean);
  const taughtPids   = taughtItems.map(t => t.patternId);

  /* --- 選択された活動 ID を集める ---
   * 優先順位:
   *   1) session.mainActivities[] (v2.0 形式・複数件可)
   *   2) session.activity.selectedId (v1.0 互換・単一)
   * mainActivities が 2 件以上ある時はタブ切り替えの multi モード、
   * 1 件以下は従来通り single モード。
   */
  const main = Array.isArray(session.mainActivities) ? session.mainActivities : [];
  const idsFromMain = main.map(m => m && m.activityId).filter(Boolean);

  /* required かつ catalog に存在する活動だけを採用 */
  function resolveActDef(id) {
    const def = (activityCatalog.activities || []).find(a => a.id === id);
    if (!def || def.contentRequirement?.judgment !== 'required') return null;
    return def;
  }

  /* --- multi モード: mainActivities[] に 2 件以上 --- */
  if (idsFromMain.length >= 2) {
    const items = [];
    for (const id of idsFromMain) {
      const def = resolveActDef(id);
      if (!def) continue;
      const block = buildActivityBlock(id, lessons, taughtPids, def, session);
      items.push({ id, def, block });
    }
    if (items.length === 0) return null;
    if (items.length === 1) {
      /* 結果的に有効な活動が 1 件しかない → single ページにフォールバック */
      return buildFullPage(session, items[0].def, items[0].block);
    }
    return buildFullPageMulti(session, items);
  }

  /* --- single モード --- */
  const selectedId = session.activity?.selectedId || idsFromMain[0];
  if (!selectedId) return null;
  const actDef = resolveActDef(selectedId);
  if (!actDef) return null;
  const block = buildActivityBlock(selectedId, lessons, taughtPids, actDef, session);
  return buildFullPage(session, actDef, block);
}

/* ════════════════════════════════════════════════════
   DISPATCHER
   ════════════════════════════════════════════════════ */

function buildActivityBlock(actId, lessons, taughtPids, actDef, session) {
  switch (actId) {
    case 'act_online_roulette':         return buildOnlineRoulette(lessons, taughtPids, actDef, session);
    case 'act_memory_matching':         return buildMemoryMatching(lessons, taughtPids, actDef);
    case 'act_vocab_bingo':             return buildVocabBingo(lessons, taughtPids, actDef);
    case 'act_whiteboard_categorize':   return buildWhiteboardCategorize(lessons, taughtPids, actDef);
    case 'act_grammar_auction':         return buildGrammarAuction(lessons, taughtPids, actDef);
    case 'act_battleship':              return buildBattleship(lessons, taughtPids, actDef);
    case 'act_person_guessing_quiz':    return buildPersonGuessingQuiz(lessons, taughtPids, actDef);
    case 'act_personality_quiz':        return buildPersonalityQuiz(lessons, taughtPids, actDef);
    case 'act_hajimemashite_conversation': return buildHajimemashiteConversation(lessons, taughtPids, actDef);
    default:
      return `<div class="placeholder-box">
        <p class="placeholder-icon">🚧</p>
        <p class="placeholder-text">このアクティビティの専用 UI は今後実装予定です。</p>
        <p class="placeholder-id">${h(actId)}</p>
      </div>`;
  }
}

/* ════════════════════════════════════════════════════
   UTILITY HELPERS
   ════════════════════════════════════════════════════ */

/** HTML エスケープ */
function h(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** ふりがな付き表示（ruby_dictionary を使わずインラインで対応） */
function withRuby(word, reading) {
  if (!reading || reading === word) return h(word);
  return `<ruby>${h(word)}<rt>${h(reading)}</rt></ruby>`;
}

/** 名前付きキャラクター名にふりがなを付与する。
 *  lesson_NN.json の namedCharacters[] には reading フィールドが無いため、
 *  既知の漢字名は固定辞書で読みを補う(カタカナ名はそのまま返す)。 */
function rubifyCharName(name) {
  if (typeof name !== 'string' || !name) return '';
  const NAMES = {
    '鈴木さん': `${withRuby('鈴木','すずき')}さん`,
    '田中さん': `${withRuby('田中','たなか')}さん`,
    '佐藤さん': `${withRuby('佐藤','さとう')}さん`,
    '山田さん': `${withRuby('山田','やまだ')}さん`,
  };
  return NAMES[name] || h(name);
}

/** 語彙配列をランダムシャッフル（Fisher-Yates、決定論的シードなし） */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 授業で教える文型に関連する語彙を収集 */
function collectVocab(lessons, taughtPids) {
  const words = [];
  const seen  = new Set();

  for (const lesson of lessons) {
    const byPattern = lesson.vocabulary?.byPattern || {};
    for (const [groupKey, group] of Object.entries(byPattern)) {
      /* taughtPids のいずれかが groupKey に含まれる場合に収録 */
      const relevant = taughtPids.length === 0
        || taughtPids.some(pid => groupKey.startsWith(pid) || groupKey.split('_').includes(pid));
      if (!relevant) continue;

      for (const w of group.words || []) {
        if (!seen.has(w.word)) {
          seen.add(w.word);
          words.push({ ...w, _group: groupKey });
        }
      }
    }
  }
  return words;
}

/** 教える文型オブジェクトを収集 */
function collectPatterns(lessons, taughtPids) {
  const result = [];
  for (const lesson of lessons) {
    for (const p of lesson.patterns || []) {
      if (taughtPids.length === 0 || taughtPids.includes(p.id)) {
        result.push({ ...p, _lessonNo: lesson.lesson?.no });
      }
    }
  }
  return result;
}

/* ════════════════════════════════════════════════════
   CSS / HTML FRAME
   ════════════════════════════════════════════════════ */

function getCss() {
  return `
/* ── Design Tokens ── */
:root {
  --bg-primary:   #FAF8F0;
  --bg-subtle:    #F5EFE0;
  --bg-surface:   #FFFFFF;
  --text-main:    #1B2C40;
  --text-subtle:  #6B7C85;
  --text-muted:   #8A95A0;
  --ui-primary:   #7090B0;
  --ui-hover:     #5A7A9A;
  --ui-dark:      #1B2C40;
  --accent:       #E0B040;
  --accent-muted: #FAEEDA;
  --correct:      #3B6D11;
  --wrong:        #993C1D;
  --font:         'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic', sans-serif;
  --radius-sm:    8px;
  --radius-md:    12px;
  --radius-lg:    14px;
  --shadow-sm:    0 1px 4px rgba(27,44,64,.06);
  --shadow-md:    0 2px 12px rgba(27,44,64,.10);
  --shadow-lg:    0 4px 24px rgba(27,44,64,.15);
  --ease:         cubic-bezier(.4,0,.2,1);
}

/* ── Reset ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font);background:var(--bg-primary);color:var(--text-main);
  line-height:1.6;min-height:100vh;padding-bottom:6rem;word-break:auto-phrase}

/* ── Page Header ── */
.page-header{background:var(--ui-dark);color:#fff;padding:1.25rem 1.5rem 1rem;
  display:flex;align-items:baseline;gap:.75rem;flex-wrap:wrap}
.page-header .lesson-badge{font-size:.75rem;font-weight:700;letter-spacing:.08em;
  background:var(--accent);color:var(--ui-dark);padding:.2rem .6rem;border-radius:4px}
.page-header h1{font-size:1.15rem;font-weight:700;color:#fff}
.page-header .sub{font-size:.8rem;color:rgba(255,255,255,.6);margin-left:auto}

/* ── Toggle Bar ── */
.toggle-bar{position:sticky;top:0;z-index:100;background:rgba(250,248,240,.96);
  backdrop-filter:blur(8px);border-bottom:1px solid rgba(27,44,64,.08);
  padding:.6rem 1.5rem;display:flex;gap:.5rem;align-items:center}
.toggle-bar .label{font-size:.7rem;color:var(--text-subtle);margin-right:.25rem;white-space:nowrap}
.toggle-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .8rem;
  border-radius:20px;border:1.5px solid var(--ui-primary);background:transparent;
  color:var(--ui-primary);font-family:var(--font);font-size:.75rem;font-weight:700;
  cursor:pointer;transition:background .2s var(--ease),color .2s var(--ease),border-color .2s var(--ease);
  white-space:nowrap;min-height:32px}
.toggle-btn.active{background:var(--ui-primary);color:#fff;border-color:var(--ui-primary)}
.toggle-btn:hover:not(.active){border-color:var(--ui-hover);color:var(--ui-hover)}
.toggle-btn .icon{font-size:.9rem}

/* ── Container ── */
.container{max-width:720px;margin:0 auto;padding:1.5rem 1.25rem 2rem}

/* ── Section Heading ── */
.section-heading{font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:var(--text-muted);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
.section-heading::after{content:'';flex:1;height:1px;background:rgba(27,44,64,.1)}

/* ── Card ── */
.card{background:var(--bg-surface);border-radius:var(--radius-lg);
  box-shadow:var(--shadow-md);padding:1.5rem 1.75rem;margin-bottom:1.25rem}

/* ── Activity Title ── */
.activity-title{font-size:1.45rem;font-weight:700;color:var(--text-main);
  line-height:1.35;margin-bottom:.5rem}
.activity-title-en{font-size:.85rem;color:var(--text-subtle);font-weight:500;
  transition:opacity .25s var(--ease),max-height .3s var(--ease)}

/* ── Setting Text ── */
.setting-text{font-size:.92rem;color:var(--text-main);line-height:1.7;
  background:var(--bg-subtle);border-left:3px solid var(--accent);
  padding:.75rem 1rem;border-radius:0 var(--radius-sm) var(--radius-sm) 0}
.setting-text-en{font-size:.8rem;color:var(--text-subtle);margin-top:.4rem;
  font-style:italic;transition:opacity .25s var(--ease),max-height .3s var(--ease)}

/* ── Steps ── */
.steps-list{list-style:none;display:flex;flex-direction:column;gap:.75rem}
.step-item{display:flex;align-items:flex-start;gap:.9rem}
.step-num{flex-shrink:0;width:2rem;height:2rem;border-radius:50%;background:var(--accent);
  color:var(--ui-dark);font-size:.8rem;font-weight:700;display:flex;
  align-items:center;justify-content:center;margin-top:.15rem}
.step-body{flex:1}
.step-ja{font-size:1.05rem;font-weight:500;color:var(--text-main);line-height:1.5}
.step-en{font-size:.82rem;color:var(--text-subtle);margin-top:.2rem;
  transition:opacity .25s var(--ease),max-height .3s var(--ease)}

/* ── Ruby ──
   Stage 1 既知問題 #4: ふりがなの色は inherit で本文と一致させる。
   Stage 1 既知問題 #3: ふりがな OFF 時は display:none で完全消去(スペース残らない)。 */
ruby{ruby-align:center}
rt{font-size:.52em;color:inherit;font-weight:400;transition:opacity .25s var(--ease)}

/* ── Visibility Helpers ── */
body.hide-en .step-en,body.hide-en .setting-text-en,body.hide-en .activity-title-en,
body.hide-en .en-text,body.hide-en .bubble-en{
  opacity:0;max-height:0;overflow:hidden;margin-top:0}
body.hide-furigana rt,
body.hide-furigana rp{display:none !important}

/* ── Tip Box ── */
.tip-box{background:linear-gradient(135deg,var(--accent-muted),var(--bg-subtle));
  border:1px solid rgba(224,176,64,.4);border-radius:var(--radius-md);
  padding:1rem 1.25rem;font-size:.85rem;color:var(--text-main);line-height:1.7;margin-bottom:1.25rem}
.tip-box strong{color:#8A6200;font-size:.7rem;letter-spacing:.08em;
  text-transform:uppercase;display:block;margin-bottom:.3rem}

/* ── Buttons (Game) ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;
  padding:.5rem 1.2rem;border-radius:var(--radius-sm);border:none;cursor:pointer;
  font-family:var(--font);font-size:.9rem;font-weight:700;transition:all .2s var(--ease);
  min-height:44px}
.btn-primary{background:var(--ui-primary);color:#fff}
.btn-primary:hover{background:var(--ui-hover)}
.btn-accent{background:var(--accent);color:var(--ui-dark)}
.btn-accent:hover{background:#c89a30}
.btn-ghost{background:transparent;border:1.5px solid var(--ui-primary);color:var(--ui-primary)}
.btn-ghost:hover{background:var(--ui-primary);color:#fff}
.btn:disabled{opacity:.4;cursor:not-allowed}

/* ── Score/Status Bar ── */
.status-bar{display:flex;gap:1rem;align-items:center;flex-wrap:wrap;
  background:var(--bg-subtle);border-radius:var(--radius-md);padding:.75rem 1rem;margin-bottom:1rem}
.status-item{display:flex;align-items:center;gap:.4rem;font-size:.85rem;font-weight:700}
.status-item .label{color:var(--text-subtle);font-weight:400;font-size:.75rem}
.status-item .value{color:var(--text-main)}

/* ── Feedback Message ── */
.feedback{text-align:center;font-size:1rem;font-weight:700;padding:.5rem;
  border-radius:var(--radius-sm);margin-top:.75rem;min-height:2rem}
.feedback.correct{color:var(--correct);background:#ecf5e6}
.feedback.wrong{color:var(--wrong);background:#f9ece8}
.feedback.info{color:var(--ui-primary);background:var(--accent-muted)}

/* ── Placeholder ── */
.placeholder-box{text-align:center;padding:3rem 2rem;border:2px dashed rgba(27,44,64,.15);
  border-radius:var(--radius-lg);color:var(--text-muted)}
.placeholder-icon{font-size:2.5rem;margin-bottom:.75rem}
.placeholder-text{font-size:1rem;margin-bottom:.5rem}
.placeholder-id{font-size:.75rem;font-family:monospace;color:var(--text-muted)}

/* ── Spacing ── */
.mt1{margin-top:1rem}.mt2{margin-top:1.5rem}.mb2{margin-bottom:1.5rem}

/* ── Activity Tabs (multi-activity モード時のみ表示) ──
 * toggle-bar の直下に sticky 配置。1 件のみのとき .activity-tabs は出力されない。
 * 切り替えは display 制御だけ — 各活動の IIFE は読み込み時に初期化済み。 */
.activity-tabs{
  position:sticky;top:53px;z-index:99;
  background:rgba(250,248,240,.96);
  backdrop-filter:blur(8px);
  border-bottom:1px solid rgba(27,44,64,.08);
  padding:.55rem 1.5rem;
  display:flex;gap:.4rem;flex-wrap:wrap;
  overflow-x:auto;
}
.activity-tabs .label{
  font-size:.7rem;color:var(--text-subtle);
  margin-right:.25rem;white-space:nowrap;align-self:center
}
.activity-tab-btn{
  display:inline-flex;align-items:center;gap:.4rem;
  padding:.35rem .9rem;border-radius:20px;
  border:1.5px solid rgba(27,44,64,.18);
  background:transparent;color:var(--text-subtle);
  font-family:var(--font);font-size:.78rem;font-weight:700;
  cursor:pointer;white-space:nowrap;min-height:32px;
  transition:background .2s var(--ease),color .2s var(--ease),border-color .2s var(--ease);
}
.activity-tab-btn:hover:not(.active){
  background:var(--bg-subtle);
  color:var(--text-main);
  border-color:var(--ui-primary);
}
.activity-tab-btn.active{
  background:var(--ui-primary);color:#fff;border-color:var(--ui-primary);
}
.activity-tab-btn .tab-num{
  font-size:.65rem;opacity:.7;font-weight:400;
}
.activity-pane{display:none}
.activity-pane.active{display:block}
`;
}

function buildFullPage(session, actDef, mainContent) {
  const s = session.session || {};
  const lessonNos = [...new Set((session.teach || []).map(t => t.lessonNo))];
  /* <title> タグ用は plain text、page-header の lesson-badge 用は ruby HTML 付き */
  const lessonLabelPlain = lessonNos.map(n => `第${n}課`).join('・') || '—';
  const lessonLabelHtml  = lessonNos.map(n => `${withRuby('第','だい')}${h(String(n))}${withRuby('課','か')}`).join('・') || '—';
  const titleJa = actDef.titleJa || actDef.name || actDef.id;
  const date = s.date || '';
  const studentId = s.studentId ? `${s.studentId}さん` : '';
  const sessionNo  = s.id || '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${h(lessonLabelPlain)} アクティビティ｜${h(titleJa)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
  <style>${getCss()}</style>
</head>
<body>

  <header class="page-header">
    <span class="lesson-badge">${lessonLabelHtml}</span>
    <h1>アクティビティ</h1>
    <span class="sub">${h(sessionNo)}${studentId ? ' ／ ' + h(studentId) : ''}${date ? ' ／ ' + h(date) : ''}</span>
  </header>

  <div class="toggle-bar">
    <span class="label">表示：</span>
    <button class="toggle-btn active" id="btn-furigana" aria-pressed="true"
            onclick="toggleFeature('furigana',this)">
      <span class="icon">あ</span>ふりがな
    </button>
    <button class="toggle-btn active" id="btn-english" aria-pressed="true"
            onclick="toggleFeature('english',this)">
      <span class="icon">🇬🇧</span>英語
    </button>
  </div>

  <main class="container">
${mainContent}
  </main>

  <script>
    const _state = { showEnglish: true, showFurigana: true };
    function toggleFeature(f, btn) {
      if (f === 'english') {
        _state.showEnglish = !_state.showEnglish;
        document.body.classList.toggle('hide-en', !_state.showEnglish);
        btn.classList.toggle('active', _state.showEnglish);
        btn.setAttribute('aria-pressed', String(_state.showEnglish));
      }
      if (f === 'furigana') {
        _state.showFurigana = !_state.showFurigana;
        document.body.classList.toggle('hide-furigana', !_state.showFurigana);
        btn.classList.toggle('active', _state.showFurigana);
        btn.setAttribute('aria-pressed', String(_state.showFurigana));
      }
    }
  </script>
</body>
</html>`;
}

/* ════════════════════════════════════════════════════
   MULTI-ACTIVITY PAGE  (mainActivities[] 2件以上)
   タブで切り替える。各活動 IIFE は読み込み時に初期化済み
   (display:none でも DOM 上に存在するため動作する)。
   ════════════════════════════════════════════════════ */

function buildFullPageMulti(session, items) {
  const s = session.session || {};
  const lessonNos = [...new Set((session.teach || []).map(t => t.lessonNo))];
  const lessonLabelPlain = lessonNos.map(n => `第${n}課`).join('・') || '—';
  const lessonLabelHtml  = lessonNos.map(n => `${withRuby('第','だい')}${h(String(n))}${withRuby('課','か')}`).join('・') || '—';
  const date = s.date || '';
  const studentId = s.studentId ? `${s.studentId}さん` : '';
  const sessionNo = s.id || '';

  /* タブナビゲーション */
  const tabs = items.map((it, idx) => {
    const name = it.def.name || it.id;
    const nameEn = it.def.nameEn || '';
    const activeCls = idx === 0 ? ' active' : '';
    return `<button class="activity-tab-btn${activeCls}"
              id="tab-${h(it.id)}"
              type="button"
              aria-controls="pane-${h(it.id)}"
              aria-selected="${idx === 0 ? 'true' : 'false'}"
              onclick="switchActivityTab('${h(it.id)}')">
              <span class="tab-num">${idx + 1}.</span>
              <span>${h(name)}</span>
            </button>`;
  }).join('');

  /* 各ペイン */
  const panes = items.map((it, idx) => {
    const activeCls = idx === 0 ? ' active' : '';
    return `<section class="activity-pane${activeCls}" id="pane-${h(it.id)}" role="tabpanel" aria-labelledby="tab-${h(it.id)}">
${it.block}
    </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${h(lessonLabelPlain)} アクティビティ｜${items.length}件</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
  <style>${getCss()}</style>
</head>
<body>

  <header class="page-header">
    <span class="lesson-badge">${lessonLabelHtml}</span>
    <h1>アクティビティ <span style="opacity:.6;font-size:.85rem;font-weight:500">(${items.length}件)</span></h1>
    <span class="sub">${h(sessionNo)}${studentId ? ' ／ ' + h(studentId) : ''}${date ? ' ／ ' + h(date) : ''}</span>
  </header>

  <!-- Stage 1 既知問題 #5: UI 要素には ruby を一切付けない (トグルボタンのラベルは平文のまま) -->
  <div class="toggle-bar">
    <span class="label">表示：</span>
    <button class="toggle-btn active" id="btn-furigana" aria-pressed="true"
            onclick="toggleFeature('furigana',this)">
      <span class="icon">あ</span>ふりがな
    </button>
    <button class="toggle-btn active" id="btn-english" aria-pressed="true"
            onclick="toggleFeature('english',this)">
      <span class="icon">🇬🇧</span>英語
    </button>
  </div>

  <!-- アクティビティタブ (UI 要素・Stage 1 #5 によりラベルに ruby は付けない。
       活動名側は activity-title 等で本文として ruby 付与する) -->
  <nav class="activity-tabs" role="tablist" aria-label="アクティビティ切り替え">
    <span class="label">活動：</span>
    ${tabs}
  </nav>

  <main class="container">
${panes}
  </main>

  <script>
    /* 共通: 英語・ふりがなトグル(全ペイン共通) */
    const _state = { showEnglish: true, showFurigana: true };
    function toggleFeature(f, btn) {
      if (f === 'english') {
        _state.showEnglish = !_state.showEnglish;
        document.body.classList.toggle('hide-en', !_state.showEnglish);
        btn.classList.toggle('active', _state.showEnglish);
        btn.setAttribute('aria-pressed', String(_state.showEnglish));
      }
      if (f === 'furigana') {
        _state.showFurigana = !_state.showFurigana;
        document.body.classList.toggle('hide-furigana', !_state.showFurigana);
        btn.classList.toggle('active', _state.showFurigana);
        btn.setAttribute('aria-pressed', String(_state.showFurigana));
      }
    }

    /* アクティビティタブ切替 (display 制御のみ・再初期化なし)
       各活動の IIFE は読み込み時に初期化済みなので、表示切替は
       .active クラスの付け外しだけで完結する。 */
    function switchActivityTab(id) {
      document.querySelectorAll('.activity-tab-btn').forEach(b => {
        const isThis = b.id === 'tab-' + id;
        b.classList.toggle('active', isThis);
        b.setAttribute('aria-selected', String(isThis));
      });
      document.querySelectorAll('.activity-pane').forEach(p => {
        p.classList.toggle('active', p.id === 'pane-' + id);
      });
      /* URL hash でディープリンク対応(任意) */
      try { history.replaceState(null, '', '#' + id); } catch(_){}
    }

    /* 起動時: URL hash でタブ指定があれば従う */
    (function(){
      const hash = (location.hash || '').replace(/^#/, '');
      if (hash && document.getElementById('pane-' + hash)) {
        switchActivityTab(hash);
      }
    })();
  </script>
</body>
</html>`;
}

/* ════════════════════════════════════════════════════
   #1  ACT_MEMORY_MATCHING  —  語彙カードの神経衰弱
   ════════════════════════════════════════════════════ */

function buildMemoryMatching(lessons, taughtPids, actDef) {
  const vocab = collectVocab(lessons, taughtPids);
  /* 最大 8 ペア（表: 日本語, 裏: 英語）*/
  const pairs = vocab.slice(0, 8).map(w => ({
    ja:      w.word,
    reading: w.reading,
    en:      w.en
  }));
  const pairsJson = JSON.stringify(pairs);

  return `
    <!-- ① Activity Header -->
    <div class="card mb2">
      <p class="section-heading">アクティビティ</p>
      <h2 class="activity-title">${withRuby('神経衰弱','しんけいすいじゃく')}（${withRuby('語彙','ごい')}マッチング）</h2>
      <p class="activity-title-en en-text">Vocabulary Memory Matching</p>
      <div class="mt1">
        <p class="setting-text">
          ${withRuby('裏向き','うらむき')}のカードを2${withRuby('枚','まい')}めくって、
          ${withRuby('日本語','にほんご')}と${withRuby('英語','えいご')}が${withRuby('一致','いっち')}したらペア${withRuby('成立','せいりつ')}！<br>
          ${withRuby('一致','いっち')}したら「〜は〜です」で${withRuby('文','ぶん')}を${withRuby('作','つく')}ってください。
        </p>
        <p class="setting-text-en en-text">
          Flip two cards. If the Japanese word matches the English meaning, it's a pair!
          When you get a pair, make a sentence: "〜は〜です."
        </p>
      </div>
    </div>

    <!-- ② Game Board -->
    <div class="card mb2">
      <div class="status-bar">
        <div class="status-item"><span class="label">ペア</span><span class="value" id="mm-score">0 / ${pairs.length}</span></div>
        <div class="status-item"><span class="label">${withRuby('試行回数','しこうかいすう')}</span><span class="value" id="mm-tries">0</span></div>
        <button class="btn btn-ghost" onclick="mmReset()" style="margin-left:auto">🔄 リセット</button>
      </div>

      <div id="mm-grid" style="
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:.75rem;
        margin-bottom:1rem
      "></div>

      <div id="mm-feedback" class="feedback"></div>
    </div>

    <!-- ③ Sentence Box -->
    <div class="card mb2" id="mm-sentence-box" style="display:none">
      <p class="section-heading">ペア${withRuby('成立','せいりつ')}！${withRuby('文','ぶん')}を${withRuby('作','つく')}ろう</p>
      <p id="mm-sentence" style="font-size:1.2rem;font-weight:700;text-align:center;padding:.75rem 0"></p>
      <p id="mm-sentence-en" class="en-text" style="text-align:center;font-size:.85rem;color:var(--text-subtle);font-style:italic"></p>
    </div>

  <style>
    .mm-card{
      aspect-ratio:1;
      border-radius:var(--radius-md);
      background:var(--ui-primary);
      color:#fff;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
      font-size:1.6rem;
      font-weight:700;
      transition:transform .25s var(--ease),background .2s var(--ease),box-shadow .2s;
      box-shadow:var(--shadow-md);
      user-select:none;
      position:relative;
    }
    .mm-card:hover:not(.flipped):not(.matched){
      transform:scale(1.04);
      background:var(--ui-hover);
    }
    .mm-card.flipped{
      background:var(--bg-surface);
      color:var(--text-main);
      border:2px solid var(--ui-primary);
      font-size:1rem;
      text-align:center;
      padding:.25rem;
      line-height:1.3;
    }
    .mm-card.matched{
      background:#ecf5e6;
      border:2px solid var(--correct);
      color:var(--correct);
      cursor:default;
      transform:scale(.97);
    }
    .mm-card.flipped ruby rt{font-size:.48em}
  </style>

  <script>
  (function(){
    const PAIRS = ${pairsJson};

    /* カード配列：日本語カード + 英語カード をシャッフル */
    let cards, flipped, matched, tries, lockBoard;

    function buildCards() {
      const arr = [];
      PAIRS.forEach((p,i) => {
        arr.push({ id: i, type: 'ja', word: p.ja, reading: p.reading, en: p.en });
        arr.push({ id: i, type: 'en', word: p.en,  reading: '',        en: p.en });
      });
      /* Fisher-Yates */
      for(let i=arr.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]]=[arr[j],arr[i]];
      }
      return arr;
    }

    function render() {
      const grid = document.getElementById('mm-grid');
      grid.innerHTML = '';
      cards.forEach((c,idx) => {
        const div = document.createElement('div');
        div.className = 'mm-card' + (c.flipped?' flipped':'') + (c.matched?' matched':'');
        if (c.flipped || c.matched) {
          if (c.type === 'ja') {
            div.innerHTML = '<ruby>' + esc(c.word) + '<rt>' + esc(c.reading) + '</rt></ruby>';
          } else {
            div.textContent = c.word;
          }
        } else {
          div.textContent = '?';
        }
        div.addEventListener('click', () => onFlip(idx));
        grid.appendChild(div);
      });
    }

    function onFlip(idx) {
      if (lockBoard) return;
      const c = cards[idx];
      if (c.flipped || c.matched) return;
      c.flipped = true;
      flipped.push(idx);
      render();

      if (flipped.length === 2) {
        tries++;
        document.getElementById('mm-tries').textContent = tries;
        lockBoard = true;
        setTimeout(checkMatch, 900);
      }
    }

    function checkMatch() {
      const [a,b] = flipped.map(i=>cards[i]);
      if (a.id === b.id && a.type !== b.type) {
        /* match! */
        cards[flipped[0]].matched = true;
        cards[flipped[1]].matched = true;
        matched++;
        document.getElementById('mm-score').textContent = matched + ' / ' + PAIRS.length;
        showSentence(a);
        setFeedback('correct', '✓ ペア成立！「' + a.word + '」= ' + a.en);
      } else {
        cards[flipped[0]].flipped = false;
        cards[flipped[1]].flipped = false;
        setFeedback('wrong', '✗ もう一度！');
      }
      flipped = [];
      lockBoard = false;
      render();

      if (matched === PAIRS.length) {
        setFeedback('info', '🎉 全ペア完成！よくできました！');
      }
    }

    function showSentence(card) {
      const pair = PAIRS.find(p=>p.ja===card.word||p.en===card.word);
      if (!pair) return;
      const box = document.getElementById('mm-sentence-box');
      box.style.display = '';
      /* 「〜は〜です」パターンで文を生成 */
      const subject = pair.ja;
      const reading = pair.reading;
      const en = pair.en;
      document.getElementById('mm-sentence').innerHTML =
        '（あなた）は <ruby>' + esc(subject) + '<rt>' + esc(reading) + '</rt></ruby> です。';
      document.getElementById('mm-sentence-en').textContent =
        'I am a ' + en + '.';
    }

    function setFeedback(type, msg) {
      const el = document.getElementById('mm-feedback');
      el.className = 'feedback ' + type;
      el.textContent = msg;
    }

    function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    window.mmReset = function() {
      cards = buildCards().map(c=>({...c,flipped:false,matched:false}));
      flipped=[]; matched=0; tries=0; lockBoard=false;
      document.getElementById('mm-score').textContent = '0 / ' + PAIRS.length;
      document.getElementById('mm-tries').textContent = '0';
      document.getElementById('mm-sentence-box').style.display = 'none';
      setFeedback('','');
      render();
    };

    window.mmReset();
  })();
  </script>`;
}

/* ════════════════════════════════════════════════════
   #2  ACT_VOCAB_BINGO  —  語彙ビンゴ
   ════════════════════════════════════════════════════ */

function buildVocabBingo(lessons, taughtPids, actDef) {
  const vocab = collectVocab(lessons, taughtPids);
  /* 最大 16 語（4×4 ビンゴ）。足りなければ 3×3 */
  const size  = vocab.length >= 16 ? 4 : 3;
  const need  = size * size;
  const pool  = vocab.slice(0, Math.max(need + 4, vocab.length));
  const poolJson = JSON.stringify(pool.map(w => ({ ja: w.word, reading: w.reading, en: w.en })));

  return `
    <div class="card mb2">
      <p class="section-heading">アクティビティ</p>
      <h2 class="activity-title">${withRuby('語彙','ごい')}ビンゴ</h2>
      <p class="activity-title-en en-text">Vocabulary Bingo</p>
      <div class="mt1">
        <p class="setting-text">
          ${withRuby('先生','せんせい')}のヒントを${withRuby('聞','き')}いて、ビンゴカードの${withRuby('中','なか')}から${withRuby('合','あ')}う${withRuby('単語','たんご')}を${withRuby('選','えら')}んでマークしてください。
          タテ・ヨコ・ナナメ1${withRuby('列','れつ')}がそろったら「ビンゴ！」
        </p>
        <p class="setting-text-en en-text">
          Listen to the teacher's hint and mark the matching word on your bingo card.
          Complete a row, column, or diagonal to get Bingo!
        </p>
      </div>
    </div>

    <div class="card mb2">
      <div class="status-bar">
        <div class="status-item"><span class="label">マーク${withRuby('数','すう')}</span><span class="value" id="bg-count">0</span></div>
        <div class="status-item"><span class="label">${withRuby('状態','じょうたい')}</span><span class="value" id="bg-status">プレイ${withRuby('中','ちゅう')}</span></div>
        <button class="btn btn-ghost" onclick="bgReset()" style="margin-left:auto">🔄 リセット</button>
      </div>

      <!-- Bingo Card -->
      <div id="bg-grid" style="
        display:grid;
        grid-template-columns:repeat(${size},1fr);
        gap:.5rem;
        margin-bottom:1rem
      "></div>

      <div id="bg-feedback" class="feedback"></div>
    </div>

    <!-- Teacher Panel（先生側：どの語を呼ぶか選ぶ） -->
    <div class="card mb2">
      <p class="section-heading">${withRuby('先生','せんせい')}パネル（${withRuby('呼','よ')}び${withRuby('出','だ')}し${withRuby('用','よう')}）</p>
      <p style="font-size:.8rem;color:var(--text-subtle);margin-bottom:.75rem">
        ここからヒントを${withRuby('選','えら')}んで${withRuby('読','よ')}み${withRuby('上','あ')}げてください。${withRuby('学習者','がくしゅうしゃ')}には${withRuby('見','み')}せないでください。
      </p>
      <div id="bg-teacher-pool" style="display:flex;flex-wrap:wrap;gap:.4rem"></div>
    </div>

  <style>
    .bg-cell{
      aspect-ratio:1;
      border-radius:var(--radius-sm);
      background:var(--bg-subtle);
      border:2px solid transparent;
      display:flex;align-items:center;justify-content:center;
      text-align:center;
      font-size:.9rem;font-weight:700;
      cursor:pointer;
      padding:.25rem;
      line-height:1.3;
      transition:all .2s var(--ease);
    }
    .bg-cell:hover:not(.marked){background:var(--accent-muted);border-color:var(--accent)}
    .bg-cell.marked{background:var(--accent);color:var(--ui-dark);border-color:#c89a30;transform:scale(.97)}
    .bg-cell.bingo-line{box-shadow:0 0 0 3px var(--correct),var(--shadow-md)}
    .bg-cell ruby rt{font-size:.48em}
    .teacher-word-btn{
      padding:.3rem .7rem;border-radius:20px;border:1.5px solid var(--ui-primary);
      background:transparent;color:var(--ui-primary);font-family:var(--font);
      font-size:.8rem;font-weight:700;cursor:pointer;transition:all .2s var(--ease)
    }
    .teacher-word-btn:hover{background:var(--ui-primary);color:#fff}
    .teacher-word-btn.called{background:var(--bg-subtle);color:var(--text-muted);
      border-color:var(--text-muted);text-decoration:line-through;cursor:default}
  </style>

  <script>
  (function(){
    const POOL = ${poolJson};
    const SIZE = ${size};
    const NEED = SIZE * SIZE;
    let gridWords, marked;

    function pickGrid(){
      const arr=[...POOL];
      for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
      return arr.slice(0,NEED);
    }

    function renderGrid(){
      const g=document.getElementById('bg-grid'); g.innerHTML='';
      gridWords.forEach((w,i)=>{
        const d=document.createElement('div');
        d.className='bg-cell'+(marked[i]?' marked':'');
        d.innerHTML='<ruby>'+esc(w.ja)+'<rt>'+esc(w.reading||'')+'</rt></ruby>';
        d.addEventListener('click',()=>onMark(i));
        g.appendChild(d);
      });
    }

    function renderTeacherPool(){
      const el=document.getElementById('bg-teacher-pool'); el.innerHTML='';
      POOL.forEach(w=>{
        const b=document.createElement('button');
        b.className='teacher-word-btn';
        b.dataset.word=w.ja;
        b.textContent=w.ja+'（'+w.en+'）';
        b.addEventListener('click',()=>{b.classList.add('called');});
        el.appendChild(b);
      });
    }

    function onMark(i){
      if(marked[i]){marked[i]=false;}else{marked[i]=true;}
      const cnt=marked.filter(Boolean).length;
      document.getElementById('bg-count').textContent=cnt;
      renderGrid();
      if(checkBingo()){ setStatus('🎉 ビンゴ！'); setFeedback('correct','ビンゴ！よくできました！'); }
    }

    function checkBingo(){
      /* rows */
      for(let r=0;r<SIZE;r++){
        if([...Array(SIZE)].every((_,c)=>marked[r*SIZE+c])) return true;
      }
      /* cols */
      for(let c=0;c<SIZE;c++){
        if([...Array(SIZE)].every((_,r)=>marked[r*SIZE+c])) return true;
      }
      /* diag */
      if([...Array(SIZE)].every((_,i)=>marked[i*SIZE+i])) return true;
      if([...Array(SIZE)].every((_,i)=>marked[i*SIZE+(SIZE-1-i)])) return true;
      return false;
    }

    /* setStatus は ruby HTML を含む値を受けるため innerHTML を使う(プレイ中など) */
    function setStatus(s){document.getElementById('bg-status').innerHTML=s;}
    function setFeedback(t,m){const e=document.getElementById('bg-feedback');e.className='feedback '+t;e.textContent=m;}
    function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

    /* ステータス文言は HTML 生成時に ruby を埋め込んだ文字列として埋め込む */
    const STATUS_PLAYING = '${'プレイ' + withRuby('中','ちゅう')}';
    const STATUS_BINGO   = '🎉 ビンゴ！';

    window.bgReset=function(){
      gridWords=pickGrid();
      marked=Array(NEED).fill(false);
      document.getElementById('bg-count').textContent='0';
      setStatus(STATUS_PLAYING);
      setFeedback('','');
      renderGrid();
      renderTeacherPool();
    };
    window.bgReset();
  })();
  </script>`;
}

/* ════════════════════════════════════════════════════
   #3  ACT_WHITEBOARD_CATEGORIZE  —  語彙の仲間分け
   ════════════════════════════════════════════════════ */

function buildWhiteboardCategorize(lessons, taughtPids, actDef) {
  /* カテゴリ定義を byPattern グループから抽出 */
  const lesson = lessons[0];
  if (!lesson) return '<div class="placeholder-box"><p>データなし</p></div>';

  const byPattern = lesson.vocabulary?.byPattern || {};

  /* グループ → カテゴリラベルのマッピング */
  const GROUP_LABELS = {
    'p1_p2':             { ja: '職業', en: 'Occupations',    reading: 'しょくぎょう' },
    'p1_p2_nationality': { ja: '国籍', en: 'Nationalities',  reading: 'こくせき' },
    'p3':                { ja: '所属', en: 'Organizations',  reading: 'しょぞく' }
  };

  /* 対象グループを taughtPids でフィルタ */
  const categories = [];
  const allWords   = [];

  for (const [groupKey, group] of Object.entries(byPattern)) {
    const label = GROUP_LABELS[groupKey];
    if (!label) continue;
    /* relevant check */
    const relevant = taughtPids.length === 0
      || taughtPids.some(pid => groupKey.startsWith(pid) || groupKey.split('_').includes(pid));
    if (!relevant) continue;

    const catId = 'cat_' + groupKey;
    categories.push({ id: catId, ...label });
    for (const w of group.words || []) {
      allWords.push({ word: w.word, reading: w.reading, en: w.en, catId });
    }
  }

  const catsJson  = JSON.stringify(categories);
  const wordsJson = JSON.stringify(allWords);

  return `
    <div class="card mb2">
      <p class="section-heading">アクティビティ</p>
      <h2 class="activity-title">${withRuby('語彙','ごい')}の${withRuby('仲間分','なかまわ')}け</h2>
      <p class="activity-title-en en-text">Vocabulary Categorization</p>
      <div class="mt1">
        <p class="setting-text">
          ${withRuby('単語','たんご')}を${withRuby('正','ただ')}しいグループに${withRuby('移動','いどう')}させましょう。
          ${withRuby('分類','ぶんるい')}できたら「〜は〜です」で${withRuby('文','ぶん')}を${withRuby('作','つく')}ってください。
        </p>
        <p class="setting-text-en en-text">
          Move each word to the correct category.
          After sorting, make a sentence using "〜は〜です."
        </p>
      </div>
    </div>

    <div class="card mb2">
      <div class="status-bar">
        <div class="status-item"><span class="label">${withRuby('正解','せいかい')}</span><span class="value" id="cat-correct">0 / ${allWords.length}</span></div>
        <button class="btn btn-ghost" onclick="catReset()" style="margin-left:auto">🔄 リセット</button>
        <button class="btn btn-accent" onclick="catCheck()">✓ ${withRuby('確認','かくにん')}</button>
      </div>

      <!-- Word Pool -->
      <p class="section-heading mt1">${withRuby('単語','たんご')}プール</p>
      <div id="cat-pool" style="display:flex;flex-wrap:wrap;gap:.5rem;min-height:3rem;
        padding:.75rem;background:var(--bg-subtle);border-radius:var(--radius-md);margin-bottom:1rem">
      </div>

      <!-- Category Zones -->
      <div id="cat-zones" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem"></div>

      <div id="cat-feedback" class="feedback mt1"></div>
    </div>

  <style>
    .cat-word{
      padding:.4rem .8rem;border-radius:20px;background:var(--bg-surface);
      border:1.5px solid var(--ui-primary);color:var(--ui-primary);
      font-family:var(--font);font-size:.9rem;font-weight:700;cursor:grab;
      white-space:nowrap;user-select:none;transition:all .15s var(--ease);
    }
    .cat-word:hover{background:var(--ui-primary);color:#fff}
    .cat-word.correct-placed{border-color:var(--correct);color:var(--correct);background:#ecf5e6}
    .cat-word.wrong-placed{border-color:var(--wrong);color:var(--wrong);background:#f9ece8}
    .cat-zone{
      border:2px dashed rgba(27,44,64,.2);border-radius:var(--radius-md);padding:.75rem;
      min-height:6rem;transition:border-color .2s;
    }
    .cat-zone.drag-over{border-color:var(--accent);background:var(--accent-muted)}
    .cat-zone-title{font-size:.75rem;font-weight:700;letter-spacing:.08em;
      color:var(--text-subtle);margin-bottom:.5rem;text-transform:uppercase}
    .cat-zone-words{display:flex;flex-wrap:wrap;gap:.4rem;min-height:2.5rem}
    .cat-zone ruby rt{font-size:.48em}
    .cat-word ruby rt{font-size:.48em}
  </style>

  <script>
  (function(){
    const CATS  = ${catsJson};
    const WORDS = ${wordsJson};
    let placement; /* wordIndex -> catId | null */

    function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

    function renderPool(){
      const pool=document.getElementById('cat-pool'); pool.innerHTML='';
      WORDS.forEach((w,i)=>{
        if(placement[i]!==null)return;
        const el=wordEl(w,i); pool.appendChild(el);
      });
    }

    function renderZones(){
      const zones=document.getElementById('cat-zones'); zones.innerHTML='';
      CATS.forEach(cat=>{
        const zone=document.createElement('div');
        zone.className='cat-zone';
        zone.dataset.catId=cat.id;
        zone.innerHTML='<div class="cat-zone-title"><ruby>'+esc(cat.ja)+'<rt>'+esc(cat.reading)+'</rt></ruby></div>'
          +'<div class="cat-zone-words" id="zone-'+cat.id+'"></div>';
        zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over');});
        zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
        zone.addEventListener('drop',e=>{
          e.preventDefault();zone.classList.remove('drag-over');
          const idx=parseInt(e.dataTransfer.getData('text/plain'));
          placement[idx]=cat.id;
          render();
        });
        zones.appendChild(zone);
      });
      /* placed words */
      WORDS.forEach((w,i)=>{
        if(placement[i]===null)return;
        const container=document.getElementById('zone-'+placement[i]);
        if(!container)return;
        const el=wordEl(w,i); container.appendChild(el);
      });
    }

    function wordEl(w,i){
      const el=document.createElement('div');
      el.className='cat-word';
      el.draggable=true;
      /* WORDS[i] への安定したリンク。textContent ベースのマッチは
         「大学」と「大学生」の部分一致誤判定が起きるので、index で識別する。 */
      el.dataset.wordIdx=i;
      el.innerHTML='<ruby>'+esc(w.word)+'<rt>'+esc(w.reading||'')+'</rt></ruby>';
      /* click to cycle through categories */
      el.addEventListener('click',()=>{
        const cats=[null,...CATS.map(c=>c.id)];
        const cur=cats.indexOf(placement[i]);
        placement[i]=cats[(cur+1)%cats.length];
        render();
      });
      el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',i);});
      return el;
    }

    function render(){ renderPool(); renderZones(); }

    window.catCheck=function(){
      let ok=0;
      WORDS.forEach((w,i)=>{
        /* 未配置はスキップ(誤判定にカウントしない) */
        if(placement[i]==null)return;
        /* data-word-idx で WORDS[i] に対応する DOM 要素を直接取得(textContent 部分一致を回避) */
        const el=document.querySelector('.cat-word[data-word-idx="'+i+'"]');
        if(!el)return;
        el.classList.remove('correct-placed','wrong-placed');
        const isCorrect=placement[i]===w.catId;
        el.classList.add(isCorrect?'correct-placed':'wrong-placed');
        if(isCorrect)ok++;
      });
      document.getElementById('cat-correct').textContent=ok+' / '+WORDS.length;
      const fb=document.getElementById('cat-feedback');
      if(ok===WORDS.length){fb.className='feedback correct';fb.textContent='🎉 全問正解！よくできました！';}
      else{fb.className='feedback info';fb.textContent=ok+' / '+WORDS.length+' 正解です。もう一度確認しましょう。';}
    };

    window.catReset=function(){
      placement=WORDS.map(()=>null);
      document.getElementById('cat-correct').textContent='0 / '+WORDS.length;
      document.getElementById('cat-feedback').className='feedback';
      document.getElementById('cat-feedback').textContent='';
      render();
    };

    window.catReset();
  })();
  </script>`;
}

/* ════════════════════════════════════════════════════
   #4  ACT_GRAMMAR_AUCTION  —  正しい文を競り落とすゲーム
   ════════════════════════════════════════════════════ */

function buildGrammarAuction(lessons, taughtPids, actDef) {
  const patterns = collectPatterns(lessons, taughtPids);
  const vocab    = collectVocab(lessons, taughtPids);

  /* 正文・誤文を生成（各パターン2正文・1誤文） */
  const sentences = [];

  for (const p of patterns) {
    const exs = p.examples || [];
    /* 正文：最初の2例文 */
    exs.slice(0, 2).forEach(ex => {
      sentences.push({ ja: ex.sentence, en: ex.sentenceEn, correct: true, reason: '' });
    });
    /* 誤文：助詞を変えるなど単純な誤り */
    if (p.id === 'p1') {
      sentences.push({
        ja: '鈴木さんが先生です。', en: '(Incorrect particle: は → が)', correct: false,
        reason: '「は」を使います（Not 「が」）'
      });
    } else if (p.id === 'p2') {
      sentences.push({
        ja: '先生ですね。', en: '(Incorrect sentence ending: か → ね)', correct: false,
        reason: '疑問文は「ですか」です（Not 「ですね」）'
      });
    } else if (p.id === 'p3') {
      sentences.push({
        ja: 'タノムさんは医者の東西病院です。', en: '(Incorrect word order: の is flipped)', correct: false,
        reason: '「〜の〜」の順番：所属 + の + 職業 です'
      });
    }
  }

  /* シャッフル */
  for (let i = sentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
  }

  const sentJson = JSON.stringify(sentences);
  const BUDGET   = 1000;

  return `
    <div class="card mb2">
      <p class="section-heading">アクティビティ</p>
      <h2 class="activity-title">${withRuby('文法','ぶんぽう')}オークション</h2>
      <p class="activity-title-en en-text">Grammar Auction</p>
      <div class="mt1">
        <p class="setting-text">
          ${withRuby('正','ただ')}しい${withRuby('文','ぶん')}を${withRuby('選','えら')}んでコインを${withRuby('賭','か')}けてください。
          ${withRuby('正','ただ')}しい${withRuby('文','ぶん')}を${withRuby('買','か')}えた${withRuby('分','ぶん')}だけ${withRuby('勝','か')}ちです。
          ${withRuby('予算','よさん')}：${BUDGET}コイン
        </p>
        <p class="setting-text-en en-text">
          Bet coins on sentences you think are correct. Win coins for correct sentences, lose coins for wrong ones.
          Budget: ${BUDGET} coins
        </p>
      </div>
    </div>

    <div class="card mb2">
      <div class="status-bar">
        <div class="status-item"><span class="label">${withRuby('残','のこ')}りコイン</span><span class="value" id="auc-coins">${BUDGET} 💰</span></div>
        <div class="status-item"><span class="label">${withRuby('問題','もんだい')}</span><span class="value" id="auc-progress">1 / ${sentences.length}</span></div>
        <button class="btn btn-ghost" onclick="aucReset()" style="margin-left:auto">🔄 リセット</button>
      </div>

      <div id="auc-sentence-card" style="
        background:var(--bg-subtle);border-radius:var(--radius-md);
        padding:1.25rem 1.5rem;margin-bottom:1rem;text-align:center">
        <p id="auc-sentence" style="font-size:1.35rem;font-weight:700;margin-bottom:.5rem"></p>
        <p id="auc-sentence-en" class="en-text" style="font-size:.85rem;color:var(--text-subtle);font-style:italic"></p>
      </div>

      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
        <label style="font-size:.85rem;font-weight:700">${withRuby('賭','か')}けるコイン：</label>
        <input id="auc-bet-input" type="number" min="0" max="${BUDGET}" value="100"
          style="width:6rem;padding:.4rem .6rem;border:1.5px solid var(--ui-primary);
            border-radius:var(--radius-sm);font-family:var(--font);font-size:.9rem">
        <button class="btn btn-accent" onclick="aucBid()">${withRuby('賭','か')}ける！</button>
        <button class="btn btn-ghost" onclick="aucSkip()">パス（0コイン）</button>
      </div>

      <div id="auc-result" style="display:none;padding:1rem;border-radius:var(--radius-md);margin-bottom:.75rem"></div>
      <div id="auc-feedback" class="feedback"></div>
    </div>

    <div class="card mb2" id="auc-summary" style="display:none">
      <p class="section-heading">${withRuby('結果','けっか')}</p>
      <div id="auc-summary-content"></div>
    </div>

  <script>
  (function(){
    const SENTS = ${sentJson};
    const BUDGET = ${BUDGET};
    let coins, idx, history;

    function render(){
      if(idx >= SENTS.length){ showSummary(); return; }
      const s=SENTS[idx];
      document.getElementById('auc-sentence').textContent=s.ja;
      document.getElementById('auc-sentence-en').textContent=s.en;
      document.getElementById('auc-progress').textContent=(idx+1)+' / '+SENTS.length;
      document.getElementById('auc-result').style.display='none';
      document.getElementById('auc-feedback').textContent='';
    }

    window.aucBid=function(){
      if(idx>=SENTS.length)return;
      const bet=Math.max(0,Math.min(coins,parseInt(document.getElementById('auc-bet-input').value)||0));
      resolve(bet);
    };

    window.aucSkip=function(){ resolve(0); };

    function resolve(bet){
      const s=SENTS[idx];
      let delta=0;
      if(s.correct){ delta=+bet; }else{ delta=-bet; }
      coins=Math.max(0,coins+delta);
      history.push({ja:s.ja,correct:s.correct,bet,delta});
      document.getElementById('auc-coins').textContent=coins+' 💰';

      const res=document.getElementById('auc-result');
      res.style.display='';
      /* s.en は英語訳または英語の補足説明 → en-text クラス付きにして英語トグルに従わせる */
      if(s.correct){
        res.style.background='#ecf5e6';
        res.innerHTML='<b style="color:var(--correct)">✓ 正文！</b> +'+(bet)+'コイン<br><small class="en-text" style="color:var(--text-subtle)">'+s.en+'</small>';
      } else {
        res.style.background='#f9ece8';
        res.innerHTML='<b style="color:var(--wrong)">✗ 誤文。</b> '+(bet>0?'−'+bet+'コイン':'')+'<br>'
          +'<small style="color:var(--wrong)">'+s.reason+'</small>';
      }

      const fb=document.getElementById('auc-feedback');
      fb.className='feedback info';
      fb.textContent=bet>0?(s.correct?'+'+bet+'コイン獲得！':'−'+bet+'コイン失った…'):'パスしました。';

      idx++;
      /* render() 内部で idx >= SENTS.length なら自動で showSummary() を呼ぶので、
         ここで二重呼び出ししないよう if 分岐は削除。 */
      setTimeout(()=>{ render(); }, 1800);
    }

    function showSummary(){
      const box=document.getElementById('auc-summary');
      box.style.display='';
      const won=history.filter(h=>h.correct&&h.bet>0).length;
      let html='<p style="font-size:1.2rem;font-weight:700;margin-bottom:.75rem">最終コイン：'+coins+' 💰</p>';
      html+='<table style="width:100%;border-collapse:collapse;font-size:.85rem">';
      html+='<tr style="background:var(--bg-subtle)"><th style="padding:.4rem .6rem;text-align:left">文</th><th>判定</th><th>賭け</th><th>結果</th></tr>';
      history.forEach(h=>{
        html+='<tr style="border-top:1px solid rgba(27,44,64,.08)">'
          +'<td style="padding:.4rem .6rem">'+h.ja+'</td>'
          +'<td style="text-align:center">'+(h.correct?'<span style="color:var(--correct)">✓</span>':'<span style="color:var(--wrong)">✗</span>')+'</td>'
          +'<td style="text-align:center">'+h.bet+'</td>'
          +'<td style="text-align:center;color:'+(h.delta>=0?'var(--correct)':'var(--wrong)')+'">'+
            (h.delta>=0?'+':'')+h.delta+'</td></tr>';
      });
      html+='</table>';
      box.querySelector('#auc-summary-content').innerHTML=html;
    }

    window.aucReset=function(){
      coins=BUDGET; idx=0; history=[];
      document.getElementById('auc-coins').textContent=BUDGET+' 💰';
      document.getElementById('auc-summary').style.display='none';
      document.getElementById('auc-feedback').textContent='';
      render();
    };
    window.aucReset();
  })();
  </script>`;
}

/* ════════════════════════════════════════════════════
   #5  ACT_BATTLESHIP  —  文型を使った戦艦ゲーム
   ════════════════════════════════════════════════════ */

function buildBattleship(lessons, taughtPids, actDef) {
  const vocab = collectVocab(lessons, taughtPids);

  /* 行 (Y軸) = 職業、列 (X軸) = 国籍 */
  const jobs = vocab.filter(w => w._group === 'p1_p2').slice(0, 5);
  const nats = vocab.filter(w => w._group === 'p1_p2_nationality').slice(0, 5);

  /* フォールバック */
  const rowWords = jobs.length >= 3 ? jobs
    : vocab.slice(0, 5);
  const colWords = nats.length >= 3 ? nats
    : vocab.slice(5, 10);

  const rowJson = JSON.stringify(rowWords.map(w => ({ ja: w.word, reading: w.reading, en: w.en })));
  const colJson = JSON.stringify(colWords.map(w => ({ ja: w.word, reading: w.reading, en: w.en })));

  return `
    <div class="card mb2">
      <p class="section-heading">アクティビティ</p>
      <h2 class="activity-title">${withRuby('戦艦','せんかん')}ゲーム</h2>
      <p class="activity-title-en en-text">Battleship</p>
      <div class="mt1">
        <p class="setting-text">
          グリッドを${withRuby('使','つか')}って${withRuby('相手','あいて')}の${withRuby('船','ふね')}を${withRuby('見','み')}つけてください。<br>
          「（タテ）は（ヨコ）ですか。」と${withRuby('質問','しつもん')}してください。
          ${withRuby('命中','めいちゅう')}→「はい、そうです」、${withRuby('外','はず')}れ→「いいえ」
        </p>
        <p class="setting-text-en en-text">
          Find your opponent's ships using the grid.
          Ask: "Is (row) a (column)?" Hit = "Yes!" Miss = "No!"
        </p>
      </div>
    </div>

    <div class="card mb2">
      <p class="section-heading">マイボード — ${withRuby('船','ふね')}を${withRuby('置','お')}く（3マス）</p>
      <p style="font-size:.8rem;color:var(--text-subtle);margin-bottom:.5rem">クリックで${withRuby('自分','じぶん')}の${withRuby('船','ふね')}を${withRuby('置','お')}いてください（${withRuby('最大','さいだい')}3マス）</p>
      <div id="bs-my-board"></div>
    </div>

    <div class="card mb2">
      <p class="section-heading">${withRuby('攻撃','こうげき')}ボード — ここで${withRuby('質問','しつもん')}する</p>
      <div style="background:var(--bg-subtle);border-radius:var(--radius-md);
        padding:.75rem 1rem;margin-bottom:.75rem;font-size:.9rem;font-weight:700" id="bs-question-display">
        グリッドをクリックして${withRuby('質問','しつもん')}しましょう
      </div>
      <div id="bs-attack-board"></div>
      <div id="bs-feedback" class="feedback mt1"></div>
    </div>

    <div class="status-bar mt1">
      <div class="status-item"><span class="label">${withRuby('命中','めいちゅう')}</span><span class="value" id="bs-hits">0</span></div>
      <div class="status-item"><span class="label">${withRuby('外','はず')}れ</span><span class="value" id="bs-misses">0</span></div>
      <button class="btn btn-ghost" onclick="bsReset()" style="margin-left:auto">🔄 リセット</button>
    </div>

  <style>
    .bs-grid{border-collapse:collapse;width:100%;font-size:.8rem}
    .bs-grid th{padding:.35rem .5rem;text-align:center;background:var(--bg-subtle);
      font-weight:700;color:var(--text-subtle);border:1px solid rgba(27,44,64,.1);font-size:.72rem}
    .bs-grid td{width:calc(100%/6);aspect-ratio:1;text-align:center;
      border:1px solid rgba(27,44,64,.1);cursor:pointer;
      font-size:1.2rem;transition:background .15s var(--ease)}
    .bs-grid td:hover{background:var(--accent-muted)}
    .bs-cell-ship{background:#d0e8ff !important;cursor:pointer}
    .bs-cell-hit{background:#c8f0c8 !important;font-size:1.4rem;cursor:default}
    .bs-cell-miss{background:#f0e0e0 !important;font-size:1rem;cursor:default;opacity:.6}
    .bs-cell-my-ship{background:#b8d8ff !important}
    .bs-grid ruby rt{font-size:.48em} /* color はグローバル rt の inherit を継承 (Stage 1 #4) */
  </style>

  <script>
  (function(){
    const ROWS = ${rowJson};
    const COLS = ${colJson};
    const NR=ROWS.length, NC=COLS.length;
    let myShips, cpuShips, myBoard, attackBoard, hits, misses;

    function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

    function placeShipsRandom(n){
      const ships=new Set();
      while(ships.size<n){ships.add(Math.floor(Math.random()*NR)+','+Math.floor(Math.random()*NC));}
      return ships;
    }

    function buildGrid(containerId, cells, onClickCell, showShips, shipSet){
      const el=document.getElementById(containerId); el.innerHTML='';
      const table=document.createElement('table'); table.className='bs-grid';
      /* header row */
      const thead=document.createElement('tr');
      thead.appendChild(Object.assign(document.createElement('th'),{textContent:''}));
      COLS.forEach(c=>{
        const th=document.createElement('th');
        th.innerHTML='<ruby>'+esc(c.ja)+'<rt>'+esc(c.reading||'')+'</rt></ruby>';
        thead.appendChild(th);
      });
      table.appendChild(thead);
      /* rows */
      ROWS.forEach((r,ri)=>{
        const tr=document.createElement('tr');
        const th=document.createElement('th');
        th.innerHTML='<ruby>'+esc(r.ja)+'<rt>'+esc(r.reading||'')+'</rt></ruby>';
        tr.appendChild(th);
        COLS.forEach((c,ci)=>{
          const key=ri+','+ci;
          const td=document.createElement('td');
          const cellState=cells[key]||'';
          td.dataset.key=key;
          if(cellState==='hit'){td.classList.add('bs-cell-hit');td.textContent='💥';}
          else if(cellState==='miss'){td.classList.add('bs-cell-miss');td.textContent='✗';}
          else if(showShips&&shipSet&&shipSet.has(key)){td.classList.add('bs-cell-my-ship');td.textContent='🚢';}
          else{td.textContent='';}
          if(onClickCell&&cellState===''){td.addEventListener('click',()=>onClickCell(ri,ci,td));}
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      el.appendChild(table);
    }

    function onMyBoardClick(ri,ci,td){
      const key=ri+','+ci;
      if(myShips.has(key)){myShips.delete(key);}
      else if(myShips.size<3){myShips.add(key);}
      buildGrid('bs-my-board',{},onMyBoardClick,true,myShips);
    }

    function onAttackClick(ri,ci,td){
      const key=ri+','+ci;
      if(attackBoard[key])return; /* already attacked */
      const r=ROWS[ri], c=COLS[ci];
      const question='「'+r.ja+'は'+c.ja+'ですか。」';
      document.getElementById('bs-question-display').innerHTML=
        '質問：<b>「<ruby>'+esc(r.ja)+'<rt>'+esc(r.reading)+'</rt></ruby>は<ruby>'+esc(c.ja)+'<rt>'+esc(c.reading)+'</rt></ruby>ですか。」</b>';
      if(cpuShips.has(key)){
        attackBoard[key]='hit'; hits++;
        document.getElementById('bs-hits').textContent=hits;
        setFeedback('correct','💥 命中！「はい、そうです！」');
      } else {
        attackBoard[key]='miss'; misses++;
        document.getElementById('bs-misses').textContent=misses;
        setFeedback('wrong','✗ 外れ。「いいえ、ちがいます。」');
      }
      buildGrid('bs-attack-board',attackBoard,onAttackClick,false,null);
      if(hits===3){setFeedback('correct','🎉 全ての船を撃沈！ゲームクリア！');}
    }

    function setFeedback(t,m){
      const el=document.getElementById('bs-feedback');
      el.className='feedback '+t; el.textContent=m;
    }

    window.bsReset=function(){
      myShips=new Set(); cpuShips=placeShipsRandom(3);
      myBoard={}; attackBoard={}; hits=0; misses=0;
      document.getElementById('bs-hits').textContent='0';
      document.getElementById('bs-misses').textContent='0';
      document.getElementById('bs-question-display').textContent='グリッドをクリックして質問しましょう';
      setFeedback('','');
      buildGrid('bs-my-board',{},onMyBoardClick,true,myShips);
      buildGrid('bs-attack-board',attackBoard,onAttackClick,false,null);
    };
    window.bsReset();
  })();
  </script>`;
}

/* ════════════════════════════════════════════════════
   #6  ACT_PERSON_GUESSING_QUIZ  —  人物当てクイズ
   ════════════════════════════════════════════════════ */

function buildPersonGuessingQuiz(lessons, taughtPids, actDef) {
  /* 人物データを examples から構築（named_characters が空の場合のフォールバック） */
  const patterns = collectPatterns(lessons, taughtPids);

  /* p1の例文から人物データを抽出 */
  const characters = [];
  const charMap = {};

  for (const p of patterns) {
    for (const ex of p.examples || []) {
      /* 「〇〇さんは××です。」形式から抽出 */
      const m = ex.sentence.match(/^(\S+?)さんは(\S+?)です。$/);
      if (m) {
        const name = m[1] + 'さん';
        const attr = m[2];
        if (!charMap[name]) { charMap[name] = { name, attrs: [] }; }
        charMap[name].attrs.push({
          ja: attr,
          en: ex.sentenceEn?.replace(/^.*? is /, '').replace(/\.$/, '') || attr
        });
      }
    }
  }

  /* namedCharacters がある場合も追加 */
  for (const lesson of lessons) {
    for (const nc of lesson.namedCharacters || []) {
      const name = nc.name;
      if (!charMap[name]) { charMap[name] = { name, attrs: [] }; }
      if (nc.occupation && !charMap[name].attrs.some(a => a.ja === nc.occupation)) {
        charMap[name].attrs.push({ ja: nc.occupation, en: nc.occupation });
      }
      if (nc.nationality && !charMap[name].attrs.some(a => a.ja === nc.nationality)) {
        charMap[name].attrs.push({ ja: nc.nationality, en: nc.nationality });
      }
    }
  }

  const chars = Object.values(charMap).filter(c => c.attrs.length > 0).slice(0, 5);

  if (chars.length === 0) {
    return `<div class="placeholder-box">
      <p>人物データが見つかりません。lesson.json の examples を確認してください。</p>
    </div>`;
  }

  const charsJson = JSON.stringify(chars);

  return `
    <div class="card mb2">
      <p class="section-heading">アクティビティ</p>
      <h2 class="activity-title">${withRuby('人物当','じんぶつあ')}てクイズ</h2>
      <p class="activity-title-en en-text">Person Guessing Quiz</p>
      <div class="mt1">
        <p class="setting-text">
          ${withRuby('絵','え')}の${withRuby('人物','じんぶつ')}が${withRuby('誰','だれ')}かを「〜ですか」で${withRuby('質問','しつもん')}して${withRuby('当','あ')}ててください。<br>
          ${withRuby('答','こた')}えは「はい、〜です」か「いいえ、〜じゃありません」で${withRuby('言','い')}います。
        </p>
        <p class="setting-text-en en-text">
          Guess who the person is by asking "〜ですか?" questions.
          Answer: "Yes, I am." or "No, I'm not."
        </p>
      </div>
    </div>

    <div class="card mb2">
      <div class="status-bar">
        <div class="status-item"><span class="label">${withRuby('問題','もんだい')}</span><span class="value" id="pq-progress">1 / ${chars.length}</span></div>
        <div class="status-item"><span class="label">${withRuby('正解','せいかい')}</span><span class="value" id="pq-score">0</span></div>
        <button class="btn btn-ghost" onclick="pqReset()" style="margin-left:auto">🔄 リセット</button>
      </div>

      <!-- Person Card -->
      <div id="pq-card" style="
        background:var(--bg-subtle);border-radius:var(--radius-lg);
        padding:1.5rem;text-align:center;margin-bottom:1rem">
        <div id="pq-person-icon" style="font-size:4rem;margin-bottom:.75rem">🧑</div>
        <div id="pq-revealed-attrs" style="display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;min-height:2.5rem"></div>
      </div>

      <!-- Hint Reveal -->
      <div style="text-align:center;margin-bottom:1rem">
        <button class="btn btn-accent" onclick="pqRevealHint()">
          💡 ヒントを${withRuby('見','み')}る（1つずつ${withRuby('表示','ひょうじ')}）
        </button>
      </div>

      <!-- Question Buttons -->
      <p class="section-heading">${withRuby('質問','しつもん')}して${withRuby('答','こた')}えよう</p>
      <div id="pq-question-area" style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem"></div>
      <div id="pq-answer-display" style="font-size:.95rem;font-weight:700;
        min-height:2rem;padding:.5rem;border-radius:var(--radius-sm);
        background:var(--bg-subtle);margin-bottom:.5rem;text-align:center"></div>

      <!-- Guess Input -->
      <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
        <span style="font-size:.9rem;font-weight:700">この${withRuby('人','ひと')}は</span>
        <select id="pq-guess-select" style="padding:.4rem .6rem;border:1.5px solid var(--ui-primary);
          border-radius:var(--radius-sm);font-family:var(--font);font-size:.9rem"></select>
        <span style="font-size:.9rem;font-weight:700">です！</span>
        <button class="btn btn-primary" onclick="pqGuess()">${withRuby('決定','けってい')}！</button>
      </div>
      <div id="pq-feedback" class="feedback mt1"></div>
    </div>

  <script>
  (function(){
    const CHARS = ${charsJson};
    let idx, revealed, score;

    function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

    function render(){
      if(idx>=CHARS.length){showEnd();return;}
      const c=CHARS[idx];
      document.getElementById('pq-progress').textContent=(idx+1)+' / '+CHARS.length;
      document.getElementById('pq-revealed-attrs').innerHTML='';
      document.getElementById('pq-answer-display').textContent='';
      document.getElementById('pq-feedback').textContent='';
      document.getElementById('pq-feedback').className='feedback';

      /* question buttons from attrs */
      const qa=document.getElementById('pq-question-area'); qa.innerHTML='';
      c.attrs.forEach(a=>{
        const btn=document.createElement('button');
        btn.className='btn btn-ghost';
        btn.style.fontSize='.85rem';
        btn.innerHTML='「'+esc(a.ja)+'ですか？」';
        btn.addEventListener('click',()=>onQuestion(a));
        qa.appendChild(btn);
      });
      /* also add some decoy questions from other chars */
      CHARS.forEach(oc=>{
        if(oc===c)return;
        oc.attrs.forEach(a=>{
          if(c.attrs.some(ca=>ca.ja===a.ja))return;
          const btn=document.createElement('button');
          btn.className='btn btn-ghost';
          btn.style.fontSize='.85rem';
          btn.innerHTML='「'+esc(a.ja)+'ですか？」';
          btn.addEventListener('click',()=>onQuestion(a,c));
          qa.appendChild(btn);
        });
      });

      /* guess select */
      const sel=document.getElementById('pq-guess-select'); sel.innerHTML='';
      CHARS.forEach(oc=>{
        const opt=document.createElement('option');
        opt.value=oc.name; opt.textContent=oc.name;
        sel.appendChild(opt);
      });
    }

    function onQuestion(attr,targetChar){
      const c=targetChar||CHARS[idx];
      const isMatch=c.attrs.some(a=>a.ja===attr.ja);
      const ans=isMatch
        ?('「はい、'+attr.ja+'です。」')
        :('「いいえ、'+attr.ja+'じゃありません。」');
      document.getElementById('pq-answer-display').textContent=ans;
      if(isMatch){
        revealed++;
        const badge=document.createElement('span');
        badge.style.cssText='padding:.3rem .7rem;border-radius:20px;background:var(--accent);color:var(--ui-dark);font-size:.85rem;font-weight:700';
        badge.textContent=attr.ja;
        document.getElementById('pq-revealed-attrs').appendChild(badge);
      }
    }

    window.pqRevealHint=function(){
      const c=CHARS[idx];
      const nextAttr=c.attrs[revealed]||null;
      if(!nextAttr)return;
      onQuestion(nextAttr);
    };

    window.pqGuess=function(){
      const guess=document.getElementById('pq-guess-select').value;
      const correct=CHARS[idx].name;
      const fb=document.getElementById('pq-feedback');
      if(guess===correct){
        fb.className='feedback correct';
        fb.textContent='✓ 正解！「'+correct+'」です！';
        score++;
        document.getElementById('pq-score').textContent=score;
      } else {
        fb.className='feedback wrong';
        fb.textContent='✗ 正解は「'+correct+'」でした。';
      }
      idx++;
      setTimeout(()=>{revealed=0;render();},1800);
    };

    function showEnd(){
      document.getElementById('pq-feedback').className='feedback info';
      document.getElementById('pq-feedback').textContent='ゲーム終了！正解 '+score+' / '+CHARS.length+' 問';
    }

    window.pqReset=function(){
      idx=0; revealed=0; score=0;
      document.getElementById('pq-score').textContent='0';
      render();
    };
    window.pqReset();
  })();
  </script>`;
}

/* ════════════════════════════════════════════════════
   #7  ACT_PERSONALITY_QUIZ  —  性格診断風クイズ
   ════════════════════════════════════════════════════ */

function buildPersonalityQuiz(lessons, taughtPids, actDef) {
  const vocab = collectVocab(lessons, taughtPids);

  /* 職業語彙から質問を生成 */
  const jobs = vocab.filter(w => w._group === 'p1_p2');
  const questions = jobs.slice(0, 6).map((w, i) => ({
    ja:      `${w.word}ですか？`,
    en:      `Are you a ${w.en}?`,
    result:  w.word,
    resultEn: w.en,
    reading: w.reading
  }));

  /* 結果タイプ（yes の数で決める） */
  const results = [
    { min: 0, max: 1, type: '学習者タイプ', typeEn: 'Learner Type',
      desc: 'まだ学んでいる途中ですね！毎日少しずつ練習しましょう。',
      descEn: "You're still learning! Practice a little every day." },
    { min: 2, max: 3, type: '成長中タイプ', typeEn: 'Growing Type',
      desc: 'だんだん上手になっています！もっと練習しましょう。',
      descEn: "You're getting better! Keep practicing." },
    { min: 4, max: 5, type: 'マスタータイプ', typeEn: 'Master Type',
      desc: 'すばらしい！文型をよく理解しています。',
      descEn: "Excellent! You understand the grammar patterns well." },
    { min: 6, max: 6, type: 'スーパーマスター！', typeEn: 'Super Master!',
      desc: '完璧です！次のレベルに進みましょう！',
      descEn: 'Perfect! Time to move to the next level!' }
  ];

  const qJson = JSON.stringify(questions);
  const rJson = JSON.stringify(results);

  return `
    <div class="card mb2">
      <p class="section-heading">アクティビティ</p>
      <h2 class="activity-title">${withRuby('性格診断','せいかくしんだん')}クイズ</h2>
      <p class="activity-title-en en-text">Personality Quiz</p>
      <div class="mt1">
        <p class="setting-text">
          ${withRuby('先生','せんせい')}の${withRuby('質問','しつもん')}に「はい」か「いいえ」で${withRuby('答','こた')}えてください。
          ${withRuby('最後','さいご')}にあなたのタイプがわかります！
        </p>
        <p class="setting-text-en en-text">
          Answer the teacher's questions with "はい" (yes) or "いいえ" (no).
          Find out your type at the end!
        </p>
      </div>
    </div>

    <div class="card mb2" id="pz-quiz-area">
      <div class="status-bar">
        <div class="status-item"><span class="label">${withRuby('質問','しつもん')}</span><span class="value" id="pz-progress">1 / ${questions.length}</span></div>
        <div class="status-item"><span class="label">はい</span><span class="value" id="pz-yes-count">0</span></div>
        <button class="btn btn-ghost" onclick="pzReset()" style="margin-left:auto">🔄 リセット</button>
      </div>

      <!-- Current Question -->
      <div style="background:var(--bg-subtle);border-radius:var(--radius-lg);
        padding:1.75rem;text-align:center;margin:.75rem 0">
        <p style="font-size:1.5rem;font-weight:700;margin-bottom:.5rem" id="pz-question"></p>
        <p class="en-text" style="font-size:.9rem;color:var(--text-subtle);font-style:italic" id="pz-question-en"></p>
      </div>

      <!-- Answer Buttons -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0">
        <button class="btn" onclick="pzAnswer(true)"
          style="font-size:1.3rem;padding:1rem;background:var(--correct);color:#fff;
            border-radius:var(--radius-md)">
          はい ✓
        </button>
        <button class="btn" onclick="pzAnswer(false)"
          style="font-size:1.3rem;padding:1rem;background:var(--wrong);color:#fff;
            border-radius:var(--radius-md)">
          いいえ ✗
        </button>
      </div>
      <div id="pz-feedback" class="feedback"></div>
    </div>

    <!-- Result Card (hidden initially) -->
    <div class="card mb2" id="pz-result-card" style="display:none">
      <p class="section-heading">${withRuby('診断結果','しんだんけっか')}</p>
      <div style="text-align:center;padding:1rem">
        <div style="font-size:3rem;margin-bottom:.75rem">🎉</div>
        <p style="font-size:1.6rem;font-weight:700;color:var(--accent);margin-bottom:.5rem" id="pz-result-type"></p>
        <p class="en-text" style="font-size:.9rem;color:var(--text-subtle);font-style:italic;margin-bottom:.75rem" id="pz-result-type-en"></p>
        <p style="font-size:1rem;color:var(--text-main);line-height:1.7" id="pz-result-desc"></p>
        <p class="en-text" style="font-size:.85rem;color:var(--text-subtle);font-style:italic;margin-top:.4rem" id="pz-result-desc-en"></p>
      </div>
      <div style="margin-top:1rem;background:var(--bg-subtle);border-radius:var(--radius-md);padding:1rem;text-align:center">
        <p style="font-size:.85rem;font-weight:700;margin-bottom:.5rem">${withRuby('自己紹介文','じこしょうかいぶん')}を${withRuby('作','つく')}ろう</p>
        <p id="pz-self-intro" style="font-size:1.1rem;font-weight:700"></p>
      </div>
    </div>

  <script>
  (function(){
    const QS=${qJson};
    const RS=${rJson};
    let idx, yesCount;

    function render(){
      if(idx>=QS.length){showResult();return;}
      const q=QS[idx];
      document.getElementById('pz-progress').textContent=(idx+1)+' / '+QS.length;
      document.getElementById('pz-question').textContent=q.ja;
      document.getElementById('pz-question-en').textContent=q.en;
      document.getElementById('pz-feedback').textContent='';
    }

    window.pzAnswer=function(yes){
      if(yes){
        yesCount++;
        document.getElementById('pz-yes-count').textContent=yesCount;
        const fb=document.getElementById('pz-feedback');
        fb.className='feedback correct';
        fb.textContent='✓ はい！';
      } else {
        const fb=document.getElementById('pz-feedback');
        fb.className='feedback info';
        fb.textContent='いいえ。';
      }
      idx++;
      setTimeout(render,600);
    };

    function showResult(){
      document.getElementById('pz-quiz-area').style.display='none';
      const card=document.getElementById('pz-result-card');
      card.style.display='';
      const r=RS.find(r=>yesCount>=r.min&&yesCount<=r.max)||RS[RS.length-1];
      document.getElementById('pz-result-type').textContent=r.type;
      document.getElementById('pz-result-type-en').textContent=r.typeEn;
      document.getElementById('pz-result-desc').textContent=r.desc;
      document.getElementById('pz-result-desc-en').textContent=r.descEn;
      document.getElementById('pz-self-intro').textContent=
        'わたしは'+r.type+'です。';
    }

    window.pzReset=function(){
      idx=0; yesCount=0;
      document.getElementById('pz-yes-count').textContent='0';
      document.getElementById('pz-quiz-area').style.display='';
      document.getElementById('pz-result-card').style.display='none';
      render();
    };
    window.pzReset();
  })();
  </script>`;
}

/* ════════════════════════════════════════════════════
   #8  ACT_HAJIMEMASHITE_CONVERSATION  —  自己紹介会話
   ════════════════════════════════════════════════════ */

function buildHajimemashiteConversation(lessons, taughtPids, actDef) {
  /* 例文から会話ペアを構築 */
  const patterns = collectPatterns(lessons, taughtPids);
  const vocab    = collectVocab(lessons, taughtPids);

  /* namedCharacters またはデフォルト */
  const defaultChars = [
    { name: '田中さん', role: 'A', job: '先生',      jobReading: 'せんせい',
      jobEn: 'teacher',        nat: '日本人',   natReading: 'にほんじん',   natEn: 'Japanese' },
    { name: 'リンさん',  role: 'B', job: '学生',      jobReading: 'がくせい',
      jobEn: 'student',        nat: '中国人',   natReading: 'ちゅうごくじん', natEn: 'Chinese' }
  ];

  const namedChars = [];
  for (const lesson of lessons) {
    for (const nc of lesson.namedCharacters || []) {
      namedChars.push(nc);
    }
  }

  /* p1 例文から人物を抽出してキャラクター構築 */
  const charsByName = {};
  for (const p of patterns) {
    for (const ex of p.examples || []) {
      const m = ex.sentence.match(/^(\S+?)さんは(\S+?)です。$/);
      if (m) {
        const n = m[1] + 'さん';
        if (!charsByName[n]) charsByName[n] = { name: n, attrs: [] };
        charsByName[n].attrs.push(m[2]);
      }
    }
  }

  /* 会話モデル（2人のキャラ） */
  const chars = Object.values(charsByName).slice(0, 2);
  const charA = chars[0] || defaultChars[0];
  const charB = chars[1] || defaultChars[1];

  const jobA  = charA.attrs?.[0] || charA.job || '先生';
  const jobB  = charB.attrs?.[0] || charB.job || '学生';

  /* 英語 bubble 用に職業の英語訳を vocab から逆引き(charA.jobEn が無い場合のフォールバック) */
  const jobAEn = charA.jobEn || vocab.find(v => v.word === jobA)?.en || jobA;
  const jobBEn = charB.jobEn || vocab.find(v => v.word === jobB)?.en || jobB;

  return `
    <div class="card mb2">
      <p class="section-heading">アクティビティ</p>
      <h2 class="activity-title">
        ${withRuby('会話','かいわ')}「はじめまして」
      </h2>
      <p class="activity-title-en en-text">Conversation: "Nice to meet you"</p>
      <div class="mt1">
        <p class="setting-text">
          「はじめまして」の${withRuby('会話練習','かいわれんしゅう')}をします。
          ${withRuby('名前','なまえ')}・${withRuby('国籍','こくせき')}・${withRuby('職業','しょくぎょう')}・${withRuby('所属','しょぞく')}を${withRuby('使','つか')}って、${withRuby('先生','せんせい')}と${withRuby('会話','かいわ')}しましょう。
        </p>
        <p class="setting-text-en en-text">
          Practice the "Nice to meet you" conversation using your name, nationality, occupation, and affiliation.
        </p>
      </div>
    </div>

    <!-- Steps -->
    <div class="card mb2">
      <p class="section-heading">やり${withRuby('方','かた')}</p>
      <ol class="steps-list">
        <li class="step-item">
          <span class="step-num">1</span>
          <div class="step-body">
            <p class="step-ja">${withRuby('会話','かいわ')}モデルを${withRuby('見','み')}てください</p>
            <p class="step-en en-text">Look at the conversation model below.</p>
          </div>
        </li>
        <li class="step-item">
          <span class="step-num">2</span>
          <div class="step-body">
            <p class="step-ja">${withRuby('先生','せんせい')}（A${withRuby('役','やく')}）↔ ${withRuby('学習者','がくしゅうしゃ')}（B${withRuby('役','やく')}）で${withRuby('練習','れんしゅう')}</p>
            <p class="step-en en-text">Practice with teacher (A) and learner (B) roles.</p>
          </div>
        </li>
        <li class="step-item">
          <span class="step-num">3</span>
          <div class="step-body">
            <p class="step-ja">${withRuby('役割','やくわり')}を${withRuby('交代','こうたい')}してもう${withRuby('一度','いちど')}${withRuby('練習','れんしゅう')}</p>
            <p class="step-en en-text">Switch roles and practice again.</p>
          </div>
        </li>
        <li class="step-item">
          <span class="step-num">4</span>
          <div class="step-body">
            <p class="step-ja">${withRuby('本当','ほんとう')}の${withRuby('自分','じぶん')}の${withRuby('情報','じょうほう')}で${withRuby('会話','かいわ')}</p>
            <p class="step-en en-text">Now have the real conversation using your own information.</p>
          </div>
        </li>
      </ol>
    </div>

    <!-- Conversation Model -->
    <div class="card mb2">
      <p class="section-heading">${withRuby('会話例','かいわれい')}</p>

      <div class="dialogue">

        <div class="dialogue-turn turn-a">
          <span class="speaker-label">A</span>
          <div class="bubble">
            <p class="bubble-ja">
              はじめまして。<br>
              わたしは${rubifyCharName(charA.name)}です。<br>
              ${withRuby(jobA, vocab.find(v=>v.word===jobA)?.reading||'')}です。<br>
              どうぞよろしく。
            </p>
            <p class="bubble-en en-text">
              Nice to meet you.<br>
              I'm ${h(charA.name)}.<br>
              I'm a ${h(jobAEn)}.<br>
              Pleased to meet you.
            </p>
          </div>
        </div>

        <div class="dialogue-turn turn-b">
          <span class="speaker-label">B</span>
          <div class="bubble">
            <p class="bubble-ja">
              はじめまして。<br>
              わたしは${rubifyCharName(charB.name)}です。<br>
              ${withRuby(jobB, vocab.find(v=>v.word===jobB)?.reading||'')}です。<br>
              どうぞよろしく。
            </p>
            <p class="bubble-en en-text">
              Nice to meet you.<br>
              I'm ${h(charB.name)}.<br>
              I'm a ${h(jobBEn)}.<br>
              Pleased to meet you.
            </p>
          </div>
        </div>

        <div class="dialogue-turn turn-a">
          <span class="speaker-label">A</span>
          <div class="bubble">
            <p class="bubble-ja">
              ${rubifyCharName(charB.name)}は${withRuby(jobA,vocab.find(v=>v.word===jobA)?.reading||'')}ですか。
            </p>
            <p class="bubble-en en-text">
              Are you a ${h(jobAEn)}, ${h(charB.name)}?
            </p>
          </div>
        </div>

        <div class="dialogue-turn turn-b">
          <span class="speaker-label">B</span>
          <div class="bubble">
            <p class="bubble-ja">
              いいえ、${withRuby(jobB,vocab.find(v=>v.word===jobB)?.reading||'')}です。
            </p>
            <p class="bubble-en en-text">
              No, I'm a ${h(jobBEn)}.
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- Practice Template -->
    <div class="card mb2">
      <p class="section-heading">${withRuby('自分','じぶん')}でやってみよう</p>
      <p style="font-size:.85rem;color:var(--text-subtle);margin-bottom:.75rem">
        ＿＿ のところに${withRuby('自分','じぶん')}の${withRuby('情報','じょうほう')}を${withRuby('入','い')}れてください
      </p>

      <div style="background:var(--bg-subtle);border-radius:var(--radius-md);padding:1.25rem;font-size:1rem;line-height:2.2">
        <div style="margin-bottom:1rem">
          <span style="font-size:.7rem;font-weight:700;color:var(--text-muted);letter-spacing:.1em">あなた（B）</span><br>
          はじめまして。わたしは <span id="my-name" style="border-bottom:2px solid var(--accent);min-width:5rem;display:inline-block;padding:.1rem .3rem;cursor:pointer" onclick="editField('my-name','名前')">＿＿</span> です。<br>
          <span id="my-job" style="border-bottom:2px solid var(--accent);min-width:5rem;display:inline-block;padding:.1rem .3rem;cursor:pointer" onclick="editField('my-job','職業')">＿＿</span> です。<br>
          どうぞよろしく。
        </div>
      </div>
    </div>

    <!-- Tip -->
    <div class="tip-box">
      <strong>💡 ポイント</strong>
      ${withRuby('自分','じぶん')}の${withRuby('本当','ほんとう')}の${withRuby('名前','なまえ')}と${withRuby('職業','しょくぎょう')}を${withRuby('使','つか')}ってみましょう！
    </div>

  <style>
    .dialogue{display:flex;flex-direction:column;gap:.9rem}
    .dialogue-turn{display:flex;gap:.75rem;align-items:flex-start}
    .speaker-label{flex-shrink:0;font-size:.7rem;font-weight:700;letter-spacing:.06em;
      background:var(--bg-subtle);color:var(--text-subtle);border:1px solid rgba(27,44,64,.12);
      border-radius:4px;padding:.25rem .45rem;margin-top:.25rem;min-width:2.2rem;text-align:center}
    .bubble{background:var(--bg-subtle);border-radius:0 var(--radius-md) var(--radius-md) var(--radius-md);
      padding:.65rem 1rem;flex:1}
    .dialogue-turn.turn-b .bubble{background:var(--accent-muted);
      border-radius:var(--radius-md) 0 var(--radius-md) var(--radius-md)}
    .dialogue-turn.turn-b{flex-direction:row-reverse}
    .bubble-ja{font-size:.98rem;line-height:1.55;color:var(--text-main)}
    .bubble-en{font-size:.78rem;color:var(--text-subtle);margin-top:.3rem;font-style:italic;
      transition:opacity .25s var(--ease),max-height .3s var(--ease)}
    .bubble ruby rt{font-size:.48em}
  </style>

  <script>
  window.editField = function(id, label) {
    const el = document.getElementById(id);
    const val = prompt(label + 'を入力してください：', el.textContent === '＿＿' ? '' : el.textContent);
    if (val !== null && val.trim() !== '') {
      el.textContent = val.trim();
      el.style.color = 'var(--text-main)';
    }
  };
  </script>`;
}

/* ════════════════════════════════════════════════════
   ACT_ONLINE_ROULETTE  —  既存実装（維持）
   ════════════════════════════════════════════════════ */

function buildOnlineRoulette(lessons, taughtPids, actDef, session) {
  /* 語彙から人物カードを構築 */
  const patterns = collectPatterns(lessons, taughtPids);
  const vocab    = collectVocab(lessons, taughtPids);

  /* p1 例文から人物リストを抽出 */
  const people = [];
  const seen   = new Set();
  for (const p of patterns) {
    for (const ex of p.examples || []) {
      const m = ex.sentence.match(/^(\S+?)さんは(\S+?)です。$/);
      if (m && !seen.has(m[1])) {
        seen.add(m[1]);
        people.push({
          name: m[1] + 'さん',
          attr: m[2],
          en:   ex.sentenceEn?.split(' is ')[1]?.replace('.','') || m[2]
        });
      }
    }
  }

  if (people.length === 0) {
    return `<div class="placeholder-box"><p>ルーレット用のデータがありません。</p></div>`;
  }

  const peopleJson = JSON.stringify(people);

  return `
    <div class="card mb2">
      <p class="section-heading">アクティビティ</p>
      <h2 class="activity-title">${withRuby('人物','じんぶつ')}ルーレット</h2>
      <p class="activity-title-en en-text">Person Roulette</p>
      <div class="mt1">
        <p class="setting-text">
          ルーレットを${withRuby('回','まわ')}して${withRuby('止','と')}まった${withRuby('人物','じんぶつ')}について「〜は〜です」で${withRuby('文','ぶん')}を${withRuby('作','つく')}ってください。
        </p>
        <p class="setting-text-en en-text">
          Spin the roulette, then make a sentence about the person who lands: "〜は〜です"
        </p>
      </div>
    </div>

    <div class="card mb2" style="text-align:center">
      <canvas id="roulette-canvas" width="400" height="400"
        style="max-width:100%;border-radius:50%;box-shadow:var(--shadow-lg)"></canvas>
      <div style="margin-top:1.25rem">
        <button class="btn btn-accent" id="spin-btn" onclick="rouletteSpin()" style="font-size:1rem;padding:.7rem 2rem">
          🎡 スピン！
        </button>
      </div>
      <div id="roulette-result" style="margin-top:1rem;font-size:1.3rem;font-weight:700;min-height:2rem"></div>
      <div id="roulette-sentence" style="margin-top:.5rem;font-size:1rem;color:var(--text-subtle);min-height:1.5rem"></div>
    </div>

  <script>
  (function(){
    const PEOPLE = ${peopleJson};
    const canvas = document.getElementById('roulette-canvas');
    const ctx    = canvas.getContext('2d');
    const N      = PEOPLE.length;
    const COLORS = ['#7090B0','#E0B040','#5A7A9A','#FAEEDA','#1B2C40','#F5EFE0','#3B6D11','#993C1D'];

    let angle = 0, spinning = false;

    function draw(a) {
      const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 10;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const arc = (2 * Math.PI) / N;
      PEOPLE.forEach((p, i) => {
        const start = a + i * arc, end = start + arc;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + arc / 2);
        ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(p.name, r - 12, 5);
        ctx.restore();
      });
      /* center */
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 2*Math.PI);
      ctx.fillStyle = '#fff'; ctx.fill();
      /* pointer */
      ctx.beginPath(); ctx.moveTo(cx + r - 5, cy);
      ctx.lineTo(cx + r + 15, cy - 10);
      ctx.lineTo(cx + r + 15, cy + 10);
      ctx.fillStyle = '#E0B040'; ctx.fill();
    }

    window.rouletteSpin = function() {
      if (spinning) return;
      spinning = true;
      document.getElementById('spin-btn').disabled = true;
      document.getElementById('roulette-result').textContent = '';
      document.getElementById('roulette-sentence').textContent = '';

      const duration = 3000 + Math.random() * 2000;
      const extraRot = (Math.random() * 2 * Math.PI) + (6 * 2 * Math.PI);
      const start    = performance.now();
      const startAngle = angle;

      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        angle = startAngle + extraRot * ease;
        draw(angle);
        if (t < 1) { requestAnimationFrame(step); return; }
        spinning = false;
        document.getElementById('spin-btn').disabled = false;
        /* which person is at the pointer (right side, angle=0) */
        const arc = (2 * Math.PI) / N;
        const norm = ((-angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const idx  = Math.floor(norm / arc) % N;
        const p    = PEOPLE[idx];
        document.getElementById('roulette-result').textContent = '👤 ' + p.name;
        document.getElementById('roulette-sentence').textContent =
          p.name + 'は' + p.attr + 'です。 ／ ' + p.name.replace('さん','') + '-san is a ' + p.en + '.';
      }
      requestAnimationFrame(step);
    };

    draw(angle);
  })();
  </script>`;
}

/* ────────────────────────────────────────────────────
   ブラウザグローバル登録
   ──────────────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window.buildActivityHtml = buildActivityHtml;

  /* ─── main.js 互換アダプタ ───────────────────────────
   * main.js は `window.ActivityHtml.generate(ctx)` で Blob を期待する。
   * v0.3 から buildActivityHtml が以下を内部で処理するため、ブリッジ層は不要:
   *   - session.mainActivities[] 2件以上 → タブ切替の multi モード
   *   - mainActivities[0] / session.activity.selectedId → single モード
   *   - 該当無し → null
   * 戻り値は HTML string → Blob に包んで返すだけ。
   */
  window.ActivityHtml = {
    async generate(ctx) {
      const session = (ctx && ctx.session) || {};
      const html = buildActivityHtml(
        session,
        ctx.lessonsByNo || {},
        ctx.imageRegistry,
        ctx.activityCatalog
      );
      if (!html) return null;
      return new Blob([html], { type: 'text/html;charset=utf-8' });
    },
    _meta: { version: '0.3-multi-tabs', createdAt: '2026-05-15' },
  };
}

/* Node.js / テスト環境向け */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildActivityHtml, buildActivityBlock };
}
