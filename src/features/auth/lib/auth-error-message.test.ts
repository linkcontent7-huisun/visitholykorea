import { describe, expect, it } from 'vitest';
import { DICTIONARY, type TranslationKey } from '@/shared/i18n/dictionary';
import { authErrorMessage } from './auth-error-message';

const ko = (key: TranslationKey) => DICTIONARY[key].ko;
const en = (key: TranslationKey) => DICTIONARY[key].en;

describe('authErrorMessage', () => {
  it('다른 방법으로 가입한 이메일이면 그 방법을 알려 준다', () => {
    const msg = authErrorMessage('account_exists_other_provider', 'kakao', 'ko', ko);
    expect(msg).toContain('카카오');
    expect(msg).not.toContain('{via}');
    expect(authErrorMessage('account_exists_other_provider', 'kakao', 'en', en)).toContain('Kakao');
  });

  it('이메일 미동의·시간 초과·그 밖의 실패를 구분한다', () => {
    expect(authErrorMessage('naver_no_email', null, 'ko', ko)).toBe(ko('socialLoginNoEmail'));
    expect(authErrorMessage('naver_state', null, 'ko', ko)).toBe(ko('socialLoginRetry'));
    expect(authErrorMessage('naver_token', null, 'ko', ko)).toBe(ko('socialLoginFailed'));
  });
});
