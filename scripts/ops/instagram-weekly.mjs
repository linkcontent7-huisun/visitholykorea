// 인스타 참고 계정 주간 점검 (2026-11-08 사장님 지시: 매주 월요일 아침, 참고 계정 5곳 벤치마킹).
// 인스타 공식 API 의 「비즈니스 계정 조회(business_discovery)」만 쓴다 — 화면 긁기(스크래핑)는 약관 위반이고
// 보안 확인(reCAPTCHA)에 막힌다(11/8 Aside 실측).
// 상대가 비즈니스·크리에이터 계정이어야 조회된다. 개인 계정이면 표에 「조회 안 됨」으로 남긴다.
//
// 필요한 GitHub 시크릿: IG_USER_ID(@visitholykorea 의 인스타 비즈니스 계정 ID), IG_ACCESS_TOKEN.
// 아직 없으면 「준비 중」 보고를 쓰고 정상 종료한다.
// 실행: node scripts/ops/instagram-weekly.mjs report.md
import { writeFileSync } from 'node:fs';

/** 참고 계정 — 사장님이 고른 5곳. 바꾸려면 여기만 고친다. */
const ACCOUNTS = [
  'lucky7_chilgok', // 칠곡 「시간여행자의 고백」 (docs/50-research/벤치마킹/2026-10-19-칠곡-시간여행자의고백.md)
  'mynolto', // 문화상상연구소
  'cpbc_news', // 가톨릭평화방송 뉴스
  'wydseoul2027', // 2027 서울 세계청년대회
  'soop_jewelry', // 사장님 지정 (11/8)
];

const VERSION = process.env.GRAPH_VERSION ?? 'v23.0'; // ⏳ Meta 앱 만들 때 화면에 나오는 최신 버전으로 맞춘다
const userId = process.env.IG_USER_ID;
const token = process.env.IG_ACCESS_TOKEN;
const out = process.argv[2] ?? 'report.md';
const DAY = 86_400_000;

const kst = (d) => new Date(d).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
const TYPE = { IMAGE: '사진', VIDEO: '영상', CAROUSEL_ALBUM: '여러 장' };
// 저장소가 공개라 남의 글은 앞부분만 짧게 — 원문은 링크로 본다
const snippet = (s = '') => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > 40 ? `${t.slice(0, 40)}…` : t;
};

async function lookup(username) {
  const media = 'media.limit(30){caption,timestamp,like_count,comments_count,media_type,permalink}';
  const fields = `business_discovery.username(${username}){username,followers_count,media_count,${media}}`;
  const url = `https://graph.facebook.com/${VERSION}/${userId}?fields=${encodeURIComponent(fields)}&access_token=${token}`;
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) return { username, error: body?.error?.message ?? `HTTP ${res.status}` };
  return body.business_discovery;
}

function section(acc, now) {
  if (acc.error) return [`### @${acc.username}`, '', `❌ 조회 안 됨 — ${acc.error}`, ''];
  const posts = acc.media?.data ?? [];
  const week = posts.filter((p) => now - new Date(p.timestamp) <= 7 * DAY);
  const score = (p) => (p.like_count ?? 0) + (p.comments_count ?? 0);
  const best = [...posts].sort((a, b) => score(b) - score(a))[0];
  const types = Object.entries(
    week.reduce((m, p) => ({ ...m, [p.media_type]: (m[p.media_type] ?? 0) + 1 }), {}),
  )
    .map(([k, n]) => `${TYPE[k] ?? k} ${n}`)
    .join(' · ');
  const lines = [
    `### @${acc.username}`,
    '',
    `팔로워 ${acc.followers_count ?? '?'} · 전체 게시물 ${acc.media_count ?? '?'} · **지난 7일 ${week.length}개**${types ? ` (${types})` : ''}`,
    '',
  ];
  if (week.length) {
    lines.push('| 올린 때 | 형식 | 좋아요 | 댓글 | 앞부분 |', '|---|---|---|---|---|');
    for (const p of week)
      lines.push(
        `| ${kst(p.timestamp)} | ${TYPE[p.media_type] ?? p.media_type} | ${p.like_count ?? '-'} | ${p.comments_count ?? '-'} | [${snippet(p.caption) || '(글 없음)'}](${p.permalink}) |`,
      );
    lines.push('');
  }
  if (best)
    lines.push(
      `최근 30개 중 반응 1위: [${snippet(best.caption) || '(글 없음)'}](${best.permalink}) — 좋아요 ${best.like_count ?? '-'}, 댓글 ${best.comments_count ?? '-'}`,
      '',
    );
  return lines;
}

const now = Date.now();
const head = [`# 인스타 참고 계정 주간 점검 — ${kst(now)} (한국 시간)`, ''];
let body;
if (!userId || !token) {
  body = [
    '⏳ **준비 중** — GitHub 시크릿 `IG_USER_ID`·`IG_ACCESS_TOKEN` 이 아직 없다.',
    '@visitholykorea 프로페셔널 계정 전환 → 페이스북 페이지 연결 → Meta 앱 토큰 발급 뒤 시크릿에 넣으면 다음 월요일부터 채워진다.',
    '',
    `대상: ${ACCOUNTS.map((a) => `@${a}`).join(', ')}`,
  ];
} else {
  const results = [];
  for (const a of ACCOUNTS) results.push(await lookup(a));
  body = results.flatMap((r) => section(r, now));
  body.push(
    '숫자는 조회 시각 값. 「반응이 좋았다 → 효과가 있었다」는 추측이다(좋아요만으로 성과를 단정하지 않는다).',
  );
}
body.push(
  '',
  '만든 곳: `scripts/ops/instagram-weekly.mjs` (GitHub Actions `instagram-weekly.yml`, 매주 월 07:30 KST)',
);
writeFileSync(out, [...head, ...body].join('\n'));
console.log(`[instagram] ${ACCOUNTS.length}개 계정 → ${out}`);
