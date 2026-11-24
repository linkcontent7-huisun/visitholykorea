// 순례자의 빛 — 순례자 주위를 오르내리며 도는 영롱한 빛들(성단).
// · 작은 빛(늘 있음): 은은히 오르내리며 순례자를 따라다닌다.
// · 큰 빛(성지마다 하나): 그 성지의 순례를 마치면 받는다. 성지마다 색이 다르다. 모을수록 성단이 풍성해진다.
//
// 가볍게 — 사장님 요구: 캐릭터 움직임이 느려지면 안 된다.
//  · 그리기 1번(Points 한 개), 점 수 상한 고정(작은 빛 ≤ 10 + 큰 빛 ≤ 12).
//  · 움직임은 전부 정점 셰이더가 한다 → 매 프레임 JS 가 하는 일은 중심 위치 값 하나 넣기뿐.
//  · 그림자·조명·텍스처 없음(그리기 점만 동그랗게 번지는 셰이더).
//  · 자동 절약: 평균 프레임이 느리면(>26ms) 작은 빛을 줄이고, 더 느리면(>40ms) 큰 빛 일부만 남긴다.
import * as THREE from 'three';

/** 성지(공간)마다 다른 큰 빛 — 색(핵심·가장자리)과 이름. 성지를 늘릴 때 여기에만 한 줄 더한다. */
export const SANCTUARY_LIGHTS: Record<string, { name: string; core: number; rim: number; orbit: number }> = {
  cathedral: { name: '명동의 금빛', core: 0xfff1b8, rim: 0xffb23a, orbit: 0.95 },
  chapel: { name: '언덕 위 경당의 푸른 빛', core: 0xd9f2ff, rim: 0x6fb6ff, orbit: 1.15 },
};

const KEY = 'vhk-lights-v1';
const MAX_SMALL = 10;
const MAX_BIG = 12;

function readOwned(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
function writeOwned(o: Record<string, number>) {
  try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* 저장이 막혀도 이번 접속에서는 보인다 */ }
}

export interface PilgrimLights {
  object: THREE.Points;
  owned(): string[];
  /** 그 성지의 큰 빛을 받는다. 처음이면 true */
  award(spaceId: string): boolean;
  update(t: number, dt: number, center: THREE.Vector3, scale?: number): void;
  dispose(): void;
}

const VERT = /* glsl */ `
  attribute vec4 aOrbit;   // x 반지름, y 속도, z 처음 각도, w 높이 기준
  attribute vec4 aLook;    // x 크기, y 오르내림 폭, z 오르내림 속도, w 태어난 때(초)
  attribute vec3 aCore;
  attribute vec3 aRim;
  uniform float uTime; uniform vec3 uCenter; uniform float uScale; uniform float uPx;
  varying vec3 vCore; varying vec3 vRim; varying float vTw;
  void main() {
    float a = aOrbit.z + uTime * aOrbit.y;
    float r = aOrbit.x * uScale;
    float h = aOrbit.w * uScale + sin(uTime * aLook.z + aOrbit.z * 3.0) * aLook.y * uScale;
    vec3 p = uCenter + vec3(cos(a) * r, h, sin(a) * r);
    float age = uTime - aLook.w;
    float grow = clamp(age / 2.5, 0.0, 1.0);
    grow = grow * grow * (3.0 - 2.0 * grow);
    float burst = age > 0.0 && age < 2.5 ? 1.0 + 2.2 * (1.0 - grow) : 1.0; // 받는 순간 크게 반짝이다 자리를 잡는다
    vTw = 0.75 + 0.25 * sin(uTime * (1.7 + aLook.z * 0.3) + aOrbit.z * 5.0);
    vCore = aCore; vRim = aRim;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aLook.x * grow * burst * uPx / max(0.5, -mv.z);
  }
`;
const FRAG = /* glsl */ `
  varying vec3 vCore; varying vec3 vRim; varying float vTw;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    if (r > 1.0) discard;
    float core = smoothstep(0.55, 0.0, r);          // 밝은 가운데
    float halo = pow(1.0 - r, 0.7);                  // 번지는 둘레
    vec3 col = mix(vRim, vCore, core) * (0.55 + core * 1.1) * vTw;
    gl_FragColor = vec4(col, clamp(halo * 0.75 + core * 0.4, 0.0, 1.0));
  }
`;

export function createPilgrimLights(opts: { low: boolean; pixelRatio: number; viewH: () => number }): PilgrimLights {
  const total = MAX_SMALL + MAX_BIG;
  const orbit = new Float32Array(total * 4), look = new Float32Array(total * 4), core = new Float32Array(total * 3), rim = new Float32Array(total * 3);
  const pos = new Float32Array(total * 3); // 점의 자리는 셰이더가 정하니 0 으로 둔다(모양 만들기용)
  const rnd = (i: number, k: number) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
  const c = new THREE.Color();

  // 작은 빛 — 늘 있음(앞쪽 칸)
  const smallCount = opts.low ? 6 : MAX_SMALL;
  for (let i = 0; i < MAX_SMALL; i++) {
    orbit.set([0.7 + rnd(i, 1) * 0.9, (0.5 + rnd(i, 2) * 0.7) * (i % 2 ? 1 : -1), rnd(i, 3) * 6.283, 0.35 + rnd(i, 4) * 1.5], i * 4);
    look.set([0.34 + rnd(i, 5) * 0.14, 0.12 + rnd(i, 6) * 0.1, 1.0 + rnd(i, 7) * 1.4, -100], i * 4);
    c.setHex(0xfff6dc); core.set([c.r, c.g, c.b], i * 3);
    c.setHex(0xf6d68a); rim.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const aOrbit = new THREE.BufferAttribute(orbit, 4), aLook = new THREE.BufferAttribute(look, 4);
  const aCore = new THREE.BufferAttribute(core, 3), aRim = new THREE.BufferAttribute(rim, 3);
  geo.setAttribute('aOrbit', aOrbit); geo.setAttribute('aLook', aLook); geo.setAttribute('aCore', aCore); geo.setAttribute('aRim', aRim);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); // 셰이더가 자리를 정하니 가려내기에서 빠지지 않게

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.NormalBlending, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uScale: { value: 1 }, uPx: { value: 1 } },
  });
  const object = new THREE.Points(geo, mat);
  object.frustumCulled = false; object.renderOrder = 20; object.name = 'pilgrim-lights';

  const bigSlots: string[] = []; // 큰 빛 칸 순서 = 받은 순서
  let t0 = 0;
  const owned = readOwned();

  function placeBig(spaceId: string, born: number) {
    const def = SANCTUARY_LIGHTS[spaceId];
    if (!def) return;
    const k = bigSlots.length; if (k >= MAX_BIG) return;
    const i = MAX_SMALL + k;
    bigSlots.push(spaceId);
    orbit.set([def.orbit + (k % 3) * 0.28 + rnd(i, 1) * 0.15, (0.28 + rnd(i, 2) * 0.22) * (k % 2 ? -1 : 1), (k / MAX_BIG) * 6.283 + rnd(i, 3), 0.55 + (k % 4) * 0.28 + rnd(i, 4) * 0.2], i * 4);
    look.set([1.1 + rnd(i, 5) * 0.12, 0.22, 0.8 + rnd(i, 7) * 0.6, born], i * 4);
    c.setHex(def.core); core.set([c.r, c.g, c.b], i * 3);
    c.setHex(def.rim); rim.set([c.r, c.g, c.b], i * 3);
    aOrbit.needsUpdate = aLook.needsUpdate = aCore.needsUpdate = aRim.needsUpdate = true;
  }
  for (const id of Object.keys(owned).sort((a, b) => owned[a] - owned[b])) placeBig(id, -100);

  // 그리는 범위: 작은 빛 칸 + 받은 큰 빛 칸. 안 쓰는 칸은 크기 0.
  const applyRange = () => geo.setDrawRange(0, MAX_SMALL + bigSlots.length);
  applyRange();

  // 느리면 스스로 줄인다(작은 빛 칸의 크기를 0 으로)
  let avg = 16, slowFor = 0, smallShown = MAX_SMALL;
  const setSmallShown = (n: number) => {
    if (n === smallShown) return; smallShown = n;
    for (let i = 0; i < MAX_SMALL; i++) look[i * 4] = i < n ? 0.34 + rnd(i, 5) * 0.14 : 0;
    aLook.needsUpdate = true;
  };
  setSmallShown(smallCount);

  return {
    object,
    owned: () => Object.keys(owned),
    award(spaceId) {
      if (!SANCTUARY_LIGHTS[spaceId] || owned[spaceId]) return false;
      owned[spaceId] = Date.now(); writeOwned(owned);
      placeBig(spaceId, t0); applyRange();
      return true;
    },
    update(t, dt, center, scale = 1) {
      t0 = t;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uCenter.value.copy(center);
      mat.uniforms.uScale.value = scale;
      mat.uniforms.uPx.value = opts.viewH() * opts.pixelRatio * 0.5;
      avg += (dt * 1000 - avg) * 0.03;
      if (avg > 40) slowFor += dt; else if (avg > 26) slowFor += dt * 0.5; else slowFor = Math.max(0, slowFor - dt);
      if (slowFor > 3) { setSmallShown(avg > 40 ? 0 : 3); slowFor = 0; }
      else if (slowFor === 0 && avg < 20 && smallShown < smallCount) setSmallShown(smallCount);
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}
