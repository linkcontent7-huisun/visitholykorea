/**
 * 테두리(선·점선)를 스쿼클 경로 위에 SVG 로 덧그린다. Card·Button 의 `border` 클래스를 대신한다.
 *
 * `color` 는 기본 선 색(CSS 값 문자열). 호버 등 상태에 따라 색이 바뀌어야 하면(예: 카드
 * 호버 시 남색 테두리) `className` 으로 Tailwind `stroke-*`/`group-hover:stroke-*` 를 더
 * 준다 — 클래스(스타일시트 규칙)가 `stroke` 속성보다 우선한다.
 */
export function SquircleBorder({
  path,
  width,
  height,
  color,
  className,
  dashed = false,
  strokeWidth = 1,
}: {
  path: string;
  width: number;
  height: number;
  color: string;
  className?: string;
  dashed?: boolean;
  strokeWidth?: number;
}) {
  return (
    <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden>
      <path
        d={path}
        fill="none"
        stroke={color}
        className={className}
        strokeWidth={strokeWidth * 2}
        strokeDasharray={dashed ? strokeWidth * 4 : undefined}
      />
    </svg>
  );
}
