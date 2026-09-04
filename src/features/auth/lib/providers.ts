/**
 * 어떤 SNS 로그인이 실제로 켜져 있는가.
 *
 * 2026-09-04 실측: Supabase `/auth/v1/settings` 의 external 이 비어 있고
 * 카카오·구글·페이스북은 전부 "provider is not enabled" 400 을 돌려준다.
 * 네이버 Edge Function 도 404(미배포). 즉 **버튼 네 개가 전부 죽어 있었다.**
 *
 * 누르면 앱을 떠나 오류 JSON 화면으로 가버리는데, 사용자 눈에는 그냥
 * "앱이 멈췄다"로 보인다. 실제로 그렇게 제보를 받았다.
 *
 * 작동하지 않는 버튼을 보여주는 것은 더미 UI 이며, 이 프로젝트의 원칙
 * ("미구현 영역은 준비 중임을 정직하게 표시한다")에 어긋난다. 그래서 켜진
 * 것만 보여준다. 나중에 Supabase 대시보드에서 제공자를 켠 뒤 여기 목록에
 * 추가하면 버튼이 다시 나타난다.
 *
 * 켜는 법:
 *  - 카카오·구글·페이스북 → Supabase 대시보드 Authentication → Providers
 *  - 네이버 → `supabase functions deploy naver-auth` (Edge Function)
 */
export type SocialProvider = 'naver' | 'kakao' | 'google' | 'facebook';

/** 실제로 켜져 있고 동작이 확인된 제공자만 넣는다. */
export const ENABLED_SOCIAL_PROVIDERS: readonly SocialProvider[] = [];

export function isSocialEnabled(provider: SocialProvider): boolean {
  return ENABLED_SOCIAL_PROVIDERS.includes(provider);
}

/** 하나라도 켜져 있는가 — SNS 구역 자체를 그릴지 판단한다. */
export const HAS_ANY_SOCIAL = ENABLED_SOCIAL_PROVIDERS.length > 0;
