import {
  ChevronLeft,
  ChevronRight,
  Compass,
  HandHeart,
  Headphones,
  HeartHandshake,
  MessageCircle,
  PartyPopper,
  Sparkles,
  Sunrise,
  Wind,
} from 'lucide-react';
import { useState, type ComponentType, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { AiGuideSheet } from '@/features/ai-guide/components/AiGuideSheet';
import { CourseCardItem } from '@/features/courses/components/CourseCardItem';
import { useRecommendedCourses } from '@/features/courses/hooks/use-courses';
import { useSession } from '@/features/auth/hooks/use-session';
import { getDocentScript } from '@/features/docent/data/scripts';
import { EmptyPassportPreview } from '@/features/passport/components/EmptyPassportPreview';
import { useSiteNotes } from '@/features/passport/hooks/use-stamps';
import { TodayQuietSection } from '@/features/quiet/components/TodayQuietSection';
import { SiteGridCard } from '@/features/sites/components/SiteGridCard';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { fillPlaceholders, SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { regionCoords } from '@/shared/lib/regions';
import { haversineKm } from '@/shared/lib/geo';
import { EMOTION_TAGS, type EmotionTag } from '@/shared/types/domain';

const EMOTION_ICON: Record<EmotionTag, ComponentType<{ size?: number; className?: string }>> = {
  위로: HeartHandshake,
  새출발: Sunrise,
  평온: Wind,
  치유: Sparkles,
  감사: HandHeart,
};

/** 하루 단위로 바뀌는 값. 날짜가 바뀌면 히어로에 뜨는 성지도 바뀐다. */
function dayIndex(): number {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
}

export default function HomePage() {
  const { origin, gpsLocation, language, t } = useSettings();
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag>('치유');
  const [isAIGuideOpen, setIsAIGuideOpen] = useState(false);
  const { session } = useSession();

  const { data: sitesRaw = [] } = useSites({ limit: 6 });
  const sites = useLocalizedSites(sitesRaw);
  // 붐빔 지수는 좌표가 있는 성지 전체를 후보로 삼는다. 실제 API 호출은
  // 상위 후보 몇 곳에만 일어나므로 목록을 넓게 가져와도 부담이 없다.
  // 300곳을 한 번에 번역해 두면 TodayQuietSection·nearbyFirst 등 아래 여러 곳이
  // 각자 다시 조회하지 않고 같은 번역 결과를 재사용한다.
  const { data: allSitesRaw = [] } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);
  // 히어로 사진은 "사진이 있는 성지"만 후보가 된다 — 사진 없는 곳이 뽑히면 안 된다.
  const { data: imagedSites = [] } = useSites({ limit: 100, withImageOnly: true });

  /**
   * 오늘 소개하는 성지 다섯 곳. 사진이 있는 곳 중에서 날짜로 회전시켜 매일 바뀐다.
   * 모바일에서는 좌우로 넘겨보는 캐러셀로, 데스크톱에서는 그중 첫 곳만 큰 히어로로 쓴다.
   */
  const heroSitesRaw = useMemo(() => {
    if (imagedSites.length === 0) return [];
    const start = dayIndex() % imagedSites.length;
    const rotated = [...imagedSites.slice(start), ...imagedSites.slice(0, start)];
    return rotated.slice(0, Math.min(5, rotated.length));
  }, [imagedSites]);
  const heroSites = useLocalizedSites(heroSitesRaw);
  const heroSite = heroSites[0] ?? null;
  const heroDocent = heroSite ? getDocentScript(heroSite.id) : null;

  /** 히어로 성지에 다녀간 사람의 한 줄 — 실제 데이터가 있을 때만 보여준다(더미 금지). */
  const { data: heroNotes = [] } = useSiteNotes(heroSite?.id);
  const storyNote = heroNotes.find((n) => n.note);

  /**
   * 출발지를 정해 둔 사람에게는 "전국 아무 데나"가 아니라 **갈 수 있는 곳**을 먼저 보여준다.
   * 출발지가 없으면 지금까지처럼 기본 목록을 그대로 쓴다.
   */
  // allSites 가 이미 번역된 이름을 갖고 있어(위 useLocalizedSites), 여기서 다시 조회할 필요가 없다.
  const nearbyFirst = useMemo(() => {
    const from = gpsLocation ?? regionCoords(origin);
    if (!from || allSites.length === 0) return sites;

    return [...allSites]
      .filter((s) => s.coordinates.lat != null && s.coordinates.lng != null)
      .map((s) => ({
        site: s,
        km: haversineKm(from.lat, from.lng, s.coordinates.lat!, s.coordinates.lng!),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 8)
      .map((x) => x.site);
  }, [origin, gpsLocation, allSites, sites]);
  const { data: courses = [], isLoading: coursesLoading } = useRecommendedCourses(selectedEmotion);

  return (
    <div className="bg-app-bg pb-10">
      {/*
        히어로 — 사진으로 시작한다.
        모바일: 오늘의 성지 다섯 곳을 좌우로 넘겨보는 캐러셀(2026-09-08) — 한 장만
        있는 줄 알았다는 피드백으로, 다음 카드가 오른쪽 끝에 살짝 걸치게 두고
        화살표로 더 있음을 알린다.
        데스크톱: 그중 첫 곳이 화면 폭을 꽉 채우고, 그 위에 서비스 한 줄 소개가 올라온다.
      */}
      {heroSite ? (
        <section className="pt-4 lg:px-0 lg:pt-0">
          {/* 모바일 전용 — 캐러셀 */}
          <div className="lg:hidden">
            <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1">
              {heroSites.map((site, i) => {
                const docent = getDocentScript(site.id);
                return (
                  <Link
                    key={site.id}
                    to={paths.siteDetail(site.id)}
                    className="relative h-80 w-[86%] shrink-0 snap-center overflow-hidden rounded-3xl"
                    id={i === 0 ? 'home-hero' : undefined}
                  >
                    <SiteThumbnail
                      imageUrl={site.imageUrl}
                      name={site.name}
                      category={site.category}
                      intensity="deep"
                      className="h-full w-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      aria-hidden
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0) 65%)',
                      }}
                    />
                    {/* 옆에 더 있다는 것을 손으로 안 밀어봐도 알 수 있게 */}
                    {i > 0 && (
                      <div
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                        aria-hidden
                      >
                        <ChevronLeft size={20} />
                      </div>
                    )}
                    {i < heroSites.length - 1 && (
                      <div
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 animate-pulse items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                        aria-hidden
                      >
                        <ChevronRight size={20} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                        {localizeRegionName(site.region, language)} · {localizeDomainValue(site.category, t)}
                      </p>
                      <h2 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight">
                        {site.name}
                      </h2>
                      {/* 도슨트 원고가 없는 성지에 있는 척하는 CTA 를 붙이지 않는다(더미 금지). */}
                      {docent && (
                        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[13px] font-semibold backdrop-blur-md">
                          <Headphones size={16} aria-hidden />
                          {t('heroDocentCta')}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 데스크톱 전용 — 오늘의 성지 한 곳을 크게 */}
          <div className="hidden lg:block">
          <div className="relative h-80 overflow-hidden rounded-3xl lg:h-[420px] lg:rounded-none">
            <SiteThumbnail
              imageUrl={heroSite.imageUrl}
              name={heroSite.name}
              category={heroSite.category}
              intensity="deep"
              className="h-full w-full object-cover"
            />
            {/* 모바일: 아래에서 위로. 데스크톱: 왼쪽에서 오른쪽으로 — 글이 왼쪽에 오므로 */}
            <div
              className="absolute inset-0 lg:hidden"
              aria-hidden
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0) 65%)' }}
            />
            <div
              className="absolute inset-0 hidden lg:block"
              aria-hidden
              style={{
                background:
                  'linear-gradient(90deg, rgba(10,14,30,.85) 0%, rgba(10,14,30,.45) 55%, rgba(10,14,30,.12) 100%)',
              }}
            />

            {/* 데스크톱 전용 소개 문구 */}
            <div className="absolute inset-0 hidden items-center lg:flex">
              <PageContainer>
                <div className="max-w-[620px] text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#c4b5fd]">
                    2026 관광데이터 활용 공모전 출품작
                  </p>
                  <h1 className="mt-4 text-[46px] font-extrabold leading-[1.12] tracking-tight">
                    붐비는 관광지 대신,
                    <br />
                    마음에 필요한 쉼표 하나.
                  </h1>
                  <p className="mt-4 text-base leading-relaxed opacity-90">
                    감정을 고르면 그에 맞는 성지와 도보권 관광지를 이어 붙인 쉼표 순례길을
                    제안합니다.
                    {allSites.length > 0 && ` 전국 성지 ${allSites.length}곳, 실시간 붐빔 정보와 함께.`}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      to={paths.compass}
                      className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-brand-blue"
                      id="hero-compass-cta"
                    >
                      {t('compassTitle')}
                    </Link>
                    <Link
                      to={paths.explore}
                      className="rounded-full border border-white/50 px-7 py-3.5 text-sm font-bold text-white"
                      id="hero-explore-cta"
                    >
                      {t('exploreAllTitle')}
                    </Link>
                  </div>
                </div>
              </PageContainer>
            </div>

            {/* 오늘의 성지 — 오른쪽 아래로 비켜 놓는다 */}
            <Link
              to={paths.siteDetail(heroSite.id)}
              className="absolute inset-x-auto bottom-8 right-10 block max-w-[280px] rounded-2xl bg-black/35 p-5 text-white backdrop-blur-md"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                {localizeRegionName(heroSite.region, language)} · {localizeDomainValue(heroSite.category, t)}
              </p>
              <h2 className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight">
                {heroSite.name}
              </h2>
              {/* 도슨트 원고가 없는 성지에 있는 척하는 CTA 를 붙이지 않는다(더미 금지). */}
              {heroDocent && (
                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-semibold backdrop-blur-md">
                  <Headphones size={16} aria-hidden />
                  {t('heroDocentCta')}
                </span>
              )}
            </Link>
          </div>
          </div>
        </section>
      ) : (
        <section className="px-6 pt-4 lg:px-0 lg:pt-0">
          <div className="h-80 animate-pulse rounded-3xl bg-gray-100 lg:h-[420px] lg:rounded-none" />
        </section>
      )}

      {/* 쉼표 순례길 — 감정 기반 코스 추천. 데스크톱에서는 감정 줄이 제목 옆으로 온다. */}
      <PageContainer className="pt-8 lg:pt-12">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="mb-1 text-lg font-bold text-app-text lg:text-2xl">{t('coursesTitle')}</h3>
            <p className="text-[12px] font-medium text-app-text-muted lg:text-sm">
              {t('coursesSubtitle')}
            </p>
          </div>

          {/*
            모바일: 5개가 옆으로 넘겨야만 보였다는 피드백(2026-09-08) — 그리드로
            한 화면 안에 전부 들어오게 줄였다. 데스크톱은 기존 가로줄 그대로.
          */}
          <div className="grid grid-cols-5 gap-2 lg:flex lg:gap-3">
            {EMOTION_TAGS.map((emotion) => {
              const Icon = EMOTION_ICON[emotion];
              const active = emotion === selectedEmotion;
              return (
                <button
                  key={emotion}
                  onClick={() => setSelectedEmotion(emotion)}
                  className="flex flex-col items-center gap-1.5 lg:flex-row lg:gap-2"
                  id={`emotion-${emotion}`}
                  aria-pressed={active}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all lg:h-10 lg:w-10 ${
                      active
                        ? 'border-brand-blue bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                        : 'border-app-border bg-white text-app-text-muted'
                    }`}
                  >
                    <Icon size={18} className="lg:hidden" />
                    <Icon size={22} className="hidden lg:block" />
                  </div>
                  <span
                    className={`text-[10px] font-bold lg:text-[13px] ${
                      active ? 'text-brand-blue' : 'text-app-text-muted'
                    }`}
                  >
                    {localizeDomainValue(emotion, t)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/*
          감정 태그를 직접 고르기 어려운 사용자를 위한 안내형 진입점 「몇 가지 질문으로 나에게 맞는 곳 찾기」 카드를 뺐다 (2026-09-06).
          바로 아래 칩줄의 「마음 나침반」과 가는 곳이 같아서, 한 화면 안에 같은
          목적지가 두 번 있었다. 질문으로 찾는 길은 나침반 타일이 맡고,
          여기서는 감정을 한 번에 고르는 빠른 길만 남긴다.
        */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {coursesLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 w-full animate-pulse rounded-[24px] bg-gray-100" />
            ))
          ) : courses.length > 0 ? (
            courses.map((course) => <CourseCardItem key={course.site.id} course={course} />)
          ) : (
            <p className="py-10 text-center text-sm text-app-text-muted sm:col-span-2 xl:col-span-4">
              {t('coursesEmpty')}
            </p>
          )}
        </div>
      </PageContainer>

      {/*
        바로가기 넷 — 「무엇을 하러 왔는가」를 한 덩어리로 모은다 (2026-09-07).

        전에는 칩 3개 옆에 AI 가이드가 화면 4분의 1을 먹는 보라색 배너로 따로
        있었다. 넷 다 "여기서 시작한다"는 같은 성격인데 하나만 크게 있으니
        휴대폰에서 화면이 어수선했다. 넷을 한 격자에 넣고 **휴대폰은 2×2,
        데스크톱은 한 줄**로 편다 — 요소를 두 벌 그리지 않으므로 상태도 하나다.
        AI 가이드는 보라색 바탕을 남겨 여전히 먼저 눈에 들어온다.

        「붐빔 피하기」와 「축제 가는 김에」는 방향이 반대인 한 쌍이라 나란히 둔다.
      */}
      <PageContainer className="pt-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Link
              to={paths.alternatives}
              className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-app-border bg-white py-5 text-center transition-colors hover:border-brand-violet"
              id="chip-alternatives"
            >
              <Wind size={22} className="text-brand-violet" aria-hidden />
              <span className="text-[12px] font-bold leading-tight text-app-text">
                {t('crowdAvoidChip')}
              </span>
            </Link>
            <Link
              to={paths.festivals}
              className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-app-border bg-white py-5 text-center transition-colors hover:border-brand-violet"
              id="chip-festivals"
            >
              <PartyPopper size={22} className="text-brand-violet" aria-hidden />
              <span className="text-[12px] font-bold leading-tight text-app-text">
                {t('festivalsTitle')}
              </span>
            </Link>
            <Link
              to={paths.compass}
              className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-app-border bg-white py-5 text-center transition-colors hover:border-brand-violet"
              id="chip-compass"
            >
              <Compass size={22} className="text-brand-violet" aria-hidden />
              <span className="text-[12px] font-bold leading-tight text-app-text">
                {t('compassTitle')}
              </span>
            </Link>
          <button
            onClick={() => setIsAIGuideOpen(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-[20px] bg-gradient-to-br from-brand-blue to-brand-violet py-5 text-center text-white shadow-lg shadow-brand-blue/10"
            id="ai-guide-btn"
          >
            <Sparkles size={22} aria-hidden />
            <span className="text-[12px] font-bold leading-tight">{t('aiGuideTitle')}</span>
          </button>
        </div>
      </PageContainer>

      {/* 오늘의 쉼표 — 실시간 붐빔. 컨테이너가 좌우 여백을 대신 잡는다. */}
      <PageContainer className="pt-6">
        <div className="lg:max-w-[720px]">
          <TodayQuietSection sites={allSites} variant="compact" padded={false} />
        </div>
      </PageContainer>

      {/* 순례 여권 미리보기 — 로그인 전 상태에만. 가입 유도 장치다. */}
      {!session && (
        <PageContainer className="pt-4">
          <div className="rounded-[24px] border border-app-border bg-white p-6 lg:max-w-[820px]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-app-text">{t('pilgrimPassport')}</h3>
                <p className="mt-1 text-[12px] text-app-text-muted">
                  {t('passportPreviewSubtitle')}
                </p>
              </div>
              <Link
                to={paths.login}
                className="shrink-0 rounded-full bg-brand-blue px-4 py-2 text-[12px] font-bold text-white"
                id="passport-signup-cta"
              >
                {t('passportSignupCta')}
              </Link>
            </div>
            {/* 실제 전체 성지 수(자체 큐레이션 데이터) — 값을 지어내지 않는다 */}
            {allSites.length > 0 && (
              <p className="mb-4 text-xs font-bold text-app-text-muted">0 / {allSites.length}</p>
            )}
            <EmptyPassportPreview />
          </div>
        </PageContainer>
      )}

      {/* 순례자 이야기 미리보기 — 실제 방문자 한 줄이 있을 때만 조용히 노출한다 */}
      {heroSite && storyNote && (
        <PageContainer className="pt-4">
          <div className="flex items-center gap-4 rounded-[24px] border border-app-border bg-white p-5 lg:max-w-[720px]">
            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-app-bg">
              {storyNote.photoUrl ? (
                <img
                  src={storyNote.photoUrl}
                  alt="순례자가 남긴 사진"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brand-violet/40">
                  <MessageCircle size={26} aria-hidden />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-violet">
                {t('pilgrimStoriesTitle')}
              </p>
              <p className="mt-1 truncate text-sm font-medium text-app-text">
                &ldquo;{storyNote.note}&rdquo;
              </p>
              <p className="mt-1 text-[11px] text-app-text-muted">
                {new Date(storyNote.visitedAt).toLocaleDateString(SPEECH_LOCALE[language])}
              </p>
            </div>
          </div>
        </PageContainer>
      )}

      {/* 전국 성지 — 출발지가 있으면 가까운 곳부터 */}
      <PageContainer className="pt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h3 className="text-lg font-bold text-app-text lg:text-2xl">
            {gpsLocation
              ? fillPlaceholders(t('nearbyRegionTitle'), { origin: t('useCurrentLocationButton') })
              : origin
                ? fillPlaceholders(t('nearbyRegionTitle'), { origin: localizeRegionName(origin, language) })
                : t('exploreAllTitle')}
          </h3>
          <Link to={paths.explore} className="shrink-0 text-[12px] font-bold text-brand-violet">
            {t('explore')}
            <ChevronRight size={14} className="ml-0.5 inline" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {nearbyFirst.length > 0
            ? nearbyFirst.map((site) => <SiteGridCard key={site.id} site={site} />)
            : [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square animate-pulse rounded-[20px] bg-gray-100" />
              ))}
        </div>
      </PageContainer>

      <AiGuideSheet isOpen={isAIGuideOpen} onClose={() => setIsAIGuideOpen(false)} />
    </div>
  );
}
