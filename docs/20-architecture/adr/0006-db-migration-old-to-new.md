# ADR 0006: DB 실태 확인과 미적용 마이그레이션 정리

**상태**: 조치 완료 (2026-08-12)
**조사일**: 2026-08-11 (service_role 키로 실제 DB 직접 조회)

---

## 이 문서를 다시 쓴 이유

처음 이 문서는 **"구 프로젝트와 신 프로젝트가 따로 있어 데이터가 나뉘어 있다"**는 전제로 썼다.
service_role 키로 실제 DB 를 조회해 보니 **그 전제가 틀렸다.**

프로젝트는 하나뿐이고, 데이터도 한 곳에 다 있다.
진짜 문제는 **마이그레이션 파일 3개가 DB 에 적용된 적이 없다**는 것이다.

추측으로 계획을 세우면 없는 문제를 풀게 된다. 그래서 확인한 값만 아래에 적는다.

---

## 1. 확인된 사실 — 살아 있는 DB 는 하나다

Supabase 프로젝트는 **둘**이지만, 데이터가 든 건 하나뿐이다.

| 프로젝트 ref | 대시보드 이름 | 상태 |
| --- | --- | --- |
| **`kaahuoqzkgshihypzzyh`** | visitholy-korea | ✅ **쓰는 것.** `.env.local` · 라이브 사이트가 여기를 본다 |
| `stdmbtyppkyncasplmae` | visitholykorea | ❌ 버려둔 것. 마이그레이션 이력 없음 → **삭제 대상** (5장) |

이름이 거의 같아서 대시보드에서 헷갈린다. **구분은 이름이 아니라 주소의 ref 로 한다.**

### `stdmbtyppkyncasplmae` 삭제 전 확인 (2026-08-11, 대시보드에서 직접)

8/8 에 한 번 조사했지만([커밋 452eddc](https://github.com/)) 되돌릴 수 없는 작업이라 다시 봤다.

| 항목 | 결과 |
| --- | --- |
| 테이블 | 5개 (`holy_sites` · `catholic_directory` · `pilgrimage_stamps` · `pilgrimage_logs` · `profiles`) — 8/8 조사와 동일 |
| 데이터 있는 2개 | 살아 있는 쪽에 같은 내용이 이미 있음 |
| 연락처 130곳 | 이미 이전 완료 — 실측 `phone 115` · `fax 70` · `homepage_url 70` 로 커밋 기록과 일치 |
| Storage | **버킷 0개** |
| `auth.users` | **0행** (대시보드 목록은 비어 있는데 하단에 "10 users (estimated)" 로 떴다. 추정치였고 `select count(*)` 로 0 확인) |
| `profiles` 테이블 | 코드 어디에서도 참조하지 않음. 살아 있는 쪽에도 없음 |

**건질 것 없음 → 삭제 가능.**

> 저 프로젝트의 저장된 쿼리 중 `DROP TABLE ...` 로 시작하는 것이 있고,
> `holy_sites` 스키마도 `id TEXT` · `coordinates JSONB` 인 구세대 구조다.
> 버려진 프로젝트라는 또 다른 방증.

프로젝트 `kaahuoqzkgshihypzzyh` (= `.env.local` 의 `VITE_SUPABASE_URL`) 이 유일한 살아 있는 DB 이고,
성지 208곳과 주소록 5,918건이 **전부 여기 들어 있다.**

| 테이블 | 상태 | 행 수 |
| --- | --- | --- |
| `holy_sites` | ✅ 있음 | **208** |
| `catholic_directory` | ✅ 있음 | **5,918** |
| `pilgrimage_stamps` | ✅ 있음 | 0 (아직 사용자 없음, 정상) |
| `pilgrimage_logs` | ❌ **없음 (404)** | — |
| `rest_spots` | ❌ **없음 (404)** | — |
| `holy_site_translations` | ❌ **없음 (404)** | — |

**결론: 프로젝트 간 데이터 이전 작업은 필요 없다.** 그 계획은 폐기한다.

---

## 2. 진짜 문제 — 마이그레이션 3개가 적용된 적이 없다

`supabase/migrations/` 에 파일 8개가 있는데, 그중 3개가 DB 에 반영되어 있지 않다.

| 마이그레이션 파일 | DB 반영 | 확인 근거 |
| --- | --- | --- |
| `20260804090000_create_holy_sites` | ✅ | 테이블 존재, 208행 |
| `20260804090100_create_pilgrimage_stamps` | ✅ | 테이블 존재 |
| `20260804090200_create_pilgrimage_logs` | ❌ | **404** |
| `20260804090300_create_catholic_directory` | ✅ | 테이블 존재, 5,918행 |
| `20260805100000_create_rest_spots` | ❌ | **404** |
| `20260805110000_create_holy_site_translations` | ❌ | **404** |
| `20260807000000_fix_diocese_names` | ✅ | 교구 접미사 잔존 **0건** |
| `20260808000000_add_contact_columns` | ✅ | `phone`·`fax`·`homepage_url` 컬럼 존재 |

### 이것이 지금 무엇을 망가뜨리고 있나

| 없는 테이블 | 참조하는 코드 | 실제 증상 |
| --- | --- | --- |
| `pilgrimage_logs` | `src/features/records/api/logs.repository.ts:9` | **여행기 기록 화면이 동작하지 않는다** |
| `holy_site_translations` | `scripts/translation-{export,import,status}.ts` | **번역 내보내기·가져오기가 막힌다** (영어 번역 작업 전체) |
| `rest_spots` | 앱 코드에서 참조 없음 | 지금 당장 깨지는 것 없음 (쉼자리 Phase 3 용) |

번역 스크립트는 이미 이 상황을 알고 경고를 띄우도록 되어 있다
(`scripts/translation-export.ts:80`). 대전 27곳 영어 번역이 커밋되어 있는데
**저장할 표가 DB 에 없다** — 이게 지금 가장 급한 항목이다.

---

## 3. 막고 있던 것 — `SUPABASE_DB_URL` 부재 (해결됨)

마이그레이션 러너는 이미 있다 (`scripts/db-migrate.ts`, `npm run db:migrate`).
실행해 보면 이렇게 멈춘다.

```
SUPABASE_DB_URL 이 없습니다.
```

REST API 키(`service_role`)로는 `CREATE TABLE` 을 할 수 없다.
**Postgres 직접 연결 문자열이 따로 필요하다.**

### 필요한 것 (사용자 조치)

Supabase 대시보드 → 상단 **Connect** → **Session pooler** 의 URI 를 복사해
`.env.local` 에 아래 형태로 넣는다.

```
SUPABASE_DB_URL=postgresql://postgres.kaahuoqzkgshihypzzyh:<비밀번호>@<host>:5432/postgres
```

비밀번호를 모르면 **Settings → Database → Reset database password** 로 새로 만든다.
**채팅창에 붙여넣지 말고 파일에만 넣는다.**

### 넣은 뒤 실행 순서

```bash
npm run db:status
```

```bash
npm run db:migrate
```

러너가 적용 이력을 DB 에 남기므로, 앞으로 "적용됐는지 아무도 모르는" 상태는 재발하지 않는다.

---

## 4. 조사 중 드러난 더 중요한 사실 — 로드맵이 틀렸다

`docs/10-product/로드맵.md` 1단계는 **"성지 좌표 확보 — 미확보 다수"** 를 최우선으로 적고 있다.
실제로 세어 보니 좌표는 거의 다 있다. **로드맵이 오래된 정보다.**

| 항목 | 로드맵 서술 | **실제 (2026-08-11)** | 판정 |
| --- | --- | --- | --- |
| 좌표 | "미확보 다수" | **207 / 208** (없는 곳 1) | ✅ 사실상 완료 |
| 감정 태그 | "미부여 채우기" | **204 / 208** (없는 곳 4) | ✅ 사실상 완료 |
| 소개글 | — | **207 / 208** | ✅ |
| **대표 사진** | "확보 필요" | **14 / 208 (없는 곳 194)** | 🔴 **여기가 진짜 병목** |
| 전화번호 | — | 115 / 208 (없는 곳 93) | 🟡 |
| 대전교구 | 27곳 | **27곳 확인** | ✅ |

`data/research/location_retry_summary.md` 는 **좌표가 아니라 이미지**를 TourAPI 로 찾으려던
기록이다. 그 문서 때문에 "좌표가 없다"고 오해하기 쉽다 — 문서 첫머리에 그 점을 밝혀야 한다.

**우선순위가 바뀐다.** 좌표·감정태그를 채우러 갈 일이 아니라, **사진 194곳**이 문제다.
그리고 사진은 현장에 가야만 생긴다 → 대전 현장검증의 값어치가 오히려 커졌다.

---

## 5. 그래서 할 일 (순서대로) — 1~5 완료

| # | 할 일 | 결과 |
| --- | --- | --- |
| 1 | `.env.local` 에 `SUPABASE_DB_URL` 넣기 | ✅ Session pooler URI 로 연결 |
| 2 | `npm run db:migrate` 로 미적용 3개 반영 | ✅ **8개 전부 적용** (아래 참고) |
| 3 | 대전 27곳 영어 번역 DB 반영 | ✅ 새로 27행, 갱신 0행, 상태 `machine` |
| 4 | 여행기 화면 동작 확인 | ✅ `/records` 정상 렌더링 |
| 5 | 로드맵 1단계를 실제 수치로 고쳐 쓰기 | ✅ 1·1.2·1.5단계 반영 |
| 6 | 사진 194곳 — 현장 촬영 (대전 27곳부터) | ⬜ 현장 작업, 8/20 시작 |

### 실행 결과 (2026-08-12)

러너가 대기 8개를 전부 적용했다. 이미 DB 에 있던 5개까지 포함된 이유는,
**적용 이력 테이블 자체가 그때 처음 만들어졌기 때문**이다. 마이그레이션 SQL 이
전부 `create table if not exists` · `add column if not exists` 형태라 기존 데이터는
건드리지 않고 이력만 채웠다 (208행 · 5,918행 그대로).

```
적용  20260804090000_create_holy_sites            (기존 유지)
적용  20260804090100_create_pilgrimage_stamps     (기존 유지)
적용  20260804090200_create_pilgrimage_logs       ← 새로 생성
적용  20260804090300_create_catholic_directory    (기존 유지)
적용  20260805100000_create_rest_spots            ← 새로 생성
적용  20260805110000_create_holy_site_translations ← 새로 생성
적용  20260807000000_fix_diocese_names            (기존 유지)
적용  20260808000000_add_contact_columns          (기존 유지)
완료. PostgREST 스키마 캐시도 갱신했습니다.
```

앞으로는 이력이 남으므로 "적용됐는지 아무도 모르는" 상태는 재발하지 않는다.

---

## 6. 남은 확인 필요 항목

- 좌표 없는 **1곳**, 감정태그 없는 **4곳**이 각각 어디인지 → 목록 뽑아 개별 처리
- `rest_spots` 는 Phase 3(쉼자리) 용이라 지금 급하지 않다 (표만 만들어졌고 0행)
- 번역 27건이 `machine` 상태다 — 심사 전 사람 검수 후 `human` 으로 승격 필요
- ~~TourAPI 일일 호출 한도~~ → 확인됨. 개발계정 **1,000건/일**, 홈 1회 로드가 22건.
  운영계정 전환이 필요하다 ([로드맵 1.2단계](../../10-product/로드맵.md))

---

## 참고

- 붐빔 지수 설계: [`2026-08-공모전-출품컨셉.md`](../../10-product/2026-08-공모전-출품컨셉.md)
- 현장검증 일정: [`대전-현장검증-계획.md`](../../30-content-ops/대전-현장검증-계획.md)
- 마이그레이션 러너: `scripts/db-migrate.ts`
