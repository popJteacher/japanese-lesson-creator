# docs/SESSION_START.md — セッションの始め方（1 ページ）

> どちらのチャネルで何を頼むかを 1 ページに集約。プロトコル本体は `CLAUDE.md`。

---

## Claude Code（実行担当）の始め方

最初のメッセージは **これ 1 行**：

```
CLAUDE.md と NEXT_ACTIONS.md を読んで NEXT_ACTIONS ① から続けて
```

これで現在地・次の行動が機械導出され、①から手が動く。
個別タスク（検証・スクリプト・コミット）はその場で具体的に追加指示する。

---

## claude.ai 決定チャット（判断担当）の始め方

新しいチャットを開いて、**この 3 ファイルだけ添付**：

1. `CLAUDE.md`
2. `NEXT_ACTIONS.md`
3. `docs/REFERENCE.md`

最初のメッセージは **決めたい 1 点だけ**。例：

> 「次セッションで building テンプレを実装する。
>  flag_shape_and_colors と同様の per-word config を Sheets に列追加するか
>  lesson_NN.json に格上げするか、どちらが筋がよいか？」

決定が出たら、その結論を Claude Code に渡して実行に移す。
**コードや実装を claude.ai 側で書かない**（履歴が分散して負ける）。

---

## 原則

| 場面 | チャネル |
|---|---|
| コード・スクリプト・コミット・検証コマンド・調査 | **Claude Code** |
| 設計方針・スコープ・トレードオフ・教育内容（例文・語彙確定） | claude.ai 決定チャット |
| 迷ったら | **Claude Code**（迷ったら寄せる方を 1 つに固定する） |

> 「実行は Claude Code、決定だけ claude.ai」。決定面積を小さく保つほど引き継ぎ損失が減る。
