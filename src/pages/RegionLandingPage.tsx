import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Church, MapPin } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { SUBMISSION_MODE } from '@/shared/lib/feature-flags';
import { ButtonLink } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { chipClass } from '@/shared/components/ui/class-names';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { DirectoryEntryCard } from '@/features/sites/components/DirectoryEntryCard';
import { SiteListItem } from '@/features/sites/components/SiteListItem';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { useNearbyDirectory } from '@/features/sites/hooks/use-nearby-directory';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeRegionName } from '@/shared/i18n/domain-labels';
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
      <PageContainer width="narrow" className="min-h-page pb-16">
        <PageHeader
          back={paths.home}
          title={t('regionNotFoundTitle')}
          sub={t('regionNotFoundBody')}
        />
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <Link key={r} to={paths.region(r)} className={chipClass(false)}>
              {localizeRegionName(r, language)}
            </Link>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader
        back={{ to: paths.home, label: t('backToHome') }}
        title={
          <>
            {fillPlaceholders(t('regionHeroTitle'), { region: regionLabel })}
            <br />
            {fillPlaceholders(t('regionHeroTitleLine2'), { region: regionLabel })}
          </>
        }
        sub={fillPlaceholders(t('regionHeroSubtitle'), { region: regionLabel, radius: RADIUS_KM })}
      />

      <div>
        {isLoading && <LoadingSpinner label={t('loadingSites')} />}

        {!isLoading && (
          <>
            <Card className="mb-6 flex items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-blue"
                aria-hidden
              >
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-app-text">
                  {fillPlaceholders(t('siteCountUnit'), { count: nearby.length })}
                </p>
                <p className="text-sm text-app-text-muted">
                  {fillPlaceholders(t('regionSiteCountLabel'), {
                    region: regionLabel,
                    radius: RADIUS_KM,
                    total: allSites.length,
                  })}
                </p>
              </div>
            </Card>

            {nearby.length === 0 ? (
              <Card tone="dashed" padded={false}>
                <EmptyState
                  compact
                  role="status"
                  title={fillPlaceholders(t('regionEmptyBody'), {
                    region: regionLabel,
                    radius: RADIUS_KM,
                  })}
                  description={t('regionEmptyHint')}
                />
              </Card>
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

            <p className="mt-6 text-sm leading-relaxed text-app-text-muted">
              {fillPlaceholders(t('regionDistanceDisclaimer'), { region: regionLabel })}
            </p>

            {nearbyParishes.length > 0 && (
              <section className="mt-10">
                <SectionHeading
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Church size={22} className="text-brand-blue" aria-hidden />
                      {t('regionParishesTitle')}
                    </span>
                  }
                  sub={
                    <>
                      {t('regionParishesBody')}
                      {language !== 'ko' && nearbyParishes.some((p) => p.nameRomanized) && (
                        <span className="mt-1 block italic">{t('directoryRomanizedNote')}</span>
                      )}
                    </>
                  }
                />
                <ul className="flex flex-col gap-3">
                  {nearbyParishes.map((p) => (
                    <li key={p.id}>
                      {/* 외국인 순례자가 직접 찾아갈 수 있게 — 개별 홈페이지 대신 실제 길찾기로 연결한다 */}
                      <DirectoryEntryCard entry={p} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <ButtonLink to={paths.home} block>
                {fillPlaceholders(t('regionStartHere'), { region: regionLabel })}
              </ButtonLink>
              {!SUBMISSION_MODE && (
                <ButtonLink to={paths.map} variant="neutral" block>
                  {t('viewNationalMap')}
                </ButtonLink>
              )}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
