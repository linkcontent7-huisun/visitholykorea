// 기준 장면 6곳을 같은 각도로 찍는다(수정 전후 비교) — node shots.mjs <url> <prefix>
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, prefix = 'shot'] = process.argv.slice(2);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'vhkshot-'));
const port = 9334;
const proc = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1280,720', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find((t) => t.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break; } } catch {} await sleep(500); }
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true, timeout: 120000 })).result?.result?.value;
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(4000);
await ev(`document.getElementById('nick').value='기준'; document.getElementById('enter').click(); new Promise(async r=>{let k=0; while(!(window.__vhk&&__vhk.space)&&k<200){await new Promise(q=>setTimeout(q,100));k++;} window.__fixedPR=true; __vhk.renderer.setPixelRatio(1); __vhk.composer.setPixelRatio(1); r(1);})`);
await sleep(3000);
// [이름, 사람 자리, 카메라 자리, 바라보는 곳]
const shots = [
  ['f1-front-far', [-2, 1, 46], [-2, 1.8, 44], [0, 22, 6]],
  ['f4-45deg', [14, 1, 40], [14, 1.8, 38], [0, 14, 8]],
  ['f5-side', [-30, 1, 10], [-30, 1.8, 10], [0, 12, -10]],
  ['f6-side-close', [-22, 1, -6], [-22, 1.8, -6], [-8, 9, -16]],
  ['f7-transept', [-30, 1, -20], [-30, 1.8, -20], [-6, 12, -34]],
];
for (const [name, pp, cp, ct] of shots) {
  await ev(`(()=>{const p=__vhk.player; p.place(p.pos.clone().set(${cp[0]}, ${cp[1]}, ${cp[2]}), 0); __vhk.me.root.scale.setScalar(0.0001); window.__cam={p:[${cp}], t:[${ct}], fov:66}; return 1})()`); // 사람은 카메라 자리에 숨겨 둔다(그 자리의 실내·외 빛이 그대로 적용)
  await sleep(3500); // 실내·외 빛이 자리 잡을 때까지
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
  writeFileSync(`${prefix}-${name}.jpg`, Buffer.from(r.result.data, 'base64'));
  console.log('saved', `${prefix}-${name}.jpg`);
}
proc.kill('SIGTERM');
process.exit(0);
