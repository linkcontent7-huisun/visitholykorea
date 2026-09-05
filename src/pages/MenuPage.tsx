import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ChevronRight,
  Globe,
  Info,
  MapPin,
  LogIn,
  LogOut,
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
import { copyText } from '@/shared/lib/map-links';
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
  const { language, setLanguage, largeText, setLargeText, origin, setOrigin, t } =
    useSettings();
  const { data: stamps = [] } = useMyStamps();
  const { data: logs = [] } = useMyLogs();

  const isLoggedIn = Boolean(session);
  const displayName =
    (session?.user.user_metadata?.name as string | undefined) || session?.user.email || t('pilgrimDefaultName');

  const requireAuth = () => navigate(paths.login);

  // 공유 시트가 없는 환경(데스크톱 크롬 등)에서는 링크 복사 결과를
  // "앱 공유하기" 항목의 부제로 잠깐 보여준다 — alert 을 쓰지 않기 위해서다.
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleShare = async () => {
    const shareData = { title: document.title, url: window.location.origin };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 조용히 무시
      }
      return;
    }
    const ok = await copyText(shareData.url);
    setShareStatus(ok ? 'copied' : 'error');
    setTimeout(() => setShareStatus('idle'), 2000);
  };

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: t('accountSettings'),
      items: [
        {
          id: 'profile',
          icon: User,
          label: t('myProfile'),
          sub: t('profileSub'),
          requiresAuth: true,
        },
      ],
    },
    {
      title: t('appSettings'),
      items: [
        {
          id: 'lang',
          icon: Globe,
          label: t('languageSetting'),
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
          label: t('largeTextSetting'),
          sub: largeText ? t('toggleOn') : t('toggleOff'),
          onClick: () => setLargeText(!largeText),
        },
        {
          id: 'origin',
          icon: MapPin,
          label: t('originSetting'),
          sub: origin ? `${origin}에서 가까운 순으로 봅니다` : t('originSub'),
          control: (
            <select
              value={origin ?? ''}
              onChange={(e) => setOrigin((e.target.value || null) as Region | null)}
              aria-label="출발지 선택"
              className="rounded-2xl border border-app-border bg-app-bg px-4 py-2.5 text-sm font-bold text-app-text outline-none focus:ring-2 focus:ring-brand-violet/20"
            >
              <option value="">{t('originAll')}</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ),
        },
      ],
    },
    {
      title: t('supportInfo'),
      items: [
        {
          id: 'intro',
          icon: Info,
          label: t('aboutService'),
          sub: t('aboutServiceSub'),
          onClick: () => navigate(paths.faq),
        },
        {
          id: 'help',
          icon: ShieldQuestion,
          label: t('customerSupport'),
          sub: t('customerSupportSub'),
          onClick: () => navigate(paths.faq),
        },
        {
          id: 'share',
          icon: Share2,
          label: t('shareApp'),
          sub:
            shareStatus === 'copied' ? t('copied') : shareStatus === 'error' ? t('copyFailed') : undefined,
          onClick: () => void handleShare(),
        },
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
              <p className="text-sm font-bold text-brand-violet">{t('menuGreeting')}</p>
            ) : (
              <button
                onClick={requireAuth}
                className="flex items-center gap-1.5 text-sm font-bold text-brand-blue"
                id="menu-login-prompt"
              >
                <LogIn size={14} /> {t('recordsLoginCta')}
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-app-border pt-10">
          <div className="border-r border-app-border text-center">
            <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-widest text-app-text-muted">
              {t('countShrines')}
            </p>
            <p className="text-xl font-extrabold text-app-text">{stamps.length}</p>
          </div>
          <div className="text-center">
            <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-widest text-app-text-muted">
              {t('countJournals')}
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
          {isLoggedIn ? t('logout') : t('login')}
        </button>
      </div>
    </div>
  );
}
