/**
 * 한국 시간 기준 날짜 문자열. 관광공사 집중률의 `baseYmd`(YYYYMMDD)와 맞추는 데 쓴다.
 * 브라우저 시간대가 어디든 "오늘"은 한국 날짜다 — 해외 사용자가 봐도 성지는 한국에 있다.
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
