/**
 * lesson_plan_docx.js
 * -----------------------------------------------------------------------------
 * 教案 docx 生成。教師が事前確認・授業中参照に使う。
 *
 * 入力 (ctx):
 *   - session            : 教師がアップロードした session_NNN.json
 *   - lesson             : 主軸となる lesson_NN.json (teach[0].lessonNo)
 *   - lessonsByNo        : { [lessonNo]: lesson_NN.json } 複数課対応
 *   - activityCatalog    : activity_catalog.json
 *   - imageRegistry      : master_image_registry.json (任意・docx では使用しない)
 *   - resolvedFlow       : flow_synthesizer の出力 flow[]
 *   - flowMeta           : { totalMinutes, allocatedMinutes, remainingMinutes, status }
 *   - warnings           : flow_synthesizer の警告
 *   - hasRequiredActivity: アクティビティ.html を生成するか
 *
 * 出力: docx Blob (Open XML / .docx)
 *
 * 依存: window.JSZip
 *
 * 設計判断 (rev 2):
 *   docx-js (8.x / 9.x) の UMD/IIFE ビルドは生成 zip の CDR オフセットが壊れていて
 *   Word・Python zipfile・PowerShell Expand-Archive のいずれも開けない。
 *   JSZip で読み直して再パックする workaround も壊れた中身を引き継いでしまうため
 *   解決にならない。よって docx-js を完全に外し、OOXML(WordprocessingML)を
 *   手書きで組み立て、JSZip で zip 化するアプローチに切替。
 *
 *   構成は次の最小ファイルセット:
 *     [Content_Types].xml
 *     _rels/.rels
 *     word/document.xml
 *     word/styles.xml
 *     word/_rels/document.xml.rels
 *
 *   フォントは日本語環境の Word に標準搭載されている Yu Gothic を指定する。
 *   (rFonts に ascii / eastAsia / hAnsi / cs を全部書くことで CJK と ASCII の
 *    両方に確実に Yu Gothic を適用できる。)
 *
 *   設計方針:
 *     - 純粋にデータ駆動。lesson / session の値だけを参照し、外部 I/O はしない。
 *     - 教師がそのまま Word で開いて編集できる構成にする。
 *     - 箇条書きは <w:numPr> ではなく "・" プレフィクスで実装(numbering.xml 不要)。
 */
'use strict';

(function () {
  if (typeof window === 'undefined') return;

  // 日本語フォント (Word / Word for Mac で標準搭載)
  const FONT_JP = 'Yu Gothic';

  // ── Step 8 status の日本語ラベル ─────────────────────────────────────
  const STATUS_LABELS = {
    ok: '時間ぴったり',
    under_allocated: '時間が余る',
    over_allocated_by_design: '時間オーバー(設計上)',
  };

  // ============================================================================
  // SECTION 1: XML エスケープ + 共通プリミティブ
  // ============================================================================

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Run (1 つの書式付きテキスト断片)
   * @param {string} text
   * @param {Object} [opts] { size, bold, color }
   *   size: half-points (22 = 11pt)
   *   color: hex without #
   */
  function run(text, opts) {
    opts = opts || {};
    const sz = opts.size || 22;
    const color = opts.color || '222222';
    const bold = opts.bold ? '<w:b/><w:bCs/>' : '';
    return (
      '<w:r><w:rPr>' +
      `<w:rFonts w:ascii="${FONT_JP}" w:eastAsia="${FONT_JP}" w:hAnsi="${FONT_JP}" w:cs="${FONT_JP}"/>` +
      `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>` +
      `<w:color w:val="${color}"/>` +
      bold +
      '</w:rPr>' +
      `<w:t xml:space="preserve">${esc(text)}</w:t>` +
      '</w:r>'
    );
  }

  /** 段落 */
  function para(text, opts) {
    opts = opts || {};
    const styleId = opts.styleId ? `<w:pStyle w:val="${opts.styleId}"/>` : '';
    const align = opts.alignment ? `<w:jc w:val="${opts.alignment}"/>` : '';
    const before = opts.spacingBefore != null ? opts.spacingBefore : 80;
    const after = opts.spacingAfter != null ? opts.spacingAfter : 80;
    const spacing = `<w:spacing w:before="${before}" w:after="${after}"/>`;
    let body;
    if (Array.isArray(text)) {
      body = text.join('');
    } else {
      body = run(text, opts);
    }
    return `<w:p><w:pPr>${styleId}${align}${spacing}</w:pPr>${body}</w:p>`;
  }

  function h1(text) {
    return (
      '<w:p><w:pPr><w:pStyle w:val="Heading1"/>' +
      '<w:spacing w:before="240" w:after="120"/></w:pPr>' +
      run(text, { bold: true, size: 32 }) +
      '</w:p>'
    );
  }

  function h2(text) {
    return (
      '<w:p><w:pPr><w:pStyle w:val="Heading2"/>' +
      '<w:spacing w:before="200" w:after="100"/></w:pPr>' +
      run(text, { bold: true, size: 26 }) +
      '</w:p>'
    );
  }

  function h3(text) {
    return (
      '<w:p><w:pPr><w:pStyle w:val="Heading3"/>' +
      '<w:spacing w:before="160" w:after="80"/></w:pPr>' +
      run(text, { bold: true, size: 24 }) +
      '</w:p>'
    );
  }

  /** 箇条書きは "・" プレフィクス + 左インデント(numbering.xml 不要) */
  function bullet(text) {
    return (
      '<w:p><w:pPr>' +
      '<w:spacing w:before="40" w:after="40"/>' +
      '<w:ind w:left="360" w:hanging="360"/>' +
      '</w:pPr>' +
      run('・' + (text == null ? '' : String(text))) +
      '</w:p>'
    );
  }

  /** 空行 */
  function emptyLine() {
    return '<w:p><w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr></w:p>';
  }

  // ============================================================================
  // SECTION 2: テーブル構築
  // ============================================================================

  /**
   * Table cell.
   * @param {string} text
   * @param {Object} [opts] { width: percent (1-100), header: bool, alignment: 'left'|'center'|'right' }
   */
  function tableCell(text, opts) {
    opts = opts || {};
    // <w:tcW w:type="pct"> uses 50ths of a percent: 5000 = 100%, 1250 = 25%
    const w = opts.width
      ? `<w:tcW w:w="${opts.width * 50}" w:type="pct"/>`
      : '<w:tcW w:w="0" w:type="auto"/>';
    const fill = opts.header
      ? '<w:shd w:val="clear" w:color="auto" w:fill="EAEFF7"/>'
      : '';
    const align = opts.alignment ? `<w:jc w:val="${opts.alignment}"/>` : '';
    const runFrag = run(text, { bold: !!opts.header, size: 20 });
    const p =
      '<w:p><w:pPr>' +
      `<w:spacing w:before="40" w:after="40"/>${align}` +
      '</w:pPr>' +
      runFrag +
      '</w:p>';
    return `<w:tc><w:tcPr>${w}${fill}</w:tcPr>${p}</w:tc>`;
  }

  function tableRow(cells, opts) {
    opts = opts || {};
    const header = opts.header ? '<w:trPr><w:tblHeader/></w:trPr>' : '';
    return `<w:tr>${header}${cells.join('')}</w:tr>`;
  }

  /** Table 全体ラッパ。共通の罫線 + 100% 幅。 */
  function table(rowsXml) {
    return (
      '<w:tbl>' +
      '<w:tblPr>' +
      '<w:tblW w:w="5000" w:type="pct"/>' +
      '<w:tblBorders>' +
      '<w:top w:val="single" w:sz="4" w:space="0" w:color="888888"/>' +
      '<w:left w:val="single" w:sz="4" w:space="0" w:color="888888"/>' +
      '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="888888"/>' +
      '<w:right w:val="single" w:sz="4" w:space="0" w:color="888888"/>' +
      '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="888888"/>' +
      '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="888888"/>' +
      '</w:tblBorders>' +
      '<w:tblLayout w:type="autofit"/>' +
      '</w:tblPr>' +
      rowsXml.join('') +
      '</w:tbl>'
    );
  }

  function buildFlowTable(resolvedFlow) {
    const headerRow = tableRow(
      [
        tableCell('#', { header: true, width: 6, alignment: 'center' }),
        tableCell('段階', { header: true, width: 22 }),
        tableCell('時間', { header: true, width: 10, alignment: 'center' }),
        tableCell('教材', { header: true, width: 20 }),
        tableCell('内容', { header: true, width: 42 }),
      ],
      { header: true }
    );

    let visibleIdx = 0;
    const rows = [headerRow];
    resolvedFlow.forEach((entry) => {
      const skipped = entry.skipped === true;
      visibleIdx += 1;
      const stage = entry.stage || entry.type || entry.id || '';
      const minutes = skipped
        ? '—'
        : entry.minutes != null
        ? `${entry.minutes}分`
        : '—';
      const materials = entry.materials || '';
      const content =
        entry.content ||
        (entry.activityId ? `アクティビティ: ${entry.activityId}` : '') ||
        (entry.patternId ? `文型 ${entry.patternId}` : '') ||
        (entry.patternRef ? `文型 ${entry.patternRef} 導入` : '') ||
        '';
      rows.push(
        tableRow([
          tableCell(String(visibleIdx), { alignment: 'center' }),
          tableCell(skipped ? `${stage}(スキップ)` : stage),
          tableCell(minutes, { alignment: 'center' }),
          tableCell(materials),
          tableCell(content),
        ])
      );
    });
    return table(rows);
  }

  // ============================================================================
  // SECTION 3: セクション組み立て (string XML 連結ベース)
  // ============================================================================

  function buildHeader(session, lesson) {
    const s = session.session || {};
    const l = lesson.lesson || {};
    const out = [
      h1(`第${l.no || '?'}課 教案: ${l.title || ''}（${l.topic || ''}）`),
    ];

    const meta = [
      ['学習者ID', s.studentId || '—'],
      ['セッション ID', s.id || '—'],
      ['日付', s.date || '—'],
      ['授業時間', s.duration ? `${s.duration} 分` : '—'],
      ['レベル', l.level || '—'],
      ['対象', l.target || '—'],
      ['ステータス', s.status || '—'],
    ];
    const rows = meta.map(([k, v]) =>
      tableRow([
        tableCell(k, { header: true, width: 25 }),
        tableCell(v, { width: 75 }),
      ])
    );
    out.push(table(rows));
    out.push(emptyLine());
    return out;
  }

  function buildLearningGoals(session, lessonsByNo) {
    const out = [h2('学習目標 (Can-Do)')];
    const teach = session.teach || [];
    if (teach.length === 0) {
      out.push(para('（teach[] が空のためアクティビティ中心の授業）'));
      return out;
    }
    teach.forEach((t) => {
      const lesson = lessonsByNo[t.lessonNo];
      if (!lesson) return;
      const pat = (lesson.patterns || []).find((p) => p.id === t.patternId);
      if (!pat) return;
      const newMark = t.isNew ? '【新出】' : '【既習】';
      const label = `${newMark} 第${t.lessonNo}課 ${pat.id}: ${pat.label || pat.pattern || ''}`;
      out.push(para([run(label, { bold: true })]));
      if (pat.canDo) out.push(bullet(pat.canDo));
      const meta = [
        pat.jlptLevel ? `JLPT: ${pat.jlptLevel}` : null,
        pat.grammarConcept ? `文法概念: ${pat.grammarConcept}` : null,
      ]
        .filter(Boolean)
        .join('  /  ');
      if (meta) out.push(bullet(meta));
    });
    return out;
  }

  function buildGrammarMemo(lesson) {
    const out = [];
    const memo = (lesson.lesson && lesson.lesson.grammarMemo) || lesson.grammarMemo;
    if (!memo) return out;
    out.push(h2('文法メモ'));
    if (memo.general) out.push(para(memo.general));
    if (memo.teacherNotes) {
      out.push(h3('教師メモ'));
      out.push(para(memo.teacherNotes));
    }
    if (Array.isArray(memo.references) && memo.references.length > 0) {
      out.push(h3('参考資料'));
      memo.references.forEach((ref) => {
        const text = ref.label
          ? ref.type
            ? `${ref.label}（${ref.type}）`
            : ref.label
          : JSON.stringify(ref);
        out.push(bullet(text));
      });
    }
    return out;
  }

  function buildFlowSection(resolvedFlow, flowMeta) {
    const summary = `合計時間: ${flowMeta.totalMinutes} 分　/　配分: ${flowMeta.allocatedMinutes} 分　/　残: ${flowMeta.remainingMinutes} 分　/　ステータス: ${STATUS_LABELS[flowMeta.status] || flowMeta.status}`;
    return [
      h2('授業フロー'),
      para(summary, { size: 20, color: '555555' }),
      emptyLine(),
      buildFlowTable(resolvedFlow),
      emptyLine(),
    ];
  }

  function buildPatternDetails(session, lessonsByNo) {
    const out = [h2('文型ごとの詳細')];
    const teach = session.teach || [];
    if (teach.length === 0) {
      out.push(para('（teach[] が空のため省略）'));
      return out;
    }
    teach.forEach((t) => {
      const lesson = lessonsByNo[t.lessonNo];
      if (!lesson) return;
      const pat = (lesson.patterns || []).find((p) => p.id === t.patternId);
      if (!pat) return;

      out.push(h3(`第${t.lessonNo}課 ${pat.id}: ${pat.label || pat.pattern || ''}`));

      if (Array.isArray(pat.examples) && pat.examples.length > 0) {
        out.push(para([run('例文:', { bold: true, size: 22 })]));
        pat.examples.forEach((ex) => {
          const no = ex.no ? `(${ex.no}) ` : '';
          const en = ex.sentenceEn ? `  — ${ex.sentenceEn}` : '';
          out.push(bullet(`${no}${ex.sentence || ''}${en}`));
        });
      }
      if (Array.isArray(pat.practiceTemplates) && pat.practiceTemplates.length > 0) {
        out.push(para([run('練習テンプレート:', { bold: true, size: 22 })]));
        pat.practiceTemplates.forEach((tpl) => {
          const hint = tpl.hint ? `  ${tpl.hint}` : '';
          out.push(bullet(`${tpl.pattern || ''}${hint}`));
        });
      }
      if (Array.isArray(pat.plusAlpha) && pat.plusAlpha.length > 0) {
        out.push(para([run('プラスα(発展・補足):', { bold: true, size: 22 })]));
        pat.plusAlpha.forEach((s) => out.push(bullet(s)));
      }
      if (Array.isArray(pat.note) && pat.note.length > 0) {
        out.push(para([run('注意点:', { bold: true, size: 22 })]));
        pat.note.forEach((s) => out.push(bullet(s)));
      }
      out.push(emptyLine());
    });
    return out;
  }

  function buildVocabSection(lesson, session) {
    const out = [];
    const vocab = lesson.vocabulary;
    if (!vocab || !vocab.byPattern) return out;
    const teachIds = new Set((session.teach || []).map((t) => t.patternId));
    const groups = Object.entries(vocab.byPattern).filter(([_, g]) =>
      (g.patternIds || []).some((id) => teachIds.has(id))
    );
    if (groups.length === 0) return out;

    out.push(h2('語彙'));
    groups.forEach(([key, group]) => {
      out.push(
        h3(
          `${key} (${(group.patternIds || []).join(', ')}) — ${
            group.vocabCount || (group.words || []).length
          } 語`
        )
      );
      if (group.description) out.push(para(group.description, { size: 20, color: '555555' }));

      const rows = [
        tableRow(
          [
            tableCell('語', { header: true, width: 30 }),
            tableCell('読み', { header: true, width: 30 }),
            tableCell('英訳', { header: true, width: 40 }),
          ],
          { header: true }
        ),
        ...(group.words || []).map((w) =>
          tableRow([
            tableCell(w.word || ''),
            tableCell(w.reading || ''),
            tableCell(w.en || ''),
          ])
        ),
      ];
      out.push(table(rows));
      out.push(emptyLine());
    });
    return out;
  }

  function buildActivitySection(resolvedFlow, activityCatalog) {
    const out = [];
    if (!activityCatalog || !Array.isArray(activityCatalog.activities)) return out;
    const used = resolvedFlow
      .filter(
        (e) =>
          !e.skipped &&
          (e.type === 'intro_activity' || e.type === 'main_activity') &&
          e.activityId
      )
      .map((e) => ({
        entry: e,
        activity: activityCatalog.activities.find((a) => a.id === e.activityId),
      }))
      .filter((p) => p.activity);
    if (used.length === 0) return out;

    out.push(h2('使用アクティビティ詳細'));
    used.forEach(({ entry, activity }) => {
      out.push(h3(`${entry.stage || entry.id}: ${activity.name || activity.id}`));
      if (activity.description) out.push(para(activity.description));
      if (activity.duration) {
        out.push(bullet(`目安時間: ${activity.duration}`));
      }
      if (Array.isArray(activity.procedure) && activity.procedure.length > 0) {
        out.push(para([run('手順:', { bold: true, size: 22 })]));
        activity.procedure.forEach((s, i) => out.push(bullet(`${i + 1}. ${s}`)));
      }
      if (
        activity.playerExplanation &&
        (activity.playerExplanation.ja || activity.playerExplanation.en)
      ) {
        out.push(para([run('学習者への説明:', { bold: true, size: 22 })]));
        if (activity.playerExplanation.ja) out.push(bullet(activity.playerExplanation.ja));
        if (activity.playerExplanation.en) out.push(bullet(activity.playerExplanation.en));
      }
      if (activity.teacherTip) {
        out.push(para([run('教師ヒント:', { bold: true, size: 22 })]));
        out.push(bullet(activity.teacherTip));
      }
      out.push(emptyLine());
    });
    return out;
  }

  function buildWarningsSection(warnings) {
    if (!warnings || warnings.length === 0) return [];
    const out = [h2('警告')];
    warnings.forEach((w) => {
      out.push(bullet(`[${w.code}] ${w.ja || w.en || ''}`));
    });
    return out;
  }

  // ============================================================================
  // SECTION 4: パッケージ構成 (固定 XML 部品)
  // ============================================================================

  function buildDocumentXml(bodyXml) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' +
      bodyXml +
      '<w:sectPr>' +
      '<w:pgSz w:w="11906" w:h="16838"/>' + // A4 portrait, twips
      '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>' + // 2cm margins
      '</w:sectPr>' +
      '</w:body>' +
      '</w:document>'
    );
  }

  const CONTENT_TYPES_XML =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '</Types>';

  const RELS_XML =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>';

  const DOC_RELS_XML =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  const STYLES_XML =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:docDefaults>' +
    '<w:rPrDefault><w:rPr>' +
    `<w:rFonts w:ascii="${FONT_JP}" w:eastAsia="${FONT_JP}" w:hAnsi="${FONT_JP}" w:cs="${FONT_JP}"/>` +
    '<w:sz w:val="22"/><w:szCs w:val="22"/>' +
    '</w:rPr></w:rPrDefault>' +
    '<w:pPrDefault><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr></w:pPrDefault>' +
    '</w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">' +
    '<w:name w:val="Normal"/></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading1">' +
    '<w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>' +
    '<w:pPr><w:outlineLvl w:val="0"/></w:pPr>' +
    '<w:rPr><w:b/><w:bCs/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading2">' +
    '<w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>' +
    '<w:pPr><w:outlineLvl w:val="1"/></w:pPr>' +
    '<w:rPr><w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading3">' +
    '<w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>' +
    '<w:pPr><w:outlineLvl w:val="2"/></w:pPr>' +
    '<w:rPr><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>' +
    '</w:styles>';

  // ============================================================================
  // SECTION 5: 公開 API
  // ============================================================================

  async function generate(ctx) {
    if (typeof window.JSZip !== 'function') {
      throw new Error('JSZip が読み込まれていません');
    }

    const {
      session,
      lesson,
      lessonsByNo,
      activityCatalog,
      resolvedFlow,
      flowMeta,
      warnings,
    } = ctx;

    const body =
      buildHeader(session, lesson).join('') +
      buildLearningGoals(session, lessonsByNo).join('') +
      buildGrammarMemo(lesson).join('') +
      buildFlowSection(resolvedFlow, flowMeta).join('') +
      buildPatternDetails(session, lessonsByNo).join('') +
      buildVocabSection(lesson, session).join('') +
      buildActivitySection(resolvedFlow, activityCatalog).join('') +
      buildWarningsSection(warnings).join('');

    const documentXml = buildDocumentXml(body);

    const zip = new window.JSZip();
    // ファイルを追加 (createFolders:false で親ディレクトリエントリを生成しない)
    zip.file('[Content_Types].xml', CONTENT_TYPES_XML, { createFolders: false });
    zip.file('_rels/.rels', RELS_XML, { createFolders: false });
    zip.file('word/document.xml', documentXml, { createFolders: false });
    zip.file('word/styles.xml', STYLES_XML, { createFolders: false });
    zip.file('word/_rels/document.xml.rels', DOC_RELS_XML, { createFolders: false });

    return await zip.generateAsync({
      type: 'blob',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // STORE (無圧縮) で発行する。
      // JSZip 3.10.1 の DEFLATE は OOXML のように繰り返しの多い XML を圧縮すると
      // ストリームが壊れる既知問題があり (Python zlib が "invalid distance too far back")、
      // Word は開けるものの厳格な zip 検証ツールでは validation に通らない。
      // 教案 docx は 5 KB 級の小さな zip なので STORE で十分。
      compression: 'STORE',
    });
  }

  // ── エクスポート ─────────────────────────────────────────────────────
  window.LessonPlanDocx = {
    generate,
    _meta: {
      version: '0.2',
      createdAt: '2026-05-13',
      strategy: 'manual-ooxml + JSZip',
    },
  };
})();
