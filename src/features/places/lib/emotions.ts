import type { TranslationKey } from '@/shared/i18n/dictionary';

/**
 * 그날의 감정 — 고르기만 하면 끝나게 단추 6개로 받는다(11/1 사장님 선택 「감정 고르기 + 한 줄」).
 * 값은 DB 의 check 제약과 같아야 한다(`user_places.emotion`).
 */
export const EMOTIONS = [
  { id: 'peace', emoji: '🙏', labelKey: 'emotionPeace' },
  { id: 'joy', emoji: '😊', labelKey: 'emotionJoy' },
  { id: 'moved', emoji: '🥹', labelKey: 'emotionMoved' },
  { id: 'grateful', emoji: '💐', labelKey: 'emotionGrateful' },
  { id: 'reflective', emoji: '🤔', labelKey: 'emotionReflective' },
  { id: 'sorrow', emoji: '😢', labelKey: 'emotionSorrow' },
] as const satisfies readonly { id: string; emoji: string; labelKey: TranslationKey }[];

export type EmotionId = (typeof EMOTIONS)[number]['id'];

export function findEmotion(id: string) {
  return EMOTIONS.find((e) => e.id === id) ?? null;
}
