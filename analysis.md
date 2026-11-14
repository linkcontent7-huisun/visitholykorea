# 비지트홀리코리아 프로젝트 구조 분석

> 잰 날: 2026-11-14. 기준은 `main-app` 폴더의 `feat/visit-3d` 브랜치(커밋 bf028e2)다.
> 이 브랜치와 운영 브랜치 `origin/main`은 서로 14커밋씩 갈라져 있다. 예를 들어 `api/og.ts`는 main에만 있다.
> 숫자는 모두 이날 직접 센 값이다.

## 1. 한눈에 보기

| 항목      | 값                                                                       |
| --------- | ------------------------------------------------------------------------ |
| 정체      | 한국 가톨릭 성지 206곳 순례 웹앱 (웹 PWA · Android · iOS)                |
| 운영 주소 | https://www.visitholykorea.com (Vercel, main 푸시 = 즉시 배포)           |
| 언어      | 6개 국어 `ko en es fr pt it` (사전 `shared/i18n/dictionary.ts`, 6,601줄) |
| 앱 코드   | `src/` TypeScript 275개 파일, 약 39,500줄                                |
| 테스트    | 72개 파일 (vitest + jsdom)                                               |
| DB        | Supabase(PostgreSQL), 마이그레이션 43개, 테이블 29개                     |
| 커밋 수   | 989 (feat/visit-3d 기준)                                                 |

## 2. 기술 스택

| 층          | 쓰는 것                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| 화면        | React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · React Router 7 · motion |
| 서버 상태   | TanStack Query 5 (캐시 키는 `shared/api/query-keys.ts` 한 곳)              |
| 백엔드      | Supabase: DB · 로그인(Auth) · 행 단위 권한(RLS) · Edge Function            |
| 서버리스    | Vercel `api/` (TourAPI 중계, main에는 공유 카드 이미지 `og.ts`도 있음)     |
| 외부 데이터 | 한국관광공사 TourAPI(실시간 호출만 허용), Claude(1순위)·Gemini(예비)       |
| 앱 포장     | PWA(`vite-plugin-pwa`), Capacitor로 Android·iOS                            |
| 3D          | 별도 폴더 `../visit-3d` (Three.js · Colyseus 실시간 방 서버)               |

## 3. 폴더 지도

```
main-app/
├─ src/
│  ├─ app/        앱 뼈대: router.tsx(페이지 21개 지연 로딩), paths.ts(주소 정의),
│  │              AppProviders(QueryClient + Settings), layouts(Top/BottomNav, ScrollShell)
│  ├─ pages/      주소 하나당 페이지 하나. 기능을 조립만 한다
│  ├─ features/   도메인 기능 17개 (아래 4절)
│  └─ shared/     api · i18n · config · hooks · lib · components/ui(17개) · styles · types
├─ api/           Vercel 서버리스 함수 (tour.ts → _lib/tour-proxy-core.ts)
├─ supabase/      migrations(43) · seed(성지 데이터) · functions(5) · auth-emails
├─ scripts/       60개: DB·번역·도슨트·사진·SEO·운영 점검 도구 (ts + 일부 py/sh)
├─ tests/         API·SEO·미사시간 같은 교차 테스트와 공통 설정
├─ data/          수집 원천 자료 58MB (앱이 실행 중에 읽지 않음)
├─ public/        정적 파일 43MB (사진·아이콘)
└─ docs/          00 개요 ~ 90 개편설계, 이어서-할-일.md
```

**의존성 규칙:** `pages → features → shared` 한 방향으로만 가져다 쓴다. 기능끼리 서로 쓰는 것은 도메인상 꼭 필요할 때만 허용한다.

## 4. 기능(features)별 크기

| 기능         | 파일 |    줄 | 테스트 | 하는 일                               |
| ------------ | ---: | ----: | -----: | ------------------------------------- |
| sites        |   40 | 3,810 |     10 | 성지 목록·상세·검색 (가장 큼)         |
| passport     |   22 | 2,251 |      8 | 순례 여권·스탬프·전례력 스탬프·인증서 |
| docent       |   16 | 2,212 |      7 | 성지 도슨트 해설·음성                 |
| courses      |   14 | 2,165 |      4 | 감정 기반 '쉼표 순례길' 코스          |
| map          |   11 | 1,229 |      3 | 지도                                  |
| quiz         |    5 | 1,209 |      1 | 퀴즈                                  |
| crowding     |   10 | 1,022 |      3 | 혼잡도                                |
| places       |    8 |   822 |      1 | 주변 장소(TourAPI)                    |
| admin        |    4 |   740 |      1 | 관리자 콘솔 (제출판에선 숨김)         |
| auth         |   12 |   723 |      8 | 로그인 (이메일·카카오·네이버)         |
| rest         |    4 |   669 |      2 | 쉼터                                  |
| programs     |    5 |   602 |      1 | 프로그램 신청                         |
| ai-guide     |    5 |   546 |      1 | AI 순례 가이드 '미카엘'               |
| routes       |    5 |   469 |      1 | 순례 경로                             |
| baptism-card |    3 |   338 |      0 | 세례명 카드                           |
| favorites    |    2 |   109 |      0 | 즐겨찾기                              |
| virtual-tour |    2 |    90 |      0 | 3D(`/visit`)로 넘기는 입구            |

각 기능 폴더는 `api/`(DB 접근, repository) · `hooks/`(상태) · `components/`(화면) · `lib/`(순수 로직)로 나뉜다.

## 5. 데이터가 흐르는 길

```
화면(pages/components)
  → feature hook (TanStack Query)
    → features/*/api/*.repository.ts   ← DB(snake_case) ↔ 앱 타입(camelCase) 변환은 여기서만
      → shared/api/supabase.ts → Supabase DB (RLS로 권한 제어)

TourAPI:  브라우저 → /api/tour (같은 주소) → 한국관광공사
          서비스키는 서버에만 있다. 로컬은 vite.config.ts 개발 플러그인, 운영은 api/tour.ts가 같은 핵심 함수를 쓴다.
          응답은 저장·캐시 금지 (공모전 규정, ADR 0002)

AI 가이드: 화면 → Edge Function ai-guide → Claude(실패하면 Gemini)
          관련 성지 레코드만 넣고 "모르면 모른다"고 답하게 고정
```

## 6. 주소(라우트)

| 묶음      | 주소                                                                                      |
| --------- | ----------------------------------------------------------------------------------------- |
| 핵심 탐색 | `/` · `/map` · `/explore` · `/search` · `/nearby` · `/region/:region` · `/sites/:siteId`  |
| 순례      | `/routes` · `/routes/:routeSlug` · `/compass` · `/quiet` · `/alternatives` · `/ai-guide`  |
| 내 기록   | `/records` · `/account` · `/login` · `/reset-password`                                    |
| 기타      | `/programs/:slug/apply` · `/faq` · `/terms` · `/privacy` · `/menu`                        |
| 관리자    | `/admin` · `/admin/sites/:id`                                                             |
| 3D        | `/visit/?space=..` → `vercel.json`이 별도 Vercel 프로젝트 `visitholykorea-visit`로 넘긴다 |

## 7. DB 테이블 (29개, 성격별)

| 묶음        | 테이블                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 성지 콘텐츠 | holy_sites · holy_site_translations · site_sources · site_revisions · site_artworks · docent_scripts · articles · article_sites · events                                 |
| 순례 경로   | pilgrimage_routes · pilgrimage_route_sites · pilgrimage_route_translations · pilgrimage_route_site_translations                                                          |
| 사용자 활동 | profiles · pilgrimage_stamps · stamp_photos · pilgrimage_logs · favorites · user_places · compass_responses · ai_chat_messages · program_applications · candle_offerings |
| 쉼터·제보   | rest_places · rest_spots · rest_spot_reports · visit_note_reports · note_read_counts                                                                                     |
| 참고 자료   | catholic_directory (주교회의 주소록 5,918건, 데이터는 시드에 없음)                                                                                                       |

새 테이블을 만들면 마이그레이션과 `shared/types/database.ts`를 같이 고친다.

## 8. 빌드와 배포

| 단계            | 하는 일                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm run build` | 타입 검사 → `vite build` → `scripts/seo-prerender.ts`                                                                    |
| SEO 사전 렌더   | 성지·코스마다 `dist/sites/<id>/index.html`, sitemap.xml, robots.txt, `spa.html`을 만든다. DB를 못 읽어도 빌드는 계속된다 |
| Vercel 라우팅   | 파일이 있으면 그 파일, 없으면 `spa.html`. 옛 주소 `visitholykorea-app.vercel.app`은 www로 영구 이동                      |
| 보안 헤더       | X-Frame-Options DENY, CSP는 아직 '보고만' 모드(Report-Only)                                                              |
| CI (`ci.yml`)   | typecheck · lint · format:check · test · vite build                                                                      |
| 운영 자동화     | `health-check.yml`(매일 07:00 서버 점검), `instagram-weekly.yml`(월 07:30), `gemini-models.yml`                          |

## 9. 형제 폴더 (`../`)

| 폴더                                         | 내용                                                                                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visit-3d/`                                  | 3D 가상 순례. `src/`에 net.ts(방 서버 연결) · spaces · candles · prayers 등. 방 서버는 woo의 맥에서 Cloudflare 터널로 띄운다(`visitholykorea.axcamp.com`) |
| `v7.0-work/` · `backup/`                     | 작업 사본과 백업                                                                                                                                          |
| `pitch/` · `참고자료-멘토링/` · 설계문서 PDF | 발표·사업 자료                                                                                                                                            |
| `HANDOFF-인수인계.md` · `PLAN-통합계획.md`   | 3D 통합 작업 인수인계                                                                                                                                     |

## 10. 눈에 띄는 점 (판단 근거와 함께)

| #   | 관찰                                                                           | 근거                                   | 의미                                                                           |
| --- | ------------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | 작업 브랜치와 main이 14커밋씩 갈라짐                                           | `git rev-list --left-right --count` ✅ | 지금 브랜치만 보면 운영 코드(예: og.ts)를 놓친다. 합칠 때 충돌 점검이 필요하다 |
| 2   | `sites` 기능이 40파일·3,810줄로 가장 큼                                        | 파일 수 집계 ✅                        | 고칠 일이 몰리는 곳. 나눌 후보 ❓                                              |
| 3   | 테스트 없는 기능 3개 (baptism-card · favorites · virtual-tour)                 | 집계 ✅                                | 셋 다 작아서 위험은 낮다 ❓                                                    |
| 4   | 다국어 사전이 파일 하나에 6,601줄                                              | `wc -l` ✅                             | 번역 추가 때 충돌이 나기 쉽다. 언어별로 나누는 안 ❓                           |
| 5   | 저장소 안 data 58MB, public 43MB                                               | `du` ✅                                | 복제가 느려진다. 큰 원천 자료는 저장소 밖으로 옮기는 안 ❓                     |
| 6   | 운영 DB를 건드리는 스크립트가 많음 (`db:*`, `admin:*`, `photo:*`, `seed:*` 등) | package.json ✅                        | 실수로 돌리면 운영 데이터가 바뀐다. 사장님 승인 후에만 돌린다                  |
| 7   | 커밋 안 된 남의 파일이 있음 (`database.ts`, 촛불 마이그레이션)                 | `git status` ✅                        | 다른 세션이 작업 중이다. 건드리지 않는다                                       |
| 8   | 보안 헤더 CSP가 '보고만' 모드                                                  | vercel.json ✅                         | 막는 모드로 바꾸는 것은 따로 점검한 뒤에 할 일이다                             |
