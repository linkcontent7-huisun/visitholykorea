/**
 * 환경변수 진입점.
 *
 * 흩어진 `import.meta.env` 접근을 여기 한 곳으로 모아, 값이 빠졌을 때
 * 화면 어딘가에서 조용히 깨지는 대신 앱 시작 시점에 바로 드러나게 한다.
 * 값 목록과 설명은 저장소 루트의 `.env.example` 을 참고한다.
 */

function required(key: string, value: string | undefined): string {
  if (!value) {
    // 개발 중 .env.local 누락이 가장 흔한 원인이므로 메시지에 파일명을 남긴다.
    throw new Error(`환경변수 ${key} 가 설정되지 않았습니다. .env.local 을 확인하세요.`);
  }
  return value;
}

function optional(value: string | undefined, fallback = ''): string {
  return value ?? fallback;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
  tourApiServiceKey: optional(import.meta.env.VITE_TOUR_API_SERVICE_KEY),
  kakaoJsKey: optional(import.meta.env.VITE_KAKAO_JS_KEY),
  appUrl: optional(import.meta.env.VITE_APP_URL, window.location.origin),
  isDev: import.meta.env.DEV,
} as const;
