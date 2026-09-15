import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';
import { walkMinutes } from '@/shared/lib/geo';

/** 출발지 → 성지. 정수 km, 1km 미만은 「1km 안」. */
export function formatFromOrigin(km: number, t: (k: TranslationKey) => string): string {
  return km < 1 ? t('planFromOriginNear') : fillPlaceholders(t('planFromOrigin'), { km: Math.round(km) });
}

/** 성지 ↔ 시설. 2km 안이면 「도보 N분」, 넘으면 「N.N km」 — 5km 반경이라 도보 60분 넘는 곳이 흔하다. */
export function formatFromSite(distKm: number, t: (k: TranslationKey) => string): string {
  const inner =
    distKm <= 2 ? fillPlaceholders(t('planWalkMinutes'), { min: walkMinutes(distKm) }) : `${distKm.toFixed(1)}km`;
  return fillPlaceholders(t('planFromSite'), { dist: inner });
}
