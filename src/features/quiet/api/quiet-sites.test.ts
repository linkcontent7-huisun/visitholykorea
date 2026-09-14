import { describe, expect, it, vi } from 'vitest';
import type * as TourApiModule from '@/shared/api/tour-api';
import type { HolySite } from '@/shared/types/domain';

vi.mock('@/shared/api/tour-api', async (importOriginal) => {
  const actual = await importOriginal<typeof TourApiModule>();
  return {
    ...actual,
    getOngoingFestivals: vi.fn().mockResolvedValue([]),
    getNearbyByLocation: vi.fn().mockResolvedValue([]),
    // 실측 집중률(T-020)도 막는다 — 안 막으면 진짜 TourAPI 를 부르다 시간 초과
    getCongestionRates: vi.fn().mockResolvedValue([]),
  };
});

import { getNearbyByLocation } from '@/shared/api/tour-api';
import { findQuietSites, matchingCongestion } from './quiet-sites';
import type { CongestionRate } from '@/shared/api/tour-api';

function site(id: string, lat: number, lng: number): HolySite {
  return {
    id,
    name: id,
    category: '순교성지',
    region: '서울',
    location: '서울',
    description: null,
    history: null,
    imageUrl: null,
    imageSource: null,
    imageLicense: null,
    coordinates: { lat, lng },
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

describe('findQuietSites — 호출 수', () => {
  it('후보 수를 지정하지 않으면 인프라 조회를 6회만 한다 (일일 호출 한도 절약)', async () => {
    const sites = Array.from({ length: 20 }, (_, i) => site(`s${i}`, 37.5 + i * 0.01, 127));
    await findQuietSites(sites);
    expect(vi.mocked(getNearbyByLocation)).toHaveBeenCalledTimes(6);
  });

  it('candidateCount 를 넘기면 그 수만큼만 조회한다', async () => {
    vi.mocked(getNearbyByLocation).mockClear();
    const sites = Array.from({ length: 20 }, (_, i) => site(`s${i}`, 37.5 + i * 0.01, 127));
    await findQuietSites(sites, { candidateCount: 3 });
    expect(vi.mocked(getNearbyByLocation)).toHaveBeenCalledTimes(3);
  });
});

describe('findQuietSites — 확인 부족 분리', () => {
  it('주변 정보 조회가 실패한 성지는 순위에 넣지 않고 unverified 로 낸다', async () => {
    vi.mocked(getNearbyByLocation).mockClear();
    vi.mocked(getNearbyByLocation)
      .mockRejectedValueOnce(new Error('HTTP 502'))
      .mockResolvedValue([]);
    const sites = Array.from({ length: 3 }, (_, i) => site(`s${i}`, 37.5 + i * 0.01, 127));
    const result = await findQuietSites(sites, { candidateCount: 3, limit: 3 });
    expect(result.picks).toHaveLength(2);
    expect(result.unverified).toHaveLength(1);
    expect(result.picks.every((p) => !p.crowding.isPartial)).toBe(true);
  });
});

describe('matchingCongestion — 집중률 선택', () => {
  const rate = (over: Partial<CongestionRate>): CongestionRate => ({
    baseYmd: '20260913',
    areaNm: '서울',
    signguNm: '중구',
    tAtsNm: '명동',
    cnctrRate: '40',
    mapX: '127',
    mapY: '37.5',
    ...over,
  });
  const here = site('s', 37.5, 127);

  it('가장 최근 날짜의, 5km 이내 가장 가까운 관광지 한 건만 쓴다', () => {
    const picked = matchingCongestion(here, [
      rate({ tAtsNm: '먼 곳 최댓값', cnctrRate: '99', mapY: '37.6' }), // 약 11km
      rate({ tAtsNm: '가까운 곳', cnctrRate: '40', mapY: '37.505' }),
      rate({ tAtsNm: '옛 날짜', cnctrRate: '80', baseYmd: '20260901', mapY: '37.501' }),
    ]);
    expect(picked?.name).toBe('가까운 곳');
    expect(picked?.rate).toBe(40);
    expect(picked?.baseYmd).toBe('20260913');
  });

  it('좌표 없는 행은 거리 검증을 건너뛰지 않고 제외한다', () => {
    expect(matchingCongestion(here, [rate({ mapX: undefined, mapY: undefined })])).toBeUndefined();
    expect(matchingCongestion(here, [rate({ mapX: '0', mapY: '0' })])).toBeUndefined();
  });
});
