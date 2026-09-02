import { Headphones } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { getDocentScript } from '@/features/docent/data/scripts';
import type { HolySite } from '@/shared/types/domain';
import { SiteThumbnail } from './SiteThumbnail';
import { useFeaturedPhotos } from '../hooks/use-featured-photos';

/** 탐색(교구별) 화면의 가로형 목록 항목. meta 는 거리·소요시간 같은 한 줄 부가 정보. */
export function SiteListItem({ site, meta }: { site: HolySite; meta?: string }) {
  // 공식 사진이 없는 성지는 순례자가 보내준(승인된) 사진으로 채운다
  const { data: featured = {} } = useFeaturedPhotos();
  // 포인트별 오디오 도슨트가 준비된 성지를 목록에서 알아볼 수 있게 한다
  const hasDocent = getDocentScript(site.id) !== null;
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
            pilgrimUrl={featured[site.id] ?? null}
            name={site.name}
            category={site.category}
            fallback="icon"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center border-b border-app-border pb-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-lg bg-brand-violet/5 px-2 text-[9px] font-extrabold uppercase tracking-tight text-brand-violet">
              {site.category}
            </span>
            {hasDocent && (
              <span className="flex items-center gap-1 rounded-lg bg-brand-blue/5 px-2 text-[9px] font-extrabold text-brand-blue">
                <Headphones size={10} aria-hidden />
                오디오 도슨트
              </span>
            )}
          </div>
          <h4 className="mb-1 text-lg font-bold leading-tight text-app-text transition-colors group-hover:text-brand-blue">
            {site.name}
          </h4>
          <p className="w-48 truncate text-xs font-medium text-app-text-muted">{site.location}</p>
          {/* 가까운 순 정렬일 때 — 여기가 얼마나 먼 곳인지 목록에서 바로 보인다 */}
          {meta && <p className="mt-0.5 text-[11px] font-bold text-brand-blue">{meta}</p>}
        </div>
      </Link>
    </motion.div>
  );
}
