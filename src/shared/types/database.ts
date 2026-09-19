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
 * 성지 자료 출처 (마이그레이션 20260913100000).
 * 본문·사진의 근거를 남겨, 나중에 고칠 때 출처 없는 문장이 되지 않게 한다.
 */
export interface SiteSourceRow {
  id: string;
  site_id: string;
  kind: 'web' | 'book' | 'field' | 'ai_draft' | 'user';
  title: string;
  url: string | null;
  collected_at: string | null;
  collected_by: string | null;
  note: string | null;
  created_at: string;
}

/** 매체 기사에서 원문 대신 저작권 범위 안의 서지·요약·사실만 남긴다. */
export interface ArticleRow {
  id: string;
  source: 'catholicnews' | 'cpbc' | 'catholictimes' | 'other';
  url: string;
  title: string;
  published_at: string | null;
  author: string | null;
  summary: string | null;
  excerpt: string | null;
  topics: Array<'pilgrimage_route' | 'pilgrimage_record' | 'statue' | 'stained_glass' | 'relic' | 'sculpture' | 'artwork' | 'architecture' | 'shrine_news'>;
  facts: Record<string, unknown>;
  fetched_at: string;
  status: 'new' | 'reviewed' | 'used' | 'skip';
}

/** 기사와 성지의 연결은 자동 추출이므로 확신도를 함께 둔다. */
export interface ArticleSiteRow {
  article_id: string;
  site_id: string;
  confidence: number;
}

/** 도슨트의 볼거리 원고를 쓰기 전, 작품별 근거와 설명을 모아 둔다. */
export interface SiteArtworkRow {
  id: string;
  site_id: string;
  kind: 'statue' | 'stained_glass' | 'relic' | 'sculpture' | 'painting' | 'architecture' | 'other';
  title: string;
  artist: string | null;
  year: string | null;
  description: string | null;
  article_id: string | null;
  created_at: string;
}

/**
 * 익명 접속 기록 (마이그레이션 20260913100000).
 * visitor_id 는 브라우저 익명 식별자이며 이름·이메일을 저장하지 않는다.
 */
export interface EventRow {
  id: number;
  occurred_at: string;
  visitor_id: string;
  user_id: string | null;
  kind: 'view_site' | 'search' | 'view_route' | 'stamp' | 'ai_ask' | 'compass_done' | 'install';
  target_id: string | null;
  query: string | null;
  language: string | null;
  device: string | null;
}

/** 성지별 언어·영문 역사 번역 채움 현황 뷰 (마이그레이션 20260913100000). */
export interface TranslationCoverageRow {
  site_id: string;
  name: string;
  diocese: string | null;
  has_en: boolean;
  has_es: boolean;
  has_fr: boolean;
  has_pt: boolean;
  has_it: boolean;
  has_en_history: boolean;
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
  /** 관리자 권한 (마이그레이션 20260906000000). member | editor | admin */
  role: AdminRole;
  /** editor 가 맡은 교구. 비어 있으면 전 교구를 맡는다. */
  diocese: string | null;
  created_at: string;
}

/** 관리자 권한 등급. DB 의 profiles_role_check 제약과 같은 값이어야 한다. */
export type AdminRole = 'member' | 'editor' | 'admin';

/**
 * 성지 수정 이력 (마이그레이션 20260906000000).
 * `before` 에 고치기 직전 행 전체가 들어 있어, 잘못 고쳤을 때 되돌릴 수 있다.
 */
export interface SiteRevisionRow {
  id: string;
  site_id: string;
  editor: string | null;
  changed_at: string;
  before: Record<string, unknown>;
  fields: string[];
}

/**
 * admin_pending_photos 뷰 — 순례자 사진 승인함.
 * 회원을 특정할 수 있는 정보(user_id·이메일)는 일부러 빠져 있다.
 */
export interface AdminPendingPhotoRow {
  photo_id: string;
  stamp_id: string;
  site_id: string;
  site_name: string;
  diocese: string | null;
  photo_url: string;
  note: string | null;
  photo_featured: boolean;
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

/** 순례 코스 본문 번역 (마이그레이션 20260919100000). holy_site_translations 와 같은 구조다. */
export interface PilgrimageRouteTranslationRow {
  id: string;
  route_id: string;
  language: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  translation_status: 'machine' | 'reviewed';
  created_at: string;
}

/** 경유지가 이 코스에서 갖는 의미(note)의 번역. */
export interface PilgrimageRouteSiteTranslationRow {
  id: string;
  route_id: string;
  site_id: string;
  language: string;
  note: string | null;
  translation_status: 'machine' | 'reviewed';
  created_at: string;
}

export interface PilgrimageStampRow {
  id: string;
  user_id: string;
  site_id: string;
  /** 방문 한 줄 기록. 다음 방문자에게 익명으로 공개된다 (site_visit_notes 뷰). */
  note: string | null;
  /** 순례자가 남긴 사진 (pilgrim-photos 버킷 공개 URL). */
  photo_url: string | null;
  /** 신고 누적으로 숨겨진 글 — 뷰에서 걸러진다. */
  hidden: boolean;
  created_at: string;
}

/** 한 번의 순례에 남긴 사진. position은 공개 화면과 업로드 순서를 같게 한다. */
export interface StampPhotoRow {
  id: string;
  stamp_id: string;
  url: string;
  position: number;
  created_at: string;
}

/** site_visit_notes 뷰 — 사생활 보호를 위해 user_id 를 뺀 공개 형태. */
export interface SiteVisitNoteRow {
  /** 스탬프 id — 신고할 때 필요하다. uuid 라 사람을 특정하지 못한다. */
  id: string;
  site_id: string;
  note: string | null;
  photo_url: string | null;
  photos: string[];
  created_at: string;
}

/**
 * 한 줄 기록의 읽힘 수 (마이그레이션 20260902000000).
 * 글쓴이 본인만 조회할 수 있고, 증가는 increment_note_reads RPC 로만 한다.
 */
export interface NoteReadCountRow {
  stamp_id: string;
  read_count: number;
}

export interface CompassResponseRow {
  id: string;
  user_id: string;
  answers: Record<string, unknown>;
  matched_site_id: string | null;
  matched_site_name: string | null;
  created_at: string;
}

export interface CatholicDirectoryRow {
  id: string;
  name: string;
  category: string;
  diocese: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  /** 기계적 로마자 표기(2026-09-07, `scripts/romanize-directory.ts`). 사람이 감수하지 않음. */
  name_romanized: string | null;
  address_romanized: string | null;
  cbck_code?: string | null;
  district?: string | null;
  zipcode?: string | null;
  fax?: string | null;
  pastor_phone?: string | null;
  homepage?: string | null;
  email?: string | null;
  pastor?: string | null;
  pastor_en?: string | null;
  founded_on?: string | null;
  patron?: string | null;
  members_count?: number | null;
  mission_count?: number | null;
  address_en?: string | null;
  name_en?: string | null;
  cbck_synced_at?: string | null;
}

export interface FavoriteRow {
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
  /** 여행기 사진 공개 URL 목록(순서대로). 마이그레이션 20260914000000. */
  photos: string[] | null;
  created_at: string;
}

/**
 * 도슨트 원고 (마이그레이션 20260917090000).
 * kind='intro' 는 상세 화면 「소개글」(큰따옴표 3문단, seq 1) · kind='point' 는 오디오 도슨트 지점
 * (seq 0 여는 말 · 1..n 지점 · 99 맺음말). 언어별로 한 행씩이다.
 */
export interface DocentScriptRow {
  id: string;
  site_id: string;
  language: 'ko' | 'en' | 'es' | 'fr' | 'pt' | 'it';
  kind: 'intro' | 'point';
  seq: number;
  title: string | null;
  body: string;
  look_for: string | null;
  sources: unknown;
  status: 'draft' | 'reviewed' | 'verified';
  written_by: string | null;
  created_at: string;
  updated_at: string;
}
