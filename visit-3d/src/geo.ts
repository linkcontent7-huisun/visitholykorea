// 형상 도우미 — 첨두아치(뾰족 아치) 벽·아케이드·볼트를 Shape → Extrude 로 만든다.
// 모든 UV 는 미터 단위(텍스처 repeat 이 1/길이)라 크기가 달라도 무늬 크기가 같다.
import * as THREE from 'three';

export type V2 = [number, number];

/**
 * 두 중심 첨두아치 윤곽점. 왼쪽 아래 → 정점 → 오른쪽 아래 순.
 * rise = 기둥머리(spring)에서 정점까지 높이. rise ≥ w/2 여야 뾰족하다(= w/2 이면 반원).
 */
export function archPoints(cx: number, w: number, bottom: number, spring: number, rise: number, seg = 10): V2[] {
  const h = w / 2;
  rise = Math.max(rise, h);
  const c = (rise * rise - h * h) / w; // 원 중심이 반대쪽으로 비켜난 거리
  const r = c + h;
  const pts: V2[] = [[cx - h, bottom], [cx - h, spring]];
  const a1 = Math.atan2(rise, -c);
  for (let i = 1; i <= seg; i++) {
    const a = Math.PI + (a1 - Math.PI) * (i / seg);
    pts.push([cx + c + r * Math.cos(a), spring + r * Math.sin(a)]);
  }
  const a2 = Math.atan2(rise, c);
  for (let i = 1; i <= seg; i++) {
    const a = a2 * (1 - i / seg);
    pts.push([cx - c + r * Math.cos(a), spring + r * Math.sin(a)]);
  }
  pts.push([cx + h, bottom]);
  return pts;
}

export interface ArchHole { cx: number; w: number; bottom: number; spring: number; rise: number }
export interface CircleHole { cx: number; cy: number; r: number }

const toPath = (pts: V2[], P: typeof THREE.Path | typeof THREE.Shape = THREE.Path) => {
  const p = new P();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
};

export function shapeFrom(pts: V2[]): THREE.Shape {
  return toPath(pts, THREE.Shape) as THREE.Shape;
}

/** 외곽선(기본 직사각형)에 아치·원 구멍을 뚫은 벽. 로컬 XY 평면, +Z 로 depth 만큼 두께 */
export function wall(outline: V2[], holes: ArchHole[], depth: number, circles: CircleHole[] = []): THREE.BufferGeometry {
  const s = shapeFrom(outline);
  for (const h of holes) s.holes.push(toPath(archPoints(h.cx, h.w, h.bottom, h.spring, h.rise)));
  for (const c of circles) { const p = new THREE.Path(); p.absarc(c.cx, c.cy, c.r, 0, Math.PI * 2, true); s.holes.push(p); }
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 24 });
}

export const rect = (x0: number, y0: number, x1: number, y1: number): V2[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** 아래쪽이 아치로 뚫린 아케이드 벽 (길이 L, 높이 H). openings = [시작, 끝] 구간 */
export function arcade(L: number, H: number, openings: [number, number][], spring: number, rise: number, depth: number, holes: ArchHole[] = []) {
  const pts: V2[] = [[0, 0]];
  for (const [a, b] of openings) pts.push(...archPoints((a + b) / 2, b - a, 0, spring, rise));
  pts.push([L, 0], [L, H], [0, H]);
  return wall(pts, holes, depth);
}

/** 아치 띠(볼트 · 리브) 단면: 바깥 아치와 안쪽 아치 사이 */
export function archBand(w: number, spring: number, rise: number, thick: number, seg = 16): THREE.Shape {
  const outer = archPoints(0, w + thick * 2, spring, spring, rise + thick, seg).slice(1, -1);
  const inner = archPoints(0, w, spring, spring, rise, seg).slice(1, -1).reverse();
  return shapeFrom([...outer, ...inner]);
}

export function extrude(shape: THREE.Shape, depth: number) {
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 16 });
}

/** 면마다 UV 를 미터로 맞춘 상자 */
export function box(w: number, h: number, d: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v;
    uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
  }
  return g;
}

export function cyl(rTop: number, rBot: number, h: number, seg = 16, open = false): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const circ = Math.PI * (rTop + rBot);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ, uv.getY(i) * h);
  return g;
}

/** 아치 모양 판(유리 · 팀파눔). UV 를 0~1 로 편다 */
export function archPane(w: number, spring: number, rise: number, bottom = 0): THREE.BufferGeometry {
  const g = new THREE.ShapeGeometry(shapeFrom(archPoints(0, w, bottom, spring, rise)), 12);
  normalizeUV(g);
  return g;
}

export function normalizeUV(g: THREE.BufferGeometry) {
  g.computeBoundingBox();
  const b = g.boundingBox!, p = g.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) - b.min.x) / (b.max.x - b.min.x || 1);
    uv[i * 2 + 1] = (p.getY(i) - b.min.y) / (b.max.y - b.min.y || 1);
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
