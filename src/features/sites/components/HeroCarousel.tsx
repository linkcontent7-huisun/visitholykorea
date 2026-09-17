import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSettings } from '@/shared/i18n/use-settings';
import { heroImageSrc } from '../data/hero-sites';

export interface HeroSlide {
  id: string;
  slug: string;
  name: string;
  /** 사진 아래 작은 줄 — "서울 · 주교좌성당" */
  caption: string;
  credit: string;
  /** 사진 초점(CSS object-position). 없으면 가운데 */
  objectPosition?: string;
}

/**
 * 홈 히어로 — 성지 사진 5장을 좌우로 넘겨 보는 슬라이드 (2026-09-16 회의 · 시안 확정).
 *
 * 영상 없이 사진만. 사진 위에는 이름·지역 한 줄과 넘김 점·화살표만 얹는다(검색창은 뺐다 — 시안 버전 7).
 * 넘김은 CSS scroll-snap 이 하고, 화살표는 그 위치로 스크롤만 시킨다 — 손으로 밀든 화살표를 누르든
 * 같은 상태(스크롤 위치)를 본다. 6초마다 다음 장으로 넘어가되, 손을 대거나 마우스를 올리면 멈추고
 * 「동작 줄이기」 설정이면 아예 돌리지 않는다(50대 이상 · 접근성).
 *
 * 마지막 장에서 다음으로 가면 **앞으로** 1장이 나온다(2026-09-17). 전에는 스크롤 위치를 0 으로 되돌려
 * 5→4→3→2→1 을 거꾸로 훑고 지나갔다. 그래서 맨 뒤에 1장의 복제본을 한 장 더 두고, 거기 도착하면
 * 눈에 안 띄게 진짜 1장으로 순간 이동한다. 1장에서 「이전」도 같은 원리로 5장이 왼쪽에서 나온다.
 *
 * 화면 첫 그림(LCP)이라 첫 장만 `fetchPriority="high"`, 나머지는 지연 로드.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const { t } = useSettings();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // 「이전」으로 1→5 를 넘길 때 복제본으로 순간 이동한 상태 — 그 순간엔 onScroll 이 1장으로 되돌리면 안 된다
  const wrappingBackRef = useRef(false);
  const count = slides.length;
  // 두 장 이상일 때만 맨 뒤에 1장 복제본을 붙인다. 복제본의 위치 번호는 `count`.
  const track = count > 1 ? [...slides, slides[0]!] : slides;

  const goTo = useCallback(
    (next: number, behavior: ScrollBehavior = 'smooth') => {
      const el = trackRef.current;
      if (!el || count === 0) return;
      const width = el.clientWidth;
      if (next >= count) {
        // 마지막 → 처음: 복제본(맨 뒤)으로 앞으로 밀고, 도착은 onScroll 이 진짜 1장으로 바꿔 놓는다
        el.scrollTo({ left: count * width, behavior });
        return;
      }
      if (next < 0) {
        // 처음 → 마지막: 복제본으로 순간 이동한 뒤 왼쪽으로 한 장 민다
        wrappingBackRef.current = true;
        el.scrollTo({ left: count * width, behavior: 'instant' });
        requestAnimationFrame(() => el.scrollTo({ left: (count - 1) * width, behavior }));
        return;
      }
      el.scrollTo({ left: next * width, behavior });
    },
    [count],
  );

  // 스크롤 위치 → 현재 장. 한 프레임에 한 번만 계산한다.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const width = Math.max(1, el.clientWidth);
      const raw = Math.round(el.scrollLeft / width);
      if (wrappingBackRef.current) {
        // 복제본에서 왼쪽으로 움직이기 시작해야 정상 상태로 돌아온다
        if (el.scrollLeft < count * width - 2) wrappingBackRef.current = false;
        else return;
      }
      // 복제본에 완전히 도착했으면 진짜 1장으로 소리 없이 옮긴다
      if (count > 1 && raw >= count && Math.abs(el.scrollLeft - count * width) < 2) {
        el.scrollTo({ left: 0, behavior: 'instant' });
        setIndex(0);
        return;
      }
      // 복제본 쪽에 가까워지는 동안은 마지막 장으로 센다
      const next = raw >= count ? count - 1 : raw;
      setIndex((prev) => (prev === next ? prev : next));
    });
  };

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => goTo(index + 1), 6000);
    return () => window.clearInterval(timer);
  }, [paused, count, index, goTo]);

  if (count === 0) return null;

  // 화살표는 사진 세로 한가운데 (2026-09-17). 전엔 40% 높이라 아래 글자 쪽으로 치우쳐 보였다.
  const arrowClass =
    'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-app-text shadow-md backdrop-blur-sm';

  return (
    <section
      className="relative"
      aria-roledescription="carousel"
      aria-label={t('heroCarouselLabel')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex h-[320px] snap-x snap-mandatory overflow-x-auto lg:h-[520px]"
      >
        {track.map((slide, i) => (
          <Link
            key={i < count ? slide.id : `${slide.id}-clone`}
            to={paths.siteDetail(slide.id)}
            className="relative h-full w-full shrink-0 snap-center overflow-hidden bg-app-panel"
            aria-label={`${slide.name} (${(i % count) + 1} / ${count})`}
            id={i === 0 ? 'home-hero' : undefined}
            // 복제본은 보조기기·탭 이동에서 숨긴다 — 같은 장이 둘로 읽히면 안 된다
            aria-hidden={i >= count || undefined}
            tabIndex={i >= count ? -1 : undefined}
          >
            <img
              src={heroImageSrc(slide.slug, 800)}
              srcSet={`${heroImageSrc(slide.slug, 800)} 800w, ${heroImageSrc(slide.slug, 1280)} 1280w`}
              sizes="100vw"
              alt=""
              className="h-full w-full object-cover"
              style={slide.objectPosition ? { objectPosition: slide.objectPosition } : undefined}
              fetchPriority={i === 0 ? 'high' : 'low'}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
            <div
              className="absolute inset-0"
              aria-hidden
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,.18) 45%, rgba(0,0,0,.05) 100%)',
              }}
            />
            <div className="absolute inset-x-5 bottom-7 text-white [text-shadow:0_1px_8px_rgba(0,0,0,.45)] lg:inset-x-8 lg:bottom-10">
              <p className="text-sm font-bold tracking-wide opacity-95">{slide.caption}</p>
              <h2 className="mt-1 font-display text-[1.75rem] leading-tight lg:text-[2.5rem]">
                {slide.name}
              </h2>
            </div>
            {/* CC 계열 라이선스 — 출처 표기는 의무. 우하단(2026-09-17) — 캡션과 같은 높이,
                맨 아래 넘김 점과는 겹치지 않게 살짝 위에 둔다 */}
            <span className="absolute bottom-7 right-3 max-w-[60%] truncate rounded bg-black/40 px-2 py-0.5 text-xs text-white/85 backdrop-blur-sm lg:bottom-10">
              {slide.credit}
            </span>
          </Link>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className={`${arrowClass} left-3`}
            aria-label={t('heroPrev')}
            id="hero-prev"
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className={`${arrowClass} right-3`}
            aria-label={t('heroNext')}
            id="hero-next"
          >
            <ChevronRight size={24} aria-hidden />
          </button>
          {/* 헤더가 이제 투명하게 이 슬라이드 위에 뜬다(2026-09-17 저녁) — 헤더 높이(모바일
              60px·PC 72px) 아래로 내려서 헤더 오른쪽 버튼들과 겹치지 않게 한다 */}
          <div
            className="absolute right-4 top-[70px] rounded-full bg-black/40 px-2.5 py-1 text-[0.8125rem] font-bold tracking-wide text-white lg:top-[84px]"
            aria-live="polite"
          >
            {index + 1} / {count}
          </div>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5" aria-hidden>
            {slides.map((slide, i) => (
              <span
                key={slide.id}
                className={`block h-1.5 rounded-full transition-all ${i === index ? 'w-[18px] bg-white' : 'w-1.5 bg-white/55'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
