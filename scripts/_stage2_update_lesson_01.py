#!/usr/bin/env python3
"""
Stage 2 一括更新スクリプト（一時利用・完了後に削除）

対象: data/lesson_01.json
変更:
  2-1: vocabulary 全17語に imageId(word_*) + audioId(word_*) を設定
  2-2: examples 全15件に audioId(sentence_ex_L01_*) + isAnchor を追加
  2-3: flow[] を文型ブロック構造に再設計（16エントリ）
  2-4: namedCharacters[] セクションを patterns の直前に追加
  完了: _meta.lastModified を 2026-05-15、changes[] に v2.11 を追記
"""
import json
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / 'data' / 'lesson_01.json'

with PATH.open('r', encoding='utf-8') as f:
    data = json.load(f)

# ====================================================================
# 2-1: vocabulary imageId/audioId 設定
# ====================================================================
vocab_updated = 0
for group_key in ('p1_p2', 'p1_p2_nationality', 'p3'):
    group = data['vocabulary']['byPattern'][group_key]
    for w in group['words']:
        word = w['word']
        w['imageId'] = f'word_{word}'
        w['audioId'] = f'word_{word}'
        vocab_updated += 1
print(f'[2-1] vocabulary updated: {vocab_updated} words')

# ====================================================================
# 2-2: examples audioId + isAnchor
# ====================================================================
ANCHOR_NOS = {'1-1', '2-1', '3-4'}
ex_updated = 0
ex_anchor = 0
for pat in data['patterns']:
    for ex in pat['examples']:
        # imageId: "ex_L01_001" -> audioId: "sentence_ex_L01_001"
        ex['audioId'] = 'sentence_' + ex['imageId']
        is_anchor = ex['no'] in ANCHOR_NOS
        ex['isAnchor'] = is_anchor
        ex_updated += 1
        if is_anchor:
            ex_anchor += 1
print(f'[2-2] examples updated: {ex_updated} (anchor=true: {ex_anchor}, anchor=false: {ex_updated - ex_anchor})')

# ====================================================================
# 2-3: flow[] 文型ブロック構造に再設計
# ====================================================================
old_flow = {entry['id']: entry for entry in data['flow']}

def make_example_entry(pat_id, recommended_minutes):
    return {
        'id': f'example_{pat_id}',
        'type': 'example',
        'stage': f'例文まとめ ({pat_id})',
        'patternRef': pat_id,
        '_recommendedMinutes': recommended_minutes,
        '_recommendedMinutes_note': '目安値(reference only)。session_NNN.json で実時間を指定する。v2.11: 文型ブロック化に伴い専用エントリ化。',
        'optional': False,
        'skipped': False,
        'materials': 'スライド',
        'content': f'{pat_id}の例文を確認する。',
        '_materialNeeds_note': 'example type は materialNeeds 付与対象外(schema 規則)。'
    }

def make_practice_entry(pat_id, recommended_minutes):
    return {
        'id': f'practice_{pat_id}',
        'type': 'practice',
        'stage': f'練習しよう ({pat_id})',
        'patternRef': pat_id,
        '_recommendedMinutes': recommended_minutes,
        '_recommendedMinutes_note': '目安値(reference only)。session_NNN.json で実時間を指定する。v2.11: 文型ブロック化に伴い専用エントリ化。',
        'optional': False,
        'skipped': False,
        'materials': 'スライド',
        'content': f'{pat_id}の practiceTemplates で口頭練習。',
        '_materialNeeds_note': 'practice type の materialNeeds は極めて稀(第13課のみ)。第1課は口頭練習のみで完結するため省略。'
    }

new_flow = [
    old_flow['review'],
    old_flow['intro_slide'],
    # p1 block
    old_flow['intro_act_p1'],
    old_flow['pattern_p1'],
    make_example_entry('p1', 2),
    make_practice_entry('p1', 2),
    # p2 block
    old_flow['intro_act_p2'],
    old_flow['pattern_p2'],
    make_example_entry('p2', 2),
    make_practice_entry('p2', 2),
    # p3 block
    old_flow['intro_act_p3'],
    old_flow['pattern_p3'],
    make_example_entry('p3', 2),
    make_practice_entry('p3', 2),
    # closing
    old_flow['main_act_1'],
    old_flow['wrapUp'],
]
data['flow'] = new_flow
print(f'[2-3] flow[] restructured: {len(new_flow)} entries (expected 16)')

# ====================================================================
# 2-4: namedCharacters[] セクション追加（patterns の直前）
# ====================================================================
named_characters = [
    {'name': '鈴木さん',   'occupation': '先生',   'nationality': '日本人',     'imageId': 'char_鈴木'},
    {'name': 'リンさん',   'occupation': '学生',   'nationality': '中国人',     'imageId': 'char_リン'},
    {'name': 'キムさん',   'occupation': '会社員', 'nationality': '韓国人',     'imageId': 'char_キム'},
    {'name': 'タノムさん', 'occupation': '医者',   'nationality': 'ベトナム人', 'imageId': 'char_タノム'},
    {'name': 'ケリーさん', 'occupation': '——',     'nationality': 'アメリカ人', 'imageId': 'char_ケリー'},
]
new_data = {}
inserted = False
for k, v in data.items():
    if k == 'patterns' and not inserted:
        new_data['namedCharacters'] = named_characters
        inserted = True
    new_data[k] = v
data = new_data
print(f'[2-4] namedCharacters[] inserted before "patterns": {len(named_characters)} entries')

# ====================================================================
# _meta 更新
# ====================================================================
data['_meta']['lastModified'] = '2026-05-15'
new_change = (
    'v2.11 (2026-05-15): SSOT再設計対応(Stage 2)。'
    '(1) vocabulary 全17語に imageId(word_* 命名規則統一)+audioId 予約フィールドを追加。'
    '(2) examples 全15件に audioId(sentence_ex_L01_*) 予約+isAnchor フラグを追加(1-1/2-1/3-4 のみ true、'
    'まとめスライド・宿題アンカー文用)。'
    '(3) flow[] を文型ブロック構造に再設計: 単一 example/practice エントリを削除し '
    'example_p1/p2/p3 + practice_p1/p2/p3 の 6 エントリに分割(patternRef で 1 文型 1 スライド化)。'
    'intro_activity/pattern と同列に並ぶことで FlowSynthesizer 経由で teach[] による '
    '自動フィルタが効く(_step2_filterByTeach)。'
    '(4) namedCharacters[] セクションを新設(鈴木/リン/キム/タノム/ケリー 5件)。'
    'intro_activity スライドの character_card_grid レイアウト等で参照する課固有の人物データ。'
    'formatVersion 2.7 維持(後方互換)。'
)
data['_meta']['changes'].append(new_change)
print(f'[meta] lastModified -> 2026-05-15, changes[] += v2.11 entry')

# ====================================================================
# 書き出し
# ====================================================================
with PATH.open('w', encoding='utf-8', newline='\n') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(f'[done] wrote {PATH}')
