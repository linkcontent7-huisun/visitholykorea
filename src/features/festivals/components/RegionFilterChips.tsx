/**
 * 시·도 칩 줄.
 *
 * 한국관광공사 「디지털 관광주민증」의 '지역을 고르면 그 지역 것이 쏟아진다' 장치를
 * 우리 방식으로 옮긴 것이다. 다만 우리가 쏟아내는 것은 쿠폰이 아니라
 * "지금 거기서 갈 만한 성지"라는 정보다.
 *
 * 17개를 한 줄에 다 넣을 수는 없어서 가로 스크롤로 둔다 — 접어 두면 고령 이용자가
 * 접힌 것을 못 찾는다. 세로로 쌓으면 축제 카드가 화면 아래로 밀린다.
 */

import { localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { chipClass } from '@/shared/components/ui/class-names';
import { ScrollHintRow } from '@/shared/components/ui/ScrollHintRow';
import { REGIONS, type Region } from '@/shared/lib/regions';

interface RegionFilterChipsProps {
  value: Region | null;
  onChange: (region: Region | null) => void;
  /** '전체' 문구 (언어별) */
  allLabel: string;
  /** 스크린리더가 읽을 이 줄의 이름 */
  groupLabel: string;
}

export function RegionFilterChips({
  value,
  onChange,
  allLabel,
  groupLabel,
}: RegionFilterChipsProps) {
  const { language } = useSettings();
  return (
    // 음수 마진으로 좌우 여백을 뚫어, 스크롤이 화면 끝까지 이어지게 한다.
    // 오른쪽 끝 그라디언트 + 화살표로 더 있다는 걸 알려준다(2026-09-19 — 잘린 칩 하나만으로는
    // 스크롤 가능함을 못 알아채는 경우가 있었다).
    <ScrollHintRow
      className="-mx-4 px-4 pb-1 lg:-mx-6 lg:px-6"
      fadeFrom="from-app-bg"
      role="group"
      aria-label={groupLabel}
      data-testid="region-chips"
    >
      <div className="flex w-max gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={chipClass(value === null)}
        >
          {allLabel}
        </button>
        {REGIONS.map((region) => (
          <button
            key={region}
            type="button"
            onClick={() => onChange(region)}
            aria-pressed={value === region}
            className={chipClass(value === region)}
          >
            {localizeRegionName(region, language)}
          </button>
        ))}
      </div>
    </ScrollHintRow>
  );
}
