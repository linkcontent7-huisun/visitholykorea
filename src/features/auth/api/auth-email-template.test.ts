/**
 * 인증 메일 서식 검사 — 서식이 깨지면 사용자는 "{{ if eq .Data.lang }}" 같은 글자를
 * 편지로 받는다. 되돌릴 수 없으므로 배포 전에 여기서 막는다.
 *
 * Go 템플릿을 실제로 렌더링하지는 못하니(런타임이 Supabase 안에 있다) 구조를 본다:
 * 분기와 end 의 짝, 여섯 언어가 다 있는지, 링크 변수가 각 분기마다 있는지.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENABLED_LANGUAGES } from '@/shared/i18n/dictionary';

const DIR = join(process.cwd(), 'supabase/auth-emails');
const FILES = ['confirmation.html', 'recovery.html'] as const;

describe.each(FILES)('인증 메일 서식 — %s', (file) => {
  const html = readFileSync(join(DIR, file), 'utf8');

  it('여는 분기와 {{ end }} 의 수가 맞는다', () => {
    const opens = html.match(/\{\{\s*if\s/g)?.length ?? 0;
    const ends = html.match(/\{\{\s*end\s*\}\}/g)?.length ?? 0;
    expect(opens).toBeGreaterThan(0);
    expect(ends).toBe(opens);
  });

  it('켜 둔 언어마다 분기가 있다 — 영어는 else 로 받는다', () => {
    for (const lang of ENABLED_LANGUAGES.filter((l) => l !== 'en')) {
      expect(html).toContain(`eq $lang "${lang}"`);
    }
    expect(html).toMatch(/\{\{\s*else\s*\}\}/);
  });

  it('한국어 분기가 가장 먼저 온다 — 이용자 대부분이 한국인이다', () => {
    expect(html.indexOf('eq $lang "ko"')).toBeGreaterThan(0);
    expect(html.indexOf('eq $lang "ko"')).toBeLessThan(html.indexOf('eq $lang "es"'));
  });

  it('분기 수만큼 확인 링크가 있다 — 한 언어라도 링크가 빠지면 가입을 못 끝낸다', () => {
    const branches =
      (html.match(/\{\{\s*if\s/g)?.length ?? 0) +
      (html.match(/\{\{\s*else if\s/g)?.length ?? 0) +
      1;
    const links = html.match(/href="\{\{ \.ConfirmationURL \}\}"/g)?.length ?? 0;
    expect(links).toBe(branches);
  });

  it('본문 글자는 16px 이상 — 어르신이 읽는다', () => {
    const sizes = [...html.matchAll(/font-size:(\d+)px/g)].map((m) => Number(m[1]));
    expect(Math.max(...sizes)).toBeGreaterThanOrEqual(16);
    // 13px 미만(깨알 글씨)은 쓰지 않는다
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(13);
  });

  it('아직 있지 않은 변수를 쓰지 않는다', () => {
    const vars = [...html.matchAll(/\{\{\s*\.([A-Za-z.]+)\s*\}\}/g)].map((m) => m[1]);
    const allowed = [
      'ConfirmationURL',
      'Token',
      'TokenHash',
      'SiteURL',
      'Email',
      'Data.lang',
      'Data.name',
    ];
    for (const v of vars) expect(allowed).toContain(v);
  });
});
