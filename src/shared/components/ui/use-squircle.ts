import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { getSvgPath } from 'figma-squircle';

/**
 * 각진 모서리(원호) 대신 초타원 곡선(스쿼클)을 낸다 — 2026-09-20 사장님 지시.
 * `border-radius` 는 크기가 바뀌어도 그대로지만, 스쿼클은 실제 렌더 크기가 있어야
 * 경로를 계산할 수 있어 `ResizeObserver` 로 잰다 (버튼은 글자 길이·큰 글자 모드로,
 * 카드는 반응형 그리드로 너비가 바뀐다).
 *
 * `border` 는 clip-path 를 못 따라가므로 CSS 테두리를 포기하고, 같은 경로를 SVG
 * `stroke` 로 덧그린다 (`SquircleBorder.tsx`) — 바깥 절반이 clip-path 에 잘려 나가
 * 1px 테두리와 같은 두께로 보이도록 strokeWidth 를 2배로 준다.
 */
const CORNER_SMOOTHING = 0.8;

export function useSquircle<T extends HTMLElement = HTMLElement>(radius: number) {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setBox((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const path = box
    ? getSvgPath({
        width: box.width,
        height: box.height,
        cornerRadius: radius,
        cornerSmoothing: CORNER_SMOOTHING,
        preserveSmoothing: true,
      })
    : null;

  // 경로를 재기 전(첫 렌더) 순간적으로 각진 모습이 보이지 않도록 같은 반지름의
  // 둥근 사각형을 잠깐 대신 쓴다 — useLayoutEffect 가 첫 페인트 전에 끝나 보통은 안 보인다.
  const style: CSSProperties = path ? { clipPath: `path('${path}')` } : { borderRadius: radius };

  return { ref, style, overlay: path && box ? { path, ...box } : null };
}
