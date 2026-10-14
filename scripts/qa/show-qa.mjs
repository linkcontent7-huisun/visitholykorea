// 컴퓨터를 켜면 "QA 로그 보여드릴게요" — 최신 QA 보고서 두 개를 한 화면(HTML)으로 만들어 브라우저로 연다.
// (2026-10-14 사장님 지시) 작업 스케줄러 VisitHolyKorea-QA-보기(로그온 시)와 run-qa.ps1 끝에서 부른다.
// 회원 보고서에 개인정보가 있으므로 HTML 도 저장소 밖(QA_PRIVATE_DIR)에 쓴다.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const repo = new URL('../../', import.meta.url);
const privateDir = process.env.QA_PRIVATE_DIR;
if (!privateDir) throw new Error('QA_PRIVATE_DIR 가 필요합니다');
const repoDir = fileURLToPath(new URL('docs/70-agent-workspace/qa/reports/', repo));

const latest = (dir, re) => {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => re.test(f))
    .sort();
  return files.length
    ? join(dir instanceof URL ? dir.pathname.replace(/^\/(\w:)/, '$1') : dir, files.at(-1))
    : null;
};
const qaFile = latest(repoDir, /^\d{4}-\d{2}-\d{2}\.md$/);
const memberFile = latest(privateDir, /^\d{4}-\d{2}-\d{2}-회원·기록\.md$/);

let render = (md) =>
  `<pre>${md.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</pre>`;
try {
  const { micromark } = await import('micromark');
  const { gfm, gfmHtml } = await import('micromark-extension-gfm');
  render = (md) => micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
} catch {
  // 변환기가 없으면 글자 그대로 보여 준다
}
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const section = (file, empty) => {
  if (!file) return `<p class="muted">${empty}</p>`;
  const name = basename(file);
  const stale = !name.startsWith(today)
    ? `<p class="warn">오늘(${today}) 보고서는 아직 없습니다. 아래는 가장 최근 것(${name.slice(0, 10)})입니다. 오늘 점검이 끝나면 새 창이 다시 열립니다.</p>`
    : '';
  return stale + render(readFileSync(file, 'utf8'));
};
const html = `<!doctype html><meta charset="utf-8"><title>QA 로그 — ${today}</title>
<style>body{font-family:'Malgun Gothic',sans-serif;max-width:1100px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#222}
h1.hello{font-size:1.6rem;border-bottom:3px solid #3b5bdb;padding-bottom:.4rem}
table{border-collapse:collapse;width:100%;margin:.6rem 0;font-size:.92rem}th,td{border:1px solid #ccc;padding:.35rem .5rem;text-align:left;vertical-align:top}
th{background:#f1f3f5}.muted{color:#888}.warn{background:#fff3bf;padding:.5rem .8rem;border-radius:6px}
section{margin-bottom:3rem}</style>
<h1 class="hello">QA 로그 보여드릴게요 🙂 — ${today}</h1>
<section>${section(qaFile, '아직 QA 점검 보고서가 없습니다.')}</section>
<section>${section(memberFile, '아직 회원·기록 보고서가 없습니다.')}</section>`;
const out = join(privateDir, 'QA-로그-보기.html');
writeFileSync(out, html);
if (!process.argv.includes('--no-open')) execFile('cmd', ['/c', 'start', '', out]);
console.log(out);
