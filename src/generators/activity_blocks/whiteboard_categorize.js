/**
 * activity_blocks/whiteboard_categorize.js
 * -----------------------------------------------------------------------------
 * act_whiteboard_categorize: カテゴリ分類付箋ワーク。
 * lesson.vocabulary.byPattern の各グループを「カテゴリ枠」として表示し、
 * 単語付箋をドラッグ&ドロップで分類する。
 *
 * データ駆動:
 *   - lesson.vocabulary.byPattern のキーが自動的にカテゴリになる
 *     (categoryLabelFromGroupKey で人間ラベル化)
 *   - lesson データを差し替えると枠も付箋も自動的に変わる
 *   - モバイル: クリック選択 → bin クリックで移動するフォールバックも実装
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;
  const H = window.ActivityHelpers;
  if (!H) return;

  function buildSection(activity, config, lesson, registryEntries) {
    if (!lesson || !lesson.vocabulary || !lesson.vocabulary.byPattern) {
      return '<div class="placeholder">' + H.ruby('語彙データが見つかりません。') + '</div>';
    }
    const groups = lesson.vocabulary.byPattern;
    const groupKeys = Object.keys(groups);

    // 各カテゴリの正解集合
    const binsHtml = groupKeys.map(function (key) {
      const label = H.categoryLabelFromGroupKey(key);
      const correctWords = (groups[key].words || []).map(function (w) { return w.word; }).join(',');
      return (
        '<div class="act-cat-bin" data-cat-key="' + H.esc(key) + '" ' +
              'data-correct-words="' + H.esc(correctWords) + '">' +
          '<h3>' + H.ruby(label) + '</h3>' +
          '<div class="bin-drop" aria-label="ここに付箋を入れる"></div>' +
        '</div>'
      );
    }).join('');

    // 全付箋をシャッフルして並べる
    const all = H.flattenAllVocab(lesson);
    const stickies = H.shuffle(all, 'cat_' + lesson.lesson.no);
    const stickiesHtml = stickies.map(function (w) {
      return (
        '<button type="button" class="act-sticky" draggable="true" ' +
          'data-word="' + H.esc(w.word) + '">' +
          H.ruby(w.word) +
          '<span class="sticky-en en-text">' + H.esc(w.en) + '</span>' +
        '</button>'
      );
    }).join('');

    return (
      '<section class="activity-section act-categorize">' +
        '<div class="act-statusbar">' +
          '<span>' + H.ruby('付箋をカテゴリに ドラッグ してください') + '</span>' +
          '<span>(' + H.ruby('スマホはタップで選択') + ')</span>' +
        '</div>' +
        '<div class="act-cat-bins">' + binsHtml + '</div>' +
        '<h4 class="act-cat-source-label">' + H.ruby('付箋') + '</h4>' +
        '<div class="act-cat-stickies">' + stickiesHtml + '</div>' +
        '<div class="act-controls">' +
          '<button type="button" class="act-btn-primary" data-cat-check>' + H.ruby('こたえあわせ') + '</button>' +
          '<button type="button" class="act-btn-secondary" data-cat-reset>' + H.ruby('リセット') + '</button>' +
        '</div>' +
        '<div class="act-feedback" data-cat-feedback hidden></div>' +
      '</section>'
    );
  }

  const CSS = '\n' +
    '.act-cat-bins { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0; }\n' +
    '.act-cat-bin { flex: 1 1 200px; background: var(--color-background-subtle); border: 2px dashed var(--color-ui-primary); border-radius: var(--border-radius-medium); padding: 12px; min-height: 160px; }\n' +
    '.act-cat-bin.dragover { background: var(--color-ui-accent-muted); border-color: var(--color-ui-accent); }\n' +
    '.act-cat-bin h3 { margin: 0 0 8px; font-size: var(--font-size-h3); color: var(--color-ui-primary-dark); }\n' +
    '.act-cat-bin .bin-drop { min-height: 100px; display: flex; flex-wrap: wrap; gap: 6px; align-content: flex-start; }\n' +
    '.act-cat-source-label { margin: 16px 0 8px; font-size: var(--font-size-small); color: var(--color-text-subtle); }\n' +
    '.act-cat-stickies { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px; background: var(--color-background-surface); border-radius: var(--border-radius-medium); min-height: 60px; }\n' +
    '.act-sticky { background: #FFF4C2; border: 2px solid #E6C757; border-radius: var(--border-radius-small); padding: 8px 14px; font-family: inherit; font-size: var(--font-size-body); cursor: grab; transition: transform 0.15s, box-shadow 0.15s; }\n' +
    '.act-sticky:hover { transform: translateY(-2px); box-shadow: var(--shadow-default); }\n' +
    '.act-sticky.selected { background: var(--color-ui-accent-muted); border-color: var(--color-ui-accent); transform: translateY(-2px); box-shadow: var(--shadow-strong); }\n' +
    '.act-sticky.correct { background: #D8F0C8; border-color: var(--color-feedback-correct); }\n' +
    '.act-sticky.wrong { background: #FDD; border-color: var(--color-feedback-wrong); }\n' +
    '.act-sticky .sticky-en { display: block; font-size: var(--font-size-caption); color: var(--color-text-muted); }\n';

  const JS = '\n' +
    '(function(){\n' +
    '  var section = document.querySelector(".act-categorize");\n' +
    '  if (!section) return;\n' +
    '  var bins = Array.from(section.querySelectorAll(".act-cat-bin"));\n' +
    '  var pool = section.querySelector(".act-cat-stickies");\n' +
    '  var stickies = Array.from(section.querySelectorAll(".act-sticky"));\n' +
    '  var feedback = section.querySelector("[data-cat-feedback]");\n' +
    '  var checkBtn = section.querySelector("[data-cat-check]");\n' +
    '  var resetBtn = section.querySelector("[data-cat-reset]");\n' +
    '  var selected = null;\n' +
    '  function moveTo(sticky, target){\n' +
    '    sticky.classList.remove("correct","wrong","selected");\n' +
    '    if (target.classList.contains("act-cat-bin")){\n' +
    '      var drop = target.querySelector(".bin-drop");\n' +
    '      drop.appendChild(sticky);\n' +
    '    } else if (target.classList.contains("act-cat-stickies")) {\n' +
    '      target.appendChild(sticky);\n' +
    '    }\n' +
    '    selected = null;\n' +
    '  }\n' +
    '  stickies.forEach(function(s){\n' +
    '    s.addEventListener("dragstart", function(e){ if (e.dataTransfer) { e.dataTransfer.setData("text/plain", s.dataset.word); e.dataTransfer.effectAllowed = "move"; } s.style.opacity = "0.5"; });\n' +
    '    s.addEventListener("dragend", function(){ s.style.opacity = "1"; });\n' +
    '    s.addEventListener("click", function(){\n' +
    '      stickies.forEach(function(x){ x.classList.remove("selected"); });\n' +
    '      if (selected === s){ selected = null; return; }\n' +
    '      s.classList.add("selected"); selected = s;\n' +
    '    });\n' +
    '  });\n' +
    '  bins.concat([pool]).forEach(function(zone){\n' +
    '    zone.addEventListener("dragover", function(e){ e.preventDefault(); if (zone.classList.contains("act-cat-bin")) zone.classList.add("dragover"); });\n' +
    '    zone.addEventListener("dragleave", function(){ zone.classList.remove("dragover"); });\n' +
    '    zone.addEventListener("drop", function(e){\n' +
    '      e.preventDefault();\n' +
    '      zone.classList.remove("dragover");\n' +
    '      var word = e.dataTransfer && e.dataTransfer.getData("text/plain");\n' +
    '      if (!word) return;\n' +
    '      var sticky = stickies.find(function(s){ return s.dataset.word === word; });\n' +
    '      if (sticky) moveTo(sticky, zone);\n' +
    '    });\n' +
    '    zone.addEventListener("click", function(e){\n' +
    '      if (!selected) return;\n' +
    '      if (e.target.classList.contains("act-sticky")) return;\n' +
    '      moveTo(selected, zone);\n' +
    '    });\n' +
    '  });\n' +
    '  if (checkBtn) checkBtn.addEventListener("click", function(){\n' +
    '    var total = 0, correct = 0;\n' +
    '    bins.forEach(function(bin){\n' +
    '      var correctWords = (bin.dataset.correctWords || "").split(",").filter(Boolean);\n' +
    '      Array.from(bin.querySelectorAll(".act-sticky")).forEach(function(s){\n' +
    '        total++;\n' +
    '        if (correctWords.indexOf(s.dataset.word) >= 0){ s.classList.add("correct"); s.classList.remove("wrong"); correct++; }\n' +
    '        else { s.classList.add("wrong"); s.classList.remove("correct"); }\n' +
    '      });\n' +
    '    });\n' +
    '    if (feedback){\n' +
    '      feedback.hidden = false;\n' +
    '      if (total === 0){ feedback.classList.remove("correct","wrong"); feedback.textContent = "付箋をカテゴリに入れてから「こたえあわせ」を押してください。"; }\n' +
    '      else if (correct === total){ feedback.classList.remove("wrong"); feedback.classList.add("correct"); feedback.textContent = "全部正解です！(" + correct + "/" + total + ")"; }\n' +
    '      else { feedback.classList.add("wrong"); feedback.classList.remove("correct"); feedback.textContent = "正解: " + correct + " / " + total; }\n' +
    '    }\n' +
    '  });\n' +
    '  if (resetBtn) resetBtn.addEventListener("click", function(){\n' +
    '    stickies.forEach(function(s){ s.classList.remove("correct","wrong","selected"); pool.appendChild(s); });\n' +
    '    if (feedback){ feedback.hidden = true; feedback.textContent = ""; feedback.classList.remove("correct","wrong"); }\n' +
    '    selected = null;\n' +
    '  });\n' +
    '})();\n';

  window.ActivityBlocks.act_whiteboard_categorize = {
    buildSection: buildSection,
    css: CSS,
    inlineJs: JS,
  };
})();
