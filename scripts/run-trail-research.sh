#!/usr/bin/env bash
# T-048 실행기 — 결과 파일이 검사기를 통과하지 못한 slug 만 골라 Codex 에 한 곳씩 맡긴다.
# 큰 목록을 한 번에 주면 Codex 가 1곳만 하고 끝낸다(9/20 실측) → 한 번에 1곳, 완료 판정은 파일 검사로.
set -u
cd "$(dirname "$0")/.."

COMPANION="$HOME/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs"
BRIEF="docs/70-agent-workspace/tasks/T-048-전국-순례길-조사/지시서.md"
SLUGS="suwon-didimgil wonju-nimuigil hanti-gil gwangju-pilgrimage jeju-pilgrimage andong-walking jeonju-gyouchon boryeong-galmaemot naepo-catholic-trail beogeunae"
LOG="data/research/trails/_run.log"
mkdir -p data/research/trails

for slug in $SLUGS; do
  out="data/research/trails/$slug.json"
  for try in 1 2; do  # 같은 곳 두 번 실패하면 넘어가고 Claude 가 본다
    if python scripts/trail-research-check.py "$out" >/dev/null 2>&1; then break; fi
    echo "== $(date '+%H:%M') $slug 시도 $try" | tee -a "$LOG"
    node "$COMPANION" task --write --fresh --effort low \
      "$BRIEF 를 읽고 그대로 따르라. 이번에 조사할 slug 는 $slug 하나뿐이다. 결과는 $out 에 쓰고, python scripts/trail-research-check.py $out 이 OK 를 낼 때까지 고쳐라." \
      >> "$LOG" 2>&1
  done
  python scripts/trail-research-check.py "$out" | tee -a "$LOG"
done
