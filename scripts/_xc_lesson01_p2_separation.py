"""
X-c lesson_01 p2 分離型再設計 (2026-05-26)

操作内容:
  1. patterns[p2].examples を 5 件 (旧 2-1..2-5) から 8 件 (新 2-1..2-8) に再構成
     - 旧 2-3 (だれですか→キムさんです) → 新 2-3 + 新 2-4 (分離)
     - 旧 2-4 (先生Q+A) → 新 2-5 + 新 2-6 (分離・user 指摘で対象を鈴木さんに)
     - 旧 2-5 (韓国Q+A) → 新 2-7 + 新 2-8 (分離・対象キムさん)
  2. anchor を旧 2-4 から 新 2-1 (リンさんですか) に戻す (PDF 原典回帰)
  3. patterns[p1] / patterns[p3] の各 example に sceneCharacters[] 追加 (sentence 検出と一致・metadata 一貫性)
  4. _meta.changes に v2.12 を追加
"""

import json
import sys

PATH = "data/lesson_01.json"

with open(PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# ---------- p1 examples: sceneCharacters 追加 ----------
p1 = next(p for p in data["patterns"] if p["id"] == "p1")
p1_scene = {
    "1-1": ["鈴木"],
    "1-2": ["リン"],
    "1-3": ["キム"],
    "1-4": ["鈴木"],
    "1-5": ["リン"],
}
for ex in p1["examples"]:
    if ex["no"] in p1_scene:
        ex["sceneCharacters"] = p1_scene[ex["no"]]
    # isAnchor を再確認 (anchor は 1-1 のまま)
print(f"[p1] sceneCharacters added to {len(p1['examples'])} examples")

# ---------- p2 examples: 5 件 → 8 件に再構成 ----------
p2 = next(p for p in data["patterns"] if p["id"] == "p2")

new_p2_examples = [
    {
        "no": "2-1",
        "pattern": "〜ですか",
        "vocab": None,
        "sentence": "リンさんですか。",
        "sentenceEn": "Is it Lin-san?",
        "imageId": "ex_L01_006",
        "imageRole": "scene",
        "sceneCharacters": ["リン"],
        "originalSources": [
            {
                "textbookId": "ABC",
                "textbookName": "日本語の教え方ABC",
                "lesson": 1,
                "originalSentence": "リンさんですか。",
                "replacementNote": "PDF p.6 文型セクション 2-1 原典。v2.12: anchor を 2-4 から本例文に戻す(PDF原典回帰・分離型代表)。",
            }
        ],
        "_comment": "p2アンカー例文(2-1)。PDF p.6 文型原典。リンさんとの初遭遇シーン。リン portrait ref。",
        "audioId": "sentence_ex_L01_006",
        "isAnchor": True,
    },
    {
        "no": "2-2",
        "pattern": "はい〜です／いいえ〜じゃありません",
        "vocab": None,
        "sentence": "はい、リンさんです。／いいえ、リンさんじゃありません。",
        "sentenceEn": "Yes, it's Lin-san. / No, it's not Lin-san.",
        "imageId": "ex_L01_007",
        "imageRole": "scene",
        "sceneCharacters": ["リン"],
        "originalSources": [
            {
                "textbookId": "ABC",
                "textbookName": "日本語の教え方ABC",
                "lesson": 1,
                "originalSentence": "はい、リンさんです。／いいえ、リンさんじゃありません。",
                "replacementNote": "PDF p.6 文型セクション 2-2 原典。v2.12: 維持(肯定/否定セットを 1 example として保持)。",
            }
        ],
        "_comment": "p2 応答例文(肯定/否定セット)。PDF p.6 文型原典。リン portrait ref。",
        "audioId": "sentence_ex_L01_007",
        "isAnchor": False,
    },
    {
        "no": "2-3",
        "pattern": "だれですか",
        "vocab": None,
        "sentence": "だれですか。",
        "sentenceEn": "Who is it?",
        "imageId": "ex_L01_008",
        "imageRole": "scene",
        "sceneCharacters": [],
        "originalSources": [
            {
                "textbookId": "ABC",
                "textbookName": "日本語の教え方ABC",
                "lesson": 1,
                "originalSentence": "だれですか。−キムさんです。",
                "replacementNote": "PDF p.6 文型セクション 2-3 前半(Q)。v2.12: Q と A を分離(新 2-3 = Q / 新 2-4 = A)。",
            }
        ],
        "_comment": "p2 疑問詞「だれ」Q 単独。NAMED_CHARACTER 不在(まだ確認していない人物を問う場面)。ref attach なし。",
        "audioId": "sentence_ex_L01_008",
        "isAnchor": False,
    },
    {
        "no": "2-4",
        "pattern": "〜です(応答)",
        "vocab": None,
        "sentence": "キムさんです。",
        "sentenceEn": "It's Kim-san.",
        "imageId": "ex_L01_009",
        "imageRole": "vocab_person",
        "sceneCharacters": ["キム"],
        "originalSources": [
            {
                "textbookId": "ABC",
                "textbookName": "日本語の教え方ABC",
                "lesson": 1,
                "originalSentence": "だれですか。−キムさんです。",
                "replacementNote": "PDF p.6 文型セクション 2-3 後半(A)。v2.12: 新 2-3 から分離して独立例文化。キム portrait ref。",
            }
        ],
        "_comment": "p2「だれですか」への応答。キムさん(会社員・韓国人・男性)。NAMED_CHARACTER_PROFILES と連動。",
        "audioId": "sentence_ex_L01_009",
        "isAnchor": False,
    },
    {
        "no": "2-5",
        "pattern": "〜ですか(職業)",
        "vocab": "先生",
        "sentence": "先生ですか。",
        "sentenceEn": "Are you a teacher?",
        "imageId": "ex_L01_010",
        "imageRole": "scene",
        "sceneCharacters": ["鈴木"],
        "originalSources": [
            {
                "textbookId": "ABC",
                "textbookName": "日本語の教え方ABC",
                "lesson": 1,
                "originalSentence": "(v2.10新規追加→ v2.12 分離型化)",
                "replacementNote": "PDF p.4「職業・国籍の練習」由来。v2.10 で結合型「先生ですか→はい/いいえ」として追加。v2.12 で Q と A を分離(新 2-5 = Q / 新 2-6 = A)。対象は鈴木さん(先生・日本人)に確定。",
            }
        ],
        "_comment": "p2 職業疑問文 Q 単独。対象は鈴木さん(p1-1/1-4 で確立)。鈴木 portrait ref。v2.12: 結合型から分離。",
        "audioId": "sentence_ex_L01_010",
        "isAnchor": False,
    },
    {
        "no": "2-6",
        "pattern": "はい〜です／いいえ〜じゃありません",
        "vocab": "先生",
        "sentence": "はい、先生です。／いいえ、先生じゃありません。",
        "sentenceEn": "Yes, I am a teacher. / No, I am not a teacher.",
        "imageId": "ex_L01_011",
        "imageRole": "scene",
        "sceneCharacters": ["鈴木"],
        "originalSources": [
            {
                "textbookId": "ABC",
                "textbookName": "日本語の教え方ABC",
                "lesson": 1,
                "originalSentence": "(v2.10新規追加→ v2.12 分離型化)",
                "replacementNote": "v2.12: 旧 2-4 結合型「先生ですか→はい/いいえ」から A 部分を独立例文化(新 2-6)。対象は鈴木さん。",
            }
        ],
        "_comment": "p2 職業応答(肯定/否定セット)。対象は鈴木さん(先生・日本人)。鈴木 portrait ref。",
        "audioId": "sentence_ex_L01_011",
        "isAnchor": False,
    },
    {
        "no": "2-7",
        "pattern": "〜ですか(国籍)",
        "vocab": "韓国人",
        "sentence": "韓国人ですか。",
        "sentenceEn": "Are you Korean?",
        "imageId": "ex_L01_012",
        "imageRole": "scene",
        "sceneCharacters": ["キム"],
        "originalSources": [
            {
                "textbookId": "ABC",
                "textbookName": "日本語の教え方ABC",
                "lesson": 1,
                "originalSentence": "(v2.10新規追加→ v2.12 分離型化)",
                "replacementNote": "PDF p.4「職業・国籍の練習」由来。v2.10 で結合型として追加。v2.12 で Q と A を分離(新 2-7 = Q / 新 2-8 = A)。対象はキムさん(会社員・韓国人)。",
            }
        ],
        "_comment": "p2 国籍疑問文 Q 単独。対象はキムさん(p1-3 / 新 2-4 で確立)。キム portrait ref。v2.12: 結合型から分離。",
        "audioId": "sentence_ex_L01_012",
        "isAnchor": False,
    },
    {
        "no": "2-8",
        "pattern": "はい〜です／いいえ〜じゃありません",
        "vocab": "韓国人",
        "sentence": "はい、韓国人です。／いいえ、韓国人じゃありません。",
        "sentenceEn": "Yes, I am Korean. / No, I am not Korean.",
        "imageId": "ex_L01_013",
        "imageRole": "scene",
        "sceneCharacters": ["キム"],
        "originalSources": [
            {
                "textbookId": "ABC",
                "textbookName": "日本語の教え方ABC",
                "lesson": 1,
                "originalSentence": "(v2.10新規追加→ v2.12 分離型化)",
                "replacementNote": "v2.12: 旧 2-5 結合型「韓国人ですか→はい/いいえ」から A 部分を独立例文化(新 2-8)。対象はキムさん。",
            }
        ],
        "_comment": "p2 国籍応答(肯定/否定セット)。対象はキムさん(会社員・韓国人)。キム portrait ref。",
        "audioId": "sentence_ex_L01_013",
        "isAnchor": False,
    },
]

p2["examples"] = new_p2_examples
print(f"[p2] examples reconstructed: 5 -> {len(new_p2_examples)}")

# ---------- p3 examples: sceneCharacters 追加 ----------
# (imageId/audioId rename は既に Edit で完了済)
p3 = next(p for p in data["patterns"] if p["id"] == "p3")
p3_scene = {
    "3-1": ["タノム"],
    "3-2": ["鈴木"],
    "3-3": ["キム"],
    "3-4": ["リン"],
    "3-5": ["キム"],
}
for ex in p3["examples"]:
    if ex["no"] in p3_scene:
        # 既に追加済みかもしれないので idempotent
        ex["sceneCharacters"] = p3_scene[ex["no"]]
print(f"[p3] sceneCharacters reconfirmed for {len(p3['examples'])} examples")

# ---------- _meta.changes に v2.12 追加 ----------
v212_note = (
    "v2.12 (2026-05-26): X-c 例文 revision + 画像再生成第一陣。"
    "(1) patterns[p2].examples を 5 件 → 8 件に分離型再構成: 旧 2-3(Q+A)/2-4(Q+肯定+否定)/2-5(Q+肯定+否定) を Q と A 別 example に分割。"
    "(2) anchor を 旧 2-4(先生ですか) から 新 2-1(リンさんですか) に戻す(PDF p.6 文型 2-1 原典回帰・v2.11.1 Bug④A 修正の差し戻し)。"
    "(3) patterns[p3].examples の imageId/audioId を ex_L01_011..015 → ex_L01_014..018 に shift(p2 拡張分の番号確保)。"
    "(4) 全 examples(p1+p2+p3 = 18 件) に sceneCharacters[] field 追加(PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE v4.0.5 対応・主語省略文の addressee 明示用)。"
    "(5) キャラ分布: リン 4(p1-2/1-5 + p2-1/2-2 + p3-4) / 鈴木 4(p1-1/1-4 + p2-5/2-6 + p3-2) / キム 5(p1-3 + p2-4/2-7/2-8 + p3-3/3-5) / タノム 1(p3-1) / なし 1(p2-3 だれですか)。"
    "formatVersion 2.7 維持。"
)
data["_meta"]["changes"].append(v212_note)
print(f"[_meta.changes] v2.12 entry added")

# ---------- _meta.lessonVersion bump ----------
data["_meta"]["lessonVersion"] = "1.2"
print(f"[_meta] lessonVersion: 1.1 -> 1.2")

# ---------- write ----------
with open(PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")  # POSIX-style final newline

print("done.")
