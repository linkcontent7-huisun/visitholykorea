/**
 * DB 에 한국어로 저장된 값을 화면에서 옮기기 위한 대응표.
 *
 * 성지 분류(`category`)와 감성 태그(`emotion_tag`)는 우리가 직접 수집한 자체
 * 데이터라 값 자체가 한국어다. 그 값을 그대로 그리면 영어 모드에서
 * `#주교좌성당` 같은 한국어가 남는다(T-007 에서 실제로 그랬다).
 *
 * DB 값을 영어로 바꾸는 방법도 있지만, 그러면 208행과 시드·스크립트를 모두
 * 손대야 하고 한국인 운영자가 읽던 값이 사라진다. **저장은 한국어로 두고
 * 화면에서만 옮긴다.**
 *
 * 표에 없는 값(운영자가 새 분류를 넣는 경우)은 `undefined` 가 나오므로,
 * 부르는 쪽에서 원래 문자열을 그대로 쓰면 된다 — 화면이 비지 않는다.
 */

import type { TranslationKey } from './dictionary';
import type { EmotionTag } from '@/shared/types/domain';

export const EMOTION_TAG_KEY: Record<EmotionTag, TranslationKey> = {
  위로: 'emotionComfort',
  새출발: 'emotionNewStart',
  평온: 'emotionCalm',
  치유: 'emotionHealing',
  감사: 'emotionGratitude',
};

export const CATEGORY_KEY: Record<string, TranslationKey> = {
  순교성지: 'categoryMartyrdom',
  역사사적지: 'categoryHistoric',
  주교좌성당: 'categoryCathedral',
  순례길: 'categoryPilgrimRoute',
};

/** 분류·태그를 지금 언어로. 모르는 값은 원래 한국어를 그대로 돌려준다. */
export function localizeDomainValue(
  value: string,
  t: (key: TranslationKey) => string,
): string {
  const key = CATEGORY_KEY[value] ?? EMOTION_TAG_KEY[value as EmotionTag];
  return key ? t(key) : value;
}
