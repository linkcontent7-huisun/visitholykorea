import { defineConfig } from 'vite';

// 개발 중에는 `npm run build && npm start` 로 서버(8897)가 정적 파일과 실시간 방을 함께 연다.
// `npm run dev:client` 로 Vite 만 띄울 때는 실시간 요청을 서버로 넘긴다.
export default defineConfig({
  // visitholykorea.com/visit/ 아래에서 서비스한다(메인 앱 vercel.json 이 이 경로를 이 프로젝트로 넘긴다)
  base: '/visit/',
  server: {
    port: 5197,
    proxy: {
      '/matchmake': 'http://127.0.0.1:8897',
      // Colyseus 방 접속 경로 = /{processId}/{roomId}?sessionId=… — 정적 경로(assets·site·src 등)는 빼고, 끝(또는 쿼리)을 고정한다
      '^/(?!assets/|site/|src/|node_modules/|@)[A-Za-z0-9_-]{6,}/[A-Za-z0-9_-]{6,}(\\?|$)': { target: 'ws://127.0.0.1:8897', ws: true },
    },
  },
  build: {
    target: 'es2022',
    // 파일도 /visit/ 아래에 놓는다(Vercel outputDirectory=dist → https://…/visit/…)
    outDir: 'dist/visit',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    // 구내 지도 단독 페이지(sitemap.html)도 함께 빌드한다
    rollupOptions: { input: { main: 'index.html', sitemap: 'sitemap.html' } },
  },
});
