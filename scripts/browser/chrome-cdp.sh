#!/usr/bin/env bash
# 실제 Chrome 을 CDP(Chrome DevTools Protocol, 원격 조종 포트) 열고 띄운다.
# agent-browser(Playwright 기반)가 이 포트로 붙어 화면을 열고 스크린샷을 찍는다.
#
# 🔴 Git Bash(Bash 도구)에서 실행한다. PowerShell 의 Start-Process 로 띄우면 Chrome 이
#    곧바로 종료돼 포트가 안 열린다 (2026-09-15 실측, 샌드박스 유무 무관).
#    반대로 agent-browser 는 PowerShell 에서만 동작한다 — 역할을 나눈다.
#
# 왜 별도 프로필인가: 평소 쓰는 Chrome 은 원격 포트 없이 이미 떠 있어서,
# 같은 프로필로 다시 띄우면 기존 창에 흡수돼 포트가 안 열린다.
#
# 사용:  bash scripts/browser/chrome-cdp.sh                       # 배포본
#        bash scripts/browser/chrome-cdp.sh http://localhost:5173  # 로컬 dev 서버
#        bash scripts/browser/chrome-cdp.sh --stop                 # 닫기
set -u
URL="${1:-https://visitholykorea-app.vercel.app/}"
PORT=9222
WIDTH=430   # 갤럭시·아이폰 큰 화면 폭. 순례자 대부분이 모바일로 쓴다.
HEIGHT=932
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
PROFILE="$LOCALAPPDATA/visitholykorea-chrome-cdp"

if [ "$URL" = "--stop" ]; then
  # 이 프로필로 뜬 Chrome 만 골라 닫는다. 평소 쓰는 Chrome 은 건드리지 않는다.
  powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"name='chrome.exe'\" | Where-Object { \$_.CommandLine -like '*visitholykorea-chrome-cdp*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }"
  echo "CDP Chrome 닫음 (port $PORT)"
  exit 0
fi

[ -f "$CHROME" ] || { echo "Chrome 이 없다: $CHROME"; exit 1; }

# 이미 떠 있으면 다시 띄우지 않는다.
if curl -sf "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
  echo "이미 떠 있음: port $PORT"
  exit 0
fi

mkdir -p "$PROFILE"
"$CHROME" --remote-debugging-port=$PORT --user-data-dir="$PROFILE" \
  --no-first-run --no-default-browser-check --window-size=$WIDTH,$HEIGHT \
  "$URL" >/dev/null 2>&1 &

# 포트가 열릴 때까지 최대 15초 기다린다.
for _ in $(seq 1 30); do
  sleep 0.5
  if curl -sf "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
    echo "준비됨: $(curl -s http://127.0.0.1:$PORT/json/version | grep -o '"Browser": "[^"]*"')  port $PORT  창 ${WIDTH}x${HEIGHT}"
    echo "다음(PowerShell): agent-browser --cdp $PORT open <url>  /  .\\scripts\\browser\\shoot-all.ps1"
    exit 0
  fi
done
echo "CDP 포트 $PORT 가 열리지 않았다. --stop 으로 남은 Chrome 을 닫고 다시."
exit 1
