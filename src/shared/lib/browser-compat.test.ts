import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 브라우저 호환성 회귀 가드.
 *
 * 2026-09-01 에 실기기에서 **앱 전체가 흰 화면**이 되는 사고가 있었다.
 * 원인은 정규식 lookbehind `(?<=…)` 한 줄이었다 — iOS 16.3 이하 사파리는
 * 이 문법을 파싱 단계에서 SyntaxError 로 죽인다. 번들이 하나라서 그 한 줄이
 * 앱 전체를 못 뜨게 만들었다.
 *
 * `vite.config.ts` 의 `target: safari14` 는 **문법 변환(트랜스파일)**을 다루지만
 * 정규식 문법은 바꾸지 않는다. 그래서 사람이 다시 쓰는 것을 막을 장치가 필요하다.
 * 이 테스트가 그 장치다. 실패하면 되돌리지 말고 다른 방식으로 같은 일을 하라
 * (예: `use-docent-player.ts` 의 문장 분리는 lookbehind 없이 쓰였다).
 */

const SRC = join(process.cwd(), 'src');
/** iOS 16.3 이하에서 죽는 정규식 문법. lookahead `(?=`, `(?!` 는 안전하다. */
const FORBIDDEN = ['(?<=', '(?<!'];

function collectSourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...collectSourceFiles(full));
      continue;
    }
    // 테스트 파일은 브라우저로 나가지 않는다 — 이 가드 파일 자신도 그래서 제외된다
    if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) found.push(full);
  }
  return found;
}

/**
 * 주석을 지운 소스를 돌려준다.
 *
 * 이 파일과 `use-docent-player.ts` 는 **주석 안에서** 금지 문법을 설명하고 있고,
 * 그 설명이 경고를 띄우면 안 된다. 실제로 실행되는 코드만 본다.
 */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('브라우저 호환성 — iOS 16.3 이하', () => {
  it('정규식 lookbehind 를 쓰지 않는다 (앱 전체 흰 화면의 원인)', () => {
    const offenders: string[] = [];

    for (const file of collectSourceFiles(SRC)) {
      const code = stripComments(readFileSync(file, 'utf8'));
      for (const token of FORBIDDEN) {
        if (!code.includes(token)) continue;
        const line = code.slice(0, code.indexOf(token)).split('\n').length;
        offenders.push(`${file.replace(process.cwd() + '/', '')}:${line} — ${token}`);
      }
    }

    expect(offenders, `lookbehind 는 iOS 16.3 이하에서 앱 전체를 죽인다:\n${offenders.join('\n')}`)
      .toEqual([]);
  });
});
