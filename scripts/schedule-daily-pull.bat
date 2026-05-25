@echo off
REM ============================================================
REM scripts/schedule-daily-pull.bat
REM
REM Phase 5 ④' で導入された daily 20-word 自動 prompt 生成の Windows 起動 wrapper。
REM タスクスケジューラに登録して毎日朝 9:00 JST に起動する想定。
REM ローカル PC が on のときのみ走る（remote 実行は /schedule に切替）。
REM
REM 登録手順（一度だけ・人間タスク）:
REM   schtasks /create /tn "ClaudeDailyPromptPull" ^
REM     /tr "\"c:\Users\kohn0\Desktop\japanese-lesson-creator-main\scripts\schedule-daily-pull.bat\"" ^
REM     /sc daily /st 09:00
REM
REM 登録解除:
REM   schtasks /delete /tn "ClaudeDailyPromptPull" /f
REM
REM 状態確認:
REM   schtasks /query /tn "ClaudeDailyPromptPull" /v /fo LIST
REM ============================================================

cd /d "c:\Users\kohn0\Desktop\japanese-lesson-creator-main"

REM 日付別ログファイル（data/_meta/skill-daily-pull-YYYYMMDD.log）
set "DSTAMP=%date:~0,4%%date:~5,2%%date:~8,2%"
set "LOG=data\_meta\skill-daily-pull-%DSTAMP%.log"

echo === %date% %time% START === >> "%LOG%"

REM Claude Code CLI を print mode で起動して skill を invoke。
REM 注: claude -p の skill 自動 discover は未検証。
REM     初回テストで挙動を見て、必要なら fallback に切替（下のコメント参照）。
claude -p "/generate-image-prompt mode=daily-pull limit=20" >> "%LOG%" 2>&1

REM Fallback (もし上の skill 自動 discover が動かない場合):
REM claude -p "Read .claude/skills/generate-image-prompt.md and execute it with mode=daily-pull and limit=20" >> "%LOG%" 2>&1

echo === %date% %time% END (exit=%ERRORLEVEL%) === >> "%LOG%"
echo. >> "%LOG%"
