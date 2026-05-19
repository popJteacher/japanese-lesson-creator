#!/usr/bin/env python3
"""
homework_html.js の以下 2 関数を新仕様に置換:
  - buildPatternSection: practiceImageSource 分岐 + 音声ボタン
  - buildVocabSection の 'vocab_' プレフィックス → 'word_*' に修正
  - main 内で ctx から audioRegistry を取り出し下流に渡す

Python で置換するのはファイル中に Private Use Area 文字(U+E000等)が
含まれていて Edit ツールの old_string マッチが効かないため。
"""
import re
import sys
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / 'src' / 'generators' / 'homework_html.js'

content = PATH.read_text(encoding='utf-8')

# ─────────────────────────────────────────────────────────────
# Replacement 1: buildPatternSection 全体を新仕様に置換
# 範囲: `function buildPatternSection(t, lesson, registryEntries) {` から
#       対応する閉じ `}` (関数の終わり) まで
# ─────────────────────────────────────────────────────────────
NEW_PATTERN_SECTION = r'''  /** vocabulary.byPattern からこの文型用の語彙を集める。
   *  shareVocabWith があれば優先して参照先の文型を見る。 */
  function collectVocabForPattern(lesson, pat) {
    const refPid = pat.shareVocabWith || pat.id;
    const groups = Object.values(lesson.vocabulary && lesson.vocabulary.byPattern || {})
      .filter((g) => (g.patternIds || []).includes(refPid));
    return groups.flatMap((g) => g.words || []);
  }

  /** practiceTemplate の '＿＿' を <input> に置換した HTML を作る。
   *  kuromoji の ruby 化と衝突しないよう、私用領域文字でプレースホルダー → ruby 後に戻す。 */
  function renderTemplate(tplText) {
    if (!tplText) return '';
    const PH_INPUT = '';
    const withPh = tplText.replace(/[_＿]{2,}/g, PH_INPUT);
    const rubied = ruby(withPh);
    return rubied.split(PH_INPUT).join('<input type="text" placeholder="">');
  }

  /** 1 つの練習エクササイズの HTML を組み立てる。
   *  images: [{ url, alt, label? }] の配列。1 件 → 単独画像、2 件 → 横並びで「＋」結合。
   *  audioUrl: 音声 URL or null (null は disabled ボタン)。
   *  audioLabel: ツールチップ用ラベル。 */
  function exerciseHtml({ index, images, templateHtml, audioUrl, audioLabel }) {
    const isPair = images.length >= 2;
    const wrapperCls = 'hint-images' + (isPair ? '' : ' single');
    let imagesHtml = '';
    if (isPair) {
      imagesHtml = `
        <div class="${wrapperCls}">
          <div class="hint-cell">
            ${imgHtml(images[0].url, images[0].alt)}
            ${images[0].label ? `<span class="hint-cell-label">${ruby(images[0].label)}</span>` : ''}
          </div>
          <span class="hint-plus">＋</span>
          <div class="hint-cell">
            ${imgHtml(images[1].url, images[1].alt)}
            ${images[1].label ? `<span class="hint-cell-label">${ruby(images[1].label)}</span>` : ''}
          </div>
        </div>
      `;
    } else if (images.length === 1) {
      imagesHtml = `
        <div class="${wrapperCls}">
          <div class="hint-cell">
            ${imgHtml(images[0].url, images[0].alt)}
            ${images[0].label ? `<span class="hint-cell-label">${ruby(images[0].label)}</span>` : ''}
          </div>
        </div>
      `;
    } else {
      imagesHtml = `<div class="${wrapperCls}"><span class="img-fallback">🖼️</span></div>`;
    }
    return `
      <div class="exercise hint-exercise">
        ${imagesHtml}
        <div class="question">
          <strong>${index}.</strong> ${templateHtml}
          ${audioBtnHtml(audioUrl, audioLabel, 'audio-btn-inline')}
        </div>
      </div>
    `;
  }

  /** patterns[].practiceImageSource に応じて練習問題群の HTML を生成する。
   *   - "vocabulary"            : 語彙 1 件ごと 1 問 (画像: word.imageId)
   *   - "namedCharacters"       : 名前付きキャラ 1 件ごと 1 問 (画像: char.imageId)
   *   - "namedCharacters+vocab" : 人物 × 建物 のペア (画像 2 つ横並び)
   *   - 未指定                  : 後方互換で "vocabulary" として扱う */
  function buildExercisesFor(pat, lesson, registryEntries, audioRegistry) {
    const tpl = (pat.practiceTemplates || [])[0];
    if (!tpl || !tpl.pattern) return '';
    const templateHtml = renderTemplate(tpl.pattern);
    const source = pat.practiceImageSource || 'vocabulary';

    if (source === 'namedCharacters' || source === 'namedCharacters+vocab') {
      const chars = (lesson.namedCharacters || []);
      if (chars.length === 0) return '';

      if (source === 'namedCharacters') {
        return chars.map((c, i) => exerciseHtml({
          index: i + 1,
          images: [{
            url: imgUrl(c.imageId, registryEntries, 256),
            alt: c.name || '',
            label: c.name || '',
          }],
          templateHtml,
          /* キャラクター名の音声(将来仕様・現状は audio registry に未収録 → グレーアウト) */
          audioUrl: audioUrlOf('char_' + (c.name || '').replace('さん', ''), audioRegistry),
          audioLabel: '人物名を聞く',
        })).join('');
      }

      /* namedCharacters+vocab: 人物 × 建物 のペアを max(N, M) 件並べる */
      const buildings = collectVocabForPattern(lesson, pat);
      if (buildings.length === 0) return '';
      const N = Math.max(chars.length, buildings.length);
      const out = [];
      for (let i = 0; i < N; i++) {
        const c = chars[i % chars.length];
        const b = buildings[i % buildings.length];
        const bImgId = b.imageId || ('word_' + (b.word || ''));
        out.push(exerciseHtml({
          index: i + 1,
          images: [
            { url: imgUrl(c.imageId, registryEntries, 256), alt: c.name || '', label: c.name || '' },
            { url: imgUrl(bImgId, registryEntries, 256),     alt: b.word || '', label: b.word || '' },
          ],
          templateHtml,
          audioUrl: audioUrlOf(b.audioId || bImgId, audioRegistry),
          audioLabel: '語彙の音声を聞く',
        }));
      }
      return out.join('');
    }

    /* デフォルト = vocabulary: その文型(またはshareVocabWith先)の語彙 1 件ごと 1 問 */
    const words = collectVocabForPattern(lesson, pat);
    if (words.length === 0) return '';
    return words.map((w, i) => {
      const imgId = w.imageId || ('word_' + (w.word || ''));
      return exerciseHtml({
        index: i + 1,
        images: [{ url: imgUrl(imgId, registryEntries, 256), alt: w.word || '', label: w.word || '' }],
        templateHtml,
        audioUrl: audioUrlOf(w.audioId || imgId, audioRegistry),
        audioLabel: (w.word || '') + ' を聞く',
      });
    }).join('');
  }

  function buildPatternSection(t, lesson, registryEntries, audioRegistry) {
    const pat = (lesson.patterns || []).find((p) => p.id === t.patternId);
    if (!pat) return '';

    /* 例文リスト (音声ボタンつき) */
    const examples = (pat.examples || []).map((ex) => {
      const url = imgUrl(ex.imageId, registryEntries, 256);
      const audioUrl = audioUrlOf(ex.audioId || ('sentence_' + (ex.imageId || '')), audioRegistry);
      return `
        <div class="example-row">
          <span class="no">${esc(ex.no || '')}</span>
          <div class="text">
            <div class="sentence">
              ${ruby(ex.sentence || '')}
              ${audioBtnHtml(audioUrl, '例文を聞く', 'audio-btn-inline')}
            </div>
            ${ex.sentenceEn ? `<div class="en en-text">${esc(ex.sentenceEn)}</div>` : ''}
          </div>
          ${imgHtml(url, ex.no || '', 'example-img')}
        </div>
      `;
    }).join('');

    /* 練習問題 (practiceImageSource で画像種類を分岐) */
    const exercises = buildExercisesFor(pat, lesson, registryEntries, audioRegistry);

    const labelEn = formatGrammarConcept(pat.grammarConcept, pat.jlptLevel);
    return `
      <section class="lesson-section">
        <h2>${ruby('文型')} ${esc(pat.id)}: ${ruby(pat.label || pat.pattern || '')}</h2>
        <div class="section-h2-en en-text">Pattern ${esc(pat.id)}${labelEn ? ' — ' + esc(labelEn) : ''}</div>

        ${pat.canDo ? `
        <div class="can-do">
          <span class="label">できるようになること</span>
          <span class="en-text" style="font-size: var(--font-size-caption); color: var(--color-text-muted); display: block; margin-bottom: 4px;">Can-do</span>
          ${ruby(pat.canDo)}
          ${pat.canDoEn ? `<span class="can-do-en en-text">${esc(pat.canDoEn)}</span>` : (labelEn ? `<span class="can-do-en en-text">${esc(labelEn)}</span>` : '')}
        </div>` : ''}

        ${examples ? `<h3>${ruby('例文')}を ${ruby('読')}んでみよう</h3>
        <div class="section-h3-en en-text">Read the example sentences</div>
        <div class="example-list">${examples}</div>` : ''}

        ${exercises ? `<h3>${ruby('練習問題')} (${ruby('絵')}を ${ruby('見')}て ${ruby('文')}を ${ruby('完成')}させよう)</h3>
        <div class="section-h3-en en-text">Practice exercises — look at the picture and complete the sentence</div>
        <div class="exercise-list">${exercises}</div>` : ''}
      </section>
    `;
  }'''

# 旧 buildPatternSection をまるごと置換するために、開始位置から閉じカッコまで取得
start_pat = re.compile(r'  function buildPatternSection\(t, lesson, registryEntries\) \{')
m = start_pat.search(content)
if not m:
    print('ERROR: buildPatternSection が見つからない', file=sys.stderr)
    sys.exit(1)

start = m.start()
# 関数末尾の `}` を見つける: ブレースを数えて対応閉じを探す
i = m.end()
depth = 1
n = len(content)
in_str = None  # ' or " or `
escape = False
while i < n and depth > 0:
    c = content[i]
    if in_str:
        if escape:
            escape = False
        elif c == '\\':
            escape = True
        elif c == in_str:
            in_str = None
        i += 1
        continue
    if c in ("'", '"', '`'):
        in_str = c
        i += 1
        continue
    if c == '{':
        depth += 1
    elif c == '}':
        depth -= 1
        if depth == 0:
            i += 1
            break
    i += 1
end = i

old_func = content[start:end]
print(f'[info] buildPatternSection found: {start}..{end} ({len(old_func)} chars)')
content = content[:start] + NEW_PATTERN_SECTION + content[end:]

# ─────────────────────────────────────────────────────────────
# Replacement 2: buildVocabSection の 'vocab_' プレフィックス → 'word_*' 化
# ─────────────────────────────────────────────────────────────
# 旧: imgUrl('vocab_' + w.word, registryEntries, 256)
# 新: imgUrl(w.imageId || ('word_' + (w.word || '')), registryEntries, 256)
before = content
content = content.replace(
    "imgUrl('vocab_' + w.word, registryEntries, 256)",
    "imgUrl(w.imageId || ('word_' + (w.word || '')), registryEntries, 256)"
)
if content == before:
    print('[warn] buildVocabSection の vocab_ プレフィックス置換: 該当箇所なし(既に修正済みかも)')
else:
    print('[info] buildVocabSection の vocab_ プレフィックスを word_* に置換')

# ─────────────────────────────────────────────────────────────
# Replacement 3: buildHtml/buildPatternSection 呼び出し側で audioRegistry を渡す
# ─────────────────────────────────────────────────────────────
# 旧 ctx destructuring: `const { session, lesson, lessonsByNo, imageRegistry } = ctx;`
# 新: ↑ + audioRegistry
content = content.replace(
    'const { session, lesson, lessonsByNo, imageRegistry } = ctx;',
    'const { session, lesson, lessonsByNo, imageRegistry, audioRegistry } = ctx;'
)

# 旧 buildPatternSection 呼び出し: `return buildPatternSection(t, sourceLesson, registryEntries);`
# 新: + audioRegistry
content = content.replace(
    'return buildPatternSection(t, sourceLesson, registryEntries);',
    'return buildPatternSection(t, sourceLesson, registryEntries, audioRegistry);'
)

# ─────────────────────────────────────────────────────────────
# Replacement 4: _meta.version を 0.2 に
# ─────────────────────────────────────────────────────────────
content = content.replace(
    "_meta: { version: '0.1', createdAt: '2026-05-13' },",
    "_meta: { version: '0.2-practiceImageSource-audio', createdAt: '2026-05-15' },"
)

PATH.write_text(content, encoding='utf-8', newline='\n')
print(f'[done] wrote {PATH}')
