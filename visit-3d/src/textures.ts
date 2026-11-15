// 모든 텍스처를 캔버스로 직접 그린다 — 외부 사진·스캔을 쓰지 않으므로 권리 문제가 없다.
// UV 는 «미터» 단위다(geo.ts). repeatMeters = 텍스처 한 장이 덮는 실제 길이.
import * as THREE from 'three';

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}

function toTexture(c: HTMLCanvasElement, repeatMeters?: number, color = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  if (repeatMeters) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / repeatMeters, 1 / repeatMeters);
  }
  t.anisotropy = 8;
  return t;
}

function grain(x: CanvasRenderingContext2D, w: number, h: number, amount: number, r: () => number) {
  const img = x.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
}

/** 붉은 벽돌 + 회색 벽돌 띠 (2m 반복) */
export function brick() {
  const [c, x] = canvas(512, 512), r = rng(7);
  x.fillStyle = '#9b958a'; x.fillRect(0, 0, 512, 512);
  const rows = 26, cols = 8, bh = 512 / rows, bw = 512 / cols;
  for (let j = 0; j < rows; j++) {
    const grey = j % 13 === 6 || j % 13 === 7;
    const off = (j % 2) * bw / 2;
    for (let i = -1; i <= cols; i++) {
      const [R, G, B] = grey ? [118 + r() * 14, 116 + r() * 12, 110 + r() * 10] : [148 + r() * 34, 60 + r() * 20, 46 + r() * 14];
      x.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
      x.fillRect(i * bw + off + 1.6, j * bh + 1.6, bw - 3.2, bh - 3.2);
    }
  }
  grain(x, 512, 512, 22, r);
  return toTexture(c, 2);
}

/** 밝은 석재 (2m) */
export function stone(seed = 3, base = [196, 190, 178]) {
  const [c, x] = canvas(256, 256), r = rng(seed);
  x.fillStyle = `rgb(${base.join(',')})`; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '90,84,76'},${0.04 + r() * 0.05})`;
    x.beginPath(); x.arc(r() * 256, r() * 256, 2 + r() * 14, 0, Math.PI * 2); x.fill();
  }
  grain(x, 256, 256, 16, r);
  return toTexture(c, 2);
}

/** 성모 동굴 바위(쌓은 네모 돌) — 거친 돌 면: 잔점·움푹한 자국·금·이끼 기 (한 면에 한 장) v3-5 */
const RK: { map?: THREE.CanvasTexture; bump?: THREE.CanvasTexture } = {};
export function rock() { if (!RK.map) buildRock(); return RK.map!; }
export function rockBump() { if (!RK.bump) buildRock(); return RK.bump!; }
function buildRock() {
  const S = 512, [c, x] = canvas(S, S), [cb, xb] = canvas(S, S), r = rng(53);
  x.fillStyle = 'rgb(150,142,130)'; x.fillRect(0, 0, S, S);
  xb.fillStyle = '#9a9a9a'; xb.fillRect(0, 0, S, S);
  // 잔점
  for (let i = 0; i < 30000; i++) { const k = r(); x.fillStyle = k < 0.5 ? `rgba(60,54,48,${0.2 + r() * 0.3})` : `rgba(230,224,212,${0.15 + r() * 0.25})`; const sz = 1 + r() * 2.5; x.fillRect(r() * S, r() * S, sz, sz); const v = 110 + r() * 80; xb.fillStyle = `rgba(${v | 0},${v | 0},${v | 0},0.6)`; xb.fillRect(r() * S, r() * S, sz, sz); }
  // 움푹한 자국(어두운 가장자리·밝은 아래)
  for (let i = 0; i < 90; i++) { const gx = r() * S, gy = r() * S, R0 = 6 + r() * 26; let g = x.createRadialGradient(gx, gy, 0, gx, gy, R0); g.addColorStop(0, 'rgba(50,44,40,0.35)'); g.addColorStop(0.7, 'rgba(50,44,40,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(gx - R0, gy - R0, R0 * 2, R0 * 2); g = xb.createRadialGradient(gx, gy, 0, gx, gy, R0); g.addColorStop(0, 'rgba(30,30,30,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); xb.fillStyle = g; xb.fillRect(gx - R0, gy - R0, R0 * 2, R0 * 2); }
  // 금(가는 어두운 선)
  for (let i = 0; i < 14; i++) { x.strokeStyle = `rgba(40,34,30,${0.3 + r() * 0.3})`; x.lineWidth = 0.8 + r() * 1.2; xb.strokeStyle = '#303030'; xb.lineWidth = 2; let px = r() * S, py = r() * S; x.beginPath(); x.moveTo(px, py); xb.beginPath(); xb.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (r() - 0.5) * 60; py += (r() - 0.5) * 60; x.lineTo(px, py); xb.lineTo(px, py); } x.stroke(); xb.stroke(); }
  // 이끼·물때 기(아래쪽에 옅은 녹갈색)
  for (let i = 0; i < 10; i++) { const gx = r() * S, gy = S * (0.5 + r() * 0.5), R0 = 30 + r() * 70; const g = x.createRadialGradient(gx, gy, 0, gx, gy, R0); g.addColorStop(0, 'rgba(70,80,40,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(gx - R0, gy - R0, R0 * 2, R0 * 2); }
  // 모서리 어둡게(돌 테두리 그늘)
  const edge = x.createRadialGradient(S / 2, S / 2, S * 0.35, S / 2, S / 2, S * 0.72); edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(20,16,14,0.45)'); x.fillStyle = edge; x.fillRect(0, 0, S, S);
  grain(x, S, S, 14, r);
  RK.map = toTexture(c); RK.bump = toTexture(cb, undefined, false);
}

/** 대리석 바둑판 바닥 (2.4m = 0.6m 판 4×4) */
export function marble() {
  const [c, x] = canvas(512, 512), r = rng(11);
  const n = 4, s = 512 / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    x.fillStyle = (i + j) % 2 ? '#d9d2c3' : '#8f8778';
    x.fillRect(i * s, j * s, s, s);
  }
  x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 1.5;
  for (let k = 0; k < 40; k++) {
    x.beginPath(); let px = r() * 512, py = r() * 512; x.moveTo(px, py);
    for (let t = 0; t < 6; t++) { px += (r() - 0.5) * 80; py += (r() - 0.5) * 80; x.lineTo(px, py); }
    x.stroke();
  }
  x.strokeStyle = 'rgba(40,36,30,0.5)'; x.lineWidth = 2;
  for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, 512); x.moveTo(0, i * s); x.lineTo(512, i * s); x.stroke(); }
  grain(x, 512, 512, 10, r);
  return toTexture(c, 2.4);
}

/** 볼트 천장 회벽 — 옅은 청회색 (4m) */
export function plaster(tint = [176, 186, 198]) {
  const [c, x] = canvas(256, 256), r = rng(5);
  x.fillStyle = `rgb(${tint.join(',')})`; x.fillRect(0, 0, 256, 256);
  grain(x, 256, 256, 12, r);
  return toTexture(c, 4);
}

/** 짙은 나무 (1m) */
export function wood(dark = false) {
  // v3-4: 긴 물결 결 + 옹이 + 판 이음(1 m 타일, 512 px) — 니스 칠한 마호가니/참나무
  const S = 512, [c, x] = canvas(S, S), r = rng(dark ? 21 : 13);
  const base = dark ? [74, 44, 26] : [122, 74, 42];
  x.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; x.fillRect(0, 0, S, S);
  // 판 4장(세로 결), 판마다 톤이 조금 다르다
  const planks = 4, pw = S / planks;
  for (let p = 0; p < planks; p++) {
    const k = 0.9 + r() * 0.2;
    x.fillStyle = `rgba(${(base[0] * k) | 0},${(base[1] * k) | 0},${(base[2] * k) | 0},0.9)`; x.fillRect(p * pw, 0, pw, S);
    // 결: 세로로 흐르는 물결 선(어두운 선·밝은 선 번갈아)
    const ph = r() * 10, freq = 0.012 + r() * 0.01;
    for (let i = 0; i < 70; i++) {
      const x0 = p * pw + r() * pw, dark1 = r() < 0.6;
      x.strokeStyle = dark1 ? `rgba(30,14,4,${0.08 + r() * 0.16})` : `rgba(210,160,110,${0.05 + r() * 0.1})`; x.lineWidth = 0.6 + r() * 1.6;
      x.beginPath(); x.moveTo(x0, 0);
      for (let y = 0; y <= S; y += 8) x.lineTo(x0 + Math.sin(y * freq + ph + i) * (2 + r() * 3) + Math.sin(y * 0.003 + i) * 6, y);
      x.stroke();
    }
    // 옹이 1~2개
    for (let q = 0, n = r() < 0.5 ? 1 : 2; q < n; q++) {
      const kx = p * pw + pw * (0.25 + r() * 0.5), ky = r() * S, kr = 6 + r() * 10;
      for (let ring = 5; ring >= 1; ring--) { x.strokeStyle = `rgba(30,14,4,${0.12 + ring * 0.03})`; x.lineWidth = 1; x.beginPath(); x.ellipse(kx, ky, kr * ring / 5 * 0.7, kr * ring / 5 * 1.3, 0.2, 0, Math.PI * 2); x.stroke(); }
      x.fillStyle = 'rgba(25,10,2,0.45)'; x.beginPath(); x.ellipse(kx, ky, kr * 0.25, kr * 0.45, 0.2, 0, Math.PI * 2); x.fill();
    }
    // 판 이음 (어두운 선 + 밝은 모서리)
    x.fillStyle = 'rgba(20,10,4,0.55)'; x.fillRect(p * pw, 0, 1.5, S);
    x.fillStyle = 'rgba(255,220,180,0.10)'; x.fillRect(p * pw + 1.5, 0, 1, S);
  }
  grain(x, S, S, 8, r);
  return toTexture(c, 1);
}

/** 지붕 슬레이트 (2m) */
export function slate() {
  const [c, x] = canvas(256, 256), r = rng(17);
  x.fillStyle = '#3f464d'; x.fillRect(0, 0, 256, 256);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 8; i++) {
    const v = 52 + r() * 22;
    x.fillStyle = `rgb(${v | 0},${(v + 6) | 0},${(v + 12) | 0})`;
    x.fillRect(i * 32 + (j % 2) * 16 + 1, j * 16 + 1, 30, 14);
  }
  return toTexture(c, 2);
}

/** 마당 포석 (3m) */
export function paving() {
  const [c, x] = canvas(512, 512), r = rng(29);
  x.fillStyle = '#6f6a62'; x.fillRect(0, 0, 512, 512);
  const n = 6, s = 512 / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const v = 150 + r() * 40;
    x.fillStyle = `rgb(${v | 0},${(v - 6) | 0},${(v - 14) | 0})`;
    x.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
  }
  grain(x, 512, 512, 18, r);
  return toTexture(c, 3);
}

/** 잔디 (4m) */
export function grass() {
  const [c, x] = canvas(256, 256), r = rng(31);
  x.fillStyle = '#4f7a3a'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    x.fillStyle = `rgba(${r() < 0.5 ? '90,140,60' : '40,70,30'},0.5)`;
    x.fillRect(r() * 256, r() * 256, 1.5, 3 + r() * 3);
  }
  return toTexture(c, 4);
}

const JEWEL = ['#1d3fa8', '#2856c9', '#b3122e', '#d4a017', '#1f7a3e', '#6a2c91', '#e0b83c', '#123a7a', '#c4441a'];

/** 스테인드글라스 — 마름모 격자 + 가운데 원형 메달리온 (특정 작품을 옮기지 않은 기하 문양) */
export function stainedGlass(seed: number) {
  const W = 256, H = 512, [c, x] = canvas(W, H), r = rng(seed);
  x.fillStyle = '#111'; x.fillRect(0, 0, W, H);
  const cell = 32;
  for (let j = -1; j < H / cell + 1; j++) for (let i = -1; i < W / cell + 1; i++) {
    const cx = i * cell + (j % 2) * cell / 2, cy = j * cell * 0.75;
    x.fillStyle = JEWEL[Math.floor(r() * 4)] ;
    x.beginPath(); x.moveTo(cx, cy - cell / 2); x.lineTo(cx + cell / 2, cy); x.lineTo(cx, cy + cell / 2); x.lineTo(cx - cell / 2, cy); x.closePath();
    x.fill(); x.strokeStyle = '#151515'; x.lineWidth = 3; x.stroke();
  }
  const mx = W / 2, my = H * 0.58, R = 92, k = 8;
  for (let i = 0; i < k; i++) {
    x.fillStyle = JEWEL[(i + Math.floor(r() * 9)) % JEWEL.length];
    x.beginPath(); x.moveTo(mx, my); x.arc(mx, my, R, (i / k) * Math.PI * 2, ((i + 1) / k) * Math.PI * 2); x.closePath(); x.fill();
    x.strokeStyle = '#151515'; x.lineWidth = 4; x.stroke();
  }
  x.fillStyle = '#e8c547'; x.beginPath(); x.arc(mx, my, R * 0.3, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#151515'; x.lineWidth = 5; x.beginPath(); x.arc(mx, my, R, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.arc(mx, my, R * 0.3, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 10; x.strokeRect(0, 0, W, H);
  return toTexture(c);
}

/** 장미창 — 방사형 12잎 */
export function roseWindow() {
  const S = 512, [c, x] = canvas(S, S), m = S / 2;
  x.fillStyle = '#111'; x.fillRect(0, 0, S, S);
  const ring = (r0: number, r1: number, n: number, colors: string[], rot = 0) => {
    for (let i = 0; i < n; i++) {
      const a0 = rot + (i / n) * Math.PI * 2, a1 = rot + ((i + 1) / n) * Math.PI * 2;
      x.fillStyle = colors[i % colors.length];
      x.beginPath(); x.arc(m, m, r1, a0, a1); x.arc(m, m, r0, a1, a0, true); x.closePath(); x.fill();
      x.strokeStyle = '#141414'; x.lineWidth = 5; x.stroke();
    }
  };
  ring(170, 250, 24, ['#1d3fa8', '#b3122e', '#1d3fa8', '#d4a017']);
  ring(80, 170, 12, ['#2856c9', '#6a2c91', '#1f7a3e', '#c4441a'], Math.PI / 12);
  ring(30, 80, 6, ['#e0b83c', '#b3122e']);
  x.fillStyle = '#e8c547'; x.beginPath(); x.arc(m, m, 30, 0, Math.PI * 2); x.fill();
  return toTexture(c);
}

/** 빛 번짐 (가산 혼합용) */
export function glow() {
  const S = 128, [c, x] = canvas(S, S);
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return toTexture(c);
}

/** 글자 판 (안내판 · 십자가의 길 표지) */
export function textPanel(lines: string[], w = 512, h = 320, bg = '#2b2620', fg = '#f1e6cf') {
  const [c, x] = canvas(w, h);
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#b08d57'; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20);
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  const lh = (h - 60) / Math.max(lines.length, 1);
  lines.forEach((t, i) => {
    x.font = `${i === 0 ? 'bold ' : ''}${Math.min(i === 0 ? 46 : 30, lh * 0.7)}px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
    x.fillText(t, w / 2, 30 + lh * (i + 0.5));
  });
  return toTexture(c);
}

const KID_TITLES = ['우리 집과 해님', '무지개 다리', '꽃밭에서', '바다 소풍', '별이 빛나는 밤', '나무 아래 우리', '구름 기차', '봄 소풍', '눈사람 친구', '하늘을 나는 새'];
const KID_NAMES = ['하늘', '바다', '봄이', '도담', '나래', '시온', '다온', '이든', '라온', '새봄'];

/** 견본 어린이 그림 — 크레용 느낌으로 자동 생성(실제 아이 작품이 아니다) */
export function kidDrawing(seed: number) {
  const W = 512, H = 384, [c, x] = canvas(W, H), r = rng(seed * 97 + 5);
  x.fillStyle = '#fbf7ee'; x.fillRect(0, 0, W, H);
  const crayon = (color: string, w: number, pts: [number, number][]) => {
    x.strokeStyle = color; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round';
    for (let pass = 0; pass < 3; pass++) {
      x.globalAlpha = 0.55; x.beginPath();
      pts.forEach(([px, py], i) => { const jx = px + (r() - 0.5) * 3, jy = py + (r() - 0.5) * 3; i ? x.lineTo(jx, jy) : x.moveTo(jx, jy); });
      x.stroke();
    }
    x.globalAlpha = 1;
  };
  const ground = 300 + r() * 30;
  crayon('#5aa04a', 10, [[0, ground], [W * 0.3, ground - 10], [W * 0.7, ground + 6], [W, ground - 4]]);
  const sx = 60 + r() * 380, sy = 60 + r() * 30;
  for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2; crayon('#f2b705', 5, [[sx + Math.cos(t) * 40, sy + Math.sin(t) * 40], [sx + Math.cos(t) * 62, sy + Math.sin(t) * 62]]); }
  x.fillStyle = '#f7c948'; x.beginPath(); x.arc(sx, sy, 34, 0, Math.PI * 2); x.fill();
  const theme = seed % 4;
  if (theme === 0) { // 집
    const hx = 120 + r() * 200;
    crayon('#c0392b', 7, [[hx, ground], [hx, ground - 110], [hx + 150, ground - 110], [hx + 150, ground], [hx, ground]]);
    crayon('#7d3c98', 7, [[hx - 20, ground - 110], [hx + 75, ground - 190], [hx + 170, ground - 110]]);
    crayon('#2471a3', 6, [[hx + 55, ground], [hx + 55, ground - 60], [hx + 95, ground - 60], [hx + 95, ground]]);
  } else if (theme === 1) { // 무지개
    ['#e74c3c', '#f39c12', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad'].forEach((col, i) => {
      const pts: [number, number][] = [];
      for (let k = 0; k <= 20; k++) { const t = Math.PI + (k / 20) * Math.PI; pts.push([W / 2 + Math.cos(t) * (200 - i * 14), ground + Math.sin(t) * (170 - i * 14)]); }
      crayon(col, 9, pts);
    });
  } else if (theme === 2) { // 꽃
    for (let f = 0; f < 6; f++) {
      const fx = 40 + f * 80 + r() * 20, fy = ground - 40 - r() * 60, col = ['#e74c3c', '#e91e63', '#f39c12', '#9b59b6'][f % 4];
      crayon('#3d8b37', 5, [[fx, ground], [fx, fy]]);
      for (let p = 0; p < 6; p++) { const t = (p / 6) * Math.PI * 2; x.fillStyle = col; x.beginPath(); x.arc(fx + Math.cos(t) * 14, fy + Math.sin(t) * 14, 10, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = '#f1c40f'; x.beginPath(); x.arc(fx, fy, 8, 0, Math.PI * 2); x.fill();
    }
  } else { // 사람
    for (let p = 0; p < 3; p++) {
      const px = 130 + p * 120, py = ground - 20, s = p === 1 ? 0.7 : 1, col = ['#2471a3', '#c0392b', '#27ae60'][p];
      x.strokeStyle = '#333'; x.lineWidth = 5; x.beginPath(); x.arc(px, py - 130 * s, 24 * s, 0, Math.PI * 2); x.stroke();
      crayon(col, 8, [[px, py - 105 * s], [px, py - 45 * s]]);
      crayon(col, 6, [[px - 34 * s, py - 90 * s], [px, py - 80 * s], [px + 34 * s, py - 90 * s]]);
      crayon('#333', 6, [[px - 18 * s, py], [px, py - 45 * s], [px + 18 * s, py]]);
    }
  }
  const i = seed % KID_TITLES.length;
  return { texture: toTexture(c), title: KID_TITLES[i], author: `${KID_NAMES[(seed * 3) % KID_NAMES.length]} (${5 + (seed % 5)}세 · 견본)` };
}

// ── 명동대성당 실내 참고 재구성(2026-11-09) — 공개 360° VR·영상을 눈으로 보고 색·짜임만 옮겼다(사진·스캔 없음) ──

/** 실내 벽돌 v2 — 명동대성당 VR 을 다시 보고: 회녹색·회갈색·짙은 숯빛 벽돌이 섞이고, 밝은 회백색 줄눈이 또렷하다.
 *  같은 캔버스로 요철(bumpMap)도 만든다 — 줄눈은 들어가고 벽돌 면은 조금씩 울퉁불퉁 (2m 반복) */
const GB: { map?: THREE.CanvasTexture; bump?: THREE.CanvasTexture } = {};
export function greyBrick() { if (!GB.map) buildGreyBrick(); return GB.map!; }
export function greyBrickBump() { if (!GB.bump) buildGreyBrick(); return GB.bump!; }
function buildGreyBrick() {
  const S = 1024, [c, x] = canvas(S, S), [cb, xb] = canvas(S, S), r = rng(31);
  x.fillStyle = '#cfc8b8'; x.fillRect(0, 0, S, S);           // 줄눈(밝은 회백)
  xb.fillStyle = '#202020'; xb.fillRect(0, 0, S, S);         // 줄눈은 깊다
  const rows = 30, cols = 8, bh = S / rows, bw = S / cols, m = 3.2;
  const pal = [[132, 130, 116], [118, 118, 106], [146, 141, 125], [104, 103, 94], [158, 150, 130], [92, 92, 86], [128, 116, 96], [140, 136, 120]];
  for (let j = 0; j < rows; j++) {
    const off = (j % 2) * bw / 2;
    for (let i = -1; i <= cols; i++) {
      const [R, G, B] = pal[(r() * pal.length) | 0], k = 0.9 + r() * 0.2;
      const px = i * bw + off + m, py = j * bh + m, w = bw - m * 2, h = bh - m * 2;
      x.fillStyle = `rgb(${(R * k) | 0},${(G * k) | 0},${(B * k) | 0})`; x.fillRect(px, py, w, h);
      // 벽돌 면의 얼룩·구멍(구운 벽돌의 결)
      for (let q = 0; q < 14; q++) { x.fillStyle = `rgba(${r() < 0.5 ? '40,38,34' : '210,205,190'},${0.08 + r() * 0.12})`; x.fillRect(px + r() * w, py + r() * h, 1 + r() * 5, 1 + r() * 3); }
      // 위쪽 모서리 조금 밝게(빛이 닿는 턱)
      x.fillStyle = 'rgba(255,250,235,0.08)'; x.fillRect(px, py, w, 2);
      const v = 150 + r() * 60; xb.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; xb.fillRect(px, py, w, h);
      for (let q = 0; q < 10; q++) { const u = 120 + r() * 110; xb.fillStyle = `rgb(${u | 0},${u | 0},${u | 0})`; xb.fillRect(px + r() * w, py + r() * h, 2 + r() * 6, 1 + r() * 4); }
    }
  }
  // 큰 얼룩(오래된 벽의 그을음·물때)
  for (let q = 0; q < 40; q++) {
    const gx = r() * S, gy = r() * S, R0 = 40 + r() * 140, g = x.createRadialGradient(gx, gy, 0, gx, gy, R0);
    g.addColorStop(0, `rgba(${r() < 0.6 ? '50,46,40' : '200,190,165'},${0.05 + r() * 0.07})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(gx - R0, gy - R0, R0 * 2, R0 * 2);
  }
  grain(x, S, S, 14, r);
  GB.map = toTexture(c, 2);
  const b = toTexture(cb, 2, false); GB.bump = b;
}

/** 바닥 v2 — 밝은 회백색 석재 타일을 45° 로 돌려 깔았다(VR 의 신랑 바닥), 가는 회색 줄눈 (2.4m 반복) */
export function floorTiles() {
  // v3-4: 1024 px(2.4 m) — 석재 타일마다 톤·결이 다르고, 줄눈은 살짝 어둡고 모서리는 밝다. 거칠기 지도(floorRough)와 짝
  const S = 1024, [c, x] = canvas(S, S), r = rng(41);
  x.fillStyle = '#9d988f'; x.fillRect(0, 0, S, S);
  x.save(); x.translate(S / 2, S / 2); x.rotate(Math.PI / 4);
  const s = S / 4 / Math.SQRT1_2 / 2;
  for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
    const v = r() * 16 - 4, warm = r() < 0.3 ? 4 : 0;
    x.fillStyle = `rgb(${(220 + v + warm) | 0},${(216 + v) | 0},${(206 + v - warm) | 0})`;
    x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
    // 옅은 구름 얼룩(석재 속 색 변화)
    for (let q = 0; q < 3; q++) { const gx = i * s + r() * s, gy = j * s + r() * s, R0 = s * (0.2 + r() * 0.4); const g = x.createRadialGradient(gx, gy, 0, gx, gy, R0); g.addColorStop(0, `rgba(${r() < 0.5 ? '150,140,125' : '240,236,228'},${0.08 + r() * 0.1})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); }
    // 결 2~4 가닥
    for (let q = 0, n = 2 + (r() * 3 | 0); q < n; q++) {
      x.strokeStyle = `rgba(140,132,120,${0.10 + r() * 0.16})`; x.lineWidth = 0.8 + r() * 1.6;
      x.beginPath(); x.moveTo(i * s + r() * s, j * s);
      x.bezierCurveTo(i * s + r() * s, j * s + s * 0.3, i * s + r() * s, j * s + s * 0.7, i * s + r() * s, j * s + s); x.stroke();
    }
    // 모서리: 위·왼쪽 밝게, 아래·오른쪽 어둡게(살짝 올라온 타일 느낌)
    x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(i * s + 2, j * s + 2, s - 4, 1.5); x.fillRect(i * s + 2, j * s + 2, 1.5, s - 4);
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(i * s + 2, j * s + s - 3.5, s - 4, 1.5); x.fillRect(i * s + s - 3.5, j * s + 2, 1.5, s - 4);
  }
  x.restore();
  grain(x, S, S, 5, r);
  return toTexture(c, 2.4);
}

/** 바닥 타일 거칠기 지도 — 줄눈은 거칠고(밝음) 타일 면은 매끈(어두움), 타일마다 조금 다름 */
export function floorRough() {
  const S = 512, [c, x] = canvas(S, S), r = rng(43);
  x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, S, S);
  x.save(); x.translate(S / 2, S / 2); x.rotate(Math.PI / 4);
  const s = S / 4 / Math.SQRT1_2 / 2;
  for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const v = 95 + r() * 50; x.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; x.fillRect(i * s + 1, j * s + 1, s - 2, s - 2); }
  x.restore();
  grain(x, S, S, 12, r);
  return toTexture(c, 2.4, false);
}

/** 붉은 카펫 — 짠 결(가로·세로 올)과 옅은 색 변화 (1 m) */
export function carpet() {
  const S = 256, [c, x] = canvas(S, S), r = rng(47);
  x.fillStyle = 'rgb(128,30,34)'; x.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 2) { x.fillStyle = `rgba(0,0,0,${0.06 + r() * 0.08})`; x.fillRect(0, y, S, 1); }
  for (let xx = 0; xx < S; xx += 3) { x.fillStyle = `rgba(255,120,110,${0.03 + r() * 0.05})`; x.fillRect(xx, 0, 1, S); }
  for (let q = 0; q < 12; q++) { const gx = r() * S, gy = r() * S, R0 = 30 + r() * 80; const g = x.createRadialGradient(gx, gy, 0, gx, gy, R0); g.addColorStop(0, `rgba(${r() < 0.5 ? '60,10,12' : '190,70,70'},0.10)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(gx - R0, gy - R0, R0 * 2, R0 * 2); }
  grain(x, S, S, 10, r);
  return toTexture(c, 1);
}

/** 측랑 창 — 실제 측랑·익랑 창은 인물 없이 꽃 문양 원형 메달리온이 줄지은 기하 문양(파랑·흰색 바탕, 붉은·보라 꽃, 보라 테) */
export function floralGlass(seed: number, oculus = false) {
  const W = 256, H = oculus ? 256 : 768, [c, x] = canvas(W, H), r = rng(seed);
  const tint = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16), f = (v: number) => Math.max(0, Math.min(255, (v * k) | 0)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  // 바탕: 연한 하늘색·흰 유리 조각
  for (let j = 0; j < H; j += 16) for (let i = 0; i < W; i += 16) { x.fillStyle = tint(['#bcd6ec', '#d9e8f2', '#9fc0e0', '#e8eef2'][(r() * 4) | 0], 0.85 + r() * 0.25); x.fillRect(i, j, 16, 16); }
  const rosette = (cx: number, cy: number, R: number) => {
    x.fillStyle = tint('#2a54b8', 0.9 + r() * 0.2); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; x.fillStyle = tint(k % 2 ? '#e8e2d0' : '#c7d9ee', 1); x.beginPath(); x.ellipse(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55, R * 0.36, R * 0.2, a, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = tint('#b3203a', 1); x.beginPath(); x.arc(cx, cy, R * 0.28, 0, Math.PI * 2); x.fill();
    x.fillStyle = tint('#e8b830', 1); x.beginPath(); x.arc(cx, cy, R * 0.12, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(10,10,10,.85)'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
  };
  if (oculus) rosette(W / 2, H / 2, W * 0.36);
  else for (let k = 0; k < 4; k++) { const cy = 110 + k * 180; rosette(W / 2, cy, 70); for (const sx of [-1, 1]) { x.fillStyle = tint('#7a3aa0', 1); x.beginPath(); x.arc(W / 2 + sx * 98, cy + 90, 14, 0, Math.PI * 2); x.fill(); } }
  // 보라·빨강 테두리 띠
  for (let j = 0; j < H; j += 12) for (const bx of [0, W - 18]) { x.fillStyle = tint(['#6a2c91', '#b3122e', '#6a2c91', '#e8c547'][(j / 12) % 4 | 0], 0.95); x.fillRect(bx, j, 18, 12); }
  // 납선
  x.strokeStyle = 'rgba(15,15,15,0.8)'; x.lineWidth = 2;
  for (let j = 0; j < H; j += 16) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
  for (let i = 0; i < W; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  x.fillStyle = '#0d0d0d'; if (!oculus) for (let j = 0; j < H; j += 128) x.fillRect(0, j, W, 4);
  grain(x, W, H, 18, r);
  x.strokeStyle = '#0d0d0d'; x.lineWidth = 10; if (oculus) { x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 5, 0, Math.PI * 2); x.stroke(); } else x.strokeRect(0, 0, W, H);
  return toTexture(c);
}

/** 높은 랜싯 창 — 실제 유리처럼: 작은 색유리 조각(납선), 테두리 띠 문양, 원형 메달리온 속 인물(옷 주름·후광),
 *  유리마다 두께가 달라 밝기가 고르지 않다. 특정 작품을 옮기지 않은 일반적인 중세풍 짜임이다. */
export function lancetGlass(seed: number) {
  const W = 256, H = 1024, [c, x] = canvas(W, H), r = rng(seed);
  const shade = (hex: string, k: number) => {
    const n = parseInt(hex.slice(1), 16), f = (v: number) => Math.max(0, Math.min(255, (v * k) | 0));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };
  const piece = (px: number, py: number, w: number, h: number, col: string) => {
    x.fillStyle = shade(col, 0.72 + r() * 0.5); x.fillRect(px, py, w, h);
  };
  // 바탕: 연한 파랑·보라 작은 조각(모자이크) — VR 사진 기준
  const ground = ['#c2d2ee', '#a3bde8', '#dde4f3', '#b4a6dc', '#e2b4c6']; // v3-10: 실제 VR 기준 — 연한 파랑·보라·흰 유리에 분홍 포인트
  for (let j = 0; j < H; j += 14) for (let i = 0; i < W; i += 14) piece(i, j, 14, 14, ground[r() < 0.1 ? 4 : Math.floor(r() * 4)]);
  // 테두리 띠: 금·빨강·초록 조각이 번갈아
  const border = ['#cfa43a', '#b0343e', '#3f7f5e', '#efe4c0'];
  for (let j = 0; j < H; j += 12) for (const bx of [0, W - 22]) { piece(bx, j, 22, 12, border[(j / 12) % 4 | 0]); x.fillStyle = '#e8c547'; x.fillRect(bx + 8, j + 3, 6, 6); }
  // 메달리온 3개 — 인물(후광·얼굴·옷 주름·손), 바탕은 메달리온마다 다른 색
  const robes = ['#b3122e', '#d4a017', '#1f7a3e', '#6a2c91', '#ece6d2', '#c4561c', '#2e6fd0'];
  const backs = ['#d8c79a', '#a7c2dc', '#e2b4ac', '#b9d3bd'];
  for (let k = 0; k < 3; k++) {
    const cy = 190 + k * 300, R = 98, cx = W / 2;
    x.fillStyle = '#d9a520'; x.beginPath(); x.arc(cx, cy, R + 10, 0, Math.PI * 2); x.fill();
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip();
    const back = backs[Math.floor(r() * backs.length)];
    for (let j = cy - R; j < cy + R; j += 12) for (let i = cx - R; i < cx + R; i += 12) piece(i, j, 12, 12, back);
    // 옷(두 겹) + 주름
    const robe = robes[Math.floor(r() * robes.length)], mantle = robes[Math.floor(r() * robes.length)];
    x.fillStyle = shade(robe, 1); x.beginPath(); x.moveTo(cx - 42, cy + R); x.lineTo(cx - 24, cy - 8); x.lineTo(cx + 24, cy - 8); x.lineTo(cx + 42, cy + R); x.closePath(); x.fill();
    x.fillStyle = shade(mantle, 0.9); x.beginPath(); x.moveTo(cx - 44, cy + R); x.quadraticCurveTo(cx - 30, cy + 10, cx - 20, cy - 10); x.lineTo(cx - 4, cy + R); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(20,10,5,0.55)'; x.lineWidth = 2;
    for (let f = -2; f <= 2; f++) { x.beginPath(); x.moveTo(cx + f * 9, cy + 6); x.quadraticCurveTo(cx + f * 12, cy + 50, cx + f * 15, cy + R); x.stroke(); }
    // 손(합장) · 얼굴 · 후광
    x.fillStyle = '#f0d9b5'; x.beginPath(); x.ellipse(cx, cy + 18, 7, 11, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f6dd6b'; x.beginPath(); x.arc(cx, cy - 34, 26, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f0d9b5'; x.beginPath(); x.arc(cx, cy - 32, 15, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#5a3a20'; x.beginPath(); x.arc(cx, cy - 38, 15, Math.PI, Math.PI * 2); x.fill();
    x.restore();
    x.strokeStyle = '#141414'; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, R + 10, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
  }
  // 납선: 조각 사이 검은 선(조금 흔들리게)
  x.strokeStyle = 'rgba(15,15,15,0.85)'; x.lineWidth = 2;
  for (let j = 0; j < H; j += 14) { x.beginPath(); x.moveTo(0, j + (r() - 0.5) * 2); x.lineTo(W, j + (r() - 0.5) * 2); x.stroke(); }
  for (let i = 0; i < W; i += 14) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + (r() - 0.5) * 3, H); x.stroke(); }
  // 쇠 창살(가로 띠)
  x.fillStyle = '#0d0d0d'; for (let j = 0; j < H; j += 128) x.fillRect(0, j, W, 5);
  grain(x, W, H, 26, r);
  x.strokeStyle = '#0d0d0d'; x.lineWidth = 12; x.strokeRect(0, 0, W, H);
  return toTexture(c);
}

/** 제대 뒤 벽감의 사도 그림 v2 — VR 의 제대 뒤: 짙은 청록 바탕, 금빛 후광(주황 테), 붉은 테두리 띠, 수염 난 사도,
 *  연보라·연두·황토 옷에 겉옷을 두르고 아래에 이름 띠. 특정 작품을 옮기지 않은 일반적인 성화 짜임이다. */
export function saintNiche(seed: number) {
  const W = 256, H = 512, [c, x] = canvas(W, H), r = rng(seed);
  x.fillStyle = '#c9c1ae'; x.fillRect(0, 0, W, H);
  const arch = (k: number) => { const m = 12 * k; x.beginPath(); x.moveTo(m, H - 4); x.lineTo(m, 150); x.quadraticCurveTo(m, 20 + m, W / 2, 8 + m); x.quadraticCurveTo(W - m, 20 + m, W - m, 150); x.lineTo(W - m, H - 4); x.closePath(); };
  x.fillStyle = '#8a2a22'; arch(0.6); x.fill();
  x.fillStyle = '#d0a64a'; arch(1.1); x.fill();
  x.fillStyle = '#1f4a4c'; arch(1.5); x.fill(); // 실제(VR 제대#1): 짙은 청록 바탕에 금빛 후광
  // 바탕 결
  for (let q = 0; q < 400; q++) { x.fillStyle = `rgba(${r() < 0.5 ? '10,40,40' : '60,110,110'},0.15)`; x.fillRect(20 + r() * (W - 40), 40 + r() * (H - 80), 2, 4); }
  const robes = ['#b9a2c9', '#a9c48a', '#d9b45a', '#c86a4a', '#8fb0c9', '#e3d8c0'];
  const robe = robes[(r() * robes.length) | 0], mantle = robes[(r() * robes.length) | 0];
  const cx = W / 2;
  // 몸 · 옷 주름
  x.fillStyle = robe; x.beginPath(); x.moveTo(cx - 62, H - 70); x.quadraticCurveTo(cx - 52, 250, cx - 40, 190); x.lineTo(cx + 40, 190); x.quadraticCurveTo(cx + 54, 250, cx + 60, H - 70); x.closePath(); x.fill();
  x.fillStyle = mantle; x.beginPath(); x.moveTo(cx - 66, H - 68); x.quadraticCurveTo(cx - 60, 270, cx - 38, 192); x.quadraticCurveTo(cx + 10, 260, cx + 30, H - 70); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(40,25,20,0.35)'; x.lineWidth = 2;
  for (let f = -3; f <= 3; f++) { x.beginPath(); x.moveTo(cx + f * 12, 210); x.quadraticCurveTo(cx + f * 15, 320, cx + f * 17, H - 72); x.stroke(); }
  // 손 · 들고 있는 것(책 또는 십자가 또는 열쇠)
  x.fillStyle = '#e2c09a'; x.beginPath(); x.ellipse(cx + 18, 280, 9, 7, 0, 0, Math.PI * 2); x.fill();
  const prop = (r() * 3) | 0;
  if (prop === 0) { x.fillStyle = '#8a1f22'; x.fillRect(cx + 4, 282, 34, 44); }
  else if (prop === 1) { x.fillStyle = '#8a6030'; x.fillRect(cx - 30, 210, 10, 200); x.fillRect(cx - 52, 250, 54, 10); }
  else { x.strokeStyle = '#c9a04a'; x.lineWidth = 5; x.beginPath(); x.moveTo(cx + 18, 285); x.lineTo(cx + 18, 340); x.stroke(); }
  // 후광 · 얼굴 · 수염
  x.fillStyle = '#c99a3a'; x.beginPath(); x.arc(cx, 150, 46, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#e07a2a'; x.lineWidth = 3; x.stroke();
  x.fillStyle = '#e4c4a0'; x.beginPath(); x.ellipse(cx, 152, 22, 28, 0, 0, Math.PI * 2); x.fill();
  const hair = ['#d8d2c0', '#8a6a3a', '#5a4028', '#c8c0aa'][(r() * 4) | 0];
  x.fillStyle = hair; x.beginPath(); x.arc(cx, 140, 24, Math.PI, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(cx - 20, 160); x.quadraticCurveTo(cx, 215 + r() * 20, cx + 20, 160); x.quadraticCurveTo(cx, 175, cx - 20, 160); x.fill();
  x.fillStyle = '#5a3a28'; for (const sx of [-1, 1]) x.fillRect(cx + sx * 8 - 3, 148, 6, 2);
  // 이름 띠
  x.fillStyle = '#7a1e1e'; x.fillRect(16, H - 64, W - 32, 26);
  x.fillStyle = '#e8d4a0'; x.font = 'bold 15px serif'; x.textAlign = 'center';
  x.fillText(['S. PETRUS', 'S. ANDREAS', 'S. IOANNES', 'S. IACOBUS', 'S. THOMAS', 'S. MATTHIAS', 'S. SIMON', 'S. PHILIPPUS'][seed % 8], cx, H - 46);
  x.fillStyle = '#2a6a50'; for (let k = 0; k < 10; k++) x.fillRect(20 + k * 22, H - 32, 12, 8);
  grain(x, W, H, 10, r);
  return toTexture(c);
}

/** 햇살 빛줄기 — 위(창 쪽)는 밝고 바닥 쪽으로 옅어지며, 가장자리는 부드럽게. 가는 결이 섞여 먼지 낀 공기처럼 보인다 */
export function lightBeam() {
  const W = 64, H = 256, [c, x] = canvas(W, H), r = rng(57);
  const img = x.createImageData(W, H), d = img.data;
  const streak = Array.from({ length: W }, () => 0.75 + r() * 0.5);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const u = (i / (W - 1)) * 2 - 1, v = j / (H - 1); // v=0 위(창)
    const edge = Math.exp(-u * u * 3.2), along = (1 - v) ** 0.8 * 0.85 + 0.15;
    const a = Math.min(1, edge * along * streak[i]);
    const k = (j * W + i) * 4;
    d[k] = d[k + 1] = d[k + 2] = 255; d[k + 3] = (a * 255) | 0;
  }
  x.putImageData(img, 0, 0);
  return toTexture(c);
}

/** 바닥·벽에 떨어지는 색 그림자 — 여러 색유리 조각이 번진 모자이크, 가장자리는 둥글게 사라진다 */
export function glassPool(seed: number) {
  const S = 256, [c, x] = canvas(S, S), r = rng(seed);
  const cols = ['#2f5bff', '#ff2b3f', '#ffd23a', '#2fd06a', '#a24bff', '#3fa0ff', '#ff8a2a'];
  x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
  const cell = 26;
  for (let j = 0; j < S / cell + 1; j++) for (let i = 0; i < S / cell + 1; i++) {
    x.fillStyle = cols[Math.floor(r() * cols.length)];
    x.globalAlpha = 0.65 + r() * 0.35;
    x.fillRect(i * cell + (j % 2) * cell / 2, j * cell, cell - 3, cell - 3);
  }
  x.globalAlpha = 1;
  x.filter = 'blur(5px)'; x.drawImage(c, 0, 0); x.filter = 'none';
  const mask = x.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S * 0.5);
  mask.addColorStop(0, 'rgba(0,0,0,0)'); mask.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = mask; x.fillRect(0, 0, S, S);
  return toTexture(c);
}

// ── 십자가의 길 청동 부조 판(v3-8) ─────────────────────────────
// 실제 명동성당 십자가의 길은 최종태 조각가의 청동 부조(1989년, 약 50×60 cm, 14처 + 제15처 부활)다.
// 이것은 그 작품을 옮긴 것이 아니라, 각 처의 뜻을 단순한 도형(손·십자가·얼굴 …)으로 새긴 «표지»다. 판의 비율·색(어두운 청동 + 녹청)만 실제를 따른다.
type Ctx = CanvasRenderingContext2D;
const HI = '#f4f4f4', MID = '#b4b4b4', LO = '#7c7c7c';
function rrect(x: Ctx, cx: number, cy: number, w: number, h: number, r: number) {
  x.beginPath(); x.moveTo(cx - w / 2 + r, cy - h / 2); x.arcTo(cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2, r); x.arcTo(cx + w / 2, cy + h / 2, cx - w / 2, cy + h / 2, r);
  x.arcTo(cx - w / 2, cy + h / 2, cx - w / 2, cy - h / 2, r); x.arcTo(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2, r); x.closePath();
}
function reliefHand(x: Ctx, px: number, py: number, rot: number, s: number, fill = HI) {
  x.save(); x.translate(px, py); x.rotate(rot); x.scale(s, s); x.fillStyle = fill;
  rrect(x, 0, 0, 30, 34, 12); x.fill();                                     // 손바닥
  for (let i = 0; i < 4; i++) { rrect(x, -12 + i * 8, -34, 6.5, 36 - (i === 0 || i === 3 ? 6 : 0), 3); x.fill(); } // 손가락
  x.save(); x.rotate(-0.8); rrect(x, -17, -2, 6.5, 24, 3); x.fill(); x.restore(); // 엄지
  rrect(x, 0, 30, 14, 34, 4); x.fill();                                      // 손목·팔
  x.restore();
}
function reliefCross(x: Ctx, px: number, py: number, w: number, h: number, rot: number, fill = HI) {
  x.save(); x.translate(px, py); x.rotate(rot); x.fillStyle = fill;
  rrect(x, 0, 0, w, h, 3); x.fill(); rrect(x, 0, -h * 0.18, w * 3.4, w * 0.9, 3); x.fill();
  x.restore();
}
function reliefHead(x: Ctx, px: number, py: number, r: number, rot: number, fill = HI) {
  x.save(); x.translate(px, py); x.rotate(rot); x.fillStyle = fill; x.beginPath(); x.ellipse(0, 0, r * 0.82, r, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = LO; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -r * 0.1); x.lineTo(-r * 0.12, r * 0.32); x.stroke();       // 코
  x.beginPath(); x.arc(-r * 0.32, -r * 0.2, r * 0.14, 0.2, Math.PI - 0.2); x.stroke(); x.beginPath(); x.arc(r * 0.32, -r * 0.2, r * 0.14, 0.2, Math.PI - 0.2); x.stroke(); // 감은 눈
  x.restore();
}
function reliefThorn(x: Ctx, px: number, py: number, r: number) { x.strokeStyle = MID; x.lineWidth = 6; x.beginPath(); x.ellipse(px, py - r * 0.5, r * 0.95, r * 0.28, 0, 0, Math.PI * 2); x.stroke(); }
const STATION_DRAW: ((x: Ctx) => void)[] = [
  (x) => { reliefHand(x, 100, 190, 0, 1.15); reliefHand(x, 150, 190, 0, 1.15); x.fillStyle = MID; rrect(x, 125, 130, 90, 18, 6); x.fill(); x.fillStyle = HI; x.beginPath(); x.arc(125, 142, 12, 0, 7); x.fill(); }, // 1 묶인 두 손
  (x) => { reliefCross(x, 125, 150, 22, 190, 0.35); reliefHand(x, 82, 105, -0.5, 0.8); },                                      // 2 십자가를 짐
  (x) => { reliefCross(x, 135, 120, 22, 190, 1.1); reliefHead(x, 95, 205, 32, 0.9); reliefThorn(x, 95, 205, 32); reliefHand(x, 60, 130, -0.4, 0.8); }, // 3 넘어지심
  (x) => { reliefHead(x, 92, 160, 46, 0.25); reliefHead(x, 160, 150, 42, -0.25); reliefThorn(x, 92, 160, 46); x.strokeStyle = MID; x.lineWidth = 6; x.beginPath(); x.arc(160, 128, 56, 3.4, 5.9); x.stroke(); }, // 4 성모님을 만나심
  (x) => { reliefCross(x, 125, 150, 22, 200, 0.3); reliefHand(x, 80, 195, 0.6, 0.85); reliefHand(x, 170, 215, -0.5, 0.85); }, // 5 시몬이 도움
  (x) => { x.fillStyle = MID; rrect(x, 125, 150, 150, 210, 14); x.fill(); x.fillStyle = HI; for (let i = 0; i < 6; i++) { rrect(x, 70 + i * 22, 262, 14, 18, 6); x.fill(); } reliefHead(x, 125, 150, 52, 0, HI); reliefThorn(x, 125, 150, 52); }, // 6 베로니카 수건
  (x) => { reliefCross(x, 140, 110, 22, 190, 0.9); reliefHead(x, 100, 215, 30, 1.0); reliefThorn(x, 100, 215, 30); reliefHand(x, 62, 140, -0.3, 0.75); x.fillStyle = HI; x.beginPath(); x.arc(40, 40, 8, 0, 7); x.fill(); x.beginPath(); x.arc(64, 40, 8, 0, 7); x.fill(); }, // 7 두 번째 넘어짐(표시 두 개)
  (x) => { for (let i = 0; i < 3; i++) reliefHead(x, 55 + i * 70, 190 - (i === 1 ? 20 : 0), 30, (i - 1) * 0.25); reliefHand(x, 125, 100, 0, 0.9); },     // 8 예루살렘 부인들
  (x) => { reliefCross(x, 150, 105, 22, 190, 1.25); reliefHead(x, 100, 225, 28, 1.2); reliefThorn(x, 100, 225, 28); reliefHand(x, 60, 160, -0.2, 0.7); for (let i = 0; i < 3; i++) { x.fillStyle = HI; x.beginPath(); x.arc(36 + i * 22, 36, 8, 0, 7); x.fill(); } }, // 9 세 번째 넘어짐(표시 셋)
  (x) => { x.fillStyle = HI; x.beginPath(); x.moveTo(75, 70); x.lineTo(175, 70); x.lineTo(200, 260); x.lineTo(50, 260); x.closePath(); x.fill(); x.strokeStyle = LO; x.lineWidth = 4; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(95 + i * 12, 80); x.lineTo(80 + i * 17, 255); x.stroke(); } x.fillStyle = MID; rrect(x, 125, 66, 110, 16, 6); x.fill(); }, // 10 옷
  (x) => { reliefCross(x, 125, 150, 22, 210, 0); reliefHand(x, 60, 118, -1.5, 0.8); reliefHand(x, 190, 118, 1.5, 0.8); x.fillStyle = HI; x.beginPath(); x.arc(125, 118, 8, 0, 7); x.fill(); x.beginPath(); x.arc(125, 118, 15, 0, 7); x.strokeStyle = LO; x.lineWidth = 3; x.stroke(); }, // 11 못 박힘
  (x) => { reliefCross(x, 60, 120, 14, 140, 0, MID); reliefCross(x, 190, 120, 14, 140, 0, MID); reliefCross(x, 125, 130, 24, 200, 0); reliefHead(x, 125, 250, 36, 0.5); reliefThorn(x, 125, 250, 36); reliefHand(x, 62, 70, -0.5, 0.8); reliefHand(x, 188, 70, 0.5, 0.8); }, // 12 세 십자가
  (x) => { reliefCross(x, 190, 140, 20, 200, 0, MID); x.save(); x.translate(110, 190); x.rotate(-0.9); x.fillStyle = HI; x.beginPath(); x.ellipse(0, 0, 18, 92, 0, 0, 7); x.fill(); x.restore(); reliefHead(x, 55, 245, 30, 0.6); reliefHand(x, 60, 115, -0.6, 0.75); reliefHand(x, 168, 235, 0.9, 0.7); }, // 13 내림
  (x) => { x.fillStyle = MID; rrect(x, 125, 195, 200, 120, 10); x.fill(); x.fillStyle = LO; x.beginPath(); x.ellipse(125, 195, 44, 56, 0, 0, 7); x.fill(); x.fillStyle = HI; x.beginPath(); x.arc(190, 215, 52, 0, 7); x.fill(); reliefCross(x, 105, 75, 14, 70, 0, MID); }, // 14 무덤과 돌
  (x) => { x.fillStyle = MID; for (let i = 0; i < 16; i++) { x.save(); x.translate(125, 135); x.rotate(i * Math.PI / 8); rrect(x, 0, -100, 9, 38, 4); x.fill(); x.restore(); } x.fillStyle = HI; x.beginPath(); x.arc(125, 135, 56, 0, 7); x.fill(); reliefCross(x, 125, 135, 14, 70, 0, LO); x.fillStyle = MID; rrect(x, 125, 250, 190, 48, 8); x.fill(); reliefHand(x, 56, 250, 0, 0.7); reliefHand(x, 194, 250, 0, 0.7); }, // 15 부활(빛살 + 열린 무덤)
];
const RELIEF_CACHE = new Map<number, { map: THREE.CanvasTexture; bump: THREE.CanvasTexture }>();
/** idx 0~14(제1~15처) 청동 부조 판의 색 + 요철 텍스처. 250×300(5:6 = 실제 50×60 cm) */
export function stationRelief(idx: number): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const hit = RELIEF_CACHE.get(idx); if (hit) return hit;
  const W = 250, H = 300, r = rng(900 + idx * 37);
  const [, hx] = canvas(W, H);
  hx.fillStyle = '#5a5a5a'; hx.fillRect(0, 0, W, H);
  hx.strokeStyle = '#9c9c9c'; hx.lineWidth = 10; hx.strokeRect(5, 5, W - 10, H - 10);                 // 테두리 틀
  STATION_DRAW[Math.min(idx, STATION_DRAW.length - 1)](hx);
  // 부드럽게(상자 번짐 두 번) → 높이
  const src = hx.getImageData(0, 0, W, H); const hgt = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) hgt[i] = src.data[i * 4] / 255;
  const blur = (a: Float32Array) => { const b = new Float32Array(W * H); for (let y = 1; y < H - 1; y++) for (let xx = 1; xx < W - 1; xx++) { const i = y * W + xx; b[i] = (a[i] * 4 + a[i - 1] + a[i + 1] + a[i - W] + a[i + W]) / 8; } return b; };
  let hb = blur(blur(hgt));
  const [bc, bx] = canvas(W, H); const bimg = bx.createImageData(W, H);                              // 요철(회색)
  const [cc, cx] = canvas(W, H); const cimg = cx.createImageData(W, H);                              // 색(청동)
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const i = y * W + xx, h = hb[i] + (r() - 0.5) * 0.045;                                          // 망치 자국 같은 잔결
    const gx = (hb[Math.min(W * H - 1, i + 1)] - hb[Math.max(0, i - 1)]), gy = (hb[Math.min(W * H - 1, i + W)] - hb[Math.max(0, i - W)]);
    const lit = Math.max(0, Math.min(1, 0.55 - (gx * 5.2 + gy * 5.2)));                              // 왼쪽 위에서 비춤
    const v = Math.max(0, Math.min(1, (h - 0.3) * 1.5));
    const R = 44 + 62 * v + 70 * (lit - 0.5), G = 34 + 48 * v + 54 * (lit - 0.5), B = 26 + 30 * v + 36 * (lit - 0.5);
    const patina = Math.max(0, 0.5 - v) * 0.5 * (0.6 + r() * 0.8);                                   // 파인 곳엔 녹청이 낀다
    cimg.data[i * 4] = R - 12 * patina * 100 / 100; cimg.data[i * 4 + 1] = G + 14 * patina * 2; cimg.data[i * 4 + 2] = B + 6 * patina * 2; cimg.data[i * 4 + 3] = 255;
    const g8 = Math.max(0, Math.min(255, h * 255)); bimg.data[i * 4] = bimg.data[i * 4 + 1] = bimg.data[i * 4 + 2] = g8; bimg.data[i * 4 + 3] = 255;
  }
  cx.putImageData(cimg, 0, 0); bx.putImageData(bimg, 0, 0);
  const out = { map: toTexture(cc), bump: toTexture(bc, undefined, false) };
  RELIEF_CACHE.set(idx, out); return out;
}
