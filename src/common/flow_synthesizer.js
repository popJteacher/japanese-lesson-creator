/**
 * flow_synthesizer.js
 * -----------------------------------------------------------------------------
 * session 合成アルゴリズム中核(C+B ハイブリッド自動化方針)。
 * lesson_NN.json の flow[] と session_NNN.json の差分から、
 * 最終 resolvedFlow[] を生成する純粋関数群。
 *
 * 生成元:
 *   - SKILL.md v1.4 §session 合成アルゴリズム(8 ステップ)
 *   - lesson_01.json v2.6 flow[] / session_001.json v1.0 を入力サンプルとして検証
 *   - handoff_stage1_task6_kickoff.md v1.0(全 9 つの設計判断の正本)
 *
 * 生成日: 2026-05-12 (Stage 1 タスク 6)
 *
 * 設計方針:
 *   - 8 ステップ合成アルゴリズム(SKILL.md v1.4)を純粋関数として実装
 *   - 入力(lesson / session / activityCatalog)は破壊しない(deep clone)
 *   - ブラウザ(window.FlowSynthesizer)と Node.js(module.exports)両対応
 *     → C+B ハイブリッド方針(SKILL.md v1.4)で将来 B 案(Node スクリプト)へ移行可
 *   - WARN は中断しない(warnings 配列に記録して続行)
 *   - activityCatalog 引数は任意(省略時は hasRequiredActivity: false)
 *   - WARN メッセージは日本語 + 英語併記(Q3 確定)
 *   - teach[] は任意・空配列許容(QⅠ-1 / SKILL.md v1.5 で正式化)
 *
 * 公開 API:
 *   FlowSynthesizer.synthesize(lesson, session, activityCatalog?)
 *     → { resolvedFlow, flowMeta, warnings, hasRequiredActivity }
 *
 * 重要(SKILL.md v1.4 §伝播チェーンルール):
 *   - 起点 E(SKILL.md の仕様変更)時の下流確認対象。
 *   - 本ファイルを変更したらナレッジ再アップロード必須(shared/ 配下 = 全 session 影響)。
 *
 * 参照資料:
 *   - SKILL.md v1.4 §session 合成アルゴリズム
 *   - SKILL.md v1.5 §teach[] 任意化(本タスクで反映)
 *   - handoff_stage1_task6_kickoff.md v1.0(全設計判断の正本)
 *
 * 採用しなかった代替案:
 *   - 案A(全 activity を resolvedFlow に展開): data.js が肥大化、下流テンプレ層の責務を侵食
 *   - 案B(activityCatalog を一切参照しない): 「アクティビティ.html を生成するか」の
 *     判定が下流に依存し、データ駆動の原則(data.js だけ見れば足りる)が崩れる
 *   → 採用: 案C(中間案)・hasRequiredActivity フラグのみセット(QⅡ-1 確定)
 */
'use strict';

// ============================================================================
// SECTION 1: 定数定義
// ============================================================================
// 内部 step ID(デバッグ・トレース用)と WARN コードの多言語メッセージマップ。
// ----------------------------------------------------------------------------

/** 8 ステップの内部 step ID(将来のデバッグ拡張用に予約) */
const STEP_IDS = Object.freeze({
  STEP1_LOAD_BASE: 'step1_load_base',
  STEP2_FILTER_TEACH: 'step2_filter_teach',
  STEP3_APPLY_SKIP: 'step3_apply_skip',
  STEP4_INTRO_OVERRIDES: 'step4_intro_overrides',
  STEP5_REPLACE_MAIN: 'step5_replace_main',
  STEP6_PREPEND_REVIEW: 'step6_prepend_review',
  STEP7_RESOLVE_MINUTES: 'step7_resolve_minutes',
  STEP8_COMPUTE_META: 'step8_compute_meta',
});

/**
 * WARN コードと多言語メッセージマップ。
 * {id} などの placeholder は emitWarning() で展開される。
 */
const WARN_MESSAGES = Object.freeze({
  SKIP_NON_OPTIONAL: {
    ja: "optional:false のエントリ '{id}' がスキップされました(session.skipFlowIds による指示)",
    en: "Entry '{id}' (optional:false) was skipped due to session.skipFlowIds",
  },
  NO_ACTIVITY_CATALOG: {
    ja: "activityCatalog が指定されていません。hasRequiredActivity の判定はできません",
    en: "activityCatalog not provided. hasRequiredActivity cannot be determined",
  },
  ACTIVITY_NOT_IN_CATALOG: {
    ja: "activityId '{id}' が activityCatalog に見つかりません",
    en: "activityId '{id}' not found in activityCatalog",
  },
  TEACH_EMPTY: {
    ja: "teach[] が空配列です(アクティビティ中心レッスンとして合成します)",
    en: "teach[] is empty (synthesizing as activity-centered lesson)",
  },
});

/** review エントリのデフォルト時間(目安値・session 側で上書き可) */
const DEFAULT_REVIEW_MINUTES = 5;

/** lesson._recommendedDuration / session.duration いずれも未指定時の最終フォールバック */
const FALLBACK_TOTAL_MINUTES = 50;

// ============================================================================
// SECTION 2: ヘルパー関数(内部)
// ============================================================================
// deep clone / WARN 発出 / console 出力。
// ----------------------------------------------------------------------------

/**
 * オブジェクトの deep clone。
 * 入力(lesson / session / activityCatalog)を破壊しないために使用する。
 * 純粋な JSON 構造のみを想定(関数・循環参照は含まない)。
 *
 * @param {*} obj clone 対象
 * @returns {*} clone されたオブジェクト
 */
function deepClone(obj) {
  if (obj === null || obj === undefined) return obj;
  // structuredClone は Node.js 17+/モダンブラウザで利用可。フォールバックも用意。
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * テンプレート文字列の {key} を params オブジェクトの値で置換する。
 *
 * @param {string} template "Entry '{id}' was skipped" のような文字列
 * @param {Object<string, string>} params { id: "practice" } のようなマップ
 * @returns {string} 置換済み文字列
 */
function _formatMessage(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * WARN を warnings 配列に追記する(Q3: 日本語 + 英語併記)。
 *
 * @param {Array<Object>} warnings 蓄積配列
 * @param {string} code WARN_MESSAGES のキー(SKIP_NON_OPTIONAL 等)
 * @param {Object<string, string>} [params] メッセージ内 placeholder 展開用
 */
function emitWarning(warnings, code, params) {
  const tmpl = WARN_MESSAGES[code];
  if (!tmpl) {
    // 未知の code は安全側に倒して文字列を残す(クラッシュさせない)
    warnings.push({ code: code, ja: code, en: code, params: params || {} });
    return;
  }
  warnings.push({
    code: code,
    ja: _formatMessage(tmpl.ja, params),
    en: _formatMessage(tmpl.en, params),
    params: params || {},
  });
}

/**
 * console.warn に WARN を出力する(オプショナル・デバッグ用)。
 * 通常は warnings 配列に蓄積するが、即時の可視化が必要な場合に呼べる。
 * 現状の synthesize() からは呼んでいない(将来の verbose モード用に予約)。
 *
 * @param {string} code WARN_MESSAGES のキー
 * @param {Object<string, string>} [params]
 */
function logWarn(code, params) {
  const tmpl = WARN_MESSAGES[code];
  if (!tmpl) {
    if (typeof console !== 'undefined') console.warn('[FlowSynthesizer WARN]', code, params);
    return;
  }
  const ja = _formatMessage(tmpl.ja, params);
  const en = _formatMessage(tmpl.en, params);
  if (typeof console !== 'undefined') {
    console.warn(`[FlowSynthesizer WARN] ${ja} / ${en}`);
  }
}

// ============================================================================
// SECTION 3: Step 1-8 の純粋関数
// ============================================================================
// 各ステップは前ステップの出力 flow を受け取り、新しい flow を返す。
// 入力は破壊しない(必要に応じて deep clone)。
// ----------------------------------------------------------------------------

/**
 * Step 1: lesson_NN.flow をベースとして読み込む。
 * 後続ステップが破壊できるよう deep clone を返す。
 *
 * @param {Object} lesson lesson_NN.json の全体オブジェクト
 * @returns {Array<Object>} clone された flow 配列
 * @throws {Error} lesson が無効・lesson.flow が配列でない場合
 */
function _step1_loadBaseFlow(lesson) {
  if (!lesson || typeof lesson !== 'object') {
    throw new Error('lesson is required (object)');
  }
  if (!Array.isArray(lesson.flow)) {
    throw new Error('lesson.flow is required (array)');
  }
  return deepClone(lesson.flow);
}

/**
 * Step 2: teach[] に書かれていない patternId 関連エントリを除外。
 * Q2 確定(案A): patternId / patternRef を持つエントリのみ除外対象。
 * teach[] が空配列の場合、全 patternId/Ref 関連エントリが除外される(QⅠ-1 / 自然動作)。
 *
 * @param {Array<Object>} flow Step 1 の出力
 * @param {Array<Object>} teach session.teach (例: [{lessonNo:1, patternId:"p1"}])
 * @param {Array<Object>} warnings WARN 蓄積配列
 * @returns {Array<Object>} 除外後の flow
 */
function _step2_filterByTeach(flow, teach, warnings) {
  const teachPatternIds = (teach || []).map((t) => t && t.patternId).filter(Boolean);

  // teach[] が空の場合は WARN(INFO 相当)を記録: アクティビティ中心レッスンとして合成
  if (teachPatternIds.length === 0) {
    emitWarning(warnings, 'TEACH_EMPTY');
  }

  return flow.filter((entry) => {
    const pid = entry.patternId || entry.patternRef;
    if (!pid) return true; // patternId/Ref を持たないエントリは除外対象外
    return teachPatternIds.includes(pid);
  });
}

/**
 * Step 3: skipFlowIds[] に含まれる flow[].id を除外。
 * optional:false のエントリを除外する場合は WARN を出力して続行。
 *
 * @param {Array<Object>} flow Step 2 の出力
 * @param {Array<string>} skipFlowIds session.skipFlowIds
 * @param {Array<Object>} warnings WARN 蓄積配列
 * @returns {Array<Object>} 除外後の flow
 */
function _step3_applySkipFlowIds(flow, skipFlowIds, warnings) {
  const skipSet = new Set(skipFlowIds || []);
  return flow.filter((entry) => {
    if (!skipSet.has(entry.id)) return true;
    if (entry.optional === false) {
      emitWarning(warnings, 'SKIP_NON_OPTIONAL', { id: entry.id });
    }
    return false;
  });
}

/**
 * Step 4: introActivityOverrides[] で type=intro_activity エントリを上書き。
 * 上書き可能フィールド: activityId / minutes / materialNeeds。
 * lesson 側の _recommendedMinutes は参考値として保持し、上書き値は minutes(実値)に代入。
 *
 * @param {Array<Object>} flow Step 3 の出力
 * @param {Array<Object>} overrides session.introActivityOverrides
 * @param {Array<Object>} warnings WARN 蓄積配列
 * @returns {Array<Object>} 上書き後の flow
 */
function _step4_applyIntroActivityOverrides(flow, overrides, warnings) {
  const overrideMap = new Map();
  for (const ov of overrides || []) {
    if (ov && ov.patternId) {
      overrideMap.set(ov.patternId, ov);
    }
  }

  return flow.map((entry) => {
    if (entry.type !== 'intro_activity') return entry;
    const pid = entry.patternRef || entry.patternId;
    const ov = overrideMap.get(pid);
    if (!ov) return entry;

    const next = Object.assign({}, entry);
    if (ov.activityId !== undefined) next.activityId = ov.activityId;
    if (ov.minutes !== undefined) next.minutes = ov.minutes; // 実値
    if (ov.materialNeeds !== undefined) next.materialNeeds = ov.materialNeeds;
    return next;
  });
}

/**
 * Step 5: main_activity エントリを mainActivities[] で置き換え。
 * mainActivities[] が空の場合は lesson の main_activity を維持(skipped:true のまま)。
 * 新規生成時の id は連番命名("main_act_1", "main_act_2", ...)(Q4 確定)。
 * 挿入位置: wrapUp の直前。wrapUp がなければ末尾。
 *
 * @param {Array<Object>} flow Step 4 の出力
 * @param {Array<Object>} mainActivities session.mainActivities
 * @param {Array<Object>} warnings WARN 蓄積配列
 * @returns {Array<Object>} 置換後の flow
 */
function _step5_replaceMainActivities(flow, mainActivities, warnings) {
  if (!mainActivities || mainActivities.length === 0) {
    return flow; // lesson の main_activity を維持(skipped:true のまま)
  }

  // 既存の main_activity エントリを削除
  const filtered = flow.filter((e) => e.type !== 'main_activity');

  // mainActivities[] の内容で新規エントリ生成
  const newEntries = mainActivities.map((ma, idx) => ({
    id: `main_act_${idx + 1}`,
    type: 'main_activity',
    stage: 'アクティビティ(メイン)',
    activityId: ma.activityId,
    _recommendedMinutes: ma.minutes,
    minutes: ma.minutes,
    optional: true,
    skipped: false,
    materialNeeds: ma.materialNeeds || [],
  }));

  // 挿入位置: wrapUp の直前 / wrapUp がなければ末尾
  const wrapUpIdx = filtered.findIndex((e) => e.type === 'wrapUp');
  if (wrapUpIdx === -1) {
    return [...filtered, ...newEntries];
  }
  return [
    ...filtered.slice(0, wrapUpIdx),
    ...newEntries,
    ...filtered.slice(wrapUpIdx),
  ];
}

/**
 * Step 6: review[] が空でない場合、flow 先頭に review エントリを追加。
 * 既存の review エントリ(lesson 由来・通常 skipped:true)があれば有効化して先頭に移動、
 * なければ新規生成して挿入。素材なし(口頭確認のみ・B-2/R-α)。
 *
 * @param {Array<Object>} flow Step 5 の出力
 * @param {Array<Object>} review session.review
 * @param {Array<Object>} warnings WARN 蓄積配列
 * @returns {Array<Object>} review 追加後の flow
 */
function _step6_prependReview(flow, review, warnings) {
  // session.review が array で空 → 既存 review エントリを skipped:true に上書きして抑制。
  // UI フォームで復習文型を未選択にしたとき、lesson_NN.json の review エントリ
  // (enabled:true / skipped:false でハードコード) がそのまま flow に残るのを防ぐ。
  if (Array.isArray(review) && review.length === 0) {
    return flow.map((e) => {
      if (e.type !== 'review') return e;
      return Object.assign({}, e, { skipped: true, enabled: false, minutes: 0 });
    });
  }
  if (!review || review.length === 0) return flow;

  const existingReviewIdx = flow.findIndex((e) => e.type === 'review');

  if (existingReviewIdx >= 0) {
    // 既存 review を有効化し、先頭に移動
    const reviewEntry = Object.assign({}, flow[existingReviewIdx]);
    reviewEntry.skipped = false;
    reviewEntry.enabled = true;
    reviewEntry.patterns = review.map((r) => r.patternId);
    // sourceLesson は review[0].lessonNo を採用(複数 lessonNo は将来拡張)
    reviewEntry.sourceLesson = review[0].lessonNo;
    // 既存の _recommendedMinutes が 0 なら DEFAULT_REVIEW_MINUTES に引き上げる
    if (!reviewEntry._recommendedMinutes || reviewEntry._recommendedMinutes === 0) {
      reviewEntry._recommendedMinutes = DEFAULT_REVIEW_MINUTES;
    }
    // minutes は Step 7 で確定するが、ここで先回りしてデフォルトを入れる
    if (reviewEntry.minutes === undefined || reviewEntry.minutes === null || reviewEntry.minutes === 0) {
      reviewEntry.minutes = reviewEntry._recommendedMinutes;
    }

    const rest = flow.filter((_, i) => i !== existingReviewIdx);
    return [reviewEntry, ...rest];
  }

  // 既存 review がない場合: 新規生成して先頭に挿入
  const newReview = {
    id: 'review', // Q4 確定: lesson の id "review" を継承
    type: 'review',
    stage: '復習',
    _recommendedMinutes: DEFAULT_REVIEW_MINUTES,
    minutes: DEFAULT_REVIEW_MINUTES,
    enabled: true,
    optional: true,
    skipped: false,
    sourceLesson: review[0].lessonNo,
    patterns: review.map((r) => r.patternId),
    materials: 'スライド(口頭確認のみ・素材なし)',
    _note: 'B-2/R-α: review[] エントリ。素材なし。',
  };
  return [newReview, ...flow];
}

/**
 * Step 7: 各 flow エントリの minutes を確定。
 * - session で上書き済み(Step 4 / 5 / 6)はそのまま
 * - 未設定の場合は _recommendedMinutes をコピー(継承)
 * - skipped:true のエントリは minutes=0 に正規化(allocatedMinutes 計算と一貫させる)
 *
 * @param {Array<Object>} flow Step 6 の出力
 * @param {Object} lesson lesson_NN.json
 * @param {Object} session session_NNN.json
 * @param {Array<Object>} warnings WARN 蓄積配列
 * @returns {Array<Object>} minutes 確定後の flow
 */
function _step7_resolveMinutes(flow, lesson, session, warnings) {
  return flow.map((entry) => {
    const next = Object.assign({}, entry);

    if (next.skipped === true) {
      // skipped:true のエントリは時間 0 に正規化(Step 8 の集計と一貫)
      if (next.minutes === undefined || next.minutes === null) {
        next.minutes = 0;
      }
      return next;
    }

    // minutes が既に設定されている場合(Step 4/5/6 で上書き済み)はそのまま
    if (next.minutes === undefined || next.minutes === null) {
      next.minutes = next._recommendedMinutes != null ? next._recommendedMinutes : 0;
    }

    return next;
  });
}

/**
 * totalMinutes を決定する。session.duration を優先、なければ lesson._recommendedDuration。
 * 両者なしの場合は FALLBACK_TOTAL_MINUTES(50)。
 *
 * @param {Object} lesson lesson_NN.json
 * @param {Object} session session_NNN.json
 * @returns {number} totalMinutes
 */
function _resolveTotalMinutes(lesson, session) {
  // session.session.duration を優先
  if (session && session.session && typeof session.session.duration === 'number') {
    return session.session.duration;
  }
  // lesson.lesson._recommendedDuration を継承
  if (lesson && lesson.lesson && typeof lesson.lesson._recommendedDuration === 'number') {
    return lesson.lesson._recommendedDuration;
  }
  // 旧フォーマット(lesson.duration / lesson._recommendedDuration が top-level)への対応
  if (lesson && typeof lesson._recommendedDuration === 'number') {
    return lesson._recommendedDuration;
  }
  if (lesson && typeof lesson.duration === 'number') {
    return lesson.duration;
  }
  return FALLBACK_TOTAL_MINUTES;
}

/**
 * Step 8: flowMeta を再計算。
 * Q1 確定(厳密一致): remainingMinutes === 0 で ok / > 0 で under_allocated / < 0 で over_allocated_by_design。
 *
 * @param {Array<Object>} flow Step 7 の出力
 * @param {number} totalMinutes 全体時間
 * @param {Array<Object>} warnings WARN 蓄積配列
 * @returns {{totalMinutes:number, allocatedMinutes:number, remainingMinutes:number, status:string}}
 */
function _step8_computeFlowMeta(flow, totalMinutes, warnings) {
  let allocatedMinutes = 0;
  for (const entry of flow) {
    if (entry.skipped === true) continue;
    allocatedMinutes += entry.minutes || 0;
  }
  const remainingMinutes = totalMinutes - allocatedMinutes;

  let status;
  if (remainingMinutes === 0) status = 'ok';
  else if (remainingMinutes > 0) status = 'under_allocated';
  else status = 'over_allocated_by_design';

  return {
    totalMinutes: totalMinutes,
    allocatedMinutes: allocatedMinutes,
    remainingMinutes: remainingMinutes,
    status: status,
  };
}

// ============================================================================
// SECTION 4: hasRequiredActivity 判定
// ============================================================================
// QⅡ-1 確定(案C・中間案): activity_catalog.json を参照して、
// session.mainActivities[] のいずれかが contentRequirement.judgment === "required" なら true。
// 下流テンプレ層が「アクティビティ.html を生成するか」を data.js だけで判定できる。
// ----------------------------------------------------------------------------

/**
 * mainActivities[] と activityCatalog から hasRequiredActivity を判定する。
 *
 * @param {Array<Object>} mainActivities session.mainActivities
 * @param {Object|null|undefined} activityCatalog activity_catalog.json(任意)
 * @param {Array<Object>} warnings WARN 蓄積配列
 * @returns {boolean} いずれかの activity が judgment === "required" なら true
 */
function _detectHasRequiredActivity(mainActivities, activityCatalog, warnings) {
  // mainActivities[] が空なら判定不要(false)
  if (!mainActivities || mainActivities.length === 0) {
    return false;
  }

  // activityCatalog 未指定: WARN を発出して false を返す
  if (!activityCatalog || !Array.isArray(activityCatalog.activities)) {
    emitWarning(warnings, 'NO_ACTIVITY_CATALOG');
    return false;
  }

  for (const ma of mainActivities) {
    if (!ma || !ma.activityId) continue;
    const act = activityCatalog.activities.find((a) => a.id === ma.activityId);
    if (!act) {
      emitWarning(warnings, 'ACTIVITY_NOT_IN_CATALOG', { id: ma.activityId });
      continue;
    }
    if (act.contentRequirement && act.contentRequirement.judgment === 'required') {
      return true;
    }
  }
  return false;
}

// ============================================================================
// SECTION 5: 公開 API
// ============================================================================
// 8 ステップを順に実行し、{ resolvedFlow, flowMeta, warnings, hasRequiredActivity }
// を返す。引数チェックは最小限の防御コード(Q5 確定)。
// ----------------------------------------------------------------------------

/**
 * session 合成のエントリポイント。
 * lesson_NN.json と session_NNN.json の差分から resolvedFlow を生成し、
 * flowMeta(時間集計)と hasRequiredActivity フラグを返す。
 *
 * @param {Object} lesson lesson_NN.json の全体オブジェクト(flow[] を持つこと)
 * @param {Object} session session_NNN.json の全体オブジェクト
 * @param {Object} [activityCatalog] activity_catalog.json(任意・hasRequiredActivity 判定用)
 * @returns {{resolvedFlow: Array<Object>, flowMeta: Object, warnings: Array<Object>, hasRequiredActivity: boolean}}
 * @throws {Error} 必須引数が無効な場合
 *
 * @example
 *   const { resolvedFlow, flowMeta, warnings, hasRequiredActivity } =
 *     FlowSynthesizer.synthesize(lesson_01, session_001, activityCatalog);
 */
function synthesize(lesson, session, activityCatalog) {
  // ── 引数チェック(最小限の防御コード)
  if (!lesson || typeof lesson !== 'object') {
    throw new Error('lesson is required (object)');
  }
  if (!Array.isArray(lesson.flow)) {
    throw new Error('lesson.flow is required (array)');
  }
  if (!session || typeof session !== 'object') {
    throw new Error('session is required (object)');
  }
  // teach[] は任意(QⅠ-1 確定)・空配列も OK。配列でなければエラー。
  if (session.teach !== undefined && session.teach !== null && !Array.isArray(session.teach)) {
    throw new Error('session.teach must be an array (empty array allowed)');
  }

  const warnings = [];
  const teach = session.teach || [];
  const review = session.review || [];
  const skipFlowIds = session.skipFlowIds || [];
  const introActivityOverrides = session.introActivityOverrides || [];
  const mainActivities = session.mainActivities || [];

  // ── 8 ステップ実行
  let flow = _step1_loadBaseFlow(lesson);
  flow = _step2_filterByTeach(flow, teach, warnings);
  flow = _step3_applySkipFlowIds(flow, skipFlowIds, warnings);
  flow = _step4_applyIntroActivityOverrides(flow, introActivityOverrides, warnings);
  flow = _step5_replaceMainActivities(flow, mainActivities, warnings);
  flow = _step6_prependReview(flow, review, warnings);
  flow = _step7_resolveMinutes(flow, lesson, session, warnings);

  const totalMinutes = _resolveTotalMinutes(lesson, session);
  const flowMeta = _step8_computeFlowMeta(flow, totalMinutes, warnings);

  // ── hasRequiredActivity 判定(QⅡ-1)
  const hasRequiredActivity = _detectHasRequiredActivity(
    mainActivities,
    activityCatalog,
    warnings
  );

  return {
    resolvedFlow: flow,
    flowMeta: flowMeta,
    warnings: warnings,
    hasRequiredActivity: hasRequiredActivity,
  };
}

// ============================================================================
// SECTION 6: エクスポート(ブラウザ + Node.js 両対応)
// ============================================================================
// C+B ハイブリッド方針(SKILL.md v1.4)に従い、ブラウザでも Node.js でも動く形に。
// ----------------------------------------------------------------------------

const FlowSynthesizer = {
  synthesize: synthesize,

  // 内部関数も export(将来のテスト・デバッグ用)
  _internal: {
    deepClone: deepClone,
    emitWarning: emitWarning,
    logWarn: logWarn,
    _step1_loadBaseFlow: _step1_loadBaseFlow,
    _step2_filterByTeach: _step2_filterByTeach,
    _step3_applySkipFlowIds: _step3_applySkipFlowIds,
    _step4_applyIntroActivityOverrides: _step4_applyIntroActivityOverrides,
    _step5_replaceMainActivities: _step5_replaceMainActivities,
    _step6_prependReview: _step6_prependReview,
    _step7_resolveMinutes: _step7_resolveMinutes,
    _step8_computeFlowMeta: _step8_computeFlowMeta,
    _resolveTotalMinutes: _resolveTotalMinutes,
    _detectHasRequiredActivity: _detectHasRequiredActivity,
  },

  // 定数(参照用)
  STEP_IDS: STEP_IDS,
  WARN_MESSAGES: WARN_MESSAGES,
  DEFAULT_REVIEW_MINUTES: DEFAULT_REVIEW_MINUTES,
  FALLBACK_TOTAL_MINUTES: FALLBACK_TOTAL_MINUTES,

  // メタ情報
  _meta: {
    version: '1.0',
    createdAt: '2026-05-12',
    source: 'shared/common/flow_synthesizer.js',
    apiVersion: 'session.v1',
    skillMdVersion: 'v1.5', // teach[] 任意化を反映
  },
};

// ブラウザ環境(window グローバル)
if (typeof window !== 'undefined') {
  window.FlowSynthesizer = FlowSynthesizer;
}

// Node.js 環境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlowSynthesizer;
}

// ============================================================================
// SECTION 7: サンプル使用例(参考)
// ============================================================================
// session_001 + lesson_01 の合成期待値(handoff_stage1_task6_kickoff.md §4-1)。
// 検証時の期待値と本実装が一致することを確認するための参考コメント。
// ----------------------------------------------------------------------------
/*
 * 【サンプル 1】session_001 + lesson_01(標準ケース)
 * -----------------------------------------------------------------------------
 * 入力:
 *   lesson_01.json v2.6 (duration_recommended: 50・flow 11 エントリ)
 *   session_001.json v1.0
 *     teach=[{lessonNo:1,patternId:"p1"},{...p2},{...p3}]
 *     review=[] / skipFlowIds=[] / introActivityOverrides=[] / mainActivities=[]
 *     session.duration=50
 *
 * 期待される resolvedFlow(11 エントリ・うち 2 件 skipped):
 *
 *   id            | type           | skipped | minutes |
 *   --------------+----------------+---------+---------+
 *   review        | review         | true    | 0       | lesson の review (skipped:true) を維持
 *   intro_slide   | intro_slide    | false   | 3       |
 *   intro_act_p1  | intro_activity | false   | 5       |
 *   pattern_p1    | pattern        | false   | 8       |
 *   intro_act_p2  | intro_activity | false   | 5       |
 *   pattern_p2    | pattern        | false   | 8       |
 *   intro_act_p3  | intro_activity | false   | 5       |
 *   pattern_p3    | pattern        | false   | 7       |
 *   example       | example        | false   | 4       |
 *   practice      | practice       | false   | 5       |
 *   main_act_1    | main_activity  | true    | 0       | lesson の main_act_1 (skipped:true) を維持
 *   wrapUp        | wrapUp         | false   | 5       |
 *
 * 期待される flowMeta:
 *   {
 *     totalMinutes: 50,
 *     allocatedMinutes: 55, // 3+5+8+5+8+5+7+4+5+5
 *     remainingMinutes: -5,
 *     status: "over_allocated_by_design"
 *   }
 *
 * 期待される warnings: [] (空配列)
 * 期待される hasRequiredActivity: false (mainActivities[] が空)
 *
 *
 * 【サンプル 2】アクティビティ中心のレッスン(QⅠ-1 / 仮想 session_005)
 * -----------------------------------------------------------------------------
 * 入力:
 *   lesson_01.json v2.6
 *   仮想 session_005.json:
 *     teach=[] (空配列・任意)
 *     review=[{lessonNo:1, patternId:"p1"}]
 *     mainActivities=[{activityId:"act_jlpt_time_attack", minutes:15}]
 *     session.duration=50
 *
 * 期待される resolvedFlow(active 6 件):
 *
 *   id            | type           | skipped | minutes |
 *   --------------+----------------+---------+---------+
 *   review        | review         | false   | 5       | session.review[] により有効化
 *   intro_slide   | intro_slide    | false   | 3       |
 *   example       | example        | false   | 4       |
 *   practice      | practice       | false   | 5       |
 *   main_act_1    | main_activity  | false   | 15      | session.mainActivities[] により新規追加
 *   wrapUp        | wrapUp         | false   | 5       |
 *
 *   (除外: intro_act_p1〜p3 / pattern_p1〜p3・teach=[] のため)
 *
 * 期待される flowMeta:
 *   {
 *     totalMinutes: 50,
 *     allocatedMinutes: 37, // 5+3+4+5+15+5
 *     remainingMinutes: 13,
 *     status: "under_allocated"
 *   }
 *
 * 期待される warnings: [{ code: "TEACH_EMPTY", ja: "...", en: "..." }]
 * 期待される hasRequiredActivity: true (act_jlpt_time_attack の judgment が "required" の場合)
 *
 * -----------------------------------------------------------------------------
 * 使用例(ブラウザ・data.js から呼び出すケース):
 *
 *   <script src="shared/common/flow_synthesizer.js"></script>
 *   <script>
 *     const result = window.FlowSynthesizer.synthesize(
 *       LESSON_01,        // lesson_01.json の内容
 *       SESSION_001,      // session_001.json の内容
 *       ACTIVITY_CATALOG  // activity_catalog.json の内容(任意)
 *     );
 *     window.SESSION_DATA = window.SESSION_DATA || {};
 *     window.SESSION_DATA.resolvedFlow = result.resolvedFlow;
 *     window.SESSION_DATA.flowMeta = result.flowMeta;
 *     window.SESSION_DATA.warnings = result.warnings;
 *     window.SESSION_DATA.hasRequiredActivity = result.hasRequiredActivity;
 *   </script>
 *
 * 使用例(Node.js):
 *
 *   const FlowSynthesizer = require('./shared/common/flow_synthesizer.js');
 *   const lesson = require('./lesson_01.json');
 *   const session = require('./session_001.json');
 *   const activityCatalog = require('./activity_catalog.json');
 *   const result = FlowSynthesizer.synthesize(lesson, session, activityCatalog);
 *   console.log(JSON.stringify(result, null, 2));
 */
