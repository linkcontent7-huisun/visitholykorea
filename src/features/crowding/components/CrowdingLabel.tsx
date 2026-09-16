import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';
import type { CrowdingLevel } from '../api/crowding-score';
import { useNearbyCrowding } from '../hooks/use-nearby-crowding';
import { nearbyHeadline } from '../lib/crowding-text';

/**
 * 인근 혼잡도 라벨 — 색 점 + 문장 하나. 카드가 아니라 다른 UI 어디에나 붙이는 작은 부품(사장님 2026-09-16).
 *
 * 주어는 항상 **인근 지역**이고 등급은 세 단계, 숫자는 없다. 색은 신호등 순서지만 문장이 항상 같이 있어
 * 색만으로 뜻을 전하지 않는다. 근거·면책은 `title` 로만 남긴다.
 */
const DOT_CLASS: Record<CrowdingLevel, string> = {
  조용: 'bg-emerald-500',
  보통: 'bg-amber-500',
  붐빔: 'bg-rose-500',
};

type Variant = 'default' | 'onDark';

const PILL_CLASS: Record<Variant, string> = {
  default: 'border-app-border bg-white text-app-text',
  onDark: 'border-white/20 bg-white/15 text-white backdrop-blur-md',
};

export interface CrowdingLabelProps {
  level: CrowdingLevel;
  /** 기본은 「인근 지역이 조용해요」 류 문장. 다른 문장을 쓰려면 넘긴다 */
  text?: string;
  variant?: Variant;
  className?: string;
  id?: string;
}

/** 값이 이미 있을 때 쓰는 순수 표시 부품. */
export function CrowdingLabel({ level, text, variant = 'default', className = '', id }: CrowdingLabelProps) {
  const { t } = useSettings();
  return (
    <span
      id={id}
      title={t('crowdingBasisLabel')}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[0.6875rem] font-bold ${PILL_CLASS[variant]} ${className}`}
    >
      <span aria-hidden className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLASS[level]}`} />
      {text ?? nearbyHeadline(level, t)}
    </span>
  );
}

/**
 * 성지 한 곳의 인근 혼잡도를 조회해 라벨로. 조회 중·실패·데이터 없는 지역이면 아무것도 그리지 않는다 —
 * 라벨은 "말할 수 있을 때만" 말한다(더미 금지).
 */
export function NearbyCrowdingLabel({
  site,
  variant,
  className,
}: {
  site: HolySite;
  variant?: Variant;
  className?: string;
}) {
  const { data } = useNearbyCrowding(site);
  if (!data?.level) return null;
  return <CrowdingLabel level={data.level} variant={variant} className={className} id="nearby-crowding" />;
}
