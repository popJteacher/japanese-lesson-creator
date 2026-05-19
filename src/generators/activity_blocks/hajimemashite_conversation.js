/**
 * activity_blocks/hajimemashite_conversation.js
 * -----------------------------------------------------------------------------
 * act_hajimemashite_conversation: 自己紹介会話ロールプレイ。
 * catalog の conversationModel (A/B 各セリフのテンプレート) を読み、
 * lesson と registry のデータで ___ を埋めて表示する。
 *
 * データ駆動:
 *   - conversationModel: activity_catalog.json から取得 (catalog 再ビルド要)
 *     fallback: 同等テンプレを generator 内に保持 (catalog 再ビルド忘れの保険)
 *   - 名前 / 国籍 / 職業: registry の named_character_card を採用
 *   - 所属: lesson.vocabulary.byPattern.p3 の語彙 + 例文の固有名詞
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;
  const H = window.ActivityHelpers;
  if (!H) return;

  const FALLBACK_MODEL = {
    A_line1: 'はじめまして。___です。___です。どうぞよろしく。',
    B_line1: 'はじめまして。___です。___から来ました。どうぞよろしく。',
    A_line2: '___さんは___ですか。',
    B_line2: 'はい、___です。___さんは？',
    A_line3: 'わたしは___です。___の___です。',
  };

  function pickAffiliation(lesson) {
    if (!lesson || !Array.isArray(lesson.patterns)) return '東西病院';
    for (const p of lesson.patterns) {
      if (p.id !== 'p3') continue;
      for (const ex of (p.examples || [])) {
        const m = ex.sentence && ex.sentence.match(/(東西[^\s、。の]+|[^\s、。の]+(?:銀行|大学|病院|デパート))/);
        if (m) return m[1];
      }
    }
    return '東西病院';
  }

  function pickB(cards, config) {
    if (config && config.characterKey){
      const found = cards.find(function (c) { return c.key === config.characterKey; });
      if (found) return found;
    }
    return cards.find(function (c) { return c.key === 'char_リン'; })
      || cards.find(function (c) { return c.role && c.role.indexOf('学生') >= 0; })
      || cards[0]
      || null;
  }

  function pickA(cards, bCard) {
    return cards.find(function (c) { return c !== bCard && c.role && c.role.indexOf('先生') >= 0; })
      || cards.find(function (c) { return c !== bCard; })
      || null;
  }

  function fillTemplate(tpl, parts) {
    // ___ を順番に parts で置換。parts が尽きたら残りはそのまま。
    let out = String(tpl || '');
    parts.forEach(function (p) {
      out = out.replace('___', p == null ? '?' : String(p));
    });
    return out;
  }

  function buildSection(activity, config, lesson, registryEntries) {
    const model = (activity && activity.conversationModel) || FALLBACK_MODEL;
    const cards = H.getCharacterCards(registryEntries);
    const bCard = pickB(cards, config);
    const aCard = pickA(cards, bCard);
    if (!bCard) {
      return '<div class="placeholder">' + H.ruby('人物カードのデータが見つかりません。') + '</div>';
    }
    const affiliation = pickAffiliation(lesson);

    // テンプレ穴埋め。A 側は教師想定なので名前は伏せ字に近い汎用、B 側は bCard で固定。
    const aName = (aCard && aCard.name) || '___';
    const aNationality = (aCard && aCard.nationality) || '___';
    const aRole = (aCard && aCard.role) || '___';
    const bName = bCard.name || '___';
    const bNationality = bCard.nationality || '___';
    const bRole = bCard.role || '___';

    // パーツの順序は conversationModel テンプレ仕様 (___ の登場順)
    const A1 = fillTemplate(model.A_line1, [aName, aNationality]);
    const B1 = fillTemplate(model.B_line1, [bName, bNationality]);
    const A2 = fillTemplate(model.A_line2, [bName, bRole]);
    const B2 = fillTemplate(model.B_line2, [bRole, aName]);
    const A3 = fillTemplate(model.A_line3, [aName, affiliation, aRole]);

    const aImg = aCard && aCard.imageUrl
      ? '<img src="' + H.esc(aCard.imageUrl) + '" alt="" loading="lazy">'
      : '<span class="img-fallback">👤</span>';
    const bImg = bCard.imageUrl
      ? '<img src="' + H.esc(bCard.imageUrl) + '" alt="" loading="lazy">'
      : '<span class="img-fallback">👤</span>';

    function lineHtml(speaker, ja, step) {
      return (
        '<div class="conv-line" data-speaker="' + speaker + '" data-step="' + step + '" ' + (step === 1 ? '' : 'hidden') + '>' +
          '<span class="speaker">' + speaker + ':</span>' +
          '<span class="ja">' + H.ruby(ja) + '</span>' +
        '</div>'
      );
    }

    return (
      '<section class="activity-section act-hajimemashite">' +
        '<div class="act-statusbar">' +
          '<span>' + H.ruby('セリフ') + ': <strong data-conv-shown>1</strong> / 5</span>' +
        '</div>' +
        '<div class="act-conv-stage">' +
          '<div class="role role-a">' +
            '<h3>Aさん' + (aCard && aCard.role ? ' (' + H.ruby(aCard.role) + ')' : '') + '</h3>' +
            '<div class="role-img">' + aImg + '</div>' +
          '</div>' +
          '<div class="conversation">' +
            lineHtml('A', A1, 1) +
            lineHtml('B', B1, 2) +
            lineHtml('A', A2, 3) +
            lineHtml('B', B2, 4) +
            lineHtml('A', A3, 5) +
          '</div>' +
          '<div class="role role-b">' +
            '<h3>Bさん' + (bCard.role ? ' (' + H.ruby(bCard.role) + ')' : '') + '</h3>' +
            '<div class="role-img">' + bImg + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="act-controls">' +
          '<button type="button" class="act-btn-primary" data-conv-next>' + H.ruby('つぎの セリフ') + '</button>' +
          '<button type="button" class="act-btn-secondary" data-conv-swap>' + H.ruby('やくを 交代') + '</button>' +
          '<button type="button" class="act-btn-secondary" data-conv-restart>' + H.ruby('はじめから') + '</button>' +
        '</div>' +
      '</section>'
    );
  }

  const CSS = '\n' +
    '.act-conv-stage { display: grid; grid-template-columns: 120px 1fr 120px; gap: 16px; align-items: start; }\n' +
    '.act-conv-stage .role { text-align: center; }\n' +
    '.act-conv-stage .role h3 { font-size: var(--font-size-h3); margin: 0 0 8px; color: var(--color-ui-primary-dark); }\n' +
    '.act-conv-stage .role-img { width: 100%; aspect-ratio: 1; border-radius: 50%; overflow: hidden; background: var(--color-background-subtle); }\n' +
    '.act-conv-stage .role-img img { width: 100%; height: 100%; object-fit: cover; }\n' +
    '.act-conv-stage .role-img .img-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 3rem; color: var(--color-text-muted); }\n' +
    '.act-conv-stage.swapped { grid-template-areas: "b conv a"; }\n' +
    '.act-conv-stage.swapped .role-a { grid-area: a; }\n' +
    '.act-conv-stage.swapped .role-b { grid-area: b; }\n' +
    '.act-conv-stage.swapped .conversation { grid-area: conv; }\n' +
    '.conversation { display: flex; flex-direction: column; gap: 10px; }\n' +
    '.conv-line { background: var(--color-background-subtle); padding: 12px 16px; border-radius: var(--border-radius-medium); }\n' +
    '.conv-line[data-speaker="A"] { border-left: 4px solid var(--color-ui-primary); }\n' +
    '.conv-line[data-speaker="B"] { border-left: 4px solid var(--color-ui-accent); }\n' +
    '.conv-line .speaker { font-weight: var(--font-weight-bold); margin-right: 8px; color: var(--color-ui-primary-dark); }\n' +
    '.conv-line .ja { font-size: var(--font-size-body); }\n' +
    '@media (max-width: 720px) { .act-conv-stage { grid-template-columns: 1fr; } }\n';

  const JS = '\n' +
    '(function(){\n' +
    '  var section = document.querySelector(".act-hajimemashite");\n' +
    '  if (!section) return;\n' +
    '  var stage = section.querySelector(".act-conv-stage");\n' +
    '  var lines = Array.from(section.querySelectorAll(".conv-line"));\n' +
    '  var shown = section.querySelector("[data-conv-shown]");\n' +
    '  var nextBtn = section.querySelector("[data-conv-next]");\n' +
    '  var swapBtn = section.querySelector("[data-conv-swap]");\n' +
    '  var restartBtn = section.querySelector("[data-conv-restart]");\n' +
    '  function visibleCount(){ return lines.filter(function(l){ return !l.hidden; }).length; }\n' +
    '  function updateShown(){ if (shown) shown.textContent = String(visibleCount()); }\n' +
    '  if (nextBtn) nextBtn.addEventListener("click", function(){\n' +
    '    var nxt = lines.find(function(l){ return l.hidden; });\n' +
    '    if (nxt){ nxt.hidden = false; updateShown(); }\n' +
    '  });\n' +
    '  if (swapBtn) swapBtn.addEventListener("click", function(){\n' +
    '    if (stage) stage.classList.toggle("swapped");\n' +
    '  });\n' +
    '  if (restartBtn) restartBtn.addEventListener("click", function(){\n' +
    '    lines.forEach(function(l, i){ l.hidden = (i !== 0); });\n' +
    '    updateShown();\n' +
    '  });\n' +
    '})();\n';

  window.ActivityBlocks.act_hajimemashite_conversation = {
    buildSection: buildSection,
    css: CSS,
    inlineJs: JS,
  };
})();
