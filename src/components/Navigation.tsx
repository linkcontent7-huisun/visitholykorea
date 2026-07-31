import React from 'react';
import { Home, Map as MapIcon, Compass, BookOpen, Menu } from 'lucide-react';
import { TabType } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { t, wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';
  const tabs = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'map', icon: MapIcon, label: t('map') },
    { id: 'explore', icon: Compass, label: t('explore') },
    { id: 'record', icon: BookOpen, label: t('record') },
    { id: 'menu', icon: Menu, label: t('menu') },
  ];

  return (
    <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full ${widthClass} bg-white border-t border-app-border safe-area-inset-bottom z-50 transition-[max-width] duration-300`}>
      <div className="flex justify-around items-center h-[70px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const isExplore = tab.id === 'explore';
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabType)}
              className={`flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200 ${
                isActive ? 'text-brand-blue' : 'text-[#ADB5BD]'
              }`}
              id={`tab-${tab.id}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isActive 
                  ? (isExplore ? 'bg-brand-violet rounded-full' : 'bg-brand-blue text-white') 
                  : 'bg-app-border'
              }`}>
                <Icon size={18} className={isActive ? 'text-white' : 'text-[#ADB5BD]'} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
