/**
 * 성지 미사 시간 자동 수집 (2026-10-31 사장님 지시: "교구 홈페이지에서 모아서 db를 채워줘").
 *
 *   npm run mass:collect            — 수집해 보고서만 쓴다(DB 안 바꿈)
 *   npm run mass:collect -- --write — 수집값을 DB 에 「확인 필요」로 넣는다
 *
 * 확인한 사실(10/31): 주교회의 전국 성지 목록(missa.cbck.or.kr/Shrines)과 시복시성위 성지 페이지에는
 * 미사 시간이 없고 주소·전화·홈페이지만 있다. 그래서 **성지마다 자기 홈페이지**를 연다.
 * DB 의 homepage_url 이 없으면 주교회의 목록의 홈페이지를 이름으로 맞춰 쓴다.
 *
 * 홈페이지 첫 화면에서 「미사」가 들어간 링크(미사안내·미사시간 등)를 따라가 시간이 적힌 줄만 모은다.
 * 글 모양이 성지마다 달라 틀릴 수 있으므로 mass_times_confirmed = false 로 넣는다 —
 * 이용자에게는 안 보이고, 관리자 「미사 확인 필요」 목록에 뜬다. 사람이 이미 확인한 값은 덮어쓰지 않는다.
 * 카페·블로그(daum·naver·tistory)는 자바스크립트로 그려져 대부분 못 읽는다 — 보고서에 「못 읽음」으로 남긴다.
 */

import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pg from 'pg';
import { loadEnvLocal } from './lib/env.ts';
import { extractMassLines, findMassLinks, htmlToText } from './lib/mass-times.ts';

loadEnvLocal({ supabasePlaceholder: true });
const WRITE = process.argv.includes('--write');
const ROOT = resolve(import.meta.dirname, '..');

async function get(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: {
        'user-agent': 'Mozilla/5.0 (VisitHolyKorea mass-time check; +https://visitholykorea.com)',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    // 오래된 성지 홈페이지는 EUC-KR 이 많다 — 머리말의 charset 을 보고 다시 읽는다
    const head = new TextDecoder('utf-8').decode(buf.slice(0, 2048));
    const euc =
      /charset=["']?(euc-kr|ks_c_5601)/i.test(head) ||
      /euc-kr/i.test(res.headers.get('content-type') ?? '');
    return new TextDecoder(euc ? 'euc-kr' : 'utf-8').decode(buf);
  } catch {
    return null;
  }
}

/** 주교회의 전국 성지 목록 → 띄어쓰기 뺀 이름 : 홈페이지 */
async function cbckHomepages(): Promise<Map<string, string>> {
  const html = (await get('https://missa.cbck.or.kr/Shrines')) ?? '';
  const map = new Map<string, string>();
  for (const m of html.matchAll(/<h4>([^<]+)<\/h4>[\s\S]*?<\/div>/g)) {
    const link = /href="(https?:\/\/[^"]+)"/.exec(m[0]);
    if (m[1] && link?.[1]) map.set(m[1].replace(/\s+/g, ''), link[1]);
  }
  return map;
}

interface Row {
  id: string;
  name: string;
  homepage_url: string | null;
  mass_times_confirmed: boolean;
}

interface Result {
  id: string;
  name: string;
  homepage: string | null;
  status: 'found' | 'no-homepage' | 'unreadable' | 'no-mass-text' | 'confirmed-skip';
  source?: string;
  massTimes?: string;
}

async function collect(row: Row, cbck: Map<string, string>): Promise<Result> {
  const compact = row.name.replace(/\s+/g, '');
  const homepage =
    row.homepage_url ??
    cbck.get(compact) ??
    [...cbck.entries()].find(([k]) => k.includes(compact) || compact.includes(k))?.[1] ??
    null;
  const base = { id: row.id, name: row.name, homepage };
  if (row.mass_times_confirmed) return { ...base, status: 'confirmed-skip' };
  if (!homepage) return { ...base, status: 'no-homepage' };

  const home = await get(homepage);
  if (!home) return { ...base, status: 'unreadable' };

  // 첫 화면에 바로 적힌 경우도 있으니 홈 자체도 후보에 넣는다
  const candidates = [homepage, ...findMassLinks(home, homepage).slice(0, 3)];
  for (const url of candidates) {
    const html = url === homepage ? home : await get(url);
    if (!html) continue;
    const lines = extractMassLines(htmlToText(html));
    if (lines.length > 0)
      return { ...base, status: 'found', source: url, massTimes: lines.join('\n') };
  }
  return { ...base, status: 'no-mass-text' };
}

async function main() {
  const db = new pg.Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await db.connect();
  const { rows } = await db.query<Row>(
    'select id, name, homepage_url, mass_times_confirmed from holy_sites order by name',
  );
  const cbck = await cbckHomepages();
  console.log(`성지 ${rows.length}곳, 주교회의 목록 홈페이지 ${cbck.size}개`);

  const results: Result[] = [];
  // 한 번에 6곳씩 — 성지 홈페이지들은 작은 서버라 한꺼번에 몰리지 않게
  for (let i = 0; i < rows.length; i += 6) {
    const batch = await Promise.all(rows.slice(i, i + 6).map((r) => collect(r, cbck)));
    results.push(...batch);
    process.stdout.write(`\r${results.length}/${rows.length}`);
  }
  console.log();

  const today = new Date().toISOString().slice(0, 10);
  if (WRITE) {
    for (const r of results) {
      if (r.status !== 'found') continue;
      // 사람이 확인한 값(confirmed)은 절대 덮어쓰지 않는다 — where 절로 한 번 더 막는다
      await db.query(
        `update holy_sites set mass_times = $2, mass_times_source = $3, mass_times_checked_on = $4
         where id = $1 and mass_times_confirmed = false`,
        [r.id, r.massTimes, r.source, today],
      );
    }
  }
  await db.end();

  const count = (s: Result['status']) => results.filter((r) => r.status === s).length;
  const out = join(ROOT, 'data', 'research', `mass-times-${today}.json`);
  writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(
    `찾음 ${count('found')} · 홈페이지 없음 ${count('no-homepage')} · 못 읽음 ${count('unreadable')} · 미사 글 없음 ${count('no-mass-text')} · 이미 확인됨 ${count('confirmed-skip')}`,
  );
  console.log(
    `보고서: ${out}${WRITE ? ' — DB 에 「확인 필요」로 넣었습니다' : ' (DB 는 안 바꿈. 넣으려면 --write)'}`,
  );
}

void main();
