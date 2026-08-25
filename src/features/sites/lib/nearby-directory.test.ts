import { describe, expect, it } from 'vitest';
import { bboxAround, formatDistanceKm, rankNearby } from './nearby-directory';
import type { CatholicDirectoryRow } from '@/shared/types/database';

function row(partial: Partial<CatholicDirectoryRow>): CatholicDirectoryRow {
  return {
    id: 'x',
    name: '이름',
    category: '본당',
    diocese: null,
    phone: null,
    address: null,
    lat: null,
    lng: null,
    ...partial,
  };
}

describe('bboxAround', () => {
  it('반경을 덮는 범위를 낸다 — 5km 면 위도로 약 0.045도', () => {
    const b = bboxAround(37.5, 127.0, 5);
    expect(b.latMax - b.latMin).toBeCloseTo((5 / 111) * 2, 5);
    expect(b.lngMax - b.lngMin).toBeCloseTo((5 / 88) * 2, 5);
  });
});

describe('rankNearby', () => {
  const 서울 = { lat: 37.5665, lng: 126.978 };

  it('가까운 순으로 정렬하고 반경 밖은 버린다', () => {
    const rows = [
      row({ id: 'far', lat: 37.7, lng: 127.2 }),
      row({ id: 'near', lat: 37.57, lng: 126.98 }),
      row({ id: 'mid', lat: 37.6, lng: 127.0 }),
    ];
    const out = rankNearby(서울.lat, 서울.lng, rows, 5, 10);
    expect(out.map((p) => p.id)).toEqual(['near', 'mid']);
  });

  it('좌표 없는 행은 계산에서 뺀다 — 0km 로 둔갑하면 안 된다', () => {
    const rows = [row({ id: 'nocoord' })];
    expect(rankNearby(서울.lat, 서울.lng, rows, 5, 10)).toEqual([]);
  });

  it('limit 을 지킨다', () => {
    const rows = Array.from({ length: 9 }, (_, i) =>
      row({ id: `p${i}`, lat: 37.5665 + i * 0.001, lng: 126.978 }),
    );
    expect(rankNearby(서울.lat, 서울.lng, rows, 5, 4)).toHaveLength(4);
  });
});

describe('formatDistanceKm', () => {
  it('1km 미만은 미터, 이상은 km 한 자리', () => {
    expect(formatDistanceKm(0.4)).toBe('400m');
    expect(formatDistanceKm(2.34)).toBe('2.3km');
    expect(formatDistanceKm(2.35)).toBe('2.4km'); // toFixed 는 반올림
  });
});
