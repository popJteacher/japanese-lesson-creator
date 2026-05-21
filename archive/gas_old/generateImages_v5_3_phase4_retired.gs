// archive/gas_old/generateImages_v5_3_phase4_retired.gs
//
// [PENDING — 枠組み段階 / 実コード未コピー]
//
// 本ファイルは Phase 4 ⑥ 着手前の preparation として作成された manifest です。
// 「退役対象の特定」と「⑥ 着手時の作業手順」を確定するためのもので、
// gas/pipeline.gs からの実コード切り出しは ⑥ 着手時に実施します。
//
// ⑥ 着手の前提条件：
//   1. 人間検証 § A（v3.11.1 / nanobanana で 5-7 件）が OK 判定
//   2. Phase 4 ④（image QC）完了
//   3. Phase 4 ⑤（validate-images / invariants[E]）完了
//   4. main で missing-assets null_imageUrl が 0 件（または計画上の残件のみ）
//
// =====================================================================
// Phase 4 ⑥：GAS generateImageBatch 引退。後継：
//   scripts/generate-images-local.mjs       ローカル Imagen 4 呼び出し + registry 連携 + バッチ
//   scripts/lib/imagen-client.mjs            Imagen 4 API クライアント（AI Studio key 経由）
//   scripts/check-imagen-key.mjs             AI Studio ListModels 疎通
//   scripts/_imagen-smoke.mjs                実機 1 件 PNG 生成 smoke
//   scripts/build_prompts.py                 プロンプト構築（vocab_type 別 dispatcher）
//   prompts/master_prompt_design_guide_v3_11_1.py
//                                            マスタープロンプトガイド本体
//                                            （nanobanana 用 inline ASPECT RATIO 1:1
//                                            注入版。Imagen API 経由なら --aspect 1:1
//                                            パラメータで指定可能のため v3.11 でも可）
//   scripts/lib/image-qc.mjs                 ⑤ で実装予定（画像 QC・loudnorm 相当）
//   scripts/validate-images.mjs              ⑤ で実装予定（invariants[E]）
// =====================================================================
//
// 元配置（gas/pipeline.gs 137,067 bytes / 2843 lines）：
//
// [ヘッダー & 定数ブロック：line 750-995]
//   750-806   コメントブロック（generateImages.gs v5.3 ヘッダー）
//   809-810   「設定」セクションコメント
//   812-839   const IMAGE_SETTINGS         { SPREADSHEET_ID / VOCAB_SHEET_NAME /
//                                           LOG_SHEET_NAME / IMAGE_FOLDER_ID /
//                                           MODEL: imagen-4.0-generate-001 /
//                                           MAX_BATCH_SIZE: 24 / DELAY_MS: 2500 /
//                                           ASPECT_RATIO: "1:1" }
//   841-859   const STYLE_RECIPE            v2.9.1 等価表現（後継：guide_v3_11_1.py
//                                           STYLE_BIBLE に取り込み済）
//   861-917   const OBJECT_SIGNATURES       具体物視覚的識別シグネチャー辞書
//                                           （後継：guide_v3_11_1.py PART 4.5 相当）
//   919-923   const OBJECT_SIGNATURE_DEFAULT
//   925-944   const ABSTRACT_METAPHORS      抽象概念 TIAC メタファー辞書
//                                           （後継：guide_v3_11_1.py PART 4.8 相当）
//   946-950   const ABSTRACT_METAPHOR_DEFAULT
//   952-966   const BUILDING_CUES           建物視覚的手がかり辞書（テンプレ B 用）
//   968-992   const PERSON_PROFILES         役割ベース人物描写辞書（テンプレ A 用）
//                                           （後継：guide_v3_11_1.py PART 2.2
//                                           ROLE_BASED_GENERIC_PROFILES に進化）
//   993-995   const PERSON_PROFILE_DEFAULT
//
// [main block 6 関数：line 1001-1150]
//   1001-1050 generateImageBatch            タイマートリガー entry point
//   1051-1073 testSingleImage               1 件だけ生成（手動 entry point）
//   1074-1092 previewPrompts                プロンプト dry-run プレビュー
//   1093-1118 retryImages(targetImageIds)   特定 imageId のリトライ
//   1119-1137 setupImageTriggersX3          9/13/17 時 × 3 件のトリガー設定
//   1138-1150 setupImageDailyTrigger        毎日 1 件のトリガー設定（旧版）
//
// [付随ヘルパ 17 関数：line 1151-2552]
//   1151-1203 processImageEntry_            主処理（main block helper）
//   1204-1247 buildImagePrompt_             vocab_type 別 dispatcher
//   1248-1275 buildPersonPrompt_            vocab_type=person
//   1276-1312 buildBuildingPrompt_          vocab_type=building
//   1313-1342 buildConcreteObjectPrompt_    vocab_type=concrete_object
//   1343-1370 buildActionVerbPrompt_        vocab_type=action_verb
//   1371-1402 buildAdjectivePrompt_         vocab_type=adjective
//   1403-1435 buildAbstractConceptPrompt_   vocab_type=abstract_concept
//   1436-1462 buildSpatialRelationPrompt_   vocab_type=spatial_relation
//   1463-1502 buildDemonstrativePrompt_     vocab_type=demonstrative
//   1503-1607 buildPronounPrompt_           vocab_type=pronoun
//   1608-1698 buildInterjectionPrompt_      vocab_type=interjection
//   1699-1799 buildSetExpressionPrompt_     vocab_type=set_expression
//   1800-1885 buildAdverbPrompt_            vocab_type=adverb（subtype 引数）
//   1886-1934 buildCounterPrompt_           vocab_type=counter
//   1935-2052 buildTimePrompt_              vocab_type=time（subtype 引数）
//   2053-2175 buildTransportPrompt_         vocab_type=transport
//   2176-2248 buildFamilyPrompt_            vocab_type=family（form 引数）
//   2249-2298 buildWeatherPrompt_           vocab_type=weather
//   2299-2375 buildSensoryPrompt_           vocab_type=sensory（type 引数）
//   2376-2398 buildDefaultPrompt_           vocab_type=default
//   2399-2442 callImagenAPI_                Imagen API 呼び出し
//   2443-2465 saveImageToDrive_             Drive 保存
//   2466-2475 getPendingImageRows_          Sheet 読み取り（pending のみ）
//   2476-2521 getAllImageRows_              Sheet 読み取り（全行）
//   2522-2552 writeImageLog_                Sheet ログ書き込み
//
// [退役対象範囲合計：line 750-2552（約 1803 行）]
//
// =====================================================================
// 退役 NOT 対象（gas/pipeline.gs に残す）：
//
//   2553-2558 loadJsonFromDriveById         syncRegistries 撤去後の保留 utility。
//                                           既存コメント（line 2545-2551）で
//                                           importExamplesFromLesson02 依存と明記済。
//                                           保留判断のアンカー = ⑥ で touch しない境界。
//   2565-     checkStyleRecipe              手動運用 utility（Sheet 操作）
//   2575-     addAuxiliaryColumns           Sheet 補助列追加 utility
//   2614-     resetFailedToPending          リセット utility（手動）
//   2642-     resetFailedImagesToPending    上記 alias
//   2646-     addImagePromptColumn          Sheet にプロンプト列追加 utility
//   2668-     importImagePrompts            プロンプト JSON を Sheet にインポート
//   2691-     importExamplesFromLesson02    例文インポート
//   2758-     importImagePromptsFromDriveJson
//   2796-     clearImagePromptColumnValidation
//
//   ※ これら utility が Phase 4 ⑥ 退役対象内の定数（IMAGE_SETTINGS /
//     PERSON_PROFILES 等）を参照していないかは ⑥ 着手時に grep で確認する。
//     参照していた場合、定数だけは残す or utility を Phase 4 後 backlog で
//     整理する判断が必要。本 manifest では「保留」とのみ記載。
// =====================================================================
//
// ⑥ 着手時の実行手順：
//
//   1. v3.11.1 人間検証 OK / Phase 4 ④⑤ 完了の前提条件を確認
//
//   2. gas/pipeline.gs の line 750-2552 を本ファイルに切り出してコピー
//      （本コメントブロックの下に「===== 切り出し開始 =====」マーカーを置き、
//      その下に貼り付ける）
//
//   3. line 2553-2558 直前のコメントブロック（line 2545-2551）の
//      generateAudio 退役 message と同列に、generateImages 退役 message を
//      追加するか統合する（Phase 3 と Phase 4 の境界明示）
//
//   4. utility 群（line 2553-2843）の定数参照 grep：
//      grep -nE 'IMAGE_SETTINGS|STYLE_RECIPE|OBJECT_SIGNATURES|PERSON_PROFILES|
//                ABSTRACT_METAPHORS|BUILDING_CUES' gas/pipeline.gs
//      参照が utility 内に残っていれば、当該定数を utility 直上に inline
//      コピーするか、または utility 群を一括退役対象に追加する判断。
//
//   5. gas/pipeline.gs から line 750-2552 を削除
//
//   6. validate / check-imagen-key で残余の整合性確認：
//      npm run validate        # invariants[A] が新しい GAS ヘッダー版になることを確認
//      npm run check-imagen-key
//
//   7. invariants.mjs の CANONICAL.gas エントリから generateImages.gs を削除
//      （Phase 3 の generateAudio.gs 削除と同じパターン）
//
//   8. commit（メッセージ参考）：
//      "chore(phase4): GAS generateImages 退役（Phase 4 ⑥ コード分）"
//
//   9. NEXT_ACTIONS.md を「Phase 4 ⑥ コード完了 / 人間タスク：トリガー削除待ち」に更新
//
//   10. 人間に GAS Triggers から generateImageBatch × 3 件
//       （9 / 13 / 17 時）の削除を依頼。削除確認後に Phase 4 完了宣言。
//
// =====================================================================
// 同値〜上位互換の確認（⑥ 完了時の Phase 4 完了宣言の前提）：
//
//   - 人間検証 § A（v3.11.1, nanobanana 5-7 件）の出力品質が GAS v5.3 と同等以上
//   - Phase 4 ④⑤ 完了：invariants[E] PASS
//   - missing-assets null_imageUrl が 0 件まで減少（または計画上の残件のみ）
//   - npm run check-imagen-key PASS（Imagen 4 系 3 モデル検出継続）
//   - 「ローカル化により獲得した能力」：
//     * 課金 API 直叩きによる無料枠 25 RPD の制約からの解放
//     * バッチサイズ無制限化（GAS の MAX_BATCH_SIZE: 24 制約消滅）
//     * QC スペック検証（GAS には存在しなかった image QC = ④⑤ で実装）
//     * registry-as-canon 規律の徹底（Sheet → registry 経由ループの消滅）
//
// 人間タスク：⑥ commit 時点では生存中の GAS トリガー
//   generateImageBatch × 3 件（9 / 13 / 17 時）
// の削除が必要。Phase 4 完了宣言の前提条件として人間が GAS エディタから削除する。
// 削除確認後、生存中 GAS トリガーは 0 件となり、MIGRATION_PLAN.md Phase 4
// 「GAS 完全消滅」が達成される。
// =====================================================================
//
// ===== 切り出し開始（⑥ 着手時にここから下に gas/pipeline.gs line 750-2552 を貼る） =====
