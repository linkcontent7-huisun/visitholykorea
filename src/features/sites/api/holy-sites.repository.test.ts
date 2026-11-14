import { describe, expect, it, vi } from 'vitest';
import type { HolySiteRow } from '@/shared/types/database';
import { fetchSiteIndex, toHolySite, withCoordinates } from './holy-sites.repository';

const select = vi.fn();
vi.mock('@/shared/api/supabase', () => ({
  supabase: { from: (table: string) => ({ select: (cols: string) => select(table, cols) }) },
}));

function makeRow(overrides: Partial<HolySiteRow> = {}): HolySiteRow {
  return {
    id: 'site-1',
    name: '절두산 순교성지',
    category: '순교성지',
    diocese: '서울',
    region_province: '서울',
    location: '서울시 마포구 토정로 6',
    description: '한강이 내려다보이는 순교지',
    history: '1866년 병인박해',
    image_url: null,
    image_source: null,
    image_license: null,
    lat: 37.5497,
    lng: 126.9,
    seo_title: null,
    seo_description: null,
    emotion_tag: '치유',
    nearby_attractions: null,
    nearby_lodging: null,
    phone: null,
    homepage_url: null,
    fax: null,
    mass_times: null,
    mass_times_checked_on: null,
    mass_times_source: null,
    mass_times_confirmed: false,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('toHolySite', () => {
  it('DB 행을 도메인 타입으로 변환한다', () => {
    const site = toHolySite(makeRow());
    expect(site.region).toBe('서울');
    expect(site.coordinates).toEqual({ lat: 37.5497, lng: 126.9 });
    expect(site.emotionTag).toBe('치유');
  });

  it('교구가 비어 있으면 광역 지자체명으로 대체한다', () => {
    const site = toHolySite(makeRow({ diocese: null, region_province: '충남' }));
    expect(site.region).toBe('충남');
  });

  it('분류가 비어 있으면 순례길로 둔다', () => {
    expect(toHolySite(makeRow({ category: null })).category).toBe('순례길');
  });

  it('주소가 비어 있으면 빈 문자열로 채워 화면에서 null 을 다루지 않게 한다', () => {
    expect(toHolySite(makeRow({ location: null })).location).toBe('');
  });

  it('연락처를 camelCase 로 옮긴다', () => {
    const site = toHolySite(
      makeRow({
        phone: '(02)3142-4434',
        homepage_url: 'http://www.jeoldusan.or.kr',
        fax: '(02)3142-4436',
      }),
    );

    expect(site.phone).toBe('(02)3142-4434');
    expect(site.homepageUrl).toBe('http://www.jeoldusan.or.kr');
    expect(site.fax).toBe('(02)3142-4436');
  });

  it('연락처가 없으면 null 로 둔다 — 빈 문자열이면 화면이 빈 줄을 그린다', () => {
    const site = toHolySite(makeRow());

    expect(site.phone).toBeNull();
    expect(site.homepageUrl).toBeNull();
    expect(site.fax).toBeNull();
  });
});

describe('fetchSiteIndex (#106 색인 3개 → 1개)', () => {
  it('holy_sites 에서 id·이름·교구·좌표만 한 번에 받는다', async () => {
    const rows = [{ id: 'a', name: '절두산', diocese: '서울', lat: 37.5, lng: 126.9 }];
    select.mockResolvedValueOnce({ data: rows, error: null });
    await expect(fetchSiteIndex()).resolves.toEqual(rows);
    expect(select).toHaveBeenCalledWith('holy_sites', 'id, name, diocese, lat, lng');
  });

  it('조회가 실패하면 오류를 던진다', async () => {
    select.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    await expect(fetchSiteIndex()).rejects.toThrow('fetchSiteIndex: boom');
  });
});

describe('withCoordinates', () => {
  it('위도·경도가 둘 다 있는 성지만 남긴다', () => {
    const index = [
      { id: 'a', name: 'A', diocese: '서울', lat: 37.5, lng: 126.9 },
      { id: 'b', name: 'B', diocese: '서울', lat: null, lng: 126.9 },
      { id: 'c', name: 'C', diocese: null, lat: 35.1, lng: null },
    ];
    expect(withCoordinates(index).map((s) => s.id)).toEqual(['a']);
  });
});
