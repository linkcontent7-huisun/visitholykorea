/**
 * 스크립트 전용 Supabase 관리자 클라이언트.
 *
 * 앱이 쓰는 클라이언트(`src/shared/api/supabase.ts`)는 anon 키로 붙는다.
 * `holy_site_translations` 는 읽기 정책만 있어서 anon 으로는 쓰기가 막힌다
 * (마이그레이션 20260805110000 참고). 그래서 스크립트는 service_role 로 붙는다.
 *
 * **이 키는 RLS 를 통째로 우회한다.** `VITE_` 접두사를 일부러 붙이지 않았다 —
 * 붙이는 순간 Vite 가 브라우저 번들에 그대로 넣어 버리고, 그러면 누구나
 * DB 전체를 쓸 수 있게 된다. 앱 코드에서는 절대 이 모듈을 import 하지 않는다.
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createAdminClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error('VITE_SUPABASE_URL 이 없습니다. .env.local 을 확인하세요.');
    process.exit(1);
  }
  if (!serviceKey) {
    console.error(
      'SUPABASE_SERVICE_ROLE_KEY 가 없습니다.\n' +
        'Supabase 대시보드 → Settings → API Keys → Secret keys 에서 값을 복사해\n' +
        '.env.local 에 SUPABASE_SERVICE_ROLE_KEY=... 로 넣으세요.',
    );
    process.exit(1);
  }

  return createClient(url, serviceKey, {
    // 스크립트는 로그인 개념이 없다. 세션을 파일에 남기지 않는다.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
