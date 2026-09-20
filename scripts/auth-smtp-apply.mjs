/**
 * Supabase 인증 메일의 **발송 서버(SMTP)** 를 설정한다.
 *
 * 왜 필요한가: Supabase 기본 메일 서비스는 **조직 팀원 주소로만** 보내고 시간당 2통이 한도다
 * (2026-09-20 실측 — 팀원이 아닌 suongbin45@gmail.com 가입 때 `mail.send` 로그는 남았지만
 * 편지는 도착하지 않았다). 일반 이용자·심사위원이 가입하려면 우리 SMTP 가 있어야 한다.
 *
 * 쓰기:  node scripts/auth-smtp-apply.mjs           # .env.local 의 SMTP_* 로 설정
 *        node scripts/auth-smtp-apply.mjs --check   # 지금 설정만 본다
 *        node scripts/auth-smtp-apply.mjs --off     # SMTP 를 끄고 기본 서비스로 되돌린다
 *
 * .env.local 에 넣을 값 (비밀번호는 저장소에 올리지 않는다):
 *   SMTP_HOST=smtp.resend.com        (또는 smtp.gmail.com / smtp-relay.brevo.com)
 *   SMTP_PORT=587
 *   SMTP_USER=resend                 (Gmail 은 보내는 주소, Brevo 는 로그인 아이디)
 *   SMTP_PASS=***                    (Resend API 키 / Gmail 앱 비밀번호)
 *   SMTP_SENDER_EMAIL=noreply@visitholykorea.com
 *   SMTP_SENDER_NAME=VisitHolyKorea
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');
const TURN_OFF = process.argv.includes('--off');

for (const line of existsSync(join(ROOT, '.env.local'))
  ? readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)
  : []) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF ?? 'kaahuoqzkgshihypzzyh';
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN 이 없다 (.env.local).');
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${REF}/config/auth`;
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const now = await (await fetch(url, { headers })).json();
const show = (c) => {
  console.log(`  발송 서버   ${c.smtp_host ?? '(없음 — Supabase 기본, 팀원에게만 감)'}`);
  console.log(
    `  보내는 주소 ${c.smtp_admin_email ?? '(없음)'} / 이름 ${c.smtp_sender_name ?? '(없음)'}`,
  );
  console.log(`  시간당 한도 ${c.rate_limit_email_sent}통`);
  console.log(`  가입 즉시 승인(메일 확인 생략) ${c.mailer_autoconfirm ? '켬' : '끔'}`);
};
console.log('지금 설정:');
show(now);

if (CHECK_ONLY) process.exit(0);

if (TURN_OFF) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      smtp_host: null,
      smtp_port: null,
      smtp_user: null,
      smtp_pass: null,
      smtp_admin_email: null,
      smtp_sender_name: null,
    }),
  });
  console.log(res.ok ? '\nSMTP 를 껐다 (기본 서비스로 되돌림).' : `\n실패: HTTP ${res.status}`);
  process.exit(res.ok ? 0 : 1);
}

const need = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SENDER_EMAIL'];
const missing = need.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `\n.env.local 에 없는 값: ${missing.join(', ')}\n위 주석의 보기를 참고해 넣고 다시 실행한다.`,
  );
  process.exit(1);
}

const body = {
  smtp_host: process.env.SMTP_HOST,
  // Management API 는 포트를 **문자열**로 받는다 (숫자로 보내면 400 — 2026-09-20 실측)
  smtp_port: String(process.env.SMTP_PORT),
  smtp_user: process.env.SMTP_USER,
  smtp_pass: process.env.SMTP_PASS,
  smtp_admin_email: process.env.SMTP_SENDER_EMAIL,
  smtp_sender_name: process.env.SMTP_SENDER_NAME ?? 'VisitHolyKorea',
  // 기본 서비스의 2통/시간으로는 심사·단체 가입을 감당하지 못한다. 우리 SMTP 는 한도를 우리가 정한다.
  rate_limit_email_sent: Number(process.env.SMTP_RATE_LIMIT ?? 100),
};

const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
if (!res.ok) {
  console.error(`\n설정하지 못했다: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
console.log('\n바꾼 뒤:');
show(await res.json());
console.log('\n이제 가입 화면에서 실제로 한 번 가입해 편지가 오는지 확인할 것.');
