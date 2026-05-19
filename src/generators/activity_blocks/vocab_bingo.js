/**
 * activity_blocks/vocab_bingo.js
 * -----------------------------------------------------------------------------
 * act_vocab_bingo: 語彙ビンゴ。N×N グリッドの語彙マスをクリックでマーク、
 * 行/列/対角線が揃ったら「ビンゴ！」と表示する。
 *
 * データ駆動:
 *   - lesson.vocabulary.byPattern の全語彙からシャッフルして gridSize^2 語を採用
 *   - lesson データを差し替えると出題語彙も自動的に変わる
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;
  const H = window.ActivityHelpers;
  if (!H) return;

  function buildSection(activity, config, lesson, registryEntries) {
    const gridSize = Math.max(3, Math.min((config && config.gridSize) || 3, 5));
    const showImages = !(config && config.showImages === false);
    const allVocab = H.flattenAllVocab(lesson);
    const needed = gridSize * gridSize;
    let cells = H.shuffle(allVocab, 'bingo_' + lesson.lesson.no).slice(0, needed);
    // 語彙不足時は循環。
    while (cells.length < needed) cells = cells.concat(cells);
    cells = cells.slice(0, needed);

    const rows = [];
    for (let r = 0; r < gridSize; r++) {
      const cols = [];
      for (let c = 0; c < gridSize; c++) {
        const w = cells[r * gridSize + c];
        const url = showImages ? H.imgUrl('vocab_' + w.word, registryEntries, 200) : null;
        const visual = url
          ? '<img src="' + H.esc(url) + '" alt="" loading="lazy" decoding="async" onerror="this.outerHTML=&quot;&lt;span class=img-fallback&gt;🖼️&lt;/span&gt;&quot;">'
          : '<span class="img-fallback">🟦</span>';
        cols.push(
          '<button type="button" class="act-tile act-bingo-cell" ' +
            'data-row="' + r + '" data-col="' + c + '" ' +
            'data-word="' + H.esc(w.word) + '">' +
            visual +
            '<div class="label">' + H.ruby(w.word) + '</div>' +
            '<div class="label-en en-text">' + H.esc(w.en) + '</div>' +
          '</button>'
        );
      }
      rows.push(cols.join(''));
    }

    return (
      '<section class="activity-section act-bingo">' +
        '<div class="act-statusbar">' +
          '<span data-bingo-status>' + H.ruby('クリックでマークしてください') + '</span>' +
          '<span>' + H.ruby('マーク') + ': <strong data-bingo-count>0</strong></span>' +
        '</div>' +
        '<div class="act-bingo-grid" style="--cols: ' + gridSize + ';">' + rows.join('') + '</div>' +
        '<div class="act-feedback" data-bingo-feedback hidden></div>' +
        '<div class="act-controls">' +
          '<button type="button" class="act-btn-secondary" data-bingo-reset>' + H.ruby('リセット') + '</button>' +
        '</div>' +
      '</section>'
    );
  }

  const CSS = '\n' +
    '.act-bingo-grid { display: grid; grid-template-columns: repeat(var(--cols, 3), 1fr); gap: 10px; }\n' +
    '.act-bingo-cell { transition: background 0.2s, border-color 0.2s; }\n' +
    '.act-bingo-cell.marked { background: var(--color-ui-accent-muted); border-color: var(--color-ui-accent); }\n' +
    '.act-bingo-cell.bingo-line { animation: act-bingo-pulse 0.9s ease-in-out 0s 3; background: var(--color-feedback-correct); color: #fff; }\n' +
    '@keyframes act-bingo-pulse { 0%,100%{ transform: scale(1); } 50%{ transform: scale(1.05); } }\n';

  const JS = '\n' +
    '(function(){\n' +
    '  var grid = document.querySelector(".act-bingo-grid");\n' +
    '  if (!grid) return;\n' +
    '  var cells = Array.from(grid.querySelectorAll(".act-bingo-cell"));\n' +
    '  if (cells.length === 0) return;\n' +
    '  var size = Math.round(Math.sqrt(cells.length));\n' +
    '  var status = document.querySelector("[data-bingo-status]");\n' +
    '  var count = document.querySelector("[data-bingo-count]");\n' +
    '  var feedback = document.querySelector("[data-bingo-feedback]");\n' +
    '  var reset = document.querySelector("[data-bingo-reset]");\n' +
    '  function cell(r, c){ return cells.find(function(x){ return +x.dataset.row === r && +x.dataset.col === c; }); }\n' +
    '  function isMarked(c){ return c && c.classList.contains("marked"); }\n' +
    '  function checkBingo(){\n' +
    '    var lines = [];\n' +
    '    for (var i = 0; i < size; i++){\n' +
    '      var row = [], col = [];\n' +
    '      for (var j = 0; j < size; j++){ row.push(cell(i, j)); col.push(cell(j, i)); }\n' +
    '      lines.push(row); lines.push(col);\n' +
    '    }\n' +
    '    var d1 = [], d2 = [];\n' +
    '    for (var k = 0; k < size; k++){ d1.push(cell(k, k)); d2.push(cell(k, size - 1 - k)); }\n' +
    '    lines.push(d1); lines.push(d2);\n' +
    '    var found = false;\n' +
    '    lines.forEach(function(line){\n' +
    '      if (line.length > 0 && line.every(isMarked)){\n' +
    '        line.forEach(function(c){ if (c) c.classList.add("bingo-line"); });\n' +
    '        found = true;\n' +
    '      }\n' +
    '    });\n' +
    '    if (found && feedback){ feedback.hidden = false; feedback.classList.remove("wrong"); feedback.classList.add("correct"); feedback.textContent = "ビンゴ！"; if (status) status.textContent = "ビンゴ！"; }\n' +
    '  }\n' +
    '  function update(){\n' +
    '    var n = cells.filter(isMarked).length;\n' +
    '    if (count) count.textContent = String(n);\n' +
    '    checkBingo();\n' +
    '  }\n' +
    '  cells.forEach(function(c){ c.addEventListener("click", function(){ c.classList.toggle("marked"); c.classList.remove("bingo-line"); update(); }); });\n' +
    '  if (reset) reset.addEventListener("click", function(){\n' +
    '    cells.forEach(function(c){ c.classList.remove("marked","bingo-line"); });\n' +
    '    if (feedback){ feedback.hidden = true; feedback.textContent = ""; feedback.classList.remove("correct","wrong"); }\n' +
    '    if (status) status.textContent = "クリックでマークしてください";\n' +
    '    update();\n' +
    '  });\n' +
    '})();\n';

  window.ActivityBlocks.act_vocab_bingo = {
    buildSection: buildSection,
    css: CSS,
    inlineJs: JS,
  };
})();
