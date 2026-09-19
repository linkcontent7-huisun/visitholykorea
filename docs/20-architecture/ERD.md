# ERD — 데이터 구조도

`supabase/migrations/*.sql` 32개(2026-09-15 기준)에서 뽑았다. 표 22개 · 뷰 3개.
그림은 Mermaid 라 GitHub 에서 바로 렌더링된다. 표를 새로 만들면 여기도 같이 고친다.

`catholic_directory` 의 CBCK 확장 컬럼(`cbck_code` 등 16개)은 마이그레이션 파일이
아직 커밋·적용 전이다(2026-09-15). 그림에는 넣었지만 DB 에 있다고 믿지 말 것.

## 한눈에 — 다섯 덩어리

| 덩어리                          | 표                                                                                                        | 한 줄                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **성지** (자체 수집, 캐싱 가능) | `holy_sites` · `holy_site_translations` · `site_sources` · `site_revisions` · `site_artworks`             | 208곳의 원본. 번역·출처·수정이력·건축예술이 여기 매달림      |
| **순례 기록** (회원 데이터)     | `profiles` · `pilgrimage_stamps` · `stamp_photos` · `pilgrimage_logs` · `favorites` · `compass_responses` | 스탬프(방문 도장)가 중심. 사진·신고·읽음수가 스탬프에 매달림 |
| **순례 코스**                   | `pilgrimage_routes` · `pilgrimage_route_sites`                                                            | 박해 사건·인물 축으로 성지를 순서대로 잇는 길                |
| **주변 시설**                   | `catholic_directory` · `rest_places` · `rest_spots` · `rest_spot_reports`                                 | 성당·수도원 주소록과 그 안의 쉼터(화장실·의자)               |
| **매체·운영**                   | `articles` · `article_sites` · `events` · `visit_note_reports` · `note_read_counts`                       | 언론 기사 ↔ 성지 연결, 접속 기록, 신고                      |

TourAPI 응답은 **어느 표에도 저장하지 않는다** (ADR 0002). 매 요청 실시간 호출.

## 그림

```mermaid
erDiagram
  %% ── 성지(핵심) ──
  holy_sites {
    uuid id PK
    text name
    text category
    text diocese
    text region_province
    float lat
    float lng
    text history
    text image_url
    text phone
    text homepage_url
    text name_compact "띄어쓰기 뺀 이름(검색용, 자동 생성)"
  }
  holy_site_translations {
    uuid id PK
    uuid site_id FK
    text language "en·es·fr·zh·ja"
    text name
    text description
    text translation_status "draft·reviewed"
  }
  site_sources {
    uuid id PK
    uuid site_id FK
    text kind
    text url
  }
  site_revisions {
    uuid id PK
    uuid site_id FK
    uuid editor FK
    jsonb before
    text[] fields
  }
  site_artworks {
    uuid id PK
    uuid site_id FK
    uuid article_id FK
    text kind
    text title
    text artist
  }

  %% ── 회원·기록 ──
  auth_users {
    uuid id PK "Supabase 인증"
  }
  profiles {
    uuid id PK_FK
    text email
    text role "member·editor·admin"
    text diocese
    text country_code
    smallint companion_count
    bool is_guided_tour
  }
  pilgrimage_stamps {
    uuid id PK
    uuid user_id FK
    uuid site_id FK
    text note "방문 소감"
    text photo_url
    bool photo_featured
    bool hidden
    text transport_mode
  }
  stamp_photos {
    uuid id PK
    uuid stamp_id FK
    text url
    int position
  }
  pilgrimage_logs {
    uuid id PK
    uuid user_id FK
    uuid site_id FK
    text title
    text content
    date visit_date
    text[] photos
  }
  favorites {
    uuid user_id PK_FK
    uuid site_id PK_FK
  }
  compass_responses {
    uuid id PK
    uuid user_id FK
    jsonb answers
    uuid matched_site_id FK
  }
  visit_note_reports {
    uuid stamp_id PK_FK
    text reporter
  }
  note_read_counts {
    uuid stamp_id PK_FK
    int read_count
  }

  %% ── 순례 코스 ──
  pilgrimage_routes {
    uuid id PK
    text slug
    text title
    text subtitle
    int sort_order
  }
  pilgrimage_route_sites {
    uuid route_id PK_FK
    uuid site_id PK_FK
    int position
    text note
  }

  %% ── 주변 시설 ──
  catholic_directory {
    uuid id PK
    text name
    text category "본당·수도원·…"
    text diocese
    text phone
    text address
    float lat
    float lng
    text mass_times
    text name_romanized
    text cbck_code "CBCK 확장(미적용)"
  }
  rest_places {
    uuid id PK
    uuid directory_id FK
    text name
    text kind
    int opens_hour
    int closes_hour
  }
  rest_spots {
    uuid id PK
    uuid place_id FK
    text kind "화장실·의자·그늘"
    text placement
    text evidence_level
    bool wheelchair_accessible
  }
  rest_spot_reports {
    uuid id PK
    uuid spot_id FK
    uuid user_id FK
    bool was_open
  }

  %% ── 매체·운영 ──
  articles {
    uuid id PK
    text source
    text url
    text title
    date published_at
    jsonb facts
    text status
  }
  article_sites {
    uuid article_id PK_FK
    uuid site_id PK_FK
    float confidence
  }
  events {
    uuid id PK
    timestamptz occurred_at
    text visitor_id
    uuid user_id FK
    text kind
    text target_id
    text language
  }

  %% ── 관계 ──
  holy_sites ||--o{ holy_site_translations : "언어별 번역"
  holy_sites ||--o{ site_sources : "자료 출처"
  holy_sites ||--o{ site_revisions : "수정 이력"
  holy_sites ||--o{ site_artworks : "건축·예술품"
  articles   ||--o{ site_artworks : "근거 기사"

  auth_users ||--|| profiles : "1:1"
  auth_users ||--o{ pilgrimage_stamps : "찍은 도장"
  holy_sites ||--o{ pilgrimage_stamps : "방문된 성지"
  pilgrimage_stamps ||--o{ stamp_photos : "사진 여러 장"
  pilgrimage_stamps ||--o| visit_note_reports : "신고"
  pilgrimage_stamps ||--o| note_read_counts : "읽음 수"
  auth_users ||--o{ pilgrimage_logs : "여행기"
  holy_sites ||--o{ pilgrimage_logs : ""
  auth_users ||--o{ favorites : "찜"
  holy_sites ||--o{ favorites : ""
  auth_users ||--o{ compass_responses : "마음 나침반 답"
  holy_sites ||--o{ compass_responses : "추천된 성지"
  auth_users ||--o{ site_revisions : "편집자"
  auth_users ||--o{ events : "접속 기록"
  auth_users ||--o{ rest_spot_reports : "제보"

  pilgrimage_routes ||--o{ pilgrimage_route_sites : "경유 순서"
  holy_sites        ||--o{ pilgrimage_route_sites : ""

  catholic_directory ||--o{ rest_places : "쉼터 있는 장소"
  rest_places ||--o{ rest_spots : "쉼터"
  rest_spots  ||--o{ rest_spot_reports : ""

  articles   ||--o{ article_sites : "기사 ↔ 성지"
  holy_sites ||--o{ article_sites : ""
```

읽는 법: `||--o{` 는 "왼쪽 하나에 오른쪽 여럿(0개 이상)". `||--o|` 는 "하나에 많아야 하나".
`PK` 는 기본 키(행을 유일하게 가리키는 값), `FK` 는 외래 키(다른 표를 가리키는 값).

## 뷰 3개 (표가 아니라 미리 짜 둔 조회)

| 뷰                     | 무엇을 보여주나                                             | 왜 뷰인가                                                 |
| ---------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| `directory_public`     | `catholic_directory` 에서 공개해도 되는 컬럼만              | 화면은 이 뷰만 읽는다 — 담당자 연락처 같은 값이 새지 않게 |
| `site_visit_notes`     | 성지별 공개 소감(스탬프의 `note`, `hidden=false`) + 읽음 수 | 신고·숨김 처리를 한 곳에서 걸러서 내보내려고              |
| `admin_pending_photos` | 승인 대기 중인 후기 사진                                    | 관리자 콘솔 전용                                          |

## 설계에서 눈여겨볼 것

- **`holy_sites` 가 허브다.** 열 개 넘는 표가 `site_id` 로 매달려 있고, 성지를 지우면 전부 함께 지워진다(`on delete cascade`). 성지 id 는 절대 바꾸지 않는다.
- **스탬프 = 기록의 중심.** 사진·신고·읽음수가 `pilgrimage_logs`(여행기)가 아니라 `pilgrimage_stamps` 에 매달린다. 여행기는 별도 긴 글이고, 스탬프의 `note` 가 짧은 소감이다.
- **회원 정보는 두 곳.** 인증(`auth.users`, Supabase 관리)과 앱 프로필(`profiles`)이 1:1. 권한(`role`)은 `profiles` 에 있고 DB 정책이 읽는다 — 화면이 판단하지 않는다.
- **주소록과 성지는 다른 표.** `catholic_directory`(성당·수도원 수천 곳, 주소록)와 `holy_sites`(성지 208곳, 콘텐츠)는 연결 키가 없다. "여기에서 가장 가까운 성지·성당" 화면은 둘을 따로 조회해 합친다.
- **다대다 연결표 3개**: `pilgrimage_route_sites`(코스↔성지), `article_sites`(기사↔성지), `favorites`(회원↔성지). 모두 두 FK 를 합친 복합 기본 키.
