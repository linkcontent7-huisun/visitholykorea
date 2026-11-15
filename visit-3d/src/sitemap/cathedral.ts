// 명동대성당 본당 외관 — 고딕 리바이벌 양식 상세 모델 (절차적 생성, 외부 에셋 없음)
//
// 평면 치수는 OSM 윤곽(본당 way 210335697 · 종탑 way 1139745172)에서 읽는다.
//   종탑 앞면 → 종탑 뒷면 → 몸체 → 후진(반원) 끝, 몸체 반폭.
// 높이는 OSM: 본당 23 m(용마루), 종탑+첨탑 47 m.
// 그 밖의 세부(베이 간격·창 크기·처마 높이·시계 위치)는 양식과 공개 사진을 보고 정한 근사치다.
//   → 실측이 아니다. 실측 스캔 허가를 받으면 이 파일을 스캔 GLB 로 바꾼다.
//
// 좌표: 지역 x = 성당 길이축(정면 = -x), z = 폭, y = 위. 1 unit = 1 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Ring = [number, number][];
type MatKey = 'brick' | 'grey' | 'stone' | 'slate' | 'glass' | 'wood' | 'clock' | 'metal' | 'copper' | 'trim' | 'zinc';

export interface CathedralFrame {
  /** 정면(종탑 앞면) 중앙 바닥점 — 월드 좌표 */
  front: THREE.Vector3;
  /** 정면이 바라보는 방향(바깥쪽) — 월드 단위벡터 */
  facing: THREE.Vector3;
  /** 정면 기준 오른쪽 — 월드 단위벡터 */
  side: THREE.Vector3;
  /** 몸체 중심 바닥점 */
  center: THREE.Vector3;
  length: number;
}

export interface Cathedral {
  group: THREE.Group;
  meshes: THREE.Mesh[];
  frame: CathedralFrame;
  /** { walkable: true } 로 만들었을 때만 true — 정문이 뚫려 있고 안쪽을 가리는 면이 없다 */
  walkable?: boolean;
  /** 지역 좌표(x = 길이축·정면 -x, z = 폭, y = 위, 바닥 0) 치수 — 실내를 맞출 때 쓴다 */
  dims: CathedralDims;
}

export interface CathedralDims {
  xFront: number; xTowerBack: number; xTr0: number; xc: number; xRear: number;
  hwTower: number; hwNave: number; hwAisle: number; rIn: number; rOut: number;
  eaveNave: number; eaveAisle: number; aisleTop: number; ridge: number; towerTop: number; spireTop: number;
  /** 정문 개구 — 종탑 앞면 중앙, 바닥 0 에서 시작. 현관 돌출부 앞면은 xFront - porch */
  portal: { w: number; h: number; porch: number };
}

export interface CathedralOptions {
  /** 정문을 뚫고, 정문으로 들여다볼 때 가리는 안쪽 면(박스 앞뒷면·띠·박공 채움)을 뺀다 */
  walkable?: boolean;
}

// ── 재질 (캔버스로 그린 벽돌·슬레이트 텍스처) ─────────────────────────────

export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 벽돌 텍스처 한 장 = 실제 4 m × 4 m. 벽돌 0.24 × 0.075 m, 줄눈 1 cm */
function brickTextures(base: [number, number, number], jitter: number, seed: number, mortar: string) {
  const S = 1024, rows = 47, cols = 16;
  const rh = S / rows, cw = S / cols;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const b = document.createElement('canvas'); b.width = b.height = S;
  const g = c.getContext('2d')!, gb = b.getContext('2d')!;
  const r = rng(seed);
  g.fillStyle = mortar; g.fillRect(0, 0, S, S);
  gb.fillStyle = '#202020'; gb.fillRect(0, 0, S, S);
  for (let y = 0; y < rows; y++) {
    const off = (y % 2) * cw * 0.5;
    for (let x = -1; x < cols; x++) {
      const k = 1 + (r() - 0.5) * jitter;
      const burnt = r() < 0.08 ? 0.72 : 1; // 짙게 구운 벽돌이 섞인다
      const [R, G, B] = base.map((v) => Math.max(0, Math.min(255, v * k * burnt)));
      g.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
      const px = x * cw + off + 1.5, py = y * rh + 1.2, w = cw - 3, h = rh - 2.4;
      g.fillRect(px, py, w, h);
      // 벽돌 면의 결: 가장자리 살짝 어둡게(구운 테), 가운데 밝은 점 몇 개(모래 알갱이)
      g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(px, py, w, 1.2); g.fillRect(px, py + h - 1.2, w, 1.2); g.fillRect(px, py, 1.2, h); g.fillRect(px + w - 1.2, py, 1.2, h);
      if (r() < 0.35) { g.fillStyle = 'rgba(255,240,220,0.10)'; g.fillRect(px + r() * w * 0.7, py + r() * h * 0.6, 2 + r() * 6, 1 + r() * 2); }
      const lv = 165 + r() * 70;
      gb.fillStyle = `rgb(${lv | 0},${lv | 0},${lv | 0})`;
      gb.fillRect(px, py, w, h);
      gb.fillStyle = 'rgba(0,0,0,0.25)'; gb.fillRect(px, py + h - 1.5, w, 1.5); // 아래 모서리 그늘
    }
  }
  // 표면 얼룩·풍화
  for (let i = 0; i < 9000; i++) {
    const a = r() * 0.06;
    g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.6})`;
    g.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3);
  }
  // 빗물·그을음: 위에서 아래로 흐르는 옅은 세로 자국(실제 외벽의 때)
  for (let i = 0; i < 28; i++) {
    const x = r() * S, y = r() * S * 0.6, h = 60 + r() * 220, w = 3 + r() * 9;
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(20,15,12,0.16)'); gr.addColorStop(1, 'rgba(20,15,12,0)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  }
  // 줄눈 색 얼룩(한 톤이 아니게)
  for (let i = 0; i < 1500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,80,70,0.12)' : 'rgba(255,250,240,0.10)'; g.fillRect(r() * S, r() * S, 4 + r() * 10, 1); }
  return finish(c, b);
}

/** 화강암(버팀벽 갓돌·창틀·띠돌) 텍스처 한 장 = 2 m × 2 m — 잔점 결정 + 가는 줄눈(실제: 회색 화강암 다듬돌) */
export function graniteTextures(base: [number, number, number], seed: number) {
  const S = 512;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const b = document.createElement('canvas'); b.width = b.height = S;
  const g = c.getContext('2d')!, gb = b.getContext('2d')!;
  const r = rng(seed);
  g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; g.fillRect(0, 0, S, S);
  gb.fillStyle = '#808080'; gb.fillRect(0, 0, S, S);
  // 결정 잔점: 어두운 운모·밝은 장석·분홍기
  for (let i = 0; i < 26000; i++) {
    const t = r(); const k = t < 0.45 ? 0.72 + r() * 0.12 : t < 0.9 ? 1.08 + r() * 0.1 : 1.0;
    const tint = t >= 0.9 ? [1.06, 0.98, 0.96] : [1, 1, 1];
    g.fillStyle = `rgba(${(base[0] * k * tint[0]) | 0},${(base[1] * k * tint[1]) | 0},${(base[2] * k * tint[2]) | 0},${0.5 + r() * 0.5})`;
    const sz = 1 + r() * 2.2; g.fillRect(r() * S, r() * S, sz, sz);
    const lv = 110 + r() * 60; gb.fillStyle = `rgba(${lv | 0},${lv | 0},${lv | 0},0.6)`; gb.fillRect(r() * S, r() * S, sz, sz);
  }
  // 다듬돌 줄눈: 가로 0.5 m, 세로 1 m 간격(어긋나게) — 얕고 가늘게
  const rows = 4, cols = 2, rh = S / rows, cw = S / cols;
  for (let y = 0; y <= rows; y++) {
    g.fillStyle = 'rgba(40,38,36,0.55)'; g.fillRect(0, y * rh - 1, S, 2);
    gb.fillStyle = '#303030'; gb.fillRect(0, y * rh - 1, S, 3);
    const off = (y % 2) * cw * 0.5;
    for (let x = 0; x <= cols; x++) {
      g.fillStyle = 'rgba(40,38,36,0.5)'; g.fillRect(x * cw + off - 1, y * rh, 2, rh);
      gb.fillStyle = '#303030'; gb.fillRect(x * cw + off - 1, y * rh, 3, rh);
    }
  }
  // 빗물 얼룩: 윗줄눈 아래로 흐르는 옅은 자국
  for (let i = 0; i < 60; i++) { const x = r() * S, y = Math.floor(r() * rows) * rh, h = 10 + r() * 40; const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(30,30,30,0.18)'); gr.addColorStop(1, 'rgba(30,30,30,0)'); g.fillStyle = gr; g.fillRect(x, y, 2 + r() * 4, h); }
  return finish(c, b);
}

/** 슬레이트 지붕 텍스처 한 장 = 3 m × 3 m */
function slateTextures(seed: number) {
  const S = 512, rows = 14, cols = 10;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const b = document.createElement('canvas'); b.width = b.height = S;
  const g = c.getContext('2d')!, gb = b.getContext('2d')!;
  const r = rng(seed);
  const rh = S / rows, cw = S / cols;
  g.fillStyle = '#25282c'; g.fillRect(0, 0, S, S);
  gb.fillStyle = '#000'; gb.fillRect(0, 0, S, S);
  for (let y = 0; y < rows; y++) {
    const off = (y % 2) * cw * 0.5;
    for (let x = -1; x < cols; x++) {
      const v = 50 + r() * 22, hue = r();
      g.fillStyle = hue < 0.6 ? `rgb(${v | 0},${(v + 3) | 0},${(v + 9) | 0})` : hue < 0.85 ? `rgb(${(v + 6) | 0},${(v + 2) | 0},${(v + 10) | 0})` : `rgb(${(v + 10) | 0},${(v + 8) | 0},${(v + 6) | 0})`; // 청회·자회·갈회 판이 섞인다
      g.fillRect(x * cw + off + 1, y * rh + 1, cw - 2, rh - 1);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x * cw + off + 1, (y + 1) * rh - 2, cw - 2, 2); // 판 아래 모서리 그늘
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x * cw + off + 1, y * rh + 1, cw - 2, 1);
      const grad = gb.createLinearGradient(0, y * rh, 0, (y + 1) * rh);
      grad.addColorStop(0, '#555'); grad.addColorStop(1, '#ddd');
      gb.fillStyle = grad;
      gb.fillRect(x * cw + off + 1, y * rh + 1, cw - 2, rh - 1);
    }
  }
  return finish(c, b);
}

function finish(c: HTMLCanvasElement, b: HTMLCanvasElement) {
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(b);
  for (const t of [map, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  return { map, bump };
}

function seamTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d')!;
  g.fillStyle = '#7b8a80'; g.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 16) { g.fillStyle = '#5d6b62'; g.fillRect(x, 0, 2, 128); g.fillStyle = '#9aa89e'; g.fillRect(x + 2, 0, 1, 128); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3);
  return t;
}

/** 둥근 머리 창 윤곽(반원 아치) */
function roundHead(w: number, h: number, sill: number) {
  const s = new THREE.Shape(), hs = sill + h - w / 2;
  s.moveTo(-w / 2, sill); s.lineTo(w / 2, sill); s.lineTo(w / 2, hs); s.absarc(0, hs, w / 2, 0, Math.PI, false); s.lineTo(-w / 2, sill);
  return s;
}

function leadedGlass() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!;
  let seed = 5; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#5c6b7a'; g.fillRect(0, 0, S, S);
  const n = 4, d = S / n;
  for (let j = -1; j <= n; j++) for (let i = -1; i <= n; i++) {
    const cx = i * d + (j % 2 ? d / 2 : 0), cy = j * d * 0.5 + d * 0.5;
    g.fillStyle = ['#5f6f80', '#6a7686', '#7a6a5a', '#5a7068', '#6f6478', '#58687a'][Math.floor(r() * 6)];
    g.beginPath(); g.moveTo(cx, cy - d * 0.5); g.lineTo(cx + d / 2, cy); g.lineTo(cx, cy + d * 0.5); g.lineTo(cx - d / 2, cy); g.closePath(); g.fill();
  }
  g.strokeStyle = '#2a2e33'; g.lineWidth = 3;
  for (let k = -n; k <= 2 * n; k++) { g.beginPath(); g.moveTo(k * d / 2 * 2 - S, 0); g.lineTo(k * d / 2 * 2, S); g.stroke(); g.beginPath(); g.moveTo(k * d, 0); g.lineTo(k * d - S, S); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.4, 1.4);
  return t;
}

function materials(): Record<MatKey, THREE.Material> {
  const red = brickTextures([128, 60, 48], 0.3, 7, '#a9a092'); // v2: 영상 속 벽돌은 짙은 적갈색
  const grey = brickTextures([128, 126, 122], 0.18, 11, '#c9c4ba');
  const slate = slateTextures(3);
  const granite = graniteTextures([138, 135, 129], 21), graniteLight = graniteTextures([214, 205, 184], 23);
  return {
    brick: new THREE.MeshStandardMaterial({ map: red.map, bumpMap: red.bump, bumpScale: 1.7, roughness: 0.9 }),
    grey: new THREE.MeshStandardMaterial({ map: grey.map, bumpMap: grey.bump, bumpScale: 1.0, roughness: 0.85 }),
    // v2(영상 비교): 테·띠·코니스는 흰 돌이 아니라 회색 화강석·회색 벽돌 — 붉은 벽돌과 대비되는 짙은 회색
    stone: new THREE.MeshStandardMaterial({ map: granite.map, bumpMap: granite.bump, bumpScale: 0.6, roughness: 0.82 }), // v3-1: 회색 화강암 다듬돌 질감
    slate: new THREE.MeshStandardMaterial({ map: slate.map, bumpMap: slate.bump, bumpScale: 1.8, roughness: 0.55, metalness: 0.08 }),
    // 바깥에서 본 창 — 실제 사진처럼 회청빛으로 하늘을 비추고, 납 문살 마름모 사이로 옅은 색유리가 비친다(전: 거의 검정)
    glass: new THREE.MeshStandardMaterial({ map: leadedGlass(), color: 0xffffff, roughness: 0.2, metalness: 0.45, emissive: 0x1a1e26 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x4b2c1c, roughness: 0.7 }),
    clock: new THREE.MeshStandardMaterial({ color: 0xefeadf, roughness: 0.5 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.35, metalness: 0.8 }),
    // 실제 사진: 첨탑·지붕창·모서리 첨탑은 청록빛으로 녹슨 구리
    copper: new THREE.MeshStandardMaterial({ color: 0x5ea48c, bumpMap: slate.bump, bumpScale: 0.6, roughness: 0.42, metalness: 0.3 }),
    // 실제 사진: 측랑 앞면 경사 지붕선을 따라가는 밝은 작은 아치 장식 띠
    trim: new THREE.MeshStandardMaterial({ map: graniteLight.map, bumpMap: graniteLight.bump, bumpScale: 0.4, roughness: 0.72 }), // v3-1: 밝은 화강암 갓돌
    // 실제 사진: 후진·회랑 지붕은 줄눈이 선 회녹색 금속판
    zinc: new THREE.MeshStandardMaterial({ map: seamTex(), color: 0x7f8a82, roughness: 0.62, metalness: 0.3 }), // 사장님 확정: 더 짙게
  };
}

// ── 기하 모으기 ─────────────────────────────────────────────────────────

const UV_SCALE: Partial<Record<MatKey, number>> = { brick: 1 / 4, grey: 1 / 4, slate: 1 / 3, stone: 1 / 2, trim: 1 / 2 };

class Parts {
  private parts = new Map<MatKey, THREE.BufferGeometry[]>();

  add(mat: MatKey, geo: THREE.BufferGeometry, m?: THREE.Matrix4) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (m) g.applyMatrix4(m);
    g.clearGroups();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    const s = UV_SCALE[mat];
    if (s) worldUV(g, s);
    else if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((g.attributes.position.count) * 2), 2));
    (this.parts.get(mat) ?? this.parts.set(mat, []).get(mat)!).push(g);
    if (g !== geo) geo.dispose();
  }

  box(mat: MatKey, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m?: THREE.Matrix4) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.add(mat, g, m);
  }

  /** 상자에서 일부 면을 뺀다. 면 이름 = BoxGeometry 그룹 순서 px·nx·py·ny·pz·nz */
  boxOmit(mat: MatKey, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, omit: string[], m?: THREE.Matrix4) {
    if (!omit.length) return this.box(mat, x0, x1, y0, y1, z0, z1, m);
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2).toNonIndexed();
    const names = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
    const keep = names.map((nm, i) => (omit.includes(nm) ? -1 : i)).filter((i) => i >= 0);
    const out = new THREE.BufferGeometry();
    for (const key of ['position', 'normal', 'uv'] as const) {
      const a = g.attributes[key] as THREE.BufferAttribute, sz = a.itemSize;
      const arr = new Float32Array(keep.length * 6 * sz);
      keep.forEach((gi, k) => arr.set((a.array as Float32Array).subarray(gi * 6 * sz, (gi + 1) * 6 * sz), k * 6 * sz));
      out.setAttribute(key, new THREE.BufferAttribute(arr, sz));
    }
    g.dispose();
    this.add(mat, out, m);
  }

  build(mats: Record<MatKey, THREE.Material>): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    for (const [k, list] of this.parts) {
      const merged = mergeGeometries(list, false);
      if (!merged) throw new Error(`merge 실패: ${k}`);
      const mesh = new THREE.Mesh(merged, mats[k]);
      mesh.castShadow = k !== 'glass';
      mesh.receiveShadow = true;
      mesh.name = `cathedral:${k}`;
      out.push(mesh);
      list.forEach((g) => g.dispose());
    }
    return out;
  }
}

/** 면 방향에 따라 월드 크기 기준 UV 를 준다(텍스처가 늘어나지 않게) */
export function worldUV(g: THREE.BufferGeometry, scale: number) {
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u: number, v: number;
    if (ay > 0.8) { u = p.getX(i); v = p.getZ(i); }
    else if (ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u * scale; uv[i * 2 + 1] = v * scale;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const RY = (a: number) => new THREE.Matrix4().makeRotationY(a);
const mul = (...ms: THREE.Matrix4[]) => ms.reduce((a, b) => a.multiply(b), new THREE.Matrix4());

// ── 부재 ────────────────────────────────────────────────────────────────

/** 첨두아치 윤곽 (바닥 중앙 원점, XY 평면) */
function pointed(w: number, h: number, dy = 0): THREE.Shape {
  const hs = h - w * 0.8;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, dy);
  s.lineTo(-w / 2, dy + hs);
  s.quadraticCurveTo(-w / 2, dy + h - w * 0.12, 0, dy + h);
  s.quadraticCurveTo(w / 2, dy + h - w * 0.12, w / 2, dy + hs);
  s.lineTo(w / 2, dy);
  s.closePath();
  return s;
}

/** 바닥에서 시작하는 첨두아치 개구를 둔 벽 윤곽(U 자 다각형). 폭 2·hw, 높이 H */
function archedWall(hw: number, H: number, w: number, h: number): THREE.Shape {
  const hs = h - w * 0.8;
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(-w / 2, 0);
  s.lineTo(-w / 2, hs);
  s.quadraticCurveTo(-w / 2, h - w * 0.12, 0, h);
  s.quadraticCurveTo(w / 2, h - w * 0.12, w / 2, hs);
  s.lineTo(w / 2, 0);
  s.lineTo(hw, 0);
  s.lineTo(hw, H);
  s.lineTo(-hw, H);
  s.closePath();
  return s;
}

/**
 * 첨두 창 — +z 를 바라보는 벽면 기준. 유리는 벽면에 붙이고, 회색 석재 테두리를 0.22 m 내민다.
 * m 은 벽면 위 (창 중심 x, 벽면 z) 로 옮기는 변환.
 */
function lancet(P: Parts, w: number, h: number, sill: number, m: THREE.Matrix4, fill: MatKey | null = 'glass', frame = 0.32) {
  if (fill) {
    const glass = new THREE.ExtrudeGeometry(pointed(w, h, sill), { depth: 0.04, bevelEnabled: false, curveSegments: 6 });
    P.add(fill, glass, mul(m.clone(), T(0, 0, 0.01)));
  }
  const outer = pointed(w + frame * 2, h + frame * 1.2, sill - frame * 0.4);
  outer.holes.push(pointed(w, h, sill));
  const fr = new THREE.ExtrudeGeometry(outer, { depth: 0.22, bevelEnabled: false, curveSegments: 6 });
  P.add('grey', fr, m); // 창 둘레는 회색 벽돌(영상)
  // 문살: 가운데 세로 멀리언
  if (fill === 'glass' && w > 1.1) P.box('stone', -0.06, 0.06, sill, sill + h - w * 0.5, 0, 0.12, m);
  // 창턱
  P.box('stone', -w / 2 - frame, w / 2 + frame, sill - frame * 0.4 - 0.12, sill - frame * 0.4, -0.05, 0.32, m);
}

/** 큰 첨두 아치 안에 긴 창 두 개 + 위 둥근 창 — 실제 명동성당 옆면·정면 창 모양. 굵은 회색 벽돌 테 */
function twinWindow(P: Parts, w: number, h: number, sill: number, m: THREE.Matrix4) {
  lancet(P, w, h, sill, m, null, Math.max(0.28, w * 0.1));
  for (const sx of [-1, 1]) lancet(P, w * 0.3, h * 0.7, sill + h * 0.03, mul(m.clone(), T(sx * w * 0.244, 0, 0.02)), 'glass', Math.max(0.1, w * 0.04));
  // 둥근 창 — 유리 + 가는 회색 테 + 십자 문살(실제 사진)
  const r = w * 0.13, cy = sill + h * 0.855, mm = mul(m.clone(), T(0, 0, 0.02));
  P.add('glass', new THREE.CircleGeometry(r, 24), mul(mm.clone(), T(0, cy, 0.01)));
  const ring = new THREE.Shape().absarc(0, cy, r + Math.max(0.12, w * 0.05), 0, Math.PI * 2, false);
  ring.holes.push(new THREE.Path().absarc(0, cy, r, 0, Math.PI * 2, true));
  P.add('grey', new THREE.ExtrudeGeometry(ring, { depth: 0.2, bevelEnabled: false, curveSegments: 24 }), mm);
  P.box('stone', -0.03, 0.03, cy - r, cy + r, 0, 0.08, mm);
  P.box('stone', -r, r, cy - 0.03, cy + 0.03, 0, 0.08, mm);
}

/** 처마 밑 작은 아치 줄(코벨 아케이드) — 벽면(+z) 위 x0..x1, 높이 y */
function corbelArcade(P: Parts, x0: number, x1: number, y: number, m: THREE.Matrix4) {
  const n = Math.max(2, Math.floor((x1 - x0) / 0.62));
  P.box('grey', x0, x1, y - 0.05, y + 0.2, 0, 0.26, m);
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i + 0.5) / n) * (x1 - x0);
    P.add('grey', new THREE.TorusGeometry(0.22, 0.06, 4, 10, Math.PI).rotateZ(Math.PI).translate(x, y - 0.02, 0.12), m);
    P.add('grey', new THREE.BoxGeometry(0.1, 0.26, 0.2).translate(x - 0.31, y - 0.12, 0.1), m);
  }
}

/** 장미창 — 원형 유리 + 석재 테 + 방사형 트레이서리 */
function rose(P: Parts, r: number, cy: number, m: THREE.Matrix4) {
  P.add('glass', new THREE.CircleGeometry(r, 24), mul(m.clone(), T(0, cy, 0.02)));
  const ring = new THREE.Shape().absarc(0, cy, r + 0.35, 0, Math.PI * 2, false);
  ring.holes.push(new THREE.Path().absarc(0, cy, r, 0, Math.PI * 2, true));
  P.add('stone', new THREE.ExtrudeGeometry(ring, { depth: 0.24, bevelEnabled: false, curveSegments: 24 }), m);
  for (let i = 0; i < 8; i++) {
    const g = new THREE.BoxGeometry(0.1, r * 2, 0.1).rotateZ((i * Math.PI) / 8).translate(0, cy, 0.1);
    P.add('stone', g, m);
  }
  P.add('stone', new THREE.CylinderGeometry(r * 0.22, r * 0.22, 0.2, 16).rotateX(Math.PI / 2).translate(0, cy, 0.12), m);
}

/** 시계 — 흰 문자판, 석재 테, 시·분침 */
function clock(P: Parts, r: number, cy: number, m: THREE.Matrix4) {
  P.add('clock', new THREE.CircleGeometry(r, 32), mul(m.clone(), T(0, cy, 0.03)));
  const ring = new THREE.Shape().absarc(0, cy, r + 0.3, 0, Math.PI * 2, false);
  ring.holes.push(new THREE.Path().absarc(0, cy, r, 0, Math.PI * 2, true));
  P.add('stone', new THREE.ExtrudeGeometry(ring, { depth: 0.2, bevelEnabled: false, curveSegments: 32 }), m);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    P.add('metal', new THREE.BoxGeometry(0.08, 0.28, 0.04).rotateZ(-a).translate(Math.sin(a) * r * 0.82, cy + Math.cos(a) * r * 0.82, 0.06), m);
  }
  P.add('metal', new THREE.BoxGeometry(0.1, r * 0.55, 0.04).translate(0, r * 0.27, 0).rotateZ(-2.3).translate(0, cy, 0.08), m);
  P.add('metal', new THREE.BoxGeometry(0.07, r * 0.8, 0.04).translate(0, r * 0.4, 0).rotateZ(0.45).translate(0, cy, 0.1), m);
}

/** 박공 지붕(길이축 x, 원점 중심): 벽돌 박공벽 + 슬레이트 지붕판 2장 */
function gable(P: Parts, L: number, hw: number, eave: number, ridge: number, m: THREE.Matrix4, gableEnds: [boolean, boolean] = [true, true], fill = true) {
  const tri = new THREE.Shape([new THREE.Vector2(-hw, eave), new THREE.Vector2(hw, eave), new THREE.Vector2(0, ridge)]);
  gableEnds.forEach((on, i) => {
    if (!on) return;
    const x = i === 0 ? -L / 2 : L / 2 - 0.6;
    P.add('brick', new THREE.ExtrudeGeometry(tri, { depth: 0.6, bevelEnabled: false }), mul(m.clone(), T(x, 0, 0), RY(Math.PI / 2)));
  });
  // 박공 안을 채우는 몸체(지붕판 사이가 비어 보이지 않게) — walkable 에서는 실내 볼트를 가리므로 뺀다
  if (fill) P.add('brick', new THREE.ExtrudeGeometry(tri, { depth: L - 1.2, bevelEnabled: false }), mul(m.clone(), T(-L / 2 + 0.6, 0, 0), RY(Math.PI / 2)));
  const rise = ridge - eave;
  const a = Math.atan2(rise, hw);
  const slant = Math.hypot(hw, rise) + 0.7;
  for (const s of [1, -1]) {
    const g = new THREE.BoxGeometry(L + 0.8, 0.28, slant)
      .rotateX(s * a)
      .translate(0, eave + rise / 2 + 0.16, (s * hw) / 2 + s * 0.12);
    P.add('slate', g, m);
  }
  P.box('stone', -L / 2 - 0.4, L / 2 + 0.4, ridge + 0.05, ridge + 0.3, -0.18, 0.18, m); // 용마루
}

/** 외쪽 지붕(측랑): 바깥 처마 eave(z=zOut) → 안쪽 top(z=zIn) */
function leanTo(P: Parts, x0: number, x1: number, zIn: number, zOut: number, eave: number, top: number) {
  const d = Math.abs(zOut - zIn), s = Math.sign(zOut - zIn);
  const a = Math.atan2(top - eave, d);
  const slant = Math.hypot(d, top - eave) + 0.6;
  const g = new THREE.BoxGeometry(x1 - x0 + 0.6, 0.26, slant)
    .rotateX(s * a)
    .translate((x0 + x1) / 2, (eave + top) / 2 + 0.15, (zIn + zOut) / 2 + s * 0.15);
  P.add('slate', g);
  // 앞면 삼각 벽 — RY(π/2) 는 윤곽 x 를 월드 -z 로, 압출 방향을 +x 로 보낸다. 그래서 윤곽 x 에 -z 를 넣는다.
  const tri = new THREE.Shape([new THREE.Vector2(-zIn, eave), new THREE.Vector2(-zOut, eave), new THREE.Vector2(-zIn, top)]);
  P.add('brick', new THREE.ExtrudeGeometry(tri, { depth: 0.5, bevelEnabled: false }), mul(T(x0, 0, 0), RY(Math.PI / 2)));
}

function buttress(P: Parts, x: number, z: number, outward: 1 | -1, h: number, w = 0.9, d = 1.0) {
  const z0 = outward > 0 ? z : z - d, z1 = outward > 0 ? z + d : z;
  P.box('grey', x - w / 2, x + w / 2, 0, h * 0.55, z0, z1); // 실제 사진: 옆면 버팀벽은 회색 벽돌
  const z2 = outward > 0 ? z + d * 0.7 : z - d * 0.7;
  P.box('grey', x - w / 2 + 0.05, x + w / 2 - 0.05, h * 0.55, h, Math.min(z, z2), Math.max(z, z2));
  P.box('stone', x - w / 2 - 0.05, x + w / 2 + 0.05, h * 0.55 - 0.15, h * 0.55 + 0.05, Math.min(z0, z1) - 0.05, Math.max(z0, z1) + 0.05);
  P.add('stone', new THREE.BoxGeometry(w - 0.02, 0.22, d * 0.95).rotateX(outward * 0.55).translate(x, h + 0.2, (z + z2) / 2)); // 비스듬한 돌 갓(실제 사진)
}

function pinnacle(P: Parts, x: number, y: number, z: number, r: number, h: number, roof: MatKey = 'slate') {
  P.box('grey', x - r, x + r, y, y + r * 1.6, z - r, z + r);
  P.add(roof, new THREE.ConeGeometry(r * 1.05, h, 4).rotateY(Math.PI / 4).translate(x, y + r * 1.6 + h / 2, z));
  P.add('metal', new THREE.SphereGeometry(r * 0.25, 8, 6).translate(x, y + r * 1.6 + h + r * 0.1, z));
}

/**
 * 수평 돌림띠(석재) — 벽 둘레.
 * sides 를 주면 그 면에만 얇게 붙인다(f = x0 면, b = x1 면, l = z0 면, r = z1 면).
 * 없으면 지금처럼 속이 찬 띠 상자 하나(바깥에서만 볼 때).
 */
function band(P: Parts, x0: number, x1: number, z0: number, z1: number, y: number, t = 0.3, p = 0.14, sides?: string) {
  const y0 = y - t / 2, y1 = y + t / 2, d = 0.25; // d = 벽 안으로 묻히는 깊이
  if (sides === undefined) return P.box('stone', x0 - p, x1 + p, y0, y1, z0 - p, z1 + p);
  if (sides.includes('f')) P.box('stone', x0 - p, x0 + d, y0, y1, z0 - p, z1 + p);
  if (sides.includes('b')) P.box('stone', x1 - d, x1 + p, y0, y1, z0 - p, z1 + p);
  if (sides.includes('l')) P.box('stone', x0 - p, x1 + p, y0, y1, z0 - p, z0 + d);
  if (sides.includes('r')) P.box('stone', x0 - p, x1 + p, y0, y1, z1 - d, z1 + p);
}

// ── 본당 ────────────────────────────────────────────────────────────────

export function buildCathedral(mainRing: Ring, towerRing: Ring | null, mainHeight = 23, towerHeight = 47, opts: CathedralOptions = {}): Cathedral {
  const W = !!opts.walkable;
  /** walkable 일 때만 sides 를 넘기는 band */
  const bandW = (x0: number, x1: number, z0: number, z1: number, y: number, sides: string, t = 0.3, p = 0.14) =>
    band(P, x0, x1, z0, z1, y, t, p, W ? sides : undefined);
  // 길이축(PCA)과 정면 방향
  const n = mainRing.length;
  const cx = mainRing.reduce((s, p) => s + p[0], 0) / n;
  const cz = mainRing.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, szz = 0, sxz = 0;
  for (const [x, z] of mainRing) { sxx += (x - cx) ** 2; szz += (z - cz) ** 2; sxz += (x - cx) * (z - cz); }
  let ang = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const along = (p: [number, number]) => (p[0] - cx) * Math.cos(ang) + (p[1] - cz) * Math.sin(ang);
  const across = (p: [number, number]) => -(p[0] - cx) * Math.sin(ang) + (p[1] - cz) * Math.cos(ang);
  const tRing = towerRing ?? mainRing;
  const tMean = tRing.reduce((s, p) => s + along(p), 0) / tRing.length;
  if (tMean > 0) ang += Math.PI; // 종탑이 -x 쪽(정면)에 오도록

  const xFront = Math.min(...mainRing.map(along), ...(towerRing ?? []).map(along));
  const xRear = Math.max(...mainRing.map(along));
  const hwBody = Math.max(...mainRing.filter((p) => !towerRing || along(p) > xFront + 12).map((p) => Math.abs(across(p))));
  const xTowerBack = towerRing ? Math.max(...towerRing.map(along)) : xFront + 11;
  const hwTower = towerRing ? Math.max(...towerRing.map((p) => Math.abs(across(p)))) : 5.5;

  // 단면 치수(근사): 신랑 반폭 6.5, 측랑 = 나머지, 처마 신랑 17 · 측랑 9
  const hwNave = 6.5, hwAisle = hwBody;
  const eaveNave = mainHeight - 6, eaveAisle = 9, aisleTop = 12.4;
  const xc = xRear - hwBody * 0.85; // 후진 중심
  const xTr0 = xc - 9.5; // 익랑 앞
  const P = new Parts();

  // 1) 신랑
  // walkable: 종탑에 덮인 앞면(nx)을 빼고, 종탑 밖으로 드러나는 양끝 띠만 따로 세운다
  P.boxOmit('brick', xTowerBack, xc, 0, eaveNave, -hwNave, hwNave, W ? ['nx'] : []);
  if (W) for (const s of [1, -1]) P.box('brick', xTowerBack, xTowerBack + 0.3, 0, eaveNave, Math.min(s * hwTower, s * hwNave), Math.max(s * hwTower, s * hwNave));
  gable(P, xc - xTowerBack + 1.2, hwNave + 0.3, eaveNave, mainHeight, T((xTowerBack + xc) / 2 - 0.6, 0, 0), [true, false], !W);
  bandW(xTowerBack, xc, -hwNave, hwNave, eaveNave - 0.2, 'lr');

  // 2) 측랑 + 버팀벽 + 창
  const bays = Math.max(3, Math.round((xTr0 - xTowerBack) / 4.8));
  const bay = (xTr0 - xTowerBack) / bays;
  for (const s of [1, -1] as const) {
    const zIn = s * hwNave, zOut = s * hwAisle;
    // walkable: 신랑 쪽 면(안쪽)을 뺀다 — 정문으로 들여다볼 때 측랑을 가린다
    P.boxOmit('brick', xTowerBack, xTr0, 0, eaveAisle, Math.min(zIn, zOut), Math.max(zIn, zOut), W ? [s > 0 ? 'nz' : 'pz'] : []);
    const outer = s > 0 ? 'fr' : 'fl';
    bandW(xTowerBack, xTr0, Math.min(zIn, zOut), Math.max(zIn, zOut), 0.45, outer, 0.9, 0.12); // 기단
    bandW(xTowerBack, xTr0, Math.min(zIn, zOut), Math.max(zIn, zOut), eaveAisle - 0.15, outer);
    leanTo(P, xTowerBack, xTr0, zIn, zOut, eaveAisle, aisleTop);
    { // 처마 밑 작은 아치 줄 — 측랑 바깥벽과 고측벽(실제 사진)
      const fo = s > 0 ? T(0, 0, zOut) : mul(T(0, 0, zOut), RY(Math.PI)), fi = s > 0 ? T(0, 0, zIn) : mul(T(0, 0, zIn), RY(Math.PI));
      const xa = s > 0 ? xTowerBack + 0.5 : -(xTr0 - 0.5), xb = s > 0 ? xTr0 - 0.5 : -(xTowerBack + 0.5); // RY(π) 는 x 를 뒤집는다
      corbelArcade(P, xa, xb, eaveAisle - 0.55, fo);
      corbelArcade(P, xa, xb, eaveNave - 0.6, fi);
    }
    { // 실제 사진: 측랑 앞면 경사 지붕선을 따라 밝은 갓돌과 그 아래 작은 아치 줄(코벨 아케이드)
      const F = mul(T(xTowerBack, 0, 0), RY(-Math.PI / 2));
      const dz = zIn - zOut, dy = aisleTop - eaveAisle, L = Math.hypot(dz, dy), ang = Math.atan2(dy, dz);
      P.add('trim', new THREE.BoxGeometry(L + 0.3, 0.26, 0.42).rotateZ(ang).translate((zOut + zIn) / 2, (eaveAisle + aisleTop) / 2 + 0.12, 0.12), F);
      const n = Math.floor(L / 0.62);
      for (let i = 1; i < n; i++) {
        const t = i / n, u = zOut + dz * t, y = eaveAisle + dy * t - 0.3;
        P.add('trim', new THREE.TorusGeometry(0.2, 0.05, 4, 10, Math.PI).rotateZ(Math.PI).translate(u, y + 0.08, 0.14), F);
        P.add('trim', new THREE.BoxGeometry(0.08, 0.22, 0.12).translate(u - 0.2 * Math.sign(dz), y - 0.04, 0.14), F);
      }
    }
    const face = s > 0 ? (x: number) => T(x, 0, zOut) : (x: number) => mul(T(x, 0, zOut), RY(Math.PI));
    const naveFace = s > 0 ? (x: number) => T(x, 0, zIn) : (x: number) => mul(T(x, 0, zIn), RY(Math.PI));
    for (let i = 0; i <= bays; i++) {
      const x = xTowerBack + i * bay;
      buttress(P, Math.min(Math.max(x, xTowerBack + 0.45), xTr0 - 0.45), zOut, s, eaveAisle + 0.6);
      if (i < bays) {
        const xm = x + bay / 2;
        twinWindow(P, Math.min(2.7, bay - 1.6), 5.4, 2.0, face(xm)); // 측랑 창(실제처럼 큰 아치 안 2연창+둥근 창)
        twinWindow(P, Math.min(2.4, bay - 1.8), Math.max(3.2, eaveNave - aisleTop - 1.4), aisleTop + 0.5, naveFace(xm)); // 고측창
        { // 측랑 지붕 위 작은 삼각 지붕창(환기창)
          const d = Math.abs(zIn - zOut), t = 0.42, y = eaveAisle + (aisleTop - eaveAisle) * t, zl = -d * t;
          const tri = new THREE.Shape([new THREE.Vector2(-0.75, 0), new THREE.Vector2(0.75, 0), new THREE.Vector2(0, 1.05)]);
          P.add('slate', new THREE.ExtrudeGeometry(tri, { depth: 1.3, bevelEnabled: false }), mul(face(xm).clone(), T(0, y - 0.25, zl - 0.9)));
          P.add('wood', new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.55, 0.08), new THREE.Vector2(0.55, 0.08), new THREE.Vector2(0, 0.8)])), mul(face(xm).clone(), T(0, y - 0.25, zl + 0.41)));
        }
      }
    }
  }

  // 3) 익랑 (폭 전체, 양 끝 박공 + 장미창)
  // walkable: 신랑 쪽 앞면(nx)을 빼고, 측랑 지붕 위로 드러나는 앞면 양쪽만 따로 세운다
  P.boxOmit('brick', xTr0, xc, 0, eaveNave, -hwAisle, hwAisle, W ? ['nx'] : []);
  if (W) for (const s of [1, -1]) P.box('brick', xTr0, xTr0 + 0.3, 0, eaveNave, Math.min(s * hwNave, s * hwAisle), Math.max(s * hwNave, s * hwAisle));
  // 실내 익랑 볼트 앞 가장자리가 측랑 지붕 위로 0.3~0.5 m 비어져 나와 흰 띠로 보이던 것을 바깥 벽돌로 덮는다(측랑 천장 위 숨은 공간이라 실내에선 안 보임)
  if (W) for (const s of [1, -1]) P.box('brick', xTr0 - 0.75, xTr0, eaveAisle + 0.2, eaveNave, Math.min(s * (hwNave + 0.35), s * hwAisle), Math.max(s * (hwNave + 0.35), s * hwAisle));
  gable(P, hwAisle * 2, (xc - xTr0) / 2 + 0.3, eaveNave, mainHeight, mul(T((xTr0 + xc) / 2, 0, 0), RY(Math.PI / 2)), [true, true], !W);
  bandW(xTr0, xc, -hwAisle, hwAisle, 0.45, 'lr', 0.9, 0.12);
  bandW(xTr0, xc, -hwAisle, hwAisle, eaveNave - 0.2, 'lr');
  for (const s of [1, -1] as const) {
    const m = s > 0 ? T((xTr0 + xc) / 2, 0, hwAisle) : mul(T((xTr0 + xc) / 2, 0, -hwAisle), RY(Math.PI));
    twinWindow(P, 4.4, Math.min(11, eaveNave + 3.2 - 3.0), 3.0, m); // 실제 사진: 박공까지 올라가는 큰 창(2연+둥근 창)
    for (const x of [xTr0, xc]) buttress(P, x + (x === xTr0 ? 0.45 : -0.45), s * hwAisle, s, eaveNave - 2, 1.0, 1.2);
    for (const [x0, dx] of [[xTr0 + 0.45, 1], [xc - 0.45, -1]] as const) { // 모서리 쌍둥이 피너클
      pinnacle(P, x0, eaveNave, s * (hwAisle + 0.3), 0.4, 2.8, 'copper');
      pinnacle(P, x0 + dx * 0.95, eaveNave, s * (hwAisle + 0.3), 0.32, 2.2, 'copper');
    }
  }

  // 4) 후진 — 안쪽 높은 반원(신랑 높이) + 바깥 낮은 회랑
  const rIn = hwNave, rOut = Math.min(hwBody * 0.8, xRear - xc);
  // v2(실제 사진 · 서울시 후면 사진): 위 후진은 오각 다각형 벽 + 아주 긴 창 3 + 모서리 회색 버팀벽·청록 피너클,
  //   아래 회랑은 칠각 다각형 벽에 두 줄 창(위 둥근 머리 창 · 아래 둥근 구멍창) + 회색 벽돌 기둥, 지붕은 회녹색 금속판.
  //   다각형 면이 옛 원통 벽(실내 벽이 맞춰진 반지름)보다 안으로 들어오지 않게 외접 반지름을 쓴다.
  const NU = 5, NL = 7;
  const RU = rIn / Math.cos(Math.PI / (2 * NU)), RL = rOut / Math.cos(Math.PI / (2 * NL));
  const poly = (R: number, h: number, n: number) => new THREE.CylinderGeometry(R, R, h, n, 1, false, 0, Math.PI).translate(0, h / 2, 0);
  P.add('brick', poly(RU, eaveNave, NU), T(xc, 0, 0));
  P.add('brick', poly(RL, eaveAisle, NL), T(xc, 0, 0));
  P.add('zinc', new THREE.ConeGeometry(RU + 0.5, mainHeight - eaveNave, NU, 1, false, 0, Math.PI).translate(0, (mainHeight - eaveNave) / 2, 0), T(xc, eaveNave, 0));
  P.add('zinc', new THREE.CylinderGeometry(RU, RL + 0.5, aisleTop - eaveAisle, NL, 1, true, 0, Math.PI).translate(0, (aisleTop - eaveAisle) / 2, 0), T(xc, eaveAisle, 0));
  P.add('stone', new THREE.CylinderGeometry(RL + 0.12, RL + 0.12, 0.9, NL, 1, W, 0, Math.PI).translate(0, 0.45, 0), T(xc, 0, 0));
  P.add('stone', new THREE.CylinderGeometry(RL + 0.18, RL + 0.18, 0.3, NL, 1, true, 0, Math.PI).translate(0, eaveAisle - 0.15, 0), T(xc, 0, 0)); // 처마 띠
  // 아래 회랑: 면마다 위 둥근 머리 창 + 아래 둥근 구멍창, 꼭짓점마다 회색 벽돌 기둥
  for (let i = 0; i < NL; i++) {
    const th = ((i + 0.5) * Math.PI) / NL, ap = rOut + 0.02;
    const m = mul(T(xc + ap * Math.sin(th), 0, ap * Math.cos(th)), RY(th));
    const ws = 3.3, ww = 1.15, wh = Math.min(3.0, eaveAisle - ws - 1.0);
    P.add('glass', new THREE.ExtrudeGeometry(roundHead(ww, wh, ws), { depth: 0.04, bevelEnabled: false, curveSegments: 10 }), mul(m.clone(), T(0, 0, 0.01)));
    { const o = roundHead(ww + 0.5, wh + 0.25, ws - 0.15); o.holes.push(roundHead(ww, wh, ws)); P.add('grey', new THREE.ExtrudeGeometry(o, { depth: 0.2, bevelEnabled: false, curveSegments: 10 }), m); }
    P.box('stone', -0.03, 0.03, ws, ws + wh - ww / 2, 0, 0.08, m);
    P.box('stone', -ww / 2 - 0.3, ww / 2 + 0.3, ws - 0.3, ws - 0.15, -0.05, 0.3, m);
    // 아래 둥근 구멍창
    const r = 0.42, cy = 1.75;
    P.add('glass', new THREE.CircleGeometry(r, 20), mul(m.clone(), T(0, cy, 0.03)));
    { const ring = new THREE.Shape().absarc(0, cy, r + 0.22, 0, Math.PI * 2, false); ring.holes.push(new THREE.Path().absarc(0, cy, r, 0, Math.PI * 2, true)); P.add('grey', new THREE.ExtrudeGeometry(ring, { depth: 0.2, bevelEnabled: false, curveSegments: 20 }), m); }
    if (i > 0) {
      const tb = (i * Math.PI) / NL;
      const mv = mul(T(xc + RL * Math.sin(tb), 0, RL * Math.cos(tb)), RY(tb));
      P.box('grey', -0.38, 0.38, 0, eaveAisle + 0.1, -0.1, 0.35, mv);
    }
  }
  // 위 후진: 가운데 세 면에 아주 긴 창, 꼭짓점마다 회색 버팀벽 + 청록 피너클
  for (let i = 0; i < NU; i++) {
    const th = ((i + 0.5) * Math.PI) / NU, ap = rIn + 0.02;
    const m = mul(T(xc + ap * Math.sin(th), 0, ap * Math.cos(th)), RY(th));
    const sill = aisleTop + 0.25, h = eaveNave - sill - 0.35; // 사장님 확정: 회랑 지붕 바로 위부터 처마 가까이까지 길게
    if (i >= 1 && i <= 3) lancet(P, 1.35, h, sill, m, 'glass', 0.3);
    else lancet(P, 0.7, h * 0.35, sill + h * 0.4, m, 'glass', 0.2); // 양끝 면은 작은 창
    if (i > 0) {
      const tb = (i * Math.PI) / NU;
      const mv = mul(T(xc + RU * Math.sin(tb), 0, RU * Math.cos(tb)), RY(tb));
      P.box('grey', -0.45, 0.45, aisleTop - 0.5, eaveNave + 0.3, -0.1, 0.55, mv);
      const wp = new THREE.Vector3(0, 0, 0.22).applyMatrix4(mv);
      pinnacle(P, wp.x, eaveNave + 0.3, wp.z, 0.32, 2.2, 'copper');
    }
  }
  // 양옆 익랑 뒷벽: 둥근 장미창 + 모서리 피너클(실제 사진)
  for (const s2 of [1, -1] as const) {
    const zc2 = s2 * (RL + hwAisle) / 2 + s2 * 0.4;
    const m = mul(T(xc, 0, zc2), RY(Math.PI / 2));
    rose(P, 1.0, aisleTop + 1.6, m);
    pinnacle(P, xc + 0.3, eaveNave, s2 * (RU + 0.3), 0.32, 2.2, 'copper');
  }

  // 5) 종탑 — 4단(문·삼연창·시계·종루) + 팔각 첨탑 + 십자가
  const tx0 = xFront, tx1 = xTowerBack, hw = hwTower;
  const towerTop = mainHeight + 7.5;
  // walkable: 앞면은 정문 구멍이 난 벽으로 바꾸고, 뒷면(신랑 쪽)은 뺀다
  P.boxOmit('brick', tx0, tx1, 0, towerTop, -hw, hw, W ? ['nx', 'px'] : []);
  for (const y of [9.6, mainHeight - 5.25, mainHeight]) bandW(tx0, tx1, -hw, hw, y, 'flr'); // 가운데 띠는 큰 아치창 위·시계 아래로
  if (W) {
    bandW(tx0, tx1, -hw, hw, 0.45, 'lr', 0.9, 0.12);
    // 정면 기단은 현관 돌출부(폭 ±3.4) 밖에만 — 정문 통로를 막지 않게
    for (const s of [1, -1]) P.box('stone', tx0 - 0.12, tx0 + 0.25, 0, 0.9, Math.min(s * 3.4, s * (hw + 0.12)), Math.max(s * 3.4, s * (hw + 0.12)));
  } else band(P, tx0, tx1, -hw, hw, 0.45, 0.9, 0.12);
  P.box('stone', tx0 - 0.35, tx1 + 0.35, towerTop - 0.1, towerTop + 0.6, -hw - 0.35, hw + 0.35); // 처마 코니스
  // 모서리 버팀벽(위로 갈수록 얇게) + 피너클
  // 모서리 기둥(위로 갈수록 가늘게) — 모서리를 중심으로 둔 사각 기둥
  for (const x of [tx0, tx1]) for (const sz of [1, -1] as const) {
    const tiers: [number, number, number][] = [[0, 9.6, 2.0], [9.6, mainHeight - 6, 1.7], [mainHeight - 6, towerTop, 1.4]];
    const z = sz * hw;
    for (const [y0, y1, d] of tiers) {
      // 정면 모서리 버팀벽은 앞으로 깊게 내민다(영상: 정면에서 보면 종탑 양옆이 두툼한 버팀벽 기둥)
      const fx0 = x === tx0 ? x - d * 1.05 : x - d / 2, fx1 = x === tx0 ? x + d * 0.35 : x + d / 2;
      P.box('grey', fx0, fx1, y0, y1, z - d / 2, z + d / 2); // 실제 사진: 종탑 모서리 버팀벽은 땅부터 꼭대기까지 회색 벽돌
      P.box('stone', fx0 - 0.12, fx1 + 0.1, y1 - 0.22, y1 + 0.05, z - d / 2 - 0.12, z + d / 2 + 0.12); // 물끊기 갓돌
    }
    pinnacle(P, x, towerTop + 0.6, z, 0.6, 4.2, 'copper'); // 네 모서리 작은 청록 첨탑
  }
  // 정면(-x) / 측면(±z) 에 붙는 변환 — 각 면의 가운데 바닥 기준
  const faces: THREE.Matrix4[] = [
    mul(T(tx0, 0, 0), RY(-Math.PI / 2)),
    T((tx0 + tx1) / 2, 0, hw),
    mul(T((tx0 + tx1) / 2, 0, -hw), RY(Math.PI)),
  ];
  const front = faces[0];
  // 정문: 벽에서 0.6 m 내민 현관부 + 2겹 아치 + 나무문 + 위 삼각 박공(wimperg)
  const porch = mul(front.clone(), T(0, 0, 0.6));
  const PORTAL_W = 3.4, PORTAL_H = 6.4;
  if (W) {
    // 정문을 진짜 구멍으로: 현관 돌출부와 종탑 앞벽(두께 0.6) 모두 U 자 벽, 나무 문 면 없음. 문짝은 실내 쪽이 단다.
    P.add('brick', new THREE.ExtrudeGeometry(archedWall(3.4, 9.4, PORTAL_W, PORTAL_H), { depth: 0.6, bevelEnabled: false, curveSegments: 8 }), front);
    P.add('brick', new THREE.ExtrudeGeometry(archedWall(hw, towerTop, PORTAL_W, PORTAL_H), { depth: 0.6, bevelEnabled: false, curveSegments: 8 }), mul(front.clone(), T(0, 0, -0.6)));
    lancet(P, PORTAL_W, PORTAL_H, 0, porch, null, 0.95); // 바깥 석재 테만 — 안쪽 2겹째 아치는 통로 폭(3.4)을 줄이므로 뺀다
  } else {
    P.box('brick', -3.4, 3.4, 0, 9.4, 0, 0.6, front);
    lancet(P, PORTAL_W, PORTAL_H, 0, porch, 'wood', 0.95);
    lancet(P, 2.6, 5.6, 0, mul(porch.clone(), T(0, 0, 0.02)), 'wood', 0.3);
  }
  // 여러 겹으로 물러난 첨두 아치(아키볼트) — 바깥 겹일수록 크고 앞으로 나온다. 회색 벽돌, 문설주마다 가는 기둥
  for (let k = 1; k <= 3; k++) {
    const w = PORTAL_W + k * 0.62, h = PORTAL_H + k * 0.5, zf = 0.6 + (k - 1) * 0.0;
    const ring = pointed(w + 0.5, h + 0.42, 0);
    ring.holes.push(pointed(w, h, 0));
    P.add(k % 2 ? 'grey' : 'brick', new THREE.ExtrudeGeometry(ring, { depth: 0.18 + k * 0.12, bevelEnabled: false, curveSegments: 10 }), mul(porch.clone(), T(0, 0, -0.1)));
    for (const sx of [-1, 1]) P.add('stone', new THREE.CylinderGeometry(0.11, 0.11, h - w * 0.45, 10).translate(sx * (w / 2 + 0.13), (h - w * 0.45) / 2, 0.1 + k * 0.08 + zf * 0), porch);
  }
  // 문 위 박공(벽돌 + 회색 갓돌) — 가운데 작은 십자가
  const wim = new THREE.Shape([new THREE.Vector2(-3.6, 8.2), new THREE.Vector2(3.6, 8.2), new THREE.Vector2(0, 11.6)]);
  P.add('brick', new THREE.ExtrudeGeometry(wim, { depth: 0.5, bevelEnabled: false }), porch);
  for (const sx of [-1, 1]) {
    const L = Math.hypot(3.6, 3.4), ang = Math.atan2(3.4, 3.6);
    P.add('stone', new THREE.BoxGeometry(L + 0.3, 0.22, 0.62).translate(sx * -L / 2, 0, 0).rotateZ(sx * -ang).translate(sx * 3.6, 8.2, 0.25), porch);
  }
  P.add('stone', new THREE.BoxGeometry(0.16, 1.1, 0.16).translate(0, 12.1, 0.25), porch);
  P.add('stone', new THREE.BoxGeometry(0.62, 0.16, 0.16).translate(0, 12.25, 0.25), porch);
  // 삼연 첨두창
  // 가운데 큰 창 — 실제 사진: 큰 첨두 아치 하나 안에 긴 창 두 개, 그 위 둥근 창
  lancet(P, 4.3, 6.9, 10.2, front, null, 0.32); // 사장님 확정: 더 크게
  for (const dx of [-1.05, 1.05]) lancet(P, 1.3, 4.8, 10.4, mul(front.clone(), T(dx, 0, 0.02)), 'glass', 0.16);
  rose(P, 0.5, 16.1, mul(front.clone(), T(0, 0, 0.02)));
  // 시계(정면·양 측면)
  for (const f of faces) clock(P, 1.45, mainHeight - 3.2, f);
  // 측면 아래 작은 창
  for (const f of faces.slice(1)) lancet(P, 1.1, 3.6, 11.4, f, 'glass', 0.24);
  // 종루: 각 면 2연 루버창
  for (const f of faces.concat([mul(T(tx1, 0, 0), RY(Math.PI / 2))])) {
    for (const dx of [-1.25, 1.25]) {
      lancet(P, 1.4, 5.0, mainHeight + 1.0, mul(f.clone(), T(dx, 0, 0)), 'wood', 0.3);
      for (let k = 0; k < 6; k++) P.box('stone', dx - 0.68, dx + 0.68, mainHeight + 1.4 + k * 0.6, mainHeight + 1.5 + k * 0.6, 0.02, 0.16, f);
    }
  }
  // 팔각 첨탑 + 4면 작은 박공창(lucarne) + 십자가
  const spireBase = towerTop + 0.6, spireTop = towerHeight + 8; // 실제 사진처럼 더 길고 뾰족하게(사장님 확정 2회)
  const tcx = (tx0 + tx1) / 2;
  P.add('copper', new THREE.ConeGeometry(hw * 0.74, spireTop - spireBase, 8, 1).rotateY(Math.PI / 8).translate(tcx, spireBase + (spireTop - spireBase) / 2, 0));
  P.add('grey', new THREE.CylinderGeometry(hw * 0.88, hw * 0.92, 0.8, 8).rotateY(Math.PI / 8).translate(tcx, spireBase + 0.4, 0));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const tri = new THREE.Shape([new THREE.Vector2(-0.9, 0), new THREE.Vector2(0.9, 0), new THREE.Vector2(0, 2.4)]);
    const m = mul(T(tcx, spireBase + 1.0, 0), RY(a - Math.PI / 2), T(0, 0, hw * 0.64), new THREE.Matrix4().makeScale(1.55, 1.55, 1.55)); // 지붕창 크게
    P.add('grey', new THREE.ExtrudeGeometry(tri, { depth: 1.1, bevelEnabled: false }), m);
    // 지붕창 위 작은 청록 지붕 두 장 + 꼭지 피너클
    for (const sx of [-1, 1]) P.add('copper', new THREE.BoxGeometry(1.3, 0.1, 1.3).translate(sx * 0.42, 0, 0.55).rotateZ(-sx * Math.atan2(2.4, 0.9) + sx * Math.PI / 2 - sx * 0.02).translate(0, 1.2, 0), m);
    P.add('copper', new THREE.ConeGeometry(0.14, 0.9, 4).translate(0, 2.85, 1.1), m);
    P.add('glass', new THREE.ExtrudeGeometry(pointed(0.6, 1.4, 0.15), { depth: 0.05, bevelEnabled: false }), mul(m.clone(), T(0, 0, 1.11)));
  }
  P.add('metal', new THREE.SphereGeometry(0.28, 12, 8).translate(tcx, spireTop + 0.1, 0));
  P.box('metal', tcx - 0.09, tcx + 0.09, spireTop, spireTop + 2.2, -0.09, 0.09);
  P.box('metal', tcx - 0.09, tcx + 0.09, spireTop + 1.3, spireTop + 1.48, -0.6, 0.6);

  // 6) 정면 좌우 측랑 앞면: 작은 문 + 창
  for (const s of [1, -1] as const) {
    // 실제 사진 배치(종탑 → 팔각 계단탑 → 측랑 문): 계단탑을 종탑 버팀벽 바로 바깥에, 문은 그 바깥에
    const turZ = hw + 1.95;
    const zc = s * Math.min(Math.max((hw + hwAisle) / 2, turZ + 1.0 + 2.1), hwAisle - 2.0);
    const m = mul(T(tx1, 0, zc), RY(-Math.PI / 2));
    // 정면 양옆 문 — 실제 사진: 정면에서 문이 셋(가운데 정문 + 양옆 측랑 문). 회색 벽돌 아치 테 두 겹 + 나무 문 + 문턱
    lancet(P, 2.2, 4.4, 0, m, 'wood', 0.5);
    { const ring = pointed(2.2 + 1.7, 4.4 + 1.2, 0); ring.holes.push(pointed(2.2 + 1.0, 4.4 + 0.6, 0));
      P.add('grey', new THREE.ExtrudeGeometry(ring, { depth: 0.36, bevelEnabled: false, curveSegments: 8 }), m); }
    P.box('stone', -1.8, 1.8, 0, 0.18, -0.1, 0.9, m);
    lancet(P, 1.0, 2.8, 6.2, m, 'glass', 0.24);
    // 측랑 앞 모서리 팔각 계단탑 + 청록 원뿔 지붕(실제 사진: 종탑 양옆에 작은 탑)
    {
      const tz = s * turZ, txp = tx0 + (tx1 - tx0) * 0.42, tH = eaveNave + 2.5; // 정면에서도 종탑 양옆으로 보이게 앞쪽에
      P.add('grey', new THREE.CylinderGeometry(0.95, 1.05, tH, 8).rotateY(Math.PI / 8).translate(txp, tH / 2, tz));
      for (const y of [eaveAisle, eaveNave - 1]) P.add('stone', new THREE.CylinderGeometry(1.15, 1.15, 0.25, 8).rotateY(Math.PI / 8).translate(txp, y, tz));
      P.add('stone', new THREE.CylinderGeometry(1.25, 1.15, 0.35, 8).rotateY(Math.PI / 8).translate(txp, tH, tz));
      P.add('copper', new THREE.ConeGeometry(1.2, 5.2, 8).rotateY(Math.PI / 8).translate(txp, tH + 0.17 + 2.6, tz));
      P.add('metal', new THREE.SphereGeometry(0.16, 8, 6).translate(txp, tH + 5.5, tz));
      for (let k = 0; k < 3; k++) P.add('glass', new THREE.BoxGeometry(0.3, 0.9, 0.05).translate(0, 0, 1.0).rotateY(-Math.PI / 2 + (k - 1) * 0.5).translate(txp, 5 + k * 4, tz)); // 좁은 계단창
    }
  }

  // 월드 배치
  const group = new THREE.Group();
  group.name = 'myeongdong-cathedral';
  const meshes = P.build(materials());
  meshes.forEach((m) => group.add(m));
  group.rotation.y = -ang;
  group.position.set(cx, 0, cz);
  group.updateMatrixWorld(true);

  const fwd = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)); // 지역 +x
  const side = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)); // 지역 +z
  const center = new THREE.Vector3(cx, 0, cz);
  return {
    group,
    meshes,
    ...(W ? { walkable: true } : {}),
    dims: {
      xFront, xTowerBack, xTr0, xc, xRear, hwTower, hwNave, hwAisle, rIn, rOut,
      eaveNave, eaveAisle, aisleTop, ridge: mainHeight, towerTop, spireTop,
      portal: { w: PORTAL_W, h: PORTAL_H, porch: 0.6 },
    },
    frame: {
      front: center.clone().addScaledVector(fwd, xFront),
      facing: fwd.clone().negate(),
      side,
      center: center.clone().addScaledVector(fwd, (xFront + xRear) / 2),
      length: xRear - xFront,
    },
  };
}
