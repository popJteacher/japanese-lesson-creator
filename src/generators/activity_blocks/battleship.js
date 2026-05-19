/**
 * activity_blocks/battleship.js
 * -----------------------------------------------------------------------------
 * act_battleship: 文型を使った戦艦ゲーム。学習者用に「自分の船配置」グリッドと
 * 「相手の命中/外れ記録」グリッドを並べて表示する。マンツーマン画面共有時の現実
 * (相手側の船は教師の手元) に合わせ、自動判定はせず手動 toggle のみ提供する。
 *
 * データ駆動:
 *   - 行軸: registry.entries の named_character_card (5名)
 *   - 列軸: lesson.vocabulary.byPattern (p1,p2 の職業語彙)
 *   - lesson / registry を差し替えると軸データも自動的に変わる
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;
  const H = window.ActivityHelpers;
  if (!H) return;

  function buildGrid(side, rowAxis, colAxis, label) {
    const head = '<thead><tr><th></th>' +
      colAxis.map(function (c) { return '<th>' + H.ruby(c.word) + '</th>'; }).join('') +
      '</tr></thead>';
    const body = '<tbody>' +
      rowAxis.map(function (r) {
        const rowKey = r.key || r.name;
        return '<tr>' +
          '<th>' + (r.imageUrl ? '<img src="' + H.esc(r.imageUrl) + '" alt="" loading="lazy">' : '') +
                   '<span>' + H.ruby(r.name) + '</span></th>' +
          colAxis.map(function (c) {
            return '<td data-side="' + side + '" data-row="' + H.esc(rowKey) + '" data-col="' + H.esc(c.word) + '"></td>';
          }).join('') +
        '</tr>';
      }).join('') +
    '</tbody>';
    return (
      '<div class="act-bs-grid-wrap">' +
        '<h3>' + H.ruby(label) + '</h3>' +
        '<table class="act-bs-grid" data-side="' + side + '">' + head + body + '</table>' +
      '</div>'
    );
  }

  function buildSection(activity, config, lesson, registryEntries) {
    const characters = H.getCharacterCards(registryEntries);
    let cols = H.getVocabByPattern(lesson, ['p1', 'p2']);
    // 職業のみ抽出 (imageRole === 'vocab_person')。なければそのまま。
    const personOnly = cols.filter(function (w) { return w.imageRole === 'vocab_person'; });
    if (personOnly.length >= 3) cols = personOnly;
    cols = cols.slice(0, 6);

    if (characters.length < 2 || cols.length < 2) {
      return '<div class="placeholder">' + H.ruby('バトルシップ用のデータが不足しています(キャラ' +
        characters.length + '名 / 列' + cols.length + '件)。') + '</div>';
    }

    const selfGrid = buildGrid('self', characters, cols, 'あなたの ばん (船を 配置 する)');
    const oppGrid = buildGrid('opp', characters, cols, 'あいて の ばん (質問の 結果 を 記録 する)');

    const shipCount = Math.max(2, Math.min((config && config.shipCount) || 3, characters.length * cols.length / 2));

    return (
      '<section class="activity-section act-battleship" data-ships="' + shipCount + '">' +
        '<div class="act-statusbar">' +
          '<span>' + H.ruby('船の数') + ': <strong>' + shipCount + '</strong></span>' +
          '<span>' + H.ruby('配置した船') + ': <strong data-bs-placed>0</strong></span>' +
        '</div>' +
        '<div class="act-bs-grids">' +
          selfGrid + oppGrid +
        '</div>' +
        '<div class="act-controls">' +
          '<button type="button" class="act-btn-primary" data-bs-random>' + H.ruby('船を ランダムに 配置') + '</button>' +
          '<button type="button" class="act-btn-secondary" data-bs-reset>' + H.ruby('すべてリセット') + '</button>' +
        '</div>' +
        '<p class="act-bs-hint">' +
          H.ruby('使い方') + ': <br>' +
          '・' + H.ruby('左') + ': ' + H.ruby('自分の船(マスをクリックして配置)') + '<br>' +
          '・' + H.ruby('右') + ': ' + H.ruby('「〜さんは〜ですか」と聞いて、結果をクリックで記録 (◯=命中 / ×=外れ / 空白=未質問)') +
        '</p>' +
      '</section>'
    );
  }

  const CSS = '\n' +
    '.act-bs-grids { display: flex; gap: 20px; flex-wrap: wrap; }\n' +
    '.act-bs-grid-wrap { flex: 1 1 320px; min-width: 280px; }\n' +
    '.act-bs-grid-wrap h3 { font-size: var(--font-size-h3); margin: 0 0 8px; color: var(--color-ui-primary-dark); }\n' +
    '.act-bs-grid { border-collapse: collapse; width: 100%; }\n' +
    '.act-bs-grid th, .act-bs-grid td { border: 1px solid var(--color-text-muted); padding: 6px; text-align: center; font-size: var(--font-size-small); }\n' +
    '.act-bs-grid thead th { background: var(--color-background-subtle); }\n' +
    '.act-bs-grid tbody th { background: var(--color-background-subtle); text-align: left; max-width: 100px; }\n' +
    '.act-bs-grid tbody th img { width: 36px; height: 36px; object-fit: cover; border-radius: 50%; vertical-align: middle; margin-right: 4px; }\n' +
    '.act-bs-grid td { cursor: pointer; min-width: 36px; height: 36px; transition: background 0.15s; }\n' +
    '.act-bs-grid td:hover { background: var(--color-ui-accent-muted); }\n' +
    '.act-bs-grid td.ship { background: var(--color-ui-primary); color: #fff; font-weight: var(--font-weight-bold); }\n' +
    '.act-bs-grid td.ship::after { content: "🚢"; }\n' +
    '.act-bs-grid td.hit { background: var(--color-feedback-correct); color: #fff; }\n' +
    '.act-bs-grid td.hit::after { content: "◯"; }\n' +
    '.act-bs-grid td.miss { background: var(--color-feedback-wrong); color: #fff; }\n' +
    '.act-bs-grid td.miss::after { content: "×"; }\n' +
    '.act-bs-hint { font-size: var(--font-size-small); color: var(--color-text-subtle); margin-top: 12px; }\n';

  const JS = '\n' +
    '(function(){\n' +
    '  var section = document.querySelector(".act-battleship");\n' +
    '  if (!section) return;\n' +
    '  var maxShips = parseInt(section.dataset.ships, 10) || 3;\n' +
    '  var placedEl = section.querySelector("[data-bs-placed]");\n' +
    '  var selfCells = Array.from(section.querySelectorAll(\'.act-bs-grid[data-side="self"] td\'));\n' +
    '  var oppCells = Array.from(section.querySelectorAll(\'.act-bs-grid[data-side="opp"] td\'));\n' +
    '  function countShips(){ return selfCells.filter(function(c){ return c.classList.contains("ship"); }).length; }\n' +
    '  function updateCount(){ if (placedEl) placedEl.textContent = String(countShips()); }\n' +
    '  selfCells.forEach(function(c){ c.addEventListener("click", function(){\n' +
    '    if (c.classList.contains("ship")){ c.classList.remove("ship"); updateCount(); return; }\n' +
    '    if (countShips() >= maxShips) return;\n' +
    '    c.classList.add("ship"); updateCount();\n' +
    '  }); });\n' +
    '  oppCells.forEach(function(c){ c.addEventListener("click", function(){\n' +
    '    if (c.classList.contains("hit")){ c.classList.remove("hit"); c.classList.add("miss"); return; }\n' +
    '    if (c.classList.contains("miss")){ c.classList.remove("miss"); return; }\n' +
    '    c.classList.add("hit");\n' +
    '  }); });\n' +
    '  var randBtn = section.querySelector("[data-bs-random]");\n' +
    '  if (randBtn) randBtn.addEventListener("click", function(){\n' +
    '    selfCells.forEach(function(c){ c.classList.remove("ship"); });\n' +
    '    var shuffled = selfCells.slice().sort(function(){ return Math.random() - 0.5; });\n' +
    '    shuffled.slice(0, maxShips).forEach(function(c){ c.classList.add("ship"); });\n' +
    '    updateCount();\n' +
    '  });\n' +
    '  var resetBtn = section.querySelector("[data-bs-reset]");\n' +
    '  if (resetBtn) resetBtn.addEventListener("click", function(){\n' +
    '    selfCells.forEach(function(c){ c.classList.remove("ship","hit","miss"); });\n' +
    '    oppCells.forEach(function(c){ c.classList.remove("ship","hit","miss"); });\n' +
    '    updateCount();\n' +
    '  });\n' +
    '})();\n';

  window.ActivityBlocks.act_battleship = {
    buildSection: buildSection,
    css: CSS,
    inlineJs: JS,
  };
})();
