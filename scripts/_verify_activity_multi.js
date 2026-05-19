/**
 * multi-activity モード検証スクリプト。
 *
 * session_001.json (v2.0) の mainActivities[] に 2〜3 件設定して
 * 以下を確認する:
 *   - HTML 内に <nav class="activity-tabs"> が存在する
 *   - 各アクティビティに対応する .activity-tab-btn と .activity-pane が出力される
 *   - 最初の pane が .active で、他は隠れる
 *   - 各 IIFE が独立して残っている (script タグ数 ≧ N)
 *   - switchActivityTab 関数が定義されている
 *   - 1件のみのときはタブが表示されないこと
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';

global.window = {};
global.Blob = class {
  constructor(parts, options){ this._t = parts.join(''); this.type = (options&&options.type)||''; }
  get size(){ return this._t.length; }
  async text(){ return this._t; }
};

// activity_html.js をブラウザモードでロード
const code = fs.readFileSync(path.join(ROOT, 'src', 'generators', 'activity_html.js'), 'utf8');
new Function('window', 'module', code)(global.window, undefined);

const session  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'session_001.json'), 'utf8'));
const lesson1  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lesson_01.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'master_image_registry.json'), 'utf8'));
const catalog  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'activity_catalog.json'), 'utf8'));

function pretty(label, val) {
  const mark = (typeof val === 'boolean') ? (val ? '✓' : '✗') : '·';
  console.log(`  ${mark} ${label}: ${val}`);
}

async function gen(mainActivities) {
  const s = JSON.parse(JSON.stringify(session));
  s.mainActivities = mainActivities;
  delete s.activity; // v1.0 のフィールドが残っていれば消す
  const ctx = {
    session: s,
    lesson: lesson1,
    lessonsByNo: { 1: lesson1 },
    activityCatalog: catalog,
    imageRegistry: registry,
  };
  const blob = await global.window.ActivityHtml.generate(ctx);
  if (!blob) return null;
  return await blob.text();
}

(async () => {
  console.log('=== Test 1: 単一アクティビティ (mainActivities=[1件]) — タブなし ===');
  {
    const html = await gen([{ activityId: 'act_memory_matching', minutes: 10 }]);
    if (!html) { console.log('  ✗ HTML null'); process.exit(1); }
    pretty('html generated', html.length > 1000);
    pretty('activity-tabs <nav> 非出力', !/<nav class="activity-tabs"/.test(html));
    pretty('activity-pane 非出力', !/<section class="activity-pane/.test(html));
    pretty('switchActivityTab 未定義', !/function switchActivityTab/.test(html));
    pretty('main 内に直接 .card がある (現状互換)', /<main class="container">[\s\S]*?<div class="card mb2">/.test(html));
  }

  console.log('\n=== Test 2: 2 アクティビティ — タブ表示 ===');
  {
    const acts = [
      { activityId: 'act_memory_matching', minutes: 10 },
      { activityId: 'act_vocab_bingo',     minutes: 10 },
    ];
    const html = await gen(acts);
    if (!html) { console.log('  ✗ HTML null'); process.exit(1); }
    const outPath = path.join(ROOT, 'data', '_bak_20260515', '_activity_test', '_multi_2.html');
    fs.writeFileSync(outPath, html, 'utf8');
    pretty('html generated', html.length > 1000);
    pretty('<nav class="activity-tabs"> 存在', /<nav class="activity-tabs"/.test(html));
    pretty('switchActivityTab 関数定義あり', /function switchActivityTab/.test(html));
    const tabBtns = (html.match(/class="activity-tab-btn[^"]*"/g) || []).length;
    pretty(`activity-tab-btn = 2`, tabBtns === 2);
    const panes = (html.match(/<section class="activity-pane[^"]*"/g) || []).length;
    pretty(`activity-pane = 2`, panes === 2);
    pretty('最初のタブが .active', /id="tab-act_memory_matching"[^>]*class="activity-tab-btn active"|class="activity-tab-btn active"[^>]*id="tab-act_memory_matching"/.test(html));
    pretty('最初のペインが .active', /class="activity-pane active" id="pane-act_memory_matching"/.test(html));
    pretty('2番目ペインは .active 無し', /class="activity-pane" id="pane-act_vocab_bingo"/.test(html));
    pretty('各活動の IIFE 内 <script> あり', (html.match(/<script>/g) || []).length >= 3);
    pretty('mmReset (memory) 含む', /window\.mmReset\s*=/.test(html));
    pretty('bgReset (bingo) 含む', /window\.bgReset\s*=/.test(html));
    pretty('Stage1 #3 rt display:none', /body\.hide-furigana rt[\s\S]{0,80}\{\s*display:\s*none/.test(html));
    pretty('Stage1 #4 rt color:inherit', /\brt\s*\{[^}]*color:\s*inherit/.test(html));
    console.log(`  → 保存: ${outPath}`);
  }

  console.log('\n=== Test 3: 3 アクティビティ — タブ表示 ===');
  {
    const acts = [
      { activityId: 'act_memory_matching', minutes: 8 },
      { activityId: 'act_vocab_bingo',     minutes: 8 },
      { activityId: 'act_hajimemashite_conversation', minutes: 12 },
    ];
    const html = await gen(acts);
    if (!html) { console.log('  ✗ HTML null'); process.exit(1); }
    const outPath = path.join(ROOT, 'data', '_bak_20260515', '_activity_test', '_multi_3.html');
    fs.writeFileSync(outPath, html, 'utf8');
    pretty('html generated', html.length > 1000);
    const tabBtns = (html.match(/class="activity-tab-btn[^"]*"/g) || []).length;
    pretty(`activity-tab-btn = 3`, tabBtns === 3);
    const panes = (html.match(/<section class="activity-pane[^"]*"/g) || []).length;
    pretty(`activity-pane = 3`, panes === 3);
    pretty('活動名 (記憶マッチング) 含む', /記憶マッチング/.test(html));
    pretty('活動名 (語彙ビンゴ) 含む', /語彙.{0,30}ビンゴ/.test(html));
    pretty('活動名 (会話「はじめまして」) 含む', /会話.{0,30}はじめまして/.test(html));
    pretty('mmReset / bgReset / editField 全部含む',
      /window\.mmReset\s*=/.test(html) && /window\.bgReset\s*=/.test(html) && /window\.editField\s*=/.test(html));
    console.log(`  → 保存: ${outPath}`);
  }

  console.log('\n=== Test 4: 1 件のみ session.activity.selectedId (v1.0 旧形式) ===');
  {
    const s = JSON.parse(JSON.stringify(session));
    s.mainActivities = [];
    s.activity = { selectedId: 'act_battleship' };
    const ctx = {
      session: s, lesson: lesson1, lessonsByNo: { 1: lesson1 },
      activityCatalog: catalog, imageRegistry: registry,
    };
    const blob = await global.window.ActivityHtml.generate(ctx);
    if (!blob) { console.log('  ✗ HTML null (旧形式が壊れた)'); process.exit(1); }
    const html = await blob.text();
    pretty('v1.0 旧形式でも生成成功', html.length > 1000);
    pretty('タブなし(single モード)', !/<nav class="activity-tabs"/.test(html));
    pretty('戦艦ゲーム activity-title', /戦艦/.test(html));
  }

  console.log('\n=== Test 5: 同一活動 ID を 2 件指定 (重複) ===');
  {
    /* 重複 ID は items に 2 件入って 2 タブ表示される (ID 衝突するが想定外運用) */
    const acts = [
      { activityId: 'act_memory_matching', minutes: 5 },
      { activityId: 'act_memory_matching', minutes: 5 },
    ];
    const html = await gen(acts);
    if (html) {
      const tabBtns = (html.match(/class="activity-tab-btn[^"]*"/g) || []).length;
      console.log(`  情報: 重複 ID 指定時 tabs=${tabBtns} (注: 同じ tab/pane id が衝突するため非推奨)`);
    } else {
      console.log('  null (想定外)');
    }
  }

  console.log('\n完了');
})();
