import { CalendarHeart, ChevronRight, Footprints, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { AiGuideSheet } from '@/features/ai-guide/components/AiGuideSheet';
import { useSession } from '@/features/auth/hooks/use-session';
import {
  usePilgrimageRoutes,
  useLocalizedRoutes,
} from '@/features/routes/hooks/use-pilgrimage-routes';
import { homeRotationDay, selectDailyRotation, sortByDistance } from '@/features/sites/lib/nearest';
import { HeroCarousel, type HeroSlide } from '@/features/sites/components/HeroCarousel';
import { SiteGridCard } from '@/features/sites/components/SiteGridCard';
import { HERO_SITES } from '@/features/sites/data/hero-sites';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { ScrollHintRow } from '@/shared/components/ui/ScrollHintRow';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { OFFICIAL_LINKS } from '@/shared/config/official-links';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';

/**
 * 홈 — 2026-09-16 회의 · 시안(버전 8) 확정 순서, 이후 9/17~9/18 사장님 지시로 여러 번 다듬었다.
 *
 *   1. 히어로 — 고정 5곳 사진 슬라이드, 100vw. 사진이 가장 먼저 눈에 들어온다. 설명글 없음.
 *   2. 입구 3개 — 성지 찾기 · 미카엘 순례 가이드 · 오늘의 성지 일정(2026-09-18, 미카엘 추가). 첫 화면 안에 보인다.
 *   3. 오늘 방문하기 좋은 성지 (사진·연락처·좌표가 모두 확인된 곳)
 *   4. 푸터 — 이용약관·개인정보·FAQ 링크만(2026-09-18). 「정보 출처·문의」 팝업은 없앴다 —
 *      내용이 이미 FAQ·이용약관에 있었다.
 *
 * 뺀 것(같은 회의): 「지역별 성지 찾기」 칩(시안 코멘트로 삭제 — 지역·교구 필터는 성지 찾기 화면에만),
 * 사진 위 검색창(상단바 돋보기와 「성지 찾기」 입구로 대신), 「고요 속으로」 입구, 문제 정의 문단.
 * 「추천 성지」(출발지 기준 가까운 순)는 2026-09-17 오전 지시로 본문에서 푸터 링크 하나로 줄였다가,
 * 같은 날 오후 지시로 그 링크마저 뺐다 — `/nearby` 는 지금 앱 안 어디에서도 안 이어진다.
 *
 * 홈에서는 TourAPI 를 부르지 않는다. 저속 통신에서도 첫 화면은 자체 성지 DB 하나로 뜬다.
 */

/** 처음 방문에 권할 조건 — 실제로 찾아가서 연락할 수 있는 정보가 다 있는 곳. 임의 큐레이션이 아니다. */
function isFirstVisitReady(site: HolySite): boolean {
  return Boolean(
    site.imageUrl && site.phone && site.coordinates.lat != null && site.coordinates.lng != null,
  );
}

/** 홈 입구 카드 — 「누르는 것」은 남색. 둘 중 일정 쪽을 채워 첫 화면에서 두 기능이 다르게 보이게 한다. */
function EntryCard({
  to,
  onClick,
  id,
  icon,
  title,
  sub,
  filled,
}: {
  /** 둘 중 하나만 준다 — 화면 이동은 `to`, 시트 열기 같은 그 자리 동작은 `onClick`(2026-09-18, 미카엘 카드) */
  to?: string;
  onClick?: () => void;
  id: string;
  icon: React.ReactNode;
  title: string;
  sub?: string;
  filled?: boolean;
}) {
  const className = `flex min-h-[68px] w-full items-center gap-3 rounded-lg border-[1.5px] border-brand-blue p-3 text-left transition-transform active:scale-[0.99] lg:min-h-[76px] lg:px-4 lg:py-3.5 ${
    filled ? 'bg-brand-blue text-white' : 'bg-white text-brand-blue'
  }`;
  const inner = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${filled ? 'bg-white/15' : 'bg-brand-soft'}`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] font-bold leading-tight lg:text-[1.1875rem]">
          {title}
        </span>
        {sub && (
          <span
            className={`mt-0 block text-xs leading-snug ${filled ? 'text-white/90' : 'text-app-text-muted'}`}
          >
            {sub}
          </span>
        )}
      </span>
      <ChevronRight size={20} className="shrink-0" aria-hidden />
    </>
  );
  if (to) {
    return (
      <Link to={to} id={id} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} id={id} className={className}>
      {inner}
    </button>
  );
}

export default function HomePage() {
  const { language, t, gpsLocation } = useSettings();
  const { session } = useSession();
  const [aiOpen, setAiOpen] = useState(false);

  const { data: allSitesRaw = [] } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);
  const { data: routesRaw = [] } = usePilgrimageRoutes();
  const routes = useLocalizedRoutes(routesRaw);

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
        objectPosition: h.objectPosition,
      };
    });
  }, [allSites, language, t]);

  /** 원문 이름순을 순위로 삼아 언어를 바꿔도 같은 날짜에는 같은 성지가 보이게 한다. */
  const readySites = useMemo(
    () =>
      [...allSitesRaw].filter(isFirstVisitReady).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [allSitesRaw],
  );

  /**
   * 비로그인·위치 미허용 사용자는 한국 날짜별 순환, 로그인·위치 허용 사용자는 가까운 순이다.
   * 위치 권한을 홈 진입 때 새로 요청하지 않는 것은 기존 T-011 정책을 따른다.
   */
  const firstVisit = useMemo(() => {
    const ranked =
      session && gpsLocation
        ? sortByDistance(readySites, gpsLocation)
            .measured.map(({ site }) => site)
            .slice(0, 4)
        : selectDailyRotation(readySites, homeRotationDay());
    const localizedById = new Map(allSites.map((site) => [site.id, site]));
    return ranked.map((site) => localizedById.get(site.id) ?? site);
  }, [allSites, gpsLocation, readySites, session]);

  return (
    <div className="bg-white pb-10">
      {/* 화면 제목은 스크린리더용으로만 — 눈에는 사진이 먼저 들어와야 한다 */}
      <h1 className="sr-only">Visit Holy Korea — {t('homeProblemLine')}</h1>

      {/* 1. 히어로 — 모바일·PC 모두 100vw 로 가장자리까지, 헤더 바로 아래(2026-09-17) */}
      <HeroCarousel slides={heroSlides} />

      {/* 2. 입구 3개 — 성지 찾기 · 미카엘 순례 가이드 · 오늘의 성지 일정 순서(사장님 지적, 2026-09-18).
          미카엘은 화면 이동이 아니라 그 자리에서 시트를 연다 — `to` 대신 `onClick`. */}
      <PageContainer className="pt-3 lg:pt-4">
        <div className="grid gap-2.5 lg:grid-cols-3">
          <EntryCard
            to={paths.search}
            id="entry-search"
            icon={<Search size={24} aria-hidden />}
            title={t('findShrines')}
            sub={t('homeEntrySearchSub')}
          />
          <EntryCard
            onClick={() => setAiOpen(true)}
            id="entry-ai-guide"
            icon={<Sparkles size={24} aria-hidden />}
            title={t('aiGuideEntryTitle')}
            sub={t('aiGuideEntrySub')}
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

      {/* 3. 처음 방문하기 좋은 성지 — 모바일은 가로 슬라이드(2026-09-19, 2×2 격자에서 바꿈).
          영어 등 이름이 긴 언어에서 2열 격자 폭(카드 하나 ~170px)에 이름이 잘려 보였다
          (2026-09-19 실측). 카드 폭을 180px 로 넓혀 가로로 넘기면 대부분 한 줄에 다 들어간다.
          md 부터는 화면이 넓어 그대로 격자로 4장을 편다. */}
      <PageContainer className="pt-8 lg:pt-12">
        <SectionHeading title={t('homeFirstVisitTitle')} />
        <ScrollHintRow className="-mx-3 flex gap-3 px-3 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:gap-5">
          {firstVisit.length > 0
            ? firstVisit.map((site) => (
                <div key={site.id} className="w-[180px] shrink-0 md:w-auto">
                  <SiteGridCard site={site} />
                </div>
              ))
            : [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] w-[180px] shrink-0 animate-pulse rounded-lg bg-app-panel md:w-auto"
                />
              ))}
        </ScrollHintRow>
      </PageContainer>

      {/* 3.5 순례 코스 — 오늘 방문하기 좋은 성지 아래, 「모두 보기」 링크 포함(사장님 지적, 2026-09-18) */}
      {routes.length > 0 && (
        <PageContainer className="pt-8 lg:pt-12">
          <SectionHeading
            title={t('routesTitle')}
            action={{ to: paths.routes, label: t('seeAll') }}
          />
          <div className="no-scrollbar -mx-3 flex gap-4 overflow-x-auto px-3 lg:-mx-5 lg:px-5">
            {routes.slice(0, 6).map((route) => (
              <Link
                key={route.id}
                to={paths.routeDetail(route.slug)}
                className="group w-64 flex-shrink-0 rounded-lg border border-app-border bg-white p-5 text-left transition-colors hover:border-brand-blue"
                id={`home-route-${route.id}`}
              >
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-app-text-muted">
                  <Footprints size={14} aria-hidden />
                  {route.stopCount != null && (
                    <span>
                      {fillPlaceholders(t('routeStopsCount'), { count: route.stopCount })}
                    </span>
                  )}
                </div>
                <h3 className="mb-1 text-lg font-bold text-app-text group-hover:text-brand-blue">
                  {route.title}
                </h3>
                {route.subtitle && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-app-text-muted">
                    {route.subtitle}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </PageContainer>
      )}

      {/* 4. 푸터 — 로그인 화면과 같은 가운데 정렬 밑줄 링크 줄(사장님 지적, 2026-09-18).
          위 테두리는 화면 끝까지 간다(같은 지적) — 테두리는 PageContainer 밖에,
          링크만 안에 둔다. 「정보 출처·문의」 팝업은 없앴다(같은 지적) — 그 안에
          있던 내용(교구 출처·TourAPI 실시간 조회·미사 시간은 현장 확인)은 자주 묻는
          질문에, 오류 발견 시 바로잡는다는 약속은 이용약관 제9조에 이미 있다 —
          같은 말을 화면에 두 번 적어 둘 이유가 없었다.
          「추천 성지」 푸터 링크는 삭제(9/17) — /nearby 는 지금 앱 안 어디에서도 안 이어진다.
          모바일에서는 아예 없앴다(사장님 지적, 2026-09-18) — 이용약관·개인정보·FAQ 는
          더보기 화면에서 늘 닿을 수 있어, 홈 하단까지 스크롤할 이유가 없었다.
          WYD 2027·DID·주교회의 공식 링크 3개도 같은 줄에 더했다(사장님 지적, 같은 날) —
          "데스크톱에서만" 이라는 요청은 이 푸터 자체가 이미 데스크톱 전용이라 그대로 만족한다. */}
      <div className="mt-8 hidden border-t border-app-border lg:mt-10 lg:block">
        <PageContainer className="pt-5">
          <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              to={paths.terms}
              className="inline-flex min-h-11 items-center text-sm font-bold text-app-text-muted underline underline-offset-2"
            >
              {t('viewTerms')}
            </Link>
            <Link
              to={paths.privacy}
              className="inline-flex min-h-11 items-center text-sm font-bold text-app-text-muted underline underline-offset-2"
            >
              {t('privacyNotice')}
            </Link>
            <Link
              to={paths.faq}
              className="inline-flex min-h-11 items-center text-sm font-bold text-app-text-muted underline underline-offset-2"
            >
              {t('viewFaq')}
            </Link>
            {OFFICIAL_LINKS.filter((link) => link.url).map((link) => (
              <a
                key={link.id}
                href={link.url!}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center text-sm font-bold text-app-text-muted underline underline-offset-2"
              >
                {link.label[language]}
              </a>
            ))}
          </footer>
        </PageContainer>
      </div>

      <AiGuideSheet isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
