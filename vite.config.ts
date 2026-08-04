import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// vitest 설정(test 블록)까지 한 파일에서 다루기 위해 vitest/config 의 defineConfig 를 쓴다.
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// 브라우저 번들에는 VITE_ 접두사가 붙은 환경변수만 노출된다(shared/config/env.ts 참고).
// Gemini 등 비밀 키가 필요한 호출은 Supabase Edge Function을 거치도록 하고,
// 클라이언트 코드에 직접 심지 않는다.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
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
        theme_color: '#1d4ed8',
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
        // 성지 정보(자체 큐레이션 DB)는 오프라인 대비 캐싱한다.
        // TourAPI 응답은 공모전 규정상 캐싱하지 않으므로 런타임 캐시 대상에서 제외한다.
        runtimeCaching: [
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
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
});
