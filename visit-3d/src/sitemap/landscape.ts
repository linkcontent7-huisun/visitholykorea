// 명동대성당 둘레 풍경 — 가을
//   지면·성당 앞마당 포석 · OSM 도로(차도·보도·보행가·계단·횡단보도) · 녹지 · 가을 수목 · 낙엽 · 관목
//   · 바깥 건물(OSM, 반경 350 m) · 원경 시가지(채움) · 남산과 N서울타워
// 데이터: public/site/myeongdong.json 의 roads·areas·trees·farBuildings (© OpenStreetMap contributors, ODbL)
// 지형은 평지로 둔다. 공개 DEM(SRTM 30 m)은 도심에서 건물 지붕을 지면으로 읽어 성당 언덕 높낮이를 재지 못한다.
// 원경 시가지 상자와 정원 안 나무 배치는 OSM 에 없는 «채움» 이다(실제 위치 아님).
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, worldUV } from './cathedral.ts';
import { plantTrees, groundCover, type Planting } from './trees.ts';

type P2 = [number, number];
export interface LandscapeData {
  origin: { lat: number; lon: number };
  precinct: { ring: P2[] } | null;
  buildings: { osmId: number; ring: P2[] }[];
  farBuildings?: { osmId: number; height: number; ring: P2[] }[];
  roads?: { osmId: number; kind: string; name: string | null; width: number; area: boolean; crossing: boolean; oneway: boolean; line: P2[] }[];
  areas?: { osmId: number; kind: string; name: string | null; ring: P2[] }[];
  trees?: { p: P2; d: number | null }[];
}

export interface LandscapeOptions {
  /** 나무·관목을 두지 않을 영역(본당 앞마당 등) — 지역 좌표 다각형 */
  keepClear?: P2[][];
  /** 원경(바깥 시가지·남산)을 그릴지 */
  distant?: boolean;
  /**
   * 바닥 층 높이 배율(기본 1 → 포석 0.03 · 도로 0.08 · 보도 0.16 · 낙엽 0.09~0.10).
   * 0.15 를 주면 모든 바닥 층과 낙엽이 y ≤ 0.03 안에 들어간다(걷는 공간의 바닥 0 에 맞출 때).
   */
  groundScale?: number;
  /** 나무 상세도 — 'low' 는 갓·관목을 20면체로 그린다(삼각형 약 1/16). 모바일용 */
  treeDetail?: 'high' | 'low';
  /** 이 반경(m, treeCenter 기준) 밖의 나무·관목·낙엽은 빼고 원경 채움으로 둔다 */
  treeRadius?: number;
  treeCenter?: P2;
  /** 지형(동산). 없으면 평지 — 걷는 공간(바닥 0)은 넘기지 않는다 */
  terrain?: Terrain;
}

/** 높이 함수 + 지형 메시를 그릴 범위 */
export interface Terrain {
  height: (x: number, z: number) => number;
  center: P2;
  size: number;
  top: number;
}

/**
 * 성당 동산: core(본당 윤곽·앞마당) 에서 flat m 안은 top 높이, 그 밖으로 fall m 에 걸쳐 0 으로 내려간다.
 * 구역(precinct) 경계에서 edge m 안쪽까지는 0 으로 끌어내려 바깥 도로 높이를 바꾸지 않는다.
 */
export function makeHill(core: P2[][], precinct: P2[] | null, top = 7, flat = 12, fall = 30, edge = 9): (x: number, z: number) => number {
  const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
  const closed = (ring: P2[]) => [...ring, ring[0]];
  const coreL = core.map(closed), precL = precinct ? closed(precinct) : null;
  // core 전체의 둘레 상자. 여기서 flat+fall 보다 멀면 높이는 반드시 0 이라 거리 계산을 건너뛴다(값은 전과 같다)
  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
  for (const ring of core) for (const [x, z] of ring) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (z < bz0) bz0 = z; if (z > bz1) bz1 = z; }
  const reach = flat + fall;
  return (x: number, z: number) => {
    if (x < bx0 - reach || x > bx1 + reach || z < bz0 - reach || z > bz1 + reach) return 0;
    const p: P2 = [x, z];
    let d = Infinity;
    for (let i = 0; i < core.length; i++) d = Math.min(d, inside(p, core[i]) ? 0 : distToLine(p, coreL[i]));
    let h = top * smooth(1 - (d - flat) / fall);
    if (h <= 0) return 0;
    if (precinct && precL) h *= inside(p, precinct) ? smooth(distToLine(p, precL) / edge) : 0;
    return h;
  };
}

export interface Landscape {
  group: THREE.Group;
  /** 나무 줄기(충돌용) — 지역 좌표. 충돌은 이 모듈이 넣지 않는다 */
  trunks: { x: number; z: number; r: number; h: number }[];
  /** 관목(충돌용) — 지역 좌표, 반지름 */
  shrubs: { x: number; z: number; r: number }[];
  /** 바깥 건물(반경 140~350 m) — 본당을 볼 때 흐리게 할 수 있다 */
  farBuildings: THREE.Mesh[];
  stats: Record<string, number>;
}

// ── 텍스처 ─────────────────────────────────────────────────────────────

function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, r: () => number, S: number) => void, seed: number, repeatMeters: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, rng(seed), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.userData.meters = repeatMeters;
  return t;
}

function speckle(g: CanvasRenderingContext2D, r: () => number, S: number, n: number, cols: string[], size = 2) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[(r() * cols.length) | 0];
    const s = size * (0.5 + r());
    g.fillRect(r() * S, r() * S, s, s);
  }
}

const TEX = {
  asphalt: () => canvasTex(512, (g, r, S) => {
    g.fillStyle = '#3d3f42'; g.fillRect(0, 0, S, S);
    speckle(g, r, S, 26000, ['#35373a', '#46484c', '#2f3134', '#505256'], 2);
    g.strokeStyle = 'rgba(20,20,22,.35)'; g.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) { g.beginPath(); let x = r() * S, y = r() * S; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
  }, 1, 8),
  sidewalk: () => canvasTex(512, (g, r, S) => {
    // 서울 보도블록(회색·연한 적색, 20 × 10 cm 헤링본 대신 엇갈림)
    g.fillStyle = '#9d9790'; g.fillRect(0, 0, S, S);
    const bw = S / 20, bh = S / 40;
    for (let y = 0; y < 40; y++) for (let x = -1; x < 20; x++) {
      const v = r(); g.fillStyle = v < 0.12 ? '#a7786a' : v < 0.5 ? '#b2aca3' : '#a59f97';
      g.fillRect(x * bw + (y % 2) * bw * 0.5 + 1, y * bh + 1, bw - 2, bh - 2);
    }
  }, 2, 4),
  paving: () => canvasTex(512, (g, r, S) => {
    // 보행가·광장 화강석 판석(60 × 30 cm)
    g.fillStyle = '#8f8a82'; g.fillRect(0, 0, S, S);
    const bw = S / 8, bh = S / 16;
    for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) {
      const k = 175 + r() * 30;
      g.fillStyle = `rgb(${k | 0},${(k - 6) | 0},${(k - 14) | 0})`;
      g.fillRect(x * bw + (y % 2) * bw * 0.5 + 1.5, y * bh + 1.5, bw - 3, bh - 3);
    }
    speckle(g, r, S, 6000, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.08)'], 2);
  }, 3, 4.8),
  plaza: () => canvasTex(1024, (g, r, S) => {
    // 성당 앞마당: 큰 정방형 화강석(1 m) — v3-5: 잔점 결정·판마다 톤·줄눈 그늘/밝은 모서리·빗물 얼룩
    g.fillStyle = '#7a756d'; g.fillRect(0, 0, S, S);
    const n = 6, b = S / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const k = 176 + r() * 26, warm = r() < 0.25 ? 4 : 0;
      g.fillStyle = `rgb(${(k + warm) | 0},${(k - 5) | 0},${(k - 12 - warm) | 0})`;
      g.fillRect(x * b + 3, y * b + 3, b - 6, b - 6);
      g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x * b + 3, y * b + 3, b - 6, 2); g.fillRect(x * b + 3, y * b + 3, 2, b - 6);
      g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x * b + 3, y * b + b - 5, b - 6, 2); g.fillRect(x * b + b - 5, y * b + 3, 2, b - 6);
      if (r() < 0.3) { const gx = x * b + r() * b, gy = y * b + r() * b, R0 = b * (0.2 + r() * 0.3); const gr = g.createRadialGradient(gx, gy, 0, gx, gy, R0); gr.addColorStop(0, 'rgba(60,55,50,.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x * b, y * b, b, b); }
    }
    speckle(g, r, S, 90000, ['rgba(40,38,36,.35)', 'rgba(235,232,226,.35)', 'rgba(120,112,104,.3)', 'rgba(200,196,190,.3)'], 2);
  }, 4, 6),
  grass: () => canvasTex(512, (g, r, S) => {
    // 가을 잔디: 누렇게 바랜 녹색 + 마른 잎
    // v2: 큰 얼룩(마른 곳·짙은 곳) → 잔 얼룩 → 풀잎 획 → 떨어진 잎 순서로 겹친다
    g.fillStyle = '#6c7438'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 70; i++) {
      const x = r() * S, y = r() * S, R0 = 20 + r() * 70;
      const grd = g.createRadialGradient(x, y, 0, x, y, R0);
      const col = ['rgba(150,140,70,', 'rgba(80,95,40,', 'rgba(120,110,55,', 'rgba(95,105,45,'][(r() * 4) | 0];
      grd.addColorStop(0, col + '0.45)'); grd.addColorStop(1, col + '0)');
      g.fillStyle = grd; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.fillRect(x + ox - R0, y + oy - R0, R0 * 2, R0 * 2);
    }
    speckle(g, r, S, 26000, ['#7d8744', '#5f6a33', '#8d8a46', '#9a8a45', '#6a7a3a', '#565f2c'], 1.8);
    g.lineCap = 'round';
    for (let i = 0; i < 9000; i++) {
      const x = r() * S, y = r() * S, l = 3 + r() * 7, a = -Math.PI / 2 + (r() - 0.5) * 1.2;
      g.strokeStyle = ['#8a9048', '#a29a52', '#626c30', '#b0a35a', '#4f5a28'][(r() * 5) | 0];
      g.lineWidth = 0.8 + r() * 0.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    // 떨어진 잎: 네모 점 대신 작은 타원 잎(낙엽 카드가 큰 무더기를 맡는다)
    for (let i = 0; i < 520; i++) {
      g.fillStyle = ['rgba(181,101,29,.8)', 'rgba(201,162,39,.8)', 'rgba(142,59,31,.75)', 'rgba(208,138,46,.8)'][(r() * 4) | 0];
      g.beginPath(); g.ellipse(r() * S, r() * S, 2.5 + r() * 2.5, 1.2 + r() * 1.4, r() * 6.28, 0, Math.PI * 2); g.fill();
    }
  }, 5, 6),
  wood: () => canvasTex(256, (g, r, S) => {
    g.fillStyle = '#4c4a2c'; g.fillRect(0, 0, S, S);
    speckle(g, r, S, 9000, ['#5a4a26', '#3f4426', '#7a5a2a', '#6b3b1f'], 3);
  }, 6, 8),
  ground: () => canvasTex(512, (g, r, S) => {
    g.fillStyle = '#86817a'; g.fillRect(0, 0, S, S);
    speckle(g, r, S, 22000, ['#7d7871', '#8f8a83', '#76716a', '#96918a'], 3);
  }, 7, 12),
  facade: (base: string, glass: string, seed: number) => canvasTex(256, (g, r, S) => {
    // 4 m × 4 m 한 장 = 층 높이 3.3 m 근사, 창 2칸 (v3-2: 층 띠·창틀·창 안 밝기 차이·때를 더해 상자 느낌을 줄인다)
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    const fh = S / 1.2, ww = S / 2;
    for (let y = 0; y < 2; y++) {
      // 층 사이 띠(슬래브 선): 살짝 어둡고 아래 밝은 선
      g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, y * fh * 0.6 + fh * 0.04, S, 3);
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, y * fh * 0.6 + fh * 0.04 + 3, S, 1);
      for (let x = 0; x < 2; x++) {
        const wx = x * ww + ww * 0.14, wy = y * fh * 0.6 + fh * 0.12, wW = ww * 0.72, wH = fh * 0.38;
        g.fillStyle = 'rgba(20,22,26,.55)'; g.fillRect(wx - 2, wy - 2, wW + 4, wH + 4); // 창틀
        const lit = r() < 0.12;
        g.fillStyle = lit ? '#d9c78f' : glass; g.fillRect(wx, wy, wW, wH);
        // 창 안: 위쪽 하늘 반사 밝게, 아래 어둡게 / 커튼·블라인드 일부
        const gr = g.createLinearGradient(0, wy, 0, wy + wH); gr.addColorStop(0, 'rgba(200,215,230,.35)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.25)');
        g.fillStyle = gr; g.fillRect(wx, wy, wW, wH);
        if (!lit && r() < 0.3) { g.fillStyle = 'rgba(225,222,210,.55)'; g.fillRect(wx, wy, wW, wH * (0.3 + r() * 0.5)); }
        g.fillStyle = 'rgba(20,22,26,.45)'; g.fillRect(wx + wW / 2 - 1, wy, 2, wH); // 창살
      }
    }
    speckle(g, r, S, 2200, ['rgba(0,0,0,.07)', 'rgba(255,255,255,.05)'], 2);
    // 빗물 때: 창 아래로 흐르는 옅은 자국
    for (let i = 0; i < 10; i++) { const x = r() * S, y = r() * S, h = 20 + r() * 60; const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(0,0,0,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, 2 + r() * 4, h); }
  }, seed, 4),
};

/** 둘레(가까운) 건물 외벽 재질 — 콘크리트·석재·벽돌 톤 4종, 4 m 타일(worldUV 1/4 로 쓴다). v3-2 */
export function neighborFacades(): THREE.MeshStandardMaterial[] {
  return [
    mat(TEX.facade('#9a9288', '#33404a', 21), { roughness: 0.85 }),
    mat(TEX.facade('#7d8084', '#2a3640', 22), { roughness: 0.8 }),
    mat(TEX.facade('#a89c8a', '#3a4650', 23), { roughness: 0.88 }),
    mat(TEX.facade('#8a7a6c', '#2e3944', 24), { roughness: 0.9 }),
    mat(TEX.facade('#b2aa9c', '#3c4852', 25), { roughness: 0.85 }),
  ];
}

function mat(tex: THREE.Texture, opts: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, ...opts });
}

// ── 기하 도우미 ─────────────────────────────────────────────────────────

function flatPoly(ring: P2[], y: number): THREE.BufferGeometry {
  const s = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  return new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2).translate(0, y, 0);
}

/** 폴리라인 → 평평한 띠(이음매는 원판으로 메운다) */
let DRAPE: ((x: number, z: number) => number) | null = null; // 지형이 있으면 띠를 2 m 마디로 나눠 지면에 붙인다
function ribbon(line0: P2[], w: number, y: number, out: THREE.BufferGeometry[], offset = 0) {
  const h = w / 2;
  let line = line0;
  if (DRAPE) {
    const D = DRAPE;
    const touches = line0.some(([x, z]) => D(x, z) > 0.01) || line0.some((p, i) => i > 0 && D((p[0] + line0[i - 1][0]) / 2, (p[1] + line0[i - 1][1]) / 2) > 0.01);
    if (touches) {
      line = [line0[0]];
      for (let i = 1; i < line0.length; i++) {
        const [x0, z0] = line0[i - 1], [x1, z1] = line0[i], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2));
        for (let k = 1; k <= n; k++) line.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
      }
    }
  }
  const Yat = (x: number, z: number) => y + (DRAPE ? DRAPE(x, z) : 0);
  for (let i = 1; i < line.length; i++) {
    const [x0, z0] = line[i - 1], [x1, z1] = line[i];
    const L = Math.hypot(x1 - x0, z1 - z0);
    if (L < 0.01) continue;
    const nx = -(z1 - z0) / L, nz = (x1 - x0) / L;
    const ox = nx * offset, oz = nz * offset;
    const p = [
      [x0 + ox + nx * h, z0 + oz + nz * h], [x0 + ox - nx * h, z0 + oz - nz * h],
      [x1 + ox - nx * h, z1 + oz - nz * h], [x1 + ox + nx * h, z1 + oz + nz * h],
    ];
    const g = new THREE.BufferGeometry();
    const pos = [p[0], p[1], p[2], p[0], p[2], p[3]].flatMap(([x, z]) => [x, Yat(x, z), z]);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    // 아래를 향하면 뒤집는다(그리는 순서 때문에)
    if (g.attributes.normal.getY(0) < 0) {
      const a = g.attributes.position.array as Float32Array;
      for (const t of [0, 3]) for (let k = 0; k < 3; k++) { const i1 = (t + 1) * 3 + k, i2 = (t + 2) * 3 + k; [a[i1], a[i2]] = [a[i2], a[i1]]; }
      g.computeVertexNormals();
    }
    out.push(g);
    if (i < line.length - 1 && offset === 0) out.push(new THREE.CircleGeometry(h, 12).rotateX(-Math.PI / 2).translate(x1, Yat(x1, z1), z1));
  }
}

function mergeTo(list: THREE.BufferGeometry[], m: THREE.Material, uvScale: number, name: string): THREE.Mesh | null {
  if (!list.length) return null;
  const norm = list.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k);
    if (!n.attributes.normal) n.computeVertexNormals();
    worldUV(n, uvScale);
    return n;
  });
  const merged = mergeGeometries(norm, false)!;
  norm.forEach((g) => g.dispose());
  const mesh = new THREE.Mesh(merged, m);
  mesh.receiveShadow = true;
  mesh.name = name;
  return mesh;
}

function inside([x, z]: P2, ring: P2[]) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i], [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

function distToLine([x, z]: P2, line: P2[]) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [x0, z0] = line[i - 1], [x1, z1] = line[i];
    const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / L2));
    best = Math.min(best, Math.hypot(x - (x0 + t * dx), z - (z0 + t * dz)));
  }
  return best;
}

/** 다각형들을 20 m 격자로 나눠 «점이 어떤 다각형 안인가» 를 빨리 판정 */
function polyIndex(polys: P2[][], cell = 20) {
  const grid = new Map<string, P2[][]>();
  // 다각형마다 둘레 상자와 닫은 선을 한 번만 만들어 둔다(여유 거리 판정을 빨리 걸러내려고. 결과는 전과 같다)
  const meta = new Map<P2[], { x0: number; x1: number; z0: number; z1: number; closed: P2[] }>();
  for (const ring of polys) {
    const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]);
    meta.set(ring, { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), closed: [...ring, ring[0]] });
    for (let gx = Math.floor(Math.min(...xs) / cell); gx <= Math.floor(Math.max(...xs) / cell); gx++)
      for (let gz = Math.floor(Math.min(...zs) / cell); gz <= Math.floor(Math.max(...zs) / cell); gz++) {
        const k = `${gx},${gz}`;
        (grid.get(k) ?? grid.set(k, []).get(k)!).push(ring);
      }
  }
  return (p: P2, pad = 0) => {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const list = grid.get(`${Math.floor(p[0] / cell) + dx},${Math.floor(p[1] / cell) + dz}`);
      if (!list) continue;
      for (const ring of list) {
        const m = meta.get(ring)!;
        if (p[0] < m.x0 - pad || p[0] > m.x1 + pad || p[1] < m.z0 - pad || p[1] > m.z1 + pad) continue; // 상자 밖이면 안도 아니고 pad 안도 아니다
        if (inside(p, ring)) return true;
        if (pad > 0 && distToLine(p, m.closed) < pad) return true;
      }
    }
    return false;
  };
}

// ── 가을 수목 ──────────────────────────────────────────────────────────

type Species = 'ginkgo' | 'maple' | 'zelkova' | 'cherry' | 'pine';
const PALETTE: Record<Species, number[]> = {
  ginkgo: [0xe8b923, 0xf0c419, 0xd9a514, 0xe6c84a, 0xc99a1a],
  maple: [0xc0392b, 0xb22a1d, 0xd1462c, 0xe0612b, 0x9e2a20, 0xd97a2a],
  zelkova: [0xc8742c, 0xb5652a, 0xa65a24, 0xd28c3c, 0x8f6a2e],
  cherry: [0xb5462e, 0xc2603a, 0x9c3b2a, 0xcc7a3c],
  pine: [0x2e4f2f, 0x35573a, 0x2a4530],
};

interface Tree { p: P2; sp: Species; h: number }

function lumpyBlob(seed: number, detail = 2) {
  // 꼭짓점을 합쳐 두어야 법선이 부드럽게 이어진다(합치지 않으면 면마다 각진 로우폴리로 보인다)
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, detail).deleteAttribute('normal').deleteAttribute('uv'));
  const r = rng(seed), pos = g.attributes.position;
  const v = new THREE.Vector3();
  const cache = new Map<string, number>(); // 같은 꼭짓점은 같은 변위(틈 방지)
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    const k = cache.get(key) ?? (cache.set(key, 0.82 + r() * 0.36), cache.get(key)!);
    v.multiplyScalar(k);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** 잎 무리 카드 텍스처 — 작은 잎(단풍잎·둥근 잎)이 겹쳐 그려진 투명 카드. 색은 인스턴스 색이 입힌다(여기는 밝은 회색조) */
let LEAF_TEX: THREE.CanvasTexture | null = null;
function leafCluster(): THREE.CanvasTexture {
  if (LEAF_TEX) return LEAF_TEX;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!, r = rng(77);
  const maple = (x: number, y: number, R: number, a: number) => {
    g.save(); g.translate(x, y); g.rotate(a); g.beginPath();
    for (let i = 0; i < 10; i++) { const ang = (i / 10) * Math.PI * 2, rr = i % 2 ? R * 0.45 : R; g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    g.closePath(); g.fill(); g.restore();
  };
  for (let i = 0; i < 170; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * S * 0.44, x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d;
    const v = 150 + r() * 105; g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`;
    if (r() < 0.6) maple(x, y, 9 + r() * 9, r() * 6.28);
    else { g.beginPath(); g.ellipse(x, y, 6 + r() * 6, 3 + r() * 4, r() * 6.28, 0, Math.PI * 2); g.fill(); }
  }
  LEAF_TEX = new THREE.CanvasTexture(c);
  LEAF_TEX.colorSpace = THREE.SRGBColorSpace;
  return LEAF_TEX;
}

/** v1 공 모양 수관 나무(v1-게임느낌). v2 는 trees.ts 의 plantTrees 를 쓴다 */
export function buildTrees(trees: Tree[], seed: number, leavesOn: (p: P2) => boolean, gs = 1, detail = 2, H: (x: number, z: number) => number = () => 0): THREE.Group {
  const r = rng(seed);
  const group = new THREE.Group();
  group.name = 'trees';
  const deciduous = trees.filter((t) => t.sp !== 'pine'), pines = trees.filter((t) => t.sp === 'pine');
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), col = new THREE.Color();

  // 줄기
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.62, 1, 1, 7).translate(0, 0.5, 0),
    new THREE.MeshStandardMaterial({ color: 0x4a3b2e, roughness: 0.95 }), trees.length);
  trees.forEach((t, i) => {
    const th = t.sp === 'pine' ? t.h * 0.75 : t.h * 0.42, tr = 0.12 + t.h * 0.018;
    m4.compose(ps.set(t.p[0], H(t.p[0], t.p[1]) - 0.3, t.p[1]), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28), sc.set(tr, th + 0.3, tr));
    trunk.setMatrixAt(i, m4);
  });
  trunk.castShadow = true;
  group.add(trunk);

  // 활엽수 수관: 울퉁불퉁한 구 3~5개
  const blobsPer = deciduous.map((t) => (t.sp === 'ginkgo' ? 4 : 3 + ((r() * 3) | 0)));
  const nBlobs = blobsPer.reduce((a, b) => a + b, 0);
  // 수관 몸통은 매끈하게(각진 면이 보이지 않게) 조금 어둡게 — 그 위를 잎 무리 카드가 덮는다
  const crown = new THREE.InstancedMesh(lumpyBlob(seed + 1, detail), new THREE.MeshStandardMaterial({ roughness: 0.92 }), nBlobs);
  const blobs: { x: number; y: number; z: number; s: number; pal: number[] }[] = [];
  let k = 0;
  deciduous.forEach((t, ti) => {
    const pal = PALETTE[t.sp], h = t.h, g0 = H(t.p[0], t.p[1]);
    const base = g0 + h * 0.4, R = t.sp === 'ginkgo' ? h * 0.2 : h * 0.3;
    for (let b = 0; b < blobsPer[ti]; b++) {
      const a = r() * 6.28, d = b === 0 ? 0 : R * (0.35 + r() * 0.45);
      const y = t.sp === 'ginkgo' ? base + R + (b / blobsPer[ti]) * h * 0.45 : base + R * (0.8 + r() * 0.6);
      const s = R * (b === 0 ? 1 : 0.65 + r() * 0.35);
      m4.compose(ps.set(t.p[0] + Math.cos(a) * d, y, t.p[1] + Math.sin(a) * d), q.random(), sc.set(s, s * (t.sp === 'ginkgo' ? 1.25 : 0.9), s));
      crown.setMatrixAt(k, m4);
      crown.setColorAt(k, col.setHex(pal[(r() * pal.length) | 0]).offsetHSL(0, 0, -0.12 + (r() - 0.5) * 0.06));
      blobs.push({ x: ps.x, y: ps.y, z: ps.z, s, pal });
      k++;
    }
  });
  crown.castShadow = true;
  crown.receiveShadow = true;
  group.add(crown);

  // 잎 무리 카드 — 수관 겉면을 따라 비스듬히 꽂아 풍성하고 부드러운 단풍 덩어리로 보이게
  const perBlob = detail >= 2 ? 16 : 5;
  const cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ map: leafCluster(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 }), blobs.length * perBlob);
  const dir = new THREE.Vector3(), up = new THREE.Vector3(0, 0, 1);
  let ci = 0;
  for (const b of blobs) {
    for (let j = 0; j < perBlob; j++) {
      dir.set(r() * 2 - 1, r() * 1.6 - 0.5, r() * 2 - 1).normalize();
      ps.set(b.x + dir.x * b.s * 1.08, b.y + dir.y * b.s * 1.0, b.z + dir.z * b.s * 1.08);
      q.setFromUnitVectors(up, dir).multiply(new THREE.Quaternion().setFromAxisAngle(up, r() * 6.28));
      const cs = b.s * (0.7 + r() * 0.45);
      m4.compose(ps, q, sc.set(cs, cs, cs));
      cards.setMatrixAt(ci, m4);
      cards.setColorAt(ci, col.setHex(b.pal[(r() * b.pal.length) | 0]).offsetHSL(0, 0.05, (r() - 0.35) * 0.1));
      ci++;
    }
  }
  cards.count = ci;
  cards.receiveShadow = true;
  cards.name = 'leaf-cards';
  group.add(cards);

  // 소나무: 원뿔 3단
  if (pines.length) {
    const cone = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), pines.length * 3);
    pines.forEach((t, i) => {
      for (let j = 0; j < 3; j++) {
        const s = t.h * (0.32 - j * 0.07), y = H(t.p[0], t.p[1]) + t.h * (0.35 + j * 0.2);
        m4.compose(ps.set(t.p[0], y, t.p[1]), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28), sc.set(s, t.h * 0.32, s));
        cone.setMatrixAt(i * 3 + j, m4);
        cone.setColorAt(i * 3 + j, col.setHex(PALETTE.pine[(r() * 3) | 0]));
      }
    });
    cone.castShadow = true;
    group.add(cone);
  }

  // 낙엽: 활엽수 둘레에 흩어진 작은 잎
  const per = 26;
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.22, 0.16).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide }), deciduous.length * per);
  let n = 0;
  deciduous.forEach((t) => {
    const pal = PALETTE[t.sp];
    for (let j = 0; j < per; j++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * t.h * 0.45;
      const p: P2 = [t.p[0] + Math.cos(a) * d, t.p[1] + Math.sin(a) * d];
      if (!leavesOn(p)) continue;
      m4.compose(ps.set(p[0], H(p[0], p[1]) + (0.09 + r() * 0.01) * gs, p[1]), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28), sc.setScalar(0.7 + r() * 0.8));
      leaves.setMatrixAt(n, m4);
      leaves.setColorAt(n, col.setHex(pal[(r() * pal.length) | 0]).offsetHSL(0, -0.1, -0.08 * r()));
      n++;
    }
  });
  leaves.count = n;
  leaves.receiveShadow = true;
  group.add(leaves);
  return group;
}

// ── 원경 ────────────────────────────────────────────────────────────────

/** 남산(정상 해발 약 262 m, 성당 마당 약 55 m) + N서울타워(236 m). 위치는 위경도에서 계산한다 */
function namsan(origin: { lat: number; lon: number }, seed: number): THREE.Group {
  const R = 6378137, kx = (Math.PI / 180) * R * Math.cos((origin.lat * Math.PI) / 180), kz = (Math.PI / 180) * R;
  const peak = { x: (126.9882 - origin.lon) * kx, z: -(37.5512 - origin.lat) * kz }; // N서울타워
  const H = 205, span = 900;
  const g0 = new THREE.PlaneGeometry(span * 2, span * 2, 110, 110).rotateX(-Math.PI / 2);
  const g = g0.index ? g0.toNonIndexed() : g0; if (g !== g0) g0.dispose(); // 면마다 다른 색(나무 갓의 얼룩)
  const pos = g.attributes.position, r = rng(seed);
  const colors = new Float32Array(pos.count * 3), c = new THREE.Color();
  const autumn = [0x7a3a22, 0x8f4a24, 0x9c6a2e, 0x5f5a2c, 0x3a4a2e, 0x8a3f22, 0x6b5428, 0x47502e];
  const noise = (x: number, z: number) => Math.sin(x * 0.011 + 1.3) * Math.cos(z * 0.013 - 0.7) + 0.5 * Math.sin(x * 0.031 + z * 0.027);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), d = Math.hypot(x, z * 1.25);
    const h = Math.max(0, H * Math.exp(-((d / 420) ** 2)) + 12 * noise(x, z) - 4);
    pos.setY(i, h + 1.25 * Math.sin(x * 0.37 + z * 0.21) * Math.cos(z * 0.29 - x * 0.13)); // 위치의 함수 — 이웃 면과 꼭짓점이 어긋나지 않는다
  }
  for (let f = 0; f < pos.count; f += 3) {
    c.setHex(autumn[(r() * autumn.length) | 0]).offsetHSL(0, -0.05, (r() - 0.5) * 0.05);
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (f + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const hill = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  hill.position.set(peak.x, -1, peak.z);
  const grp = new THREE.Group();
  grp.name = 'namsan';
  grp.add(hill);
  // N서울타워: 받침 + 기둥 + 전망부 + 안테나
  const steel = new THREE.MeshStandardMaterial({ color: 0xd9dcdf, roughness: 0.5, metalness: 0.2 });
  const top = H - 1;
  const parts: [THREE.BufferGeometry, number][] = [
    [new THREE.CylinderGeometry(9, 12, 18, 16), top + 9],
    [new THREE.CylinderGeometry(4.2, 5.5, 120, 16), top + 18 + 60],
    [new THREE.CylinderGeometry(13, 10, 22, 20), top + 148],
    [new THREE.CylinderGeometry(7, 9, 12, 16), top + 165],
    [new THREE.CylinderGeometry(1.4, 2.8, 65, 8), top + 203],
  ];
  for (const [geo, y] of parts) { const m = new THREE.Mesh(geo, steel); m.position.set(peak.x, y, peak.z); grp.add(m); }
  return grp;
}

/** 반경 380~1400 m 원경 시가지(채움 상자) — 남산 쪽은 비운다 */
function cityFill(seed: number, avoid: { x: number; z: number; r: number }): THREE.InstancedMesh {
  const r = rng(seed), N = 900;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.9 }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  let n = 0;
  for (let i = 0; i < N * 3 && n < N; i++) {
    const a = r() * Math.PI * 2, d = 380 + Math.sqrt(r()) * 1020;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - avoid.x, z - avoid.z) < avoid.r) continue;
    const h = 12 + r() ** 2 * 80, w = 14 + r() * 26, dd = 14 + r() * 26;
    m4.compose(new THREE.Vector3(x, 0, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (r() - 0.5) * 0.5), new THREE.Vector3(w, h, dd));
    mesh.setMatrixAt(n, m4);
    mesh.setColorAt(n, c.setHSL(0.08 + r() * 0.05, 0.04 + r() * 0.05, 0.42 + r() * 0.16));
    n++;
  }
  mesh.count = n;
  mesh.name = 'city-fill';
  return mesh;
}

// ── 조립 ────────────────────────────────────────────────────────────────

const VEHICLE = new Set(['primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'residential', 'service', 'busway', 'living_street']);
const SIDEWALK_W: Record<string, number> = { primary: 4, secondary: 3, tertiary: 2.5 };

export function buildLandscape(site: LandscapeData, opts: LandscapeOptions = {}): Landscape {
  const group = new THREE.Group();
  group.name = 'landscape';
  const r = rng(20261108);
  const gs = opts.groundScale ?? 1;
  const Y = (v: number) => v * gs;
  const TR = opts.terrain;
  const H = TR ? TR.height : () => 0;
  const detail = opts.treeDetail === 'low' ? 0 : 2;
  const tc = opts.treeCenter ?? [0, 0], tR = opts.treeRadius ?? Infinity;
  const inTreeRange = (p: P2) => Math.hypot(p[0] - tc[0], p[1] - tc[1]) <= tR;
  DRAPE = TR ? TR.height : null;
  const stats: Record<string, number> = {};
  const M = {
    ground: mat(TEX.ground()), asphalt: mat(TEX.asphalt(), { roughness: 0.9 }), sidewalk: mat(TEX.sidewalk()),
    paving: mat(TEX.paving()), plaza: mat(TEX.plaza(), { roughness: 0.85 }), grass: mat(TEX.grass(), { roughness: 1 }),
    wood: mat(TEX.wood(), { roughness: 1 }),
    paint: new THREE.MeshStandardMaterial({ color: 0xf2f0e8, roughness: 0.7 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xe0b020, roughness: 0.7 }),
    curb: new THREE.MeshStandardMaterial({ color: 0xa9a49b, roughness: 0.85 }),
  };
  const uv = (t: THREE.MeshStandardMaterial) => 1 / ((t.map?.userData.meters as number) ?? 4);

  // 1) 바탕 지면
  const bg = new THREE.CircleGeometry(1500, 64).rotateX(-Math.PI / 2).toNonIndexed();
  worldUV(bg, uv(M.ground));
  const base = new THREE.Mesh(bg, M.ground);
  base.receiveShadow = true;
  group.add(base);

  // 2) 성당 앞마당(구역 전체 포석)
  if (site.precinct) { const m = mergeTo([flatPoly(site.precinct.ring, Y(0.03))], M.plaza, uv(M.plaza), 'precinct'); if (m) group.add(m); }

  // 3) 녹지
  const greenKinds = new Set(['garden', 'park', 'grass', 'meadow', 'pitch']);
  const woodKinds = new Set(['forest', 'wood', 'scrub']);
  const areas = site.areas ?? [];
  const gGreen: THREE.BufferGeometry[] = [], gWood: THREE.BufferGeometry[] = [], gPark: THREE.BufferGeometry[] = [];
  for (const a of areas) {
    if (TR && a.ring.some(([x, z]) => H(x, z) > 0.05)) continue; // 동산 위 녹지는 지형 메시(잔디 비탈)가 대신한다
    try {
      if (greenKinds.has(a.kind)) gGreen.push(flatPoly(a.ring, Y(0.06)));
      else if (woodKinds.has(a.kind)) gWood.push(flatPoly(a.ring, Y(0.06)));
      else if (a.kind === 'parking') gPark.push(flatPoly(a.ring, Y(0.05)));
    } catch { /* 자기 교차 다각형은 건너뛴다 */ }
  }
  for (const [list, m, nm] of [[gGreen, M.grass, 'green'], [gWood, M.wood, 'woodland'], [gPark, M.asphalt, 'parking']] as const) {
    const mesh = mergeTo(list as THREE.BufferGeometry[], m, uv(m), nm); if (mesh) group.add(mesh);
  }
  stats.green = gGreen.length + gWood.length;

  // 4) 도로
  const roads = site.roads ?? [];
  const gAsph: THREE.BufferGeometry[] = [], gWalk: THREE.BufferGeometry[] = [], gPave: THREE.BufferGeometry[] = [];
  const gPaint: THREE.BufferGeometry[] = [], gYellow: THREE.BufferGeometry[] = [], gCurb: THREE.BufferGeometry[] = [];
  for (const rd of roads) {
    if (rd.area && rd.line.length >= 3) { try { gPave.push(flatPoly(rd.line, Y(0.11))); } catch { /* skip */ } continue; }
    if (rd.crossing) {
      // 횡단보도: 0.5 m 흰 줄
      for (let i = 1; i < rd.line.length; i++) {
        const [x0, z0] = rd.line[i - 1], [x1, z1] = rd.line[i], L = Math.hypot(x1 - x0, z1 - z0);
        for (let d = 0.4; d < L; d += 1.0) {
          const t = d / L, cx = x0 + (x1 - x0) * t, cz = z0 + (z1 - z0) * t;
          ribbon([[cx - ((x1 - x0) / L) * 0.25, cz - ((z1 - z0) / L) * 0.25], [cx + ((x1 - x0) / L) * 0.25, cz + ((z1 - z0) / L) * 0.25]], 4, Y(0.13), gPaint);
        }
      }
      continue;
    }
    if (VEHICLE.has(rd.kind)) {
      ribbon(rd.line, rd.width, Y(0.08), gAsph);
      const sw = SIDEWALK_W[rd.kind];
      if (sw) for (const s of [1, -1]) {
        ribbon(rd.line, sw, Y(0.16), gWalk, s * (rd.width / 2 + sw / 2));
        ribbon(rd.line, 0.2, Y(0.17), gCurb, s * (rd.width / 2 + 0.1));
      }
      if (rd.kind === 'primary' && !rd.oneway) { ribbon(rd.line, 0.15, Y(0.1), gYellow, 0.15); ribbon(rd.line, 0.15, Y(0.1), gYellow, -0.15); }
      else if (['primary', 'secondary'].includes(rd.kind) && rd.width >= 9) {
        // 차선 점선
        const lanes = Math.round(rd.width / 3.3);
        for (let l = 1; l < lanes; l++) {
          const off = -rd.width / 2 + l * (rd.width / lanes);
          for (let i = 1; i < rd.line.length; i++) {
            const [x0, z0] = rd.line[i - 1], [x1, z1] = rd.line[i], L = Math.hypot(x1 - x0, z1 - z0);
            for (let d = 1; d + 3 < L; d += 8) {
              const a = d / L, b = (d + 3) / L;
              ribbon([[x0 + (x1 - x0) * a, z0 + (z1 - z0) * a], [x0 + (x1 - x0) * b, z0 + (z1 - z0) * b]], 0.15, Y(0.1), gPaint, off);
            }
          }
        }
      }
    } else if (rd.kind === 'pedestrian') ribbon(rd.line, rd.width, Y(0.11), gPave);
    else ribbon(rd.line, rd.width, Y(0.12), gWalk);
  }
  for (const [list, m, nm] of [[gAsph, M.asphalt, 'roads'], [gWalk, M.sidewalk, 'sidewalks'], [gPave, M.paving, 'pedestrian'], [gPaint, M.paint, 'markings'], [gYellow, M.yellow, 'centerline'], [gCurb, M.curb, 'curbs']] as const) {
    const mesh = mergeTo(list as THREE.BufferGeometry[], m, uv(m as THREE.MeshStandardMaterial), nm); if (mesh) group.add(mesh);
  }
  stats.roads = roads.length;

  // 4-1) 동산 지형: 꼭대기는 앞마당 포석, 비탈은 가을 잔디, 가파른 면은 석축
  if (TR) {
    const seg = Math.round(TR.size / 1.5);
    const pg = new THREE.PlaneGeometry(TR.size, TR.size, seg, seg).rotateX(-Math.PI / 2).translate(TR.center[0], 0, TR.center[1]);
    const g = pg.toNonIndexed(); pg.dispose();
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, H(pos.getX(i), pos.getZ(i)) + Y(0.035));
    const top: number[] = [], slope: number[] = [], wall: number[] = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), nrm = new THREE.Vector3();
    for (let f = 0; f < pos.count; f += 3) {
      a.fromBufferAttribute(pos, f); b.fromBufferAttribute(pos, f + 1); c.fromBufferAttribute(pos, f + 2);
      const avg = (a.y + b.y + c.y) / 3;
      if (Math.max(a.y, b.y, c.y) < Y(0.035) + 0.02) continue; // 평지는 바탕 지면이 맡는다
      nrm.subVectors(c, b).cross(a.clone().sub(b)).normalize();
      const list = Math.abs(nrm.y) < 0.62 ? wall : avg > TR.top - 0.25 ? top : slope;
      for (const v of [a, b, c]) list.push(v.x, v.y, v.z);
    }
    g.dispose();
    const mk = (arr: number[]) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); geo.computeVertexNormals(); return geo; };
    const stoneWall = mat(TEX.paving(), { color: 0xb0a898 });
    for (const [arr, m, nm] of [[top, M.plaza, 'hill-top'], [slope, M.grass, 'hill-slope'], [wall, stoneWall, 'hill-wall']] as const) {
      if (!arr.length) continue;
      const mesh = mergeTo([mk(arr as number[])], m, uv(m), nm); if (mesh) { mesh.castShadow = nm === 'hill-wall'; group.add(mesh); }
    }
    stats.hillTriangles = (top.length + slope.length + wall.length) / 9;
  }

  // 5) 나무 자리
  const inBuilding = polyIndex([...site.buildings.map((b) => b.ring), ...(site.farBuildings ?? []).map((b) => b.ring)]);
  const clear = opts.keepClear ?? [];
  // 길마다 둘레 상자를 한 번만 구해 두고, 점이 상자에서 한계 거리보다 멀면 거리 계산을 건너뛴다.
  // 결과(참·거짓)는 전과 똑같고 계산만 준다 — 풀 22,000포기·낙엽마다 모든 길과 거리를 재느라 입장이 4초쯤 멈췄다(2026-11-12).
  const roadBox = new Map(roads.map((rd) => {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of rd.line) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    return [rd, [x0, x1, z0, z1] as const];
  }));
  const roadWithin = (p: P2, rd: (typeof roads)[number], lim: number) => {
    const b = roadBox.get(rd)!;
    if (p[0] < b[0] - lim || p[0] > b[1] + lim || p[1] < b[2] - lim || p[1] > b[3] + lim) return false;
    return distToLine(p, rd.line) < lim;
  };
  const onRoad = (p: P2, pad = 1) => roads.some((rd) => !rd.area && VEHICLE.has(rd.kind) && roadWithin(p, rd, rd.width / 2 + pad));
  // 보행로·계단 위에도 나무·관목을 두지 않는다(v1 은 차도만 피해서 산책로 위에 관목이 났다)
  const anyRoad = (p: P2, pad: number) => roads.some((rd) => !rd.area && roadWithin(p, rd, rd.width / 2 + pad));
  const okSpot = (p: P2, pad = 2) => !inBuilding(p, pad) && !clear.some((c) => inside(p, c)) && !onRoad(p) && !anyRoad(p, 0.8);
  const trees: Tree[] = [];
  const pick = (w: [Species, number][]) => { let x = r() * w.reduce((a, b) => a + b[1], 0); for (const [s, k] of w) { if ((x -= k) <= 0) return s; } return w[0][0]; };
  const GARDEN: [Species, number][] = [['maple', 30], ['zelkova', 25], ['ginkgo', 18], ['pine', 15], ['cherry', 12]];
  const STREET: [Species, number][] = [['ginkgo', 85], ['zelkova', 15]];
  const near = (p: P2, d: number) => trees.some((t) => Math.hypot(t.p[0] - p[0], t.p[1] - p[1]) < d);
  // OSM 나무(실제 위치)
  for (const t of site.trees ?? []) if (inTreeRange(t.p) && !inBuilding(t.p) && !clear.some((c) => inside(t.p, c)) && !roads.some((rd) => !rd.area && !VEHICLE.has(rd.kind) && distToLine(t.p, rd.line) < rd.width / 2 + 0.5)) trees.push({ p: t.p, sp: pick(GARDEN), h: 7 + r() * 6 });
  stats.osmTrees = trees.length;
  // 가로수: 큰길 보도에 9 m 간격(서울 도심 가로수는 은행나무가 많다)
  for (const rd of roads) {
    const sw = SIDEWALK_W[rd.kind];
    if (!sw || rd.area) continue;
    for (const s of [1, -1]) for (let i = 1; i < rd.line.length; i++) {
      const [x0, z0] = rd.line[i - 1], [x1, z1] = rd.line[i], L = Math.hypot(x1 - x0, z1 - z0);
      const nx = -(z1 - z0) / L, nz = (x1 - x0) / L, off = s * (rd.width / 2 + 1.0);
      for (let d = 4; d < L - 2; d += 9) {
        const p: P2 = [x0 + ((x1 - x0) * d) / L + nx * off, z0 + ((z1 - z0) * d) / L + nz * off];
        if (inTreeRange(p) && !inBuilding(p, 1.2) && !clear.some((c) => inside(p, c)) && !near(p, 5)) trees.push({ p, sp: pick(STREET), h: 9 + r() * 5 });
      }
    }
  }
  stats.streetTrees = trees.length - stats.osmTrees;
  // 정원·공원 안(채움): 45 m² 에 한 그루, 3.5 m 간격
  const gardenRings = areas.filter((a) => greenKinds.has(a.kind) || woodKinds.has(a.kind)).map((a) => a.ring);
  for (const ring of gardenRings) {
    const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]);
    const area = Math.abs(ring.reduce((s, [x, z], i) => { const [x2, z2] = ring[(i + 1) % ring.length]; return s + x * z2 - x2 * z; }, 0)) / 2;
    const want = Math.min(60, Math.round(area / 45));
    for (let tries = 0, got = 0; tries < want * 8 && got < want; tries++) {
      const p: P2 = [Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs)), Math.min(...zs) + r() * (Math.max(...zs) - Math.min(...zs))];
      if (inside(p, ring) && inTreeRange(p) && okSpot(p, 1.5) && !near(p, 3.5)) { trees.push({ p, sp: pick(GARDEN), h: 6 + r() * 7 }); got++; }
    }
  }
  // 성당 구역 가장자리(채움): 건물에서 4 m 떨어진 빈 땅
  if (site.precinct) {
    const ring = site.precinct.ring, xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]);
    for (let tries = 0, got = 0; tries < 1500 && got < 70; tries++) {
      const p: P2 = [Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs)), Math.min(...zs) + r() * (Math.max(...zs) - Math.min(...zs))];
      if (inside(p, ring) && inTreeRange(p) && distToLine(p, [...ring, ring[0]]) < 14 && okSpot(p, 4) && !near(p, 5)) { trees.push({ p, sp: pick(GARDEN), h: 8 + r() * 7 }); got++; }
    }
  }
  stats.trees = trees.length;
  const leavesOn = (p: P2) => !inBuilding(p) && !onRoad(p, 0) && !clear.some((c) => inside(p, c));
  // v2: 가지를 뻗어 자란 실사풍 나무(trees.ts). v1 의 공 모양 수관(buildTrees)은 남겨 두되 쓰지 않는다
  const plantings: Planting[] = trees.map((t) => ({ p: t.p, sp: t.sp, h: t.h * (t.sp === 'pine' ? 1 : 1.08) }));
  // 줄기 반지름·높이는 buildTrees 의 식과 같다
  const trunks = trees.map((t) => ({ x: t.p[0], z: t.p[1], r: +(0.12 + t.h * 0.018).toFixed(2), h: +(t.sp === 'pine' ? t.h * 0.75 : t.h * 0.42).toFixed(1) }));

  // 관목(가을 화살나무·철쭉 단풍): 녹지 가장자리
  const shrubs: { p: P2; s: number; c: number }[] = [];
  for (const ring of gardenRings) for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i], [x1, z1] = ring[(i + 1) % ring.length], L = Math.hypot(x1 - x0, z1 - z0);
    for (let d = 0.8; d < L; d += 1.6) {
      const p: P2 = [x0 + ((x1 - x0) * d) / L, z0 + ((z1 - z0) * d) / L];
      if (inTreeRange(p) && !inBuilding(p, 0.6) && !onRoad(p, 0.3) && !anyRoad(p, 0.7) && !clear.some((c) => inside(p, c))) shrubs.push({ p, s: 0.55 + r() * 0.35, c: [0xa8322a, 0x8e2a22, 0x4a5a2a, 0xb84a2a, 0x5b6b30][(r() * 5) | 0] });
    }
  }
  for (const s of shrubs) plantings.push({ p: s.p, sp: s.c === 0x4a5a2a || s.c === 0x5b6b30 ? 'shrubGreen' : 'shrubRed', h: s.s * 2.1 });
  const planted = plantTrees(plantings, H, detail === 0, 77, tc, 100);
  group.add(planted.group);
  stats.leafCards = planted.cards;
  // 낙엽 카펫 · 풀 포기
  const greenIdx = polyIndex(gardenRings);
  group.add(groundCover(
    trees.filter((t) => t.sp !== 'pine').map((t) => ({ p: t.p, h: t.h })), H, leavesOn,
    detail === 0 ? null : {
      center: tc, radius: 115, count: 22000,
      isGrass: (p) => {
        const h = H(p[0], p[1]);
        const onHill = TR ? h > 0.15 && h < TR.top - 0.3 : false;
        if (!onHill && !greenIdx(p)) return false;
        return !inBuilding(p, 0.5) && !clear.some((c) => inside(p, c)) && !anyRoad(p, 0.5);
      },
    }, Y(0.1), 11));
  stats.shrubs = shrubs.length;

  // 6) 바깥 건물(OSM 140~350 m)
  const facades = [TEX.facade('#988f83', '#2f3b46', 11), TEX.facade('#767a7e', '#27323d', 12), TEX.facade('#a59a88', '#36424c', 13), TEX.facade('#857669', '#2a3540', 14)];
  const roof = new THREE.MeshStandardMaterial({ color: 0x7c7a76, roughness: 0.95 });
  const farLists: THREE.BufferGeometry[][] = facades.map(() => []);
  const farRoofs: THREE.BufferGeometry[] = [];
  for (const b of site.farBuildings ?? []) {
    try {
      const geo = new THREE.ExtrudeGeometry(new THREE.Shape(b.ring.map(([x, z]) => new THREE.Vector2(x, -z))), { depth: b.height, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const nonIdx = geo.index ? geo.toNonIndexed() : geo;
      // 그룹 0 = 윗·아랫면, 1 = 옆면 → 따로 나눈다
      const groups = geo.groups;
      for (const gr of groups) {
        const part = new THREE.BufferGeometry();
        for (const key of ['position', 'normal'] as const) {
          const a = nonIdx.attributes[key] as THREE.BufferAttribute;
          part.setAttribute(key, new THREE.BufferAttribute((a.array as Float32Array).slice(gr.start * 3, (gr.start + gr.count) * 3), 3));
        }
        (gr.materialIndex === 0 ? farRoofs : farLists[b.osmId % facades.length]).push(part);
      }
      geo.dispose(); if (nonIdx !== geo) nonIdx.dispose();
    } catch { /* skip */ }
  }
  const farMeshes: THREE.Mesh[] = [];
  farLists.forEach((list, i) => { const m = mergeTo(list, mat(facades[i], { roughness: 0.8 }), 1 / 4, `far-buildings-${i}`); if (m) { m.castShadow = true; farMeshes.push(m); group.add(m); } });
  const rm = mergeTo(farRoofs, roof, 1 / 8, 'far-roofs'); if (rm) { farMeshes.push(rm); group.add(rm); }
  stats.farBuildings = site.farBuildings?.length ?? 0;

  // 7) 원경
  if (opts.distant !== false) {
    const ns = namsan(site.origin, 31);
    group.add(ns);
    const peak = ns.children[0].position;
    group.add(cityFill(41, { x: peak.x, z: peak.z, r: 760 }));
  }
  DRAPE = null;
  return { group, trunks, shrubs: shrubs.map((s) => ({ x: s.p[0], z: s.p[1], r: +(s.s * 0.75).toFixed(2) })), farBuildings: farMeshes, stats };
}
