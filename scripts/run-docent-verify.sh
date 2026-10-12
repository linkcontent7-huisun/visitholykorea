#!/usr/bin/env bash
# T-050 원고 검증 실행기 — 검증 파일이 검사기를 통과하지 못한 곳만 Codex 에 한 곳씩 맡긴다.
# (run-trail-verify.sh 와 같은 방식: 한 번에 한 곳, 두 번까지 재시도, 검사기로 끝났는지 판정)
set -u
export PYTHONIOENCODING=utf-8  # 10/6 실측: 없으면 Windows 콘솔(cp949)에서 검사기가 「—」 출력 중 죽어 exit 1 → 매번 Codex 를 두 번 돌리게 됨
cd "$(dirname "$0")/.."

COMPANION="$HOME/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs"
BRIEF="${BRIEF:-docs/70-agent-workspace/tasks/T-050-빠진-성지-오디오가이드/검증-지시서.md}"
DIR="${DIR:-data/research/missing-sites/docent}"
EFFORT="${EFFORT:-medium}"  # 9/18 지침: 낮은 추론으로 검증하지 않는다
LOG="$DIR/_verify/_run.log"
CODES="${*:-$(ls $DIR/*.json | xargs -n1 basename | sed 's/\.json$//')}"

# MODE=info 면 siteInfo(성지 기본 정보) 검증 — 지시서의 「2차」 절
MODE="${MODE:-}"
for code in $CODES; do
  doc="$DIR/$code.json"
  if [ "$MODE" = info ]; then out="$DIR/_verify/$code.info.verify.json"; what="그 파일의 siteInfo 블록만 (지시서 「2차」 절)"; else out="$DIR/_verify/$code.verify.json"; what="그 원고"; fi
  for try in 1 2; do
    if python scripts/docent-verify-check.py "$doc" "$out" $MODE >/dev/null 2>&1; then break; fi
    echo "== $(date '+%H:%M') $code 시도 $try" | tee -a "$LOG"
    PROMPT="$BRIEF 를 읽고 그대로 따르라. 이번에 검증할 것은 $doc 의 $what 이다. 결과는 $out 에 쓰고, python scripts/docent-verify-check.py $doc $out $MODE 이 OK 를 낼 때까지 고쳐라."
    if [ "${CODEX_DIRECT:-1}" = 1 ]; then
      # 10/12 실측: Codex CLI 0.161 의 Windows 샌드박스 도우미가 "helper_unknown_error: setup refresh had errors" 로
      # 모든 명령을 거절해(폴더 생성조차 안 됨) companion 의 workspace-write 로는 결과 파일을 못 쓴다.
      # 샌드박스를 끄고(danger-full-access) codex exec 를 직접 부르면 정상. 도우미가 고쳐지면 CODEX_DIRECT=0 으로 companion 경로.
      codex exec --skip-git-repo-check --sandbox danger-full-access -c "model_reasoning_effort=\"$EFFORT\"" "$PROMPT" >> "$LOG" 2>&1
    else
      node "$COMPANION" task --write --fresh --effort "$EFFORT" "$PROMPT" >> "$LOG" 2>&1
    fi
  done
  PYTHONIOENCODING=utf-8 python scripts/docent-verify-check.py "$doc" "$out" $MODE | tee -a "$LOG"
done
