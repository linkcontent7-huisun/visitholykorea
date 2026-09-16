import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Church, LocateFixed, MapPin, Phone } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { SiteListItem } from '@/features/sites/components/SiteListItem';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { useNearbyDirectory } from '@/features/sites/hooks/use-nearby-directory';
import {
  directoryDisplayAddress,
  directoryDisplayName,
  formatDistanceKm,
} from '@/features/sites/lib/nearby-directory';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { haversineKm } from '@/shared/lib/geo';
import { isRegion, regionCoords, REGIONS } from '@/shared/lib/regions';

/** 본당·공소는 성지보다 촘촘하지만, 탭으로 따로 보게 되면서(2026-09-13) 시골에서도
 *  비지 않게 반경을 30km 로 넓혔다. 거리순이라 가까운 곳이 위에 온다. */
const PARISH_RADIUS_KM = 30;
const PARISH_LIMIT = 50;

type NearbyTab = 'sites' | 'parishes';

/**
 * 「여기에서 가장 가까운 성지·성당」.
 *
 * 홈의 큰 입구를 눌러 들어오는 화면이다 (2026-09-12 사장님 요청). 들어오는 순간
 * 현재 위치를 한 번 묻고, 성지 208곳 **전부**를 가까운 순으로 늘어놓는다 — 8곳만
 * 보여주는 홈과 달리 여기서는 끝까지 스크롤할 수 있다. 「가까운 성당」 탭을 누르면
 * 같은 기준점에서 본당·공소를 가까운 순으로 보여준다 (처음엔 성지 목록 아래에 붙어
 * 있었는데, 사장님 요청으로 나란한 탭 두 개로 바꿨다 — 2026-09-13).
 *
 * 위치 권한을 거부했거나 못 받으면 출발 지역을 골라 그 중심에서 잰다. 위치는 메모리에만 둔다.
 */
export default function NearbyPage() {
  const {
    t,
    language,
    origin,
    setOrigin,
    gpsLocation,
    gpsStatus,
    requestGpsLocation,
  } = useSettings();

  // 이 화면에 들어온 것 자체가 "내 위치에서 찾아 달라"는 요청이다 — 한 번만 묻는다.
  useEffect(() => {
    if (!gpsLocation && gpsStatus === 'idle') requestGpsLocation();
  }, [gpsLocation, gpsStatus, requestGpsLocation]);

  const center = useMemo(
    () => gpsLocation ?? (origin ? regionCoords(origin) : null),
    [gpsLocation, origin],
  );

  const { data: allSitesRaw = [], isLoading } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);

  const sorted = useMemo(() => {
    if (!center) return [];
    return allSites
      .filter((s) => s.coordinates.lat != null && s.coordinates.lng != null)
      .map((site) => ({
        site,
        km: haversineKm(center.lat, center.lng, site.coordinates.lat!, site.coordinates.lng!),
      }))
      .sort((a, b) => a.km - b.km);
  }, [allSites, center]);

  const [tab, setTab] = useState<NearbyTab>('sites');

  const { data: parishes = [] } = useNearbyDirectory(
    center ?? undefined,
    PARISH_RADIUS_KM,
    PARISH_LIMIT,
  );

  const originLabel = gpsLocation
    ? t('useCurrentLocationButton')
    : origin
      ? localizeRegionName(origin, language)
      : '';

  return (
    <div className="min-h-full bg-app-bg pb-16">
      <PageContainer className="pt-6">
        <Link
          to={paths.home}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-app-text-muted"
        >
          <ArrowLeft size={16} aria-hidden />
          {t('backToHome')}
        </Link>

        <h1 className="mb-2 flex items-center gap-3 whitespace-pre-line break-keep text-[1.375rem] font-extrabold leading-tight tracking-tight text-app-text lg:text-3xl">
          <img src="/brand/map.png" alt="" aria-hidden className="h-[32px] w-auto shrink-0" />
          {t('nearbyEntryTitle')}
        </h1>

        {/* 기준점 상태 — 현재 위치인지, 지역 중심인지, 아직 못 잡았는지 */}
        <div className="mb-6 rounded-lg border border-app-border bg-white p-4">
          {gpsLocation ? (
            <p className="flex items-center gap-2 text-sm font-bold text-app-text">
              <LocateFixed size={16} className="text-brand-violet" aria-hidden />
              {fillPlaceholders(t('nearbyBasis'), { origin: originLabel })}
            </p>
          ) : gpsStatus === 'loading' ? (
            <p className="flex items-center gap-2 text-sm font-bold text-app-text-muted">
              <LocateFixed size={16} className="animate-pulse text-brand-violet" aria-hidden />
              {t('currentLocationLoading')}
            </p>
          ) : (
            <div>
              <p className="text-sm font-bold text-app-text">
                {gpsStatus === 'denied'
                  ? t('currentLocationDenied')
                  : gpsStatus === 'unsupported'
                    ? t('currentLocationUnsupported')
                    : gpsStatus === 'error'
                      ? t('currentLocationError')
                      : t('nearbyPickOrigin')}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {gpsStatus !== 'unsupported' && (
                  <button
                    type="button"
                    onClick={requestGpsLocation}
                    className="rounded-full bg-brand-blue px-4 py-2 text-xs font-bold text-white"
                  >
                    {t('useCurrentLocationButton')}
                  </button>
                )}
                <select
                  value={origin ?? ''}
                  onChange={(e) => setOrigin(isRegion(e.target.value) ? e.target.value : null)}
                  aria-label={t('originSetting')}
                  className="rounded-full border border-app-border bg-app-bg px-3 py-2 text-xs font-bold text-app-text"
                >
                  <option value="">{t('originAll')}</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {localizeRegionName(r, language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : !center ? null : (
          <>
            {/* 탭 두 개 — 성지(기본) / 성당. 하나를 고르면 그 목록만 보인다 */}
            <div role="tablist" aria-label={t('nearbyEntryTitle')} className="mb-3 flex gap-2">
              {(
                [
                  ['sites', MapPin, fillPlaceholders(t('nearbyAllTitle'), { count: sorted.length })],
                  ['parishes', Church, t('nearbyParishesTab')],
                ] as const
              ).map(([key, Icon, label]) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(key)}
                    id={`nearby-tab-${key}`}
                    className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-full border px-3 py-2.5 text-sm font-extrabold leading-snug transition-colors ${
                      key === 'sites' ? 'shrink-0' : 'flex-1'
                    } ${
                      active
                        ? 'border-brand-blue bg-brand-blue text-white'
                        : 'border-app-border bg-white text-app-text-muted'
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 ${active ? 'text-white' : 'text-brand-violet'}`} aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>

            {tab === 'sites' ? (
              <>
                <p className="mb-4 text-xs text-app-text-muted">{t('nearbyDistanceNote')}</p>
                <ul className="flex flex-col gap-3">
                  {sorted.map(({ site, km }) => (
                    <li key={site.id}>
                      <SiteListItem site={site} meta={formatDistanceKm(km)} />
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="mb-4 text-xs text-app-text-muted">
                  {fillPlaceholders(t('nearbyParishesSub'), { radius: PARISH_RADIUS_KM })}
                </p>
                {parishes.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-app-border bg-white p-6 text-center text-sm text-app-text-muted">
                    {fillPlaceholders(t('nearbyParishesEmpty'), { radius: PARISH_RADIUS_KM })}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {parishes.map((p) => (
                      <li key={p.id} className="rounded-lg border border-app-border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-bold text-app-text">
                                {directoryDisplayName(p, language)}
                              </span>
                              <span className="shrink-0 rounded-full bg-app-bg px-2 py-0.5 text-[0.625rem] font-bold text-app-text-muted">
                                {localizeDomainValue(p.category, t)}
                              </span>
                            </p>
                            {directoryDisplayAddress(p, language) && (
                              <p className="mt-0.5 truncate text-xs text-app-text-muted">
                                {directoryDisplayAddress(p, language)}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs font-bold tabular-nums text-app-text-muted">
                              {formatDistanceKm(p.distanceKm)}
                            </span>
                            {p.phone && (
                              <a
                                href={`tel:${p.phone.replace(/[^0-9+]/g, '')}`}
                                aria-label={`${p.name} ${t('callPhone')}`}
                                className="rounded-lg bg-app-bg p-2 text-brand-violet"
                              >
                                <Phone size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
}
