import { Accessibility } from 'lucide-react';
import { useBarrierFreeNearby } from '../hooks/use-nearby-tour';
import type { HolySite } from '@/shared/types/domain';

/**
 * 성지 주변 무장애 여행 정보 (한국관광공사 실시간).
 *
 * 신자 65세 이상이 28.9%다(한국 천주교회 통계 2025). 성지는 계단·언덕이
 * 많아 "갈 수 있는가"가 먼저 걸리는데, 그 정보를 지금 아무도 안내하지 않는다.
 *
 * **결과가 없으면 섹션 자체를 그리지 않는다.** 로딩 자리표시자도 두지 않는다 —
 * 호출 경로가 아직 검증 전이라(`npm run tourapi:check`), 확인되지 않은 기능이
 * 빈 껍데기로 먼저 보이는 일을 만들지 않기 위해서다.
 */
export function BarrierFreeCard({ site }: { site: HolySite }) {
  const { data: places = [] } = useBarrierFreeNearby(site.coordinates);

  if (places.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-1.5 rounded-full bg-brand-violet" />
        <h2 className="flex-1 text-xl font-extrabold tracking-tight text-app-text">
          무장애 여행 정보
        </h2>
        <span className="text-[10px] font-bold text-app-text-muted">실시간 · 한국관광공사</span>
      </div>

      <ul className="space-y-3">
        {places.map((place) => (
          <li
            key={place.contentid}
            className="flex items-center gap-4 rounded-[20px] border border-app-border bg-app-bg p-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-violet/10 text-brand-violet">
              <Accessibility size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-app-text">{place.title}</h3>
              <p className="truncate text-[10px] font-bold text-app-text-muted">
                {place.addr1}
                {place.dist ? ` · ${Math.round(Number(place.dist) / 100) / 10}km` : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* 정보의 한계를 밝힌다 — 실제 접근성은 현장이 다를 수 있다 */}
      <p className="mt-3 text-[11px] leading-relaxed text-app-text-muted">
        한국관광공사가 수집한 무장애 정보입니다. 성지 내부의 계단·경사는 다를 수 있으니
        방문 전 성지 사무실에 확인하시는 것이 가장 정확합니다.
      </p>
    </section>
  );
}
