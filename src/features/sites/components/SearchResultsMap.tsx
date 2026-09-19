/**
 * 성지 찾기의 지도 — MapPage(전국 성지 분포 개요)의 **형식만** 빌렸다(사장님 지적, 2026-09-18).
 *
 * 「분포 개요」자체(다녀온 곳 추적·교구 진행률·여정선)는 검색과 무관해 가져오지 않았다.
 * 대신 `DioceseLayer`·`projectToMap`·`jitterFor`(`features/map/lib`)만 재사용해 —
 * 지금 검색·필터 조건에 맞는 곳은 채운 점으로, 나머지 208곳은 흐린 점으로 찍는다.
 * "이 조건에 맞는 곳이 전국 어디에 있나"에만 답한다.
 *
 * 메인 색(brand-blue)은 **실제 검색 결과를 가리킬 때만** 쓴다(사장님 지적, 2026-09-19) —
 * 검색 전 208곳을 한꺼번에 보여줄 때 전부 메인 색으로 채우면 화면이 부담스러웠다.
 * 검색 전에는 톤다운한(옅은) 색으로, 검색 후 매치 안 된 곳은 기존처럼 테두리만 남긴다.
 */

import { useMemo } from 'react';
import type { HolySite } from '@/shared/types/domain';
import { DioceseLayer } from '@/features/map/components/DioceseLayer';
import { jitterFor, MAP_ASPECT, projectToMap } from '@/features/map/lib/projection';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';

const VIEW = { width: 1000, height: Math.round(1000 / MAP_ASPECT) };
const JITTER = 6;

type PinState = 'default' | 'matched' | 'unmatched';

const PIN_STYLE: Record<PinState, { r: number; className: string }> = {
  // 검색 전 — 208곳 전체를 톤다운한 색으로. 메인 색은 실제 검색 결과에만 쓴다.
  default: { r: 5, className: 'fill-brand-blue/30' },
  // 지금 검색·조건에 맞는 곳 — 메인 색, 가장 또렷하게.
  matched: { r: 7, className: 'fill-brand-blue' },
  // 검색 중인데 맞지 않는 곳 — 테두리만.
  unmatched: { r: 4, className: 'fill-none stroke-app-border [stroke-width:2]' },
};

// 뒤에 그릴수록 위에 온다 — 매치된 점이 가장 눈에 띄어야 한다.
const DRAW_ORDER: Record<PinState, number> = { unmatched: 0, default: 1, matched: 2 };

interface SearchResultsMapProps {
  sites: HolySite[];
  matchedIds: ReadonlySet<string>;
  /** 검색어·필터가 전혀 없으면 매치 여부를 가리지 않고 모두 톤다운한 색으로 찍는다 */
  hasActiveSearch: boolean;
  selectedId: string | null;
  onSelect: (siteId: string) => void;
  highlightDiocese?: string | null;
}

export function SearchResultsMap({
  sites,
  matchedIds,
  hasActiveSearch,
  selectedId,
  onSelect,
  highlightDiocese = null,
}: SearchResultsMapProps) {
  const { t, language } = useSettings();

  const pins = useMemo(() => {
    const placed: Array<{ site: HolySite; x: number; y: number; state: PinState }> = [];

    for (const site of sites) {
      const point = projectToMap(site.coordinates.lat, site.coordinates.lng, VIEW);
      if (!point) continue;
      const j = jitterFor(site.id, JITTER);
      const state: PinState = !hasActiveSearch
        ? 'default'
        : matchedIds.has(site.id)
          ? 'matched'
          : 'unmatched';
      placed.push({ site, x: point.x + j.x, y: point.y + j.y, state });
    }

    placed.sort((a, b) => DRAW_ORDER[a.state] - DRAW_ORDER[b.state]);
    return placed;
  }, [sites, matchedIds, hasActiveSearch]);

  const matchedCount = pins.filter((p) => p.state === 'matched').length;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className="h-auto w-full"
        role="img"
        aria-label={fillPlaceholders(t('searchMapAria'), {
          total: pins.length,
          matched: hasActiveSearch ? matchedCount : pins.length,
        })}
      >
        <DioceseLayer language={language} highlight={highlightDiocese} />

        {pins.map(({ site, x, y, state }) => {
          const isSelected = site.id === selectedId;
          const style = PIN_STYLE[state];
          return (
            <g key={site.id}>
              {isSelected && <circle cx={x} cy={y} r={15} className="fill-brand-blue/15" />}
              <circle cx={x} cy={y} r={style.r} className={style.className} />
              <circle
                cx={x}
                cy={y}
                r={16}
                className="cursor-pointer fill-transparent"
                role="button"
                tabIndex={0}
                aria-label={site.name}
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
    </div>
  );
}
