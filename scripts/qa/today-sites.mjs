// 오늘 QA 가 볼 성지 30곳을 고른다. 성지를 id 순으로 줄 세워 30곳씩 나누고,
// 날짜(한국 시간)에 따라 묶음을 돌린다 — 213곳이면 8일에 한 바퀴.
// 실행: node scripts/qa/today-sites.mjs [YYYY-MM-DD]
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(
  readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^VITE_SUPABASE_(URL|ANON_KEY)=/.test(l))
    .map((l) => [
      l.slice(0, l.indexOf('=')),
      l
        .slice(l.indexOf('=') + 1)
        .trim()
        .replace(/^"|"$/g, ''),
    ]),
);
const PER_DAY = 30;
const day = process.argv[2] ?? new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/holy_sites?select=id,name&order=id`, {
  headers: { apikey: env.VITE_SUPABASE_ANON_KEY },
});
if (!res.ok) throw new Error(`성지 목록 조회 실패 ${res.status}`);
const sites = await res.json();
const chunks = Math.ceil(sites.length / PER_DAY);
const idx = Math.floor(Date.parse(day) / 86400e3) % chunks;
const today = sites.slice(idx * PER_DAY, idx * PER_DAY + PER_DAY);
console.log(
  JSON.stringify(
    {
      day,
      total: sites.length,
      chunk: `${idx + 1}/${chunks}`,
      sites: today.map((s) => ({ name: s.name, url: `https://visitholykorea.com/sites/${s.id}` })),
    },
    null,
    1,
  ),
);
