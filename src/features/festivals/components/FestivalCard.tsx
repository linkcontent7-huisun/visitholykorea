/**
 * 축제 카드 — 위는 오늘 열리는 행사(한국관광공사 실시간), 아래는 그 옆의 성지.
 *
 * 카드의 무게중심을 **아래(성지)** 에 둔다. 축제는 사람이 이미 가려는 곳이고,
 * 우리가 새로 건네는 것은 "그 김에 들를 성지"이기 때문이다.
 * 성지 줄은 통째로 눌러 성지 상세로 가는 링크다 — 고령 이용자가 작은 글자를
 * 정확히 누르지 않아도 되게 줄 전체를 누름 영역으로 잡았다.
 */

import { CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { CrowdingBadge } from '@/features/quiet/components/CrowdingBadge';
import type { FestivalWithSites } from '../api/festival-pairs';
import { formatDistanceKm, formatFestivalPeriod } from '../api/festival-pairs';

interface FestivalCardProps {
  festival: FestivalWithSites;
  /** '근처 성지' 라벨 (언어별) */
  nearbyLabel: string;
}

export function FestivalCard({ festival, nearbyLabel }: FestivalCardProps) {
  const period = formatFestivalPeriod(festival.startDate, festival.endDate);

  return (
    <article className="overflow-hidden rounded-[20px] border border-app-border bg-white">
      {/* 축제 */}
      <div className="p-5">
        <h3 className="text-base font-extrabold leading-snug tracking-tight text-app-text">
          {festival.title}
        </h3>
        {period && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-app-text-muted">
            <CalendarDays size={14} className="shrink-0" aria-hidden />
            <span>{period}</span>
          </p>
        )}
        {festival.address && (
          <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-app-text-muted">
            <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{festival.address}</span>
          </p>
        )}
      </div>

      {/* 그 옆의 성지 */}
      <div className="border-t border-app-border bg-app-bg px-5 py-4">
        {/* 큰 글자 모드(html 118%)에서 함께 커지도록 px 대신 rem 으로 적는다 */}
        <p className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-widest text-brand-violet">
          {nearbyLabel}
        </p>
        <ul className="space-y-2">
          {festival.sites.map(({ site, distanceKm, crowding }) => (
            <li key={site.id}>
              <Link
                to={paths.siteDetail(site.id)}
                className="flex items-center gap-3 rounded-2xl border border-app-border bg-white px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  {/* 성지 이름은 자르지 않고 접는다 — 큰 글자 모드에서 이름이 사라지면 고를 수 없다.
                      break-keep 은 한국어 낱말을 낱글자로 쪼개지 않는다. */}
                  <span className="block break-keep text-sm font-bold leading-snug text-app-text">
                    {site.name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-app-text-muted">
                      {formatDistanceKm(distanceKm)}
                    </span>
                    <CrowdingBadge
                      level={crowding.level}
                      score={crowding.score}
                      isPartial={crowding.isPartial}
                    />
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-app-text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
