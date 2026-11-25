import { useEffect, useRef } from 'react';

/**
 * 세례명 카드 창이 열린 동안 «뒤로 가기» 가 창만 닫게 한다 (사장님 지적 2026-11-25).
 *
 * 창은 주소가 바뀌지 않는 팝업이라, 열어 둔 채 뒤로 가기를 누르면 사이트를 아예 벗어나 버렸다
 * (직전에 보던 외부 화면으로 나감). 열 때 기록(history) 한 칸을 쌓아 두고,
 * - 뒤로 가기(popstate): 그 한 칸이 빠지며 창만 닫힌다 → 보던 사이트 화면에 그대로 남는다.
 * - 닫기 단추·바깥 누르기: 쌓아 둔 한 칸을 직접 되돌려, 다음 뒤로 가기가 한 칸 더 나가지 않게 한다.
 *
 * 기존 주소·state 는 그대로 복사해 쌓으므로 라우터(react-router)는 «같은 화면»으로 본다.
 */
export function useBackClosesSheet(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let ownsEntry = true;
    window.history.pushState({ ...(window.history.state as object | null), vhkSheet: 'baptism' }, '');

    const onPop = () => {
      ownsEntry = false; // 뒤로 가기로 이미 빠졌다
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // 닫기 단추 등으로 닫힌 경우: 우리가 쌓은 칸을 되돌린다
      if (ownsEntry) window.history.back();
    };
  }, [isOpen]);
}
