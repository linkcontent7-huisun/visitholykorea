import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { getNearbyByLocation, type TourApiSpot } from '@/shared/api/tour-api';
import { useSettings } from '@/shared/i18n/use-settings';
import {
  combineNearbyCrowding,
  pickCongestion,
  type NearbyCrowding,
} from '@/features/crowding/api/crowding-score';
import { fetchCongestionRatesForSite } from '@/features/crowding/api/congestion-lookup';
import {
  groupNearbyFacilities,
  type GroupedFacilities,
} from '@/features/sites/lib/nearby-facilities';
import { rankAfternoon, type AfternoonPick } from '../lib/afternoon-pick';
import { assignTags, type CandidateTag } from '../lib/candidate-tags';
import type { PooledSite } from '../api/course-matching';

/**
 * 카드 3장의 실시간 데이터 — 시설 · 집중률을 받아 인근 혼잡도 · 점심 · 오후 · 태그를 만든다.
 *
 * 호출 수: 시설 5km ×3 + 집중률 ×0~3(시·군·구별 6시간 메모리 캐시).
 * 인근 혼잡도는 관광지 집중률로 계산한다.
 * 카드를 눌러 일정 화면으로 가도 **추가 호출 0** — 여기서 받은 것을 그대로 쓴다.
 *
 * `staleTime: 0` — TourAPI 응답은 저장·재사용 대상이 아니다(공모전 규정). 메모리에 잠깐만.
 */
const REALTIME_QUERY_OPTIONS = { staleTime: 0, gcTime: 1000 * 30, retry: 0 } as const;

export interface Candidate extends PooledSite {
  tag: CandidateTag | null;
  /** null = 시설 조회 실패 */
  facilities: GroupedFacilities[] | null;
  /** level 이 null 이면 집중률 없는 지역 */
  crowding: NearbyCrowding | null;
  lunch: TourApiSpot | null;
  /** 오후 후보 — 덜 붐비는 순. [0] 이 기본, 「바꾸기」로 다음 */
  afternoon: AfternoonPick[];
  /** 시설·집중률 조회가 아직인가 — 태그 자리에 「확인 중…」 */
  loading: boolean;
}

export function useCandidatePlans(pooled: readonly PooledSite[]): Candidate[] {
  const { language } = useSettings();

  const facilities = useQueries({
    queries: pooled.map(({ site }) => {
      const { lat, lng } = site.coordinates;
      return {
        queryKey: queryKeys.tour.facilities(lat ?? 0, lng ?? 0, language),
        queryFn: () =>
          getNearbyByLocation(lng!, lat!, {
            radiusMeters: 5000,
            numOfRows: 50,
            contentTypeId: null,
            language,
          }),
        enabled: lat != null && lng != null,
        ...REALTIME_QUERY_OPTIONS,
      };
    }),
  });

  const rates = useQueries({
    queries: pooled.map(({ site }) => ({
      queryKey: ['tour', 'congestion-rates', site.id] as const,
      queryFn: () => fetchCongestionRatesForSite(site),
      ...REALTIME_QUERY_OPTIONS,
    })),
  });

  // 메모하지 않는다 — 카드 3장 계산은 싸고, 길이가 변하는 의존성 배열은 React 가 경고한다.
  const facilityData = facilities.map((q) => q.data);
  const facilityDone = facilities.map((q) => q.isSuccess || q.isError);
  const rateData = rates.map((q) => q.data);
  const rateDone = rates.map((q) => q.isSuccess || q.isError);

  {
    const drafts = pooled.map((p, i) => {
      const spots = facilityData[i] ?? null;
      const siteRates = rateData[i] ?? [];
      const grouped = spots ? groupNearbyFacilities(spots) : null;
      const crowding = combineNearbyCrowding(pickCongestion(p.site.name, siteRates));
      const sightseeing = grouped?.find((g) => g.group === '볼거리')?.spots ?? [];
      return {
        ...p,
        tag: null as CandidateTag | null,
        facilities: grouped,
        crowding,
        lunch: grouped?.find((g) => g.group === '맛집')?.spots[0] ?? null,
        afternoon: rankAfternoon(sightseeing, siteRates),
        loading: !(facilityDone[i] && rateDone[i]),
      };
    });

    // 조용 태그는 3장 다 조회가 끝난 뒤에 매긴다 — 먼저 온 카드가 잠깐 「조용」이었다가 바뀌지 않게.
    const allSettled = drafts.every((d) => !d.loading);
    const tags = assignTags(
      drafts.map((d) => ({
        distanceKm: d.distanceKm,
        quality: d.quality,
        crowdingScore: allSettled && d.crowding ? d.crowding.score : null,
      })),
    );
    return drafts.map((d, i) => ({ ...d, tag: tags[i] ?? null }));
  }
}
