/**
 * 순례 스탬프(디지털 순례 여권) 데이터 계층.
 *
 * 로그인한 사용자가 성지를 "다녀왔다"고 기록하면 스탬프가 쌓이고,
 * 개수에 따라 인증서 등급이 올라간다. RLS 로 본인 데이터만 접근할 수 있다.
 */

import { fetchSiteDioceseIndex } from '@/features/sites/api/holy-sites.repository';
import { supabase } from '@/shared/api/supabase';

const TABLE = 'pilgrimage_stamps';

export interface StampedSite {
  stampId: string;
  siteId: string;
  siteName: string;
  diocese: string | null;
  /** 성지 분류 — 스탬프 모티프(건축 도장) 폴백에 쓴다. */
  category: string | null;
  /** 기록한 시각(created_at). 실제 방문일이 아닐 수 있다. */
  visitedAt: string;
  /**
   * 사용자가 고른 방문일(YYYY-MM-DD). 마이그레이션 20260914130000 의 `visited_on` 열.
   * 열이 아직 없는 DB 에서는 항상 null 이고, 화면은 "기록한 날"만 보여준다.
   */
  visitedOn: string | null;
  /** 내가 남긴 방문 한 줄. 없으면 null. */
  note: string | null;
  photos: StampPhoto[];
}

/**
 * `visited_on` 열이 운영 DB 에 있는지. 처음 조회에서 42703(열 없음)이 오면 false 로 기억해
 * 이후 조회·수정은 열 없이 보낸다 — 마이그레이션 적용 전에도 화면이 깨지지 않는다.
 */
let visitedOnAvailable = true;
export function isVisitedOnAvailable(): boolean {
  return visitedOnAvailable;
}

export interface CertificateLevel {
  label: string;
  minStamps: number;
  emoji: string;
}

export const CERTIFICATE_LEVELS: CertificateLevel[] = [
  { label: '첫 순례자', minStamps: 1, emoji: '🕯️' },
  { label: '순례 도보자', minStamps: 5, emoji: '🥾' },
  { label: '순례 순례자', minStamps: 10, emoji: '⛪' },
  { label: '순례 구도자', minStamps: 20, emoji: '🌾' },
  { label: '순례 완주자', minStamps: 50, emoji: '🏆' },
];

/** 스탬프 개수로 도달한 최고 등급. 하나도 없으면 null. */
export function getCertificateLevel(stampCount: number): CertificateLevel | null {
  let achieved: CertificateLevel | null = null;
  for (const level of CERTIFICATE_LEVELS) {
    if (stampCount >= level.minStamps) achieved = level;
  }
  return achieved;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export type TransportMode = 'walk' | 'public_transit' | 'car' | 'tour_bus' | 'other';

/**
 * 성지에 스탬프를 찍는다. 이미 찍은 곳이면 성공으로 취급하되,
 * 한 줄이 딸려 왔다면 그 한 줄만 갱신한다 — 나중에 생각나서 남기는 경우다.
 *
 * transportMode: "오늘 여기 어떻게 오셨어요?" — 국가 통계에 없는, 성지별
 * 이동수단 데이터를 여기서 직접 쌓는다. 안 물어봐도(null) 스탬프는 찍힌다.
 * visitedOn: 성지 상세에서 처음 기록을 남길 때도 날짜를 고를 수 있어야 한다(2026-09-20
 * 사장님 지적) — 기본값(오늘)은 화면이 채워서 넘긴다. 열이 없는 DB 에서는 조용히 무시된다.
 */
export async function addStamp(
  siteId: string,
  note: string | null = null,
  transportMode: TransportMode | null = null,
  visitedOn: string | null = null,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'UNAUTHENTICATED' };
  }

  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    site_id: siteId,
    note,
    transport_mode: transportMode,
    ...(visitedOnAvailable ? { visited_on: visitedOn } : {}),
  });

  if (error) {
    // 23505 = unique 제약 위반(중복 스탬프). 이미 찍은 곳이다.
    if (error.code === '23505') {
      if (note === null) return { success: true };
      const { error: updateError } = await supabase
        .from(TABLE)
        .update({ note })
        .eq('user_id', userId)
        .eq('site_id', siteId);
      if (updateError) {
        console.error('addStamp note update error:', updateError);
        return { success: false, error: updateError.message };
      }
      return { success: true };
    }
    console.error('addStamp error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export interface MyStamp {
  stamped: boolean;
  /** 이 기록의 id — 「기록 모두 보기」에 뜨는 항목 중 내 것을 찾을 때 쓴다. 안 찍었으면 null. */
  id: string | null;
  /** 내가 남긴 한 줄. 안 찍었거나 안 남겼으면 null. */
  note: string | null;
  /** 사용자가 고른 방문일. 마이그레이션 전 DB 에서는 항상 null. */
  visitedOn: string | null;
  /** 기록한 시각(created_at) — visitedOn 이 없을 때 기본값으로 쓴다. */
  visitedAt: string | null;
  /** 내가 올린 순례 사진. */
  photoUrl: string | null;
  photos: StampPhoto[];
}

export interface StampPhoto {
  id: string;
  url: string;
  position: number;
}

export async function getMyStamp(siteId: string): Promise<MyStamp> {
  const userId = await getCurrentUserId();
  if (!userId)
    return {
      stamped: false,
      id: null,
      note: null,
      visitedOn: null,
      visitedAt: null,
      photoUrl: null,
      photos: [],
    };

  const baseColumns = 'id, note, created_at, photo_url, stamp_photos(id, url, position)';
  const select = (withVisitedOn: boolean) =>
    supabase
      .from(TABLE)
      .select(withVisitedOn ? `${baseColumns}, visited_on` : baseColumns)
      .eq('user_id', userId)
      .eq('site_id', siteId)
      .maybeSingle();

  let { data, error } = await select(visitedOnAvailable);
  // 42703 = 열 없음. 마이그레이션 전 DB 라면 열 없이 다시 받는다.
  if (error && visitedOnAvailable && error.code === '42703') {
    visitedOnAvailable = false;
    ({ data, error } = await select(false));
  }

  if (error) {
    console.error('getMyStamp error:', error);
    return {
      stamped: false,
      id: null,
      note: null,
      visitedOn: null,
      visitedAt: null,
      photoUrl: null,
      photos: [],
    };
  }
  const row = data as unknown as {
    id: string;
    note: string | null;
    visited_on?: string | null;
    created_at: string;
    photo_url: string | null;
    stamp_photos: StampPhoto[] | null;
  } | null;
  const photos = (row?.stamp_photos ?? []).sort((a, b) => a.position - b.position);
  return {
    stamped: Boolean(row),
    id: row?.id ?? null,
    note: row?.note ?? null,
    visitedOn: row?.visited_on ?? null,
    visitedAt: row?.created_at ?? null,
    photoUrl: row?.photo_url ?? null,
    photos,
  };
}

export interface SiteVisitNote {
  /** 스탬프 id — 신고에 쓴다. 사람을 특정할 수 없는 uuid 다. */
  id: string;
  note: string | null;
  /** 순례자가 남긴 사진. 없으면 null. */
  photoUrl: string | null;
  photos: string[];
  visitedAt: string;
}

/**
 * 이 성지에 다녀간 사람들의 한 줄 (익명, 최신순).
 *
 * site_visit_notes 뷰를 읽는다 — user_id 가 아예 뷰에 없어서
 * "누가"는 클라이언트까지 오지 않는다.
 */
export async function getSiteNotes(siteId: string, limit?: number): Promise<SiteVisitNote[]> {
  let query = supabase
    .from('site_visit_notes')
    .select('id, note, photo_url, photos, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });
  if (limit !== undefined) query = query.limit(limit);
  const { data, error } = await query;

  if (error) {
    console.error('getSiteNotes error:', error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    note: (row.note as string | null) ?? null,
    photoUrl: (row.photo_url as string | null) ?? null,
    photos: (row.photos as string[] | null) ?? [],
    visitedAt: row.created_at as string,
  }));
}

/**
 * 스탬프에 순례 사진을 붙인다. 파일은 본인 uid 폴더에 넣는다(스토리지 정책).
 * 같은 성지에 다시 올리면 덮어쓴다 — 더 나은 사진으로 바꾸는 경우다.
 */
export async function attachStampPhoto(
  siteId: string,
  photo: Blob,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: '로그인이 필요합니다' };

  const path = `${userId}/${siteId}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('pilgrim-photos')
    .upload(path, photo, { upsert: true, contentType: 'image/jpeg' });
  if (uploadError) {
    console.error('attachStampPhoto upload error:', uploadError);
    return { success: false, error: '사진을 올리지 못했어요. 잠시 후 다시 시도해주세요.' };
  }

  const { data: pub } = supabase.storage.from('pilgrim-photos').getPublicUrl(path);
  // 덮어써도 URL 이 같아 브라우저가 옛 사진을 보여준다 — 버전 파라미터로 깨뜨린다
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from(TABLE)
    .update({ photo_url: url })
    .eq('user_id', userId)
    .eq('site_id', siteId);
  if (error) {
    console.error('attachStampPhoto update error:', error);
    return { success: false, error: '사진 기록에 실패했어요.' };
  }
  return { success: true };
}

/**
 * 여러 장은 각각의 순서를 DB에 남겨, 공개 사진 격자와 내 기록의 순서가 바뀌지 않게 한다.
 * `startPosition` 은 몇 번째 자리부터 쓸지(1부터) — 이미 있는 사진 뒤에 이어 붙일 때
 * 앞자리(예: 1번)를 다시 upsert 하면 기존 사진을 덮어쓴다(2026-09-20 「바꾸기」 버튼을
 * 「추가」로 바꾸며 발견). 기본값 1은 첫 업로드(새 기록)와 그대로 호환된다.
 */
export async function uploadStampPhotos(
  stampId: string,
  siteId: string,
  photos: Blob[],
  startPosition = 1,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: '로그인이 필요합니다.' };
  const uploaded: { path: string; url: string; position: number }[] = [];
  for (let index = 0; index < photos.length; index += 1) {
    const position = startPosition + index;
    const path = `${userId}/${siteId}/${position}.jpg`;
    const { error } = await supabase.storage
      .from('pilgrim-photos')
      .upload(path, photos[index]!, { upsert: true, contentType: 'image/jpeg' });
    if (error)
      return { success: false, error: '사진을 올리지 못했습니다. 잠시 후 다시 시도해주세요.' };
    const { data: pub } = supabase.storage.from('pilgrim-photos').getPublicUrl(path);
    uploaded.push({ path, url: `${pub.publicUrl}?v=${Date.now()}`, position });
  }
  const { error } = await supabase.from('stamp_photos').upsert(
    uploaded.map(({ url, position }) => ({ stamp_id: stampId, url, position })),
    { onConflict: 'stamp_id,position' },
  );
  if (error) return { success: false, error: '사진 기록을 저장하지 못했습니다.' };
  // 예전 화면도 계속 같은 사진을 표시해야 하므로 첫 사진을 대표 칸에 남긴다 — 1번 자리가
  // 이번 업로드에 없으면(이어 붙이는 경우) 이미 저장된 대표 사진을 그대로 둔다.
  if (startPosition !== 1) return { success: true };
  const { error: legacyError } = await supabase
    .from(TABLE)
    .update({ photo_url: uploaded[0]?.url ?? null })
    .eq('id', stampId);
  if (legacyError) return { success: false, error: '사진 기록을 저장하지 못했습니다.' };
  return { success: true };
}

/** 파일과 행을 함께 지워, 내 기록에서 없앤 사진이 공개 화면에 남지 않게 한다. */
export async function deleteStampPhoto(photo: StampPhoto): Promise<{ success: boolean }> {
  const path = new URL(photo.url).pathname.split('/object/public/pilgrim-photos/')[1];
  if (path) {
    const { error: storageError } = await supabase.storage
      .from('pilgrim-photos')
      .remove([decodeURIComponent(path)]);
    // 파일을 못 지웠는데 행만 지우면 공개 URL을 잃어 운영자가 정리할 방법도 사라진다.
    if (storageError) return { success: false };
  }
  const { error } = await supabase.from('stamp_photos').delete().eq('id', photo.id);
  return { success: !error };
}

/** 부적절한 글·사진 신고. 3명이 신고하면 서버가 자동으로 숨긴다. */
export async function reportVisitNote(stampId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.rpc('report_visit_note', { p_stamp_id: stampId });
  if (error) {
    console.error('reportVisitNote error:', error);
    return { success: false };
  }
  return { success: true };
}

interface StampJoinRow {
  id: string;
  created_at: string;
  visited_on?: string | null;
  site_id: string;
  note: string | null;
  stamp_photos: StampPhoto[] | null;
  holy_sites: { name: string; diocese: string | null; category: string | null } | null;
}

/** 로그인한 사용자의 모든 스탬프(성지 정보 포함)를 최신순으로. */
export async function getMyStamps(): Promise<StampedSite[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const baseColumns =
    'id, created_at, site_id, note, stamp_photos(id, url, position), holy_sites(name, diocese, category)';
  const select = (withVisitedOn: boolean) =>
    supabase
      .from(TABLE)
      .select(withVisitedOn ? `${baseColumns}, visited_on` : baseColumns)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

  let { data, error } = await select(visitedOnAvailable);
  // 42703 = 열 없음. 마이그레이션 전 DB 라면 열 없이 다시 받는다.
  if (error && visitedOnAvailable && error.code === '42703') {
    visitedOnAvailable = false;
    ({ data, error } = await select(false));
  }

  if (error) {
    console.error('getMyStamps error:', error);
    return [];
  }

  return (data as unknown as StampJoinRow[]).map((row) => ({
    stampId: row.id,
    siteId: row.site_id,
    siteName: row.holy_sites?.name ?? '알 수 없는 성지',
    diocese: row.holy_sites?.diocese ?? null,
    category: row.holy_sites?.category ?? null,
    visitedAt: row.created_at,
    visitedOn: row.visited_on ?? null,
    note: row.note,
    photos: (row.stamp_photos ?? []).sort((a, b) => a.position - b.position),
  }));
}

/**
 * 내 기록 하나를 고친다 — 메모와(열이 있으면) 방문일만. hidden·photo_featured 는 절대 보내지 않는다
 * (DB 도 마이그레이션 20260914130000 으로 막는다).
 */
export async function updateStamp(
  stampId: string,
  patch: { note?: string | null; visitedOn?: string | null },
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'UNAUTHENTICATED' };

  const payload: Record<string, string | null> = {};
  if ('note' in patch) payload.note = patch.note ?? null;
  if ('visitedOn' in patch && visitedOnAvailable) payload.visited_on = patch.visitedOn ?? null;

  const { error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', stampId)
    .eq('user_id', userId);
  if (error) {
    console.error('updateStamp error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** 내 기록 하나를 지운다. RLS(stamps_delete_own)가 본인 것만 허용한다. */
export async function deleteStamp(stampId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'UNAUTHENTICATED' };
  const { error } = await supabase.from(TABLE).delete().eq('id', stampId).eq('user_id', userId);
  if (error) {
    console.error('deleteStamp error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * 성지 상세에서 한 줄들이 화면에 실제로 보였을 때 읽힘 수를 올린다.
 * 로컬에 마이그레이션(20260901000000)이 아직 안 걸려 있으면 조용히 무시한다 —
 * 카운트는 부가 기능이라 본 화면을 깨뜨리면 안 된다.
 */
export async function recordNoteReads(siteId: string, shownCount: number): Promise<void> {
  if (shownCount <= 0) return;
  const { error } = await supabase.rpc('increment_note_reads', {
    p_site_id: siteId,
    p_limit: shownCount,
  });
  if (error) console.warn('recordNoteReads skipped:', error.message);
}

/**
 * 내 한 줄들의 읽힘 수 (stampId → 읽힌 횟수).
 * RLS 가 본인 것만 통과시키므로 조건 없이 조회해도 안전하다.
 * 테이블이 아직 없으면(마이그레이션 미적용) 빈 맵 — 화면은 그냥 숫자를 숨긴다.
 */
export async function getMyNoteReadCounts(): Promise<Record<string, number>> {
  const userId = await getCurrentUserId();
  if (!userId) return {};

  const { data, error } = await supabase.from('note_read_counts').select('stamp_id, read_count');
  if (error) {
    console.warn('getMyNoteReadCounts skipped:', error.message);
    return {};
  }
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.stamp_id as string] = row.read_count as number;
  }
  return counts;
}

export type DioceseProgress = Record<string, { visited: number; total: number }>;

/** 교구별 완주 현황 (모은 스탬프 수 / 해당 교구 전체 성지 수). */
export async function getDioceseProgress(): Promise<DioceseProgress> {
  const [allSites, stamps] = await Promise.all([fetchSiteDioceseIndex(), getMyStamps()]);

  const visitedSiteIds = new Set(stamps.map((s) => s.siteId));
  const progress: DioceseProgress = {};

  for (const site of allSites) {
    const key = site.diocese ?? '기타';
    const entry = (progress[key] ??= { visited: 0, total: 0 });
    entry.total += 1;
    if (visitedSiteIds.has(site.id)) {
      entry.visited += 1;
    }
  }

  return progress;
}
