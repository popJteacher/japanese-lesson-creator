/**
 * Stage 7-2 静的検証スクリプト（一時利用・完了後削除可）
 *
 * Node.js で window モックを用意して、ブラウザ実行と同等の流れで
 * SlideHtml.generate を呼び、HTML 内のマーカーで 12 項目を検証する。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';

// ── window モック ────────────────────────────────────────────
global.window = { EmbeddedData: { lessons: {} } };

// Blob ポリフィル（generate が返す）
global.Blob = class Blob {
  constructor(parts, options) { this._text = parts.join(''); this.type = (options && options.type) || ''; }
  async text() { return this._text; }
};

// document ポリフィル（slide_html.js は NAV_JS で document.* を使うが、
// それは生成された HTML 内で実行されるだけなので、Node 側では不要）。

// ── 埋め込みデータをロード ──────────────────────────────────
function loadJs(p) {
  const code = fs.readFileSync(p, 'utf8');
  const fn = new Function('window', code + '\n');
  fn(global.window);
}
loadJs(path.join(ROOT, 'data', 'lesson_01.js'));
loadJs(path.join(ROOT, 'data', 'lesson_02.js'));
loadJs(path.join(ROOT, 'data', 'activity_catalog.js'));
loadJs(path.join(ROOT, 'data', 'intro_activity_catalog.js'));
loadJs(path.join(ROOT, 'data', 'master_image_registry.js'));
loadJs(path.join(ROOT, 'data', 'master_audio_registry.js'));

// ── 共通モジュール ──────────────────────────────────────────
loadJs(path.join(ROOT, 'src', 'common', 'flow_synthesizer.js'));
loadJs(path.join(ROOT, 'src', 'common', 'image_resolver.js'));
loadJs(path.join(ROOT, 'src', 'common', 'ruby_dictionary.js'));
// NOTE: ruby_kuromoji.js は CDN/Node 非対応のため読み込まない。ruby() は RubyDict にフォールバック。

// slide_html.js
loadJs(path.join(ROOT, 'src', 'generators', 'slide_html.js'));

// ── session_001.json をロード ───────────────────────────────
const sessionBase = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'session_001.json'), 'utf8'));
// 動作確認チェックリスト #6 (アクティビティスライド: 活動名のみ) を検査するため、
// 検証時には mainActivities に 1 件入れた状態でテストする。
const session = JSON.parse(JSON.stringify(sessionBase));
session.mainActivities = [{ activityId: 'act_hajimemashite_conversation', minutes: 5 }];
const lesson = window.EmbeddedData.lessons[1];

// ── FlowSynthesizer.synthesize ──────────────────────────────
const synth = window.FlowSynthesizer.synthesize(lesson, session, window.EmbeddedData.activityCatalog);
const results = {};

results['item11_intro_activity_count'] = synth.resolvedFlow.filter((e) => e.type === 'intro_activity').length;
results['item12_warnings_length'] = synth.warnings.length;
results['item12_warnings'] = JSON.stringify(synth.warnings);
results['flow_types'] = synth.resolvedFlow.map((e) => e.type + (e.patternRef ? '(' + e.patternRef + ')' : '')).join(', ');
results['flow_length'] = synth.resolvedFlow.length;

// ── SlideHtml.generate ──────────────────────────────────────
const ctx = {
  session,
  lesson,
  lessonsByNo: { 1: lesson },
  activityCatalog: window.EmbeddedData.activityCatalog,
  introActivityCatalog: window.EmbeddedData.introActivityCatalog,
  imageRegistry: window.EmbeddedData.imageRegistry,
  resolvedFlow: synth.resolvedFlow,
  flowMeta: synth.flowMeta,
  warnings: synth.warnings,
  hasRequiredActivity: synth.hasRequiredActivity,
};

// ruby タグ(<rt>とラッパー)を取り除いて、ふりがなが挿入された後でも本文テキストを検索できるようにする。
function stripRuby(html) {
  return html.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<\/?ruby>/g, '');
}

window.SlideHtml.generate(ctx).then(async (blob) => {
  const html = await blob.text();

  // ── マーカーで各 item を検査 ──────────────────────────────
  const slideCount = (html.match(/<section class="slide/g) || []).length;
  results['item1_no_errors'] = 'ok (synthesize+generate 通過)';
  results['item2_slide_count'] = slideCount;

  // s3 = 表紙(1)+intro_slide(2)+intro_act_p1(3). intro_activity body には char_grid が出る (p1 layout = character_card_grid)
  results['item3_char_grid_exists'] = /<div class="char-grid">/.test(html);

  // s5 = 表紙(1)+intro_slide(2)+intro_act_p1(3)+pattern_p1(4)+example_p1(5).
  // 例文スライドで p1 のアンカー (鈴木さんは先生です) が表示され、p2/p3 例文が混入しないことを確認。
  // renderSentenceWithHighlight が文を <span> 分割するので、構成要素ごとに検索する。
  const exampleSlideMatch = html.match(/<section class="slide[^"]*" data-idx="4">[\s\S]*?<\/section>/);
  if (exampleSlideMatch) {
    const eSlide = stripRuby(exampleSlideMatch[0]);
    const hasSuzuki = /鈴木さん/.test(eSlide) && /先生です/.test(eSlide);
    const hasOther1_5 = /リンさん/.test(eSlide) && /大学生/.test(eSlide);
    const hasOther1_3 = /キムさん/.test(eSlide) && /会社員/.test(eSlide);
    results['item4_example_p1_has_suzuki'] = hasSuzuki;
    results['item4_example_p1_has_other_p1_examples'] = hasOther1_5 || hasOther1_3;
    results['item4_example_p1_no_p2_anchor_sentence'] = !/リンさんですか/.test(eSlide);
    results['item4_example_p1_no_p3_anchor_sentence'] = !/東西大学の学生/.test(eSlide);
  } else {
    results['item4_example_p1_check'] = 'slide idx=4 not found';
  }

  // s6 = practice_p1. practiceTemplates of p1 (わたしは　＿＿＿　です)
  const practiceSlideMatch = html.match(/<section class="slide[^"]*" data-idx="5">[\s\S]*?<\/section>/);
  if (practiceSlideMatch) {
    const pSlide = practiceSlideMatch[0];
    results['item5_practice_p1_has_template'] = /わたしは/.test(pSlide) || /さんは/.test(pSlide);
    results['item5_practice_p1_has_blank_box'] = /blank-box/.test(pSlide);
  } else {
    results['item5_practice_p1_check'] = 'slide idx=5 not found';
  }

  // item 6: main_activity slide - "アクティビティの時間" title, no detail
  const htmlStripped = stripRuby(html);
  results['item6_main_activity_simple_title'] = /アクティビティの時間/.test(htmlStripped);
  results['item6_no_playerExplanation_in_main_act'] = !/player-explain.*name|<div class="player-explain">/.test(html);

  // item 7: wrapUp summary anchor examples - 3 anchors expected
  results['item7_wrapup_has_anchor_section'] = /summary-anchor/.test(html);
  const anchorMatches = html.match(/class="summary-anchor"/g) || [];
  results['item7_wrapup_anchor_count'] = anchorMatches.length;
  // wrapUp の summary-anchor ブロックを ruby ストリップして検索
  const summaryAnchors = [...html.matchAll(/<div class="summary-anchor">([\s\S]*?)<\/div>/g)]
    .map((m) => stripRuby(m[1]))
    .join(' | ');
  results['item7_wrapup_anchor_suzuki'] = /鈴木さんは先生です/.test(summaryAnchors);
  results['item7_wrapup_anchor_p2'] = /先生ですか/.test(summaryAnchors);
  results['item7_wrapup_anchor_p3'] = /東西大学の学生/.test(summaryAnchors);

  // items 8, 9: toggles - check UI buttons exist (runtime behavior cannot be tested in Node)
  results['item8_furigana_toggle_button'] = /id="ruby-toggle"/.test(html);
  results['item9_en_toggle_button'] = /id="en-toggle"/.test(html);

  // item 10: vocab images use word_* (image URLs include drive.google references for word_医者, etc.)
  // The HTML should reference vocabCardHtml output with imageId='word_医者' which resolves via imageRegistry
  // to a URL. Check that vocab cards have <img> tags (= images resolved successfully)
  const vocabCardImgMatches = html.match(/<div class="vocab-card">\s*<img/g) || [];
  results['item10_vocab_cards_with_images'] = vocabCardImgMatches.length;
  results['item10_no_vocab_prefix_left'] = !/vocab_医者/.test(html); // 医者 hex
  results['item10_url_normalization'] = /lh3\.googleusercontent\.com/.test(html);

  // Print structured report
  console.log(JSON.stringify(results, null, 2));

  // ── 12 件チェックリスト判定 ─────────────────────────────
  const expectedSlideCount = 16;
  const passes = [
    { n: 1, ok: results['item1_no_errors'].startsWith('ok'), desc: 'フォームで p1/p2/p3 生成: エラーなし (synthesize+generate 完走)' },
    { n: 2, ok: slideCount === expectedSlideCount, desc: `スライド総枚数: ${slideCount}/${expectedSlideCount}` },
    { n: 3, ok: results['item3_char_grid_exists'], desc: 's3 導入アクティビティ p1: char-grid 描画' },
    { n: 4, ok: results['item4_example_p1_has_suzuki'] && results['item4_example_p1_has_other_p1_examples'] && results['item4_example_p1_no_p2_anchor_sentence'] && results['item4_example_p1_no_p3_anchor_sentence'], desc: 's5 例文 p1: p1 アンカー(鈴木さん+先生です) + 他 p1 例文有・p2/p3 アンカー混入なし' },
    { n: 5, ok: results['item5_practice_p1_has_template'] && results['item5_practice_p1_has_blank_box'], desc: 's6 練習 p1: テンプレ+空欄ボックス' },
    { n: 6, ok: results['item6_main_activity_simple_title'] && results['item6_no_playerExplanation_in_main_act'], desc: 'main_activity: 活動名のみ・playerExplanation なし' },
    { n: 7, ok: results['item7_wrapup_has_anchor_section'] && anchorMatches.length === 3 && results['item7_wrapup_anchor_suzuki'] && results['item7_wrapup_anchor_p2'] && results['item7_wrapup_anchor_p3'], desc: 'まとめ: アンカー例文 3 件表示 (p1/p2/p3)' },
    { n: 8, ok: results['item8_furigana_toggle_button'], desc: 'ふりがなトグルボタン存在 (動作確認はブラウザ側)' },
    { n: 9, ok: results['item9_en_toggle_button'], desc: '英語トグルボタン存在 (動作確認はブラウザ側)' },
    { n: 10, ok: vocabCardImgMatches.length > 0 && results['item10_url_normalization'], desc: '語彙画像: vocab-card + img タグ + lh3 URL 正規化' },
    { n: 11, ok: results['item11_intro_activity_count'] === 3, desc: `resolvedFlow に intro_activity が 3 件: ${results['item11_intro_activity_count']}` },
    { n: 12, ok: synth.warnings.length === 0, desc: `warnings 空配列: length=${synth.warnings.length}` },
  ];

  console.log('\n=== Stage 7-2 チェックリスト ===');
  let passed = 0;
  for (const p of passes) {
    const mark = p.ok ? '✓' : '✗';
    console.log(`  [${mark}] #${p.n}: ${p.desc}`);
    if (p.ok) passed++;
  }
  console.log(`\nPassed: ${passed} / 12`);
  if (passed === 12) console.log('Stage 7-2: ALL 12 PASS');
  else console.log('Stage 7-2: ' + (12 - passed) + ' FAIL');

  // 生成された HTML を一時保存して目視確認可能にする
  const outPath = path.join(ROOT, 'data', '_bak_20260515', '_stage7_generated_slides.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Generated HTML saved to:', outPath);
}).catch((err) => {
  console.error('SlideHtml.generate failed:', err);
  process.exit(1);
});
