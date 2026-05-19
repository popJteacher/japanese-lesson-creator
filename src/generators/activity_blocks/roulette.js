/**
 * activity_blocks/roulette.js
 * -----------------------------------------------------------------------------
 * act_online_roulette 専用 UI ブロック。
 * 既存 activity_html.js から分離移植したもの。挙動は移植前と同じ:
 *   - lesson の vocabulary.byPattern から p1 グループの語彙を 7 件まで採用
 *   - 最後の 1 枠は「教師に質問」(special)
 *   - 18 ティックの抽選アニメーション + 最終結果固定
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;
  const H = window.ActivityHelpers;
  if (!H) return;

  // ── スロット生成 ────────────────────────────────────────────────────
  function buildRouletteSlots(config, lesson, registryEntries) {
    const total = (config && config.slotsCount) || 8;
    const theme = (config && config.slotsTheme) || '';
    const slots = [];

    const isLesson1People =
      (theme === '人物当て') ||
      (lesson.vocabulary && lesson.vocabulary.byPattern &&
        Object.values(lesson.vocabulary.byPattern).some(function (g) {
          return (g.patternIds || []).indexOf('p1') >= 0;
        }));

    if (isLesson1People && lesson.vocabulary && lesson.vocabulary.byPattern) {
      const group = Object.values(lesson.vocabulary.byPattern).find(function (g) {
        return (g.patternIds || []).indexOf('p1') >= 0;
      });
      const words = (group && group.words) || [];
      words.slice(0, total - 1).forEach(function (w) {
        slots.push({
          label: w.word || '',
          labelEn: w.en || '',
          reading: w.reading || '',
          imageId: 'vocab_' + (w.word || ''),
          special: false,
        });
      });
      slots.push({ label: '教師に質問', labelEn: 'Ask the teacher', reading: '', imageId: null, special: true });
    } else {
      for (let i = 0; i < total; i++) {
        slots.push({ label: 'スロット ' + (i + 1), labelEn: 'Slot ' + (i + 1), reading: '', imageId: null, special: false });
      }
    }

    return slots.slice(0, total).map(function (s) {
      const url = H.imgUrl(s.imageId, registryEntries, 256);
      const imgHtml = url
        ? '<img src="' + H.esc(url) + '" alt="" loading="eager" decoding="async" onerror="this.outerHTML=&quot;&lt;span class=img-fallback&gt;🖼️&lt;/span&gt;&quot;">'
        : '<span class="img-fallback">' + (s.special ? '❓' : '🎲') + '</span>';
      const cls = 'slot' + (s.special ? ' special' : '');
      return (
        '<div class="' + cls + '" data-label="' + H.esc(s.label) + '">' +
          imgHtml +
          '<div class="label">' + H.ruby(s.label) + '</div>' +
          (s.labelEn ? '<div class="label-en en-text">' + H.esc(s.labelEn) + '</div>' : '') +
        '</div>'
      );
    }).join('');
  }

  function buildSection(activity, config, lesson, registryEntries) {
    const expected = config && config.expectedUtterance;
    const theme = (config && config.slotsTheme) || '';
    const slotsCount = (config && config.slotsCount) || 8;
    const slotsHtml = buildRouletteSlots(config, lesson, registryEntries);

    return (
      '<div class="roulette">' +
        '<div class="roulette-info">' +
          (theme ? '<strong>テーマ:</strong> ' + H.ruby(theme) + '　/　' : '') +
          '<strong>スロット数:</strong> ' + H.esc(String(slotsCount)) +
        '</div>' +
        (expected ? '<div class="pattern-display">' + H.ruby(expected) + '</div>' : '') +
        '<div class="slots-grid">' + slotsHtml + '</div>' +
        '<div class="controls">' +
          '<button id="spin" type="button">' + H.ruby('回す') + ' / Spin</button>' +
          '<span class="result" id="result">' + H.ruby('「回す」を押してください') + ' / Press "Spin"</span>' +
        '</div>' +
      '</div>'
    );
  }

  // ── 活動固有 CSS (slot / roulette 系。命名は既存維持) ────────────────
  const ROULETTE_CSS = '\n' +
    '.roulette {\n' +
    '  background: var(--color-background-surface);\n' +
    '  border-radius: var(--border-radius-large);\n' +
    '  padding: 24px;\n' +
    '  margin: 0 0 32px;\n' +
    '  box-shadow: var(--shadow-default);\n' +
    '}\n' +
    '.roulette .roulette-info { font-size: var(--font-size-small); color: var(--color-text-subtle); margin-bottom: 16px; }\n' +
    '.roulette .roulette-info strong { color: var(--color-text-main); }\n' +
    '.roulette .pattern-display {\n' +
    '  background: var(--color-pos-noun-bg);\n' +
    '  border: 2px solid var(--color-pos-noun-border);\n' +
    '  border-radius: var(--border-radius-medium);\n' +
    '  padding: 12px 20px;\n' +
    '  margin: 0 0 16px;\n' +
    '  font-size: var(--font-size-h2);\n' +
    '  font-weight: var(--font-weight-bold);\n' +
    '  text-align: center;\n' +
    '}\n' +
    '.slots-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin: 0 0 20px; }\n' +
    '.slot {\n' +
    '  background: var(--color-background-subtle);\n' +
    '  border: 2px solid transparent;\n' +
    '  border-radius: var(--border-radius-medium);\n' +
    '  padding: 12px;\n' +
    '  text-align: center;\n' +
    '  transition: transform 0.2s, border-color 0.2s, background 0.2s;\n' +
    '}\n' +
    '.slot.selected { background: var(--color-ui-accent-muted); border-color: var(--color-ui-accent); transform: scale(1.06); box-shadow: var(--shadow-strong); }\n' +
    '.slot.special { background: var(--color-ui-primary); color: #fff; }\n' +
    '.slot.special.selected { background: var(--color-ui-accent); color: var(--color-text-main); border-color: var(--color-ui-primary-dark); }\n' +
    '.slot img { width: 100%; aspect-ratio: 1; object-fit: contain; background: var(--color-background-surface); border-radius: var(--border-radius-small); margin-bottom: 8px; }\n' +
    '.slot .img-fallback { display: flex; align-items: center; justify-content: center; width: 100%; aspect-ratio: 1; background: var(--color-background-surface); border-radius: var(--border-radius-small); font-size: 2rem; color: var(--color-text-muted); margin-bottom: 8px; }\n' +
    '.slot .label { font-weight: var(--font-weight-bold); }\n' +
    '.slot .reading { display: block; font-size: var(--font-size-caption); color: var(--color-text-muted); }\n' +
    '.slot .label-en { display: block; font-size: var(--font-size-caption); color: var(--color-text-muted); margin-top: 2px; }\n' +
    '.slot.special .label-en { color: #fff; }\n' +
    '.roulette .controls { display: flex; gap: 12px; align-items: center; }\n' +
    '.roulette button { font-family: inherit; font-size: var(--font-size-body); padding: 12px 28px; background: var(--color-ui-primary); color: #fff; border: none; border-radius: var(--border-radius-small); cursor: pointer; font-weight: var(--font-weight-medium); min-height: 48px; }\n' +
    '.roulette button:hover { background: var(--color-ui-primary-hover); }\n' +
    '.roulette button:disabled { opacity: 0.5; cursor: default; }\n' +
    '.roulette .result { font-size: var(--font-size-h3); font-weight: var(--font-weight-bold); color: var(--color-ui-primary-dark); }\n';

  // ── 活動固有 inline JS ──────────────────────────────────────────────
  const ROULETTE_JS = '\n' +
    '(function(){\n' +
    '  var spinBtn = document.getElementById("spin");\n' +
    '  if (!spinBtn) return;\n' +
    '  var slots = Array.from(document.querySelectorAll(".slot"));\n' +
    '  if (slots.length === 0) return;\n' +
    '  var resultEl = document.getElementById("result");\n' +
    '  function clearSelected(){ slots.forEach(function(s){ s.classList.remove("selected"); }); }\n' +
    '  spinBtn.addEventListener("click", function(){\n' +
    '    clearSelected();\n' +
    '    spinBtn.disabled = true;\n' +
    '    var ticks = 18;\n' +
    '    var i = 0;\n' +
    '    var lastIdx = -1;\n' +
    '    var iv = setInterval(function(){\n' +
    '      clearSelected();\n' +
    '      var idx;\n' +
    '      do { idx = Math.floor(Math.random() * slots.length); } while (idx === lastIdx);\n' +
    '      lastIdx = idx;\n' +
    '      slots[idx].classList.add("selected");\n' +
    '      i++;\n' +
    '      if (i >= ticks) {\n' +
    '        clearInterval(iv);\n' +
    '        var finalIdx = Math.floor(Math.random() * slots.length);\n' +
    '        clearSelected();\n' +
    '        slots[finalIdx].classList.add("selected");\n' +
    '        var labelEl = slots[finalIdx].querySelector(".label");\n' +
    '        var label = slots[finalIdx].dataset.label || (labelEl ? labelEl.textContent : "");\n' +
    '        if (resultEl) resultEl.textContent = "→ " + label;\n' +
    '        spinBtn.disabled = false;\n' +
    '      }\n' +
    '    }, 80);\n' +
    '  });\n' +
    '})();\n';

  window.ActivityBlocks.act_online_roulette = {
    buildSection: buildSection,
    css: ROULETTE_CSS,
    inlineJs: ROULETTE_JS,
  };
})();
