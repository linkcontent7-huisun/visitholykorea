import type { ReactNode } from 'react';
import {
  ChevronRight,
  Globe,
  Info,
  MapPin,
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
import { LANGUAGES, LANGUAGE_LABEL, type Language } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { REGIONS, type Region } from '@/shared/lib/regions';

interface MenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  sub?: string;
  requiresAuth?: boolean;
  onClick?: () => void;
  /**
   * 오른쪽에 놓을 직접 조작 요소(예: 출발지 고르기).
   * 이게 있으면 행 전체를 버튼으로 만들지 않는다 — 버튼 안에 버튼·셀렉트를 넣으면
   * 마크업이 깨지고 키보드 조작도 어긋난다.
   */
  control?: ReactNode;
}

export default function MenuPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { language, setLanguage, largeText, setLargeText, origin, setOrigin } = useSettings();
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
          // WYD 2027 공식 언어 6개. 목록은 각자의 언어로 적어야 자기 언어를 찾을 수 있다.
          sub: LANGUAGE_LABEL[language],
          control: (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label="언어 선택 / Select language"
              className="rounded-2xl border border-app-border bg-app-bg px-4 py-2.5 text-sm font-bold text-app-text outline-none focus:ring-2 focus:ring-brand-violet/20"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABEL[lang]}
                </option>
              ))}
            </select>
          ),
        },
        {
          id: 'largeText',
          icon: Type,
          label: '큰 글자 모드',
          sub: largeText ? '켜짐' : '꺼짐',
          onClick: () => setLargeText(!largeText),
        },
        {
          id: 'origin',
          icon: MapPin,
          label: '출발지',
          sub: origin ? `${origin}에서 가까운 순으로 봅니다` : '정하면 가까운 성지부터 보여드려요',
          control: (
            <select
              value={origin ?? ''}
              onChange={(e) => setOrigin((e.target.value || null) as Region | null)}
              aria-label="출발지 선택"
              className="rounded-2xl border border-app-border bg-app-bg px-4 py-2.5 text-sm font-bold text-app-text outline-none focus:ring-2 focus:ring-brand-violet/20"
            >
              <option value="">전국</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ),
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
              {section.items.map((item, idx) => {
                const rowClass = `flex w-full items-center gap-5 p-6 ${
                  idx !== section.items.length - 1 ? 'border-b border-app-border' : ''
                }`;
                const body = (
                  <>
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
                  </>
                );

                if (item.control) {
                  return (
                    <div key={item.id} className={rowClass} id={`menu-item-${item.id}`}>
                      {body}
                      {item.control}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.requiresAuth && !isLoggedIn) {
                        requireAuth();
                        return;
                      }
                      item.onClick?.();
                    }}
                    className={`${rowClass} transition-colors hover:bg-app-bg`}
                    id={`menu-item-${item.id}`}
                  >
                    {body}
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                );
              })}
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
