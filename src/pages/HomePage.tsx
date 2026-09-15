import { CalendarHeart, ChevronRight, Info, MessageSquare, Search } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { SiteGridCard } from '@/features/sites/components/SiteGridCard';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { haversineKm } from '@/shared/lib/geo';
import { REGIONS, regionCoords } from '@/shared/lib/regions';
import type { HolySite } from '@/shared/types/domain';

/**
 * 홈 — 재기획(2026-09-14) §4-1 순서를 그대로 따른다.
 *
 *   1. 서비스가 해결하는 문제 한 문장
 *   2. 고요 속으로 진입
 *   3. 지역별 성지 찾기 (행정구역 17개)
 *   4. 추천 성지 (출발지·현재 위치 기준 가까운 순 — 없으면 안내만)
 *   5. 처음 방문하기 좋은 성지 (사진·연락처·좌표가 모두 확인된 곳)
 *   6. 정보의 출처와 이용 방법
 *   7. 문의와 정보 수정 제안
 *
 * 홈에서는 TourAPI 를 부르지 않는다. 예전 「오늘의 쉼표」는 홈 로드마다 7회를 불러
 * 일일 한도를 갉아먹었고, 「고요 속으로」와 같은 기능이 두 이름으로 보였다.
 * 저속 통신에서도 첫 화면은 자체 성지 DB 하나로 뜬다.
 */

/** 처음 방문에 권할 조건 — 실제로 찾아가서 연락할 수 있는 정보가 다 있는 곳. 임의 큐레이션이 아니다. */
function isFirstVisitReady(site: HolySite): boolean {
  return Boolean(
    site.imageUrl && site.phone && site.coordinates.lat != null && site.coordinates.lng != null,
  );
}

function SectionTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold tracking-tight text-app-text lg:text-2xl">{title}</h2>
        {sub && <p className="mt-1 text-sm leading-relaxed text-app-text-muted">{sub}</p>}
      </div>
      {action && (
        <Link to={action.to} className="shrink-0 text-sm font-bold text-brand-violet">
          {action.label}
          <ChevronRight size={14} className="ml-0.5 inline" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const { origin, gpsLocation, language, t } = useSettings();

  const { data: allSitesRaw = [] } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);

  /** 출발지(또는 현재 위치)가 있을 때만 "가까운 순" 추천을 만든다. 없으면 지어내지 않는다. */
  const from = gpsLocation ?? regionCoords(origin);
  const recommended = useMemo(() => {
    if (!from || allSites.length === 0) return [];
    return [...allSites]
      .filter((s) => s.coordinates.lat != null && s.coordinates.lng != null)
      .map((s) => ({
        site: s,
        km: haversineKm(from.lat, from.lng, s.coordinates.lat!, s.coordinates.lng!),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 8)
      .map((x) => x.site);
  }, [from, allSites]);

  /** 사진·연락처·좌표가 모두 있는 성지 중 이름순 4곳. 날짜로 돌리지 않는다 — 심사·시연 때 매번 같아야 한다. */
  const firstVisit = useMemo(
    () =>
      [...allSites]
        .filter(isFirstVisitReady)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        .slice(0, 4),
    [allSites],
  );

  const originLabel = gpsLocation
    ? t('useCurrentLocationButton')
    : origin
      ? localizeRegionName(origin, language)
      : null;

  return (
    <div className="bg-app-bg pb-10">
      {/* 1. 문제 정의 */}
      <section className="bg-white">
        <PageContainer className="py-8 lg:py-12">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[.2em] text-brand-violet">
            Visit Holy Korea
          </p>
          <h1 className="mt-3 max-w-3xl text-2xl font-extrabold leading-snug tracking-tight text-app-text lg:text-4xl">
            {t('homeProblemLine')}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-app-text-muted lg:text-base">
            {allSites.length > 0
              ? fillPlaceholders(t('homeDefinition'), { count: allSites.length })
              : fillPlaceholders(t('homeDefinition'), { count: '…' })}
          </p>
        </PageContainer>
      </section>

      {/* 2. 오늘의 성지 일정 진입 — 고요 속으로 자리를 이어받음 (2026-09-15) */}
      <PageContainer className="pt-6">
        <Link
          to={paths.compass}
          id="plan-entry"
          className="flex items-center gap-4 rounded-[28px] bg-gradient-to-br from-brand-blue to-brand-violet p-5 text-white shadow-lg shadow-brand-violet/20 transition-transform active:scale-[0.99] lg:p-7"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white">
            <CalendarHeart size={26} className="text-brand-blue" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl font-bold leading-tight lg:text-2xl">
              {t('todayPlanHeroTitle')}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-white/85">
              {t('todayPlanHeroSub')}
            </span>
          </span>
          <ChevronRight size={22} className="shrink-0 opacity-80" aria-hidden />
        </Link>
      </PageContainer>

      {/* 3. 지역별 성지 찾기 — 행정구역. 교구는 성지 찾기에서(둘은 다른 개념) */}
      <PageContainer className="pt-10">
        <SectionTitle
          title={t('homeRegionTitle')}
          sub={t('homeRegionSub')}
          action={{ to: paths.search, label: t('findShrines') }}
        />
        <ul className="flex flex-wrap gap-2" aria-label={t('homeRegionTitle')}>
          {REGIONS.map((region) => (
            <li key={region}>
              <Link
                to={paths.region(region)}
                className="inline-flex min-h-11 items-center rounded-full border border-app-border bg-white px-4 text-sm font-bold text-app-text hover:border-brand-violet"
                id={`region-${region}`}
              >
                {localizeRegionName(region, language)}
              </Link>
            </li>
          ))}
        </ul>
      </PageContainer>

      {/* 4. 추천 성지 — 출발지가 있을 때만 */}
      <PageContainer className="pt-10">
        <SectionTitle
          title={t('homeRecommendedTitle')}
          sub={
            originLabel
              ? fillPlaceholders(t('homeRecommendedSub'), { origin: originLabel })
              : t('homeRecommendedSubNoOrigin')
          }
          action={originLabel ? { to: paths.nearby, label: t('seeAll') } : { to: paths.menu, label: t('moreTab') }}
        />
        {recommended.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {recommended.map((site) => (
              <SiteGridCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </PageContainer>

      {/* 5. 처음 방문하기 좋은 성지 */}
      <PageContainer className="pt-10">
        <SectionTitle title={t('homeFirstVisitTitle')} sub={t('homeFirstVisitSub')} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {firstVisit.length > 0
            ? firstVisit.map((site) => <SiteGridCard key={site.id} site={site} />)
            : [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square animate-pulse rounded-[20px] bg-gray-100" />
              ))}
        </div>
      </PageContainer>

      {/* 6. 출처와 이용 방법 · 7. 문의 */}
      <PageContainer className="pt-10">
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[24px] border border-app-border bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-app-text">
              <Info size={18} className="text-brand-blue" aria-hidden />
              {t('homeSourcesTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-app-text-muted">{t('homeSourcesBody')}</p>
          </section>
          <section className="rounded-[24px] border border-app-border bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-app-text">
              <MessageSquare size={18} className="text-brand-violet" aria-hidden />
              {t('homeContactTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-app-text-muted">{t('homeContactBody')}</p>
            <Link
              to={paths.faq}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-app-border px-5 text-sm font-bold text-app-text"
            >
              <Search size={14} aria-hidden />
              {t('viewFaq')}
            </Link>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}
