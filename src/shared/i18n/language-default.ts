import { ENABLED_LANGUAGES, isLanguage, type Language } from './dictionary';

/**
 * 첫 화면 언어를 정한다 (재기획 2026-09-14 §7).
 *   1. 저장된 선택이 있고 지금 노출하는 언어면 그대로
 *   2. 저장된 선택이 노출 목록 밖(es·fr·pt·it — 검수 전이라 숨김)이면 영어
 *   3. 처음 온 사람은 브라우저 언어가 한국어면 한국어, 그 외에는 영어
 * 가입 국가·IP 로 언어를 강제하지 않는다. 언제든 바꿀 수 있다(LanguagePicker).
 */
export function resolveInitialLanguage(
  stored: string | null,
  browserLanguages: readonly string[],
): Language {
  if (isLanguage(stored)) {
    return ENABLED_LANGUAGES.includes(stored) ? stored : 'en';
  }
  const first = browserLanguages.find(Boolean)?.toLowerCase() ?? '';
  return first.startsWith('ko') ? 'ko' : 'en';
}
