/**
 * TourAPI 프록시 — 공공데이터포털 서비스키를 브라우저에서 걷어낸다 (보안 H-03).
 *
 * **왜** — VITE_TOUR_API_SERVICE_KEY 는 VITE_ 접두사라 번들에 그대로 노출됐다.
 * 공공데이터포털 키는 일일 호출 한도가 있어, 유출되면 제3자가 긁어 써 앱의
 * 붐빔 지수·주변 관광지가 통째로 실패한다.
 *
 * **ADR 0002 와 충돌하지 않는다** — 이 함수는 캐시 없이 통과만 시킨다(저장 아님).
 * 매 요청을 실시간으로 공공데이터포털에 그대로 전달하고 응답을 돌려줄 뿐이다.
 *
 * 배포:
 *   supabase secrets set TOUR_API_SERVICE_KEY=...
 *   supabase functions deploy tour-proxy
 */

const SERVICE_KEY = Deno.env.get('TOUR_API_SERVICE_KEY');
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://visitholykorea-app.vercel.app')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// 프록시가 대신 붙여도 되는 엔드포인트만. 임의 URL 프록시(SSRF)를 막는다.
const ALLOWED_HOSTS = ['apis.data.go.kr', 'api.visitkorea.or.kr'];

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsFor(req) });
  if (!SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'TOUR_API_SERVICE_KEY 미설정' }), {
      status: 500,
      headers: { ...corsFor(req), 'content-type': 'application/json' },
    });
  }

  // /functions/v1/tour-proxy/<upstream-url-encoded> 대신, 쿼리로 대상을 받는다.
  //   ?url=https://apis.data.go.kr/.../areaBasedList2&areaCode=1&...
  const reqUrl = new URL(req.url);
  const target = reqUrl.searchParams.get('url');
  if (!target) {
    return new Response(JSON.stringify({ error: 'url 파라미터가 필요합니다' }), {
      status: 400,
      headers: { ...corsFor(req), 'content-type': 'application/json' },
    });
  }

  let upstream: URL;
  try {
    upstream = new URL(target);
  } catch {
    return new Response(JSON.stringify({ error: '잘못된 url' }), {
      status: 400,
      headers: { ...corsFor(req), 'content-type': 'application/json' },
    });
  }
  if (!ALLOWED_HOSTS.includes(upstream.hostname)) {
    return new Response(JSON.stringify({ error: '허용되지 않은 호스트' }), {
      status: 400,
      headers: { ...corsFor(req), 'content-type': 'application/json' },
    });
  }

  // 클라이언트가 넘긴 나머지 쿼리(MobileOS·_type·areaCode 등)를 그대로 잇고,
  // 서비스키만 서버가 붙인다.
  reqUrl.searchParams.forEach((v, k) => {
    if (k !== 'url') upstream.searchParams.set(k, v);
  });
  upstream.searchParams.set('serviceKey', SERVICE_KEY);

  try {
    const res = await fetch(upstream, { headers: { accept: 'application/json' } });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        ...corsFor(req),
        'content-type': res.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err) {
    console.error('tour-proxy error:', err);
    return new Response(JSON.stringify({ error: '관광 정보를 불러오지 못했습니다' }), {
      status: 502,
      headers: { ...corsFor(req), 'content-type': 'application/json' },
    });
  }
});
