import { describe, expect, it } from 'vitest';
import type { HolySiteRow } from '@/shared/types/database';
import { toHolySite } from './holy-sites.repository';

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
