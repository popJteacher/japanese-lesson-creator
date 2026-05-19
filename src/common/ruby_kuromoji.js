/**
 * ruby_kuromoji.js
 * -----------------------------------------------------------------------------
 * 全漢字に自動でふりがなを付与する。
 *
 * 仕組み:
 *   1. kuromoji.js を CDN から読み込んで日本語形態素解析器を初期化(非同期・約2-5秒)。
 *   2. tokenizer.tokenize(text) は同期 API なので、初期化後は同期で全漢字に
 *      ruby HTML を付与できる。
 *   3. okurigana(送り仮名)は共通接頭辞・接尾辞をマッチして検出し、
 *      漢字部分にだけ <ruby> を付ける(例: 「読んで」→ <ruby>読<rt>よ</rt></ruby>んで)。
 *
 * 公開 API:
 *   window.RubyKuromoji.ready          : Promise<void>  初期化完了
 *   window.RubyKuromoji.isReady()      : boolean        即時可用判定
 *   window.RubyKuromoji.rubify(text)   : string         全漢字に ruby を付与した HTML
 *   window.RubyKuromoji.escape(text)   : string         HTML エスケープのみ(ruby なし)
 *
 * フォールバック:
 *   - kuromoji がまだロード中なら従来の RubyDict.rubifySentence を使う。
 *   - kuromoji ロード失敗時は HTML エスケープのみ返す。
 *
 * 備考:
 *   - kuromoji の辞書(~13MB)は初回のみダウンロード、ブラウザにキャッシュされる。
 *   - file:// から開いた場合でも CDN 由来の辞書は CORS 設定済みでアクセス可能。
 */
'use strict';
(function () {
  if (typeof window === 'undefined') return;

  const DICT_PATH = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/';

  let _tokenizer = null;
  let _initError = null;

  // ── 文字判定 ────────────────────────────────────────────────────────
  function isKanji(ch) {
    if (!ch) return false;
    const c = ch.charCodeAt(0);
    return (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3400 && c <= 0x4DBF);
  }
  function hasKanji(s) {
    if (!s) return false;
    for (const ch of s) if (isKanji(ch)) return true;
    return false;
  }
  function isHiraOrKata(ch) {
    if (!ch) return false;
    const c = ch.charCodeAt(0);
    return (c >= 0x3040 && c <= 0x30FF);   // ひらがな + カタカナ
  }
  function katakanaToHiragana(s) {
    if (!s) return '';
    let out = '';
    for (const ch of s) {
      const c = ch.charCodeAt(0);
      if (c >= 0x30A1 && c <= 0x30F6) out += String.fromCharCode(c - 0x60);
      else out += ch;
    }
    return out;
  }

  // ── HTML エスケープ ─────────────────────────────────────────────────
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // ── 単一トークンの ruby HTML を構築 ────────────────────────────────
  // 送り仮名 (kana suffix/prefix) を検出し、漢字部分にだけ ruby を付ける。
  function tokenToRuby(surface, readingHira) {
    if (!hasKanji(surface)) return escapeHtml(surface);
    if (!readingHira || readingHira === '*') return escapeHtml(surface);

    const surf = surface;
    const read = readingHira;
    const sLen = surf.length;
    const rLen = read.length;

    // 共通接尾辞 (送り仮名)
    let suffix = 0;
    while (suffix < sLen && suffix < rLen) {
      const sc = surf[sLen - 1 - suffix];
      const rc = read[rLen - 1 - suffix];
      if (isHiraOrKata(sc) && sc === rc) suffix++;
      else break;
    }
    // 共通接頭辞 (記号や仮名の前置)
    let prefix = 0;
    while (prefix < sLen - suffix && prefix < rLen - suffix) {
      const sc = surf[prefix];
      const rc = read[prefix];
      if (isHiraOrKata(sc) && sc === rc) prefix++;
      else break;
    }
    const kanjiPart = surf.slice(prefix, sLen - suffix);
    const readingPart = read.slice(prefix, rLen - suffix);
    const head = surf.slice(0, prefix);
    const tail = surf.slice(sLen - suffix);
    if (!kanjiPart || !readingPart) return escapeHtml(surf);
    return (
      escapeHtml(head) +
      '<ruby>' + escapeHtml(kanjiPart) +
      '<rt>' + escapeHtml(readingPart) + '</rt></ruby>' +
      escapeHtml(tail)
    );
  }

  // ── メインの ruby 化関数 ────────────────────────────────────────────
  function rubify(text) {
    if (text == null) return '';
    const str = String(text);
    if (!str) return '';
    if (!_tokenizer) {
      // フォールバック: 辞書ベース (RubyDict)
      if (window.RubyDict && typeof window.RubyDict.rubifySentence === 'function') {
        // RubyDict はエスケープしないので、ここで HTML 内の値として安全な点に注意。
        // 既存実装の挙動を変えないためそのまま返す。
        return window.RubyDict.rubifySentence(str);
      }
      return escapeHtml(str);
    }

    let tokens;
    try {
      tokens = _tokenizer.tokenize(str);
    } catch (err) {
      console.warn('[RubyKuromoji] tokenize failed:', err.message);
      return escapeHtml(str);
    }

    // 隣接漢字トークンのマージ:
    // kuromoji は「職業」を「職」「業」のように複数トークンに割ることがある。
    // そのまま個別 <ruby> 化すると、各 ruby ボックスが rt 幅で広がり base 同士の
    // 間に視覚的な隙間が出る (例: 「職 業」のように見える)。
    // → 連続する漢字トークンを 1 つの <ruby>base<rt>reading</rt></ruby> にまとめる。
    // 単独トークンの場合は従来の tokenToRuby() に渡し、送り仮名の処理を維持する。
    let out = '';
    let buf = [];  // 連続する「漢字を含むトークン」のバッファ
    function flush() {
      if (buf.length === 0) return;
      const allHaveReading = buf.every((t) => {
        const r = t.reading || '';
        return r && r !== '*';
      });
      if (buf.length === 1 || !allHaveReading) {
        // 単独 or 読みが揃わない → トークンごとに tokenToRuby() で処理
        for (const t of buf) {
          const surface = t.surface_form || '';
          const readingHira = katakanaToHiragana(t.reading || '');
          out += tokenToRuby(surface, readingHira);
        }
      } else {
        // 2 個以上 & 全トークンに読みあり → 単一 ruby にマージ
        const surf = buf.map((t) => t.surface_form || '').join('');
        const read = buf.map((t) => katakanaToHiragana(t.reading || '')).join('');
        out += '<ruby>' + escapeHtml(surf) + '<rt>' + escapeHtml(read) + '</rt></ruby>';
      }
      buf = [];
    }
    for (const t of tokens) {
      const surface = t.surface_form || '';
      if (hasKanji(surface)) {
        buf.push(t);
      } else {
        flush();
        out += escapeHtml(surface);
      }
    }
    flush();
    return out;
  }

  // ── 初期化 (kuromoji.js script を動的ロード → builder.build) ─────────
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // 重複ロード防止
      const existing = Array.from(document.scripts).find((s) => s.src === src);
      if (existing) {
        if (window.kuromoji) return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error('script load failed')), { once: true });
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('script load failed: ' + src));
      document.head.appendChild(s);
    });
  }

  const ready = (async () => {
    try {
      // kuromoji.js (UMD) を読み込み (window.kuromoji を提供)
      if (typeof window.kuromoji === 'undefined') {
        await loadScript('https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js');
      }
      if (typeof window.kuromoji === 'undefined' || typeof window.kuromoji.builder !== 'function') {
        throw new Error('kuromoji が読み込めませんでした');
      }
      // tokenizer 構築
      const tok = await new Promise((resolve, reject) => {
        window.kuromoji.builder({ dicPath: DICT_PATH }).build((err, tokenizer) => {
          if (err) return reject(err);
          resolve(tokenizer);
        });
      });
      _tokenizer = tok;
      console.log('[RubyKuromoji] tokenizer ready');
    } catch (err) {
      _initError = err;
      console.warn('[RubyKuromoji] 初期化失敗 — RubyDict にフォールバック:', err.message);
    }
  })();

  function isReady() { return _tokenizer != null; }
  function getError() { return _initError; }

  window.RubyKuromoji = {
    ready,
    isReady,
    getError,
    rubify,
    escape: escapeHtml,
    _meta: { version: '0.1', createdAt: '2026-05-13' },
  };
})();
