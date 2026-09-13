import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { InstallShareSheet } from '@/shared/components/ui/InstallShareSheet';
import { useSettings } from '@/shared/i18n/use-settings';
import { NAV_ITEMS } from './nav-items';

/**
 * 하단 탭 내비게이션 — 모바일·태블릿 세로 전용.
 *
 * 1024px 이상에서는 상단 내비(TopNav)가 같은 일을 하므로 스스로 숨는다(`lg:hidden`).
 * 폭은 예전처럼 셸에서 프롭으로 받지 않고 여기서 정한다 — 셸의 폭 규칙과 탭의 폭이
 * 어긋나 화면 바깥으로 밀려나는 일을 막는다.
 *
 * 탭 목록은 `nav-items.ts` 한 곳에서만 정의한다. `action: 'install'` 항목은 화면으로
 * 가지 않고 탭 위에 「홈화면 추가」 시트를 연다 (2026-09-13 사장님 요청).
 */
export function BottomNav() {
  const { t } = useSettings();
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();

  // 화면을 옮기면 열린 시트는 닫는다 — 열린 채로 남으면 새 화면을 가린다.
  useEffect(() => setSheetOpen(false), [location.pathname]);

  const tabClass = 'flex flex-1 flex-col items-center justify-center gap-1';
  const iconBox = (active: boolean, round = false) =>
    `flex h-8 w-8 items-center justify-center transition-all ${
      active ? (round ? 'rounded-full bg-brand-violet' : 'rounded-lg bg-brand-blue') : 'rounded-lg bg-app-border'
    }`;
  const labelClass = (active: boolean) =>
    `text-[10px] font-bold uppercase tracking-tighter ${active ? 'text-brand-blue' : 'text-[#ADB5BD]'}`;

  return (
    <>
      <div className="lg:hidden">
        <InstallShareSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </div>

      <nav
        className="safe-area-inset-bottom fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-app-border bg-white lg:hidden"
        aria-label="주요 메뉴"
      >
        <div className="flex h-[70px] items-center justify-around">
          {NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;

            if (tab.action === 'install') {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSheetOpen((v) => !v)}
                  className={tabClass}
                  aria-label={t(tab.labelKey)}
                  aria-expanded={sheetOpen}
                  id={`tab-${tab.id}`}
                >
                  <div className={iconBox(sheetOpen)}>
                    <Icon size={18} className={sheetOpen ? 'text-white' : 'text-[#ADB5BD]'} />
                  </div>
                  <span className={labelClass(sheetOpen)}>{t(tab.labelKey)}</span>
                </button>
              );
            }

            return (
              <NavLink key={tab.id} to={tab.to} end={tab.end} className={tabClass} id={`tab-${tab.id}`}>
                {({ isActive }) => (
                  <>
                    <div className={iconBox(isActive, tab.id === 'explore')}>
                      <Icon size={18} className={isActive ? 'text-white' : 'text-[#ADB5BD]'} />
                    </div>
                    <span className={labelClass(isActive)}>{t(tab.labelKey)}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
