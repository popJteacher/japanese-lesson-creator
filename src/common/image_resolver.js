/**
 * image_resolver.js
 * -----------------------------------------------------------------------------
 * imageId(画像識別子) を URL に解決する純粋関数群(C+B ハイブリッド自動化方針)。
 * data.js は URL ではなく imageId を保持し、表示時に本モジュールで解決する。
 *
 * 生成元:
 *   - SKILL.md v1.5 §C+B ハイブリッド自動化方針
 *   - master_image_registry.json v1.1(構造参照・registry 引数で渡される)
 *   - handoff_stage1_task9_kickoff.md v1.0(全設計判断の正本・QⅡ-1 案 C)
 *
 * 生成日: 2026-05-12 (Stage 1 タスク 9 拡張スコープ)
 *
 * 設計方針:
 *   - imageId → URL 解決を純粋関数として実装(副作用は configure のみ)
 *   - registry が渡されたら master_image_registry のエントリを参照
 *   - registry がない or imageId が登録外なら basePath + imageId + extension で fallback
 *   - imageId が空 / null / undefined なら null を返す(呼び出し側で fallback emoji 表示)
 *   - ブラウザ(window.ImageResolver)と Node.js(module.exports)両対応
 *     → C+B ハイブリッド方針(SKILL.md v1.5)で flow_synthesizer / ruby_dictionary と同じ純粋関数化
 *   - configure(options) でグローバル設定(basePath / extension / cacheBuster)を更新可能
 *     → マネタイズ時の URL カスタマイズ・著作権管理・環境別切替に対応
 *
 * 重要(SKILL.md v1.5 §伝播チェーンルール):
 *   - 起点 E(SKILL.md の仕様変更)時の下流確認対象。
 *   - 本ファイルを変更したらナレッジ再アップロード必須(shared/ 配下 = 全 session 影響)。
 *   - master_image_registry.json の構造変更(起点)時は本ファイルの参照ロジックを再確認。
 *
 * 参照資料:
 *   - SKILL.md v1.5 §C+B ハイブリッド自動化方針
 *   - handoff_stage1_task9_kickoff.md v1.0 §1-3 QⅡ-1(案 C 確定)
 *   - master_image_registry.json v1.1 _meta.version 構造
 *
 * 採用しなかった代替案:
 *   - 案 A(data.js に URL を直接書き込む)
 *     → マネタイズ時の URL 差し替えが session 全てに伝播する。著作権処理も困難。
 *   - 案 B(image_prompts_lesson1.json を直接参照する)
 *     → 課ごとにスクリプト側で分岐が必要。汎用化できない。
 *   → 採用: 案 C(imageId + 解決関数)。data.js は imageId のみ保持し、表示時に URL を解決。
 */
'use strict';

// ============================================================================
// SECTION 1: 定数定義
// ============================================================================
// グローバル設定のデフォルト値。configure() で上書き可能。
// ----------------------------------------------------------------------------

/** デフォルトのベースパス(相対パス想定・session 出力ディレクトリ起点) */
const DEFAULT_BASE_PATH = './images/';

/** デフォルトの拡張子 */
const DEFAULT_EXTENSION = '.png';

/**
 * グローバル設定オブジェクト。
 * configure(options) で更新される(副作用)。
 * resolveImageUrl(options) の options が優先・本設定はフォールバック。
 */
const _config = {
  basePath: DEFAULT_BASE_PATH,
  extension: DEFAULT_EXTENSION,
  cacheBuster: null,  // null の場合は ?v= を付けない
};

// ============================================================================
// SECTION 2: 設定 API
// ============================================================================
// 通常は呼び出さない(顧客環境別 URL カスタマイズ時のみ)。
// ----------------------------------------------------------------------------

/**
 * グローバル設定を更新する(任意・通常は使わない)。
 *
 * 顧客環境ごとの URL カスタマイズに使用:
 *   - basePath を CDN URL に切り替え
 *   - cacheBuster でバージョン付与
 *   - extension を .webp 等に変更
 *
 * 各設定はキー単位でマージされる(指定したキーのみ上書き)。
 *
 * @param {Object} options
 * @param {string} [options.basePath]    ベースパス(末尾スラッシュ推奨)
 * @param {string} [options.extension]   拡張子(先頭ドット推奨)
 * @param {string} [options.cacheBuster] バージョン文字列(null で無効化)
 */
function configure(options) {
  if (!options || typeof options !== 'object') return;
  if (typeof options.basePath === 'string') _config.basePath = options.basePath;
  if (typeof options.extension === 'string') _config.extension = options.extension;
  if (Object.prototype.hasOwnProperty.call(options, 'cacheBuster')) {
    _config.cacheBuster = options.cacheBuster;  // null も許容(無効化)
  }
}

/**
 * 現在の設定を取得する(デバッグ・検証用)。
 * @returns {Object} _config の浅いコピー
 */
function getConfig() {
  return {
    basePath: _config.basePath,
    extension: _config.extension,
    cacheBuster: _config.cacheBuster,
  };
}

// ============================================================================
// SECTION 3: 解決ロジック
// ============================================================================
// imageId → URL の主要関数。純粋関数として実装(_config 以外の副作用なし)。
// ----------------------------------------------------------------------------

/**
 * imageId を URL に解決する純粋関数。
 *
 * 解決ロジック:
 *   1. imageId が null / undefined / 空文字 / 非文字列 → null を返す
 *   2. options.registry に imageId エントリがあれば、その imageUrl を返す
 *      (master_image_registry.json の構造: registry[imageId].images[0].imageUrl)
 *      → 簡略表記 registry[imageId].imageUrl も許容(フラット構造の data.js 想定)
 *   3. registry に無ければ basePath + imageId + extension で fallback URL を生成
 *   4. cacheBuster が指定されていれば ?v= で付与
 *
 * @param {string} imageId  画像識別子(例: "vocab_lesson1_doctor", "ex_L01_001")
 * @param {Object} [options]
 * @param {string} [options.basePath]    省略時はグローバル設定(_config.basePath)
 * @param {string} [options.extension]   省略時はグローバル設定(_config.extension)
 * @param {Object} [options.registry]    master_image_registry.json の内容(任意)
 * @param {string} [options.cacheBuster] バージョン文字列(任意・null で無効)
 * @returns {string|null}  解決された URL(imageId が無効なら null)
 *
 * 使用例:
 *   // 例 1: 最もシンプル(registry なし・fallback URL)
 *   const url = ImageResolver.resolveImageUrl('vocab_lesson1_doctor');
 *   // → './images/vocab_lesson1_doctor.png'
 *
 *   // 例 2: registry 経由
 *   const registry = window.MASTER_IMAGE_REGISTRY;  // タスク 13 以降で配備
 *   const url = ImageResolver.resolveImageUrl('vocab_医者', { registry });
 *   // → 'https://drive.google.com/uc?id=...'(registry.vocab_医者.images[0].imageUrl)
 *
 *   // 例 3: マネタイズ時の環境別切替
 *   ImageResolver.configure({
 *     basePath: 'https://cdn.customer-a.example.com/lesson1/',
 *     cacheBuster: 'v1.2.3',
 *   });
 *   const url = ImageResolver.resolveImageUrl('vocab_lesson1_doctor');
 *   // → 'https://cdn.customer-a.example.com/lesson1/vocab_lesson1_doctor.png?v=v1.2.3'
 */
function resolveImageUrl(imageId, options) {
  // Step 1: imageId バリデーション
  if (typeof imageId !== 'string' || imageId.length === 0) {
    return null;
  }

  const opts = options || {};
  const basePath = (typeof opts.basePath === 'string') ? opts.basePath : _config.basePath;
  const extension = (typeof opts.extension === 'string') ? opts.extension : _config.extension;
  const cacheBuster = (Object.prototype.hasOwnProperty.call(opts, 'cacheBuster'))
    ? opts.cacheBuster
    : _config.cacheBuster;

  // Step 2: registry 経由の解決
  const registry = opts.registry;
  let url = _resolveFromRegistry(registry, imageId);

  // Step 3: registry に無ければ fallback URL を構築
  if (!url) {
    url = _buildFallbackUrl(imageId, basePath, extension);
  }

  // Step 4: cacheBuster 付与
  if (cacheBuster && typeof cacheBuster === 'string' && cacheBuster.length > 0) {
    const sep = url.indexOf('?') === -1 ? '?' : '&';
    url = url + sep + 'v=' + encodeURIComponent(cacheBuster);
  }

  return url;
}

// ============================================================================
// SECTION 4: ヘルパー(内部)
// ============================================================================
// _resolveFromRegistry / _buildFallbackUrl は外部公開しない。
// ----------------------------------------------------------------------------

/**
 * registry から imageId に対応する URL を取得する。
 *
 * master_image_registry.json v1.1 の構造に基づき、以下の順で参照:
 *   1. registry[imageId].images[0].imageUrl (master_image_registry の標準構造)
 *   2. registry[imageId].imageUrl           (簡略フラット形式・data.js 用)
 *   3. registry.vocabulary_images[imageId]  (master_image_registry のセクション形式)
 *   4. registry.example_images[imageId]     (同上)
 *
 * @param {Object|null|undefined} registry
 * @param {string} imageId
 * @returns {string|null}
 */
function _resolveFromRegistry(registry, imageId) {
  if (!registry || typeof registry !== 'object') return null;

  // パターン 1 & 2: registry[imageId] が直接エントリ
  const direct = registry[imageId];
  if (direct && typeof direct === 'object') {
    // パターン 1: images[0].imageUrl(master_image_registry 標準)
    if (Array.isArray(direct.images) && direct.images.length > 0) {
      const first = direct.images[0];
      if (first && typeof first.imageUrl === 'string' && first.imageUrl.length > 0) {
        return first.imageUrl;
      }
    }
    // パターン 2: imageUrl 直書き(フラット形式)
    if (typeof direct.imageUrl === 'string' && direct.imageUrl.length > 0) {
      return direct.imageUrl;
    }
  }

  // パターン 3 & 4: セクション形式(master_image_registry.json の top-level)
  const sections = ['vocabulary_images', 'example_images', 'character_assets', 'special_grid_images'];
  for (const sec of sections) {
    const section = registry[sec];
    if (!section || typeof section !== 'object') continue;
    const entry = section[imageId];
    if (!entry || typeof entry !== 'object') continue;
    if (Array.isArray(entry.images) && entry.images.length > 0) {
      const first = entry.images[0];
      if (first && typeof first.imageUrl === 'string' && first.imageUrl.length > 0) {
        return first.imageUrl;
      }
    }
    if (typeof entry.imageUrl === 'string' && entry.imageUrl.length > 0) {
      return entry.imageUrl;
    }
  }

  return null;
}

/**
 * basePath + imageId + extension で fallback URL を構築する。
 * basePath の末尾スラッシュは正規化される(あってもなくても可)。
 *
 * @param {string} imageId
 * @param {string} basePath
 * @param {string} extension
 * @returns {string}
 */
function _buildFallbackUrl(imageId, basePath, extension) {
  const bp = basePath.endsWith('/') ? basePath : basePath + '/';
  const ext = (extension.length > 0 && !extension.startsWith('.')) ? '.' + extension : extension;
  return bp + imageId + ext;
}

// ============================================================================
// SECTION 5: エクスポート(ブラウザ + Node.js 両対応)
// ============================================================================
// C+B ハイブリッド方針(SKILL.md v1.5)に従い、ブラウザでも Node.js でも動く形に。
// ----------------------------------------------------------------------------

const ImageResolver = {
  resolveImageUrl: resolveImageUrl,
  configure: configure,
  getConfig: getConfig,
  // メタ情報
  _meta: {
    version: '1.0',
    createdAt: '2026-05-12',
    source: 'shared/common/image_resolver.js',
    designDecision: 'QⅡ-1 案 C (imageId + resolveImageUrl)',
  },
};

// ブラウザ環境(window グローバル)
if (typeof window !== 'undefined') {
  window.ImageResolver = ImageResolver;
}

// Node.js 環境(将来の B 案移行・テスト用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageResolver;
}
