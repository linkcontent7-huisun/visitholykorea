/**
 * `/api/tour` — Vercel 서버리스 함수. 브라우저가 부르는 유일한 TourAPI 입구.
 *
 * 로직은 전부 `_lib/tour-proxy-core.ts` 에 있다(로컬 Vite 미들웨어와 공유).
 * 여기서는 Node `http` 요청·응답을 그 함수에 맞춰 옮기기만 한다.
 *
 * 필요한 환경 변수 (Vercel Project → Settings → Environment Variables):
 *   TOUR_API_SERVICE_KEY  — 공공데이터포털 서비스키. VITE_ 접두사 없이 넣는다(번들에 안 들어간다).
 *
 * 응답은 저장하지 않는다(`Cache-Control: no-store`, ADR 0002).
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
// 확장자 필수 — package.json 이 "type": "module" 이라 Node ESM 이 확장자 없는 상대 import 를 못 찾는다.
// 없으면 Vercel 함수가 뜨자마자 죽어 모든 /api/tour 가 500 FUNCTION_INVOCATION_FAILED (2026-09-16 실측).
import { handleTourProxy } from './_lib/tour-proxy-core.js';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('allow', 'GET');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ error: { kind: 'bad_request', reason: 'GET 만 허용' } }));
    return;
  }

  const query = new URL(req.url ?? '/', 'http://localhost').searchParams;
  const result = await handleTourProxy(query, {
    serviceKey: process.env.TOUR_API_SERVICE_KEY,
    // 비밀값 없는 요약만 — 오퍼레이션·상태·소요 시간
    log: (entry) => console.error('[tour-proxy]', JSON.stringify(entry)),
  });

  res.statusCode = result.status;
  for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
  res.end(result.body);
}
