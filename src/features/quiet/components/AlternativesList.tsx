/**
 * 대체지 추천 카드 리스트.
 *
 * 이 컴포넌트는 레이아웃만 담고, 스타일은 사용자가 고민 중이므로 Tailwind 기본값만 쓴다.
 * 색상·여백·폰트 조정은 UI 결정 후에 한다.
 */

import type { Alternative, CrowdedOrigin } from '../api/alternatives';
import { buildAlternativeReason } from '../api/alternatives';
import { CrowdingBadge } from './CrowdingBadge';

interface AlternativesListProps {
  /** 출발점(붐비는 관광지) */
  origin: CrowdedOrigin;
  /** 추천 성지들. 빈 배열이면 "찾을 수 없음"을 표시한다. */
  picks: Alternative[];
  /** 최소 기준을 풀어서 보여주는 건지 (true면 화면에 "크게 한적하진 않습니다"라고 표기) */
  relaxed?: boolean;
}

export function AlternativesList({ origin, picks, relaxed = false }: AlternativesListProps) {
  return (
    <div className="space-y-4">
      {/* 출발점 카드 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{origin.name}</h3>
            <p className="text-sm text-gray-600">{origin.address}</p>
            <div className="flex items-center gap-2 pt-1">
              <CrowdingBadge
                level={origin.crowding.level}
                score={origin.crowding.score}
                isPartial={origin.crowding.isPartial}
              />
            </div>
          </div>
          {origin.imageUrl && (
            <img
              src={origin.imageUrl}
              alt={origin.name}
              className="size-20 rounded object-cover"
            />
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-600">대신 여기는 어떠세요</span>
        </div>
      </div>

      {/* 대체지 리스트 */}
      {picks.length > 0 ? (
        <div className="space-y-3">
          {picks.map((alt, idx) => (
            <div key={alt.site.id} className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-600 text-sm font-semibold text-white">
                      {idx + 1}
                    </span>
                    <h4 className="text-base font-semibold text-gray-900">{alt.site.name}</h4>
                  </div>

                  <p className="text-sm text-gray-700">{buildAlternativeReason(origin.name, alt)}</p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <CrowdingBadge
                      level={alt.crowding.level}
                      score={alt.crowding.score}
                      isPartial={alt.crowding.isPartial}
                    />
                    <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                      {alt.site.category}
                    </span>
                  </div>

                  {alt.site.location && (
                    <p className="text-xs text-gray-600">{alt.site.location}</p>
                  )}
                </div>

                {alt.site.imageUrl && (
                  <img
                    src={alt.site.imageUrl}
                    alt={alt.site.name}
                    className="size-20 rounded object-cover"
                  />
                )}
              </div>
            </div>
          ))}

          {relaxed && (
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              ℹ️ 반경 {Math.round(20)}km 안에서 크게 한적하지 않습니다. 그래도 출발지보다는 조용합니다.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            반경 20km 안에 대체 성지가 없습니다.
            <br />
            다른 관광지를 검색해 보세요.
          </p>
        </div>
      )}
    </div>
  );
}
