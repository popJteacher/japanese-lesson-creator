/**
 * window.ActivityHtml.generate(ctx) 互換アダプタの動作確認。
 * session_001.json v2.0 形式(mainActivities[])で各活動 ID を順に設定し、
 * Blob が正しく返ることを検証する。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';

// ── window モック ─────────────────────────────────────────
global.window = {};
global.Blob = class {
  constructor(parts, options) {
    this._text = parts.join('');
    this.type = (options && options.type) || '';
  }
  get size() { return this._text.length; }
  async text() { return this._text; }
};

// ── activity_html.js をスクリプトロード(typeof window 分岐通過) ─
const code = fs.readFileSync(path.join(ROOT, 'src', 'generators', 'activity_html.js'), 'utf8');
new Function('window', 'module', code)(global.window, undefined);

if (!global.window.ActivityHtml || typeof global.window.ActivityHtml.generate !== 'function') {
  console.error('FAIL: window.ActivityHtml.generate が登録されていない');
  process.exit(1);
}
console.log('window.ActivityHtml.generate 登録: OK');
console.log(`adapter version: ${global.window.ActivityHtml._meta.version}`);

// ── データ ─────────────────────────────────────────────────
const sessionBase = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'session_001.json'), 'utf8'));
const lesson1     = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lesson_01.json'), 'utf8'));
const registry    = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'master_image_registry.json'), 'utf8'));
const catalog     = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'activity_catalog.json'), 'utf8'));

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

(async () => {
  console.log('\n=== window.ActivityHtml.generate(ctx) でセッション v2.0 形式(mainActivities[]) を試験 ===\n');
  let passed = 0, failed = 0;
  for (const actId of ACTIVITIES) {
    const session = JSON.parse(JSON.stringify(sessionBase));
    // v2.0: mainActivities にセットする(activity.selectedId は付けない)
    session.mainActivities = [{ activityId: actId, minutes: 5 }];

    const ctx = {
      session,
      lesson: lesson1,
      lessonsByNo: { 1: lesson1 },
      activityCatalog: catalog,
      imageRegistry: registry,
    };

    try {
      const blob = await global.window.ActivityHtml.generate(ctx);
      if (!blob) {
        console.log(`[✗] ${actId}  → null Blob`);
        failed++;
        continue;
      }
      const isBlobLike = typeof blob.text === 'function' && typeof blob.size === 'number';
      const text = await blob.text();
      const sizeOk = text.length > 500;
      const hasTitle = /<h1[^>]*>|activity-title/i.test(text);
      const hasMain = /page-header|container/i.test(text);
      if (isBlobLike && sizeOk && hasTitle && hasMain) {
        console.log(`[✓] ${actId}  → Blob size=${blob.size} type='${blob.type}' (mainActivities[0]→selectedId 中継成功)`);
        passed++;
      } else {
        console.log(`[✗] ${actId}  → 部分失敗: isBlob=${isBlobLike} size=${blob.size} hasTitle=${hasTitle} hasMain=${hasMain}`);
        failed++;
      }
    } catch (err) {
      console.log(`[✗] ${actId}  → 例外: ${err.message}`);
      failed++;
    }
  }
  console.log('');
  console.log(`PASS: ${passed} / ${ACTIVITIES.length}`);
  console.log(`FAIL: ${failed}`);

  // hasRequiredActivity が false 相当(mainActivities=[])のとき
  console.log('\n=== mainActivities=[] の時の挙動(null 期待) ===');
  const emptySession = JSON.parse(JSON.stringify(sessionBase));
  emptySession.mainActivities = [];
  const blob = await global.window.ActivityHtml.generate({
    session: emptySession,
    lesson: lesson1, lessonsByNo: { 1: lesson1 },
    activityCatalog: catalog, imageRegistry: registry,
  });
  console.log(`  blob = ${blob} ${blob === null ? '(期待通り null)' : '(NG)'}`);
})();
