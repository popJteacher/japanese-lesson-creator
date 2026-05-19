/**
 * Bug ① 診断: RubyDict のみで slide_html を実行し、どの kanji が ruby 化されないかを特定。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';

global.window = { EmbeddedData: { lessons: {} } };
global.Blob = class { constructor(p){ this._t=p.join(''); } async text(){ return this._t; } };

function loadJs(p) {
  const code = fs.readFileSync(p, 'utf8');
  new Function('window', code)(global.window);
}

// data
loadJs(path.join(ROOT, 'data', 'lesson_01.js'));
loadJs(path.join(ROOT, 'data', 'lesson_02.js'));
loadJs(path.join(ROOT, 'data', 'activity_catalog.js'));
loadJs(path.join(ROOT, 'data', 'intro_activity_catalog.js'));
loadJs(path.join(ROOT, 'data', 'master_image_registry.js'));
loadJs(path.join(ROOT, 'data', 'master_audio_registry.js'));

// modules
loadJs(path.join(ROOT, 'src', 'common', 'flow_synthesizer.js'));
loadJs(path.join(ROOT, 'src', 'common', 'image_resolver.js'));
loadJs(path.join(ROOT, 'src', 'common', 'ruby_dictionary.js'));
// NOTE: kuromoji を読み込まない → RubyKuromoji も読まない。
// slide_html の ruby() は RubyDict にフォールバックする。

console.log('[init] RubyDict exists:', !!global.window.RubyDict);
console.log('[init] RubyKuromoji exists:', !!global.window.RubyKuromoji);
console.log('[init] RubyDict entries:', Object.keys(global.window.RubyDict.WORD_RUBY).length);

loadJs(path.join(ROOT, 'src', 'generators', 'slide_html.js'));

const session = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'session_001.json'), 'utf8'));
session.mainActivities = [{ activityId: 'act_hajimemashite_conversation', minutes: 5 }];
const lesson = global.window.EmbeddedData.lessons[1];
const synth = global.window.FlowSynthesizer.synthesize(lesson, session, global.window.EmbeddedData.activityCatalog);
const ctx = {
  session, lesson, lessonsByNo: { 1: lesson },
  activityCatalog: global.window.EmbeddedData.activityCatalog,
  introActivityCatalog: global.window.EmbeddedData.introActivityCatalog,
  imageRegistry: global.window.EmbeddedData.imageRegistry,
  resolvedFlow: synth.resolvedFlow, flowMeta: synth.flowMeta,
  warnings: synth.warnings, hasRequiredActivity: synth.hasRequiredActivity,
};

global.window.SlideHtml.generate(ctx).then(async (blob) => {
  const html = await blob.text();
  const rubyTags = (html.match(/<ruby>/g) || []).length;
  const rtTags = (html.match(/<rt>/g) || []).length;
  console.log(`[result] Total <ruby> tags: ${rubyTags}`);
  console.log(`[result] Total <rt> tags: ${rtTags}`);

  // Look for kanji that exist in HTML but NOT wrapped in <ruby>
  // Extract all kanji-substrings in body content
  const slideSections = [...html.matchAll(/<section class="slide[^"]*" data-idx="(\d+)">([\s\S]*?)<\/section>/g)];
  console.log(`\nSlide-by-slide kanji-ruby coverage:`);
  for (const m of slideSections) {
    const idx = m[1];
    const body = m[2];
    // Strip <ruby><rt>...</rt></ruby> -> they don't count toward "raw kanji"
    const stripped = body.replace(/<ruby>[^<]*<rt>[^<]*<\/rt><\/ruby>/g, '◇');
    // Find remaining kanji in body
    const remainingKanji = [...stripped.matchAll(/[一-鿿㐀-䶿]+/g)].map(x => x[0]);
    const rubyInThisSlide = (body.match(/<ruby>/g) || []).length;
    if (remainingKanji.length > 0 || rubyInThisSlide > 0) {
      const dedupe = [...new Set(remainingKanji)];
      console.log(`  idx=${idx}: ruby_count=${rubyInThisSlide} | raw_kanji_remaining (not in ruby): ${dedupe.slice(0, 20).join(' / ')}`);
    }
  }

  // Save full HTML for inspection
  const outPath = path.join(ROOT, 'data', '_bak_20260515', '_bug_ruby_diag.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`\nSaved to: ${outPath}`);
});
