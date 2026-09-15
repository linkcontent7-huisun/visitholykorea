import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeCrowdingLevel } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import type { CrowdingLevel, MeasuredSpot } from '../api/crowding-score';

/**
 * 예상 붐빔 등급 표시.
 *
 * 색은 신호등 순서를 따른다 — 고령 이용자가 많은 서비스라 새로운 색 규칙을 배우게 하지 않는다.
 * 대신 채도를 낮춰 성지의 분위기를 해치지 않게 했다.
 * 색만으로 뜻이 전달되지 않도록 등급 이름을 항상 함께 쓴다(색각 이상 대응).
 *
 * 배지 안에서 값의 성격을 밝힌다 — "예상"인지, 관광공사 집중률이 섞였는지, 주변 정보를
 * 못 받아 확인이 부족한지. 숫자를 확정값처럼 보이게 하지 않는다.
 */
const LEVEL_STYLE: Record<CrowdingLevel, string> = {
  '아주 조용': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  조용: 'bg-teal-50 text-teal-800 border-teal-200',
  보통: 'bg-amber-50 text-amber-800 border-amber-200',
  붐빔: 'bg-orange-50 text-orange-800 border-orange-200',
  '매우 붐빔': 'bg-rose-50 text-rose-800 border-rose-200',
};

const UNVERIFIED_STYLE = 'bg-gray-50 text-gray-600 border-gray-200';

interface CrowdingBadgeProps {
  level: CrowdingLevel;
  score: number;
  /** 주변 정보를 못 받아 축제 압력만으로 낸 값인지 — 이때는 등급을 확정처럼 보여주지 않는다 */
  isPartial?: boolean;
  source?: 'measured' | 'estimated';
  measuredSpot?: MeasuredSpot;
}

export function CrowdingBadge({
  level,
  score,
  isPartial = false,
  source = 'estimated',
  measuredSpot,
}: CrowdingBadgeProps) {
  const { t } = useSettings();

  if (isPartial) {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[0.6875rem] font-bold ${UNVERIFIED_STYLE}`}
      >
        {t('partialLabel')}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[0.6875rem] font-bold ${LEVEL_STYLE[level]}`}
      title={t('crowdingBasisLabel')}
    >
      {localizeCrowdingLevel(level, t)}
      <span className="font-medium opacity-60">{Math.round(score)}</span>
      {source === 'measured' && measuredSpot ? (
        <span className="font-medium opacity-70">
          ·{' '}
          {fillPlaceholders(t('crowdingMeasuredTag'), {
            rate: Math.round(measuredSpot.rate),
            name: measuredSpot.name,
          })}
        </span>
      ) : (
        <span className="font-medium opacity-60">· {t('crowdingEstimatedTag')}</span>
      )}
    </span>
  );
}
