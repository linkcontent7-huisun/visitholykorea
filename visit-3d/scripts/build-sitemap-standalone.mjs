#!/usr/bin/env node
// sitemap.html(Vite 진입 페이지)을 «혼자 열리는» 단일 HTML 로 묶는다.
//  - src/sitemap/main.ts 와 three.js 를 esbuild 로 번들해 <script type="module"> 안에 넣는다
//  - public/site/myeongdong.json 을 <script id="site-data" type="application/json"> 으로 박는다
//  - 루트 상대 경로(/src/…, /site/…)를 남기지 않는다 → md editor(blob iframe)·file:// 에서도 그려진다
// 개발용 sitemap.html 은 그대로 둔다. 산출: dist-single/sitemap.standalone.html
// 실행: node scripts/build-sitemap-standalone.mjs
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'dist-single/sitemap.standalone.html');

const bundle = await build({
  entryPoints: [resolve(ROOT, 'src/sitemap/main.ts')],
  bundle: true,
  format: 'esm', // main.ts 가 top-level await 를 쓴다 — 인라인 module 스크립트로 둔다
  target: 'es2022',
  minify: true,
  write: false,
  legalComments: 'none',
  absWorkingDir: ROOT,
});
const js = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script');
const data = readFileSync(resolve(ROOT, 'public/site/myeongdong.json'), 'utf8').replaceAll('</', '<\\/');

const page = readFileSync(resolve(ROOT, 'sitemap.html'), 'utf8');
const tag = /<script type="module" src="\/src\/sitemap\/main\.ts"><\/script>/;
if (!tag.test(page)) throw new Error('sitemap.html 의 진입 스크립트 태그를 찾지 못했다');
const out = page.replace(
  tag,
  () => `<script id="site-data" type="application/json">${data.trim()}</script>\n  <script type="module">${js}</script>`,
);

const leftover = out.match(/(?:src|href)="\/[^"/][^"]*"/g);
if (leftover) throw new Error(`루트 상대 경로가 남았다: ${leftover.join(', ')}`);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out);
console.log(`${OUT} (${(out.length / 1024).toFixed(0)} KB)`);
