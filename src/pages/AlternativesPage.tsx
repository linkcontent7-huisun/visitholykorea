/**
 * 붐빔 피하기 — "가려던 곳이 붐비면, 대신 조용한 성지를".
 *
 * 공모전 컨셉의 대안 제시 UX. 검색과 추천을 두 단계로 나눈 이유는
 * use-alternatives.ts 상단 주석에 있다 — "명동" 하나로는 장소를 특정할 수 없다.
 *
 * 1단계: 관광지 이름 검색 → TourAPI 후보 목록에서 사용자가 고른다
 * 2단계: 고른 곳의 오늘 붐빔 + 반경 20km 조용한 성지를 계산해 보여준다
 */

import { ArrowLeft, Loader2, MapPin, Search, Wind } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlternatives, useAttractionSearch } from '@/features/quiet/api/use-alternatives';
import { AlternativesList } from '@/features/quiet/components/AlternativesList';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import type { TourApiSpot } from '@/shared/api/tour-api';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';

export default function AlternativesPage() {
  const navigate = useNavigate();
  const { t, wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [selected, setSelected] = useState<TourApiSpot | null>(null);

  // 붐빔 계산에는 전체 성지 좌표가 필요하다 (홈 화면과 같은 방식)
  const { data: allSitesRaw = [] } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);

  const { data: candidates = [], isFetching: isSearching } = useAttractionSearch(
    selected ? '' : debouncedQuery,
  );
  const {
    data: result,
    isLoading: isCalculating,
    isError,
    error,
  } = useAlternatives(selected, allSites);

  const resetSelection = () => {
    setSelected(null);
  };

  return (
    <div className={`mx-auto flex min-h-screen ${widthClass} flex-col bg-app-bg`}>
      {/* 헤더 */}
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-app-border bg-white px-6">
        <button
          onClick={() => (selected ? resetSelection() : navigate(-1))}
          className="p-2 text-app-text-muted hover:text-app-text"
          aria-label={selected ? t('searchAgain') : t('back')}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-app-text">
            {t('alternativesPageTitle')}
          </h1>
          <p className="text-xs text-app-text-muted">{t('alternativesPageSubtitle')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* 1단계 — 관광지 검색 */}
        {!selected && (
          <>
            <label
              htmlFor="attraction-search"
              className="mb-2 block text-sm font-bold text-app-text"
            >
              {t('attractionSearchLabel')}
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-app-border bg-white px-5 py-3">
              <Search size={18} className="shrink-0 text-app-text-muted" />
              <input
                id="attraction-search"
                autoFocus
                type="search"
                placeholder={t('attractionSearchPlaceholder')}
                aria-label={t('attractionSearchAriaLabel')}
                className="flex-1 border-none bg-transparent text-base font-medium text-app-text focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 size={18} className="animate-spin text-app-text-muted" aria-hidden />
              )}
            </div>

            {/* 후보 목록 — 동명이지가 많아 사용자가 직접 고른다 */}
            {candidates.length > 0 && (
              <ul className="mt-4 space-y-2" aria-label={t('attractionCandidatesAriaLabel')}>
                {candidates.map((spot) => (
                  <li key={spot.contentid}>
                    <button
                      onClick={() => setSelected(spot)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-app-border bg-white px-5 py-4 text-left hover:border-brand-violet"
                    >
                      <MapPin size={16} className="shrink-0 text-app-text-muted" />
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-app-text">{spot.title}</span>
                        <span className="block text-xs text-app-text-muted">{spot.addr1}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {debouncedQuery.trim().length >= 2 && !isSearching && candidates.length === 0 && (
              <p className="mt-6 text-center text-sm text-app-text-muted">
                {fillPlaceholders(t('noAttractionFound'), { query: debouncedQuery })}
              </p>
            )}

            {query.length === 0 && (
              <div className="mt-16 text-center">
                <Wind size={32} className="mx-auto mb-4 text-gray-300" aria-hidden />
                <p className="text-sm leading-relaxed text-app-text-muted">
                  {t('attractionSearchEmptyHint')}
                </p>
              </div>
            )}
          </>
        )}

        {/* 2단계 — 붐빔 + 대체 성지 */}
        {selected && (
          <>
            {isCalculating && (
              <div className="space-y-3" role="status" aria-live="polite">
                <p className="text-sm font-medium text-app-text-muted">
                  {fillPlaceholders(t('calculatingCrowding'), { title: selected.title })}
                </p>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-[20px] bg-white" />
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-[20px] border border-app-border bg-white p-6 text-center">
                <p className="text-sm font-bold text-app-text">{t('crowdingCalcError')}</p>
                <p className="mt-2 text-xs leading-relaxed text-app-text-muted">
                  {t('crowdingCalcErrorBody')}
                </p>
                {error instanceof Error && (
                  <p className="mt-3 text-xs text-app-text-muted opacity-60">{error.message}</p>
                )}
              </div>
            )}

            {result && (
              <>
                <AlternativesList
                  origin={result.origin}
                  picks={result.picks}
                  relaxed={result.relaxed}
                />
                {/* 추정임을 숨기지 않는다 — 컨셉 문서 7장. 숨기면 발표에서 무너진다. */}
                <p className="mt-6 text-center text-xs leading-relaxed text-app-text-muted">
                  {t('crowdingEstimateNote')}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
