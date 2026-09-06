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

import { REGIONS, type Region } from '@/shared/lib/regions';

interface RegionFilterChipsProps {
  value: Region | null;
  onChange: (region: Region | null) => void;
  /** '전체' 문구 (언어별) */
  allLabel: string;
  /** 스크린리더가 읽을 이 줄의 이름 */
  groupLabel: string;
}

const BASE = 'shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors min-h-11';
const ON = 'border-brand-violet bg-brand-violet text-white';
const OFF = 'border-app-border bg-white text-app-text';

export function RegionFilterChips({
  value,
  onChange,
  allLabel,
  groupLabel,
}: RegionFilterChipsProps) {
  return (
    // 음수 마진으로 좌우 여백을 뚫어, 스크롤이 화면 끝까지 이어지게 한다
    <div
      className="-mx-6 overflow-x-auto px-6 pb-1"
      role="group"
      aria-label={groupLabel}
      data-testid="region-chips"
    >
      <div className="flex w-max gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={`${BASE} ${value === null ? ON : OFF}`}
        >
          {allLabel}
        </button>
        {REGIONS.map((region) => (
          <button
            key={region}
            type="button"
            onClick={() => onChange(region)}
            aria-pressed={value === region}
            className={`${BASE} ${value === region ? ON : OFF}`}
          >
            {region}
          </button>
        ))}
      </div>
    </div>
  );
}
