import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import type { QuietSite } from '../api/quiet-sites';
import { CrowdingBadge } from './CrowdingBadge';

/**
 * "오늘 조용한 성지" 카드.
 *
 * 사진을 쓰지 않는다. 성지 대부분에 사진이 없어서이기도 하지만,
 * 더 큰 이유는 이 카드가 파는 것이 **풍경이 아니라 오늘의 상태**이기 때문이다.
 * 그래서 이름과 근거 문장이 화면을 차지한다.
 */
export function QuietSiteCard({ site, crowding }: QuietSite) {
  return (
    <Link
      to={paths.siteDetail(site.id)}
      className="block rounded-[20px] border border-app-border bg-white p-5 transition-colors hover:border-brand-blue/30"
      id={`quiet-${site.id}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold tracking-tight text-app-text">{site.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-app-text-muted">
            <MapPin size={11} className="shrink-0" />
            {site.location}
          </p>
        </div>
        <CrowdingBadge
          level={crowding.level}
          score={crowding.score}
          isPartial={crowding.isPartial}
        />
      </div>

      {/* 숫자만 보여주면 믿지 않는다. 왜 조용하다고 보는지를 그대로 적는다. */}
      <ul className="space-y-1">
        {crowding.reasons.map((reason) => (
          <li key={reason} className="flex gap-2 text-[12px] leading-relaxed text-app-text-muted">
            <span aria-hidden className="text-app-border">
              ·
            </span>
            {reason}
          </li>
        ))}
      </ul>
    </Link>
  );
}
