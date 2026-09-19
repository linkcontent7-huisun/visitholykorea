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
 *
 * "지금 고른 곳" 하나만 가리킬 때는 **보색**(brand-accent, 주황)을 쓴다(같은 날 지적) —
 * 매치된 점도 전부 남색이라, 그중 하나를 고른 표시가 옅은 남색 후광만으로는 잘 안 보였다.
 *
 * 본당·공소(208곳 밖 주소록)도 검색 결과에 있으면 작은 사각형으로 같이 찍는다(같은 날 질문에 대한
 * 답 — 목록에 뜨는데 지도엔 안 보이면 "이 결과는 어디 있지" 를 다시 물어야 했다). 색만으로
 * 성지·본당을 가르지 않도록 모양도 다르게 한다(원 vs 사각형) — 5,918건 전체가 아니라 지금
 * 검색으로 좁혀진 것(보통 8건 이하)만 찍으므로 지도가 붐비지 않는다. 이 사각형은 처음부터
 * 누를 수 없다 — 본당·공소는 상세 화면이 없어 눌러도 갈 곳이 없다.
 *
 * 성지(원) 핀도 `onSelect` 를 안 넘기면 눌리지 않는다(2026-09-19) — 지도 핀을 누르면 왼쪽
 * 목록이 그 줄로 스크롤되는 게 유일한 효과인데(선택 정보 카드는 옆 목록과 중복이라 삭제했다),
 * 그 목록이 아예 없는 모바일 소형 지도에서는 눌러도 점 색만 바뀔 뿐 아무 일도 안 일어나는
 * "먹통 누름"이었다 — `SearchPage.tsx` 가 데스크톱(`wideView`)에서만 `onSelect` 를 넘긴다.
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

export interface DirectoryMapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface SearchResultsMapProps {
  sites: HolySite[];
  matchedIds: ReadonlySet<string>;
  /** 검색어·필터가 전혀 없으면 매치 여부를 가리지 않고 모두 톤다운한 색으로 찍는다 */
  hasActiveSearch: boolean;
  selectedId: string | null;
  /** 넘기지 않으면 핀이 눌리지 않는다 — 목록과 짝지어 스크롤할 화면(데스크톱)에서만 넘긴다 */
  onSelect?: (siteId: string) => void;
  highlightDiocese?: string | null;
  /** 208곳 밖 본당·공소 — 지금 검색으로 좁혀진 것만 넘긴다(전체 5,918건이 아니다) */
  directoryPoints?: readonly DirectoryMapPoint[];
}

export function SearchResultsMap({
  sites,
  matchedIds,
  hasActiveSearch,
  selectedId,
  onSelect,
  highlightDiocese = null,
  directoryPoints = [],
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

  const directoryPins = useMemo(() => {
    return directoryPoints.flatMap((p) => {
      const point = projectToMap(p.lat, p.lng, VIEW);
      if (!point) return [];
      const j = jitterFor(p.id, JITTER);
      return [{ point: p, x: point.x + j.x, y: point.y + j.y }];
    });
  }, [directoryPoints]);

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

        {/* 본당·공소 — 성지(원)와 모양부터 다른 작은 사각형, 올리브색 */}
        {directoryPins.map(({ point, x, y }) => (
          <rect
            key={point.id}
            x={x - 3.5}
            y={y - 3.5}
            width={7}
            height={7}
            className="fill-brand-olive/70"
            aria-hidden
          />
        ))}

        {pins.map(({ site, x, y, state }) => {
          const isSelected = site.id === selectedId;
          const style = PIN_STYLE[state];
          return (
            <g key={site.id}>
              {isSelected && <circle cx={x} cy={y} r={15} className="fill-brand-accent/20" />}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 8 : style.r}
                className={isSelected ? 'fill-brand-accent' : style.className}
              />
              {onSelect && (
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
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
