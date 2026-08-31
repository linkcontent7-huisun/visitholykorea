import { describe, expect, it } from 'vitest';
import { driveMinutes, formatDuration } from '@/shared/lib/geo';
import type { HolySite } from '@/shared/types/domain';
import { sortByDistance } from './nearest';

/** 테스트에 필요한 최소한의 성지를 만든다. */
function site(name: string, lat: number | null, lng: number | null): HolySite {
  return { id: name, name, coordinates: { lat, lng } } as HolySite;
}

const SEOUL = { lat: 37.5665, lng: 126.978 };

describe('sortByDistance', () => {
  it('출발지에서 가까운 순으로 정렬한다', () => {
    const 부산 = site('부산', 35.1796, 129.0756);
    const 인천 = site('인천', 37.4563, 126.7052);
    const 대전 = site('대전', 36.3504, 127.3845);
    const { measured } = sortByDistance([부산, 대전, 인천], SEOUL);
    expect(measured.map((m) => m.site.name)).toEqual(['인천', '대전', '부산']);
  });

  it('거리와 차량 소요 시간을 함께 붙인다', () => {
    const { measured } = sortByDistance([site('인천', 37.4563, 126.7052)], SEOUL);
    expect(measured[0]!.km).toBeGreaterThan(20);
    expect(measured[0]!.km).toBeLessThan(35);
    expect(measured[0]!.driveMin).toBe(driveMinutes(measured[0]!.km));
  });

  it('좌표 없는 성지는 지우지 않고 미측정 목록으로 분리한다 — 개수가 줄면 안 된다', () => {
    const { measured, unmeasured } = sortByDistance(
      [site('좌표없음', null, null), site('인천', 37.4563, 126.7052)],
      SEOUL,
    );
    expect(measured).toHaveLength(1);
    expect(unmeasured.map((s) => s.name)).toEqual(['좌표없음']);
  });

  it('빈 목록은 빈 결과 — 죽지 않는다', () => {
    const { measured, unmeasured } = sortByDistance([], SEOUL);
    expect(measured).toEqual([]);
    expect(unmeasured).toEqual([]);
  });
});

describe('driveMinutes', () => {
  it('시속 60km 어림 — 120km 는 약 120분', () => {
    expect(driveMinutes(120)).toBe(120);
  });

  it('아주 가까워도 최소 5분 — 주차·도보 진입이 있다', () => {
    expect(driveMinutes(0.5)).toBe(5);
  });
});

describe('formatDuration', () => {
  it('90분은 시간+분으로 풀어 쓴다 (한국어)', () => {
    expect(formatDuration(90, 'ko-KR')).toBe('1시간 30분');
  });

  it('정각 시간은 분을 생략한다', () => {
    expect(formatDuration(120, 'ko-KR')).toBe('2시간');
  });

  it('1시간 미만은 분만 쓴다', () => {
    expect(formatDuration(45, 'ko-KR')).toBe('45분');
  });

  it('영어 로케일에서도 단위가 붙는다', () => {
    expect(formatDuration(45, 'en-US')).toMatch(/45\s?min/);
  });
});
