import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [url, outPrefix, port='9461'] = process.argv.slice(2);
const dir = mkdtempSync(join(tmpdir(), 'vhki-'));
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
const t0 = Date.now(); let n = 0;
for (const at of [0.6, 1.6, 2.8, 4.0, 5.2, 6.4, 7.6]) { const w = at * 1000 - (Date.now() - t0); if (w > 0) await sleep(w); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outPrefix}-${n++}.png`, Buffer.from(r.result.data, 'base64')); }
console.log(await ev(`JSON.stringify({me:[__vhk.player.pos.x,__vhk.player.pos.y,__vhk.player.pos.z].map(n=>+n.toFixed(1)),cinema:document.body.classList.contains('cinema')})`));
proc.kill(); process.exit(0);
