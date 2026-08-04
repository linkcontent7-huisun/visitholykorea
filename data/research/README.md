# data/research — 성지 데이터 구축 과정 기록

성지 195곳 데이터를 모으면서 나온 중간 산출물이다. 앱이 런타임에 읽는 파일은 하나도 없다.
운영 데이터는 Supabase `holy_sites` 테이블이고, 초기 적재는 `supabase/seed/01_holy_sites.sql` 이 담당한다.

## 파일

| 파일 | 내용 |
|---|---|
| `existing_66_sites.json` | 1차로 정리한 66곳 원본 |
| `master_260_new_candidates.json` | 교구별 추가 후보 목록 |
| `goodnews_all_sites.json` | 가톨릭굿뉴스에서 모은 성지·성당 목록(주소·전화 포함) |
| `remaining_sites_with_coords.json` | 좌표를 확보한 성지 목록 |
| `image_sourcing_*.{csv,md,sql}` | 대표 이미지 찾기 작업 결과와 요약 |
| `location_retry_*.{csv,md,sql}` | 좌표 기반 재검색 작업 결과와 요약 |
| `wikimedia_retry_list.csv` | 위키미디어 커먼즈에서 다시 찾아볼 대상 목록 |

## 주의할 점

**`*_update*.sql` 파일은 그대로 실행하면 안 된다.** 운영 DB의 특정 UUID를 하드코딩하고 있어서,
시드로 새로 만든 DB에는 맞지 않는다. 기록 보존용이다.

**TourAPI 이미지 URL을 DB에 저장하는 문제.** 위 이미지 소싱 결과 중 `tong.visitkorea.or.kr`
도메인 이미지는 한국관광공사에서 온 것이다. 공모전 규정상 TourAPI 응답을 저장해 재사용하는 것은
피해야 하므로, 제출 전에 이 이미지들을 (a) 직접 촬영한 사진으로 교체하거나 (b) 매 요청 시
실시간 호출로 바꿀지 정해야 한다. 관련 논의는 `docs/20-architecture/adr/0002-tourapi-usage.md`.

## 남은 작업

- 좌표 미확보 성지 지오코딩 (좌표가 없으면 "쉼표 순례길" 코스 페어링이 동작하지 않는다)
- 대표 이미지 없는 성지 촬영·수급 — 촬영 운영 매뉴얼은 `docs/30-content-ops/` 참고
