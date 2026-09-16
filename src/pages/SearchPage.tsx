/**
 * 성지 찾기 — 재기획(2026-09-14) §4-1.
 *
 * 입력 하나로 성지명·영문명·교구·시도·지역명(한/영)·주소를 찾고,
 * 필터로 교구 / 행정지역(시·도) / 방문 목적 / 이동 조건을 좁힌다.
 * **교구와 행정지역은 서로 다른 개념**이라 라벨과 목록을 따로 둔다(서울대교구 ≠ 서울특별시).
 *
 * 검색은 두 갈래를 합친다.
 *   - 자체 목록(208곳, 이미 받아 둔 것)에서 즉시 매칭 — 한국어 이름·주소·교구·시도, 로마자 지역명.
 *     TourAPI 와 무관하고 네트워크가 끊겨도 캐시된 목록으로 동작한다.
 *   - 서버 검색(`searchSites`) — 번역 테이블의 영문 이름·로마자 주소까지 훑는다.
 *     한국어 화면에서 "Myeongdong" 을 쳐도 명동대성당이 나오는 이유다.
 *
 * 상태 구분: 조회 중 / 결과 없음 / 자체 데이터 없음(목록 자체를 못 받음) / 다시 시도.
 * 조회 중에는 "0곳" 을 먼저 보여주지 않는다.
 */

import { ArrowRight, Loader2, MapPin, Navigation, Phone, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { QuickDirectionsButtons } from '@/features/sites/components/QuickDirectionsButtons';
import { useLocalizedSites, useSiteSearch, useSites } from '@/features/sites/hooks/use-sites';
import { useDirectorySearch } from '@/features/sites/hooks/use-nearby-directory';
import { directoryDisplayAddress, directoryDisplayName } from '@/features/sites/lib/nearby-directory';
import { normalizeSearchText, siteMatchesQuery } from '@/features/sites/lib/site-search-match';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { dioceseLabel, localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { haversineKm } from '@/shared/lib/geo';
import { REGIONS, regionCoords, regionOfAddress, type Region } from '@/shared/lib/regions';
import { DIOCESES, EMOTION_TAGS, type EmotionTag, type HolySite } from '@/shared/types/domain';

function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { t, language, origin, gpsLocation, gpsStatus, requestGpsLocation } = useSettings();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [diocese, setDiocese] = useState<string>('');
  const [region, setRegion] = useState<Region | ''>('');
  const [purpose, setPurpose] = useState<EmotionTag | ''>('');
  const [nearestFirst, setNearestFirst] = useState(false);

  // 자체 목록 — 네트워크가 끊겨도 서비스워커 캐시(holy_sites)로 온다
  const {
    data: allSitesRaw = [],
    isLoading: sitesLoading,
    isError: sitesFailed,
    refetch: retrySites,
  } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);

  // 서버 검색 — 번역 이름·로마자 주소까지. 실패해도 자체 목록 매칭은 그대로 간다.
  const { data: serverResultsRaw = [], isFetching: serverSearching } = useSiteSearch(debouncedQuery);
  const serverResults = useLocalizedSites(serverResultsRaw);
  // 208곳 밖의 본당·공소 주소록
  const { data: directoryResults = [] } = useDirectorySearch(debouncedQuery);

  const from = gpsLocation ?? regionCoords(origin);
  const needle = normalizeSearchText(debouncedQuery.trim());
  const hasQuery = needle.length > 0;
  const hasFilter = Boolean(diocese || region || purpose);

  const results = useMemo(() => {
    if (!hasQuery && !hasFilter) return [];
    const merged = new Map<string, HolySite>();
    for (const site of allSites) {
      if (siteMatchesQuery(site, needle)) merged.set(site.id, site);
    }
    for (const site of serverResults) merged.set(site.id, site);

    let list = [...merged.values()].filter((site) => {
      if (diocese && site.region !== diocese) return false;
      if (region && regionOfAddress(site.location) !== region) return false;
      if (purpose && site.emotionTag !== purpose) return false;
      return true;
    });

    if (nearestFirst && from) {
      list = list
        .filter((s) => s.coordinates.lat != null && s.coordinates.lng != null)
        .sort(
          (a, b) =>
            haversineKm(from.lat, from.lng, a.coordinates.lat!, a.coordinates.lng!) -
            haversineKm(from.lat, from.lng, b.coordinates.lat!, b.coordinates.lng!),
        );
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }
    return list;
  }, [allSites, serverResults, needle, hasQuery, hasFilter, diocese, region, purpose, nearestFirst, from]);

  const active = hasQuery || hasFilter;
  const searching = active && (sitesLoading || (hasQuery && serverSearching && results.length === 0));

  const selectClass =
    'min-h-11 rounded-2xl border border-app-border bg-white px-3 text-sm font-bold text-app-text outline-none focus:ring-2 focus:ring-brand-violet/20';

  return (
    <div className="mx-auto flex min-h-page w-full max-w-3xl flex-col bg-white">
      {/* 검색 입력 */}
      <div className="border-b border-slate-100 px-5 pt-5 pb-4">
        <h1 className="mb-3 text-xl font-extrabold tracking-tight text-app-text">{t('searchPageTitle')}</h1>
        <div className="flex items-center gap-3 rounded-2xl border border-app-border bg-app-bg px-4">
          <Search className="shrink-0 text-slate-400" size={20} aria-hidden />
          <input
            autoFocus
            type="search"
            autoComplete="off"
            placeholder={t('searchInputPlaceholder')}
            aria-label={t('searchAria')}
            className="min-h-12 flex-1 border-none bg-transparent text-base font-bold text-slate-900 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="min-h-11 min-w-11 text-slate-400 hover:text-slate-900"
              aria-label={t('searchCloseAria')}
            >
              <X size={20} />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-app-text-muted">{t('searchPageHint')}</p>

        {/* 필터 — 교구와 행정지역은 다른 축이다 */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-bold text-app-text-muted">
            {t('searchFilterDiocese')}
            <select value={diocese} onChange={(e) => setDiocese(e.target.value)} className={selectClass}>
              <option value="">{t('categoryAll')}</option>
              {DIOCESES.map((d) => (
                <option key={d} value={d}>
                  {dioceseLabel(d, language)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-app-text-muted">
            {t('searchFilterRegion')}
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region | '')}
              className={selectClass}
            >
              <option value="">{t('categoryAll')}</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {localizeRegionName(r, language)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-app-text-muted">
            {t('searchFilterPurpose')}
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as EmotionTag | '')}
              className={selectClass}
            >
              <option value="">{t('categoryAll')}</option>
              {EMOTION_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {localizeDomainValue(tag, t)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-xs font-bold text-app-text-muted">
            {t('searchFilterTravel')}
            <button
              type="button"
              onClick={() => {
                if (!from && gpsStatus !== 'loading') requestGpsLocation();
                setNearestFirst((v) => !v);
              }}
              aria-pressed={nearestFirst}
              className={`${selectClass} flex items-center justify-center gap-1.5 ${nearestFirst ? 'border-brand-violet text-brand-violet' : ''}`}
            >
              <Navigation size={14} aria-hidden />
              {t('searchNearestFirst')}
            </button>
          </div>
        </div>
        {nearestFirst && !from && (
          <p className="mt-2 text-xs leading-relaxed text-app-text-muted" role="status">
            {gpsStatus === 'loading' ? t('currentLocationLoading') : t('searchNearestNeedsOrigin')}
          </p>
        )}
      </div>

      <div className="flex-1 bg-slate-50/30 px-5 py-6">
        {/* 자체 데이터 없음 — 목록 자체를 못 받았을 때. 외부 API 와 무관한 우리 쪽 문제다. */}
        {sitesFailed && (
          <div className="rounded-2xl border border-app-border bg-white p-6 text-center" role="alert">
            <p className="text-sm font-bold text-app-text">{t('ownDataFailedTitle')}</p>
            <p className="mt-2 text-xs text-app-text-muted">{t('ownDataFailedBody')}</p>
            <button
              type="button"
              onClick={() => void retrySites()}
              className="mt-4 min-h-11 rounded-full border border-app-border px-5 text-sm font-bold text-app-text"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {!active && !sitesFailed && (
          <div className="py-14 text-center text-slate-400">
            <Search size={40} className="mx-auto mb-4 opacity-20" aria-hidden />
            <p className="font-bold">{t('searchPromptTitle')}</p>
            <p className="mt-2 text-xs">{t('searchPromptBody')}</p>
          </div>
        )}

        {searching && (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-400" role="status">
            <Loader2 className="animate-spin" size={16} aria-hidden /> {t('searching')}
          </div>
        )}

        {active && !searching && !sitesFailed && (
          <>
            {results.length > 0 ? (
              <section className="space-y-3" aria-label={t('searchResults')}>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {fillPlaceholders(t('searchResultsCount'), { count: results.length })}
                </h2>
                <ul className="space-y-3">
                  {results.map((site) => {
                    const km =
                      from && site.coordinates.lat != null && site.coordinates.lng != null
                        ? haversineKm(from.lat, from.lng, site.coordinates.lat, site.coordinates.lng)
                        : null;
                    const addrRegion = regionOfAddress(site.location);
                    return (
                      <li key={site.id}>
                        <Link
                          to={paths.siteDetail(site.id)}
                          className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md"
                          id={`search-result-${site.id}`}
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                            <SiteThumbnail
                              imageUrl={site.imageUrl}
                              tourPhoto={site.tourPhoto}
                              name={site.name}
                              category={site.category}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-bold text-slate-900">{site.name}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {dioceseLabel(site.region, language)}
                              {addrRegion ? ` · ${localizeRegionName(addrRegion, language)}` : ''}
                              {' · '}
                              {localizeDomainValue(site.category, t)}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
                              <MapPin size={10} aria-hidden /> {site.location}
                            </p>
                            {km != null && (
                              <p className="mt-0.5 text-[0.6875rem] font-bold text-brand-blue">
                                {fillPlaceholders(t('straightLineLabel'), { distance: formatKm(km) })}
                              </p>
                            )}
                          </div>
                          {site.phone && <Phone size={14} className="shrink-0 text-slate-300" aria-hidden />}
                          <ArrowRight size={16} className="shrink-0 text-slate-300" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : (
              directoryResults.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm font-bold text-slate-800">{t('searchNoResultsTitle')}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{t('searchNoResultsBody')}</p>
                  <button
                    type="button"
                    onClick={() => navigate(paths.home)}
                    className="mt-4 min-h-11 rounded-full border border-slate-200 px-5 text-sm font-bold text-slate-700"
                  >
                    {t('homeRegionTitle')}
                  </button>
                </div>
              )
            )}

            {/* 208곳 성지에는 없지만 전국 본당·공소 주소록엔 있는 경우 */}
            {hasQuery && directoryResults.length > 0 && (
              <section className="mt-10 space-y-4">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t('directorySearchResults')}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{t('directorySearchHint')}</p>
                  {language !== 'ko' && directoryResults.some((e) => e.nameRomanized) && (
                    <p className="mt-1 text-[0.6875rem] italic text-slate-300">{t('directoryRomanizedNote')}</p>
                  )}
                </div>
                <ul className="space-y-3">
                  {directoryResults.map((entry) => {
                    const displayName = directoryDisplayName(entry, language);
                    const displayAddress = directoryDisplayAddress(entry, language);
                    return (
                      <li key={entry.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-bold text-slate-900">{displayName}</span>
                              <span className="shrink-0 rounded-full bg-slate-50 px-2 py-0.5 text-[0.625rem] font-bold text-slate-400">
                                {localizeDomainValue(entry.category, t)}
                              </span>
                            </p>
                            {displayAddress && (
                              <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400">
                                <MapPin size={10} className="shrink-0" aria-hidden /> {displayAddress}
                              </p>
                            )}
                          </div>
                          {entry.phone && (
                            <a
                              href={`tel:${entry.phone.replace(/[^0-9+]/g, '')}`}
                              aria-label={`${entry.name} ${t('callPhone')}`}
                              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-600"
                            >
                              <Phone size={14} aria-hidden />
                            </a>
                          )}
                        </div>
                        {entry.lat != null && entry.lng != null && (
                          <div className="mt-3 border-t border-slate-100 pt-3">
                            <QuickDirectionsButtons
                              destination={{ name: displayName, lat: entry.lat, lng: entry.lng }}
                              siteName={displayName}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
