import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { SpaceRoom } from './SpaceRoom.ts';

const PORT = Number(process.env.PORT ?? 8897);
const HOST = process.env.HOST ?? '127.0.0.1';
// vite base '/visit/' · outDir 'dist/visit' — 정적 파일은 /visit/ 아래에서 연다(Vercel·visitholykorea.com/visit/ 와 같은 경로)
const DIST = path.resolve(import.meta.dirname, '../dist/visit');

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`[visitholykorea] ${DIST}/index.html 이 없다 — 먼저 npm run build`);
  process.exit(1);
}

const startedAt = new Date().toISOString();

const server = new Server({
  transport: new WebSocketTransport({ pingInterval: 10_000 }),
  express: (app) => {
    app.disable('x-powered-by');
    app.get('/healthz', (_req, res) => {
      res.json({ ok: true, service: 'visitholykorea', startedAt });
    });
    // 배포 묶음 내려받기(release/ 의 zip · sha256 · 안내서). 목록은 보여 주지 않는다
    app.use('/download', express.static(path.resolve(import.meta.dirname, '../release'), {
      index: false, dotfiles: 'deny',
      setHeaders: (res, p) => { if (p.endsWith('.zip')) res.setHeader('Content-Disposition', `attachment; filename="${path.basename(p)}"`); res.setHeader('Cache-Control', 'no-cache'); },
    }));
    // 루트로 들어오면 /visit/ 로 보낸다(쿼리 유지 — 예전 링크 /?space=cathedral 도 살린다)
    app.get('/', (req, res) => { const q = req.originalUrl.indexOf('?'); res.redirect(302, '/visit/' + (q >= 0 ? req.originalUrl.slice(q) : '')); });
    // Express 는 '/visit' 과 '/visit/' 를 같은 경로로 본다 — 끝 슬래시가 없을 때만 넘긴다(무한 리다이렉트 방지)
    app.get('/visit', (req, res, next) => { const q = req.originalUrl.indexOf('?'); if ((q >= 0 ? req.originalUrl.slice(0, q) : req.originalUrl) !== '/visit') return next(); res.redirect(302, '/visit/' + (q >= 0 ? req.originalUrl.slice(q) : '')); });
    // 해시가 붙은 빌드 산출물은 오래 캐시, index.html 은 늘 새로
    app.use('/visit/assets', express.static(path.join(DIST, 'assets'), { maxAge: '7d', immutable: true }));
    app.use('/visit', express.static(DIST, { index: 'index.html', setHeaders: (res, p) => {
      if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    } }));
  },
});

server.define('space', SpaceRoom).filterBy(['spaceId']);

await server.listen(PORT, HOST);
console.log(`[visitholykorea] http://${HOST}:${PORT}  (dist=${DIST})`);
