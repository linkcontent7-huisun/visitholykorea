/**
 * 도슨트 원고 검수용 미리보기 — `npm run docent:preview` → screenshots/docent-preview.html (git 제외)
 * DB(docent_scripts)를 그대로 읽어 소개글(가운데 정렬·큰 명조·문단마다 따옴표)과 지점 원고를 성지별로 보여준다.
 */
import pg from 'pg';
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadEnvLocal } from './lib/env.ts';
loadEnvLocal();
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await c.connect();
const intro = await c.query(
  `select h.name, h.diocese, h.image_url, s.body, s.status, s.sources, s.written_by, s.updated_at from docent_scripts s join holy_sites h on h.id=s.site_id where s.kind='intro' and s.language='ko' order by s.updated_at desc, h.name`,
);
const pts = await c.query(
  `select h.name, s.seq, s.title, s.body, s.look_for from docent_scripts s join holy_sites h on h.id=s.site_id where s.kind='point' and s.language='ko' order by h.name, s.seq`,
);
await c.end();
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const byName: Record<string, typeof pts.rows> = {};
for (const p of pts.rows) (byName[p.name] ??= []).push(p);
const img = (u: string | null) =>
  !u ? '' : u.startsWith('http') ? u : 'http://127.0.0.1:5180/public' + u;
let html = `<!doctype html><html lang="ko" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>도슨트 원고 검수</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
:root{--brand:#1F2F55;--second:#6E7F5C;--ink:#1E222B;--muted:#5E6470;--line:#DDD8CF;--paper:#F5F3EE;--panel:#EEEAE2}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.75 'Noto Sans KR',sans-serif;padding:32px 20px 80px}.w{max-width:720px;margin:0 auto}
h1{font-family:'Gowun Batang',serif;font-size:1.6rem}.m{color:var(--muted);font-size:.85rem}
nav{display:flex;flex-wrap:wrap;gap:6px 14px;margin:10px 0 0}nav a{color:var(--brand);text-decoration:none;font-weight:500}nav a b{color:var(--second);font-weight:700;font-size:.75rem;margin-left:2px}
.site{margin-top:64px;padding-top:16px;border-top:1px solid var(--line)}.photo{aspect-ratio:16/9;background:#ccc center/cover;border-radius:8px}
.site h2{font-family:'Gowun Batang',serif;font-size:1.9rem;margin:16px 0 2px;text-align:center}.cat{text-align:center;font-size:.8rem;letter-spacing:.12em;color:var(--second);font-weight:700}
.intro{background:var(--panel);border-radius:8px;padding:28px 28px 22px;margin-top:18px;text-align:center}
.intro .lbl{font-size:.8rem;letter-spacing:.15em;color:var(--second);font-weight:700;margin-bottom:14px}
.intro p{font-family:'Gowun Batang',serif;font-size:1.25rem;line-height:1.85;margin:0 0 18px;word-break:keep-all}.intro p:last-of-type{margin-bottom:0}
.src{font-size:.78rem;color:var(--muted);margin-top:14px;text-align:center}.src a{color:var(--muted)}
.pts{margin-top:22px}.pts .lbl{font-weight:700;margin-bottom:6px}
.p{background:#fff;border:1px solid var(--line);border-left:3px solid var(--second);border-radius:0 6px 6px 0;padding:12px 16px;margin-top:10px}.p b{display:block}.p i{display:block;color:var(--second);font-style:normal;font-size:.85rem;margin-top:4px}
.tag{display:inline-block;font-size:.72rem;padding:1px 8px;border:1px solid var(--line);margin-left:6px;vertical-align:middle;color:var(--muted)}
.top{position:fixed;right:16px;bottom:16px;background:var(--brand);color:#fff;padding:8px 12px;border-radius:6px;text-decoration:none;font-size:.85rem}
</style></head><body><div class="w" id="top">
<h1>도슨트 원고 검수</h1><p class="m">DB(docent_scripts) 그대로 · 한국어 소개글 ${intro.rows.length}곳 · ${new Date().toLocaleString('ko-KR')} 기준 · 최근 올린 순. 고칠 곳은 "성지 이름 + 몇 문단 + 이렇게" 로 말해 주면 파일과 DB 를 같이 고친다.</p>
<nav>${intro.rows.map((r, i) => `<a href="#${encodeURIComponent(r.name)}">${i + 1}. ${esc(r.name)}<b>${byName[r.name] ? '지점' : ''}</b></a>`).join('')}</nav>`;
for (const r of intro.rows) {
  const paras = r.body
    .split(/\n\s*\n/)
    .map((x: string) => x.trim())
    .filter(Boolean);
  html += `<section class="site" id="${encodeURIComponent(r.name)}">${r.image_url ? `<div class="photo" style="background-image:url('${img(r.image_url)}')"></div>` : ''}
  <div class="cat">${r.diocese}교구</div><h2>${esc(r.name)}</h2>
  <div class="intro"><div class="lbl">소개글<span class="tag">${r.body.replace(/\s/g, '').length}자</span><span class="tag">${r.status}</span><span class="tag">${esc((r.written_by ?? '').split(' ')[0])}</span></div>${paras.map((p: string) => `<p>${esc(p)}</p>`).join('')}</div>
  <div class="src">근거: ${(r.sources as { label: string; url?: string }[]).map((s) => (s.url ? `<a href="${s.url}" target="_blank">${esc(s.label)}</a>` : esc(s.label))).join(' · ')}</div>`;
  const p = byName[r.name];
  if (p) {
    html += `<div class="pts"><div class="lbl">지금 이야기 — 지점 ${p.filter((x) => x.seq > 0 && x.seq < 99).length}개</div>`;
    for (const x of p)
      html += `<div class="p"><b>${x.seq === 0 ? '여는 말' : x.seq === 99 ? '맺음말' : x.seq + '. ' + esc(x.title ?? '')}</b>${esc(x.body)}${x.look_for ? `<i>눈여겨볼 것: ${esc(x.look_for)}</i>` : ''}</div>`;
    html += `</div>`;
  }
  html += `</section>`;
}
html += `<a class="top" href="#top">맨 위 ↑</a></div></body></html>`;
mkdirSync('screenshots', { recursive: true });
writeFileSync('screenshots/docent-preview.html', html);
console.log(`미리보기 ${intro.rows.length}곳 → screenshots/docent-preview.html`);
