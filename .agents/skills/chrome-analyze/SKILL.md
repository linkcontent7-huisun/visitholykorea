---
name: chrome-analyze
description: 배포된 앱(또는 로컬 개발 서버)을 실제 Chrome 으로 열어 모든 화면을 스크린샷 찍고 디자인 정합성을 분석한다. 사용자가 "크롬 열어서 분석하자", "화면 다 열어봐", "디자인 정합성 봐줘", "스크린샷 찍어봐" 라고 하면 이 스킬을 따른다.
---

# 크롬 열어서 분석하기

실제 Chrome 을 CDP(원격 조종 포트)로 띄우고, agent-browser(Playwright 기반 CLI)로
붙어서 화면을 열고 스크린샷을 찍는다. 도구는 이미 깔려 있다 — 새로 설치하지 않는다.

## 🔴 도구를 나눠 쓴다 (2026-09-15 실측)

| 일 | 도구 | 이유 |
| --- | --- | --- |
| Chrome 띄우기·닫기 | **Bash 도구** (`bash scripts/browser/chrome-cdp.sh`) | PowerShell `Start-Process` 로는 Chrome 이 바로 종료돼 포트가 안 열린다 |
| agent-browser 전부 (open·screenshot·snapshot·click) | **PowerShell 도구** | Git Bash 에서는 데몬이 멈춰 90초 넘게 응답이 없다 |

## 절차

1. **Chrome 띄우기** (Bash 도구)
   ```bash
   bash scripts/browser/chrome-cdp.sh                        # 배포본
   bash scripts/browser/chrome-cdp.sh http://localhost:5173  # 로컬 dev 서버
   ```
   "준비됨: Chrome/… port 9222" 가 나오면 된다. 이미 떠 있으면 그대로 쓴다.

2. **전 화면 스크린샷** (PowerShell 도구)
   ```powershell
   .\scripts\browser\shoot-all.ps1              # screenshots/<날짜-시각>/ 에 저장
   .\scripts\browser\shoot-all.ps1 -Only menu,faq
   .\scripts\browser\shoot-all.ps1 -Extra /sites/<id>,/routes/<slug>
   ```
   성지 상세·코스 상세는 id 가 필요하다. `/explore`·`/routes` 를 먼저 열고
   `agent-browser --cdp 9222 snapshot -i` 로 링크 href 를 읽어 `-Extra` 에 넣는다.

3. **화면 하나씩 다루기** (PowerShell 도구, 필요할 때)
   ```powershell
   agent-browser --cdp 9222 open https://visitholykorea-app.vercel.app/menu
   agent-browser --cdp 9222 snapshot -i          # 클릭할 수 있는 요소 목록(ref 포함)
   agent-browser --cdp 9222 click @e12           # ref 로 클릭
   agent-browser --cdp 9222 screenshot "$env:TEMP\x.png"
   agent-browser --cdp 9222 screenshot x.png --full-page
   ```
   언어 토글·큰 글자 모드도 이 방법으로 눌러서 확인한다.

4. **분석** — 스크린샷을 Read 도구로 하나씩 보고, 아래 기준으로 화면 간 차이를 적는다.

## 정합성 기준 (화면끼리 같아야 하는 것)

| 항목 | 기준 |
| --- | --- |
| 헤더·하단 탭 | 모든 화면에 같은 헤더(로고·검색·글자·언어)와 하단 5탭이 있는가 (T-021 에서 둘러보기에 붙임) |
| 제목 | 화면 제목 글꼴(명조 계열)·크기·위쪽 여백이 같은가 |
| 카드 | 모서리 반경·그림자·안쪽 여백이 같은가 |
| 색 | 보라 계열 아이콘·강조색이 화면마다 다르지 않은가 |
| 비어 있을 때 | "준비 중"·"없음" 문구 스타일이 같은가. 더미 데이터가 남아 있으면 안 된다 |
| 큰 글자 모드 | 켰을 때 잘리거나 겹치는 데가 없는가 |
| 다국어 | 영어·스페인어로 바꿨을 때 문구가 넘치거나 한국어가 남아 있지 않은가 |

## 결과 정리

- 발견한 문제는 **화면 → 항목 → 증거(스크린샷 파일명)** 순으로 표로 적는다.
- 고칠 파일은 `src/pages/`·`src/features/`·`src/shared/ui/` 에서 찾는다.
- 스크린샷 폴더(`screenshots/`)는 git 에 올리지 않는다. 문서에 남길 이미지는 `docs/` 로 옮긴다.
- 끝나면 `bash scripts/browser/chrome-cdp.sh --stop` 으로 닫는다 (평소 쓰는 Chrome 은 안 닫힌다).

## 막힐 때

- `CDP 포트 9222 가 열리지 않았다` → 이전 CDP Chrome 이 남아 있다. `--stop` 후 다시.
- 스크린샷이 빈 화면 → `wait --load networkidle` 뒤 1초 더 기다린다. Supabase 응답이 느릴 때 생긴다.
- 한글이 깨져 보이는 출력 → 스크립트 안에서 UTF-8 을 잡지만, 직접 명령을 칠 땐
  `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` 을 먼저.
