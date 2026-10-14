// 매일 회원·순례 기록 점검용 자료를 모은다 (2026-10-14 사장님 지시).
// 회원 이메일 등 개인정보가 들어가므로 **저장소 밖**(바탕화면 폴더)에만 쓴다 — 저장소는 공개(PUBLIC)다.
// 실행: node scripts/qa/members-records.mjs <출력폴더> [몇 시간 전부터, 기본 26]
// 결과: <출력폴더>/data.json, <출력폴더>/photos/<기록id>-<n>.jpg
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const env = Object.fromEntries(
  readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^(VITE_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=/.test(l))
    .map((l) => [
      l.slice(0, l.indexOf('=')),
      l
        .slice(l.indexOf('=') + 1)
        .trim()
        .replace(/^"|"$/g, ''),
    ]),
);
const [out, hoursArg] = process.argv.slice(2);
if (!out) throw new Error('출력 폴더를 주세요');
const since = new Date(Date.now() - Number(hoursArg ?? 26) * 3600e3).toISOString();
const base = env.VITE_SUPABASE_URL;
const headers = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
};
const get = async (path) => {
  const r = await fetch(base + path, { headers });
  if (!r.ok) throw new Error(`${path} ${r.status} ${await r.text()}`);
  return r.json();
};

// 회원 전체 (가입 확인·마지막 로그인 포함)
const users = [];
for (let page = 1; ; page++) {
  const { users: batch } = await get(`/auth/v1/admin/users?per_page=200&page=${page}`);
  users.push(...batch);
  if (batch.length < 200) break;
}
const profiles = await get('/rest/v1/profiles?select=id,name,provider,country_code,role');
const prof = new Map(profiles.map((p) => [p.id, p]));
const members = users
  .map((u) => ({
    email: u.email,
    name: prof.get(u.id)?.name ?? null,
    provider: u.app_metadata?.provider ?? prof.get(u.id)?.provider ?? null,
    country: prof.get(u.id)?.country_code ?? null,
    role: prof.get(u.id)?.role ?? null,
    joinedAt: u.created_at,
    confirmed: Boolean(u.email_confirmed_at || u.confirmed_at),
    lastSignInAt: u.last_sign_in_at ?? null,
    newSince: u.created_at >= since,
    signedInSince: Boolean(u.last_sign_in_at && u.last_sign_in_at >= since),
    _id: u.id,
  }))
  .sort((a, b) => (b.lastSignInAt ?? '').localeCompare(a.lastSignInAt ?? ''));
const emailOf = new Map(members.map((m) => [m._id, m.email]));

// 계정 분류(관리자·사장님·팀원·제외)는 이메일이 들어가므로 저장소 밖 <출력폴더>/../계정-분류.json 에 둔다.
// 여기 없는 계정은 '일반'. 제외 계정도 목록에서 지우지 않고 kind 로만 표시한다(숨기는 것 없이).
let kinds = {};
try {
  kinds = JSON.parse(readFileSync(join(out, '..', '계정-분류.json'), 'utf8'));
} catch {
  // 분류표가 없으면 모두 '일반'
}
const kindOf = new Map();
for (const [kind, emails] of Object.entries(kinds)) {
  if (Array.isArray(emails)) for (const e of emails) kindOf.set(e.toLowerCase(), kind);
}
for (const m of members) m.kind = kindOf.get((m.email ?? '').toLowerCase()) ?? '일반';
const isGeneral = (m) => m.kind === '일반';
// 회원 수는 '제외'(사장님 다른 계정·시험·중복 가입)만 빼고 센다 (사장님 10/14)
const isCounted = (m) => m.kind !== '제외';

// 기간 안에 올라온 순례 기록(글·사진)
const sites = new Map((await get('/rest/v1/holy_sites?select=id,name')).map((s) => [s.id, s.name]));
const stamps = await get(
  `/rest/v1/pilgrimage_stamps?select=id,user_id,site_id,created_at,note,photo_url,hidden,photo_featured&created_at=gte.${since}&order=created_at.desc`,
);
const photos = stamps.length
  ? await get(
      `/rest/v1/stamp_photos?select=stamp_id,url,position&stamp_id=in.(${stamps.map((s) => s.id).join(',')})&order=position`,
    )
  : [];
mkdirSync(join(out, 'photos'), { recursive: true });
const records = [];
for (const s of stamps) {
  const urls = [
    ...new Set(
      [s.photo_url, ...photos.filter((p) => p.stamp_id === s.id).map((p) => p.url)].filter(Boolean),
    ),
  ];
  const files = [];
  for (const [i, url] of urls.entries()) {
    const r = await fetch(url);
    if (!r.ok) {
      files.push({ url, error: r.status });
      continue;
    }
    const f = join(out, 'photos', `${s.id.slice(0, 8)}-${i + 1}.jpg`);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    files.push({ url, file: f });
  }
  records.push({
    id: s.id,
    at: s.created_at,
    site: sites.get(s.site_id) ?? s.site_id,
    author: emailOf.get(s.user_id) ?? s.user_id,
    authorKind: members.find((m) => m._id === s.user_id)?.kind ?? '알 수 없음',
    note: s.note,
    hidden: s.hidden,
    featured: s.photo_featured,
    photos: files,
  });
}
const reports = await get(`/rest/v1/visit_note_reports?select=*&created_at=gte.${since}`).catch(
  () => [],
);

const data = {
  since,
  totals: {
    members: members.length,
    countedMembers: members.filter(isCounted).length,
    generalMembers: members.filter(isGeneral).length,
    newMembers: members.filter((m) => m.newSince).length,
    newGeneralMembers: members.filter((m) => m.newSince && isGeneral(m)).length,
    signedIn: members.filter((m) => m.signedInSince).length,
    signedInGeneral: members.filter((m) => m.signedInSince && isGeneral(m)).length,
    unconfirmed: members.filter((m) => !m.confirmed).length,
    records: records.length,
    photos: records.reduce((n, r) => n + r.photos.length, 0),
    reports: reports.length,
  },
  members: members.map((m) => {
    const copy = { ...m };
    delete copy._id;
    return copy;
  }),
  records,
  reports,
};
writeFileSync(join(out, 'data.json'), JSON.stringify(data, null, 1));
console.log(JSON.stringify(data.totals));
