import { describe, expect, it } from 'vitest';
import { CONTENT_TYPE, type TourApiSpot } from '@/shared/api/tour-api';
import {
  FACILITY_GROUPS,
  buildItineraryStops,
  groupNearbyFacilities,
  type FacilityGroup,
  type GroupedFacilities,
} from './nearby-facilities';

/**
 * 그룹 이름으로 항목 제목을 꺼낸다.
 * 인덱스로 꺼내면 `result[0]` 이 undefined 일 수 있어 타입 검사가 막는다.
 * 어차피 "몇 번째"보다 "어느 그룹"이 읽기도 낫다.
 */
function titlesOf(groups: GroupedFacilities[], group: FacilityGroup): string[] {
  return groups.find((g) => g.group === group)?.spots.map((s) => s.title) ?? [];
}

/** 테스트에 필요한 필드만 채운 최소 스팟. */
function spot(
  title: string,
  contenttypeid: number,
  dist?: number | string,
): TourApiSpot {
  return {
    contentid: title,
    contenttypeid: String(contenttypeid),
    title,
    addr1: '',
    mapx: '127',
    mapy: '37',
    ...(dist === undefined ? {} : { dist: String(dist) }),
  } as TourApiSpot;
}

describe('groupNearbyFacilities', () => {
  it('TourAPI 유형을 순례자가 찾는 분류로 묶는다', () => {
    const result = groupNearbyFacilities([
      spot('국밥집', CONTENT_TYPE.음식점, 100),
      spot('게스트하우스', CONTENT_TYPE.숙박, 200),
      spot('전망대', CONTENT_TYPE.관광지, 300),
      spot('미술관', CONTENT_TYPE.문화시설, 400),
    ]);

    expect(result.map((g) => g.group)).toEqual(['맛집', '숙박', '볼거리']);
    // 관광지와 문화시설은 같은 '볼거리' 로 합쳐진다
    expect(titlesOf(result, '볼거리')).toEqual(['전망대', '미술관']);
  });

  it('비어 있는 그룹은 아예 돌려주지 않는다', () => {
    // 시골 성지는 맛집이 0건인 곳이 많다. 빈 탭을 보여주면 정보가 없는 앱으로 보인다.
    const result = groupNearbyFacilities([spot('전망대', CONTENT_TYPE.관광지, 100)]);

    expect(result).toHaveLength(1);
    expect(result.map((g) => g.group)).toEqual(['볼거리']);
  });

  it('그룹 안에서 가까운 곳부터 보여준다', () => {
    const result = groupNearbyFacilities([
      spot('먼집', CONTENT_TYPE.음식점, 900),
      spot('가까운집', CONTENT_TYPE.음식점, 100),
      spot('중간집', CONTENT_TYPE.음식점, 500),
    ]);

    expect(titlesOf(result, '맛집')).toEqual(['가까운집', '중간집', '먼집']);
  });

  it('거리 값이 없는 곳은 맨 뒤로 보낸다', () => {
    // dist 가 비어 오는 응답이 실제로 있다. NaN 이 정렬을 망가뜨리지 않아야 한다.
    const result = groupNearbyFacilities([
      spot('거리없음', CONTENT_TYPE.음식점),
      spot('가까운집', CONTENT_TYPE.음식점, 100),
    ]);

    expect(titlesOf(result, '맛집')).toEqual(['가까운집', '거리없음']);
  });

  it('그룹당 개수를 잘라 화면이 길어지지 않게 한다', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      spot(`집${i}`, CONTENT_TYPE.음식점, i),
    );

    expect(titlesOf(groupNearbyFacilities(many, 3), '맛집')).toHaveLength(3);
  });

  it('축제·여행코스는 다른 섹션이 맡으므로 여기서 제외한다', () => {
    const result = groupNearbyFacilities([
      spot('벚꽃축제', CONTENT_TYPE.축제공연행사, 100),
      spot('추천코스', CONTENT_TYPE.여행코스, 200),
    ]);

    expect(result).toEqual([]);
  });

  it('탭 순서는 순례자가 찾는 순서를 따른다', () => {
    // 입력 순서를 뒤집어도 화면 순서는 고정이어야 한다.
    const result = groupNearbyFacilities([
      spot('전망대', CONTENT_TYPE.관광지, 100),
      spot('숙소', CONTENT_TYPE.숙박, 100),
      spot('국밥집', CONTENT_TYPE.음식점, 100),
    ]);

    expect(result.map((g) => g.group)).toEqual(['맛집', '숙박', '볼거리']);
    expect(FACILITY_GROUPS.indexOf('맛집')).toBeLessThan(FACILITY_GROUPS.indexOf('숙박'));
  });
});

describe('buildItineraryStops', () => {
  const groups = groupNearbyFacilities([
    spot('먼집', CONTENT_TYPE.음식점, 900),
    spot('가까운집', CONTENT_TYPE.음식점, 100),
    spot('수목원', CONTENT_TYPE.관광지, 300),
  ]);

  it('원하는 순서대로 각 그룹의 가장 가까운 한 곳을 뽑는다', () => {
    const stops = buildItineraryStops(groups, ['맛집', '볼거리']);
    expect(stops.map((s) => s.spot.title)).toEqual(['가까운집', '수목원']);
  });

  it('근처에 없는 유형은 조용히 빠진다 — 없는 것을 있는 척하지 않는다', () => {
    // 시골 성지의 1박2일: 숙박이 안 잡히면 그 줄만 빠지고 일정은 계속된다.
    const stops = buildItineraryStops(groups, ['맛집', '볼거리', '숙박']);
    expect(stops.map((s) => s.group)).toEqual(['맛집', '볼거리']);
  });
});
