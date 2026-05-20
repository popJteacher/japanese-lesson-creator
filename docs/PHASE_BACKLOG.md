# docs/PHASE_BACKLOG.md — Phase 別の退避中項目

> これは凍結ではなく退避。各項目は所属 Phase の active 化と同時に作業対象に戻る。
> ロードマップ本体は `docs/MIGRATION_PLAN.md`。現在 active な作業は `NEXT_ACTIONS.md`。

最終更新：2026-05-20（Phase 化運用切替・旧 NEXT_ACTIONS の OPEN 3 件を退避）

---

## Phase 1（active）で取り出す項目

### v3.2 ガイド SMOKE 3 語の S列再生成
- 出所：旧 NEXT_ACTIONS ③（`archive/handoffs/progress_handoff_v14_0.md` §4 の手順）。
- 退避理由：Phase 1 で classify/translate をローカル化する際、ローカル分類で vocab_type を
  再走査して PASS を確認する形に組み込む（exportVocabTypes 引退の同値検証と一緒に走らせる）。
- 戻し方：Phase 1 完了条件の検証ステップとして実行。生成 S列は `data/image_prompts_lessonNN_v3_N.json`
  に置き、`invariants[C]` が自動検査する（`docs/REFERENCE.md` §3-3 に準拠）。

---

## Phase 2 で吸収される項目（個別作業として着手しない）

### Drive→repo 取り込みのスクリプト化（`scripts/pull-registries.mjs`）
- 出所：旧 NEXT_ACTIONS ②。`https://drive.google.com/uc?export=download&id={ID}` で取得して
  `data/master_*_registry.json` に上書きする自動化案。
- 退避理由：Phase 2 で registry を repo ネイティブ化する＝ローカルが registry を repo に
  直接書くため、Drive download/upload ループ自体が消滅する。先に作ると Phase 2 で捨てる。
- 戻し方：戻さない。Phase 2 で「Drive registry 経由の手作業ゼロ」を達成した時点で恒久解決。

---

## Phase 4 完了後の content backlog

### 画像 asset coverage 62 件未充足
- 出所：旧 NEXT_ACTIONS ①。active 103 件中 62 missing
  （内訳：`null_imageUrl_rows=23` ＋ `no_images_array=39`）。
- 退避理由：これは生成側＝Sheets の `imageStatus` 列分布の問題
  （`pending` / `failed_N` / `failed_final` / `skipped_no_prompt` / 空欄）。
  Phase 4 で Imagen 呼び出しをローカル化した後、ローカル infra で補充する方がやり直しが少ない。
- 戻し方：Phase 4 完了後（GAS 完全消滅後）、ローカルから Imagen を直接叩いて
  62 件を埋める作業として戻す。`npm run missing-assets --type=image` の出力が
  そのままバックログとして使える。
- 参考：`failed_final` を `pending` に戻すリセット関数は `gas/pipeline.gs` line 3340 周辺
  （Phase 4 で GAS が消えるまでは GAS 側の暫定運用も可）。

---

## 運用ルール

- 旧 NEXT_ACTIONS の OPEN は本ファイルに退避する。NEXT_ACTIONS には active な Phase の
  作業しか残さない（CLAUDE.md「最重要ルール」の規律）。
- 各項目は **所属 Phase ＋ 退避理由 ＋ 戻し方** の 3 点セットで記載する。
  記述不足のまま放置しない。
- 所属 Phase が active になったら NEXT_ACTIONS へ移し、本ファイルからは削除する。
- 永久に戻さない項目（Phase 2 で吸収されるなど）は「戻し方：戻さない」と明記する。
