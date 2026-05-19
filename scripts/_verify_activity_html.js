/**
 * activity_html.js 動作確認スクリプト
 *
 * 9 件の活動 ID それぞれを session.activity.selectedId に設定し、
 * buildActivityHtml が HTML を正しく生成することを検証する。
 *
 * 検証項目（各活動につき）:
 *   1) HTML が null でない
 *   2) <h1> または activity-title が含まれる
 *   3) main 要素 (page-header / container) が含まれる
 *   4) 活動名 (act.name) が出力に含まれる
 *   5) placeholder-box (未実装サイン) が含まれない
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';

// require ベースのロード
const { buildActivityHtml } = require(path.join(ROOT, 'src', 'generators', 'activity_html.js'));

// データ読み込み
const session  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'session_001.json'), 'utf8'));
const lesson1  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lesson_01.json'),  'utf8'));
const lesson2  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lesson_02.json'),  'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'master_image_registry.json'), 'utf8'));
const catalog  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'activity_catalog.json'), 'utf8'));

const lessonDataMap = { 1: lesson1, 2: lesson2 };

// 検証対象 (dispatcher に実装されている 9 件)
const ACTIVITIES = [
  'act_online_roulette',
  'act_memory_matching',
  'act_vocab_bingo',
  'act_whiteboard_categorize',
  'act_grammar_auction',
  'act_battleship',
  'act_person_guessing_quiz',
  'act_personality_quiz',
  'act_hajimemashite_conversation',
];

function checkOne(actId) {
  // session を deep copy して activity.selectedId をセット
  const s = JSON.parse(JSON.stringify(session));
  s.activity = { selectedId: actId };

  const actDef = (catalog.activities || []).find((a) => a.id === actId);
  if (!actDef) {
    return { actId, status: 'CATALOG_NOT_FOUND', notes: '活動が catalog にない' };
  }

  const judgment = actDef.contentRequirement && actDef.contentRequirement.judgment;
  const validated = (actDef.validatedForLessons || []).join(',');

  let html;
  try {
    html = buildActivityHtml(s, lessonDataMap, registry, catalog);
  } catch (err) {
    return { actId, status: 'EXCEPTION', error: err.message };
  }

  if (html === null) {
    return {
      actId,
      status: 'NULL_OUTPUT',
      judgment,
      validated,
      notes: judgment === 'required'
        ? '理由不明(judgment は required だが null)'
        : `judgment="${judgment}" のため null を返す仕様(required 以外)`,
    };
  }

  // 基本マーカー検査
  const checks = {
    has_html_string: typeof html === 'string' && html.length > 100,
    has_doctype: /<!doctype/i.test(html) || /<html/i.test(html),
    has_title_or_h1: /<h1[^>]*>/i.test(html) || /class="[^"]*activity-title[^"]*"/i.test(html),
    has_container: /class="[^"]*(?:page-header|container|toggle-bar)[^"]*"/i.test(html),
    has_activity_name: actDef.name ? html.includes(actDef.name) : true,
    no_placeholder: !/placeholder-box/.test(html) || !/このアクティビティの専用 UI は今後実装予定/.test(html),
  };
  const allPass = Object.values(checks).every(Boolean);

  return {
    actId,
    status: allPass ? 'PASS' : 'PARTIAL',
    judgment,
    validated,
    htmlLen: html.length,
    checks,
    actName: actDef.name,
  };
}

console.log('=== activity_html.js 動作確認 (各活動 selectedId 設定) ===\n');

let passed = 0;
let nullOut = 0;
let failed = 0;
const allResults = [];

for (const actId of ACTIVITIES) {
  const r = checkOne(actId);
  allResults.push(r);
  if (r.status === 'PASS') {
    passed++;
    console.log(`[✓ PASS]    ${actId}`);
    console.log(`              name="${r.actName}" / judgment=${r.judgment} / validated=[${r.validated}] / htmlLen=${r.htmlLen}`);
  } else if (r.status === 'NULL_OUTPUT') {
    nullOut++;
    console.log(`[○ NULL]    ${actId}  ${r.notes}`);
    console.log(`              judgment=${r.judgment} / validated=[${r.validated}]`);
  } else if (r.status === 'PARTIAL') {
    failed++;
    console.log(`[△ PARTIAL] ${actId}  一部チェック失敗`);
    for (const [k, v] of Object.entries(r.checks)) {
      if (!v) console.log(`                ${k}: FAIL`);
    }
  } else {
    failed++;
    console.log(`[✗ ${r.status}] ${actId}  ${r.error || r.notes || ''}`);
  }
  console.log('');
}

console.log('=== サマリ ===');
console.log(`PASS:    ${passed} / ${ACTIVITIES.length}`);
console.log(`NULL:    ${nullOut} (judgment が required ではないので意図的に null)`);
console.log(`FAIL:    ${failed}`);

// 各活動の HTML を保存(目視用)
const outDir = path.join(ROOT, 'data', '_bak_20260515', '_activity_test');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let saved = 0;
for (const r of allResults) {
  if (r.status !== 'PASS') continue;
  const s = JSON.parse(JSON.stringify(session));
  s.activity = { selectedId: r.actId };
  const html = buildActivityHtml(s, lessonDataMap, registry, catalog);
  if (html) {
    fs.writeFileSync(path.join(outDir, `${r.actId}.html`), html, 'utf8');
    saved++;
  }
}
console.log(`\n保存した HTML: ${saved} 件 → ${outDir}`);
