# ADR 0005. 코드의 기준은 GitHub 저장소다

- 날짜: 2026-08-04
- 상태: 채택

## 맥락

구조를 정비하면서 같은 앱의 소스가 최소 세 군데에 있다는 걸 확인했다.

1. `OneDrive/.../visit holy아이디어 모음집/한국관광공사앱개발/visitholykorea-app/` — 2026-07-30 무렵
2. 같은 폴더의 `visit-holy-korea.zip`, `visit-holy.zip` — 시점 불명
3. GitHub `nohhuisun/visitholykorea` — 가장 최신

셋의 내용이 달랐다. GitHub 에만 있던 것들:

- 전례력 한정판 스탬프(`liturgicalCalendar.ts`)
- 완주 인증서 PDF(`certificate.ts`)
- SNS 공유 카드(`shareCard.ts`)
- 마음 나침반(`HealingQuiz.tsx`)
- 성지 상세의 TourAPI 주변 정보·축제 연동, TTS
- `catholic_directory` 테이블, 성지 13곳 추가
- AI 페르소나 교체 (홀리 → 미카엘)

OneDrive 사본만 보고 작업했다면 이 기능들을 통째로 되돌릴 뻔했다.

## 결정

**코드의 기준은 GitHub 저장소 하나뿐이다.**

- OneDrive 의 앱 소스 사본과 zip 은 더 이상 참조하지 않는다. 백업으로 남겨두는 것은 자유지만,
  거기서 코드를 꺼내 쓰지 않는다.
- 기획·리서치 원본(DOCX, PDF, 사진)은 계속 OneDrive/Notion 에 두되,
  **결정과 구조에 관한 것은 저장소의 `docs/` 로 옮긴다.** 코드와 같이 버전이 관리돼야 하기 때문이다.
- 작업을 시작할 때는 항상 `git pull` 부터 한다.

## 결과

이번 구조 정비는 GitHub 최신 커밋(`bdbddaa`)을 기준으로 다시 포팅했다.
기능 손실 없이 폴더 구조·라우팅·데이터 계층만 바뀐 상태다.
