import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ChevronRight,
  Footprints,
  Globe,
  Map as MapIcon,
  Smartphone,
  Info,
  MapPin,
  LogIn,
  LogOut,
  Navigation,
  Settings,
  ShieldQuestion,
  SlidersHorizontal,
  Type,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useAdminAccess } from '@/features/admin/hooks/use-admin';
import { signOut } from '@/features/auth/api/auth';
import { useSession } from '@/features/auth/hooks/use-session';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { useMyLogs } from '@/features/records/hooks/use-logs';
import {
  ENABLED_LANGUAGES,
  fillPlaceholders,
  LANGUAGE_LABEL,
  type Language,
  type TranslationKey,
} from '@/shared/i18n/dictionary';
import { localizeRegionName } from '@/shared/i18n/domain-labels';
import { Button } from '@/shared/components/ui/Button';
import { InstallShareSheet } from '@/shared/components/ui/InstallShareSheet';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { TextSizePicker } from '@/shared/i18n/TextSizePicker';
import { useSettings } from '@/shared/i18n/use-settings';
import { SUBMISSION_MODE } from '@/shared/lib/feature-flags';
import { OFFICIAL_LINKS } from '@/shared/config/official-links';
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
    (session?.user.user_metadata?.name as string | undefined) ||
    session?.user.email ||
    t('pilgrimDefaultName');

  const requireAuth = () => navigate(paths.login);

  // 「홈화면 추가」(설치 + 링크 공유)는 이제 시트 하나로 — 하단 탭 넷째 자리와 같은 것
  const [installSheetOpen, setInstallSheetOpen] = useState(false);

  /**
   * 맨 위 「전체 서비스」 — 하단 탭에 이미 있는 홈·성지 찾기·기록·성지 일정과 축제는
   * 빼고, 탭에 없는 화면(순례 코스·전국 분포 개요·홈 화면 추가)만 둔다(사장님 지적,
   * 2026-09-18) — 하단 탭과 겹치는 4개를 여기 또 늘어놓을 이유가 없었다.
   */
  const services: {
    id: string;
    icon: LucideIcon;
    label: string;
    to?: string;
    onClick?: () => void;
    /** PC 에서는 감춘다 — 「홈 화면에 추가」는 휴대폰에서만 의미가 있다 */
    mobileOnly?: boolean;
  }[] = [
    { id: 'routes', icon: Footprints, label: t('routesTitle'), to: paths.routes },
    { id: 'map', icon: MapIcon, label: t('mapOverviewTitle'), to: paths.map },
    {
      id: 'install',
      icon: Smartphone,
      label: t('installTab'),
      onClick: () => setInstallSheetOpen(true),
      mobileOnly: true,
    },
  ];

  // 「계정 설정」 절은 없앴다(2026-09-18) — 프로필 카드의 톱니바퀴 단추(`/account`)로 옮겼다.
  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: t('appSettings'),
      items: [
        {
          id: 'lang',
          icon: Globe,
          label: t('languageSetting'),
          // 검수를 마친 한국어·영어만(ENABLED_LANGUAGES). 목록은 각자의 언어로 적어야 자기 언어를 찾을 수 있다.
          sub: LANGUAGE_LABEL[language],
          control: (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label={t('languageSelectAria')}
              className="min-h-11 max-w-[45%] rounded-lg border border-app-border bg-white px-3 text-sm font-bold text-app-text"
            >
              {ENABLED_LANGUAGES.map((lang) => (
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
              ? fillPlaceholders(t('originNearbyOrder'), {
                  origin: localizeRegionName(origin, language),
                })
              : t('originSub'),
          control: (
            <select
              value={origin ?? ''}
              onChange={(e) => setOrigin((e.target.value || null) as Region | null)}
              aria-label={t('originSelectAria')}
              disabled={Boolean(gpsLocation)}
              className="min-h-11 max-w-[45%] rounded-lg border border-app-border bg-white px-3 text-sm font-bold text-app-text disabled:opacity-50"
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
        {
          id: 'terms',
          icon: Info,
          label: t('viewTerms'),
          onClick: () => navigate(paths.terms),
        },
        {
          id: 'privacy',
          icon: Info,
          label: t('privacyNotice'),
          onClick: () => navigate(paths.privacy),
        },
      ],
    },
    {
      title: t('officialLinksTitle'),
      items: OFFICIAL_LINKS.map((link) => ({
        id: `official-${link.id}`,
        icon: Globe,
        label: language === 'ko' ? link.labelKo : link.labelEn,
        sub: link.url ? link.url : t('officialLinkPending'),
        onClick: link.url ? () => window.open(link.url!, '_blank', 'noopener') : undefined,
      })),
    },
  ];

  return (
    <PageContainer className="flex min-h-page flex-col pb-16 pt-6">
      <InstallShareSheet open={installSheetOpen} onClose={() => setInstallSheetOpen(false)} />

      {/* 내 정보 — 화면 맨 위로(사장님 지적, 2026-09-18). 로그인 안 했으면 로그인·회원가입 입구.
          「계정 설정」 절이 여기 톱니바퀴 단추 하나로 합쳐졌다 — 아래 sections 에서 그 절은 뺐다. */}
      <div className="mb-8 rounded-lg border border-app-border bg-white p-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft"
            aria-hidden
          >
            <User size={28} className="text-brand-blue" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="mb-1 truncate text-xl font-bold text-app-text">
              {displayName}
              {/* 「님」은 한국어 존칭 — 다른 언어에는 붙일 말이 없다 */}
              {isLoggedIn && language === 'ko' ? ' 님' : ''}
            </h2>
            {isLoggedIn ? (
              <p className="text-base text-app-text-muted">{t('menuGreeting')}</p>
            ) : (
              <button
                onClick={requireAuth}
                className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-base font-bold text-brand-blue transition-colors hover:bg-app-bg"
                id="menu-login-prompt"
              >
                <LogIn size={18} aria-hidden /> {t('login')} · {t('signup')}
              </button>
            )}
          </div>
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => navigate(paths.account)}
              aria-label={t('accountSettings')}
              title={t('accountSettings')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-bg hover:text-brand-blue"
              id="menu-account-settings"
            >
              <Settings size={22} aria-hidden />
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-app-border pt-5">
          <div className="border-r border-app-border text-center">
            <p className="mb-1 text-sm font-bold text-app-text-muted">{t('countShrines')}</p>
            <p className="text-2xl font-bold tabular-nums text-app-text">{stamps.length}</p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-sm font-bold text-app-text-muted">{t('countJournals')}</p>
            <p className="text-2xl font-bold tabular-nums text-app-text">{logs.length}</p>
          </div>
        </div>
      </div>

      {/* 전체 서비스 — 아이콘 옆에 이름, 4열(PC 6열) */}
      <section>
        <h1 className="mb-4 font-display text-[1.625rem] leading-tight text-app-text lg:text-3xl">
          {t('allServices')}
        </h1>
        <ul className="grid grid-cols-4 gap-2 lg:grid-cols-6" id="all-services">
          {services.map((svc) => {
            const inner = (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-soft text-brand-blue">
                  <svc.icon size={22} aria-hidden />
                </span>
                <span className="text-center text-sm font-bold leading-tight text-app-text">
                  {svc.label}
                </span>
              </>
            );
            const cls =
              'flex min-h-[88px] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-app-border bg-white px-1 py-3 transition-colors hover:border-brand-blue';
            return (
              <li key={svc.id} className={svc.mobileOnly ? 'lg:hidden' : undefined}>
                {svc.to ? (
                  <Link to={svc.to} className={cls} id={`service-${svc.id}`}>
                    {inner}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={svc.onClick}
                    className={cls}
                    id={`service-${svc.id}`}
                  >
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex-1 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h3 className="mb-3 ml-1 text-sm font-bold text-app-text-muted">{section.title}</h3>
            <div className="overflow-hidden rounded-lg border border-app-border bg-white">
              {section.items.map((item, idx) => {
                const rowClass = `flex min-h-16 w-full items-center gap-4 px-5 py-4 ${
                  idx !== section.items.length - 1 ? 'border-b border-app-border' : ''
                }`;
                const body = (
                  <>
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-app-panel text-app-text-muted"
                      aria-hidden
                    >
                      <item.icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <h4 className="text-base font-bold text-app-text">{item.label}</h4>
                      {item.sub && <p className="mt-0.5 text-sm text-app-text-muted">{item.sub}</p>}
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
                    <ChevronRight size={20} className="shrink-0 text-app-text-muted" aria-hidden />
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {canEnterAdmin && !SUBMISSION_MODE && (
          // 제출판은 본선 기능만 보이게 한다 — T-013
          // 운영자 전용 입구라 다국어로 만들지 않는다 — 이 줄을 보는 사람은 한국인 운영자뿐이다.
          <Button
            variant="neutral"
            block
            onClick={() => navigate(paths.admin)}
            id="admin-console-btn"
          >
            <SlidersHorizontal size={18} aria-hidden />
            관리자 콘솔
          </Button>
        )}

        <Button
          variant="ghost"
          block
          onClick={() => {
            if (isLoggedIn) void signOut();
            else requireAuth();
          }}
          id="logout-btn"
        >
          {isLoggedIn ? <LogOut size={18} aria-hidden /> : <LogIn size={18} aria-hidden />}
          {isLoggedIn ? t('logout') : t('login')}
        </Button>
      </div>
    </PageContainer>
  );
}
