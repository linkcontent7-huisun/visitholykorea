import {
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
import { useSites } from '@/features/sites/hooks/use-sites';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { SPEECH_LOCALE } from '@/shared/i18n/dictionary';
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
  const { origin, language, t } = useSettings();
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag>('치유');
  const [isAIGuideOpen, setIsAIGuideOpen] = useState(false);
  const { session } = useSession();

  const { data: sites = [] } = useSites({ limit: 6 });
  // 붐빔 지수는 좌표가 있는 성지 전체를 후보로 삼는다. 실제 API 호출은
  // 상위 후보 몇 곳에만 일어나므로 목록을 넓게 가져와도 부담이 없다.
  const { data: allSites = [] } = useSites({ limit: 300 });
  // 히어로 사진은 "사진이 있는 성지"만 후보가 된다 — 사진 없는 곳이 뽑히면 안 된다.
  const { data: imagedSites = [] } = useSites({ limit: 100, withImageOnly: true });

  /** 오늘 소개하는 성지. 사진이 있는 곳 중에서 날짜로 순서를 매겨 매일 바뀐다. */
  const heroSite = useMemo(
    () => (imagedSites.length > 0 ? imagedSites[dayIndex() % imagedSites.length] : null),
    [imagedSites],
  );
  const heroDocent = heroSite ? getDocentScript(heroSite.id) : null;

  /** 히어로 성지에 다녀간 사람의 한 줄 — 실제 데이터가 있을 때만 보여준다(더미 금지). */
  const { data: heroNotes = [] } = useSiteNotes(heroSite?.id);
  const storyNote = heroNotes.find((n) => n.note);

  /**
   * 출발지를 정해 둔 사람에게는 "전국 아무 데나"가 아니라 **갈 수 있는 곳**을 먼저 보여준다.
   * 출발지가 없으면 지금까지처럼 기본 목록을 그대로 쓴다.
   */
  const nearbyFirst = useMemo(() => {
    const from = regionCoords(origin);
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
  }, [origin, allSites, sites]);
  const { data: courses = [], isLoading: coursesLoading } = useRecommendedCourses(selectedEmotion);

  return (
    <div className="bg-app-bg pb-10">
      {/*
        히어로 — 사진 한 장으로 시작한다.
        모바일: 지금까지처럼 둥근 카드(오늘의 성지). 누르면 그 성지로 간다.
        데스크톱: 같은 사진이 화면 폭을 꽉 채우고, 그 위에 서비스 한 줄 소개가 올라온다.
        사진은 매일 바뀌는 "오늘의 성지"이므로 데스크톱에서도 성지 이름을 반드시 함께 밝힌다.
      */}
      {heroSite ? (
        <section className="px-6 pt-4 lg:px-0 lg:pt-0">
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

            {/* 오늘의 성지 — 모바일은 왼쪽 아래, 데스크톱은 오른쪽 아래로 비켜 놓는다 */}
            <Link
              to={paths.siteDetail(heroSite.id)}
              className="absolute inset-x-0 bottom-0 block p-6 text-white lg:inset-x-auto lg:bottom-8 lg:right-10 lg:max-w-[280px] lg:rounded-2xl lg:bg-black/35 lg:p-5 lg:backdrop-blur-md"
              id="home-hero"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                {heroSite.region} · {heroSite.category}
              </p>
              <h2 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight lg:text-[20px]">
                {heroSite.name}
              </h2>
              {/* 도슨트 원고가 없는 성지에 있는 척하는 CTA 를 붙이지 않는다(더미 금지). */}
              {heroDocent && (
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[13px] font-semibold backdrop-blur-md lg:mt-3 lg:px-3 lg:py-1.5 lg:text-[12px]">
                  <Headphones size={16} aria-hidden />
                  {t('heroDocentCta')}
                </span>
              )}
            </Link>
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

          <div className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
            {EMOTION_TAGS.map((emotion) => {
              const Icon = EMOTION_ICON[emotion];
              const active = emotion === selectedEmotion;
              return (
                <button
                  key={emotion}
                  onClick={() => setSelectedEmotion(emotion)}
                  className="flex flex-shrink-0 flex-col items-center gap-2 lg:flex-row lg:gap-2"
                  id={`emotion-${emotion}`}
                  aria-pressed={active}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all lg:h-10 lg:w-10 lg:rounded-xl ${
                      active
                        ? 'border-brand-blue bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                        : 'border-app-border bg-white text-app-text-muted'
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <span
                    className={`text-[11px] font-bold lg:text-[13px] ${
                      active ? 'text-brand-blue' : 'text-app-text-muted'
                    }`}
                  >
                    {emotion}
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

      {/* 보조 진입 칩 + AI 가이드 — 데스크톱에서는 나란히 둔다 */}
      <PageContainer className="pt-10">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
          <div className="grid grid-cols-3 gap-3">
            <Link
              to={paths.alternatives}
              className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-app-border bg-white py-6 text-center transition-colors hover:border-brand-violet"
              id="chip-alternatives"
            >
              <Wind size={22} className="text-brand-violet" aria-hidden />
              <span className="text-[12px] font-bold leading-tight text-app-text">
                {t('crowdAvoidChip')}
              </span>
            </Link>
            <Link
              to={paths.festivals}
              className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-app-border bg-white py-6 text-center transition-colors hover:border-brand-violet"
              id="chip-festivals"
            >
              <PartyPopper size={22} className="text-brand-violet" aria-hidden />
              <span className="text-[12px] font-bold leading-tight text-app-text">
                {t('festivalsTitle')}
              </span>
            </Link>
            <Link
              to={paths.compass}
              className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-app-border bg-white py-6 text-center transition-colors hover:border-brand-violet"
              id="chip-compass"
            >
              <Compass size={22} className="text-brand-violet" aria-hidden />
              <span className="text-[12px] font-bold leading-tight text-app-text">
                {t('compassTitle')}
              </span>
            </Link>
          </div>

          <button
            onClick={() => setIsAIGuideOpen(true)}
            className="group relative flex w-full flex-col items-start gap-4 overflow-hidden rounded-[20px] bg-gradient-to-br from-brand-blue to-brand-violet p-7 text-left text-white shadow-xl shadow-brand-blue/10"
            id="ai-guide-btn"
          >
            <div className="relative z-10">
              <h3 className="mb-1 text-lg font-semibold">{t('aiGuideTitle')}</h3>
              <p className="text-[13px] leading-relaxed opacity-80">{t('aiGuideBody')}</p>
            </div>
            <div className="relative z-10 rounded-xl bg-white/20 px-4 py-2 text-[13px] font-semibold backdrop-blur-md">
              {t('aiGuideAsk')}
            </div>
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-125" />
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
            {origin ? `${origin}에서 가까운 성지` : t('exploreAllTitle')}
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
