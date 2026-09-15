/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** TourAPI 중계 주소. 비우면 같은 출처의 `/api/tour`. */
  readonly VITE_TOUR_PROXY_URL?: string;
  readonly VITE_KAKAO_JS_KEY?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_SUBMISSION_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
