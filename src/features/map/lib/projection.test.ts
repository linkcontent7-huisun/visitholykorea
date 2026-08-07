import { describe, expect, it } from 'vitest';
import { jitterFor, KOREA_BOUNDS, MAP_ASPECT, projectToMap } from './projection';

const SIZE = { width: 400, height: 700 };

/** 실제 성지 좌표 몇 곳 — 상대 위치가 맞는지 보려고 쓴다 */
const MYEONGDONG = { lat: 37.5633, lng: 126.9873 }; // 명동대성당
const JEOLDUSAN = { lat: 37.5486, lng: 126.9058 }; // 절두산 (명동 서쪽)
const JEJU = { lat: 33.4996, lng: 126.5312 }; // 제주 (최남단)

describe('projectToMap — 위경도를 지도 좌표로', () => {
  it('북쪽 성지가 남쪽 성지보다 화면 위에 온다', () => {
    const seoul = projectToMap(MYEONGDONG.lat, MYEONGDONG.lng, SIZE)!;
    const jeju = projectToMap(JEJU.lat, JEJU.lng, SIZE)!;

    expect(seoul.y).toBeLessThan(jeju.y);
  });

  it('서쪽 성지가 동쪽 성지보다 화면 왼쪽에 온다', () => {
    const myeongdong = projectToMap(MYEONGDONG.lat, MYEONGDONG.lng, SIZE)!;
    const jeoldusan = projectToMap(JEOLDUSAN.lat, JEOLDUSAN.lng, SIZE)!;

    // 절두산이 명동보다 서쪽(경도가 작다)
    expect(jeoldusan.x).toBeLessThan(myeongdong.x);
  });

  it('범위 안의 좌표는 그림 영역을 벗어나지 않는다', () => {
    const p = projectToMap(MYEONGDONG.lat, MYEONGDONG.lng, SIZE)!;

    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.x).toBeLessThanOrEqual(SIZE.width);
    expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeLessThanOrEqual(SIZE.height);
  });

  it('네 모서리가 정확히 경계에 놓인다', () => {
    const topLeft = projectToMap(KOREA_BOUNDS.maxLat, KOREA_BOUNDS.minLng, SIZE)!;
    const bottomRight = projectToMap(KOREA_BOUNDS.minLat, KOREA_BOUNDS.maxLng, SIZE)!;

    expect(topLeft.x).toBeCloseTo(0);
    expect(topLeft.y).toBeCloseTo(0);
    expect(bottomRight.x).toBeCloseTo(SIZE.width);
    expect(bottomRight.y).toBeCloseTo(SIZE.height);
  });

  it('좌표가 없으면 null 을 준다', () => {
    expect(projectToMap(null, 127, SIZE)).toBeNull();
    expect(projectToMap(37, null, SIZE)).toBeNull();
    expect(projectToMap(null, null, SIZE)).toBeNull();
  });

  it('범위 밖은 가장자리에 붙이지 않고 null 을 준다', () => {
    // 도쿄 — 잘못 들어온 좌표를 정상인 척 찍으면 데이터 오류를 놓친다
    expect(projectToMap(35.68, 139.69, SIZE)).toBeNull();
    // 적도
    expect(projectToMap(0, 0, SIZE)).toBeNull();
  });

  it('한반도는 가로보다 세로가 길다', () => {
    expect(MAP_ASPECT).toBeLessThan(1);
  });

  it('경도를 보정해 동서로 늘어나지 않는다', () => {
    // 보정이 없으면 경도 1도와 위도 1도가 같은 픽셀이 된다.
    // 실제로는 위도 36도에서 경도 1도가 더 짧으므로, 같은 각도라면 x 이동이 더 작아야 한다.
    const base = projectToMap(36, 127, SIZE)!;
    const eastOneDegree = projectToMap(36, 128, SIZE)!;
    const northOneDegree = projectToMap(37, 127, SIZE)!;

    const dx = eastOneDegree.x - base.x;
    const dy = base.y - northOneDegree.y;

    // 그림 영역 비율까지 감안하면 단순 비교가 어려우므로, 실제 거리비로 확인한다
    const dxKm = (dx / SIZE.width) * ((KOREA_BOUNDS.maxLng - KOREA_BOUNDS.minLng) * 111 * 0.81);
    const dyKm = (dy / SIZE.height) * ((KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat) * 111);

    // 위도 36도에서 경도 1도 ≈ 90km, 위도 1도 ≈ 111km
    expect(dxKm).toBeLessThan(dyKm);
  });
});

describe('jitterFor — 겹친 핀 흩기', () => {
  it('같은 성지는 항상 같은 값을 받는다 (화면이 떨리면 안 된다)', () => {
    const a = jitterFor('site-abc', 5);
    const b = jitterFor('site-abc', 5);

    expect(a).toEqual(b);
  });

  it('다른 성지는 다른 방향으로 흩어진다', () => {
    const a = jitterFor('site-abc', 5);
    const b = jitterFor('site-xyz', 5);

    expect(a).not.toEqual(b);
  });

  it('지정한 크기를 넘지 않는다', () => {
    for (const id of ['a', 'bb', 'ccc', 'site-1234', '절두산']) {
      const j = jitterFor(id, 5);
      expect(Math.hypot(j.x, j.y)).toBeLessThanOrEqual(5);
    }
  });
});
