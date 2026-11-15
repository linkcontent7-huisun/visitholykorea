// 이 맥의 크롬을 따로 띄워(확장·사용자 창과 무관) 3D 시연 영상을 녹화한다 — Chrome DevTools Protocol 직접 사용
// node rec.mjs <url> <take-name> [probeOnly]
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, take = 'take', probe] = process.argv.slice(2);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'vhkrec-'));
const port = 9333;
const proc = spawn(CHROME, [
  `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1280,720', '--window-position=0,0', '--autoplay-policy=no-user-gesture-required',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
  '--enable-gpu', '--ignore-gpu-blocklist', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
for (let i = 0; i < 60; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = list.find((t) => t.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break; } } catch {}
  await sleep(500);
}
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJS = async (expr, timeout = 600000) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, timeout }); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description ?? r; };
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(4000);
await evalJS(`new Promise((res,rej)=>{const s=document.createElement('script'); s.src='/visit/__director.js?'+Date.now(); s.onload=res; s.onerror=rej; document.head.append(s);})`);
console.log('gpu:', await evalJS(`(()=>{const c=document.createElement('canvas').getContext('webgl2'); const e=c&&c.getExtension('WEBGL_debug_renderer_info'); return e? c.getParameter(e.UNMASKED_RENDERER_WEBGL):'?'})()`));
await evalJS(`document.getElementById('nick').value='마리아'; document.getElementById('enter').click(); 1`);
await evalJS(`new Promise(async r=>{let k=0; while(!(window.__vhk&&__vhk.space)&&k<200){await new Promise(q=>setTimeout(q,100));k++;} window.__fixedPR=true; __vhk.renderer.setPixelRatio(1); __vhk.composer.setPixelRatio(1); dispatchEvent(new Event('resize')); r(1);})`);
if (probe) console.log('fps:', await evalJS(`new Promise(r=>{let n=0; const t0=performance.now(); (function f(){ n++; if(performance.now()-t0<3000) requestAnimationFrame(f); else r(+(n/3).toFixed(1)); })();})`));
if (!probe) {
  const res = await evalJS(`__film({name:'${take}.mp4'}).then(r=>JSON.stringify(r)).catch(e=>'ERR '+e)`, 900000);
  console.log('film:', res);
}
proc.kill('SIGTERM');
process.exit(0);
