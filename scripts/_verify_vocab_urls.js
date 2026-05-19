/**
 * lesson_01.json の vocabulary 全 17 語について、image URL が resolveable か確認
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';

global.window = { EmbeddedData: { lessons: {} } };
function loadJs(p) { new Function('window', fs.readFileSync(p, 'utf8'))(global.window); }
loadJs(path.join(ROOT, 'data', 'lesson_01.js'));
loadJs(path.join(ROOT, 'data', 'master_image_registry.js'));
loadJs(path.join(ROOT, 'src', 'common', 'image_resolver.js'));

const lesson = global.window.EmbeddedData.lessons[1];
const reg = global.window.EmbeddedData.imageRegistry;
/* homework_html.js / slide_html.js が ImageResolver に渡しているのは
   registry.entries (entries マップ) であって registry オブジェクトそのものではない。
   テストもそれと同じ呼び出しを使う。 */
const registryEntries = reg && reg.entries ? reg.entries : reg;

console.log('=== lesson_01.json vocabulary 全語の画像URL解決確認 ===');
let ok = 0, ng = 0;
for (const [groupKey, grp] of Object.entries(lesson.vocabulary.byPattern)) {
  for (const w of grp.words || []) {
    const url = global.window.ImageResolver.resolveImageUrl(w.imageId, { registry: registryEntries });
    const isDrive = url && /drive\.google\.com|googleusercontent\.com/.test(url);
    const status = isDrive ? '✓ (Drive)' : (url && url.startsWith('./') ? '✗ fallback' : '✗ NULL');
    if (isDrive) ok++; else ng++;
    console.log(`  [${status.padEnd(11)}] ${w.imageId.padEnd(20)} (${w.word.padEnd(10)} / ${groupKey}) → ${url ? url.slice(0, 70) : '(NULL)'}`);
  }
}
console.log(`\n結果: Drive URL 解決=${ok} / fallback or NULL=${ng} / 期待=17`);

console.log('\n=== namedCharacters[] 画像URL解決確認 ===');
for (const c of lesson.namedCharacters || []) {
  const url = global.window.ImageResolver.resolveImageUrl(c.imageId, { registry: registryEntries });
  const isDrive = url && /drive\.google\.com|googleusercontent\.com/.test(url);
  const status = isDrive ? '✓ (Drive)' : (url && url.startsWith('./') ? '✗ fallback' : '✗ NULL');
  console.log(`  [${status.padEnd(11)}] ${c.imageId.padEnd(20)} (${c.name}) → ${url ? url.slice(0, 70) : '(NULL)'}`);
}
