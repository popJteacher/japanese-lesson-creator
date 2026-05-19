/**
 * activity_blocks/_shared.js
 * -----------------------------------------------------------------------------
 * 全 ActivityBlocks (各 required activity の専用 UI 生成モジュール) が共有する
 * ヘルパー関数・共通 CSS・共通 inline JS を提供する。
 *
 *   window.ActivityHelpers — 関数群
 *   window.ActivityBlocks  — 各活動が自分の id で登録するモジュールマップ
 *   window.ActivityShared  — 共通 CSS / inline JS の文字列断片
 *
 * 各 activity_blocks/<id>.js は以下の規約に従う:
 *   window.ActivityBlocks.act_<id> = {
 *     buildSection: function(activity, config, lesson, registryEntries, helpers) {
 *       return '<section>...</section>';   // 学習者画面用 HTML
 *     },
 *     css: '...',         // 活動固有 CSS (空可)
 *     inlineJs: '...',    // DOMReady 時に走る JS。必ず (function(){...})(); で IIFE 包む
 *   };
 *
 * 活動間の CSS 衝突を防ぐため、各活動の CSS セレクタは .act-<short_id>-* 形式で書く。
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;

  // ── 名前空間初期化 ──────────────────────────────────────────────────
  window.ActivityBlocks = window.ActivityBlocks || {};

  // ── HTML エスケープ ──────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── ふりがな付与 ────────────────────────────────────────────────────
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

  // ── 画像 URL ──────────────────────────────────────────────────────
  function normalizeImageUrl(url, sizeHint) {
    if (typeof url !== 'string') return url;
    let m = url.match(/^https?:\/\/drive\.google\.com\/uc\?(?:[^#]*&)?id=([\w-]+)/);
    if (m) return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w' + (sizeHint || 512);
    m = url.match(/^https?:\/\/drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([\w-]+)/);
    if (m) return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w' + (sizeHint || 512);
    m = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (m) return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w' + (sizeHint || 512);
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

  // ── activity_catalog ──────────────────────────────────────────────
  function findActivity(catalog, id) {
    if (!catalog || !Array.isArray(catalog.activities)) return null;
    return catalog.activities.find(function (a) { return a.id === id; }) || null;
  }

  // session.mainActivities[i] の config を解決する。
  // 優先順: 1) ma.config (直接) 2) ma.useExample (catalog の "<name>" を引用)
  function resolveConfig(ma, activity) {
    if (ma && ma.config && typeof ma.config === 'object') return ma.config;
    if (ma && typeof ma.useExample === 'string') {
      const ex = activity[ma.useExample];
      if (ex && typeof ex === 'object' && ex.config) return ex.config;
    }
    return null;
  }

  // ── 語彙データ抽出 ──────────────────────────────────────────────────
  // lesson.vocabulary.byPattern[*].words[] を 1 配列に集約。groupKey を各語に付与する。
  function flattenAllVocab(lesson) {
    const out = [];
    if (!lesson || !lesson.vocabulary || !lesson.vocabulary.byPattern) return out;
    const groups = lesson.vocabulary.byPattern;
    Object.keys(groups).forEach(function (groupKey) {
      const g = groups[groupKey];
      const patternIds = g.patternIds || [];
      (g.words || []).forEach(function (w) {
        out.push({
          word: w.word || '',
          reading: w.reading || '',
          en: w.en || '',
          imageRole: w.imageRole || '',
          vocabType: w.vocabType || '',
          groupKey: groupKey,
          patternIds: patternIds,
        });
      });
    });
    return out;
  }

  // patternIds (例 ['p1','p2']) と交差するグループの語のみ抽出。
  function getVocabByPattern(lesson, patternIds) {
    if (!Array.isArray(patternIds) || patternIds.length === 0) return flattenAllVocab(lesson);
    const all = flattenAllVocab(lesson);
    return all.filter(function (w) {
      return (w.patternIds || []).some(function (p) { return patternIds.indexOf(p) >= 0; });
    });
  }

  // registry.entries から type === 'named_character_card' のみ抽出。
  function getCharacterCards(registryEntries) {
    if (!registryEntries || typeof registryEntries !== 'object') return [];
    const out = [];
    Object.keys(registryEntries).forEach(function (key) {
      const e = registryEntries[key];
      if (!e || e.type !== 'named_character_card') return;
      let url = null;
      if (Array.isArray(e.images) && e.images.length > 0 && e.images[0].imageUrl) {
        url = normalizeImageUrl(e.images[0].imageUrl, 256);
      }
      out.push({
        key: key,
        name: e.characterName || key,
        role: e.role || '',
        nationality: e.nationality || '',
        gender: e.gender || '',
        description: e.description || '',
        imageUrl: url,
      });
    });
    return out;
  }

  // lesson.patterns[].examples[].sentence を patternId でフィルタして集約。
  function getExampleSentences(lesson, patternIds) {
    if (!lesson || !Array.isArray(lesson.patterns)) return [];
    const filter = Array.isArray(patternIds) && patternIds.length > 0 ? patternIds : null;
    const out = [];
    lesson.patterns.forEach(function (p) {
      if (filter && filter.indexOf(p.id) < 0) return;
      (p.examples || []).forEach(function (ex) {
        if (!ex || typeof ex.sentence !== 'string') return;
        out.push({
          patternId: p.id,
          no: ex.no || '',
          sentence: ex.sentence,
          sentenceEn: ex.sentenceEn || '',
          imageId: ex.imageId || null,
        });
      });
    });
    return out;
  }

  // 正文を典型的なエラーパターンに変形して誤文を作る。
  // 戻り値: [{ sentence, reason }] (最大 2 件)
  function corruptSentence(sentence, patternId) {
    if (typeof sentence !== 'string' || sentence.length === 0) return [];
    const variants = [];

    // 「は」助詞欠落
    if (/は/.test(sentence)) {
      const removed = sentence.replace('は', '');
      if (removed !== sentence) variants.push({ sentence: removed, reason: '「は」がありません' });
    }
    // 「は」を「が」に置換
    if (/は/.test(sentence) && variants.length < 2) {
      const swapped = sentence.replace('は', 'が');
      if (swapped !== sentence) variants.push({ sentence: swapped, reason: '「は」が「が」になっています' });
    }
    // 「の」欠落
    if (/の/.test(sentence) && variants.length < 2) {
      const removed = sentence.replace('の', '');
      if (removed !== sentence) variants.push({ sentence: removed, reason: '「の」がありません' });
    }
    // 「です」欠落
    if (/です/.test(sentence) && variants.length < 2) {
      const removed = sentence.replace('です', '');
      if (removed !== sentence) variants.push({ sentence: removed, reason: '「です」がありません' });
    }
    // 「じゃありません」→「じゃない」(カジュアル形混入)
    if (/じゃありません/.test(sentence) && variants.length < 2) {
      const swapped = sentence.replace('じゃありません', 'じゃない');
      variants.push({ sentence: swapped, reason: '「じゃない」はカジュアル形です' });
    }
    return variants.slice(0, 2);
  }

  // 画像 + ラベルの標準タイル HTML を返す (slot 互換)。
  function imageTile(imageId, label, registry) {
    const url = imgUrl(imageId, registry, 256);
    const imgHtml = url
      ? '<img src="' + esc(url) + '" alt="" loading="lazy" decoding="async" onerror="this.outerHTML=&quot;&lt;span class=img-fallback&gt;🖼️&lt;/span&gt;&quot;">'
      : '<span class="img-fallback">🖼️</span>';
    return imgHtml + '<div class="label">' + ruby(label || '') + '</div>';
  }

  // 決定的シャッフル (seed 文字列から擬似乱数を生成)。同じ seed なら同じ並びになる。
  function shuffle(arr, seedString) {
    const a = (arr || []).slice();
    let seed = 0;
    const s = String(seedString || 'seed');
    for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) | 0;
    function rand() {
      seed = (seed * 9301 + 49297) | 0;
      return ((seed % 233280) + 233280) % 233280 / 233280;
    }
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // vocabulary.byPattern のキー → 人間ラベルへの変換マップ。
  // 未登録のキーは「その他」を返す。lesson_NN.json のキー命名と整合させる。
  const CATEGORY_LABEL_MAP = {
    'p1_p2': '職業',
    'p1_p2_nationality': '国籍',
    'p3': '所属',
    'p3_pronoun': '代名詞',
    'p1_p4_thing': 'もの',
    'p5_p6_person': '人',
    'p1_distant_building': '建物',
  };
  function categoryLabelFromGroupKey(key) {
    return CATEGORY_LABEL_MAP[key] || key || 'その他';
  }

  // ── 共通 CSS ────────────────────────────────────────────────────────
  // 各活動が再利用するクラス: .act-grid / .act-tile / .act-btn-* / .act-statusbar / .act-feedback
  const SHARED_CSS = '\n' +
    '.act-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }\n' +
    '.act-tile {\n' +
    '  background: var(--color-background-subtle);\n' +
    '  border: 2px solid transparent;\n' +
    '  border-radius: var(--border-radius-medium);\n' +
    '  padding: 12px;\n' +
    '  text-align: center;\n' +
    '  transition: transform 0.2s, border-color 0.2s, background 0.2s;\n' +
    '  cursor: pointer;\n' +
    '  font-family: inherit; font-size: inherit; color: inherit;\n' +
    '  min-height: 100px;\n' +
    '}\n' +
    '.act-tile.face-down { background: var(--color-ui-primary); color: #fff; font-size: 2rem; }\n' +
    '.act-tile.face-down .label, .act-tile.face-down img, .act-tile.face-down .img-fallback { visibility: hidden; }\n' +
    '.act-tile.face-down::after { content: "?"; position: absolute; }\n' +
    '.act-tile { position: relative; }\n' +
    '.act-tile.matched { background: #E7F5EC; border-color: var(--color-feedback-correct, #3B6D11); opacity: 0.7; cursor: default; }\n' +
    '.act-tile.wrong { background: #FDE8E8; border-color: var(--color-feedback-wrong, #993C1D); }\n' +
    '.act-tile.selected { transform: scale(1.06); border-color: var(--color-ui-accent); box-shadow: var(--shadow-strong); }\n' +
    '.act-tile img { width: 100%; aspect-ratio: 1; object-fit: contain; background: var(--color-background-surface); border-radius: var(--border-radius-small); margin-bottom: 8px; }\n' +
    '.act-tile .img-fallback { display: flex; align-items: center; justify-content: center; width: 100%; aspect-ratio: 1; background: var(--color-background-surface); border-radius: var(--border-radius-small); font-size: 2rem; color: var(--color-text-muted); margin-bottom: 8px; }\n' +
    '.act-tile .label { font-weight: var(--font-weight-bold); }\n' +
    '.act-tile .label-en { display: block; font-size: var(--font-size-caption); color: var(--color-text-muted); margin-top: 2px; }\n' +
    '\n' +
    '.act-btn-primary, .act-btn-secondary {\n' +
    '  font-family: inherit; font-size: var(--font-size-body);\n' +
    '  padding: 10px 22px;\n' +
    '  border: none;\n' +
    '  border-radius: var(--border-radius-small);\n' +
    '  cursor: pointer;\n' +
    '  font-weight: var(--font-weight-medium);\n' +
    '  min-height: 44px;\n' +
    '  transition: background 0.15s, border-color 0.15s;\n' +
    '}\n' +
    '.act-btn-primary { background: var(--color-ui-primary); color: #fff; }\n' +
    '.act-btn-primary:hover { background: var(--color-ui-primary-hover); }\n' +
    '.act-btn-primary:disabled { opacity: 0.5; cursor: default; }\n' +
    '.act-btn-secondary { background: #fff; color: var(--color-ui-primary); border: 2px solid var(--color-ui-primary); }\n' +
    '.act-btn-secondary:hover { background: var(--color-background-subtle); }\n' +
    '\n' +
    '.act-statusbar {\n' +
    '  display: flex; gap: 24px; flex-wrap: wrap;\n' +
    '  padding: 10px 16px;\n' +
    '  background: var(--color-background-subtle);\n' +
    '  border-radius: var(--border-radius-small);\n' +
    '  margin-bottom: 16px;\n' +
    '  font-size: var(--font-size-small);\n' +
    '}\n' +
    '.act-statusbar strong { color: var(--color-ui-primary-dark); }\n' +
    '\n' +
    '.act-feedback {\n' +
    '  margin-top: 12px;\n' +
    '  padding: 10px 14px;\n' +
    '  border-radius: var(--border-radius-small);\n' +
    '  font-weight: var(--font-weight-medium);\n' +
    '}\n' +
    '.act-feedback.correct { background: #E7F5EC; color: #1D6F3A; }\n' +
    '.act-feedback.wrong { background: #FDE8E8; color: #9B1C1C; }\n' +
    '\n' +
    '.act-controls { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; align-items: center; }\n' +
    '\n' +
    '.activity-section {\n' +
    '  background: var(--color-background-surface);\n' +
    '  padding: 20px;\n' +
    '  border-radius: var(--border-radius-large);\n' +
    '  box-shadow: var(--shadow-default);\n' +
    '  margin: 0 0 32px;\n' +
    '}\n';

  // ── 公開 ──────────────────────────────────────────────────────────
  window.ActivityHelpers = {
    esc: esc,
    ruby: ruby,
    normalizeImageUrl: normalizeImageUrl,
    imgUrl: imgUrl,
    findActivity: findActivity,
    resolveConfig: resolveConfig,
    flattenAllVocab: flattenAllVocab,
    getVocabByPattern: getVocabByPattern,
    getCharacterCards: getCharacterCards,
    getExampleSentences: getExampleSentences,
    corruptSentence: corruptSentence,
    imageTile: imageTile,
    shuffle: shuffle,
    categoryLabelFromGroupKey: categoryLabelFromGroupKey,
  };

  window.ActivityShared = {
    css: SHARED_CSS,
  };
})();
