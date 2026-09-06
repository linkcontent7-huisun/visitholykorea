/**
 * 성지 주변 편의시설 분류.
 *
 * **왜 분류를 따로 두는가** — TourAPI 는 유형별로 따로 부를 수도 있지만,
 * 그러면 유형 수만큼 호출이 늘어난다. 붐빔 지수가 이미 쓰고 있는 방식대로
 * `contentTypeId` 없이 **한 번만 부르고 `contenttypeid` 로 나눈다.**
 * 성지 한 곳을 열 때 늘어나는 호출은 0건이다.
 *
 * 이 파일에는 API 호출이 없다. 순수 분류만 있어서 테스트로 고정할 수 있다.
 */

import { CONTENT_TYPE, type TourApiSpot } from '@/shared/api/tour-api';
import type { TranslationKey } from '@/shared/i18n/dictionary';

/** 순례자가 실제로 찾는 순서대로 둔다. 화면의 탭 순서가 이 순서다. */
export const FACILITY_GROUPS = ['맛집', '숙박', '볼거리', '쉼터'] as const;
export type FacilityGroup = (typeof FACILITY_GROUPS)[number];

/**
 * TourAPI 유형 → 우리 분류.
 *
 * 쇼핑(38)과 레포츠(28)를 "쉼터"로 묶은 이유 — 순례 일정에서 이 둘은
 * "목적지"가 아니라 "사이에 들르는 곳"이다. 별도 탭을 만들면 대개 비어 있고,
 * 빈 탭은 서비스가 부실해 보이게 만든다.
 */
const GROUP_OF: Record<number, FacilityGroup> = {
  [CONTENT_TYPE.음식점]: '맛집',
  [CONTENT_TYPE.숙박]: '숙박',
  [CONTENT_TYPE.관광지]: '볼거리',
  [CONTENT_TYPE.문화시설]: '볼거리',
  [CONTENT_TYPE.레포츠]: '쉼터',
  [CONTENT_TYPE.쇼핑]: '쉼터',
};

export interface GroupedFacilities {
  group: FacilityGroup;
  spots: TourApiSpot[];
}

/** 거리(m). 값이 없으면 맨 뒤로 보낸다. */
function distanceOf(spot: TourApiSpot): number {
  const d = Number(spot.dist);
  return Number.isFinite(d) ? d : Number.POSITIVE_INFINITY;
}

/**
 * 한 번에 받아온 주변 시설을 분류해 **비어 있지 않은 그룹만** 돌려준다.
 *
 * 빈 그룹을 걸러내는 것이 중요하다 — 시골 성지는 맛집이 0건인 곳이 많은데,
 * 빈 탭을 보여주면 "정보가 없는 앱"으로 보인다. 없는 것은 말하지 않는다.
 *
 * @param perGroup 그룹당 최대 개수. 화면이 길어지지 않게 자른다.
 */
export function groupNearbyFacilities(
  spots: TourApiSpot[],
  perGroup = 6,
): GroupedFacilities[] {
  const buckets = new Map<FacilityGroup, TourApiSpot[]>();

  for (const spot of spots) {
    const group = GROUP_OF[Number(spot.contenttypeid)];
    if (!group) continue; // 축제·여행코스는 다른 섹션이 맡는다
    const bucket = buckets.get(group);
    if (bucket) bucket.push(spot);
    else buckets.set(group, [spot]);
  }

  return FACILITY_GROUPS.flatMap((group) => {
    const spots = buckets.get(group);
    if (!spots?.length) return [];
    const sorted = [...spots].sort((a, b) => distanceOf(a) - distanceOf(b));
    return [{ group, spots: sorted.slice(0, perGroup) }];
  });
}

/**
 * 원하는 그룹 순서대로, 각 그룹에서 가장 가까운 한 곳씩 뽑아 일정 정거장을 만든다.
 * 마음 나침반 결과의 "이대로 다녀오세요" 가 쓴다.
 *
 * 근처에 없는 유형은 조용히 빠진다 — 없는 것을 있는 척하지 않는다.
 */
export function buildItineraryStops(
  groups: GroupedFacilities[],
  wanted: readonly FacilityGroup[],
): { group: FacilityGroup; spot: TourApiSpot }[] {
  return wanted.flatMap((group) => {
    const nearest = groups.find((g) => g.group === group)?.spots[0];
    return nearest ? [{ group, spot: nearest }] : [];
  });
}

/** 그룹별 안내 문구. 빈손으로 보이지 않게 무엇을 보고 있는지 알려준다. */
export const GROUP_HINT: Record<FacilityGroup, string> = {
  맛집: '식사하고 가실 곳',
  숙박: '하룻밤 묵어가실 곳',
  볼거리: '함께 둘러볼 곳',
  쉼터: '오가는 길에 들를 곳',
};

/**
 * 화면에 그릴 때 쓰는 사전 키.
 *
 * 위의 `FACILITY_GROUPS` 와 `GROUP_HINT` 는 **분류 자체의 이름**이라 코드
 * 안에서는 한국어 그대로 둔다(테스트·집계가 이 값을 쓴다). 다만 그대로
 * 그리면 영어 모드에 한국어가 남으므로, 그릴 때는 이 표를 거친다.
 */
export const GROUP_LABEL_KEY: Record<FacilityGroup, TranslationKey> = {
  맛집: 'nearbyFood',
  숙박: 'nearbyStay',
  볼거리: 'nearbySights',
  쉼터: 'facilityRest',
};

export const GROUP_HINT_KEY: Record<FacilityGroup, TranslationKey> = {
  맛집: 'facilityHintFood',
  숙박: 'facilityHintStay',
  볼거리: 'facilityHintSights',
  쉼터: 'facilityHintRest',
};
