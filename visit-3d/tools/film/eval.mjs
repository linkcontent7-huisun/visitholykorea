// 사용: node eval.mjs <주소> <checks/파일.js> [포트]  — 벽 통과 시험 모음(2026-11-23). 상세는 README.md 「벽 통과 시험」
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, file, port = '9345'] = process.argv.slice(2);
const dir = mkdtempSync(join(tmpdir(), 'vhkeval-'));
const proc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--mute-audio', '--no-first-run', '--ignore-gpu-blocklist', '--window-size=900,700', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find((t) => t.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break; } } catch {} await sleep(250); }
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true, timeout: 400000 }); return r.result?.result?.value ?? JSON.stringify(r.result?.exceptionDetails ?? r); };
await send('Page.enable'); await send('Page.navigate', { url }); await sleep(5000);
const t0 = Date.now();
await ev(`document.getElementById('nick').value='시험'; document.getElementById('enter').click(); new Promise(async r=>{let k=0; while(!(window.__vhk&&__vhk.space)&&k<300){await new Promise(q=>setTimeout(q,100));k++} r(k)})`);
console.log('입장까지 ms', Date.now() - t0);
await sleep(3000);
console.log(await ev(readFileSync(file, 'utf8')));
proc.kill(); process.exit(0);
