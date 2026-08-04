import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import type { HolySite } from '@/shared/types/domain';
import { SiteThumbnail } from './SiteThumbnail';

/** 탐색(교구별) 화면의 가로형 목록 항목. */
export function SiteListItem({ site }: { site: HolySite }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to={paths.siteDetail(site.id)}
        className="group flex gap-5"
        id={`explore-item-${site.id}`}
      >
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-app-bg shadow-lg shadow-gray-100">
          <SiteThumbnail
            imageUrl={site.imageUrl}
            name={site.name}
            fallback="icon"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center border-b border-app-border pb-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-lg bg-brand-violet/5 px-2 text-[9px] font-extrabold uppercase tracking-tight text-brand-violet">
              {site.category}
            </span>
          </div>
          <h4 className="mb-1 text-lg font-bold leading-tight text-app-text transition-colors group-hover:text-brand-blue">
            {site.name}
          </h4>
          <p className="w-48 truncate text-xs font-medium text-app-text-muted">{site.location}</p>
        </div>
      </Link>
    </motion.div>
  );
}
