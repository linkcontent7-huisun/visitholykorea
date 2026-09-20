import { describe, expect, it } from 'vitest';
import { isQuotaExceededError, serviceFor, TourApiError } from './tour-api';

describe('TourApiError / isQuotaExceededError', () => {
  it('코드 22(일일 호출 한도 초과)는 한도 초과로 분류한다', () => {
    const err = new TourApiError(
      'TourAPI 오류: LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR',
      '22',
    );
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

describe('serviceFor — 언어별 관광공사 서비스 (2026-09-21 영문 승인)', () => {
  it('영어는 영문 서비스, 서비스가 없는 pt·it 도 영어로 보낸다', () => {
    expect(serviceFor('en')).toBe('EngService2');
    expect(serviceFor('pt')).toBe('EngService2');
    expect(serviceFor('it')).toBe('EngService2');
  });

  it('승인된 서어·불어는 그 언어로, 한국어는 국문으로', () => {
    expect(serviceFor('es')).toBe('SpnService2');
    expect(serviceFor('fr')).toBe('FreService2');
    expect(serviceFor('ko')).toBe('KorService2');
  });
});
