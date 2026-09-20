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
 *
 * 2026-09-16 시안 확정판(버전 8):
 * - 가운데 「기록」은 바 위로 솟은 68px 둥근 단추 — 서비스의 중심이라 크기와 위치로 강조한다.
 *   다만 **평소엔 흰 바탕에 남색 테두리**, 기록 화면에 들어갔을 때만 남색으로 채운다.
 *   처음엔 늘 남색 채움이었는데 "홈이 선택된 건지 기록이 선택된 건지 헷갈린다"는 지적(사장님)으로 나눴다.
 * - 나머지 탭은 선택되면 **위쪽 3px 표시선 + 남색 아이콘·글자**, 아니면 회색. 색만이 아니라 표시선으로도 구분한다.
 * - 글자는 60대 이상이 읽도록 굵고 진하게(2026-09-13 피드백). 높이 70px 은 `AppLayout` 의 `pb-[70px]` 와 짝이다.
 */
export function BottomNav() {
  const { t } = useSettings();

  return (
    <nav
      className="safe-area-inset-bottom fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-app-border bg-white shadow-[0_-4px_16px_rgba(30,34,43,0.06)] lg:hidden"
      aria-label={t('mainMenuAria')}
    >
      <div className="flex h-[70px] items-stretch">
        {NAV_ITEMS.map((tab) => {
          const Icon = tab.icon;

          if (tab.id === 'record') {
            return (
              <NavLink
                key={tab.id}
                to={tab.to}
                end={tab.end}
                className="flex flex-1 items-start justify-center"
                id={`tab-${tab.id}`}
              >
                {({ isActive }) => (
                  <span
                    className={`-mt-[22px] flex h-[68px] w-[68px] flex-col items-center justify-center gap-0.5 rounded-full shadow-[0_6px_18px_rgba(31,47,85,0.28)] transition-transform active:scale-95 ${
                      isActive
                        ? 'border-4 border-white bg-brand-blue text-white'
                        : 'border-[2.5px] border-brand-blue bg-white text-brand-blue'
                    }`}
                  >
                    <Icon size={24} aria-hidden />
                    <span className="text-[0.8125rem] font-bold leading-none tracking-tight">
                      {t(tab.labelKey)}
                    </span>
                  </span>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              end={tab.end}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5"
              id={`tab-${tab.id}`}
            >
              {({ isActive }) => (
                <>
                  {/* 위쪽 3px 선택 표시선은 뺐다(사장님 지적, 2026-09-18) — 아이콘·글자 색
                      (남색/회색)만으로 선택 상태를 나타낸다. */}
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? 'bg-brand-blue text-white' : 'text-app-text-muted'}`}
                  >
                    <Icon size={20} aria-hidden />
                  </span>
                  <span
                    className={`max-w-full truncate text-[0.75rem] font-bold tracking-tight ${
                      isActive ? 'text-brand-blue' : 'text-app-text-muted'
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
