import { Menu as MenuIcon, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { LanguagePicker } from '@/shared/i18n/LanguagePicker';
import { TextSizePicker } from '@/shared/i18n/TextSizePicker';
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
  const { t } = useSettings();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // 화면을 옮기면 펼친 메뉴는 닫는다 — 열린 채로 남으면 새 화면을 가린다.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-white/95 backdrop-blur-md">
      {/* 상단바는 내용이 아니라 틀이다 — 글자 크기를 키워도 틀의 간격은 px 로 고정해
          「대」에서 버튼들이 오른쪽으로 밀려 잘리지 않게 한다 (2026-09-12). */}
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center gap-[16px] px-[20px] lg:h-[72px] lg:gap-[24px] lg:px-[32px]">
        <Link to={paths.home} className="shrink-0 text-[18px] font-extrabold tracking-tight text-brand-blue lg:text-[20px]" id="logo">
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

        <div className="ml-auto flex items-center gap-[8px] lg:gap-[16px]">
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
            <span className="max-w-[84px] truncate text-[10px] font-medium text-app-text-muted [html[data-text-size-open]_&]:hidden">
              {t('searchHintMobile')}
            </span>
          </Link>

          {/* 글자 크기 — 예전엔 데스크톱에만 있던 켬/끔 버튼. 휴대폰에서도 보이게 하고
              누르면 옆에 소·중·대가 펼쳐진다 (2026-09-12). */}
          <TextSizePicker />

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
            className="-mr-[6px] flex h-9 w-8 items-center justify-center rounded-xl text-app-text-muted lg:hidden"
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
            {/* 글자 크기는 상단바 「가」 버튼에서 고른다 — 펼친 메뉴에는 이름만 남긴다 */}
            <span className="flex items-center gap-2 text-[13px] font-bold text-app-text-muted">
              {t('textSizeButton')}
              <TextSizePicker inline />
            </span>
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
