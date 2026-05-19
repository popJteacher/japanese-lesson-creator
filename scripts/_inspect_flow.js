'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';
global.window = { EmbeddedData: { lessons: {} } };
function loadJs(p) { new Function('window', fs.readFileSync(p, 'utf8'))(global.window); }
loadJs(path.join(ROOT, 'data', 'lesson_01.js'));
loadJs(path.join(ROOT, 'data', 'activity_catalog.js'));
loadJs(path.join(ROOT, 'src', 'common', 'flow_synthesizer.js'));

const baseSession = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'session_001.json'), 'utf8'));
const lesson = global.window.EmbeddedData.lessons[1];

function inspect(label, mainActivities) {
  const s = JSON.parse(JSON.stringify(baseSession));
  s.mainActivities = mainActivities;
  const r = global.window.FlowSynthesizer.synthesize(lesson, s, global.window.EmbeddedData.activityCatalog);
  console.log(`\n=== ${label} ===`);
  console.log(`  resolvedFlow length: ${r.resolvedFlow.length}`);
  const mainActs = r.resolvedFlow.filter(e => e.type === 'main_activity');
  console.log(`  main_activity entries in flow: ${mainActs.length}`);
  for (const e of mainActs) {
    console.log(`    id=${e.id} activityId=${e.activityId} skipped=${e.skipped}`);
  }
}

inspect('0件', []);
inspect('1件 (memory_matching)', [{ activityId: 'act_memory_matching', minutes: 10 }]);
inspect('2件', [
  { activityId: 'act_memory_matching', minutes: 8 },
  { activityId: 'act_vocab_bingo',     minutes: 8 },
]);
inspect('3件', [
  { activityId: 'act_memory_matching', minutes: 6 },
  { activityId: 'act_vocab_bingo',     minutes: 6 },
  { activityId: 'act_hajimemashite_conversation', minutes: 10 },
]);
