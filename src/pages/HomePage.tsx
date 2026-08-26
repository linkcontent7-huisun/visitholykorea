import {
  ChevronRight,
  Compass,
  Globe,
  HandHeart,
  HeartHandshake,
  Search,
  Sparkles,
  Sunrise,
  Type,
  Wind,
} from 'lucide-react';
import { useState, type ComponentType, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { AiGuideSheet } from '@/features/ai-guide/components/AiGuideSheet';
import { CourseCardItem } from '@/features/courses/components/CourseCardItem';
import { useRecommendedCourses } from '@/features/courses/hooks/use-courses';
import { TodayQuietSection } from '@/features/quiet/components/TodayQuietSection';
import { SiteGridCard } from '@/features/sites/components/SiteGridCard';
import { useSites } from '@/features/sites/hooks/use-sites';
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

export default function HomePage() {
  const { language, setLanguage, largeText, setLargeText, origin } = useSettings();
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag>('치유');
  const [isAIGuideOpen, setIsAIGuideOpen] = useState(false);

  const { data: sites = [] } = useSites({ limit: 6 });
  // 붐빔 지수는 좌표가 있는 성지 전체를 후보로 삼는다. 실제 API 호출은
  // 상위 후보 몇 곳에만 일어나므로 목록을 넓게 가져와도 부담이 없다.
  const { data: allSites = [] } = useSites({ limit: 300 });

  /**
   * 출발지를 정해 둔 사람에게는 "전국 아무 데나"가 아니라 **갈 수 있는 곳**을 먼저 보여준다.
   * 성지는 전국에 흩어져 있어서, 출발지를 모르면 목록의 앞자리가 사실상 무작위다.
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
      .slice(0, 6)
      .map((x) => x.site);
  }, [origin, allSites, sites]);
  const { data: courses = [], isLoading: coursesLoading } = useRecommendedCourses(selectedEmotion);

  return (
    <div className="bg-app-bg pb-20">
      {/* 검색창(미카엘 AI 진입점)이 스크롤해도 항상 맨 위에 보이도록 헤더에 붙여 둔다. */}
      <header className="sticky top-0 z-40 border-b border-app-border bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-8 pb-3 pt-5">
          <h1 className="text-xl font-extrabold tracking-tight text-brand-blue" id="logo">
            VISIT <span className="text-brand-violet">HOLY</span>
          </h1>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setLargeText(!largeText)}
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                largeText ? 'bg-brand-blue text-white' : 'bg-app-border text-app-text-muted'
              }`}
              id="large-text-toggle"
              aria-label="큰 글자 모드"
              aria-pressed={largeText}
            >
              <Type size={14} />
            </button>
            <button
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className="flex cursor-pointer items-center gap-1 text-[13px] font-bold text-app-text-muted"
              id="language-toggle"
            >
              <Globe size={14} />
              {language === 'ko' ? 'KO' : 'EN'}
            </button>
          </div>
        </div>
        <Link
          to={paths.search}
          className="mx-6 mb-4 flex items-center gap-3 rounded-2xl border border-app-border bg-app-bg px-5 py-3 text-left"
          id="search-bar"
        >
          <Search size={16} className="shrink-0 text-app-text-muted" />
          <span className="text-[13px] font-medium text-app-text-muted">
            성지 검색 또는 미카엘 AI에게 물어보기
          </span>
        </Link>
      </header>

      {/* 오늘의 쉼표 — 이 화면의 주인공. 예전 히어로 캐러셀 자리다.
          사진이 없으면 빈 껍데기였고, 있어도 누르지 않는 자리였다. */}
      <TodayQuietSection sites={allSites} />

      <section className="relative z-30 px-6">
        <button
          onClick={() => setIsAIGuideOpen(true)}
          className="group relative flex w-full flex-col items-start gap-4 overflow-hidden rounded-[20px] bg-gradient-to-br from-brand-blue to-brand-violet p-7 text-left text-white shadow-xl shadow-brand-blue/10"
          id="ai-guide-btn"
        >
          <div className="relative z-10">
            <h3 className="mb-1 text-lg font-semibold">AI 순례 가이드</h3>
            <p className="text-[13px] leading-relaxed opacity-80">
              성지 순례에 대한 모든 것!
              <br />
              무엇이든 물어보세요.
            </p>
          </div>
          <div className="relative z-10 rounded-xl bg-white/20 px-4 py-2 text-[13px] font-semibold backdrop-blur-md">
            질문하기
          </div>
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-125" />
        </button>
      </section>

      <div className="space-y-10 p-6">
        {/* 쉼표 순례길: 감정 기반 코스 추천 */}
        <section>
          <div className="mb-5">
            <h3 className="mb-1 text-lg font-bold text-app-text">쉼표 순례길</h3>
            <p className="text-[12px] font-medium text-app-text-muted">
              지금 마음에 필요한 쉼표를 골라보세요
            </p>
          </div>

          {/* 감정 태그를 직접 고르기 어려운 사용자를 위한 안내형 진입점 */}
          <Link
            to={paths.compass}
            className="mb-6 flex w-full items-center gap-4 rounded-[20px] border border-app-border bg-white p-5 text-left shadow-sm"
            id="healing-quiz-cta"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-violet/10 text-brand-violet">
              <Compass size={20} />
            </div>
            <div className="flex-1">
              <p className="mb-0.5 text-sm font-extrabold text-app-text">
                몇 가지 질문으로 나에게 맞는 곳 찾기
              </p>
              <p className="text-[11px] font-medium text-app-text-muted">
                마음 나침반이 당신의 쉼의 자리를 안내해드려요
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-app-text-muted" />
          </Link>

          <div className="no-scrollbar -mx-6 mb-6 flex gap-3 overflow-x-auto px-6 pb-1">
            {EMOTION_TAGS.map((emotion) => {
              const Icon = EMOTION_ICON[emotion];
              const active = emotion === selectedEmotion;
              return (
                <button
                  key={emotion}
                  onClick={() => setSelectedEmotion(emotion)}
                  className="flex flex-shrink-0 flex-col items-center gap-2"
                  id={`emotion-${emotion}`}
                  aria-pressed={active}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
                      active
                        ? 'border-brand-blue bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                        : 'border-app-border bg-white text-app-text-muted'
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <span
                    className={`text-[11px] font-bold ${active ? 'text-brand-blue' : 'text-app-text-muted'}`}
                  >
                    {emotion}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            {coursesLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-64 w-full animate-pulse rounded-[24px] bg-gray-100" />
              ))
            ) : courses.length > 0 ? (
              courses.map((course) => <CourseCardItem key={course.site.id} course={course} />)
            ) : (
              <p className="py-10 text-center text-sm text-app-text-muted">
                이 감정에 맞는 코스를 아직 준비 중이에요.
              </p>
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-5 text-lg font-bold text-app-text">
            {origin ? `${origin}에서 가까운 성지` : '전국 성지 탐방'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {nearbyFirst.length > 0
              ? nearbyFirst.map((site) => <SiteGridCard key={site.id} site={site} />)
              : [1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-[20px] bg-gray-100" />
                ))}
          </div>
        </section>
      </div>

      <AiGuideSheet isOpen={isAIGuideOpen} onClose={() => setIsAIGuideOpen(false)} />
    </div>
  );
}
