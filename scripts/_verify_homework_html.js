/**
 * homework_html.js 動作検証
 *
 * 検証項目:
 *   - p1 (vocabulary):           語彙画像 word_X が解決され、各語彙ごとに 1 問
 *   - p2 (namedCharacters):      キャラクター画像 char_X が解決され、各キャラ 1 問
 *   - p3 (namedCharacters+vocab): 人物 + 建物 のペアが横並び (.hint-images:not(.single))
 *   - audio ボタン: audioUrl=null → disabled、ある場合 → enabled
 *   - 画像 null → .img-fallback で空枠
 *   - vocab セクションの語彙画像も word_* で解決
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

const session = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'session_001.json'), 'utf8'));
const lesson  = global.window.EmbeddedData.lessons[1];

(async () => {
  const ctx = {
    session, lesson, lessonsByNo: { 1: lesson },
    activityCatalog: global.window.EmbeddedData.activityCatalog,
    introActivityCatalog: global.window.EmbeddedData.introActivityCatalog,
    imageRegistry: global.window.EmbeddedData.imageRegistry,
    audioRegistry: global.window.EmbeddedData.audioRegistry,
  };
  const blob = await global.window.HomeworkHtml.generate(ctx);
  const html = await blob.text();
  const outPath = path.join(ROOT, 'data', '_bak_20260515', '_homework_test.html');
  fs.writeFileSync(outPath, html, 'utf8');

  function count(regex) { return (html.match(regex) || []).length; }
  function ok(label, cond, extra) {
    const m = cond ? '✓' : '✗';
    console.log(`  [${m}] ${label}${extra ? ' ' + extra : ''}`);
  }

  console.log('=== homework_html.js 監査 ===');
  console.log(`  HTML 全体サイズ: ${html.length} bytes`);
  console.log('');

  console.log('--- ヒントトグル要素確認 ---');
  ok('toolbar に hint-toggle ボタンあり', /<button id="hint-toggle"/.test(html));
  ok('hint-toggle 初期テキストが "ヒントを隠す"', /<button id="hint-toggle"[^>]*>💡 ヒントを隠す<\/button>/.test(html));
  ok('CSS rule body.hide-labels .hint-cell-label { display: none } あり',
     /body\.hide-labels\s+\.hint-cell-label\s*\{\s*display:\s*none/.test(html));
  ok('JS toggleLabels ハンドラ相当 (classList.toggle hide-labels) あり',
     /classList\.toggle\(['"]hide-labels['"]/.test(html));
  ok('JS で初期 body class に hide-labels 含まない', !/class="[^"]*hide-labels/.test(html));
  ok('.hint-cell-label 要素が複数存在 (ラベルは生成されている)',
     (html.match(/class="hint-cell-label"/g) || []).length >= 5);

  console.log('');
  console.log('--- 共通: 画像/音声 ---');
  console.log(`     audio-btn 総数: ${count(/class="audio-btn/g)}`);
  console.log(`     audio-btn (disabled): ${count(/audio-btn[^"]*disabled[^"]*" disabled/g)} (現状の registry は全 audioUrl=null のため全 disabled が期待値)`);
  console.log(`     audio-btn (enabled・data-src あり): ${count(/class="audio-btn[^"]*" data-src=/g)} (期待: 0 — registry に URL が登録されたら > 0 になる)`);
  ok('audio-btn (disabled) あり (audioRegistry の全 audioUrl が null のため全 disabled)', /class="audio-btn[^"]*disabled[^"]*" disabled/.test(html));
  ok('audio-btn (data-src 無効) 0 件 (registry が null → null URL → disabled)',
     count(/class="audio-btn(?:[^"]*) data-src=""/g) === 0);
  ok('画像 fallback: img-fallback span は存在しうる(画像なしは fallback で空枠)', /<span class="img-fallback">/.test(html) || /<img class="hint-img"/.test(html));
  ok('vocab セクションの画像参照は word_* 系 (lh3 経由)', /lh3\.googleusercontent\.com/.test(html));
  ok("旧 'vocab_' プレフィックスがコード生成側に残らない: data-src/src に 'vocab_' 直リテラル無し",
     !/vocab_[一-鿿]/.test(html));

  console.log('');
  console.log('--- p1 (practiceImageSource = "namedCharacters", 2 blanks) ---');
  /* 全 <section> を配列に分割し、それぞれの h2 内に "p1:" 等を含むセクションだけを抽出 */
  const allSections = html.split(/(?=<section class="lesson-section">)/).filter(s => s.startsWith('<section'));
  function findSection(pid) {
    return allSections.find(s => new RegExp('<h2>[^<]*[^>]*' + pid + ':').test(s)
                              || new RegExp('>\\s*' + pid + ':').test(s)) || '';
  }
  const p1 = findSection('p1');
  const p2 = findSection('p2');
  const p3 = findSection('p3');
  console.log(`     sections found: ${allSections.length} (うち pattern: p1=${!!p1} p2=${!!p2} p3=${!!p3})`);

  /* テンプレートあたりの input 数を抽出する補助関数: 各 .exercise.hint-exercise .question 内の <input> 数 */
  function inputsPerExercise(sectionHtml) {
    const blocks = sectionHtml.match(/<div class="question">[\s\S]*?<\/div>/g) || [];
    return blocks.map(b => (b.match(/<input/g) || []).length);
  }
  const p1Single = (p1.match(/hint-images single/g) || []).length;
  const p1Pair   = (p1.match(/hint-images(?! single)/g) || []).length;
  ok(`p1: hint-images single = ${p1Single} (期待 > 0)`, p1Single > 0);
  ok(`p1: hint-images pair = ${p1Pair} (期待 0)`, p1Pair === 0);
  const p1Exercises = (p1.match(/class="exercise hint-exercise"/g) || []).length;
  console.log(`     p1 練習問題数: ${p1Exercises}`);
  const p1Inputs = inputsPerExercise(p1);
  console.log(`     p1 各エクササイズの input 数: ${JSON.stringify(p1Inputs)}`);
  ok('p1: 全エクササイズが 2 個の input を持つ (＿＿＿さんは＿＿＿です)', p1Inputs.every(n => n === 2));

  console.log('');
  console.log('--- p2 (practiceImageSource = "namedCharacters") ---');
  const p2Single = (p2.match(/hint-images single/g) || []).length;
  const p2Pair   = (p2.match(/hint-images(?! single)/g) || []).length;
  ok(`p2: hint-images single = ${p2Single} (期待 > 0)`, p2Single > 0);
  ok(`p2: hint-images pair = ${p2Pair} (期待 0)`, p2Pair === 0);
  ok('p2: namedCharacters の名前(鈴木さん等)が現れる', /鈴木さん/.test(p2));
  const p2Exercises = (p2.match(/class="exercise hint-exercise"/g) || []).length;
  console.log(`     p2 練習問題数: ${p2Exercises}`);

  console.log('');
  console.log('--- p3 (practiceImageSource = "namedCharacters+vocab") ---');
  const p3Single = (p3.match(/hint-images single/g) || []).length;
  const p3Pair   = (p3.match(/hint-images(?! single)/g) || []).length;
  ok(`p3: hint-images pair > 0 = ${p3Pair}`, p3Pair > 0);
  ok(`p3: hint-images single = ${p3Single} (期待 0)`, p3Single === 0);
  ok('p3: 人物+建物 の "＋" 区切りあり', /class="hint-plus">＋</.test(p3));
  ok('p3: namedCharacter (鈴木さん) + 建物 (病院/学校/銀行/大学/デパート) 両方含む',
     /鈴木さん/.test(p3) && /(病院|学校|銀行|大学|デパート)/.test(p3));

  /* p3 のペアが pattern.examples から正しく抽出されているか確認
     期待: タノム+病院 / 鈴木+学校 / キム+銀行 / リン+大学 / キム+デパート */
  const p3Items = [...p3.matchAll(/<div class="hint-cell">[\s\S]*?<span class="hint-cell-label">[\s\S]*?<\/span>[\s\S]*?<\/div>\s*<span class="hint-plus">＋<\/span>\s*<div class="hint-cell">[\s\S]*?<span class="hint-cell-label">[\s\S]*?<\/span>[\s\S]*?<\/div>/g)];
  console.log(`     p3 ペア HTML 抽出: ${p3Items.length} 件`);
  /* 各ペアの label テキストを ruby ストリップして取得 */
  function stripRuby(s) { return s.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<\/?ruby>/g, ''); }
  const expectedPairs = [
    ['タノムさん', '病院'],
    ['鈴木さん',   '学校'],
    ['キムさん',   '銀行'],
    ['リンさん',   '大学'],
    ['キムさん',   'デパート'],
  ];
  const actualPairs = p3Items.map(m => {
    const labels = [...m[0].matchAll(/<span class="hint-cell-label">([\s\S]*?)<\/span>/g)].map(x => stripRuby(x[1]).trim());
    return labels;
  });
  console.log(`     p3 実際のペア(label):`);
  actualPairs.forEach((p, i) => console.log(`        ${i+1}. ${p.join(' + ')}`));
  let pairOK = actualPairs.length === expectedPairs.length;
  if (pairOK) {
    for (let i = 0; i < expectedPairs.length; i++) {
      if (actualPairs[i][0] !== expectedPairs[i][0] || actualPairs[i][1] !== expectedPairs[i][1]) {
        pairOK = false; break;
      }
    }
  }
  ok('p3: 期待されるペア(タノム+病院/鈴木+学校/キム+銀行/リン+大学/キム+デパート) と完全一致', pairOK);
  const p3Exercises = (p3.match(/class="exercise hint-exercise"/g) || []).length;
  console.log(`     p3 練習問題数: ${p3Exercises}`);
  const p3Inputs = inputsPerExercise(p3);
  console.log(`     p3 各エクササイズの input 数: ${JSON.stringify(p3Inputs)}`);
  ok('p3: 全エクササイズが 3 個の input を持つ (＿＿＿さんは＿＿＿の＿＿＿です)', p3Inputs.every(n => n === 3));
  /* p2 も追加検証 */
  const p2Inputs = inputsPerExercise(p2);
  console.log(`     p2 各エクササイズの input 数: ${JSON.stringify(p2Inputs)} (template 1 番目 "＿＿＿さんは　＿＿＿　ですか" は 2 input)`);

  console.log('');
  console.log('--- Stage 1 既知 9 問題 (宿題側) ---');
  ok('#1 lh3 URL 正規化',  /lh3\.googleusercontent\.com/.test(html));
  ok('#1 drive uc 残存無し', !/drive\.google\.com\/uc\?id=/.test(html));
  ok('#3 no-ruby ruby rt display:none', /body\.no-ruby ruby rt[\s\S]*?display:\s*none/.test(html));
  ok('#4 rt color inherit',  /ruby rt[\s\S]*?color:\s*inherit/.test(html));
  ok('#5 トグル button に <ruby> なし',
     !/id="ruby-toggle"[^>]*>[^<]*<ruby/.test(html) && !/id="en-toggle"[^>]*>[^<]*<ruby/.test(html));

  console.log('');
  console.log('--- 追加検証: 音声 URL を 1 件ダミーで設定して再生成 → enabled になるか ---');
  /* registry を deep-clone してダミー URL を 2 件入れる
     - sentence_ex_L01_001: 例文行(常に音声ボタン)で使われる
     - word_病院: p3 練習問題で使われる (p1 は namedCharacters になったため word_* は使わなくなった) */
  const fakeReg = JSON.parse(JSON.stringify(global.window.EmbeddedData.audioRegistry));
  fakeReg.entries['sentence_ex_L01_001'].audioUrl = 'https://example.com/audio/sentence_ex_L01_001.mp3';
  fakeReg.entries['word_病院'].audioUrl = 'https://example.com/audio/word_病院.mp3';
  const ctx2 = Object.assign({}, ctx, { audioRegistry: fakeReg });
  const blob2 = await global.window.HomeworkHtml.generate(ctx2);
  const html2 = await blob2.text();
  const enabledCount = (html2.match(/class="audio-btn[^"]*" data-src="https/g) || []).length;
  console.log(`     fake URL 注入後 enabled audio-btn: ${enabledCount} (期待 ≥ 1)`);
  ok('音声 URL 注入で enabled audio-btn が現れる', enabledCount >= 1);

  console.log('');
  console.log(`保存: ${outPath}`);
})();
