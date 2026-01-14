
import React from 'react';
import { Home, Map as MapIcon, Star, Heart, LayoutGrid } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'map', label: '지도', icon: MapIcon },
    { id: 'recommend', label: '추천여행', icon: Star },
    { id: 'trips', label: '나만의 여행지', icon: Heart },
    { id: 'more', label: '더보기', icon: LayoutGrid },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#3b82f6] pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.1)] md:hidden h-[72px]">
      <div className="flex justify-around items-center h-full px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-all active:scale-95 relative"
            >
              <div className={`${isActive ? 'text-white' : 'text-white/70'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2.2} />
                {isActive && tab.id === 'home' && (
                  <div className="absolute top-0 right-[35%] w-1 h-1 bg-white rounded-full"></div>
                )}
              </div>
              <span className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-white/70'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
