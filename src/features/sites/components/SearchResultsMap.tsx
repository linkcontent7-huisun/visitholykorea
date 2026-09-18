/**
 * 성지 찾기의 지도 — MapPage(전국 성지 분포 개요)의 **형식만** 빌렸다(사장님 지적, 2026-09-18).
 *
 * 「분포 개요」자체(다녀온 곳 추적·교구 진행률·여정선)는 검색과 무관해 가져오지 않았다.
 * 대신 `DioceseLayer`·`projectToMap`·`jitterFor`(`features/map/lib`)만 재사용해 —
 * 지금 검색·필터 조건에 맞는 곳은 채운 점으로, 나머지 208곳은 흐린 점으로 찍는다.
 * "이 조건에 맞는 곳이 전국 어디에 있나"에만 답한다.
 */

import { useMemo } from 'react';
import type { HolySite } from '@/shared/types/domain';
import { DioceseLayer } from '@/features/map/components/DioceseLayer';
import { jitterFor, MAP_ASPECT, projectToMap } from '@/features/map/lib/projection';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';

const VIEW = { width: 1000, height: Math.round(1000 / MAP_ASPECT) };
const JITTER = 6;

interface SearchResultsMapProps {
  sites: HolySite[];
  matchedIds: ReadonlySet<string>;
  /** 검색어·필터가 전혀 없으면 매치 여부를 가리지 않고 모두 같은 톤으로 찍는다 */
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

  const { pins, offMap } = useMemo(() => {
    const placed: Array<{ site: HolySite; x: number; y: number; matched: boolean }> = [];
    let missing = 0;

    for (const site of sites) {
      const point = projectToMap(site.coordinates.lat, site.coordinates.lng, VIEW);
      if (!point) {
        missing += 1;
        continue;
      }
      const j = jitterFor(site.id, JITTER);
      placed.push({
        site,
        x: point.x + j.x,
        y: point.y + j.y,
        matched: !hasActiveSearch || matchedIds.has(site.id),
      });
    }

    // 매치된 점을 나중에 그려서 흐린 점에 가리지 않게 한다
    placed.sort((a, b) => Number(a.matched) - Number(b.matched));
    return { pins: placed, offMap: missing };
  }, [sites, matchedIds, hasActiveSearch]);

  const matchedCount = pins.filter((p) => p.matched).length;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className="h-auto w-full"
        role="img"
        aria-label={fillPlaceholders(t('searchMapAria'), {
          total: pins.length,
          matched: matchedCount,
        })}
      >
        <DioceseLayer language={language} highlight={highlightDiocese} />

        {pins.map(({ site, x, y, matched }) => {
          const isSelected = site.id === selectedId;
          return (
            <g key={site.id}>
              {isSelected && <circle cx={x} cy={y} r={15} className="fill-brand-blue/15" />}
              <circle
                cx={x}
                cy={y}
                r={matched ? 7 : 4}
                className={
                  matched ? 'fill-brand-blue' : 'fill-none stroke-app-border [stroke-width:2]'
                }
              />
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

      {offMap > 0 && (
        <p className="mt-2 text-center text-xs text-app-text-muted">
          {fillPlaceholders(t('mapOffMap'), { n: offMap })}
        </p>
      )}
    </div>
  );
}
