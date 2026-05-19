/**
 * activity_blocks/grammar_auction.js
 * -----------------------------------------------------------------------------
 * act_grammar_auction: 文法オークション。正文 / 誤文の混合リストに学習者が
 * 予算を bid し、最後に正誤を開示する。
 *
 * データ駆動:
 *   - 正文: lesson.patterns[].examples[].sentence
 *   - 誤文: corruptSentence() で正文を変形して動的生成
 *           (助詞欠落 / 「が」置換 / 「の」脱落 / 「です」欠落 / 「じゃない」混入)
 *   - lesson データを差し替えると出題内容も自動的に変わる
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;
  const H = window.ActivityHelpers;
  if (!H) return;

  function buildSection(activity, config, lesson, registryEntries) {
    const budget = (config && config.budget) || 1000;
    const target = (config && config.sentenceCount) || 8;
    const patternIds = (config && config.patternIds) || null;

    const corrects = H.getExampleSentences(lesson, patternIds || []);
    const items = [];
    corrects.forEach(function (c) {
      items.push({ sentence: c.sentence, isCorrect: true, reason: '' });
      H.corruptSentence(c.sentence, c.patternId).forEach(function (e) {
        items.push({ sentence: e.sentence, isCorrect: false, reason: e.reason });
      });
    });
    const selected = H.shuffle(items, 'auction_' + lesson.lesson.no).slice(0, Math.min(target, items.length));

    const rowsHtml = selected.map(function (it, idx) {
      return (
        '<li class="act-auction-row" data-idx="' + idx + '" ' +
            'data-correct="' + (it.isCorrect ? '1' : '0') + '" ' +
            'data-reason="' + H.esc(it.reason || '') + '">' +
          '<div class="sentence">' + H.ruby(it.sentence) + '</div>' +
          '<div class="bid-row">' +
            '<label>' + H.ruby('賭ける') + ': ' +
              '<input type="number" class="act-auction-bid" min="0" step="50" value="0" data-bid>' +
              ' ' + H.ruby('コイン') +
            '</label>' +
          '</div>' +
          '<div class="result-row" hidden>' +
            '<span class="result-label"></span>' +
            '<span class="result-reason"></span>' +
          '</div>' +
        '</li>'
      );
    }).join('');

    return (
      '<section class="activity-section act-auction" data-budget="' + budget + '">' +
        '<div class="act-statusbar">' +
          '<span>' + H.ruby('予算') + ': <strong data-auction-budget>' + budget + '</strong></span>' +
          '<span>' + H.ruby('使用') + ': <strong data-auction-spent>0</strong></span>' +
          '<span>' + H.ruby('残り') + ': <strong data-auction-left>' + budget + '</strong></span>' +
        '</div>' +
        '<ol class="act-auction-list">' + rowsHtml + '</ol>' +
        '<div class="act-controls">' +
          '<button type="button" class="act-btn-primary" data-auction-reveal>' + H.ruby('けっか発表') + '</button>' +
          '<button type="button" class="act-btn-secondary" data-auction-reset>' + H.ruby('リセット') + '</button>' +
        '</div>' +
        '<div class="act-feedback" data-auction-summary hidden></div>' +
      '</section>'
    );
  }

  const CSS = '\n' +
    '.act-auction-list { list-style: none; padding: 0; margin: 12px 0; }\n' +
    '.act-auction-row { background: var(--color-background-subtle); border-radius: var(--border-radius-medium); padding: 12px 16px; margin-bottom: 10px; }\n' +
    '.act-auction-row .sentence { font-size: var(--font-size-h3); margin-bottom: 8px; }\n' +
    '.act-auction-row .bid-row label { font-size: var(--font-size-small); color: var(--color-text-subtle); }\n' +
    '.act-auction-bid { font-family: inherit; font-size: var(--font-size-body); padding: 6px 10px; width: 100px; border: 2px solid #cdd2dc; border-radius: var(--border-radius-small); }\n' +
    '.act-auction-bid.over-budget { border-color: var(--color-feedback-wrong); background: #FDE8E8; }\n' +
    '.act-auction-row .result-row { margin-top: 10px; padding: 8px 12px; border-radius: var(--border-radius-small); font-weight: var(--font-weight-medium); }\n' +
    '.act-auction-row.revealed-correct .result-row { background: #E7F5EC; color: #1D6F3A; display: block; }\n' +
    '.act-auction-row.revealed-wrong .result-row { background: #FDE8E8; color: #9B1C1C; display: block; }\n' +
    '.act-auction-row .result-reason { display: block; font-size: var(--font-size-caption); margin-top: 4px; opacity: 0.85; }\n';

  const JS = '\n' +
    '(function(){\n' +
    '  var section = document.querySelector(".act-auction");\n' +
    '  if (!section) return;\n' +
    '  var budget = parseInt(section.dataset.budget || "1000", 10);\n' +
    '  var bids = Array.from(section.querySelectorAll(".act-auction-bid"));\n' +
    '  var rows = Array.from(section.querySelectorAll(".act-auction-row"));\n' +
    '  var budgetEl = section.querySelector("[data-auction-budget]");\n' +
    '  var spentEl = section.querySelector("[data-auction-spent]");\n' +
    '  var leftEl = section.querySelector("[data-auction-left]");\n' +
    '  var revealBtn = section.querySelector("[data-auction-reveal]");\n' +
    '  var resetBtn = section.querySelector("[data-auction-reset]");\n' +
    '  var summary = section.querySelector("[data-auction-summary]");\n' +
    '  function recalc(){\n' +
    '    var spent = 0;\n' +
    '    bids.forEach(function(b){ spent += parseInt(b.value, 10) || 0; });\n' +
    '    if (spentEl) spentEl.textContent = String(spent);\n' +
    '    if (leftEl) leftEl.textContent = String(budget - spent);\n' +
    '    bids.forEach(function(b){\n' +
    '      var v = parseInt(b.value, 10) || 0;\n' +
    '      var others = spent - v;\n' +
    '      b.classList.toggle("over-budget", others + v > budget);\n' +
    '    });\n' +
    '  }\n' +
    '  bids.forEach(function(b){ b.addEventListener("input", recalc); });\n' +
    '  if (revealBtn) revealBtn.addEventListener("click", function(){\n' +
    '    var totalScore = 0, won = 0, lost = 0;\n' +
    '    rows.forEach(function(row){\n' +
    '      var bid = parseInt(row.querySelector("[data-bid]").value, 10) || 0;\n' +
    '      var isCorrect = row.dataset.correct === "1";\n' +
    '      var reason = row.dataset.reason || "";\n' +
    '      var resultRow = row.querySelector(".result-row");\n' +
    '      var label = row.querySelector(".result-label");\n' +
    '      var rEl = row.querySelector(".result-reason");\n' +
    '      resultRow.hidden = false;\n' +
    '      if (isCorrect){\n' +
    '        row.classList.add("revealed-correct");\n' +
    '        label.textContent = "○ 正しい文 — +" + bid + " コイン";\n' +
    '        rEl.textContent = "";\n' +
    '        totalScore += bid; won += (bid > 0 ? 1 : 0);\n' +
    '      } else {\n' +
    '        row.classList.add("revealed-wrong");\n' +
    '        label.textContent = "× まちがい — -" + bid + " コイン";\n' +
    '        rEl.textContent = reason;\n' +
    '        totalScore -= bid; lost += (bid > 0 ? 1 : 0);\n' +
    '      }\n' +
    '    });\n' +
    '    if (summary){\n' +
    '      summary.hidden = false;\n' +
    '      summary.classList.toggle("correct", totalScore >= 0);\n' +
    '      summary.classList.toggle("wrong", totalScore < 0);\n' +
    '      summary.textContent = "結果: " + totalScore + " コイン (○" + won + " / ×" + lost + ")";\n' +
    '    }\n' +
    '    if (revealBtn) revealBtn.disabled = true;\n' +
    '  });\n' +
    '  if (resetBtn) resetBtn.addEventListener("click", function(){\n' +
    '    bids.forEach(function(b){ b.value = "0"; b.classList.remove("over-budget"); });\n' +
    '    rows.forEach(function(row){\n' +
    '      row.classList.remove("revealed-correct","revealed-wrong");\n' +
    '      var resultRow = row.querySelector(".result-row");\n' +
    '      if (resultRow) resultRow.hidden = true;\n' +
    '    });\n' +
    '    if (summary){ summary.hidden = true; summary.textContent = ""; summary.classList.remove("correct","wrong"); }\n' +
    '    if (revealBtn) revealBtn.disabled = false;\n' +
    '    recalc();\n' +
    '  });\n' +
    '  recalc();\n' +
    '})();\n';

  window.ActivityBlocks.act_grammar_auction = {
    buildSection: buildSection,
    css: CSS,
    inlineJs: JS,
  };
})();
