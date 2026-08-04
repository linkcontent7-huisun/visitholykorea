# Visit Holy Korea

한국 가톨릭 성지순례 웹앱. 하나의 코드베이스로 **웹 · Android · iOS** 를 모두 지원한다.

> 붐비는 관광지 대신, 마음에 필요한 쉼표 하나.
> 감정을 고르면 그에 맞는 성지와 도보권 관광지를 이어 붙인 "쉼표 순례길" 코스를 제안한다.

2026 관광데이터 활용 공모전(한국관광공사) 출품작입니다.

- **배포**: <https://visitholykorea-app.vercel.app>
- 저장소: <https://github.com/nohhuisun/visitholykorea>
- 기획 자료 모음(Notion): <https://app.notion.com/p/visit-holy-_Logo-841be80e553b8275afec01ba08f4983b>

## 핵심 기능

| 기능                    | 설명                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| 성지 탐색               | 전국 성지 208곳을 교구·분류로 탐색하고 검색                                         |
| 쉼표 순례길             | 감정 태그 → 성지 + TourAPI 실시간 주변 관광지 페어링 코스 추천                      |
| 마음 나침반             | 일곱 가지 질문(감정·관심사·출발지·시간 등)으로 지금 마음에 맞는 성지 한 곳을 안내   |
| 순례 여권               | 방문 성지에 스탬프를 찍고 등급을 쌓는 디지털 순례 여권                              |
| 전례력 한정판 스탬프    | 사순·성모성월·순교자성월 등 **찍은 날의 전례 시기**에 따라 스탬프 디자인이 달라진다 |
| 완주 인증서             | 등급 달성 시 이름·방문 성지 목록이 들어간 PDF 인증서 발급                           |
| SNS 공유 카드           | 스탬프를 인스타그램 스토리 규격(9:16) 이미지로 합성해 공유                          |
| 주변 정보 · 오늘의 행사 | 성지 상세에서 TourAPI 실시간 조회 (반경 3km 관광지 / 10km 축제·행사)                |
| AI 순례 가이드          | 성지 DB를 컨텍스트로만 답하는 대화형 안내 '미카엘'                                  |
| 순례 기록               | 다녀온 성지의 여행기 보관                                                           |
| 접근성                  | 큰 글자 모드, 성지 이야기 음성 안내(TTS), 한국어/영어 전환                          |

## 기술 스택

- **앱**: React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · React Router 7 · TanStack Query 5
- **백엔드**: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **외부 데이터**: 한국관광공사 TourAPI (실시간 호출), Gemini (Edge Function 경유)
- **배포**: 웹은 PWA(설치 가능), 네이티브는 Capacitor 로 Android/iOS 패키징

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값을 채운다
npm run dev                  # http://localhost:3000
```

주요 명령:

| 명령                  | 하는 일                                  |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | 개발 서버                                |
| `npm run build`       | 타입 검사 후 프로덕션 빌드               |
| `npm run verify`      | 타입 검사 + 린트 + 테스트 (커밋 전 권장) |
| `npm run test`        | 단위 테스트                              |
| `npm run cap:android` | 빌드 후 Android Studio 열기              |
| `npm run cap:ios`     | 빌드 후 Xcode 열기 (macOS 필요)          |

### 데이터베이스 준비

```bash
supabase db push                                          # migrations 적용
psql "$DATABASE_URL" -f supabase/seed/01_holy_sites.sql          # 성지 195곳
psql "$DATABASE_URL" -f supabase/seed/02_holy_sites_batch3.sql   # 추가 13곳
supabase functions deploy ai-guide                        # AI 가이드 함수 배포
```

`catholic_directory`(CBCK 주소록 5,918건)는 별도 테이블이며 스키마만 마이그레이션에 있다.
데이터 적재는 스크레이핑 결과가 필요하므로 시드에 포함하지 않았다.

`GEMINI_API_KEY` 는 클라이언트가 아니라 Edge Function 쪽 시크릿으로 넣는다:
`supabase secrets set GEMINI_API_KEY=...`

### 네이티브 앱 빌드

네이티브 프로젝트(`android/`, `ios/`)는 저장소에 커밋하지 않는다. 처음 한 번만 생성한다:

```bash
npm run build
npx cap add android
npx cap add ios      # macOS 에서만
```

## 폴더 구조

```
.
├─ src/
│  ├─ app/          앱 셸 — 라우터, 프로바이더, 레이아웃
│  ├─ pages/        라우트 단위 페이지 (기능들을 조립하는 곳)
│  ├─ features/     도메인 기능 — sites · courses · passport · ai-guide · records · auth
│  │  └─ <기능>/    api(데이터 접근) · hooks(상태) · components(UI)
│  └─ shared/       공용 — api · config · hooks · i18n · lib · types · components/ui · styles
├─ supabase/
│  ├─ migrations/   DB 스키마 (순서대로 적용)
│  ├─ seed/         성지 195곳 데이터
│  └─ functions/    Edge Function (ai-guide)
├─ data/            데이터 구축 과정의 원천 자료 (앱이 런타임에 읽지 않음)
├─ docs/            기획 · 아키텍처 · 콘텐츠 운영 · 가톨릭 지식창고
├─ scripts/         일회성 유틸 (아이콘 생성 등)
└─ tests/           테스트 공통 설정
```

의존성 방향은 한쪽으로만 흐른다: `pages → features → shared`.
`features` 끼리는 되도록 참조하지 않되, 도메인상 필요한 경우(코스 추천이 성지 조회를 쓰는 등)만 예외로 둔다.

## 문서

- [docs/00-overview](docs/00-overview/) — 프로젝트 개요와 원본 자료 위치
- [docs/10-product](docs/10-product/) — 로드맵, 기능 우선순위
- [docs/20-architecture](docs/20-architecture/) — 아키텍처와 주요 결정 기록(ADR)
- [docs/30-content-ops](docs/30-content-ops/) — 취재·촬영·블로그·유튜브 운영 매뉴얼
- [docs/40-knowledge](docs/40-knowledge/00-색인.md) — 가톨릭 지식창고 (순교사·영성·비즈니스 기획)
- [docs/50-research](docs/50-research/) — 초기 리서치 메모

## 공모전 규정 준수

- 한국관광공사 OpenAPI(TourAPI)는 로컬 캐싱 없이 매 요청마다 실시간 호출합니다.
- 성지 콘텐츠 DB(`holy_sites`)는 공사 API와 무관한 자체 수집·정리 콘텐츠입니다.
- 자세한 기준은 [ADR 0002](docs/20-architecture/adr/0002-tourapi-usage.md) 참고.

## 배포

Vercel 에 연결되어 있습니다(`.vercel/project.json`). 웹 배포는 `main` 푸시 시 자동입니다.

## License

MIT
