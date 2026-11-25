// 기도의 결계 — 순례자들이 켠 초가 성전을 에워싸는 겹겹의 빛 고리.
// 참고한 분위기(사장님 요청 2026-11-24, 「케이팝 데몬 헌터스」 혼문): ① 빛이 위로 솟는 순간 ② 겹겹이 도는 고리 ③ 깨지려다 다시 이어지는 장면.
// 그림은 따라 그리지 않고, 우리 성지의 초(따뜻한 금빛)로 새로 만든다.
//
// · 초를 켜면: 켠 자리에서 빛줄기가 위로 솟아 → 고리들을 아래에서 위로 차례로 밝히고 → 그 방향의 고리에 틈이 생겼다가 → 빛이 모여 다시 이어 붙는다.
// · 평소: 고리들이 서로 반대로 천천히 돌며 숨 쉬듯 일렁인다. 초가 많을수록 고리가 늘고 밝아진다.
// 가볍게: 그리기 2번(Points 둘) · 점 수 고정(고리 ≤ 5×96 + 솟는 빛 40) · 움직임은 전부 셰이더 · JS 는 값 몇 개만 넣는다.
import * as THREE from 'three';

const RINGS = 8;      // 하늘 가득(사장님 2026-11-25): 고리를 늘려 위로 여러 겹
const PER_RING = 200;
const BEAM = 40;

export interface Barrier {
  object: THREE.Group;
  /** 성지가 바뀔 때 — 둘레의 중심·크기 */
  setSite(center: THREE.Vector3, radius: number): void;
  /** 모인 초의 수(저장된 초 + 지금 켜진 초). 많을수록 고리가 늘고 밝아진다 */
  setLevel(n: number): void;
  /** 초가 켜졌다 — from: 켠 자리(세계 좌표) */
  pulse(from: THREE.Vector3): void;
  update(t: number): void;
  dispose(): void;
}

const RING_VERT = /* glsl */ `
  attribute vec4 aRing;   // x 고리 번호, y 처음 각도, z 도는 속도(부호가 방향), w 점 크기 배율
  uniform float uTime, uRadius, uLevel, uPulseT, uPulseAng, uPx;
  uniform vec3 uCenter;
  varying float vA; varying float vHot; varying vec3 vTint;
  const float PI = 3.14159265;
  float wrap(float x) { return mod(x + PI, 2.0 * PI) - PI; }
  void main() {
    float i = aRing.x;
    float a = aRing.y + uTime * aRing.z;
    float elev = radians(8.0 + i * 9.6);                      // 아래 고리는 낮고 넓게, 위 고리는 높고 좁게(둥근 지붕처럼) — 8겹이 하늘을 덮는다
    float r = uRadius * cos(elev);
    float h = uRadius * sin(elev) * 0.62 + 3.0 + sin(uTime * 0.6 + i * 1.7 + a * 2.0) * 0.9 + sin(aRing.y * 37.0 + i) * 1.6; // 몽글몽글 위아래로 흩어진다
    vec3 p = uCenter + vec3(cos(a) * r, h, sin(a) * r);
    float shown = clamp(uLevel - i + 1.0, 0.0, 1.0);          // 고리가 하나씩 켜진다
    float tw = 0.7 + 0.3 * sin(uTime * 2.1 + aRing.y * 9.0 + i);
    // 초가 켜진 뒤의 움직임: 아래에서 위로 번지는 밝기 + 그 방향에 틈이 생겼다가 이어 붙음
    float dt = uTime - uPulseT - i * 0.42 - 0.9;               // 빛줄기가 올라온 뒤(0.9초) 고리를 차례로 지난다
    float flash = dt > 0.0 ? exp(-pow(dt - 0.35, 2.0) * 3.0) : 0.0;
    float ang = abs(wrap(a - uPulseAng));
    float hole = 0.0;
    if (dt > 0.0 && dt < 2.6) hole = smoothstep(0.75, 0.15, ang) * sin(clamp(dt / 2.6, 0.0, 1.0) * PI);   // 열렸다 닫힌다
    float seal = (dt > 1.3 && dt < 2.6) ? smoothstep(0.5, 0.0, ang) * 1.2 * sin((dt - 1.3) / 1.3 * PI) : 0.0; // 닫힐 때 이음새가 번쩍
    vA = shown * tw * (1.0 - 0.92 * hole);
    vHot = clamp(flash + seal, 0.0, 1.0);
    // 몽환적인 빛깔: 겹마다 금빛 · 분홍 · 연보라 · 하늘 · 연두가 번갈아(아주 옅게)
    float k = mod(i, 5.0);
    vTint = k < 0.5 ? vec3(1.0, 0.78, 0.42) : k < 1.5 ? vec3(1.0, 0.62, 0.78) : k < 2.5 ? vec3(0.78, 0.66, 1.0) : k < 3.5 ? vec3(0.62, 0.84, 1.0) : vec3(0.72, 1.0, 0.82);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (11.0 + vHot * 6.0) * aRing.w * uPx / max(1.0, -mv.z) * shown;   // 통통하게(전엔 3.4)
  }
`;
const RING_FRAG = /* glsl */ `
  varying float vA; varying float vHot; varying vec3 vTint;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0 || vA < 0.01) discard;
    float core = exp(-r * r * 4.0);                  // 통통하고 몽글한 빛덩어리(가장자리는 부드럽게 사라진다)
    float halo = exp(-r * r * 1.6);
    vec3 c = mix(vTint, vec3(1.0, 0.97, 0.9), core * 0.8);
    c = mix(c, vec3(1.0, 0.98, 0.92), vHot);
    gl_FragColor = vec4(c, clamp((halo * 0.55 + core * 0.55) * vA * (0.85 + vHot), 0.0, 1.0));
  }
`;
const BEAM_VERT = /* glsl */ `
  attribute vec3 aB;      // x 줄기 안 위치(0~1), y 옆 흔들림 각도, z 크기
  uniform float uTime, uPulseT, uPx, uTop;
  uniform vec3 uFrom;
  varying float vA;
  void main() {
    float age = uTime - uPulseT;
    float rise = clamp(age / 0.9, 0.0, 1.0);                  // 0.9초 동안 솟는다
    float k = aB.x * rise;
    float y = k * uTop;
    float sway = sin(aB.y + uTime * 3.0) * 0.35 * (1.0 - k);
    vec3 p = uFrom + vec3(cos(aB.y) * sway, y + 0.4, sin(aB.y) * sway);
    vA = (age > 0.0 && age < 2.4) ? (1.0 - smoothstep(0.9, 2.4, age)) * (0.4 + 0.6 * aB.x) : 0.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aB.z * uPx / max(1.0, -mv.z) * (vA > 0.0 ? 1.0 : 0.0);
  }
`;
const BEAM_FRAG = /* glsl */ `
  varying float vA;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0 || vA < 0.01) discard;
    float core = smoothstep(0.5, 0.0, r);
    gl_FragColor = vec4(mix(vec3(1.0, 0.8, 0.4), vec3(1.0, 0.97, 0.85), core), pow(1.0 - r, 0.8) * vA);
  }
`;

export function createBarrier(opts: { low: boolean; pixelRatio: number; viewH: () => number }): Barrier {
  const perRing = opts.low ? 100 : PER_RING;
  const n = RINGS * perRing;
  const ring = new Float32Array(n * 4), zero = new Float32Array(n * 3);
  const rnd = (i: number, k: number) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < RINGS; i++) for (let j = 0; j < perRing; j++) {
    const o = (i * perRing + j) * 4;
    ring.set([i, (j / perRing) * Math.PI * 2 + rnd(j, i) * 0.04, (i % 2 ? -1 : 1) * (0.03 + i * 0.008), 0.7 + rnd(j, i + 9) * 0.9], o);
  }
  const g1 = new THREE.BufferGeometry();
  g1.setAttribute('position', new THREE.BufferAttribute(zero, 3));
  g1.setAttribute('aRing', new THREE.BufferAttribute(ring, 4));
  g1.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const U = {
    uTime: { value: 0 }, uRadius: { value: 60 }, uLevel: { value: 2 }, uPulseT: { value: -100 }, uPulseAng: { value: 0 }, uPx: { value: 1 },
    uCenter: { value: new THREE.Vector3() },
  };
  const m1 = new THREE.ShaderMaterial({ vertexShader: RING_VERT, fragmentShader: RING_FRAG, uniforms: U, transparent: true, depthWrite: false, toneMapped: false });
  const rings = new THREE.Points(g1, m1);
  rings.frustumCulled = false; rings.renderOrder = 18;

  const b = new Float32Array(BEAM * 3), bz = new Float32Array(BEAM * 3);
  for (let i = 0; i < BEAM; i++) b.set([(i + 1) / BEAM, rnd(i, 3) * 6.283, 0.35 + rnd(i, 4) * 0.4], i * 3);
  const g2 = new THREE.BufferGeometry();
  g2.setAttribute('position', new THREE.BufferAttribute(bz, 3));
  g2.setAttribute('aB', new THREE.BufferAttribute(b, 3));
  g2.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const UB = { uTime: U.uTime, uPulseT: U.uPulseT, uPx: U.uPx, uTop: { value: 40 }, uFrom: { value: new THREE.Vector3() } };
  const m2 = new THREE.ShaderMaterial({ vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, uniforms: UB, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
  const beam = new THREE.Points(g2, m2);
  beam.frustumCulled = false; beam.renderOrder = 19;

  const object = new THREE.Group(); object.name = 'prayer-barrier'; object.add(rings, beam);
  let lastT = 0;
  return {
    object,
    setSite(center, radius) { U.uCenter.value.copy(center); U.uRadius.value = radius; UB.uTop.value = radius * 0.62 * Math.sin(THREE.MathUtils.degToRad(10 + 4 * 13)) + 3; },
    setLevel(count) { U.uLevel.value = Math.min(RINGS, 5 + Math.floor(count / 8)); }, // 처음부터 다섯 겹은 하늘에 떠 있고, 초가 모일수록 위로 겹이 늘어 하늘을 채운다
    pulse(from) {
      UB.uFrom.value.copy(from);
      U.uPulseT.value = lastT;
      U.uPulseAng.value = Math.atan2(from.z - U.uCenter.value.z, from.x - U.uCenter.value.x);
    },
    update(t) { lastT = t; U.uTime.value = t; U.uPx.value = opts.viewH() * opts.pixelRatio * 0.5; },
    dispose() { g1.dispose(); g2.dispose(); m1.dispose(); m2.dispose(); },
  };
}
