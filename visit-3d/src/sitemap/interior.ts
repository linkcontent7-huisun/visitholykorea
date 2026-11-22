// 명동대성당 본당 실내 — 시각 모델(충돌·상호작용 없음)
//
// 좌표: cathedral.ts 의 dims 와 같은 지역 좌표(x = 길이축·정면 -x → 제대 +x, z = 폭, y = 위).
// 실내 치수는 걷는 공간(src/spaces/cathedral.ts, cody-2d)과 같은 «외피 0.3 m 안쪽» 규칙을 따른다:
//   바닥 0.6 · 신랑 반폭 5.7 · 측랑 벽 안쪽 면 = 측랑 바깥 반폭 - 0.58 · 볼트 기점 14.2 / 꼭대기 19.9 · 측랑 천장 8.6
//   · 익랑 볼트 꼭대기 18.6 · 후진 r = rIn - 0.5 · 회랑 벽 r = rOut - 0.67 · 성소 단 1.2
// 구성은 가톨릭 성당의 일반 배치에, 공개 자료로 확인한 명동대성당의 요소를 더한 재구성이다:
//   리브 볼트 · 제대를 둘러싼 14사도화(장발, 1926) · 청동 «십자가의 길» · 묵주기도 15단·성탄·12사도 주제의 창.
// 실제 그림·창 도안·성물을 옮기지 않았다(인물은 양식화한 실루엣, 창은 기하 문양 + 메달리온).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng, worldUV, type CathedralDims } from './cathedral.ts';

type K =
  | 'floor' | 'sanct' | 'stone' | 'dressed' | 'plaster' | 'wood' | 'darkwood' | 'marble' | 'gold' | 'pipe'
  | 'white' | 'cloth' | 'blue' | 'red' | 'kneel' | 'skin' | 'iron' | 'bronze' | 'leaf' | 'flowerY' | 'flowerW' | 'flowerR';

export interface Interior {
  group: THREE.Group;
  /** 실내 조명(점광원·창빛) — 실내를 볼 때만 켠다 */
  lights: THREE.Group;
  /** 볼륨 빛줄기·바닥 빛 — 후처리(AO)의 깊이 계산에서 빼야 한다 */
  sunlight: THREE.Group;
  /** 카메라 구도(지역 좌표) */
  views: Record<string, { pos: THREE.Vector3; target: THREE.Vector3 }>;
  /** 해 방향(지역 좌표, 해를 향함)으로 창빛 줄기와 바닥의 색 빛을 만든다 */
  setSun(dirLocal: THREE.Vector3): void;
  /** 실내 반사(환경광) 캡처 위치(지역 좌표) */
  probe: THREE.Vector3;
}

// ── 텍스처 ─────────────────────────────────────────────────────────────

function paint(w: number, h: number, seed: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d', { willReadFrequently: true })!, rng(seed)); // 빠른 입장(2026-11-22): 아래에서 다시 읽는다
  return c;
}
function tex(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
/** 높이(회색조) 캔버스 → 접선공간 법선맵 */
function normalOf(hc: HTMLCanvasElement, s: number) {
  const W = hc.width, H = hc.height, src = hc.getContext('2d')!.getImageData(0, 0, W, H).data;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const og = out.getContext('2d')!, id = og.createImageData(W, H), d = id.data;
  const h = (x: number, y: number) => src[(((y + H) % H) * W + ((x + W) % W)) * 4] / 255;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = -(h(x + 1, y) - h(x - 1, y)) * s, ny = (h(x, y + 1) - h(x, y - 1)) * s, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4;
    d[i] = ((nx / l) * 0.5 + 0.5) * 255; d[i + 1] = ((ny / l) * 0.5 + 0.5) * 255; d[i + 2] = ((1 / l) * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  og.putImageData(id, 0, 0);
  return tex(out, false);
}
function speckle(g: CanvasRenderingContext2D, r: () => number, W: number, H: number, n: number, a: number, sz = 2) {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 1.2})`; g.fillRect(r() * W, r() * H, sz, sz); }
}
function blotch(g: CanvasRenderingContext2D, r: () => number, W: number, H: number, n: number, rgb: string, a: number) {
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, R = 20 + r() * 90, gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2);
  }
}

/** 마름돌 벽: 색 + 높이(줄눈 오목) */
function ashlar() {
  const S = 512, rows = 8, cols = 4, bw = S / cols, bh = S / rows;
  const tone: number[] = [];
  const map = paint(S, S, 53, (g, r) => {
    g.fillStyle = '#d3ccbf'; g.fillRect(0, 0, S, S);
    for (let y = 0; y < rows; y++) for (let x = -1; x < cols; x++) {
      const k = 170 + r() * 26, o = (y % 2) * bw * 0.5; tone.push(k);
      g.fillStyle = `rgb(${k | 0},${(k - 5) | 0},${(k - 14) | 0})`; g.fillRect(x * bw + o + 2, y * bh + 2, bw - 4, bh - 4);
    }
    blotch(g, r, S, S, 40, '90,80,65', 0.06); speckle(g, r, S, S, 14000, 0.05);
  });
  const hgt = paint(S, S, 53, (g, r) => {
    g.fillStyle = '#404040'; g.fillRect(0, 0, S, S);
    for (let y = 0; y < rows; y++) for (let x = -1; x < cols; x++) {
      const o = (y % 2) * bw * 0.5; g.fillStyle = '#b0b0b0'; g.fillRect(x * bw + o + 3, y * bh + 3, bw - 6, bh - 6);
      g.fillStyle = '#c8c8c8'; g.fillRect(x * bw + o + 6, y * bh + 6, bw - 12, bh - 12);
    }
    speckle(g, r, S, S, 9000, 0.12, 2);
  });
  return { map: tex(map), normalMap: normalOf(hgt, 2.2) };
}
function dressedStone() {
  const S = 256;
  const map = paint(S, S, 61, (g, r) => { g.fillStyle = '#cbc3b4'; g.fillRect(0, 0, S, S); blotch(g, r, S, S, 24, '120,105,85', 0.07); speckle(g, r, S, S, 6000, 0.04); });
  const hgt = paint(S, S, 62, (g, r) => { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); speckle(g, r, S, S, 9000, 0.1, 2); });
  return { map: tex(map), normalMap: normalOf(hgt, 1.2) };
}
function plasterTex() {
  const S = 512;
  const map = paint(S, S, 52, (g, r) => { g.fillStyle = '#ebe2cf'; g.fillRect(0, 0, S, S); blotch(g, r, S, S, 60, '150,130,100', 0.045); blotch(g, r, S, S, 30, '255,250,240', 0.06); speckle(g, r, S, S, 12000, 0.025, 3); });
  const hgt = paint(S, S, 55, (g, r) => { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); speckle(g, r, S, S, 16000, 0.06, 3); });
  return { map: tex(map), normalMap: normalOf(hgt, 1.0) };
}
function veins(g: CanvasRenderingContext2D, r: () => number, x: number, y: number, w: number, h: number, n: number, a: number) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  for (let v = 0; v < n; v++) {
    g.strokeStyle = `rgba(70,62,55,${a * (0.4 + r())})`; g.lineWidth = 0.6 + r() * 1.2; g.beginPath();
    let px = x + r() * w, py = y + r() * h; g.moveTo(px, py);
    for (let s = 0; s < 6; s++) { px += (r() - 0.3) * w * 0.4; py += (r() - 0.5) * h * 0.4; g.lineTo(px, py); }
    g.stroke();
  }
  g.restore();
}
/** 신랑 바닥: 60 cm 대리석(미색·회색 바둑판, 결) */
function floorTex() {
  const S = 512, n = 8, b = S / n;
  const map = paint(S, S, 51, (g, r) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const light = (x + y) % 2 === 0, k = (light ? 214 : 146) + r() * 10;
      g.fillStyle = light ? `rgb(${k | 0},${(k - 6) | 0},${(k - 18) | 0})` : `rgb(${(k - 4) | 0},${k | 0},${(k - 6) | 0})`; g.fillRect(x * b, y * b, b, b);
      veins(g, r, x * b, y * b, b, b, 4, light ? 0.18 : 0.25);
    }
    g.strokeStyle = 'rgba(55,50,45,.55)'; g.lineWidth = 1.2;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * b, 0); g.lineTo(i * b, S); g.stroke(); g.beginPath(); g.moveTo(0, i * b); g.lineTo(S, i * b); g.stroke(); }
  });
  const hgt = paint(S, S, 51, (g) => { g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, S, S); g.strokeStyle = '#303030'; g.lineWidth = 2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * b, 0); g.lineTo(i * b, S); g.stroke(); g.beginPath(); g.moveTo(0, i * b); g.lineTo(S, i * b); g.stroke(); } });
  return { map: tex(map), normalMap: normalOf(hgt, 1.5) };
}
/** 성소 바닥: 흰 대리석 큰 판 + 붉은 띠 */
function sanctTex() {
  const S = 512, n = 4, b = S / n;
  const map = paint(S, S, 57, (g, r) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = 232 + r() * 10; g.fillStyle = `rgb(${k | 0},${(k - 3) | 0},${(k - 8) | 0})`; g.fillRect(x * b, y * b, b, b); veins(g, r, x * b, y * b, b, b, 7, 0.16); }
    g.strokeStyle = 'rgba(120,40,35,.75)'; g.lineWidth = 6;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * b, 0); g.lineTo(i * b, S); g.stroke(); g.beginPath(); g.moveTo(0, i * b); g.lineTo(S, i * b); g.stroke(); }
  });
  return { map: tex(map) };
}
function marbleTex() {
  const S = 512;
  const map = paint(S, S, 58, (g, r) => { g.fillStyle = '#efebe3'; g.fillRect(0, 0, S, S); blotch(g, r, S, S, 30, '180,170,155', 0.08); veins(g, r, 0, 0, S, S, 22, 0.14); });
  return { map: tex(map) };
}
function woodTex(base: [number, number, number], seed: number) {
  const S = 512;
  const map = paint(S, S, seed, (g, r) => {
    g.fillStyle = `rgb(${base.join(',')})`; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 260; i++) {
      const y = r() * S, a = 0.05 + r() * 0.12, amp = 2 + r() * 6, f = 0.004 + r() * 0.01, ph = r() * 6;
      g.strokeStyle = r() < 0.7 ? `rgba(30,15,5,${a})` : `rgba(255,220,170,${a * 0.6})`; g.lineWidth = 0.6 + r() * 1.6; g.beginPath();
      for (let x = 0; x <= S; x += 8) { const yy = y + Math.sin(x * f + ph) * amp; x === 0 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
      g.stroke();
    }
  });
  const hgt = paint(S, S, seed + 1, (g, r) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 200; i++) { const y = r() * S; g.strokeStyle = `rgba(0,0,0,${0.1 + r() * 0.15})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (r() - 0.5) * 6); g.stroke(); }
  });
  return { map: tex(map), normalMap: normalOf(hgt, 0.9) };
}

const JEWEL = ['#1c46b0', '#a8102a', '#d6a21a', '#1d7a3c', '#5e2a8c', '#173a9e', '#c2571a', '#2689b0', '#8c1c4a'];

/** 스테인드글라스(세로 1:2): 테두리 띠 · 마름모 격자 바탕 · 메달리온 3개(양식화한 인물) */
function glassCanvas(seed: number, figure: 'standing' | 'medallion' | 'pattern') {
  return paint(256, 512, seed, (g, r) => {
    const W = 256, H = 512, cool = r() < 0.6;
    g.fillStyle = '#0d0b0a'; g.fillRect(0, 0, W, H);
    // 바탕: 마름모 격자
    const cell = 28;
    for (let y = -1; y < H / cell + 1; y++) for (let x = -1; x < W / cell + 1; x++) {
      const cx = x * cell + (y % 2 ? cell / 2 : 0), cy = y * cell * 0.9;
      g.fillStyle = cool ? (r() < 0.75 ? JEWEL[r() < 0.5 ? 0 : 5] : JEWEL[1]) : (r() < 0.75 ? JEWEL[1] : JEWEL[0]);
      g.globalAlpha = 0.72 + r() * 0.28;
      g.beginPath(); g.moveTo(cx, cy - cell * 0.42); g.lineTo(cx + cell * 0.45, cy); g.lineTo(cx, cy + cell * 0.42); g.lineTo(cx - cell * 0.45, cy); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
    // 테두리 띠(흰·황금 작은 조각)
    for (let y = 0; y < H; y += 14) for (const x of [0, W - 16]) { g.fillStyle = y % 28 ? '#e8dcb0' : JEWEL[2]; g.fillRect(x + 2, y + 2, 12, 10); }
    for (let x = 0; x < W; x += 14) for (const y of [0, H - 14]) { g.fillStyle = x % 28 ? '#e8dcb0' : JEWEL[2]; g.fillRect(x + 2, y + 2, 10, 10); }
    // 메달리온
    const meds = figure === 'standing' ? [[128, 250, 92]] : [[128, 104, 62], [128, 256, 62], [128, 408, 62]];
    for (const [cx, cy, R] of meds) {
      g.fillStyle = '#0d0b0a'; g.beginPath(); g.arc(cx, cy, R + 6, 0, 7); g.fill();
      g.fillStyle = JEWEL[2]; g.beginPath(); g.arc(cx, cy, R + 3, 0, 7); g.fill();
      g.fillStyle = cool ? JEWEL[1] : JEWEL[0]; g.beginPath(); g.arc(cx, cy, R - 2, 0, 7); g.fill();
      if (figure === 'pattern') {
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.fillStyle = JEWEL[(k + 3) % JEWEL.length]; g.beginPath(); g.ellipse(cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5, R * 0.3, R * 0.14, a, 0, 7); g.fill(); }
        g.fillStyle = '#f1df8a'; g.beginPath(); g.arc(cx, cy, R * 0.2, 0, 7); g.fill();
      } else {
        // 양식화한 인물: 광륜 · 얼굴 · 옷(두 겹) · 땅
        const s = R / 62;
        g.fillStyle = '#2d6b2a'; g.fillRect(cx - R, cy + 40 * s, R * 2, R);
        g.fillStyle = JEWEL[2 + ((r() * 3) | 0)];
        g.beginPath(); g.moveTo(cx - 10 * s, cy - 18 * s); g.lineTo(cx + 10 * s, cy - 18 * s); g.lineTo(cx + 24 * s, cy + 50 * s); g.lineTo(cx - 24 * s, cy + 50 * s); g.closePath(); g.fill();
        g.fillStyle = r() < 0.5 ? '#f2efe6' : JEWEL[6];
        g.beginPath(); g.moveTo(cx - 12 * s, cy - 16 * s); g.lineTo(cx + 2 * s, cy - 14 * s); g.lineTo(cx - 4 * s, cy + 46 * s); g.lineTo(cx - 22 * s, cy + 48 * s); g.closePath(); g.fill();
        g.fillStyle = '#e9c341'; g.beginPath(); g.arc(cx, cy - 30 * s, 16 * s, 0, 7); g.fill();
        g.fillStyle = '#f0d2b0'; g.beginPath(); g.arc(cx, cy - 29 * s, 9 * s, 0, 7); g.fill();
        g.strokeStyle = '#0d0b0a'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy - 29 * s, 9 * s, 0, 7); g.stroke();
        g.beginPath(); g.moveTo(cx - 24 * s, cy + 50 * s); g.lineTo(cx - 10 * s, cy - 18 * s); g.lineTo(cx + 10 * s, cy - 18 * s); g.lineTo(cx + 24 * s, cy + 50 * s); g.stroke();
      }
      g.strokeStyle = '#0d0b0a'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R - 2, 0, 7); g.stroke();
    }
    // 납선 결(가는 선)
    g.strokeStyle = 'rgba(10,8,6,.55)'; g.lineWidth = 1;
    for (let i = 0; i < 60; i++) { g.beginPath(); const x = r() * W, y = r() * H; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 40); g.stroke(); }
    // 유리 얼룩(색 깊이)
    blotch(g, r, W, H, 40, '0,0,0', 0.12); blotch(g, r, W, H, 25, '255,255,230', 0.08);
  });
}

function roseCanvas(seed: number) {
  return paint(512, 512, seed, (g, r) => {
    g.fillStyle = '#0d0b0a'; g.fillRect(0, 0, 512, 512);
    const C = 256;
    // 바깥 12 꽃잎
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.save(); g.translate(C, C); g.rotate(a);
      g.fillStyle = JEWEL[k % 2 ? 0 : 1]; g.beginPath(); g.ellipse(0, -170, 36, 78, 0, 0, 7); g.fill();
      g.fillStyle = JEWEL[2]; g.beginPath(); g.arc(0, -214, 16, 0, 7); g.fill();
      g.fillStyle = JEWEL[3]; g.beginPath(); g.arc(0, -150, 14, 0, 7); g.fill();
      g.restore();
    }
    for (let k = 0; k < 12; k++) {
      const a = ((k + 0.5) / 12) * Math.PI * 2; g.fillStyle = JEWEL[(k + 4) % JEWEL.length];
      g.beginPath(); g.arc(C + Math.cos(a) * 225, C + Math.sin(a) * 225, 18, 0, 7); g.fill();
    }
    g.fillStyle = '#0d0b0a'; g.beginPath(); g.arc(C, C, 104, 0, 7); g.fill();
    for (let k = 0; k < 8; k++) { const a0 = (k / 8) * Math.PI * 2; g.fillStyle = JEWEL[k % 2 ? 5 : 6]; g.beginPath(); g.moveTo(C, C); g.arc(C, C, 98, a0 + 0.03, a0 + Math.PI / 4 - 0.03); g.closePath(); g.fill(); }
    g.fillStyle = '#0d0b0a'; g.beginPath(); g.arc(C, C, 42, 0, 7); g.fill();
    g.fillStyle = '#efd67a'; g.beginPath(); g.arc(C, C, 36, 0, 7); g.fill();
    blotch(g, r, 512, 512, 30, '0,0,0', 0.1);
  });
}

/** 14사도화 자리(양식화): 금바탕 위 서 있는 인물 14 — 한 장의 아틀라스 */
function apostlesCanvas() {
  const w = 128, h = 384;
  return paint(w * 14, h, 1926, (g, r) => {
    for (let i = 0; i < 14; i++) {
      const x0 = i * w, cx = x0 + w / 2;
      const gr = g.createLinearGradient(x0, 0, x0, h); gr.addColorStop(0, '#c9a24a'); gr.addColorStop(1, '#9c7a2e');
      g.fillStyle = gr; g.fillRect(x0, 0, w, h);
      speckle(g, r, w, h, 0, 0); // 자리 맞춤
      g.fillStyle = 'rgba(80,55,20,.35)'; for (let k = 0; k < 300; k++) g.fillRect(x0 + r() * w, r() * h, 2, 2);
      // 바닥
      g.fillStyle = '#5c4a32'; g.fillRect(x0, h - 40, w, 40);
      // 옷(겉옷·속옷)
      const robe = ['#7e1f24', '#2f4f7a', '#3d6a3a', '#6b3f22', '#e7e0cf', '#4e2f63'][(i + (r() * 2) | 0) % 6];
      const tunic = ['#e7e0cf', '#b9a37a', '#8a2a2a', '#2f4f7a'][i % 4];
      g.fillStyle = tunic; g.beginPath(); g.moveTo(cx - 16, 110); g.lineTo(cx + 16, 110); g.lineTo(cx + 26, h - 44); g.lineTo(cx - 26, h - 44); g.closePath(); g.fill();
      g.fillStyle = robe; g.beginPath(); g.moveTo(cx - 20, 108); g.quadraticCurveTo(cx - 38, 200, cx - 30, h - 46); g.lineTo(cx + 4, h - 46); g.quadraticCurveTo(cx + 10, 220, cx + 20, 108); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(cx - 22 + k * 6, 140); g.quadraticCurveTo(cx - 26 + k * 7, 240, cx - 24 + k * 6, h - 50); g.stroke(); }
      // 손 · 상징(책·열쇠·칼 등 대신 단순한 막대/책)
      g.fillStyle = '#e2c09b'; g.beginPath(); g.arc(cx + 10, 190, 5, 0, 7); g.fill();
      g.fillStyle = r() < 0.5 ? '#3a2a1a' : '#d9d2c0'; g.fillRect(cx + 4, 196, 14, 20);
      // 머리 · 광륜
      g.fillStyle = '#e8c96a'; g.beginPath(); g.arc(cx, 82, 24, 0, 7); g.fill();
      g.strokeStyle = '#8a6a24'; g.lineWidth = 2; g.beginPath(); g.arc(cx, 82, 24, 0, 7); g.stroke();
      g.fillStyle = '#e2c09b'; g.beginPath(); g.ellipse(cx, 86, 11, 14, 0, 0, 7); g.fill();
      g.fillStyle = ['#3b2a1c', '#7a7064', '#d8d2c8'][i % 3]; g.beginPath(); g.ellipse(cx, 75, 12, 7, 0, Math.PI, 0); g.fill();
      g.beginPath(); g.ellipse(cx, 96, 8, 7, 0, 0, Math.PI); g.fill();
      // 액자 안쪽 테
      g.strokeStyle = '#5a3f14'; g.lineWidth = 4; g.strokeRect(x0 + 2, 2, w - 4, h - 4);
    }
  });
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
/** 청동 «십자가의 길» 부조(양식화) 14 — 색 + 높이 아틀라스 */
function stationsCanvases() {
  const w = 128, h = 160;
  const draw = (g: CanvasRenderingContext2D, r: () => number, height: boolean) => {
    for (let i = 0; i < 14; i++) {
      const x0 = i * w, cx = x0 + w / 2;
      g.fillStyle = height ? '#606060' : '#5b4128'; g.fillRect(x0, 0, w, h);
      g.fillStyle = height ? '#909090' : '#6e5133'; g.fillRect(x0 + 8, 8, w - 16, h - 40);
      // 장면: 십자가 + 인물 둘~셋(돋을새김)
      const relief = height ? '#e0e0e0' : '#a07a4a';
      g.fillStyle = relief;
      const crossX = cx + (r() - 0.5) * 30;
      g.save(); g.translate(crossX, 70); g.rotate((r() - 0.5) * 0.8);
      g.fillRect(-4, -46, 8, 92); g.fillRect(-26, -26, 52, 8); g.restore();
      for (let k = 0; k < 2 + ((r() * 2) | 0); k++) {
        const fx = x0 + 22 + r() * (w - 44);
        g.beginPath(); g.arc(fx, 52, 7, 0, 7); g.fill();
        g.beginPath(); g.moveTo(fx - 8, 60); g.lineTo(fx + 8, 60); g.lineTo(fx + 13, 110); g.lineTo(fx - 13, 110); g.closePath(); g.fill();
      }
      // 번호 판
      g.fillStyle = height ? '#c0c0c0' : '#8a6a40'; g.fillRect(x0 + 34, h - 28, w - 68, 20);
      g.fillStyle = height ? '#404040' : '#2a1c10'; g.font = 'bold 15px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(ROMAN[i], cx, h - 18);
      if (!height) { g.fillStyle = 'rgba(60,110,90,.25)'; for (let k = 0; k < 160; k++) g.fillRect(x0 + r() * w, r() * h, 3, 3); }
    }
  };
  return { map: paint(w * 14, h, 1414, (g, r) => draw(g, r, false)), hgt: paint(w * 14, h, 1414, (g, r) => draw(g, r, true)) };
}

function mats(): Record<K, THREE.Material> {
  const S = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide, ...o });
  const fl = floorTex(), as = ashlar(), dr = dressedStone(), pl = plasterTex();
  const wd = woodTex([96, 60, 34], 71), dw = woodTex([58, 36, 20], 73);
  return {
    floor: S({ ...fl, roughness: 0.22, metalness: 0.0, normalScale: new THREE.Vector2(0.4, 0.4) }),
    sanct: S({ ...sanctTex(), roughness: 0.2 }),
    stone: S({ ...as, roughness: 0.9 }),
    dressed: S({ ...dr, roughness: 0.75 }),
    plaster: S({ ...pl, roughness: 0.95 }),
    wood: S({ ...wd, roughness: 0.45 }),
    darkwood: S({ ...dw, roughness: 0.5 }),
    marble: S({ ...marbleTex(), roughness: 0.18 }),
    gold: S({ color: 0xd8ab45, roughness: 0.28, metalness: 0.95 }),
    pipe: S({ color: 0xd8dcdf, roughness: 0.18, metalness: 0.95 }),
    white: S({ color: 0xf4f1ea, roughness: 0.55 }),
    cloth: S({ color: 0xf6f3ec, roughness: 0.9 }),
    blue: S({ color: 0x2b5aa0, roughness: 0.55 }),
    red: S({ color: 0x8e1a20, roughness: 0.85 }),
    kneel: S({ color: 0x5a2224, roughness: 0.95 }),
    skin: S({ color: 0xe0c2a2, roughness: 0.55 }),
    iron: S({ color: 0x24211f, roughness: 0.45, metalness: 0.8 }),
    bronze: S({ color: 0x8a6436, roughness: 0.4, metalness: 0.85 }),
    leaf: S({ color: 0x2f5a26, roughness: 0.8 }),
    flowerY: S({ color: 0xe8b828, roughness: 0.8 }),
    flowerW: S({ color: 0xf2eee2, roughness: 0.8 }),
    flowerR: S({ color: 0x8a1f3a, roughness: 0.8 }),
  };
}

// ── 기하 모으기 ─────────────────────────────────────────────────────────

const UV: Partial<Record<K, number>> = {
  floor: 1 / 4.8, sanct: 1 / 3.6, stone: 1 / 2.4, dressed: 1 / 1.6, plaster: 1 / 4, wood: 1 / 1.4, darkwood: 1 / 1.4, marble: 1 / 1.8,
};
const NO_SHADOW: K[] = ['floor', 'sanct'];

class Bucket {
  private m = new Map<K, THREE.BufferGeometry[]>();
  add(k: K, g: THREE.BufferGeometry, mx?: THREE.Matrix4) {
    const n = g.index ? g.toNonIndexed() : g.clone();
    if (mx) n.applyMatrix4(mx);
    for (const a of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(a)) n.deleteAttribute(a);
    n.clearGroups();
    if (!n.attributes.normal) n.computeVertexNormals();
    if (UV[k]) worldUV(n, UV[k]!);
    else if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    (this.m.get(k) ?? this.m.set(k, []).get(k)!).push(n);
    g.dispose();
  }
  box(k: K, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mx?: THREE.Matrix4) {
    this.add(k, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mx);
  }
  /** 모서리를 둥글린 상자 — 손으로 다듬은 목재·석재의 가장자리 빛을 낸다 */
  rbox(k: K, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, rad = 0.02, mx?: THREE.Matrix4) {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0, rr = Math.min(rad, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
    this.add(k, new RoundedBoxGeometry(w, h, d, 2, Math.max(rr, 0.001)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mx);
  }
  build(M: Record<K, THREE.Material>) {
    const out: THREE.Mesh[] = [];
    for (const [k, list] of this.m) {
      const g = mergeGeometries(list, false)!;
      list.forEach((x) => x.dispose());
      const mesh = new THREE.Mesh(g, M[k]);
      mesh.receiveShadow = true;
      mesh.castShadow = !NO_SHADOW.includes(k);
      mesh.name = `interior:${k}`;
      out.push(mesh);
    }
    return out;
  }
}

const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const RY = (a: number) => new THREE.Matrix4().makeRotationY(a);
const RZ = (a: number) => new THREE.Matrix4().makeRotationZ(a);
const mul = (...ms: THREE.Matrix4[]) => ms.reduce((a, b) => a.multiply(b), new THREE.Matrix4());
const V2 = (x: number, y: number) => new THREE.Vector2(x, y);
const lathe = (pts: [number, number][], seg = 20) => new THREE.LatheGeometry(pts.map(([a, b]) => V2(a, b)), seg);

/** 첨두아치 윤곽(바닥 중앙 원점) */
function pointed(w: number, h: number, dy = 0, cx = 0) {
  const hs = h - w * 0.8, s = new THREE.Shape();
  s.moveTo(cx - w / 2, dy); s.lineTo(cx - w / 2, dy + hs);
  s.quadraticCurveTo(cx - w / 2, dy + h - w * 0.12, cx, dy + h);
  s.quadraticCurveTo(cx + w / 2, dy + h - w * 0.12, cx + w / 2, dy + hs);
  s.lineTo(cx + w / 2, dy); s.closePath();
  return s;
}
const asPath = (s: THREE.Shape) => { const p = new THREE.Path(); p.setFromPoints(s.getPoints(10)); return p; };
const circle = (cx: number, cy: number, R: number) => new THREE.Path().absarc(cx, cy, R, 0, Math.PI * 2, true);

/** 창 장식 격자(트레이서리): 바깥 첨두 안에 첨두 창살 둘 + 둥근 창 하나 */
function tracery(W: number, H: number, S: number) {
  const plate = pointed(W, H, S);
  const lw = W * 0.36, lh = H - W * 0.62, oc = S + H - W * 0.4, oR = W * 0.17;
  plate.holes.push(asPath(pointed(lw, lh, S, -W * 0.235)), asPath(pointed(lw, lh, S, W * 0.235)), circle(0, oc, oR));
  return plate;
}

/** 아치 단면(첨두) — 반폭 hw, 기점 y0, 꼭대기 y1 의 곡선 점들 (z, y) */
function archCurve(hw: number, y0: number, y1: number, n = 16): [number, number][] {
  const h = y1 - y0;
  if (h < hw) { // 낮은 활꼴(측랑 천장): 중심이 아래에 있는 원호 하나
    const R = (hw * hw + h * h) / (2 * h), cy = y1 - R, a0 = Math.asin(hw / R), out: [number, number][] = [];
    for (let i = 0; i <= n * 2; i++) { const a = -a0 + (i / (n * 2)) * 2 * a0; out.push([R * Math.sin(a), cy + R * Math.cos(a)]); }
    return out;
  }
  const c = Math.max(0, (h * h - hw * hw) / (2 * hw)), R = hw + c;
  const aEnd = Math.asin(Math.min(1, h / R));
  const left: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI - (i / n) * aEnd; left.push([c + R * Math.cos(a), y0 + R * Math.sin(a)]); }
  const right = left.slice(0, -1).reverse().map(([z, y]) => [-z, y] as [number, number]);
  return [...left, ...right];
}

/** 볼트 면: 단면 곡선을 x 방향으로 민 얇은 껍질 */
function barrel(B: Bucket, k: K, hw: number, y0: number, y1: number, x0: number, x1: number, mx?: THREE.Matrix4) {
  const c = archCurve(hw, y0, y1, 18);
  const pos: number[] = [];
  for (let i = 1; i < c.length; i++) {
    const [z0, ya] = c[i - 1], [z1, yb] = c[i];
    pos.push(x0, ya, z0, x1, ya, z0, x1, yb, z1, x0, ya, z0, x1, yb, z1, x0, yb, z1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  B.add(k, g, mx);
}

/** 리브 단면: 모서리를 깎은 팔각(돌 몰딩) */
const RIB = (s = 1) => new THREE.Shape([V2(-0.15, -0.09), V2(-0.09, -0.17), V2(0.09, -0.17), V2(0.15, -0.09), V2(0.15, 0.09), V2(0.09, 0.17), V2(-0.09, 0.17), V2(-0.15, 0.09)].map((v) => v.multiplyScalar(s)));

/** 곡선을 따라 몰딩 단면을 민 리브 */
function ribAlong(B: Bucket, pts: THREE.Vector3[], k: K = 'dressed', s = 1, mx?: THREE.Matrix4) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  B.add(k, new THREE.ExtrudeGeometry(RIB(s), { steps: Math.max(12, pts.length * 2), bevelEnabled: false, extrudePath: curve }), mx);
}
/** 가로 아치 리브(신랑을 가로지름) */
function archRib(B: Bucket, hw: number, y0: number, y1: number, x: number, s = 1, mx?: THREE.Matrix4) {
  const c = archCurve(hw - 0.06, y0, y1 - 0.14, 14);
  ribAlong(B, c.map(([z, y]) => new THREE.Vector3(x, y, z)), 'dressed', s, mx);
}
/** 대각 리브: 베이 모서리에서 대각선 맞은편까지(가운데 꼭대기를 지난다) */
function diagRib(B: Bucket, a: THREE.Vector3, b: THREE.Vector3, top: number, s = 0.85, mx?: THREE.Matrix4) {
  const mid = a.clone().add(b).multiplyScalar(0.5).setY(top);
  const ctrl = mid.clone().multiplyScalar(2).sub(a.clone().add(b).multiplyScalar(0.5));
  const q = new THREE.QuadraticBezierCurve3(a, ctrl, b);
  ribAlong(B, q.getPoints(16), 'dressed', s, mx);
}

/** 기둥 다발: 받침(팔각 대좌 + 둥근 쇠시리) · 원기둥 + 붙은 기둥 8 · 잎 장식 주두 · 팔각 관판 */
function pier(B: Bucket, x: number, z: number, y0: number, capY: number, topY: number, naveSide = -Math.sign(z)) {
  B.add('dressed', new THREE.CylinderGeometry(0.78, 0.8, 0.32, 8).translate(x, y0 + 0.16, z));
  B.add('dressed', lathe([[0, 0], [0.7, 0], [0.7, 0.06], [0.64, 0.1], [0.66, 0.16], [0.58, 0.24], [0.54, 0.3], [0, 0.3]], 24).translate(x, y0 + 0.32, z));
  const yb = y0 + 0.62;
  B.add('dressed', new THREE.CylinderGeometry(0.44, 0.46, capY - yb, 24).translate(x, (yb + capY) / 2, z));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, big = k % 2 === 0, rr = big ? 0.15 : 0.09, d = big ? 0.47 : 0.43;
    const dx = Math.cos(a) * d, dz = Math.sin(a) * d;
    const toVault = big && Math.abs(Math.sin(a)) > 0.9 && Math.sign(dz) === naveSide; // 신랑 쪽 가는 기둥은 볼트 기점까지
    const ty = toVault ? topY : capY;
    B.add('dressed', new THREE.CylinderGeometry(rr, rr, ty - yb, 10).translate(x + dx, (yb + ty) / 2, z + dz));
    if (toVault) B.add('dressed', lathe([[0, 0], [0.16, 0], [0.27, 0.3], [0.3, 0.36], [0, 0.36]], 12).translate(x + dx, topY - 0.3, z + dz));
  }
  // 주두: 종 모양 + 잎 12장 + 관판
  B.add('dressed', lathe([[0, 0], [0.55, 0], [0.6, 0.08], [0.66, 0.3], [0.74, 0.46], [0, 0.46]], 24).translate(x, capY - 0.46, z));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const leaf = new THREE.SphereGeometry(0.11, 8, 6).scale(0.8, 1.4, 0.55).rotateX(0.5);
    B.add('dressed', leaf, mul(T(x, capY - 0.2, z), RY(a), T(0, 0, 0.64)));
  }
  B.add('dressed', new THREE.CylinderGeometry(0.86, 0.84, 0.14, 8).translate(x, capY + 0.07, z));
}

// ── 조립 ────────────────────────────────────────────────────────────────

interface Pane { geo: THREE.BufferGeometry; outline: THREE.Vector3[]; n: THREE.Vector3; mat: number }

export function buildInterior(d: CathedralDims): Interior {
  const B = new Bucket();
  const r = rng(1898);
  const F0 = 0.6, SAN = 1.2;
  const hn = 5.7, aw = d.hwAisle - 0.58, spring = 14.2, top = 19.9, aisleCeil = 8.6, trTop = 18.6;
  const x0 = d.xTowerBack + 0.3, xT = d.xTr0, xC = d.xc - 0.3, xc = d.xc;
  const rA = d.rIn - 0.5, rAmb = d.rOut - 0.67;
  const bays = 5, bay = (xT - x0) / bays;
  const porch0 = d.xFront + 0.6, hwP = d.hwTower - 0.6;
  const arcSpring = 5.2, arcTop = 8.3;
  const xSan = xT + 2.2; // 성소 단 앞 가장자리

  // 1) 바닥 · 성소 단
  B.box('floor', porch0, xc, 0, F0, -aw, aw);
  B.add('floor', new THREE.CylinderGeometry(rAmb, rAmb, F0, 32, 1, false, 0, Math.PI).translate(xc, F0 / 2, 0));
  B.box('sanct', xSan, xc, F0, SAN, -hn, hn);
  B.add('sanct', new THREE.CylinderGeometry(rA, rA, SAN - F0, 32, 1, false, 0, Math.PI).translate(xc, (F0 + SAN) / 2, 0));
  for (let s = 0; s < 3; s++) B.rbox('marble', xSan - 0.36 * (s + 1), xSan - 0.36 * s + 0.02, F0, F0 + 0.2 * (3 - s), -hn + 0.4, hn - 0.4, 0.015);
  B.rbox('gold', xSan - 0.04, xSan + 0.02, SAN - 0.02, SAN + 0.004, -hn + 0.4, hn - 0.4, 0.004); // 단 끝 금속 띠

  // 2) 측랑 바깥벽(창 구멍 + 트레이서리) · 벽기둥 · 천장 · 리브
  const winW = 1.9, winH = 4.6, winS = F0 + 3.0;
  for (const s of [1, -1]) {
    const wall = new THREE.Shape([V2(x0, F0), V2(xT, F0), V2(xT, aisleCeil), V2(x0, aisleCeil)]);
    for (let i = 0; i < bays; i++) wall.holes.push(asPath(pointed(winW, winH, winS, x0 + (i + 0.5) * bay)));
    B.add('stone', new THREE.ExtrudeGeometry(wall, { depth: 0.3, bevelEnabled: false, curveSegments: 10 }), T(0, 0, s > 0 ? aw : -aw - 0.3));
    for (let i = 0; i < bays; i++) {
      const xm = x0 + (i + 0.5) * bay, zIn = s * aw;
      // 창 둘레 쇠시리(안쪽으로 비스듬히 벌어진 테) · 창턱
      const fr = pointed(winW + 0.5, winH + 0.32, winS - 0.16); fr.holes.push(asPath(pointed(winW, winH, winS)));
      B.add('dressed', new THREE.ExtrudeGeometry(fr, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 10 }), mul(T(xm, 0, zIn - s * 0.12), RY(s > 0 ? 0 : Math.PI)));
      B.rbox('dressed', xm - winW / 2 - 0.2, xm + winW / 2 + 0.2, winS - 0.3, winS - 0.14, s > 0 ? aw - 0.28 : -aw, s > 0 ? aw : -aw + 0.28, 0.03);
      B.add('dressed', new THREE.ExtrudeGeometry(tracery(winW, winH, winS), { depth: 0.12, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 10 }), T(xm, 0, s * (aw + 0.09) - 0.06));
    }
    // 벽기둥(측랑 가로 리브를 받는 반원 기둥)
    for (let i = 0; i <= bays; i++) {
      const x = x0 + i * bay, z = s * (aw - 0.12);
      B.add('dressed', new THREE.CylinderGeometry(0.2, 0.2, aisleCeil - 0.5 - F0, 12, 1, false, 0, Math.PI * 2).translate(x, (F0 + aisleCeil - 0.5) / 2, z));
      B.add('dressed', lathe([[0, 0], [0.22, 0], [0.32, 0.22], [0.36, 0.3], [0, 0.3]], 12).translate(x, aisleCeil - 0.8, z));
      B.add('dressed', new THREE.CylinderGeometry(0.34, 0.34, 0.3, 8).translate(x, F0 + 0.15, z));
    }
    // 벽 아래 판석 띠(징두리)
    B.rbox('dressed', x0, xT, F0, F0 + 0.9, s > 0 ? aw - 0.05 : -aw, s > 0 ? aw : -aw + 0.05, 0.01);
    B.rbox('dressed', x0, xT, F0 + 0.88, F0 + 0.98, s > 0 ? aw - 0.09 : -aw, s > 0 ? aw : -aw + 0.09, 0.03);
    // 측랑 천장 + 가로·대각 리브
    barrel(B, 'plaster', (aw - hn) / 2, aisleCeil - 1.2, aisleCeil + 0.15, x0, xT, T(0, 0, (s * (aw + hn)) / 2));
    for (let i = 0; i <= bays; i++) archRib(B, (aw - hn) / 2, aisleCeil - 1.2, aisleCeil + 0.15, 0, 0.8, mul(T(x0 + i * bay, 0, (s * (aw + hn)) / 2)));
    for (let i = 0; i < bays; i++) {
      const xa = x0 + i * bay, xb = xa + bay, za = s * (hn + 0.3), zb = s * (aw - 0.2);
      for (const [p, q] of [[[xa, za], [xb, zb]], [[xa, zb], [xb, za]]] as const)
        diagRib(B, new THREE.Vector3(p[0], aisleCeil - 1.2, p[1]), new THREE.Vector3(q[0], aisleCeil - 1.2, q[1]), aisleCeil + 0.05, 0.65);
      B.add('gold', lathe([[0, 0], [0.16, 0.02], [0.18, 0.08], [0.1, 0.14], [0, 0.15]], 16).rotateX(Math.PI).translate((xa + xb) / 2, aisleCeil + 0.08, (s * (aw + hn)) / 2));
    }
    // 측랑 천장 위 덮개(빛 새는 틈 막기)
    B.box('plaster', x0, xT, aisleCeil + 0.15, aisleCeil + 0.3, s > 0 ? hn : -aw, s > 0 ? aw : -hn);
  }

  // 정면 벽(종탑 현관과 신랑 사이) — 가운데 정문 아치 + 문틀 쇠시리
  const vaultEdge = archCurve(hn + 0.3, spring, top + 0.3, 12).map(([z, y]) => V2(z, y));
  const front = new THREE.Shape([
    V2(-aw, F0), V2(aw, F0), V2(aw, aisleCeil + 0.3), V2(hn + 0.3, aisleCeil + 0.3),
    ...vaultEdge.slice().reverse(),
    V2(-hn - 0.3, aisleCeil + 0.3), V2(-aw, aisleCeil + 0.3),
  ]);
  front.holes.push(asPath(pointed(3.4, 6.4, F0)));
  B.add('stone', new THREE.ExtrudeGeometry(front, { depth: 0.3, bevelEnabled: false }), mul(T(x0, 0, 0), RY(-Math.PI / 2)));
  for (const [w, h, dep] of [[4.2, 6.9, 0.16], [3.8, 6.65, 0.24]] as const) {
    const fr = pointed(w, h, F0); fr.holes.push(asPath(pointed(3.4, 6.4, F0)));
    B.add('dressed', new THREE.ExtrudeGeometry(fr, { depth: dep, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 10 }), mul(T(x0, 0, 0), RY(Math.PI / 2)));
  }
  // 종탑 현관
  B.box('stone', porch0, x0, F0, F0 + 6.6, -hwP - 0.3, -hwP); B.box('stone', porch0, x0, F0, F0 + 6.6, hwP, hwP + 0.3);
  B.box('plaster', porch0, x0, F0 + 6.6, F0 + 6.8, -hwP, hwP);

  // 3) 신랑 아케이드 벽(아치 + 고측창 구멍) · 아치 테(두 겹 쇠시리) · 트리포리움 띠
  const clW = 2.5, clH = 3.4, clS = 10.35;
  for (const s of [1, -1]) {
    const sh = new THREE.Shape([V2(x0, F0), V2(xT, F0), V2(xT, spring + 0.05), V2(x0, spring + 0.05)]);
    for (let i = 0; i < bays; i++) {
      const xm = x0 + (i + 0.5) * bay;
      sh.holes.push(asPath(pointed(bay - 1.1, arcTop - F0, F0, xm)));
      sh.holes.push(asPath(pointed(clW, clH, clS, xm)));
    }
    B.add('stone', new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false, curveSegments: 10 }), T(0, 0, s > 0 ? hn : -hn - 0.5));
    for (let i = 0; i < bays; i++) {
      const xm = x0 + (i + 0.5) * bay;
      // 바깥 테(넓음) · 안쪽 테(좁음, 더 깊이) — 계단식 아치 «겹»
      const outer = pointed(bay - 0.5, arcTop - F0 + 0.32, F0, xm); outer.holes.push(asPath(pointed(bay - 1.1, arcTop - F0, F0, xm)));
      B.add('dressed', new THREE.ExtrudeGeometry(outer, { depth: 0.6, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 12 }), T(0, 0, s > 0 ? hn - 0.05 : -hn - 0.55));
      const inner = pointed(bay - 1.1, arcTop - F0, F0, xm); inner.holes.push(asPath(pointed(bay - 1.5, arcTop - F0 - 0.25, F0, xm)));
      B.add('dressed', new THREE.ExtrudeGeometry(inner, { depth: 0.36, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 12 }), T(0, 0, s > 0 ? hn + 0.07 : -hn - 0.43));
      // 고측창 테 + 트레이서리
      const cf = pointed(clW + 0.4, clH + 0.26, clS - 0.13, xm); cf.holes.push(asPath(pointed(clW, clH, clS, xm)));
      B.add('dressed', new THREE.ExtrudeGeometry(cf, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 10 }), T(0, 0, s > 0 ? hn - 0.1 : -hn));
      B.add('dressed', new THREE.ExtrudeGeometry(tracery(clW, clH, clS), { depth: 0.1, bevelEnabled: false, curveSegments: 10 }), T(xm, 0, s > 0 ? hn + 0.2 : -hn - 0.3));
      // 트리포리움 자리 장님 아케이드(작은 첨두 4개 돋을새김)
      for (let k = 0; k < 4; k++) {
        const ax = xm - 1.65 + k * 1.1, bl = pointed(0.86, 1.1, 8.75, ax); bl.holes.push(asPath(pointed(0.66, 0.95, 8.75, ax)));
        B.add('dressed', new THREE.ExtrudeGeometry(bl, { depth: 0.08, bevelEnabled: false, curveSegments: 8 }), T(0, 0, s > 0 ? hn - 0.08 : -hn));
      }
    }
    // 띠 쇠시리 두 줄(아케이드 위 · 고측창 아래)
    B.rbox('dressed', x0, xT, 8.55, 8.72, s > 0 ? hn - 0.14 : -hn - 0.5, s > 0 ? hn + 0.5 : -hn + 0.14, 0.05);
    B.rbox('dressed', x0, xT, 9.95, 10.12, s > 0 ? hn - 0.16 : -hn - 0.5, s > 0 ? hn + 0.5 : -hn + 0.16, 0.05);
  }
  for (let i = 0; i <= bays; i++) for (const s of [1, -1]) pier(B, x0 + i * bay, s * hn, F0, arcSpring, spring);

  // 4) 신랑 볼트(입구 → 후진 앞까지) + 리브 + 금빛 꽃 장식 머리돌
  barrel(B, 'plaster', hn, spring, top, x0, xc);
  for (let i = 0; i <= bays; i++) archRib(B, hn, spring, top, x0 + i * bay);
  for (let i = 0; i < bays; i++) {
    const xa = x0 + i * bay, xb = xa + bay;
    diagRib(B, new THREE.Vector3(xa, spring + 0.2, -hn + 0.1), new THREE.Vector3(xb, spring + 0.2, hn - 0.1), top - 0.2);
    diagRib(B, new THREE.Vector3(xa, spring + 0.2, hn - 0.1), new THREE.Vector3(xb, spring + 0.2, -hn + 0.1), top - 0.2);
    const boss = lathe([[0, 0], [0.34, 0.02], [0.38, 0.1], [0.26, 0.2], [0.12, 0.26], [0, 0.27]], 20).rotateX(Math.PI).translate((xa + xb) / 2, top - 0.12, 0);
    B.add('gold', boss);
    for (let k = 0; k < 8; k++) B.add('gold', new THREE.SphereGeometry(0.09, 8, 6).scale(1, 0.5, 2).translate(0, 0, 0.42), mul(T((xa + xb) / 2, top - 0.25, 0), RY((k / 8) * Math.PI * 2)));
  }
  ribAlong(B, [new THREE.Vector3(x0, top - 0.2, 0), new THREE.Vector3((x0 + xc) / 2, top - 0.2, 0), new THREE.Vector3(xc, top - 0.2, 0)], 'dressed', 0.7); // 용마루 리브
  archRib(B, hn, spring, top, xT, 1.3); archRib(B, hn, spring, top, xC, 1.3);

  // 5) 익랑: 양 팔 볼트(z 방향), 끝벽(큰 창 + 장미창), 앞뒤 벽
  for (const s of [1, -1]) {
    const zm = (s * (hn + aw)) / 2;
    const m = mul(T((xT + xC) / 2, 0, zm), RY(Math.PI / 2));
    barrel(B, 'plaster', (xC - xT) / 2, spring, trTop, -(aw - hn) / 2, (aw - hn) / 2, m);
    archRib(B, (xC - xT) / 2, spring, trTop, 0, 1, mul(T((xT + xC) / 2, 0, s * aw - s * 0.2), RY(Math.PI / 2)));
    diagRib(B, new THREE.Vector3(xT + 0.2, spring, s * hn), new THREE.Vector3(xC - 0.2, spring, s * (aw - 0.2)), trTop - 0.2);
    diagRib(B, new THREE.Vector3(xC - 0.2, spring, s * hn), new THREE.Vector3(xT + 0.2, spring, s * (aw - 0.2)), trTop - 0.2);
    B.add('gold', lathe([[0, 0], [0.3, 0.02], [0.32, 0.1], [0.2, 0.2], [0, 0.22]], 20).rotateX(Math.PI).translate((xT + xC) / 2, trTop - 0.1, zm));
    // 끝벽 — 큰 창 구멍 · 장미창 구멍
    const tw = (xC - xT) / 2;
    const endWall = new THREE.Shape([V2(-tw, F0), V2(tw, F0), ...archCurve(tw, spring, trTop + 0.2, 12).reverse().map(([u, y]) => V2(u, y))]);
    endWall.holes.push(asPath(pointed(2.6, 7.2, 3.2)), circle(0, 15.2, 1.7));
    B.add('stone', new THREE.ExtrudeGeometry(endWall, { depth: 0.3, bevelEnabled: false, curveSegments: 16 }), T((xT + xC) / 2, 0, s > 0 ? aw : -aw - 0.3));
    B.add('dressed', new THREE.ExtrudeGeometry(tracery(2.6, 7.2, 3.2), { depth: 0.12, bevelEnabled: false, curveSegments: 10 }), T((xT + xC) / 2, 0, s * (aw + 0.09) - 0.06));
    const tf = pointed(3.1, 7.5, 3.0); tf.holes.push(asPath(pointed(2.6, 7.2, 3.2)));
    B.add('dressed', new THREE.ExtrudeGeometry(tf, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 10 }), mul(T((xT + xC) / 2, 0, s * aw - s * 0.12), RY(s > 0 ? 0 : Math.PI)));
    // 앞벽 위쪽(측랑 천장 위) · 뒷벽(회랑 밖) · 회랑 천장 위 막음
    B.box('stone', xT + 0.3, xT + 0.6, aisleCeil, spring, s > 0 ? hn : -aw, s > 0 ? aw : -hn);
    B.box('stone', xC - 0.3, xC, F0, spring, s > 0 ? rAmb : -aw, s > 0 ? aw : -rAmb);
    B.box('stone', xC - 0.3, xC, aisleCeil, spring, s > 0 ? hn : -rAmb, s > 0 ? rAmb : -hn);
    pier(B, xT, s * hn, F0, arcSpring, spring);
    pier(B, xC, s * hn, F0, arcSpring, spring);
  }
  // 교차부 큰 아치(익랑으로 열린 면) 테
  for (const s of [1, -1]) archRib(B, (xC - xT) / 2, spring, trTop, 0, 1.4, mul(T((xT + xC) / 2, 0, s * hn), RY(Math.PI / 2)));

  // 6) 후진: 기둥 둘레 + 반돔 + 회랑 벽·천장 + 14사도화 자리
  const nCol = 7;
  for (let i = 1; i < nCol; i++) {
    const a = (i / nCol) * Math.PI;
    pier(B, xc + rA * Math.sin(a), rA * Math.cos(a), SAN, arcSpring + 0.6, spring, 0);
  }
  const apseSeg: { mid: THREE.Vector2; ang: number; L: number }[] = [];
  for (let i = 0; i < nCol; i++) {
    const a0 = (i / nCol) * Math.PI, a1 = ((i + 1) / nCol) * Math.PI;
    const p0 = V2(xc + rA * Math.sin(a0), rA * Math.cos(a0)), p1 = V2(xc + rA * Math.sin(a1), rA * Math.cos(a1));
    const L = p0.distanceTo(p1), mid = p0.clone().add(p1).multiplyScalar(0.5), ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    apseSeg.push({ mid, ang, L });
    const M = mul(T(mid.x, 0, mid.y), RY(-ang));
    const sh = new THREE.Shape([V2(-L / 2, arcTop + 0.8), V2(L / 2, arcTop + 0.8), V2(L / 2, spring), V2(-L / 2, spring)]);
    sh.holes.push(asPath(pointed(0.8, 3.0, arcTop + 1.6)));
    B.add('stone', new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false }), M);
    const arch = new THREE.Shape([V2(-L / 2, arcSpring + 0.6), V2(L / 2, arcSpring + 0.6), V2(L / 2, arcTop + 0.8), V2(-L / 2, arcTop + 0.8)]);
    arch.holes.push(asPath(pointed(L - 0.9, arcTop + 0.6 - (arcSpring + 0.6) + 0.9, arcSpring + 0.5)));
    B.add('stone', new THREE.ExtrudeGeometry(arch, { depth: 0.4, bevelEnabled: false }), M);
    const ring = pointed(L - 0.6, arcTop + 0.6 - (arcSpring + 0.6) + 1.1, arcSpring + 0.5); ring.holes.push(asPath(pointed(L - 0.9, arcTop + 0.6 - (arcSpring + 0.6) + 0.9, arcSpring + 0.5)));
    B.add('dressed', new THREE.ExtrudeGeometry(ring, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), mul(M, T(0, 0, -0.1)));
    // 사도화 액자 두 개(창 양옆)
    for (const u of [-0.82, 0.82]) {
      B.rbox('gold', u - 0.4, u + 0.4, arcTop + 1.25, arcTop + 4.05, -0.08, 0.0, 0.02, M);
    }
    B.rbox('dressed', -L / 2, L / 2, arcTop + 0.95, arcTop + 1.1, -0.14, 0.02, 0.03, M);
  }
  B.add('plaster', new THREE.SphereGeometry(rA, 36, 16, Math.PI / 2, Math.PI, 0, Math.PI / 2).translate(xc, spring, 0)); // 반돔(+x 반쪽)
  for (let i = 1; i < nCol; i++) {
    const a = (i / nCol) * Math.PI;
    diagRib(B, new THREE.Vector3(xc + (rA - 0.1) * Math.sin(a), spring, (rA - 0.1) * Math.cos(a)), new THREE.Vector3(xc + 0.01, spring + rA - 0.15, 0), spring + (rA - 0.15) * 0.92, 0.8);
  }
  B.add('stone', new THREE.CylinderGeometry(rAmb + 0.3, rAmb + 0.3, aisleCeil - F0, 28, 1, true, 0, Math.PI).translate(xc, (F0 + aisleCeil) / 2, 0));
  B.add('plaster', new THREE.RingGeometry(rA, rAmb + 0.3, 28, 1, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(xc, aisleCeil, 0));

  // 7) 스테인드글라스 — 측랑(묵주기도 주제의 메달리온) · 고측창 · 회랑 · 익랑(성탄) · 후진(12사도 주제의 서 있는 인물)
  const glassMats = [
    ...[1, 2, 3, 4].map((sd) => glassCanvas(100 + sd, 'medallion')),
    ...[5, 6].map((sd) => glassCanvas(100 + sd, 'pattern')),
    ...[7, 8].map((sd) => glassCanvas(100 + sd, 'standing')),
  ].map((c) => {
    const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.6, roughness: 0.3, side: THREE.DoubleSide });
  });
  const glassGeo: THREE.BufferGeometry[][] = glassMats.map(() => []);
  const panes: Pane[] = [];
  const pane = (w: number, h: number, sill: number, mx: THREE.Matrix4, kind: number[]) => {
    const shape = pointed(w, h, 0);
    const g = new THREE.ShapeGeometry(shape, 8);
    const pos = g.attributes.position, uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) { uv[i * 2] = pos.getX(i) / w + 0.5; uv[i * 2 + 1] = pos.getY(i) / h; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.translate(0, sill, 0).applyMatrix4(mx);
    const mi = kind[(r() * kind.length) | 0];
    const ng = g.toNonIndexed();
    glassGeo[mi].push(ng);
    const outline = shape.getPoints(8).map((p) => new THREE.Vector3(p.x, p.y + sill, 0).applyMatrix4(mx));
    const n = new THREE.Vector3(0, 0, 1).transformDirection(mx);
    panes.push({ geo: ng, outline, n, mat: mi });
  };
  const MED = [0, 1, 2, 3], PAT = [4, 5], STAND = [6, 7];
  for (let i = 0; i < bays; i++) {
    const xm = x0 + (i + 0.5) * bay;
    pane(winW, winH, winS, mul(T(xm, 0, aw + 0.14), RY(Math.PI)), MED);
    pane(winW, winH, winS, T(xm, 0, -aw - 0.14), MED);
    for (const s of [1, -1]) pane(clW, clH, clS, mul(T(xm, 0, s * (hn + 0.38)), RY(s > 0 ? Math.PI : 0)), PAT);
  }
  for (let i = 0; i < 10; i++) { // 회랑 창
    const a = ((i + 0.5) / 10) * Math.PI, ap = rAmb + 0.28;
    pane(1.3, 4.4, 2.6, mul(T(xc + ap * Math.sin(a), 0, ap * Math.cos(a)), RY(a + Math.PI)), MED);
  }
  for (let i = 0; i < nCol; i++) { // 후진 고측창
    const a = ((i + 0.5) / nCol) * Math.PI, ap = rA * Math.cos(Math.PI / (2 * nCol)) + 0.42;
    pane(0.8, 3.0, arcTop + 1.6, mul(T(xc + ap * Math.sin(a), 0, ap * Math.cos(a)), RY(a + Math.PI)), STAND);
  }
  for (const s of [1, -1]) pane(2.6, 7.2, 3.2, mul(T((xT + xC) / 2, 0, s * (aw + 0.14)), RY(s > 0 ? Math.PI : 0)), STAND); // 익랑 큰 창
  const group = new THREE.Group();
  group.name = 'cathedral-interior';
  glassGeo.forEach((list, i) => { if (list.length) { const gm = new THREE.Mesh(mergeGeometries(list, false)!, glassMats[i]); gm.castShadow = true; group.add(gm); } });
  // 장미창(익랑 끝벽) + 돌 바퀴살
  const rt = tex(roseCanvas(7));
  const roseMat = new THREE.MeshStandardMaterial({ map: rt, emissive: 0xffffff, emissiveMap: rt, emissiveIntensity: 1.6, side: THREE.DoubleSide });
  for (const s of [1, -1]) {
    const M = mul(T((xT + xC) / 2, 15.2, s * (aw + 0.14)), RY(s > 0 ? Math.PI : 0));
    const m = new THREE.Mesh(new THREE.CircleGeometry(1.75, 48), roseMat);
    m.applyMatrix4(M); group.add(m);
    const ring = new THREE.Shape().absarc(0, 0, 2.0, 0, Math.PI * 2, false); ring.holes.push(new THREE.Path().absarc(0, 0, 1.7, 0, Math.PI * 2, true));
    B.add('dressed', new THREE.ExtrudeGeometry(ring, { depth: 0.14, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 40 }), mul(M, T(0, 0, 0.02)));
    const inner = new THREE.Shape().absarc(0, 0, 0.78, 0, Math.PI * 2, false); inner.holes.push(new THREE.Path().absarc(0, 0, 0.68, 0, Math.PI * 2, true));
    B.add('dressed', new THREE.ExtrudeGeometry(inner, { depth: 0.1, bevelEnabled: false, curveSegments: 32 }), mul(M, T(0, 0, 0.02)));
    for (let k = 0; k < 12; k++) B.add('dressed', new THREE.BoxGeometry(0.07, 1.0, 0.08).translate(0, 1.22, 0.06), mul(M, RZ((k / 12) * Math.PI * 2)));
  }

  // 사도화 판(아틀라스 한 장, 14칸)
  const apTex = tex(apostlesCanvas()); apTex.wrapS = apTex.wrapT = THREE.ClampToEdgeWrapping;
  const apGeo: THREE.BufferGeometry[] = [];
  let ai = 0;
  for (const sg of apseSeg) for (const u of [-0.82, 0.82]) {
    const g = new THREE.PlaneGeometry(0.7, 2.66);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setX(i, (ai + uv.getX(i)) / 14);
    g.rotateY(Math.PI).translate(u, arcTop + 2.65, -0.09).applyMatrix4(mul(T(sg.mid.x, 0, sg.mid.y), RY(-sg.ang)));
    apGeo.push(g.toNonIndexed()); ai++;
  }
  group.add(new THREE.Mesh(mergeGeometries(apGeo, false)!, new THREE.MeshStandardMaterial({ map: apTex, roughness: 0.45, metalness: 0.35, side: THREE.DoubleSide })));

  // 8) 성소: 제대 · 촛대 · 십자가와 고상 · 감실 · 성체등 · 독서대 · 주례석 · 꽃
  const xAlt = xT + 4.6;
  // 제대: 흰 대리석 몸체 + 앞면 첨두 아케이드 돋을새김 + 상판(둥근 모서리) + 제대보
  B.rbox('marble', xAlt - 0.5, xAlt + 0.5, SAN, SAN + 0.92, -1.35, 1.35, 0.03);
  for (let k = 0; k < 5; k++) {
    const z = -1.08 + k * 0.54, ar = pointed(0.42, 0.68, SAN + 0.1, 0); ar.holes.push(asPath(pointed(0.32, 0.6, SAN + 0.13, 0)));
    B.add('marble', new THREE.ExtrudeGeometry(ar, { depth: 0.05, bevelEnabled: false, curveSegments: 8 }), mul(T(xAlt - 0.5, 0, z), RY(-Math.PI / 2)));
    B.add('gold', new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8).translate(xAlt - 0.53, SAN + 0.37, z + 0.27));
  }
  B.rbox('gold', xAlt - 0.53, xAlt - 0.5, SAN + 0.3, SAN + 0.62, -0.025, 0.025, 0.005); B.rbox('gold', xAlt - 0.53, xAlt - 0.5, SAN + 0.48, SAN + 0.52, -0.12, 0.12, 0.005);
  B.rbox('marble', xAlt - 0.62, xAlt + 0.62, SAN + 0.92, SAN + 1.04, -1.5, 1.5, 0.04);
  B.rbox('cloth', xAlt - 0.63, xAlt + 0.63, SAN + 1.04, SAN + 1.055, -1.52, 1.52, 0.005);
  for (const s of [1, -1]) B.rbox('cloth', xAlt - 0.63, xAlt + 0.63, SAN + 0.6, SAN + 1.05, s * 1.52 - 0.008, s * 1.52 + 0.008, 0.004); // 양끝으로 늘어뜨린 천
  const stick = lathe([[0, 0], [0.13, 0], [0.13, 0.03], [0.06, 0.07], [0.04, 0.16], [0.07, 0.2], [0.03, 0.24], [0.025, 0.42], [0.06, 0.45], [0.07, 0.48], [0, 0.48]], 16);
  const flames: THREE.Vector3[] = [];
  for (const z of [-1.2, -0.7, 0.7, 1.2]) {
    B.add('gold', stick.clone().translate(xAlt + 0.32, SAN + 1.055, z));
    B.add('white', new THREE.CylinderGeometry(0.03, 0.032, 0.3, 10).translate(xAlt + 0.32, SAN + 1.68, z));
    flames.push(new THREE.Vector3(xAlt + 0.32, SAN + 1.86, z));
  }
  B.add('gold', stick.clone().scale(1, 0.4, 1).translate(xAlt + 0.05, SAN + 1.055, 0)); // 가운데 작은 십자 받침
  B.rbox('gold', xAlt + 0.035, xAlt + 0.065, SAN + 1.25, SAN + 1.6, -0.015, 0.015, 0.005); B.rbox('gold', xAlt + 0.035, xAlt + 0.065, SAN + 1.45, SAN + 1.49, -0.09, 0.09, 0.005);
  // 바닥 큰 촛대(제대 양옆)
  const tall = lathe([[0, 0], [0.22, 0], [0.22, 0.05], [0.1, 0.12], [0.06, 0.3], [0.09, 0.36], [0.04, 0.42], [0.035, 1.2], [0.07, 1.25], [0.1, 1.32], [0, 1.32]], 16);
  for (const s of [1, -1]) {
    B.add('gold', tall.clone().translate(xAlt - 0.9, SAN, s * 2.1));
    B.add('white', new THREE.CylinderGeometry(0.04, 0.042, 0.55, 10).translate(xAlt - 0.9, SAN + 1.6, s * 2.1));
    flames.push(new THREE.Vector3(xAlt - 0.9, SAN + 1.92, s * 2.1));
  }
  // 십자가(후진 앞, 높이 6.4 m) + 고상(양식화한 인체) + 명패
  const xCr = xc + 1.2, yb = SAN + 4.72;
  B.add('darkwood', new RoundedBoxGeometry(0.26, 6.4, 0.34, 2, 0.03).translate(xCr, SAN + 3.2, 0));
  B.add('darkwood', new RoundedBoxGeometry(0.26, 0.3, 3.1, 2, 0.03).translate(xCr, yb, 0));
  B.add('gold', new THREE.SphereGeometry(0.1, 12, 8).translate(xCr, SAN + 6.45, 0));
  for (const s of [1, -1]) B.add('gold', new THREE.SphereGeometry(0.1, 12, 8).translate(xCr, yb, s * 1.6));
  B.rbox('cloth', xCr - 0.18, xCr - 0.13, yb + 0.55, yb + 0.85, -0.28, 0.28, 0.01);
  B.add('darkwood', lathe([[0, 0], [0.5, 0], [0.45, 0.12], [0.3, 0.2], [0, 0.2]], 8).translate(xCr, SAN, 0));
  {
    const cx = xCr - 0.26; // 몸은 신랑 쪽(-x)을 향한다
    const torso = lathe([[0, 0], [0.12, 0], [0.14, 0.12], [0.16, 0.3], [0.19, 0.48], [0.17, 0.56], [0.08, 0.62], [0, 0.63]], 18).scale(1, 1, 1).applyMatrix4(new THREE.Matrix4().makeScale(0.62, 1, 1));
    B.add('skin', torso.translate(cx, yb - 1.18, 0));
    B.add('cloth', lathe([[0, 0], [0.19, 0], [0.17, 0.1], [0.15, 0.25], [0.13, 0.3], [0, 0.3]], 18).applyMatrix4(new THREE.Matrix4().makeScale(0.75, 1, 1)).translate(cx, yb - 1.45, 0));
    B.add('cloth', new THREE.ConeGeometry(0.08, 0.3, 8).rotateZ(0.2).translate(cx - 0.02, yb - 1.55, 0.14));
    for (const s of [1, -1]) {
      // 다리: 무릎에서 살짝 굽고 발에서 모인다
      const hip = new THREE.Vector3(cx, yb - 1.42, s * 0.08), knee = new THREE.Vector3(cx - 0.07, yb - 1.9, s * 0.06), foot = new THREE.Vector3(cx - 0.01, yb - 2.35, s * 0.015);
      for (const [a, b, r0, r1] of [[hip, knee, 0.085, 0.06], [knee, foot, 0.06, 0.04]] as const) {
        const L = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(0.5);
        const g = new THREE.CylinderGeometry(r0, r1, L, 10);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), b.clone().sub(a).normalize());
        B.add('skin', g, new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
      }
      B.add('skin', new THREE.SphereGeometry(0.05, 8, 6).scale(1.6, 0.6, 0.8).translate(cx - 0.04, yb - 2.37, s * 0.02));
      // 팔: 어깨 → 손(가로대 끝 쪽, 조금 처짐)
      const sh = new THREE.Vector3(cx, yb - 0.6, s * 0.2), el = new THREE.Vector3(cx - 0.02, yb - 0.3, s * 0.6), hd = new THREE.Vector3(cx - 0.02, yb - 0.05, s * 1.0);
      for (const [a, b, r0, r1] of [[sh, el, 0.065, 0.05], [el, hd, 0.05, 0.035]] as const) {
        const L = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(0.5);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        B.add('skin', new THREE.CylinderGeometry(r1, r0, L, 10), new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
      }
      B.add('skin', new THREE.SphereGeometry(0.05, 8, 6).scale(0.6, 1.3, 1.2).translate(cx - 0.02, yb, s * 1.04));
      B.add('iron', new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6).rotateZ(Math.PI / 2).translate(cx - 0.05, yb, s * 1.04));
    }
    // 머리: 오른쪽 아래로 기울임 + 머리카락 · 가시관
    const head = new THREE.Vector3(cx - 0.06, yb - 0.4, 0.07);
    B.add('skin', new THREE.SphereGeometry(0.105, 16, 12).scale(0.95, 1.15, 0.9).translate(head.x, head.y, head.z));
    B.add('darkwood', new THREE.SphereGeometry(0.115, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55).scale(1, 1.1, 0.95).rotateZ(-0.35).translate(head.x + 0.02, head.y + 0.02, head.z));
    B.add('darkwood', new THREE.TorusGeometry(0.11, 0.018, 5, 18).rotateX(Math.PI / 2).rotateX(0.35).translate(head.x + 0.01, head.y + 0.07, head.z));
    B.add('skin', new THREE.CylinderGeometry(0.05, 0.06, 0.12, 8).translate(cx - 0.02, yb - 0.52, 0.03));
  }
  // 감실(후진 안쪽 받침대 위) + 성체등(붉은 등, 사슬)
  const xTab = xc + 4.0;
  B.rbox('marble', xTab - 0.55, xTab + 0.55, SAN, SAN + 1.15, -0.75, 0.75, 0.03);
  for (const s of [1, -1]) { const ar = pointed(0.4, 0.75, SAN + 0.15, 0); B.add('marble', new THREE.ExtrudeGeometry(ar, { depth: 0.03, bevelEnabled: false }), mul(T(xTab - 0.56, 0, s * 0.38), RY(-Math.PI / 2))); }
  B.rbox('gold', xTab - 0.36, xTab + 0.36, SAN + 1.15, SAN + 1.9, -0.42, 0.42, 0.03);
  B.add('gold', lathe([[0, 0], [0.5, 0], [0.42, 0.12], [0.18, 0.32], [0.06, 0.4], [0.03, 0.6], [0, 0.6]], 4).rotateY(Math.PI / 4).translate(xTab, SAN + 1.9, 0));
  B.rbox('white', xTab - 0.38, xTab - 0.35, SAN + 1.3, SAN + 1.78, -0.26, 0.26, 0.01); // 문 휘장
  B.rbox('gold', xTab - 0.395, xTab - 0.38, SAN + 1.44, SAN + 1.66, -0.018, 0.018, 0.004); B.rbox('gold', xTab - 0.395, xTab - 0.38, SAN + 1.57, SAN + 1.6, -0.08, 0.08, 0.004);
  const lampAt = new THREE.Vector3(xTab - 1.4, SAN + 2.3, 1.3);
  B.add('gold', lathe([[0, 0], [0.12, 0.02], [0.14, 0.1], [0.09, 0.18], [0.05, 0.22], [0, 0.22]], 14).translate(lampAt.x, lampAt.y - 0.12, lampAt.z));
  B.box('iron', lampAt.x - 0.006, lampAt.x + 0.006, lampAt.y + 0.1, spring - 0.5, lampAt.z - 0.006, lampAt.z + 0.006);
  // 독서대(대리석 기둥 + 경사 받침) · 주례석(높은 등받이 첨두)
  B.add('marble', lathe([[0, 0], [0.32, 0], [0.32, 0.08], [0.18, 0.16], [0.14, 0.95], [0.3, 1.05], [0, 1.05]], 8).translate(xAlt - 1.0, SAN, 3.4));
  B.add('marble', new RoundedBoxGeometry(0.62, 0.06, 0.78, 2, 0.02).rotateZ(0.32).translate(xAlt - 1.0, SAN + 1.12, 3.4));
  B.add('gold', new THREE.BoxGeometry(0.02, 0.3, 0.28).translate(xAlt - 1.18, SAN + 0.6, 3.4));
  B.rbox('darkwood', xc - 0.6, xc + 0.15, SAN, SAN + 0.48, -0.42, 0.42, 0.02);
  B.rbox('red', xc - 0.58, xc + 0.08, SAN + 0.48, SAN + 0.56, -0.38, 0.38, 0.03);
  const back = pointed(0.84, 1.75, SAN + 0.48); back.holes.push(asPath(pointed(0.56, 1.3, SAN + 0.6)));
  B.add('darkwood', new THREE.ExtrudeGeometry(back, { depth: 0.08, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 }), mul(T(xc + 0.12, 0, 0), RY(-Math.PI / 2)));
  B.rbox('red', xc + 0.1, xc + 0.13, SAN + 0.6, SAN + 1.8, -0.28, 0.28, 0.01);
  for (const s of [1, -1]) B.rbox('darkwood', xc - 0.58, xc + 0.15, SAN + 0.48, SAN + 0.82, s * 0.42 - 0.04, s * 0.42 + 0.04, 0.02);
  // 꽃꽂이(성소 단 앞 양쪽): 항아리 + 가을 국화
  const urn = lathe([[0, 0], [0.2, 0], [0.22, 0.05], [0.16, 0.15], [0.14, 0.5], [0.26, 0.72], [0.28, 0.78], [0, 0.78]], 18);
  const fl = rng(77);
  for (const s of [1, -1]) {
    const fx = xSan + 0.45, fz = s * 4.4;
    B.add('bronze', urn.clone().translate(fx, SAN, fz));
    for (let k = 0; k < 70; k++) {
      const a = fl() * Math.PI * 2, rr = Math.sqrt(fl()) * 0.55, y = SAN + 0.85 + fl() * 0.55 + (0.55 - rr) * 0.5;
      const kk: K = fl() < 0.42 ? 'flowerY' : fl() < 0.6 ? 'flowerW' : fl() < 0.8 ? 'flowerR' : 'leaf';
      B.add(kk, new THREE.IcosahedronGeometry(kk === 'leaf' ? 0.07 : 0.06, 0).scale(1, kk === 'leaf' ? 0.4 : 0.7, 1).translate(fx + Math.cos(a) * rr * 0.8, y, fz + Math.sin(a) * rr));
    }
  }

  // 9) 성가대석 오르간(정문 위 2층): 첨두 난간 · 받침 기둥 · 케이스(탑 셋 + 평면 둘) · 파이프(입 · 발)
  const gx0 = x0, gx1 = x0 + 4.4, gy = F0 + 6.4;
  B.rbox('darkwood', gx0, gx1 + 0.05, gy - 0.4, gy, -hn, hn, 0.03);
  for (let i = 0; i < 4; i++) B.rbox('darkwood', gx0, gx1, gy - 0.6, gy - 0.4, -hn + (i * (2 * hn)) / 3 - 0.08, -hn + (i * (2 * hn)) / 3 + 0.08, 0.02);
  const rail = new THREE.Shape([V2(-hn, 0), V2(hn, 0), V2(hn, 1.0), V2(-hn, 1.0)]);
  for (let z = -hn + 0.55; z < hn - 0.3; z += 0.62) rail.holes.push(asPath(pointed(0.4, 0.72, 0.14, z)));
  B.add('darkwood', new THREE.ExtrudeGeometry(rail, { depth: 0.07, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1, curveSegments: 6 }), mul(T(gx1, gy, 0), RY(Math.PI / 2)));
  B.rbox('darkwood', gx1 - 0.1, gx1 + 0.12, gy + 1.0, gy + 1.1, -hn, hn, 0.03);
  B.rbox('wood', gx1 - 0.16, gx1 - 0.13, gy + 0.05, gy + 0.98, -hn, hn, 0.005); // 난간 첨두 투각 뒤 판(밝은 나무)
  B.rbox('gold', gx1 + 0.06, gx1 + 0.1, gy + 0.9, gy + 0.94, -hn, hn, 0.01);
  for (const s of [1, -1]) {
    B.add('dressed', new THREE.CylinderGeometry(0.28, 0.28, gy - 0.6 - F0, 16).translate(gx1 - 0.3, (F0 + gy - 0.6) / 2, s * 2.4));
    B.add('dressed', lathe([[0, 0], [0.3, 0], [0.42, 0.25], [0.46, 0.3], [0, 0.3]], 16).translate(gx1 - 0.3, gy - 0.9, s * 2.4));
  }
  const pipeX = gx0 + 2.1;
  const pipe = (x: number, z: number, h: number, rad: number, base: number) => {
    B.add('pipe', new THREE.ConeGeometry(rad, 0.34, 12).rotateZ(Math.PI).translate(x, base + 0.17, z)); // 발
    B.add('pipe', new THREE.CylinderGeometry(rad, rad, h, 14).translate(x, base + 0.34 + h / 2, z));
    B.box('iron', x + rad * 0.7, x + rad * 0.98, base + 0.38, base + 0.38 + rad * 1.6, z - rad * 0.45, z + rad * 0.45); // 입
    B.add('gold', new THREE.CylinderGeometry(rad * 1.02, rad * 1.02, 0.03, 14).translate(x, base + 0.38 + rad * 1.6 + 0.02, z));
  };
  for (const [zc, hBase, towerR] of [[0, 7.0, 1.0], [-3.6, 5.4, 0.8], [3.6, 5.4, 0.8]] as const) {
    // 탑: 반원으로 늘어선 파이프
    B.rbox('darkwood', gx0 + 0.5, pipeX - 0.42, gy, gy + hBase + 0.9, zc - towerR - 0.3, zc + towerR + 0.3, 0.04);
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI / 2 - (k / 8) * Math.PI, h = hBase - Math.abs(k - 4) * 0.22;
      pipe(pipeX - 0.25 + Math.cos(a) * towerR * 0.7, zc + Math.sin(a) * towerR, h, 0.085, gy + 0.6);
    }
    // 처마·꼭대기 장식
    B.add('darkwood', new THREE.CylinderGeometry(towerR + 0.25, towerR + 0.15, 0.3, 16, 1, false, 0, Math.PI).rotateY(0).translate(pipeX - 0.25, gy + hBase + 1.1, zc));
    for (let k = 0; k < 5; k++) B.add('gold', new THREE.ConeGeometry(0.07, 0.42, 8).translate(pipeX - 0.25 + Math.cos(Math.PI / 2 - (k / 4) * Math.PI) * (towerR + 0.1), gy + hBase + 1.46, zc + Math.sin(Math.PI / 2 - (k / 4) * Math.PI) * (towerR + 0.1)));
    B.rbox('darkwood', gx0 + 0.5, pipeX + 0.62, gy, gy + 0.6, zc - towerR - 0.3, zc + towerR + 0.3, 0.03);
  }
  for (const zc of [-1.8, 1.8]) { // 평면(탑 사이)
    for (let k = -3; k <= 3; k++) pipe(pipeX - 0.1, zc + k * 0.17, 4.2 - Math.abs(k) * 0.25 + (zc > 0 ? 0 : 0), 0.06, gy + 0.6);
    B.rbox('darkwood', gx0 + 0.5, pipeX - 0.2, gy, gy + 5.6, zc - 0.62, zc + 0.62, 0.03);
    B.rbox('darkwood', gx0 + 0.5, pipeX + 0.12, gy, gy + 0.6, zc - 0.62, zc + 0.62, 0.02);
    B.rbox('gold', pipeX - 0.1, pipeX + 0.02, gy + 5.2, gy + 5.3, zc - 0.62, zc + 0.62, 0.02);
  }

  // 10) 신도석(신랑 좌우 두 줄): 나무 단(마루) · 끝판(곡선 + 첨두 구멍) · 좌판 · 등받이 · 성서 선반 · 무릎틀(천)
  const P0 = F0 + 0.05;
  const pewX: number[] = [];
  for (let x = x0 + 6.4; x < xT + 0.4; x += 1.02) pewX.push(x);
  for (const s of [1, -1]) B.rbox('wood', pewX[0] - 0.55, pewX[pewX.length - 1] + 0.7, F0, P0, s > 0 ? 0.95 : -hn + 0.85, s > 0 ? hn - 0.85 : -0.95, 0.01);
  const endShape = new THREE.Shape();
  endShape.moveTo(-0.34, 0); endShape.lineTo(0.3, 0); endShape.lineTo(0.3, 0.6); endShape.quadraticCurveTo(0.3, 0.7, 0.2, 0.7); endShape.lineTo(-0.04, 0.7);
  endShape.quadraticCurveTo(-0.16, 0.72, -0.2, 0.86); endShape.lineTo(-0.23, 1.0); endShape.quadraticCurveTo(-0.26, 1.08, -0.34, 1.08); endShape.closePath();
  endShape.holes.push(asPath(pointed(0.11, 0.3, 0.2, -0.04)));
  const endGeo = new THREE.ExtrudeGeometry(endShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 6 });
  for (const x of pewX) for (const s of [1, -1]) {
    const zl = s > 0 ? 1.0 : -(hn - 0.95), zr = s > 0 ? hn - 0.95 : -1.0;
    B.rbox('wood', x - 0.22, x + 0.22, P0 + 0.41, P0 + 0.46, zl, zr, 0.015); // 좌판
    B.add('wood', new RoundedBoxGeometry(0.045, 0.5, zr - zl, 2, 0.012).rotateZ(0.12).translate(x - 0.25, P0 + 0.74, (zl + zr) / 2)); // 등받이(뒤로 기움)
    B.rbox('wood', x - 0.35, x - 0.24, P0 + 0.98, P0 + 1.03, zl, zr, 0.02); // 위 손잡이
    B.rbox('wood', x - 0.42, x - 0.3, P0 + 0.78, P0 + 0.8, zl, zr, 0.008); // 뒷사람 성서 선반
    B.rbox('kneel', x + 0.38, x + 0.56, P0 + 0.1, P0 + 0.19, zl + 0.05, zr - 0.05, 0.03); // 무릎틀
    B.rbox('wood', x - 0.3, x + 0.2, P0 + 0.04, P0 + 0.09, zl, zr, 0.01); // 아래 가로대
    for (const ze of [zl, zr]) B.add('darkwood', endGeo.clone(), T(x, P0, ze - 0.03));
  }
  // 가운데 통로 융단(자체 UV — 테두리가 길이 방향으로 흐르게)
  const carpetC = paint(128, 512, 54, (g, rr) => {
    g.fillStyle = '#7d171d'; g.fillRect(0, 0, 128, 512);
    g.fillStyle = '#c4a046'; g.fillRect(4, 0, 5, 512); g.fillRect(119, 0, 5, 512);
    g.fillStyle = '#5e1015'; g.fillRect(12, 0, 3, 512); g.fillRect(113, 0, 3, 512);
    for (let y = 0; y < 512; y += 64) { g.strokeStyle = '#9a2a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(64, y + 8); g.lineTo(96, y + 32); g.lineTo(64, y + 56); g.lineTo(32, y + 32); g.closePath(); g.stroke(); }
    speckle(g, rr, 128, 512, 4000, 0.06, 1);
  });
  const cTex = tex(carpetC);
  const cL = xSan - 1.1 - (x0 + 0.8);
  const cg = new THREE.PlaneGeometry(1.7, cL).rotateX(-Math.PI / 2).rotateY(Math.PI / 2).translate((x0 + 0.8 + xSan - 1.1) / 2, F0 + 0.012, 0);
  { const uv = cg.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (cL / 1.7) * 0.25); }
  cTex.wrapS = THREE.ClampToEdgeWrapping;
  const carpet = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ map: cTex, roughness: 1 }));
  carpet.receiveShadow = true; group.add(carpet);

  // 11) 측면 제대: 성모상(왼쪽 익랑) · 요셉상(오른쪽 익랑) — 옷 주름 · 감실 같은 첨두 벽감 · 봉헌초대
  const drape = (g: THREE.BufferGeometry, folds: number, amp: number) => {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(x, z), rr = Math.hypot(x, z);
      if (rr < 1e-4) continue;
      const k = 1 + amp * Math.sin(a * folds + y * 1.5) * Math.min(1, (1.6 - y) * 0.8);
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return g;
  };
  const statue = (x: number, z: number, robe: K, mantle: K, mary: boolean) => {
    const face = -Math.sign(z); // 성상은 익랑 가운데(신랑 쪽)를 바라본다
    // 벽감
    const niche = pointed(1.6, 4.2, F0); niche.holes.push(asPath(pointed(1.2, 3.8, F0 + 1.1)));
    B.add('dressed', new THREE.ExtrudeGeometry(niche, { depth: 0.2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), T(x, 0, z - face * 0.55));
    const nb = pointed(1.2, 3.8, F0 + 1.1);
    B.add(mary ? 'blue' : 'red', new THREE.ShapeGeometry(nb, 8), T(x, 0, z - face * 0.5));
    B.rbox('marble', x - 0.55, x + 0.55, F0, F0 + 1.1, z - 0.5, z + 0.5, 0.03);
    B.rbox('marble', x - 0.62, x + 0.62, F0 + 1.05, F0 + 1.14, z - 0.57, z + 0.57, 0.03);
    const y0 = F0 + 1.14;
    B.add(robe, drape(lathe([[0, 0], [0.34, 0], [0.37, 0.08], [0.31, 0.7], [0.25, 1.15], [0.23, 1.32], [0.17, 1.42], [0.07, 1.48], [0, 1.48]], 28), 9, 0.07).translate(x, y0, z));
    B.add(mantle, drape(new THREE.CylinderGeometry(0.27, 0.43, 1.25, 28, 6, true, Math.PI * 0.2 + (face < 0 ? Math.PI : 0), Math.PI * 1.6), 7, 0.08).translate(x, y0 + 0.78, z));
    const hy = y0 + 1.6;
    B.add('skin', new THREE.SphereGeometry(0.11, 16, 12).scale(0.92, 1.12, 0.92).translate(x, hy, z));
    if (mary) B.add(mantle, new THREE.SphereGeometry(0.135, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62).scale(1, 1.15, 1).translate(x, hy + 0.01, z - face * 0.015));
    else B.add('darkwood', new THREE.SphereGeometry(0.118, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5).translate(x, hy + 0.02, z));
    // 손(가슴 앞에 모음) · 요셉은 백합 지팡이
    B.add('skin', new THREE.SphereGeometry(0.05, 10, 8).scale(1, 1.4, 0.8).translate(x, y0 + 1.2, z + face * 0.26));
    if (!mary) { B.add('leaf', new THREE.CylinderGeometry(0.01, 0.01, 1.0, 6).translate(x + 0.12, y0 + 1.3, z + face * 0.28)); for (let k = 0; k < 4; k++) B.add('flowerW', new THREE.ConeGeometry(0.04, 0.09, 6).translate(x + 0.12, y0 + 1.72 + k * 0.05, z + face * 0.28)); }
    B.add('gold', new THREE.TorusGeometry(0.24, 0.015, 6, 32), T(x, hy + 0.12, z - face * 0.12));
    if (mary) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; B.add('gold', new THREE.OctahedronGeometry(0.025), T(x + Math.cos(a) * 0.24, hy + 0.12 + Math.sin(a) * 0.24, z - face * 0.12)); }
  };
  const xSide = xT + 1.75; // 익랑 끝벽 큰 창 옆(창을 가리지 않게)
  statue(xSide, -(aw - 0.9), 'white', 'blue', true);
  statue(xSide, aw - 0.9, 'skin', 'darkwood', false);
  for (const s of [1, -1]) {
    const z = s * (aw - 2.6);
    // 봉헌초대: 철 받침 계단 2단 + 작은 초 28
    B.rbox('iron', xSide - 1.25, xSide + 1.25, F0, F0 + 0.8, z - 0.3, z + 0.3, 0.02);
    B.rbox('iron', xSide - 1.25, xSide + 1.25, F0 + 0.8, F0 + 0.95, z + (s > 0 ? -0.3 : 0), z + (s > 0 ? 0 : 0.3), 0.02);
    for (let i = 0; i < 28; i++) {
      const row = Math.floor(i / 14), fx = xSide - 1.15 + (i % 14) * 0.177, fz = z + (s > 0 ? 1 : -1) * (row ? -0.15 : 0.15), fy = F0 + (row ? 0.95 : 0.8);
      B.add('white', new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10).translate(fx, fy + 0.025, fz));
      B.add('gold', new THREE.CylinderGeometry(0.04, 0.04, 0.012, 10).translate(fx, fy + 0.006, fz));
      if (r() < 0.8) flames.push(new THREE.Vector3(fx, fy + 0.085, fz));
    }
  }

  // 12) 청동 «십자가의 길» 14처(측랑 벽, 정면 왼쪽부터) · 성수대 · 고해소
  const st = stationsCanvases();
  const stMat = new THREE.MeshStandardMaterial({ map: tex(st.map), normalMap: normalOf(st.hgt, 3), metalness: 0.75, roughness: 0.42, side: THREE.DoubleSide });
  (stMat.map as THREE.Texture).wrapS = THREE.ClampToEdgeWrapping;
  const stGeo: THREE.BufferGeometry[] = [];
  const stX: number[] = [];
  for (let i = 0; i < bays; i++) stX.push(x0 + (i + 0.5) * bay + 1.85);
  stX.push(x0 + 0.5 * bay - 1.85, x0 + 1.5 * bay - 1.85);
  stX.sort((a, b) => a - b);
  let si = 0;
  for (const s of [-1, 1]) {
    const xs = s < 0 ? stX : stX.slice().reverse();
    for (const x of xs) {
      const z = s * (aw - 0.07), y = F0 + 2.05;
      const g = new THREE.PlaneGeometry(0.6, 0.75);
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setX(i, (si + uv.getX(i)) / 14);
      g.translate(0, y + 0.375, 0).applyMatrix4(mul(T(x, 0, z), RY(s > 0 ? Math.PI : 0)));
      stGeo.push(g.toNonIndexed());
      B.rbox('bronze', x - 0.36, x + 0.36, y - 0.06, y + 0.81, s > 0 ? z + 0.002 : z - 0.06, s > 0 ? z + 0.06 : z - 0.002, 0.02);
      B.rbox('bronze', x - 0.02, x + 0.02, y + 0.84, y + 1.1, s > 0 ? z : z - 0.05, s > 0 ? z + 0.05 : z, 0.008);
      B.rbox('bronze', x - 0.09, x + 0.09, y + 1.0, y + 1.04, s > 0 ? z : z - 0.05, s > 0 ? z + 0.05 : z, 0.008);
      si++;
    }
  }
  group.add(new THREE.Mesh(mergeGeometries(stGeo, false)!, stMat));
  const font = lathe([[0, 0], [0.24, 0], [0.24, 0.06], [0.12, 0.12], [0.09, 0.75], [0.16, 0.8], [0.36, 0.92], [0.4, 1.02], [0.36, 1.04], [0.3, 0.96], [0, 0.96]], 24);
  for (const s of [1, -1]) {
    B.add('marble', font.clone().translate(x0 + 1.4, F0, s * 2.8));
    // 고해소: 세 칸(가운데 사제석 · 양옆 무릎 칸) · 첨두 판 · 작은 탑 장식 · 휘장
    const cx = x0 + bay * 3.5, cz = s * (aw - 0.75), dz = s > 0 ? -1 : 1;
    B.rbox('darkwood', cx - 1.25, cx + 1.25, F0, F0 + 2.55, cz - 0.6, cz + 0.6, 0.03);
    B.rbox('darkwood', cx - 1.33, cx + 1.33, F0 + 2.55, F0 + 2.75, cz - 0.68, cz + 0.68, 0.04);
    for (const ox of [-0.83, 0, 0.83]) {
      const p = pointed(0.62, 2.1, F0 + 0.15, 0);
      if (ox === 0) B.add('darkwood', new THREE.ExtrudeGeometry(p, { depth: 0.04, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 }), T(cx + ox, 0, cz + dz * 0.62 - (dz > 0 ? 0 : 0.04)));
      else B.add('red', new THREE.ShapeGeometry(p, 8), T(cx + ox, 0, cz + dz * 0.61));
      B.add('gold', new THREE.ConeGeometry(0.06, 0.45, 4).translate(cx + ox, F0 + 3.0, cz));
    }
    for (const ox of [-1.25, -0.41, 0.41, 1.25]) B.rbox('darkwood', cx + ox - 0.05, cx + ox + 0.05, F0, F0 + 2.55, cz + dz * 0.6 - 0.03, cz + dz * 0.6 + 0.03, 0.01);
  }

  // 13) 샹들리에(신랑 두 줄): 쇠사슬 · 두 겹 고리 · 초 모양 전구
  const lampPos: THREE.Vector3[] = [];
  for (let i = 0; i < bays; i++) for (const s of [1, -1]) lampPos.push(new THREE.Vector3(x0 + (i + 0.5) * bay, 6.9, s * 2.9));
  const bulbsAt: THREE.Vector3[] = [];
  for (const p of lampPos) {
    B.box('iron', p.x - 0.008, p.x + 0.008, p.y + 1.0, spring + 3, p.z - 0.008, p.z + 0.008);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; ribAlong(B, [new THREE.Vector3(p.x, p.y + 1.0, p.z), new THREE.Vector3(p.x + Math.cos(a) * 0.5, p.y + 0.1, p.z + Math.sin(a) * 0.5)], 'iron', 0.06); }
    B.add('gold', lathe([[0, -0.22], [0.035, -0.2], [0.06, -0.08], [0.04, 0.1], [0.022, 0.5], [0.035, 1.0], [0, 1.02]], 12).translate(p.x, p.y, p.z));
    for (const [R, dy, n] of [[0.62, 0, 10], [0.36, 0.42, 6]] as const) {
      B.add('gold', new THREE.TorusGeometry(R, 0.022, 6, 32).rotateX(Math.PI / 2).translate(p.x, p.y + dy, p.z));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2, bx = p.x + Math.cos(a) * R, bz = p.z + Math.sin(a) * R;
        B.add('gold', new THREE.CylinderGeometry(0.035, 0.02, 0.05, 8).translate(bx, p.y + dy + 0.03, bz));
        B.add('white', new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8).translate(bx, p.y + dy + 0.12, bz));
        bulbsAt.push(new THREE.Vector3(bx, p.y + dy + 0.22, bz));
      }
    }
  }

  // ── 메시 · 빛나는 것 · 조명 ─────────────────────────────────────────
  const M = mats();
  for (const m of B.build(M)) group.add(m);
  const glow = new THREE.MeshStandardMaterial({ color: 0xffd38a, emissive: 0xffb347, emissiveIntensity: 3.2 });
  const flameGeo = mergeGeometries(flames.map((f) => new THREE.SphereGeometry(0.018, 6, 5).scale(1, 2.2, 1).translate(f.x, f.y, f.z).toNonIndexed()), false)!;
  group.add(new THREE.Mesh(flameGeo, glow));
  const bulbGeo = mergeGeometries(bulbsAt.map((b) => new THREE.SphereGeometry(0.03, 8, 6).scale(1, 1.6, 1).translate(b.x, b.y, b.z).toNonIndexed()), false)!;
  group.add(new THREE.Mesh(bulbGeo, new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffd9a0, emissiveIntensity: 4 })));
  const sanct = new THREE.Mesh(lathe([[0, 0], [0.07, 0.02], [0.1, 0.1], [0.08, 0.18], [0, 0.2]], 14), new THREE.MeshStandardMaterial({ color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 3, transparent: true, opacity: 0.9 }));
  sanct.position.copy(lampAt).setY(lampAt.y - 0.32); group.add(sanct);

  const lights = new THREE.Group();
  lights.name = 'interior-lights';
  for (const [i, p] of lampPos.entries()) if (i % 2 === 0 || i === lampPos.length - 1) { const l = new THREE.PointLight(0xffc98a, 30, 16, 1.7); l.position.copy(p).setY(p.y + 0.1); lights.add(l); }
  const altarLight = new THREE.SpotLight(0xfff0d6, 300, 32, 0.38, 0.65, 1.4);
  altarLight.position.set(xAlt - 5, top - 1.5, 0); altarLight.target.position.set(xAlt + 1.2, SAN + 1.6, 0);
  altarLight.castShadow = true; altarLight.shadow.mapSize.set(1024, 1024); altarLight.shadow.bias = -0.0004;
  lights.add(altarLight, altarLight.target);
  const crossLight = new THREE.SpotLight(0xffe6c0, 120, 18, 0.3, 0.7, 1.4);
  crossLight.position.set(xT, spring - 1, 0); crossLight.target.position.set(xCr, SAN + 4, 0);
  lights.add(crossLight, crossLight.target);
  for (const s of [1, -1]) { const l = new THREE.PointLight(0xffa850, 8, 6, 1.6); l.position.set(xSide, F0 + 1.4, s * (aw - 2.6)); lights.add(l); }
  for (const s of [1, -1]) { const l = new THREE.PointLight(0xfff0dd, 14, 9, 1.8); l.position.set(xSide + 0.6, F0 + 4.2, s * (aw - 2.4)); lights.add(l); } // 성상 비춤
  const apseFill = new THREE.PointLight(0xffe0b0, 25, 14, 1.6); apseFill.position.set(xc + 1, arcTop + 3, 0); lights.add(apseFill);
  lights.add(new THREE.HemisphereLight(0xe9edf0, 0xc4b296, 0.6)); // 창으로 드는 낮빛(위) · 바닥 반사(아래)
  // 정문 밖 한낮 — 실내에서 보면 문 너머가 밝게 날아간다(실내에서만 켠다)
  const dayGrad = paint(64, 256, 3, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#dfe9f2'); gr.addColorStop(0.55, '#f4efe4'); gr.addColorStop(1, '#cbbfa8'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
  const dayTex = tex(dayGrad);
  const day = new THREE.Mesh(new THREE.PlaneGeometry(hwP * 2, 7.2), new THREE.MeshBasicMaterial({ map: dayTex, color: new THREE.Color(1.6, 1.6, 1.6), fog: false }));
  day.rotation.y = Math.PI / 2; day.position.set(porch0 - 0.4, F0 + 3.4, 0); lights.add(day);
  group.add(lights);

  // ── 창빛(볼륨 줄기 + 바닥에 떨어지는 색 빛) ───────────────────────────
  const sunlight = new THREE.Group();
  sunlight.name = 'interior-sunlight';
  lights.add(sunlight);
  const shaftMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0xffe3b8) }, uStrength: { value: 0.3 } },
    vertexShader: 'attribute float t; varying float vt; void main(){ vt = t; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uColor; uniform float uStrength; varying float vt; void main(){ float a = uStrength * pow(1.0 - vt, 1.4) * smoothstep(0.0, 0.06, vt); gl_FragColor = vec4(uColor * a, a); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const poolMats = glassMats.map((gm) => new THREE.MeshBasicMaterial({ map: gm.map, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2 }));

  function setSun(dirLocal: THREE.Vector3) {
    sunlight.clear();
    const dsun = dirLocal.clone().normalize();
    if (dsun.y <= 0.05) return;
    const travel = dsun.clone().negate(); // 빛이 나아가는 방향
    const shaftPos: number[] = [], shaftT: number[] = [];
    const pools: THREE.BufferGeometry[][] = glassMats.map(() => []);
    const floorY = F0 + 0.02;
    const inside = (p: THREE.Vector3) => p.x > x0 + 0.2 && p.x < xc - 0.2 && Math.abs(p.z) < aw - 0.2;
    for (const p of panes) {
      const facing = travel.dot(p.n);
      if (facing < 0.12) continue; // 해가 이 창 바깥쪽에 있지 않다
      const c = p.outline.reduce((a, b) => a.clone().add(b), new THREE.Vector3()).multiplyScalar(1 / p.outline.length);
      if (c.x > xC - 0.5) continue; // 후진·회랑 창은 기둥 숲에 막혀 줄기를 만들지 않는다
      const tFloor = (c.y - floorY) / -travel.y;
      // 맞은편 벽에서 멈춘다(빛줄기가 벽을 뚫지 않게)
      let tEnd = tFloor;
      if (travel.z !== 0) for (const zw of [aw - 0.1, -aw + 0.1]) { const t = (zw - c.z) / travel.z; if (t > 0.5 && t < tEnd) tEnd = t; }
      if (Math.abs(c.z) < aw - 1 && travel.z !== 0) { // 고측창: 맞은편 아케이드 벽(아치 위 벽체)에서 멈춘다
        const t = (-Math.sign(c.z) * hn - c.z) / travel.z;
        if (t > 0.5 && c.y + travel.y * t > arcTop && t < tEnd) tEnd = t;
      }
      const reach = Math.min(tEnd, 40);
      for (let i = 1; i < p.outline.length; i++) {
        const a = p.outline[i - 1], b = p.outline[i];
        const a2 = a.clone().addScaledVector(travel, reach), b2 = b.clone().addScaledVector(travel, reach);
        shaftPos.push(a.x, a.y, a.z, b.x, b.y, b.z, b2.x, b2.y, b2.z, a.x, a.y, a.z, b2.x, b2.y, b2.z, a2.x, a2.y, a2.z);
        shaftT.push(0, 0, 1, 0, 1, 1);
      }
      if (tFloor <= tEnd + 0.01) {
        const g = p.geo.clone(), pos = g.attributes.position;
        let ok = true;
        for (let i = 0; i < pos.count; i++) {
          const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
          const t = (v.y - floorY) / -travel.y;
          v.addScaledVector(travel, t);
          if (!inside(v)) { ok = false; break; }
          pos.setXYZ(i, v.x, floorY, v.z);
        }
        if (ok) { g.deleteAttribute('normal'); pools[p.mat].push(g); } else g.dispose();
      }
    }
    if (shaftPos.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(shaftPos, 3));
      g.setAttribute('t', new THREE.Float32BufferAttribute(shaftT, 1));
      const m = new THREE.Mesh(g, shaftMat); m.frustumCulled = false; m.renderOrder = 10; sunlight.add(m);
    }
    pools.forEach((list, i) => { if (list.length) { const m = new THREE.Mesh(mergeGeometries(list, false)!, poolMats[i]); m.renderOrder = 9; sunlight.add(m); } });
  }

  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  return {
    group,
    lights,
    sunlight,
    setSun,
    probe: V((x0 + xT) / 2, 4.5, 0),
    views: {
      nave: { pos: V(x0 + 1.5, F0 + 1.7, 0), target: V(xc, 5.5, 0) },
      altar: { pos: V(xT + 0.2, SAN + 1.7, 3.2), target: V(xc + 1, SAN + 3.5, -0.4) },
      organ: { pos: V(xT - 2, F0 + 1.7, 1.5), target: V(x0, gy + 3.5, 0) },
      aisle: { pos: V(x0 + 1.2, F0 + 1.7, (hn + aw) / 2), target: V(xT + 2, 4, (hn + aw) / 2 - 1) },
      vault: { pos: V((x0 + xT) / 2, F0 + 1.7, 0), target: V((x0 + xT) / 2 + 3, top, 0.1) },
    },
  };
}
