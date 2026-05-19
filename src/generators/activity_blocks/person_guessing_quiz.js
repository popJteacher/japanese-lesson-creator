/**
 * activity_blocks/person_guessing_quiz.js
 * -----------------------------------------------------------------------------
 * act_person_guessing_quiz: 人物当てクイズ。人物画像を最初はマスクし、
 * 「つぎの ヒント」で属性を段階開示する。
 *
 * データ駆動:
 *   - registry.entries の named_character_card 全件
 *   - 各キャラの role / nationality / gender を順に開示
 *   - registry を差し替えると人物データも自動的に変わる
 *
 * 教師向け情報 (teacherTip / variations / plusAlpha / caution) は学習者画面に
 * 含めない (既存方針)。
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;
  const H = window.ActivityHelpers;
  if (!H) return;

  function genderJa(g) {
    if (g === 'male') return '男のひと';
    if (g === 'female') return '女のひと';
    return '';
  }

  function buildSection(activity, config, lesson, registryEntries) {
    const cards = H.getCharacterCards(registryEntries);
    if (cards.length === 0) {
      return '<div class="placeholder">' + H.ruby('人物カードのデータが見つかりません。') + '</div>';
    }
    const shuffled = H.shuffle(cards, 'person_' + lesson.lesson.no);

    // 各カードを 1 つのステージとして HTML 化 (最初の 1 件のみ表示、他は hidden)
    const stagesHtml = shuffled.map(function (c, idx) {
      const hints = [];
      if (c.nationality) hints.push({ key: 'nationality', label: c.nationality + 'です。' });
      if (c.gender) hints.push({ key: 'gender', label: genderJa(c.gender) + 'です。' });
      if (c.role) hints.push({ key: 'role', label: c.role + 'です。' });
      const hintsHtml = hints.map(function (h, i) {
        return '<div class="hint" data-hint-step="' + (i + 1) + '" hidden>' +
          '<span class="hint-label">ヒント' + (i + 1) + ':</span> ' + H.ruby(h.label) +
        '</div>';
      }).join('');

      const imgHtml = c.imageUrl
        ? '<img src="' + H.esc(c.imageUrl) + '" alt="" loading="lazy" decoding="async" onerror="this.outerHTML=&quot;&lt;span class=img-fallback&gt;👤&lt;/span&gt;&quot;">'
        : '<span class="img-fallback">👤</span>';

      return (
        '<div class="act-person-stage masked-full" data-stage="' + idx + '" data-total-hints="' + hints.length + '" ' +
              (idx === 0 ? '' : 'hidden') + '>' +
          '<div class="act-person-card">' +
            imgHtml +
            '<div class="mask"></div>' +
            '<div class="reveal-name" hidden>' + H.ruby(c.name) + '</div>' +
          '</div>' +
          '<div class="act-person-hints">' + hintsHtml + '</div>' +
        '</div>'
      );
    }).join('');

    return (
      '<section class="activity-section act-person-quiz">' +
        '<div class="act-statusbar">' +
          '<span>' + H.ruby('人物') + ': <strong data-pq-pos>1</strong> / ' + shuffled.length + '</span>' +
          '<span>' + H.ruby('ヒント開示') + ': <strong data-pq-shown>0</strong></span>' +
        '</div>' +
        '<div class="act-person-stages">' + stagesHtml + '</div>' +
        '<div class="act-controls">' +
          '<button type="button" class="act-btn-primary" data-pq-hint>' + H.ruby('つぎの ヒント') + '</button>' +
          '<button type="button" class="act-btn-secondary" data-pq-reveal>' + H.ruby('こたえを みる') + '</button>' +
          '<button type="button" class="act-btn-secondary" data-pq-next>' + H.ruby('つぎの 人') + '</button>' +
        '</div>' +
      '</section>'
    );
  }

  const CSS = '\n' +
    '.act-person-stage { max-width: 480px; margin: 0 auto; }\n' +
    '.act-person-card { position: relative; width: 100%; aspect-ratio: 1; border-radius: var(--border-radius-large); overflow: hidden; background: var(--color-background-subtle); }\n' +
    '.act-person-card img { width: 100%; height: 100%; object-fit: cover; display: block; }\n' +
    '.act-person-card .img-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 6rem; color: var(--color-text-muted); }\n' +
    '.act-person-card .mask { position: absolute; inset: 0; backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); background: rgba(112,144,176,0.4); transition: backdrop-filter 0.4s, background 0.4s; }\n' +
    '.act-person-stage.masked-50 .mask { backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: rgba(112,144,176,0.25); }\n' +
    '.act-person-stage.masked-25 .mask { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); background: rgba(112,144,176,0.12); }\n' +
    '.act-person-stage.revealed .mask { display: none; }\n' +
    '.act-person-card .reveal-name { position: absolute; bottom: 12px; left: 0; right: 0; text-align: center; font-size: var(--font-size-h2); font-weight: var(--font-weight-bold); color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.7); }\n' +
    '.act-person-hints { margin: 16px 0; }\n' +
    '.act-person-hints .hint { background: var(--color-ui-accent-muted); padding: 8px 14px; border-radius: var(--border-radius-small); margin-bottom: 6px; }\n' +
    '.act-person-hints .hint-label { font-weight: var(--font-weight-bold); color: var(--color-ui-primary-dark); margin-right: 6px; }\n';

  const JS = '\n' +
    '(function(){\n' +
    '  var section = document.querySelector(".act-person-quiz");\n' +
    '  if (!section) return;\n' +
    '  var stages = Array.from(section.querySelectorAll(".act-person-stage"));\n' +
    '  var posEl = section.querySelector("[data-pq-pos]");\n' +
    '  var shownEl = section.querySelector("[data-pq-shown]");\n' +
    '  var hintBtn = section.querySelector("[data-pq-hint]");\n' +
    '  var revealBtn = section.querySelector("[data-pq-reveal]");\n' +
    '  var nextBtn = section.querySelector("[data-pq-next]");\n' +
    '  var current = 0;\n' +
    '  function maskClass(stage, n){\n' +
    '    stage.classList.remove("masked-full","masked-50","masked-25","revealed");\n' +
    '    var total = parseInt(stage.dataset.totalHints, 10) || 0;\n' +
    '    if (n >= total) stage.classList.add("masked-25");\n' +
    '    else if (n >= Math.ceil(total/2)) stage.classList.add("masked-50");\n' +
    '    else stage.classList.add("masked-full");\n' +
    '  }\n' +
    '  function currentStage(){ return stages[current]; }\n' +
    '  function showStage(idx){\n' +
    '    stages.forEach(function(s, i){ s.hidden = (i !== idx); });\n' +
    '    var s = stages[idx];\n' +
    '    s.classList.remove("revealed");\n' +
    '    s.querySelectorAll(".hint").forEach(function(h){ h.hidden = true; });\n' +
    '    var name = s.querySelector(".reveal-name");\n' +
    '    if (name) name.hidden = true;\n' +
    '    maskClass(s, 0);\n' +
    '    if (posEl) posEl.textContent = String(idx + 1);\n' +
    '    if (shownEl) shownEl.textContent = "0";\n' +
    '  }\n' +
    '  if (hintBtn) hintBtn.addEventListener("click", function(){\n' +
    '    var s = currentStage();\n' +
    '    var hints = Array.from(s.querySelectorAll(".hint"));\n' +
    '    var next = hints.find(function(h){ return h.hidden; });\n' +
    '    if (next){\n' +
    '      next.hidden = false;\n' +
    '      var n = hints.filter(function(h){ return !h.hidden; }).length;\n' +
    '      maskClass(s, n);\n' +
    '      if (shownEl) shownEl.textContent = String(n);\n' +
    '    }\n' +
    '  });\n' +
    '  if (revealBtn) revealBtn.addEventListener("click", function(){\n' +
    '    var s = currentStage();\n' +
    '    s.classList.remove("masked-full","masked-50","masked-25");\n' +
    '    s.classList.add("revealed");\n' +
    '    var name = s.querySelector(".reveal-name");\n' +
    '    if (name) name.hidden = false;\n' +
    '  });\n' +
    '  if (nextBtn) nextBtn.addEventListener("click", function(){\n' +
    '    current = (current + 1) % stages.length;\n' +
    '    showStage(current);\n' +
    '  });\n' +
    '})();\n';

  window.ActivityBlocks.act_person_guessing_quiz = {
    buildSection: buildSection,
    css: CSS,
    inlineJs: JS,
  };
})();
