import { describe, expect, it } from 'vitest';
import { isQuotaExceededError, TourApiError } from './tour-api';

describe('TourApiError / isQuotaExceededError', () => {
  it('코드 22(일일 호출 한도 초과)는 한도 초과로 분류한다', () => {
    const err = new TourApiError('TourAPI 오류: LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR', '22');
    expect(isQuotaExceededError(err)).toBe(true);
  });

  it('다른 코드는 한도 초과가 아니다', () => {
    const err = new TourApiError('TourAPI 오류: APPLICATION ERROR', '01');
    expect(isQuotaExceededError(err)).toBe(false);
  });

  it('TourApiError 가 아닌 일반 에러는 한도 초과가 아니다', () => {
    expect(isQuotaExceededError(new Error('네트워크 오류'))).toBe(false);
    expect(isQuotaExceededError('문자열')).toBe(false);
    expect(isQuotaExceededError(null)).toBe(false);
  });
});
