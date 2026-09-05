/**
 * 순례객 여행 프로필 — 국적 · 동행 인원 · 여행사 동반 여부.
 *
 * 왜 이 세 가지인가: 한국관광공사 외래관광객조사를 확인해봤지만 "성지순례"라는
 * 방문목적 자체가 없고, 개별/단체 여부도 종교 목적자만 따로 뽑을 방법이 없었다.
 * 우리가 앱 안에서 직접 물어보지 않으면 세상 어디에도 없는 데이터다.
 * 그래서 응답 부담을 줄이려고 딱 세 문항만 두고, 셋 다 스킵 가능하게 한다.
 */

import { supabase } from '@/shared/api/supabase';

const TABLE = 'profiles';

export interface TravelProfile {
  countryCode: string | null;
  /** 나를 제외한 동행 인원. 0 = 혼자. */
  companionCount: number | null;
  /** 여행사·순례 전문 여행사의 가이드 동반 단체인지. */
  isGuidedTour: boolean | null;
  /** 온보딩 시트를 이미 보여준 적 있는지. null 이면 아직 한 번도 안 물어봤다. */
  promptedAt: string | null;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getTravelProfile(): Promise<TravelProfile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select('country_code, companion_count, is_guided_tour, travel_profile_prompted_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('getTravelProfile error:', error);
    return null;
  }
  if (!data) return null;

  return {
    countryCode: data.country_code as string | null,
    companionCount: data.companion_count as number | null,
    isGuidedTour: data.is_guided_tour as boolean | null,
    promptedAt: data.travel_profile_prompted_at as string | null,
  };
}

/**
 * 온보딩 시트를 보여줬다고 표시한다 — 답을 했든 "나중에"를 눌렀든 호출한다.
 * 이걸 안 부르면 다음 로그인 때 또 뜬다.
 */
export async function markTravelProfilePrompted(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase
    .from(TABLE)
    .update({ travel_profile_prompted_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) console.warn('markTravelProfilePrompted skipped:', error.message);
}

/**
 * 셋 중 답한 것만 보내면 된다 — 나머지는 그대로 null(응답 안 함)로 남는다.
 * 온보딩에서 "국적만 알려주고 나머진 나중에" 식으로 나눠 받을 수 있게 부분 업데이트로 뒀다.
 */
export async function updateTravelProfile(
  input: Partial<TravelProfile>,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'UNAUTHENTICATED' };

  const patch: Record<string, unknown> = {};
  if (input.countryCode !== undefined) patch.country_code = input.countryCode;
  if (input.companionCount !== undefined) patch.companion_count = input.companionCount;
  if (input.isGuidedTour !== undefined) patch.is_guided_tour = input.isGuidedTour;

  if (Object.keys(patch).length === 0) return { success: true };

  const { error } = await supabase.from(TABLE).update(patch).eq('id', userId);
  if (error) {
    console.error('updateTravelProfile error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
