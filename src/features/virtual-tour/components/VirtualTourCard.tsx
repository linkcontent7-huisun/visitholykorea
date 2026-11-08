import { ChevronRight } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { useSettings } from '@/shared/i18n/use-settings';
import type { VirtualTour } from '../data/virtual-tours';

/**
 * 3D 가상 순례로 들어가는 카드 — 홈 첫 화면(`home`)과 3D 가 있는 성지 상세(`site`)에서 쓴다.
 *
 * `/visit/` 은 SPA 라우트가 아니라 vercel.json rewrite 로 붙인 별도 앱이다.
 * 그래서 react-router `<Link>` 가 아니라 `<a href>` 로 페이지 전체를 이동한다
 * (서비스워커도 `/visit/` 을 앱 셸로 바꾸지 않게 vite.config.ts 에서 뺐다).
 *
 * 가짜 숫자(「N개국에서 켠 초」 등)는 넣지 않는다 — 실제 기록(F2)이 생기기 전까지는 진입만 보인다.
 */
export function VirtualTourCard({
  tour,
  variant,
  id,
}: {
  tour: VirtualTour;
  variant: 'home' | 'site';
  id: string;
}) {
  const { t } = useSettings();
  const title = variant === 'home' ? t('virtualTourHomeTitle') : t('virtualTourSiteTitle');
  const sub = variant === 'home' ? t('virtualTourHomeSub') : t('virtualTourSiteSub');

  return (
    <a
      href={paths.virtualTour(tour.space, variant)}
      id={id}
      className="group relative flex w-full items-stretch overflow-hidden rounded-xl bg-[#1b1814] text-left text-white shadow-md transition-transform active:scale-[0.99]"
    >
      <span className="relative w-28 shrink-0 overflow-hidden sm:w-44" aria-hidden>
        <img
          src={tour.thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded bg-[#d4a017] px-1.5 py-0.5 text-xs font-black text-[#1b1814]">
          3D
        </span>
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#f2c84b]">{t('virtualTourKicker')}</span>
          <span className="mt-0.5 block font-display text-xl leading-tight">{title}</span>
          <span className="mt-1 block text-sm text-white/85">{sub}</span>
          <span className="mt-2 block text-xs text-white/55">{t('virtualTourNote')}</span>
        </span>
        <ChevronRight size={22} aria-hidden className="shrink-0" />
      </span>
    </a>
  );
}
