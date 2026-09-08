import { Menu as MenuIcon, Search, Type, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { LanguagePicker } from '@/shared/i18n/LanguagePicker';
import { useSettings } from '@/shared/i18n/use-settings';
import { NAV_ITEMS, TOP_NAV_ITEMS } from './nav-items';

/**
 * 상단 내비게이션 — "웹 서비스형" 셸의 얼굴.
 *
 * 데스크톱(lg 이상)에서는 로고 + 메뉴 여섯 개 + 검색 + 언어 + 로그인이 한 줄에 온다.
 * 모바일에서는 로고 + 검색 + 메뉴 버튼만 남기고, 메뉴는 눌렀을 때 펼친다.
 *
 * 높이는 모바일 60px, 데스크톱 72px 로 고정한다 — 지도 화면이 이 높이를 빼서
 * 화면을 꽉 채우기 때문에(`MapPage`) 임의로 바꾸면 지도 2분할이 어긋난다.
 */
export function TopNav() {
  const { t, largeText, setLargeText } = useSettings();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // 화면을 옮기면 펼친 메뉴는 닫는다 — 열린 채로 남으면 새 화면을 가린다.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center gap-6 px-6 lg:h-[72px] lg:px-8">
        <Link to={paths.home} className="shrink-0 text-lg font-extrabold tracking-tight text-brand-blue lg:text-xl" id="logo">
          VISIT <span className="text-brand-violet">HOLY</span>
        </Link>

        {/* 데스크톱 메뉴 */}
        <nav className="hidden items-center gap-4 lg:flex xl:gap-6" aria-label="주요 메뉴">
          {TOP_NAV_ITEMS.map((item) => (
            <NavLink key={item.id} to={item.to} end={item.end} id={`topnav-${item.id}`}>
              {({ isActive }) => (
                <span
                  className={`block whitespace-nowrap border-b-2 py-1.5 text-[13px] transition-colors ${
                    isActive
                      ? 'border-brand-blue font-bold text-app-text'
                      : 'border-transparent font-semibold text-app-text-muted hover:text-brand-violet'
                  }`}
                >
                  {t(item.labelKey)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:gap-4">
          {/* 검색 — 데스크톱은 입력창 모양, 모바일은 아이콘 하나 */}
          <Link
            to={paths.search}
            className="hidden items-center gap-2.5 rounded-xl border border-app-border bg-app-bg px-4 py-2.5 md:flex"
            id="search-bar"
          >
            <Search size={14} className="shrink-0 text-app-text-muted" aria-hidden />
            <span className="max-w-[220px] truncate text-[12px] font-medium text-app-text-muted">
              {t('searchPlaceholder')}
            </span>
          </Link>
          {/* 모바일 — 돋보기만 있으면 무엇을 하는 자리인지 안 보인다는 피드백(2026-09-08).
              작은 회색 설명글을 옆에 붙인다. 좁은 화면에서도 안 깨지게 truncate 를 둔다. */}
          <Link
            to={paths.search}
            className="flex min-w-0 items-center gap-1.5 md:hidden"
            aria-label={t('searchHintMobile')}
          >
            <Search size={19} className="shrink-0 text-app-text-muted" aria-hidden />
            <span className="max-w-[104px] truncate text-[10px] font-medium text-app-text-muted">
              {t('searchHintMobile')}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setLargeText(!largeText)}
            className={`hidden h-7 w-7 items-center justify-center rounded-full transition-colors md:flex ${
              largeText ? 'bg-brand-blue text-white' : 'bg-app-border text-app-text-muted'
            }`}
            id="large-text-toggle"
            aria-label="큰 글자 모드"
            aria-pressed={largeText}
          >
            <Type size={14} />
          </button>

          {/* 언어 선택 — 전에는 데스크톱에만 보였다. 모바일에서도 삼선 메뉴를 열지
              않고 바로 바꿀 수 있어야 한다는 피드백(2026-09-08)으로 항상 보이게 한다. */}
          <LanguagePicker />

          {session ? (
            <Link
              to={paths.records}
              className="hidden rounded-full border border-app-border px-4 py-2 text-[12px] font-bold text-app-text-muted lg:block"
            >
              {t('record')}
            </Link>
          ) : (
            <Link
              to={paths.login}
              className="hidden rounded-full bg-brand-blue px-5 py-2.5 text-[12px] font-bold text-white lg:block"
              id="topnav-login"
            >
              {t('login')}
            </Link>
          )}

          {/* 모바일 메뉴 버튼 */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-app-text-muted lg:hidden"
            aria-label="메뉴"
            aria-expanded={open}
            id="topnav-menu-toggle"
          >
            {open ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* 모바일 펼침 메뉴 — 하단 탭에 없는 항목까지 여기서 갈 수 있게 한다 */}
      {open && (
        <div className="border-t border-app-border bg-white px-6 pb-5 pt-3 lg:hidden">
          <nav className="grid grid-cols-2 gap-2" aria-label="전체 메뉴">
            {[...NAV_ITEMS, ...TOP_NAV_ITEMS.filter((i) => !NAV_ITEMS.some((n) => n.id === i.id))].map(
              (item) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end={item.end}
                  className="flex items-center gap-3 rounded-xl border border-app-border px-4 py-3 text-[13px] font-bold text-app-text"
                >
                  <item.icon size={17} className="text-brand-violet" />
                  {t(item.labelKey)}
                </NavLink>
              ),
            )}
          </nav>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setLargeText(!largeText)}
              className="flex items-center gap-2 text-[13px] font-bold text-app-text-muted"
              aria-pressed={largeText}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  largeText ? 'bg-brand-blue text-white' : 'bg-app-border text-app-text-muted'
                }`}
              >
                <Type size={14} />
              </span>
              큰 글자
            </button>
            <div className="flex items-center gap-4">
              {/* 언어 선택은 이제 상단바에 항상 보이므로 여기서 다시 그리지 않는다(중복 id 방지) */}
              {!session && (
                <Link
                  to={paths.login}
                  className="rounded-full bg-brand-blue px-4 py-2 text-[12px] font-bold text-white"
                >
                  {t('login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
