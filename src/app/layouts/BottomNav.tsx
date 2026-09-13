import { Menu as MenuIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { useSettings } from '@/shared/i18n/use-settings';
import { NAV_ITEMS, TOP_NAV_ITEMS } from './nav-items';

/**
 * 하단 탭 내비게이션 — 모바일·태블릿 세로 전용.
 *
 * 1024px 이상에서는 상단 내비(TopNav)가 같은 일을 하므로 스스로 숨는다(`lg:hidden`).
 * 폭은 예전처럼 셸에서 프롭으로 받지 않고 여기서 정한다 — 셸의 폭 규칙과 탭의 폭이
 * 어긋나 화면 바깥으로 밀려나는 일을 막는다.
 *
 * 탭 목록은 `nav-items.ts` 한 곳에서만 정의한다.
 *
 * 다섯째 자리 「전체」는 예전에 상단바 오른쪽 끝에 있던 삼선 메뉴다. 언어(KO) 버튼 옆에
 * 붙어 있어 헷갈린다는 사장님 요청(2026-09-13)으로 「설정」 옆으로 내렸다. 누르면
 * 하단 탭에 없는 항목(순례 코스·마음 나침반)과 로그인이 탭 위로 펼쳐진다.
 */
export function BottomNav() {
  const { t } = useSettings();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // 화면을 옮기면 펼친 메뉴는 닫는다 — 열린 채로 남으면 새 화면을 가린다.
  useEffect(() => setOpen(false), [location.pathname]);

  // 하단 탭에 이미 있는 항목은 펼침 메뉴에서 다시 보여주지 않는다
  const extraItems = TOP_NAV_ITEMS.filter((i) => !NAV_ITEMS.some((n) => n.id === i.id));

  return (
    <>
      {open && (
        <>
          {/* 뒤를 눌러도 닫히게 — 메뉴 밖을 누르는 습관을 존중한다 */}
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            aria-label={t('close')}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed bottom-[70px] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 rounded-t-[24px] border-t border-app-border bg-white px-6 pb-5 pt-4 lg:hidden"
            id="bottom-menu-sheet"
          >
            <nav className="grid grid-cols-2 gap-2" aria-label="전체 메뉴">
              {extraItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end={item.end}
                  className="flex items-center gap-3 rounded-xl border border-app-border px-4 py-3 text-[0.8125rem] font-bold text-app-text"
                >
                  <item.icon size={17} className="text-brand-violet" />
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
            {!session && (
              <Link
                to={paths.login}
                className="mt-3 block rounded-full bg-brand-blue py-3 text-center text-[0.8125rem] font-bold text-white"
              >
                {t('login')}
              </Link>
            )}
          </div>
        </>
      )}

      <nav
        className="safe-area-inset-bottom fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-app-border bg-white lg:hidden"
        aria-label="주요 메뉴"
      >
        <div className="flex h-[70px] items-center justify-around">
          {NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isExplore = tab.id === 'explore';

            return (
              <NavLink
                key={tab.id}
                to={tab.to}
                end={tab.end}
                className="flex flex-1 flex-col items-center justify-center gap-1"
                id={`tab-${tab.id}`}
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`flex h-8 w-8 items-center justify-center transition-all ${
                        isActive
                          ? isExplore
                            ? 'rounded-full bg-brand-violet'
                            : 'rounded-lg bg-brand-blue'
                          : 'rounded-lg bg-app-border'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-[#ADB5BD]'} />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-tighter ${
                        isActive ? 'text-brand-blue' : 'text-[#ADB5BD]'
                      }`}
                    >
                      {t(tab.labelKey)}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* 전체 메뉴 — 링크가 아니라 펼침 버튼이라 NavLink 를 쓰지 않는다 */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 flex-col items-center justify-center gap-1"
            aria-label={t('allMenu')}
            aria-expanded={open}
            id="tab-all-menu"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                open ? 'bg-brand-blue' : 'bg-app-border'
              }`}
            >
              {open ? (
                <X size={18} className="text-white" />
              ) : (
                <MenuIcon size={18} className="text-[#ADB5BD]" />
              )}
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-tighter ${
                open ? 'text-brand-blue' : 'text-[#ADB5BD]'
              }`}
            >
              {t('allMenu')}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
