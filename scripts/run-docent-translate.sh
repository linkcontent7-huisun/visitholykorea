#!/usr/bin/env bash
# T-050 원고 4개 국어 실행기 — es·it·pt·fr 가 다 채워지지 않은 곳만 Codex 에 한 곳씩 맡긴다.
set -u
cd "$(dirname "$0")/.."
export PYTHONIOENCODING=utf-8

COMPANION="$HOME/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs"
BRIEF="docs/70-agent-workspace/tasks/T-050-빠진-성지-오디오가이드/번역-지시서.md"
DIR="data/research/missing-sites/docent"
LOG="$DIR/_verify/_translate.log"
CODES="${*:-$(ls $DIR/*.json | xargs -n1 basename | sed 's/\.json$//')}"

# 네 언어가 여는 말·모든 지점·맺음말에 다 있는가
done_langs() {
  python -c "
import json,sys
d=json.load(open('$1',encoding='utf-8'))
ok=all(d['intro'].get('narration'+x) and d['outro'].get('narration'+x) and all(p.get('narration'+x) and p.get('title'+x) for p in d['points']) for x in ('Es','It','Pt','Fr'))
sys.exit(0 if ok else 1)"
}

for code in $CODES; do
  doc="$DIR/$code.json"
  for try in 1 2; do
    if done_langs "$doc" && python scripts/docent-check-points.py "$DIR" >/dev/null 2>&1; then break; fi
    echo "== $(date '+%H:%M') $code 번역 시도 $try" | tee -a "$LOG"
    node "$COMPANION" task --write --fresh --effort low \
      "$BRIEF 를 읽고 그대로 따르라. 이번에 번역할 곳은 $doc 하나뿐이다. 끝나면 python scripts/docent-check-points.py $DIR 가 실패 0 인지 확인하라." \
      >> "$LOG" 2>&1
  done
  if done_langs "$doc"; then echo "OK $code 4개 국어" | tee -a "$LOG"; else echo "FAIL $code" | tee -a "$LOG"; fi
done
python scripts/docent-check-points.py "$DIR" | tee -a "$LOG"
