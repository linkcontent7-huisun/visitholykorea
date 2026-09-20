import { useEffect, useRef } from 'react';

/**
 * 모달(대화상자) 포커스 관리 — 미카엘 가이드 시트 · 사진 확대 · 홈화면 추가 시트가 같이 쓴다.
 *
 * 2026-09-20 접근성 감사에서 세 모달 모두 열려도 포커스가 뒤 화면 단추에 남고, Tab 이 오버레이
 * 뒤를 돌아다니며, 닫아도 포커스가 돌아오지 않았다(WCAG 2.1.2 · 2.4.3). 키보드·스크린리더로는
 * 사실상 못 쓰는 상태였다. 여기서 한 번에 한다:
 *
 * 1. 열리면 `[data-autofocus]` 요소(없으면 첫 초점 가능 요소)로 포커스를 옮긴다.
 * 2. Tab / Shift+Tab 은 모달 안에서만 돈다.
 * 3. Esc 로 닫는다.
 * 4. 열린 동안 모달 바깥(조상의 형제들)에 `inert` 를 붙여 보조기기·탭 이동에서 감춘다.
 *    바깥을 눌러 닫는 반투명 배경도 모달 상자 **안**에 두어야 한다 — 바깥에 두면 inert 로 눌리지 않는다.
 * 5. 닫히면 열었던 요소로 포커스를 되돌린다.
 *
 * `onClose` 는 ref 로 들고 있는다 — 호출부가 매번 새 함수를 넘겨도 효과가 다시 돌아
 * 입력 중인 포커스를 빼앗지 않게.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalFocus<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.getAttribute('aria-hidden') !== 'true' && node.getClientRects().length > 0,
      );

    // 4. 바깥을 inert 로 — 모달의 조상을 따라 올라가며 그 형제들만 막는다(모달 자신의 줄기는 남긴다)
    const inerted: Element[] = [];
    for (let node: HTMLElement | null = el; node && node !== document.body; ) {
      const parent: HTMLElement | null = node.parentElement;
      if (!parent) break;
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== node && !sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          inerted.push(sibling);
        }
      }
      node = parent;
    }

    // 1. 첫 포커스 — 열림 애니메이션(motion)이 요소를 아직 그리는 중일 수 있어 한 프레임 뒤에
    const frame = requestAnimationFrame(() => {
      const target =
        el.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? el;
      if (target === el && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      // 2. Tab 순환
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      const outside = !el.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      for (const node of inerted) node.removeAttribute('inert');
      // 5. 열었던 자리로
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  return ref;
}
