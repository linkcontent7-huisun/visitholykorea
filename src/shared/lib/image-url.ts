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
 *
 * 🔴 다만 폭은 아무 값이나 넣을 수 없다. Wikimedia 는 외부 핫링크에 **표준 폭만** 허용하고
 * 그 밖의 폭은 400 "Use thumbnail sizes listed on https://w.wiki/GHai" 로 거부한다
 * (MediaWiki 「Common thumbnail sizes」 · T414805). 2026-09-16 실측: 800px → 400, 960px → 200.
 * 그래서 홈·검색 카드(800 요청)만 "사진을 불러오지 못했어요" 가 뜨고 상세(960 요청)는 멀쩡했다.
 * 요청 폭은 표준 폭 가운데 그 이상인 가장 작은 값으로 올린다.
 */
const WIKIMEDIA_THUMB = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/[^/]+\/)(\d+)(px-[^/?#]+)(.*)$/;

/** Wikimedia 가 핫링크에 허용하는 썸네일 폭. 오름차순이어야 한다. */
export const WIKIMEDIA_THUMB_WIDTHS = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840] as const;

/** 요청 폭 이상인 표준 폭 가운데 가장 작은 값. 최대치를 넘으면 최대치. */
export function wikimediaStandardWidth(width: number): number {
  const w = Math.max(1, Math.round(width));
  for (const step of WIKIMEDIA_THUMB_WIDTHS) {
    if (step >= w) return step;
  }
  return 3840;
}

export function sizedImageUrl(url: string, width: number): string;
export function sizedImageUrl(url: string | null, width: number): string | null;
export function sizedImageUrl(url: string | null, width: number): string | null {
  if (!url) return url;
  const m = WIKIMEDIA_THUMB.exec(url);
  if (!m) return url;
  const current = Number(m[2]);
  const target = wikimediaStandardWidth(width);
  // 이미 더 작은(같은) 썸네일이면 키우지 않는다 — 원본보다 큰 크기를 요청하면 Wikimedia 가 400 을 낸다.
  if (!Number.isFinite(current) || current <= target) return url;
  return `${m[1]}${target}${m[3]}${m[4] ?? ''}`;
}
