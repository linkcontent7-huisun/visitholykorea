import { supabase } from '@/shared/api/supabase';

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
}

/**
 * 소셜 로그인 (OAuth).
 *
 * 구글·카카오·페이스북은 Supabase 공식 제공자다. 동작하려면 Supabase 대시보드
 * Authentication → Providers 에서 각 제공자를 켜고 클라이언트 ID·시크릿을 넣어야
 * 한다. 로그인 후에는 원래 화면으로 돌아온다.
 */
export async function signInWithOAuth(provider: 'google' | 'kakao' | 'facebook') {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
}

/**
 * 네이버 로그인.
 *
 * 네이버는 Supabase 공식 제공자가 아니라서 Edge Function(naver-auth)이 OAuth 를
 * 대신 처리한다. 함수가 네이버 인증 → 사용자 생성 → 세션 발급까지 끝내고
 * 앱으로 돌려보낸다. supabase/functions/naver-auth 참고.
 */
export function signInWithNaver() {
  const base = import.meta.env.VITE_SUPABASE_URL;
  window.location.href = `${base}/functions/v1/naver-auth/login`;
}

export async function signOut() {
  return supabase.auth.signOut();
}
