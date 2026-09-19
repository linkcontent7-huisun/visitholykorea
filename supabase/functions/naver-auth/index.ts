/**
 * 네이버 로그인 — Supabase Edge Function (Deno).
 *
 * Supabase Auth 는 네이버를 공식 제공자로 지원하지 않는다. 그래서 이 함수가
 * 네이버 OAuth 를 직접 처리하고, 확인된 사용자에게 Supabase 세션을 발급한다.
 *
 * 흐름:
 *   1. GET /naver-auth/login    → 네이버 인증 페이지로 리디렉션 (state 발급)
 *   2. GET /naver-auth/callback → code 를 토큰으로 교환 → 프로필 조회
 *      → 이메일 기준으로 Supabase 사용자 생성/조회 (service_role)
 *      → 매직링크 verify URL 로 리디렉션해 앱 세션을 연다
 *
 * 배포:
 *   supabase secrets set NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... APP_URL=https://visitholykorea-app.vercel.app
 *   supabase functions deploy naver-auth --no-verify-jwt
 *   (네이버 개발자센터에 등록할 콜백 URL: <프로젝트>.supabase.co/functions/v1/naver-auth/callback)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID');
const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET');
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:3000';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function 콜백주소(req: Request): string {
  // Edge Runtime 안에서는 req.url 이 http:// 로 보인다(프록시 뒤). 네이버에 등록한 콜백은 https 라
  // 그대로 보내면 redirect_uri 불일치로 거절된다 — 항상 https 로 만든다.
  const url = new URL(req.url);
  return `https://${url.host}/functions/v1/naver-auth/callback`;
}

/** 로그인 실패 시 사용자를 앱으로 돌려보내며 이유를 쿼리로 남긴다. */
function 실패(reason: string): Response {
  const to = new URL(APP_URL);
  to.searchParams.set('auth_error', reason);
  return Response.redirect(to.toString(), 302);
}

Deno.serve(async (req) => {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return new Response('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 시크릿이 설정되지 않았습니다.', {
      status: 500,
    });
  }

  const url = new URL(req.url);

  // ── 1단계: 네이버 인증 페이지로 ───────────────────────────
  if (url.pathname.endsWith('/login')) {
    const state = crypto.randomUUID();
    const authorize = new URL('https://nid.naver.com/oauth2.0/authorize');
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('client_id', NAVER_CLIENT_ID);
    authorize.searchParams.set('redirect_uri', 콜백주소(req));
    authorize.searchParams.set('state', state);
    // M-01(보안 진단 2026-09-13): state 를 브라우저 쿠키에 묶는다. 콜백에서 쿼리 state 와 쿠키를
    // 대조해, 공격자가 만든 콜백 URL 을 피해자에게 열게 하는 로그인 CSRF 를 막는다.
    return new Response(null, {
      status: 302,
      headers: {
        location: authorize.toString(),
        'set-cookie': `naver_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  // ── 2단계: 콜백 처리 ─────────────────────────────────────
  if (url.pathname.endsWith('/callback')) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) return 실패('naver_denied');

    // M-01: 쿼리 state 가 /login 이 심은 쿠키와 일치해야 한다.
    const cookieState = (req.headers.get('cookie') ?? '')
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('naver_oauth_state='))
      ?.slice('naver_oauth_state='.length);
    if (!cookieState || cookieState !== state) return 실패('naver_state');

    // code → access_token
    const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token');
    tokenUrl.searchParams.set('grant_type', 'authorization_code');
    tokenUrl.searchParams.set('client_id', NAVER_CLIENT_ID);
    tokenUrl.searchParams.set('client_secret', NAVER_CLIENT_SECRET);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('state', state);
    const tokenRes = await fetch(tokenUrl);
    const token = await tokenRes.json();
    if (!token.access_token) return 실패('naver_token');

    // access_token → 프로필 (이메일은 네이버 앱 설정에서 "필수 제공"으로 켜야 한다)
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const profile = await profileRes.json();
    const naver = profile?.response;
    if (!naver?.email) return 실패('naver_no_email');

    // 이메일 기준으로 사용자 생성(이미 있으면 그대로 사용)
    const { error: createError } = await admin.auth.admin.createUser({
      email: naver.email,
      email_confirm: true,
      user_metadata: { name: naver.name ?? naver.nickname ?? '', provider: 'naver' },
    });
    // "이미 존재" 오류는 정상 경로다 — 재로그인이 그렇다.
    const alreadyExists = !!createError && `${createError.message}`.includes('already');
    if (createError && !alreadyExists) {
      return 실패('naver_create');
    }

    // M-02(보안 진단 2026-09-13): 같은 이메일의 계정이 다른 경로(이메일·카카오 등)로 만들어졌다면
    // 동의 없이 네이버 로그인으로 그 계정에 들어가게 두지 않는다 — 이메일만 같다고 같은 사람이라 단정하지 않는다.
    // 판정은 profiles.provider 가 아니라 auth 의 user_metadata.provider 로 한다: 위 createUser 가 심는 값이
    // 그것이고, profiles.provider 는 app_metadata 기준이라 네이버로 만든 계정도 'email' 로 적혀 재로그인이 막힌다.
    if (alreadyExists) {
      const { data: prof } = await admin
        .from('profiles')
        .select('id')
        .eq('email', naver.email)
        .maybeSingle();
      if (prof?.id) {
        const { data: existing } = await admin.auth.admin.getUserById(prof.id);
        const madeBy =
          existing?.user?.user_metadata?.provider ?? existing?.user?.app_metadata?.provider;
        if (madeBy && madeBy !== 'naver') return 실패('account_exists_other_provider');
      }
    }

    // 매직링크를 만들어 그 verify 주소로 보내면 브라우저에 세션이 열린다
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: naver.email,
      options: { redirectTo: APP_URL },
    });
    const hashed = link?.properties?.hashed_token;
    if (linkError || !hashed) return 실패('naver_link');

    const verify = new URL(`${SUPABASE_URL}/auth/v1/verify`);
    verify.searchParams.set('token', hashed);
    verify.searchParams.set('type', 'magiclink');
    verify.searchParams.set('redirect_to', APP_URL);
    return Response.redirect(verify.toString(), 302);
  }

  return new Response('Not Found', { status: 404 });
});
