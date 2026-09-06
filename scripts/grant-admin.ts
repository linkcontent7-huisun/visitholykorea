/**
 * 관리자 권한 주기 — 첫 관리자를 만드는 유일한 길.
 *
 *   npm run admin:list                              — 지금 권한을 가진 사람
 *   npm run admin:grant -- <이메일>                  — 운영자(admin)로
 *   npm run admin:grant -- <이메일> editor 대전      — 대전교구만 맡는 편집자로
 *   npm run admin:revoke -- <이메일>                 — 권한 회수
 *
 * **왜 화면이 아니라 스크립트인가** — 권한을 주는 화면을 앱에 두면, 그 화면이
 * 뚫리는 순간 아무나 관리자가 된다. 권한 부여만은 노트북에서(=DB 비밀번호를
 * 가진 사람만) 하도록 남겨 둔다. 사진 교체·글 수정 같은 일상 작업은 앱에서 한다.
 *
 * 이메일 대신 이름을 쓰지 않는 이유: 동명이인이 있으면 엉뚱한 사람에게 권한이 간다.
 */

import { loadEnvLocal } from './lib/env.ts';

loadEnvLocal({ supabasePlaceholder: true });

const { connectAdminDb } = await import('./lib/db.ts');

const ROLES = ['member', 'editor', 'admin'] as const;
type Role = (typeof ROLES)[number];

const [command, email, roleArg, dioceseArg] = process.argv.slice(2);

function usage(): never {
  console.error(
    '\n사용법\n' +
      '  npm run admin:list\n' +
      '  npm run admin:grant -- <이메일> [admin|editor] [교구]\n' +
      '  npm run admin:revoke -- <이메일>\n',
  );
  process.exit(1);
}

const client = await connectAdminDb();

try {
  if (command === 'list') {
    const { rows } = await client.query(
      `select email, name, role, diocese
         from public.profiles
        where role <> 'member'
        order by role, email`,
    );
    if (rows.length === 0) {
      console.log('\n권한을 가진 사람이 아직 없습니다. admin:grant 로 첫 관리자를 만드세요.\n');
    } else {
      console.log(`\n권한 보유자 ${rows.length}명\n`);
      for (const r of rows) {
        const scope = r.role === 'editor' ? ` (${r.diocese ?? '전 교구'})` : '';
        console.log(`  ${r.role}${scope}  ${r.email}  ${r.name ?? ''}`);
      }
      console.log('');
    }
  } else if (command === 'grant' || command === 'revoke') {
    if (!email) usage();

    const role: Role = command === 'revoke' ? 'member' : ((roleArg as Role) ?? 'admin');
    if (!ROLES.includes(role)) {
      console.error(`\n권한 이름이 잘못됐습니다: ${role}. ${ROLES.join(' / ')} 중 하나여야 합니다.\n`);
      process.exit(1);
    }
    // 교구는 editor 에게만 의미가 있다. admin 은 전 교구라서 비워 둔다.
    const diocese = role === 'editor' ? (dioceseArg ?? null) : null;

    const { rows } = await client.query(
      `update public.profiles
          set role = $2, diocese = $3
        where lower(email) = lower($1)
        returning email, name, role, diocese`,
      [email, role, diocese],
    );

    if (rows.length === 0) {
      console.error(
        `\n${email} 로 가입한 계정이 없습니다.\n` +
          '  앱에서 먼저 회원가입(또는 소셜 로그인)을 한 뒤에 다시 실행하세요.\n' +
          '  가입해야 profiles 에 줄이 생깁니다.\n',
      );
      process.exit(1);
    }

    const r = rows[0];
    const scope = r.role === 'editor' ? ` (${r.diocese ?? '전 교구'})` : '';
    console.log(`\n${r.email} → ${r.role}${scope}\n`);
  } else {
    usage();
  }
} finally {
  await client.end();
}
