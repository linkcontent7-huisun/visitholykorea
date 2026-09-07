---
name: reference-local-verification
description: 로컬 세션에서 화면·실데이터를 검토자가 직접 재현하는 방법(.env.local 따옴표 함정, 헤드리스 Chrome + CDP)
metadata:
  type: reference
---

검토자가 "기록을 믿지 말고 직접 확인"할 때 쓰는 로컬 수단 (2026-09-05 실측).

- **`.env.local` 의 값은 따옴표로 감싸여 있다.** Vite 는 벗겨 읽지만 Node 스크립트에서
  그냥 읽으면 TourAPI 가 403 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`(코드 30)를 준다.
  → 값을 읽을 때 `.replace(/^"|"$/g, '')` 를 반드시 붙인다. 키가 죽은 것으로 오판하기 쉽다.
- **실데이터 재현**: TourAPI 는 `https://apis.data.go.kr/B551011/KorService2/<endpoint>` 에
  `serviceKey·MobileOS=ETC·MobileApp·_type=json` 을 붙여 그냥 `fetch` 하면 된다.
  `holy_sites` 는 Supabase REST(`/rest/v1/holy_sites?select=id,name,lat,lng`, 컬럼은 `lat`·`lng`)로 받는다.
- **화면 실측**: `npm run dev -- --port <빈포트>` 로 다른 세션과 겹치지 않는 포트에 띄우고,
  `C:\Program Files\Google\Chrome\Application\chrome.exe --headless=new --remote-debugging-port=<포트>
  --user-data-dir=<스크래치패드>` 로 Chrome 을 띄운 뒤, Node 전역 `WebSocket` 으로 CDP 에 직접 붙어
  `Emulation.setDeviceMetricsOverride`(375px) → `Runtime.evaluate` 로 `scrollWidth`·요소 좌표·클릭까지 다 된다.
  큰 글자 모드는 `localStorage.vhk_large_text='true'`, 출발지는 `vhk_origin`, 언어는 `vhk_language`.
- 끝나면 `netstat -ano | grep :<포트>` → `taskkill //PID <pid> //T //F` 로 반드시 정리한다.

관련: [[project-멀티에이전트-동시작업]]
