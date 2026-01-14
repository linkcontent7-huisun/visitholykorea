
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative h-[85vh] w-full overflow-hidden flex flex-col justify-center px-8 lg:px-24">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/church-hero/1920/1080" 
          alt="Myeongdong Cathedral" 
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 hero-gradient"></div>
      </div>

      <div className="relative z-10 text-white max-w-2xl space-y-6">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight drop-shadow-lg">
            한국에서 만나는<br />
            마법 같은 신앙의 여정
          </h2>
          <p className="text-lg md:text-xl text-white/90 font-light drop-shadow-md">
            눈부신 은총 아래<br />
            펼쳐지는 거룩한 성지의 풍경
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button className="px-8 py-3 border border-white/50 bg-white/10 backdrop-blur-md text-white font-medium hover:bg-white hover:text-black transition-all duration-300">
            Learn more
          </button>
          <button className="px-8 py-3 border border-white/50 bg-white/10 backdrop-blur-md text-white font-medium hover:bg-white hover:text-black transition-all duration-300">
            Visit Guide
          </button>
        </div>
      </div>

      {/* Scroll Indicators / Pagination inspired by the UI */}
      <div className="absolute bottom-12 left-8 lg:left-24 flex items-center gap-4 text-white/60 text-sm font-medium">
        <span>01</span>
        <div className="w-24 h-[2px] bg-white/20 relative">
          <div className="absolute left-0 top-0 h-full w-1/3 bg-white"></div>
        </div>
        <span>04</span>
      </div>
    </section>
  );
};

export default Hero;
