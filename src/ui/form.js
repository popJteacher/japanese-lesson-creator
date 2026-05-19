/**
 * form.js
 * -----------------------------------------------------------------------------
 * 「フォームで作成」タブの UI ロジック。
 * 入力値から session_NNN.json 相当のオブジェクトを組み立て、
 * window.LessonCreator.run(session) に渡して既存の生成エンジンを起動する。
 *
 * 依存:
 *   - window.EmbeddedData.lessons[N]   (data/lesson_NN.js)
 *   - window.EmbeddedData.activityCatalog (data/activity_catalog.js)
 *   - window.LessonCreator.run(session)   (src/main.js)
 *
 * 設計メモ:
 *   - main.js には session.flow[] バイパス経路があるため、本フォームが組み立てた
 *     session の flow[] はそのまま resolvedFlow として採用される。
 *     ステージ並び替え・全 minutes 編集が直接反映される。
 *   - 文型ステージは選択中の patternId ごとに 1 件ずつ自動生成(stage="文型①/②/③...")。
 *   - アクティビティステージは選択件数 1+ のときのみ表示。複数選択時は
 *     session.mainActivities[] に全 ID を入れ、flow には単一の type="activity" を入れる。
 */
'use strict';

(function () {
  // ── 定数 ──────────────────────────────────────────────────────────────
  const STAGE_DEFAULTS = {
    intro:    { name: '導入',         type: 'intro',    minutes: 3,  defaultEnabled: true,  materials: 'スライド',         content: '今日のテーマ・学習目標を提示する。' },
    pattern:  { name: '文型',         type: 'pattern',  minutes: 15, defaultEnabled: true,  materials: 'スライド・絵カード', content: '文型説明 → 語彙提示(発音練習含む)。モデル→リピート。' },
    example:  { name: '例文',         type: 'example',  minutes: 7,  defaultEnabled: true,  materials: 'スライド',         content: '文型の例文をまとめて確認する。' },
    practice: { name: '練習しよう',   type: 'practice', minutes: 8,  defaultEnabled: true,  materials: 'スライド',         content: '穴埋めテンプレートで口頭練習。' },
    activity: { name: 'アクティビティ', type: 'activity', minutes: 12, defaultEnabled: true,  materials: 'ワークシート',     content: '選択したアクティビティを実施する。' },
    wrapUp:   { name: 'まとめ',       type: 'wrapUp',   minutes: 5,  defaultEnabled: true,  materials: '',                content: '振り返り・宿題説明。' },
    review:   { name: '復習',         type: 'review',   minutes: 5,  defaultEnabled: false, materials: 'スライド',         content: '前回までの復習。' },
  };

  // 数字記号(文型①②③...)
  const CIRCLE_NUMS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

  // ── DOM 参照 ──────────────────────────────────────────────────────────
  const tabs = document.querySelectorAll('.tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const studentIdEl = document.getElementById('form-student-id');
  const dateEl = document.getElementById('form-date');
  const durationEl = document.getElementById('form-duration');
  const patternsListEl = document.getElementById('patterns-list');
  const activitiesListEl = document.getElementById('activities-list');
  const filterLevelEl = document.getElementById('filter-level');
  const filterStageEl = document.getElementById('filter-stage');
  const stagesListEl = document.getElementById('stages-list');
  const stagesTotalEl = document.getElementById('stages-total');
  const errorEl = document.getElementById('form-error');
  const generateBtn = document.getElementById('generate-btn');
  const downloadBtn = document.getElementById('download-session-btn');

  // ── 内部状態 ──────────────────────────────────────────────────────────
  // patterns: [{ lessonNo, patternId, label, level, indexInLesson }]
  let allPatterns = [];
  // activities: [{ id, name, duration, description, level[], stage[] }]
  let allActivities = [];
  // 選択状態
  const selectedPatterns = new Set(); // key: "lessonNo:patternId"
  const selectedActivities = new Set(); // value: activityId
  // フィルタ状態
  let levelFilter = 'all';
  let stageFilter = 'all';
  // ステージ配列(順序を保持・ドラッグで並び替え)
  // 各要素: { key, type, name, enabled, minutes, patternRef?, materials, content }
  let stages = [];

  // ── データ読み込み ────────────────────────────────────────────────────
  function loadData() {
    const ed = window.EmbeddedData;
    if (!ed) {
      showError('内蔵データ(data/*.js)が読み込まれていません。');
      return false;
    }
    // patterns
    const lessons = ed.lessons || {};
    Object.keys(lessons)
      .map((k) => Number(k))
      .sort((a, b) => a - b)
      .forEach((no) => {
        const lesson = lessons[no];
        const patterns = (lesson && lesson.patterns) || [];
        patterns.forEach((p, idx) => {
          allPatterns.push({
            lessonNo: no,
            patternId: p.id,
            label: p.label || p.pattern || p.id,
            level: p.jlptLevel || '',
            indexInLesson: idx,
          });
        });
      });
    // activities
    const catalog = ed.activityCatalog;
    const acts = (catalog && catalog.activities) || [];
    allActivities = acts.map((a) => ({
      id: a.id,
      name: a.name || a.id,
      duration: a.duration || '',
      description: a.description || '',
      level: Array.isArray(a.level) ? a.level : [],
      stage: Array.isArray(a.stage) ? a.stage : [],
      contentRequirement: a.contentRequirement || null,
    }));
    return true;
  }

  // ── タブ切り替え ──────────────────────────────────────────────────────
  function setupTabs() {
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        tabs.forEach((t) => t.classList.toggle('active', t === tab));
        tabPanels.forEach((p) => {
          p.classList.toggle('active', p.id === `tab-${target}`);
        });
      });
    });
  }

  // ── 文型リスト描画 ────────────────────────────────────────────────────
  function renderPatterns() {
    patternsListEl.innerHTML = '';
    allPatterns.forEach((p) => {
      const key = `${p.lessonNo}:${p.patternId}`;
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = key;
      cb.checked = selectedPatterns.has(key);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedPatterns.add(key);
        else selectedPatterns.delete(key);
        rebuildStages();
        renderStages();
        updateTotal();
      });
      const text = document.createElement('span');
      const circle = CIRCLE_NUMS[p.indexInLesson] || `(${p.indexInLesson + 1})`;
      text.textContent = `第${p.lessonNo}課${circle} ${p.label}${p.level ? `(${p.level})` : ''}`;
      label.appendChild(cb);
      label.appendChild(text);
      patternsListEl.appendChild(label);
    });
  }

  // ── アクティビティリスト描画 ─────────────────────────────────────────
  function renderActivities() {
    activitiesListEl.innerHTML = '';
    const filtered = allActivities.filter((a) => {
      if (levelFilter !== 'all' && !a.level.includes(levelFilter)) return false;
      if (stageFilter !== 'all' && !a.stage.includes(stageFilter)) return false;
      return true;
    });
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.style.padding = '14px';
      empty.style.color = '#999';
      empty.style.fontSize = '0.85rem';
      empty.textContent = '該当するアクティビティがありません。';
      activitiesListEl.appendChild(empty);
      return;
    }
    filtered.forEach((a) => {
      const row = document.createElement('label');
      row.className = 'activity-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = a.id;
      cb.checked = selectedActivities.has(a.id);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedActivities.add(a.id);
        else selectedActivities.delete(a.id);
        rebuildStages();
        renderStages();
        updateTotal();
      });
      const name = document.createElement('span');
      name.className = 'a-name';
      name.textContent = a.name;
      const dur = document.createElement('span');
      dur.className = 'a-duration';
      dur.textContent = a.duration;
      const desc = document.createElement('span');
      desc.className = 'a-desc';
      desc.textContent = a.description;
      row.appendChild(cb);
      row.appendChild(name);
      if (a.duration) row.appendChild(dur);
      row.appendChild(desc);
      activitiesListEl.appendChild(row);
    });
  }

  function renderFilters() {
    const levels = ['all', 'N5', 'N4', 'N3', 'N2', 'N1'];
    const stagesF = ['all', 'stage1', 'stage2', 'stage3', 'stage4', 'stage5'];
    filterLevelEl.innerHTML = '<span class="filter-label">レベル:</span>';
    levels.forEach((l) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-btn' + (l === levelFilter ? ' active' : '');
      btn.textContent = l === 'all' ? '全て' : l;
      btn.addEventListener('click', () => {
        levelFilter = l;
        renderFilters();
        renderActivities();
      });
      filterLevelEl.appendChild(btn);
    });
    filterStageEl.innerHTML = '<span class="filter-label">段階:</span>';
    stagesF.forEach((s) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-btn' + (s === stageFilter ? ' active' : '');
      btn.textContent = s === 'all' ? '全て' : s;
      btn.addEventListener('click', () => {
        stageFilter = s;
        renderFilters();
        renderActivities();
      });
      filterStageEl.appendChild(btn);
    });
  }

  // ── ステージ配列の再構築 ─────────────────────────────────────────────
  // 文型選択・アクティビティ選択変更時に呼ぶ。
  // 既存ステージの enabled/minutes/順序はできるだけ保持する。
  function rebuildStages() {
    const prev = new Map(stages.map((s) => [s.key, s]));
    const next = [];

    // intro
    next.push(makeOrInherit(prev, 'intro', () => ({
      key: 'intro', type: 'intro', name: STAGE_DEFAULTS.intro.name,
      enabled: STAGE_DEFAULTS.intro.defaultEnabled,
      minutes: STAGE_DEFAULTS.intro.minutes,
      materials: STAGE_DEFAULTS.intro.materials,
      content: STAGE_DEFAULTS.intro.content,
    })));

    // pattern (選択順 = 表示順)
    const selectedPatternList = [];
    allPatterns.forEach((p) => {
      const key = `${p.lessonNo}:${p.patternId}`;
      if (selectedPatterns.has(key)) selectedPatternList.push(p);
    });
    selectedPatternList.forEach((p, i) => {
      const circle = CIRCLE_NUMS[i] || `(${i + 1})`;
      const key = `pattern:${p.lessonNo}:${p.patternId}`;
      next.push(makeOrInherit(prev, key, () => ({
        key, type: 'pattern',
        name: `文型${circle} ${p.label}`,
        enabled: STAGE_DEFAULTS.pattern.defaultEnabled,
        minutes: STAGE_DEFAULTS.pattern.minutes,
        materials: STAGE_DEFAULTS.pattern.materials,
        content: STAGE_DEFAULTS.pattern.content,
        patternRef: { lessonNo: p.lessonNo, patternId: p.patternId, stageLabel: `文型${circle}` },
      }), (existing) => {
        // 名前は表示位置によって変わるので再計算
        existing.name = `文型${circle} ${p.label}`;
        existing.patternRef = { lessonNo: p.lessonNo, patternId: p.patternId, stageLabel: `文型${circle}` };
        return existing;
      }));
    });

    // example
    next.push(makeOrInherit(prev, 'example', () => ({
      key: 'example', type: 'example', name: STAGE_DEFAULTS.example.name,
      enabled: STAGE_DEFAULTS.example.defaultEnabled,
      minutes: STAGE_DEFAULTS.example.minutes,
      materials: STAGE_DEFAULTS.example.materials,
      content: STAGE_DEFAULTS.example.content,
    })));

    // practice
    next.push(makeOrInherit(prev, 'practice', () => ({
      key: 'practice', type: 'practice', name: STAGE_DEFAULTS.practice.name,
      enabled: STAGE_DEFAULTS.practice.defaultEnabled,
      minutes: STAGE_DEFAULTS.practice.minutes,
      materials: STAGE_DEFAULTS.practice.materials,
      content: STAGE_DEFAULTS.practice.content,
    })));

    // activity (選択が 1+ のとき)
    if (selectedActivities.size > 0) {
      next.push(makeOrInherit(prev, 'activity', () => ({
        key: 'activity', type: 'activity', name: STAGE_DEFAULTS.activity.name,
        enabled: STAGE_DEFAULTS.activity.defaultEnabled,
        minutes: STAGE_DEFAULTS.activity.minutes,
        materials: STAGE_DEFAULTS.activity.materials,
        content: STAGE_DEFAULTS.activity.content,
      })));
    }

    // wrapUp
    next.push(makeOrInherit(prev, 'wrapUp', () => ({
      key: 'wrapUp', type: 'wrapUp', name: STAGE_DEFAULTS.wrapUp.name,
      enabled: STAGE_DEFAULTS.wrapUp.defaultEnabled,
      minutes: STAGE_DEFAULTS.wrapUp.minutes,
      materials: STAGE_DEFAULTS.wrapUp.materials,
      content: STAGE_DEFAULTS.wrapUp.content,
    })));

    // review (デフォルト OFF)
    next.push(makeOrInherit(prev, 'review', () => ({
      key: 'review', type: 'review', name: STAGE_DEFAULTS.review.name,
      enabled: STAGE_DEFAULTS.review.defaultEnabled,
      minutes: STAGE_DEFAULTS.review.minutes,
      materials: STAGE_DEFAULTS.review.materials,
      content: STAGE_DEFAULTS.review.content,
    })));

    // canonical 順 (next の生成順) で確定。
    // ユーザのドラッグ並び替えは「文型・アクティビティ選択を変えるたび」にリセットされる仕様。
    // (代わりに enabled / minutes は prev から継承される)
    stages = next;
  }

  function makeOrInherit(prevMap, key, makeFn, updateFn) {
    const existing = prevMap.get(key);
    if (existing) {
      return updateFn ? updateFn(existing) : existing;
    }
    return makeFn();
  }

  // ── ステージリスト描画 ────────────────────────────────────────────────
  function renderStages() {
    stagesListEl.innerHTML = '';
    stages.forEach((s, idx) => {
      const li = document.createElement('li');
      li.className = 'stage-item' + (s.enabled ? '' : ' disabled');
      li.draggable = true;
      li.dataset.idx = String(idx);

      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.textContent = '⋮⋮';
      li.appendChild(handle);

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = s.enabled;
      cb.addEventListener('change', () => {
        s.enabled = cb.checked;
        li.classList.toggle('disabled', !s.enabled);
        updateTotal();
      });
      li.appendChild(cb);

      const name = document.createElement('span');
      name.className = 'stage-name';
      name.textContent = s.name;
      li.appendChild(name);

      const mins = document.createElement('input');
      mins.type = 'number';
      mins.min = '0';
      mins.value = String(s.minutes);
      mins.addEventListener('input', () => {
        s.minutes = Number(mins.value) || 0;
        updateTotal();
      });
      li.appendChild(mins);

      const unit = document.createElement('span');
      unit.textContent = '分';
      li.appendChild(unit);

      // ドラッグ
      li.addEventListener('dragstart', (e) => {
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        document.querySelectorAll('.stage-item').forEach((el) => el.classList.remove('drag-over-target'));
      });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        document.querySelectorAll('.stage-item').forEach((el) => el.classList.remove('drag-over-target'));
        li.classList.add('drag-over-target');
      });
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        const to = Number(li.dataset.idx);
        if (Number.isFinite(from) && Number.isFinite(to) && from !== to) {
          const moved = stages.splice(from, 1)[0];
          stages.splice(to, 0, moved);
          renderStages();
          updateTotal();
        }
      });

      stagesListEl.appendChild(li);
    });
  }

  // ── 合計時間の表示更新 ────────────────────────────────────────────────
  function updateTotal() {
    const total = stages.reduce((sum, s) => sum + (s.enabled ? (Number(s.minutes) || 0) : 0), 0);
    const duration = Number(durationEl.value) || 0;
    const diff = total - duration;
    let label;
    let cls;
    if (diff === 0) {
      label = `合計: ${total}分 / ${duration}分(過不足なし)`;
      cls = 'ok';
    } else if (diff > 0) {
      label = `合計: ${total}分 / ${duration}分(${diff}分超過)`;
      cls = 'over';
    } else {
      label = `合計: ${total}分 / ${duration}分(${-diff}分余り)`;
      cls = 'under';
    }
    stagesTotalEl.className = 'stages-total ' + cls;
    stagesTotalEl.textContent = label;
  }

  // ── session オブジェクトの組み立て ────────────────────────────────────
  function buildSession() {
    const studentId = (studentIdEl.value || '').trim();
    const date = dateEl.value || todayStr();
    const duration = Number(durationEl.value) || 50;

    // teach[]
    const teach = [];
    allPatterns.forEach((p) => {
      const key = `${p.lessonNo}:${p.patternId}`;
      if (selectedPatterns.has(key)) {
        teach.push({
          lessonNo: p.lessonNo,
          patternId: p.patternId,
          isNew: true,
          vocabFilter: null,
          exampleFilter: null,
        });
      }
    });

    // mainActivities[]
    const mainActivities = Array.from(selectedActivities).map((id) => ({
      activityId: id,
      minutes: 0, // 個別 minutes は使わず、flow.activity の minutes を全体時間とする
    }));

    // session オブジェクト
    // 注: flow[] は生成しない。main.js で常に FlowSynthesizer.synthesize() 経由で
    //     lesson_NN.json の flow[] (SSOT) を解決し resolvedFlow として下流に渡す。
    const sessionId = `form_${date.replace(/-/g, '')}`;
    return {
      _meta: {
        formatVersion: '2.0',
        createdAt: todayStr(),
        generatedBy: 'form_ui',
      },
      session: {
        id: sessionId,
        no: 0,
        studentId,
        date,
        duration,
        status: 'planned',
      },
      teach,
      review: [],
      skipFlowIds: [],
      introActivityOverrides: [],
      mainActivities,
      output: {
        titlePrefix: sessionId,
        studentIdInFilename: studentId,
        files: [],
        github: { upload: false, subfolder: 'sessions' },
      },
    };
  }

  // ── バリデーション ────────────────────────────────────────────────────
  // returns { ok, blocking?: string, warning?: string }
  function validate() {
    const studentId = (studentIdEl.value || '').trim();
    if (!studentId) {
      return { ok: false, blocking: '学習者IDを入力してください。' };
    }
    if (selectedPatterns.size === 0) {
      return { ok: false, blocking: '文型を1つ以上選択してください。' };
    }
    const total = stages.reduce((sum, s) => sum + (s.enabled ? (Number(s.minutes) || 0) : 0), 0);
    const duration = Number(durationEl.value) || 50;
    if (total > duration) {
      return { ok: true, warning: `合計時間 ${total} 分が授業時間 ${duration} 分を超過しています。` };
    }
    return { ok: true };
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('show');
  }
  function clearError() {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }

  function todayStr() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  // ── アクション ────────────────────────────────────────────────────────
  function onGenerate() {
    clearError();
    const v = validate();
    if (!v.ok) {
      showError(v.blocking);
      return;
    }
    if (v.warning) {
      showError('注意: ' + v.warning + ' このまま生成します。');
    }
    const session = buildSession();
    if (!window.LessonCreator || typeof window.LessonCreator.run !== 'function') {
      showError('生成エンジン(main.js)が初期化されていません。');
      return;
    }
    window.LessonCreator.run(session).catch((err) => {
      console.error(err);
      showError('生成エラー: ' + err.message);
    });
  }

  function onDownloadSession() {
    clearError();
    if (!(studentIdEl.value || '').trim()) {
      showError('学習者IDを入力してください。');
      return;
    }
    const session = buildSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.session.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── 初期化 ───────────────────────────────────────────────────────────
  function init() {
    setupTabs();
    if (!loadData()) return;

    dateEl.value = todayStr();
    durationEl.addEventListener('input', updateTotal);

    renderPatterns();
    renderFilters();
    renderActivities();
    rebuildStages();
    renderStages();
    updateTotal();

    generateBtn.addEventListener('click', onGenerate);
    downloadBtn.addEventListener('click', onDownloadSession);

    console.log('[form] フォーム UI ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
