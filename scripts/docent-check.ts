/**
 * 도슨트 소개글 검사 — `npm run docent:check` (DB 없이 파일만 본다)
 *
 * 2026-09-17 밤 Codex 가 173곳을 "주변의 길과 마을도 성지의 배경을 이룹니다" 같은 틀 문장으로 찍어낸 사고 뒤에 만들었다.
 * 자 수·문단 수만 세면 그런 원고를 못 잡는다. 여기서는 **다른 성지 파일에도 같은 문장이 있으면** 틀 문장으로 본다.
 *
 * 잡는 것:
 *   1. 틀 문장 — 같은 문장(20자 이상)이 3개 이상 파일에 나옴
 *   2. 문단 수 ≠ 3, 500자 초과, 문단이 큰따옴표로 안 감싸짐
 *   3. 잘린 문장 — 문단이 "다." "요." "니다." 로 끝나지 않음
 *   4. 출처에 url 이 하나도 없음
 *   5. 그 성지 고유의 사실이 없음 — 문단에 숫자(연도)나 고유명사(신부·성인·주교·양식·재료)가 하나도 없음
 * 종료 코드 1 이면 실패. 실패 파일 목록을 찍는다.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/env.ts';

const DIR = join(ROOT, 'data', 'docent', '소개글');
const only = process.argv[2] ?? '';

function load(dir: string) {
  if (!existsSync(dir)) return [] as { name: string; head: string; paras: string[]; body: string }[];
  return readdirSync(dir).filter((f) => f.endsWith('.md') && f.includes(only)).map((f) => {
    const text = readFileSync(join(dir, f), 'utf-8');
    const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const body = (m?.[2] ?? '').trim();
    const paras = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    return { name: f, head: m?.[1] ?? '', paras, body };
  });
}

type Lang = 'ko' | 'en' | 'es' | 'it' | 'fr' | 'pt';
// 번역본은 문단 구조·따옴표·길이·한글 섞임·틀 문장만 본다 (고유 사실은 원문 검사에서 이미 확인됨)
const LATIN_FACT = /\d{3,4}|\p{Lu}[\p{L}]+/u;
function check(files: ReturnType<typeof load>, lang: Lang) {
  const sentenceOwners = new Map<string, Set<string>>();
  for (const f of files) {
    for (const s of f.body.split(/(?<=[.。!?"])\s+/)) {
      const key = s.replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim();
      if (key.length < 20) continue;
      if (!sentenceOwners.has(key)) sentenceOwners.set(key, new Set());
      sentenceOwners.get(key)!.add(f.name);
    }
  }
  const template = new Set([...sentenceOwners.entries()].filter(([, o]) => o.size >= 3).map(([k]) => k));
  const problems: string[] = [];
  const endsOk = lang === 'ko' ? /(니다|요)\."$/ : /[.!?]"$/; // 한국어는 존댓말로 끝나야 한다 — "~자리다." 같은 반말 금지
  const hasFact = lang === 'ko' ? /\d{3,4}|신부|성인|주교|성당|양식|벽돌|고딕|로마네스크|순교|성지|공소|교우촌|박해|주교좌|수도원|기념/ : lang === 'en' ? /\d{3,4}|Father|Bishop|Saint|St\.|martyr|Gothic|Romanesque|brick|church|cathedral|shrine|hill|village|gate|parish|persecution|mission/i : LATIN_FACT;
  for (const f of files) {
    const bad: string[] = [];
    const chars = f.body.replace(/\s/g, '').length;
    if (f.paras.length !== 3) bad.push(`문단 ${f.paras.length}개`);
    // 영어는 같은 내용이 글자 수로 두 배 안팎이라 기준을 달리 둔다
    if (chars > (lang === 'ko' ? 500 : 1000)) bad.push(`${chars}자`);
    if (!f.paras.every((p) => p.startsWith('"') && p.endsWith('"'))) bad.push('큰따옴표 누락');
    f.paras.forEach((p, i) => { if (!endsOk.test(p)) bad.push(`${i + 1}문단 잘림`); });
    f.paras.forEach((p, i) => { if (!hasFact.test(p)) bad.push(`${i + 1}문단 고유 사실 없음`); });
    if (!/^\s+url:\s*https?:\/\//m.test(f.head)) bad.push('출처 url 없음');
    if (lang !== 'ko' && /[가-힣]/.test(f.body)) bad.push('한글 섞임');
    const t = [...template].filter((k) => f.body.replace(/\s+/g, ' ').includes(k));
    if (t.length) bad.push(`틀 문장 ${t.length}개: "${(t[0] ?? '').slice(0, 30)}…"`);
    // 한 파일 안에서 같은 문장이 두 번 이상 — 9/18 실측(강경·경상감영·곡성)
    const seen = new Map<string, number>();
    for (const sent of f.body.split(/(?<=[.。!?"])\s+/)) { const k = sent.replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim(); if (k.length >= 15) seen.set(k, (seen.get(k) ?? 0) + 1); }
    const rep = [...seen.entries()].filter(([, c]) => c >= 2);
    if (rep.length) bad.push(`파일 안 반복 ${rep.length}문장`);
    if (lang === 'ko' && /[가-힣](다|자)\.\s/.test(f.body.replace(/(니다|습니다|입니다)\.\s/g, ' '))) bad.push('반말 문장');
    if (bad.length) problems.push(`  ✗ ${f.name} — ${bad.join(' · ')}`);
  }
  return { n: files.length, problems, template };
}

const ko = check(load(DIR), 'ko');
console.log(`한국어 ${ko.n}곳 · 실패 ${ko.problems.length} · 틀 문장 ${ko.template.size}종`);
ko.problems.forEach((p) => console.log(p));
if (ko.template.size) { console.log('틀 문장:'); [...ko.template].slice(0, 5).forEach((t) => console.log(`  - ${t.slice(0, 60)}`)); }
const NAMES: Record<Exclude<Lang, 'ko'>, string> = { en: '영어', es: '스페인어', it: '이탈리아어', fr: '프랑스어', pt: '포르투갈어' };
let fails = ko.problems.length;
for (const lang of ['en', 'es', 'it', 'fr', 'pt'] as const) {
  let files: ReturnType<typeof load> = [];
  try { files = load(join(DIR, lang)); } catch { continue; }
  if (!files.length) continue;
  const r = check(files, lang);
  console.log(`${NAMES[lang]} ${r.n}곳 · 실패 ${r.problems.length} · 틀 문장 ${r.template.size}종`);
  r.problems.forEach((p) => console.log(p));
  fails += r.problems.length;
}
process.exit(fails ? 1 : 0);
