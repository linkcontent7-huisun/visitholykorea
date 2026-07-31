# Visit Holy Korea (비지트홀리코리아)

> 길 위에서 나를 만나는 감정 기반 한국 가톨릭 성지순례 추천 웹앱

**Live**: https://visitholykorea-app.vercel.app

2026 관광데이터 활용 공모전(한국관광공사) 출품작입니다. 붐비는 관광지 대신, 지금 마음에 필요한 감정(위로·새출발·평온·치유·감사)을 고르면 그에 어울리는 한국 가톨릭 성지와 근처 관광지를 실시간으로 짝지어 추천합니다.

## 주요 기능

- **쉼표 순례길** — 5가지 감정 태그 기반 성지 추천 엔진. 한국관광공사 TourAPI(KorService2)를 실시간 호출해 성지 주변 인기 관광지를 도보 이동시간과 함께 페어링합니다.
- **전국 성지 195곳 DB** — 가톨릭굿뉴스, 한국천주교주교회의(CBCK) 등 공식 자료를 기반으로 구축한 자체 콘텐츠 데이터베이스 (Supabase/PostgreSQL).
- **순례 여권 (디지털 스탬프)** — 로그인한 사용자가 방문한 성지를 기록하고 등급을 올리는 게이미피케이션 요소.
- **AI 순례 가이드** — 성지 순례 관련 질문에 답하는 채팅 어시스턴트 (Gemini API 연동).
- **실시간 검색 · 지도** — 성지명/지역/성인명으로 검색, 교구별 지도 탐색.
- **접근성** — 한/영 언어 전환, 큰 글자 모드, 데스크톱 미리보기 폭 전환.

## 기술 스택

- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Motion (Framer Motion)
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **외부 API**: 한국관광공사 TourAPI(KorService2), Google Gemini API
- **배포**: Vercel

## 로컬 개발 환경 설정

```bash
npm install
cp .env.local.example .env.local   # 아래 환경변수 채워넣기
npm run dev
```

### 필요한 환경변수 (`.env.local`)

| 변수명 | 설명 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon(public) 키 |
| `VITE_TOUR_API_SERVICE_KEY` | 한국관광공사 TourAPI 서비스 키 |
| `GEMINI_API_KEY` | Google Gemini API 키 (AI 가이드 기능용) |

## 프로젝트 구조

```
src/
  components/       공용 컴포넌트 (Navigation, AuthScreen, SearchOverlay, AIGuide 등)
  components/tabs/   하단 탭 화면 (Home, Map, Explore, Record, Menu)
  pages/            성지 상세페이지
  services/         외부 API/DB 연동 (Supabase, TourAPI, Gemini, 코스 매칭 엔진)
  contexts/         전역 설정(언어/큰글자/미리보기 폭) 컨텍스트
  lib/              Supabase 클라이언트 초기화
supabase/           DB 마이그레이션 SQL
```

## 공모전 관련 규정 준수

- 한국관광공사 OpenAPI(TourAPI)는 로컬 캐싱 없이 매 요청마다 실시간 호출합니다.
- 성지 콘텐츠 DB(`holy_sites`)는 공사 API와 무관한 자체 수집·정리 콘텐츠입니다.

## License

MIT
