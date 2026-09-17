/** CBCK 수집 JSONL을 기존 주소록에 안전하게 합친다. 실제 실행은 지시자만 한다. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadEnvLocal } from '../lib/env.ts';
import { connectAdminDb } from '../lib/db.ts';

type Row = Record<string, string | number | null> & { cbck_code: string; name: string; diocese: string | null; kind: string; _detail_url?: string };
const DRY_RUN = process.argv.includes('--dry-run');
const DATA = join(ROOT, 'data', 'research', 'cbck-directory.jsonl');
const columns = ['cbck_code', 'district', 'zipcode', 'fax', 'pastor_phone', 'homepage', 'email', 'pastor', 'pastor_en', 'founded_on', 'patron', 'members_count', 'mission_count', 'address_en', 'name_en'] as const;

function rows(): Row[] {
  return readFileSync(DATA, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Row);
}
function filled(value: unknown): boolean { return value !== null && value !== undefined && value !== ''; }

async function main() {
  loadEnvLocal({ supabasePlaceholder: true });
  const db = await connectAdminDb();
  let updated = 0, inserted = 0, matched = 0, holyPlanned = 0;
  try {
    for (const row of rows()) {
      const found = await db.query<Record<string, unknown>>(
        `select * from catholic_directory where cbck_code = $1
         union all
         select * from catholic_directory where cbck_code is null and diocese is not distinct from $2 and replace(name, ' ', '') = replace($3, ' ', '') limit 1`,
        [row.cbck_code, row.diocese, row.name],
      );
      const existing = found.rows[0];
      if (existing) {
        matched++;
        const updates: Record<string, unknown> = { cbck_code: row.cbck_code, cbck_synced_at: new Date().toISOString() };
        for (const key of columns.slice(1)) if (!filled(existing[key]) && filled(row[key])) updates[key] = row[key];
        if (!filled(existing.phone) && filled(row.phone)) updates.phone = row.phone;
        if (!filled(existing.address) && filled(row.address)) updates.address = row.address;
        if (!filled(existing.category)) updates.category = row.kind;
        if (!DRY_RUN) {
          const keys = Object.keys(updates);
          await db.query(`update catholic_directory set ${keys.map((key, i) => `${key} = $${i + 1}`).join(', ')} where id = $${keys.length + 1}`,
            [...keys.map((key) => updates[key]), existing.id]);
        }
        updated++;
      } else {
        if (!DRY_RUN) {
          const record = { name: row.name, category: row.kind, diocese: row.diocese, address: row.address, phone: row.phone, cbck_synced_at: new Date().toISOString(), ...Object.fromEntries(columns.map((key) => [key, row[key] ?? null])) };
          const keys = Object.keys(record);
          await db.query(`insert into catholic_directory (${keys.join(', ')}) values (${keys.map((_, i) => `$${i + 1}`).join(', ')})`, keys.map((key) => record[key as keyof typeof record]));
        }
        inserted++;
      }
      if (row.kind === '성지사적지') {
        const sites = await db.query<{ id: string; phone: string | null; homepage_url: string | null; fax: string | null }>(
          `select id, phone, homepage_url, fax from holy_sites where name_compact = replace($1, ' ', '') or name_compact like '%' || replace($1, ' ', '') || '%' or replace($1, ' ', '') like '%' || name_compact || '%'`, [row.name]);
        for (const site of sites.rows) {
          const changes: Record<string, unknown> = {};
          if (!filled(site.phone) && filled(row.phone)) changes.phone = row.phone;
          if (!filled(site.homepage_url) && filled(row.homepage)) changes.homepage_url = row.homepage;
          if (!filled(site.fax) && filled(row.fax)) changes.fax = row.fax;
          if (Object.keys(changes).length) {
            holyPlanned++;
            if (!DRY_RUN) {
              const keys = Object.keys(changes);
              await db.query(`update holy_sites set ${keys.map((key, i) => `${key} = $${i + 1}`).join(', ')} where id = $${keys.length + 1}`, [...keys.map((key) => changes[key]), site.id]);
              await db.query(`insert into site_sources (site_id, kind, title, url, note) values ($1, 'web', '한국 천주교 주소록 (directory.cbck.or.kr)', $2, '전화·홈페이지·팩스') on conflict (site_id, kind, title) do nothing`, [site.id, row._detail_url ?? null]);
            }
          }
        }
      }
    }
    console.log(`${DRY_RUN ? '예정' : '완료'}: 기존 갱신 ${updated}, 기존 매칭 ${matched}, 신규 ${inserted}, holy_sites 보강 ${holyPlanned}`);
  } finally { await db.end(); }
}
main();
