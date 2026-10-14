# 로그온 시 "QA 로그 보여드릴게요" — 작업 스케줄러 VisitHolyKorea-QA-보기 가 부른다 (2026-10-14)
$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$env:QA_PRIVATE_DIR = Join-Path ([Environment]::GetFolderPath('Desktop')) 'VisitHolyKorea-매일보고'
Set-Location $repo
git pull --ff-only *> $null   # 오늘 아침 다른 곳에서 올라온 QA 보고서도 받아 온다
& node (Join-Path $repo 'scripts\qa\show-qa.mjs')
