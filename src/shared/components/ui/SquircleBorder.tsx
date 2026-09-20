/** 테두리(선·점선)를 스쿼클 경로 위에 SVG 로 덧그린다. Card·Button 의 `border` 클래스를 대신한다. */
export function SquircleBorder({
  path,
  width,
  height,
  color,
  dashed = false,
  strokeWidth = 1,
}: {
  path: string;
  width: number;
  height: number;
  color: string;
  dashed?: boolean;
  strokeWidth?: number;
}) {
  return (
    <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * 2}
        strokeDasharray={dashed ? strokeWidth * 4 : undefined}
      />
    </svg>
  );
}
