/**
 * 환경변수 진입점.
 *
 * 흩어진 `import.meta.env` 접근을 여기 한 곳으로 모아, 값이 빠졌을 때
 * 화면 어딘가에서 조용히 깨지는 대신 앱 시작 시점에 바로 드러나게 한다.
 * 값 목록과 설명은 저장소 루트의 `.env.example` 을 참고한다.
 */

type EnvBag = Record<string, string | undefined>;

/**
 * 브라우저에서는 Vite가 주입한 `import.meta.env`, Node 스크립트에서는 `process.env` 를 읽는다.
 * API 계층을 `scripts/` 의 일회성 도구에서도 그대로 재사용하기 위해 두 곳을 모두 본다.
 */
function readEnv(): EnvBag {
  const viteEnv = (import.meta as ImportMeta & { env?: EnvBag }).env;
  if (viteEnv?.VITE_SUPABASE_URL) return viteEnv;

  const nodeEnv = (globalThis as typeof globalThis & { process?: { env?: EnvBag } }).process?.env;
  return nodeEnv ?? viteEnv ?? {};
}

const source = readEnv();

function required(key: string): string {
  const value = source[key];
  if (!value) {
    // 개발 중 .env.local 누락이 가장 흔한 원인이므로 메시지에 파일명을 남긴다.
    throw new Error(`환경변수 ${key} 가 설정되지 않았습니다. .env.local 을 확인하세요.`);
  }
  return value;
}

function optional(key: string, fallback = ''): string {
  return source[key] ?? fallback;
}

/** 브라우저 밖(Node 스크립트·테스트)에서는 origin 이 없다. */
function currentOrigin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY'),
  tourApiServiceKey: optional('VITE_TOUR_API_SERVICE_KEY'),
  kakaoJsKey: optional('VITE_KAKAO_JS_KEY'),
  appUrl: optional('VITE_APP_URL', currentOrigin()),
  // Vite 는 MODE 를 문자열로 준다. Node 스크립트에서는 값이 없어 false 가 된다.
  isDev: source.MODE === 'development',
} as const;
