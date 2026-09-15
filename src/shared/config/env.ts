/**
 * 환경변수 진입점.
 *
 * 흩어진 `import.meta.env` 접근을 여기 한 곳으로 모아, 값이 빠졌을 때
 * 화면 어딘가에서 조용히 깨지는 대신 앱 시작 시점에 바로 드러나게 한다.
 * 값 목록과 설명은 저장소 루트의 `.env.example` 을 참고한다.
 *
 * **`import.meta.env` 를 객체째 읽지 않는다.** 예전에는 `(import.meta).env` 를 통째로
 * 받아 키 이름으로 꺼냈는데, Vite 는 그 경우 `VITE_` 로 시작하는 환경 변수 **전부**를
 * 객체 리터럴로 번들에 박아 넣는다. 2026-09-14 배포 번들에서 그렇게 서비스키가
 * 노출된 것을 실측했다. 키마다 `import.meta.env.VITE_X` 로 정적으로 읽으면
 * 쓰인 값만 치환된다.
 */

type EnvBag = Record<string, string | undefined>;

/** Node 스크립트(tsx)에는 `import.meta.env` 가 없다. 접근 자체가 TypeError 라 try 로 감싼다. */
function readViteEnv(): EnvBag {
  try {
    return {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_TOUR_PROXY_URL: import.meta.env.VITE_TOUR_PROXY_URL,
      VITE_KAKAO_JS_KEY: import.meta.env.VITE_KAKAO_JS_KEY,
      VITE_APP_URL: import.meta.env.VITE_APP_URL,
      MODE: import.meta.env.MODE,
    };
  } catch {
    return {};
  }
}

/**
 * 브라우저에서는 Vite가 주입한 값, Node 스크립트에서는 `process.env` 를 읽는다.
 * API 계층을 `scripts/` 의 일회성 도구에서도 그대로 재사용하기 위해 두 곳을 모두 본다.
 */
function readEnv(): EnvBag {
  const viteEnv = readViteEnv();
  if (viteEnv.VITE_SUPABASE_URL) return viteEnv;

  const nodeEnv = (globalThis as typeof globalThis & { process?: { env?: EnvBag } }).process?.env;
  return nodeEnv ?? viteEnv;
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
  // 빈 문자열도 "안 정한 것"이다 — .env 에 `VITE_TOUR_PROXY_URL=""` 로 두면 기본값(/api/tour)을 써야 한다.
  // `??` 였을 때는 빈 값이 그대로 남아 브라우저가 `?service=…` 를 현재 페이지에 보냈다 (2026-09-16 실측).
  return source[key] || fallback;
}

/** 브라우저 밖(Node 스크립트·테스트)에서는 origin 이 없다. */
function currentOrigin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY'),
  /**
   * TourAPI 중계 주소. 기본은 같은 출처의 `/api/tour`(Vercel 서버리스·Vite 미들웨어).
   * 브라우저는 절대 공공데이터포털을 직접 부르지 않는다.
   */
  tourProxyUrl: optional('VITE_TOUR_PROXY_URL', '/api/tour'),
  /**
   * 서버 전용 서비스키. `VITE_` 접두사가 없으므로 브라우저 번들에는 절대 들어가지 않고,
   * `scripts/` 의 Node 도구가 `.env.local` 에서 읽어 직접 호출할 때만 채워진다.
   */
  tourApiServiceKey: optional('TOUR_API_SERVICE_KEY'),
  kakaoJsKey: optional('VITE_KAKAO_JS_KEY'),
  appUrl: optional('VITE_APP_URL', currentOrigin()),
  // Vite 는 MODE 를 문자열로 준다. Node 스크립트에서는 값이 없어 false 가 된다.
  isDev: source.MODE === 'development',
} as const;
