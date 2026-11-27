import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [url, outPrefix, port='9471'] = process.argv.slice(2);
const dir = mkdtempSync(join(tmpdir(), 'vhkp-'));
const proc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--mute-audio', '--no-first-run', '--ignore-gpu-blocklist', '--window-size=412,800', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find((t) => t.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break; } } catch {} await sleep(250); }
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true, timeout: 300000 })).result?.result?.value;
await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 800, deviceScaleFactor: 1, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url }); await sleep(5000);
await ev(`document.getElementById('nick').value='시험'; document.getElementById('enter').click(); new Promise(async r=>{let k=0; while(!(window.__vhk&&__vhk.space)&&k<300){await new Promise(q=>setTimeout(q,50));k++} r(k)})`);
await sleep(3000);
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outPrefix}-${name}.png`, Buffer.from(r.result.data, 'base64')); };
const dist = () => ev('+__vhk.camDist.toFixed(2)');
// 두 손가락 제스처: 가운데 (206,420) 둘레, 간격 g0 → g1 (가로)
const gesture = async (g0, g1) => {
  const pts = (g) => [{ x: 206 - g / 2, y: 420, id: 1 }, { x: 206 + g / 2, y: 420, id: 2 }];
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(g0) });
  for (let i = 1; i <= 12; i++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(g0 + ((g1 - g0) * i) / 12) }); await sleep(16); }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900);
};
console.log('처음', await dist()); await shot('0-start');
await gesture(320, 140); console.log('모으기 1회(320→140px)', await dist()); await shot('1-in1');
await gesture(320, 140); console.log('모으기 2회', await dist()); await shot('2-in2');
await gesture(320, 140); console.log('모으기 3회', await dist()); await shot('3-in3');
await gesture(140, 320); console.log('벌리기 1회(140→320px)', await dist()); await shot('4-out1');
await gesture(140, 320); console.log('벌리기 2회', await dist()); await shot('5-out2');
await gesture(140, 320); console.log('벌리기 3회', await dist()); await shot('6-out3');
await gesture(140, 320); console.log('벌리기 4회', await dist()); await shot('7-out4');
proc.kill(); process.exit(0);
