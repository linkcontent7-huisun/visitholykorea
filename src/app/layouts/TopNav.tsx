import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { LanguagePicker } from '@/shared/i18n/LanguagePicker';
import { TextSizePicker } from '@/shared/i18n/TextSizePicker';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 상단 내비게이션 — "웹 서비스형" 셸의 얼굴.
 *
 * 로고 + 글자크기 + 언어 + 로그인, 이 넷만 둔다(2026-09-17) — 「기록」·「성지 일정」·「더보기」는
 * 로그인해야 의미가 있는 메뉴라 헤더에 다시 두지 않는다. 이동은 하단 탭(`BottomNav`)과
 * 더보기 화면(`MenuPage`)이 이미 맡고 있다.
 *
 * 배경은 완전 불투명(`bg-white`) — 바로 아래 히어로 슬라이드가 100vw 로 붙는다.
 * 반투명이면 스크롤할 때 사진이 헤더에 비쳐 보인다.
 *
 * 높이는 모바일 60px, 데스크톱 72px 로 고정한다 — 지도 화면이 이 높이를 빼서
 * 화면을 꽉 채우기 때문에(`MapPage`) 임의로 바꾸면 지도 2분할이 어긋난다.
 */
export function TopNav() {
  const { t } = useSettings();
  const { session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-white">
      {/* 상단바는 내용이 아니라 틀이다 — 글자 크기를 키워도 틀의 간격은 px 로 고정해
          「대」에서 버튼들이 오른쪽으로 밀려 잘리지 않게 한다 (2026-09-12). */}
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center gap-[12px] px-[20px] lg:h-[72px] lg:gap-[24px] lg:px-[32px]">
        {/* 로고 — 사장님이 만든 비둘기·십자가 마크 + 글자 (2026-09-12). 글자는 이미지가 아니라
            텍스트라 작은 화면에서도 선명하고, 마크 색(#04377C)에 맞췄다. */}
        <Link to={paths.home} className="flex shrink-0 items-center gap-[8px]" id="logo">
          <img src="/logo-mark-88.png" alt="" aria-hidden className="h-[36px] w-auto lg:h-[40px]" />
          {/* 휴대폰에서는 두 줄(VisitHoly / Korea) — 한 줄로 길게 쓰면 옆 돋보기가 묻힌다
              (2026-09-13 사장님 요청). PC 는 자리가 넉넉하니 한 줄 그대로. */}
          <span
            className="text-[13px] font-extrabold leading-[1.05] tracking-tight text-brand-blue lg:hidden"
            aria-label="VisitHoly Korea"
          >
            VisitHoly
            <br />
            Korea
          </span>
          <span className="hidden text-[19px] font-extrabold tracking-tight text-brand-blue lg:inline">
            VisitHolyKorea
          </span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-[8px] lg:gap-[12px]">
          {/* 글자 크기 — 예전엔 데스크톱에만 있던 켬/끔 버튼. 휴대폰에서도 보이게 하고
              누르면 옆에 소·중·대가 펼쳐진다 (2026-09-12). */}
          <TextSizePicker />

          {/* 언어 선택 — 전에는 데스크톱에만 보였다. 모바일에서도 삼선 메뉴를 열지
              않고 바로 바꿀 수 있어야 한다는 피드백(2026-09-08)으로 항상 보이게 한다. */}
          <LanguagePicker />

          {/* 로그인 전에만 — 로그인 뒤의 「기록」은 메뉴에 이미 강조돼 있어 오른쪽에 또 두지 않는다 */}
          {!session && (
            <Link
              to={paths.login}
              className="hidden h-[44px] shrink-0 items-center whitespace-nowrap rounded-lg bg-brand-blue px-5 text-[15px] font-bold text-white lg:flex"
              id="topnav-login"
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
