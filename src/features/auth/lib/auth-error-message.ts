import { fillPlaceholders, type Language, type TranslationKey } from '@/shared/i18n/dictionary';

/** 간편 로그인 함수(kakao-auth·naver-auth)가 `?auth_via=` 로 넘기는 가입 방법의 이름. 상표라 번역하지 않는다. */
const PROVIDER_NAME: Record<string, { ko: string; other: string }> = {
  kakao: { ko: '카카오', other: 'Kakao' },
  naver: { ko: '네이버', other: 'Naver' },
  google: { ko: '구글', other: 'Google' },
  email: { ko: '이메일', other: 'email' },
};

/**
 * `?auth_error=` 이유 코드를 이용자 문장으로 바꾼다.
 * 2026-11-06: 모든 실패에 「잠시 후 다시 시도」를 보여 줘서, 다시 해도 절대 안 되는 경우
 * (이미 카카오로 가입한 이메일로 네이버 로그인)를 사장님이 「불안정」으로 느꼈다.
 */
export function authErrorMessage(
  reason: string,
  via: string | null,
  language: Language,
  t: (key: TranslationKey) => string,
): string {
  if (reason === 'account_exists_other_provider') {
    const name = via ? PROVIDER_NAME[via] : undefined;
    const label = name ? (language === 'ko' ? name.ko : name.other) : via || '?';
    return fillPlaceholders(t('socialLoginOtherProvider'), { via: label });
  }
  if (reason.endsWith('_no_email')) return t('socialLoginNoEmail');
  if (reason.endsWith('_state')) return t('socialLoginRetry');
  return t('socialLoginFailed');
}
