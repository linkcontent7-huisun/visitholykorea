import React from 'react';
import { User, Heart, Settings, Globe, Info, LogOut, ChevronRight, Share2, ShieldQuestion, LogIn, Type } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { useSettings } from '../../contexts/SettingsContext';

interface MenuTabProps {
  session: Session | null;
  onRequireAuth: () => void;
  onLogout: () => void;
}

export default function MenuTab({ session, onRequireAuth, onLogout }: MenuTabProps) {
  const isLoggedIn = !!session;
  const displayName = (session?.user.user_metadata?.name as string | undefined) || session?.user.email || '순례자';
  const { language, setLanguage, largeText, setLargeText } = useSettings();

  const sections = [
    {
      title: '계정 설정',
      items: [
        { id: 'profile', icon: User, label: '내 프로필', sub: '회원정보 수정 및 관리' },
        { id: 'favorites', icon: Heart, label: '즐겨찾는 성지', sub: '가보고 싶은 곳 12곳' },
      ]
    },
    {
      title: '앱 설정',
      items: [
        {
          id: 'lang',
          icon: Globe,
          label: '언어 설정 / Language',
          sub: language === 'ko' ? '한국어(KR)' : 'English(EN)',
          onClick: () => setLanguage(language === 'ko' ? 'en' : 'ko'),
        },
        {
          id: 'largeText',
          icon: Type,
          label: '큰 글자 모드',
          sub: largeText ? '켜짐' : '꺼짐',
          onClick: () => setLargeText(!largeText),
        },
        { id: 'settings', icon: Settings, label: '알림 및 일반 설정', sub: '' },
      ]
    },
    {
      title: '지원 및 정보',
      items: [
        { id: 'intro', icon: Info, label: '서비스 소개', sub: 'Visit Holy Korea에 대하여' },
        { id: 'help', icon: ShieldQuestion, label: '고객지원', sub: '자주 묻는 질문 / 문의하기' },
        { id: 'share', icon: Share2, label: '친구에게 추천하기', sub: '' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      {/* Mini Profile Card */}
      <div className="p-10 pt-16 bg-white rounded-b-[48px] shadow-2xl shadow-gray-200/50 mb-8 border-b border-app-border">
        <div className="flex items-center gap-7">
          <div className="w-20 h-20 rounded-3xl bg-app-bg flex items-center justify-center border border-app-border shadow-inner group overflow-hidden relative">
            <User size={40} className="text-gray-300 relative z-10" />
            <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-app-text tracking-tight mb-1">{displayName}{isLoggedIn ? ' 님' : ''}</h2>
            {isLoggedIn ? (
              <p className="text-brand-violet text-sm font-bold">오늘 하루도 평안하신가요?</p>
            ) : (
              <button onClick={onRequireAuth} className="flex items-center gap-1.5 text-brand-blue text-sm font-bold" id="menu-login-prompt">
                <LogIn size={14} /> 로그인하고 순례 기록 시작하기
              </button>
            )}
          </div>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-6 border-t border-app-border pt-10">
            <div className="text-center">
                <p className="text-[9px] font-extrabold text-app-text-muted mb-1.5 uppercase tracking-widest">순례지</p>
                <p className="text-xl font-extrabold text-app-text">12</p>
            </div>
            <div className="text-center border-x border-app-border">
                <p className="text-[9px] font-extrabold text-app-text-muted mb-1.5 uppercase tracking-widest">즐겨찾기</p>
                <p className="text-xl font-extrabold text-app-text">24</p>
            </div>
            <div className="text-center">
                <p className="text-[9px] font-extrabold text-app-text-muted mb-1.5 uppercase tracking-widest">여행기</p>
                <p className="text-xl font-extrabold text-app-text">4</p>
            </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="flex-1 px-8 pb-32 space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-[11px] font-extrabold text-app-text-muted uppercase tracking-[0.2em] mb-4 ml-4">{section.title}</h3>
            <div className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-gray-200/40 border border-app-border">
              {section.items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if ((item.id === 'profile' || item.id === 'favorites') && !isLoggedIn) {
                      onRequireAuth();
                      return;
                    }
                    (item as { onClick?: () => void }).onClick?.();
                  }}
                  className={`w-full flex items-center gap-5 p-6 hover:bg-app-bg transition-colors ${idx !== section.items.length - 1 ? 'border-b border-app-border' : ''}`}
                  id={`menu-item-${item.id}`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-app-bg flex items-center justify-center text-app-text-muted border border-app-border">
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-app-text tracking-tight">{item.label}</h4>
                    {item.sub && <p className="text-[11px] text-app-text-muted font-medium mt-0.5">{item.sub}</p>}
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={isLoggedIn ? onLogout : onRequireAuth}
          className="w-full flex items-center justify-center gap-2 p-6 text-app-text-muted text-xs font-bold hover:text-red-500 transition-colors uppercase tracking-widest"
          id="logout-btn"
        >
          {isLoggedIn ? <LogOut size={16} /> : <LogIn size={16} />}
          {isLoggedIn ? '로그아웃' : '로그인'}
        </button>
      </div>
    </div>
  );
}
