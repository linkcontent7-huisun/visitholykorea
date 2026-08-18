/**
 * Supabase 테이블의 행(row) 형태.
 *
 * `supabase gen types typescript` 로 자동 생성할 수도 있지만, 지금은 테이블 수가 적어
 * 손으로 관리한다. `supabase/migrations` 의 스키마와 항상 같이 수정해야 한다.
 */

export interface HolySiteRow {
  id: string;
  name: string;
  category: string | null;
  diocese: string | null;
  region_province: string | null;
  location: string | null;
  description: string | null;
  history: string | null;
  image_url: string | null;
  /** 이미지 출처·라이선스 (마이그레이션 20260818000000). CC 라이선스는 출처 표기가 의무다. */
  image_source: string | null;
  image_license: string | null;
  lat: number | null;
  lng: number | null;
  seo_title: string | null;
  seo_description: string | null;
  emotion_tag: string | null;
  nearby_attractions: string | null;
  nearby_lodging: string | null;
  /** 성지 사무실 연락처 (마이그레이션 20260808000000) */
  phone: string | null;
  homepage_url: string | null;
  fax: string | null;
  created_at: string;
}

/**
 * 회원 프로필 (마이그레이션 20260818020000).
 * 자격 증명은 auth.users 가 관리하고, 여기에는 앱이 쓰는 표시용 정보만 담긴다.
 * 가입 시 트리거가 자동 생성한다.
 */
export interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  provider: string | null;
  created_at: string;
}

/** 순례 코스 (마이그레이션 20260818010000). 박해 사건·인물 축으로 성지를 순서대로 꿴다. */
export interface PilgrimageRouteRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface PilgrimageRouteSiteRow {
  route_id: string;
  site_id: string;
  position: number;
  note: string | null;
}

export interface PilgrimageStampRow {
  id: string;
  user_id: string;
  site_id: string;
  created_at: string;
}

export interface PilgrimageLogRow {
  id: string;
  user_id: string;
  site_id: string;
  title: string;
  content: string;
  visit_date: string;
  site_name: string | null;
  site_image: string | null;
  created_at: string;
}
