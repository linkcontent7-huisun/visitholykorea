import { NavLink } from 'react-router-dom';
import { useSettings } from '@/shared/i18n/use-settings';
import { NAV_ITEMS } from './nav-items';

/**
 * 하단 탭 내비게이션 — 모바일·태블릿 세로 전용.
 *
 * 1024px 이상에서는 상단 내비(TopNav)가 같은 일을 하므로 스스로 숨는다(`lg:hidden`).
 * 폭은 예전처럼 셸에서 프롭으로 받지 않고 여기서 정한다 — 셸의 폭 규칙과 탭의 폭이
 * 어긋나 화면 바깥으로 밀려나는 일을 막는다.
 *
 * 탭 목록은 `nav-items.ts` 한 곳에서만 정의한다.
 */
export function BottomNav() {
  const { t } = useSettings();

  return (
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
      </div>
    </nav>
  );
}
