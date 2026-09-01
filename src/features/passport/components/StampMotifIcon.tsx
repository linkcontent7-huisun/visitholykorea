import type { StampMotif } from '../lib/stamp-motifs';

/**
 * 스탬프 모티프를 SVG 로 그린다 (여권 화면용).
 * 색은 currentColor — 부모의 text-* 클래스가 곧 도장 잉크 색이다.
 */
export function StampMotifIcon({ motif, className }: { motif: StampMotif; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={motif.label}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {motif.paths.map((p, i) => (
        <path key={i} d={p.d} strokeWidth={p.width ?? 4} />
      ))}
    </svg>
  );
}
