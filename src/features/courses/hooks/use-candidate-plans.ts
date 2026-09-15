import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/shared/api/query-keys';
import { getNearbyByLocation, type TourApiSpot } from '@/shared/api/tour-api';
import { useOngoingFestivals } from '@/features/festivals/api/use-festivals';
import { useSettings } from '@/shared/i18n/use-settings';
import {
  combineCrowdingScore,
  festivalPressure,
  infraDensity,
  RADIUS_KM,
  type CrowdingScore,
} from '@/features/quiet/api/crowding-score';
import { fetchCongestionRatesForSite, matchingCongestion } from '@/features/quiet/api/quiet-sites';
import { groupNearbyFacilities, type GroupedFacilities } from '@/features/sites/lib/nearby-facilities';
import { rankAfternoon, type AfternoonPick } from '../lib/afternoon-pick';
import { assignTags, type CandidateTag } from '../lib/candidate-tags';
import type { PooledSite } from '../api/course-matching';

/**
 * 카드 3장의 실시간 데이터 — 시설 · 축제 · 집중률을 받아 붐빔 · 점심 · 오후 · 태그를 만든다.
 *
 * 호출 수(스펙 8-3): 시설 5km ×3 + 오늘 축제 ×1 + 집중률 ×0~1(시·도별 6시간 메모리 캐시).
 * 인근 붐빔의 "명소 밀도" 축은 시설 응답에서 3km 안만 세어 쓴다 — 따로 부르지 않는다.
 * 카드를 눌러 일정 화면으로 가도 **추가 호출 0** — 여기서 받은 것을 그대로 쓴다.
 *
 * `staleTime: 0` — TourAPI 응답은 저장·재사용 대상이 아니다(공모전 규정). 메모리에 잠깐만.
 */
const REALTIME_QUERY_OPTIONS = { staleTime: 0, gcTime: 1000 * 30, retry: 0 } as const;

export interface Candidate extends PooledSite {
  tag: CandidateTag | null;
  /** null = 시설 조회 실패 */
  facilities: GroupedFacilities[] | null;
  /** null = 축제 조회 실패(붐빔을 낼 수 없음) */
  crowding: CrowdingScore | null;
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
          getNearbyByLocation(lng!, lat!, { radiusMeters: 5000, numOfRows: 50, contentTypeId: null, language }),
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

  // useQueries 결과 배열은 렌더마다 새 객체라 안의 data 로 의존성을 잡는다.
  const facilityData = facilities.map((q) => q.data);
  const facilityDone = facilities.map((q) => q.isSuccess || q.isError);
  const rateData = rates.map((q) => q.data);

  return useMemo(() => {
    const drafts = pooled.map((p, i) => {
      const spots = facilityData[i] ?? null;
      const siteRates = rateData[i] ?? [];
      const grouped = spots ? groupNearbyFacilities(spots) : null;
      const infra = spots ? spots.filter((s) => Number(s.dist) <= RADIUS_KM.infra * 1000) : null;
      // ponytail: 시설 응답(5km · 50건)에서 3km 안만 세므로 전용 3km 호출보다 조금 적게 잡힐 수 있다.
      // 정확도가 문제되면 인프라 전용 호출로 되돌린다 — 호출 +3.
      const crowding = festivals.data
        ? combineCrowdingScore(
            festivalPressure(p.site.coordinates, festivals.data),
            infra ? infraDensity(infra) : null,
            matchingCongestion(p.site, siteRates),
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
        crowdingScore: allSettled && d.crowding && !d.crowding.isPartial ? d.crowding.score : null,
      })),
    );
    return drafts.map((d, i) => ({ ...d, tag: tags[i] ?? null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pooled, festivals.data, festivals.isSuccess, festivals.isError, ...facilityData, ...facilityDone, ...rateData]);
}
