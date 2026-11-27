import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [url, outPrefix, port='9451'] = process.argv.slice(2);
const dir = mkdtempSync(join(tmpdir(), 'vhkf-'));
const proc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--mute-audio', '--no-first-run', '--ignore-gpu-blocklist', '--window-size=600,800', 'about:blank'], { stdio: 'ignore' });
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
await ev(`document.getElementById('nick').value='시험'; document.getElementById('enter').click(); new Promise(async r=>{let k=0; while(!(window.__vhk&&__vhk.space)&&k<300){await new Promise(q=>setTimeout(q,100));k++} r(k)})`);
await sleep(2500);
console.log(await ev(`(()=>{const v=__vhk,p=v.player,sp=v.space,V=p.pos.constructor; for(const d of sp.doors){d.open=true;d.t=1}
  const ia=sp.interactables.find(i=>i.kind==='font'); window.__fontIa=ia; p.place(new V(-1.2,0.62,-5.8),0);
  return JSON.stringify({anchor:[ia.anchor.x,ia.anchor.y,ia.anchor.z].map(n=>+n.toFixed(2)),start:[p.pos.x,p.pos.y,p.pos.z].map(n=>+n.toFixed(2))})})()`));
await sleep(600);
await ev(`(()=>{const v=__vhk; v.act({ia:window.__fontIa,hit:{distance:3}}); return 1})()`);
const log = [];
for (let i = 0; i < 16; i++) {
  await sleep(700);
  const st = await ev(`(()=>{const v=__vhk,p=v.player; return JSON.stringify({pos:[p.pos.x,p.pos.y,p.pos.z].map(n=>+n.toFixed(2)),cap:document.getElementById('caption').hidden?'':document.getElementById('caption').textContent,toast:(document.getElementById('toast')||{}).textContent||'',g:v.me.gesture?+((v.me.idle-v.me.gesture.start)/5.6).toFixed(2):null})})()`);
  log.push(st);
  if (i % 2 === 1) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outPrefix}-${String(i).padStart(2,'0')}.png`, Buffer.from(r.result.data, 'base64')); }
}
console.log(log.join('\n'));
proc.kill(); process.exit(0);
