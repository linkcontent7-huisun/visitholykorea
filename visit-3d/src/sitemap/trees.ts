// v2 — 실사풍 가을 나무 (2026-11-09)
//
// v1 의 «울퉁불퉁한 공 + 잎 카드» 대신, 가지를 실제로 뻗어 자라게 한 나무를 만든다.
//   · 수종마다 줄기·가지 구조가 다르다: 단풍나무(낮게 퍼짐) · 느티나무(꽃병 모양으로 갈라짐)
//     · 은행나무(곧은 원뿔) · 벚나무(옆으로 누움) · 소나무(붉은 줄기가 휘고 위에 솔잎 층)
//   · 잎은 가지 끝마다 «잎 무리 카드» 를 붙인다. 카드에는 실제 잎 모양(손바닥 모양 단풍잎 ·
//     부채꼴 은행잎 · 톱니 달걀꼴 느티잎 · 솔잎 다발)을 하나하나 그렸다(캔버스 — 외부 그림 없음).
//   · 잎 법선을 «수관 중심에서 바깥» 으로 두어, 카드 한 장 한 장이 아니라 하나의 부드러운
//     덩어리로 빛을 받는다(안쪽은 어둡고 해 쪽 가장자리는 밝게 빛난다).
//   · 바람: 정점 셰이더에서 나무 전체가 천천히 흔들리고 잎은 잘게 떤다.
//   · 수종마다 모양 3가지를 미리 만들고 InstancedMesh 로 수백 그루를 그린다(그리기 호출 수 고정).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './cathedral.ts';

export type Species = 'ginkgo' | 'maple' | 'zelkova' | 'cherry' | 'pine' | 'shrubRed' | 'shrubGreen';
type P2 = [number, number];

/** 바람 시간(초) — main 의 그리기 고리에서 올린다 */
export const WIND = { time: { value: 0 } };
/** 카메라 가까이(이 거리 m 안)의 잎·가지는 점점이 지워 시야를 가리지 않게 한다 — 여는 장면에서는 크게 */
export const NEAR_FADE = { value: 1.6 };
/**
 * 가지 올리기(지하고, m) — 잎·가지의 가장 낮은 곳이 땅에서 이만큼은 떨어지게 한다.
 * 3인칭 카메라가 사람 뒤 5 m · 발 위 3 m 쯤에 있어, 그보다 낮은 잎은 사람 얼굴을 가린다(2026-11-17 사장님).
 */
export const BRANCH_CLEAR = { value: 4.0 };

// ── 잎 · 껍질 텍스처 ─────────────────────────────────────────────────────

type LeafKind = 'maple' | 'ginkgo' | 'ovate' | 'needle';
const LEAF_COLORS: Record<string, string[]> = {
  maple: ['#d42a1a', '#c01f14', '#e33c1c', '#ec5a1e', '#f27a22', '#f59a2a', '#b3180f', '#e8462a', '#f2b030'],
  ginkgo: ['#f7c812', '#f0b80e', '#fbd82e', '#eaa80a', '#f8cf1e', '#f2c03a', '#e6b81e'],
  zelkova: ['#d0702a', '#c05e22', '#e08a2e', '#b04f1c', '#e8a83c', '#c87a2a', '#a8822e', '#d9b040'],
  cherry: ['#b8331f', '#c7502a', '#a32a1e', '#d0702e', '#e09a3a', '#9a3a22'],
  pine: ['#2f4a26', '#3a5a2c', '#28401f', '#44622f', '#334f2a'],
  shrubRed: ['#c4261a', '#ae1e16', '#d43a20', '#9e1a12', '#e04a24', '#b8301c'],
  shrubGreen: ['#3f5a28', '#4a6a2c', '#36502a', '#58702e', '#6a7a32'],
};

function shade(hex: string, k: number) {
  const c = new THREE.Color(hex); c.multiplyScalar(k);
  return `#${c.getHexString()}`;
}

/** 잎 한 장 경로(원점 = 잎자루 끝, 잎은 -y 쪽으로 뻗는다) */
function leafPath(g: CanvasRenderingContext2D, kind: LeafKind, L: number, r: () => number) {
  g.beginPath();
  if (kind === 'maple') {
    // 손바닥 모양 5갈래 + 잔톱니
    const lobes = [0, -0.85, 0.85, -1.65, 1.65];
    const len = [1, 0.82, 0.82, 0.5, 0.5];
    const pts: [number, number][] = [];
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const a = -Math.PI + (i / N) * Math.PI * 2; // -π..π, 0 = 위(잎끝)
      let rr = 0.22;
      for (let k = 0; k < 5; k++) {
        const d = a - lobes[k];
        rr = Math.max(rr, len[k] * Math.exp(-(d * d) / 0.075));
      }
      rr *= 1 + (i % 3 === 0 ? 0.06 : 0); // 톱니
      if (Math.abs(a) > 2.6) rr = Math.min(rr, 0.18);
      pts.push([Math.sin(a) * rr * L, -Math.cos(a) * rr * L - L * 0.18]);
    }
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  } else if (kind === 'ginkgo') {
    // 부채꼴, 가운데 얕은 홈
    const R = L, a0 = -0.95, a1 = 0.95;
    g.moveTo(0, 0);
    g.lineTo(Math.sin(a0) * R * 0.25, -Math.cos(a0) * R * 0.25);
    for (let i = 0; i <= 40; i++) {
      const a = a0 + ((a1 - a0) * i) / 40;
      const notch = Math.abs(a) < 0.08 ? 0.82 : 1 - 0.04 * Math.sin(i * 1.7);
      g.lineTo(Math.sin(a) * R * notch, -Math.cos(a) * R * notch - L * 0.15);
    }
    g.closePath();
  } else if (kind === 'ovate') {
    // 달걀꼴 + 톱니 + 뾰족한 끝
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const y = -(1 - Math.cos(t)) * 0.5; // 0..-1
      let w = Math.sin(t) * 0.36 * Math.pow(1 + y, 0.35) * (1 - Math.pow(-y, 6) * 0.6);
      w *= 1 + (i % 2 ? 0.07 : 0);
      const px = w * L, py = y * L * 1.05;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
  }
  void r;
}

const texCache = new Map<string, THREE.CanvasTexture>();

/** 잎 무리 카드 — 잔가지 몇 개와 잎 수십 장. 바깥으로 갈수록 잎이 성기다 */
export function clusterTex(species: Species): THREE.CanvasTexture {
  const key = 'cluster:' + species;
  const hit = texCache.get(key); if (hit) return hit;
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!, r = rng(species.length * 131 + 7);
  const cols = LEAF_COLORS[species];
  const kind: LeafKind = species === 'maple' ? 'maple' : species === 'ginkgo' ? 'ginkgo' : species === 'pine' ? 'needle' : 'ovate';
  const cx = S / 2, cy = S / 2;

  if (kind === 'needle') {
    // 솔잎 다발: 잔가지 끝에서 사방으로 뻗는 가는 바늘
    for (let b = 0; b < 26; b++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * S * 0.3;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      const col = cols[(r() * cols.length) | 0];
      g.lineCap = 'round';
      for (let n = 0; n < 46; n++) {
        const na = r() * Math.PI * 2, nl = S * (0.06 + r() * 0.07);
        g.strokeStyle = shade(col, 0.75 + r() * 0.6);
        g.lineWidth = 1.4 + r() * 1.2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(na) * nl, y + Math.sin(na) * nl); g.stroke();
      }
    }
  } else {
    // 잔가지
    g.strokeStyle = '#4a3a2c'; g.lineCap = 'round';
    const twigs: [number, number, number][] = [];
    for (let t = 0; t < 5; t++) {
      const a = (t / 5) * Math.PI * 2 + r() * 0.8;
      const len = S * (0.22 + r() * 0.18);
      g.lineWidth = 3 + r() * 2;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); g.stroke();
      twigs.push([a, len, 0]);
    }
    const n = kind === 'maple' ? 64 : kind === 'ginkgo' ? 96 : 110;
    const leafLen = S * (kind === 'maple' ? 0.088 : kind === 'ginkgo' ? 0.056 : 0.06);
    // 안쪽(어두운) → 바깥쪽(밝은) 순서로 겹쳐 그린다
    const leaves: { x: number; y: number; a: number; d: number }[] = [];
    for (let i = 0; i < n; i++) {
      const tw = twigs[(r() * twigs.length) | 0];
      const along = 0.25 + r() * 0.85;
      const x0 = cx + Math.cos(tw[0]) * tw[1] * along + (r() - 0.5) * S * 0.08;
      const y0 = cy + Math.sin(tw[0]) * tw[1] * along + (r() - 0.5) * S * 0.08;
      const d = Math.hypot(x0 - cx, y0 - cy) / (S * 0.45);
      if (d > 1.02) continue;
      leaves.push({ x: x0, y: y0, a: tw[0] + Math.PI / 2 + (r() - 0.5) * 1.6, d });
    }
    leaves.sort((p, q) => p.d - q.d);
    for (const lf of leaves) {
      const base = cols[(r() * cols.length) | 0];
      const k = 0.62 + lf.d * 0.32 + r() * 0.18; // 안쪽 잎일수록 그늘
      const L = leafLen * (0.75 + r() * 0.5);
      g.save(); g.translate(lf.x, lf.y); g.rotate(lf.a);
      // 잎자루
      g.strokeStyle = shade(base, 0.55); g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -L * 0.2); g.stroke();
      // 잎몸: 가운데가 조금 밝은 그라데이션
      const grd = g.createRadialGradient(0, -L * 0.55, L * 0.05, 0, -L * 0.5, L * 0.9);
      grd.addColorStop(0, shade(base, k * 1.12));
      grd.addColorStop(1, shade(base, k * 0.8));
      g.fillStyle = grd;
      leafPath(g, kind, L, r);
      g.fill();
      // 잎맥
      g.strokeStyle = shade(base, k * 0.62); g.lineWidth = 1;
      g.globalAlpha = 0.55;
      if (kind === 'maple') {
        for (const la of [0, -0.85, 0.85, -1.65, 1.65]) { g.beginPath(); g.moveTo(0, -L * 0.18); g.lineTo(Math.sin(la) * L * 0.75, -Math.cos(la) * L * 0.75 - L * 0.18); g.stroke(); }
      } else if (kind === 'ginkgo') {
        for (let v = -4; v <= 4; v++) { const la = v * 0.21; g.beginPath(); g.moveTo(0, -L * 0.1); g.lineTo(Math.sin(la) * L * 0.95, -Math.cos(la) * L * 0.95 - L * 0.1); g.stroke(); }
      } else {
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -L * 1.0); g.stroke();
        for (let v = 1; v < 6; v++) for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(0, -L * v * 0.16); g.lineTo(sx * L * 0.28, -L * (v * 0.16 + 0.12)); g.stroke(); }
      }
      g.globalAlpha = 1;
      g.restore();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  texCache.set(key, t);
  return t;
}

/** 나무껍질 — 세로 골이 진 회갈색(소나무는 위쪽이 붉은 거북등) */
function barkTex(pine: boolean): THREE.CanvasTexture {
  const key = 'bark:' + pine;
  const hit = texCache.get(key); if (hit) return hit;
  const W = 256, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!, r = rng(pine ? 91 : 93);
  g.fillStyle = pine ? '#8a5638' : '#857a6e'; g.fillRect(0, 0, W, H);
  if (pine) {
    for (let i = 0; i < 260; i++) {
      const x = r() * W, y = r() * H, w = 14 + r() * 26, h = 20 + r() * 40;
      g.fillStyle = ['#8c5236', '#9a5e3c', '#6e3f2a', '#a8694a', '#5a3524'][(r() * 5) | 0];
      g.beginPath(); g.ellipse(x, y, w / 2, h / 2, (r() - 0.5) * 0.3, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(30,15,8,.55)'; g.lineWidth = 2;
    for (let i = 0; i < 60; i++) { g.beginPath(); const x = r() * W; g.moveTo(x, r() * H); g.lineTo(x + (r() - 0.5) * 20, r() * H); g.stroke(); }
  } else {
    for (let i = 0; i < 2400; i++) {
      const k = 70 + r() * 60;
      g.fillStyle = `rgba(${k | 0},${(k * 0.92) | 0},${(k * 0.82) | 0},.35)`;
      g.fillRect(r() * W, r() * H, 1 + r() * 3, 4 + r() * 16);
    }
    g.strokeStyle = 'rgba(25,20,16,.6)';
    for (let i = 0; i < 70; i++) {
      g.lineWidth = 1 + r() * 2.5;
      g.beginPath(); let x = r() * W, y = 0; g.moveTo(x, y);
      while (y < H) { y += 10 + r() * 20; x += (r() - 0.5) * 8; g.lineTo(x, y); }
      g.stroke();
    }
    // 이끼 얼룩
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(90,100,60,.18)'; g.beginPath(); g.arc(r() * W, r() * H, 6 + r() * 16, 0, Math.PI * 2); g.fill(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache.set(key, t);
  return t;
}

/** 땅에 떨어진 잎(여러 수종이 섞인 낙엽 한 줌) */
export function litterTex(): THREE.CanvasTexture {
  const hit = texCache.get('litter'); if (hit) return hit;
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!, r = rng(4242);
  const kinds: [LeafKind, string[]][] = [['maple', LEAF_COLORS.maple], ['ginkgo', LEAF_COLORS.ginkgo], ['ovate', LEAF_COLORS.zelkova]];
  for (let i = 0; i < 60; i++) {
    const [kind, cols] = kinds[(r() * 3) | 0];
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * S * 0.42;
    const L = S * (kind === 'maple' ? 0.08 : 0.06) * (0.7 + r() * 0.6);
    const base = cols[(r() * cols.length) | 0];
    g.save(); g.translate(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d); g.rotate(r() * 6.28);
    g.fillStyle = shade(base, 0.55 + r() * 0.35); // 떨어진 잎은 조금 바래고 어둡다
    leafPath(g, kind, L, r); g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set('litter', t);
  return t;
}

/** 가을 풀 한 포기(세로로 선 투명 카드) */
export function grassTex(): THREE.CanvasTexture {
  const hit = texCache.get('grass'); if (hit) return hit;
  const W = 256, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!, r = rng(5151);
  const cols = ['#6f7a34', '#7d8a3a', '#5f6a2c', '#8a8a3c', '#9c9442', '#a89a4a', '#56622a', '#b3a05a'];
  g.lineCap = 'round';
  for (let i = 0; i < 120; i++) {
    const x = W * (0.08 + r() * 0.84), h = H * (0.55 + r() * 0.35), bend = (r() - 0.5) * W * 0.1;
    const base = cols[(r() * cols.length) | 0];
    const grd = g.createLinearGradient(x, H, x + bend, H - h);
    grd.addColorStop(0, shade(base, 0.55)); grd.addColorStop(1, shade(base, 1.2));
    g.strokeStyle = grd;
    g.lineWidth = 1.2 + r() * 1.6;
    g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x + bend * 0.3, H - h * 0.6, x + bend, H - h); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set('grass', t);
  return t;
}

// ── 재질(바람 · 부피감 있는 잎 그늘) ───────────────────────────────────────

/** low = 이 모양에서 잎이 가장 낮게 내려오는 높이(키 1 기준). 0 이면 가지 올리기를 하지 않는다(관목 · 풀) */
function windPatch(m: THREE.MeshStandardMaterial, leaf: boolean, low = 0) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = WIND.time;
    sh.uniforms.uClear = BRANCH_CLEAR;
    sh.uniforms.uLow = { value: low };
    sh.uniforms.uNear = NEAR_FADE;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind;\nuniform float uClear;\nuniform float uLow;\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec3 org = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float ph = org.x * 0.13 + org.z * 0.11;
          // 가지 올리기: 나무마다 키가 달라(같은 모양을 늘여 쓴다) 여기서 그루별로 한다.
          // 줄기는 늘이고 수관 아래쪽만 위로 눌러 올린다 — 무릎(knee) 위는 그대로
          float sy = length((modelMatrix * instanceMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
          float cu = min(uClear / sy, 0.7);
          if (uLow > 0.0 && cu > uLow) {
            float knee = max(mix(uLow, 1.0, 0.5), cu + 0.12);
            float y0 = transformed.y;
            if (y0 < uLow) transformed.y = y0 > 0.0 ? y0 * cu / uLow : y0;
            else if (y0 < knee) transformed.y = cu + (y0 - uLow) * (knee - cu) / (knee - uLow);
          }
          float hh = max(transformed.y, 0.0);
          float sway = hh * hh;
          transformed.x += (sin(uWind * 0.9 + ph) * 0.010 + sin(uWind * 2.1 + ph * 1.7) * 0.004) * sway;
          transformed.z += (cos(uWind * 0.7 + ph * 1.3) * 0.008) * sway;
          ${leaf ? 'transformed += normal * sin(uWind * 5.0 + dot(position, vec3(37.0, 23.0, 29.0))) * 0.006 * hh;' : ''}
          vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNear;\nvarying vec3 vWPos;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        {
          float dd = distance(vWPos, cameraPosition);
          float keep = smoothstep(uNear * 0.55, uNear, dd);
          if (fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) > keep) discard;
        }`);
    if (leaf) {
      // 앞·뒷면 모두 «수관 바깥» 법선을 쓴다(뒷면에서 뒤집지 않는다) — 덩어리 전체가 한 번에 빛을 받는다
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>',
        THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0'));
    }
  };
  m.customProgramCacheKey = () => (leaf ? 'leaf-wind' : 'bark-wind');
}

// ── 나무 한 모양(가지 구조) 만들기 ────────────────────────────────────────

interface Shape {
  trunkH: number;      // 첫 갈라짐 높이(키 1 기준)
  trunkR: number;      // 밑동 반지름
  depth: number;       // 가지 단계
  kids: [number, number]; // 갈라지는 가지 수 범위
  spread: number;      // 가지 벌어짐(라디안)
  lenK: number;        // 아래 단계 대비 가지 길이
  up: number;          // 위로 휘는 정도(+) / 처지는 정도(-)
  leader: boolean;     // 원줄기가 끝까지 이어지는가(은행나무·소나무)
  cards: number;       // 가지 끝 하나에 붙는 잎 카드 수
  cardS: number;       // 카드 크기
  crownTop: number;    // 대략 수관 높이(그늘 계산용)
  pads?: boolean;      // 소나무 — 잎 카드를 수평 층으로
}

const SHAPES: Record<Species, Shape> = {
  maple:   { trunkH: 0.38, trunkR: 0.032, depth: 4, kids: [2, 4], spread: 0.85, lenK: 0.72, up: 0.15, leader: false, cards: 3, cardS: 0.29, crownTop: 1 },
  zelkova: { trunkH: 0.36, trunkR: 0.036, depth: 4, kids: [3, 4], spread: 0.55, lenK: 0.74, up: 0.35, leader: false, cards: 3, cardS: 0.27, crownTop: 1 },
  ginkgo:  { trunkH: 0.18, trunkR: 0.028, depth: 3, kids: [3, 5], spread: 1.05, lenK: 0.55, up: 0.25, leader: true, cards: 3, cardS: 0.24, crownTop: 1 },
  cherry:  { trunkH: 0.4, trunkR: 0.034, depth: 4, kids: [2, 3], spread: 0.9, lenK: 0.75, up: 0.08, leader: false, cards: 3, cardS: 0.27, crownTop: 0.9 },
  pine:    { trunkH: 0.55, trunkR: 0.03, depth: 3, kids: [2, 4], spread: 1.25, lenK: 0.6, up: 0.05, leader: true, cards: 3, cardS: 0.25, crownTop: 1, pads: true },
  shrubRed:   { trunkH: 0.05, trunkR: 0.03, depth: 3, kids: [3, 5], spread: 0.9, lenK: 0.7, up: 0.4, leader: false, cards: 3, cardS: 0.5, crownTop: 1 },
  shrubGreen: { trunkH: 0.05, trunkR: 0.03, depth: 3, kids: [3, 5], spread: 0.9, lenK: 0.7, up: 0.4, leader: false, cards: 3, cardS: 0.5, crownTop: 1 },
};

const Y_UP = new THREE.Vector3(0, 1, 0);

function buildShape(sp: Species, seed: number, lowDetail: boolean) {
  const S = SHAPES[sp], r = rng(seed);
  const bark: THREE.BufferGeometry[] = [];
  const tips: { p: THREE.Vector3; d: THREE.Vector3; s: number }[] = [];
  const radial = lowDetail ? 4 : 6;
  // 가지가 이 높이(키 1 기준) 아래로는 처지지 않는다 — 소나무 가지가 땅까지 늘어져 사람을 가렸다(2026-11-17).
  // 원줄기가 이어지는 나무는 맨 아래 가지가 나오는 높이, 나머지는 첫 갈라짐 조금 아래. 관목은 그대로 둔다
  const floorY = sp.startsWith('shrub') ? -1 : S.leader ? 0.2 : S.trunkH * 0.8;

  const seg = (a: THREE.Vector3, b: THREE.Vector3, ra: number, rb: number, rad: number) => {
    const d = b.clone().sub(a), L = d.length();
    if (L < 1e-4) return;
    const geo = new THREE.CylinderGeometry(rb, ra, L, rad, 1, true);
    // 껍질 무늬가 가지 둘레·길이에 맞게(키 1 = 텍스처 6바퀴)
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, ra * 60), uv.getY(i) * L * 6);
    geo.translate(0, L / 2, 0);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y_UP, d.normalize()));
    geo.translate(a.x, a.y, a.z);
    bark.push(geo);
  };

  /** 한 가지: 3마디로 나눠 조금씩 휘게 그린다 */
  const branch = (p0: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, level: number) => {
    let p = p0.clone(), d = dir.clone();
    const parts = level === 0 ? 4 : 3;
    const rEnd = rad * (level === S.depth ? 0.35 : 0.62);
    for (let i = 0; i < parts; i++) {
      const ra = rad + ((rEnd - rad) * i) / parts, rb = rad + ((rEnd - rad) * (i + 1)) / parts;
      // 굽음: 무작위 + 위로(또는 아래로) 휘는 성질
      d.add(new THREE.Vector3((r() - 0.5) * 0.35, S.up * 0.25 + (r() - 0.5) * 0.15, (r() - 0.5) * 0.35)).normalize();
      if (sp === 'pine' && level === 0) d.add(new THREE.Vector3(Math.sin(seed) * 0.12, 0, Math.cos(seed) * 0.12)).normalize(); // 소나무 줄기는 한쪽으로 휜다
      const q = p.clone().addScaledVector(d, len / parts);
      if (level >= 1 && q.y < floorY) { q.y = floorY; d.y = Math.max(d.y, 0.05); d.normalize(); }
      // 가볍게(먼 나무 · 모바일): 잎에 가려 안 보이는 잔가지는 껍질을 그리지 않는다(잎 자리는 그대로).
      // 관목은 2단계부터, 큰 나무는 맨 끝 단계만 뺀다 — 2026-11-13 측정: 껍질이 삼각형의 절반 이상이었다
      if (!(lowDetail && level >= (sp.startsWith('shrub') ? 2 : S.depth))) seg(p, q, ra, rb, level >= 2 ? (lowDetail ? 3 : 4) : radial);
      p = q;
      // 잎이 달리는 높은 단계 가지에는 중간에도 잎을 단다
      if (level >= S.depth - 1 && i > 0 && r() < 0.3) tips.push({ p: p.clone(), d: d.clone(), s: 0.8 });
    }
    if (level >= S.depth) { tips.push({ p, d, s: 1 }); return; }
    const nk = S.kids[0] + Math.floor(r() * (S.kids[1] - S.kids[0] + 1));
    const base = r() * Math.PI * 2;
    for (let k = 0; k < nk; k++) {
      const az = base + (k / nk) * Math.PI * 2 + (r() - 0.5) * 0.6;
      const tilt = S.spread * (0.7 + r() * 0.5) * (level === 0 && S.leader ? 1.15 : 1);
      // 부모 방향 기준으로 tilt 만큼 벌린다
      const side = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
      const nd = d.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).normalize();
      const nl = len * S.lenK * (0.8 + r() * 0.4) * (level === 0 ? 1.2 : 1);
      // 원줄기가 이어지는 나무는 가지가 줄기 여러 높이에서 나온다
      const from = S.leader && level === 0 ? p0.clone().lerp(p, 0.35 + (k / nk) * 0.6) : p.clone();
      branch(from, nd, nl * (S.leader && level === 0 ? 1 - (k / nk) * 0.55 : 1), rEnd * (S.leader && level === 0 ? 0.55 : 0.85), level + 1);
    }
    if (S.leader && level === 0) {
      // 원줄기 꼭대기
      branch(p, new THREE.Vector3(0, 1, 0), len * 0.45, rEnd * 0.7, level + 1);
    }
  };

  const trunkLen = S.trunkH + (sp === 'pine' ? 0.15 : 0.05);
  branch(new THREE.Vector3(0, -0.05, 0), new THREE.Vector3((r() - 0.5) * 0.1, 1, (r() - 0.5) * 0.1).normalize(),
    S.leader ? (sp === 'pine' ? 0.78 : 0.7) : trunkLen, S.trunkR, 0);

  const barkGeo = mergeGeometries(bark, false)!;
  bark.forEach((g) => g.dispose());

  // ── 잎 카드 ──
  // 수관 중심(그늘·법선 기준)
  const ctr = new THREE.Vector3();
  tips.forEach((t) => ctr.add(t.p));
  ctr.divideScalar(Math.max(1, tips.length));
  let maxD = 0.001;
  tips.forEach((t) => (maxD = Math.max(maxD, t.p.distanceTo(ctr))));

  const per = lowDetail ? Math.max(1, Math.round(S.cards * 0.4)) : S.cards;
  const pos: number[] = [], nor: number[] = [], uvs: number[] = [], col: number[] = [];
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), n = new THREE.Vector3();
  const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  const cuv = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
  for (const t of tips) {
    const k = Math.round(per * t.s);
    for (let i = 0; i < k; i++) {
      const c = t.p.clone().add(new THREE.Vector3((r() - 0.5), (r() - 0.35), (r() - 0.5)).multiplyScalar(S.cardS * 0.9));
      c.y = Math.max(c.y, floorY);
      const out = c.clone().sub(ctr);
      const dist = out.length() / maxD;
      out.normalize();
      // 카드 방향: 소나무는 거의 수평 층, 나머지는 바깥을 향하되 마구 기울인다
      if (S.pads) e.set(-Math.PI / 2 + (r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5, 'YXZ');
      else e.set((r() - 0.5) * 2.4, r() * 6.28, (r() - 0.5) * 2.4);
      q.setFromEuler(e);
      const s = S.cardS * (0.75 + r() * 0.5);
      // 그늘: 안쪽·아래쪽은 어둡게(빛이 덜 든다)
      const below = THREE.MathUtils.clamp((c.y - ctr.y) / (maxD * 1.2) + 0.5, 0, 1);
      const ao = THREE.MathUtils.clamp(0.42 + 0.4 * dist + 0.25 * below, 0.35, 1.08);
      const hue = 0.92 + r() * 0.16;
      // 법선 = 수관 바깥 쪽(위쪽으로 조금)
      n.copy(out).addScaledVector(Y_UP, 0.35).normalize();
      for (let j = 0; j < 6; j++) {
        v.set(corners[j][0] * s, corners[j][1] * s, 0).applyQuaternion(q).add(c);
        pos.push(v.x, v.y, v.z);
        nor.push(n.x, n.y, n.z);
        uvs.push(cuv[j][0], cuv[j][1]);
        col.push(ao * hue, ao, ao * (2 - hue));
      }
    }
  }
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  leafGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  leafGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  leafGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  leafGeo.computeBoundingSphere();
  let low = Infinity;
  for (let i = 1; i < pos.length; i += 3) low = Math.min(low, pos[i]);
  return { barkGeo, leafGeo, cards: pos.length / 18, low: Number.isFinite(low) && low > 0.05 ? low : 0 };
}

// ── 심기 ──────────────────────────────────────────────────────────────────

export interface Planting { p: P2; sp: Species; h: number }

const VARIANTS = 2;

/**
 * 나무 · 관목 무리를 만든다. H = 땅 높이 함수. 반환 group 안의 InstancedMesh 수 = 수종 × 3 모양 × 2(껍질 · 잎).
 * castShadow 는 부르는 쪽이 정한다(높은 화질이면 켠다).
 */
export function plantTrees(list: Planting[], H: (x: number, z: number) => number, lowDetail: boolean, seed = 7,
  center: P2 = [0, 0], nearR = 75, cell = 130): { group: THREE.Group; cards: number } {
  const group = new THREE.Group();
  group.name = 'trees-v2';
  const r = rng(seed);
  // 묶음 = 수종 · 모양 · 상세도(가까움/멂) · 50 m 칸. 칸으로 나눠야 화면·그림자 밖 칸을 통째로 건너뛴다
  const bySp = new Map<string, Planting[]>();
  list.forEach((t, i) => {
    const far = lowDetail || Math.hypot(t.p[0] - center[0], t.p[1] - center[1]) > nearR ? 1 : 0;
    const key = `${t.sp}:${i % VARIANTS}:${far}:${Math.floor(t.p[0] / cell)},${Math.floor(t.p[1] / cell)}`;
    (bySp.get(key) ?? bySp.set(key, []).get(key)!).push(t);
  });
  const shapes = new Map<string, ReturnType<typeof buildShape>>();
  // 재질은 모양(수종 · 변형 · 상세도)마다 하나 — 가지 올리기 기준(low)이 모양마다 달라서다. 셰이더 프로그램은 함께 쓴다
  const barkMats = new Map<string, THREE.MeshStandardMaterial>();
  const barkMat = (sk: string, pine: boolean, low: number) => {
    let m = barkMats.get(sk);
    if (!m) { m = new THREE.MeshStandardMaterial({ map: barkTex(pine), roughness: 0.95 }); windPatch(m, false, low); barkMats.set(sk, m); }
    return m;
  };
  const leafMats = new Map<string, THREE.MeshStandardMaterial>();
  const leafMat = (sk: string, sp: Species, low: number) => {
    let m = leafMats.get(sk);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        map: clusterTex(sp), alphaTest: 0.5, side: THREE.DoubleSide, vertexColors: true,
        roughness: 0.78, metalness: 0,
        // 햇빛이 잎을 비쳐 나오는 느낌(아주 약하게 스스로 밝다)
        emissive: new THREE.Color(sp === 'pine' || sp === 'shrubGreen' ? 0x0c1408 : sp === 'ginkgo' ? 0x4a3604 : 0x461004),
      });
      windPatch(m, true, low);
      leafMats.set(sk, m);
    }
    return m;
  };

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), c = new THREE.Color();
  let cards = 0;
  for (const [key, trees] of bySp) {
    const [sp, vi, far] = key.split(':') as [Species, string, string];
    const sk = `${sp}:${vi}:${far}`;
    let shape = shapes.get(sk);
    if (!shape) { shape = buildShape(sp, seed * 97 + sp.length * 31 + Number(vi) * 1013, far === '1'); shapes.set(sk, shape); }
    const low = sp.startsWith('shrub') ? 0 : shape.low; // 관목은 원래 낮다 — 올리지 않는다
    const barkI = new THREE.InstancedMesh(shape.barkGeo, barkMat(sk, sp === 'pine', low), trees.length);
    const leafI = new THREE.InstancedMesh(shape.leafGeo, leafMat(sk, sp, low), trees.length);
    trees.forEach((t, i) => {
      const w = 0.9 + r() * 0.25;
      m4.compose(ps.set(t.p[0], H(t.p[0], t.p[1]) - 0.05, t.p[1]), q.setFromAxisAngle(Y_UP, r() * Math.PI * 2), sc.set(t.h * w, t.h, t.h * w * (0.9 + r() * 0.2)));
      barkI.setMatrixAt(i, m4);
      leafI.setMatrixAt(i, m4);
      leafI.setColorAt(i, c.setRGB(1, 1, 1).offsetHSL((r() - 0.5) * 0.035, 0.2, (r() - 0.5) * 0.08));
    });
    barkI.name = `bark-${key}`; leafI.name = `leaves-${key}`;
    barkI.receiveShadow = true; leafI.receiveShadow = true;
    barkI.computeBoundingSphere(); leafI.computeBoundingSphere();
    group.add(barkI, leafI);
    cards += shape.cards * trees.length;
  }
  return { group, cards };
}

/** 낙엽 카펫 + 풀 포기. spots 는 낙엽을 뿌릴 중심들(나무 밑동), grassAt 는 풀을 심을 자리인지 */
export function groundCover(
  trunks: { p: P2; h: number }[], H: (x: number, z: number) => number, ok: (p: P2) => boolean,
  grass: { center: P2; radius: number; count: number; isGrass: (p: P2) => boolean } | null, lift: number, seed = 11,
): THREE.Group {
  const group = new THREE.Group(); group.name = 'ground-cover';
  const r = rng(seed);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), c = new THREE.Color();
  // 낙엽 — 나무마다 수관 아래에 몇 줌
  const spots: { x: number; y: number; z: number; s: number; a: number }[] = [];
  for (const t of trunks) {
    const n = 8 + ((r() * 6) | 0);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * t.h * 0.5;
      const p: P2 = [t.p[0] + Math.cos(a) * d, t.p[1] + Math.sin(a) * d];
      if (!ok(p)) continue;
      spots.push({ x: p[0], y: H(p[0], p[1]) + lift + r() * 0.01, z: p[1], s: 1.2 + r() * 1.4, a: r() * 6.28 });
    }
  }
  const litterOnGrass: typeof spots | null = spots;
  // 풀 포기 — 두 장을 엇갈려 세운다
  if (grass && grass.count > 0) {
    const two = mergeGeometries([
      new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0),
      new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0).rotateY(Math.PI / 2),
    ])!;
    // 풀 법선은 위로(잔디처럼 고르게 빛을 받는다)
    const nrm = two.attributes.normal as THREE.BufferAttribute;
    for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
    const gm = new THREE.MeshStandardMaterial({ map: grassTex(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.95 });
    windPatch(gm, false);
    const pts: P2[] = [];
    for (let tries = 0; tries < grass.count * 4 && pts.length < grass.count; tries++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * grass.radius;
      const p: P2 = [grass.center[0] + Math.cos(a) * d, grass.center[1] + Math.sin(a) * d];
      if (grass.isGrass(p)) pts.push(p);
    }
    if (litterOnGrass) for (let i = 0; i < pts.length; i += 14) {
      const p = pts[i];
      litterOnGrass.push({ x: p[0], y: H(p[0], p[1]) + lift + r() * 0.01, z: p[1], s: 0.5 + r() * 0.8, a: r() * 6.28 });
    }
    const gi = new THREE.InstancedMesh(two, gm, Math.max(1, pts.length));
    pts.forEach((p, i) => {
      const s = 0.08 + r() * r() * 0.1;
      m4.compose(ps.set(p[0], H(p[0], p[1]) + lift - 0.02, p[1]), q.setFromAxisAngle(Y_UP, r() * 6.28), sc.set(s * 2.6, s, s * 2.6));
      gi.setMatrixAt(i, m4);
      gi.setColorAt(i, c.setScalar(0.8 + r() * 0.3));
    });
    gi.count = pts.length;
    gi.receiveShadow = true; gi.name = 'grass-tufts';
    gi.computeBoundingSphere();
    group.add(gi);
  }
  if (spots.length) {
    const lit = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: litterTex(), alphaTest: 0.5, roughness: 0.95, side: THREE.DoubleSide }), spots.length);
    spots.forEach((s, i) => {
      m4.compose(ps.set(s.x, s.y, s.z), q.setFromAxisAngle(Y_UP, s.a), sc.setScalar(s.s));
      lit.setMatrixAt(i, m4);
      lit.setColorAt(i, c.setScalar(0.85 + r() * 0.2));
    });
    lit.receiveShadow = true; lit.name = 'litter';
    lit.computeBoundingSphere();
    group.add(lit);
  }
  return group;
}
