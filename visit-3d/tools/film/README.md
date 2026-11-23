# 촬영·비교·녹화 도구 (2026-11-09~10 세션에서 만든 것)

전제: 개발 서버가 떠 있어야 한다 — `cd ~/visitholykorea-integration/visit-3d && npx vite --port 5197`
(이 맥에서는 5197 이 잡혀 있어 vite 가 **http://[::1]:5198/visit/** 로 뜬다. IPv6 주소만 듣는다.)
모든 도구는 이 맥의 구글 크롬을 따로 띄워(DevTools Protocol) 쓴다 — 확장·사용자 창과 무관. Node 20+.

| 파일 | 용도 | 쓰는 법 |
|---|---|---|
| `shots.mjs` | 기준 6장면(언덕길·정면·성모동굴·신자석·제대·측랑햇살) 같은 각도로 찍기 — 수정 전/후 비교 | `cd <저장폴더> && node shots.mjs "http://[::1]:5198/visit/?nointro&avatar=gabriel" <접두어>` |
| `grotto.mjs` | 성모 동굴 가까이 5곳(봉헌초 켜 둠) | 위와 같음 |
| `facade.mjs` | 정면·45도·옆면·익랑 | 위와 같음 (안의 `shots` 배열을 고쳐 각도 추가) |
| `rear.mjs` / `stairs.mjs` | 뒷면 / 언덕 계단 | 위와 같음 |
| `probe.mjs` | 화면 점에 광선을 쏴 물체·재질·좌표를 찍거나(흰 판 원인 찾기), 걷기 시험 | 안의 JS 식을 고쳐 쓴다 |
| `rec.mjs` + `director.js` | 시연 영상 녹화(720p, 캔버스 → mp4 조각) — director.js(v3, 약 62초 8장면)는 `public/__director.js` 로 복사해 두고 `recv.py`(127.0.0.1:5299)로 받는다. 결과 JSON 의 `marks` 가 장면 시작 시각 | `python3 recv.py <저장폴더> &` → `node rec.mjs "http://[::1]:5198/visit/?nointro&avatar=gabriel" <테이크명> \| tee <테이크>.log` |
| `subs.py` | 테이크 로그의 marks → 자막 JSON(장면 한 줄 + 끝 4.8초 출처·주소) | `python3 subs.py <테이크>.log subs.json` |
| `finish.swift` | 720p → 1080p 확대 + 한글 자막(비트맵) + 음악(페이드) 한 번에 — avconvert·mux 를 대신한다 | `swift finish.swift <take.mp4> <music.mp3> subs.json <out.mp4> [음악시작초] [음량]` |
| `director-final.js` | 이전(v2, 79초) 감독 스크립트 보관 | |
| `mux.swift` / `mux2.swift` | 영상에 음악 1곡 / 2곡 교차 입히기(AVFoundation, ffmpeg 없음) | `swift mux.swift <video> <music> <out> [시작초] [음량]` |
| `frames.swift` | 영상에서 프레임 뽑기 | |

비교 시트: 찍은 jpg 를 HTML 표로 묶어 `Google Chrome --headless --screenshot=~/Downloads/비교_*.png` 로 렌더 → `open`.
음악: `~/Downloads/VisitHolyKorea_음원/모던/` 의 "New Horizon"(Soundrider/Dope, CC BY 3.0 — 출처 표기 필수).

## 벽 통과 시험 (2026-11-23, 사장님: 「절대 물체를 통과할 수 없다」)

고치기 전·후 모두 돌린다. 휴대폰 흉내 창에서 열고 `__vhk` 로 캐릭터를 직접 걷게 한다. 로컬은 `npx vite --port 5311` 후 `http://localhost:5311/visit/?nointro`.

| 파일 (`checks/`) | 하는 일 | 합격 |
|---|---|---|
| `벽-틈-재기.js` | 성당 둘레를 따라 「눈에 보이는 겉 벽」과 「충돌 벽」 사이의 거리를 잰다 | 0.4 m 넘는 틈 없음 |
| `사방에서-벽-향해-걷기.js` | 문을 닫고 사방에서 성당을 향해 걸어 눈에 보이는 벽을 지나간 횟수 | 0 |
| `문닫고-안으로-들어가지는지.js` | 문이 닫힌 채 달려서 실내에 들어가지는 자리 | 0 |
| `정문-통과.js` | 문 열림·닫힘, 문 폭 안팎에서 걸어 정문이 열릴 때만 지나가는지 | 열림: 가운데만 통과 / 닫힘: 모두 막힘 |
| `실내-걷기.js` | 신랑·측랑·회랑·현관을 정해진 길로 걸어 막히는 곳이 없는지 | 모두 `o` (벽에 붙어 걷기·바깥 한 바퀴의 `X` 는 운영도 같은 모서리 — 따로 본다) |

실행: `node tools/film/eval.mjs "http://localhost:5311/visit/?nointro" tools/film/checks/벽-틈-재기.js`
