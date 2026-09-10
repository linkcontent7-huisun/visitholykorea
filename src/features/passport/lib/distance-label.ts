import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';

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
 *
 * `t` 는 화면의 다국어 사전 함수 — 영어 모드에서도 이 문구가 한국어로
 * 나오던 것(2026-09-11 발견)을 고치면서, 문구 자체를 사전으로 옮겼다.
 */
export function distanceLabel(t: (key: TranslationKey) => string, origin: string, km: number): string {
  if (!Number.isFinite(km) || km < 0) return origin;
  if (km < 5) return fillPlaceholders(t('distanceWithin'), { origin });
  if (km < 10) return fillPlaceholders(t('distanceUnder10'), { origin });
  return fillPlaceholders(t('distanceApprox'), { origin, km: Math.round(km) });
}
