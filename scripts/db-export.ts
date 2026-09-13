/**
 * DB·사진 백업 내보내기.
 *
 * `npm run db:export` 한 번으로 표·구조·공개 사진을 날짜별 폴더에 남긴다.
 * Supabase 무료 등급에는 자동 백업이 없으므로, 복구에 필요한 원본을 사람이
 * 다시 찾지 않도록 DB 접근을 읽기 전용 트랜잭션으로 묶는다.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import pg from 'pg';
import { loadEnvLocal } from './lib/env.ts';

loadEnvLocal({ supabasePlaceholder: true });

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL 이 없습니다. .env.local 을 확인하세요.');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) {
  console.error('SUPABASE_URL 또는 VITE_SUPABASE_URL 이 없습니다. .env.local 을 확인하세요.');
  process.exit(1);
}

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
  column_default: string | null;
}

interface TableColumn extends Column {
  table_name: string;
}

interface Constraint {
  constraint_name: string;
  constraint_type: string;
  column_name: string | null;
}

interface StorageFile {
  bucket: string;
  name: string;
  size: string | null;
  created_at: string;
}

function todayInSeoul(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv<T extends object>(columns: (keyof T & string)[], rows: T[]): string {
  return [columns.map(csvCell).join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\n') + '\n';
}

function markdownCell(value: string | null): string {
  return value?.replaceAll('|', '\\|').replaceAll('\n', '<br>') ?? '—';
}

function inside(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return path !== '' && !path.startsWith(`..${sep}`) && path !== '..';
}

function photoPath(photosDir: string, name: string): string {
  const target = resolve(photosDir, ...name.split('/'));
  if (!inside(resolve(photosDir), target)) throw new Error(`안전하지 않은 사진 경로입니다: ${name}`);
  return target;
}

function publicObjectUrl(baseUrl: string, bucket: string, name: string): string {
  const base = new URL(baseUrl);
  const encodedName = name.split('/').map(encodeURIComponent).join('/');
  return new URL(`/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedName}`, base).toString();
}

const backupRoot = process.env.BACKUP_DIR || 'C:\\VisitHoly-백업';
const date = todayInSeoul();
const outputDir = join(backupRoot, date);
const tablesDir = join(outputDir, 'tables');
const photosRoot = join(outputDir, 'photos');

mkdirSync(tablesDir, { recursive: true });
mkdirSync(photosRoot, { recursive: true });

const client = new pg.Client({ connectionString });

try {
  await client.connect();
  // 백업 도중에도 실수로 DDL·DML 이 실행되지 않도록 서버에서 읽기 전용으로 강제한다.
  await client.query('begin read only');

  const tables = await client.query<{ table_name: string }>(`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);

  const columns = await client.query<TableColumn>(`
    select table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `);

  const constraints = await client.query<Constraint & { table_name: string }>(`
    select tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name
    from information_schema.table_constraints tc
    left join information_schema.key_column_usage kcu
      on tc.constraint_schema = kcu.constraint_schema
      and tc.constraint_name = kcu.constraint_name
      and tc.table_name = kcu.table_name
    where tc.table_schema = 'public'
    order by tc.table_name, tc.constraint_name, kcu.ordinal_position
  `);

  const schema: string[] = ['# DB 스키마', '', `내보낸 날: ${date}`, ''];
  const tableSummaries: { name: string; rows: number }[] = [];

  for (const { table_name: tableName } of tables.rows) {
    const result = await client.query<Record<string, unknown>>(`select * from ${pg.escapeIdentifier(tableName)}`);
    const tableColumns = columns.rows.filter((column) => column.table_name === tableName);
    const columnNames = tableColumns.map((column) => column.column_name);

    writeFileSync(join(tablesDir, `${tableName}.json`), JSON.stringify(result.rows, null, 2) + '\n', 'utf8');
    writeFileSync(join(tablesDir, `${tableName}.csv`), toCsv(columnNames, result.rows), 'utf8');
    tableSummaries.push({ name: tableName, rows: result.rowCount ?? result.rows.length });

    schema.push(`## ${tableName}`, '', '| 열 | 형 | NULL 허용 | 기본값 |', '| --- | --- | --- | --- |');
    for (const column of tableColumns) {
      schema.push(`| ${markdownCell(column.column_name)} | ${markdownCell(column.data_type)} | ${column.is_nullable === 'YES' ? '예' : '아니오'} | ${markdownCell(column.column_default)} |`);
    }
    const tableConstraints = constraints.rows.filter((constraint) => constraint.table_name === tableName);
    if (tableConstraints.length > 0) {
      schema.push('', '| 제약 이름 | 종류 | 열 |', '| --- | --- | --- |');
      for (const constraint of tableConstraints) {
        schema.push(`| ${markdownCell(constraint.constraint_name)} | ${markdownCell(constraint.constraint_type)} | ${markdownCell(constraint.column_name)} |`);
      }
    }
    schema.push('');
  }

  const storage = await client.query<StorageFile>(`
    select bucket_id as bucket, name, metadata ->> 'size' as size, created_at
    from storage.objects
    order by bucket_id, name
  `);
  writeFileSync(join(outputDir, 'storage-files.csv'), toCsv(['bucket', 'name', 'size', 'created_at'], storage.rows), 'utf8');
  writeFileSync(join(outputDir, 'schema.md'), schema.join('\n'), 'utf8');

  await client.query('commit');

  // 두 버킷 모두 읽기 공개다(마이그레이션 20260901000000·20260906000000) — 전부 받는다.
  let downloadedPhotos = 0;
  const downloadFailures: string[] = [];
  for (const photo of storage.rows) {
    const destination = photoPath(join(photosRoot, photo.bucket), photo.name);
    mkdirSync(resolve(destination, '..'), { recursive: true });
    try {
      const response = await fetch(publicObjectUrl(supabaseUrl, photo.bucket, photo.name));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
      downloadedPhotos += 1;
    } catch (error) {
      downloadFailures.push(`${photo.bucket}/${photo.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 성지 대표 사진은 대부분 위키미디어 등 바깥 주소다(2026-09-13 기준 53곳). 주소가 죽으면
  // 사진도 사라지므로 파일 자체를 받아 둔다: photos/site-images/<성지id>.<확장자>
  const siteImages = await client.query<{ id: string; image_url: string }>(
    `select id, image_url from public.holy_sites where image_url is not null and image_url <> '' order by name`,
  );
  const siteImagesDir = join(photosRoot, 'site-images');
  mkdirSync(siteImagesDir, { recursive: true });
  let downloadedSiteImages = 0;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  for (const row of siteImages.rows) {
    // 저장소 안 사진(/images/sites/…)은 배포 주소로 받는다. 위키미디어는 연속 요청에 429 를 주므로 쉬어 가며 한 번 더 시도
    const url = row.image_url.startsWith('/') ? `https://visitholykorea-app.vercel.app${row.image_url}` : row.image_url;
    const ext = ((url.split('?')[0] ?? url).match(/\.(jpe?g|png|webp|gif)$/i)?.[1] ?? 'jpg').toLowerCase();
    const destination = join(siteImagesDir, `${row.id}.${ext}`);
    try {
      await sleep(400);
      let response = await fetch(url, { headers: { 'User-Agent': 'VisitHolyKorea-backup/1.0 (contact via GitHub linkcontent7-huisun)' } });
      if (response.status === 429) {
        await sleep(3000);
        response = await fetch(url, { headers: { 'User-Agent': 'VisitHolyKorea-backup/1.0 (contact via GitHub linkcontent7-huisun)' } });
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
      downloadedSiteImages += 1;
    } catch (error) {
      downloadFailures.push(`site-image ${row.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const storageBytes = storage.rows.reduce((sum, file) => sum + Number(file.size ?? 0), 0);
  const summary = [
    '# DB·사진 내보내기 요약',
    '',
    `내보낸 날: ${date}`,
    '',
    '## 표',
    '',
    '| 표 | 행 수 |',
    '| --- | ---: |',
    ...tableSummaries.map((table) => `| ${table.name} | ${table.rows.toLocaleString('ko-KR')} |`),
    '',
    `표 합계: ${tableSummaries.length}개 · ${tableSummaries.reduce((sum, table) => sum + table.rows, 0).toLocaleString('ko-KR')}행`,
    '',
    '## Storage',
    '',
    `목록 파일: ${storage.rows.length.toLocaleString('ko-KR')}개 · 총 용량: ${storageBytes.toLocaleString('ko-KR')} bytes`,
    `버킷 파일 내려받음: ${downloadedPhotos.toLocaleString('ko-KR')}개 (site-photos · pilgrim-photos)`,
    `성지 대표 사진(바깥 주소): ${siteImages.rows.length.toLocaleString('ko-KR')}곳 중 ${downloadedSiteImages.toLocaleString('ko-KR')}장 내려받음 → photos/site-images/`,
  ];
  if (downloadFailures.length > 0) {
    summary.push('', '## 사진 내려받기 실패', '', ...downloadFailures.map((failure) => `- ${failure}`));
  }
  writeFileSync(join(outputDir, '요약.md'), summary.join('\n') + '\n', 'utf8');

  console.log(`백업 완료: ${outputDir}`);
  if (downloadFailures.length > 0) process.exitCode = 1;
} catch (error) {
  try {
    await client.query('rollback');
  } catch {
    // 연결 단계에서 실패하면 되돌릴 트랜잭션이 없다.
  }
  console.error('백업 실패:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
