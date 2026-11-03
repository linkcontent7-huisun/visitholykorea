/**
 * 운영 서버 매일 점검 (2026-11-02 사장님 지시 「매일 자동 점검, 다음 세션 첫 보고로」).
 *
 * 왜: TourAPI 키가 9/15 재발급된 뒤 두 달 가까이 403 이었는데, 화면은 빈 칸으로 조용히
 * 넘어가서 아무도 몰랐다. 「접속 허용(OPTIONS)」이 아니라 **실제 데이터 요청**으로 확인한다.
 *
 * 사용: SUPABASE_URL=… SUPABASE_ANON_KEY=… node scripts/ops/health-check.mjs [보고서.md]
 * 하나라도 실패하면 종료코드 1 (GitHub Actions 가 빨간불).
 * 미카엘(Claude)은 유료라 하루 한 번, 질문 하나만 보낸다.
 */
import { writeFileSync } from 'node:fs';

const SITE = process.env.SITE_URL ?? 'https://visitholykorea.com';
const SB = process.env.SUPABASE_URL ?? 'https://kaahuoqzkgshihypzzyh.supabase.co';
// anon 키는 비밀이 아니다 — 운영 사이트 JS 에 그대로 들어 있다. 환경변수가 없으면 거기서 읽어
// GitHub 시크릿 없이도 돌게 한다. 사이트가 죽어 못 읽으면 그것 자체가 점검 실패다.
const KEY = process.env.SUPABASE_ANON_KEY ?? (await anonKeyFromSite());
if (!KEY) {
  console.error(
    'anon 키를 운영 사이트에서 읽지 못했습니다 — 사이트가 죽었거나 번들이 바뀌었습니다.',
  );
  process.exit(1);
}

async function anonKeyFromSite() {
  try {
    const html = await (await fetch(`${SITE}/`)).text();
    for (const [, src] of html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)) {
      const js = await (await fetch(new URL(src, SITE))).text();
      for (const [jwt] of js.matchAll(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g)) {
        const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());
        if (payload.role === 'anon' && payload.ref === 'kaahuoqzkgshihypzzyh') return jwt;
      }
    }
  } catch {
    /* 아래에서 실패 처리 */
  }
  return null;
}
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function get(url, init = {}) {
  const t = Date.now();
  // 한 번 끊김으로 빨간불을 켜지 않도록 네트워크 오류만 한 번 더 시도한다
  const once = () => fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
  const res = await once().catch(() => once());
  const text = await res.text();
  return { res, text, ms: Date.now() - t };
}

function tour(path, params) {
  const q = new URLSearchParams({
    url: `https://apis.data.go.kr/B551011/${path}`,
    MobileOS: 'ETC',
    MobileApp: 'VisitHolyKorea',
    _type: 'json',
    numOfRows: '1',
    pageNo: '1',
    ...params,
  });
  return `${SB}/functions/v1/tour-proxy?${q}`;
}

/** [이름, 무엇이 고장 나면 사용자가 무엇을 못 보는지, 점검 함수] */
const CHECKS = [
  [
    '사이트 첫 화면',
    '사이트 전체',
    async () => {
      const { res, text } = await get(SITE);
      return [res.ok && text.includes('<div id="root"'), `HTTP ${res.status}`];
    },
  ],
  [
    '성지 상세 페이지·사이트맵',
    '검색 노출',
    async () => {
      const { res, text } = await get(`${SITE}/sitemap.xml`);
      const n = (text.match(/<loc>/g) ?? []).length;
      return [res.ok && n > 200, `HTTP ${res.status}, 주소 ${n}개`];
    },
  ],
  [
    '성지 DB',
    '성지 목록·지도',
    async () => {
      const { res } = await get(`${SB}/rest/v1/holy_sites?select=id`, {
        headers: { ...H, Prefer: 'count=exact', Range: '0-0' },
      });
      const total = Number((res.headers.get('content-range') ?? '').split('/')[1] ?? 0);
      return [res.ok && total > 200, `HTTP ${res.status}, 성지 ${total}곳`];
    },
  ],
  [
    '주소록(성당·공소) DB',
    '성당 검색',
    async () => {
      const { res, text } = await get(
        `${SB}/rest/v1/directory_public?select=name&name=eq.${encodeURIComponent('서귀포')}`,
        { headers: H },
      );
      return [res.ok && text.includes('서귀포'), `HTTP ${res.status}`];
    },
  ],
  [
    'TourAPI 국문(지역 관광지)',
    '주변 관광지',
    async () => {
      const { res, text } = await get(tour('KorService2/areaBasedList2', { areaCode: '39' }), {
        headers: H,
      });
      const code = text.match(/"resultCode"\s*:\s*"(\d+)"/)?.[1];
      const err = text.match(/errMsg"?\s*[:>]\s*"?([A-Z_]+)/)?.[1];
      return [res.ok && code === '0000', `HTTP ${res.status} ${code ?? err ?? text.slice(0, 60)}`];
    },
  ],
  [
    'TourAPI 국문(성지 주변 숙박)',
    '주변 맛집·숙박',
    async () => {
      const { res, text } = await get(
        tour('KorService2/locationBasedList2', {
          mapX: '126.9871',
          mapY: '37.5633',
          radius: '2000',
          contentTypeId: '32',
        }),
        { headers: H },
      );
      const code = text.match(/"resultCode"\s*:\s*"(\d+)"/)?.[1];
      const err = text.match(/errMsg"?\s*[:>]\s*"?([A-Z_]+)/)?.[1];
      return [res.ok && code === '0000', `HTTP ${res.status} ${code ?? err ?? text.slice(0, 60)}`];
    },
  ],
  [
    'TourAPI 영문',
    '외국어 화면의 주변 관광지',
    async () => {
      const { res, text } = await get(tour('EngService2/areaBasedList2', { areaCode: '1' }), {
        headers: H,
      });
      const code = text.match(/"resultCode"\s*:\s*"(\d+)"/)?.[1];
      const err = text.match(/errMsg"?\s*[:>]\s*"?([A-Z_]+)/)?.[1];
      return [res.ok && code === '0000', `HTTP ${res.status} ${code ?? err ?? text.slice(0, 60)}`];
    },
  ],
  [
    '카카오 로그인',
    '카카오 로그인',
    async () => {
      const { res } = await get(`${SB}/functions/v1/kakao-auth/login`, { redirect: 'manual' });
      const to = res.headers.get('location') ?? '';
      return [
        res.status === 302 && !to.includes('auth_error'),
        `HTTP ${res.status} → ${to.slice(0, 40)}`,
      ];
    },
  ],
  [
    '네이버 로그인',
    '네이버 로그인',
    async () => {
      const { res } = await get(`${SB}/functions/v1/naver-auth/login`, { redirect: 'manual' });
      const to = res.headers.get('location') ?? '';
      return [
        res.status === 302 && !to.includes('auth_error'),
        `HTTP ${res.status} → ${to.slice(0, 40)}`,
      ];
    },
  ],
  [
    '미카엘 AI 답변(Claude)',
    'AI 미카엘 — 크레딧이 떨어지면 여기서 잡힌다',
    async () => {
      const { res, text, ms } = await get(`${SB}/functions/v1/ai-guide`, {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'ask', question: '배론성지는 어떤 곳이에요?', history: [] }),
      });
      let j = {};
      try {
        j = JSON.parse(text);
      } catch {
        /* 아래에서 실패로 */
      }
      const fine =
        res.ok &&
        j.provider === 'claude' &&
        !j.fallbackFrom &&
        String(j.text ?? '').includes('배론');
      const why = j.fallbackFrom ? `예비로 넘어감(${j.reason})` : (j.provider ?? text.slice(0, 60));
      return [fine, `HTTP ${res.status}, ${why}, ${(ms / 1000).toFixed(1)}초`];
    },
  ],
];

const rows = [];
for (const [name, impact, fn] of CHECKS) {
  let ok = false;
  let detail = '';
  try {
    [ok, detail] = await fn();
  } catch (e) {
    detail = `오류: ${e instanceof Error ? e.message : e}`;
  }
  rows.push({ name, impact, ok, detail });
  console.log(ok ? 'OK  ' : 'FAIL', name, '|', detail);
}

const failed = rows.filter((r) => !r.ok);
const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
const md = [
  `# 운영 서버 점검 — ${now} (한국 시간)`,
  '',
  failed.length === 0
    ? `✅ **모두 정상 (${rows.length}개)**`
    : `🔴 **고장 ${failed.length}개** — ${failed.map((r) => r.name).join(', ')}`,
  '',
  '| 점검 | 결과 | 고장 나면 안 보이는 것 | 자세히 |',
  '|---|---|---|---|',
  ...rows.map(
    (r) => `| ${r.name} | ${r.ok ? '✅' : '❌'} | ${r.impact} | ${r.detail.replace(/\|/g, '/')} |`,
  ),
  '',
  '만든 곳: `scripts/ops/health-check.mjs` (GitHub Actions `health-check.yml`, 매일 07:00 KST)',
  '',
].join('\n');

const out = process.argv[2];
if (out) writeFileSync(out, md);

// 사장님 디스코드로 매일 아침 한 통 (11/3 지시: 정상이어도 매일). 주소가 없으면 건너뛴다.
const hook = process.env.DISCORD_WEBHOOK_URL;
if (hook) {
  const lines =
    failed.length === 0
      ? [`🩺 **운영 점검 ${now}** — ✅ ${rows.length}개 모두 정상`]
      : [
          `🩺 **운영 점검 ${now}** — 🔴 고장 ${failed.length}개`,
          ...failed.map((r) => `• ${r.name}: ${r.detail} (안 보이는 것: ${r.impact})`),
        ];
  const issue = process.env.HEALTH_ISSUE_URL;
  if (issue) lines.push(issue);
  await fetch(hook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: lines.join('\n').slice(0, 1900) }),
  }).catch((e) => console.warn('디스코드 알림 실패:', e.message));
}
process.exit(failed.length === 0 ? 0 : 1);
