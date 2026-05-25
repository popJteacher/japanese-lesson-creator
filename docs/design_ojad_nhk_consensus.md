# OJAD + NHK CSV Consensus Engine — 設計メモ

> 作成：2026-05-25（Phase α5 後半・次セッション着手予定）
> 目的：catalog の accent 精度を 3 ソース consensus で底上げし、将来追加 entry も
> 自動 NHK 標準化する。
> 着手前提：α5 完了状態（416 word audio regen 済、12 override fix 済、tts_workaround 機構あり）

---

## 解決する問題

**現状**：vocab_catalog.json の `accent_yomigana` は **UniDic + naist-jdic だけで生成**。
今日 NHK CSV 突合で 91 件の mismatch が判明し、12 件は user 視聴で確実に違うことが
確認できた（手動 override で個別修正済）。残り 79 件 + 未発見分は **catalog レベルで誤ったまま**。

**根本原因**：構築時に NHK / OJAD を参照していない。新規 entry 追加でも同じ問題が再発。

---

## 統合後の音声生成プロセス（合意済）

```
STAGE 1: catalog 構築/拡張（新規 entry 追加時のみ）
  Sheet/goi_list_raw からの新 entry
        ↓
  UniDic 抽出 → primary accent
        ↓
  NHK CSV lookup ← data/external/nhk_accent.csv (100k entries, 既存)
        ↓
  OJAD lookup ← data/external/ojad_cache.json (cache, scrape on miss)
        ↓
  consensus engine:
    - 3 ソース一致 → confidence='high'
    - 2 一致 (NHK+OJAD) → confidence='high', UniDic を上書き
    - 2 一致 (UniDic+X) → confidence='med'
    - 全部不一致 → confidence='low', review queue 行き
  ↓
  vocab_catalog.json:
    accent_yomigana = 採用値 (consensus)
    accent_consensus = { sources, agreement, confidence }
    accent_review_needed = (confidence < 'high')

STAGE 2: 音声生成 (既存 + tts_workaround 対応済)
  registry/Sheet から audioId list
        ↓
  catalog から: accent_override > accent_yomigana
        ↓
  tts_workaround check:
    - usePlainKana=true → SSML スキップ・plain kana 合成 (寝る 等)
  ↓
  Cloud TTS Neural2-B + applyQc → data/audio/<id>.mp3

STAGE 3: 検証（定期実行）
  npm run validate-accent → 全 entry consensus 再計算
  mismatch report → tmp/accent_mismatch_report.json
```

---

## 実装ステップ（次セッションで実行）

### Step 1: OJAD scraper（新規 `scripts/scrape-ojad.py`）

```
入力: catalog から audio 対象 word list (or 全 17,508 entries)
処理: 各 word について
  - cache 確認 (data/external/ojad_cache.json)
  - hit なら skip
  - miss なら https://www.gavo.t.u-tokyo.ac.jp/ojad/search/index/word:XXX を fetch
  - HTML parse: <span class="accented_word"> 内の mora_-N と accent_top class 抽出
  - 0.5s sleep (polite rate)
  - 結果を cache に追記
出力: data/external/ojad_cache.json
  { "word": [
    { "kana": "かれんだー", "mora": 5, "accent_pos": 2, "yomigana": "^かれ!んだー" },
    ...
  ]}
```

注意:
- OJAD は scrape policy ゆるい（明示的な禁止なし）が、rate limit 守る
- HTML 構造変更で破綻するリスク → 失敗時 cache 残して、後で fix
- 試作版は `tmp/ojad_cache/<word>.html` に raw HTML 保存方式（既存）

### Step 2: NHK CSV index 化（`scripts/lib/nhk-lookup.py` モジュール化）

既存の `scripts/check-accent-nhk.py` の lookup ロジックを切り出して module 化。
共通関数 `lookup_nhk(word, reading) -> [{yomigana, mora, accent_type}, ...]` を提供。

### Step 3: Consensus engine（`scripts/build-accent-consensus.py`）

```python
入力: vocab_catalog.json (17508 entries)
処理: 各 entry について
  unidic_acc = e.get('accent_yomigana')  # 既存値
  nhk_accs = nhk_lookup(e.word, e.reading)  # NHK CSV
  ojad_accs = ojad_lookup(e.word)            # OJAD cache
  consensus = compute(unidic_acc, nhk_accs, ojad_accs)
  if consensus.value != unidic_acc:
    write override: e.accent_consensus_override = consensus.value
    e.accent_consensus_meta = { sources, agreement, confidence, addedAt }
出力: 更新された vocab_catalog.json + tmp/consensus_report.json
```

consensus 規則:
- 3 source 一致 (UniDic == NHK == OJAD) → high, no change
- NHK == OJAD != UniDic → high, override with NHK/OJAD value
- UniDic == NHK != OJAD → med, keep UniDic, flag for review
- UniDic == OJAD != NHK → med, keep UniDic, flag for review
- 全部不一致 → low, keep UniDic, flag for review
- NHK のみある (OJAD miss, UniDic も accent_source=unknown 等) → med, use NHK
- 1 source のみ → confidence は source ごと: NHK=high, OJAD=high, UniDic=low

### Step 4: う ↔ ー / 連濁 (が↔か) 正規化

NHK CSV は ー / 清音 表記、catalog は う / 濁音 表記。比較時に同一視するため
normalize 関数:
```
normalize_yomigana(s):
  s = s.replace('う', 'ー') if preceded by お/え row  # おう→おー
  s = remove rendaku marks  # が→か
  return s
```
（既存 `scripts/check-accent-nhk.py` にも入れるべき。今は raw 比較で 91 mismatch だが
正規化後は 30-50 件に減ると推定）

### Step 5: 適用 + 一括 regen

```
1. python scripts/build-accent-consensus.py --dry-run → report
2. user review high-confidence mismatches → OK
3. python scripts/build-accent-consensus.py --apply → catalog update
4. node scripts/regen-drive-download.mjs --not-source tts-local-regen --force
   (force 必要 - 今は全部 tts-local-regen なので --not-source filter で 0 件になる)
   ↓ または ↓
   新しい flag `--accent-changed` を追加して、accent_consensus_override 持つ entry のみ regen
5. user audition
6. 残った mismatch (low confidence) は手動 override 追加 or 無視
```

---

## 期待される結果

- 既知 91 mismatch (raw) → 正規化後 30-50 件 → consensus 適用後 ~10-20 件残る (low confidence)
- 残り = NHK と OJAD が割れる難しいケース → 手動判定
- **新規 entry 追加時にも自動で consensus が走る** → 将来の精度劣化なし

## リスク・注意点

1. **OJAD scrape の rate limit**: 0.5s sleep でも 459 word で 4 分。全 17,508 だと 2.4 時間。
   → 初回は audio-only words に絞る (459)、後で 残り full 拡張
2. **HTML parse 破綻**: OJAD のレイアウト変わると壊れる。試作の `tmp/ojad_cache/*.html` ベースで
   robust にする（pattern 既知）。
3. **NHK 2版 vs 新辞典 2016 差**: 一部 word で accent 更新あり。consensus 採用値が古い可能性。
   → 重要 word は 新辞典 PDF spot check で確認（既存 mechanism）
4. **タイ・で 等 false match**: OJAD の検索結果に複数 reading 混じる。catalog reading と一致する
   ものだけ採用するロジック必須。
5. **連濁正規化の保守**: 連濁ルールは複雑（特定子音前のみ）。完璧でなくても 90% 解消すれば十分

---

## 関連ファイル（次セッション参照）

- `data/vocab_catalog.json` - 既存 17,508 entries
- `tmp/nhk_csv/ACCDB_unicode.csv` - NHK 2版 CSV (100k entries)
- `tmp/accent_mismatch_report.json` - 既存 91 mismatch list
- `tmp/ojad_cache/*.html` - 既存 26 word の OJAD HTML (今日 scrape 分)
- `scripts/check-accent-nhk.py` - NHK lookup ロジック (再利用元)
- `scripts/regen-drive-download.mjs` - regen pipeline (tts_workaround 対応済)
- `data/master_audio_registry.json` - audio mapping
