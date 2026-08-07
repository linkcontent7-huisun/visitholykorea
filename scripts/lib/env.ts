/**
 * 스크립트 공용 — `.env.local` 을 `process.env` 로 올린다.
 *
 * 브라우저에서는 Vite 가 환경변수를 주입하지만 Node 스크립트에는 그런 게 없다.
 * `shared/config/env.ts` 가 `process.env` 도 보도록 돼 있어서, 여기서 먼저
 * 값을 올려 두면 API 계층을 스크립트에서 그대로 재사용할 수 있다.
 *
 * **반드시 다른 import 보다 먼저 실행되어야 한다.** `shared/config/env.ts` 는
 * 모듈을 읽는 시점에 필수값을 검사하므로, 늦게 부르면 이미 예외가 난 뒤다.
 * 그래서 이 함수를 쓰는 스크립트들은 supabase 모듈을 동적 import 한다.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 저장소 루트 (이 파일이 scripts/lib/ 안에 있으므로 두 단계 위) */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export interface LoadEnvOptions {
  /**
   * Supabase 를 쓰지 않는 스크립트용. `shared/config/env.ts` 가 URL·anon 키를
   * 필수로 요구하기 때문에, 값이 없으면 관계없는 스크립트까지 못 돌아간다.
   */
  supabasePlaceholder?: boolean;
}

export function loadEnvLocal(options: LoadEnvOptions = {}): void {
  let raw: string;
  try {
    raw = readFileSync(join(ROOT, '.env.local'), 'utf-8');
  } catch {
    console.error('.env.local 이 없습니다. .env.example 을 복사해 값을 채우세요.');
    process.exit(1);
  }

  for (const line of raw.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!key || rawValue === undefined) continue;
    process.env[key] ??= rawValue.trim().replace(/^["']|["']$/g, '');
  }

  if (options.supabasePlaceholder) {
    process.env.VITE_SUPABASE_URL ??= 'https://placeholder.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY ??= 'placeholder';
  }
}
