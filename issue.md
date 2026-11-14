# features/sites 리팩토링 이슈

> 분석한 날: 2026-11-14 (브랜치 feat/visit-3d). GitHub 이슈 #102~#106으로 등록했다.
> 근거가 되는 구조 분석은 `analysis.md`에 있다.

## 분석 요약

- `features/sites`의 40파일·3,810줄 중 약 920줄은 테스트다. 파일 하나 평균은 95줄이다. **폴더 자체는 생각보다 건강하다.**
- 진짜 덩어리는 sites를 조립하는 **페이지 `SiteDetailPage.tsx`(1,117줄)**다.
- 그 밖의 문제는 네 가지다:
  - 검색 필터에 입력값이 그대로 들어간다(버그 가능성).
  - 성지가 아닌 주소록 도메인이 섞여 있다.
  - 기능끼리 서로 가져다 쓰는 순환 의존이 있다.
  - 저장소 파일 안에서 조회 함수가 겹친다.

| 순위 | 이슈                                                                                                                              | 종류     | 크기 ❓      | 위험                      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------ | ------------------------- |
| 1    | [#103](https://github.com/linkcontent7-huisun/visitholykorea/issues/103) 검색어 필터 이스케이프 ✅ 완료(PR #107, 11/14 운영 반영) | 버그     | 작음(반나절) | 낮음                      |
| 2    | [#102](https://github.com/linkcontent7-huisun/visitholykorea/issues/102) SiteDetailPage 쪼개기 ✅ 완료(PR #108, 11/14 운영 반영)  | 리팩토링 | 큼(1~2일)    | 중간: 화면 회귀 확인 필요 |
| 3    | [#104](https://github.com/linkcontent7-huisun/visitholykorea/issues/104) 주소록 → features/directory                              | 리팩토링 | 작음         | 낮음: 경로만 바뀜         |
| 4    | [#105](https://github.com/linkcontent7-huisun/visitholykorea/issues/105) sites↔passport 순환 끊기                                 | 리팩토링 | 작음~중간    | 낮음                      |
| 5    | [#106](https://github.com/linkcontent7-huisun/visitholykorea/issues/106) repository 조회 정리                                     | 리팩토링 | 중간         | 중간: 쿼리가 바뀜         |

순서 이유:

- #103은 사용자가 바로 겪을 수 있는 오류라 가장 먼저 한다.
- #104와 #105는 파일 이동 위주라 #102보다 먼저 하면 #102의 import 정리가 쉬워진다 ❓.
- 크기는 추측이다.

---

## [#102](https://github.com/linkcontent7-huisun/visitholykorea/issues/102) [리팩토링] SiteDetailPage.tsx 1,117줄을 절 단위 컴포넌트로 나누기

### 문제

`src/pages/SiteDetailPage.tsx`가 **1,117줄**로 앱에서 가장 큰 파일이다 (2026-11-14 측정). `features/sites` 전체(40파일·3,810줄) 중 어느 파일보다 크다.

- import 54개, 훅 호출 34개, `useState` 14개
- 「순례 기록」 절(작성창·사진 첨부·내 기록 수정·목록·신고·라이트박스)만 약 375줄(689~1063행)
- 페이지는 "기능을 조립만 한다"는 규칙(`pages → features → shared`)과 달리 상태와 로직을 직접 들고 있다
- 페이지 테스트가 없다

### 제안

절 단위로 컴포넌트를 떼어 낸다. 화면과 동작은 바꾸지 않는다.

| 새 컴포넌트                                                          | 대략 줄  | 갈 곳                           |
| -------------------------------------------------------------------- | -------- | ------------------------------- |
| `SiteHero` (사진·출처·즐겨찾기·WYD 배지)                             | 360~470  | features/sites/components       |
| `SiteStorySection` (이야기·인용·참고자료·도슨트)                     | 481~535  | features/sites/components       |
| `VisitInfoSection` (미사 시간·한적한 날·연락처·찾아가는 길)          | 537~588  | features/sites/components       |
| `NearbySection` (둘러볼 곳·걷기길)                                   | 589~688  | features/sites/components       |
| `SiteNotesSection` (기록 작성·수정·목록·신고) + `useNoteComposer` 훅 | 689~1063 | features/passport (기록 도메인) |

### 완료 조건

- [ ] `SiteDetailPage.tsx` 300줄 이하
- [ ] 기록 작성 상태(useState 10여 개)가 `useNoteComposer` 훅 하나로 모임
- [ ] `SiteNotesSection`에 작성·수정·신고 테스트 추가
- [ ] `npm run verify` 통과, 성지 상세 화면 스크린샷 전후 동일

---

## [#103](https://github.com/linkcontent7-huisun/visitholykorea/issues/103) [버그] 성지 검색어가 PostgREST or() 필터에 그대로 들어감 — 쉼표·괄호 입력 시 깨짐

### 문제

`features/sites/api/holy-sites.repository.ts`의 `searchSites()`가 사용자가 친 검색어를 PostgREST `or()` 필터 문자열에 **그대로** 넣는다.

```ts
.or(`name.ilike.%${trimmed}%,location.ilike.%${trimmed}%`)
.or(`name.ilike.%${trimmed}%,address_romanized.ilike.%${trimmed}%`)  // 번역 테이블
```

`,` `(` `)` `.` 같은 글자는 필터 문법에서 구분자다. 예를 들어 「명동, 서울」이나 「St. Paul (Seoul)」을 치면 필터가 깨져 오류가 나거나 엉뚱한 조건이 붙을 수 있다 ❓(문법상 추측이며, 실제 요청으로는 아직 재현하지 않았다).
RLS가 있어 다른 테이블이 새어 나가지는 않지만, 검색이 조용히 실패하거나 같은 테이블에 사용자가 고른 조건이 붙는다.

### 제안

- 검색어를 PostgREST 규칙대로 이스케이프한다: 값을 큰따옴표로 감싸고 `"`·`\`를 이스케이프한다. 아니면 `,()` 같은 예약 문자를 공백으로 바꾼다.
- 또는 `ilike` 두 번을 `.or()` 대신 따로 호출해 결과를 합친다.

### 완료 조건

- [ ] `searchSites('명동, 서울')`, `searchSites('St. Paul (Seoul)')`, `searchSites('a"b')`가 오류 없이 돈다 (repository 테스트 추가)
- [ ] 영문·한글 검색 결과가 지금과 같다
- [ ] `npm run verify` 통과

---

## [#104](https://github.com/linkcontent7-huisun/visitholykorea/issues/104) [리팩토링] 주교회의 주소록(본당·공소) 코드를 features/sites에서 features/directory로 분리

### 문제

`features/sites` 안에 **성지가 아닌 도메인**이 섞여 있다. 바로 주교회의 주소록(`catholic_directory`, 본당·공소 5,918건)이다.

| 파일                              | 줄       |
| --------------------------------- | -------- |
| api/directory.repository.ts       | 121      |
| lib/nearby-directory.ts (+test)   | 132 + 61 |
| lib/directory-search.ts (+test)   | 46 + 42  |
| components/DirectoryEntryCard.tsx | 164      |
| components/NearbyParishesCard.tsx | 45       |
| hooks/use-nearby-directory.ts     | 31       |

합치면 약 640줄이다. 이 코드가 sites를 키워 보이게 하고, 다른 곳(`use-nearby-directory` 5곳, `DirectoryEntryCard` 4곳)은 성지와 상관없이 이것만 쓰려고 sites를 import한다.

### 제안

`src/features/directory/`로 옮긴다. 코드는 그대로 두고 import 경로만 바꾼다.

### 완료 조건

- [ ] 위 파일이 `features/directory/` 아래로 이동하고, 이력이 남도록 `git mv`로 옮김
- [ ] `features/sites`에 directory 관련 파일 0개
- [ ] `npm run verify` 통과

---

## [#105](https://github.com/linkcontent7-huisun/visitholykorea/issues/105) [리팩토링] sites ↔ passport 순환 의존 끊기 + sites 공개 입구(index.ts) 만들기

### 문제

기능끼리 서로를 import하는 **순환 의존**이 있다 (2026-11-14 grep 확인).

- `sites → passport`: `SiteThumbnail.tsx`가 `passport/lib/stamp-motifs`, `passport/components/StampMotifIcon`을 씀
- `passport → sites`: `stamps.repository.ts`, `EmptyPassportPreview.tsx`가 `sites/api/holy-sites.repository`, `sites/hooks/use-sites`를 씀

이 밖에 `sites`가 `docent`(SiteListItem), `map`(SearchResultsMap)도 가져다 쓴다. 다른 기능 8곳과 페이지 10곳은 sites 내부 파일을 경로째 import한다(공개 입구 `index.ts` 없음, 서로 다른 내부 경로 28개).
순환이 있으면 한쪽을 고칠 때 다른 쪽이 깨지기 쉽고, 기능을 떼어 내기 어렵다.

### 제안

1. 스탬프 모티프(`stamp-motifs`, `StampMotifIcon`)는 성지 썸네일과 여권이 함께 쓰므로 `shared/`로 내린다 → `sites → passport` 화살표가 사라진다.
2. `features/sites/index.ts`를 만들어 바깥에서 쓰는 것(`useSites`, `SiteThumbnail`, `toHolySite`, `fetchSite*Index` 등)만 내보낸다. 바깥 import를 여기로 모은다 (선택, 2단계).

### 완료 조건

- [ ] `grep -r "features/passport" src/features/sites` 결과 0줄
- [ ] (2단계) sites 바깥에서 `features/sites/` 하위 경로를 직접 import하는 곳 0개
- [ ] `npm run verify` 통과

---

## [#106](https://github.com/linkcontent7-huisun/visitholykorea/issues/106) [리팩토링] holy-sites.repository.ts 겹치는 색인·번역 조회 정리

### 문제

`features/sites/api/holy-sites.repository.ts`(374줄)에 비슷한 조회 함수가 겹친다.

- **가벼운 색인 조회 3개**가 거의 같다: `fetchSiteDioceseIndex`(id, diocese), `fetchSiteLocationIndex`(id, name, lat, lng), `fetchSiteCoordsIndex`(id, lat, lng). 쓰는 곳마다 따로 불러 같은 테이블을 여러 번 읽는다.
- **번역 조회 4개**: `fetchSiteTranslations`, `fetchSiteListTranslations`, `fetchSiteNameTranslations`, `fetchSiteTranslation`. 파일의 약 40%(239~374행)를 차지한다.
- 목록 조회 대부분이 `select('*')`라 긴 소개글(description·history)까지 받는다. 목록·지도 화면에는 필요 없는 양이다 ❓(전송량은 재지 않았다).

### 제안

1. 번역 함수 4개를 `site-translations.repository.ts`로 떼어 낸다.
2. 색인 3개를 `fetchSiteIndex()` 하나(id, name, diocese, lat, lng)로 합치고, TanStack Query 키 하나로 공유한다.
3. 목록용 `select` 열을 정해 둔 상수(`LIST_COLUMNS`)로 바꾼다. 상세 화면만 `*`를 쓴다.

### 완료 조건

- [ ] holy-sites.repository.ts 200줄 이하
- [ ] 색인 조회 함수 1개, 쿼리 키 1개
- [ ] 기존 repository 테스트 통과 + 색인 합친 것 테스트
- [ ] `npm run verify` 통과
