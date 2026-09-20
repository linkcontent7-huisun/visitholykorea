/**
 * Supabase 인증 메일 서식을 `supabase/auth-emails/*.html` 로 맞춘다.
 *
 * 왜 스크립트인가: 대시보드에서 손으로 붙여 넣으면 저장소와 어긋나고, 누가 언제 무엇을
 * 바꿨는지 남지 않는다. 서식은 저장소가 기준이고 이 스크립트가 그것을 올린다.
 *
 * 쓰기:  node scripts/auth-email-apply.mjs            # 올린다
 *        node scripts/auth-email-apply.mjs --check    # 올리지 않고 지금 설정과 비교만
 *
 * 필요한 값(.env.local): SUPABASE_ACCESS_TOKEN(개인 액세스 토큰), SUPABASE_PROJECT_REF
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');

// .env.local 을 읽는다 (의존성 없이 — 이 스크립트는 tsx 없이 node 로도 돌아야 한다)
for (const line of existsSync(join(ROOT, '.env.local'))
  ? readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)
  : []) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF ?? 'kaahuoqzkgshihypzzyh';
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN 이 없다 (.env.local). 대시보드 → Account → Access Tokens.');
  process.exit(1);
}

/**
 * 제목은 **두 언어를 나란히** 쓴다.
 * 본문과 달리 제목이 Go 템플릿을 거치는지 문서에 명시돼 있지 않아(2026-09-20 확인 못 함),
 * 조건문을 넣었다가 `{{ if ... }}` 가 글자 그대로 나가는 사고를 피한다.
 * 제목 갈라쓰기가 실제로 되는지 확인되면 그때 본문과 같은 방식으로 바꾼다.
 */
const CONFIG = {
  mailer_subjects_confirmation: 'VisitHolyKorea 가입 확인 / Confirm your sign-up',
  mailer_subjects_recovery: 'VisitHolyKorea 비밀번호 재설정 / Reset your password',
  mailer_subjects_magic_link: 'VisitHolyKorea 로그인 링크 / Your sign-in link',
  mailer_templates_confirmation_content: readFileSync(
    join(ROOT, 'supabase/auth-emails/confirmation.html'),
    'utf8',
  ),
  mailer_templates_recovery_content: readFileSync(
    join(ROOT, 'supabase/auth-emails/recovery.html'),
    'utf8',
  ),
};

const url = `https://api.supabase.com/v1/projects/${REF}/config/auth`;
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const before = await fetch(url, { headers });
if (!before.ok) {
  console.error(`설정을 읽지 못했다: HTTP ${before.status} ${(await before.text()).slice(0, 200)}`);
  process.exit(1);
}
const now = await before.json();

let differs = 0;
for (const [key, want] of Object.entries(CONFIG)) {
  const same = (now[key] ?? '') === want;
  if (!same) differs += 1;
  console.log(
    `${same ? '같음' : '다름'}  ${key}${same ? '' : ` (지금 ${String(now[key] ?? '').length}자 → 올릴 것 ${want.length}자)`}`,
  );
}
if (CHECK_ONLY) {
  console.log(
    differs === 0
      ? '\n저장소와 서버가 같다.'
      : `\n다른 항목 ${differs}개 — 올리려면 --check 없이 실행한다.`,
  );
  process.exit(differs === 0 ? 0 : 2);
}
if (differs === 0) {
  console.log('\n바뀐 것이 없다.');
  process.exit(0);
}

const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(CONFIG) });
if (!res.ok) {
  console.error(`올리지 못했다: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const after = await res.json();
const ok = Object.entries(CONFIG).every(([k, v]) => (after[k] ?? '') === v);
console.log(ok ? '\n올렸다 — 서버 값이 저장소와 같다.' : '\n올렸으나 서버 값이 다르다. 확인할 것.');
process.exit(ok ? 0 : 1);
