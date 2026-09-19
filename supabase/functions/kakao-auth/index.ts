/**
 * 카카오 **간편로그인**(카카오톡 앱으로 로그인) — Supabase Edge Function (Deno).
 *
 * Supabase 의 카카오 제공자는 표준 웹 로그인(REST)만 열어서 스마트폰에서도 아이디·비밀번호를
 * 쳐야 한다. 카카오톡 앱으로 한 번에 들어가는 간편로그인은 카카오 JS SDK 의 `throughTalk` 로만
 * 열린다(공식 문서 확인, 2026-09-19). 그래서 스마트폰에서는 이 함수가 SDK 를 실은 작은 페이지를
 * 내려 카카오톡을 띄우고, 돌아온 코드를 직접 처리해 Supabase 세션을 발급한다. PC 는 그대로
 * Supabase 제공자를 쓴다(`src/features/auth/api/auth.ts`).
 *
 * 흐름 (naver-auth 와 같은 뼈대):
 *   1. GET /kakao-auth/login    → state 쿠키 발급 + SDK 페이지 (카카오톡 앱 → 동의 → callback)
 *   2. GET /kakao-auth/callback → code 를 토큰으로 교환 → 프로필 → 사용자 생성/조회 → 매직링크 verify 로 세션
 *
 * 배포:
 *   supabase secrets set KAKAO_REST_KEY=... KAKAO_JS_KEY=... KAKAO_CLIENT_SECRET=... APP_URL=https://visitholykorea-app.vercel.app
 *   supabase functions deploy kakao-auth --no-verify-jwt
 *   카카오 콘솔 → 카카오 로그인 → Redirect URI 에 <프로젝트>.supabase.co/functions/v1/kakao-auth/callback 추가,
 *   앱 → 플랫폼 → Web 에 <프로젝트>.supabase.co 와 앱 도메인 등록 (SDK 는 등록된 도메인에서만 돈다).
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const KAKAO_REST_KEY = Deno.env.get('KAKAO_REST_KEY');
const KAKAO_JS_KEY = Deno.env.get('KAKAO_JS_KEY');
const KAKAO_CLIENT_SECRET = Deno.env.get('KAKAO_CLIENT_SECRET') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:3000';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function 콜백주소(req: Request): string {
  // Edge Runtime 안에서는 req.url 이 http 로 보인다 — 카카오에 등록한 주소는 https 라 항상 https 로 만든다
  const url = new URL(req.url);
  return `https://${url.host}/functions/v1/kakao-auth/callback`;
}

function 실패(reason: string): Response {
  const to = new URL(APP_URL);
  to.searchParams.set('auth_error', reason);
  return Response.redirect(to.toString(), 302);
}

/** state 쿠키 — 콜백에서 대조해 로그인 CSRF 를 막는다 (naver-auth M-01 과 같은 장치). */
function 쿠키값(req: Request, name: string): string | null {
  const m = (req.headers.get('cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : null;
}

/** 카카오톡 앱을 띄우는 한 페이지. SDK 가 없거나 카카오톡이 없으면 SDK 가 알아서 계정 로그인으로 넘긴다. */
function 로그인페이지(jsKey: string, callback: string, state: string): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>카카오 로그인</title>
<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"></script>
<style>body{font-family:sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#fff;color:#333}p{font-size:1rem}</style>
</head><body><p>카카오톡으로 이동합니다…</p>
<script>
  try {
    Kakao.init(${JSON.stringify(jsKey)});
    Kakao.Auth.authorize({ redirectUri: ${JSON.stringify(callback)}, state: ${JSON.stringify(state)}, throughTalk: true });
  } catch (e) {
    document.querySelector('p').textContent = '카카오 로그인을 열지 못했습니다. 앱으로 돌아가 다시 시도해 주세요.';
  }
</script></body></html>`;
}

Deno.serve(async (req) => {
  if (!KAKAO_REST_KEY || !KAKAO_JS_KEY) {
    return new Response('KAKAO_REST_KEY / KAKAO_JS_KEY 시크릿이 설정되지 않았습니다.', {
      status: 500,
    });
  }
  const url = new URL(req.url);

  // ── 1단계: 카카오톡 앱으로 ───────────────────────────────
  if (url.pathname.endsWith('/login')) {
    const state = crypto.randomUUID();
    return new Response(로그인페이지(KAKAO_JS_KEY, 콜백주소(req), state), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'set-cookie': `kakao_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  // ── 2단계: 콜백 처리 ─────────────────────────────────────
  if (url.pathname.endsWith('/callback')) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (url.searchParams.get('error') || !code) return 실패('kakao_denied');
    if (!state || state !== 쿠키값(req, 'kakao_oauth_state')) return 실패('kakao_state');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_KEY,
      redirect_uri: 콜백주소(req),
      code,
    });
    if (KAKAO_CLIENT_SECRET) body.set('client_secret', KAKAO_CLIENT_SECRET);
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });
    const token = await tokenRes.json();
    if (!token.access_token) return 실패('kakao_token');

    // 이메일은 카카오 콘솔 동의항목에서 "필수 동의"여야 온다 (2026-09-19 확인됨)
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const profile = await profileRes.json();
    const email: string | undefined = profile?.kakao_account?.email;
    const name: string = profile?.kakao_account?.profile?.nickname ?? '';
    if (!email) return 실패('kakao_no_email');

    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, provider: 'kakao' },
    });
    const alreadyExists = !!createError && `${createError.message}`.includes('already');
    if (createError && !alreadyExists) return 실패('kakao_create');

    // 같은 이메일이 다른 경로(이메일·네이버)로 만들어진 계정이면 들어가지 않는다 (naver-auth M-02 와 같다).
    // Supabase 카카오 제공자로 PC 에서 만든 계정은 app_metadata.provider 가 'kakao' 라 그대로 통과한다.
    if (alreadyExists) {
      const { data: prof } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (prof?.id) {
        const { data: existing } = await admin.auth.admin.getUserById(prof.id);
        const madeBy =
          existing?.user?.user_metadata?.provider ?? existing?.user?.app_metadata?.provider;
        if (madeBy && madeBy !== 'kakao') return 실패('account_exists_other_provider');
      }
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: APP_URL },
    });
    const hashed = link?.properties?.hashed_token;
    if (linkError || !hashed) return 실패('kakao_link');

    const verify = new URL(`${SUPABASE_URL}/auth/v1/verify`);
    verify.searchParams.set('token', hashed);
    verify.searchParams.set('type', 'magiclink');
    verify.searchParams.set('redirect_to', APP_URL);
    return Response.redirect(verify.toString(), 302);
  }

  return new Response('Not Found', { status: 404 });
});
