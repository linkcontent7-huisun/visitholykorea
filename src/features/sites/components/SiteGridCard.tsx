import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import type { HolySite } from '@/shared/types/domain';
import { SiteThumbnail } from './SiteThumbnail';
import { useFeaturedPhotos } from '../hooks/use-featured-photos';

/**
 * 홈·목록에 쓰는 성지 카드 — 2026-09-16 시안: 사진 4:3 · 모서리 8px · 이름 16px.
 * 사진 위 배지는 뺐고(사진이 말하게 둔다), 분류·주소 줄도 뺐다(2026-09-17 사장님 지시 — 카드에는 장소 이름만).
 */
export function SiteGridCard({ site }: { site: HolySite }) {
  // 공식 사진이 없는 성지는 순례자가 보내준(승인된) 사진으로 채운다
  const { data: featured = {} } = useFeaturedPhotos();
  return (
    <Link
      to={paths.siteDetail(site.id)}
      className="group flex flex-col overflow-hidden rounded-lg border border-app-border bg-white transition-colors duration-300 hover:border-brand-blue/50"
      id={`site-card-${site.id}`}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-app-panel">
        <SiteThumbnail
          imageUrl={site.imageUrl}
          pilgrimUrl={featured[site.id] ?? null}
          name={site.name}
          category={site.category}
          className="h-full w-full transform object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="px-3 py-3">
        {/* 2줄까지 허용 — 영어 등 이름이 긴 언어에서 1줄 말줄임(truncate)이 이름을
            심하게 잘라 보이게 했다(2026-09-19 실측). min-h 로 1줄짜리 이름과 카드
            높이를 맞춘다. */}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-bold leading-tight text-app-text">
          {site.name}
        </h3>
      </div>
    </Link>
  );
}
