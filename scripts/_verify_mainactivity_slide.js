/**
 * main_activity スライドの multi-activity 対応検証
 *
 * 検証項目:
 *   - mainActivities[] が 0/1/2/3 件のとき main_activity スライドが「常に 1 枚」
 *   - 1 件選択: .main-activity-switch ブロックに活動名 1 件
 *   - 複数選択: .main-activity-list + 番号付き <ol> に全活動名が並ぶ
 *   - 0 件のとき: lesson_01.json の main_act_1.skipped=true 経路で総スライドは 15 (slide 自体は出ない)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';

global.window = { EmbeddedData: { lessons: {} } };
global.Blob = class { constructor(p){ this._t=p.join(''); } async text(){ return this._t; } };
function loadJs(p) { new Function('window', fs.readFileSync(p, 'utf8'))(global.window); }
loadJs(path.join(ROOT, 'data', 'lesson_01.js'));
loadJs(path.join(ROOT, 'data', 'lesson_02.js'));
loadJs(path.join(ROOT, 'data', 'activity_catalog.js'));
loadJs(path.join(ROOT, 'data', 'intro_activity_catalog.js'));
loadJs(path.join(ROOT, 'data', 'master_image_registry.js'));
loadJs(path.join(ROOT, 'data', 'master_audio_registry.js'));
loadJs(path.join(ROOT, 'src', 'common', 'flow_synthesizer.js'));
loadJs(path.join(ROOT, 'src', 'common', 'image_resolver.js'));
loadJs(path.join(ROOT, 'src', 'common', 'ruby_dictionary.js'));
loadJs(path.join(ROOT, 'src', 'generators', 'slide_html.js'));

const baseSession = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'session_001.json'), 'utf8'));
const lesson = global.window.EmbeddedData.lessons[1];

async function genSlideHtmlWith(mainActivities) {
  const s = JSON.parse(JSON.stringify(baseSession));
  s.mainActivities = mainActivities;
  const synth = global.window.FlowSynthesizer.synthesize(lesson, s, global.window.EmbeddedData.activityCatalog);
  const ctx = {
    session: s, lesson, lessonsByNo: { 1: lesson },
    activityCatalog: global.window.EmbeddedData.activityCatalog,
    introActivityCatalog: global.window.EmbeddedData.introActivityCatalog,
    imageRegistry: global.window.EmbeddedData.imageRegistry,
    resolvedFlow: synth.resolvedFlow,
    flowMeta: synth.flowMeta,
    warnings: synth.warnings,
    hasRequiredActivity: synth.hasRequiredActivity,
  };
  const blob = await global.window.SlideHtml.generate(ctx);
  return blob.text();
}

function countMatches(html, regex) {
  return (html.match(regex) || []).length;
}

(async () => {
  const cases = [
    { label: '0件 (mainActivities=[])', acts: [], expectMain: 0 },
    { label: '1件 (memory_matching)',  acts: [{ activityId: 'act_memory_matching', minutes: 10 }],     expectMain: 1 },
    { label: '2件 (memory+bingo)',     acts: [
      { activityId: 'act_memory_matching', minutes: 8 },
      { activityId: 'act_vocab_bingo',     minutes: 8 },
    ], expectMain: 1 },
    { label: '3件 (memory+bingo+hajimemashite)', acts: [
      { activityId: 'act_memory_matching', minutes: 6 },
      { activityId: 'act_vocab_bingo',     minutes: 6 },
      { activityId: 'act_hajimemashite_conversation', minutes: 10 },
    ], expectMain: 1 },
  ];

  for (const c of cases) {
    console.log(`\n=== ${c.label} ===`);
    const html = await genSlideHtmlWith(c.acts);
    const totalSlides = countMatches(html, /<section class="slide/g);
    /* main_activity スライドの判定: タイトル "アクティビティの時間" を含む section の数 */
    const mainSlidesRaw = [...html.matchAll(/<section class="slide[^"]*"[^>]*>([\s\S]*?)<\/section>/g)]
      .filter(m => /アクティビティの時間/.test(m[1])).length;
    console.log(`  総スライド数: ${totalSlides}`);
    console.log(`  main_activity スライド数: ${mainSlidesRaw}  (期待: ${c.expectMain})`);

    /* 単一/複数の判定要素 */
    if (c.expectMain === 1) {
      const isSwitch = /<div class="activity-card main-activity-switch">/.test(html);
      const isList   = /<div class="activity-card main-activity-list">/.test(html);
      const items    = countMatches(html, /<li class="main-activity-item">/g);
      if (c.acts.length <= 1) {
        console.log(`  → 単一形式: switch=${isSwitch}  list=${isList}  (期待 switch=true, list=false)`);
      } else {
        console.log(`  → 複数形式: switch=${isSwitch}  list=${isList}  number-list items=${items}  (期待 list=true, items=${c.acts.length})`);
        /* 各活動名が含まれているか */
        const names = {
          'act_memory_matching': '記憶マッチング',
          'act_vocab_bingo':     'ビンゴ',
          'act_hajimemashite_conversation': 'はじめまして',
        };
        for (const act of c.acts) {
          const nm = names[act.activityId] || act.activityId;
          /* ruby タグを除去してテキスト比較 */
          const stripped = html.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<\/?ruby>/g, '');
          const present = stripped.includes(nm);
          console.log(`     活動名 "${nm}" 含む: ${present}`);
        }
      }
    } else {
      const mainContains = /アクティビティの時間/.test(html);
      console.log(`  → main_activity 関連内容なし: ${!mainContains}`);
    }
  }

  /* HTML 1 件を保存して目視確認用に */
  const out = path.join(ROOT, 'data', '_bak_20260515', '_multi_main_act_slide.html');
  const html3 = await genSlideHtmlWith([
    { activityId: 'act_memory_matching', minutes: 6 },
    { activityId: 'act_vocab_bingo',     minutes: 6 },
    { activityId: 'act_hajimemashite_conversation', minutes: 10 },
  ]);
  fs.writeFileSync(out, html3, 'utf8');
  console.log(`\n保存: ${out}`);
})();
