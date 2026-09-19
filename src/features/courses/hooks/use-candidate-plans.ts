import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { getNearbyByLocation, type TourApiSpot } from '@/shared/api/tour-api';
import { useOngoingFestivals } from '@/features/festivals/api/use-festivals';
import { useSettings } from '@/shared/i18n/use-settings';
import {
  combineNearbyCrowding,
  festivalPressure,
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
 * 카드 3장의 실시간 데이터 — 시설 · 축제 · 집중률을 받아 인근 혼잡도 · 점심 · 오후 · 태그를 만든다.
 *
 * 호출 수(스펙 8-3): 시설 5km ×3 + 오늘 축제 ×1 + 집중률 ×0~3(시·군·구별 6시간 메모리 캐시).
 * 인근 혼잡도는 집중률 + 오늘 축제만으로 낸다(2026-09-16 재설계) — 시설 개수는 더 이상 세지 않는다.
 * 카드를 눌러 일정 화면으로 가도 **추가 호출 0** — 여기서 받은 것을 그대로 쓴다.
 *
 * `staleTime: 0` — TourAPI 응답은 저장·재사용 대상이 아니다(공모전 규정). 메모리에 잠깐만.
 */
const REALTIME_QUERY_OPTIONS = { staleTime: 0, gcTime: 1000 * 30, retry: 0 } as const;

export interface Candidate extends PooledSite {
  tag: CandidateTag | null;
  /** null = 시설 조회 실패 */
  facilities: GroupedFacilities[] | null;
  /** null = 축제 조회 실패(혼잡도를 낼 수 없음). level 이 null 이면 집중률 없는 지역 */
  crowding: NearbyCrowding | null;
  lunch: TourApiSpot | null;
  /** 오후 후보 — 덜 붐비는 순. [0] 이 기본, 「바꾸기」로 다음 */
  afternoon: AfternoonPick[];
  /** 시설·축제 조회가 아직인가 — 태그 자리에 「확인 중…」 */
  loading: boolean;
}

export function useCandidatePlans(pooled: readonly PooledSite[]): Candidate[] {
  const { language } = useSettings();

  // 오늘 축제는 「축제 가는 김에」와 같은 조회를 나눠 쓴다 — 하루 안에서 1회면 된다.
  const festivals = useOngoingFestivals(pooled.length > 0);

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

  {
    const drafts = pooled.map((p, i) => {
      const spots = facilityData[i] ?? null;
      const siteRates = rateData[i] ?? [];
      const grouped = spots ? groupNearbyFacilities(spots) : null;
      const crowding = festivals.data
        ? combineNearbyCrowding(
            festivalPressure(p.site.coordinates, festivals.data),
            pickCongestion(p.site.name, siteRates),
          )
        : null;
      const sightseeing = grouped?.find((g) => g.group === '볼거리')?.spots ?? [];
      return {
        ...p,
        tag: null as CandidateTag | null,
        facilities: grouped,
        crowding,
        lunch: grouped?.find((g) => g.group === '맛집')?.spots[0] ?? null,
        afternoon: rankAfternoon(sightseeing, siteRates),
        loading: !(facilityDone[i] && (festivals.isSuccess || festivals.isError)),
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
