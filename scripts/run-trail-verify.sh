#!/usr/bin/env bash
# T-048 2차 검증 실행기 — 검증 파일이 검사기를 통과하지 못한 slug 만 Codex 에 한 곳씩 맡긴다.
set -u
cd "$(dirname "$0")/.."

COMPANION="$HOME/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs"
BRIEF="docs/70-agent-workspace/tasks/T-048-전국-순례길-조사/검증-지시서.md"
SLUGS="jeonju-gyouchon suwon-didimgil wonju-nimuigil naepo-catholic-trail beogeunae jeju-pilgrimage hanti-gil gwangju-pilgrimage boryeong-galmaemot andong-walking"
LOG="data/research/trails/_verify/_run.log"

for slug in $SLUGS; do
  out="data/research/trails/_verify/$slug.verify.json"
  for try in 1 2; do
    if python scripts/trail-verify-check.py "$out" >/dev/null 2>&1; then break; fi
    echo "== $(date '+%H:%M') $slug 시도 $try" | tee -a "$LOG"
    node "$COMPANION" task --write --fresh --effort low \
      "$BRIEF 를 읽고 그대로 따르라. 이번에 검증할 slug 는 $slug 하나뿐이다. 결과는 $out 에 쓰고, python scripts/trail-verify-check.py $out 이 OK 를 낼 때까지 고쳐라." \
      >> "$LOG" 2>&1
  done
  python scripts/trail-verify-check.py "$out" | tee -a "$LOG"
done
