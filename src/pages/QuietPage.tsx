/**
 * 고요 속으로 — 공모전 대표 기능(지정과제: 유명 관광지 쏠림·오버투어리즘 완화).
 *
 * 흐름 (재기획 2026-09-14 §4)
 *   1. 방문 예정인 관광지 또는 지역을 검색한다 (TourAPI searchKeyword2 — 실시간 호출)
 *   2. 관광데이터로 예상한 붐빔 정도를 참고 정보로 보여준다
 *   3. 주변(직선 20km)의 비교적 한적한 성지를 대안으로 제시한다
 *   4. 추천 근거·직선거리·이동 부담·데이터의 한계를 함께 보여준다
 *   5. 성지 상세로 이어져 방문 정보와 외부 지도를 연다
 *   6. 원래 장소가 이미 한적하면 이동을 권하지 않는다
 *   7. 대안이 없거나 데이터가 부족하면 추천하지 않는다
 *
 * 검색과 추천을 두 단계로 나눈 이유는 use-alternatives.ts 상단 — "명동" 하나로는 장소를
 * 특정할 수 없다. 예전 「붐빔 피하기」(/alternatives)와 홈 「오늘의 쉼표」를 이 화면 하나로 합쳤다.
 */

import { ArrowLeft, Loader2, MapPin, Search, Wind } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlternatives, useAttractionSearch } from '@/features/quiet/api/use-alternatives';
import { AlternativesList } from '@/features/quiet/components/AlternativesList';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { classifyTourError, type TourApiSpot } from '@/shared/api/tour-api';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';

/** 외부 API 실패를 종류별로 다른 문장으로 — "고장"과 "오늘 한도"와 "잠시 후"는 다른 안내다. */
function externalErrorKey(error: unknown): TranslationKey {
  switch (classifyTourError(error)) {
    case 'quota':
      return 'externalApiQuota';
    case 'rate_limited':
      return 'externalApiRateLimited';
    case 'not_configured':
      return 'externalApiNotConfigured';
    default:
      return 'externalApiFailedBody';
  }
}

export default function QuietPage() {
  const navigate = useNavigate();
  const { t } = useSettings();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [selected, setSelected] = useState<TourApiSpot | null>(null);

  // 붐빔 계산에는 전체 성지 좌표가 필요하다 (자체 DB — TourAPI 가 죽어도 이건 온다)
  const { data: allSitesRaw = [] } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);

  const {
    data: candidates = [],
    isFetching: isSearching,
    isError: searchFailed,
    error: searchError,
    refetch: retrySearch,
  } = useAttractionSearch(selected ? '' : debouncedQuery);
  const {
    data: result,
    isLoading: isCalculating,
    isError,
    error,
    refetch,
  } = useAlternatives(selected, allSites);

  const searching = debouncedQuery.trim().length >= 2;

  return (
    <PageContainer className="min-h-page pb-10">
      {/* 헤더 */}
      <div className="flex min-h-20 items-center gap-3 border-b border-app-border py-3">
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="min-h-11 min-w-11 p-2 text-app-text-muted hover:text-app-text"
            aria-label={t('searchAgain')}
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-app-text">
            <img src="/brand/dove.png" alt="" aria-hidden width={28} height={28} className="h-7 w-auto" />
            {t('quietHeroTitle')}
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">{t('quietPageSubtitle')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl py-6">
        {/* 1단계 — 관광지·지역 검색 */}
        {!selected && (
          <section aria-labelledby="quiet-step-search">
            <label
              id="quiet-step-search"
              htmlFor="attraction-search"
              className="mb-2 block text-sm font-bold text-app-text"
            >
              {t('quietStepSearch')}
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-app-border bg-white px-5 py-3">
              <Search size={18} className="shrink-0 text-app-text-muted" aria-hidden />
              <input
                id="attraction-search"
                type="search"
                autoComplete="off"
                placeholder={t('attractionSearchPlaceholder')}
                aria-label={t('attractionSearchAriaLabel')}
                className="min-h-11 flex-1 border-none bg-transparent text-base font-medium text-app-text focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 size={18} className="animate-spin text-app-text-muted" aria-hidden />
              )}
            </div>

            {/* 조회 중에는 "결과 없음"을 먼저 보여주지 않는다 */}
            {searching && isSearching && candidates.length === 0 && (
              <p className="mt-6 text-center text-sm text-app-text-muted" role="status">
                {t('searching')}
              </p>
            )}

            {searchFailed && (
              <div
                className="mt-6 rounded-[20px] border border-app-border bg-white p-6 text-center"
                role="alert"
              >
                <p className="text-sm font-bold text-app-text">{t('externalApiFailedTitle')}</p>
                <p className="mt-2 text-xs leading-relaxed text-app-text-muted">
                  {t(externalErrorKey(searchError))}
                </p>
                <button
                  type="button"
                  onClick={() => void retrySearch()}
                  className="mt-4 min-h-11 rounded-full border border-app-border px-5 text-sm font-bold text-app-text"
                >
                  {t('retry')}
                </button>
              </div>
            )}

            {/* 후보 목록 — 동명이지가 많아 사용자가 직접 고른다 */}
            {candidates.length > 0 && (
              <ul className="mt-4 space-y-2" aria-label={t('attractionCandidatesAriaLabel')}>
                {candidates.map((spot) => (
                  <li key={spot.contentid}>
                    <button
                      onClick={() => setSelected(spot)}
                      className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-app-border bg-white px-5 py-4 text-left hover:border-brand-violet"
                    >
                      <MapPin size={16} className="shrink-0 text-app-text-muted" aria-hidden />
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-app-text">{spot.title}</span>
                        <span className="block text-xs text-app-text-muted">{spot.addr1}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {searching && !isSearching && !searchFailed && candidates.length === 0 && (
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
          </section>
        )}

        {/* 2단계 — 예상 붐빔 + 대안 성지 */}
        {selected && (
          <section aria-labelledby="quiet-step-result">
            <h2 id="quiet-step-result" className="mb-3 text-sm font-bold text-app-text">
              {t('quietStepResult')}
            </h2>

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
              <div
                className="rounded-[20px] border border-app-border bg-white p-6 text-center"
                role="alert"
              >
                <p className="text-sm font-bold text-app-text">{t('externalApiFailedTitle')}</p>
                <p className="mt-2 text-xs leading-relaxed text-app-text-muted">
                  {t(externalErrorKey(error))}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="min-h-11 rounded-full border border-app-border px-5 text-sm font-bold text-app-text"
                  >
                    {t('retry')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/search')}
                    className="min-h-11 rounded-full bg-brand-blue px-5 text-sm font-bold text-white"
                  >
                    {t('findShrines')}
                  </button>
                </div>
              </div>
            )}

            {result && (
              <>
                <AlternativesList result={result} onRetry={() => void refetch()} />
                {/* 추정임을 숨기지 않는다 — 숨기면 발표에서 무너진다. */}
                <p className="mt-6 text-center text-xs leading-relaxed text-app-text-muted">
                  {t('crowdingEstimateNote')}
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </PageContainer>
  );
}
