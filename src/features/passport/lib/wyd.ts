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

/**
 * WYD 2027 대회 기간 — 교구대회 시작(7/29)부터 본대회 폐막(8/8)까지.
 * 날짜는 바티칸 평신도가정생명부 공식 발표(2025) 기준.
 *
 * 이 기간에 찍힌 스탬프는 "그때 거기 있었다"는 한정판이 된다.
 * 다시 오지 않는 날짜라는 WYD 의 본질을 그대로 수집 메커니즘으로 옮긴 것.
 */
const WYD_START = new Date(2027, 6, 29); // 2027-07-29 00:00 (교구대회 시작)
const WYD_END = new Date(2027, 7, 9); // 2027-08-08 하루가 전부 포함되도록 8/9 자정 직전까지

export const WYD_LIMITED_LABEL_KO = 'WYD 2027 한정 스탬프';
export const WYD_LIMITED_LABEL_EN = 'WYD Seoul 2027 · Limited Edition';

/** 지금이 WYD 2027 대회 기간인가 (한정판 잉크 판정). */
export function isWydPeriod(date: Date = new Date()): boolean {
  return date >= WYD_START && date < WYD_END;
}
