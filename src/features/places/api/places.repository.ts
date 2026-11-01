import { supabase } from '@/shared/api/supabase';
import type { UserPlaceRow } from '@/shared/types/database';
import type { EmotionId } from '../lib/emotions';

/** 나만의 장소 기록 — 화면에서 쓰는 모양 */
export interface UserPlace {
  id: string;
  directoryId: string | null;
  name: string;
  address: string | null;
  description: string | null;
  photoUrl: string;
  emotion: string;
  emotionNote: string | null;
  visitedOn: string;
  status: UserPlaceRow['status'];
  createdAt: string;
}

export interface NewUserPlace {
  directoryId: string | null;
  name: string;
  address: string;
  description: string;
  photo: Blob;
  emotion: EmotionId;
  emotionNote: string;
  visitedOn: string;
}

const TABLE = 'user_places';
const BUCKET = 'pilgrim-photos';

function toUserPlace(row: UserPlaceRow): UserPlace {
  return {
    id: row.id,
    directoryId: row.directory_id,
    name: row.name,
    address: row.address,
    description: row.description,
    photoUrl: row.photo_url,
    emotion: row.emotion,
    emotionNote: row.emotion_note,
    visitedOn: row.visited_on,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** 빈 칸은 null 로 — 넘어간 칸이 빈 문자열로 남지 않게 */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function fetchMyPlaces(): Promise<UserPlace[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', auth.user.id)
    .order('visited_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as UserPlaceRow[]).map(toUserPlace);
}

/**
 * 사진을 먼저 올리고 행을 만든다. 사진은 본인 uid 폴더 아래(저장소 정책) `places/` 에 둔다.
 * 행 저장이 실패하면 올린 사진을 지워 주인 없는 파일을 남기지 않는다.
 */
export async function createMyPlace(input: NewUserPlace): Promise<{ success: boolean }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId || !input.name.trim()) return { success: false };

  const path = `${userId}/places/${crypto.randomUUID()}.jpg`;
  const bucket = supabase.storage.from(BUCKET);
  const { error: uploadError } = await bucket.upload(path, input.photo, {
    contentType: 'image/jpeg',
  });
  if (uploadError) return { success: false };
  const { data: pub } = bucket.getPublicUrl(path);

  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    directory_id: input.directoryId,
    name: input.name.trim(),
    address: orNull(input.address),
    description: orNull(input.description),
    photo_url: pub.publicUrl,
    emotion: input.emotion,
    emotion_note: orNull(input.emotionNote),
    visited_on: input.visitedOn,
  });
  if (error) {
    await bucket.remove([path]);
    return { success: false };
  }
  return { success: true };
}

export async function deleteMyPlace(place: UserPlace): Promise<{ success: boolean }> {
  const { error } = await supabase.from(TABLE).delete().eq('id', place.id);
  if (error) return { success: false };
  const path = new URL(place.photoUrl).pathname.split(`/object/public/${BUCKET}/`)[1];
  if (path) await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)]);
  return { success: true };
}

/** 관리자 — 확인을 기다리는 장소. 남의 pending 행은 RLS 가 admin 에게만 보여 준다. */
export async function fetchPendingPlaces(): Promise<UserPlace[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as UserPlaceRow[]).map(toUserPlace);
}

export async function reviewPlace(
  id: string,
  status: 'approved' | 'rejected',
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from(TABLE)
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  return { success: !error };
}
