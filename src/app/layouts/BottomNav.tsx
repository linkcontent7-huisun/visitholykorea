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
 * 탭 목록은 `nav-items.ts` 한 곳에서만 정의한다. 「홈화면 추가」 시트는 더보기 안으로 옮겼다.
 *
 * 탭 다섯 개는 같은 크기다(재기획 2026-09-14: 홈·성지 찾기·고요 속으로·내 기록·더보기).
 * 글자는 60대 이상이 읽도록 굵고 진하게 — 연회색 라벨은 "안 보인다"는 피드백이 있었다
 * (2026-09-13). 높이 70px 은 `AppLayout` 의 `pb-[70px]` 와 짝이다.
 */
export function BottomNav() {
  const { t } = useSettings();
  const tabClass = 'flex flex-1 flex-col items-center justify-center gap-1';
  const iconBox = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
      active ? 'bg-brand-blue' : 'bg-white'
    }`;
  const iconClass = (active: boolean) => (active ? 'text-white' : 'text-app-text-muted');
  const labelClass = (active: boolean) =>
    `text-[0.75rem] font-extrabold tracking-tight ${active ? 'text-brand-blue' : 'text-app-text-muted'}`;

  return (
    <>
      <nav
        className="safe-area-inset-bottom fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-app-border bg-[#F3F4F8] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] lg:hidden"
        aria-label="주요 메뉴"
      >
        <div className="flex h-[70px] items-center justify-around">
          {NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;

            return (
              <NavLink key={tab.id} to={tab.to} end={tab.end} className={tabClass} id={`tab-${tab.id}`}>
                {({ isActive }) => (
                  <>
                    <div className={iconBox(isActive)}>
                      <Icon size={18} className={iconClass(isActive)} />
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
