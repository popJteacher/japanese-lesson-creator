/**
 * 8 アクティビティ HTML を静的解析して、Bug 候補を洗い出す。
 *  - 可視テキスト中で <ruby> ラップされていない漢字
 *  - 英語が含まれる要素で hide-en によりトグルされないもの
 *  - rt の display:none / opacity:0 判定
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';
const DIR  = path.join(ROOT, 'data', '_bak_20260515', '_activity_test');

const FILES = [
  'act_memory_matching.html',
  'act_vocab_bingo.html',
  'act_whiteboard_categorize.html',
  'act_grammar_auction.html',
  'act_battleship.html',
  'act_person_guessing_quiz.html',
  'act_personality_quiz.html',
  'act_hajimemashite_conversation.html',
];

function findRawKanji(body) {
  // Strip ruby blocks (with <rt> inner)
  const stripped = body.replace(/<ruby>[\s\S]*?<\/ruby>/g, '◇');
  // Strip <script> and <style> contents
  const noScript = stripped.replace(/<script[\s\S]*?<\/script>/gi, '')
                            .replace(/<style[\s\S]*?<\/style>/gi, '')
                            .replace(/<title[\s\S]*?<\/title>/gi, '')
                            // .bubble-en / .en-text 等の英語専用ブロック内は EN トグル OFF で完全に消えるので除外
                            .replace(/<[^>]+class="[^"]*(?:bubble-en|setting-text-en|step-en|activity-title-en)[^"]*"[\s\S]*?<\/(?:p|div|span|small)>/gi, '')
                            // toggle-bar(UI要素)内の "表示" / "英語" は Stage 1 #5 によりUIにruby付けない設計 → 除外
                            .replace(/<div class="toggle-bar"[\s\S]*?<\/div>/i, '')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/&[a-z]+;/gi, ' ');
  // Find all kanji clusters and ignore <ruby> base text remnants (◇)
  const kanjis = [...noScript.matchAll(/[一-鿿]+/g)].map(m => m[0]);
  return [...new Set(kanjis)];
}

function findRawEnglish(body) {
  // Find <small>, <p>, <span>, <div> elements that contain Latin words but lack en-text or known toggle class
  // Heuristic: look at all elements with English-looking text (>=2 consecutive Latin words) that don't have en-text/step-en/setting-text-en/activity-title-en/bubble-en class
  // For simplicity: search for inline strings.
  const issues = [];
  // <small> tags
  const smallMatches = [...body.matchAll(/<small([^>]*)>([^<]+)<\/small>/g)];
  for (const m of smallMatches) {
    const attrs = m[1];
    const text = m[2];
    if (!/class="[^"]*(?:en-text|step-en|setting-text-en|activity-title-en|bubble-en)[^"]*"/.test(attrs) && /[A-Za-z]{3,}.*[A-Za-z]{3,}/.test(text)) {
      issues.push({ kind: 'small_no_en_class', snippet: m[0].slice(0, 120) });
    }
  }
  return issues;
}

function check(file) {
  const html = fs.readFileSync(path.join(DIR, file), 'utf8');
  const bodyM = html.match(/<body[\s\S]*<\/body>/);
  const body = bodyM ? bodyM[0] : html;

  // rt CSS rules — `body.hide-furigana rt, body.hide-furigana rp { display: none ... }` のような
  // セレクタリスト記法もマッチさせる(\sでカンマ・改行を許容)
  const rtDisplay = /body\.hide-furigana rt[\s\S]{0,80}\{\s*display:\s*none/.test(html);
  const rtOpacity = /body\.hide-furigana rt[\s\S]{0,80}\{\s*opacity:\s*0/.test(html);
  const rtColorInherit = /\brt\s*\{[^}]*color:\s*inherit/.test(html);
  const rtColorSubtle = /\brt\s*\{[^}]*color:\s*var\(--text-subtle\)/.test(html);

  const rawKanji = findRawKanji(body);
  const rawEnIssues = findRawEnglish(body);

  // Activity title check
  const titleM = body.match(/<h2 class="activity-title">([\s\S]*?)<\/h2>/);
  const title = titleM ? titleM[1].trim() : '?';
  const titleHasRuby = /<ruby>/.test(title);
  const titleHasKanji = /[一-鿿]/.test(title.replace(/<[^>]+>/g, ''));

  // page-header h1 (always "アクティビティ" katakana)
  return {
    file,
    rt_display_none: rtDisplay,
    rt_opacity_0: rtOpacity,
    rt_color_inherit: rtColorInherit,
    rt_color_subtle: rtColorSubtle,
    activity_title_has_ruby: titleHasRuby,
    activity_title_has_kanji: titleHasKanji,
    title_snippet: title.slice(0, 80),
    raw_kanji_count: rawKanji.length,
    raw_kanji_samples: rawKanji.slice(0, 15),
    raw_en_issues: rawEnIssues.length,
    raw_en_samples: rawEnIssues.slice(0, 3),
  };
}

console.log('=== Activity HTML 静的監査 ===\n');
for (const f of FILES) {
  const r = check(f);
  console.log(`【${f}】`);
  console.log(`  Stage1 #3 rt display:none = ${r.rt_display_none}  / opacity:0 = ${r.rt_opacity_0}  (期待: display:none)`);
  console.log(`  Stage1 #4 rt color:inherit = ${r.rt_color_inherit}  / color:var(--text-subtle) = ${r.rt_color_subtle}  (期待: inherit)`);
  console.log(`  activity-title: "${r.title_snippet}"`);
  console.log(`     has_ruby=${r.activity_title_has_ruby}  has_kanji=${r.activity_title_has_kanji}  ${r.activity_title_has_kanji && !r.activity_title_has_ruby ? '← ⚠ kanji あるが ruby なし' : ''}`);
  if (r.raw_kanji_count > 0) {
    console.log(`  visible-text 未 ruby 漢字 (${r.raw_kanji_count} 種): ${r.raw_kanji_samples.join(' / ')}`);
  } else {
    console.log(`  visible-text 未 ruby 漢字: 0`);
  }
  if (r.raw_en_issues > 0) {
    console.log(`  英語 in <small> でクラス無し: ${r.raw_en_issues} 件`);
    for (const i of r.raw_en_samples) {
      console.log(`     - ${i.snippet.replace(/\n/g,' ')}`);
    }
  }
  console.log('');
}
