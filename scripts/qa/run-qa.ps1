# VisitHolyKorea 매일 QA — 윈도우 작업 스케줄러가 부른다 (2026-10-14).
# Claude 를 머리 없이(-p) 띄워 QA-지시서.md 를 따르게 한다. 로그: .scratch/qa/logs/<날짜>.log
$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repo
$day = (Get-Date).ToString('yyyy-MM-dd')
$logDir = Join-Path $repo '.scratch\qa\logs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir "$day.log"

$env:AGENT_BROWSER_SESSION = 'qa'
$env:AGENT_BROWSER_ARGS = '--mute-audio'
$env:AGENT_BROWSER_INIT_SCRIPTS = Join-Path $repo 'scripts\qa\silence.js'

"== $(Get-Date -Format o) 시작" | Out-File $log -Append -Encoding utf8
git pull --ff-only *>> $log
$prompt = "docs/70-agent-workspace/qa/QA-지시서.md 를 읽고 그대로 따르라. 오늘은 $day 이다. 보고서를 쓰고 그 파일만 커밋·푸시한 뒤 요약 한 줄로 끝내라."
& claude -p $prompt --dangerously-skip-permissions *>> $log
"== $(Get-Date -Format o) 끝 (exit $LASTEXITCODE)" | Out-File $log -Append -Encoding utf8
& agent-browser close *>> $log
