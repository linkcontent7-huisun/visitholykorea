# 임시 이미지 — 사진이 아직 없는 성지의 자리

| 항목 | 내용 |
| --- | --- |
| 만든 사람 | 사장님(노희선) · AI 생성 이미지에 문구를 얹음 |
| 원본 | OneDrive `바탕 화면/ai이미지/외국어 이미지들/VisitHolyKorea-localized-images/` (jpg, 1475×1080 안팎, 장당 430KB) |
| 저장소 판 | 언어별 폴더 `ko/ en/ es/ fr/ it/ pt/` × 6장, 1280×914 webp q80 (장당 100~120KB, 2026-09-16 변환) |
| 고르는 규칙 | `src/shared/lib/site-placeholder.ts` — 성지 이름 해시 → 1~6 고정, 언어 → 폴더 |
| 쓰는 곳 | `SiteThumbnail` — 공식 사진도 순례자 사진도 없을 때 |
| DB | `holy_sites.image_url` 에는 넣지 않는다. 관리자 "사진 없음" 대기열이 DB 값으로 세기 때문 |

## 장면 6개 (모든 언어 공통)

1. 봄 — 매화와 한옥 성당, 해 뜨는 산
2. 산길
3. 가을 십자가
4. 바닷가 성당
5. 겨울 성당
6. 고딕 성당

## 이미지에 박힌 문구

| 언어 | 큰 글자 | 아래 두 줄 |
| --- | --- | --- |
| ko | 곧 현장 사진을 올릴 예정 | 지금도 순례자가 열심히 걸어가고 있는 중이에요 / 전국의 성지를 순례하며 현장 사진을 촬영하고 있어요 |
| en | On-site photos coming soon | Our pilgrim is still walking the route / Traveling to sacred sites across Korea and taking photos on location |
| es | Próximamente, fotos del lugar | Nuestro peregrino sigue en camino / Recorre lugares sagrados de toda Corea y toma fotos en el lugar |
| fr | Photos sur place bientôt disponibles | Notre pèlerin est toujours en chemin / Il parcourt les lieux saints de toute la Corée et prend des photos sur place |
| it | Foto dal luogo disponibili a breve | Il nostro pellegrino è ancora in cammino / Sta visitando i luoghi sacri di tutta la Corea e scattando foto sul posto |
| pt | Fotos do local em breve | O nosso peregrino continua a caminho / Está a visitar locais sagrados por toda a Coreia e a tirar fotografias no local |

새 언어를 켜려면 같은 6장면에 그 언어 문구를 얹은 판을 이 규칙대로 폴더에 넣고 `PLACEHOLDER_LANGUAGES` 에 추가한다.
