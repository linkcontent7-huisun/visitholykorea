import { CalendarHeart, ChevronRight, Info, MessageSquare, Search } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { HeroCarousel, type HeroSlide } from '@/features/sites/components/HeroCarousel';
import { SiteGridCard } from '@/features/sites/components/SiteGridCard';
import { HERO_SITES } from '@/features/sites/data/hero-sites';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { haversineKm } from '@/shared/lib/geo';
import { regionCoords } from '@/shared/lib/regions';
import type { HolySite } from '@/shared/types/domain';

/**
 * 홈 — 2026-09-16 회의 · 시안(버전 8) 확정 순서.
 *
 *   1. 히어로 — 고정 5곳 사진 슬라이드. 사진이 가장 먼저 눈에 들어온다. 설명글 없음.
 *   2. 입구 2개 — 성지 찾기 · 오늘의 성지 일정. 첫 화면 안에 보인다.
 *   3. 추천 성지 (출발지·현재 위치 기준 가까운 순 — 없으면 안내만)
 *   4. 처음 방문하기 좋은 성지 (사진·연락처·좌표가 모두 확인된 곳)
 *   5. 정보의 출처와 이용 방법 · 문의
 *
 * 뺀 것(같은 회의): 「지역별 성지 찾기」 칩(시안 코멘트로 삭제 — 지역·교구 필터는 성지 찾기 화면에만),
 * 사진 위 검색창(상단바 돋보기와 「성지 찾기」 입구로 대신), 「고요 속으로」 입구, 문제 정의 문단.
 *
 * 홈에서는 TourAPI 를 부르지 않는다. 저속 통신에서도 첫 화면은 자체 성지 DB 하나로 뜬다.
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
        <h2 className="font-display text-[1.375rem] leading-tight text-app-text lg:text-2xl">{title}</h2>
        {sub && <p className="mt-1 text-sm leading-relaxed text-app-text-muted">{sub}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="flex min-h-11 shrink-0 items-center text-[0.9375rem] font-bold text-brand-blue"
        >
          {action.label}
          <ChevronRight size={16} className="ml-0.5 inline" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** 홈 입구 카드 — 「누르는 것」은 남색. 둘 중 일정 쪽을 채워 첫 화면에서 두 기능이 다르게 보이게 한다. */
function EntryCard({
  to,
  id,
  icon,
  title,
  sub,
  filled,
}: {
  to: string;
  id: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  filled?: boolean;
}) {
  return (
    <Link
      to={to}
      id={id}
      className={`flex min-h-[84px] items-center gap-3.5 rounded-lg border-[1.5px] border-brand-blue p-4 transition-transform active:scale-[0.99] lg:min-h-24 lg:px-5 ${
        filled ? 'bg-brand-blue text-white' : 'bg-white text-brand-blue'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${filled ? 'bg-white/15' : 'bg-brand-soft'}`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] font-bold leading-tight lg:text-[1.1875rem]">{title}</span>
        <span className={`mt-0.5 block text-sm leading-snug ${filled ? 'text-white/90' : 'text-app-text-muted'}`}>
          {sub}
        </span>
      </span>
      <ChevronRight size={20} className="shrink-0" aria-hidden />
    </Link>
  );
}

export default function HomePage() {
  const { origin, gpsLocation, language, t } = useSettings();

  const { data: allSitesRaw = [] } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);

  /** 히어로 5곳 — DB 행(번역 포함)이 있으면 그것을, 아직 없으면 고정표의 대체 표기를 쓴다. 사진은 항상 자체 파일. */
  const heroSlides = useMemo<HeroSlide[]>(() => {
    const byId = new Map(allSites.map((s) => [s.id, s]));
    return HERO_SITES.map((h) => {
      const site = byId.get(h.id);
      const region = localizeRegionName(site?.region ?? h.region, language);
      const category = localizeDomainValue(site?.category ?? h.category, t);
      return {
        id: h.id,
        slug: h.slug,
        name: site?.name ?? h.name,
        caption: `${region} · ${category}`,
        credit: `${h.imageSource} · ${h.imageLicense}`,
      };
    });
  }, [allSites, language, t]);

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

  const countLabel = allSites.length > 0 ? String(allSites.length) : '…';

  return (
    <div className="bg-white pb-10">
      {/* 화면 제목은 스크린리더용으로만 — 눈에는 사진이 먼저 들어와야 한다 */}
      <h1 className="sr-only">Visit Holy Korea — {t('homeProblemLine')}</h1>

      {/* 1. 히어로 — 모바일은 가장자리까지, PC 는 본문 폭 안에서 모서리 8px */}
      <div className="lg:mx-auto lg:max-w-[1200px] lg:px-8 lg:pt-6">
        <HeroCarousel slides={heroSlides} />
      </div>

      {/* 2. 입구 2개 */}
      <PageContainer className="pt-4 lg:pt-5">
        <div className="grid gap-3 lg:grid-cols-2">
          <EntryCard
            to={paths.search}
            id="entry-search"
            icon={<Search size={24} aria-hidden />}
            title={t('findShrines')}
            sub={fillPlaceholders(t('homeEntrySearchSub'), { count: countLabel })}
          />
          <EntryCard
            to={paths.compass}
            id="plan-entry"
            icon={<CalendarHeart size={24} aria-hidden />}
            title={t('compassTitle')}
            sub={t('todayPlanHeroSub')}
            filled
          />
        </div>
      </PageContainer>

      {/* 3. 추천 성지 — 출발지가 있을 때만 */}
      <PageContainer className="pt-8 lg:pt-12">
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {recommended.map((site) => (
              <SiteGridCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </PageContainer>

      {/* 4. 처음 방문하기 좋은 성지 */}
      <PageContainer className="pt-8 lg:pt-12">
        <SectionTitle title={t('homeFirstVisitTitle')} sub={t('homeFirstVisitSub')} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
          {firstVisit.length > 0
            ? firstVisit.map((site) => <SiteGridCard key={site.id} site={site} />)
            : [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-app-panel" />
              ))}
        </div>
      </PageContainer>

      {/* 5. 출처와 이용 방법 · 문의 */}
      <PageContainer className="pt-8 lg:pt-12">
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-5">
          <section className="rounded-lg border border-app-border bg-white p-5">
            <h2 className="flex items-center gap-2 text-[1.0625rem] font-bold text-app-text">
              <Info size={20} className="text-brand-blue" aria-hidden />
              {t('homeSourcesTitle')}
            </h2>
            <p className="mt-2.5 text-base leading-relaxed text-app-text-muted">{t('homeSourcesBody')}</p>
          </section>
          <section className="rounded-lg border border-app-border bg-white p-5">
            <h2 className="flex items-center gap-2 text-[1.0625rem] font-bold text-app-text">
              <MessageSquare size={20} className="text-brand-olive" aria-hidden />
              {t('homeContactTitle')}
            </h2>
            <p className="mt-2.5 text-base leading-relaxed text-app-text-muted">{t('homeContactBody')}</p>
            <Link
              to={paths.faq}
              className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-lg border-[1.5px] border-brand-blue px-5 text-base font-bold text-brand-blue"
            >
              <Search size={16} aria-hidden />
              {t('viewFaq')}
            </Link>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}
