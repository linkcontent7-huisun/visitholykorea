# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

이 저장소에서 작업할 때 참고할 규칙이다. 사람에게도 그대로 적용된다.

## 작업을 시작하기 전에

**`docs/이어서-할-일.md` 부터 읽는다.** 지금 무엇이 끝났고 무엇이 남았는지가 거기 있다.
세션은 이전 대화를 기억하지 못하므로, 상태를 아는 유일한 방법이 이 파일이다.
**작업이 끝나면 그 파일을 그 자리에서 고친다.** 나중에 몰아서 하지 않는다
(2026-08-19 문서가 열흘 넘게 방치돼 끝난 일을 다시 하려던 사고 — `docs/00-overview/인수인계/2026-08-19-인수인계.md`).

세션을 열면 아래 순서로 보고한다 (사장님 지시, 「그만」이라고 하면 해당 단락을 지운다).

1. **운영 서버 점검 (2026-11-02):** `gh issue list --state all --search "운영 서버 매일 점검 in:title" --json number,body --jq '.[0].body'`.
   ✅ 모두 정상이면 한 줄, 🔴 고장이면 무엇이 안 보이는지와 고칠 방법을 먼저. 이슈가 하루 넘게 오래됐으면 점검이 멈춘 것이니 알린다.
   (`.github/workflows/health-check.yml` 매일 07:00 KST → `scripts/ops/health-check.mjs`)
2. **인스타 참고 계정 주간 점검 (2026-11-08, 월요일만):** `gh issue list --state all --search "인스타 참고 계정 주간 점검 in:title" --json body --jq '.[0].body'`
   를 읽고 계정별 **세 줄 안**(지난 7일 게시물 수·반응 좋은 글 형식·우리가 옮길 점). 옮길 점이 크면 `docs/50-research/벤치마킹/`에 정리(스킬 `program-benchmark`).
   인스타 공식 API만 쓴다 (`scripts/ops/instagram-weekly.mjs`, 스크래핑·보안 확인 우회 금지).
3. **재미 요소 일일 보고 (2026-10-25):** `docs/70-agent-workspace/재미요소/일일보고.md` 맨 위 항목을 **5줄 안으로** 보고하고,
   그날 새로 알아낸 것·진척·질문을 맨 위에 새 항목으로 추가한다. 같은 날 두 번째 세션은 보고만 한다.
   보고 끝에 한 줄: 「카톡으로 링크 보내실 때 `docs/60-marketing/카톡-링크-보낼-때-문구.md` 의 문구도 같이 넣으세요」.

**역할별 스킬 (2026-11-12):** 개발 일·조사 결과를 기능으로 바꾸는 일은 `.claude/skills/개발클로드/SKILL.md`,
매체·SNS·벤치마킹 조사는 `.claude/skills/조사클로드/SKILL.md` 를 먼저 읽는다. 두 역할의 우편함은 `docs/50-research/개발요청/`.

숫자(성지 수·사진 수·테스트 수)를 인용할 때는 **언제 잰 값인지** 같이 적는다. 확인 못 한 것은 "확인 못 했다"고 적는다.

### 웹 세션과 로컬 세션은 할 수 있는 일이 다르다

claude.ai/code **웹 세션은 저장소만 복제한 클라우드 컨테이너**다. `.env.local`·OneDrive·DB 를 못 보고,
인터넷은 허용 목록만 나간다(supabase·vercel·TourAPI 차단 — 2026-08-19 실측).

- DB 작업 · OneDrive 자료 · 배포 확인 · 실제 데이터 확인 → **로컬 세션**
- 저장소 안에서 끝나는 코드·문서와 `npm run verify` → 웹 세션도 가능 (먼저 `npm ci`)
- 웹 세션이면 `docs/00-overview/가이드/웹세션-시작하기.md` 를 먼저 읽는다.

창을 옮기기 전에 푸시하고, 열자마자 `git pull` 한다. 다른 창(Claude·Codex)이 같은 폴더에서 일할 수 있으니
**내가 만들지 않은 수정 파일은 건드리지 않고 `git add -A` 를 쓰지 않는다** (2026-09-07 개인 문서 공개 저장소 유출 사고, `AGENTS.md`).

## 이 프로젝트가 무엇인가

한국 가톨릭 성지 206곳(2026-09-18 DB 실측)을 다루는 순례 웹앱. 웹(PWA) · Android · iOS(Capacitor) 를 한 코드베이스로 지원하고,
6개 국어(`ko en es fr pt it`, `shared/i18n/dictionary.ts`)를 쓴다. 운영 주소 https://www.visitholykorea.com (Vercel).
2026 한국관광공사 관광데이터 활용 공모전 제출을 겸하며, 2027 서울 WYD 순례자를 겨냥한다.

## 명령

```bash
npm run dev            # 개발 서버 (localhost:3000). /api/tour 중계도 vite 미들웨어로 같이 뜬다
npm run verify         # typecheck + lint + test — 커밋 전 필수
npm run test           # vitest run (jsdom, src/**/*.test.ts(x) + tests/**)
npx vitest run src/shared/lib/geo.test.ts   # 테스트 하나만
npx vitest run -t "테스트 이름"              # 이름으로 골라 돌리기
npm run format:check   # CI 가 검사한다 (prettier)
npm run build          # tsc → vite build → scripts/seo-prerender.ts
```

CI(`.github/workflows/ci.yml`)는 typecheck · lint · format:check · test · vite build 를 돈다.

**운영 DB 를 건드리는 스크립트** — `db:migrate` · `db:status` · `admin:*` · `photo:*` · `seed:*` · `translate:import` · `docent:load`.
사장님 승인 없이 돌리지 않는다. 읽기 전용 점검은 `translate:status|check`, `docent:status|check`, `content`, `tourapi:check`.

## 구조 (큰 그림)

```
src/app       라우터(routes/router.tsx, 페이지는 lazy 로딩) · 프로바이더 · 레이아웃
src/pages     라우트 단위 페이지 — features 를 조립만 한다
src/features  도메인 기능. 각 기능은 api/(repository) · hooks/ · components/ · lib/
src/shared    api(supabase 클라이언트·tour-api·query-keys) · i18n · config(env) · lib · components/ui
api/          Vercel 서버리스 함수 (tour.ts = TourAPI 중계, 핵심 로직은 api/_lib/tour-proxy-core)
supabase/     migrations(스키마) · seed(성지 데이터) · functions(Edge Function)
scripts/      빌드·운영·콘텐츠 도구 (tsx 로 실행). data/ 는 수집 원천 자료 — 앱이 런타임에 읽지 않는다
```

- **데이터 흐름:** 화면 → feature hook(TanStack Query) → `features/*/api/*.repository.ts` → Supabase.
  DB 행(snake_case) ↔ 도메인 타입(camelCase) 변환은 repository 안에서만 한다. 화면이 `supabase` 를 직접 부르지 않는다.
- **TourAPI:** 브라우저 → 같은 출처 `/api/tour` → 한국관광공사. 서비스키(`TOUR_API_SERVICE_KEY`, VITE_ 없음)는 서버에만 있다.
  로컬은 `vite.config.ts` 의 dev 플러그인이, 운영은 `api/tour.ts` 가 같은 `handleTourProxy` 를 쓴다.
- **Edge Functions:** `ai-guide`(AI 순례 가이드 '미카엘', Claude 1순위·Gemini 예비), `kakao-auth`·`naver-auth`(소셜 로그인),
  `delete-account`, `tour-proxy`. 비밀 키는 `supabase secrets set` 으로만 넣는다.
- **SEO 사전 렌더:** `scripts/seo-prerender.ts` 가 빌드 뒤 `dist/sites/<id>/index.html`·`sitemap.xml`·`robots.txt`·`spa.html` 을 만든다.
  Vercel 은 파일이 있으면 그것을, 없으면 `spa.html` 을 돌려준다(`vercel.json` rewrites). DB 를 못 읽으면 경고만 하고 빌드는 계속된다.
- **3D 가상 순례(`/visit`):** 이 저장소가 아니라 형제 폴더 `../visit-3d`(Three.js · Colyseus, 별도 Vercel 프로젝트)다.
  `vercel.json` 이 `/visit/*` 를 `visitholykorea-visit.vercel.app` 으로 rewrite 한다.
- **제출판 스위치:** `VITE_SUBMISSION_MODE=true`(`shared/lib/feature-flags.ts`)면 관리자 콘솔을 숨긴다.

## 반드시 지킬 것

**TourAPI 응답을 저장하지 않는다.** 매 요청 실시간 호출해야 하며 DB·서비스워커 캐시에 넣으면 공모전 실격 위험이 있다.
반면 `holy_sites` 는 자체 수집 데이터라 얼마든지 저장·캐싱해도 된다. 이 구분을 흐리지 말 것 (`docs/20-architecture/adr/0002-tourapi-usage.md`).

**비밀 키를 클라이언트에 두지 않는다.** `VITE_` 값은 브라우저 번들에 그대로 들어간다. 감출 키는 Edge Function 시크릿이나 `/api` 서버 쪽에 둔다.

**AI 답변은 성지 DB 안으로 제한한다.** `ai-guide` 는 관련 성지 레코드만 컨텍스트로 넣고
"컨텍스트에 없으면 모른다고 답하라"를 시스템 프롬프트에 못 박았다. 이 장치를 걷어내지 말 것.

**더미 데이터를 화면에 남기지 않는다.** 가짜 핀·가짜 카운트·목업 카드는 실제 데이터로 바꾸거나 빼고, 미구현은 "준비 중"으로 정직하게 표시한다.

**코드는 GitHub 저장소가 기준이다.** OneDrive 의 앱 소스 사본·zip 은 구버전이다 (ADR 0005).

**운영 배포·DB 변경은 건마다 사장님 승인.** main 푸시 = Vercel 즉시 배포다. 화면이 깨지는 상태로는 푸시하지 않는다.

## 코드 규칙

- 의존성 방향: `pages → features → shared`. 역방향 import 금지. features 끼리는 도메인상 꼭 필요할 때만.
- 서버 상태는 TanStack Query, 캐시 키는 `shared/api/query-keys.ts` 한 곳에서 만든다.
- 라우트 경로 문자열은 `app/routes/paths.ts` 에서만 정의한다.
- 새 테이블은 `supabase/migrations` 마이그레이션과 `shared/types/database.ts` 를 함께 고친다.
- UI 문구는 `shared/i18n/dictionary.ts` 에 6개 국어로 넣는다.
- 주석과 UI 문구는 한국어로, "무엇을"보다 "왜"를 남긴다.
- 큰 글자 모드를 존중한다 — 고정 px 대신 rem 기반 Tailwind 크기.
- **필요한 것은 묻지 않고 커밋·푸시한다**(2026-09-20 사장님 결정, "main 직접 커밋 금지" 폐지). 커밋 전 `npm run verify` 통과.

## 자주 보는 문서

| 알고 싶은 것                 | 문서                                                      |
| ---------------------------- | --------------------------------------------------------- |
| **지금 상태와 다음 할 일**   | `docs/이어서-할-일.md`                                    |
| 무엇을 언제 만들 것인가      | `docs/10-product/로드맵.md`                               |
| 왜 이렇게 설계했는가         | `docs/20-architecture/` (ADR)                             |
| 성지 취재·촬영               | `docs/30-content-ops/`                                    |
| 도슨트 현장조사              | `docs/30-content-ops/현장-취재/도슨트-현장조사-매뉴얼.md` |
| 순교사·성지 배경지식         | `docs/40-knowledge/00-색인.md`                            |
| 여러 에이전트가 같이 일할 때 | `AGENTS.md`                                               |
