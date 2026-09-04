/**
 * 출발지에서의 거리를 사람이 읽는 말로 바꾼다.
 *
 * 출발지는 시·도 **대표 좌표** 한 점이다. 그래서 같은 시 안의 성지는
 * 거리가 0에 가깝게 나오고, 반올림하면 "서울에서 약 0km" 가 된다 —
 * 실제로 배포판에 그렇게 찍혀 있었다(2026-09-04). 0km 는 정보가 아니라
 * 고장으로 읽힌다.
 *
 * 그래서 가까운 거리는 숫자를 버리고 "안에 있어요" 로 말한다.
 * 시·도 대표점 기준이라는 사실을 감안하면 그게 더 정확하기도 하다.
 */
export function distanceLabel(origin: string, km: number): string {
  if (!Number.isFinite(km) || km < 0) return origin;
  if (km < 5) return `${origin} 안에 있어요`;
  if (km < 10) return `${origin}에서 10km 안쪽`;
  return `${origin}에서 약 ${Math.round(km)}km`;
}
