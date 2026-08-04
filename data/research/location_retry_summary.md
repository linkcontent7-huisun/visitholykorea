# Location-Retry Search Summary

**Run cut short by execution issue (background wait-loop misuse); this reflects partial progress only.**


- Total sites in worklist: 186
- Sites actually queried against TourAPI `locationBasedList2` (radius 300m, widened to 1000m if empty): 170
- Sites NOT YET queried at all: 16 (list below)
- Confident matches found (TourAPI location-based): **10**
- Wikimedia Commons fallback: **not attempted this run** — stopped before reaching step B for any site

## Matches found (source = tourapi_location)

| Site | Diocese | Matched TourAPI title | Confidence |
|---|---|---|---|
| 약현성당 (중림동성당) | | 서울 약현성당 | high |
| 공세리성지성당 | | 아산 공세리성당 | high |
| 나주 순교자 기념성당 | | 나주 순교성지 | high |
| 천진암 성지 | | 천진암 성지 | high |
| 죽림동 순교 성지 | | 죽림동성당 | high |
| 갑곶 순교성지 | | 갑곶돈대 | medium |
| 해미순교성지 | | 서산 해미읍성 회화나무 | medium |
| 원동 주교좌성당 | | 원동성당 | medium |
| 왜고개 성지 | | 왜고개 | medium |
| 경기 감영 터 | | 서소문성지역사박물관 | medium |

## Queried but no confident TourAPI match (160 sites)

These 160 sites were queried via locationBasedList2 (300m then 1000m radius) but returned either no nearby records with contentTypeId 12/14, or only implausible nearby records (unrelated cafes, schools, unrelated historical figures, wrong-denomination churches, etc). None were force-matched. Wikimedia Commons fallback (step B) was NOT attempted for any of these — that is the next step for a future run.

- 서짓골 성지
- 양근 성지
- 성거산성지
- 수원 화성 순교성지
- 참회와 속죄의 성당
- 천주교 대흥동 교회 (대흥동 성당)
- 황새바위 순교성지
- 새남터순교성지
- 서소문 밖 네거리 순교성지
- 춘천교구 주교관과 교육원
- 기장 성지
- 명동대성당
- 오륜대 한국 순교자 박물관
- 울산 장대 순교지
- 울산 죽림굴(대왕암) 순교지
- 정찬문 안토니오 순교성지
- 순교자의 딸 유섬이 묘
- 경상감영 옥터 순교지
- 계산 주교좌대성당
- 관덕정 순교성지
- 왜관 성 베네딕도 수도원
- 곡성 옥터 성지(곡성성당)
- 목포 산정동 순교자기념성당
- 영광 순교자 기념성당
- 답동주교좌성당
- 대정성지 (정난주 마리아 묘)
- 용수성지 (성 김대건 신부 제주 표착 기념관)
- 제주 관덕정
- 손골 성지
- 수리산 성지
- 연풍 순교성지
- 청주읍성 순교성지(서운동성당)
- 배티 순교성지
- 전동성당
- 죽산 순교성지
- 천호성지
- 초남이 성지
- 치명자산 성지
- 미리내 성지
- 용소막성당
- 은이 성지
- 풍수원성당
- 골배마실 성지
- 강릉 임당동성당
- 배론성지
- 제물진두 순교성지
- 소양로 순교성지
- 화현 이벽 성지
- 5·18 기념성당(남동성당)
- 갈매못 순교성지
- 파티마평화의성당
- 거제 윤봉문 요셉 순교성지
- 나바위 성지
- 남한산성 순교성지
- 음성 감곡면 매괴성당
- 이승훈 베드로 성지
- 진주 문산성당
- 충북 보은 멘에목 순례성지
- 통영 김기량 순교지(통제영 옥터)
- 황사영 순교순례지
- 황사평 성지
- 구산 성지
- 어농 성지
- 김기량 순교 기념관
- 새미 은총의 동산
- 요당리 성지
- 여우목 성지
- 농은 홍유한 선생 고택지
- 머루산 교우촌
- 상주 신앙 고백비
- 상주 옥 터
- 황경한 묘
- 수영 장대 순교성지
- 우곡 성지
- 살티 공소
- 언양 성당
- 진안리 성지
- 한실 교우촌
- 오륜대 순교자 성지
- 울산 병영 순교성지
- 대산 성당 복자 구한선 타대오 성지
- 복자 박대식 빅토리노 묘
- 강경 성당
- 남방제 성지
- 다락골 성지
- 덕산 순교 성지
- 배나드리 성지
- 산막골·작은재 성지
- 수리치골 성모 성지
- 원머리 성지
- 지석리 성지
- 진산 성지
- 홍주 순교 성지
- 성 남종삼 요한·순교자 남상교 아우구스티노 유택지
- 대안리 공소
- 정산 순교 성지
- 황무실 성지
- 서지 마을
- 의정부 주교좌성당
- 갈곡리 성당
- 마재 성가정 성지
- 성 남종삼 요한과 가족 묘소
- 성모 순례지
- 성체 순례 성지
- 신암리 성당
- 양주 순교 성지
- 음성 봉암 성지
- 김제 순교 성지
- 일만 위 순교자 현양 동산
- 진무영 순교 성지
- 충주 숲거리 순교 성지
- 서천교 순교 터
- 수류 성당
- 수분 공소
- 안대동 성당지
- 어은 공소
- 신성 공소
- 전라 감영
- 초록바위 순교 터
- 전주 숲정이 성지
- 소양로 성당
- 묵호 성당
- 강릉 대도호부 관아
- 곰실 공소
- 금광리 공소
- 양양 성지
- 포천 순교 성지
- 홍천 성당
- 좌포도청 터
- 가톨릭 대학교 성신 교정
- 가회동 성당
- 석정 보름 우물
- 광희문 성지
- 김범우의 집터
- 노고산 성지
- 삼성산 성지
- 용산 성직자 묘역
- 용산 예수 성심 신학교
- 종로 성당
- 한국 순교자 103위 시성 터
- 우포도청 터
- 의금부 터
- 한국 천주교회 창립 터
- 형조 터
- 복자 성당
- 비산 성당
- 경주 관아와 옥 터
- 구룡 공소
- 김수환 추기경 사랑과 나눔 공원
- 성 유스티노 신학교
- 신나무골 성지
- 진목정
- 성모당·성직자 묘지
- 새방골 성당
- 강원 감영
- 겟세마니 피정의 집
- 광화문 124위 시복 터
- 김범우 순교자 성지
- 김천 황금성당
- 남양 성모 성지

## Not queried at all this run (16 sites)

These were never sent to TourAPI (run stopped before reaching them):

- 마원 성지 (안동)
- 성내동 성당 (원주)
- 여산 순교 성지 (전주)
- 전옥서 터 (서울)
- 조씨 형제 순교자 묘 (부산)
- 창원 웅천 왜성 (마산)
- 합덕 성당 (대전)
- 행주 성당 (의정부)
- 개갑 장터 순교 성지 (전주)
- 단양 김범우 순교 성지 (원주)
- 대흥 봉수산 순교 성지 (대전)
- 도앙골 성지 (대전)
- 되재 성당지 (전주)
- 라 파트리치오 신부 순교 터 (춘천)
- 명례 성지 (마산)
- 삽티 성지 (대전)

## Notes / caveats on the 10 matches

- Several matches are "same complex/site, different registered name" rather than an exact building photo (e.g. 갑곶 순교성지 → 갑곶돈대 shows the historic fort/park the shrine sits within, not the shrine chapel; 해미순교성지 → 회화나무 shows the martyrdom tree, not a shrine building; 경기 감영 터 → 서소문성지역사박물관 shows the modern museum built on the same execution grounds, not literal ruins). These were kept because they are historically/physically the same site and clearly on-topic, but a human reviewer should sanity-check the actual image before running the SQL.
- The 왜고개 성지 match (title "왜고개") could not have its image content independently verified beyond the title/location match — flagged medium confidence.
- Two heuristic hits were deliberately rejected despite superficial "성당" keyword overlap: 진무영 순교 성지 → "대한성공회 강화성당" (wrong denomination — Anglican, not Catholic) and several "가톨릭타운"/generic-complex hits (성 유스티노 신학교, 성모당·성직자 묘지, 관덕정 순교성지) that only matched a generic nearby cluster name, not the specific building.

## Next steps for a future run

1. Query TourAPI for the 16 not-yet-queried sites listed above.
2. Run Wikimedia Commons fallback (step B) on the ~160 sites with no confident TourAPI match — not attempted at all this run.
3. Re-review medium-confidence matches above before running the SQL file.