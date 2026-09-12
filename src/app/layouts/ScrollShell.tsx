import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * 앱 전체의 스크롤 상자.
 *
 * 왜 body 가 아니라 이 상자를 스크롤시키는가 — 휴대폰 브라우저는 body 가 스크롤될 때
 * 자기 주소창을 접었다 폈다 한다. 그때마다 화면 높이가 바뀌어 `fixed` 하단 탭이
 * 출렁이고, 탭 아래로 브라우저 주소창이 비집고 올라왔다 (2026-09-12 사장님 실기기
 * 보고). body 를 잠그고 이 상자만 스크롤되게 하면 브라우저가 주소창을 움직일 이유가
 * 없어져 하단 탭이 제자리에 붙어 있는다.
 *
 * 스크롤 위치 복원은 react-router 의 `ScrollRestoration` 이 window 만 다루므로
 * 여기서 직접 한다 — 새 화면은 맨 위에서, 뒤로가기는 있던 자리에서.
 */
const positions = new Map<string, number>();

export function ScrollShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const key = location.key;
    el.scrollTop = navigationType === 'POP' ? (positions.get(key) ?? 0) : 0;
    // 화면을 떠날 때의 위치를 남긴다 — 정리 함수는 다음 화면이 그려지기 전에 돈다
    return () => {
      positions.set(key, el.scrollTop);
    };
  }, [location.key, navigationType]);

  return (
    <div ref={ref} id="app-scroll" className="h-dvh overflow-y-auto overscroll-none">
      {children}
    </div>
  );
}
