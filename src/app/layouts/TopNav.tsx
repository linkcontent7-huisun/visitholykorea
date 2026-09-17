import { Link, NavLink } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { LanguagePicker } from '@/shared/i18n/LanguagePicker';
import { TextSizePicker } from '@/shared/i18n/TextSizePicker';
import { useSettings } from '@/shared/i18n/use-settings';
import { TOP_NAV_ITEMS } from './nav-items';

/**
 * 상단 내비게이션 — "웹 서비스형" 셸의 얼굴.
 *
 * 데스크톱(lg 이상)에서는 로고 + 메뉴(기록·성지 일정·더보기) + 글자크기 + 언어 + 로그인이 한 줄에 온다.
 * 모바일에서는 로고 + 글자크기 + 언어만 남긴다. 삼선(전체) 메뉴는 언어 버튼 옆에
 * 있으면 헷갈린다는 사장님 요청(2026-09-13)으로 하단 탭 「설정」 옆으로 옮겼다(`BottomNav`).
 *
 * 검색창·돋보기는 뺐다(2026-09-17) — 상단바 「성지 찾기」·검색창·홈 입구 카드가 전부 `/search` 로
 * 이어져 셋 중 홈 입구 카드 하나만 남겼다. 검색은 홈 카드, 휴대폰 하단 탭, 더보기 > 전체 서비스에서 간다.
 *
 * 높이는 모바일 60px, 데스크톱 72px 로 고정한다 — 지도 화면이 이 높이를 빼서
 * 화면을 꽉 채우기 때문에(`MapPage`) 임의로 바꾸면 지도 2분할이 어긋난다.
 */
export function TopNav() {
  const { t } = useSettings();
  const { session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-white/95 backdrop-blur-md">
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

        {/* 데스크톱 메뉴 */}
        <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="주요 메뉴">
          {TOP_NAV_ITEMS.map((item) => (
            <NavLink key={item.id} to={item.to} end={item.end} id={`topnav-${item.id}`}>
              {({ isActive }) =>
                item.id === 'record' ? (
                  // 「기록」은 서비스의 중심(2026-09-16) — 하단 탭의 솟은 단추와 같은 규칙:
                  // 평소 남색 테두리, 기록 화면에서만 남색 채움.
                  <span
                    className={`flex h-[44px] items-center gap-1.5 whitespace-nowrap rounded-lg border-2 border-brand-blue px-4 text-[16px] font-bold transition-colors ${
                      isActive ? 'bg-brand-blue text-white' : 'bg-white text-brand-blue'
                    }`}
                  >
                    <item.icon size={18} aria-hidden />
                    {t(item.labelKey)}
                  </span>
                ) : (
                  <span
                    className={`block whitespace-nowrap border-b-2 py-1.5 text-[16px] font-bold transition-colors ${
                      isActive
                        ? 'border-brand-blue text-brand-blue'
                        : 'border-transparent text-app-text hover:text-brand-blue'
                    }`}
                  >
                    {t(item.labelKey)}
                  </span>
                )
              }
            </NavLink>
          ))}
        </nav>

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
