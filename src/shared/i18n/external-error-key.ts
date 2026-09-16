import { classifyTourError } from '@/shared/api/tour-api';
import type { TranslationKey } from './dictionary';

/** 외부 API(TourAPI 중계) 실패를 종류별로 다른 문장으로 — 한도·잠시 후·설정 누락·그 밖. */
export function externalErrorKey(error: unknown): TranslationKey {
  switch (classifyTourError(error)) {
    case 'quota':
      return 'externalApiQuota';
    case 'rate_limited':
      return 'externalApiRateLimited';
    case 'not_configured':
      return 'externalApiNotConfigured';
    default:
      return 'externalApiFailedBody';
  }
}
