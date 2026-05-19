/**
 * master_image_registry.json と lesson_01.json/lesson_02.json の整合性監査
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\kohn0\\Desktop\\japanese-lesson-creator-main';
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'master_image_registry.json'), 'utf8'));
const l01 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lesson_01.json'), 'utf8'));
const l02 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lesson_02.json'), 'utf8'));

const entries = reg.entries || {};
const allKeys = Object.keys(entries);
const vocabKeys = allKeys.filter(k => k.startsWith('vocab_'));
const wordKeys = allKeys.filter(k => k.startsWith('word_'));
const charKeys = allKeys.filter(k => k.startsWith('char_'));
const exKeys = allKeys.filter(k => /^ex_L\d+_/.test(k));
const otherKeys = allKeys.filter(k =>
  !k.startsWith('vocab_') && !k.startsWith('word_') &&
  !k.startsWith('char_') && !/^ex_L\d+_/.test(k)
);

console.log('=== Registry key categories ===');
console.log(`  Total entries: ${allKeys.length}`);
console.log(`  vocab_* keys: ${vocabKeys.length}`);
vocabKeys.forEach(k => console.log(`    - ${k}`));
console.log(`  word_* keys: ${wordKeys.length}`);
wordKeys.forEach(k => console.log(`    - ${k}`));
console.log(`  char_* keys: ${charKeys.length}  (touched: NO)`);
console.log(`  ex_L*_* keys: ${exKeys.length}  (touched: NO)`);
console.log(`  other keys: ${otherKeys.length}  ${otherKeys.length > 0 ? '(' + otherKeys.join(', ') + ')' : ''}`);

console.log('\n=== 重複: 同じ語に vocab_X と word_X が両方存在するか ===');
const wordSet = new Set(wordKeys.map(k => k.replace(/^word_/, '')));
const vocabSet = new Set(vocabKeys.map(k => k.replace(/^vocab_/, '')));
const dup = [...wordSet].filter(w => vocabSet.has(w));
if (dup.length === 0) console.log('  なし');
else dup.forEach(w => console.log(`  - "${w}" : vocab_${w} と word_${w} が両方存在 (要 dedupe)`));

console.log('\n=== lesson_01.json の imageId 参照を registry と照合 ===');
const refIds = [];
/* vocabulary */
const byPat = l01.vocabulary && l01.vocabulary.byPattern || {};
for (const [groupKey, grp] of Object.entries(byPat)) {
  for (const w of grp.words || []) {
    if (w.imageId) refIds.push({ where: `vocabulary.${groupKey}.${w.word}`, id: w.imageId });
  }
}
/* examples */
for (const pat of l01.patterns || []) {
  for (const ex of pat.examples || []) {
    if (ex.imageId) refIds.push({ where: `patterns.${pat.id}.ex_${ex.no}`, id: ex.imageId });
  }
}
/* namedCharacters */
for (const nc of l01.namedCharacters || []) {
  if (nc.imageId) refIds.push({ where: `namedCharacters.${nc.name}`, id: nc.imageId });
}

const missing = refIds.filter(r => !entries[r.id]);
console.log(`  lesson_01 imageId 参照: ${refIds.length} 件`);
console.log(`  registry に存在しない: ${missing.length} 件`);
missing.forEach(m => console.log(`    ✗ ${m.id}  (referenced from ${m.where})`));
if (missing.length === 0) console.log('  ✓ 全 imageId が registry に存在');

console.log('\n=== word_* キーが期待される位置で imageUrl が null か ===');
for (const k of wordKeys) {
  const e = entries[k];
  const url = e && e.images && e.images[0] && e.images[0].imageUrl;
  if (!url) console.log(`  ${k}: imageUrl = null (要確認)`);
}

console.log('\n=== lesson_02.json の vocab_* 参照 (移行対象あれば) ===');
const byPat2 = l02.vocabulary && l02.vocabulary.byPattern || {};
const refIds2 = [];
for (const [groupKey, grp] of Object.entries(byPat2)) {
  for (const w of grp.words || []) {
    if (w.imageId) refIds2.push({ where: `vocabulary.${groupKey}.${w.word}`, id: w.imageId });
  }
}
const l02Vocab = refIds2.filter(r => r.id.startsWith('vocab_'));
const l02Word  = refIds2.filter(r => r.id.startsWith('word_'));
console.log(`  lesson_02 imageId 参照: ${refIds2.length} 件 (vocab_* 始まり: ${l02Vocab.length}, word_* 始まり: ${l02Word.length})`);
const missing2 = refIds2.filter(r => !entries[r.id]);
console.log(`  registry に存在しない: ${missing2.length} 件`);
missing2.forEach(m => console.log(`    ✗ ${m.id}  (from ${m.where})`));
