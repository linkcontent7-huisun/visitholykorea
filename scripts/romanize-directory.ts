/**
 * catholic_directory(전국 본당·공소 5,918건)의 name_romanized·address_romanized 를 채운다.
 *
 * 사람이 번역하는 대신 국립국어원 로마자 표기법을 기계적으로 적용한다
 * (src/shared/lib/korean-romanize.ts). 이미 값이 있는 행은 다시 계산하지 않는다 —
 * 나중에 사람이 특정 행을 손으로 고쳐도 이 스크립트가 덮어쓰지 않는다.
 *
 *   npm run directory:romanize          — 값이 비어 있는 행만 채운다
 *   npm run directory:romanize -- --force  — 전부 다시 계산한다(변환기 로직을 고쳤을 때)
 */
import { loadEnvLocal } from './lib/env.ts';
import { connectAdminDb } from './lib/db.ts';
import { romanizeKorean } from '../src/shared/lib/korean-romanize.ts';

loadEnvLocal({ supabasePlaceholder: true });

const FORCE = process.argv.includes('--force');
const BATCH_SIZE = 500;

async function main() {
  const client = await connectAdminDb();

  try {
    const { rows } = await client.query<{ id: string; name: string; address: string | null }>(
      FORCE
        ? `select id, name, address from catholic_directory`
        : `select id, name, address from catholic_directory where name_romanized is null`,
    );

    if (rows.length === 0) {
      console.log('채울 행이 없습니다(이미 전부 채워짐). --force 로 다시 계산할 수 있습니다.');
      return;
    }

    console.log(`${rows.length}건을 변환합니다...`);

    let done = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const ids = batch.map((r) => r.id);
      const nameR = batch.map((r) => romanizeKorean(r.name));
      const addrR = batch.map((r) => (r.address ? romanizeKorean(r.address) : null));

      await client.query(
        `update catholic_directory as cd
         set name_romanized = v.name_r,
             address_romanized = v.addr_r
         from (
           select unnest($1::uuid[]) as id,
                  unnest($2::text[]) as name_r,
                  unnest($3::text[]) as addr_r
         ) as v
         where cd.id = v.id`,
        [ids, nameR, addrR],
      );

      done += batch.length;
      console.log(`  ${done}/${rows.length}`);
    }

    console.log('완료.');
  } finally {
    await client.end();
  }
}

main();
