/**
 * 인증 메일 서식을 **실제로 갈라 보는** 검사.
 *
 * 앞선 `auth-email-template.test.ts` 가 구조(짝·변수)를 본다면, 여기서는 Go 템플릿의
 * if / else if / else 를 그대로 흉내 내 언어별 결과를 만들어 본다. Supabase 안에서
 * 돌 코드를 밖에서 한 번 더 확인하는 셈이다 — 한국어 가입자가 영어 편지를 받는 사고를
 * 코드로 막는다(2026-09-20).
 *
 * 흉내 내는 문법은 서식이 쓰는 것뿐이다:
 *   {{ $lang := printf "%v" (index .Data "lang") }} / {{ if eq $lang "ko" }} / {{ else if ... }} /
 *   {{ else }} / {{ end }} / {{ .ConfirmationURL }}
 * `printf "%v"` 는 값이 없을 때 "<nil>" 이라는 문자열이 된다 — Go 가 nil 과 문자열을 비교하다
 * 죽는 것을 막는 장치라, 흉내에서도 그대로 재현한다(그래야 검사가 진짜 검사가 된다).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = join(process.cwd(), 'supabase/auth-emails');
const LINK = 'https://example.test/confirm?token=abc';

/** 서식이 쓰는 최소 문법만 처리한다. 모르는 문법이 나오면 일부러 실패시킨다. */
export function renderGoTemplate(tpl: string, data: { lang?: string; url: string }): string {
  const tokens = tpl.split(/(\{\{[^}]*\}\})/);
  let out = '';
  /** 서식이 먼저 만들어 두는 변수. 아직 안 만들었으면 비교가 성립하지 않는다. */
  let lang: string | null = null;
  // 분기 상태: 지금 블록을 출력할지, 이 분기에서 이미 참이 나왔는지
  const stack: { emitting: boolean; taken: boolean }[] = [];
  const emitting = () => stack.every((s) => s.emitting);

  for (const tok of tokens) {
    const m = /^\{\{\s*(.*?)\s*\}\}$/.exec(tok);
    if (!m) {
      if (emitting()) out += tok;
      continue;
    }
    const expr = m[1] ?? '';
    // {{ $lang := printf "%v" (index .Data "lang") }} — Go 와 같이 없는 값은 "<nil>" 이 된다
    if (/^\$lang\s*:=\s*printf\s+"%v"\s+\(index \.Data "lang"\)$/.test(expr)) {
      lang = data.lang === undefined ? '<nil>' : String(data.lang);
      continue;
    }
    const cond = /^(?:else\s+)?if\s+eq\s+\$lang\s+"([a-z]{2})"$/.exec(expr);
    if (/^if\s/.test(expr)) {
      if (!cond) throw new Error(`모르는 조건: ${expr}`);
      if (lang === null) throw new Error('$lang 을 만들기 전에 비교했다');
      const hit = lang === cond[1];
      stack.push({ emitting: hit, taken: hit });
    } else if (/^else\s+if\s/.test(expr)) {
      if (!cond) throw new Error(`모르는 조건: ${expr}`);
      const top = stack.at(-1);
      if (!top) throw new Error('else if 앞에 if 가 없다');
      const hit = !top.taken && lang === cond[1];
      top.emitting = hit;
      top.taken = top.taken || hit;
    } else if (expr === 'else') {
      const top = stack.at(-1);
      if (!top) throw new Error('else 앞에 if 가 없다');
      top.emitting = !top.taken;
      top.taken = true;
    } else if (expr === 'end') {
      stack.pop();
    } else if (expr === '.ConfirmationURL') {
      if (emitting()) out += data.url;
    } else {
      throw new Error(`모르는 표현: ${expr}`);
    }
  }
  if (stack.length !== 0) throw new Error('분기가 닫히지 않았다');
  return out;
}

describe('가입 인증 메일 — 언어별 실제 결과', () => {
  const tpl = readFileSync(join(DIR, 'confirmation.html'), 'utf8');
  const render = (lang?: string) => renderGoTemplate(tpl, { lang, url: LINK });

  it('한국어로 가입하면 한국어 편지가 간다 — 영어 문장은 섞이지 않는다', () => {
    const html = render('ko');
    expect(html).toContain('이메일 주소를 확인해 주세요');
    expect(html).toContain('가입 확인하기');
    expect(html).not.toContain('Confirm your email address');
    expect(html).not.toContain('Conferma');
  });

  it.each([
    ['es', 'Confirme su correo electrónico'],
    ['fr', 'Confirmez votre adresse e-mail'],
    ['pt', 'Confirme o seu e-mail'],
    ['it', 'Conferma il tuo indirizzo e-mail'],
    ['en', 'Confirm your email address'],
  ])('%s 로 가입하면 그 언어로 간다', (lang, heading) => {
    const html = render(lang);
    expect(html).toContain(heading);
    expect(html).not.toContain('이메일 주소를 확인해 주세요');
  });

  it('값이 없으면 비교가 "<nil>" 로 이뤄진다 — Go 가 nil 비교로 죽지 않게 한 장치', () => {
    // 이 장치가 빠지면 값 없는 가입에서 편지가 아예 안 나간다(2026-09-20 위험 제거)
    expect(tpl).toContain('printf "%v" (index .Data "lang")');
    expect(tpl).not.toContain('eq .Data.lang');
  });

  it('언어를 모르면(옛 가입자·값 없음) 영어로 간다 — 빈 편지가 되지 않는다', () => {
    for (const lang of [undefined, '', 'zh']) {
      const html = render(lang);
      expect(html).toContain('Confirm your email address');
      expect(html).toContain(LINK);
    }
  });

  it('어느 언어든 확인 링크가 정확히 한 번 단추로, 한 번 글자로 들어간다', () => {
    for (const lang of ['ko', 'en', 'it', undefined]) {
      const html = render(lang);
      expect(html.split(LINK).length - 1).toBe(2);
    }
  });

  it('남은 템플릿 표시가 편지에 새어 나가지 않는다', () => {
    for (const lang of ['ko', 'en', undefined]) {
      expect(render(lang)).not.toMatch(/\{\{|\}\}/);
    }
  });
});

describe('비밀번호 재설정 메일 — 언어별 실제 결과', () => {
  const tpl = readFileSync(join(DIR, 'recovery.html'), 'utf8');
  it('한국어 계정은 한국어로, 모르면 영어로', () => {
    expect(renderGoTemplate(tpl, { lang: 'ko', url: LINK })).toContain(
      '비밀번호를 새로 정하시겠어요?',
    );
    expect(renderGoTemplate(tpl, { lang: undefined, url: LINK })).toContain('Reset your password');
  });
});
