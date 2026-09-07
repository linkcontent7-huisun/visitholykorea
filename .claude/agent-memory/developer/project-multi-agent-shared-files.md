---
name: project-multi-agent-shared-files
description: 여러 에이전트가 같은 폴더를 동시에 만지므로 공용 파일(dictionary.ts 등)은 백업·복원 방식으로 실험하지 않는다
metadata:
  type: project
---

이 저장소는 Claude Code 창 여러 개가 **같은 폴더·같은 브랜치**를 동시에 본다(AGENTS.md).
공용 파일 — `src/shared/i18n/dictionary.ts`, `src/shared/api/query-keys.ts`,
`src/app/routes/paths.ts` — 은 여러 작업이 같이 만진다.

**Why:** 2026-09-05 T-006 작업 중, "언어 하나를 지우면 타입 검사가 잡는가"를 확인하려고
`dictionary.ts` 를 `cp` 로 백업했다가 2분 뒤 되돌렸다. 그 사이 다른 세션(T-007, 영어모드
잔존 한국어)이 같은 파일을 고쳤다면 조용히 지워졌을 것이다. 결과적으로는 무사했지만
(되돌린 뒤 `git diff` 로 내 추가분 98줄뿐임을 확인, verify 통과) 알아채기 어려운 종류의 사고였다.

**How to apply:** 공용 파일을 잠깐 망가뜨려 보는 검증이 필요하면 파일 통째 복원 대신
**그 자리를 Edit 로 되돌린다**(지운 줄만 다시 넣는다). 작업 시작·종료 시 `git status` 를
찍어 내가 만들지 않은 수정 파일을 기록하고, 그 파일은 열지 않는다.

관련: [[reference-headless-chrome-ui-verification]]
