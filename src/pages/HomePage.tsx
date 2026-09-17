import {
  CalendarHeart,
  ChevronRight,
  HelpCircle,
  Info,
  MessageSquare,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { AiGuideSheet } from '@/features/ai-guide/components/AiGuideSheet';
import { HeroCarousel, type HeroSlide } from '@/features/sites/components/HeroCarousel';
import { SiteGridCard } from '@/features/sites/components/SiteGridCard';
import { HERO_SITES } from '@/features/sites/data/hero-sites';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { ButtonLink } from '@/shared/components/ui/Button';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';

/**
 * 홈 — 2026-09-16 회의 · 시안(버전 8) 확정 순서, 9/17 오후 사장님 지시로 4번을 접었다.
 *
 *   1. 히어로 — 고정 5곳 사진 슬라이드, 100vw. 사진이 가장 먼저 눈에 들어온다. 설명글 없음.
 *   2. 입구 2개 — 성지 찾기 · 오늘의 성지 일정. 첫 화면 안에 보인다.
 *   3. 처음 방문하기 좋은 성지 (사진·연락처·좌표가 모두 확인된 곳)
 *   4. 정보의 출처와 이용 방법 · 문의 — 본문에 펼쳐 두지 않고 푸터 한 줄 + 팝업(`HomeInfoSheet`)으로 접는다.
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
  const className = `flex min-h-[84px] w-full items-center gap-3.5 rounded-lg border-[1.5px] border-brand-blue p-4 text-left transition-transform active:scale-[0.99] lg:min-h-24 lg:px-5 ${
    filled ? 'bg-brand-blue text-white' : 'bg-white text-brand-blue'
  }`;
  const inner = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${filled ? 'bg-white/15' : 'bg-brand-soft'}`}
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
            className={`mt-0.5 block text-sm leading-snug ${filled ? 'text-white/90' : 'text-app-text-muted'}`}
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

/**
 * 푸터 「정보 출처·문의」 상세 팝업 (2026-09-17) — `InstallShareSheet` 와 같은 시트 모양.
 * 본문에 늘 펼쳐 두던 카드 2장을 접어 넣었다 — 첫 화면은 사진과 입구 2개만으로 끝나야 한다.
 */
function HomeInfoSheet({ onClose }: { onClose: () => void }) {
  const { t } = useSettings();
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30"
        aria-label={t('close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={`${t('homeSourcesTitle')} · ${t('homeContactTitle')}`}
        className="fixed bottom-[70px] left-1/2 z-50 max-h-[70vh] w-full max-w-lg -translate-x-1/2 overflow-y-auto rounded-t-lg border-t border-app-border bg-white px-5 pb-5 pt-4 lg:bottom-0 lg:rounded-lg lg:border"
        id="home-info-sheet"
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-lg font-bold text-app-text">
            {t('homeSourcesTitle')} · {t('homeContactTitle')}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-bg"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <div className="divide-y divide-app-border">
          <div className="py-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-app-text">
              <Info size={18} className="text-brand-blue" aria-hidden />
              {t('homeSourcesTitle')}
            </h3>
            <p className="mt-2 text-base leading-relaxed text-app-text-muted">
              {t('homeSourcesBody')}
            </p>
          </div>
          <div className="py-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-app-text">
              <MessageSquare size={18} className="text-brand-olive" aria-hidden />
              {t('homeContactTitle')}
            </h3>
            <p className="mt-2 text-base leading-relaxed text-app-text-muted">
              {t('homeContactBody')}
            </p>
            <ButtonLink to={paths.faq} variant="secondary" className="mt-4">
              <HelpCircle size={18} aria-hidden />
              {t('viewFaq')}
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  const { language, t } = useSettings();
  const [infoOpen, setInfoOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

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
        objectPosition: h.objectPosition,
      };
    });
  }, [allSites, language, t]);

  /** 사진·연락처·좌표가 모두 있는 성지 중 이름순 4곳. 날짜로 돌리지 않는다 — 심사·시연 때 매번 같아야 한다. */
  const firstVisit = useMemo(
    () =>
      [...allSites]
        .filter(isFirstVisitReady)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        .slice(0, 4),
    [allSites],
  );

  return (
    <div className="bg-white pb-10">
      {/* 화면 제목은 스크린리더용으로만 — 눈에는 사진이 먼저 들어와야 한다 */}
      <h1 className="sr-only">Visit Holy Korea — {t('homeProblemLine')}</h1>

      {/* 1. 히어로 — 모바일·PC 모두 100vw 로 가장자리까지, 헤더 바로 아래(2026-09-17) */}
      <HeroCarousel slides={heroSlides} />

      {/* 2. 입구 3개 — 성지 찾기 · 미카엘 AI · 오늘의 성지 일정 순서(사장님 지적, 2026-09-18).
          미카엘은 화면 이동이 아니라 그 자리에서 시트를 연다 — `to` 대신 `onClick`. */}
      <PageContainer className="pt-4 lg:pt-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <EntryCard
            to={paths.search}
            id="entry-search"
            icon={<Search size={24} aria-hidden />}
            title={t('findShrines')}
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

      {/* 3. 처음 방문하기 좋은 성지 */}
      <PageContainer className="pt-8 lg:pt-12">
        <SectionHeading title={t('homeFirstVisitTitle')} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
          {firstVisit.length > 0
            ? firstVisit.map((site) => <SiteGridCard key={site.id} site={site} />)
            : [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-app-panel" />
              ))}
        </div>
      </PageContainer>

      {/* 4. 출처·문의 — 접어서 푸터 한 줄로, 상세는 팝업(2026-09-17 오후 사장님 지시).
          「추천 성지」 푸터 링크는 삭제(같은 지시) — /nearby 는 지금 앱 안 어디에서도 안 이어진다.
          디자인은 로그인 화면의 약관·개인정보·FAQ 줄과 같게(사장님 지적, 2026-09-18) — 가운데
          정렬된 밑줄 글자 여러 개를 나란히 둔다. 정보 출처·문의는 그대로 팝업(`HomeInfoSheet`)으로
          열리되, 로그인 화면에도 있는 약관·개인정보·FAQ 를 홈에서도 바로 갈 수 있게 더했다. */}
      <PageContainer className="pt-8 lg:pt-10">
        <footer className="border-t border-app-border pt-5">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              id="footer-about"
              className="inline-flex min-h-11 items-center text-sm font-bold text-app-text-muted underline underline-offset-2"
            >
              {t('homeSourcesTitle')} · {t('homeContactTitle')}
            </button>
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
          </div>
        </footer>
      </PageContainer>

      {infoOpen && <HomeInfoSheet onClose={() => setInfoOpen(false)} />}
      <AiGuideSheet isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
