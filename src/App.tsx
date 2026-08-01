/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import { TabType, HolySite } from './types';
import HomeTab from './components/tabs/HomeTab';
import MapTab from './components/tabs/MapTab';
import ExploreTab from './components/tabs/ExploreTab';
import RecordTab from './components/tabs/RecordTab';
import MenuTab from './components/tabs/MenuTab';
import SiteDetail from './pages/SiteDetail';
import AIGuide from './components/AIGuide';
import AuthScreen from './components/AuthScreen';
import SearchOverlay from './components/SearchOverlay';
import HealingQuiz from './components/HealingQuiz';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from './contexts/SettingsContext';
import { Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isAIGuideOpen, setIsAIGuideOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHealingQuizOpen, setIsHealingQuizOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const { wideView, setWideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Simple routing simulation
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            onSelectSite={setSelectedSiteId}
            onOpenAIGuide={() => setIsAIGuideOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenHealingQuiz={() => setIsHealingQuizOpen(true)}
          />
        );
      case 'map':
        return <MapTab onSelectSite={setSelectedSiteId} />;
      case 'explore':
        return <ExploreTab onSelectSite={setSelectedSiteId} />;
      case 'record':
        return <RecordTab onSelectSite={setSelectedSiteId} />;
      case 'menu':
        return (
          <MenuTab
            session={session}
            onRequireAuth={() => setIsAuthOpen(true)}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <HomeTab
            onSelectSite={setSelectedSiteId}
            onOpenAIGuide={() => setIsAIGuideOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenHealingQuiz={() => setIsHealingQuizOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <div className={`relative ${widthClass} mx-auto min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 mb-16 md:shadow-2xl transition-[max-width] duration-300`}>
        <AnimatePresence mode="wait">
          {!selectedSiteId ? (
            <motion.div
              key="tab-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
              <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>
          ) : (
            <motion.div
              key="detail-view"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 left-1/2 -translate-x-1/2 w-full ${widthClass} z-[60] bg-white overflow-y-auto`}
            >
              <SiteDetail siteId={selectedSiteId} onBack={() => setSelectedSiteId(null)} onSelectSite={setSelectedSiteId} />
            </motion.div>
          )}
        </AnimatePresence>

        <AIGuide isOpen={isAIGuideOpen} onClose={() => setIsAIGuideOpen(false)} />

        <HealingQuiz
          isOpen={isHealingQuizOpen}
          onClose={() => setIsHealingQuizOpen(false)}
          onSelectSite={(id) => setSelectedSiteId(id)}
        />

        {isSearchOpen && (
          <SearchOverlay
            onClose={() => setIsSearchOpen(false)}
            onSiteClick={(siteId) => setSelectedSiteId(siteId)}
          />
        )}

        {isAuthOpen && (
          <AuthScreen onBack={() => setIsAuthOpen(false)} onSuccess={() => setIsAuthOpen(false)} />
        )}
      </div>

      {/* 개발/검수용 미리보기 전환 버튼: 모바일 폭 ↔ 넓은 화면 폭. 실제 서비스 기능 아님. */}
      <button
        onClick={() => setWideView(!wideView)}
        className="fixed bottom-4 right-4 z-[999] w-12 h-12 rounded-full bg-gray-900 text-white shadow-xl flex items-center justify-center hover:bg-gray-700 transition-colors"
        id="preview-width-toggle"
        title={wideView ? '모바일 화면으로 보기' : '넓은 화면으로 보기'}
      >
        {wideView ? <Smartphone size={20} /> : <Monitor size={20} />}
      </button>
    </div>
  );
}

