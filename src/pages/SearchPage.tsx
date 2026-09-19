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
 *
 * ## 데스크톱 분할 화면 (2026-09-18)
 * "전국 성지 분포 개요"(MapPage) 자체는 사장님 판단으로 쓸모가 없어졌지만(다녀온 곳 추적은
 * 검색과 무관), **왼쪽 목록 + 오른쪽 지도로 갈라지는 형식**은 검색에도 그대로 값어치가 있다 —
 * 필터를 좁히면서 "이 조건에 맞는 곳이 전국 어디 있나"를 바로 보는 것. MapPage 와 같은 이유로
 * (`lg:flex` 452px 목록 패널 + 나머지 지도) 모바일은 위아래로 그대로 흐르고, 지도는 작은 요약으로만
 * 검색 결과가 있을 때 목록 위에 끼워 넣는다 — 검색창을 지도보다 먼저 두는 순서는 바꾸지 않았다.
 */

import { ChevronRight, Loader2, Navigation, Search, SearchX, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { SearchResultsMap } from '@/features/sites/components/SearchResultsMap';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { Button } from '@/shared/components/ui/Button';
import { chipClass } from '@/shared/components/ui/class-names';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useLocalizedSites, useSiteSearch, useSites } from '@/features/sites/hooks/use-sites';
import { useDirectorySearch } from '@/features/sites/hooks/use-nearby-directory';
import type { DirectoryEntry } from '@/features/sites/api/directory.repository';
import { normalizeSearchText, siteMatchesQuery } from '@/features/sites/lib/site-search-match';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { dioceseLabel, localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { haversineKm } from '@/shared/lib/geo';
import { regionCoords, regionOfAddress } from '@/shared/lib/regions';
import type { HolySite } from '@/shared/types/domain';

/**
 * "내 위치로 검색" 반경. 사장님이 5km 를 제안했지만 판단은 맡겼다 — 208곳은 5,918건
 * 본당·공소와 달리 전국에 성기게 퍼져 있어(평균 밀도로는 5km 안에 아무것도 없는 곳이 더 많다),
 * `NearbyPage` 의 본당 반경(30km)보다도 넓게 잡았다.
 */
const NEARBY_RADIUS_KM = 50;

function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/**
 * 검색 결과 한 줄 — 208곳 성지든 본당·공소 주소록이든 같은 모양으로 그린다(사장님 지적,
 * 2026-09-19: "성지와 성당/공소의 결과 표시가 다르다. 성지 결과 표시로 통일하라"). 주소 앞
 * 핀 아이콘과 전화 아이콘은 뺐다 — 같은 지적으로 삭제했다. 본당·공소는 상세 화면이 없어
 * `to` 없이(누를 수 없는 정보 줄로만) 그린다.
 */
function ResultRow({
  to,
  id,
  imageUrl,
  category,
  name,
  subtitle,
  address,
  distanceLabel,
  active,
  rowRef,
  onMouseEnter,
}: {
  to?: string;
  id?: string;
  imageUrl?: string | null;
  category?: string | null;
  name: string;
  subtitle: string;
  address?: string | null;
  distanceLabel?: string | null;
  active?: boolean;
  rowRef?: (el: HTMLLIElement | null) => void;
  onMouseEnter?: () => void;
}) {
  const cls = `flex w-full items-center gap-4 rounded-lg border bg-white p-4 text-left transition-colors ${
    to ? 'hover:border-brand-blue' : ''
  } ${active ? 'border-brand-blue ring-1 ring-brand-blue/20' : 'border-app-border'}`;

  const inner = (
    <>
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-app-panel">
        <SiteThumbnail
          imageUrl={imageUrl ?? null}
          name={name}
          category={category}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-app-text">{name}</p>
        <p className="mt-0.5 truncate text-sm text-app-text-muted">{subtitle}</p>
        {address && <p className="mt-0.5 truncate text-sm text-app-text-muted">{address}</p>}
        {distanceLabel && (
          <p className="mt-0.5 text-sm font-bold text-brand-blue">{distanceLabel}</p>
        )}
      </div>
      {to && <ChevronRight size={20} className="shrink-0 text-app-text-muted" aria-hidden />}
    </>
  );

  return (
    <li ref={rowRef} onMouseEnter={onMouseEnter}>
      {to ? (
        <Link to={to} className={cls} id={id}>
          {inner}
        </Link>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </li>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const {
    t,
    language,
    origin,
    gpsLocation,
    gpsStatus,
    requestGpsLocation,
    clearGpsLocation,
    wideView,
  } = useSettings();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 자체 목록 — 네트워크가 끊겨도 서비스워커 캐시(holy_sites)로 온다
  const {
    data: allSitesRaw = [],
    isLoading: sitesLoading,
    isError: sitesFailed,
    refetch: retrySites,
  } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);

  // 서버 검색 — 번역 이름·로마자 주소까지. 실패해도 자체 목록 매칭은 그대로 간다.
  const { data: serverResultsRaw = [], isFetching: serverSearching } =
    useSiteSearch(debouncedQuery);
  const serverResults = useLocalizedSites(serverResultsRaw);
  // 208곳 밖의 본당·공소 주소록
  const { data: directoryResults = [] } = useDirectorySearch(debouncedQuery);

  const from = gpsLocation ?? regionCoords(origin);
  const needle = normalizeSearchText(debouncedQuery.trim());
  const hasQuery = needle.length > 0;
  // "내 위치로 검색" — 출발지 추정(origin)이 아니라 실제 GPS 권한을 받았을 때만 켠다.
  const nearMeActive = Boolean(gpsLocation);

  const results = useMemo(() => {
    if (!hasQuery && !nearMeActive) return [];
    let list: HolySite[];
    if (hasQuery) {
      const merged = new Map<string, HolySite>();
      for (const site of allSites) {
        if (siteMatchesQuery(site, needle)) merged.set(site.id, site);
      }
      for (const site of serverResults) merged.set(site.id, site);
      list = [...merged.values()];
    } else {
      list = allSites;
    }

    if (nearMeActive && gpsLocation) {
      list = list
        .filter((s) => s.coordinates.lat != null && s.coordinates.lng != null)
        .filter(
          (s) =>
            haversineKm(gpsLocation.lat, gpsLocation.lng, s.coordinates.lat!, s.coordinates.lng!) <=
            NEARBY_RADIUS_KM,
        )
        .sort(
          (a, b) =>
            haversineKm(gpsLocation.lat, gpsLocation.lng, a.coordinates.lat!, a.coordinates.lng!) -
            haversineKm(gpsLocation.lat, gpsLocation.lng, b.coordinates.lat!, b.coordinates.lng!),
        );
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }
    return list;
  }, [allSites, serverResults, needle, hasQuery, nearMeActive, gpsLocation]);

  const active = hasQuery || nearMeActive;
  const searching =
    active && (sitesLoading || (hasQuery && serverSearching && results.length === 0));

  const matchedIds = useMemo(() => new Set(results.map((site) => site.id)), [results]);
  const selectedSite = useMemo(
    () => allSites.find((site) => site.id === selectedId) ?? null,
    [allSites, selectedId],
  );

  /**
   * 지도에서 핀을 누르면 왼쪽 목록에서도 그 성지가 보이도록 목록만 스크롤한다(MapPage 와 같은 패턴).
   *
   * 행이 **이미 화면에 보일 때는 스크롤하지 않는다** — 처음엔 선택될 때마다 무조건 가운데로
   * 맞췄더니, 목록에 마우스를 올려 핀을 맞춰 보다가 커서를 아래로 내리면(각 줄의 `onMouseEnter`
   * 가 계속 selectedId 를 바꾼다) 그때마다 스크롤이 다시 가운데로 튀어 스크롤 자체가 불가능했다
   * (사장님 지적, 2026-09-19). 지도 핀 클릭처럼 목록 밖에서 고를 때만 실제로 스크롤이 필요하다.
   */
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  useEffect(() => {
    if (!wideView || !selectedId) return;
    const list = listRef.current;
    const row = rowRefs.current[selectedId];
    if (!list || !row) return;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.clientHeight;
    const viewTop = list.scrollTop;
    const viewBottom = viewTop + list.clientHeight;
    if (rowTop >= viewTop && rowBottom <= viewBottom) return;
    list.scrollTop = rowTop - list.clientHeight / 2 + row.clientHeight / 2;
  }, [selectedId, wideView]);

  const mapNode = (
    <SearchResultsMap
      sites={allSites}
      matchedIds={matchedIds}
      hasActiveSearch={active}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );

  return (
    <div className="bg-app-bg lg:flex lg:h-[calc(100dvh-72px)] lg:overflow-hidden">
      {/* ── 왼쪽(데스크톱) / 위아래 흐름(모바일) ───────────────────────── */}
      <div
        ref={listRef}
        className="relative lg:w-[452px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-app-border lg:bg-white"
      >
        <PageContainer width="narrow" className="flex min-h-page flex-col pb-16 lg:min-h-0">
          {/* 검색 입력 */}
          <div className="border-b border-app-border pb-5">
            <PageHeader title={t('searchPageTitle')} className="pb-4" />
            <div className="flex items-center gap-3 rounded-lg border-[1.5px] border-app-border bg-white px-4 focus-within:border-brand-blue">
              <Search className="shrink-0 text-app-text-muted" size={22} aria-hidden />
              <input
                type="search"
                name="q"
                autoComplete="off"
                enterKeyHint="search"
                placeholder={t('searchInputPlaceholder')}
                aria-label={t('searchAria')}
                className="min-h-14 min-w-0 flex-1 border-none bg-transparent text-lg font-bold text-app-text focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-text-muted hover:bg-app-bg hover:text-app-text"
                  aria-label={t('searchCloseAria')}
                >
                  <X size={22} aria-hidden />
                </button>
              )}
            </div>

            {/* 내 위치로 검색 — 위치 권한을 받아 반경 안 성지를 가까운 순으로 보여준다(사장님 지적, 2026-09-19) */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => (gpsLocation ? clearGpsLocation() : requestGpsLocation())}
                aria-pressed={nearMeActive}
                className={chipClass(nearMeActive, 'min-h-12 px-4')}
              >
                <Navigation size={16} aria-hidden />
                {nearMeActive ? t('clearCurrentLocationButton') : t('searchNearMeButton')}
              </button>
              {gpsStatus === 'loading' && (
                <span className="text-sm text-app-text-muted">{t('currentLocationLoading')}</span>
              )}
              {gpsStatus === 'denied' && (
                <span className="text-sm text-app-text-muted">{t('currentLocationDenied')}</span>
              )}
              {gpsStatus === 'unsupported' && (
                <span className="text-sm text-app-text-muted">
                  {t('currentLocationUnsupported')}
                </span>
              )}
              {gpsStatus === 'error' && (
                <span className="text-sm text-app-text-muted">{t('currentLocationError')}</span>
              )}
              {nearMeActive && (
                <span className="text-sm text-app-text-muted">
                  {fillPlaceholders(t('searchNearMeRadius'), { radius: NEARBY_RADIUS_KM })}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col py-6">
            {/* 자체 데이터 없음 — 목록 자체를 못 받았을 때. 외부 API 와 무관한 우리 쪽 문제다. */}
            {sitesFailed && (
              <div className="rounded-lg border border-app-border bg-white">
                <EmptyState
                  compact
                  role="alert"
                  title={t('ownDataFailedTitle')}
                  description={t('ownDataFailedBody')}
                  action={
                    <Button variant="neutral" onClick={() => void retrySites()}>
                      {t('retry')}
                    </Button>
                  }
                />
              </div>
            )}

            {!active && !sitesFailed && (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState
                  icon={Search}
                  title={t('searchPromptTitle')}
                  description={t('searchPromptBody')}
                />
              </div>
            )}

            {searching && (
              <div
                className="flex items-center justify-center gap-2 py-8 text-base text-app-text-muted"
                role="status"
              >
                <Loader2 className="animate-spin" size={18} aria-hidden /> {t('searching')}
              </div>
            )}

            {active && !searching && !sitesFailed && (
              <>
                {/* 지도 — 모바일에서는 결과가 있을 때만 목록 위에 작게, 데스크톱은 오른쪽 큰 패널에 따로 있다 */}
                {!wideView && matchedIds.size > 0 && (
                  <div className="mb-6 rounded-lg border border-app-border bg-white p-4">
                    {mapNode}
                  </div>
                )}

                {results.length > 0 ? (
                  <section className="space-y-3" aria-label={t('searchResults')}>
                    <h2 className="text-sm font-bold text-app-text-muted">
                      {fillPlaceholders(t('searchResultsCount'), { count: results.length })}
                    </h2>
                    <ul className="space-y-3">
                      {results.map((site) => {
                        const km =
                          from && site.coordinates.lat != null && site.coordinates.lng != null
                            ? haversineKm(
                                from.lat,
                                from.lng,
                                site.coordinates.lat,
                                site.coordinates.lng,
                              )
                            : null;
                        const addrRegion = regionOfAddress(site.location);
                        return (
                          <ResultRow
                            key={site.id}
                            id={`search-result-${site.id}`}
                            to={paths.siteDetail(site.id)}
                            imageUrl={site.imageUrl}
                            category={site.category}
                            name={site.name}
                            subtitle={`${dioceseLabel(site.region, language)}${
                              addrRegion ? ` · ${localizeRegionName(addrRegion, language)}` : ''
                            } · ${localizeDomainValue(site.category, t)}`}
                            address={site.location}
                            distanceLabel={
                              km != null
                                ? fillPlaceholders(t('straightLineLabel'), {
                                    distance: formatKm(km),
                                  })
                                : null
                            }
                            active={site.id === selectedId}
                            rowRef={(el) => {
                              rowRefs.current[site.id] = el;
                            }}
                            onMouseEnter={() => wideView && setSelectedId(site.id)}
                          />
                        );
                      })}
                    </ul>
                  </section>
                ) : (
                  directoryResults.length === 0 && (
                    <div className="rounded-lg border border-dashed border-app-border bg-white">
                      <EmptyState
                        compact
                        role="status"
                        icon={SearchX}
                        title={t('searchNoResultsTitle')}
                        description={t('searchNoResultsBody')}
                        action={
                          <Button variant="neutral" onClick={() => navigate(paths.home)}>
                            {t('homeRegionTitle')}
                          </Button>
                        }
                      />
                    </div>
                  )
                )}

                {/* 208곳 성지에는 없지만 전국 본당·공소 주소록엔 있는 경우 — 성지 결과와 같은 줄 모양(사장님 지적, 2026-09-19) */}
                {hasQuery && directoryResults.length > 0 && (
                  <section className="mt-10 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-app-text-muted">
                        {t('directorySearchResults')}
                      </h2>
                      {language !== 'ko' && directoryResults.some((e) => e.nameRomanized) && (
                        <p className="mt-1 text-sm italic text-app-text-muted">
                          {t('directoryRomanizedNote')}
                        </p>
                      )}
                    </div>
                    <ul className="space-y-3">
                      {directoryResults.map((entry: DirectoryEntry) => (
                        <ResultRow
                          key={entry.id}
                          category={entry.category}
                          name={entry.name}
                          // catholic_directory.diocese 는 holy_sites.region 과 달리 이미 "OO교구" 형태로
                          // 저장돼 있다(예: "인천교구") — dioceseLabel() 을 또 부르면 "인천교구교구"가 된다.
                          subtitle={`${entry.diocese ? `${entry.diocese} · ` : ''}${localizeDomainValue(entry.category, t)}`}
                          address={entry.address}
                        />
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>
        </PageContainer>
      </div>

      {/* ── 오른쪽(데스크톱 전용) 지도 ─────────────────────────────────── */}
      {wideView && (
        <div className="relative hidden flex-1 items-center justify-center bg-app-bg p-10 lg:flex">
          <div className="w-full max-w-[620px]">{mapNode}</div>

          {selectedSite && (
            <div className="absolute bottom-6 right-8 w-[320px] rounded-lg border border-brand-blue/40 bg-white p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-app-panel">
                <SiteThumbnail
                  imageUrl={selectedSite.imageUrl}
                  name={selectedSite.name}
                  category={selectedSite.category}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="mt-3 block text-sm font-bold text-brand-blue">
                {dioceseLabel(selectedSite.region, language)} ·{' '}
                {localizeDomainValue(selectedSite.category, t)}
              </span>
              <h2 className="mt-0.5 text-lg font-bold text-app-text">{selectedSite.name}</h2>
              <p className="mt-1 text-sm text-app-text-muted">{selectedSite.location}</p>
              <Link
                to={paths.siteDetail(selectedSite.id)}
                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-blue text-base font-bold text-white transition-colors hover:bg-brand-blue/90"
                id={`search-map-detail-${selectedSite.id}`}
              >
                {t('viewSiteDetail')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
