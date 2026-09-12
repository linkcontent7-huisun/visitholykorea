# 반응형 적용 패치 — "웹 서비스형" + 지도 우선 분할

레포 `linkcontent7-huisun/visitholykorea@main` 의 실제 소스를 읽어 수정한 파일들입니다.
이 프로젝트에서는 GitHub 에 직접 push 할 수 없으므로, **레포와 동일한 경로**로 파일을 만들어 두었습니다.
아래 목록대로 덮어쓰면 그대로 동작합니다.

## 적용 순서

```bash
git checkout -b feat/responsive-web-shell

# 신규 3개
src/app/layouts/nav-items.ts
src/app/layouts/TopNav.tsx
src/shared/components/ui/PageContainer.tsx

# 교체 5개
src/app/layouts/AppLayout.tsx
src/app/layouts/BottomNav.tsx
src/pages/HomePage.tsx
src/pages/MapPage.tsx
src/pages/ExplorePage.tsx

# 소폭 수정 1개 (padded 프롭 추가)
src/features/quiet/components/TodayQuietSection.tsx

npm run verify   # 타입 + 린트 + 테스트
npm run dev
```

새 의존성·새 환경변수·DB 변경은 없습니다. `globals.css` 토큰, i18n 사전, Supabase, API 계층은 손대지 않았습니다.
새로 만든 번역 키도 없습니다 — 기존 키(`home` `map` `explore` `record` `menu` `login` `routesTitle` `compassTitle` …)만 씁니다.

## 무엇이 바뀌었나

### 1. 셸 — 상단 내비 (`AppLayout`, `TopNav`, `BottomNav`, `nav-items.ts`)

- 데스크톱에서 본문을 `max-w-lg`(512px) 로 묶고 바깥을 회색으로 칠하던 **가짜 휴대폰 액자를 제거**했습니다.
- 상단 내비: 모바일 60px / 데스크톱 72px 고정. 로고 · 메뉴 6개 · 검색 · 큰 글자 · 언어 · 로그인.
- 하단 탭은 `lg:hidden` 으로 스스로 숨습니다. `widthClass` 프롭은 사라졌습니다.
- 탭 정의는 `nav-items.ts` 한 곳에서만 관리합니다(`NAV_ITEMS` = 하단 탭 5개, `TOP_NAV_ITEMS` = 데스크톱 6개).

**결정 하나를 남겨 두었습니다.** 시안 1b 는 모바일에서도 하단 탭을 없애는 안이지만, 고령 순례자에게
익숙한 조작 위치를 한꺼번에 빼앗는 변화라 **모바일은 하단 탭을 유지**했습니다.
`AppLayout.tsx` 상단의 `KEEP_BOTTOM_NAV_ON_MOBILE = true` 를 `false` 로 바꾸면 완전한 1b 형태가 됩니다.

### 2. 홈 (`HomePage`)

- 데스크톱: 오늘의 성지 사진이 화면 폭을 꽉 채우는 히어로(420px) + 왼쪽에 서비스 한 줄 소개와
  CTA 2개(마음 나침반 / 성지 둘러보기). 성지 이름·교구·도슨트 배지는 오른쪽 아래 카드로 비켜 놓아,
  "오늘의 성지"라는 사실이 사라지지 않게 했습니다.
- 모바일: 지금까지와 같은 둥근 사진 카드 히어로입니다(누르면 성지 상세).
- 코스 카드 `1 → sm:2 → xl:4열`, 감정 태그 줄은 데스크톱에서 제목 옆으로.
- 칩 3개와 AI 가이드 카드는 데스크톱에서 나란히(`1fr / 380px`).
- 성지 그리드 `2 → md:3 → xl:4열`, 출발지가 있으면 6곳 → 8곳으로 늘렸습니다.
- 검색창·큰 글자·언어 전환은 상단 내비로 옮겨졌습니다(홈 자체 헤더 제거).
- 섹션 순서가 바뀌었습니다: 히어로 → 코스 → 칩·AI → 오늘의 쉼표 → 여권 미리보기 → 순례자 이야기 → 성지 그리드.
  기능은 하나도 빼지 않았습니다.

### 3. 지도 (`MapPage`) — PC 전용 2분할

- 1024px 이상: **왼쪽 452px 목록 + 오른쪽 지도**. 왼쪽만 스크롤되고, 범례는 지도 왼쪽 아래,
  선택 성지 카드는 오른쪽 아래에 뜹니다.
- 목록 줄에 마우스를 올리면 지도의 핀이 선택되고, 핀을 클릭하면 목록이 그 줄로 스크롤됩니다.
  이때 `scrollIntoView` 를 쓰지 않고 목록 컨테이너의 `scrollTop` 을 직접 계산합니다 —
  페이지 전체가 튀면 지도까지 움직입니다.
- 1024px 미만은 기존 흐름(지도 → 선택 카드 → 검색 → 목록 → 교구 진행) 그대로입니다.
- 지도 SVG(핀 208개)를 두 벌 그리지 않습니다. 같은 노드를 폭에 따라 다른 자리에 꽂기 위해
  기존 `useSettings().wideView`(matchMedia, 첫 렌더에 값이 정해져 깜빡임 없음)를 씁니다.
- 높이 계산이 `calc(100dvh-72px)` 로 상단 내비 높이에 묶여 있습니다. **TopNav 높이를 바꾸면 이 값도 바꿔야 합니다.**

### 4. 탐색 (`ExplorePage`)

- 교구 격자 `3 → sm:4 → md:5 → xl:8열`, 성지 목록 `1 → lg:2 → xl:3열`.
- 정렬·필터·즐겨찾기 로직은 한 줄도 바꾸지 않았습니다.

### 5. `TodayQuietSection`

- `padded?: boolean` 프롭만 추가했습니다(기본 `true` = 기존과 동일). 홈이 `PageContainer` 안에서
  `padded={false}` 로 불러 좌우 여백이 두 번 겹치는 것을 막습니다. 다른 호출부는 손대지 않아도 됩니다.

## 아직 남은 일

1. **`router.tsx`** — 성지 상세 · 검색 · 순례 코스 · 나침반 등은 지금도 `AppLayout` 밖의 전체 화면
   라우트입니다. 즉 이 화면들에는 상단 내비가 없습니다. 웹 서비스형에서는 `AppLayout` 자녀로 옮기는 것이
   맞지만, `SiteDetailPage`(38KB) 가 자체 상단 바를 갖고 있어 헤더가 두 겹이 될 수 있습니다.
   상세 화면 작업(아래 2번)과 함께 처리하는 것을 권합니다.
2. **`SiteDetailPage`** — 데스크톱 2열(본문 + 380px 스티키 정보 패널). 설계도 Phase 4.
3. **기록 · 메뉴 · 검색 · 축제 · 붐빔 피하기 · 시·도 랜딩** — `PageContainer` + 격자 확장. 설계도 Phase 3.
4. **지도 마커 클러스터링** — 핀이 겹치는 구간의 가독성. 교구 필터가 개수를 줄여 주므로 다음 배포로 가능.

## 검수 (설계도 8장 요약)

폭 320 / 390 / 768 / 1024 / 1280 / 1440 / 1920 에서 홈 · 지도 · 탐색을 확인합니다.
판단 기준: 가로 스크롤이 없고, 글자가 잘리지 않고, 누를 것이 44px 이상.
여기에 ① 큰 글자 모드(118%) ② 영어 전환 ③ iPad 가로(1024px 초과 — 하단 탭이 사라지고 상단 내비가 나옵니다)를 곱합니다.
휴대폰 네이티브 앱(Capacitor)은 `lg:` 가 켜지지 않으므로 이 패치의 영향을 받지 않습니다.
