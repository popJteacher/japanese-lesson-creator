/**
 * activity_blocks/memory_matching.js
 * -----------------------------------------------------------------------------
 * act_memory_matching: 神経衰弱(記憶マッチング)。絵カードと単語カードを裏向きに並べ、
 * 2 枚めくって一致したら「〜は〜です」テンプレで産出する。
 *
 * データ駆動:
 *   - lesson.vocabulary.byPattern から語彙を取得 (config.vocabGroup でグループ指定可)
 *   - 画像は master_image_registry.entries.vocab_<word> から解決
 *   - lesson データを差し替えると出題語彙も自動的に変わる
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;
  const H = window.ActivityHelpers;
  if (!H) return;

  // 「〜は〜です」プロデュース時のスピーカー名。lesson の人物例文から取得。
  function pickSpeakerName(lesson) {
    if (!lesson || !Array.isArray(lesson.patterns)) return 'わたし';
    for (const p of lesson.patterns) {
      for (const ex of (p.examples || [])) {
        const m = ex.sentence && ex.sentence.match(/^([^\s、。]+さん)/);
        if (m) return m[1];
      }
    }
    return 'わたし';
  }

  function pickWords(lesson, config) {
    const groupKey = config && config.vocabGroup;
    let words;
    if (groupKey && lesson.vocabulary && lesson.vocabulary.byPattern && lesson.vocabulary.byPattern[groupKey]) {
      words = lesson.vocabulary.byPattern[groupKey].words || [];
    } else {
      // 第一候補: p1 のグループ。なければ全体から先頭を採用。
      const p1 = H.getVocabByPattern(lesson, ['p1']);
      words = p1.length > 0 ? p1 : H.flattenAllVocab(lesson);
    }
    const pairCount = Math.max(2, Math.min((config && config.pairCount) || 6, words.length));
    return words.slice(0, pairCount);
  }

  function buildSection(activity, config, lesson, registryEntries) {
    const words = pickWords(lesson, config);
    const speaker = pickSpeakerName(lesson);

    // 各語に2つのタイル(image + word)を作る。pairId は語の index と一致。
    const tiles = [];
    words.forEach(function (w, idx) {
      tiles.push({
        pairId: idx,
        side: 'image',
        word: w.word,
        reading: w.reading,
        en: w.en,
        imageId: 'vocab_' + w.word,
      });
      tiles.push({
        pairId: idx,
        side: 'word',
        word: w.word,
        reading: w.reading,
        en: w.en,
        imageId: null,
      });
    });
    const shuffled = H.shuffle(tiles, 'memory_' + lesson.lesson.no);

    const tilesHtml = shuffled.map(function (t) {
      const url = t.side === 'image' ? H.imgUrl(t.imageId, registryEntries, 256) : null;
      const visualHtml = (t.side === 'image')
        ? (url
            ? '<img src="' + H.esc(url) + '" alt="" loading="lazy" decoding="async" onerror="this.outerHTML=&quot;&lt;span class=img-fallback&gt;🖼️&lt;/span&gt;&quot;">'
            : '<span class="img-fallback">🖼️</span>')
        : '<span class="img-fallback">📝</span>';
      const labelHtml = (t.side === 'word')
        ? '<div class="label">' + H.ruby(t.word) + '</div><div class="label-en en-text">' + H.esc(t.en) + '</div>'
        : '<div class="label">　</div>';   // 画像側はラベル非表示(空白で高さ揃え)
      return (
        '<button type="button" class="act-tile act-memory-tile face-down" ' +
          'data-pair-id="' + t.pairId + '" ' +
          'data-side="' + t.side + '" ' +
          'data-word="' + H.esc(t.word) + '" ' +
          'data-speaker="' + H.esc(speaker) + '">' +
          visualHtml + labelHtml +
        '</button>'
      );
    }).join('');

    return (
      '<section class="activity-section act-memory">' +
        '<div class="act-statusbar">' +
          '<span>' + H.ruby('めくった回数') + ': <strong data-mm-turns>0</strong></span>' +
          '<span>' + H.ruby('成立') + ': <strong data-mm-matches>0</strong> / ' + words.length + '</span>' +
        '</div>' +
        '<div class="act-grid act-memory-grid">' + tilesHtml + '</div>' +
        '<div class="act-feedback" data-mm-feedback hidden></div>' +
        '<div class="act-controls">' +
          '<button type="button" class="act-btn-secondary" data-mm-reset>' + H.ruby('もう一度') + '</button>' +
        '</div>' +
      '</section>'
    );
  }

  const CSS = '\n' +
    '.act-memory-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }\n' +
    '.act-memory-tile { width: 100%; }\n' +
    '.act-memory-tile.face-down::after { content: "?"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 3rem; color: #fff; }\n';

  const JS = '\n' +
    '(function(){\n' +
    '  var grid = document.querySelector(".act-memory-grid");\n' +
    '  if (!grid) return;\n' +
    '  var tiles = Array.from(grid.querySelectorAll(".act-memory-tile"));\n' +
    '  var turnsEl = document.querySelector("[data-mm-turns]");\n' +
    '  var matchEl = document.querySelector("[data-mm-matches]");\n' +
    '  var feedback = document.querySelector("[data-mm-feedback]");\n' +
    '  var resetBtn = document.querySelector("[data-mm-reset]");\n' +
    '  var totalPairs = new Set(tiles.map(function(t){ return t.dataset.pairId; })).size;\n' +
    '  var first = null, locked = false, turns = 0, matches = 0;\n' +
    '  function reset(){\n' +
    '    tiles.forEach(function(t){ t.classList.add("face-down"); t.classList.remove("matched","wrong","selected"); });\n' +
    '    first = null; locked = false; turns = 0; matches = 0;\n' +
    '    if (turnsEl) turnsEl.textContent = "0";\n' +
    '    if (matchEl) matchEl.textContent = "0";\n' +
    '    if (feedback){ feedback.hidden = true; feedback.textContent = ""; feedback.classList.remove("correct","wrong"); }\n' +
    '  }\n' +
    '  function flip(t){\n' +
    '    if (locked || !t.classList.contains("face-down") || t.classList.contains("matched")) return;\n' +
    '    t.classList.remove("face-down");\n' +
    '    if (!first){ first = t; return; }\n' +
    '    locked = true;\n' +
    '    turns++;\n' +
    '    if (turnsEl) turnsEl.textContent = String(turns);\n' +
    '    var second = t;\n' +
    '    if (first.dataset.pairId === second.dataset.pairId && first !== second){\n' +
    '      setTimeout(function(){\n' +
    '        first.classList.add("matched"); second.classList.add("matched");\n' +
    '        matches++;\n' +
    '        if (matchEl) matchEl.textContent = String(matches);\n' +
    '        var word = second.dataset.word || first.dataset.word;\n' +
    '        var speaker = second.dataset.speaker || first.dataset.speaker || "わたし";\n' +
    '        if (feedback){\n' +
    '          feedback.hidden = false;\n' +
    '          feedback.classList.remove("wrong"); feedback.classList.add("correct");\n' +
    '          feedback.textContent = "ペア成立: " + speaker + "は" + word + "です。";\n' +
    '        }\n' +
    '        if (matches >= totalPairs && feedback){\n' +
    '          feedback.textContent = "全部そろいました！おつかれさまでした。";\n' +
    '        }\n' +
    '        first = null; locked = false;\n' +
    '      }, 350);\n' +
    '    } else {\n' +
    '      first.classList.add("wrong"); second.classList.add("wrong");\n' +
    '      if (feedback){ feedback.hidden = false; feedback.classList.remove("correct"); feedback.classList.add("wrong"); feedback.textContent = "ちがいます。"; }\n' +
    '      setTimeout(function(){\n' +
    '        first.classList.remove("wrong"); second.classList.remove("wrong");\n' +
    '        first.classList.add("face-down"); second.classList.add("face-down");\n' +
    '        first = null; locked = false;\n' +
    '      }, 800);\n' +
    '    }\n' +
    '  }\n' +
    '  tiles.forEach(function(t){ t.addEventListener("click", function(){ flip(t); }); });\n' +
    '  if (resetBtn) resetBtn.addEventListener("click", reset);\n' +
    '})();\n';

  window.ActivityBlocks.act_memory_matching = {
    buildSection: buildSection,
    css: CSS,
    inlineJs: JS,
  };
})();
