import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
// vitest 설정(test 블록)까지 한 파일에서 다루기 위해 vitest/config 의 defineConfig 를 쓴다.
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { handleTourProxy } from './api/_lib/tour-proxy-core';

/**
 * 로컬 개발·미리보기에서 `/api/tour` 를 Vercel 서버리스 함수와 똑같이 띄운다.
 *
 * 서비스키는 `.env.local` 의 `TOUR_API_SERVICE_KEY`(VITE_ 접두사 없음)에서 읽는다 —
 * 브라우저 번들에는 들어가지 않고 이 미들웨어(Node)만 본다. 운영에서는 `api/tour.ts` 가
 * 같은 `handleTourProxy` 를 쓴다.
 */
function tourProxyDevPlugin(mode: string): Plugin {
  const serviceKey = loadEnv(mode, process.cwd(), '').TOUR_API_SERVICE_KEY;
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== '/api/tour') return next();
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('allow', 'GET');
      res.end(JSON.stringify({ error: { kind: 'bad_request', reason: 'GET 만 허용' } }));
      return;
    }
    const result = await handleTourProxy(url.searchParams, {
      serviceKey,
      log: (entry) => console.warn('[tour-proxy:dev]', JSON.stringify(entry)),
    });
    res.statusCode = result.status;
    for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
    res.end(result.body);
  };
  return {
    name: 'vhk-tour-proxy-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => void middleware(req, res, next));
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => void middleware(req, res, next));
    },
  };
}

// 브라우저 번들에는 VITE_ 접두사가 붙은 환경변수만 노출된다(shared/config/env.ts 참고).
// Gemini 등 비밀 키가 필요한 호출은 Supabase Edge Function을, TourAPI 서비스키는
// 같은 출처의 /api/tour 중계를 거치도록 하고 클라이언트 코드에 직접 심지 않는다.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    tourProxyDevPlugin(mode),
    VitePWA({
      registerType: 'autoUpdate',
      // registerSW.js 를 따로 받지 않고 index.html 에 인라인 — 첫 그림을 막던 요청 하나를 줄인다(9/14)
      injectRegister: 'inline',
      includeAssets: ['favicon-64.png', 'favicon-32.png', 'icons/apple-touch-icon.png', 'logo-mark-88.png'],
      manifest: {
        name: 'Visit Holy Korea - 한국 가톨릭 성지순례',
        short_name: 'VisitHolyKorea',
        description: '한국 천주교 성지순례 안내 · 순례 여권 · AI 순례 가이드',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#04377C',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // /api/* 는 화면이 아니라 중계 함수다. 내비게이션 폴백이 index.html 을 돌려주면 안 된다.
        navigateFallbackDenylist: [/^\/api\//],
        // 성지 정보(자체 큐레이션 DB)는 오프라인 대비 캐싱한다.
        // TourAPI 응답(/api/tour·apis.data.go.kr)은 공모전 규정상 캐싱하지 않으므로
        // 런타임 캐시 규칙에 넣지 않는다 — 아래 목록에 그 URL 이 없는 것이 의도다.
        runtimeCaching: [
          {
            // 홈 히어로 고정 5곳 사진(자체 저장, `public/images/hero/`) — 한 번 받으면 오래 쓴다(9/16 회의: 캐싱해 리소스 절약).
            urlPattern: /\/images\/(hero|sites)\/.*\.(jpg|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'site-photos',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/holy_sites.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'holy-sites',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    // M-04(보안 진단 2026-09-13): 운영 번들에 소스맵을 싣지 않는다 — 배포본에서 원본 TS 가
    // 복원되던 것을 막는다. Vercel 은 dist 의 .map 을 그대로 서빙하므로 'hidden' 으로는 부족하다.
    sourcemap: false,
    // 순례자 중 구형 아이폰이 많다. lookbehind 정규식 하나가 iOS 16.3 이하에서
    // 앱 전체를 흰 화면으로 만든 사고(2026-09-01) 후 낮은 타깃으로 못 박음 —
    // esbuild 가 변환 못 하는 문법이 들어오면 빌드가 실패해 배포 전에 잡힌다.
    target: ['es2020', 'safari14'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
}));
