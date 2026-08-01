import React, { useState, useEffect } from 'react';
import { Search, Globe, ChevronRight, Type, HeartHandshake, Sunrise, Wind, Sparkles, HandHeart, Footprints } from 'lucide-react';
import { motion } from 'motion/react';
import { HolySite, EmotionTag, EMOTION_TAGS } from '../../types';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';
import { getRecommendedCourses, CourseCard } from '../../services/courseMatchingService';

interface HomeTabProps {
  onSelectSite: (id: string) => void;
  onOpenAIGuide: () => void;
  onOpenSearch: () => void;
}

const EMOTION_ICON: Record<EmotionTag, React.ComponentType<{ size?: number; className?: string }>> = {
  위로: HeartHandshake,
  새출발: Sunrise,
  평온: Wind,
  치유: Sparkles,
  감사: HandHeart,
};

export default function HomeTab({ onSelectSite, onOpenAIGuide, onOpenSearch }: HomeTabProps) {
  const { language, setLanguage, largeText, setLargeText } = useSettings();
  const [heroIndex, setHeroIndex] = useState(0);
  const [sites, setSites] = useState<HolySite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag>('치유');
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [heroSites, setHeroSites] = useState<HolySite[]>([]);

  useEffect(() => {
    function mapRow(row: any): HolySite {
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        location: row.location,
        description: row.description,
        imageUrl: row.image_url,
        history: row.history,
        coordinates: { lat: row.lat, lng: row.lng },
        region: row.diocese,
      };
    }

    async function fetchSites() {
      const { data, error } = await supabase.from('holy_sites').select('*').limit(6);
      if (error) console.error('fetchSites error:', error);
      if (data) {
        setSites(data.map(mapRow));
      }
      setLoading(false);
    }

    async function fetchHeroSites() {
      const { data, error } = await supabase
        .from('holy_sites')
        .select('*')
        .not('image_url', 'is', null)
        .limit(5);
      if (error) console.error('fetchHeroSites error:', error);
      if (data && data.length > 0) {
        setHeroSites(data.map(mapRow));
      } else {
        // 사진이 있는 성지가 아직 없으면, 아무 성지나 3곳으로 대체(이모지로 표시됨)
        const { data: fallback } = await supabase.from('holy_sites').select('*').limit(3);
        if (fallback) setHeroSites(fallback.map(mapRow));
      }
    }

    fetchSites();
    fetchHeroSites();
  }, []);

  useEffect(() => {
    if (heroSites.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSites.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSites.length]);

  useEffect(() => {
    let cancelled = false;
    setCoursesLoading(true);
    getRecommendedCourses(selectedEmotion, undefined, 4, false).then((result) => {
      if (!cancelled) {
        setCourses(result);
        setCoursesLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedEmotion]);

  return (
    <div className="pb-20 bg-app-bg">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-5 sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-app-border">
        <h1 className="text-xl font-extrabold tracking-tight text-brand-blue" id="logo">
          VISIT <span className="text-brand-violet">HOLY</span>
        </h1>
        <div className="flex gap-5 items-center">
          <button onClick={onOpenSearch} className="w-6 h-6 bg-app-border rounded-full flex items-center justify-center" id="search-icon">
            <Search size={14} className="text-app-text-muted" />
          </button>
          <button
            onClick={() => setLargeText(!largeText)}
            className={`w-6 h-6 rounded-full flex items-center justify-center ${largeText ? 'bg-brand-blue text-white' : 'bg-app-border text-app-text-muted'}`}
            id="large-text-toggle"
            aria-label="큰 글자 모드"
          >
            <Type size={14} />
          </button>
          <button
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            className="flex items-center gap-1 text-[13px] font-bold text-app-text-muted cursor-pointer"
            id="language-toggle"
          >
            <Globe size={14} />
            {language === 'ko' ? 'KO' : 'EN'}
          </button>
        </div>
      </header>

      {/* Hero Carousel */}
      <section className="relative h-[60vh] mx-4 my-6 rounded-[24px] overflow-hidden shadow-2xl shadow-gray-200">
        {heroSites.map((site, index) => (
          <motion.div
            key={site.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === heroIndex ? 1 : 0 }}
            className="absolute inset-0"
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10" />
            <img 
              src={site.imageUrl} 
              alt={site.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-10 left-8 right-8 z-20 text-white">
              <motion.p 
                key={`${site.id}-sub`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm font-light opacity-90 mb-2 uppercase tracking-wide"
              >
                에디터 추천 성지
              </motion.p>
              <motion.h2 
                key={`${site.id}-title`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-semibold mb-4 leading-tight"
              >
                {site.title}
              </motion.h2>
              <button 
                onClick={() => onSelectSite(site.id)}
                className="bg-white/20 backdrop-blur-lg border border-white/30 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/40 transition-colors"
                id={`hero-cta-${site.id}`}
              >
                자세히 보기
              </button>
            </div>
          </motion.div>
        ))}
        {/* Carousel Indicators */}
        <div className="absolute top-6 right-6 z-20 flex gap-1.5">
          {heroSites.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} 
            />
          ))}
        </div>
      </section>

      {/* AI Guide Button */}
      <section className="px-6 relative z-30">
        <button 
          onClick={onOpenAIGuide}
          className="w-full bg-gradient-to-br from-brand-blue to-brand-violet text-white p-7 rounded-[20px] shadow-xl shadow-brand-blue/10 flex flex-col items-start gap-4 text-left group overflow-hidden relative" 
          id="ai-guide-btn"
        >
          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-1">AI 순례 가이드</h3>
            <p className="text-[13px] opacity-80 leading-relaxed">
              성지 순례에 대한 모든 것!<br />무엇이든 물어보세요.
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-[13px] font-semibold relative z-10">
            질문하기
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
        </button>
      </section>

      <div className="p-6 space-y-10">
        {/* 쉼표 순례길: 감정 기반 코스 추천 */}
        <section>
          <div className="mb-5">
            <h3 className="text-lg font-bold text-app-text mb-1">쉼표 순례길</h3>
            <p className="text-[12px] text-app-text-muted font-medium">지금 마음에 필요한 쉼표를 골라보세요</p>
          </div>

          {/* 감정 선택 */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-6 px-6 no-scrollbar mb-6">
            {EMOTION_TAGS.map((emotion) => {
              const Icon = EMOTION_ICON[emotion];
              const active = emotion === selectedEmotion;
              return (
                <button
                  key={emotion}
                  onClick={() => setSelectedEmotion(emotion)}
                  className="flex-shrink-0 flex flex-col items-center gap-2"
                  id={`emotion-${emotion}`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                      active
                        ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20'
                        : 'bg-white text-app-text-muted border-app-border'
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <span className={`text-[11px] font-bold ${active ? 'text-brand-blue' : 'text-app-text-muted'}`}>
                    {emotion}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 코스 카드 피드 */}
          <div className="space-y-6">
            {coursesLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="w-full h-64 bg-gray-100 rounded-[24px] animate-pulse" />
              ))
            ) : courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.site.id}
                  onClick={() => onSelectSite(course.site.id)}
                  className="rounded-[24px] overflow-hidden bg-white border border-app-border shadow-sm cursor-pointer group"
                  id={`course-${course.site.id}`}
                >
                  <div className="relative h-48 overflow-hidden bg-app-bg flex items-center justify-center">
                    {course.site.imageUrl ? (
                      <img
                        src={course.site.imageUrl}
                        alt={course.site.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-5xl opacity-30">⛪</span>
                    )}
                    {course.walkMinutes != null && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-brand-blue shadow-sm">
                        <Footprints size={12} /> 도보 {course.walkMinutes}분
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-extrabold text-app-text text-[15px] leading-snug mb-2">{course.title}</h4>
                    <p className="text-[12px] text-app-text-muted leading-relaxed mb-3">{course.subtitle}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[course.site.emotionTag, course.site.region, course.site.category]
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 bg-app-bg text-app-text-muted text-[10px] font-bold rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-app-text-muted text-sm py-10">이 감정에 맞는 코스를 아직 준비 중이에요.</p>
            )}
          </div>
        </section>

        {/* Explore Grid */}
        <section>
          <h3 className="text-lg font-bold text-app-text mb-5">전국 성지 탐방</h3>
          <div className="grid grid-cols-2 gap-4">
            {sites.length > 0 ? (
              sites.map((site) => (
                <div 
                  key={site.id} 
                  onClick={() => onSelectSite(site.id)}
                  className="rounded-[20px] overflow-hidden bg-white shadow-sm border border-app-border flex flex-col group cursor-pointer hover:border-brand-violet/30 transition-colors"
                  id={`site-card-${site.id}`}
                >
                  <div className="relative aspect-square overflow-hidden bg-app-bg flex items-center justify-center">
                    {site.imageUrl ? (
                      <img src={site.imageUrl} alt={site.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-3xl">⛪</span>
                    )}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-brand-blue text-[9px] font-bold rounded-lg uppercase tracking-tight shadow-sm">
                      {site.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-app-text truncate text-sm">{site.name}</h4>
                    <p className="text-[11px] text-app-text-muted truncate mt-1">{site.location}</p>
                  </div>
                </div>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-[20px] animate-pulse" />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
