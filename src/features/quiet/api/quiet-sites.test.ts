import { describe, expect, it, vi } from 'vitest';
import type * as TourApiModule from '@/shared/api/tour-api';
import type { HolySite } from '@/shared/types/domain';

vi.mock('@/shared/api/tour-api', async (importOriginal) => {
  const actual = await importOriginal<typeof TourApiModule>();
  return {
    ...actual,
    getOngoingFestivals: vi.fn().mockResolvedValue([]),
    getNearbyByLocation: vi.fn().mockResolvedValue([]),
  };
});

import { getNearbyByLocation } from '@/shared/api/tour-api';
import { findQuietSites } from './quiet-sites';

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
