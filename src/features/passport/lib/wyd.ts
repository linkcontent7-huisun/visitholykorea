/**
 * WYD(세계청년대회) 2027 서울 — 공식 일정지 표시.
 *
 * 확정 사실(docs/30-content-ops/SNS-레퍼런스-조사.md 3장):
 * 본대회 2027.8.3~8.8 서울, 공식 일정에 솔뫼성지·해미읍성이 들어 있고
 * 수호성인이 성 김대건 안드레아와 동료 순교자다. 해외 청년 20~30만 명이
 * 온다 — 이들이 "한국에서만 받을 수 있는 스탬프"를 갖게 하는 장치다.
 */

/** 공식 일정지로 확인된 이름 조각. 확정 발표된 곳만 넣는다 — 추측 금지. */
const WYD_VENUE_PATTERNS = ['솔뫼', '해미'] as const;

export const WYD_LABEL_KO = 'WYD 2027 공식 일정지';
export const WYD_LABEL_EN = 'World Youth Day Seoul 2027 · Official Venue';

/** 이 성지가 WYD 2027 공식 일정지인가. */
export function isWydVenue(siteName: string): boolean {
  return WYD_VENUE_PATTERNS.some((p) => siteName.includes(p));
}
