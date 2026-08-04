import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import type { HolySite } from '@/shared/types/domain';
import { SiteThumbnail } from './SiteThumbnail';

/** 홈 화면 "전국 성지 탐방" 그리드에 쓰는 정사각형 카드. */
export function SiteGridCard({ site }: { site: HolySite }) {
  return (
    <Link
      to={paths.siteDetail(site.id)}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-app-border bg-white shadow-sm transition-colors hover:border-brand-violet/30"
      id={`site-card-${site.id}`}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-app-bg">
        <SiteThumbnail
          imageUrl={site.imageUrl}
          name={site.name}
          className="h-full w-full transform object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-tight text-brand-blue shadow-sm backdrop-blur-sm">
          {site.category}
        </div>
      </div>
      <div className="p-4">
        <h4 className="truncate text-sm font-bold text-app-text">{site.name}</h4>
        <p className="mt-1 truncate text-[11px] text-app-text-muted">{site.location}</p>
      </div>
    </Link>
  );
}
