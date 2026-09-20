#!/usr/bin/env node
/**
 * 화면 스크린샷 — 맥·리눅스·윈도우 공용 (Node 22+ 의 내장 WebSocket 으로 CDP 를 직접 쓴다).
 *
 * 왜 `chrome --screenshot` 이 아닌가: 데스크톱 Chrome 은 창 최소 폭이 약 500px 이라
 * `--window-size=390,844` 를 줘도 휴대폰 폭으로 그려지지 않는다(2026-09-16 실측 — 상단바·하단 탭이 잘려 보였다).
 * CDP 의 `Emulation.setDeviceMetricsOverride` 로 휴대폰을 흉내 내야 실제 휴대폰과 같은 화면이 나온다.
 *
 * 사용:
 *   node scripts/browser/shoot.mjs                                  # 배포본, 모바일 390px, 주요 화면
 *   node scripts/browser/shoot.mjs --base http://localhost:4173     # 로컬 preview
 *   node scripts/browser/shoot.mjs --width 1440 --height 1000       # PC 폭
 *   node scripts/browser/shoot.mjs --only home,records --full       # 일부만 · 전체 길이
 *   node scripts/browser/shoot.mjs --out /tmp/shots
 *   node scripts/browser/shoot.mjs --js "document.querySelector('button').click()" --js-wait 1500
 *   node scripts/browser/shoot.mjs --js-file scripts/browser/plan.js   # 긴 JS 는 파일로
 *     # 찍기 전에 페이지 안에서 실행할 JS (설치 배너 닫기·패널 열기 등). --js-wait 는 그 뒤 기다릴 ms
 *
 * 결과: <out>/<화면이름>-<폭>.png  (기본 out 은 screenshots/<날짜-시각>/ — git 에 올리지 않는다)
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);

const BASE = opt('base', 'https://visitholykorea-app.vercel.app').replace(/\/$/, '');
const WIDTH = Number(opt('width', 390));
const HEIGHT = Number(opt('height', 844));
const MOBILE = WIDTH < 1024;
const FULL = flag('full');
const WAIT = Number(opt('wait', 4000));
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const OUT = opt('out', join('screenshots', stamp));
const PORT = Number(opt('port', 9333));
const JS = opt('js-file', '') ? readFileSync(opt('js-file', ''), 'utf8') : opt('js', '');
const JS_WAIT = Number(opt('js-wait', 1200));

// 화면 목록. 경로의 기준은 src/app/routes/paths.ts — 새 화면이 생기면 여기도 더한다.
const PAGES = {
  home: '/',
  search: '/search',
  compass: '/compass',
  records: '/records',
  menu: '/menu',
  login: '/login',
  map: '/map',
  nearby: '/nearby',
  routes: '/routes',
  faq: '/faq',
};
const only = opt('only', '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const targets = Object.entries(PAGES).filter(([k]) => only.length === 0 || only.includes(k));
for (const extra of args.filter((a, i) => args[i - 1] === '--extra'))
  targets.push([extra.replace(/\W+/g, '_'), extra]);

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!CHROME) {
  console.error('Chrome 을 못 찾았다. CHROME_PATH 환경변수로 알려달라.');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
// 프로필은 매번 새로 — 지난번 PWA 서비스워커가 옛 빌드를 그대로 내주는 사고를 막는다(2026-09-16 실측).
const profile = mkdtempSync(join(tmpdir(), 'vhk-shoot-'));
const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForPort() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return res.json();
    } catch {
      /* 아직 안 뜸 */
    }
    await sleep(250);
  }
  throw new Error(`CDP 포트 ${PORT} 가 열리지 않았다`);
}

/** 아주 작은 CDP 클라이언트 — 명령 보내고 결과 기다리기만 한다. */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  return { send, ready, close: () => ws.close() };
}

try {
  await waitForPort();
  const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
    method: 'PUT',
  });
  const target = await targetsRes.json();
  const cdp = connect(target.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  // 서비스워커 캐시를 거치지 않는다 — 방금 빌드한 화면을 찍어야 한다.
  await cdp.send('Network.setBypassServiceWorker', { bypass: true });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 2,
    mobile: MOBILE,
  });
  if (MOBILE) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });

  for (const [name, path] of targets) {
    const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
    await cdp.send('Page.navigate', { url });
    await sleep(WAIT);
    if (JS) {
      await cdp.send('Runtime.evaluate', {
        expression: JS,
        awaitPromise: true,
        returnByValue: true,
      });
      await sleep(JS_WAIT);
    }
    let clip;
    if (FULL) {
      const { result } = await cdp.send('Runtime.evaluate', {
        expression:
          "(() => { const el = document.getElementById('app-scroll') || document.scrollingElement; return Math.min(6000, el.scrollHeight); })()",
        returnByValue: true,
      });
      const h = Math.max(HEIGHT, Number(result.value) || HEIGHT);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: WIDTH,
        height: h,
        deviceScaleFactor: 2,
        mobile: MOBILE,
      });
      await sleep(400);
      clip = { x: 0, y: 0, width: WIDTH, height: h, scale: 1 };
    }
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      ...(clip ? { clip } : {}),
    });
    const file = join(OUT, `${name}-${WIDTH}.png`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`${file}  ←  ${url}`);
    if (FULL) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: WIDTH,
        height: HEIGHT,
        deviceScaleFactor: 2,
        mobile: MOBILE,
      });
    }
  }
  cdp.close();
} finally {
  chrome.kill();
  // Chrome 이 프로필을 닫는 데 잠깐 걸린다 — 못 지워도 임시 폴더라 그냥 둔다.
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* 다음 부팅 때 OS 가 치운다 */
  }
}
