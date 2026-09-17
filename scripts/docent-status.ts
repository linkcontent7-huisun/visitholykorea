/**
 * 도슨트 원고 진행 수 — `npm run docent:status`
 * 한 줄로 찍는다: ko소개글 N · en소개글 N · ko지점 N곳
 */
import pg from 'pg';
import { loadEnvLocal } from './lib/env.ts';

loadEnvLocal();
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await c.connect();
const r = await c.query(
  `select
     count(distinct site_id) filter (where kind='intro' and language='ko') ko_intro,
     count(distinct site_id) filter (where kind='intro' and language='en') en_intro,
     count(distinct site_id) filter (where kind='point' and language='ko') ko_point
   from public.docent_scripts`,
);
await c.end();
const x = r.rows[0];
console.log(`ko소개글 ${x.ko_intro} · en소개글 ${x.en_intro} · ko지점 ${x.ko_point}곳`);
