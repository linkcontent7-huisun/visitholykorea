---
name: new-site-audio-guide
description: 앱 DB 에 없는 성지를 찾아 문헌 자료로 6개 국어 오디오 가이드(도슨트) 원고를 만들고 Codex 로 검증해 두는 절차. 사용자가 "빠진 성지 찾아", "새 성지 원고", "오디오 가이드 원고 써", "성지 원고 번역", "도슨트 원고 만들어" 라고 하면 이 스킬을 따른다. 현장에서 사진·구술로 쓰는 경우는 docent-survey 스킬.
---

# 빠진 성지 → 6개 국어 오디오 가이드 원고

현장에 가지 않고 **문헌만으로** 원고를 쓰는 절차다. 현장 사진·구술이 있으면 `docent-survey` 를 쓴다.
T-024(지점 원고 74곳)·T-028/029(번역)·T-049(빠진 성지)·T-050(빠진 성지 원고)에서 굳었다.

**가장 중요한 규칙 하나: 사본에 없는 문장은 쓰지 않는다.** 2026-09-17 밤 173곳을 틀 문장으로 채워 하루치를 통째로 버린 사고가 있었다(T-023). 그럴듯하게 지어내는 것이 가장 나쁜 결과다. 자료가 모자라면 그 성지를 **보류**하고 이유를 적는다.

## 0. 시작 전

1. `git pull` → `docs/이어서-할-일.md` 를 읽는다.
2. 맨 위에 "🚧 지금 하는 중" 한 줄을 쓰고 **바로 커밋·푸시**한다 (9/21 두 창이 같은 일을 한 사고).
3. 작업 폴더를 `docs/70-agent-workspace/tasks/T-0xx-…/` 로 만든다. 지난 예: `T-050-빠진-성지-오디오가이드/`.

## 1. 빠진 성지 찾기 — 교구별 목록

| 원천 목록 | 위치 |
| --- | --- |
| 사장님 책자 차례 167곳 | `data/research/book-toc/toc-2026-09-29.json` |
| 주교회의 주소록 「성지사적지」 194곳 | `data/research/cbck-directory.jsonl` |
| 교구 누리집 성지 목록 | 교구마다 다름 (예: 전주교구 `jcatholic.or.kr/theme/main/pages/terrasantaNN.php` 22곳) |
| 우리 DB | 로컬 세션에서 조회. 없으면 스냅샷 `data/archive/2026-08-supabase/snapshot_*.json` (8월 기준임을 적는다) |

- 이름만 대조하면 「이름이 아주 다른 같은 곳」이 섞인다 → **주소로 다시 확인**. 주소가 같으면 새 성지가 아니라 기존 성지 원고에 덧붙일 후보.
- 결과를 지시서에 **교구 | 성지 | 코드 | 원고 상태 | 비고** 표로 남긴다.

## 2. 자료 찾기 — 네 갈래

곳마다 **역사적 배경 · 지리(위치·지형·지명 유래) · 순교자(누가, 언제, 어떻게) · 요즘 현황(문화유산 지정·정비·행사·미사 여부)** 을 찾는다.

**신뢰 순서:** 성지·교구 공식 누리집 → 주교회의 주소록(directory.cbck.or.kr) → 굿뉴스(maria / m.catholic / home.catholic.or.kr) → 가톨릭신문(catholictimes.org)·가톨릭평화신문(cpbc) → 국가유산청 → 지역 언론 → 위키백과. **블로그·카페·나무위키는 위치 확인용으로만**, 사실의 근거로 쓰지 않는다.

**사본을 반드시 저장한다.** Codex 작업 환경은 인터넷이 막혀 있다(T-048 9/28 실측). 사본이 없으면 Codex 가 "확인불가"로 통과시킨다.

```bash
python scripts/save-source-page.py data/research/missing-sites/_pages/<code> <이름> "<url>"
python scripts/source-digest.py data/research/missing-sites/_pages/<code> 70   # 본문다운 줄만 읽기
```

- 검색: `mcp__firecrawl__firecrawl_search` (`sources:["web"]`). 여러 개를 한꺼번에 부르면 **429(요청 한도)** 가 난다(9/29) → `WebSearch` 로 바꾼다. claude.ai 쪽 Firecrawl 커넥터는 권한 오류가 났다(9/29).
- 자바스크립트로 그리는 페이지(cpbc 기사, 국가유산포털)는 사본이 비어 나온다 → 저장 뒤 글자 수를 꼭 본다. 50자 안팎이면 다른 출처를 찾는다.
- 교구 누리집 한 페이지의 메뉴·꼬리말에 **같은 교구의 다른 성지 목록**이 있다. 빠진 성지를 더 찾는 단서가 된다.

## 3. 원고 쓰기 — 한국어 + 영어 (Claude)

파일: DB 에 아직 없는 성지는 `data/research/missing-sites/docent/<code>.json` (`siteId: null`, `cbckCode` 추가). 형식은 `data/docent/_템플릿.json`.

- `intro` 2~4문장 · `points` **3~6개**(3개를 근거로 못 채우면 보류) · `outro` 1~3문장.
- `narration` 3~6문장, **안내자가 옆에서 말하는 존댓말 구어체**("~보세요", "~입니다"). TTS 로 읽힌다. 「~였다」 같은 문어체 금지(검사기가 잡는다).
- **다른 성지에도 붙는 문장 금지:** "고요히 기도하며 걸어보세요", "순교자들의 신앙을 느껴보세요". 문장마다 그 성지에서만 참인 사실이 있어야 한다.
- `location` 은 애매해도 된다("성당 정면", "묘역 가운데"). 모르는 위치를 지어내지 않는다.
- `lookFor` 는 출처에 있는 디테일만, 없으면 null. `forEveryone` 은 비신앙인·외국인용 한 줄, 없으면 null.
- `sourceNote` 는 **URL + 사본 경로** 둘 다.
- 사본끼리 다르면(예: 연도) 더 확실한 쪽을 쓰거나 연도를 빼고 "곧"처럼 쓴다. 두 사본을 섞어 새 사실을 만들지 않는다.
- 박해·처형 이야기는 사실대로 쓰되 묘사를 늘리지 않는다. 교회가 가해자였던 사건(예: 1901년 신축교안)도 감추지 않는다.
- 영어는 Claude 가 쓴다. 표기: Andrew Kim Taegon(`Kim Dae-geon` 금지), Thomas Choe Yang-eop, 박해 이름은 Byeongin/Sinyu 등 로마자. **한국어에 없는 서양 이름·사실을 영어에 붙이지 않는다**(예: "김보록 신부"를 근거 없이 "Father Robert" 로 쓰지 말 것).

검사: `PYTHONIOENCODING=utf-8 python scripts/docent-check-points.py data/research/missing-sites/docent` → **실패 0 · 틀 문장 0**.

## 4. 검증 (Codex) → 반영 (Claude)

```bash
bash scripts/run-docent-verify.sh            # 전부, 또는 코드 몇 개만 인자로
```

- Codex 가 한국어 **문장마다** `근거있음/근거없음/틀림` + 사본 인용, 영어는 부분마다 `일치/어긋남` 을 `_verify/<code>.verify.json` 에 쓴다. 지시서: `docs/70-agent-workspace/tasks/T-050-빠진-성지-오디오가이드/검증-지시서.md`.
- 실행기는 한 곳씩, 두 번까지 재시도하고 `scripts/docent-verify-check.py` 로 끝났는지 판정한다.
- Claude 가 `근거없음·틀림·어긋남` 을 **사본을 다시 열어** 확인하고 원고를 고친다. Codex 가 틀렸으면 이유를 개발기록에 적는다.
- **Claude 와 Codex 둘 다 OK 인 곳만** 번역으로 넘긴다 (9/29 사장님 지침: 둘 다 OK 일 때만 진행).

## 5. 4개 국어 (Codex)

```bash
bash scripts/run-docent-translate.sh
```

- 영어가 원문. es → it → pt → fr. 기준은 `docs/00-overview/가이드/다국어-번역-작업-지침.md` 3장(세례명 표기표).
- Codex 에게 반드시: **"번역은 네가 직접 쓴다 — 로컬 모델·번역 API 금지"**(안 쓰면 노트북 `hermes3` 로 뽑으려 든다), `--write --fresh`(없으면 저장 못 함 / 엉뚱한 스레드를 이음).
- 검사기(`docent-check-points.py`)가 빈 칸·한글 섞임·`Kim Dae-geon` 을 잡는다. **어색한 문장은 못 잡는다** → Claude 가 곳마다 한 지점씩 표본으로 읽는다.
- 10곳 안팎이면 Claude 가 직접 번역하는 편이 빠를 수 있다(100곳 14분, 9/21 실측). 사장님이 Codex 협업을 원하면 Codex 에 맡긴다.

## 6. DB 반영 (심사 기간 기능 동결이 풀린 뒤에만)

1. `data/research/missing-sites/drafts.json`(T-049) 으로 `holy_sites` 에 성지를 넣는다 → `siteId` 를 받는다.
2. 원고의 `siteId` 를 채워 `data/docent/<성지이름-하이픈>.json` 으로 옮긴다.
3. `npm run docent:check` → `npm run docent:load -- <성지>`.
4. 성지 이름·소개·역사 번역은 `translate:export / check / import` (번역 작업 지침 2장).
5. 브라우저에서 그 언어로 성지 상세를 열어 **눈으로** 본다. 여기까지 해야 "됐다".

## 7. 끝낼 때

- 지시서 진행표와 `docs/이어서-할-일.md` 를 그 자리에서 고친다. 숫자에는 잰 날짜를 붙인다.
- 커밋은 경로를 지정한다: `git commit -- <경로>` (세션끼리 index 를 공유한다, `-a` 금지).
- 문서만 바뀐 커밋이어도 main 푸시는 Vercel 배포를 부른다 — 심사 기간엔 코드(`src/`)를 건드리지 않았는지 확인.
