#!/usr/bin/env node
/**
 * Gemini 에서 지금 쓸 수 있는 모델 목록을 받아 `supabase/functions/ai-guide/models.json` 을 갱신한다.
 *
 * 모델 이름은 달마다 바뀌어 사라진다(2026-09-19 보조 모델 404). 그래서 이름을 시크릿·코드에 박지 않고
 * GitHub Actions(`.github/workflows/gemini-models.yml`)가 매일 이 스크립트를 돌려 목록을 새로 쓰고 함수를 재배포한다.
 * 사장님 지시(2026-09-19): "환경변수에 넣으면 바꾸기 어렵다. CI 로 매일 자동 갱신하라."
 *
 * 사용: GEMINI_API_KEY=... node scripts/gemini-models.mjs   (바뀐 게 없으면 종료 코드 0, 바뀌면 파일을 쓰고 0)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error('GEMINI_API_KEY 가 없습니다.');
  process.exit(2);
}
const OUT = new URL('../supabase/functions/ai-guide/models.json', import.meta.url);

const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
  headers: { 'x-goog-api-key': KEY },
});
if (!res.ok) {
  console.error(`ListModels 실패 HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  process.exit(1);
}
const { models = [] } = await res.json();

/** 채팅 답변에 쓸 수 있는 텍스트 모델만. 임베딩·이미지·음성·라이브·실험(exp)·프리뷰는 뺀다. */
const usable = models
  .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
  .map((m) => m.name.replace(/^models\//, ''))
  .filter((n) => /^gemini-/.test(n))
  .filter(
    (n) =>
      !/(embedding|image|audio|tts|live|vision|exp|preview|thinking|robotics|computer)/i.test(n),
  );

/** 순서: flash(빠르고 한도 넉넉) → flash-lite → 나머지. 같은 급이면 버전 숫자 큰 것 먼저. */
const rank = (n) => (/flash-lite/.test(n) ? 1 : /flash/.test(n) ? 0 : 2);
const ver = (n) => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) ?? [0, '0'])[1]);
const ordered = [...new Set(usable)].sort(
  (a, b) => rank(a) - rank(b) || ver(b) - ver(a) || a.localeCompare(b),
);
// "-latest" 별칭·숫자 없는 버전(gemini-flash-latest 등)은 가리키는 곳이 바뀔 수 있어 뒤로 보낸다
const stable = ordered
  .filter((n) => !/latest/.test(n))
  .concat(ordered.filter((n) => /latest/.test(n)));
const picked = stable.slice(0, 4);

if (picked.length === 0) {
  console.error('쓸 수 있는 Gemini 텍스트 모델을 찾지 못했습니다. 목록:', usable);
  process.exit(1);
}

let prev = [];
try {
  prev = JSON.parse(readFileSync(OUT, 'utf8')).models ?? [];
} catch {
  /* 첫 실행 */
}
if (JSON.stringify(prev) === JSON.stringify(picked)) {
  console.log('변경 없음:', picked.join(', '));
  process.exit(0);
}
writeFileSync(
  OUT,
  JSON.stringify({ updatedAt: new Date().toISOString().slice(0, 10), models: picked }, null, 2) +
    '\n',
);
console.log('갱신:', prev.join(', ') || '(없음)', '→', picked.join(', '));
