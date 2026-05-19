/**
 * main.js
 * -----------------------------------------------------------------------------
 * ファイルドロップ → JSON パース → flow_synthesizer 実行 → 各ジェネレーター呼び出し
 * → ダウンロードリンク表示までを担うエントリポイント。
 *
 * 依存:
 *   - window.FlowSynthesizer (src/common/flow_synthesizer.js)
 *   - window.LessonPlanDocx (src/generators/lesson_plan_docx.js)
 *   - data/lesson_NN.json / data/activity_catalog.json / data/master_image_registry.json
 *     (fetch で取得・GitHub Pages を想定した相対パス)
 *
 * Step 1 段階の実装:
 *   - 教案 docx のみ実装済み
 *   - スライド・宿題・アクティビティ HTML は今後の Step 1-4〜1-6 で追加
 */
'use strict';

(function () {
  // ── DOM 参照 ──────────────────────────────────────────────────────────
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const statusEl = document.getElementById('status');
  const downloadsEl = document.getElementById('downloads');
  const downloadListEl = document.getElementById('download-list');
  const debugEl = document.getElementById('debug-output');

  // ── ステータス表示ヘルパ ──────────────────────────────────────────────
  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = 'show ' + (kind || '');
  }

  function clearDownloads() {
    downloadListEl.innerHTML = '';
    downloadsEl.classList.remove('show');
  }

  function addDownload(filename, blob) {
    const url = URL.createObjectURL(blob);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.textContent = filename;
    li.appendChild(a);
    downloadListEl.appendChild(li);
    downloadsEl.classList.add('show');
  }

  // ── 内蔵データの取得 ──────────────────────────────────────────────────
  // 教師がダブルクリックで index.html を開けるよう、file:// でも動く実装。
  // 第一優先: window.EmbeddedData (data/*.js が <script> で読み込み済みなら入っている)。
  // フォールバック: fetch (http(s):// で開かれていて新しい lesson が _.js 化されていない場合)。
  async function loadLesson(lessonNo) {
    const embedded = window.EmbeddedData && window.EmbeddedData.lessons && window.EmbeddedData.lessons[lessonNo];
    if (embedded) return embedded;
    const padded = String(lessonNo).padStart(2, '0');
    const path = `data/lesson_${padded}.json`;
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      throw new Error(
        `lesson_${padded} が見つかりません。data/lesson_${padded}.js を生成 (python scripts/build-embedded-data.py) するか、ローカルサーバーで開いてください。詳細: ${err.message}`
      );
    }
  }

  async function loadActivityCatalog() {
    if (window.EmbeddedData && window.EmbeddedData.activityCatalog) {
      return window.EmbeddedData.activityCatalog;
    }
    try {
      const res = await fetch('data/activity_catalog.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      throw new Error(
        `activity_catalog が見つかりません。data/activity_catalog.js を生成するか、ローカルサーバーで開いてください。詳細: ${err.message}`
      );
    }
  }

  async function loadIntroActivityCatalog() {
    if (window.EmbeddedData && window.EmbeddedData.introActivityCatalog) {
      return window.EmbeddedData.introActivityCatalog;
    }
    try {
      const res = await fetch('data/intro_activity_catalog.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      // intro_activity_catalog は必須ではない(無くても intro_activity スライドはフォールバック描画される) → null フォールバック
      console.warn('[main] intro_activity_catalog が読めませんでした:', err.message);
      return null;
    }
  }

  async function loadImageRegistry() {
    if (window.EmbeddedData && window.EmbeddedData.imageRegistry) {
      return window.EmbeddedData.imageRegistry;
    }
    try {
      const res = await fetch('data/master_image_registry.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      // 画像レジストリは必須ではない (画像なしでも生成は可能) → null フォールバック
      console.warn('[main] master_image_registry が読めませんでした:', err.message);
      return null;
    }
  }

  async function loadAudioRegistry() {
    if (window.EmbeddedData && window.EmbeddedData.audioRegistry) {
      return window.EmbeddedData.audioRegistry;
    }
    try {
      const res = await fetch('data/master_audio_registry.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      // 音声レジストリは必須ではない(音声URL未設定でも生成は可能) → null フォールバック
      console.warn('[main] master_audio_registry が読めませんでした:', err.message);
      return null;
    }
  }

  // ── ファイル名プレフィックス組み立て ──────────────────────────────────
  // 設計書: {prefix} は session.output.titlePrefix と studentIdInFilename から組み立てる
  // 例: studentA_S001
  function buildFilenamePrefix(session) {
    const out = (session && session.output) || {};
    const titlePrefix = out.titlePrefix || (session.session && session.session.id) || 'session';
    const studentId = out.studentIdInFilename || (session.session && session.session.studentId) || '';
    if (studentId) {
      return `student${studentId}_${titlePrefix}`;
    }
    return titlePrefix;
  }

  // ── メイン処理 ────────────────────────────────────────────────────────
  async function processSessionFile(file) {
    setStatus(`${file.name} を読み込み中...`);
    let session;
    try {
      const text = await file.text();
      session = JSON.parse(text);
    } catch (err) {
      setStatus(`JSON パース失敗: ${err.message}`, 'error');
      return;
    }
    await processSession(session);
  }

  // フォーム UI など外部から session オブジェクトを直接渡せるエントリポイント。
  // window.LessonCreator.run として公開する。
  async function processSession(session) {
    clearDownloads();
    setStatus('読み込み中...');

    // kuromoji の初期化を待つ (初回は数秒、以降はキャッシュで高速)
    if (window.RubyKuromoji && !window.RubyKuromoji.isReady()) {
      setStatus('ふりがな辞書 (kuromoji) を初期化しています...初回のみ数秒かかります');
      try { await window.RubyKuromoji.ready; } catch (e) {}
    }

    if (!session || !session.session || !Array.isArray(session.teach)) {
      setStatus('session JSON の形式が不正です (session / teach[] が必要)', 'error');
      return;
    }

    // ── 必要な lesson_NN.json を集めて並列ロード
    const lessonNos = new Set();
    (session.teach || []).forEach((t) => t && t.lessonNo != null && lessonNos.add(t.lessonNo));
    (session.review || []).forEach((r) => r && r.lessonNo != null && lessonNos.add(r.lessonNo));
    if (lessonNos.size === 0) {
      setStatus('teach[] と review[] のどちらにも lessonNo が指定されていません', 'error');
      return;
    }

    let lessonsByNo;
    let activityCatalog;
    let introActivityCatalog;
    let imageRegistry;
    let audioRegistry;
    try {
      const lessonNosArr = Array.from(lessonNos);
      const [lessons, catalog, introCatalog, imgReg, audReg] = await Promise.all([
        Promise.all(lessonNosArr.map(loadLesson)),
        loadActivityCatalog(),
        loadIntroActivityCatalog(),
        loadImageRegistry(),
        loadAudioRegistry(),
      ]);
      lessonsByNo = {};
      lessonNosArr.forEach((no, i) => { lessonsByNo[no] = lessons[i]; });
      activityCatalog = catalog;
      introActivityCatalog = introCatalog;
      imageRegistry = imgReg;
      audioRegistry = audReg;
    } catch (err) {
      setStatus(`内蔵データの読み込みに失敗: ${err.message}`, 'error');
      return;
    }

    // ── flow_synthesizer 実行
    // 現状は teach[0].lessonNo の lesson を主軸とする(複数課対応は将来課題)。
    const primaryLessonNo = (session.teach[0] && session.teach[0].lessonNo) || Array.from(lessonNos)[0];
    const primaryLesson = lessonsByNo[primaryLessonNo];

    // 常に FlowSynthesizer.synthesize() を呼ぶ。lesson_NN.json の flow[] を SSOT とし、
    // session 側でのバイパス経路は廃止。session.flow[] フィールドは仕様上存在しない。
    let synthResult;
    try {
      synthResult = window.FlowSynthesizer.synthesize(primaryLesson, session, activityCatalog);
    } catch (err) {
      setStatus(`flow_synthesizer 実行エラー: ${err.message}`, 'error');
      return;
    }
    const { resolvedFlow, flowMeta, warnings, hasRequiredActivity } = synthResult;

    // デバッグ出力
    debugEl.textContent = JSON.stringify({
      flowMeta,
      hasRequiredActivity,
      warnings,
      resolvedFlow,
    }, null, 2);
    console.log('[main] resolved flow:', { resolvedFlow, flowMeta, warnings, hasRequiredActivity });

    // ── 各ジェネレーターを呼び出し
    const prefix = buildFilenamePrefix(session);
    const ctx = {
      session,
      lesson: primaryLesson,
      lessonsByNo,
      activityCatalog,
      introActivityCatalog,
      imageRegistry,
      audioRegistry,
      resolvedFlow,
      flowMeta,
      warnings,
      hasRequiredActivity,
    };

    const generated = [];

    // 1. 教案 docx (Step 1-3 で実装)
    if (window.LessonPlanDocx && typeof window.LessonPlanDocx.generate === 'function') {
      try {
        const blob = await window.LessonPlanDocx.generate(ctx);
        const filename = `${prefix}_教案.docx`;
        addDownload(filename, blob);
        generated.push(filename);
      } catch (err) {
        console.error(err);
        setStatus(`教案 docx 生成エラー: ${err.message}`, 'error');
        return;
      }
    }

    // 2. スライド HTML
    if (window.SlideHtml && typeof window.SlideHtml.generate === 'function') {
      try {
        const blob = await window.SlideHtml.generate(ctx);
        const filename = `${prefix}_スライド.html`;
        addDownload(filename, blob);
        generated.push(filename);
      } catch (err) {
        console.error(err);
        setStatus(`スライド HTML 生成エラー: ${err.message}`, 'error');
        return;
      }
    }

    // 3. 宿題 HTML
    if (window.HomeworkHtml && typeof window.HomeworkHtml.generate === 'function') {
      try {
        const blob = await window.HomeworkHtml.generate(ctx);
        const filename = `${prefix}_宿題.html`;
        addDownload(filename, blob);
        generated.push(filename);
      } catch (err) {
        console.error(err);
        setStatus(`宿題 HTML 生成エラー: ${err.message}`, 'error');
        return;
      }
    }

    // 4. アクティビティ HTML (hasRequiredActivity 時のみ・selectedId 取得失敗時は generate が null を返す)
    if (
      hasRequiredActivity &&
      window.ActivityHtml &&
      typeof window.ActivityHtml.generate === 'function'
    ) {
      try {
        const blob = await window.ActivityHtml.generate(ctx);
        if (blob) {
          const filename = `${prefix}_アクティビティ.html`;
          addDownload(filename, blob);
          generated.push(filename);
        } else {
          console.log('[main] アクティビティ HTML スキップ: 選択された活動が無い、または required activity ではない');
        }
      } catch (err) {
        console.error(err);
        setStatus(`アクティビティ HTML 生成エラー: ${err.message}`, 'error');
        return;
      }
    }

    // ── 完了表示
    const warnSummary = warnings && warnings.length > 0
      ? `\n警告 ${warnings.length} 件: ` + warnings.map((w) => w.code).join(', ')
      : '';
    const status = `生成完了 (${generated.length} ファイル)${warnSummary}`;
    setStatus(status, warnings.length > 0 ? 'warn' : 'ok');
  }

  // ── ドロップ・クリックのイベントハンドラ ──────────────────────────────
  function handleFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setStatus('JSON ファイルをドロップしてください', 'error');
      return;
    }
    processSessionFile(file).catch((err) => {
      console.error(err);
      setStatus(`予期しないエラー: ${err.message}`, 'error');
    });
  }

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });

  ['dragenter', 'dragover'].forEach((ev) => {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((ev) => {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // ── 外部公開 (フォーム UI などから利用)
  window.LessonCreator = {
    run: processSession,
  };

  // ── 起動メッセージ
  console.log('[main] 教材生成ツール ready');
})();
