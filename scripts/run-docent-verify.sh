#!/usr/bin/env bash
# T-050 원고 검증 실행기 — 검증 파일이 검사기를 통과하지 못한 곳만 Codex 에 한 곳씩 맡긴다.
# (run-trail-verify.sh 와 같은 방식: 한 번에 한 곳, 두 번까지 재시도, 검사기로 끝났는지 판정)
set -u
cd "$(dirname "$0")/.."

COMPANION="$HOME/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs"
BRIEF="docs/70-agent-workspace/tasks/T-050-빠진-성지-오디오가이드/검증-지시서.md"
DIR="data/research/missing-sites/docent"
LOG="$DIR/_verify/_run.log"
CODES="${*:-$(ls $DIR/*.json | xargs -n1 basename | sed 's/\.json$//')}"

for code in $CODES; do
  doc="$DIR/$code.json"; out="$DIR/_verify/$code.verify.json"
  for try in 1 2; do
    if python scripts/docent-verify-check.py "$doc" "$out" >/dev/null 2>&1; then break; fi
    echo "== $(date '+%H:%M') $code 시도 $try" | tee -a "$LOG"
    node "$COMPANION" task --write --fresh --effort low \
      "$BRIEF 를 읽고 그대로 따르라. 이번에 검증할 곳은 $doc 하나뿐이다. 결과는 $out 에 쓰고, python scripts/docent-verify-check.py $doc $out 이 OK 를 낼 때까지 고쳐라." \
      >> "$LOG" 2>&1
  done
  PYTHONIOENCODING=utf-8 python scripts/docent-verify-check.py "$doc" "$out" | tee -a "$LOG"
done
