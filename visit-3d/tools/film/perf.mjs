// 3D 성능 측정 — node perf.mjs <url> <quality: high|low> [cpuSlowdown]
// 입장 뒤 멈춤(longtask 합), 기준 6장면의 그리기 호출·삼각형·초당 장수, 전송량을 잰다.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, quality = 'high', slow = '1'] = process.argv.slice(2);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'vhkperf-'));
const port = 9336;
const proc = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1280,720', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pend = new Map(); let bytes = 0;
for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find((t) => t.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break; } } catch {} await sleep(500); }
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.method === 'Network.loadingFinished') bytes += m.params.encodedDataLength; if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true, timeout: 180000 })).result?.result?.value;
await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(5000);
const loadBytes = bytes;
if (slow !== '1') await send('Emulation.setCPUThrottlingRate', { rate: Number(slow) });
const enter = await ev(`new Promise(async r=>{
  window.__lt=0; new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lt+=e.duration}).observe({type:'longtask'});
  document.getElementById('quality').value='${quality}';
  document.getElementById('nick').value='측정'; const t0=performance.now(); document.getElementById('enter').click();
  let k=0; while(!(window.__vhk&&__vhk.space)&&k<600){await new Promise(q=>setTimeout(q,50));k++;}
  await new Promise(q=>setTimeout(q,1500));
  r({ready:Math.round(performance.now()-t0), longtask:Math.round(__lt)});
})`);
if (slow !== '1') await send('Emulation.setCPUThrottlingRate', { rate: 1 });
const shots = [
  ['1-언덕길', [4.5, -4.6, 66], [2, 2, 20]],
  ['2-정면', [-4, 1.7, 34], [0, 11, 6]],
  ['3-성모동굴', [11.5, 1.9, 31], [17.5, 2, 27]],
  ['4-신자석', [0, 2.3, -5], [0, 5.5, -46]],
  ['5-제대', [0, 2.6, -31], [0, 4.2, -46]],
  ['6-측랑', [3, 2.1, -12], [-4.5, 4.5, -18.6]],
];
const rows = [];
for (const [name, cp, ct] of shots) {
  await ev(`(()=>{const p=__vhk.player; p.place(p.pos.clone().set(${cp[0]}, ${cp[1]}, ${cp[2]}), 0); window.__cam={p:[${cp}], t:[${ct}], fov:66}; return 1})()`);
  await sleep(2500);
  const r = await ev(`new Promise(r=>{const R=__vhk.renderer; R.info.autoReset=false; let n=0, calls=0, tris=0; const t0=performance.now();
    function f(){ R.info.reset(); requestAnimationFrame(()=>{ calls=Math.max(calls,R.info.render.calls); tris=Math.max(tris,R.info.render.triangles); n++; if(performance.now()-t0<3000) f(); else { R.info.autoReset=true; r({fps:Math.round(n/((performance.now()-t0)/1000)), calls, tris}); } }); }
    f(); })`);
  rows.push({ 장면: name, 그리기: r.calls, 삼각형: r.tris, 초당장수: r.fps });
}
const mem = await ev(`({geo:__vhk.renderer.info.memory.geometries, tex:__vhk.renderer.info.memory.textures})`);
console.log(JSON.stringify({ quality, cpuSlow: slow, 첫전송KB: Math.round(loadBytes / 1024), 입장: enter, 메모리: mem, rows }, null, 1));
ws.close(); proc.kill();
