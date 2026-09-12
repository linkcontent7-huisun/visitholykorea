import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Church, MapPin, Phone } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { QuickDirectionsButtons } from '@/features/sites/components/QuickDirectionsButtons';
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

/** 이 반경 안이면 "그 도시에서 다녀올 수 있는 거리"로 본다. */
const RADIUS_KM = 45;

/** 본당·공소는 밀집 지역에서 수백 곳이 나올 수 있어 가까운 순으로 캡을 둔다. */
const DIRECTORY_LIMIT = 30;

/**
 * 시·도 랜딩 — `/region/대전` 처럼 지역 이름을 붙여 들어오는 화면.
 *
 * **왜 만들었나** — 지자체·지역 관광기관에 서비스를 소개할 때 건네줄 링크가 필요했다.
 * 다만 한 지역만 특별대우하면 전국 서비스의 구조가 망가지고, 다른 지역 심사에서는
 * 오히려 감점이 된다. 그래서 **17개 시·도 전부에 같은 방식으로 작동하는 한 화면**으로
 * 만들고, 대전에 건네는 링크는 그중 하나가 되게 했다.
 *
 * **지어낸 내용이 없다.** 화면에 나오는 것은 DB 의 성지 정보와, 시·도 중심 좌표에서
 * 계산한 직선거리뿐이다. 없는 순례 코스를 만들어 넣지 않는다.
 */
export default function RegionLandingPage() {
  const navigate = useNavigate();
  const { region: raw } = useParams<{ region: string }>();
  const { origin, setOrigin, t, language } = useSettings();
  const region = isRegion(raw) ? raw : null;
  const centerCoords = regionCoords(region);
  const regionLabel = region ? localizeRegionName(region, language) : '';

  const { data: allSitesRaw = [], isLoading } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);
  // 성지로 등록되진 않았지만 이 지역에서 실제로 다닐 수 있는 본당·공소도 보여준다
  // (2026-09-07 요청 — "지역별 정보 안에 그 지역 성당들이 전부 등록되도록").
  const { data: nearbyParishes = [] } = useNearbyDirectory(
    centerCoords ?? undefined,
    RADIUS_KM,
    DIRECTORY_LIMIT,
  );

  // 이 링크로 들어온 사람은 그 지역에서 출발한다고 보는 게 자연스럽다.
  // 앱 전체(홈·퀴즈)가 같은 출발지를 쓰므로, 여기서 한 번 맞춰두면 이후 화면이 이어진다.
  useEffect(() => {
    if (region && origin !== region) setOrigin(region);
  }, [region, origin, setOrigin]);

  const nearby = useMemo(() => {
    const from = regionCoords(region);
    if (!from) return [];
    return allSites
      .filter((s) => s.coordinates.lat != null && s.coordinates.lng != null)
      .map((s) => ({
        site: s,
        km: haversineKm(from.lat, from.lng, s.coordinates.lat!, s.coordinates.lng!),
      }))
      .filter((x) => x.km <= RADIUS_KM)
      .sort((a, b) => a.km - b.km);
  }, [allSites, region]);

  if (!region) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-white p-8">
        <h1 className="mb-3 text-2xl font-extrabold text-app-text">{t('regionNotFoundTitle')}</h1>
        <p className="mb-6 text-sm font-medium text-app-text-muted">{t('regionNotFoundBody')}</p>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <Link
              key={r}
              to={paths.region(r)}
              className="rounded-full border border-app-border bg-app-bg px-4 py-2 text-sm font-bold text-app-text"
            >
              {localizeRegionName(r, language)}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white pb-16">
      <header className="p-8 pb-4">
        <button
          onClick={() => navigate(paths.home)}
          className="mb-6 flex items-center gap-1 text-sm font-bold text-app-text-muted"
          aria-label={t('backToHome')}
        >
          <ArrowLeft size={18} /> {t('backToHome')}
        </button>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-violet">
          Visit Holy Korea
        </p>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-app-text">
          {fillPlaceholders(t('regionHeroTitle'), { region: regionLabel })}
          <br />
          {fillPlaceholders(t('regionHeroTitleLine2'), { region: regionLabel })}
        </h1>
        <p className="text-sm font-medium leading-relaxed text-app-text-muted">
          {fillPlaceholders(t('regionHeroSubtitle'), { region: regionLabel, radius: RADIUS_KM })}
        </p>
      </header>

      <div className="px-8 py-4">
        {isLoading && <LoadingSpinner label={t('loadingSites')} />}

        {!isLoading && (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-[20px] bg-app-bg p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-violet/10 text-brand-violet">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-app-text">
                  {fillPlaceholders(t('siteCountUnit'), { count: nearby.length })}
                </p>
                <p className="text-[12px] font-medium text-app-text-muted">
                  {fillPlaceholders(t('regionSiteCountLabel'), {
                    region: regionLabel,
                    radius: RADIUS_KM,
                    total: allSites.length,
                  })}
                </p>
              </div>
            </div>

            {nearby.length === 0 ? (
              <p className="rounded-[20px] bg-app-bg p-6 text-center text-sm font-medium text-app-text-muted">
                {fillPlaceholders(t('regionEmptyBody'), { region: regionLabel, radius: RADIUS_KM })}
                <br />
                {t('regionEmptyHint')}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {nearby.map(({ site, km }) => (
                  <li key={site.id}>
                    {/* 거리는 카드 안 meta 줄로 — 오른쪽 위 절대 배치는 긴 영어 이름과 겹쳤다 (9/12) */}
                    <SiteListItem
                      site={site}
                      meta={`${km < 10 ? km.toFixed(1) : Math.round(km)}km`}
                    />
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-6 text-[11px] leading-relaxed text-app-text-muted opacity-70">
              {fillPlaceholders(t('regionDistanceDisclaimer'), { region: regionLabel })}
            </p>

            {nearbyParishes.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-app-text">
                  <Church size={18} className="text-brand-violet" aria-hidden />
                  {t('regionParishesTitle')}
                </h2>
                <p className="mb-1 text-xs leading-relaxed text-app-text-muted">
                  {t('regionParishesBody')}
                </p>
                {language !== 'ko' && nearbyParishes.some((p) => p.nameRomanized) && (
                  <p className="mb-4 text-[11px] italic text-app-text-muted opacity-70">
                    {t('directoryRomanizedNote')}
                  </p>
                )}
                <ul className="mt-4 flex flex-col gap-3">
                  {nearbyParishes.map((p) => {
                    const displayName = directoryDisplayName(p, language);
                    const displayAddress = directoryDisplayAddress(p, language);
                    return (
                    <li
                      key={p.id}
                      className="rounded-[20px] border border-app-border bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-bold text-app-text">{displayName}</span>
                            <span className="shrink-0 rounded-full bg-app-bg px-2 py-0.5 text-[10px] font-bold text-app-text-muted">
                              {localizeDomainValue(p.category, t)}
                            </span>
                          </p>
                          {displayAddress && (
                            <p className="mt-0.5 truncate text-xs text-app-text-muted">{displayAddress}</p>
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
                              className="rounded-xl bg-app-bg p-2 text-brand-violet"
                            >
                              <Phone size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                      {/* 외국인 순례자가 직접 찾아갈 수 있게 — 개별 홈페이지 대신 실제 길찾기로 연결한다 */}
                      <div className="mt-3 border-t border-app-border pt-3">
                        <QuickDirectionsButtons
                          destination={{ name: displayName, lat: p.lat, lng: p.lng }}
                          siteName={displayName}
                        />
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <Link
                to={paths.home}
                className="rounded-[20px] bg-brand-violet px-6 py-4 text-center text-sm font-bold text-white"
              >
                {fillPlaceholders(t('regionStartHere'), { region: regionLabel })}
              </Link>
              <Link
                to={paths.map}
                className="rounded-[20px] border border-app-border px-6 py-4 text-center text-sm font-bold text-app-text"
              >
                {t('viewNationalMap')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
