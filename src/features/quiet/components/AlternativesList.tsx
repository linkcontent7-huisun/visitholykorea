/**
 * 대체지 추천 카드 리스트.
 *
 * 스타일은 홈 화면(TodayQuietSection)과 같은 앱 토큰을 쓴다 — 출발점(붐비는 곳)은
 * 흰 카드, 대체 성지는 보라 포인트로 눈이 먼저 가게 한다.
 */

import type { Alternative, CrowdedOrigin } from '../api/alternatives';
import { ALTERNATIVE, buildAlternativeReason } from '../api/alternatives';
import { CrowdingBadge } from './CrowdingBadge';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeDomainValue } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';

interface AlternativesListProps {
  /** 출발점(붐비는 관광지) */
  origin: CrowdedOrigin;
  /** 추천 성지들. 빈 배열이면 "찾을 수 없음"을 표시한다. */
  picks: Alternative[];
  /** 최소 기준을 풀어서 보여주는 건지 (true면 화면에 "크게 한적하진 않습니다"라고 표기) */
  relaxed?: boolean;
}

export function AlternativesList({ origin, picks, relaxed = false }: AlternativesListProps) {
  const { t, language } = useSettings();
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
            {t('alternativesInsteadLabel')}
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
                    {buildAlternativeReason(origin.name, alt, language)}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <CrowdingBadge
                      level={alt.crowding.level}
                      score={alt.crowding.score}
                      isPartial={alt.crowding.isPartial}
                    />
                    <span className="inline-flex items-center rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs font-medium text-app-text-muted">
                      {localizeDomainValue(alt.site.category, t)}
                    </span>
                  </div>

                  {alt.site.location && (
                    <p className="text-xs text-app-text-muted">{alt.site.location}</p>
                  )}
                </div>

                {/* 사진 없는 성지도 빈칸이 아니라 임시 이미지로 (SiteThumbnail 이 처리) */}
                <SiteThumbnail
                  imageUrl={alt.site.imageUrl}
                  name={alt.site.name}
                  category={alt.site.category}
                  className="size-20 shrink-0 rounded-xl object-cover"
                />
              </div>
            </div>
          ))}

          {relaxed && (
            <p className="rounded-[20px] border border-app-border bg-white p-4 text-sm text-app-text-muted">
              ℹ️{' '}
              {fillPlaceholders(t('alternativesRelaxedNote'), {
                radius: ALTERNATIVE.searchRadiusKm,
              })}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-app-border bg-white p-8 text-center">
          <p className="text-sm leading-relaxed text-app-text-muted">
            {fillPlaceholders(t('alternativesEmptyBody'), { radius: ALTERNATIVE.searchRadiusKm })}
            <br />
            {t('alternativesEmptyHint')}
          </p>
        </div>
      )}
    </div>
  );
}
