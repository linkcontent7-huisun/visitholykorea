import '@testing-library/jest-dom/vitest';

// 테스트에서는 실제 Supabase/TourAPI 를 부르지 않으므로 자리표시 값을 넣어 둔다.
// (shared/config/env.ts 가 필수 환경변수 누락 시 예외를 던지기 때문에 필요하다.)
Object.assign(import.meta.env, {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_TOUR_API_SERVICE_KEY: 'test-tour-key',
});
