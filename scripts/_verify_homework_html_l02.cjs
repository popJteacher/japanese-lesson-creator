/**
 * homework_html.js 動作検証 (lesson_02)
 *
 * NEXT_ACTIONS.md β1 残課題:
 *   - lesson_02 以降の practiceImageSource / 答え抽出ロジック未検証
 *   - 複数 practiceTemplates 対応：現コードは practiceTemplates[0] のみ render
 *
 * このスクリプトは ad-hoc 検証（β1 v0.2 が lesson_02 でどう動くか観察）。
 * lesson_01 が NAMED 系、lesson_02 が vocabulary 主体 + 多 template という違いを焙り出す。
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
loadJs(path.join(ROOT, 'src', 'generators', 'homework_html.js'));

const session = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'session_l02_with_review.json'), 'utf8'));
const lesson  = global.window.EmbeddedData.lessons[2];
const lesson1 = global.window.EmbeddedData.lessons[1];

(async () => {
  const ctx = {
    session, lesson, lessonsByNo: { 1: lesson1, 2: lesson },
    activityCatalog: global.window.EmbeddedData.activityCatalog,
    introActivityCatalog: global.window.EmbeddedData.introActivityCatalog,
    imageRegistry: global.window.EmbeddedData.imageRegistry,
    audioRegistry: global.window.EmbeddedData.audioRegistry,
  };
  const blob = await global.window.HomeworkHtml.generate(ctx);
  const html = await blob.text();
  const outPath = path.join(ROOT, 'data', '_bak_20260515', '_homework_l02_test.html');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');

  console.log('=== homework_html.js lesson_02 ad-hoc 検証 ===');
  console.log(`  HTML 全体サイズ: ${html.length} bytes`);
  console.log(`  出力: ${outPath}`);
  console.log('');

  const allSections = html.split(/(?=<section class="lesson-section">)/).filter(s => s.startsWith('<section'));
  function findSection(pid) {
    return allSections.find(s => new RegExp('<h2>[^<]*[^>]*' + pid + ':').test(s)
                              || new RegExp('>\\s*' + pid + ':').test(s)) || '';
  }
  function inputsPerExercise(sectionHtml) {
    const blocks = sectionHtml.match(/<div class="question">[\s\S]*?<\/div>/g) || [];
    return blocks.map(b => (b.match(/<input/g) || []).length);
  }
  function judgeBtnCount(sectionHtml) {
    return (sectionHtml.match(/class="[^"]*judge-btn/g) || []).length;
  }
  function exerciseCount(sectionHtml) {
    return (sectionHtml.match(/class="exercise hint-exercise"/g) || []).length;
  }
  function templateBlockText(sectionHtml) {
    /* 各 .exercise 内の .template HTML を文字列化（input は __ で置換） */
    const blocks = sectionHtml.match(/<div class="template"[\s\S]*?<\/div>/g) || [];
    return blocks.slice(0, 3).map(b =>
      b.replace(/<input[^>]*>/g, '__')
       .replace(/<[^>]+>/g, '')
       .replace(/\s+/g, ' ')
       .trim()
    );
  }

  for (const pid of ['p1','p2','p3','p4','p5','p6']) {
    const sec = findSection(pid);
    const pat = (lesson.patterns || []).find(p => p.id === pid);
    if (!sec || !pat) { console.log(`[${pid}] (section not found)`); continue; }
    console.log(`--- ${pid}: imageSource=${pat.practiceImageSource} | templateCount=${(pat.practiceTemplates||[]).length} ---`);
    console.log(`     templates JSON:`);
    (pat.practiceTemplates||[]).forEach((t,i) => console.log(`        [${i}] ${t.pattern}`));
    const ex = exerciseCount(sec);
    const inputs = inputsPerExercise(sec);
    const judges = judgeBtnCount(sec);
    const renderedTpls = templateBlockText(sec);
    console.log(`     練習問題数: ${ex}`);
    console.log(`     input 数(各): ${JSON.stringify(inputs)}`);
    console.log(`     judge-btn 数: ${judges} (${judges>0?'採点 UI あり':'採点 UI なし（blanks>=2 で answer 組めず）'})`);
    console.log(`     render された template (先頭 3):`);
    renderedTpls.forEach((t,i) => console.log(`        [${i}] ${t}`));
    console.log('');
  }

  console.log('--- 全体集計 ---');
  console.log(`     section 数: ${allSections.length}`);
  console.log(`     audio-btn 総数: ${(html.match(/class="audio-btn/g) || []).length}`);
  console.log(`     audio-btn disabled: ${(html.match(/audio-btn[^"]*disabled[^"]*" disabled/g) || []).length}`);
})();
