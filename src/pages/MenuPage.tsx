import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ChevronRight,
  Compass,
  Globe,
  Info,
  MapPin,
  LogIn,
  LogOut,
  Navigation,
  ShieldQuestion,
  SlidersHorizontal,
  Type,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, TOP_NAV_ITEMS } from '@/app/layouts/nav-items';
import { paths } from '@/app/routes/paths';
import { useAdminAccess } from '@/features/admin/hooks/use-admin';
import { signOut } from '@/features/auth/api/auth';
import { useSession } from '@/features/auth/hooks/use-session';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { useMyLogs } from '@/features/records/hooks/use-logs';
import {
  fillPlaceholders,
  LANGUAGES,
  LANGUAGE_LABEL,
  type Language,
  type TranslationKey,
} from '@/shared/i18n/dictionary';
import { localizeRegionName } from '@/shared/i18n/domain-labels';
import { InstallShareSheet } from '@/shared/components/ui/InstallShareSheet';
import { TextSizePicker } from '@/shared/i18n/TextSizePicker';
import { useSettings } from '@/shared/i18n/use-settings';
import { SUBMISSION_MODE } from '@/shared/lib/feature-flags';
import { REGIONS, type Region } from '@/shared/lib/regions';

/** GPS 상태별 부제. 성공 후 켜져 있을 때는 origin 항목 쪽이 현재 위치 안내를 맡는다. */
function gpsLocationSub(
  status: 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported' | 'error',
  t: (key: TranslationKey) => string,
): string | undefined {
  switch (status) {
    case 'loading':
      return t('currentLocationLoading');
    case 'denied':
      return t('currentLocationDenied');
    case 'unsupported':
      return t('currentLocationUnsupported');
    case 'error':
      return t('currentLocationError');
    case 'granted':
      return t('clearCurrentLocationButton');
    default:
      return undefined;
  }
}

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
  // 관리자 콘솔 입구. 권한이 없는 사람에게는 아예 그리지 않는다.
  const { canEnter: canEnterAdmin } = useAdminAccess();
  const {
    language,
    setLanguage,
    origin,
    setOrigin,
    gpsLocation,
    gpsStatus,
    requestGpsLocation,
    clearGpsLocation,
    t,
  } = useSettings();
  const { data: stamps = [] } = useMyStamps();
  const { data: logs = [] } = useMyLogs();

  const isLoggedIn = Boolean(session);
  const displayName =
    (session?.user.user_metadata?.name as string | undefined) || session?.user.email || t('pilgrimDefaultName');

  const requireAuth = () => navigate(paths.login);

  // 「홈화면 추가」(설치 + 링크 공유)는 이제 시트 하나로 — 하단 탭 넷째 자리와 같은 것
  const [installSheetOpen, setInstallSheetOpen] = useState(false);

  /**
   * 맨 위 「전체 서비스」 — 앱이 주는 것을 한눈에. 하단 탭 + 상단 메뉴 항목을 합치되
   * 이 화면 자신(전체)은 빼고, 탭에 없는 붐빔 피하기를 더한다 (2026-09-13 사장님 요청).
   */
  const services: { id: string; icon: LucideIcon; label: string; to?: string; onClick?: () => void }[] = [
    ...[...NAV_ITEMS, ...TOP_NAV_ITEMS.filter((i) => !NAV_ITEMS.some((n) => n.id === i.id))]
      .filter((i) => i.id !== 'menu')
      .map((i) =>
        i.action === 'install'
          ? { id: i.id, icon: i.icon as LucideIcon, label: t(i.labelKey), onClick: () => setInstallSheetOpen(true) }
          : { id: i.id, icon: i.icon as LucideIcon, label: t(i.labelKey), to: i.to },
      ),
    { id: 'alternatives', icon: Compass, label: t('quietHeroTitle'), to: paths.alternatives },
  ];

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
              aria-label={t('languageSelectAria')}
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
          label: t('textSizeButton'),
          control: <TextSizePicker inline />,
        },
        {
          id: 'gps',
          icon: Navigation,
          label: t('useCurrentLocationButton'),
          sub: gpsLocationSub(gpsStatus, t),
          onClick: gpsLocation ? clearGpsLocation : requestGpsLocation,
        },
        {
          id: 'origin',
          icon: MapPin,
          label: t('originSetting'),
          sub: gpsLocation
            ? t('currentLocationActiveSub')
            : origin
              ? fillPlaceholders(t('originNearbyOrder'), { origin: localizeRegionName(origin, language) })
              : t('originSub'),
          control: (
            <select
              value={origin ?? ''}
              onChange={(e) => setOrigin((e.target.value || null) as Region | null)}
              aria-label={t('originSelectAria')}
              disabled={Boolean(gpsLocation)}
              className="rounded-2xl border border-app-border bg-app-bg px-4 py-2.5 text-sm font-bold text-app-text outline-none focus:ring-2 focus:ring-brand-violet/20 disabled:opacity-50"
            >
              <option value="">{t('originAll')}</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {localizeRegionName(r, language)}
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
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <InstallShareSheet open={installSheetOpen} onClose={() => setInstallSheetOpen(false)} />

      {/* 전체 서비스 — 이 화면의 첫 줄. 아이콘 옆에 이름, 4열(PC 6열) */}
      <section className="px-8 pt-8">
        <h1 className="mb-4 font-display text-2xl font-bold tracking-tight text-app-text">
          {t('allServices')}
        </h1>
        <ul className="grid grid-cols-4 gap-2 lg:grid-cols-6" id="all-services">
          {services.map((svc) => {
            const inner = (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-app-bg text-brand-violet">
                  <svc.icon size={22} />
                </span>
                <span className="break-keep text-center text-[0.75rem] font-bold leading-tight text-app-text">
                  {svc.label}
                </span>
              </>
            );
            const cls =
              'flex w-full flex-col items-center gap-1.5 rounded-2xl border border-app-border bg-white px-1 py-3 transition-colors hover:border-brand-violet';
            return (
              <li key={svc.id}>
                {svc.to ? (
                  <Link to={svc.to} className={cls} id={`service-${svc.id}`}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={svc.onClick} className={cls} id={`service-${svc.id}`}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 내 정보 — 로그인 안 했으면 로그인·회원가입 입구 */}
      <div className="mx-8 mb-8 mt-6 rounded-[32px] border border-app-border bg-white p-6 shadow-xl shadow-gray-200/40">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-app-border bg-app-bg shadow-inner">
            <User size={32} className="text-gray-300" />
          </div>
          <div className="flex-1">
            <h2 className="mb-1 text-xl font-extrabold tracking-tight text-app-text">
              {displayName}
              {/* 「님」은 한국어 존칭 — 다른 언어에는 붙일 말이 없다 */}
              {isLoggedIn && language === 'ko' ? ' 님' : ''}
            </h2>
            {isLoggedIn ? (
              <p className="text-sm font-bold text-brand-violet">{t('menuGreeting')}</p>
            ) : (
              <button
                onClick={requireAuth}
                className="flex items-center gap-1.5 text-sm font-bold text-brand-blue"
                id="menu-login-prompt"
              >
                <LogIn size={14} /> {t('login')} · {t('signup')}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 border-t border-app-border pt-6">
          <div className="border-r border-app-border text-center">
            <p className="mb-1.5 text-[0.5625rem] font-extrabold uppercase tracking-widest text-app-text-muted">
              {t('countShrines')}
            </p>
            <p className="text-xl font-extrabold text-app-text">{stamps.length}</p>
          </div>
          <div className="text-center">
            <p className="mb-1.5 text-[0.5625rem] font-extrabold uppercase tracking-widest text-app-text-muted">
              {t('countJournals')}
            </p>
            <p className="text-xl font-extrabold text-app-text">{logs.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-10 px-8 pb-32">
        {sections.map((section) => (
          <section key={section.title}>
            <h3 className="mb-4 ml-4 text-[0.6875rem] font-extrabold uppercase tracking-[0.2em] text-app-text-muted">
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
                        <p className="mt-0.5 text-[0.6875rem] font-medium text-app-text-muted">
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

        {canEnterAdmin && !SUBMISSION_MODE && (
          // 제출판은 본선 기능만 보이게 한다 — T-013
          // 운영자 전용 입구라 다국어로 만들지 않는다 — 이 줄을 보는 사람은 한국인 운영자뿐이다.
          <button
            onClick={() => navigate(paths.admin)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-app-border bg-white p-5 text-sm font-bold text-app-text"
            id="admin-console-btn"
          >
            <SlidersHorizontal size={16} />
            관리자 콘솔
          </button>
        )}

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
