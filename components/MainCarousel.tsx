
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HolySite } from '../types';
import { HOLY_SITES } from '../constants';

interface MainCarouselProps {
  onSiteClick: (site: HolySite) => void;
}

interface ThemedSite extends HolySite {
  theme: string;
}

const MainCarousel: React.FC<MainCarouselProps> = ({ onSiteClick }) => {
  const [themedSites, setThemedSites] = useState<ThemedSite[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const themes = [
    "에디터 추천 성지",
    "이번 달에 꼭 가봐야 하는 성지",
    "역사적 의미가 깊은 곳",
    "가족여행으로 가기 좋은 곳",
    "피정하기 좋은 곳"
  ];

  useEffect(() => {
    // 특정 테마에 어울리는 성지들을 매칭 (데이터셋 내에서 선정)
    const selectedIds = ['myeongdong', 'seosomun', 'yakhyeon', 'gahoedong', 'baeron'];
    const selectedSites = selectedIds.map((id, index) => {
      const site = HOLY_SITES.find(s => s.id === id) || HOLY_SITES[index];
      return { ...site, theme: themes[index] };
    });
    setThemedSites(selectedSites);
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const itemWidth = scrollRef.current.offsetWidth * 0.85;
      const index = Math.round(scrollLeft / itemWidth);
      if (index !== activeIndex && index < themes.length) {
        setActiveIndex(index);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollRef.current && index >= 0 && index < themedSites.length) {
      const itemWidth = scrollRef.current.offsetWidth * 0.85;
      const gap = 16; // gap-4 in tailwind is 1rem (16px)
      scrollRef.current.scrollTo({
        left: index * (itemWidth + gap),
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToIndex(activeIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToIndex(activeIndex + 1);
  };

  if (themedSites.length === 0) return null;

  return (
    <section className="relative w-full h-[75vh] md:h-[80vh] pt-20 overflow-hidden bg-slate-100 group/carousel">
      {/* Navigation Arrows */}
      <div className="absolute inset-y-0 left-0 z-30 flex items-center pl-2 md:pl-10 pointer-events-none">
        <button 
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white transition-all pointer-events-auto hover:bg-white/40 active:scale-90 ${activeIndex === 0 ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100 shadow-xl'}`}
        >
          <ChevronLeft size={32} strokeWidth={2.5} />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 z-30 flex items-center pr-2 md:pr-10 pointer-events-none">
        <button 
          onClick={handleNext}
          disabled={activeIndex === themedSites.length - 1}
          className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white transition-all pointer-events-auto hover:bg-white/40 active:scale-90 ${activeIndex === themedSites.length - 1 ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100 shadow-xl'}`}
        >
          <ChevronRight size={32} strokeWidth={2.5} />
        </button>
      </div>

      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-6 md:px-20"
      >
        {themedSites.map((site, index) => (
          <div 
            key={`${site.id}-${index}`}
            onClick={() => onSiteClick(site)}
            className="relative min-w-[85%] md:min-w-[45%] h-[90%] snap-center rounded-[40px] overflow-hidden shadow-2xl cursor-pointer group"
          >
            {/* Background Image */}
            <img 
              src={site.imageUrl} 
              alt={site.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col p-8 md:p-12 text-white">
              {/* Top: Page Indicator */}
              <div className="flex justify-between items-start">
                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest">
                  {index + 1} / {themedSites.length}
                </span>
              </div>

              {/* Middle-Bottom: Theme & Place Name */}
              <div className="mt-auto space-y-2">
                <div className="inline-block px-4 py-1 bg-blue-600/90 backdrop-blur-sm rounded-lg mb-2">
                  <span className="text-sm md:text-base font-bold tracking-tight">
                    {site.theme}
                  </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-2xl">
                  {site.name}
                </h2>
              </div>
            </div>
          </div>
        ))}
        {/* Spacer for end scroll */}
        <div className="min-w-[10%] h-full"></div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center mt-6 gap-2 pb-12">
        {themes.map((_, i) => (
          <button 
            key={i} 
            onClick={() => scrollToIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 hover:bg-blue-400 ${
              activeIndex === i ? 'w-10 bg-blue-600' : 'w-2 bg-slate-300'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default MainCarousel;
