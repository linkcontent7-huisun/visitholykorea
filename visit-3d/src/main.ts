import './style.css';
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { WIND, NEAR_FADE } from './sitemap/trees.ts';
import { lightBeam, glassPool } from './textures.ts';
import { simplifyOutdoor } from './simplify.ts';
import { initialName, isSelfName, KEY_NICK, KEY_NICK_SELF, randomPilgrimName } from './pilgrim-name.ts';
import { AVATARS, avatarOf, randomAvatarId, encodeNick, decodeNick, buildAvatar, animateAvatar } from './avatars.ts';
import nipplejs from 'nipplejs';
import { makeMaterials } from './materials.ts';
import { disposeTree } from './kit.ts';
import { buildCathedral } from './spaces/cathedral.ts';
import { buildChapel } from './spaces/chapel.ts';
import type { Interactable, SpaceBuild } from './spaces/types.ts';
import { Player } from './player.ts';
import { Sound } from './audio.ts';
import { Net } from './net.ts';
import { createBarrier } from './barrier.ts';
import { createPrayerFloat, fakePrayers, demoBigColors } from './demo.ts';
import { createPilgrimLights, SANCTUARY_LIGHTS } from './lights.ts';
import { fetchSummary, lightCandle, isLoggedIn, guessCountry, flag, daysLeft, sharesMainSession, type CandleSummary } from './candles.ts';
import { startBellGame } from './rites.ts';
import { Points, PTS } from './points.ts';
import { Nav } from './nav.ts';
import { STATION_SCENES, STATION_VERSICLE } from './prayers.ts';
import { startGesture, crossProgress, CROSS_BEATS } from './avatars.ts';
import { loadSite, type SiteData } from './sitemap/siteMap.ts';
import { SPACES, INTENTIONS, GREETINGS, REACTS, REACT_LABEL, STATION_NAMES, CANDLE_TEXT_MAX, cleanCandleText, isSpaceId, siteHref, type SpaceId } from '../shared/spaces.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
// visitholykorea.com/visit/ 아래(rewrite)에서는 같은 도메인 상대 주소, 3D 전용 주소(vercel.app 등)에서는 메인 도메인으로 보낸다
const MAIN_ORIGIN = /(^|\.)visitholykorea\.com$/.test(location.hostname) ? '' : 'https://visitholykorea.com';
const mainHref = (path: string) => MAIN_ORIGIN + path;
$<HTMLAnchorElement>('backEntry').href = mainHref(siteHref(isSpaceId(new URLSearchParams(location.search).get('space')) ? (new URLSearchParams(location.search).get('space') as SpaceId) : 'cathedral'));
const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (touch) document.body.classList.add('touch');

// ── 입장 화면 ──────────────────────────────────────────────────
const params = new URLSearchParams(location.search);
const startParam = params.get('space');
const nickInput = $<HTMLInputElement>('nick');
const startSel = $<HTMLSelectElement>('startSpace');
const qualitySel = $<HTMLSelectElement>('quality');
// 로그인한 순례자의 계정 이름을 칸에 넣는다(직접 고친 이름이 먼저) — pilgrim-name.ts
try { nickInput.value = initialName(localStorage); } catch { /* 저장소 없음 */ }
if (!nickInput.value) nickInput.value = randomPilgrimName(); // 로그인한 이름도, 직접 적은 이름도 없으면 성경 인물 이름을 한 칸에 넣어 준다(고치거나 🎲 로 다시 뽑는다)
$('nickRandom').addEventListener('click', () => { nickInput.value = randomPilgrimName(); });
if (isSpaceId(startParam)) startSel.value = startParam;
qualitySel.value = touch ? 'low' : 'high';

const cleanNick = (s: string) => s.normalize('NFC').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 12) || randomPilgrimName();

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
if (!webglOk()) {
  $('entryNote').textContent = '이 기기·브라우저에서 WebGL 을 쓸 수 없어 3D 공간을 열 수 없습니다. 다른 브라우저로 열어 주세요.';
  $<HTMLButtonElement>('enter').disabled = true;
}

// v2: 캐릭터는 고르지 않는다 — 들어올 때마다 무작위로 정해진다(지난번과 같지 않게). 작은 3D 미리보기가 돈다
const lastAvatar = (() => { try { return localStorage.getItem('vhk.avatar') ?? ''; } catch { return ''; } })();
let avatarId: string = randomAvatarId();
// 촬영·시연용: ?avatar=gabriel 처럼 주소로 정할 수 있다
const forcedAvatar = new URLSearchParams(location.search).get('avatar');
if (forcedAvatar && AVATARS.some((a) => a.id === forcedAvatar)) avatarId = forcedAvatar;
if (!forcedAvatar) for (let i = 0; i < 4 && avatarId === lastAvatar; i++) avatarId = randomAvatarId();
const pickBox = $('avatarPick');
for (const a of AVATARS) {
  const b = document.createElement('button');
  b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.id = a.id; b.title = a.name;
  b.innerHTML = `${a.emoji}<small>${a.name.replace(' 천사', '').replace('WYD ', '')}</small>`;
  b.addEventListener('click', () => selectAvatar(a.id));
  pickBox.append(b);
}
let previewRig: ReturnType<typeof buildAvatar> | null = null;
let previewOn = true;
const pv = $<HTMLCanvasElement>('avatarPreview');
let pvRenderer: THREE.WebGLRenderer | null = null;
const pvScene = new THREE.Scene(), pvCam = new THREE.PerspectiveCamera(28, 110 / 140, 0.1, 20);
pvCam.position.set(0, 1.25, 4.6); pvCam.lookAt(0, 0.95, 0);
pvScene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a2e22, 2.2));
const pvSun = new THREE.DirectionalLight(0xffffff, 2.2); pvSun.position.set(2, 3, -3); pvScene.add(pvSun);
// 다시 온 사람은 입장 화면을 보지 않으므로 미리보기 그래픽 장치를 만들지 않는다(페이지 여는 시간 약 1초)
const returningEarly = (() => { try { return !params.has('entry') && !!localStorage.getItem(KEY_NICK); } catch { return false; } })();
if (!returningEarly) try { pvRenderer = new THREE.WebGLRenderer({ canvas: pv, alpha: true, antialias: true }); pvRenderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); pvRenderer.setSize(110, 140, false); } catch { pvRenderer = null; }
function selectAvatar(id: string) {
  avatarId = id;
  pickBox.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String((b as HTMLElement).dataset.id === id)));
  $('avatarName').textContent = `오늘은 ${avatarOf(id).name}`;
  if (previewRig) pvScene.remove(previewRig.root);
  previewRig = buildAvatar(avatarOf(id));
  previewRig.root.rotation.y = Math.PI;
  pvScene.add(previewRig.root);
}
$('avatarRandom').addEventListener('click', () => selectAvatar(randomAvatarId()));
selectAvatar(avatarId);
(function spin(ts: number) {
  if (!previewOn || !pvRenderer) return;
  const rig = previewRig as ReturnType<typeof buildAvatar> | null;
  if (rig) { rig.root.rotation.y = Math.PI + Math.sin(ts / 1400) * 0.9; animateAvatar(rig, 1 / 60, 0.8 + Math.sin(ts / 900) * 0.8, ts / 1000); }
  pvRenderer.render(pvScene, pvCam);
  requestAnimationFrame(spin);
})(0);

let enterAt = 0; // 입장하기를 누른 시각(주소에 ?time 을 붙이면 입장에 걸린 초를 화면에 알린다 — 휴대폰에서 직접 재 보는 용도)
function enterNow() {
  enterAt = performance.now();
  const name = cleanNick(nickInput.value).slice(0, 9);
  try { localStorage.setItem(KEY_NICK, name); localStorage.setItem(KEY_NICK_SELF, isSelfName(name, localStorage) ? '1' : '0'); localStorage.setItem('vhk.avatar', avatarId); } catch { /* 무시 */ }
  $<HTMLButtonElement>('enter').disabled = true;
  previewOn = false; pvRenderer?.dispose(); pvRenderer?.forceContextLoss(); pvRenderer = null; // 미리보기 그래픽 장치(문맥)도 바로 놓는다(휴대폰은 문맥 수에 한도가 있다)
  start(encodeNick(name, avatarId), startSel.value as SpaceId, qualitySel.value === 'high', avatarId);
}
$('enter').addEventListener('click', enterNow);

// 다시 온 사람은 입장 화면을 건너뛰고 바로 마당으로(2026-11-22 사장님 결정). 「한 번 들어와 봤다」 = 기기에 이름이 남아 있음.
// 이름 칸은 처음 들어올 때와 같은 순서(직접 고친 이름 → 계정 이름 → 전에 쓴 이름)로 이미 채워져 있다.
// 주소에 ?entry 를 붙이면 입장 화면을 다시 본다(이름·캐릭터 바꾸기, 시험). 소리는 첫 손짓에 켠다(start 안의 unlock).
const returning = (() => { try { return !params.has('entry') && !!localStorage.getItem(KEY_NICK) && webglOk(); } catch { return false; } })();
if (returning) {
  $('entry').classList.add('skipped');
  // 페이지가 다 열린 뒤(첫 화면을 한 번 그린 뒤) 짓기 시작한다 — 열리는 도중에 지으면 더 오래 걸렸다
  const go = () => requestAnimationFrame(() => setTimeout(enterNow, 0));
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
}

// ── 본체 ──────────────────────────────────────────────────────
function start(nick: string, first: SpaceId, high: boolean, myAvatar: string) {
  const myName = decodeNick(nick).name; // 화면에 보이는 이름(별명 끝의 캐릭터 번호를 뺀 것)
  const renderer = new THREE.WebGLRenderer({ antialias: high, powerPreference: 'high-performance' });
  renderer.debug.checkShaderErrors = false; // 입장 빠르게(2026-11-24): 그리기 하나마다 셰이더 결과를 동기로 기다리지 않는다(three 공식 권장 — 오류 검사만 끈다)
  const PR_MAX = Math.min(window.devicePixelRatio || 1, high ? 2 : 1);
  renderer.setPixelRatio(Math.min(PR_MAX, 1.25)); // 처음은 1.25 — 아래 자동 화질이 기기에 맞춰 올리거나 내린다
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMappingExposure = 1.0;
  $('app').appendChild(renderer.domElement);
  const canvas = renderer.domElement;

  const labels = new CSS2DRenderer();
  labels.setSize(innerWidth, innerHeight);
  labels.domElement.className = 'labels';
  document.body.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 3000);
  scene.add(camera);

  const sky = new Sky();
  sky.scale.setScalar(2500);
  const su = sky.material.uniforms;
  su.turbidity.value = 2.6; su.rayleigh.value = 1.7; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.78; // v3-3: 더 깊은 파랑, 지평선 쪽 옅은 안개
  // 늦가을 맑은 날의 흩어진 흰 구름(하늘 셰이더 내장 구름). 하늘 밝기는 조금 낮춰 파란빛이 살게 한다(HDR 이라 하얗게 날아간다)
  if (su.cloudCoverage) { su.cloudCoverage.value = 0.22; su.cloudDensity.value = 0.5; su.cloudScale.value = 0.00024; su.cloudSpeed.value = 0.00001; } // v3-3: 덩어리 대신 또렷한 작은 구름
  sky.material.fragmentShader = sky.material.fragmentShader.replace('gl_FragColor = vec4( texColor, 1.0 );', 'gl_FragColor = vec4( texColor * 0.52, 1.0 );');
  sky.material.needsUpdate = true;
  scene.add(sky);
  // v2: 하늘을 주변광으로 — 같은 하늘 재질을 작은 장면에 하나 더 두고 PMREM 으로 굽는다(해 높이가 바뀔 때만)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new Sky(); envSky.material = sky.material; envSky.scale.setScalar(50); envScene.add(envSky);
  let envRT: THREE.WebGLRenderTarget | null = null, envDirty = true;
  // 하늘 셰이더는 밝기가 매우 크다(HDR) — 주변광으로 쓸 때는 크게 줄인다
  let ENV_K = 0.1;
  (window as any).__tune = (k: number, exp?: number) => { ENV_K = k; if (exp) renderer.toneMappingExposure = exp; };
  const bakeEnv = () => {
    if (!envDirty) return; envDirty = false;
    const rt = pmrem.fromScene(envScene, 0.02, 0.1, 200);
    envRT?.dispose(); envRT = rt; scene.environment = rt.texture;
  };
  // 먼 곳이 공기에 묻혀 흐려지는 원근(남산·시가지가 옅은 늦가을 볕안개 속으로)
  scene.fog = new THREE.Fog(0xc4cfd8, 140, 1500); // v3-3: 먼 빌딩이 공기 원근으로 옅어진다

  const sun = new THREE.DirectionalLight(0xfff1dc, 3);
  sun.castShadow = high;
  sun.shadow.mapSize.set(2048, 2048);
  // v2: 그림자 상자는 나를 따라다닌다(±45 m) — 가까운 나무 잎 그림자가 또렷하다
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 320 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.05; sun.shadow.radius = 3;
  sun.target.position.set(0, 0, -20);
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x5a4a38, 0.5);
  const HEMI_IN_SKY = new THREE.Color(0xf4e6d0), HEMI_IN_GND = new THREE.Color(0x6e5844), HEMI_OUT_SKY = new THREE.Color(0xcfe3ff), HEMI_OUT_GND = new THREE.Color(0x5a4a38);
  scene.add(hemi);

  // 스테인드글라스·촛불·천장 조명이 공기 중에 번져 보이게(높은 화질에서만 — 휴대폰은 그대로)
  let composer: EffectComposer | null = null;
  // v2: 영화 같은 마무리 — 따뜻한 밝은 곳 · 살짝 차가운 그늘, 가장자리 어둡게(비네트), 아주 옅은 필름 입자, 여는 장면의 위아래 검은 띠
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uBars: { value: 0 }, uAspect: { value: 1 }, uFade: { value: 1 }, uOutdoor: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uTime; uniform float uBars; uniform float uAspect; uniform float uFade; uniform float uOutdoor; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        // v3-3 영화 룩(바깥에서만 세게, 실내는 이전 값 유지): 밝은 곳은 따뜻하게·그늘은 푸르게, 채도·대비·비네팅 조금 더
        c.rgb = mix(c.rgb, c.rgb * mix(vec3(1.035, 1.0, 0.94), vec3(1.05, 1.0, 0.92), uOutdoor), smoothstep(0.45, 1.0, l));
        c.rgb = mix(c.rgb, c.rgb * mix(vec3(0.95, 0.99, 1.05), vec3(0.93, 0.98, 1.07), uOutdoor), 1.0 - smoothstep(0.0, 0.35, l));
        c.rgb = mix(vec3(l), c.rgb, mix(1.06, 1.10, uOutdoor));                       // 채도
        c.rgb = (c.rgb - 0.5) * mix(1.04, 1.09, uOutdoor) + 0.5;                      // 대비(필름 S 자 느낌)
        vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
        c.rgb *= mix(mix(0.74, 0.66, uOutdoor), 1.0, smoothstep(0.95, 0.25, length(q) / max(uAspect, 1.0) * 1.35));
        c.rgb += (hash(vUv * 1024.0 + fract(uTime) * 61.0) - 0.5) * 0.022;
        c.rgb *= uFade;
        if (vUv.y < uBars || vUv.y > 1.0 - uBars) c.rgb = vec3(0.0);
        gl_FragColor = c;
      }`,
  });
  let bloom: UnrealBloomPass | null = null;
  let gtao: GTAOPass | null = null;
  if (high) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // 구석 그늘(앰비언트 오클루전) — 기둥 밑·신자석 사이·벽 모서리에 빛이 덜 드는 자연스러운 그늘(높은 화질에서만)
    gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
    gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    gtao.blendIntensity = 0.85;
    composer.addPass(gtao);
    bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.55, 0.86);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composer.addPass(grade);
  }

  // v2: 자동 해상도 — 잎·풀 같은 투명 무늬가 많은 바깥은 픽셀 수가 곧 속도다. 초당 50 장 아래면 내리고 58 장 넘으면 올린다
  let prAcc = 0, prFrames = 0, prCool = 2;
  function adaptRes(dt: number) {
    if ((window as any).__fixedPR) return; // 영상 촬영 중에는 해상도를 고정한다
    prAcc += dt; prFrames++; prCool -= dt;
    if (prAcc < 1.2) return;
    const fps = prFrames / prAcc; prAcc = 0; prFrames = 0;
    if (prCool > 0) return;
    const cur = renderer.getPixelRatio();
    let next = cur;
    if (fps < 48 && cur > 0.8) next = Math.max(0.8, cur - (fps < 35 ? 0.25 : 0.125));
    else if (fps > 58 && cur < PR_MAX) next = Math.min(PR_MAX, cur + 0.125);
    if (next !== cur) { renderer.setPixelRatio(next); composer?.setPixelRatio(next); prCool = 2.5; }
  }

  const player = new Player();
  const sound = new Sound();

  // ── 내 캐릭터 · 3인칭 카메라(로블록스식) ──
  const me = buildAvatar(avatarOf(myAvatar));
  scene.add(me.root);
  // 순례자의 빛 — 점 한 묶음(그리기 1번). 움직임은 전부 셰이더가 한다
  const lights = createPilgrimLights({ low: touch, pixelRatio: Math.min(PR_MAX, 1.25), viewH: () => innerHeight });
  scene.add(lights.object);
  // 기도의 결계 — 켠 초가 성전 둘레에 겹겹의 빛 고리로 쌓인다(그리기 2번)
  const barrier = createBarrier({ low: touch, pixelRatio: Math.min(PR_MAX, 1.25), viewH: () => innerHeight });
  scene.add(barrier.object);
  const barrierLevel = () => barrier.setLevel(params.has('demo') ? 100 : Math.max(saved?.total ?? 0, space ? space.candles.filter((c) => c.lit).length : 0));
  const flamePos = new THREE.Vector3();
  // ── 시험용 보기(?demo): 가짜 초 100개·가짜 기도 100개. 기기 안에서만 그리고 아무것도 저장·전송하지 않는다 ──
  let demoTick: ((t: number) => void) | null = null;
  function startDemo() {
    if (demoTick || !params.has('demo')) return;
    const prayers = fakePrayers(100);
    barrier.setLevel(100); lights.demoFill(10, demoBigColors);
    const pf = createPrayerFloat({ count: touch ? 6 : 9, prayers });
    scene.add(pf.group); pf.stagger(0);
    const fwd = new THREE.Vector3();
    demoTick = (t) => { fwd.set(-Math.sin(bodyYaw), 0, -Math.cos(bodyYaw)); pf.update(t, player.pos, fwd); };
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:8px;right:8px;top:64px;z-index:40;display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:10px;background:rgba(20,14,6,.78);color:#ffe6a8;font:600 12px/1.4 system-ui,sans-serif;border:1px solid rgba(255,214,128,.5)';
    bar.innerHTML = '<span>🧪 시험용 — 가짜 초 100개 · 가짜 기도 100개 (실제 글이 아닙니다)</span><button style="all:unset;cursor:pointer;padding:6px 10px;border-radius:8px;background:#d4a017;color:#2a1c04;font-weight:700;white-space:nowrap">🔭 하늘 보기</button>';
    document.body.append(bar);
    const btn = bar.querySelector('button')!; let sky = false;
    btn.addEventListener('click', () => {
      sky = !sky; btn.textContent = sky ? '🚶 돌아오기' : '🔭 하늘 보기';
      (window as any).__cam = sky ? { p: [2, 62, 86], t: [0.5, 14, 11] } : undefined;
    });
    let n = 0; // 4.5초마다 누군가 초를 켠다 — 솟는 빛 · 고리 틈 · 이음을 계속 볼 수 있게
    setInterval(() => {
      const p = prayers[n++ % prayers.length];
      barrier.pulse(flamePos.set(0.5 + (Math.random() - 0.5) * 10, 1, 11 + Math.random() * 14));
      toast(`🕯 ${p.who} 님이 초를 켰습니다 — ${p.text}`);
    }, 4500);
  }
  const lightsAt = new THREE.Vector3(), lightsFwd = new THREE.Vector3();
  const grantLight = (spaceId: string) => {
    if (lights.award(spaceId)) toast(`✨ ${SANCTUARY_LIGHTS[spaceId]?.name ?? '새 빛'}이 순례자를 따라나섭니다`);
  };
  // v3-8 포인트: 내 머리 위에 이름, 그 위에 포인트를 크게. 화면 오른쪽 위에도 작은 칩(1인칭일 때 머리 위가 안 보이므로)
  const points = new Points();
  const myTag = document.createElement('div'); myTag.className = 'tag';
  const ptsEl = document.createElement('div'); ptsEl.className = 'pts';
  const nickEl = document.createElement('div'); nickEl.className = 'nick'; nickEl.textContent = myName;
  myTag.append(ptsEl, nickEl);
  const myTagObj = new CSS2DObject(myTag); myTagObj.position.set(0, 2.15, 0); me.root.add(myTagObj);
  const chip = document.createElement('div'); chip.id = 'pointsChip'; document.body.append(chip);
  const showPoints = () => { ptsEl.textContent = `⭐ ${points.total}`; chip.textContent = `⭐ ${points.total} 포인트`; };
  showPoints();
  points.onChange = (_t, gained) => {
    showPoints();
    ptsEl.classList.remove('bump'); void ptsEl.offsetWidth; ptsEl.classList.add('bump');
    const pop = document.createElement('div'); pop.className = 'pts-pop'; pop.textContent = `+${gained}`; myTag.append(pop); setTimeout(() => pop.remove(), 1700);
  };
  /** 한 번만 오르는 미션 — 처음이면 포인트와 안내 */
  const award = (key: string, pts: number, label: string) => { if (points.award(key, pts)) toast(`⭐ +${pts} 포인트 — ${label}`); };
  let camDist = touch ? 4.4 : 5.0;       // 0.7 아래면 1인칭
  // ── 두 손가락 확대·축소(2026-11-24 사장님: 휴대폰 사진 보듯이) ──
  // 두 손가락을 모으면 멀어져(camDist 증가) 11 m 를 넘는 순간부터 카메라가 하늘로 올라 성당과 계단 «전체 그림» 으로, 벌리면 다시 내려와 캐릭터에게 초점이 모인다.
  // 11 m 까지는 전과 같은 어깨 뒤 따라가기다. 확정된 조작이다(성지만들기 스킬 6-2) — 성지가 바뀌어도 같게: 전체 그림의 중심·높이만 그 성지 크기에 맞춘다.
  const CAM_CHASE_MAX = 11, CAM_OVER = 60;
  const OV_CENTER = new THREE.Vector3(0.5, 0, 11), OV_H = 118, OV_PITCH = (78 * Math.PI) / 180; // 성당(z 7 ~ -52)과 계단(z 70)까지 세로로 다 들어오는 높이
  const ovPos = new THREE.Vector3(OV_CENTER.x, OV_CENTER.y + OV_H * Math.sin(OV_PITCH), OV_CENTER.z + OV_H * Math.cos(OV_PITCH));
  const ovQuat = (() => { const o = new THREE.PerspectiveCamera(); // 카메라여야 -Z 쪽을 바라본다(Object3D 는 +Z)
    o.position.copy(ovPos); o.lookAt(OV_CENTER); return o.quaternion.clone(); })();
  const youRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.3, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd678, transparent: true, opacity: 0.95, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  youRing.renderOrder = 9; youRing.visible = false; scene.add(youRing);
  let bodyYaw = 0, mySpeed = 0;
  const lastPos = new THREE.Vector3();
  let moveTarget: THREE.Vector3 | null = null, moveStuck = 0;
  let moveWps: THREE.Vector3[] = []; // 길 찾기로 정한 중간 지점들(벽을 돌아가는 길) — moveTarget 은 그중 지금 가는 곳
  let nav: Nav | null = null;
  let pendingAct: { ia: Interactable; hit: THREE.Intersection } | null = null;
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.42, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }));
  marker.visible = false; marker.renderOrder = 5; scene.add(marker);
  const camRay = new THREE.Ray();
  const firstPerson = () => camDist < 0.7 || player.gliding; // 앉아 있어도 3인칭 — 앉아 기도하는 모습이 보이게(사장님 2026-11-25)
  sound.init(camera);
  // 입장 단추를 누르지 않고 들어오면(다시 온 사람) 브라우저가 소리를 막는다 — 첫 손짓(누름·키)에서 소리를 켠다
  const unlockSound = () => { sound.unlock(); removeEventListener('pointerdown', unlockSound, true); removeEventListener('keydown', unlockSound, true); removeEventListener('touchend', unlockSound, true); };
  addEventListener('pointerdown', unlockSound, true); addEventListener('keydown', unlockSound, true); addEventListener('touchend', unlockSound, true);
  $('btnMe')?.addEventListener('click', () => { const u = new URL(location.href); u.searchParams.set('entry', '1'); location.href = u.toString(); });

  let space: SpaceBuild | null = null;
  let site: SiteData | null | undefined;
  let spaceLoading = false;
  let outdoor = 1;
  const reactCounts = new Map<string, number>();
  const patches: { mesh: THREE.Mesh; w: SpaceBuild['windows'][number] }[] = [];
  const patchGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  // 햇살 빛줄기 — 창마다 교차한 두 장의 판(어느 방향에서 봐도 부피가 있어 보이게)
  const beams: { group: THREE.Group; mat: THREE.MeshBasicMaterial; w: SpaceBuild['windows'][number] }[] = [];
  const beamGeo = new THREE.PlaneGeometry(1, 1);
  const beamTex = lightBeam();
  const poolTex = [1, 2, 3, 4].map((k) => glassPool(k * 29));
  const UP = new THREE.Vector3(0, 1, 0);
  let sunDir = new THREE.Vector3(0, 1, 0), sunStrength = 1;
  // 저장되는 봉헌초(F2) — 7일 동안 남는 초. savedIds 는 저장된 초를 보여 주려고 켜 둔 자리(실시간 방이 끄지 않게)
  let saved: CandleSummary | null = null;
  let loggedIn = false;
  const savedIds = new Set<string>();

  // ── 실시간 ──
  const net = new Net(scene, {
    onCount: (n) => setPeople(n),
    onDoor: () => { /* v2: 문은 각자 연다 — 서버의 문 상태는 따르지 않는다 */ },
    onCandle: (id, c) => applyCandle(id, c.lit, c.phrase, c.by, false, c.text ?? ''),
    onReactCount: (key, n) => { reactCounts.set(key, n); if (cardArt) renderArtActions(cardArt); },
    onBell: () => ringBell(),
    onReact: (art, kind, from) => { if (from !== net.sessionId) popAtArt(art, REACT_LABEL[kind as keyof typeof REACT_LABEL] ?? kind); },
    onSay: (from, idx) => {
      const text = GREETINGS[idx] ?? '';
      if (from === net.sessionId) return;
      net.avatarOf(from)?.say(text);
    },
    onStatus: (s) => { status = s; setPeople(lastCount); },
  });
  let status: 'online' | 'offline' | 'connecting' = 'connecting';
  let lastCount = 1;
  function setPeople(n: number) {
    lastCount = n;
    $('people').textContent = status === 'online' ? (n > 1 ? `${n}명 함께 보는 중` : '지금은 혼자 · 실시간 연결됨') : status === 'connecting' ? '연결 중…' : '혼자 보기 (실시간 연결 안 됨)';
  }

  // ── 공간 불러오기 ──
  async function loadSpace(id: SpaceId) {
    if (spaceLoading) return;
    spaceLoading = true;
    // 짓는 동안 화면이 멈추므로 먼저 «준비 중» 을 그리게 한 프레임을 넘긴다(옛 공간은 아직 그대로라 그 사이 한 번 그려져도 안전하다)
    $('loading').hidden = false;
    await new Promise<void>((done) => requestAnimationFrame(() => setTimeout(done, 0)));
    closeCard(); stopTour(); bellGameClose?.(); riteClose?.(); endRinging(); endCross(false); quest = 'none'; setGuide(null); askHide(); askKind = null; maryAsked = false; wasInside = false; guideTried = false; prayUntil = 0; me.pray = false;
    if (space) {
      scene.remove(space.root);
      sound.setOrgan(null);
      disposeTree(space.root);
      space.bvh.geometry.dispose();
    }
    for (const p of patches) { scene.remove(p.mesh); (p.mesh.material as THREE.Material).dispose(); }
    patches.length = 0;
    for (const b of beams) { scene.remove(b.group); b.mat.dispose(); }
    beams.length = 0;
    reactCounts.clear();

    const M = makeMaterials();
    if (id === 'cathedral' && site === undefined) {
      try { site = await loadSite(`${import.meta.env.BASE_URL}site/myeongdong.json`); } catch (e) { console.warn('[site] 구내 지도를 불러오지 못했다', e); site = null; }
    }
    space = id === 'cathedral' ? buildCathedral(M, site, { light: !high }) : buildChapel(M);
    scene.add(space.root);
    nav = new Nav(space.bvh); // 눌러서 걸을 때 벽을 피해 길을 찾는다
    simplifyOutdoor(space.root); // 바깥 둘레를 단순하게(simplify.ts, ?full 이면 그대로)
    // 쓸 수 있는 것 머리 위에 떠 있는 표지(포켓몬·로블록스처럼 «여기서 무엇을 할 수 있는지» 바로 보이게). 누르면 걸어가서 쓴다
    for (const b of badges) scene.remove(b.o);
    badges.length = 0;
    for (const ia of space.interactables) {
      const text = ia.badge ?? (ia.kind === 'door' ? '🚪 문 열기' : ia.kind === 'bell' ? '🔔 종 울리기' : ia.kind === 'portal' ? `➡️ ${ia.title}` : null);
      if (!text) continue;
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'badge'; el.textContent = text;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const d = ia.anchor.distanceTo(player.pos.clone().setY(player.pos.y + 1));
        const hit = { ia, hit: { distance: d } as THREE.Intersection };
        if (d < 3.0) act(hit); else { pendingAct = hit; setMoveTarget(ia.anchor.clone().setY(player.pos.y)); }
      });
      const wrap = document.createElement('div'); wrap.append(el); // CSS2D 가 바깥 상자의 transform 을 쓰므로 흔들림은 안쪽에
      const o = new CSS2DObject(wrap);
      o.position.copy(ia.anchor).add(new THREE.Vector3(0, ia.kind === 'door' ? 1.6 : 0.9, 0));
      scene.add(o);
      badges.push({ o, el, ia });
    }
    // 설명대 위 홀로그램 — 앞에 서면 글자가 공중에 떠오른다
    for (const h of holos) scene.remove(h.o);
    holos.length = 0;
    for (const ia of space.interactables) {
      if (ia.kind !== 'info' || !ia.body) continue;
      const el = document.createElement('div');
      el.className = 'holo';
      const sm = /^station(\d+)$/.exec(ia.id);
      const t = document.createElement('div'); t.className = 'holo-title'; t.textContent = ia.title;
      const b = document.createElement('div'); b.className = 'holo-body'; b.textContent = sm ? `${STATION_SCENES[Number(sm[1])] ?? ''}\n\n${STATION_VERSICLE}` : ia.body;
      const x = document.createElement('button'); x.type = 'button'; x.className = 'holo-close'; x.textContent = '닫기';
      el.append(t, b, x);
      const wrap = document.createElement('div'); wrap.append(el);
      const o = new CSS2DObject(wrap);
      o.position.copy(ia.anchor).add(new THREE.Vector3(0, 1.15, 0));
      o.visible = false;
      scene.add(o);
      const hh = { o, el, ia, on: false } as (typeof holos)[number];
      x.addEventListener('click', (e) => { e.stopPropagation(); for (const h of holos) if (h === hh || Math.hypot(h.ia.anchor.x - player.pos.x, h.ia.anchor.z - player.pos.z) < 4) hideHolo(h); }); // 닫기 — 그 옆을 떠났다 다시 올 때까지 뜨지 않는다
      holos.push(hh);
    }
    // 같은 자리에 겹쳐 서지 않게 출발점을 조금씩 흩는다
    player.place(space.spawn.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 2)), space.spawn.yaw);
    player.pitch = -0.28; // 3인칭은 어깨 너머로 조금 내려다본다(앞 덤불에 가리지 않게)
    bodyYaw = space.spawn.yaw;
    space.windows.forEach((w, i) => {
      // 바닥에 떨어지는 색 — 한 가지 색이 아니라 여러 색유리 조각이 번진 모자이크
      const mat = new THREE.MeshBasicMaterial({ map: poolTex[i % poolTex.length], color: new THREE.Color(1, 1, 1).lerp(w.color, 0.25), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      const mesh = new THREE.Mesh(patchGeo, mat);
      mesh.renderOrder = 2;
      scene.add(mesh);
      patches.push({ mesh, w });
      // 공기 중의 빛줄기 — 따뜻한 햇빛에 유리 색이 살짝 섞인다
      const bmat = new THREE.MeshBasicMaterial({ map: beamTex, color: new THREE.Color(0xffe6b8).lerp(w.color, 0.45), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false });
      const group = new THREE.Group();
      const a = new THREE.Mesh(beamGeo, bmat), b = new THREE.Mesh(beamGeo, bmat);
      b.rotation.y = Math.PI / 2;
      a.renderOrder = b.renderOrder = 3;
      group.add(a, b);
      group.visible = false;
      scene.add(group);
      beams.push({ group, mat: bmat, w });
    });
    updatePatches();
    if (space.organPos) sound.setOrgan(space.root, space.organPos);
    $('spaceTitle').textContent = space.title;
    $<HTMLAnchorElement>('btnBack').href = mainHref(siteHref(id));
    $('attrib').textContent = space.attribution ?? '';
    $('attrib').hidden = !space.attribution;
    // space 만 바꾸고 다른 쿼리(?from=site 등)와 해시는 그대로 둔다
    const u = new URL(location.href); u.searchParams.set('space', id);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
    spaceLoading = false;
    // 새 공간의 첫 화면이 그려진 다음(두 프레임 뒤)에 «준비 중» 을 지운다
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!spaceLoading) $('loading').hidden = true;
      if (enterAt && params.has('time')) { toast(`입장에 ${((performance.now() - enterAt) / 1000).toFixed(1)}초 걸렸습니다`); enterAt = 0; }
    }));
    savedIds.clear(); saved = null;
    // 결계의 중심·크기: 명동은 성당 한가운데·반지름 60 m, 그 밖은 출발점 둘레 28 m
    if (id === 'cathedral') barrier.setSite(new THREE.Vector3(0.5, 0, 11), 60); else barrier.setSite(space.spawn.pos.clone().setY(space.spawn.pos.y), 28);
    barrierLevel(); startDemo();
    void refreshSaved(id, true);
    await net.join(id, nick);
  }

  // ── 저장되는 봉헌초 ──
  async function refreshSaved(id: SpaceId, greet: boolean) {
    const siteId = SPACES[id].siteId;
    if (!siteId) return;
    const [sum, li] = await Promise.all([fetchSummary(siteId), isLoggedIn()]);
    if (space?.id !== id) return;
    saved = sum; loggedIn = li;
    barrierLevel();
    if (!sum) return;
    // 뒤쪽 자리부터 저장된 초를 켠다 — 실시간으로 새로 켜는 초는 앞쪽 빈자리를 쓴다
    const slots = [...space.candles].reverse();
    for (const r of sum.recent) {
      const slot = slots.find((c) => !c.lit && !savedIds.has(c.id));
      if (!slot) break;
      savedIds.add(slot.id);
      applyCandle(slot.id, true, r.intention, `${r.display_name}${r.country ? ' ' + flag(r.country) : ''}`, true);
    }
    if (greet && sum.my_expires_at) toast(`${space.title.split(' ')[0]}의 내 초 · ${daysLeft(sum.my_expires_at)}일 남음`);
    if (cardKind === 'candle') openCandleCard();
  }

  // ── 시간(해 방향) ──
  const hourInput = $<HTMLInputElement>('hour');
  const kstHour = (new Date().getUTCHours() + 9) % 24 + new Date().getUTCMinutes() / 60;
  // 처음은 늦가을 한낮(13시) — 단풍이 절정인 11월의 따뜻한 햇살. 시계(kstHour)는 슬라이더로 언제든 바꿀 수 있다
  void kstHour;
  hourInput.value = '13';
  function setHour(h: number) {
    const k = (h - 6) / 13;
    // 서울 11월 초 남중 고도 약 35° — 해가 낮아 창으로 드는 빛줄기가 길고 비스듬하다
    const el = Math.max(0.035, Math.sin(Math.PI * k)) * THREE.MathUtils.degToRad(36);
    const az = Math.PI * k;
    sunDir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), 0.55 * Math.sin(az) * Math.cos(el)).normalize();
    su.sunPosition.value.copy(sunDir);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 150);
    envDirty = true;
    sunStrength = THREE.MathUtils.smoothstep(Math.sin(el), 0.03, 0.3);
    sun.color.setHSL(0.085, 0.72, 0.55 + 0.38 * sunStrength);
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    $('hourLabel').textContent = `${hh}:${String(mm).padStart(2, '0')}`;
    updatePatches();
  }
  hourInput.addEventListener('input', () => setHour(Number(hourInput.value)));

  /** 창으로 든 햇빛이 바닥에 남기는 색 무늬 */
  function updatePatches() {
    if (!space) return;
    const d = sunDir.clone().negate();
    for (const { mesh, w } of patches) {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (d.y > -0.05 || d.dot(w.inward) < 0.08) { mesh.visible = false; continue; }
      const t = (space.floorY + 0.03 - w.pos.y) / d.y;
      const p = w.pos.clone().addScaledVector(d, t);
      if (space.interior && !space.interior.containsPoint(p.clone().setY(space.floorY + 0.5))) { mesh.visible = false; continue; }
      mesh.visible = true;
      mesh.position.copy(p);
      const len = Math.min(5, 1.6 / Math.max(0.25, -d.y));
      mesh.scale.set(1.5, 1, len);
      mesh.rotation.y = Math.atan2(d.x, d.z);
      mat.opacity = 1.0 * sunStrength; // 바닥에 떨어진 색유리 빛도 또렷하게
    }
    for (const { group, mat, w } of beams) {
      if (d.y > -0.05 || d.dot(w.inward) < 0.08) { group.visible = false; continue; }
      const t = (space.floorY + 0.03 - w.pos.y) / d.y;
      const end = w.pos.clone().addScaledVector(d, t);
      if (space.interior && !space.interior.containsPoint(end.clone().setY(space.floorY + 0.5))) { group.visible = false; continue; }
      const len = w.pos.distanceTo(end);
      group.visible = true;
      group.position.copy(w.pos).add(end).multiplyScalar(0.5);
      group.quaternion.setFromUnitVectors(UP, w.pos.clone().sub(end).normalize());
      const width = 1.25;
      group.scale.set(width, len, width);
      // 빛이 비스듬할수록 길고 옅게
      mat.opacity = 0.33 * sunStrength * THREE.MathUtils.clamp(-d.y * 1.6, 0.5, 1); // 빛줄기를 진하게(사장님 확정: 더 진하게)
    }
  }

  // ── 상호작용 ──
  const raycaster = new THREE.Raycaster();
  raycaster.far = 4;
  let target: { ia: Interactable; hit: THREE.Intersection } | null = null;
  const badges: { o: CSS2DObject; el: HTMLButtonElement; ia: Interactable }[] = [];
  const holos: { o: CSS2DObject; el: HTMLDivElement; ia: Interactable; on: boolean; hidden?: boolean; md?: number; hx?: number; hz?: number }[] = [];
  const hideHolo = (h: (typeof holos)[number]) => { h.hidden = true; h.hx = player.pos.x; h.hz = player.pos.z; };
  let candleGroup: string[] | null = null, candleTitle = '봉헌초';
  // v3-6 놀이 덧판(열려 있으면 닫는 함수) · 내가 직접 쓴 기도(예전 방 서버는 글을 돌려주지 않으므로 내 화면에서는 여기서 보충한다)
  let bellGameClose: (() => void) | null = null, riteClose: (() => void) | null = null;
  const myTexts = new Map<string, string>();
  const candleLabel = (c: { phrase: number; text?: string }) => c.text || INTENTIONS[c.phrase] || '';

  // ── v3-7 종지기 놀이 상태 · 순례 안내(종 → 성수 → 봉헌초 또는 십자가의 길 14처) ──
  let ringing = false;                                         // 종 줄을 잡으러 가는 중이거나 잡고 있는 동안: 걷기 막고 옆에서 본다
  let camFix: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;
  let arrive: (() => void) | null = null;                      // 클릭 걷기로 자리에 닿으면 부른다
  // ── 성수 찍기 = 캐릭터의 손동작(2026-11-24 사장님): 성수대 앞에 서서 손끝을 성수에 담그고 이마 → 가슴 → 왼쪽 어깨 → 오른쪽 어깨를 짚는다.
  //    따로 누르는 창은 없다. 동작이 끝나야 성수를 찍은 것으로 친다(포인트·다음 안내). 걷기·다른 누르기는 동작 중 막는다 ──
  let crossing = false, crossBeat = 0;
  const sparks: { m: THREE.Mesh; age: number }[] = [];
  const CROSS_WORDS = ['성수에 손끝을 적십니다', '성부와', '성부와 성자와', '성부와 성자와 성령의', '성부와 성자와 성령의 이름으로 아멘'];
  function spark(at: THREE.Vector3) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd678, transparent: true, opacity: 0.9, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    m.position.copy(at); m.renderOrder = 10; scene.add(m); sparks.push({ m, age: 0 });
  }
  function endCross(finished: boolean) {
    if (!crossing) return;
    crossing = false; camFix = null; me.gesture = undefined; me.body.rotation.x = 0; $('caption').hidden = true;
    space?.fx?.ropeGrab?.(null); // 종 줄은 늘 제자리로
    if (finished) {
      toast('십자성호를 그었습니다 — 성부와 성자와 성령의 이름으로. 아멘');
      setTimeout(() => award('font', PTS.font, '성수를 찍고 십자성호'), 900);
      setTimeout(() => offerNext(), 1700);
    }
  }
  /** 성수대 앞에 서서 시작 — 몸을 성수대 쪽으로 돌리고(서 있을 자리까지 조금 더 다가간 뒤), 손이 보이게 비스듬히 앞에서 비춘다 */
  let crossStarted = false;
  const crossStand = new THREE.Vector3();
  function beginCross(anchor: THREE.Vector3) {
    if (crossing || !space) return;
    closeCard(); stopTour(); moveTarget = null; pendingAct = null; marker.visible = false; askHide();
    if (player.sitting) player.stand();
    crossing = true; crossBeat = 0; crossStarted = false; joy.set(0, 0);
    // 서 있을 자리: 성수대 중심에서 0.76 m(몸 반지름 0.32 + 그릇 반지름 0.37 + 여유) — 걸어서 닿는 오차(0.3 m)를 여기서 마저 메운다
    const dx = anchor.x - player.pos.x, dz = anchor.z - player.pos.z, d = Math.hypot(dx, dz) || 1;
    crossStand.set(anchor.x - (dx / d) * 0.76, player.pos.y, anchor.z - (dz / d) * 0.76);
    bodyYaw = Math.atan2(-dx, -dz);
    me.root.rotation.y = bodyYaw;
  }
  function startCrossNow() {
    if (!space) return;
    crossStarted = true;
    const head = player.pos.clone().setY(player.pos.y + 1.4 * me.def.scale);
    const f = new THREE.Vector3(-Math.sin(bodyYaw), 0, -Math.cos(bodyYaw));
    // 손동작이 잘 보이는 자리 — 앞 오른쪽·앞 왼쪽·옆·뒤 순으로, 벽에 막히지 않는 첫 자리
    for (const deg of [50, -50, 90, -90, 135, 180]) {
      const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
      const dir = new THREE.Vector3(f.x * c - f.z * sn, 0, f.x * sn + f.z * c);
      const pos = head.clone().addScaledVector(dir, 2.0).setY(player.pos.y + 1.55);
      const to = pos.clone().sub(head), len = to.length();
      camRay.origin.copy(head); camRay.direction.copy(to).normalize();
      const hit = space.bvh.raycastFirst(camRay, THREE.DoubleSide);
      if (!hit || hit.distance > len + 0.3) { camFix = { pos, target: player.pos.clone().setY(player.pos.y + 1.05 * me.def.scale) }; break; }
    }
    startGesture(me, 'cross');
  }
  function driveCross(dt: number) {
    if (!crossStarted) {
      const dx = crossStand.x - player.pos.x, dz = crossStand.z - player.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.03) { const st = Math.min(d, 1.4 * dt); player.pos.x += (dx / d) * st; player.pos.z += (dz / d) * st; return; }
      startCrossNow();
    }
    const u = crossProgress(me);
    if (u === null || u >= 0.999) { endCross(true); return; }
    while (crossBeat < CROSS_BEATS.length && u >= CROSS_BEATS[crossBeat]) {
      if (crossBeat === 0) { sound.play('drop', 0.7); space?.fx?.fontDip?.(); } else sound.ting();
      me.root.updateMatrixWorld(true); spark(me.handR.getWorldPosition(new THREE.Vector3()));
      $('caption').hidden = false; $('caption').textContent = CROSS_WORDS[crossBeat];
      crossBeat++;
    }
  }
  let quest: 'none' | 'mary' | 'bell' | 'font' | 'choose' | 'candle' | 'stations' | 'done' = 'none';
  let stationK = 0, stationShown = -1;
  const handA = new THREE.Vector3(), handB = new THREE.Vector3();
  const questEl = document.createElement('div'); questEl.id = 'quest'; questEl.hidden = true; $('hud').append(questEl);
  const beaconEl = document.createElement('div'); beaconEl.className = 'beacon';
  const beacon = new CSS2DObject(beaconEl); beacon.visible = false; scene.add(beacon);
  /** 다음 할 일을 화면 위(HUD)와 그 자리 위에 뜨는 금빛 표지로 알려 준다 */
  function setGuide(pos: THREE.Vector3 | null, text = '') {
    beacon.visible = !!pos;
    if (pos) { beacon.position.copy(pos).setY(pos.y + 0.9); beaconEl.textContent = `▼ ${text}`; }
    questEl.hidden = !text; questEl.textContent = text ? `다음 · ${text}` : '';
  }
  const anchorOf = (f: (ia: Interactable) => boolean) => space?.interactables.find(f)?.anchor ?? null;
  const stationAnchor = (k: number) => anchorOf((ia) => ia.id === `station${k}`);
  /** 여러 자리를 차례로 걸어간다(막히면 거기서 멈춘다 — 벽은 뚫지 않는다) */
  function walkVia(pts: THREE.Vector3[], done: () => void) {
    const step = (i: number) => {
      if (i >= pts.length) { done(); return; }
      arrive = () => step(i + 1);
      setMoveTarget(pts[i]);
    };
    step(0);
  }
  function startStations() {
    quest = 'stations'; stationK = 0; stationShown = -1;
    const a = stationAnchor(0);
    setGuide(a, `십자가의 길 제1처 — ${STATION_NAMES[0]}`);
    if (!a) return;
    // 제1처 앞으로 저절로 걸어가 선다: 중앙 통로로 들어서 → 제1처와 같은 높이까지 → 옆 측랑으로 → 벽 앞 1 m
    const mid = new THREE.Vector3(0, player.pos.y, a.z), stand = new THREE.Vector3(a.x - 1.0, player.pos.y, a.z);
    toast('제1처 앞으로 걸어갑니다 — 움직이면 멈춥니다');
    walkVia([new THREE.Vector3(0, player.pos.y, player.pos.z), mid, stand], () => {});
  }
  /** 제k처 앞에 도착했다 — 카드는 열지 않는다(설명은 공중에 뜨는 글 하나뿐). 포인트를 주고 다음 처로 안내한다 */
  function reachStation(k: number) {
    stationShown = k;
    const total = STATION_NAMES.length;
    award(`station${k}`, PTS.station, `제${k + 1}처에 이르렀습니다`);
    if (k >= total - 1) {
      award('stations-all', PTS.allStations, '십자가의 길 열다섯 처를 모두 걸었습니다');
      quest = 'candle'; setGuide(anchorOf((ia) => ia.kind === 'candle' && ia.title.includes('제대')), '제대 앞 봉헌초 — 초를 하나 켜고 기도를 고르세요'); toast('십자가의 길을 다 걸었습니다 🙏 마지막으로 제대 앞에서 초를 봉헌해 보세요');
      return;
    }
    stationK = k + 1; setGuide(stationAnchor(stationK), `십자가의 길 제${stationK + 1}처 — ${STATION_NAMES[stationK]}`);
  }

  // ══ 순례 순서 안내 (사장님 2026-11-25) ══
  // ① 야외: 화면을 4초 안 누르면 캐릭터가 성모상 앞으로 가서 선다 → 기도 · 봉헌초 · 다음으로
  // ② 종: «성당 안으로 들어가 종을 울려 볼까요?» (건너뛰거나 닫으면 ③ 으로, 안내를 안 누르고 직접 종을 울려도 끝나면 ③ 으로)
  // ③ 성수대 앞으로 가서 성수 찍기(손동작) → ④ 십자가의 길 / 제대 앞 초 가운데 고르면 그곳으로 걸어가 선다 → ⑤ 자유 → ⑥ 밖으로 나오면 새 빛
  const GUIDE_IDLE_MS = 4000; // 이 시간 동안 아무것도 안 누르면 안내가 시작한다(느린 기기에서도 실제 시간으로 잰다)
  let guideIdle = 0, guideTried = false, maryAsked = false, wasInside = false, prayUntil = 0, askKind: 'mary' | 'bell' | null = null;
  const doorIa = () => space?.interactables.find((i) => i.kind === 'door');
  const grottoIa = () => space?.interactables.find((i) => i.kind === 'candle' && i.title.includes('성모'));
  const altarIa = () => space?.interactables.find((i) => i.kind === 'candle' && i.title.includes('제대'));
  const bellIa = () => space?.interactables.find((i) => i.kind === 'bell');
  const fontIa = () => space?.interactables.find((i) => i.kind === 'font');
  // 누르지 않아도 되는 안내줄(창이 아니다 — 뒤 화면을 그대로 보며 안내를 무시하고 직접 움직여도 된다)
  const askEl = document.createElement('div'); askEl.id = 'askBar'; askEl.hidden = true; $('hud').append(askEl);
  function askBar(text: string, buttons: { label: string; on: () => void }[], onDismiss?: () => void) {
    askEl.replaceChildren();
    const p = document.createElement('p'); p.textContent = text; askEl.append(p);
    const row = document.createElement('div'); row.className = 'ask-row';
    for (const b of buttons) { const el = document.createElement('button'); el.type = 'button'; el.textContent = b.label; el.addEventListener('click', () => { askEl.hidden = true; b.on(); }); row.append(el); }
    const x = document.createElement('button'); x.type = 'button'; x.className = 'ask-x'; x.textContent = '닫기'; x.setAttribute('aria-label', '닫기');
    x.addEventListener('click', () => { askEl.hidden = true; onDismiss?.(); });
    row.append(x); askEl.append(row); askEl.hidden = false;
  }
  const askHide = () => { askEl.hidden = true; };
  /** 성당 밖(정문 앞)에 있으면 정문을 지나 안으로 들어간 뒤 done 을 부른다 */
  function goInside(done: () => void) {
    const d = doorIa();
    if (!d || player.pos.z < d.anchor.z + 0.8) { done(); return; }
    walkVia([new THREE.Vector3(d.anchor.x, player.pos.y, d.anchor.z + 3.2), new THREE.Vector3(d.anchor.x, player.pos.y, d.anchor.z - 2.4)], done);
  }
  /** 물건 앞 dist m 에 서서(물건을 바라보며) 닿으면 done */
  function standBefore(ia: Interactable, dist: number, done: () => void) {
    const dx = ia.anchor.x - player.pos.x, dz = ia.anchor.z - player.pos.z, d = Math.hypot(dx, dz) || 1;
    const stand = new THREE.Vector3(ia.anchor.x - (dx / d) * dist, player.pos.y, ia.anchor.z - (dz / d) * dist);
    if (Math.hypot(stand.x - player.pos.x, stand.z - player.pos.z) < 0.4) { done(); return; }
    arrive = done; setMoveTarget(stand);
  }
  const faceTo = (p: THREE.Vector3) => { bodyYaw = Math.atan2(-(p.x - player.pos.x), -(p.z - player.pos.z)); };

  function startGuide() {
    quest = 'mary'; maryAsked = false; guideIdle = performance.now();
    const g = grottoIa(); if (!g) { nextBell(); return; }
    setGuide(g.anchor, '성모상 — 성모님께 인사드리고 기도해 보세요');
  }
  function goMary() {
    const g = grottoIa(); if (!g) { nextBell(); return; }
    guideIdle = Infinity; toast('성모상 앞으로 갑니다 — 움직이면 멈춥니다');
    standBefore(g, 1.8, maryArrive);
  }
  function maryArrive() {
    if (maryAsked || quest !== 'mary') return;
    maryAsked = true; const g = grottoIa(); if (g) faceTo(g.anchor);
    setGuide(null);
    askBar('성모님 앞입니다. 잠시 기도하거나 봉헌초를 올려 보세요.', [
      { label: '🕯️ 봉헌초 올리기', on: () => { const g2 = grottoIa(); if (!g2) return nextBell(); candleGroup = g2.group ?? null; candleTitle = g2.title; openCandleCard(); askKind = 'mary'; } },
      { label: '🙏 잠시 기도하기', on: () => { prayUntil = performance.now() + 4200; setTimeout(() => nextBell(), 4400); } },
      { label: '다음으로', on: () => nextBell() },
    ], () => nextBell());
  }
  function nextBell() {
    askKind = null; if (quest === 'font' || quest === 'choose' || quest === 'candle' || quest === 'stations' || quest === 'done') return;
    quest = 'bell'; const b = bellIa();
    if (!b) { nextFont(); return; }
    setGuide(b.anchor, '종 — 성당 안으로 들어가 종 줄을 당겨 보세요');
    askBar('성당 안으로 들어가 종을 울려 볼까요? (닫으면 성수 찍기로 갑니다)', [
      { label: '🔔 종 울리러 가기', on: () => { setGuide(null); goInside(() => act({ ia: b, hit: { distance: 1 } as THREE.Intersection })); } },
      { label: '건너뛰기', on: () => nextFont() },
    ], () => nextFont());
  }
  /** 성수대 앞으로 걸어가 성수 찍기(손동작)를 한다 — 끝나면 기존대로 «십자가의 길 / 제대 앞 초» 선택이 뜬다 */
  function nextFont() {
    askHide(); askKind = null; if (points.has('font')) { offerNext(); return; }
    quest = 'font'; const f = fontIa();
    if (!f) { offerNext(); return; }
    setGuide(f.anchor, '성수대 — 성수를 찍고 십자성호를 긋습니다');
    // 정문을 지나 중앙 통로 쪽으로 들어온 뒤, 성수대 옆(통로 쪽)까지 와서 성수대 앞에 선다 — 신랑의 긴 의자를 비스듬히 가로지르지 않게
    goInside(() => walkVia([new THREE.Vector3(f.anchor.x + (f.anchor.x > 0 ? -2.4 : 2.4), player.pos.y, f.anchor.z + 1.5)], () => act({ ia: f, hit: { distance: 1 } as THREE.Intersection })));
  }
  /** 제대 앞 봉헌대 앞으로 걸어가 서면 봉헌초 카드를 연다 */
  function goAltarCandle() {
    const a = altarIa(); if (!a) return;
    quest = 'candle'; setGuide(a.anchor, '제대 앞 봉헌초 — 초를 하나 켜고 기도를 고르세요');
    // 긴 의자를 가로지르지 않게 중앙 통로로 나가 제대 앞까지 곧게 걸은 뒤 봉헌대 앞에 선다
    const y = player.pos.y;
    goInside(() => walkVia([new THREE.Vector3(0, y, player.pos.z), new THREE.Vector3(0, y, a.anchor.z + 2.6)], () => standBefore(a, 1.5, () => { faceTo(a.anchor); candleGroup = a.group ?? null; candleTitle = a.title; openCandleCard(); })));
  }
  /** 밖으로 나오는 순간: 순례를 마쳤으면 이 성지의 큰 빛 한 개를 받는다 */
  function checkExit() {
    if (!space || space.id !== 'cathedral') return;
    const inside = !!space.interior && space.interior.containsPoint(player.pos);
    if (inside) { wasInside = true; return; }
    if (!wasInside) return;
    wasInside = false;
    const complete = points.has('font') && (points.has('candle-altar') || points.has('stations-all'));
    if (complete && !points.has('pilgrimage-done')) {
      points.award('pilgrimage-done', 0);
      grantLight(space.id);
    }
  }
  /** 성수를 찍은 뒤: 봉헌초와 십자가의 길 가운데 고른다 */
  function offerNext() {
    quest = 'choose'; setGuide(null);
    openCard('순례 안내', '이제 성당 안을 걸어 보세요', '', '제대 앞에서 초를 봉헌하거나, 측랑 벽을 따라 십자가의 길(제1처~제15처 부활)을 차례로 걸으며 기도할 수 있습니다. 미션을 마칠 때마다 포인트가 오릅니다.', [
      { label: '🕯️ 제대 앞 봉헌초로', on: () => { closeCard(); goAltarCandle(); } },
      { label: '✝️ 십자가의 길 걷기 — 제1처부터 제15처 부활까지', on: () => { closeCard(); startStations(); } },
    ]);
  }
  function endRinging() {
    ringing = false; camFix = null; me.holdRope = false; me.pullAmt = 0; arrive = null;
    space?.fx?.ropeGrab?.(null);
  }

  function pickAt(ndc: THREE.Vector2) {
    if (!space) return null;
    raycaster.setFromCamera(ndc, camera);
    for (const h of raycaster.intersectObjects(space.pickables, false)) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.ia) o = o.parent;
      if (!o) continue;
      const block = space.bvh.raycastFirst(raycaster.ray, THREE.DoubleSide);
      if (block && block.distance < h.distance - 0.35) return null; // 벽 너머
      return { ia: o.userData.ia as Interactable, hit: h };
    }
    return null;
  }

  const HINT: Record<Interactable['kind'], string> = { door: '문 열기 · 닫기', candle: '초 봉헌하기', bell: '종 줄 당기기', info: '설명 보기', seat: '앉기', art: '작품 보기', portal: '이동하기', font: '성수 찍기' };
  /** 광선이 빗나가도 2.2m 안 · 정면 35° 안의 대상을 잡는다(앉기는 자리 번호가 필요해 제외) */
  function nearTarget() {
    if (!space) return null;
    const fp = firstPerson();
    const eye = fp ? camera.getWorldPosition(new THREE.Vector3()) : player.pos.clone().setY(player.pos.y + 1.2);
    const fwd = fp ? camera.getWorldDirection(new THREE.Vector3()) : new THREE.Vector3(-Math.sin(bodyYaw), 0, -Math.cos(bodyYaw));
    let best: Interactable | null = null, bestD = 2.2;
    for (const ia of space.interactables) {
      if (ia.kind === 'seat') continue;
      const to = ia.anchor.clone().sub(eye), d = to.length();
      if (d < bestD && to.normalize().dot(fwd) > Math.cos(THREE.MathUtils.degToRad(35))) { best = ia; bestD = d; }
    }
    return best ? { ia: best, hit: { distance: bestD } as THREE.Intersection } : null;
  }
  function refreshTarget() {
    target = player.gliding ? null : (firstPerson() ? pickAt(new THREE.Vector2(0, 0)) : null) ?? nearTarget();
    const hint = $('hint');
    if (target && !cardOpen()) {
      hint.hidden = touch;
      hint.textContent = `${touch ? '' : '[E] '}${HINT[target.ia.kind]} — ${target.ia.title}`;
      $('actBtn').hidden = !touch;
      $('actBtn').textContent = HINT[target.ia.kind].split(' ')[0];
    } else { hint.hidden = true; $('actBtn').hidden = true; }
  }

  const ndcOf = (cx: number, cy: number) => new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  /** 마우스 아래 물건(멀리 있어도) */
  function farPick(cx: number, cy: number) {
    const far = raycaster.far; raycaster.far = 60;
    const r = pickAt(ndcOf(cx, cy));
    raycaster.far = far;
    return r;
  }
  function hoverPick(cx: number, cy: number) { return !!space && !cardOpen() && !!farPick(cx, cy); }
  /** 클릭·탭 — 가까운 물건은 바로, 먼 물건은 걸어가서, 땅이면 그 자리로 걸어간다(포켓몬·로블록스식) */
  function clickAt(cx: number, cy: number) {
    if (!space || cardOpen()) return;
    const hit = farPick(cx, cy);
    if (hit) {
      const d = hit.ia.anchor.distanceTo(player.pos.clone().setY(player.pos.y + 1));
      if (d < 3.0 || firstPerson()) { act(hit); return; }
      pendingAct = hit;
      setMoveTarget(hit.ia.anchor.clone().setY(player.pos.y));
      return;
    }
    raycaster.setFromCamera(ndcOf(cx, cy), camera);
    const g = space.bvh.raycastFirst(raycaster.ray, THREE.DoubleSide);
    if (g && g.distance < 80 && (!g.face || Math.abs(g.face.normal.y) > 0.45)) { pendingAct = null; setMoveTarget(g.point); }
  }
  function setMoveTarget(p: THREE.Vector3) {
    if ((ringing && !arrive) || crossing) return; // 줄을 잡고 있는 동안, 십자성호를 긋는 동안은 걷지 않는다
    if (player.sitting) player.stand();
    stopTour();
    moveTarget = p.clone(); moveStuck = 0; moveWps = [];
    // 벽을 피해 길을 따라 간다(길 찾기) — 길이 없으면 예전처럼 곧게 간다
    if (nav) {
      const path = nav.find(player.pos, p);
      if (path && path.length) { moveTarget = path[0]!.clone(); moveWps = path.slice(1).map((v) => v.clone()); }
    }
    marker.position.set(p.x, p.y + 0.04, p.z); marker.visible = true; marker.scale.setScalar(1);
  }

  function act(t: { ia: Interactable; hit: THREE.Intersection } | null) {
    if (!t || !space || crossing) return;
    const ia = t.ia;
    if (ringing && ia.kind !== 'bell') return;
    switch (ia.kind) {
      case 'door': {
        // v2: 문은 사람마다 따로 연다(누가 열어 두면 다음 사람이 「문을 열고 들어가는」 순간을 잃는다)
        const d = space.doors.find((x) => x.id === ia.id);
        if (d) { d.open = !d.open; sound.ting(); toast(d.open ? '문이 열립니다' : '문을 닫았습니다'); }
        break;
      }
      case 'bell': {
        // v3-8 종지기 놀이: 줄 뒤 자리까지 걸어가 줄을 잡고, 줄 손잡이를 이용자가 직접 끌어내린다(스스로 내려오지 않는다).
        // 맨 아래까지 내려오면 종이 한 번 울리고 몸이 줄에 매달려 떠오른다. 세 번 치면 끝 — 점수는 3분에 한 번만(그 사이에는 소리만)
        if (bellGameClose || ringing) break;
        closeCard();
        const r = space.bellRinger;
        const scored = points.bellReady();
        const wait = Math.ceil(points.bellWaitMs() / 1000);
        const begin = () => {
          if (r) { player.place(r.pos, r.yaw); bodyYaw = r.yaw; camFix = { pos: r.camPos.clone(), target: r.camTarget.clone() }; me.holdRope = true; me.pullAmt = 0; }
          sound.holdMusic(true);
          let won = false;
          bellGameClose = startBellGame({
            onDrag: (p) => { me.pullAmt = p; },
            onStrike: (n) => {
              startGesture(me, 'pull', 1, 0.22); // 이미 끌어내린 자세에서 시작: 되돌아 오르는 줄에 매달려 떠오른다
              if (space?.bellPos) sound.bellStrike(space.root, space.bellPos, n);
            },
            onSuccess: () => {
              won = true;
              if (net.online) net.send('bell', { id: ia.id }); else ringBell(0.9, true);
              if (scored && points.awardBell()) toast(`종지기 완료 ⭐ +${PTS.bell} 포인트 — 다시 하려면 성당 안을 둘러보고 3분 뒤에 오세요`);
              else toast('종소리가 울립니다 🔔 (포인트는 3분 뒤부터 다시 오릅니다)');
            },
            onClose: () => {
              bellGameClose = null; endRinging(); sound.holdMusic(false);
              if (won && !points.has('font')) { askHide(); toast('이제 성수대 앞으로 갑니다 💧'); setTimeout(() => nextFont(), 900); }
            },
          }, scored ? { scored: true, bonus: PTS.bell } : { scored: false, note: `※ 방금 포인트를 받았습니다. 지금은 소리만 납니다 — 성당 안을 둘러보고 ${Math.max(1, Math.ceil(wait / 60))}분쯤 뒤에 오세요 (남은 ${Math.floor(wait / 60)}분 ${wait % 60}초)` });
        };
        if (r && player.pos.distanceTo(r.pos) > 0.4) { ringing = true; arrive = begin; setMoveTarget(r.pos); toast('종 줄 앞으로 갑니다…'); }
        else { ringing = !!r; begin(); }
        break;
      }
      case 'font': {
        // 2026-11-24: 성수 찍기 = 캐릭터가 성수대 앞에서 손끝을 적시고 이마 → 가슴 → 왼쪽 어깨 → 오른쪽 어깨를 짚는 것(위 beginCross).
        // 성수대 둘레(몸 반지름 + 그릇 반지름)에 서서 시작한다. 멀면 그 자리까지 걸어간 뒤 시작한다
        if (riteClose) break;
        closeCard();
        const dx = ia.anchor.x - player.pos.x, dz = ia.anchor.z - player.pos.z, d = Math.hypot(dx, dz) || 1;
        const stand = new THREE.Vector3(ia.anchor.x - (dx / d) * 0.76, player.pos.y, ia.anchor.z - (dz / d) * 0.76);
        const anchor = ia.anchor.clone();
        if (Math.hypot(stand.x - player.pos.x, stand.z - player.pos.z) > 0.4) { arrive = () => beginCross(anchor); setMoveTarget(stand); }
        else beginCross(anchor);
        break;
      }
      case 'candle': candleGroup = ia.group ?? null; candleTitle = ia.title; openCandleCard(); break;
      case 'info': if (ia.id.startsWith('station')) break; /* 십자가의 길은 공중에 뜨는 글만 — 벽을 눌러도 카드는 없다 */ openCard('설명', ia.title, '', ia.body ?? '', []); break;
      case 'art': openArtCard(ia); break;
      case 'seat': {
        const at = ia.seatAt?.(t.hit.instanceId ?? 0);
        if (at) { player.sit(at); toast('앉아서 조용히 기도합니다 🙏 — 움직이면 일어납니다'); }
        break;
      }
      case 'portal':
        if (ia.target) { toast(`${SPACES[ia.target].title}(으)로 이동합니다`); void loadSpace(ia.target); }
        break;
    }
  }

  function ringBell(volume = 1, quiet = false) {
    if (!space?.bellPos) return;
    sound.bell(space.root, space.bellPos, volume);
    if (!quiet) toast('종이 울립니다');
  }

  function applyCandle(id: string, lit: boolean, phrase: number, by: string, quiet = false, text = '') {
    const c = space?.candles.find((x) => x.id === id);
    if (!c) return;
    if (!lit && savedIds.has(id)) return;
    const changed = c.lit !== lit;
    if (changed && lit && by === myName) {
      // v3-8: 성모 동굴의 초는 +30, 제대 앞 봉헌대의 초는 +20 (각 봉헌대 한 번)
      const grotto = candleTitle.includes('성모');
      award(grotto ? 'candle-grotto' : 'candle-altar', grotto ? PTS.candleGrotto : PTS.candleAltar, grotto ? '성모님께 초를 봉헌' : '제대 앞에 초를 봉헌');
      if (quest === 'candle') { quest = 'done'; setGuide(null); toast('순례를 마쳤습니다 🙏 성당 안을 둘러보고, 앉아서 기도해 보세요. 다 보시면 밖으로 나오세요'); }
    }
    c.lit = lit; c.phrase = phrase; c.by = by;
    c.text = text || (lit && by === myName ? myTexts.get(id) ?? '' : '');
    if (!lit) myTexts.delete(id);
    c.flame.visible = lit;
    const stand = c.flame.parent;
    const light = stand?.userData.light as THREE.PointLight | undefined;
    if (light && space) light.intensity = space.candles.filter((x) => x.lit && x.flame.parent === stand).length * 0.9;
    if (changed && lit && by && !quiet) toast(`${by} 님이 초를 켰습니다 — ${candleLabel(c)}`);
    barrierLevel();
    if (changed && lit && !quiet) { c.flame.getWorldPosition(flamePos); barrier.pulse(flamePos); } // 빛이 솟아 결계를 밝힌다
    if (cardKind === 'candle') openCandleCard();
  }

  // ── 카드 ──
  const card = $('card');
  let cardKind = '';
  let cardArt: Interactable | null = null;
  const cardOpen = () => !card.hidden;
  function openCard(kind: string, title: string, meta: string, body: string, actions: { label: string; on: () => void; disabled?: boolean; count?: number }[]) {
    if (document.pointerLockElement) document.exitPointerLock();
    cardKind = kind === '봉헌초' ? 'candle' : kind;
    $('cardKind').textContent = kind;
    $('cardTitle').textContent = title;
    $('cardMeta').textContent = meta;
    $('cardMeta').hidden = !meta;
    $('cardBody').textContent = body;
    const box = $('cardActions');
    box.replaceChildren(...actions.map((a) => {
      const b = document.createElement('button');
      b.textContent = a.label;
      if (a.count !== undefined) { const s = document.createElement('span'); s.className = 'count'; s.textContent = String(a.count); b.append(s); }
      b.disabled = !!a.disabled;
      b.addEventListener('click', a.on);
      return b;
    }));
    card.hidden = false;
    $('hint').hidden = true;
  }
  function closeCard() {
    // 설명 카드를 닫으면 공중에 떠 있던 글도 함께 사라진다(그 설명대에서 멀어졌다 다시 올 때까지 다시 뜨지 않는다)
    // (설명 카드뿐 아니라 십자가의 길 카드 등 어떤 카드든 닫으면 떠 있던 글을 거둔다)
    for (const h of holos) if (h.on) hideHolo(h);
    card.hidden = true; cardKind = ''; cardArt = null;
  }
  $('cardClose').addEventListener('click', closeCard);

  function openCandleCard() {
    if (!space) return;
    const sp = space;
    const pool = candleGroup ? sp.candles.filter((c) => candleGroup!.includes(c.id)) : sp.candles;
    const lit = pool.filter((c) => c.lit);
    const free = pool.find((c) => !c.lit);
    const siteId = SPACES[sp.id].siteId;
    const recent = (saved?.recent.length
      ? saved.recent.slice(0, 4).map((r) => `${r.display_name}${r.country ? ' ' + flag(r.country) : ''} — ${INTENTIONS[r.intention] ?? ''}`)
      : lit.slice(-4).map((c) => `${c.by || '누군가'} — ${candleLabel(c)}`)).join(' / ');
    const meta = saved && saved.total > 0
      ? `지금 타고 있는 초 ${saved.total}개 · ${saved.countries}개국 (최근 7일)`
      : `켜진 초 ${lit.length} / ${pool.length}`;
    const mine = saved?.my_expires_at ? `내 초 · ${daysLeft(saved.my_expires_at)}일 남음. ` : '';
    const how = !siteId ? '' : loggedIn ? '켠 초는 7일 동안 탑니다. ' : sharesMainSession ? '로그인하면 켠 초가 7일 동안 남아요. ' : '';
    // 초 켜기 — i: 고른 기도 번호, text: 직접 쓴 기도(있으면 함께 보낸다. 새 방 서버는 모두에게 전하고, 예전 서버는 번호만 전한다)
    const light = (i: number, text = '') => {
      if (!free) return;
      sound.ting();
      if (text) myTexts.set(free.id, text);
      if (net.online) net.send('candle', { id: free.id, phrase: i, text });
      else applyCandle(free.id, true, i, myName, false, text);
      closeCard();
      if (siteId && loggedIn) {
        void lightCandle(siteId, sp.id, i, myName, guessCountry()).then((r) => {
          if (r === 'ok') { toast('초를 켰습니다 · 7일 동안 탑니다'); void refreshSaved(sp.id, false); }
          else if (r === 'daily_limit') toast('초는 하루에 3개까지 켤 수 있어요 · 이번 초는 여기서만 켜졌습니다');
          else if (r === 'login_required') { loggedIn = false; toast('로그인이 풀렸어요 · 이번 초는 여기서만 켜졌습니다'); }
          else toast('초를 켰습니다 (저장은 안 됐어요)');
        });
      } else {
        toast(siteId && sharesMainSession ? '초를 켰습니다 · 로그인하면 7일 동안 남아요' : '초를 켰습니다');
      }
    };
    const actions: { label: string; on: () => void; disabled?: boolean }[] = INTENTIONS.map((label, i) => ({ label, disabled: !free, on: () => light(i) }));
    // v3-6: 직접 쓰는 기도 — 누르면 아래 글상자가 열린다(40자, 욕설·연락처는 걸러진다)
    actions.push({ label: '✍️ 직접 쓰기', disabled: !free, on: () => { write.classList.toggle('open'); if (write.classList.contains('open')) ta.focus(); } });
    if (siteId && !loggedIn && sharesMainSession) {
      actions.push({ label: '로그인하고 7일 동안 켜 두기', on: () => { location.href = '/login'; } });
    }
    openCard(candleTitle, '초를 켜고 기도를 고르거나 직접 쓰세요', meta,
      mine + how + (free ? '' : '지금은 모든 초가 켜져 있습니다. 잠시 뒤에 다시 와 주세요. ') + (recent ? `최근: ${recent}` : '아직 켜진 초가 없습니다.'),
      actions);
    const write = document.createElement('div'); write.className = 'write';
    const ta = document.createElement('textarea'); ta.maxLength = CANDLE_TEXT_MAX; ta.placeholder = '예: 어머니의 수술이 잘 되기를 (40자까지)'; ta.setAttribute('aria-label', '직접 쓰는 기도');
    const cnt = document.createElement('div'); cnt.className = 'count'; cnt.textContent = `0 / ${CANDLE_TEXT_MAX}`;
    const go = document.createElement('button'); go.type = 'button'; go.textContent = '🕯️ 이 기도로 초 켜기';
    ta.addEventListener('input', () => { cnt.textContent = `${ta.value.length} / ${CANDLE_TEXT_MAX}`; });
    ta.addEventListener('keydown', (e) => e.stopPropagation()); // 글 쓰는 동안 W A S D 가 걷기로 가지 않게
    go.addEventListener('click', () => {
      const text = cleanCandleText(ta.value);
      if (!text) { toast(ta.value.trim() ? '그 글은 올릴 수 없어요(욕설·주소·전화번호는 걸러집니다)' : '기도를 적어 주세요'); ta.focus(); return; }
      light(INTENTIONS.length - 1, text); // 번호는 마지막 기도로 두고 글을 함께 보낸다(예전 서버에서는 그 기도 문구로 보인다)
    });
    write.append(ta, cnt, go);
    $('cardActions').append(write);
  }

  function openArtCard(ia: Interactable) {
    cardArt = ia;
    openCard('작품', ia.title, ia.author ?? '', ia.body ?? '', []);
    cardKind = 'art';
    cardArt = ia;
    renderArtActions(ia);
  }
  function renderArtActions(ia: Interactable) {
    if (cardKind !== 'art' || cardArt !== ia) return;
    const box = $('cardActions');
    box.replaceChildren(...REACTS.map((k) => {
      const b = document.createElement('button');
      b.textContent = REACT_LABEL[k];
      const s = document.createElement('span'); s.className = 'count'; s.textContent = String(reactCounts.get(`${ia.id}:${k}`) ?? 0);
      b.append(s);
      b.addEventListener('click', () => {
        if (net.online) net.send('react', { art: ia.id, kind: k });
        else { reactCounts.set(`${ia.id}:${k}`, (reactCounts.get(`${ia.id}:${k}`) ?? 0) + 1); renderArtActions(ia); }
        popAtArt(ia.id, REACT_LABEL[k]);
      });
      return b;
    }));
  }

  function popAtArt(artId: string, text: string) {
    const ia = space?.interactables.find((x) => x.kind === 'art' && x.id === artId);
    if (!ia) return;
    const el = document.createElement('div');
    el.className = 'react-pop'; el.textContent = text;
    const o = new CSS2DObject(el);
    o.position.copy(ia.anchor).add(new THREE.Vector3(0, 0.7, 0));
    scene.add(o);
    setTimeout(() => { scene.remove(o); el.remove(); }, 1600);
  }

  // ── 상단 도구 ──
  $('btnSound').addEventListener('click', () => {
    sound.setEnabled(!sound.enabled);
    $('btnSound').setAttribute('aria-pressed', String(sound.enabled));
    $('btnSound').textContent = sound.enabled ? '소리 켬' : '소리 끔';
  });
  $('btnSay').addEventListener('click', () => {
    openCard('인사', '인사 건네기', net.online ? '가까이 있는 관람객 머리 위에 말풍선으로 보입니다' : '실시간 연결이 없어 나에게만 보입니다', '', GREETINGS.map((g, i) => ({
      label: g, on: () => { net.send('say', { idx: i }); toast(`나: ${g}`); closeCard(); },
    })));
  });
  $('btnSpace').addEventListener('click', () => {
    openCard('공간 이동', '어디로 갈까요?', '', '공간마다 따로 실시간 방이 열립니다.', (Object.keys(SPACES) as SpaceId[]).map((id) => ({
      label: SPACES[id].title + (space?.id === id ? ' (지금 여기)' : ''), disabled: space?.id === id,
      on: () => { closeCard(); void loadSpace(id); },
    })));
  });

  // ── 안내 투어 ──
  let tour: { i: number; timer: number } | null = null;
  function stopTour() {
    if (!tour) return;
    clearTimeout(tour.timer);
    tour = null;
    player.cancelGlide();
    $('caption').hidden = true;
    $('btnTour').textContent = '안내 투어';
  }
  function tourStep() {
    if (!tour || !space) return;
    const s = space.stations[tour.i];
    if (!s) { stopTour(); toast('안내 투어를 마쳤습니다'); return; }
    $('caption').hidden = false;
    $('caption').textContent = `${tour.i + 1} / ${space.stations.length} · ${s.caption}`;
    player.glideTo(s.pos, s.yaw, s.pitch, 2.6, () => {
      if (!tour) return;
      tour.timer = window.setTimeout(() => { if (tour) { tour.i++; tourStep(); } }, 4500);
    });
  }
  $('btnTour').addEventListener('click', () => {
    if (tour) { stopTour(); return; }
    // 닫힌 문은 투어가 지나가도록 연다
    if (space) for (const d of space.doors) d.open = true;
    tour = { i: 0, timer: 0 };
    $('btnTour').textContent = '투어 멈춤';
    tourStep();
  });

  // ── 입력 ──
  const keys = new Set<string>();
  const joy = new THREE.Vector2();
  let joyFull = 0; // 조이스틱을 끝까지 민 채로 지난 시간(초)
  addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    keys.add(e.code);
    if (e.code === 'KeyE') act(target);
    if (e.code === 'Space' && player.onGround && !player.sitting) { player.vel.y = 6.2; e.preventDefault(); }
    if (e.code === 'Escape') closeCard();
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());

  const lockTip = $('lockTip');
  if (!touch) {
    lockTip.hidden = false;
    setTimeout(() => { lockTip.hidden = true; }, 12000);
    let drag: { x: number; y: number; moved: number; t: number } | null = null;
    canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) { canvas.style.cursor = hoverPick(e.clientX, e.clientY) ? 'pointer' : 'default'; return; }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      if (drag.moved > 5) { player.look(dx * 0.0048, dy * 0.0042); canvas.style.cursor = 'grabbing'; }
    });
    canvas.addEventListener('pointerup', (e) => {
      if (drag && drag.moved <= 6 && performance.now() - drag.t < 450) clickAt(e.clientX, e.clientY);
      drag = null; canvas.style.cursor = 'default';
    });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.004, 0, 11); }, { passive: false });
  } else {
    let tp: { id: number; x: number; y: number; t: number; moved: number } | null = null;
    const touches = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    canvas.addEventListener('pointerdown', (e) => {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); tp = null; return; }
      if (!tp) tp = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // 모으면 멀리(전체 그림)·벌리면 가까이(초점) — 손가락이 움직인 만큼 같은 비율로 확대·축소(사진 보기와 같다)
      if (touches.size === 2) { const [a, b] = [...touches.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d > 1 && pinch > 1) camDist = THREE.MathUtils.clamp(camDist * (pinch / d), 0.2, CAM_OVER); pinch = d; }
    });
    const lift = (e: PointerEvent) => touches.delete(e.pointerId);
    canvas.addEventListener('pointerup', lift); canvas.addEventListener('pointercancel', lift);
    canvas.addEventListener('pointermove', (e) => {
      if (!tp || e.pointerId !== tp.id) return;
      const dx = e.clientX - tp.x, dy = e.clientY - tp.y;
      tp.moved += Math.abs(dx) + Math.abs(dy);
      tp.x = e.clientX; tp.y = e.clientY;
      player.look(dx * 0.006, dy * 0.006);
    });
    const end = (e: PointerEvent) => {
      if (!tp || e.pointerId !== tp.id) return;
      if (tp.moved < 10 && performance.now() - tp.t < 350) { clickAt(e.clientX, e.clientY); $('lookTip').classList.add('gone'); } // 한 번 눌러 걸으면 안내 글을 거둔다
      tp = null;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    const stick: any = nipplejs.create({ zone: $('joy'), mode: 'dynamic', color: '#d4a017', size: 110 });
    stick.on('move', (_e: unknown, d: any) => { const f = Math.min(1, d.force ?? 1); joy.set(d.vector.x * f, d.vector.y * f); });
    stick.on('end', () => { joy.set(0, 0); $('joyGuide').classList.remove('using'); });
    // 안내 그림(동서남북 화살표)은 손을 대면 흐려지고, 떼면 다시 보인다 — 조이스틱 자리를 몰라 못 걷던 문제(2026-11-17 사장님)
    stick.on('start', () => { $('joyGuide').classList.add('using'); $('lookTip').classList.add('gone'); });
    $('actBtn').addEventListener('click', () => act(target));
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight);
    composer?.setSize(innerWidth, innerHeight);
  });

  // ── 알림 ──
  function toast(text: string) {
    const el = document.createElement('div');
    el.textContent = text;
    $('toast').append(el);
    setTimeout(() => el.remove(), 4000);
    while ($('toast').children.length > 3) $('toast').firstElementChild?.remove();
  }

  // ── 여는 장면(v2) — 언덕 아래 단풍 숲 위에서 성당 종탑으로 다가가 내 캐릭터 어깨 뒤로 내려앉는다 ──
  const cine = document.createElement('div');
  cine.id = 'cine';
  cine.innerHTML = '<div><div class="t1">명동대성당</div><div class="t2">종현 언덕 · 1898</div></div><div class="skip">누르면 건너뜁니다</div>';
  document.body.append(cine);
  let intro: { t: number; dur: number; pos: THREE.CatmullRomCurve3; look: THREE.CatmullRomCurve3 } | null = null;
  let introDone = new URLSearchParams(location.search).has('nointro');
  const camHold = new THREE.Vector3(), quatHold = new THREE.Quaternion();
  function startIntro(end: THREE.Vector3, from: THREE.Vector3) {
    introDone = true;
    // 2026-11-24 사장님: 드론샷은 언덕 아래 ㄷ 계단 맨 아래(from)에서 낮게 시작해, 계단을 따라 올라가 계단 위 평지에 선 캐릭터(end)의 어깨 뒤에 내려앉는다.
    // 카메라 높이는 아래 땅에서 1.7 m 이상으로 지킨다(runIntro). 6.5초, 누르면 끝으로 건너뛴다
    const f = (x: number, y: number, z: number) => new THREE.Vector3(from.x + x, from.y + y, from.z + z);
    const e = (x: number, y: number, z: number) => new THREE.Vector3(end.x + x, end.y + y, end.z + z);
    intro = {
      t: 0, dur: 6.5,
      pos: new THREE.CatmullRomCurve3([f(-2, 1.8, 12), f(1, 3.4, -6), new THREE.Vector3(end.x + 2.5, end.y + 5.5, end.z + 16), e(1, 3.8, 9), e(0, 2.9, 4.4)], false, 'centripetal'),
      look: new THREE.CatmullRomCurve3([new THREE.Vector3(0, 14, 8), new THREE.Vector3(0, 10, 8), new THREE.Vector3(0, 5, 14), e(0, 1.8, -4), e(0, 1.5, 0)], false, 'centripetal'),
    };
    document.body.classList.add('cinema');
    setTimeout(() => cine.classList.add('on'), 1100);
    setTimeout(() => cine.classList.remove('on'), 5000);
    const skip = () => { if (intro && intro.t < intro.dur * 0.86) intro.t = intro.dur * 0.86; };
    addEventListener('pointerdown', skip, { once: true });
    addEventListener('keydown', skip, { once: true });
  }
  function runIntro(dt: number) {
    if (!intro) return;
    intro.t += dt;
    const u = Math.min(1, intro.t / intro.dur);
    const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; // 천천히 떠나 천천히 내려앉는다
    camHold.copy(camera.position); quatHold.copy(camera.quaternion);
    camera.position.copy(intro.pos.getPoint(e));
    { // 땅 위 1.7 m 아래로 내려가지 않게(언덕 계단을 스치지 않도록)
      camRay.origin.set(camera.position.x, camera.position.y + 40, camera.position.z); camRay.direction.set(0, -1, 0);
      const g = space?.bvh.raycastFirst(camRay, THREE.DoubleSide);
      if (g) camera.position.y = Math.max(camera.position.y, g.point.y + 1.7);
    }
    camera.lookAt(intro.look.getPoint(e));
    const k = THREE.MathUtils.smoothstep(u, 0.86, 1);
    if (k > 0) { camera.position.lerp(camHold, k); camera.quaternion.slerp(quatHold, k); }
    grade.uniforms.uBars.value = 0.1 * (1 - THREE.MathUtils.smoothstep(u, 0.8, 1));
    NEAR_FADE.value = 1.6 + 6.5 * (1 - THREE.MathUtils.smoothstep(u, 0.82, 1)); // 내려오는 길의 잎을 걷어 낸다
    if (u >= 1) { NEAR_FADE.value = 1.6; intro = null; cine.classList.remove('on'); document.body.classList.remove('cinema'); grade.uniforms.uBars.value = 0; }
  }

  // ── 반복 ──
  const timer = new THREE.Timer();
  timer.connect(document);
  let pickTimer = 0, zoneName = '';
  function frame(ts?: number) {
    timer.update(ts);
    const dt = Math.min(timer.getDelta(), 0.1), t = timer.getElapsed(), now = performance.now();
    if (space) {
      const mv = { x: 0, z: 0, run: keys.has('ShiftLeft') || keys.has('ShiftRight') };
      if ((!cardOpen() || touch) && !ringing && !crossing) {
        mv.z = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) + joy.y;
        mv.x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + joy.x;
      }
      let len = Math.hypot(mv.x, mv.z);
      if (len > 0.2) { moveTarget = null; pendingAct = null; marker.visible = false; if (arrive) { arrive = null; ringing = false; } }
      // 클릭한 자리로 걸어가기 — 카메라 방향 기준 입력으로 바꿔 넣는다
      if (moveTarget && len <= 0.2) {
        const dx = moveTarget.x - player.pos.x, dz = moveTarget.z - player.pos.z, dist = Math.hypot(dx, dz);
        const last = moveWps.length === 0;
        const reach = !last ? 0.4 : pendingAct ? 2.0 : arrive ? 0.3 : 0.35;
        if (dist < reach && !last) { moveTarget = moveWps.shift()!; moveStuck = 0; }
        else if (dist < reach) {
          moveTarget = null; marker.visible = false;
          if (pendingAct) { const a = pendingAct; pendingAct = null; act(a); }
          else if (arrive) { const f = arrive; arrive = null; f(); }
        } else {
          const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
          mv.z = (dx * fx + dz * fz) / dist; mv.x = (dx * rx + dz * rz) / dist;
          mv.run = dist > 12;
          len = 1;
          moveStuck = mySpeed < 0.25 ? moveStuck + dt : 0;
          if (moveStuck > 0.45) { // 막혔다 — 벽 앞에서 바로 멈춘다(방향키로 다시 움직인다). 종 줄로 가던 길이면 마지막 한 걸음은 옮겨 준다
            moveTarget = null; moveWps = []; pendingAct = null; marker.visible = false;
            if (arrive) { const f = arrive; arrive = null; if (dist < 1.6) f(); else ringing = false; }
          }
        }
      }
      // 휴대폰 달리기(2026-11-22): 조이스틱을 끝까지 민 채 1초가 지나면 달린다. 덜 밀거나 떼면 걷기로
      if (joy.length() > 0.95) joyFull += dt; else joyFull = 0;
      if (joyFull > 1) mv.run = true;
      if (len > 1) { mv.x /= len; mv.z /= len; }
      if (tour && len > 0.2 && !moveTarget) stopTour();
      if (crossing) { mv.x = mv.z = 0; len = 0; driveCross(dt); }
      lastPos.copy(player.pos);
      player.update(dt, mv, space.bvh, space.doors);
      if (player.pos.y < -20) player.place(space.spawn.pos, space.spawn.yaw);
      // 캐릭터: 걷는 쪽을 바라보고 팔다리를 흔든다
      const vx = (player.pos.x - lastPos.x) / Math.max(dt, 1e-3), vz = (player.pos.z - lastPos.z) / Math.max(dt, 1e-3);
      mySpeed += (Math.hypot(vx, vz) - mySpeed) * Math.min(1, dt * 10);
      const fp = firstPerson();
      if (fp) bodyYaw = player.yaw;
      else if (len > 0.2) {
        // 누른 방향(카메라 기준 입력)으로 돈다. 실제로 움직인 거리로 계산하면 멈출 때 atan2(0,0) 이 반 바퀴가 되어
        // 몸이 뒤로 홱 돌고, 벽에 막혀 미끄러질 때도 옆으로 돈다(2026-11-22 진단, 멘토 목업 방식).
        const wx = -Math.sin(player.yaw) * mv.z + Math.cos(player.yaw) * mv.x;
        const wz = -Math.cos(player.yaw) * mv.z - Math.sin(player.yaw) * mv.x;
        let dy = Math.atan2(-wx, -wz) - bodyYaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        bodyYaw += dy * (1 - Math.exp(-12 * dt));
      }
      document.body.classList.toggle('ringing', !!camFix);
      if (camFix && space.bellRinger) bodyYaw = space.bellRinger.yaw; // 줄을 잡은 동안은 줄 쪽을 본다(자리에 옮겨 설 때 생기는 속도로 몸이 돌지 않게)
      me.root.position.copy(player.pos);
      me.root.rotation.y = bodyYaw;
      me.root.visible = !fp || !!camFix; myTagObj.visible = me.root.visible;
      animateAvatar(me, dt, mySpeed, t, !!player.sitting);
      for (let i = sparks.length - 1; i >= 0; i--) { const sp = sparks[i]; sp.age += dt; sp.m.scale.setScalar(1 + sp.age * 4); (sp.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - sp.age / 0.7)); if (sp.age > 0.7) { scene.remove(sp.m); sp.m.geometry.dispose(); (sp.m.material as THREE.Material).dispose(); sparks.splice(i, 1); } }
      barrier.update(t);
      demoTick?.(t);
      lights.update(t, dt, lightsAt.set(player.pos.x, player.pos.y, player.pos.z), 1, lightsFwd.set(-Math.sin(bodyYaw), 0, -Math.cos(bodyYaw)));
      // 종 줄은 «종 줄 놀이로 줄을 잡고 있을 때»만 손으로 끌려온다. 성수 찍기(십자성호)도 카메라를 고정(camFix)하므로 camFix 만으로 판단하면 종 줄이 손에 딸려와 «막대기»처럼 보인다(사장님 2026-11-25)
      if (camFix && me.holdRope && space.fx?.ropeGrab) {
        // 줄이 두 손 사이를 지나가게 — 손 자리를 세계 좌표로 읽어 공간에 넘긴다
        me.root.updateMatrixWorld(true);
        me.handL.getWorldPosition(handA); me.handR.getWorldPosition(handB);
        space.fx.ropeGrab(handA.add(handB).multiplyScalar(0.5));
      }
      if (marker.visible) marker.scale.setScalar(0.85 + 0.15 * Math.sin(t * 6));
      document.body.classList.toggle('third', !fp);
      if (camFix) { camera.position.copy(camFix.pos); camera.lookAt(camFix.target); }
      else if (fp) player.applyCamera(camera);
      else {
        // 캐릭터 어깨 뒤에서 따라간다. 벽에 막히면 카메라를 당긴다
        const pivot = player.pos.clone().setY(player.pos.y + 1.45 * me.def.scale + 0.2);
        const cp = Math.min(player.pitch, 0.9);
        const fwd = new THREE.Vector3(-Math.sin(player.yaw) * Math.cos(cp), Math.sin(cp), -Math.cos(player.yaw) * Math.cos(cp));
        let d = Math.min(camDist, CAM_CHASE_MAX);
        camRay.origin.copy(pivot); camRay.direction.copy(fwd).negate();
        const block = space.bvh.raycastFirst(camRay, THREE.DoubleSide);
        if (block && block.distance < d + 0.3) d = Math.max(0.35, block.distance - 0.3);
        camera.position.copy(pivot).addScaledVector(fwd, -d);
        camera.rotation.set(cp, player.yaw, 0, 'YXZ');
        // 11 m 보다 더 멀어지면 전체 그림으로 올라간다(s: 0 따라가기 … 1 전체 그림)
        const ov = THREE.MathUtils.smoothstep(camDist, CAM_CHASE_MAX, CAM_OVER);
        if (ov > 0) { camera.position.lerp(ovPos, ov); camera.quaternion.slerp(ovQuat, ov); }
        document.body.classList.toggle('overview', ov > 0.25); // 전체 그림에서는 안내 표지·설명 글을 감춘다(CSS)
        youRing.visible = ov > 0.05;
        if (youRing.visible) { youRing.position.set(player.pos.x, player.pos.y + 0.15, player.pos.z); youRing.scale.setScalar((1 + 7 * ov) * (1 + 0.12 * Math.sin(t * 5))); }
      }

      if (!introDone && !spaceLoading && space.id === 'cathedral' && space.introFrom && player.pos.distanceTo(space.spawn.pos) < 3) startIntro(player.pos.clone(), space.introFrom);
      runIntro(dt);

      for (const d of space.doors) {
        d.t = THREE.MathUtils.clamp(d.t + (d.open ? dt : -dt) * 0.8, 0, 1);
        const e = d.t * d.t * (3 - 2 * d.t);
        for (const l of d.leaves) l.pivot.rotation.y = l.sign * 1.65 * e;
      }
      for (const c of space.candles) if (c.lit) {
        const f = 0.85 + 0.15 * Math.sin(t * 13 + c.id.length * 7 + Number(c.id.slice(1)) * 1.7) + 0.05 * Math.sin(t * 31);
        c.flame.scale.set(1, f, 1);
        const sw = Number(c.id.slice(1)) || c.id.length;
        c.flame.rotation.z = 0.12 * Math.sin(t * 2.3 + sw) * Math.sin(t * 5.1 + sw * 0.7); // 바람에 기우는 불꽃
        const halo = c.flame.children[1] as THREE.Sprite | undefined;
        if (halo) halo.material.opacity = 0.75 + 0.25 * Math.sin(t * 17 + sw * 2.1) * Math.sin(t * 7.3);
      }
      for (const st of new Set(space.candles.filter((c) => c.lit).map((c) => c.flame.parent))) {
        const L = st?.userData.light as THREE.PointLight | undefined;
        if (!L) continue;
        const n = space.candles.filter((c) => c.lit && c.flame.parent === st).length * 0.9;
        L.intensity = n * (0.82 + 0.12 * Math.sin(t * 9.7) + 0.06 * Math.sin(t * 23.1)); // 주변을 비추는 빛도 일렁인다
      }
      space.update(dt, t);

      const head = player.pos.clone().setY(player.pos.y + 0.8);
      const zone = space.zones.find((z) => z.box.containsPoint(head)) ?? space.zones[space.zones.length - 1];
      if (zone.name !== zoneName) { zoneName = zone.name; $('zoneName').textContent = zone.name; }
      outdoor += (zone.outdoor - outdoor) * (1 - Math.exp(-3 * dt));
      sound.mixBgm(outdoor, dt);
      if (gtao) gtao.enabled = outdoor < 0.5; // 구석 그늘은 실내에서만(바깥 나뭇잎 카드에 얼룩이 생긴다)
      sun.intensity = 3.4 * sunStrength * (0.06 + 0.94 * outdoor);
      // 실내는 따뜻하고 고르게(VR: 그늘진 측랑도 어둡지 않다), 바깥은 하늘빛
      // 실내 고른 빛은 낮게 — 그늘이 살아야 창으로 드는 햇살 빛줄기가 보인다(조명 복원 2026-11-09)
      hemi.intensity = THREE.MathUtils.lerp(0.13, 0.26 + 0.4 * (0.35 + 0.65 * sunStrength), outdoor); // v3-3: 바깥 그늘에 하늘빛 채움 조금 더
      hemi.color.copy(HEMI_IN_SKY).lerp(HEMI_OUT_SKY, outdoor); hemi.groundColor.copy(HEMI_IN_GND).lerp(HEMI_OUT_GND, outdoor);
      scene.environmentIntensity = ENV_K * (0.08 + 0.92 * outdoor * (0.35 + 0.65 * sunStrength));
      // 그림자 상자를 내 자리로(2 m 격자에 맞춰 움직여 그림자 가장자리가 떨리지 않게)
      sun.target.position.set(Math.round(player.pos.x / 2) * 2, Math.round(player.pos.y / 2) * 2, Math.round(player.pos.z / 2) * 2);
      sun.position.copy(sun.target.position).addScaledVector(sunDir, 150);
      sun.target.updateMatrixWorld();
      renderer.toneMappingExposure = 0.88 + (1 - outdoor) * 0.39; // v3-3: 바깥 노출을 낮춰 하늘·밝은 벽이 날아가지 않게(실내 1.27 그대로)
      grade.uniforms.uOutdoor.value = outdoor;
      // 빛 번짐은 실내(색유리·촛불)에서만 — 바깥 하늘까지 번지면 뿌옇게 된다
      if (bloom) { bloom.strength = 0.08 + (1 - outdoor) * 0.36; bloom.threshold = 0.86 + outdoor * 0.1; }
      if (space.outdoorGroup) space.outdoorGroup.visible = zone.outdoor > 0;
      if (space.shellGroup) space.shellGroup.visible = zone.outdoor >= 1;
      document.body.classList.toggle('indoors', zone.outdoor < 1);

      pickTimer -= dt;
      if (pickTimer <= 0) {
        pickTimer = 0.12; refreshTarget();
        // 문: 앞에 서면 저절로 열리고, 멀어지면 닫힌다(사람마다 따로)
        for (const ia of space.interactables) {
          if (ia.kind !== 'door') continue;
          const dr = space.doors.find((x) => x.id === ia.id); if (!dr) continue;
          const dh = Math.hypot(ia.anchor.x - player.pos.x, ia.anchor.z - player.pos.z);
          if (!dr.open && dh < 3.6) { dr.open = true; sound.ting(); }
          else if (dr.open && dh > 11) dr.open = false;
        }
        // 설명대 홀로그램: 3.2 m 안에 들어오면 떠오르고, 벗어나면 사라진다
        let nearH: (typeof holos)[number] | null = null, nearD = 1e9;   // 가까이 다가가면 «가장 가까운 글 하나»만 뜬다
        for (const h of holos) {
          const d = Math.hypot(h.ia.anchor.x - player.pos.x, h.ia.anchor.z - player.pos.z);
          if (d < nearD && !h.hidden && Math.abs(h.ia.anchor.y - (player.pos.y + 1)) < 2.5) { nearD = d; nearH = h; }
        }
        for (const h of holos) {
          const dh = Math.hypot(h.ia.anchor.x - player.pos.x, h.ia.anchor.z - player.pos.z);
          const dy = Math.abs(h.ia.anchor.y - (player.pos.y + 1));
          // 멀어지거나(3.6 m) 닫은 자리에서 2.2 m 넘게 걸어가면 다시 보일 수 있게 — 다음 처로 가면 그 처의 글이 뜬다
          if (h.hidden && (dh > 3.6 || (h.hx !== undefined && Math.hypot(player.pos.x - h.hx, player.pos.z - h.hz!) > 2.2))) h.hidden = false;
          // 다가갈 때는 그대로 두고, 가장 가까이 갔던 때보다 1.6 m 넘게 멀어지면 글은 거둔다 — 길을 가리지 않게
          if (h.on) { h.md = Math.min(h.md ?? dh, dh); if (dh - h.md > 1.6) hideHolo(h); }
          if (cardOpen()) hideHolo(h);
          const on = dh < 3.2 && dy < 2.5 && !h.hidden && h === nearH;
          if (on && !h.on) h.md = dh;
          if (on !== h.on) { h.on = on; if (on) { h.o.visible = true; h.el.classList.remove('show'); void h.el.offsetWidth; h.el.classList.add('show'); } else { h.el.classList.remove('show'); setTimeout(() => { if (!h.on) h.o.visible = false; }, 400); } }
        }
        // ── 순례 순서 안내: 시작 · 4초 가만히 있으면 성모상으로 · 밖으로 나오면 새 빛 ──
        if (space.id === 'cathedral' && introDone && !intro && !spaceLoading && quest === 'none' && !guideTried && (!points.has('pilgrimage-done') || params.has('guide'))) { guideTried = true; startGuide(); }
        if (quest === 'mary' && !maryAsked) {
          const gi = grottoIa();
          const busy = joy.length() > 0.1 || keys.size > 0 || !!moveTarget || !!pendingAct || cardOpen() || ringing || crossing || !!intro;
          if (busy) guideIdle = now;
          if (guideIdle !== Infinity && now - guideIdle >= GUIDE_IDLE_MS) goMary();
          else if (gi && Math.hypot(gi.anchor.x - player.pos.x, gi.anchor.z - player.pos.z) < 2.6 && !cardOpen()) maryArrive();
        }
        if (askKind === 'mary' && !cardOpen()) { askKind = null; setTimeout(() => nextBell(), 700); }
        me.pray = !!player.sitting || performance.now() < prayUntil;
        checkExit();
        if (quest === 'stations' && stationShown !== stationK) {
          const a = stationAnchor(stationK);
          if (a && Math.hypot(a.x - player.pos.x, a.z - player.pos.z) < 2.6) reachStation(stationK);
        }
        for (const b of badges) {
          const d = b.ia.anchor.distanceTo(player.pos);
          b.o.visible = d < 22 && !(target && target.ia === b.ia);
          if (b.ia.kind === 'door') { const dr = space.doors.find((x) => x.id === b.ia.id); b.el.textContent = dr?.open ? '🚪 들어가기' : '🚪 문 앞으로 가면 열려요'; }
          b.el.classList.toggle('far', d > 10);
        }
      }
      net.update(dt);
      net.sendPose(player.pos, bodyYaw, !!player.sitting, now);
    }
    // 점검용: window.__cam = { p:[x,y,z], t:[x,y,z] } 이면 카메라를 그 자리에 둔다(비교 촬영)
    const dbg = (window as any).__cam;
    if (dbg) { camera.position.set(dbg.p[0], dbg.p[1], dbg.p[2]); camera.lookAt(dbg.t[0], dbg.t[1], dbg.t[2]); if (dbg.fov && camera.fov !== dbg.fov) { camera.fov = dbg.fov; camera.updateProjectionMatrix(); } }
    adaptRes(dt);
    WIND.time.value = t;
    if (su.time) su.time.value = t;
    grade.uniforms.uTime.value = t;
    grade.uniforms.uAspect.value = innerWidth / innerHeight;
    bakeEnv();
    if (composer) composer.render(); else renderer.render(scene, camera);
    labels.render(scene, camera);
    requestAnimationFrame(frame);
  }

  setHour(Number(hourInput.value));
  $('entry').hidden = true;
  $('hud').hidden = false;
  void loadSpace(first);
  requestAnimationFrame(frame);
  // 점검용 손잡이(브라우저 콘솔 · 자동 시험)
  (window as any).__vhk = { get quest() { return quest; }, get nav() { return nav; }, barrier, lights, grantLight, get camDist() { return camDist; }, holos, points, startStations, reachStation, offerNext, get composer() { return composer; }, setMoveTarget, act, applyCandle, grade, NEAR_FADE, setHour, sound, get bodyYaw() { return bodyYaw; }, set bodyYaw(v: number) { bodyYaw = v; }, scene, me, AVATARS, buildAvatar, animateAvatar, sunDirOf: () => sunDir, player, net, get space() { return space; }, renderer, camera, loadSpace, pick: () => pickAt(new THREE.Vector2(0, 0)), farPick, clickAt, ndcOf, raycaster, get target() { return target; } };
}
