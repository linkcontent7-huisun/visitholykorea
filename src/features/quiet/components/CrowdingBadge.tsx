import type { CrowdingLevel } from '../api/crowding-score';

/**
 * 붐빔 등급 표시.
 *
 * 색은 신호등 순서를 따른다 — 고령 이용자가 많은 서비스라 새로운 색 규칙을 배우게 하지 않는다.
 * 대신 채도를 낮춰 성지의 분위기를 해치지 않게 했다.
 * 색만으로 뜻이 전달되지 않도록 등급 이름을 항상 함께 쓴다(색각 이상 대응).
 */
const LEVEL_STYLE: Record<CrowdingLevel, string> = {
  '아주 조용': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  조용: 'bg-teal-50 text-teal-800 border-teal-200',
  보통: 'bg-amber-50 text-amber-800 border-amber-200',
  붐빔: 'bg-orange-50 text-orange-800 border-orange-200',
  '매우 붐빔': 'bg-rose-50 text-rose-800 border-rose-200',
};

interface CrowdingBadgeProps {
  level: CrowdingLevel;
  score: number;
  /** 주변 정보를 못 받아 축제 압력만으로 낸 값인지 */
  isPartial?: boolean;
}

export function CrowdingBadge({ level, score, isPartial = false }: CrowdingBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold ${LEVEL_STYLE[level]}`}
    >
      {level}
      <span className="font-medium opacity-60">{score}</span>
      {isPartial && <span className="font-medium opacity-60">· 일부</span>}
    </span>
  );
}
