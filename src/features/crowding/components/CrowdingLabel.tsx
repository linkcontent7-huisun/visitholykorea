import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';
import type { CrowdingLevel } from '../api/crowding-score';
import { useNearbyCrowding } from '../hooks/use-nearby-crowding';
import { districtOnlySentence, nearbyDensityHeadline, nearbyHeadline } from '../lib/crowding-text';

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
export type CrowdingLabelMode = 'nearby' | 'density';

const PILL_CLASS: Record<Variant, string> = {
  default: 'border-app-border bg-white text-app-text',
  onDark: 'border-white/20 bg-white/15 text-white backdrop-blur-md',
};

export interface CrowdingLabelProps {
  level: CrowdingLevel;
  /** 기본은 「인근 지역이 조용해요」 류 문장. 다른 문장을 쓰려면 넘긴다 */
  text?: string;
  /** 상세 페이지처럼 「주변 밀집도 하·중·상」으로 보여줄 때 사용한다. */
  labelMode?: CrowdingLabelMode;
  variant?: Variant;
  className?: string;
  id?: string;
}

/** 값이 이미 있을 때 쓰는 순수 표시 부품. */
export function CrowdingLabel({
  level,
  text,
  labelMode = 'nearby',
  variant = 'default',
  className = '',
  id,
}: CrowdingLabelProps) {
  const { t } = useSettings();
  return (
    <span
      id={id}
      title={t('crowdingBasisLabel')}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${PILL_CLASS[variant]} ${className}`}
    >
      <span
        aria-hidden
        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLASS[level]}`}
      />
      {text ??
        (labelMode === 'density' ? nearbyDensityHeadline(level, t) : nearbyHeadline(level, t))}
    </span>
  );
}

/** 등급 없는 문장용 — 같은 알약 모양이되 글자를 옅게. 색 클래스가 PILL_CLASS 와 겹치지 않게 따로 둔다. */
const MUTED_PILL_CLASS: Record<Variant, string> = {
  default: 'border-app-border bg-white text-app-text-muted',
  onDark: 'border-white/20 bg-white/15 text-white/85 backdrop-blur-md',
};

const SKELETON_CLASS: Record<Variant, string> = {
  default: 'bg-app-panel',
  onDark: 'bg-white/15',
};

/**
 * 성지 한 곳의 인근 혼잡도를 조회해 라벨로. 실패·데이터 없는 지역이면 아무것도 그리지 않는다 —
 * 라벨은 "말할 수 있을 때만" 말한다(더미 금지). 상세 페이지의 density 모드는 조회 중에
 * 빈 공간 대신 분석 상태를 알려준다.
 *
 * 조회 중에는 같은 크기의 빈 자리(스켈레톤)를 먼저 잡아 둔다(사장님 지적, 2026-09-17) —
 * 아무것도 없다가 응답이 오면 라벨이 갑자기 튀어나와 옆 태그들이 밀렸다.
 */
export function NearbyCrowdingLabel({
  site,
  labelMode = 'nearby',
  variant = 'default',
  className = '',
}: {
  site: HolySite;
  labelMode?: CrowdingLabelMode;
  variant?: Variant;
  className?: string;
}) {
  const { t } = useSettings();
  const { data, isLoading } = useNearbyCrowding(site);
  if (isLoading) {
    if (labelMode === 'density') {
      return (
        <span
          role="status"
          aria-live="polite"
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${PILL_CLASS[variant]} ${className}`}
        >
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-current opacity-70"
          />
          {t('nearbyDensityLoading')}
        </span>
      );
    }
    return (
      <span
        aria-hidden
        className={`inline-block h-[26px] w-28 animate-pulse rounded-full ${SKELETON_CLASS[variant]} ${className}`}
      />
    );
  }
  if (!data) return null;
  if (data.level) {
    return (
      <CrowdingLabel
        level={data.level}
        labelMode={labelMode}
        variant={variant}
        className={className}
        id="nearby-crowding"
      />
    );
  }
  // 성지 이름이 집중률에 없는 곳 — 인근 관광지 값은 이 성지 얘기가 아니라서 색 점·등급 없이 문장만(2026-09-21).
  // 옅은 글자로 그려 「조용」 라벨과 같은 무게로 읽히지 않게 한다.
  if (data.congestion?.kind === 'district') {
    return (
      <span
        id="nearby-crowding"
        title={t('crowdingBasisLabel')}
        className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs ${MUTED_PILL_CLASS[variant]} ${className}`}
      >
        {districtOnlySentence(data.congestion.district, data.congestion.level, t)}
      </span>
    );
  }
  return null;
}
