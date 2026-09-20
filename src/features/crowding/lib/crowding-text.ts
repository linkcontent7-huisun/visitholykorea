/**
 * 인근 혼잡도를 사람 말로 — 상세 카드와 일정 화면이 같은 문장을 쓰게 한 곳에 모은다.
 * 숫자는 넣지 않는다(사장님 2026-09-16). 집중률 등급은 「낮음 · 보통 · 높음」 말로만.
 */

import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';
import type { CrowdingLevel, ReasonItem } from '../api/crowding-score';

type T = (key: TranslationKey) => string;

/** 「인근 지역이 조용해요 / 보통이에요 / 붐벼요」 */
export const NEARBY_HEADLINE_KEY: Record<CrowdingLevel, TranslationKey> = {
  조용: 'nearbyQuiet',
  보통: 'nearbyModerate',
  붐빔: 'nearbyCrowded',
};

/** 상세 페이지에서 쓰는 「주변 밀집도 하 / 중 / 상」 표시. */
export const NEARBY_DENSITY_HEADLINE_KEY: Record<CrowdingLevel, TranslationKey> = {
  조용: 'nearbyDensityLow',
  보통: 'nearbyDensityMedium',
  붐빔: 'nearbyDensityHigh',
};

/** 집중률 등급 → 근거 문장 끝에 붙는 말 */
const LEVEL_WORD_KEY: Record<CrowdingLevel, TranslationKey> = {
  조용: 'crowdingWordLow',
  보통: 'crowdingWordMid',
  붐빔: 'crowdingWordHigh',
};

export function nearbyHeadline(level: CrowdingLevel | null, t: T): string {
  return level ? t(NEARBY_HEADLINE_KEY[level]) : t('nearbyNoGrade');
}

export function nearbyDensityHeadline(level: CrowdingLevel, t: T): string {
  return t(NEARBY_DENSITY_HEADLINE_KEY[level]);
}

/**
 * 성지 자체 값이 없는 곳(kind=district)의 한 줄 — 「당진시 관광지 예측 낮음 · 이 성지 데이터 없음」.
 * 등급 말은 인근 관광지 것이라 색 점을 붙이지 않는다.
 */
export function districtOnlySentence(district: string, level: CrowdingLevel, t: T): string {
  return fillPlaceholders(t('crowdingDistrictOnly'), {
    district,
    word: t(LEVEL_WORD_KEY[level]),
  });
}

export function formatReason(reason: ReasonItem, t: T): string {
  const text = fillPlaceholders(t(reason.key), reason.params ?? {});
  return reason.level ? `${text} · ${t(LEVEL_WORD_KEY[reason.level])}` : text;
}
