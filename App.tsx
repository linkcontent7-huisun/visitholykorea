
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import MainCarousel from './components/MainCarousel';
import SiteCard from './components/SiteCard';
import FloatingButtons from './components/FloatingButtons';
import AiAssistant from './components/AiAssistant';
import BottomNav from './components/BottomNav';
import { HOLY_SITES } from './constants';
import { HolySite, SiteCategory } from './types';
import { Search, X, Calendar, Map, Info, MessageCircle, Image as ImageIcon, LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SiteCategory | 'ALL'>('ALL');
  const [selectedSite, setSelectedSite] = useState<HolySite | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'album'>('grid');
  const [activeTab, setActiveTab] = useState('home');

  const filteredSites = useMemo(() => {
    return HOLY_SITES.filter(site => {
      const matchesSearch = site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           site.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || site.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'map' || tab === 'recommend') {
      document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'more') {
      // Typically opens a menu, for now we can toggle the search
      document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20 md:pb-0">
      <Header onSearchClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })} />
      
      <main>
        {/* Main Side-scrolling Carousel */}
        <MainCarousel onSiteClick={setSelectedSite} />

        {/* AI Chat Pill Button (Matches Screenshot: orange mascot, specific colors) */}
        <div className="px-6 -mt-10 relative z-20 flex justify-center">
          <button 
            onClick={() => setShowAiAssistant(true)}
            className="w-full max-w-lg bg-[#e8effd] rounded-full py-3 px-4 shadow-xl border border-white flex items-center justify-between group hover:scale-[1.02] transition-all duration-300 active:scale-95"
          >
            <div className="flex items-center gap-3">
              {/* Mascot Icon placeholder similar to Visit Seoul's orange bird */}
              <div className="w-10 h-10 bg-[#ff6b35] rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                 <img src="https://api.dicebear.com/7.x/bottts/svg?seed=orange&backgroundColor=ff6b35" alt="Mascot" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-[#1e3a8a] text-sm md:text-[15px] font-bold tracking-tight">
                성지 순례에 대한 모든 것! <span className="text-[#1e40af]">무엇이든 물어보세요</span>
              </span>
            </div>
            <div className="bg-[#474747] w-9 h-9 flex items-center justify-center rounded-full text-white/90 shadow-md">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          </button>
        </div>

        {/* Introduction Section */}
        <section className="py-20 px-6 bg-white mt-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="text-blue-600 font-bold tracking-[0.3em] text-xs uppercase">Holy Places & Historic Sites</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">성지 / 사적지 앨범</h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
            <p className="text-slate-500 leading-relaxed text-lg font-light max-w-2xl mx-auto">
              가톨릭 굿뉴스(Goodnews)의 방대한 자료를 현대적인 감각으로 재구성했습니다.<br />
              전국 방방곡곡에 숨겨진 거룩한 역사와 풍경을 한눈에 확인하세요.
            </p>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section id="search-section" className="py-12 px-6 max-w-7xl mx-auto">
          <div className="mb-12 space-y-10">
            <div className="relative max-w-2xl mx-auto group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
              <input 
                type="text"
                placeholder="장소명, 지역명, 내용을 검색하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-white rounded-[30px] border-none shadow-xl focus:ring-4 focus:ring-blue-100 transition-all text-lg placeholder:text-slate-300"
              />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar w-full md:w-auto">
                {['ALL', ...Object.values(SiteCategory)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as any)}
                    className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 -translate-y-0.5' 
                      : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {cat === 'ALL' ? '전체보기' : cat}
                  </button>
                ))}
              </div>
              
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('album')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'album' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ImageIcon size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Content Rendering */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredSites.map(site => (
                <SiteCard 
                  key={site.id} 
                  site={site} 
                  onClick={setSelectedSite} 
                />
              ))}
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 animate-in fade-in duration-500">
              {filteredSites.map((site) => (
                <div 
                  key={`album-${site.id}`}
                  onClick={() => setSelectedSite(site)}
                  className="relative group cursor-pointer overflow-hidden rounded-[40px] shadow-lg break-inside-avoid border-4 border-white"
                >
                  <img src={site.imageUrl} alt={site.name} className="w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-8">
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">{site.category}</span>
                    <p className="text-white font-black text-xl mb-1">{site.name}</p>
                    <p className="text-white/70 text-sm line-clamp-1">{site.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredSites.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium">일치하는 성지 정보가 없습니다.</p>
              <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory('ALL');}}
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                필터 초기화
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Utilities */}
      <div className="hidden md:block">
        <FloatingButtons onAiAssistantClick={() => setShowAiAssistant(true)} />
      </div>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Detail Modal (Glassmorphism Style) */}
      {selectedSite && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[50px] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="w-full md:w-1/2 relative h-80 md:h-auto overflow-hidden">
              <img src={selectedSite.imageUrl} className="w-full h-full object-cover animate-in fade-in duration-700" alt={selectedSite.name} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent md:hidden"></div>
              <button 
                onClick={() => setSelectedSite(null)}
                className="absolute top-8 left-8 p-3 bg-black/30 backdrop-blur-xl text-white rounded-full md:hidden border border-white/20"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="w-full md:w-1/2 p-8 md:p-14 overflow-y-auto bg-white flex flex-col">
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-3">
                  <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">{selectedSite.category}</span>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">{selectedSite.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedSite(null)}
                  className="hidden md:flex p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                >
                  <X size={32} />
                </button>
              </div>

              <div className="space-y-10 flex-1">
                <div className="flex items-center gap-4 text-slate-500 bg-slate-50 p-4 rounded-3xl">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-500">
                    <Map size={20} />
                  </div>
                  <span className="text-sm md:text-base font-medium">{selectedSite.location}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 font-black text-slate-900 text-lg uppercase tracking-wider">
                    <Info size={20} className="text-blue-600" />
                    공간 소개
                  </div>
                  <p className="text-slate-600 leading-relaxed text-lg md:text-xl font-light">{selectedSite.description}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 font-black text-slate-900 text-lg uppercase tracking-wider">
                    <Calendar size={20} className="text-blue-600" />
                    역사적 증언
                  </div>
                  <div className="bg-blue-50/50 p-6 md:p-8 rounded-[40px] border border-blue-100">
                    <p className="text-slate-700 leading-relaxed italic">"{selectedSite.history}"</p>
                  </div>
                </div>
              </div>

              <div className="pt-12 mt-auto flex gap-4">
                <button className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-95">
                  순례길 안내 (Map)
                </button>
                <button className="px-8 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-bold hover:bg-slate-200 transition-all active:scale-95">
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAiAssistant && <AiAssistant onClose={() => setShowAiAssistant(false)} />}

      <footer className="bg-white border-t border-slate-100 py-20 px-6 mt-20 mb-20 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="space-y-4">
            <span className="text-slate-900 font-black tracking-[0.3em] text-2xl">K-HOLY SITES</span>
            <p className="text-slate-400 text-sm max-w-xs mx-auto md:mx-0">대한민국 천주교 성지 순례의 모든 가치를 디지털 앨범으로 담아냅니다.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500 font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Sitemap</a>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-slate-400 text-xs">© 2024 K-HolySites. Data provided by Catholic Goodnews.</p>
            <div className="flex gap-4 opacity-30">
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
