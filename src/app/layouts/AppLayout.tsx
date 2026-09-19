import { Outlet, useLocation } from 'react-router-dom';
import { InstallBanner } from '@/shared/components/ui/InstallBanner';
import { useSettings } from '@/shared/i18n/use-settings';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

/**
 * 앱 셸 — "웹 서비스형"(시안 1b).
 *
 * 예전에는 데스크톱에서도 본문을 `max-w-lg`(512px)로 묶고 바깥을 회색으로 칠해
 * **휴대폰 화면을 크게 보여주는** 형태였다. 이제 상단 내비 + 최대 1200px 본문의
 * 웹 서비스 구조로 바꾼다. 폭 판단은 CSS(브레이크포인트)가 하고, JS는 쓰지 않는다 —
 * JS로 판단하면 새로고침할 때 레이아웃이 한 번 깜빡인다.
 *
 * 본문 폭 제한은 각 화면이 `PageContainer` 로 직접 건다. 셸이 폭을 묶어 버리면
 * 지도 2분할처럼 화면을 꽉 채워야 하는 화면을 만들 수 없다.
 */

/**
 * 모바일에서 하단 탭을 유지할지.
 *
 * 시안 1b 는 데스크톱에서 하단 탭을 상단 내비로 옮기는 안이다. 모바일까지 탭을
 * 없애면 고령 순례자에게 익숙한 위치의 조작을 한꺼번에 빼앗게 되므로,
 * **모바일은 하단 탭을 그대로 두고 데스크톱만 상단 내비로 간다**(1024px 이상에서
 * BottomNav 는 스스로 숨는다). 모바일에서도 상단 메뉴만 쓰기로 결정하면
 * 이 값을 false 로 바꾸면 된다 — 다른 곳은 손대지 않아도 된다.
 */
const KEEP_BOTTOM_NAV_ON_MOBILE = true;

export function AppLayout() {
  const { pathname } = useLocation();
  const { t } = useSettings();

  return (
    <div className="flex min-h-full flex-col bg-app-bg font-sans text-app-text selection:bg-brand-violet/20">
      {/* 키보드·스크린리더 사용자가 상단 메뉴를 건너뛰고 본문으로 — 포커스될 때만 보인다 */}
      <a href="#main-content" className="skip-link">
        {t('skipToContent')}
      </a>
      <TopNav />
      {/* 「홈 화면에 추가」 조용한 배너 — 설치 가능한 환경·두 번째 화면부터·7일 쿨다운 */}
      <InstallBanner pathname={pathname} />

      {/* 하단 탭이 가리는 만큼만 모바일에서 아래 여백을 준다 */}
      <main
        id="main-content"
        tabIndex={-1}
        className={`flex-1 outline-none ${KEEP_BOTTOM_NAV_ON_MOBILE ? 'pb-[70px] lg:pb-0' : ''}`}
      >
        <Outlet />
      </main>

      {KEEP_BOTTOM_NAV_ON_MOBILE && <BottomNav />}
    </div>
  );
}
