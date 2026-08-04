import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env';

/**
 * Supabase 클라이언트 (성지 DB · 인증 · 순례 스탬프).
 *
 * anon 키는 공개되는 값이므로, 데이터 보호는 전적으로 RLS 정책에 의존한다.
 * 정책 정의는 `supabase/migrations` 를 참고한다.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // 네이티브 앱(Capacitor)에서는 URL 해시 기반 세션 감지가 동작하지 않으므로 끈다.
    detectSessionInUrl: false,
  },
});
