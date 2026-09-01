/**
 * 전국 조망 지도 — 208곳을 한 화면에.
 *
 * **외곽선을 그리지 않는다.** 성지가 전국에 퍼져 있어서 핀만으로 한반도 모양이 드러난다.
 * 손으로 그린 부정확한 국경선을 넣는 것보다 정직하고, 구글맵에서 순례자가 저장한 장소들이
 * 선처럼 읽히던 것과 같은 원리다.
 *
 * 길찾기용 지도가 아니다(그건 카카오맵 SDK, ADR 0003). 이 지도가 답하는 질문은 하나다 —
 * "내가 어디까지 왔고, 어디가 남았나."
 */

import { useMemo } from 'react';
import type { HolySite } from '@/shared/types/domain';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import type { VisitRecord } from '../lib/journey';
import { buildJourneySegments } from '../lib/journey';
import { jitterFor, MAP_ASPECT, projectToMap } from '../lib/projection';
import type { PinState } from '../lib/progress';
import { pinStateOf } from '../lib/progress';

/** 그림 좌표계. 화면 크기와 무관하게 이 안에서 계산하고 viewBox 로 늘린다. */
const VIEW = { width: 1000, height: Math.round(1000 / MAP_ASPECT) };

/** 핀이 겹칠 때 흩어 놓을 반경 */
const JITTER = 6;

const PIN_STYLE: Record<PinState, { r: number; className: string }> = {
  // 다녀온 곳 — 채워서 또렷하게
  visited: { r: 7, className: 'fill-brand-blue' },
  // 거의 다 찬 교구에 남은 곳 — 이게 눈에 띄어야 한다
  almost: { r: 8, className: 'fill-white stroke-brand-violet [stroke-width:3.5]' },
  // 아직 안 간 곳 — 흐리되 없는 것처럼 보이면 안 된다
  remaining: { r: 5, className: 'fill-none stroke-gray-300 [stroke-width:2]' },
};

interface NationalMapProps {
  sites: HolySite[];
  visits: readonly VisitRecord[];
  visitedIds: ReadonlySet<string>;
  almostIds: ReadonlySet<string>;
  selectedId: string | null;
  onSelect: (siteId: string) => void;
}

export function NationalMap({
  sites,
  visits,
  visitedIds,
  almostIds,
  selectedId,
  onSelect,
}: NationalMapProps) {
  const { t } = useSettings();
  const { pins, offMap, positions } = useMemo(() => {
    const placed: Array<{ site: HolySite; x: number; y: number; state: PinState }> = [];
    const byId = new Map<string, { x: number; y: number }>();
    let missing = 0;

    for (const site of sites) {
      const point = projectToMap(site.coordinates.lat, site.coordinates.lng, VIEW);
      if (!point) {
        missing += 1;
        continue;
      }
      const j = jitterFor(site.id, JITTER);
      const x = point.x + j.x;
      const y = point.y + j.y;
      byId.set(site.id, { x, y });
      placed.push({
        site,
        x,
        y,
        state: pinStateOf(site.id, visitedIds, almostIds),
      });
    }

    // 다녀온 곳과 강조할 곳을 뒤에 그려서 흐린 핀에 가리지 않게 한다
    const order: Record<PinState, number> = { remaining: 0, visited: 1, almost: 2 };
    placed.sort((a, b) => order[a.state] - order[b.state]);

    return { pins: placed, offMap: missing, positions: byId };
  }, [sites, visitedIds, almostIds]);

  /** 여정선 — 좌표를 아는 성지끼리만 잇는다 */
  const journey = useMemo(() => {
    return buildJourneySegments(visits).flatMap((segment) => {
      const from = positions.get(segment.fromId);
      const to = positions.get(segment.toId);
      if (!from || !to) return [];
      return [{ ...segment, from, to }];
    });
  }, [visits, positions]);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`전국 성지 지도. 표시된 ${pins.length}곳 중 ${
          pins.filter((p) => p.state === 'visited').length
        }곳을 다녀왔습니다.`}
      >
        {/* 여정선을 핀보다 먼저 그려서 핀이 선 위에 오게 한다 */}
        <g fill="none" strokeLinecap="round" className="stroke-brand-blue">
          {journey.map((seg) => (
            <line
              key={`${seg.fromId}-${seg.toId}-${seg.order}`}
              x1={seg.from.x}
              y1={seg.from.y}
              x2={seg.to.x}
              y2={seg.to.y}
              strokeWidth={3}
              strokeOpacity={seg.opacity}
            />
          ))}
        </g>

        {pins.map(({ site, x, y, state }) => {
          const style = PIN_STYLE[state];
          const isSelected = site.id === selectedId;

          return (
            <g key={site.id}>
              {isSelected && (
                <circle cx={x} cy={y} r={style.r + 8} className="fill-brand-violet/15" />
              )}
              <circle cx={x} cy={y} r={style.r} className={style.className} />
              {/* 손가락으로 누를 수 있게 실제 핀보다 넉넉한 영역을 겹쳐 둔다 */}
              <circle
                cx={x}
                cy={y}
                r={16}
                className="cursor-pointer fill-transparent"
                role="button"
                tabIndex={0}
                aria-label={`${site.name}${state === 'visited' ? ' (다녀옴)' : ''}`}
                onClick={() => onSelect(site.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(site.id);
                  }
                }}
              />
            </g>
          );
        })}
      </svg>

      {offMap > 0 && (
        <p className="mt-2 text-center text-xs text-app-text-muted">
          {fillPlaceholders(t('mapOffMap'), { n: offMap })}
        </p>
      )}
    </div>
  );
}

/** 지도 옆에 두는 범례. 색만 보고 뜻을 알 수 없으면 지도가 무용지물이다. */
export function MapLegend() {
  const { t } = useSettings();
  return (
    <ul className="flex flex-wrap items-center justify-center gap-4 text-xs text-app-text-muted">
      <li className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-full bg-brand-blue" aria-hidden />
        {t('legendVisited')}
      </li>
      <li className="flex items-center gap-1.5">
        <span
          className="inline-block size-3 rounded-full border-[3px] border-brand-violet bg-white"
          aria-hidden
        />
        {t('legendAlmost')}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-full border-2 border-gray-300" aria-hidden />
        {t('legendNotYet')}
      </li>
      <li className="flex items-center gap-1.5">
        <span
          className="inline-block h-[3px] w-6 rounded-full bg-gradient-to-r from-brand-blue/20 to-brand-blue"
          aria-hidden
        />
        {t('legendOrder')}
      </li>
    </ul>
  );
}
