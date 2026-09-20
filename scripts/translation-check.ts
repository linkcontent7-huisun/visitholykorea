/**
 * 번역 파일(`data/translations/<lang>-*.todo.json`)을 DB 에 넣기 전에 기계로 거른다.
 *
 *   npm run translate:check -- data/translations/es-all.todo.json
 *
 * 사람이 다 읽을 수 없는 양(206곳 × 4개 언어)이라, 눈으로 잡기 힘든 것만 기계가 본다:
 *   1. target 의 name 이 비었다 (description·history 는 비어 있어도 됨 — 부분 반영 허용)
 *   2. target 값이 영어 원문(`sourceEn`)과 글자 단위로 같다 = 번역 안 됨
 *   3. target 에 한글이 섞였다 (지명·인명은 로마자로 써야 한다)
 *   4. 영어 원문에 있는 연도(4자리)·숫자가 target 에 없다 = 사실 정보가 빠졌을 가능성
 *   5. target 언어가 아닌 다른 언어처럼 보인다 (관사·전치사 빈도로 대강 판별)
 *
 * 2026-09-21 T-032 에서 만들었다. 5곳 지점 원고에 영어가 그대로 복사된 채 DB 까지 갔던
 * 사고(같은 날 발견)가 있어, 이 검사를 통과하지 않은 파일은 import 하지 않는다.
 */
import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { ROOT } from './lib/env.ts';

const pathArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!pathArg) {
  console.error(
    '번역 파일 경로를 주세요.\n  npm run translate:check -- data/translations/es-all.todo.json',
  );
  process.exit(1);
}
const filePath = isAbsolute(pathArg) ? pathArg : join(ROOT, pathArg);

interface Item {
  siteId: string;
  source: { name: string };
  sourceEn?: Record<string, string | null>;
  target: Record<string, string | null>;
}
const file = JSON.parse(readFileSync(filePath, 'utf-8')) as { language: string; items: Item[] };
const lang = file.language;

// 언어 판별용 신호 — 정확한 판별기가 아니라 "영어/다른 언어가 통째로 들어온" 경우만 잡는다.
const SIG: Record<string, RegExp> = {
  en: /\b(the|and|of|was|with|church|shrine)\b/gi,
  es: /\b(el|la|los|las|del|y|fue|iglesia|santuario|mártires)\b|[ñ¿¡]/gi,
  fr: /\b(le|les|des|et|est|fut|église|sanctuaire|où|martyrs)\b|ç/gi,
  pt: /\b(o|os|as|do|da|dos|das|e|foi|igreja|santuário|não|mártires)\b|[ãõ]/gi,
  it: /\b(il|gli|di|del|della|e|fu|chiesa|santuario|è|martiri)\b|zione\b/gi,
};
function guessLanguage(text: string): string {
  const scores = Object.entries(SIG).map(([l, re]) => [l, (text.match(re) ?? []).length] as const);
  scores.sort((a, b) => b[1] - a[1]);
  const top = scores[0];
  return !top || top[1] === 0 ? '?' : top[0];
}

const FIELDS = ['name', 'description', 'history'] as const;
const problems: string[] = [];
let filledName = 0;
let filledDesc = 0;

for (const item of file.items) {
  const label = item.source.name;
  const t = item.target;
  const en = item.sourceEn ?? {};

  if (!t.name || t.name.trim() === '') {
    problems.push(`[빈 이름] ${label}`);
  } else {
    filledName++;
  }
  if (t.description && t.description.trim() !== '') filledDesc++;

  for (const f of FIELDS) {
    const v = t[f];
    if (!v || v.trim() === '') continue;
    const e = en[f];
    // 이름은 고유명사만으로 된 것(예: "Gangwon Gamyeong")이면 여섯 언어가 같아도 정상 —
    // 영어 일반 낱말(Church·Shrine…)이 든 이름만 "번역 안 됨"으로 본다
    const generic =
      /(church|shrine|site|tomb|hall|cathedral|station|village|holy|martyr|memorial|house|way|hill|prison|cave|museum)/i;
    if (e && v.trim() === e.trim() && (f !== 'name' || generic.test(v)))
      problems.push(`[영어 그대로] ${label} · ${f}`);
    if (/[가-힣]/.test(v))
      problems.push(
        `[한글 섞임] ${label} · ${f}: ${v
          .match(/[가-힣]+/g)
          ?.slice(0, 3)
          .join(' ')}`,
      );
    if (e) {
      const years = new Set(e.match(/\b1[5-9]\d\d\b|\b20\d\d\b/g) ?? []);
      const missing = [...years].filter((y) => !v.includes(y));
      if (missing.length) problems.push(`[연도 누락] ${label} · ${f}: ${missing.join(', ')}`);
    }
    // 이름은 짧아 판별이 안 되므로 본문만 본다
    if (f !== 'name' && v.length > 120) {
      const g = guessLanguage(v);
      // 로망스어끼리(es·fr·pt·it)는 관사가 겹쳐 오판이 잦다 — 영어가 통째로 들어온 경우만 잡는다
      if (g === 'en' && lang !== 'en')
        problems.push(`[언어 의심 ${g}] ${label} · ${f}: ${v.slice(0, 60)}`);
    }
  }
}

console.log(`\n${filePath}`);
console.log(
  `언어 ${lang} · ${file.items.length}곳 · 이름 채움 ${filledName} · 소개 채움 ${filledDesc}`,
);
if (problems.length === 0) {
  console.log('문제 없음 ✓\n');
} else {
  console.log(`문제 ${problems.length}건:`);
  for (const p of problems) console.log('  ' + p);
  console.log('');
  process.exit(1);
}
