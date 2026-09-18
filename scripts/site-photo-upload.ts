/**
 * 성지 대표사진 올리기 — 로컬 파일을 웹용으로 줄여 Storage(site-photos/<siteId>.jpg)에 올리고
 * holy_sites.image_url·image_source·image_license 를 갱신한다. 관리자 콘솔 uploadSitePhoto 와 같은 규칙.
 * 사용: npx tsx scripts/site-photo-upload.ts <목록.json>
 *   목록: [{ "siteId": "...", "file": "C:/.../사진.jpg", "source": "대전교구 홍보국 제공", "license": "..." }]
 * 미리 sharp 가 있어야 한다(없으면 원본 그대로 올린다).
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env.ts';

loadEnvLocal();
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('.env.local 에 VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요하다');
const sb = createClient(url, key, { auth: { persistSession: false } });

type Item = { siteId: string; file: string; source: string; license: string };
const items: Item[] = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));

async function toWeb(file: string): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    // 가로 1600px, 품질 82 — 카드·히어로 모두 충분하고 300KB 안팎
    return await sharp(file).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  } catch {
    return readFileSync(file);
  }
}

for (const it of items) {
  const buf = await toWeb(it.file);
  const path = `${it.siteId}.jpg`;
  const { error: upErr } = await sb.storage.from('site-photos').upload(path, buf, { upsert: true, contentType: 'image/jpeg' });
  if (upErr) { console.error('✗ 업로드 실패', it.siteId, upErr.message); continue; }
  const pub = sb.storage.from('site-photos').getPublicUrl(path).data.publicUrl + `?v=${Date.now()}`;
  const { error } = await sb.from('holy_sites').update({ image_url: pub, image_source: it.source, image_license: it.license }).eq('id', it.siteId);
  if (error) { console.error('✗ DB 갱신 실패', it.siteId, error.message); continue; }
  await sb.from('site_sources').upsert(
    { site_id: it.siteId, kind: 'field', title: `대표사진: ${it.source}`, url: null, collected_at: new Date().toISOString().slice(0, 10), collected_by: 'Claude', note: `원본 ${(it as Item & { orig?: string }).orig ?? it.file}` },
    { onConflict: 'site_id,kind,title', ignoreDuplicates: true },
  );
  console.log('✓', it.siteId, `${(buf.length / 1024).toFixed(0)}KB`, pub.split('?')[0]);
}
