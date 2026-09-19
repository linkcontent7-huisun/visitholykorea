import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  BookmarkPlus,
  ChevronRight,
  Globe,
  Share2,
  Smartphone,
  Info,
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
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useAdminAccess } from '@/features/admin/hooks/use-admin';
import { signOut } from '@/features/auth/api/auth';
import { useSession } from '@/features/auth/hooks/use-session';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { useMyLogs } from '@/features/records/hooks/use-logs';
import { LANGUAGE_LABEL, type TranslationKey } from '@/shared/i18n/dictionary';
import { Button } from '@/shared/components/ui/Button';
import { InstallShareSheet } from '@/shared/components/ui/InstallShareSheet';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { LanguagePicker } from '@/shared/i18n/LanguagePicker';
import { TextSizePicker } from '@/shared/i18n/TextSizePicker';
import { useSettings } from '@/shared/i18n/use-settings';
import { SUBMISSION_MODE } from '@/shared/lib/feature-flags';
import { copyText } from '@/shared/lib/map-links';
import { shareApp, type ShareResult } from '@/shared/lib/share-app';
import { OFFICIAL_LINKS } from '@/shared/config/official-links';

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
  /** PC 에서는 감춘다 — 「홈 화면에 추가」는 휴대폰에서만 의미가 있다 */
  mobileOnly?: boolean;
  /** 휴대폰에서는 감춘다 — 휴대폰은 「홈 화면 추가」 시트 하나가 이 둘을 이미 갖고 있다
   *  (사장님 지적, 2026-09-19: PC 에는 그 시트로 가는 입구조차 없었다) */
  desktopOnly?: boolean;
}

export default function MenuPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  // 관리자 콘솔 입구. 권한이 없는 사람에게는 아예 그리지 않는다.
  const { canEnter: canEnterAdmin } = useAdminAccess();
  const { language, gpsLocation, gpsStatus, requestGpsLocation, clearGpsLocation, t } =
    useSettings();
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

  // PC 전용 「즐겨찾기 추가」·「링크 공유」 — 브라우저 즐겨찾기는 JS 로 직접 열 수 없어
  // (보안상 막혀 있다) 주소를 복사해 주고 단축키를 안내한다. 공유는 InstallShareSheet 와
  // 같은 `shareApp()` 을 그대로 쓴다(2026-09-19).
  const [bookmarkResult, setBookmarkResult] = useState<'copied' | 'error' | null>(null);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);

  // 「계정 설정」 절은 없앴다(2026-09-18) — 프로필 카드의 톱니바퀴 단추(`/account`)로 옮겼다.
  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: t('appSettings'),
      items: [
        // 「전체 서비스」 절을 통째로 없애면서(사장님 지적, 2026-09-18) 그 안에 있던
        // 「홈 화면 추가」만 앱 설정 맨 위로 옮겼다 — 순례 코스는 홈의 「모두 보기」,
        // 전국 분포 개요는 지역 랜딩 화면에 각자 다른 입구가 이미 있어 잃는 게 없다.
        {
          id: 'install',
          icon: Smartphone,
          label: t('installTab'),
          onClick: () => setInstallSheetOpen(true),
          mobileOnly: true,
        },
        {
          id: 'bookmark',
          icon: BookmarkPlus,
          label: t('addBookmark'),
          sub:
            bookmarkResult === 'copied'
              ? t('bookmarkHint')
              : bookmarkResult === 'error'
                ? t('copyFailed')
                : undefined,
          onClick: () => {
            void copyText(window.location.href).then((ok) =>
              setBookmarkResult(ok ? 'copied' : 'error'),
            );
          },
          desktopOnly: true,
        },
        {
          id: 'share',
          icon: Share2,
          label: t('shareLink'),
          sub:
            shareResult === 'copied'
              ? t('copied')
              : shareResult === 'error'
                ? t('copyFailed')
                : t('shareApp'),
          onClick: () => {
            void shareApp().then(setShareResult);
          },
          desktopOnly: true,
        },
        {
          id: 'lang',
          icon: Globe,
          label: t('languageSetting'),
          // 검수를 마친 한국어·영어만(ENABLED_LANGUAGES). 목록은 각자의 언어로 적어야 자기 언어를 찾을 수 있다.
          sub: LANGUAGE_LABEL[language],
          // 네이티브 <select> 는 펼침 목록 위치를 브라우저가 정해서, 모바일에서는 화면을
          // 뒤덮고 PC 에서는 엉뚱한 자리(왼쪽 위)에 뜨는 문제가 있었다(사장님 지적,
          // 2026-09-18) — 우리가 직접 위치를 잡는 `LanguagePicker`(헤더에서 쓰던 것,
          // 지금은 헤더에서 뺀 뒤로 안 쓰이고 있었다)로 바꿔 항상 이 줄 바로 아래에 뜨게 한다.
          control: <LanguagePicker />,
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
      ],
    },
    {
      title: t('supportInfo'),
      items: [
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

      <div className="flex-1 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h3 className="mb-3 ml-1 text-sm font-bold text-app-text-muted">{section.title}</h3>
            <div className="overflow-hidden rounded-lg border border-app-border bg-white">
              {section.items.map((item, idx) => {
                const display = item.mobileOnly
                  ? 'flex lg:hidden'
                  : item.desktopOnly
                    ? 'hidden lg:flex'
                    : 'flex';
                const rowClass = `${display} min-h-16 w-full items-center gap-4 px-5 py-4 ${
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

        {/* 로그아웃 전용 — 로그인 입구는 위 프로필 카드에 이미 있다(2026-09-19: 같은 화면에
            로그인 입구가 두 번 나오던 것을 정리). */}
        {isLoggedIn && (
          <Button variant="ghost" block onClick={() => void signOut()} id="logout-btn">
            <LogOut size={18} aria-hidden />
            {t('logout')}
          </Button>
        )}
      </div>
    </PageContainer>
  );
}
