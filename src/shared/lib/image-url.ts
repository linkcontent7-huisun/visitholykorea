/**
 * 대표 이미지 크기 맞추기.
 *
 * 성지 사진 상당수가 Wikimedia Commons 의 1280px 썸네일 주소로 저장돼 있다(예: 명동대성당 700KB).
 * 휴대폰 화면(390~430px, 2배 밀도)에는 800px 이면 충분한데 1280px 을 그대로 내려받아
 * Lighthouse 모바일 LCP 가 11초를 넘었다(2026-09-14 실측, `docs/10-product/재기획/2026-09-14-구현-기록.md`).
 *
 * Wikimedia 썸네일 주소는 `…/thumb/<a>/<ab>/<File>/<N>px-<File>` 꼴이라 `<N>` 만 바꾸면
 * 서버가 그 크기로 다시 만들어 준다 — 공식 URL 규칙이므로 추측이 아니다.
 * 그 밖의 주소(직접 촬영·Supabase 스토리지)는 손대지 않는다.
 */
const WIKIMEDIA_THUMB = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/[^/]+\/)(\d+)(px-[^/?#]+)(.*)$/;

export function sizedImageUrl(url: string, width: number): string;
export function sizedImageUrl(url: string | null, width: number): string | null;
export function sizedImageUrl(url: string | null, width: number): string | null {
  if (!url) return url;
  const m = WIKIMEDIA_THUMB.exec(url);
  if (!m) return url;
  const current = Number(m[2]);
  // 이미 더 작은 썸네일이면 키우지 않는다 — 원본보다 큰 크기를 요청하면 Wikimedia 가 400 을 낸다.
  if (!Number.isFinite(current) || current <= width) return url;
  return `${m[1]}${Math.round(width)}${m[3]}${m[4] ?? ''}`;
}
