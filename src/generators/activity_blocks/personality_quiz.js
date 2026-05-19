/**
 * activity_blocks/personality_quiz.js
 * -----------------------------------------------------------------------------
 * act_personality_quiz: 性格診断クイズ。Yes/No の質問を繰り返した後に
 * 「あなたは ___ タイプです」と診断する。
 *
 * データ駆動 (特定の課にハードコードしない):
 *   - 結果タイプ: lesson.vocabulary.byPattern[resultTypeGroup].words から取得
 *     (lesson_01 では p1_p2 グループ = 職業語彙 5 件 が結果タイプ)
 *   - 質問: 結果タイプ語彙をペア化して「あなたは ___ タイプですか」テンプレに流す
 *     (lesson の語彙が変われば質問内容と数も自動的に変わる)
 *   - lesson データのみに依存。catalog にもハードコードにも依存しない。
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;
  const H = window.ActivityHelpers;
  if (!H) return;

  function pickResultTypes(lesson, config) {
    const groupKey = (config && config.resultTypeGroup) || null;
    if (groupKey && lesson.vocabulary && lesson.vocabulary.byPattern && lesson.vocabulary.byPattern[groupKey]) {
      return lesson.vocabulary.byPattern[groupKey].words || [];
    }
    // デフォルト: vocab_person タイプの語彙を集める (lesson_01 なら職業 + 国籍)
    const all = H.flattenAllVocab(lesson);
    const persons = all.filter(function (w) { return w.imageRole === 'vocab_person'; });
    if (persons.length >= 3) return persons;
    return all;
  }

  function buildSection(activity, config, lesson, registryEntries) {
    const types = pickResultTypes(lesson, config);
    if (types.length < 2) {
      return '<div class="placeholder">' + H.ruby('診断用の語彙が不足しています。') + '</div>';
    }
    const shuffled = H.shuffle(types, 'pq_' + lesson.lesson.no);
    const targetCount = Math.min((config && config.questionCount) || 6, shuffled.length);
    // 質問: 各回 yesType (= シャッフル後の i) を聞き、no の場合は別タイプを加点。
    const questions = [];
    for (let i = 0; i < targetCount; i++) {
      const yesType = shuffled[i];
      const noType = shuffled[(i + Math.floor(shuffled.length / 2)) % shuffled.length];
      if (yesType.word === noType.word) continue;
      questions.push({ yesType: yesType, noType: noType });
    }

    const questionsHtml = questions.map(function (q, idx) {
      return (
        '<div class="act-pq-question" data-q-idx="' + idx + '" ' +
              'data-yes-type="' + H.esc(q.yesType.word) + '" ' +
              'data-no-type="' + H.esc(q.noType.word) + '" ' +
              (idx === 0 ? '' : 'hidden') + '>' +
          '<p class="ja">' + H.ruby('あなたは ' + q.yesType.word + ' タイプですか。') + '</p>' +
          '<p class="en en-text">Are you the "' + H.esc(q.yesType.en) + '" type?</p>' +
          '<div class="act-controls">' +
            '<button type="button" class="act-btn-primary" data-pq-answer="yes">' + H.ruby('はい') + '</button>' +
            '<button type="button" class="act-btn-secondary" data-pq-answer="no">' + H.ruby('いいえ') + '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    return (
      '<section class="activity-section act-personality">' +
        '<div class="act-statusbar">' +
          '<span>' + H.ruby('質問') + ': <strong data-pq-pos>1</strong> / ' + questions.length + '</span>' +
        '</div>' +
        '<div class="act-pq-stage">' + questionsHtml + '</div>' +
        '<div class="act-pq-result" hidden>' +
          '<p>' + H.ruby('あなたは ') + '<strong data-pq-result></strong>' + H.ruby(' タイプです！') + '</p>' +
          '<button type="button" class="act-btn-secondary" data-pq-restart>' + H.ruby('もう いっかい') + '</button>' +
        '</div>' +
      '</section>'
    );
  }

  const CSS = '\n' +
    '.act-pq-question { background: var(--color-background-subtle); padding: 24px; border-radius: var(--border-radius-medium); text-align: center; }\n' +
    '.act-pq-question .ja { font-size: var(--font-size-h2); margin: 0 0 10px; }\n' +
    '.act-pq-question .en { font-size: var(--font-size-small); color: var(--color-text-muted); margin: 0 0 16px; }\n' +
    '.act-pq-question .act-controls { justify-content: center; }\n' +
    '.act-pq-result { background: var(--color-ui-accent-muted); padding: 24px; border-radius: var(--border-radius-medium); text-align: center; font-size: var(--font-size-h2); }\n' +
    '.act-pq-result strong { color: var(--color-ui-primary-dark); }\n' +
    '.act-pq-result button { margin-top: 16px; }\n';

  const JS = '\n' +
    '(function(){\n' +
    '  var section = document.querySelector(".act-personality");\n' +
    '  if (!section) return;\n' +
    '  var questions = Array.from(section.querySelectorAll(".act-pq-question"));\n' +
    '  if (questions.length === 0) return;\n' +
    '  var posEl = section.querySelector("[data-pq-pos]");\n' +
    '  var resultEl = section.querySelector("[data-pq-result]");\n' +
    '  var resultPanel = section.querySelector(".act-pq-result");\n' +
    '  var restartBtn = section.querySelector("[data-pq-restart]");\n' +
    '  var current = 0;\n' +
    '  var counts = {};\n' +
    '  function show(idx){\n' +
    '    questions.forEach(function(q, i){ q.hidden = (i !== idx); });\n' +
    '    if (posEl) posEl.textContent = String(idx + 1);\n' +
    '  }\n' +
    '  function finish(){\n' +
    '    var best = null, bestCount = -1;\n' +
    '    Object.keys(counts).forEach(function(k){\n' +
    '      if (counts[k] > bestCount){ bestCount = counts[k]; best = k; }\n' +
    '    });\n' +
    '    if (resultEl) resultEl.textContent = best || "?";\n' +
    '    questions.forEach(function(q){ q.hidden = true; });\n' +
    '    if (resultPanel) resultPanel.hidden = false;\n' +
    '  }\n' +
    '  questions.forEach(function(q){\n' +
    '    q.querySelectorAll("[data-pq-answer]").forEach(function(b){\n' +
    '      b.addEventListener("click", function(){\n' +
    '        var t = (b.dataset.pqAnswer === "yes") ? q.dataset.yesType : q.dataset.noType;\n' +
    '        counts[t] = (counts[t] || 0) + 1;\n' +
    '        current++;\n' +
    '        if (current < questions.length){ show(current); }\n' +
    '        else { finish(); }\n' +
    '      });\n' +
    '    });\n' +
    '  });\n' +
    '  if (restartBtn) restartBtn.addEventListener("click", function(){\n' +
    '    current = 0; counts = {};\n' +
    '    if (resultPanel) resultPanel.hidden = true;\n' +
    '    show(0);\n' +
    '  });\n' +
    '})();\n';

  window.ActivityBlocks.act_personality_quiz = {
    buildSection: buildSection,
    css: CSS,
    inlineJs: JS,
  };
})();
