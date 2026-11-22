// 수호천사의 빛 — 명동 시제품 (2026-11-22 사장님 말씀, 팀장 지시서 6호·7호 일 A-2)
// 하늘의 빛(14가지 × 2, 모두가 보는 풍경, 저장 안 함)이 떠다니다 가끔 우박처럼 땅으로 쏟아져 통통 튀고, 다시 한꺼번에 올라간다.
// 순례를 마치면 하늘에서 빛 하나가 내려와 순례자 뒤를 한 줄로 따라온다(내 빛, 기기에 저장).
// 내 빛이 모이면 자리를 찾아 별자리처럼 선이 이어져 수호천사가 된다. (사장님 2026-11-22, 기준 화면: 빛모양후보.html 「하늘 장면」)
// 얼굴·사람 모양은 그리지 않는다. 점과 선과 빛뿐이다(멘토 계획 2.4).
//
// 빛의 그리는 방식은 심재학 멘토 목업(`목업/사람샘플.html` 404-427행: 가운데 밝고 바깥 투명한 둥근 번짐 한 장 + 더하기 섞기)을,
// 모양은 사장님이 「1~14까지 다 넣어줘」 하신 후보 화면(2026-11-22, `성지-작업/명동/2026-11-22-빛모양후보.html` ITEMS) 14가지를 따른다.
// 낮에도 흰 점으로 사라지지 않게 가운데에 단단한 속(흰 알·초롱·수정)을 둔다. 움직일 때는 빛 꼬리가 끌린다.
// 빛 열두 개를 모두 합쳐 ① 단단한 속 한 덩어리(정점 셰이더가 빛마다 자리·크기·돌기를 옮김) ② 번짐·빛살·꼬리 한 묶음
// ③ 선 한 묶음(천사 선 + 수정 모서리) = 그리는 횟수 3회.
import * as THREE from 'three';
import { loadLights, saveLights, localDay, receivedToday, type StoredLight } from './pilgrim-store.ts';

// ───────────── 값 표 (여기만 고치면 된다) ─────────────
export const GL = {
  /** 끄는 스위치. 주소에 ?nolights 를 붙여도 꺼진다 */
  enabled: true,
  /** 모양이 다 차는 빛 수 = 별 수 */
  full: 12,
  /** 이 수까지는 순례자 뒤를 한 줄로 따라온다. 그다음부터 수호천사 자기 자리로 간다 */
  followMax: 6,
  /** 하루에 받을 수 있는 빛 수 */
  perDay: 1,
  /** 기본 수호천사 안(1·2·3). 미리보기 주소 ?angel=2 로 바꿔 볼 수 있다 */
  angel: 1 as 1 | 2 | 3,
  /** 수호천사 크기(1 = 높이 약 2.5 m) · 순례자에게서 떨어진 거리(m, 카메라에서 보아 오른쪽) */
  angelScale: 1,
  angelSide: 1.6,
  /** 한 줄로 따라올 때: 머리 위 높이(m), 첫 빛과 순례자 사이(m), 빛 사이(m) */
  followHeight: 1.75,
  followGap0: 1.1,
  followGap: 0.85,
  /** 빛 크기(후보 화면 배율 그대로: 하늘 0.4, 따라오는 빛 0.45) · 천사 자리 · 한 줄 비교 사진 */
  skyLightScale: 0.4,
  followScale: 0.45,
  seatedScale: 0.3,
  lineupScale: 0.3,
  /** 하늘의 빛 수(14가지 × 2) · 퍼진 너비(±m) · 높이(m, 순례자 기준) */
  skyCount: 28,
  skySpread: 13,
  skyHeight: [8, 12] as [number, number],
  /** 우박: 쏟아지는 간격(초, 미리보기 ?hail=9) · 입장 뒤 처음 쏟아지기까지(초) · 중력 · 튀는 정도 · 땅 위 쉬는 높이(m) · 다 내려앉은 뒤 쉬는 시간 · 올라가는 시간 */
  hailEvery: 300,
  hailFirst: 6,
  gravity: 22,
  bounce: 0.38,
  restHeight: 0.35,
  restSec: 1.6,
  riseSec: 2.8,
  /** 번짐 밝기(목업 env.glow — 낮 0.85) · 선 밝기 */
  glow: 0.85,
  lineAlpha: 0.7,
  /** 빛 모양 14가지(사장님: 후보 1~14 전부) — 이름은 코드 안에서만 쓴다 */
  shapes: ['구슬', '불꽃', '십자빛', '별', '꽃', '겹구슬', '날개빛', '반딧불 무리', '초롱', '햇살 바퀴', '이슬빛', '별똥 꼬리', '빛 결정', '은하 소용돌이'] as const,
  /** 모양마다 바탕 빛깔(후보 화면 그대로). 받을 때 색상·밝기를 조금씩 흔든다 */
  shapeColors: [0xffd27a, 0xffa040, 0xfff0b0, 0xbfe0ff, 0xff9ec8, 0xa8f0d0, 0xfff2c4, 0xd8ff70, 0xffb060, 0xffd966, 0x8fd8ff, 0xc8a8ff, 0x9fe8ff, 0xb8c8ff],
  /** 은하 소용돌이·반딧불 무리의 작은 빛 수(후보 화면 48·14). 무거우면 여기서 줄인다 */
  galaxyStars: 48,
  fireflies: 14,
  /** 후보 화면의 길이 단위 → m (후보 화면의 순례자 키와 견주어 1:1) */
  unit: 1,
};

/** 수호천사 안 — 별 12개 자리(x 좌우, y 높이, m)와 잇는 선(별 번호 쌍). 그림: 성지-작업/명동/비교/2026-11-22-수호천사-빛/ */
const ANGELS: Record<1 | 2 | 3, { pts: [number, number][]; lines: [number, number][] }> = {
  1: { // 날개를 편 천사
    pts: [[0, 2.45], [0, 2.1], [0, 1.7], [0, 1.05], [-0.32, 0.25], [0.32, 0.25], [-0.55, 1.95], [-1.05, 2.3], [-0.9, 1.45], [0.55, 1.95], [1.05, 2.3], [0.9, 1.45]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [4, 5], [2, 6], [6, 7], [7, 8], [8, 2], [2, 9], [9, 10], [10, 11], [11, 2]],
  },
  2: { // 두 손 모은 천사
    pts: [[0, 2.45], [0, 2.12], [-0.28, 1.8], [0.28, 1.8], [0, 1.45], [0, 0.95], [-0.3, 0.25], [0.3, 0.25], [-0.62, 2.35], [0.62, 2.35], [-0.6, 1.05], [0.6, 1.05]],
    lines: [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6], [5, 7], [6, 7], [2, 8], [8, 10], [10, 6], [3, 9], [9, 11], [11, 7]],
  },
  3: { // 감싸 지키는 천사
    pts: [[0.15, 2.4], [0.15, 2.05], [0.1, 1.65], [0, 1.0], [-0.3, 0.2], [0.35, 0.2], [0.7, 1.95], [1.15, 2.45], [1.2, 1.55], [-0.45, 1.7], [-0.95, 1.5], [-1.05, 1.05]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [4, 5], [2, 6], [6, 7], [7, 8], [8, 2], [2, 9], [9, 10], [10, 11]],
  },
};

type Light = StoredLight;

const MAX = 28 + 14; // 하늘의 빛 28 + 내 빛 12(미리보기 ?lineup 은 14)
const TAILS = 4;
/** 번짐 묶음 한 칸 수 — 가장 많은 은하(번짐 2 + 작은 빛 48) + 꼬리 4 */
const SPRITES_PER = 2 + 48 + TAILS;
/** 수정 모서리 선 수(팔면체 12) */
const GEM_EDGES = 12;

// ── ① 단단한 속: 빛마다 모양을 미리 지어 한 덩어리로 합친다. 자리·크기·돌기·빛깔은 정점 셰이더가 uniform 으로 옮긴다
const CORE_VERT = /* glsl */ `
attribute float aIdx; attribute vec3 aCol; attribute float aTint;
uniform vec4 uP[${MAX}];   // xyz 중심, w 크기(0 이면 숨김)
uniform vec4 uS[${MAX}];   // x 세로축 돌기, y 앞뒤 흔들림(초롱), z 빛깔이 바뀌는 부분(수정)의 지금 색상(0~1), w 그 채도
varying vec3 vCol;
vec3 hsl(float h, float s, float l) { vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); return l + s * (k - 0.5) * (1.0 - abs(2.0 * l - 1.0)); }
void main() {
  int i = int(aIdx + 0.5);
  vec4 P = uP[i]; vec4 S = uS[i];
  vec3 p = position;
  float cz = cos(S.y), sz = sin(S.y);
  p = vec3(p.x * cz - p.y * sz, p.x * sz + p.y * cz, p.z);
  float c = cos(S.x), s = sin(S.x);
  p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  vCol = aTint > 0.5 ? hsl(S.z, S.w, 0.68) : aCol;
  gl_Position = projectionMatrix * viewMatrix * vec4(P.xyz + p * P.w, 1.0);
}`;
const CORE_FRAG = /* glsl */ `varying vec3 vCol; void main() { gl_FragColor = vec4(vCol, 1.0); }`;

// ── ② 번짐 묶음: 카메라를 보는 네모 한 장씩(가운데 밝고 바깥 투명한 둥근 그림 한 장을 모두 같이 씀). 빛살은 길쭉하게 돌려 그린다
const GLOW_VERT = /* glsl */ `
attribute vec4 iPos;   // xyz 자리, w 크기(가로)
attribute vec4 iCol;   // rgb 빛깔, a 투명도
attribute vec2 iShape; // x 세로/가로 비, y 화면 안에서 돌리는 각
varying vec2 vUv; varying vec4 vCol;
void main() {
  vUv = uv; vCol = iCol;
  vec4 mv = viewMatrix * vec4(iPos.xyz, 1.0);
  vec2 q = position.xy * vec2(iPos.w, iPos.w * iShape.x);
  float c = cos(iShape.y), s = sin(iShape.y);
  mv.xy += vec2(q.x * c - q.y * s, q.x * s + q.y * c);
  gl_Position = projectionMatrix * mv;
}`;
const GLOW_FRAG = /* glsl */ `
uniform sampler2D uMap; varying vec2 vUv; varying vec4 vCol;
void main() { float a = texture2D(uMap, vUv).r * vCol.a; if (a < 0.003) discard; gl_FragColor = vec4(vCol.rgb * a, a); }`;

const WHITE = new THREE.Color(0xfff8ec);
const FLOWER_CORE = new THREE.Color(0xffe9a0);

/** 목업 glowTex 그대로 — 128px 둥근 번짐 */
function glowTexture(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.14)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(c);
}

/** 수정(팔면체) 꼭짓점 — 모서리 선을 빛마다 CPU 에서 옮겨 선 묶음에 넣는다 */
const GEM_V = [[0.42, 0, 0], [-0.42, 0, 0], [0, 0.63, 0], [0, -0.63, 0], [0, 0, 0.42], [0, 0, -0.42]];
const GEM_E: [number, number][] = [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5]];

/** 빛 하나의 단단한 속 — 시험 화면 단위(곱하기 GL.unit 은 바깥에서). tint=1 이면 빛깔이 바뀌는 부분 */
function coreParts(shape: number, color: THREE.Color): { g: THREE.BufferGeometry; col: THREE.Color; tint?: boolean }[] {
  const out: { g: THREE.BufferGeometry; col: THREE.Color; tint?: boolean }[] = [];
  const add = (g: THREE.BufferGeometry, col: THREE.Color, tint = false) => out.push({ g, col, tint });
  // 흰 알(단단한 속) — 반딧불 무리·별똥 꼬리는 가운데가 없다(후보 화면 그대로)
  const dot: Record<number, [number, number]> = { 0: [0.16, 0], 1: [0.1, -0.15], 2: [0.1, 0.25], 3: [0.11, 0], 4: [0.11, 0], 5: [0.14, 0], 6: [0.11, 0.05], 9: [0.14, 0], 10: [0.09, 0], 13: [0.12, 0] };
  const d = dot[shape];
  if (d) add(new THREE.SphereGeometry(d[0], 16, 12).translate(0, d[1], 0), shape === 4 ? new THREE.Color(0xffe9a0) : WHITE);
  if (shape === 8) {                                                            // 초롱 — 시험 화면의 원통 + 위아래 뚜껑에 살대·고리·술을 더함
    const paper = color.clone().lerp(WHITE, 0.35);
    const wood = new THREE.Color(0x3a2418), red = new THREE.Color(0xb23a2e);
    // 몸: 가운데가 조금 부푼 한지 몸통(정면에서 네모 상자로 보이지 않게)
    const prof = [[0.2, -0.31], [0.27, -0.2], [0.3, 0], [0.27, 0.2], [0.2, 0.31]].map(([x, y]) => new THREE.Vector2(x, y));
    add(new THREE.LatheGeometry(prof, 24), paper);
    for (const y of [0.34, -0.34]) add(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 20).translate(0, y, 0), wood);
    for (let k = 0; k < 8; k++) { // 살대 8개 — 몸통 곡선을 따라
      const a = (k / 8) * Math.PI * 2;
      const bar = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(prof.map((v) => new THREE.Vector3(Math.cos(a) * (v.x + 0.006), v.y, Math.sin(a) * (v.x + 0.006)))), 8, 0.009, 4);
      add(bar, wood);
    }
    add(new THREE.TorusGeometry(0.06, 0.012, 6, 16).translate(0, 0.43, 0), wood);   // 고리
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6).translate(0, -0.41, 0), red); // 술 끈
    add(new THREE.SphereGeometry(0.035, 10, 8).translate(0, -0.47, 0), red);           // 매듭
    add(new THREE.ConeGeometry(0.06, 0.22, 10).translate(0, -0.6, 0), red); // 술
  } else if (shape === 12) {                                                    // 빛 결정: 세로로 긴 수정
    add(new THREE.OctahedronGeometry(0.42).scale(1, 1.5, 1), color, true);
  }
  return out;
}

/** 그릴 빛 한 개(하늘의 빛이든 내 빛이든 같은 모양) */
interface Slot { shape: number; color: THREE.Color; hsl: { h: number; s: number; l: number }; phase: number; r: number[]; pos: THREE.Vector3; prev: THREE.Vector3; size: number }

function slotOf(shape: number, color: string, seed: number): Slot {
  const rnd = mulberry(seed);
  const c = new THREE.Color(color); const hsl = { h: 0, s: 0, l: 0 }; c.getHSL(hsl);
  return { shape, color: c, hsl, phase: rnd() * 10, r: Array.from({ length: 24 }, rnd), pos: new THREE.Vector3(0, -999, 0), prev: new THREE.Vector3(0, -999, 0), size: 0 };
}

/** 하늘의 빛 하나 — 저장하지 않는 풍경 */
interface SkyLight { slot: Slot; home: THREE.Vector3; vy: number; landed: boolean; bounces: number; floor: number }

export class GuardianLights {
  readonly root = new THREE.Group();
  /** 내 빛(순례를 마쳐 받은 것, 기기에 저장) */
  private lights: Light[] = [];
  private mine: Slot[] = [];
  /** 하늘의 빛(14가지 × 2) */
  private sky: SkyLight[] = [];
  private preview = false;
  private lineup = false;
  private angel: 1 | 2 | 3 = GL.angel;
  private core: THREE.Mesh;
  private uP: THREE.Vector4[] = []; private uS: THREE.Vector4[] = [];
  private glowGeo: THREE.InstancedBufferGeometry;
  private iPos: Float32Array; private iCol: Float32Array; private iShape: Float32Array;
  private lines: THREE.LineSegments;
  private lpos: Float32Array; private lcol: Float32Array;
  private s = 0; private m = 0;
  // 우박: 떠다님 → 떨어짐 → 쉼 → 함께 올라감
  private hail: 'float' | 'fall' | 'rest' | 'rise' = 'float';
  private hailT = 0; private sinceHail = 0;
  private riseFrom: THREE.Vector3[] = [];
  private skyCenter = new THREE.Vector3(); private skyReady = false;
  // 내 빛이 따라오는 길(순례자가 지나간 자리, 일정 간격으로 찍음)
  private trail: THREE.Vector3[] = [];
  private arriving = -1; private arriveT = 0; private arriveFrom = new THREE.Vector3();
  private flash = 0; private flashedFull = false;
  private anchor = new THREE.Vector3(); private anchorReady = false;
  private ray = new THREE.Ray();
  /** 공간의 충돌 덩어리 — 떨어진 빛이 땅·계단·지붕에서 튀게 */
  bvh: { raycastFirst(ray: THREE.Ray, side?: THREE.Side): { point: THREE.Vector3 } | null } | null = null;
  onMessage: (text: string) => void = () => {};

  static wanted(): boolean {
    try { return GL.enabled && !new URLSearchParams(location.search).has('nolights'); } catch { return GL.enabled; }
  }

  constructor(scene: THREE.Scene) {
    const q = new URLSearchParams(location.search);
    const a = Number(q.get('angel'));
    if (a === 1 || a === 2 || a === 3) this.angel = a;
    const pv = q.get('lights');
    if (pv !== null) {
      // 미리보기: 저장된 빛을 건드리지 않고 이 화면에서만. ?shapes 차례로 · ?shape=13 모두 한 모양 · ?lineup 14가지를 한 줄로
      this.preview = true;
      this.lineup = q.has('lineup');
      const n = THREE.MathUtils.clamp(Number(pv) | 0, 0, this.lineup ? GL.shapes.length : GL.full);
      const rnd = mulberry(7), one = q.get('shape');
      for (let i = 0; i < n; i++) {
        const shape = one !== null ? THREE.MathUtils.clamp(Number(one) | 0, 0, GL.shapes.length - 1) : q.has('shapes') || this.lineup ? i % GL.shapes.length : Math.floor(rnd() * GL.shapes.length);
        this.lights.push({ shape, color: pickColor(rnd, shape), at: 'preview', seed: Math.floor(rnd() * 1e9) });
      }
    } else this.lights = loadLights().filter((l) => l.shape < GL.shapes.length).slice(0, GL.full);
    const h = Number(q.get('hail'));
    if (h > 0) GL.hailEvery = h;
    if (q.has('nosky') || this.lineup) GL.skyCount = 0;
    this.mine = this.lights.map((L, i) => slotOf(L.shape, L.color, L.seed ?? i * 7919 + 13));
    const rs = mulberry(2026);
    for (let k = 0; k < GL.skyCount; k++) {
      const shape = k % GL.shapes.length;
      this.sky.push({ slot: slotOf(shape, pickColor(rs, shape), Math.floor(rs() * 1e9)), home: new THREE.Vector3((rs() - 0.5) * 2 * GL.skySpread, GL.skyHeight[0] + rs() * (GL.skyHeight[1] - GL.skyHeight[0]), (rs() - 0.5) * 2 * GL.skySpread), vy: 0, landed: false, bounces: 0, floor: 0 });
    }

    for (let i = 0; i < MAX; i++) { this.uP.push(new THREE.Vector4(0, -999, 0, 0)); this.uS.push(new THREE.Vector4(0, 0, -1, 0)); }
    this.core = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ vertexShader: CORE_VERT, fragmentShader: CORE_FRAG, uniforms: { uP: { value: this.uP }, uS: { value: this.uS } } }));
    this.core.frustumCulled = false; this.core.renderOrder = 5;

    const N = MAX * SPRITES_PER;
    this.glowGeo = new THREE.InstancedBufferGeometry();
    const quad = new THREE.PlaneGeometry(1, 1);
    this.glowGeo.index = quad.index; this.glowGeo.setAttribute('position', quad.getAttribute('position')); this.glowGeo.setAttribute('uv', quad.getAttribute('uv'));
    this.iPos = new Float32Array(N * 4); this.iCol = new Float32Array(N * 4); this.iShape = new Float32Array(N * 2);
    this.glowGeo.setAttribute('iPos', new THREE.InstancedBufferAttribute(this.iPos, 4).setUsage(THREE.DynamicDrawUsage));
    this.glowGeo.setAttribute('iCol', new THREE.InstancedBufferAttribute(this.iCol, 4).setUsage(THREE.DynamicDrawUsage));
    this.glowGeo.setAttribute('iShape', new THREE.InstancedBufferAttribute(this.iShape, 2).setUsage(THREE.DynamicDrawUsage));
    this.glowGeo.instanceCount = 0;
    const glowMesh = new THREE.Mesh(this.glowGeo, new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, uniforms: { uMap: { value: glowTexture() } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    glowMesh.frustumCulled = false; glowMesh.renderOrder = 7;

    const maxL = Math.max(...Object.values(ANGELS).map((x) => x.lines.length)) + MAX * GEM_EDGES;
    this.lpos = new Float32Array(maxL * 6); this.lcol = new Float32Array(maxL * 6);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(this.lpos, 3).setUsage(THREE.DynamicDrawUsage));
    lg.setAttribute('color', new THREE.BufferAttribute(this.lcol, 3).setUsage(THREE.DynamicDrawUsage));
    this.lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    this.lines.frustumCulled = false; this.lines.renderOrder = 6;
    this.root.add(this.core, this.lines, glowMesh);
    scene.add(this.root);
    this.rebuild();
    // 입장 직후 한 번 쏟아진다
    this.sinceHail = GL.hailEvery - GL.hailFirst;
  }

  get count() { return this.lights.length; }
  /** 그리는 순서: 하늘의 빛 먼저, 그다음 내 빛 */
  private get slots(): Slot[] { return [...this.sky.map((x) => x.slot), ...this.mine]; }

  /** 빛 목록이 바뀌면 단단한 속 덩어리를 다시 만든다 */
  private rebuild() {
    const pos: number[] = [], idx: number[] = [], col: number[] = [], tint: number[] = [], index: number[] = [];
    this.slots.forEach((S, i) => {
      for (const part of coreParts(S.shape, S.color)) {
        const g = part.g.scale(GL.unit, GL.unit, GL.unit); const base = pos.length / 3;
        const P = g.getAttribute('position') as THREE.BufferAttribute;
        for (let k = 0; k < P.count; k++) { pos.push(P.getX(k), P.getY(k), P.getZ(k)); idx.push(i); col.push(part.col.r, part.col.g, part.col.b); tint.push(part.tint ? 1 : 0); }
        if (g.index) for (let k = 0; k < g.index.count; k++) index.push(base + g.index.getX(k));
        else for (let k = 0; k < P.count; k++) index.push(base + k);
        g.dispose();
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aIdx', new THREE.Float32BufferAttribute(idx, 1));
    geo.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 1));
    geo.setIndex(index);
    this.core.geometry.dispose(); this.core.geometry = geo;
  }

  /** 순례를 마쳤을 때 부른다. 받았으면 true */
  grant(from?: THREE.Vector3): boolean {
    if (this.lights.length >= GL.full) return false;
    const today = localDay();
    if (!this.preview && receivedToday(this.lights) >= GL.perDay) return false;
    const shape = Math.floor(Math.random() * GL.shapes.length);
    const L: Light = { shape, color: pickColor(Math.random, shape), at: today, seed: Math.floor(Math.random() * 1e9) };
    this.lights.push(L);
    if (!this.preview) saveLights(this.lights);
    const S = slotOf(L.shape, L.color, L.seed!);
    this.mine.push(S);
    this.rebuild();
    // 하늘에서 하나 내려온다
    this.arriving = this.mine.length - 1; this.arriveT = 0;
    this.arriveFrom.copy(from ?? this.skyCenter).setY((from ?? this.skyCenter).y + GL.skyHeight[1]);
    if (this.lights.length === GL.full) this.flashedFull = false;
    this.onMessage(this.lights.length === GL.full ? '빛 열두 개가 모두 모여 수호천사가 되었습니다' : '하늘에서 빛 하나가 내려와 뒤를 따라옵니다');
    return true;
  }

  /** 미리보기·시험용: 지금 쏟아지게 */
  hailNow() { if (this.hail === 'float') this.startHail(); }

  private startHail() {
    this.hail = 'fall'; this.hailT = 0;
    for (const L of this.sky) {
      L.vy = -Math.random() * 3; L.landed = false; L.bounces = 0;
      // 바로 아래 첫 표면(땅·계단·지붕)을 찾는다 — 건물을 뚫고 실내로 들어가지 않게
      L.floor = this.skyCenter.y - 3;
      if (this.bvh) {
        this.ray.origin.copy(L.slot.pos); this.ray.direction.set(0, -1, 0);
        const hit = this.bvh.raycastFirst(this.ray, THREE.DoubleSide);
        if (hit) L.floor = hit.point.y;
      }
    }
  }

  update(dt: number, t: number, player: THREE.Vector3, cam: THREE.Camera) {
    const camYaw = new THREE.Euler().setFromQuaternion(cam.quaternion, 'YXZ').y;
    const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion), camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), camFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(cam.quaternion);

    // ── 하늘의 빛: 떠다님 → 우박처럼 쏟아짐(튀며 내려앉음) → 쉼 → 함께 올라감
    if (!this.skyReady) { this.skyCenter.copy(player); this.skyReady = true; }
    // 순례자 둘레 하늘에 천천히 따라 머문다. 공간 이동·순간 이동으로 멀리 떨어지면 바로 옮긴다
    if (this.skyCenter.distanceTo(player) > 25) this.skyCenter.copy(player);
    else if (this.hail === 'float') this.skyCenter.lerp(player, 1 - Math.exp(-0.2 * dt));
    this.hailT += dt; this.sinceHail += dt;
    if (this.hail === 'float') {
      for (const L of this.sky) L.slot.pos.set(this.skyCenter.x + L.home.x + Math.sin(t * 0.3 + L.slot.phase) * 0.8, this.skyCenter.y + L.home.y + Math.sin(t * 0.5 + L.slot.phase) * 0.4, this.skyCenter.z + L.home.z);
      if (this.sinceHail >= GL.hailEvery && this.sky.length) this.startHail();
    } else if (this.hail === 'fall') {
      let all = true;
      for (const L of this.sky) {
        if (L.landed) continue;
        L.vy -= GL.gravity * dt; L.slot.pos.y += L.vy * dt;
        const rest = L.floor + GL.restHeight;
        if (L.slot.pos.y < rest) { // 땅에 닿으면 통통 튄다
          L.slot.pos.y = rest; L.vy = -L.vy * GL.bounce; L.bounces++;
          if (L.bounces > 2 || Math.abs(L.vy) < 1) { L.landed = true; L.vy = 0; }
        }
        all = all && L.landed;
      }
      if (all || this.hailT > 8) { this.hail = 'rest'; this.hailT = 0; }
    } else if (this.hail === 'rest') {
      if (this.hailT > GL.restSec) { this.hail = 'rise'; this.hailT = 0; this.riseFrom = this.sky.map((L) => L.slot.pos.clone()); }
    } else {
      const k = Math.min(1, this.hailT / GL.riseSec), e = k * k * (3 - 2 * k);
      this.sky.forEach((L, i) => L.slot.pos.lerpVectors(this.riseFrom[i]!, new THREE.Vector3(this.skyCenter.x + L.home.x, this.skyCenter.y + L.home.y, this.skyCenter.z + L.home.z), e));
      if (k >= 1) { this.hail = 'float'; this.hailT = 0; this.sinceHail = 0; }
    }
    for (const L of this.sky) L.slot.size = GL.skyLightScale;

    // ── 내 빛: 지나간 자리를 한 줄로 따라온다. followMax 개를 넘으면 수호천사 자리로
    const head = player.clone().setY(player.y + GL.followHeight);
    if (!this.trail.length || this.trail[0]!.distanceTo(head) > 0.12) { this.trail.unshift(head); if (this.trail.length > 400) this.trail.pop(); }
    const want = player.clone().addScaledVector(right, GL.angelSide);
    if (!this.anchorReady) { this.anchor.copy(want); this.anchorReady = true; }
    this.anchor.lerp(want, 1 - Math.exp(-2.5 * dt));
    const n = this.mine.length, seated = n > GL.followMax, A = ANGELS[this.angel];
    const target = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const S = this.mine[i]!;
      if (this.lineup) {
        const col = i % 7, row = Math.floor(i / 7);
        const fwd = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
        target.copy(player).addScaledVector(fwd, 4).addScaledVector(right, (col - 3) * 0.95); target.y += 2.25 - row * 1.05;
        S.pos.copy(target); S.size = GL.lineupScale; continue;
      }
      if (seated) {
        const [ax, ay] = A.pts[i] ?? [0, 0];
        target.copy(this.anchor).addScaledVector(right, ax * GL.angelScale); target.y += ay * GL.angelScale + Math.sin(t * 1.1 + i) * 0.03;
        S.size = GL.seatedScale;
      } else {
        // 앞의 빛이 지나간 자리를 조금 늦게 밟는다(후보 화면: 18 + i×14 프레임 뒤 → 여기서는 거리)
        const back = Math.round((GL.followGap0 + i * GL.followGap) / 0.12);
        target.copy(this.trail[Math.min(this.trail.length - 1, back)]!);
        // 아직 걸어온 길이 짧으면(막 들어왔을 때) 모자란 만큼 순례자 뒤(카메라 쪽)로 줄을 잇는다
        const short = back - (this.trail.length - 1);
        if (short > 0) target.addScaledVector(new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw)), short * 0.12);
        target.y += Math.sin(t * 2 + i) * 0.05;
        S.size = GL.followScale;
      }
      if (this.arriving === i) {
        this.arriveT += dt; const k = Math.min(1, this.arriveT / 2.2), e = k * k * (3 - 2 * k);
        S.pos.lerpVectors(this.arriveFrom, target, e);
        if (k >= 1) this.arriving = -1;
      } else if (S.pos.y < -900) S.pos.copy(target);
      else S.pos.lerp(target, 1 - Math.exp(-6 * dt));
    }
    if (n >= GL.full && !this.flashedFull) { this.flash = 1; this.flashedFull = true; }
    this.flash = Math.max(0, this.flash - dt * 0.5);

    // ── 그리기
    this.s = 0; this.m = 0;
    const all = this.slots;
    for (let i = 0; i < MAX; i++) {
      const S = all[i];
      if (!S) { this.uP[i]!.set(0, -999, 0, 0); continue; }
      this.drawSlot(i, S, t, dt, camRight, camUp, camFwd, i >= this.sky.length ? this.flash : 0);
    }
    // 천사 선: 이웃한 두 자리가 다 찼을 때만
    if (seated && !this.lineup) {
      const lineA = GL.lineAlpha * (1 + this.flash * 1.5);
      for (const [a, b] of A.lines) {
        if (a >= n || b >= n) continue;
        const pa = this.mine[a]!.pos, pb = this.mine[b]!.pos, cc = lineA * (0.85 + 0.15 * Math.sin(t * 2 + a));
        this.line(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z, cc, 0.86 * cc, 0.6 * cc);
      }
    }
    this.glowGeo.instanceCount = this.s;
    for (const name of ['iPos', 'iCol', 'iShape']) (this.glowGeo.getAttribute(name) as THREE.InstancedBufferAttribute).needsUpdate = true;
    this.lines.geometry.setDrawRange(0, this.m * 2);
    (this.lines.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.lines.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    this.lines.visible = this.m > 0;
    this.root.visible = all.length > 0;
  }

  private put(x: number, y: number, z: number, size: number, c: THREE.Color, a: number, asp = 1, rot = 0) {
    if (a <= 0.003 || size <= 0 || this.s >= MAX * SPRITES_PER) return;
    const s = this.s;
    this.iPos[s * 4] = x; this.iPos[s * 4 + 1] = y; this.iPos[s * 4 + 2] = z; this.iPos[s * 4 + 3] = size;
    this.iCol[s * 4] = c.r; this.iCol[s * 4 + 1] = c.g; this.iCol[s * 4 + 2] = c.b; this.iCol[s * 4 + 3] = Math.min(1, a);
    this.iShape[s * 2] = asp; this.iShape[s * 2 + 1] = rot; this.s++;
  }
  private line(ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number, g: number, b: number) {
    const m = this.m; this.lpos.set([ax, ay, az, bx, by, bz], m * 6); this.lcol.set([r, g, b, r, g, b], m * 6); this.m++;
  }

  private tmpC = new THREE.Color(); private dir = new THREE.Vector3(); private vel = new THREE.Vector3();
  private drawSlot(i: number, S: Slot, t: number, dt: number, camRight: THREE.Vector3, camUp: THREE.Vector3, camFwd: THREE.Vector3, flash: number) {
    const p = S.pos, tt = t + S.phase, sz = S.size * (1 + flash * 0.3), k = GL.unit * sz, g = GL.glow * (1 + flash), c = S.color;
    const put = this.put.bind(this), line = this.line.bind(this), tmpC = this.tmpC;
    let spin = 0, sway = 0, hue = -1;
    if (S.shape === 8) { spin = tt * 0.3; sway = 0.08 * Math.sin(tt * 1.3); }
    else if (S.shape === 12) { spin = tt * 0.6; hue = (S.hsl.h + 0.08 * Math.sin(tt * 0.7) + 1) % 1; tmpC.setHSL(hue, S.hsl.s, 0.68); }
    this.uP[i]!.set(p.x, p.y, p.z, sz);
    this.uS[i]!.set(spin, sway, hue, S.hsl.s);
    const cryst = tmpC;
      // 후보 화면의 한 빛은 화면 기준 x(오른쪽)·y(위)·z(앞)로 짜여 있다 — 카메라의 오른쪽·위·앞으로 옮겨 놓는다
      const L2 = (lx: number, ly: number, lz: number, size: number, col: THREE.Color, a: number, asp = 1, rot = 0) =>
        put(p.x + (camRight.x * lx + camUp.x * ly + camFwd.x * lz) * k, p.y + (camRight.y * lx + camUp.y * ly + camFwd.y * lz) * k, p.z + (camRight.z * lx + camUp.z * ly + camFwd.z * lz) * k, size * k, col, a, asp, rot);
      // 모양마다 번짐 — 후보 화면(빛모양후보.html ITEMS)의 크기·움직임 그대로, 곱하기 GL.unit
      switch (S.shape) {
        case 0: { // 구슬: 숨 쉬듯 밝아졌다 어두워짐
          const b = 1 + 0.12 * Math.sin(tt * 1.6);
          L2(0, 0, 0, 2.2 * b, c, g); L2(0, 0, 0, 0.55 * b, WHITE, 0.9); break;
        }
        case 1: { // 불꽃: 위로 일렁이며 올라가는 작은 불씨 아홉
          L2(0, 0, 0, 1.8, c, g * (0.75 + 0.15 * Math.sin(tt * 9) * Math.sin(tt * 5.3)));
          for (let f = 0; f < 9; f++) { const q = (tt * 0.7 + f / 9) % 1; L2(Math.sin(tt * 3 + f) * 0.08 * q, -0.3 + q * 1.3, 0, 0.75 * (1 - q) + 0.1, c, g * (1 - q)); }
          L2(0, -0.15, 0, 0.4, WHITE, 0.9); break;
        }
        case 2: { // 십자빛: 세로가 긴 빛줄기
          const b = 1 + 0.08 * Math.sin(tt * 2.2);
          L2(0, 0, 0, 1.7, c, g * (0.6 + 0.2 * Math.sin(tt * 2.2)));
          L2(0, 0, 0, 0.2, c, g, (2.5 * b) / 0.2); L2(0, 0.25, 0, 1.5 * b, c, g, 0.2 / (1.5 * b)); L2(0, 0.25, 0, 0.45, WHITE, 0.9); break;
        }
        case 3: { // 별: 여덟 갈래 반짝임
          L2(0, 0, 0, 1.4, c, g); L2(0, 0, 0, 0.4, WHITE, 0.9);
          for (let r = 0; r < 4; r++) { const long = r % 2 === 0 ? 2.6 : 1.3, tw = 1 + 0.25 * Math.sin(tt * 3 + r * 1.7); L2(0, 0, 0, 0.12, c, g, (long * tw) / 0.12, r * Math.PI / 4 + tt * 0.15); }
          break;
        }
        case 4: { // 꽃: 꽃잎 다섯이 열렸다 오므라듦
          L2(0, 0, 0, 1.6, c, g); L2(0, 0, 0, 0.45, FLOWER_CORE, 0.9);
          const open = 0.32 + 0.1 * Math.sin(tt * 1.2);
          for (let f = 0; f < 5; f++) { const a2 = f / 5 * Math.PI * 2 + tt * 0.2; L2(Math.sin(a2) * open, Math.cos(a2) * open, 0, 0.42, c, g, 0.85 / 0.42, -a2); }
          break;
        }
        case 5: { // 겹구슬: 작은 빛 여섯이 둘레를 돈다
          L2(0, 0, 0, 1.6, c, g); L2(0, 0, 0, 0.5, WHITE, 0.9);
          for (let o = 0; o < 6; o++) { const ring = o % 2, a2 = tt * (ring ? 1.1 : -0.8) + o * Math.PI / 3, r = ring ? 0.75 : 0.55; L2(Math.cos(a2) * r, Math.sin(a2) * r * (ring ? 0.35 : 1), Math.sin(a2) * 0.3, 0.35, c, g); }
          break;
        }
        case 6: { // 날개빛: 양쪽 날개를 펴고 천천히 날갯짓 — 다듬음: 깃 일곱 장을 두 겹(긴 바깥깃·짧은 속깃)으로, 끝으로 갈수록 가늘고 깃마다 조금 늦게 움직임
          L2(0, 0, 0, 1.5, c, g); L2(0, 0, 0, 0.45, WHITE, 0.9);
          for (const side of [-1, 1]) for (let f = 0; f < 7; f++) {
            const flap = 0.18 * Math.sin(tt * 1.8 - f * 0.12);
            const a2 = 0.3 + f * 0.17 + flap, len = 1.35 - f * 0.11, wid = 0.17 - f * 0.012;
            const x = side * Math.sin(a2) * len * 0.5, y = Math.cos(a2) * len * 0.5 * 0.42 + 0.06;
            L2(x, y, 0, wid, c, g * (0.95 - f * 0.05), len / wid, -side * a2);
            if (f < 4) { const a3 = a2 + 0.08, l3 = len * 0.55; L2(side * Math.sin(a3) * l3 * 0.5, Math.cos(a3) * l3 * 0.5 * 0.42 + 0.02, 0.01, wid * 0.9, WHITE, 0.35, l3 / (wid * 0.9), -side * a3); }
          }
          break;
        }
        case 7: { // 반딧불 무리: 작은 빛들이 떠다니며 깜박임
          L2(0, 0, 0, 1.6, c, g * 0.25);
          for (let f = 0; f < GL.fireflies; f++) { const pp = S.r[f % S.r.length]! * 6.28, qq = 0.6 + S.r[(f + 7) % S.r.length]! * 0.8;
            L2(Math.sin(tt * 0.5 * qq + pp) * 0.85, Math.sin(tt * 0.37 * qq + pp * 2) * 0.65, Math.cos(tt * 0.4 + pp) * 0.3, 0.32, c, (0.35 + 0.65 * Math.max(0, Math.sin(tt * 2 * qq + pp))) * g); }
          break;
        }
        case 8: // 초롱: 한지 초롱 안에서 따뜻하게 일렁이는 빛
          L2(0, 0, 0, 2.1, c, g * (0.8 + 0.12 * Math.sin(tt * 7) * Math.sin(tt * 3.1))); break;
        case 9: { // 햇살 바퀴: 빛살 여덟이 천천히 돈다
          L2(0, 0, 0, 1.5, c, g); L2(0, 0, 0, 0.55, WHITE, 0.9);
          for (let r = 0; r < 8; r++) { const long = r % 2 ? 1.6 : 2.4; L2(0, 0, 0, 0.09, c, g, (long * (1 + 0.1 * Math.sin(tt * 2 + r))) / 0.09, r * Math.PI / 8 + tt * 0.12); }
          break;
        }
        case 10: { // 이슬빛: 물방울 빛과 둘레의 반짝임
          L2(0, 0, 0, 1.7, c, g); L2(0, 0, 0, 0.55, c, g, 0.8 / 0.55); L2(0, 0, 0, 0.32, WHITE, 0.9);
          for (let f = 0; f < 5; f++) { const a2 = f / 5 * 6.28, kk = Math.max(0, Math.sin(tt * 2.5 + f * 1.3)); L2(Math.cos(a2) * 0.8, Math.sin(a2) * 0.8, 0, 0.05 + 0.3 * kk ** 3, WHITE, 0.9); }
          break;
        }
        case 11: { // 별똥 꼬리: 고리를 그리며 날고 뒤로 꼬리(지난 자리를 시각으로 되짚는다)
          const at = (u: number) => [Math.sin(u * 1.2) * 0.85, Math.sin(u * 2.4) * 0.45] as const;
          const [hx, hy] = at(tt); L2(hx, hy, 0, 0.45, WHITE, 0.95);
          for (let f = 0; f < 18; f++) { const [x, y] = at(tt - f * 0.05); L2(x, y, 0, 0.5 * (1 - f / 18) + 0.05, c, g * (1 - f / 18)); }
          break;
        }
        case 12: { // 빛 결정: 번짐 + 흰 모서리 선(수정은 단단한 속)
          L2(0, 0, 0, 1.8, cryst, g * 0.7);
          const cs = Math.cos(spin), sn = Math.sin(spin);
          const v = GEM_V.map(([x, y, z]) => [p.x + (x * cs + z * sn) * k, p.y + y * k, p.z + (-x * sn + z * cs) * k]);
          for (const [a3, b3] of GEM_E) { const A3 = v[a3]!, B3 = v[b3]!; line(A3[0]!, A3[1]!, A3[2]!, B3[0]!, B3[1]!, B3[2]!, 1, 0.97, 0.92); }
          break;
        }
        default: { // 13 은하 소용돌이: 작은 빛들이 두 갈래로 감아 돈다
          L2(0, 0, 0, 0.5, WHITE, 0.9); L2(0, 0, 0, 1.3, c, g);
          const N = GL.galaxyStars;
          for (let f = 0; f < N; f++) { const arm = f % 2, r = 0.15 + (f >> 1) / (N / 2) * 0.85, a2 = arm * Math.PI + r * 4.2 - tt * 0.5;
            L2(Math.cos(a2) * r, Math.sin(a2) * r * 0.55, Math.sin(a2) * r * 0.2, 0.12 + S.r[f % S.r.length]! * 0.14, c, g * (1 - r * 0.6)); }
        }
      }
    // 움직일 때 끌리는 빛 꼬리(멘토 목업)
    this.vel.subVectors(p, S.prev).divideScalar(Math.max(dt, 1e-3));
    const tail = THREE.MathUtils.clamp((this.vel.length() - 0.6) / 2.5, 0, 1);
    if (tail > 0.01 && S.prev.y > -900) {
      this.dir.copy(this.vel).normalize();
      for (let q = 0; q < TAILS; q++) { const d = (0.22 + q * 0.2) * sz; put(p.x - this.dir.x * d, p.y - this.dir.y * d, p.z - this.dir.z * d, (0.5 - q * 0.09) * sz, c, tail * g * (0.5 - q * 0.1) * 1.6); }
    }
    S.prev.copy(p);
    void line;
  }
}

function pickColor(r: () => number, shape: number): string {
  const c = new THREE.Color(GL.shapeColors[shape] ?? 0xffd27a); const h = { h: 0, s: 0, l: 0 }; c.getHSL(h);
  return '#' + c.setHSL((h.h + (r() - 0.5) * 0.04 + 1) % 1, h.s, THREE.MathUtils.clamp(h.l + (r() - 0.5) * 0.08, 0, 0.92)).getHexString();
}
function mulberry(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
