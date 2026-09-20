/**
 * 한국 시간 기준 날짜 문자열. 관광공사 집중률의 `baseYmd`(YYYYMMDD)와 맞추는 데 쓴다.
 * 브라우저 시간대가 어디든 "오늘"은 한국 날짜다 — 해외 사용자가 봐도 성지는 한국에 있다.
 * `new Date().toISOString()` 은 UTC 라 한국 밤 9시 이후엔 어제가 된다(2026-09-21 새벽 실측: 방문일 기본값이 9/20).
 */
export function koreaTodayYmd(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}${get('month')}${get('day')}`;
}

/** 한국 날짜를 `YYYY-MM-DD` 로 — `<input type="date">` 값·`visited_on` 열과 맞춘다. */
export function koreaTodayIso(date: Date = new Date()): string {
  const ymd = koreaTodayYmd(date);
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}
