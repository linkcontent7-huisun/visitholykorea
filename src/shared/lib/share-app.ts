import { copyText } from './map-links';

export type ShareResult = 'shared' | 'copied' | 'error';

/**
 * 앱 링크를 친구에게 보낸다.
 *
 * 휴대폰은 공유 시트(카카오톡·문자 등)를 띄우고, 공유 시트가 없는 환경(PC 크롬 등)은
 * 주소를 복사한다. 결과를 돌려주므로 호출한 화면이 "복사됐어요" 같은 안내를 그린다 —
 * alert 은 쓰지 않는다.
 *
 * 설정 화면과 하단 「홈화면 추가」 탭이 같은 동작을 쓰기 때문에 한 곳에 뒀다(2026-09-13).
 */
export async function shareApp(): Promise<ShareResult> {
  const shareData = { title: document.title, url: window.location.origin };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {
      // 사용자가 공유를 취소한 경우 등 — 조용히 무시
    }
    return 'shared';
  }
  const ok = await copyText(shareData.url);
  return ok ? 'copied' : 'error';
}
