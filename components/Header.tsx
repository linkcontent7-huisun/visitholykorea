
import React, { useState, useEffect } from 'react';
import { Menu, Search, Heart, X, Sun, Globe } from 'lucide-react';

interface HeaderProps {
  onSearchClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-1' : 'bg-transparent py-4'}`}>
        {/* Top Info Bar - Scrolled 시 숨김 */}
        {!isScrolled && (
          <div className="hidden md:flex bg-black/20 backdrop-blur-md border-b border-white/10 px-6 py-2 justify-end gap-6 text-white text-[10px] font-bold tracking-widest uppercase">
            <div className="flex items-center gap-1.5">
              <span>SEOUL</span>
              <span className="text-violet-300">14.0°C</span>
              <Sun size={12} className="text-violet-400" />
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-violet-200 transition-colors">
              <Globe size={12} />
              <span>KOREAN</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className={`p-2.5 rounded-full transition-all ${isScrolled ? 'text-slate-800 hover:bg-slate-100' : 'text-white hover:bg-white/20 bg-black/20'}`}
          >
            <Menu size={26} />
          </button>
          
          <div className="flex items-center cursor-pointer group transition-transform duration-500 hover:scale-105">
            {/* 시인성이 극대화된 VISIT Holy 로고 */}
            <div className={`flex items-baseline gap-1.5 px-6 py-2 rounded-full transition-all duration-500 ${isScrolled ? '' : 'bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl'}`}>
                <span className={`font-black tracking-tighter text-2xl md:text-3xl transition-all duration-500 ${
                  isScrolled ? 'text-[#1e1b4b]' : 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]'
                }`}>
                  VISIT
                </span>
                <span 
                  style={{ fontFamily: 'Georgia, serif' }} 
                  className={`italic font-semibold tracking-tight text-2xl md:text-3xl transition-all duration-500 ${
                    isScrolled 
                    ? 'text-[#7c3aed]' 
                    : 'text-violet-100 drop-shadow-[0_2px_15px_rgba(139,92,246,1)]'
                  }`}
                >
                  Holy
                </span>
                <span className={`ml-0.5 w-2 h-2 rounded-full mb-1 transition-all duration-500 ${
                  isScrolled ? 'bg-[#7c3aed]' : 'bg-[#a78bfa] shadow-[0_0_15px_rgba(167,139,250,1)]'
                }`}></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onSearchClick}
              className={`p-2.5 rounded-full transition-all ${isScrolled ? 'text-slate-800 hover:bg-slate-100' : 'text-white hover:bg-white/20 bg-black/20'}`}
            >
              <Search size={22} />
            </button>
            <button className={`hidden sm:block p-2.5 rounded-full transition-all ${isScrolled ? 'text-slate-800 hover:bg-slate-100' : 'text-white hover:bg-white/20 bg-black/20'}`}>
              <Heart size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl p-8 animate-in slide-in-from-left duration-500 rounded-r-[40px] border-r border-violet-100">
            <div className="flex justify-between items-center mb-16">
               <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
                    <Sun size={20} />
                </div>
                <span className="text-xl font-black text-slate-800 uppercase tracking-widest">Guide</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-3 text-slate-400 hover:bg-violet-50 hover:text-violet-800 rounded-full transition-all">
                <X size={28} />
              </button>
            </div>
            
            <nav className="space-y-10">
              {[
                { label: '홈', href: '#' },
                { label: '성지 찾기', href: '#' },
                { label: '순례길 안내', href: '#' },
                { label: '나만의 여행기', href: '#' }
              ].map((item, idx) => (
                <a 
                  key={idx}
                  href={item.href} 
                  className="flex items-center gap-6 text-3xl font-black text-slate-800 hover:text-violet-600 transition-all group"
                >
                  <span className="w-1.5 h-1.5 bg-violet-600 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300"></span>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="absolute bottom-12 left-10 right-10">
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-black tracking-[0.3em] uppercase mb-1">Brand Identity</span>
                  <p className="text-sm text-slate-900 font-black tracking-tighter">VISIT <span className="text-violet-600 font-semibold italic">Holy</span></p>
                </div>
                <Globe size={18} className="text-slate-300" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
