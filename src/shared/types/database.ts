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
  lat: number | null;
  lng: number | null;
  seo_title: string | null;
  seo_description: string | null;
  emotion_tag: string | null;
  nearby_attractions: string | null;
  nearby_lodging: string | null;
  created_at: string;
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
