/**
 * 성지 주변 본당·공소·피정의집.
 *
 * 로드맵 3단계 "catholic_directory 활용". 교구 주소록 5,918건 중 좌표가
 * 있는 곳을 반경 5km 에서 찾아 보여준다. 미사 시간은 본당마다 수시로
 * 바뀌므로 적지 않는다 — 전화로 확인하게 안내하는 것이 정직하다.
 */

import { Church, Phone } from 'lucide-react';
import type { HolySite } from '@/shared/types/domain';
import { formatDistanceKm } from '../lib/nearby-directory';
import { useNearbyDirectory } from '../hooks/use-nearby-directory';

export function NearbyParishesCard({ site }: { site: HolySite }) {
  const { data: places = [], isLoading } = useNearbyDirectory(site.coordinates);

  // 좌표가 없거나 주변에 아무것도 없으면 카드 자체를 내리지 않는다 — 빈 껍데기 금지
  if (isLoading || places.length === 0) return null;

  return (
    <div className="rounded-[20px] border border-app-border bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Church size={16} className="text-brand-violet" aria-hidden />
        <h3 className="text-sm font-bold text-app-text">주변 본당·피정의집</h3>
      </div>

      <ul className="space-y-3">
        {places.map((p) => (
          <li key={p.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-app-text">
                {p.name}
                <span className="ml-2 inline-block rounded-full bg-app-bg px-2 py-0.5 text-xs text-app-text-muted">
                  {p.category}
                </span>
              </p>
              {p.address && (
                <p className="mt-0.5 truncate text-xs text-app-text-muted">{p.address}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-bold tabular-nums text-app-text-muted">
                {formatDistanceKm(p.distanceKm)}
              </span>
              {p.phone && (
                <a
                  href={`tel:${p.phone}`}
                  aria-label={`${p.name} 전화 걸기`}
                  className="rounded-xl bg-app-bg p-2 text-brand-violet"
                >
                  <Phone size={14} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-app-text-muted">
        미사 시간은 본당 사정에 따라 바뀌니 방문 전 전화로 확인해 주세요.
      </p>
    </div>
  );
}
