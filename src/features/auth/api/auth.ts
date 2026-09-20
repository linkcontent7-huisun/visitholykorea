import { supabase } from '@/shared/api/supabase';
import { ENABLED_LANGUAGES, type Language } from '@/shared/i18n/dictionary';

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * 가입 — 인증 메일을 **화면에서 고른 언어로** 보내기 위해 `lang` 을 함께 넘긴다.
 *
 * Supabase 는 언어별 메일 서식을 따로 두는 기능이 없다. 대신 서식이 Go 템플릿이라
 * `{{ if eq .Data.lang "ko" }}` 처럼 가입자 메타데이터로 갈라 쓸 수 있다 —
 * 그 `.Data.lang` 이 여기서 넘기는 값이다 (`supabase/auth-emails/` 의 서식과 한 쌍).
 * 값이 비면 서식이 영어로 떨어지므로, 모르는 값은 넘기지 않고 영어로 둔다.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  language: Language = 'ko',
) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name, lang: mailLanguage(language) } },
  });
}

/** 메일 서식이 아는 언어만 넘긴다 — 오타·옛 값이 들어오면 영어로 보낸다. */
export function mailLanguage(language: string): Language {
  return (ENABLED_LANGUAGES as string[]).includes(language) ? (language as Language) : 'en';
}

/**
 * 소셜 로그인 (OAuth).
 *
 * 구글·카카오·페이스북은 Supabase 공식 제공자다. 동작하려면 Supabase 대시보드
 * Authentication → Providers 에서 각 제공자를 켜고 클라이언트 ID·시크릿을 넣어야
 * 한다. 로그인 후에는 원래 화면으로 돌아온다.
 */
export async function signInWithOAuth(provider: 'google' | 'kakao' | 'facebook') {
  // 스마트폰의 카카오는 카카오톡 앱 간편로그인으로 — Supabase 제공자(REST)는 아이디·비밀번호를
  // 치게 해서 사장님 지적(2026-09-19). kakao-auth 함수가 상태 쿠키를 발급하고 앱의 SDK 페이지로 보낸다.
  if (provider === 'kakao' && isMobileBrowser()) {
    window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kakao-auth/login`;
    return { data: { provider, url: null }, error: null };
  }
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
}

/** 카카오톡 앱이 깔려 있을 만한 기기 — 안드로이드·아이폰·아이패드. PC 는 REST 로그인이 더 낫다(앱이 없다). */
export function isMobileBrowser(ua: string = navigator.userAgent): boolean {
  return /Android|iPhone|iPad|iPod/i.test(ua);
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
