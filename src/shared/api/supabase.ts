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
    // 소셜 로그인(구글·카카오·네이버 매직링크)은 앱 주소로 돌아올 때 URL 에 토큰을 실어 온다.
    // 이 값이 false 면 supabase-js 가 그 토큰을 읽지 않아 "로그인했는데 로그인 버튼이 그대로" 가 된다
    // (2026-09-19 실측). 네이티브(Capacitor)에서는 딥링크로 받은 URL 을 따로 넘겨야 하지만, 웹은 이걸로 충분하다.
    detectSessionInUrl: true,
  },
});
