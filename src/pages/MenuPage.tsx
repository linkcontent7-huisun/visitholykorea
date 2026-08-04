import {
  ChevronRight,
  Globe,
  Info,
  LogIn,
  LogOut,
  Settings,
  Share2,
  ShieldQuestion,
  Type,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { signOut } from '@/features/auth/api/auth';
import { useSession } from '@/features/auth/hooks/use-session';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { useMyLogs } from '@/features/records/hooks/use-logs';
import { useSettings } from '@/shared/i18n/use-settings';

interface MenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  sub?: string;
  requiresAuth?: boolean;
  onClick?: () => void;
}

export default function MenuPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { language, setLanguage, largeText, setLargeText } = useSettings();
  const { data: stamps = [] } = useMyStamps();
  const { data: logs = [] } = useMyLogs();

  const isLoggedIn = Boolean(session);
  const displayName =
    (session?.user.user_metadata?.name as string | undefined) || session?.user.email || '순례자';

  const requireAuth = () => navigate(paths.login);

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: '계정 설정',
      items: [
        {
          id: 'profile',
          icon: User,
          label: '내 프로필',
          sub: '회원정보 수정 및 관리',
          requiresAuth: true,
        },
      ],
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
        { id: 'settings', icon: Settings, label: '알림 및 일반 설정' },
      ],
    },
    {
      title: '지원 및 정보',
      items: [
        { id: 'intro', icon: Info, label: '서비스 소개', sub: 'Visit Holy Korea에 대하여' },
        { id: 'help', icon: ShieldQuestion, label: '고객지원', sub: '자주 묻는 질문 / 문의하기' },
        { id: 'share', icon: Share2, label: '친구에게 추천하기' },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <div className="mb-8 rounded-b-[48px] border-b border-app-border bg-white p-10 pt-16 shadow-2xl shadow-gray-200/50">
        <div className="flex items-center gap-7">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-app-border bg-app-bg shadow-inner">
            <User size={40} className="text-gray-300" />
          </div>
          <div className="flex-1">
            <h2 className="mb-1 text-2xl font-extrabold tracking-tight text-app-text">
              {displayName}
              {isLoggedIn ? ' 님' : ''}
            </h2>
            {isLoggedIn ? (
              <p className="text-sm font-bold text-brand-violet">오늘 하루도 평안하신가요?</p>
            ) : (
              <button
                onClick={requireAuth}
                className="flex items-center gap-1.5 text-sm font-bold text-brand-blue"
                id="menu-login-prompt"
              >
                <LogIn size={14} /> 로그인하고 순례 기록 시작하기
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-app-border pt-10">
          <div className="border-r border-app-border text-center">
            <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-widest text-app-text-muted">
              순례지
            </p>
            <p className="text-xl font-extrabold text-app-text">{stamps.length}</p>
          </div>
          <div className="text-center">
            <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-widest text-app-text-muted">
              여행기
            </p>
            <p className="text-xl font-extrabold text-app-text">{logs.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-10 px-8 pb-32">
        {sections.map((section) => (
          <section key={section.title}>
            <h3 className="mb-4 ml-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-app-text-muted">
              {section.title}
            </h3>
            <div className="overflow-hidden rounded-[32px] border border-app-border bg-white shadow-xl shadow-gray-200/40">
              {section.items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.requiresAuth && !isLoggedIn) {
                      requireAuth();
                      return;
                    }
                    item.onClick?.();
                  }}
                  className={`flex w-full items-center gap-5 p-6 transition-colors hover:bg-app-bg ${
                    idx !== section.items.length - 1 ? 'border-b border-app-border' : ''
                  }`}
                  id={`menu-item-${item.id}`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-app-border bg-app-bg text-app-text-muted">
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold tracking-tight text-app-text">{item.label}</h4>
                    {item.sub && (
                      <p className="mt-0.5 text-[11px] font-medium text-app-text-muted">
                        {item.sub}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </button>
              ))}
            </div>
          </section>
        ))}

        <button
          onClick={() => {
            if (isLoggedIn) void signOut();
            else requireAuth();
          }}
          className="flex w-full items-center justify-center gap-2 p-6 text-xs font-bold uppercase tracking-widest text-app-text-muted transition-colors hover:text-red-500"
          id="logout-btn"
        >
          {isLoggedIn ? <LogOut size={16} /> : <LogIn size={16} />}
          {isLoggedIn ? '로그아웃' : '로그인'}
        </button>
      </div>
    </div>
  );
}
