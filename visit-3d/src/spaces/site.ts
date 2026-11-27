// 명동대성당 구내(OSM) 를 대성당 공간에 붙인다.
// 기준 = 구내 지도 세션의 상세 외관(src/sitemap/cathedral.ts)이 돌려주는 frame(정면 위치·방향).
// 성당 로컬 좌표: +Z = 정면이 바라보는 방향(facing), +X = side, 종탑 앞면 = z=towerFrontLocal.
// OSM 좌표(x=동, z=남)를 이 로컬로 돌리고 옮긴다. 실내(cathedral.ts)는 이 로컬 좌표로 지어져 있다.
import * as THREE from 'three';
import type { SiteData } from '../sitemap/siteMap.ts';
import { buildCathedral as buildShell, worldUV } from '../sitemap/cathedral.ts';
import { buildLandscape, makeHill, neighborFacades } from '../sitemap/landscape.ts';
import type { Kit } from '../kit.ts';
import type { Mats } from '../materials.ts';

export interface SitePlacement {
  /** OSM (x, z) → 성당 로컬 (x, z) */
  toLocal(x: number, z: number): THREE.Vector2;
  /** 이 점(로컬 xz)이 둘레 건물과 겹치는가 */
  blocked(x: number, z: number, margin?: number): boolean;
  attribution: string;
  /** 걸어 들어갈 수 있게 만든 상세 외관(있을 때만). 실내에 있으면 숨긴다 */
  shell: THREE.Object3D | null;
  /** 상세 외관이 돌려준 치수(그 판의 지역 좌표) — 실내 상수와 맞는지 확인용 */
  dims: Record<string, any> | null;
  /** 가을 풍경(도로·녹지·수목·낙엽·바깥 건물·남산) — 성당 로컬로 옮겨 둔 묶음. 실내에서는 숨긴다 */
  landscape: THREE.Object3D | null;
  /** 성당 로컬 (x, z) 의 땅 높이. 성당이 선 언덕 위가 0, 언덕 아래 길은 -HILL */
  groundAt: (x: number, z: number) => number;
  /** 나무 줄기 자리(로컬) — 출발점·길 고를 때 피한다 */
  trunks: THREE.Vector2[];
}

/**
 * 종현 언덕 — 명동대성당은 둘레 길보다 높은 언덕 위에 있다. 구내 지도(siteMap.ts)와 같은 언덕을 쓰되,
 * 걷는 공간은 성당 바닥을 0 으로 두므로 언덕 아래를 -HILL 로 내린다. 높이 7 m 는 SRTM 대략값(실측 아님).
 */
export const HILL = 7;

const centroid = (ring: [number, number][]) => {
  let x = 0, z = 0;
  for (const [a, b] of ring) { x += a; z += b; }
  return new THREE.Vector2(x / ring.length, z / ring.length);
};

function inside(ring: THREE.Vector2[], x: number, z: number) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a.y > z) !== (b.y > z) && x < ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

export function placeSite(kit: Kit, M: Mats, site: SiteData, towerFrontLocal: number, keepOut: THREE.Box2, opts: { light?: boolean; interiorAt?: (x: number, z: number) => boolean; passageAt?: (x: number, z: number) => boolean } = {}): SitePlacement {
  const main = site.buildings.find((b) => b.osmId === site.mainBuilding);
  const tower = site.buildings.find((b) => b.kind === 'bell_tower');
  if (!main) throw new Error('site: 본당 윤곽이 없다');

  // 1) 기준 frame — 상세 외관을 «걸어 들어갈 수 있는 모드» 로 만들어 본다
  let front: THREE.Vector3, facing: THREE.Vector3;
  let shellGroup: THREE.Object3D | null = null;
  let dims: Record<string, any> | null = null;
  try {
    const c: any = (buildShell as any)(main.ring, tower?.ring ?? null, main.height, tower?.height ?? main.spireHeight ?? 45, { walkable: true });
    front = c.frame.front.clone();
    facing = c.frame.facing.clone().setY(0).normalize();
    dims = c.dims ?? null;
    if (c.walkable === true) shellGroup = c.group;
    else disposeObject(c.group); // 아직 문 구멍이 없는 판 — 대체 외관을 쓴다
  } catch (e) {
    console.warn('[site] 상세 외관을 만들지 못했다 — 종탑→앱스 축으로 대신 맞춘다', e);
    const tc = centroid((tower ?? main).ring);
    let far = tc.clone(), best = -1;
    for (const [x, z] of main.ring) { const d = Math.hypot(x - tc.x, z - tc.y); if (d > best) { best = d; far = new THREE.Vector2(x, z); } }
    const u = far.clone().sub(tc).normalize();
    facing = new THREE.Vector3(-u.x, 0, -u.y);
    front = new THREE.Vector3(tc.x, 0, tc.y).addScaledVector(facing, 5.5);
  }

  // 언덕(사이트 좌표): 본당·종탑 윤곽과 정면 앞마당(깊이 22 m) 둘레는 평지, 그 밖 30 m 에 걸쳐 내려간다
  const sideV = new THREE.Vector3(facing.z, 0, -facing.x);
  const quadSite = (a0: number, a1: number, w: number) => [[a0, -w], [a0, w], [a1, w], [a1, -w]].map(([a, b]) => {
    const p = front.clone().addScaledVector(facing, a).addScaledVector(sideV, b);
    return [p.x, p.z] as [number, number];
  });
  const hillCore = [main.ring, ...(tower ? [tower.ring] : []), quadSite(-2, 22, 17)];
  const heightAt = makeHill(hillCore as any, (site.precinct?.ring as any) ?? null, HILL);

  // 2) 세계 → 로컬: Y 회전 φ 로 facing 을 +Z 에, 종탑 앞면을 (0, towerFrontLocal) 에
  const phi = Math.atan2(-facing.x, facing.z);
  const c = Math.cos(phi), s = Math.sin(phi);
  const rot = (x: number, z: number) => new THREE.Vector2(x * c + z * s, -x * s + z * c);
  const f0 = rot(front.x, front.z);
  const off = new THREE.Vector2(-f0.x, towerFrontLocal - f0.y);
  const toLocal = (x: number, z: number) => rot(x, z).add(off);
  const toSiteXZ = (x: number, z: number): [number, number] => { const a = x - off.x, b = z - off.y; return [a * c - b * s, a * s + b * c]; };
  const groundAt = (x: number, z: number) => { const [sx, sz] = toSiteXZ(x, z); return heightAt(sx, sz) - HILL; };

  let shell: THREE.Object3D | null = null;
  if (shellGroup) {
    const holder = new THREE.Group();
    holder.rotation.y = phi;
    holder.position.set(off.x, 0, off.y);
    holder.userData.dynamic = true; // 합치지 않는다(보였다 숨겼다 한다)
    holder.userData.noCollide = true; // 바깥용 껍데기의 신랑 벽면이 측랑 한복판(x ±6.5)에 서 있어 사람을 막았다 — 바깥 벽은 실내 쪽 벽 충돌이 맡는다
    holder.add(shellGroup);
    kit.root.add(holder);
    shell = holder;
    // 영구 규칙(사장님 2026-11-10, 2026-11-23 다시): 눈에 보이는 벽은 지나갈 수 없다.
    // 껍데기 전체를 충돌에 넣으면 신랑 벽면이 측랑 한복판을 막으므로, 실내(interiorAt) 밖에 있는 «겉면»의 선 벽만 골라 충돌 전용으로 넣는다.
    // 전에는 겉면에 충돌이 없어 종탑 옆 계단탑(3 × 7 m)·버팀벽·정면 문설주를 그대로 지나갔다.
    if (opts.interiorAt) {
      const skin = shellSkinCollider(holder, opts.interiorAt, opts.passageAt ?? (() => false), kit.walkBottom, kit.walkTop);
      if (skin) kit.add(skin, M.bark, { colliderOnly: true });
    }
  }

  // 3) 가을 풍경(구내 지도 세션 landscape.ts) — 바닥 층·나무·바깥 건물·남산. 없으면 구내 포석만 깐다
  //    좌표는 site 지역 좌표 → 구내 건물과 같은 회전·이동(phi, off)을 holder 에 건다.
  let landscape: THREE.Object3D | null = null;
  const trunksLocal: THREE.Vector2[] = [];
  const toSite = (x: number, z: number): [number, number] => { const a = x - off.x, b = z - off.y; return [a * c - b * s, a * s + b * c]; };
  try {
    const kc = keepOut;
    const clearRing: [number, number][] = [[kc.min.x, kc.min.y], [kc.max.x, kc.min.y], [kc.max.x, kc.max.y], [kc.min.x, kc.max.y]].map(([x, z]) => toSite(x, z));
    const plaza: [number, number][] = [[-15, kc.max.y], [15, kc.max.y], [15, kc.max.y + 26], [-15, kc.max.y + 26]].map(([x, z]) => toSite(x, z));
    const ls = buildLandscape(site as any, {
      keepClear: [clearRing, plaza], groundScale: 0.15, distant: true,
      // 화질 «가볍게»(모바일 기본) = 20면체 나무 · 반경 200m, «높게» = 상세 나무 · 반경 260m. 중심 = 성당 가운데
      treeDetail: opts.light ? 'low' : 'high', treeRadius: opts.light ? 200 : 260, treeCenter: toSite(0, -15),
      terrain: { height: heightAt, center: toSite(0, -15), size: 230, top: HILL },
    });
    const lh = new THREE.Group();
    lh.rotation.y = phi;
    lh.position.set(off.x, -HILL, off.y);
    lh.userData.dynamic = true;
    lh.add(ls.group);
    // 나무(갓·잎 인스턴스)는 삼각형이 많아 그림자 패스에서 빼 둔다 — 그림자는 건물·성당이 맡는다
    // v2: 높은 화질에서는 나무(껍질·잎)가 그림자를 드리운다 — 잎 사이로 새는 햇빛 무늬가 땅에 진다.
    //     낙엽·풀·관목·원경은 그림자 패스에서 뺀다
    ls.group.traverse((o) => {
      const m = o as THREE.Mesh; if (!m.isMesh) return;
      const tree = /^(bark|leaves)-(maple|zelkova|ginkgo|cherry|pine):\d:0:/.test(o.name); // 가까운 상세 나무만
      if ((m as any).isInstancedMesh || o.name === 'trees') m.castShadow = tree && !opts.light;
    });
    kit.root.add(lh);
    landscape = lh;
    // 줄기 충돌: 걸어 닿을 수 있는 반경 안만(BVH 를 가볍게)
    let n = 0;
    for (const t of ls.trunks) {
      const p = toLocal(t.x, t.z);
      trunksLocal.push(p);
      if (p.length() > 220) continue;
      kit.add(new THREE.CylinderGeometry(t.r + 0.08, t.r + 0.08, 2.4, 6), M.bark, { pos: [p.x, heightAt(t.x, t.z) - HILL + 1.2, p.y], colliderOnly: true });
      n++;
    }
    // v2: 관목도 통과하지 못하게(낮은 원기둥)
    for (const sh of ls.shrubs) {
      const p = toLocal(sh.x, sh.z);
      if (p.length() > 150) continue;
      kit.add(new THREE.CylinderGeometry(sh.r, sh.r, 1.4, 6), M.bark, { pos: [p.x, heightAt(sh.x, sh.z) - HILL + 0.7, p.y], colliderOnly: true });
    }
    // 걷는 땅(충돌) — 언덕 비탈을 2.5 m 격자로. 보이는 지형은 풍경 묶음이 그린다
    {
      const X0 = -120, X1 = 120, Z0 = -150, Z1 = 130, step = 2.5;
      const nx = Math.round((X1 - X0) / step), nz = Math.round((Z1 - Z0) / step);
      const g = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, nx, nz).rotateX(-Math.PI / 2);
      g.translate((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
      const pa = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pa.count; i++) pa.setY(i, groundAt(pa.getX(i), pa.getZ(i)) - 0.02);
      g.computeVertexNormals();
      kit.add(g, M.grass, { colliderOnly: true });
    }
    console.info(`[site] 가을 풍경 붙임 — 나무 ${ls.trunks.length}그루(충돌 ${n}) · 바깥 건물 ${ls.stats.farBuildings ?? 0}동`);
  } catch (e) { console.warn('[site] 가을 풍경을 붙이지 못했다 — 구내 포석만 깐다', e); }

  if (!landscape && site.precinct?.ring?.length) {
    const pts = site.precinct.ring.map(([x, z]) => toLocal(x, z));
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.y))));
    g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv as THREE.BufferAttribute, pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    kit.add(g, M.paving, { pos: [0, 0.015, 0] });
  }

  // 4) 둘레 건물
  const footprints: THREE.Vector2[][] = [];
  // v3-2: 흰 상자 대신 층·창이 있는 외벽 텍스처(건물마다 톤이 다르게), 지붕은 짙은 회색 옥상
  const facades = neighborFacades();
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5e5c58, roughness: 0.95 });
  const skipped: string[] = [];
  for (const b of site.buildings) {
    if (b === main || b === tower) continue;
    const ring = b.ring.map(([x, z]) => toLocal(x, z));
    if (new THREE.Box2().setFromPoints(ring).intersectsBox(keepOut)) { skipped.push(b.name ?? String(b.osmId)); continue; }
    footprints.push(ring);
    const h = Math.max(4, b.height || 8);
    // 비탈에 걸친 건물은 낮은 쪽에 앉힌다(높은 쪽은 묻힌다) — 구내 지도와 같은 규칙
    const base = Math.min(...b.ring.map(([x, z]) => heightAt(x, z))) - HILL;
    const shape = new THREE.Shape(ring.map((p) => new THREE.Vector2(p.x, -p.y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const wall = geo.index ? geo.toNonIndexed() : geo; wall.clearGroups(); worldUV(wall, 1 / 4); // 옆면 UV 를 월드 미터 기준으로(4 m 타일)
    kit.add(wall, facades[Math.abs(b.osmId) % facades.length], { pos: [0, base, 0], collide: true });
    const top = new THREE.ShapeGeometry(shape);
    top.rotateX(-Math.PI / 2);
    kit.add(top, roofMat, { pos: [0, base + h + 0.02, 0], shadow: false });
    // 주변 건물 이름표는 달지 않는다(2026-11-10 사장님 지시: 성당을 볼 때 이름이 떠서 어지럽다)
  }
  if (skipped.length) console.info('[site] 성당 모델과 겹쳐 뺀 윤곽:', skipped.join(', '));

  return {
    toLocal,
    blocked: (x, z, m = 1.5) => footprints.some((r) => inside(r, x, z) || inside(r, x + m, z) || inside(r, x - m, z) || inside(r, x, z + m) || inside(r, x, z - m)),
    attribution: site.attribution,
    shell,
    dims,
    landscape,
    groundAt: landscape ? groundAt : () => 0,
    trunks: trunksLocal,
  };
}

function disposeObject(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((mm) => { for (const v of Object.values(mm)) if (v instanceof THREE.Texture) v.dispose(); mm.dispose(); });
  });
}

/** 껍데기의 겉면 가운데 사람 키 높이에 걸리는 선 벽 삼각형만 모은다(성당 로컬 좌표). 실내 쪽에 놓인 면은 뺀다 */
function shellSkinCollider(holder: THREE.Object3D, interiorAt: (x: number, z: number) => boolean, passageAt: (x: number, z: number) => boolean, yMin: number, yMax: number): THREE.BufferGeometry | null {
  holder.updateMatrixWorld(true);
  const out: number[] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  holder.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as any).isInstancedMesh) return;
    const mat = m.material as THREE.Material & { transparent?: boolean; opacity?: number };
    if (mat && (mat.transparent || (mat.opacity ?? 1) < 0.99)) return; // 유리·빛
    const pos = m.geometry.getAttribute('position'), idx = m.geometry.getIndex();
    const count = idx ? idx.count : pos.count;
    for (let i = 0; i + 2 < count; i += 3) {
      a.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(m.matrixWorld);
      b.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(m.matrixWorld);
      c.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(m.matrixWorld);
      if (Math.max(a.y, b.y, c.y) < yMin || Math.min(a.y, b.y, c.y) > yMax) continue; // 머리 위·땅 아래
      n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
      const len = n.length(); if (len < 1e-8) continue;
      if (Math.abs(n.y / len) > 0.5) continue; // 바닥·지붕·디딤판은 뺀다(계단은 경사로 충돌이 따로 있다)
      const pts: [number, number][] = [[(a.x + b.x + c.x) / 3, (a.z + b.z + c.z) / 3], [(a.x + b.x) / 2, (a.z + b.z) / 2], [(b.x + c.x) / 2, (b.z + c.z) / 2], [(c.x + a.x) / 2, (c.z + a.z) / 2]];
      if (pts.some(([x, z]) => interiorAt(x, z))) continue; // 실내에 걸친 면 — 실내 벽 충돌이 맡는다
      if (passageAt(pts[0][0], pts[0][1])) continue; // 문 통로 한가운데의 면
      out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  });
  if (!out.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  g.computeVertexNormals();
  return g;
}
