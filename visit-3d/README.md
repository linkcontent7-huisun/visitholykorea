# Visit Holy Korea — 성지 가상 순례 (시범)

첫 사례는 **명동대성당 구내**다. 실제 구내 건물 배치(OpenStreetMap) 속에서 성당을 바라보다가, 정문을 열고 들어가 실내를 둘러본다.
여럿이 같은 공간에 들어와 서로를 보고, 초를 켜고, 종을 울리고, 견본 어린이 그림에 반응을 남긴다.

- 성당 건물·실내: 고딕 리바이벌 양식을 참고해 코드로 지은 재구성 모델(실측 복제 아님 · 공식 콘텐츠 아님)
- 둘레 건물 61동·구내 경계: © OpenStreetMap contributors (ODbL) — 화면 아래에 늘 표시한다
- 외부 사진·스캔 없음: 텍스처는 캔버스로 합성한다. 효과음은 Web Audio 합성, 종소리·배경 음악 3곡은 퍼블릭 도메인·CC0 녹음(출처: `src/audio.ts` 머리 주석)

## 실행

```bash
npm install
npm run build          # tsc 검사 + vite 빌드 → dist/visit/ (base /visit/)
npm start              # http://127.0.0.1:8897  (정적 파일 + Colyseus 실시간 방)
```

- 시작 공간 지정: `/?space=cathedral` · `/?space=chapel`
- 구내 지도 단독 페이지: `/sitemap.html`
- 점검: `curl http://127.0.0.1:8897/healthz`

## 구조

| 위치 | 내용 |
|---|---|
| `src/main.ts` | 렌더러·조명·하늘·입력·상호작용·카드·투어·HUD |
| `src/spaces/cathedral.ts` | 대성당 실내(OSM 실측 평면: 종탑 현관·신랑·측랑·익랑·후진·회랑) + 대체 외관 |
| `src/spaces/site.ts` | 상세 외관 frame 에 맞춰 OSM 구내를 붙이고, 걸어 들어갈 수 있는 외관을 실어 온다 |
| `src/spaces/chapel.ts` | 언덕 위 경당(팔각 · 견본 그림 10점) |
| `src/spaces/props.ts` | 신도석·봉헌초대·안내대·액자·종 |
| `src/player.ts` | 캡슐 충돌(three-mesh-bvh)·중력·앉기·투어 이동 |
| `src/net.ts` | Colyseus 클라이언트·아바타 보간 |
| `server/` | Express 정적 서빙 + Colyseus `SpaceRoom` |
| `shared/spaces.ts` | 공간 id·봉헌 지향·인사말(서버·클라이언트 공용) |
| `src/sitemap/`, `scripts/fetch-osm-site.mjs`, `public/site/` | OSM 구내 지도(다른 세션 작성) |

## 배포

- Vercel 프로젝트 `visitholykorea-visit` 이 이 폴더(`visit-3d/`)를 빌드한다. 메인 사이트 `vercel.json` 이 `/visit/*` 를 여기로 넘긴다.
- Vercel 에는 화면(클라이언트)만 올리고, 실시간 방 주소는 빌드 때 `VITE_ROOM_URL` 로 정한다(`.env.example`).
- 운영 배포 절차·내부 문서는 공개 저장소에 두지 않는다(2026-11-15 저장소 통합 때 사장님 결정: 코드만 공개).
