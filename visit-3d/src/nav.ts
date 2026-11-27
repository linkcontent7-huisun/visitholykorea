// 길 찾기 — 눌러서 걸어갈 때 «벽을 피해 길을 따라» 가게 한다 (사장님 2026-11-25:
// 「종을 친 뒤 성수대로 가는데 그냥 직진으로 가서 벽에 부딪친다. 상식적으로 길을 따라 걸어 들어가야지」).
//
// 걷기 충돌(player.ts)은 그대로다 — 벽을 뚫지 않는 규칙은 건드리지 않는다. 이 파일은 «어느 길로 갈지»만 정한다.
// 방법: 바닥을 0.5 m 칸으로 나누어, 몸(반지름 0.32 m)이 들어갈 수 있는 칸만 이어 A* 로 길을 찾고, 곧게 갈 수 있는 구간은 한 번에 잇는다.
//  · 칸의 바닥 높이는 위에서 아래로 쏜 광선으로 잰다(계단·언덕을 오른다: 한 칸에 0.4 m 까지 오르고 0.6 m 까지 내린다).
//  · 칸에 몸이 들어가는지는 걷기 충돌과 같은 캡슐 검사로 본다(벽·기둥·의자에서 6 cm 여유).
//  · 목적지가 벽 속이거나 닿을 수 없으면 가장 가까이 갈 수 있는 칸까지 간다.
//  · 문은 열려 있다고 보고 길을 짠다(닫힌 문은 가까이 가면 저절로 열린다).
import * as THREE from 'three';
import type { MeshBVH } from 'three-mesh-bvh';

const CELL = 0.5;
const R = 0.32, HEIGHT = 1.7, MARGIN = 0.06;
const STEP_UP = 0.4, STEP_DOWN = 0.6;
const MAX_NODES = 9000;
const NB: readonly [number, number, number][] = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

interface Cell { ok: boolean; y: number }

export class Nav {
  private cache = new Map<number, Cell>();
  private seg = new THREE.Line3();
  private box = new THREE.Box3();
  private triP = new THREE.Vector3();
  private capP = new THREE.Vector3();
  private ray = new THREE.Ray();
  private bvh: MeshBVH;
  constructor(bvh: MeshBVH) { this.bvh = bvh; }

  private key(ix: number, iz: number) { return (ix + 4096) * 8192 + (iz + 4096); }

  /** x,z 에서 몸이 서 있을 수 있는가 — 바닥 높이는 fromY 위 0.9 m 에서 아래로 쏘아 잰다 */
  private cell(ix: number, iz: number, fromY: number): Cell {
    const k = this.key(ix, iz);
    const hit = this.cache.get(k);
    if (hit) return hit;
    const x = ix * CELL, z = iz * CELL;
    this.ray.origin.set(x, fromY + 0.9, z); this.ray.direction.set(0, -1, 0);
    const g = this.bvh.raycastFirst(this.ray, THREE.DoubleSide);
    let c: Cell;
    if (!g || g.distance > 0.9 + STEP_DOWN + 0.05) c = { ok: false, y: fromY };
    else {
      const y = fromY + 0.9 - g.distance;
      c = { ok: this.clear(x, y, z), y };
    }
    this.cache.set(k, c);
    return c;
  }

  /** 걷기 충돌(Player.collide)과 같은 캡슐 — 단, 계단 한 칸(0.45 m)은 넘을 수 있게 아래를 띄워 검사한다 */
  private clear(x: number, y: number, z: number): boolean {
    const s = this.seg;
    s.start.set(x, y + R + STEP_UP + 0.05, z);
    s.end.set(x, y + HEIGHT - R, z);
    this.box.makeEmpty().expandByPoint(s.start).expandByPoint(s.end).expandByScalar(R + MARGIN);
    let blocked = false;
    this.bvh.shapecast({
      intersectsBounds: (b) => !blocked && b.intersectsBox(this.box),
      intersectsTriangle: (tri) => {
        if (tri.closestPointToSegment(s, this.triP, this.capP) < R + MARGIN) { blocked = true; return true; }
        return false;
      },
    });
    return !blocked;
  }

  /** from → to 를 곧게 걸을 수 있는가(0.25 m 마다 몸이 들어가는지 본다) */
  private straight(a: THREE.Vector3, b: THREE.Vector3): boolean {
    const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
    const n = Math.ceil(len / 0.25);
    let y = a.y;
    for (let i = 1; i <= n; i++) {
      const x = a.x + (dx * i) / n, z = a.z + (dz * i) / n;
      this.ray.origin.set(x, y + 0.9, z); this.ray.direction.set(0, -1, 0);
      const g = this.bvh.raycastFirst(this.ray, THREE.DoubleSide);
      if (!g || g.distance > 0.9 + STEP_DOWN + 0.05) return false;
      const ny = y + 0.9 - g.distance;
      if (ny - y > STEP_UP + 0.02) return false;
      y = ny;
      if (!this.clear(x, y, z)) return false;
    }
    return true;
  }

  /** 길(중간 지점들, 마지막은 목적지 쪽). 길이 없으면 null — 호출하는 쪽이 곧게 간다 */
  find(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] | null {
    this.cache.clear();
    const six = Math.round(from.x / CELL), siz = Math.round(from.z / CELL);
    const gix = Math.round(to.x / CELL), giz = Math.round(to.z / CELL);
    // 곧게 갈 수 있으면 그대로(가장 흔한 경우, 빠르다)
    if (this.straight(from, to)) return [to.clone()];

    const startY = from.y;
    interface Node { ix: number; iz: number; y: number; g: number; f: number; parent: Node | null }
    const open: Node[] = [];
    const best = new Map<number, number>();
    const h = (ix: number, iz: number) => Math.hypot(ix - gix, iz - giz);
    const startNode: Node = { ix: six, iz: siz, y: startY, g: 0, f: h(six, siz) * 1.3, parent: null };
    open.push(startNode); best.set(this.key(six, siz), 0);
    let closest = startNode, closestH = h(six, siz), expanded = 0, goal: Node | null = null;
    while (open.length && expanded < MAX_NODES) {
      // 가장 작은 f (열린 목록이 작아 선형 탐색으로 충분)
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i]!.f < open[bi]!.f) bi = i;
      const cur = open[bi]!; open[bi] = open[open.length - 1]!; open.pop();
      if (cur.g > (best.get(this.key(cur.ix, cur.iz)) ?? Infinity) + 1e-6) continue;
      expanded++;
      const ch = h(cur.ix, cur.iz);
      if (ch < closestH) { closestH = ch; closest = cur; }
      if (cur.ix === gix && cur.iz === giz) { goal = cur; break; }
      if (ch < 1.2 && this.straight(new THREE.Vector3(cur.ix * CELL, cur.y, cur.iz * CELL), to)) { goal = cur; closest = cur; break; }
      for (const [dx, dz, cost] of NB) {
        const nx = cur.ix + dx, nz = cur.iz + dz;
        const c = this.cell(nx, nz, cur.y);
        if (!c.ok) continue;
        const dy = c.y - cur.y;
        if (dy > STEP_UP || dy < -STEP_DOWN) continue;
        if (dx !== 0 && dz !== 0) { // 모서리를 비스듬히 스치지 않게: 옆 두 칸도 지나갈 수 있어야 한다
          if (!this.cell(cur.ix + dx, cur.iz, cur.y).ok || !this.cell(cur.ix, cur.iz + dz, cur.y).ok) continue;
        }
        const g = cur.g + cost;
        const kk = this.key(nx, nz);
        if (g >= (best.get(kk) ?? Infinity)) continue;
        best.set(kk, g);
        open.push({ ix: nx, iz: nz, y: c.y, g, f: g + h(nx, nz) * 1.3, parent: cur });
      }
    }
    const end = goal ?? closest;
    if (end === startNode && !goal) return null;
    // 길을 거꾸로 모은다
    const raw: THREE.Vector3[] = [];
    for (let n: Node | null = end; n; n = n.parent) raw.push(new THREE.Vector3(n.ix * CELL, n.y, n.iz * CELL));
    raw.reverse();
    raw[0] = from.clone();
    if (goal) raw.push(to.clone());
    // 곧게 갈 수 있는 구간은 한 번에 잇는다(끈 당기기)
    const out: THREE.Vector3[] = [];
    let i = 0;
    while (i < raw.length - 1) {
      let j = raw.length - 1;
      while (j > i + 1 && !this.straight(raw[i]!, raw[j]!)) j--;
      out.push(raw[j]!.clone());
      i = j;
    }
    return out.length ? out : null;
  }
}
