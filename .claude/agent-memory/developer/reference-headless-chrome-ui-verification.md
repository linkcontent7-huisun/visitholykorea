---
name: reference-headless-chrome-ui-verification
description: 이 노트북에는 Chrome·Edge 가 깔려 있어 헤드리스 스크린샷으로 실제 화면(375px·큰 글자)을 검증할 수 있다
metadata:
  type: reference
---

로컬 세션에서는 **설치된 브라우저로 진짜 화면을 찍어 확인할 수 있다.** Playwright 를 새로 깔 필요가 없다.

- `C:\Program Files\Google\Chrome\Application\chrome.exe` (Edge 는 `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`)
- `--headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=375,1400 --virtual-time-budget=20000 --screenshot=<png> <url>`
  → 나온 PNG 를 Read 도구로 열면 눈으로 확인된다.
- 개발 서버는 `npm run dev` (포트 3000 이 이미 쓰이고 있으면 3001 로 뜬다 — **다른 세션의 3000 을 죽이지 말 것**).
- `scrollWidth`·요소 좌표 같은 **측정**이 필요하면, `public/` 에 임시 HTML 을 두고
  같은 origin 의 iframe 으로 앱을 띄워 재면 된다(파일 URL 은 교차 출처라 막힌다).
  `localStorage` 의 `vhk_large_text`·`vhk_language`·`vhk_origin` 를 미리 넣으면
  큰 글자 모드·6개 국어 상태를 그대로 만들 수 있다. 확인이 끝나면 임시 파일은 지운다.

관련: [[project-multi-agent-shared-files]]
