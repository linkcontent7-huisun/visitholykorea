import { BookOpen, Menu, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { AiGuideSheet } from '@/features/ai-guide/components/AiGuideSheet';
import { LanguagePicker } from '@/shared/i18n/LanguagePicker';
import { TextSizePicker } from '@/shared/i18n/TextSizePicker';
import { useSettings } from '@/shared/i18n/use-settings';

/** 헤더 높이 — 모바일 60px, 데스크톱(lg) 72px. 히어로가 그 아래로 완전히 내려가야 투명을 그만둔다. */
const HEADER_H = { base: 60, lg: 72 };

/**
 * 상단 내비게이션 — "웹 서비스형" 셸의 얼굴.
 *
 * 로고 + 글자크기 + 언어 + 로그인, 이 넷만 둔다(2026-09-17) — 「기록」·「성지 일정」·「더보기」는
 * 로그인해야 의미가 있는 메뉴라 헤더에 다시 두지 않는다. 이동은 하단 탭(`BottomNav`)과
 * 더보기 화면(`MenuPage`)이 이미 맡고 있다.
 *
 * 홈 화면만 투명 + `fixed` (2026-09-17 저녁) — 아래 100vw 히어로 슬라이드 위에 얹혀서 사진이
 * 헤더 뒤로 비친다. `sticky` 가 아니라 `BottomNav` 와 같은 `fixed` 를 쓴다 — 이 앱은 body 가
 * 아니라 `#app-scroll`(`ScrollShell`)을 스크롤시키는데, `overflow-auto` 조상은 `fixed` 만
 * 못 붙잡는다(`sticky`·`absolute` 는 그 상자와 같이 스크롤돼 버린다). `fixed` 라 레이아웃
 * 자리를 안 차지하므로 히어로가 화면 맨 위(0)부터 시작하고 헤더가 그 위에 뜬다.
 *
 * 하지만 `fixed` 는 스크롤해도 안 사라진다 — 히어로를 지나 흰 「성지 찾기」 카드까지 스크롤하면
 * 투명 유리 위의 흰 글자 로고가 흰 배경과 겹쳐 안 보이는 사고가 났다(실측). 그래서 히어로
 * (`#home-hero`)의 아래쪽 끝이 헤더 아래로 완전히 내려가면(`scrolled`) 다른 화면과 같은
 * 불투명 흰 배경으로 돌아간다 — 위치는 계속 `fixed` 로 두어(자리를 다시 차지하면 그만큼
 * 본문이 훌쩍 밀려 내려가 버벅여 보인다) 색만 바뀐다.
 *
 * 투명일 때 안의 버튼(글자크기·언어)은 `onDark` 로 반투명 검정 칩 + 흰 글자로 바꿔 사진이
 * 밝든 어둡든 읽힌다 — 성지 상세 히어로의 뒤로가기·즐겨찾기 버튼과 같은 방식(`SiteDetailPage`).
 * 다른 화면은 그대로 `sticky` + 흰 배경 — 사진이 없어 투명하게 할 이유가 없다.
 *
 * 높이는 모바일 60px, 데스크톱 72px 로 고정한다(두 모드 공통) — 지도 화면이 이 높이를 빼서
 * 화면을 꽉 채우기 때문에(`MapPage`) 임의로 바꾸면 지도 2분할이 어긋난다.
 */
export function TopNav() {
  const { t } = useSettings();
  const { session } = useSession();
  const { pathname } = useLocation();
  const isHome = pathname === paths.home;
  const [scrolled, setScrolled] = useState(false);
  // 미카엘 AI 시트 — 헤더 아무 화면에서나 열 수 있게 여기서 상태를 들고 있는다(2026-09-18 되살림).
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    const scrollEl = document.getElementById('app-scroll');
    if (!scrollEl) return;
    const onScroll = () => {
      const hero = document.getElementById('home-hero');
      // 홈은 lazy(Suspense) 라 처음 그릴 때 히어로가 아직 없을 수 있다 — 그 사이엔
      // 초기값(false, 투명)을 그대로 둔다. 0 으로 대신하면 "이미 지나갔다"로 잘못 읽어
      // 히어로가 뜨기도 전에 헤더가 불투명해진다(실측 — 데스크톱 1440px 새로고침).
      if (!hero) return;
      const headerH = window.innerWidth >= 1024 ? HEADER_H.lg : HEADER_H.base;
      setScrolled(hero.getBoundingClientRect().bottom <= headerH);
    };
    onScroll();
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      scrollEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isHome]);

  // 홈에서 히어로가 아직 헤더 아래로 보일 때만 투명 — 지나가면 다른 화면과 같은 흰 헤더
  const transparent = isHome && !scrolled;

  return (
    <>
      <header
        className={`${isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-40 transition-colors duration-200 ${
          transparent ? 'bg-transparent' : 'border-b border-app-border bg-white'
        }`}
      >
        {/* 상단바는 내용이 아니라 틀이다 — 글자 크기를 키워도 틀의 간격은 px 로 고정해
          「대」에서 버튼들이 오른쪽으로 밀려 잘리지 않게 한다 (2026-09-12). */}
        <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center gap-[12px] px-[20px] lg:h-[72px] lg:gap-[24px] lg:px-[32px]">
          {/* 로고 — 사장님이 만든 비둘기·십자가 마크 + 글자 (2026-09-12). 글자는 이미지가 아니라
            텍스트라 작은 화면에서도 선명하고, 마크 색(#04377C)에 맞췄다. 홈에서 사진 위에 뜰 때는
            마크에 옅은 그림자를, 글자는 흰색 + 그림자로 바꿔 사진이 밝아도 윤곽이 보이게 한다. */}
          <Link to={paths.home} className="flex shrink-0 items-center gap-[8px]" id="logo">
            <img
              src="/logo-mark-88.png"
              alt=""
              aria-hidden
              className={`h-[36px] w-auto lg:h-[40px] ${transparent ? 'drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]' : ''}`}
            />
            {/* 휴대폰에서는 두 줄(VisitHoly / Korea) — 한 줄로 길게 쓰면 옆 돋보기가 묻힌다
              (2026-09-13 사장님 요청). PC 는 자리가 넉넉하니 한 줄 그대로. */}
            <span
              className={`text-[13px] font-extrabold leading-[1.05] tracking-tight transition-colors duration-200 lg:hidden ${
                transparent
                  ? 'text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]'
                  : 'text-brand-blue'
              }`}
              aria-label="VisitHoly Korea"
            >
              VisitHoly
              <br />
              Korea
            </span>
            <span
              className={`hidden text-[19px] font-extrabold tracking-tight transition-colors duration-200 lg:inline ${
                transparent
                  ? 'text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]'
                  : 'text-brand-blue'
              }`}
            >
              VisitHolyKorea
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-[8px] lg:gap-[12px]">
            {/* 글자 크기 — 예전엔 데스크톱에만 있던 켬/끔 버튼. 휴대폰에서도 보이게 하고
              누르면 옆에 소·중·대가 펼쳐진다 (2026-09-12). */}
            <TextSizePicker variant={transparent ? 'onDark' : 'default'} />

            {/* 미카엘 AI — 재기획(2026-09-14)에서 정확성·비용 안전장치가 갖춰지기 전까지
              숨겨 뒀던 것을, 검색 정확도·Gemini 한도 안내를 고친 뒤(PR #40, 2026-09-17)
              되살린다(사장님 지적, 2026-09-18). 글자크기·언어 버튼과 같은 자리에 둔다. */}
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className={
                transparent
                  ? 'flex h-[44px] shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border-[1.5px] border-white/40 bg-black/30 px-[10px] text-[14px] font-bold text-white backdrop-blur-md transition-colors hover:bg-black/45'
                  : 'flex h-[44px] shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border-[1.5px] border-app-border bg-white px-[10px] text-[14px] font-bold text-brand-blue transition-colors hover:bg-app-bg'
              }
              id="ai-guide-toggle"
            >
              <Sparkles size={16} aria-hidden />
              {t('aiGuideNavLabel')}
            </button>

            {/* 언어 선택 — 2026-09-18에 "더보기에서도 바꿀 수 있다"는 이유로 뺐던 것을
              되살린다(2026-09-19, 다국어화 재착수 4-1) — 헤더·더보기 양쪽에서 바로 바꿀 수
              있어야 한다는 2026-09-08 원래 결정으로 되돌아간다. 지금은 ENABLED_LANGUAGES가
              ko/en뿐이라 목록엔 두 개만 보인다 — es/fr/pt/it 콘텐츠 번역이 채워지면 이 배열만
              늘리면 된다(4-3). 모바일에서도 삼선 메뉴를 열지 않고 바로 바꿀 수 있어야 해서
              데스크톱 전용(`lg:flex`) 밖, 늘 보이는 자리에 둔다. */}
            <LanguagePicker variant={transparent ? 'onDark' : 'default'} />

            {/* PC 「더보기」(햄버거) — 로그인 여부와 무관하게 항상 보인다(사장님 지적,
              2026-09-19). 하단 탭은 PC 에서 스스로 숨고(`lg:hidden`, `BottomNav.tsx`) 그
              자리를 TopNav 가 대신하기로 돼 있었는데, 로그인 전에는 더보기로 가는 길이
              PC 에 아예 없었다 — 언어·글자 크기·FAQ·약관처럼 로그인과 무관한 항목이
              더보기 안에 있는데도 막혀 있었다. */}
            <div className="hidden items-center gap-[8px] lg:flex">
              {session && (
                // 「기록」은 이 서비스의 중심이라(9/16 결정, BottomNav 의 솟은 버튼과 같은
                // 이유) 남색 채움으로 강조한다(사장님 지적, 2026-09-18) — 로그인해야
                // 의미가 있어 로그인 상태에서만 보인다.
                <Link
                  to={paths.records}
                  className={`flex h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-blue px-[14px] text-[14px] font-bold text-white transition-shadow hover:bg-brand-blue/90 ${
                    transparent ? 'shadow-lg shadow-black/25' : ''
                  }`}
                  id="topnav-records"
                >
                  <BookOpen size={16} aria-hidden />
                  {t('record')}
                </Link>
              )}
              <Link
                to={paths.menu}
                aria-label={t('moreTab')}
                title={t('moreTab')}
                className={
                  transparent
                    ? 'flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg border-[1.5px] border-white/40 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/45'
                    : 'flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg border-[1.5px] border-app-border bg-white text-brand-blue transition-colors hover:bg-app-bg'
                }
                id="topnav-more"
              >
                <Menu size={20} aria-hidden />
              </Link>
              {!session && (
                // 원래도 불투명한 남색 버튼이라 사진 위에서도 그대로 두고, 그림자만 살짝 더한다.
                <Link
                  to={paths.login}
                  className={`flex h-[44px] shrink-0 items-center whitespace-nowrap rounded-lg bg-brand-blue px-5 text-[15px] font-bold text-white transition-shadow ${
                    transparent ? 'shadow-lg shadow-black/25' : ''
                  }`}
                  id="topnav-login"
                >
                  {t('login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <AiGuideSheet isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}
