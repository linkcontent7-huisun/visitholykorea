import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

/**
 * waitFor 기본 제한은 1초다. `npm run verify` 는 타입검사·린트·테스트를 잇달아
 * 돌리는데, CPU 가 붐비면 렌더가 1초를 넘겨 **코드는 멀쩡한데 테스트만** 깨진다.
 * 2026-09-04 에 실제로 그렇게 한 번 터졌고(재실행 4회는 전부 통과), 간헐적
 * 실패는 9/21 마감 앞에서 가장 비싼 종류의 노이즈다. 여유를 준다 —
 * 진짜 무한대기는 5초에도 어차피 걸린다.
 */
configure({ asyncUtilTimeout: 5000 });

// 테스트에서는 실제 Supabase/TourAPI 를 부르지 않으므로 자리표시 값을 넣어 둔다.
// (shared/config/env.ts 가 필수 환경변수 누락 시 예외를 던지기 때문에 필요하다.)
Object.assign(import.meta.env, {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_TOUR_API_SERVICE_KEY: 'test-tour-key',
});
