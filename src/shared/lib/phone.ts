/**
 * 전화 단추에 넣을 `tel:` 주소 — **첫 번호만** 쓴다(2026-11-22 점검 S2, 상).
 *
 * 예전에는 글자에서 숫자만 남겨, 「(031)674-1256~7」이 03167412567, 「(031)246-8844,5」가 03124688445 처럼
 * 없는 번호로 걸렸다(미리내·수원 화성·전주 천호·새미·황사평 등). 화면 글자는 그대로 두고,
 * 「~」「,」「/」나 설명 글 앞의 첫 번호 한 개만 뽑는다. 번호를 못 찾으면 null(단추를 걸지 않음).
 */
const PHONE =
  /\+\d{1,3}[\s.-]*\(?\d{1,4}\)?[\s.-]*\d{3,4}[\s.-]*\d{4}(?!\d)|\(?\d{2,4}\)?[\s.-]*\d{3,4}[\s.-]*\d{4}(?!\d)|\b\d{4}-\d{4}\b/;

export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const m = phone.match(PHONE);
  if (!m) return null;
  return `tel:${m[0].replace(/[^0-9+]/g, '')}`;
}
