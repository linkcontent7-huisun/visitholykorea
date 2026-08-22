/**
 * 대체지 추천 카드 리스트.
 *
 * 스타일은 홈 화면(TodayQuietSection)과 같은 앱 토큰을 쓴다 — 출발점(붐비는 곳)은
 * 흰 카드, 대체 성지는 보라 포인트로 눈이 먼저 가게 한다.
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
      <div className="rounded-[20px] border border-app-border bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-extrabold tracking-tight text-app-text">{origin.name}</h3>
            <p className="text-sm text-app-text-muted">{origin.address}</p>
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
              className="size-20 rounded-xl object-cover"
            />
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-app-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-app-bg px-3 text-sm font-bold text-brand-violet">
            대신 여기는 어떠세요
          </span>
        </div>
      </div>

      {/* 대체지 리스트 */}
      {picks.length > 0 ? (
        <div className="space-y-3">
          {picks.map((alt, idx) => (
            <div
              key={alt.site.id}
              className="rounded-[20px] border border-brand-violet/20 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-violet text-sm font-semibold text-white">
                      {idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-app-text">{alt.site.name}</h4>
                  </div>

                  <p className="text-sm leading-relaxed text-app-text-muted">
                    {buildAlternativeReason(origin.name, alt)}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <CrowdingBadge
                      level={alt.crowding.level}
                      score={alt.crowding.score}
                      isPartial={alt.crowding.isPartial}
                    />
                    <span className="inline-flex items-center rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs font-medium text-app-text-muted">
                      {alt.site.category}
                    </span>
                  </div>

                  {alt.site.location && (
                    <p className="text-xs text-app-text-muted">{alt.site.location}</p>
                  )}
                </div>

                {alt.site.imageUrl && (
                  <img
                    src={alt.site.imageUrl}
                    alt={alt.site.name}
                    className="size-20 rounded-xl object-cover"
                  />
                )}
              </div>
            </div>
          ))}

          {relaxed && (
            <p className="rounded-[20px] border border-app-border bg-white p-4 text-sm text-app-text-muted">
              ℹ️ 반경 {Math.round(20)}km 안에서 크게 한적하지 않습니다. 그래도 출발지보다는
              조용합니다.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-app-border bg-white p-8 text-center">
          <p className="text-sm leading-relaxed text-app-text-muted">
            반경 20km 안에 대체 성지가 없습니다.
            <br />
            다른 관광지를 검색해 보세요.
          </p>
        </div>
      )}
    </div>
  );
}
