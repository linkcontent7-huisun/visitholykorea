import { describe, expect, it } from 'vitest';
import type { TourApiSpot } from '@/shared/api/tour-api';
import type { Coordinates, HolySite } from '@/shared/types/domain';
import {
  FESTIVAL_PAIR,
  formatApiDate,
  formatDistanceKm,
  formatFestivalPeriod,
  pairFestivalsWithSites,
  regionOfAddress,
} from './festival-pairs';

/** 수원 화성행궁 언저리 — 붐빔 피하기 테스트와 같은 기준점을 쓴다 */
const ORIGIN = { lat: 37.2812, lng: 127.0128 };

/** 기준점에서 대략 km 만큼 북쪽 (위도 1도 ≈ 111km) */
function northOf(km: number): Coordinates {
  return { lat: ORIGIN.lat + km / 111, lng: ORIGIN.lng };
}

function site(name: string, coordinates: Coordinates): HolySite {
  return {
    id: name,
    name,
    category: '순교성지',
    region: '수원',
    location: '경기도 수원시',
    description: null,
    history: null,
    imageUrl: null,
    imageSource: null,
    imageLicense: null,
    coordinates,
    emotionTag: null,
    seoTitle: null,
    seoDescription: null,
    nearbyAttractions: null,
    nearbyLodging: null,
    phone: null,
    homepageUrl: null,
    fax: null,
  };
}

function festival(
  id: string,
  coords: { lat: number | null; lng: number | null },
  addr1 = '경기도 수원시 팔달구',
): TourApiSpot {
  return {
    contentid: id,
    contenttypeid: '15',
    title: `${id} 축제`,
    addr1,
    addr2: '',
    mapx: coords.lng == null ? '' : String(coords.lng),
    mapy: coords.lat == null ? '' : String(coords.lat),
    firstimage: '',
    eventstartdate: '20260901',
    eventenddate: '20260910',
  };
}

// ---------------------------------------------------------------------------

describe('regionOfAddress — 주소에서 시·도 읽기', () => {
  it('법정 표기(충청남도·전라북도)를 짧은 이름으로 옮긴다', () => {
    expect(regionOfAddress('충청남도 당진시 우강면')).toBe('충남');
    expect(regionOfAddress('전라북도 완주군 비봉면')).toBe('전북');
    expect(regionOfAddress('경상북도 안동시')).toBe('경북');
  });

  it('특별자치도·광역시 표기도 읽는다', () => {
    expect(regionOfAddress('전북특별자치도 전주시 완산구')).toBe('전북');
    expect(regionOfAddress('강원특별자치도 원주시')).toBe('강원');
    expect(regionOfAddress('제주특별자치도 서귀포시')).toBe('제주');
    expect(regionOfAddress('부산광역시 동구')).toBe('부산');
    expect(regionOfAddress('세종특별자치시')).toBe('세종');
  });

  it('「경기도 광주시」를 광주광역시로 잘못 읽지 않는다 — 앞머리만 보는 이유', () => {
    expect(regionOfAddress('경기도 광주시 남종면')).toBe('경기');
    expect(regionOfAddress('광주광역시 북구')).toBe('광주');
  });

  it('값이 없거나 알 수 없는 주소면 지어내지 않고 null 을 돌려준다', () => {
    expect(regionOfAddress(null)).toBeNull();
    expect(regionOfAddress(undefined)).toBeNull();
    expect(regionOfAddress('')).toBeNull();
    expect(regionOfAddress('   ')).toBeNull();
    expect(regionOfAddress('Seoul, Korea')).toBeNull();
    expect(regionOfAddress('주소 미정')).toBeNull();
  });
});

describe('날짜·거리 표기', () => {
  it('YYYYMMDD 를 점으로 끊어 보여준다', () => {
    expect(formatApiDate('20260905')).toBe('2026.09.05');
  });

  it('형식이 어긋난 값은 몰래 빈칸으로 만들지 않고 그대로 둔다', () => {
    expect(formatApiDate('2026-09-05')).toBe('2026-09-05');
    expect(formatApiDate('')).toBe('');
    expect(formatApiDate(null)).toBe('');
    expect(formatApiDate(undefined)).toBe('');
  });

  it('하루짜리 행사는 날짜를 한 번만 쓴다', () => {
    expect(formatFestivalPeriod('20260905', '20260905')).toBe('2026.09.05');
    expect(formatFestivalPeriod('20260905', '20260907')).toBe('2026.09.05 – 2026.09.07');
    expect(formatFestivalPeriod('20260905', null)).toBe('2026.09.05');
    expect(formatFestivalPeriod(null, null)).toBe('');
  });

  it('1km 미만은 미터로 적는다 — 걸어갈 만한지가 한눈에 보여야 한다', () => {
    expect(formatDistanceKm(0.4)).toBe('400m');
    expect(formatDistanceKm(1)).toBe('1.0km');
    expect(formatDistanceKm(12.34)).toBe('12.3km');
  });

  it('숫자가 아니거나 음수면 빈 문자열 — NaN 이 화면에 찍히지 않게 한다', () => {
    expect(formatDistanceKm(Number.NaN)).toBe('');
    expect(formatDistanceKm(-1)).toBe('');
  });
});

describe('pairFestivalsWithSites — 축제에 성지 붙이기', () => {
  const sites = [
    site('가까운성지', northOf(3)),
    site('조금먼성지', northOf(10)),
    site('세번째성지', northOf(15)),
    site('아주먼성지', northOf(80)),
    site('좌표없는성지', { lat: null, lng: null }),
  ];

  it('반경 안의 성지를 가까운 순으로, 기본 2곳까지 붙인다', () => {
    const [pair] = pairFestivalsWithSites([festival('a', ORIGIN)], sites);
    expect(pair?.sites.map((s) => s.site.name)).toEqual(['가까운성지', '조금먼성지']);
    expect(pair?.sites[0]?.distanceKm).toBeLessThan(4);
  });

  it('반경 20km 밖에만 성지가 있는 축제는 목록에서 뺀다 — 이 화면의 존재 이유다', () => {
    const farFestival = festival('far', { lat: 33.4996, lng: 126.5312 }); // 제주
    const result = pairFestivalsWithSites([festival('a', ORIGIN), farFestival], sites);
    expect(result.map((f) => f.id)).toEqual(['a']);
  });

  it('반경은 붐빔 피하기와 같은 20km 이고, 넘겨서 바꿀 수 있다', () => {
    expect(FESTIVAL_PAIR.radiusKm).toBe(20);
    const narrow = pairFestivalsWithSites([festival('a', ORIGIN)], sites, { radiusKm: 5 });
    expect(narrow[0]?.sites.map((s) => s.site.name)).toEqual(['가까운성지']);
  });

  it('붙일 성지 수를 조절할 수 있다', () => {
    const three = pairFestivalsWithSites([festival('a', ORIGIN)], sites, { sitesPerFestival: 3 });
    expect(three[0]?.sites).toHaveLength(3);
  });

  it('시·도를 고르면 그 지역 축제만 남는다', () => {
    const list = [
      festival('gyeonggi', ORIGIN, '경기도 수원시'),
      festival('seoul', northOf(12), '서울특별시 중구'),
    ];
    const onlySeoul = pairFestivalsWithSites(list, sites, { region: '서울' });
    expect(onlySeoul.map((f) => f.id)).toEqual(['seoul']);
    expect(onlySeoul[0]?.region).toBe('서울');
  });

  it('주소를 읽지 못한 축제는 시·도를 고른 순간 빠진다 — 다른 지역일 수 있다', () => {
    const unknown = festival('unknown', ORIGIN, 'Somewhere');
    expect(pairFestivalsWithSites([unknown], sites)).toHaveLength(1);
    expect(pairFestivalsWithSites([unknown], sites, { region: '경기' })).toHaveLength(0);
  });

  it('가장 가까운 성지가 있는 축제부터 보여준다', () => {
    // 성지와 1km 떨어진 축제(성지 옆)와 3km 떨어진 축제(기준점)를 섞어 넣는다
    const 성지옆 = festival('beside', northOf(9)); // 조금먼성지(10km)와 1km
    const 조금떨어진 = festival('apart', ORIGIN); // 가까운성지(3km)와 3km
    expect(pairFestivalsWithSites([조금떨어진, 성지옆], sites).map((f) => f.id)).toEqual([
      'beside',
      'apart',
    ]);
  });

  it('좌표가 없거나 0인 축제는 건너뛴다 — 거리를 잴 수 없으면 권할 수도 없다', () => {
    const noCoords = festival('no', { lat: null, lng: null });
    const zero = festival('zero', { lat: 0, lng: 0 });
    expect(pairFestivalsWithSites([noCoords, zero], sites)).toHaveLength(0);
  });

  it('붐빔은 이미 받아 둔 축제 목록만으로 낸다 — 「일부」로 표시된다', () => {
    const [pair] = pairFestivalsWithSites([festival('a', ORIGIN)], sites);
    expect(pair?.sites[0]?.crowding.isPartial).toBe(true);
    expect(pair?.sites[0]?.crowding.score).toBeGreaterThan(0);
  });

  it('잘못된 입력이 와도 죽지 않는다 — 축제 API 는 우리 것이 아니다', () => {
    expect(pairFestivalsWithSites([], sites)).toEqual([]);
    expect(pairFestivalsWithSites([festival('a', ORIGIN)], [])).toEqual([]);
    // 런타임에 null 이 들어오는 경우까지 막는다
    expect(
      pairFestivalsWithSites(null as unknown as TourApiSpot[], null as unknown as HolySite[]),
    ).toEqual([]);
    expect(pairFestivalsWithSites([{} as TourApiSpot, festival('a', ORIGIN)], sites)).toHaveLength(
      1,
    );
  });
});
