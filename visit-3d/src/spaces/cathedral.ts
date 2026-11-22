// 명동대성당 구내 첫 사례 — 실측 평면(OSM) 에 맞춘 대성당.
// 바깥 모습 = 구내 지도 세션의 상세 외관(src/sitemap/cathedral.ts, «걸어 들어갈 수 있는 모드»). 없으면 대체 외관.
// 실내 = 이 파일. 외관 외피 면보다 0.3m 안쪽에 벽·천장을 둔다(바깥에서 실내 벽이 비치지 않게).
// 좌표: 미터, Y 위, +Z = 정면이 바라보는 쪽(앞마당), -Z = 제단. 종탑 앞면 z=7, 실내 바닥 y=F.
// 외관 치수(OSM 실측 기반, 구내 지도 세션 dims): 종탑 z 7 ~ -4.08 · 반폭 6.03 / 신랑 반폭 6.5 · 처마 17 · 용마루 23
//   측랑 바깥 반폭 15.58 · 처마 9 · 베이 5칸(5.2m) z -4.08 ~ -30.1 / 익랑 z -30.1 ~ -39.6 · 처마 17
//   후진 중심 z -39.6 · 안쪽 반원 r 6.5(높이 17) · 바깥 회랑 r 12.47(높이 9) / 정문 폭 3.4 · 아치 꼭대기 6.4
import * as THREE from 'three';
import * as T from '../textures.ts';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Kit } from '../kit.ts';
import type { Mats } from '../materials.ts';
import { wall, arcade, archBand, archPane, extrude, box, cyl, rect, shapeFrom, archPoints, type ArchHole, type V2 } from '../geo.ts';
import { roseWindow, textPanel, stationRelief, lancetGlass, saintNiche, floralGlass } from '../textures.ts';
import { clusterTex } from '../sitemap/trees.ts';
import { Registry, pews, candleStand, floorPlate, bellMesh } from './props.ts';
import { SPACES } from '../../shared/spaces.ts';
import type { SpaceBuild, DoorRt, Zone, Station, WindowLight } from './types.ts';
import { STATION_NAMES } from '../../shared/spaces.ts';
import type { SiteData } from '../sitemap/siteMap.ts';
import { placeSite, HILL, type SitePlacement } from './site.ts';

// ── 외관(외피) 치수 ──
const F = 0.6;
const TOWER_FRONT = 7.0, TOWER_BACK = -4.08, TOWER_HW = 6.03, TOWER_H = 30.5;
const NAVE_HW_OUT = 6.5, EAVE_NAVE = 17, RIDGE = 23;
const AISLE_HW_OUT = 15.58, EAVE_AISLE = 9, AISLE_TOP = 12.4;
const TRANS0 = -30.1, APSE_C = -39.6, APSE_R = 6.5, AMB_R = 12.47;
const BAY = 5.2;

// ── 실내(외피에서 0.3m 안쪽) ──
const NAVE_IN = 5.7, NAVE_WALL = 0.5;           // 아케이드 벽 x 5.7 ~ 6.2
const AISLE_IN = 15.0, OT = 0.3;                // 측랑 바깥벽 x 15.0 ~ 15.3
const NAR_IN = 5.4;                             // 현관(종탑) 벽 x 5.4 ~ 5.8
const FRONT_IN = 6.3, FRONT_T = 0.45;           // 정면 벽 z 6.3 ~ 6.75
const XWALL = TOWER_BACK - 0.3, XWALL_T = 0.45; // 현관 ↔ 신랑 벽 z -4.38 ~ -4.83
const NAVE_Z0 = XWALL - XWALL_T;                // 신랑 시작
const TRANS_REAR = APSE_C + 0.3;                // 익랑 뒷벽 안쪽 면(-39.3)
const WALL_TOP = EAVE_NAVE - 0.4;               // 16.6
const AISLE_TOP_IN = EAVE_AISLE - 0.3;          // 8.7
const AISLE_CEIL = 8.6;
const VAULT_SPRING = 14.2, VAULT_W = NAVE_IN * 2, VAULT_RISE = NAVE_IN;
const APSE_IN = APSE_R - 0.5, AMB_IN = AMB_R - 0.67; // 후진 벽 r 6.0~6.3 · 회랑 벽 r 11.8~12.1

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const JEWEL = [0x2856c9, 0xb3122e, 0xd4a017, 0x1f7a3e, 0x6a2c91, 0x1d3fa8];
const piers = Array.from({ length: 6 }, (_, k) => TOWER_BACK - BAY * k); // -4.08 … -30.08

/** UV 를 월드 xz(미터)로 — 원판 바닥용 */
function metricXZ(g: THREE.BufferGeometry) {
  const p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i));
  return g;
}

/** 상세 외관 dims(그 판의 지역 좌표: x=길이축, 정면 -x)가 실내 상수와 0.3m 넘게 어긋나면 알린다 */
function checkDims(d: Record<string, any>) {
  const want: [string, number, number][] = [
    ['종탑 깊이', d.xTowerBack - d.xFront, TOWER_FRONT - TOWER_BACK],
    ['정면→익랑', d.xTr0 - d.xFront, TOWER_FRONT - TRANS0],
    ['정면→후진 중심', d.xc - d.xFront, TOWER_FRONT - APSE_C],
    ['측랑 반폭', d.hwAisle, AISLE_HW_OUT], ['신랑 반폭', d.hwNave, NAVE_HW_OUT], ['종탑 반폭', d.hwTower, TOWER_HW],
    ['후진 r', d.rIn, APSE_R], ['회랑 r', d.rOut, AMB_R], ['신랑 처마', d.eaveNave, EAVE_NAVE], ['측랑 처마', d.eaveAisle, EAVE_AISLE],
  ];
  const bad = want.filter(([, got, exp]) => typeof got === 'number' && Math.abs(got - exp) > 0.3);
  if (bad.length) console.warn('[cathedral] 외관 치수가 바뀌었다 — 실내 상수를 다시 맞출 것:', bad.map(([n, g, e]) => `${n} ${(+g).toFixed(2)}≠${e.toFixed(2)}`).join(', '));
}

export function buildCathedral(M: Mats, site?: SiteData | null, opts: { light?: boolean } = {}): SpaceBuild {
  const kit = new Kit();
  const reg = new Registry();
  const windows: WindowLight[] = [];

  let placed: SitePlacement | null = null;
  if (site) {
    try {
      placed = placeSite(kit, M, site, TOWER_FRONT, new THREE.Box2(new THREE.Vector2(-17, APSE_C - AMB_R - 1.5), new THREE.Vector2(17, TOWER_FRONT + 1.5)), opts);
      if (placed.dims) checkDims(placed.dims);
    } catch (e) { console.warn('[cathedral] 구내 지도를 붙이지 못했다 — 일반 앞마당으로 진행', e); }
  }
  const shell = placed?.shell ?? null;
  const free = (x: number, z: number, m = 1.5) => !placed || !placed.blocked(x, z, m);

  // 명동대성당처럼 짙은 파랑 바탕에 인물 메달리온이 이어지는 랜싯 창 위주, 기하 문양은 섞어서만
  const glassMats = [1, 2, 3, 4, 5, 6].map((s) => M.glass(lancetGlass(s * 17)));
  let gi = 0;
  const nextGlass = () => glassMats[gi++ % glassMats.length];
  /** 벽 로컬(sx, y) → 월드 변환을 받아 아치 구멍에 유리를 끼운다 */
  // 측랑·고창은 인물 없는 꽃 문양 기하 유리(VR), 후진 높은 창만 인물 메달리온
  const floralMats = [1, 2, 3].map((s) => M.glass(floralGlass(s * 29)));
  const oculusMat = M.glass(floralGlass(77, true));
  let fi = 0;
  const glaze = (h: ArchHole, toWorld: (sx: number, y: number) => THREE.Vector3, rotY: number, inward: THREE.Vector3, light = true, floral = false) => {
    const p = toWorld(h.cx, h.bottom);
    kit.add(archPane(h.w, h.spring - h.bottom, h.rise), floral ? floralMats[fi++ % floralMats.length] : nextGlass(), { pos: [p.x, p.y, p.z], rot: [0, rotY, 0], shadow: false });
    if (light) windows.push({ pos: toWorld(h.cx, h.spring + h.rise / 2), inward, color: new THREE.Color(JEWEL[windows.length % JEWEL.length]) });
  };
  /** 원 둘레의 한 조각 벽: 중심 (0, APSE_C), 안쪽 반지름 r, 각 a0→a1(0 = -Z, +π/2 = +X). 두께는 바깥으로 */
  const ringPiece = (r: number, a0: number, a1: number) => {
    const P = (a: number) => new THREE.Vector2(r * Math.sin(a), APSE_C - r * Math.cos(a));
    const p0 = P(a1), p1 = P(a0); // a1 → a0 순으로 걸어야 로컬 +Z 가 바깥을 본다
    const t = p1.clone().sub(p0), w = t.length() + 0.12;
    t.normalize();
    const n = new THREE.Vector2(-t.y, t.x);
    return { origin: p0.clone().addScaledVector(t, -0.06), w, rotY: Math.atan2(n.x, n.y), t, n };
  };

  /** 아치 창·개구부 둘레의 테(구멍 바깥으로 pad 만큼). 벽 면에 얇게 덧댄다 */
  const frame = (h: ArchHole, pad: number, depth = 0.08) =>
    wall(archPoints(h.cx, h.w + pad * 2, h.bottom - Math.min(pad, 0.3), h.spring, h.rise + pad), [h], depth);
  /** 기둥 다발: 팔각 몸통 + 네 모서리의 가는 원기둥 + 돌 받침 */
  const clusterPier = (x: number, z: number, r: number) => {
    const H = VAULT_SPRING - F;
    kit.add(cyl(r, r, H, 8), M.greyBrick, { pos: [x, F + H / 2, z], collide: true });
    for (let q = 0; q < 4; q++) {
      const a = Math.PI / 4 + (q * Math.PI) / 2;
      kit.add(cyl(r * 0.24, r * 0.24, H + 0.4, 10), M.greyBrick, { pos: [x + Math.cos(a) * r * 0.95, F + (H + 0.4) / 2, z + Math.sin(a) * r * 0.95] });
    }
    kit.add(cyl(r * 1.3, r * 1.4, 0.5, 8), M.stone, { pos: [x, F + 0.25, z], collide: true });
    kit.add(cyl(r * 1.25, r * 1.05, 0.35, 8), M.stone, { pos: [x, F + H - 0.15, z] });
  };

  // ── 땅 · 앞마당 ────────────────────────────────────────────
  // 언덕이 있으면 바깥 바닥은 언덕 아래(-HILL), 걷는 땅은 site.ts 의 지형 충돌이 맡는다
  const hill = !!placed?.landscape;
  kit.add(box(260, 0.2, 260), M.grass, { pos: [0, hill ? -HILL - 0.3 : -0.1, 0], collide: true });
  if (!placed?.landscape) kit.add(box(30, 0.04, 22), M.paving, { pos: [0, 0, 20], collide: true }); // 풍경이 있으면 그 포석을 쓴다

  // ── 바닥 ──────────────────────────────────────────────────
  kit.add(box(NAR_IN * 2, F, FRONT_IN - XWALL), M.tiles, { pos: [0, F / 2, (FRONT_IN + XWALL) / 2], collide: true });
  kit.add(box(3.6, F, TOWER_FRONT + 0.8 - FRONT_IN), M.marble, { pos: [0, F / 2, (TOWER_FRONT + 0.8 + FRONT_IN) / 2], collide: true }); // 현관 돌출부 문턱
  kit.add(box(AISLE_IN * 2 + OT * 2, F, NAVE_Z0 - APSE_C), M.tiles, { pos: [0, F / 2, (NAVE_Z0 + APSE_C) / 2], collide: true });
  kit.add(metricXZ(new THREE.CylinderGeometry(AMB_IN + OT, AMB_IN + OT, F, 40, 1, false, Math.PI / 2, Math.PI)), M.tiles, { pos: [0, F / 2, APSE_C], collide: true });

  // ── 종탑 현관 ──────────────────────────────────────────────
  const door: ArchHole = { cx: 0, w: 3.4, bottom: F, spring: 4.5, rise: 1.7 }; // 꼭대기 6.2 (외피 6.4 아래)
  kit.add(wall(rect(-NAR_IN - 0.4, 0, NAR_IN + 0.4, 8), [door], FRONT_T), M.greyBrick, { pos: [0, 0, FRONT_IN], collide: true });
  const narLen = FRONT_IN + FRONT_T - XWALL;
  const narSide: ArchHole[] = [{ cx: narLen / 2, w: 1.2, bottom: 3.0, spring: 5.0, rise: 0.8 }];
  for (const s of [1, -1]) {
    const px = s > 0 ? NAR_IN : -NAR_IN - 0.4;
    kit.add(wall(rect(0, 0, narLen, 8), narSide, 0.4), M.greyBrick, { pos: [px, 0, FRONT_IN + FRONT_T], rot: [0, Math.PI / 2, 0], collide: true });
    for (const h of narSide) glaze(h, (sx, y) => v3(px + 0.2, y, FRONT_IN + FRONT_T - sx), Math.PI / 2, v3(-s, 0, 0), false);
  }
  kit.add(box(NAR_IN * 2, 0.3, FRONT_IN - XWALL), M.cream, { pos: [0, F + 7.15, (FRONT_IN + XWALL) / 2] });

  // 정문 문짝(움직인다) + 팀파눔
  const doorZ = FRONT_IN + FRONT_T / 2;
  const leaves: { pivot: THREE.Object3D; sign: number }[] = [];
  const leafMeshes: THREE.Object3D[] = [];
  const leafH = door.spring - door.bottom;
  for (const s of [1, -1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * door.w / 2, F, doorZ);
    pivot.userData.dynamic = true; pivot.userData.noCollide = true; // 문짝은 지나간다(닫힌 문은 blockDoors 가 막는다)
    kit.root.add(pivot);
    leafMeshes.push(kit.add(box(door.w / 2 + 0.03, leafH, 0.12), M.woodDark, { parent: pivot, pos: [-s * (door.w / 4 + 0.015), leafH / 2, s * 0.004], dynamic: true }));
    kit.add(box(0.08, 0.5, 0.08), M.iron, { parent: pivot, pos: [-s * (door.w / 2 - 0.18), 1.6, 0.1], dynamic: true });
    leaves.push({ pivot, sign: s > 0 ? -1 : 1 });
  }
  kit.add(new THREE.ShapeGeometry(shapeFrom(archPoints(0, door.w, door.spring, door.spring, door.rise))), M.woodDark, { pos: [0, 0, doorZ], shadow: false });
  const doors: DoorRt[] = [{ id: 'front', leaves, blocker: new THREE.Box3(v3(-door.w / 2, -1, doorZ - 0.45), v3(door.w / 2, 10, doorZ + 0.45)), open: false, t: 0 }];
  reg.add(leafMeshes, { kind: 'door', id: 'front', title: '정문', body: '종탑 아래 정문입니다. 열고 닫을 수 있고, 문 상태는 모두에게 같이 보입니다.', anchor: v3(0, F + 1.6, doorZ) });

  // 정문 앞 계단(보이는 것) + 경사로(충돌)
  const st0 = TOWER_FRONT + 0.8;
  [[st0 + 1.2, st0 + 1.8, 0.2], [st0 + 0.6, st0 + 1.2, 0.4], [st0, st0 + 0.6, 0.6]].forEach(([z0, z1, top]) => {
    kit.add(box(5.2, top, z1 - z0), M.stone, { pos: [0, top / 2, (z0 + z1) / 2] });
  });
  kit.add(extrude(shapeFrom([[FRONT_IN, 0], [st0 + 2.1, 0], [st0, F + 0.02], [FRONT_IN, F + 0.02]]), 5.2), M.stone, { pos: [2.6, 0, 0], rot: [0, -Math.PI / 2, 0], colliderOnly: true });

  // ── 현관 ↔ 신랑 벽(측랑 앞면 포함) ─────────────────────────
  const xwOutline: V2[] = [[-AISLE_IN - OT, 0], [AISLE_IN + OT, 0], [AISLE_IN + OT, AISLE_TOP_IN], [NAVE_IN + NAVE_WALL, AISLE_TOP_IN], [NAVE_IN + NAVE_WALL, VAULT_SPRING],
    ...archPoints(0, VAULT_W + 1.0, VAULT_SPRING, VAULT_SPRING, VAULT_RISE + 0.5).slice(2, -2).reverse(),
    [-NAVE_IN - NAVE_WALL, VAULT_SPRING], [-NAVE_IN - NAVE_WALL, AISLE_TOP_IN], [-AISLE_IN - OT, AISLE_TOP_IN]];
  const xwHoles: ArchHole[] = [{ cx: 0, w: 4.0, bottom: F, spring: F + 4.4, rise: 2.2 }, ...[-1, 1].map((s) => ({ cx: s * 10.8, w: 1.8, bottom: 3.0, spring: 6.0, rise: 1.2 }))];
  kit.add(wall(xwOutline, xwHoles, XWALL_T), M.greyBrick, { pos: [0, 0, NAVE_Z0], collide: true });
  for (const h of xwHoles.slice(1)) glaze(h, (sx, y) => v3(sx, y, NAVE_Z0 + XWALL_T / 2), 0, v3(0, 0, -1), false);

  // ── 측랑 바깥벽 (베이 5칸) ───────────────────────────────────
  const aisleLen = NAVE_Z0 - TRANS0;
  // VR(측랑): 베이마다 좁은 랜싯 둘 + 그 위 둥근 창(오쿨루스), 셋을 회색 벽돌 첨두 아치 테가 감싼다
  const bayC = piers.slice(0, 5).map((z) => NAVE_Z0 - (z - BAY / 2));
  const aisleHoles: ArchHole[] = bayC.flatMap((c) => [-0.56, 0.56].map((d) => ({ cx: c + d, w: 0.84, bottom: 3.0, spring: 6.0, rise: 0.75 })));
  const aisleEyes = bayC.map((c) => ({ cx: c, cy: 7.25, r: 0.46 }));
  for (const side of [1, -1]) {
    const px = side > 0 ? AISLE_IN : -AISLE_IN - OT;
    kit.add(wall(rect(0, 0, aisleLen, AISLE_TOP_IN), aisleHoles, OT, aisleEyes), M.wallWhite, { pos: [px, 0, NAVE_Z0], rot: [0, Math.PI / 2, 0], collide: true });
    for (const h of aisleHoles) glaze(h, (sx, y) => v3(px + OT / 2, y, NAVE_Z0 - sx), Math.PI / 2, v3(-side, 0, 0), true, true);
    for (const e of aisleEyes) {
      kit.add(new THREE.CircleGeometry(e.r, 32), oculusMat, { pos: [px + OT / 2, e.cy, NAVE_Z0 - e.cx], rot: [0, Math.PI / 2, 0], shadow: false });
      kit.add(new THREE.TorusGeometry(e.r + 0.08, 0.07, 6, 32), M.greyBrick, { pos: [side > 0 ? px - 0.03 : px + OT + 0.03, e.cy, NAVE_Z0 - e.cx], rot: [0, Math.PI / 2, 0], shadow: false });
      // 셋을 감싸는 큰 첨두 아치 테 + 창턱
      const big: ArchHole = { cx: e.cx, w: 2.5, bottom: 2.9, spring: 6.1, rise: 1.95 };
      kit.add(frame(big, 0.26, 0.06), M.greyBrick, { pos: [side > 0 ? px - 0.06 : px + OT, 0, NAVE_Z0], rot: [0, Math.PI / 2, 0] });
      kit.add(box(0.22, 0.12, 2.6), M.greyBrick, { pos: [side * (AISLE_IN - 0.08), 2.86, NAVE_Z0 - e.cx] });
    }
    // 벽 기둥(측랑 벽의 베이 구분) — 회색 벽돌 반기둥
    for (const z of piers.slice(1)) kit.add(box(0.5, AISLE_TOP_IN - F, 0.7), M.greyBrick, { pos: [side * (AISLE_IN - 0.2), (AISLE_TOP_IN + F) / 2, z], collide: true });
  }

  // ── 신랑 아케이드 + 고창 ─────────────────────────────────────
  const openings: [number, number][] = [];
  for (let k = 0; k < 5; k++) {
    const a = Math.max(0.3, NAVE_Z0 - piers[k] + 0.5), b = NAVE_Z0 - piers[k + 1] - 0.5;
    openings.push([a, b]);
  }
  // 고창 — 베이마다 좁고 높은 쌍창(명동대성당 고창은 둘씩 짝지은 랜싯)
  const clere: ArchHole[] = openings.flatMap(([a, b]) => [-0.62, 0.62].map((d) => ({ cx: (a + b) / 2 + d, w: 0.9, bottom: 10.6, spring: 13.0, rise: 0.75 })));
  for (const side of [1, -1]) {
    const px = side > 0 ? NAVE_IN : -NAVE_IN - NAVE_WALL;
    // VR: 아케이드 위 벽면은 크림색 회벽 — 벽돌은 기둥·아치 테·트리포리움 띠·고창 테에만
    kit.add(arcade(aisleLen, WALL_TOP - F, openings, 5.4, 2.6, NAVE_WALL, clere), M.wallWhite, { pos: [px, F, NAVE_Z0], rot: [0, Math.PI / 2, 0], collide: true });
    for (const h of clere) {
      glaze(h, (sx, y) => v3(px + NAVE_WALL / 2, y + F, NAVE_Z0 - sx), Math.PI / 2, v3(-side, 0, 0), true, true);
      kit.add(frame({ ...h, bottom: h.bottom + F, spring: h.spring + F }, 0.16, 0.05), M.greyBrick, { pos: [side > 0 ? px - 0.06 : px + NAVE_WALL + 0.01, 0, NAVE_Z0], rot: [0, Math.PI / 2, 0] });
    }
    // 아케이드 아치 테(겹친 회색 벽돌 몰딩)
    for (const [a, b] of openings) {
      const h: ArchHole = { cx: (a + b) / 2, w: b - a, bottom: F, spring: F + 5.4, rise: 2.6 };
      kit.add(frame(h, 0.28, 0.05), M.greyBrick, { pos: [side > 0 ? px - 0.08 : px + NAVE_WALL + 0.03, 0, NAVE_Z0], rot: [0, Math.PI / 2, 0] });
    }
    // 트리포리움 — 아케이드와 고창 사이, 작은 아치 구멍이 줄지어 있다(안은 어둡다)
    for (const [a, b] of openings) {
      // VR: 트리포리움 구멍은 작고 촘촘하다(베이마다 여섯), 가는 벽돌 기둥 사이로
      for (let q = 0; q < 6; q++) {
        const w = (b - a - 0.6) / 6, cx = a + 0.3 + w * (q + 0.5);
        const tri = new THREE.ShapeGeometry(shapeFrom(archPoints(cx, w * 0.62, F + 9.0, F + 9.8, w * 0.32)));
        kit.add(tri, M.voidDark, { pos: [side > 0 ? px - 0.07 : px + NAVE_WALL + 0.07, 0, NAVE_Z0], rot: [0, Math.PI / 2, 0], shadow: false });
      }
      // 트리포리움 띠 바탕(벽돌) — 작은 첨두 아치들이 이 위에 어둡게 뚫린다
      kit.add(box(0.05, 1.8, b - a), M.greyBrick, { pos: [side * (NAVE_IN - 0.02), F + 9.5, NAVE_Z0 - (a + b) / 2], shadow: false });
      kit.add(box(0.12, 0.16, b - a), M.greyBrick, { pos: [side * (NAVE_IN - 0.06), F + 8.7, NAVE_Z0 - (a + b) / 2] });
      kit.add(box(0.12, 0.16, b - a), M.greyBrick, { pos: [side * (NAVE_IN - 0.06), F + 10.35, NAVE_Z0 - (a + b) / 2] });
    }
    // 기둥 다발 — 굵은 팔각 몸통 + 가는 원기둥 넷, 볼트 리브가 여기서 솟는다
    for (let k = 1; k < 5; k++) clusterPier(side * (NAVE_IN + 0.1), piers[k], 0.62);
    // 교차부 큰 기둥
    clusterPier(side * (NAVE_IN + 0.25), TRANS0, 0.85);
  }

  // ── 신랑 볼트 · 리브 ─────────────────────────────────────────
  kit.add(extrude(archBand(VAULT_W, VAULT_SPRING, VAULT_RISE, 0.3), NAVE_Z0 - APSE_C), M.vault, { pos: [0, 0, APSE_C] });
  for (const z of [...piers.slice(1), TRANS_REAR, APSE_C + 0.2]) {
    kit.add(extrude(archBand(VAULT_W - 0.4, VAULT_SPRING, VAULT_RISE - 0.2, 0.32), 0.36), M.greyBrick, { pos: [0, 0, z - 0.18] });
  }
  kit.add(box(0.28, 0.28, NAVE_Z0 - APSE_C), M.greyBrick, { pos: [0, VAULT_SPRING + VAULT_RISE - 0.17, (NAVE_Z0 + APSE_C) / 2] });
  // 대각선 리브 — 베이마다 X 자로 교차한다(4분 리브 볼트)
  const bays: [number, number][] = [[NAVE_Z0, piers[1]], ...[1, 2, 3, 4].map((k) => [piers[k], piers[k + 1]] as [number, number]), [TRANS0, TRANS_REAR]];
  for (const [z0, z1] of bays) {
    for (const s of [1, -1]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, x = s * (-NAVE_IN + 2 * NAVE_IN * t);
        const y = VAULT_SPRING + Math.sqrt(Math.max(0, NAVE_IN * NAVE_IN - x * x)) * (VAULT_RISE / NAVE_IN) - 0.22;
        pts.push(v3(x * 0.97, y, z0 + (z1 - z0) * t));
      }
      kit.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.13, 6), M.greyBrick, { shadow: false });
    }
    // 리브가 만나는 자리의 둥근 돌(키스톤) + 천장 조명
    const zm = (z0 + z1) / 2;
    kit.add(new THREE.SphereGeometry(0.32, 12, 8), M.greyBrick, { pos: [0, VAULT_SPRING + VAULT_RISE - 0.35, zm], shadow: false });
    // v3-6 천장 스포트라이트 — 실제 사진: 리브 사이 볼트 면에 박힌 작은 둥근 등이 베이마다 좌우 하나씩. 등 몸통(검정) + 밝은 렌즈 + 번짐.
    // 빛 자체는 더하지 않는다(실내 밝기는 사장님 확정값 그대로)
    for (const sx of [1, -1]) {
      const x = sx * 1.9, yS = VAULT_SPRING + Math.sqrt(NAVE_IN * NAVE_IN - x * x) * (VAULT_RISE / NAVE_IN); // 볼트 안쪽 면 높이
      const nx = x / NAVE_IN, ny = (yS - VAULT_SPRING) / VAULT_RISE; // 면의 바깥쪽 법선(단위)
      const g = new THREE.Group();
      g.position.set(x - nx * 0.06, yS - ny * 0.06, zm);
      g.rotation.z = Math.atan2(-nx, ny); // 등의 아래(-Y)가 볼트 면에 수직으로 실내를 향하게
      kit.root.add(g);
      kit.add(cyl(0.11, 0.13, 0.16, 12), M.iron, { parent: g, pos: [0, -0.08, 0], shadow: false });
      kit.add(new THREE.CircleGeometry(0.085, 14), M.lampGlow, { parent: g, pos: [0, -0.165, 0], rot: [Math.PI / 2, 0, 0], shadow: false });
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowTex, color: 0xfff0c8, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(0.9); halo.position.set(0, -0.3, 0); g.add(halo);
    }
  }

  // 측랑 천장
  for (const side of [1, -1]) {
    const x0 = NAVE_IN + NAVE_WALL, w = AISLE_IN - x0, cx = side * (x0 + w / 2);
    kit.add(box(w, 0.15, aisleLen), M.cream, { pos: [cx, AISLE_CEIL + 0.07, (NAVE_Z0 + TRANS0) / 2] });
    for (const z of piers.slice(1)) kit.add(box(w, 0.4, 0.34), M.greyBrick, { pos: [cx, AISLE_CEIL - 0.2, z] });
  }

  // ── 익랑 ──────────────────────────────────────────────────
  const transW = TRANS0 - TRANS_REAR, transMid = (TRANS0 + TRANS_REAR) / 2;
  for (const side of [1, -1]) {
    // x 방향 볼트(교차부 → 끝벽)
    const x0 = NAVE_IN + NAVE_WALL;
    kit.add(extrude(archBand(transW, VAULT_SPRING, transW / 2, 0.3), AISLE_IN - x0 + 0.1), M.plaster, { pos: [side > 0 ? x0 : -AISLE_IN - 0.1, 0, transMid], rot: [0, Math.PI / 2, 0] });
    kit.add(extrude(archBand(transW - 0.4, VAULT_SPRING, transW / 2 - 0.2, 0.32), 0.36), M.greyBrick, { pos: [side * (AISLE_IN - 0.4), 0, transMid], rot: [0, Math.PI / 2, 0] });
    // 끝벽: 장미창 + 랜싯
    const endOutline: V2[] = [[0, 0], [transW, 0], [transW, VAULT_SPRING], ...archPoints(transW / 2, transW, VAULT_SPRING, VAULT_SPRING, transW / 2 + 0.2).slice(2, -2).reverse(), [0, VAULT_SPRING]];
    const endHoles: ArchHole[] = [{ cx: transW / 2, w: 2.2, bottom: 2.4, spring: 6.4, rise: 1.4 }];
    const px = side > 0 ? AISLE_IN : -AISLE_IN - OT;
    kit.add(wall(endOutline, endHoles, OT, [{ cx: transW / 2, cy: 11.0, r: 2.4 }]), M.wallWhite, { pos: [px, 0, TRANS0], rot: [0, Math.PI / 2, 0], collide: true });
    for (const h of endHoles) {
      glaze(h, (sx, y) => v3(px + OT / 2, y, TRANS0 - sx), Math.PI / 2, v3(-side, 0, 0));
      kit.add(frame(h, 0.34), M.greyBrick, { pos: [side > 0 ? px - 0.06 : px + OT, 0, TRANS0], rot: [0, Math.PI / 2, 0] });
    }
    kit.add(new THREE.TorusGeometry(2.55, 0.18, 8, 48), M.greyBrick, { pos: [px + (side > 0 ? -0.08 : OT + 0.08), 11.0, transMid], rot: [0, Math.PI / 2, 0], shadow: false });
    kit.add(new THREE.CircleGeometry(2.4, 48), M.glass(roseWindow()), { pos: [px + OT / 2, 11.0, transMid], rot: [0, Math.PI / 2, 0], shadow: false });
    windows.push({ pos: v3(px, 11.0, transMid), inward: v3(-side, 0, 0), color: new THREE.Color(0x6a2c91) });
    // 측랑 천장과 익랑 볼트 사이 막는 벽 — 바깥 익랑 앞벽(≈ z -30.4) 보다 안쪽에 둔다(전에는 0.5 m 밖으로 나와 측랑 지붕 위에 흰 판으로 보였다)
    kit.add(box(AISLE_IN - x0, VAULT_SPRING + 0.3 - AISLE_CEIL, 0.4), M.cream, { pos: [side * (x0 + (AISLE_IN - x0) / 2), (VAULT_SPRING + 0.3 + AISLE_CEIL) / 2, TRANS0 - 0.75] });
    // 뒷벽(z = TRANS_REAR): 회랑으로 통하는 아치 + 바깥쪽 막힌 부분
    const rearLen = AISLE_IN + OT - x0;
    kit.add(wall(rect(0, 0, rearLen, VAULT_SPRING + 0.3), [{ cx: (AMB_IN - x0) / 2 + 0.2, w: AMB_IN - APSE_R - 0.6, bottom: F, spring: 6.4, rise: 2.0 }], OT),
      M.cream, { pos: side > 0 ? [x0, 0, TRANS_REAR - OT] : [-x0, 0, TRANS_REAR], rot: [0, side > 0 ? 0 : Math.PI, 0], collide: true });
  }

  // ── 후진(성소) · 회랑 ────────────────────────────────────────
  const APSE_SEG = 7;
  for (let i = 0; i < APSE_SEG; i++) {
    const a0 = -Math.PI / 2 + (i * Math.PI) / APSE_SEG, a1 = a0 + Math.PI / APSE_SEG;
    const g = ringPiece(APSE_IN, a0, a1);
    // 후진 위쪽 — 명동대성당 제대 뒤의 높고 좁은 스테인드글라스 랜싯
    const upper: ArchHole = { cx: g.w / 2, w: 1.15, bottom: 7.6, spring: 12.9, rise: 0.85 };
    const open = i === 0 || i === APSE_SEG - 1; // 양 끝만 회랑으로 트고, 가운데는 벽감 띠를 둔다
    const geo = open
      ? arcade(g.w, WALL_TOP - F, [[(g.w - 1.8) / 2, (g.w + 1.8) / 2]], 5.0, 2.4, 0.3, [upper])
      : wall(rect(0, 0, g.w, WALL_TOP - F), [upper], 0.3);
    kit.add(geo, M.wallWhite, { pos: [g.origin.x, F, g.origin.y], rot: [0, g.rotY, 0], collide: true });
    const at = (sx: number, y: number, inset: number) => v3(g.origin.x + g.t.x * sx - g.n.x * inset, y, g.origin.y + g.t.y * sx - g.n.y * inset);
    glaze({ ...upper, bottom: upper.bottom + F, spring: upper.spring + F }, (sx, y) => at(sx, y, -0.15), g.rotY, v3(-g.n.x, 0, -g.n.y));
    // 창 둘레 회색 벽돌 테 + 세그먼트 이음매의 가는 기둥(볼트까지)
    const fr = frame({ ...upper, bottom: upper.bottom + F, spring: upper.spring + F }, 0.26);
    { const p = at(0, 0, 0.04); kit.add(fr, M.greyBrick, { pos: [p.x, 0, p.z], rot: [0, g.rotY, 0] }); }
    { const p = at(0, 0, 0.12); kit.add(cyl(0.13, 0.13, VAULT_SPRING + 1.4 - F, 8), M.greyBrick, { pos: [p.x, (VAULT_SPRING + 1.4 + F) / 2, p.z] }); }
    if (!open) {
      // 성인 그림 벽감 두 칸(제대 뒤 띠) — 금빛 테두리 첨두 벽감
      for (const q of [0.28, 0.72]) {
        const p = at(g.w * q, F + 3.6, 0.02);
        const niche = kit.add(new THREE.PlaneGeometry(Math.min(1.05, g.w * 0.42), 2.1), M.picture(saintNiche(i * 2 + (q > 0.5 ? 1 : 0))), { pos: [p.x, p.y + 0.25, p.z], rot: [0, g.rotY + Math.PI, 0], shadow: false });
        niche.renderOrder = 1;
      }
      const b = at(g.w / 2, F + 2.7, 0.06); kit.add(box(g.w, 0.14, 0.14), M.gold, { pos: [b.x, b.y, b.z], rot: [0, g.rotY, 0] });
      const b2 = at(g.w / 2, F + 4.5, 0.06); kit.add(box(g.w, 0.14, 0.14), M.gold, { pos: [b2.x, b2.y, b2.z], rot: [0, g.rotY, 0] });
      const wd = at(g.w / 2, F + 1.3, 0.12); kit.add(box(g.w, 2.6, 0.12), M.woodDark, { pos: [wd.x, wd.y, wd.z], rot: [0, g.rotY, 0] });
    }
  }
  const AMB_SEG = 9;
  for (let i = 0; i < AMB_SEG; i++) {
    const a0 = -Math.PI / 2 + (i * Math.PI) / AMB_SEG, a1 = a0 + Math.PI / AMB_SEG;
    const g = ringPiece(AMB_IN, a0, a1);
    const win: ArchHole = { cx: g.w / 2, w: 1.6, bottom: 2.4, spring: 5.6, rise: 1.0 };
    kit.add(wall(rect(0, 0, g.w, AISLE_TOP_IN), [win], 0.3), M.wallWhite, { pos: [g.origin.x, 0, g.origin.y], rot: [0, g.rotY, 0], collide: true });
    glaze(win, (sx, y) => v3(g.origin.x + g.t.x * sx + g.n.x * 0.15, y, g.origin.y + g.t.y * sx + g.n.y * 0.15), g.rotY, v3(-g.n.x, 0, -g.n.y));
  }
  kit.add(new THREE.RingGeometry(APSE_IN + 0.3, AMB_IN, 40, 1, 0, Math.PI).rotateX(-Math.PI / 2), M.cream, { pos: [0, AISLE_CEIL, APSE_C], shadow: false });
  // 후진 반돔 + 신랑 볼트 끝을 막는 벽
  const dome = kit.add(new THREE.SphereGeometry(APSE_IN, 32, 12, Math.PI, Math.PI, 0, Math.PI / 2), M.vault, { pos: [0, VAULT_SPRING, APSE_C], shadow: false });
  dome.scale.y = 0.38;
  const domeTop = APSE_IN * 0.38;
  const tymp: V2[] = [...archPoints(0, VAULT_W + 0.8, VAULT_SPRING, VAULT_SPRING, VAULT_RISE + 0.4).slice(1, -1)];
  for (let k = 0; k <= 16; k++) { const x = APSE_IN - (2 * APSE_IN * k) / 16; tymp.push([x, VAULT_SPRING + domeTop * Math.sqrt(Math.max(0, 1 - (x / APSE_IN) ** 2))]); }
  kit.add(extrude(shapeFrom(tymp), 0.3), M.vault, { pos: [0, 0, APSE_C - 0.15] });

  // 성소 단(한 단 높임) + 계단 + 제대
  const SAN = APSE_C + 3.0; // 단 앞 가장자리 z
  kit.add(box(NAVE_IN * 2, 0.6, SAN - APSE_C), M.marble, { pos: [0, F + 0.3, (SAN + APSE_C) / 2], collide: true });
  kit.add(metricXZ(new THREE.CylinderGeometry(APSE_IN - 0.05, APSE_IN - 0.05, 0.6, 32, 1, false, Math.PI / 2, Math.PI)), M.marble, { pos: [0, F + 0.3, APSE_C], collide: true });
  [[SAN + 0.6, SAN + 0.9, 0.2], [SAN + 0.3, SAN + 0.6, 0.4], [SAN, SAN + 0.3, 0.6]].forEach(([z0, z1, top]) => {
    kit.add(box(NAVE_IN * 2, top, z1 - z0), M.stone, { pos: [0, F + top / 2, (z0 + z1) / 2] });
  });
  kit.add(extrude(shapeFrom([[SAN - 0.2, F], [SAN + 1.1, F], [SAN, F + 0.62], [SAN - 0.2, F + 0.62]]), NAVE_IN * 2), M.stone, { pos: [NAVE_IN, 0, 0], rot: [0, -Math.PI / 2, 0], colliderOnly: true });
  // 붉은 카펫 — 단 위 전체와 가운데 계단
  kit.add(box(NAVE_IN * 2 - 0.4, 0.02, SAN - APSE_C - 0.4), M.carpet, { pos: [0, F + 0.61, (SAN + APSE_C) / 2 + 0.1], shadow: false });
  kit.add(metricXZ(new THREE.CylinderGeometry(APSE_IN - 0.5, APSE_IN - 0.5, 0.02, 32, 1, false, Math.PI / 2, Math.PI)), M.carpet, { pos: [0, F + 0.61, APSE_C], shadow: false });
  [[SAN + 0.6, 0.21], [SAN + 0.3, 0.41], [SAN, 0.61]].forEach(([z0, top]) => kit.add(box(3.2, 0.02, 0.3), M.carpet, { pos: [0, F + top, z0 + 0.15], shadow: false }));
  // 영성체 난간 — 가운데를 틔운 짙은 나무 난간
  for (const s of [1, -1]) {
    kit.add(box(NAVE_IN - 1.6, 0.07, 0.12), M.woodDark, { pos: [s * (1.6 + (NAVE_IN - 1.6) / 2), F + 1.42, SAN - 0.15] });
    kit.add(box(NAVE_IN - 1.6, 1.4, 0.2), M.woodDark, { pos: [s * (1.6 + (NAVE_IN - 1.6) / 2), F + 0.7, SAN - 0.15], colliderOnly: true }); // 난간은 가운데로만 지난다
    for (let x = 1.7; x < NAVE_IN; x += 0.3) kit.add(cyl(0.022, 0.022, 0.8, 6), M.bronze, { pos: [s * x, F + 1.0, SAN - 0.15] });
  }
  // 감실 · 제대 뒤 장식대 — VR(제대#1): 흰 대리석 단 위, 초록 휘장의 감실 문, 그 위로 가는 고딕 첨탑들, 양옆 긴 촛대
  const tabZ = APSE_C - APSE_IN + 1.0;
  const white = new THREE.MeshStandardMaterial({ color: 0xece6d8, roughness: 0.35 });
  const veil = new THREE.MeshStandardMaterial({ color: 0x2f6a3e, roughness: 0.8 });
  kit.add(box(3.0, 0.9, 0.9), white, { pos: [0, F + 1.05, tabZ], collide: true });                      // 장식대 몸
  kit.add(box(3.2, 0.08, 1.0), white, { pos: [0, F + 1.54, tabZ] });
  kit.add(box(0.9, 1.0, 0.7), white, { pos: [0, F + 2.08, tabZ] });                       // 감실
  // 감실 문: 실제(VR 제대#1)는 초록 이중 문에 금빛 IHS 표지
  kit.add(new THREE.PlaneGeometry(0.5, 0.7), veil, { pos: [0, F + 2.05, tabZ + 0.36], shadow: false });
  kit.add(box(0.14, 0.05, 0.01), M.gold, { pos: [0, F + 2.2, tabZ + 0.365], shadow: false });
  for (const dx of [-0.38, 0.38]) kit.add(cyl(0.05, 0.05, 1.2, 10), white, { pos: [dx, F + 2.2, tabZ + 0.3] });
  // 첨탑: 가운데 높은 것 + 양옆 작은 것(흰 돌, 끝에 작은 금 십자가)
  for (const [dx, h, r] of [[0, 2.4, 0.26], [-0.62, 1.3, 0.14], [0.62, 1.3, 0.14]] as [number, number, number][]) {
    const base = F + 2.6;
    kit.add(box(r * 2.2, 0.5, r * 2.2), white, { pos: [dx, base + 0.25, tabZ] });
    kit.add(new THREE.ConeGeometry(r, h, 4), white, { pos: [dx, base + 0.5 + h / 2, tabZ], rot: [0, Math.PI / 4, 0] });
    kit.add(box(0.03, 0.18, 0.03), M.gold, { pos: [dx, base + 0.6 + h, tabZ] });
    kit.add(box(0.1, 0.03, 0.03), M.gold, { pos: [dx, base + 0.64 + h, tabZ] });
  }
  // 장식대 위 긴 초 여섯(놋쇠 촛대)
  for (const dx of [-1.3, -0.95, -0.6, 0.6, 0.95, 1.3]) {
    kit.add(cyl(0.05, 0.08, 0.5, 10), M.bronze, { pos: [dx, F + 1.83, tabZ + 0.1] });
    kit.add(cyl(0.03, 0.03, 0.6, 8), M.wax, { pos: [dx, F + 2.38, tabZ + 0.1] });
  }
  // 제대 — 흰 대리석 상판을 기둥 넷이 받치고, 앞에 레이스 제대보
  const altarZ = APSE_C - 1.2;
  // 제대를 위에서 비추는 은은한 조명 — 흰 대리석 제대와 사도 성화 띠로 시선이 모이게(사장님 확정)
  {
    const spot = new THREE.SpotLight(0xffe2b0, 90, 26, 0.42, 0.65, 1.6);
    spot.position.set(0, F + 13, altarZ + 7);
    spot.target.position.set(0, F + 1.6, altarZ - 1.2);
    kit.root.add(spot, spot.target);
  }
  const altar = kit.add(box(2.6, 0.12, 1.1), white, { pos: [0, F + 1.55, altarZ], collide: true, dynamic: true });
  kit.add(box(2.3, 0.85, 0.8), white, { pos: [0, F + 1.05, altarZ - 0.1], collide: true });
  for (const dx of [-1.1, -0.37, 0.37, 1.1]) kit.add(cyl(0.07, 0.08, 0.9, 12), white, { pos: [dx, F + 1.05, altarZ + 0.45] });
  kit.add(box(2.66, 0.03, 1.16), veil, { pos: [0, F + 1.62, altarZ] });
  kit.add(box(2.7, 0.26, 0.01), M.cloth, { pos: [0, F + 1.5, altarZ + 0.585] }); // 늘어진 레이스
  reg.add(altar, { kind: 'info', id: 'altar', title: '제대', body: '성당의 중심이 되는 자리입니다. 둥근 후진(앱스)이 제대를 감싸고, 그 뒤로 회랑이 돌아갑니다. 이 시범 공간에서는 제대·성소에 감상과 설명만 두고 다른 상호작용은 붙이지 않았습니다.', anchor: v3(0, F + 1.2, altarZ) });
  // v3-10: 독서대(ambo) — VR(예전 독서대): 가는 검은 기둥 위에 비스듬한 독서면. 받침은 가늘게(걸림 최소)
  {
    const ax = -4.0, az = SAN - 0.6, blk = new THREE.MeshStandardMaterial({ color: 0x1b1816, roughness: 0.5, metalness: 0.3 });
    kit.add(cyl(0.03, 0.03, 0.95, 8), blk, { pos: [ax, F + 0.6 + 0.475, az], collide: true });
    kit.add(cyl(0.2, 0.22, 0.03, 16), blk, { pos: [ax, F + 0.6 + 0.015, az], noCollide: true });
    kit.add(box(0.5, 0.03, 0.38), blk, { pos: [ax, F + 0.6 + 1.0, az + 0.02], rot: [-0.5, 0, 0], noCollide: true });
    kit.add(box(0.42, 0.02, 0.3), M.cloth, { pos: [ax, F + 0.6 + 1.03, az + 0.03], rot: [-0.5, 0, 0], noCollide: true, shadow: false });
  }

  // ── 강론대 — 교차부 기둥에 붙은 짙은 나무 강론대와 높은 첨탑 덮개 ──
  {
    const px = NAVE_IN - 0.7, pz = TRANS0 - 1.8;
    kit.add(cyl(0.25, 0.3, 2.2, 6), M.woodDark, { pos: [px, F + 1.1, pz], collide: true });
    kit.add(cyl(0.75, 0.55, 1.1, 6), M.woodDark, { pos: [px, F + 2.75, pz] });
    kit.add(cyl(0.85, 0.85, 0.12, 6), M.woodDark, { pos: [px, F + 3.35, pz] });
    kit.add(cyl(0.95, 0.95, 0.15, 6), M.woodDark, { pos: [px + 0.15, F + 6.2, pz] });
    kit.add(new THREE.ConeGeometry(0.85, 4.2, 6), M.woodDark, { pos: [px + 0.15, F + 8.4, pz] });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; kit.add(new THREE.ConeGeometry(0.12, 1.3, 4), M.woodDark, { pos: [px + 0.15 + Math.cos(a) * 0.8, F + 6.9, pz + Math.sin(a) * 0.8] }); }
  }

  // ── 오르간 발코니(입구 쪽 위) ───────────────────────────────
  const balZ1 = NAVE_Z0 - 3.8;
  kit.add(box(NAVE_IN * 2, 0.4, NAVE_Z0 - balZ1), M.woodDark, { pos: [0, F + 7.2, (NAVE_Z0 + balZ1) / 2] });
  kit.add(box(NAVE_IN * 2, 0.9, 0.12), M.woodDark, { pos: [0, F + 7.85, balZ1] });
  for (const x of [-3.8, 3.8]) kit.add(cyl(0.25, 0.25, 7.0, 12), M.stoneDark, { pos: [x, F + 3.5, balZ1 + 0.2], collide: true });
  for (let i = 0; i < 17; i++) {
    const x = -4.0 + i * 0.5, h = 1.8 + 2.0 * (1 - Math.abs(i - 8) / 8);
    kit.add(cyl(0.11, 0.11, h, 10), M.pipe, { pos: [x, F + 7.4 + h / 2, NAVE_Z0 - 0.6] });
  }
  const organPos = v3(0, F + 9, NAVE_Z0 - 1.5);

  // ── 기둥 촛대형 놋쇠 샹들리에(VR: 신랑 기둥마다 중간 높이에 달린 전구 촛대) ──
  {
    const bulbGeo = new THREE.SphereGeometry(0.045, 8, 6), cupGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.12, 8);
    const ringGeo = new THREE.TorusGeometry(0.34, 0.018, 6, 28), armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.62, 6);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false });
    // v3-6 실제 사진(기둥 촛대)대로 디테일: 벽에서 나온 까치발 + 사슬 + 가운데 기둥, 굽은 가지 끝마다 초 모양 전구, 아래 둥근 추
    const stemGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.05, 8), chainGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.32, 5);
    const knobGeo = new THREE.SphereGeometry(0.07, 10, 8), braceGeo = new THREE.TorusGeometry(0.3, 0.016, 6, 12, Math.PI / 2);
    const branchBig = new THREE.TorusGeometry(0.17, 0.011, 5, 8, Math.PI), branchSmall = new THREE.TorusGeometry(0.11, 0.011, 5, 8, Math.PI);
    for (const side of [1, -1]) for (let k = 1; k < 5; k++) {
      const x = side * (NAVE_IN - 0.55), z = piers[k], y = F + 5.0;
      // 까치발: 기둥에서 수평으로 나온 팔 + 그 아래 4분원 버팀
      kit.add(armGeo, M.bronze, { pos: [side * (NAVE_IN - 0.25), y + 0.95, z], rot: [0, 0, Math.PI / 2], shadow: false });
      kit.add(braceGeo, M.bronze, { pos: [side * (NAVE_IN - 0.56), y + 0.65, z], rot: [0, 0, side > 0 ? Math.PI / 2 : 0], shadow: false });
      kit.add(chainGeo, M.bronze, { pos: [x, y + 0.79, z], shadow: false });
      kit.add(stemGeo, M.bronze, { pos: [x, y + 0.1, z], shadow: false });
      kit.add(knobGeo, M.bronze, { pos: [x, y - 0.45, z], shadow: false });
      for (const dy of [0, 0.42]) {
        kit.add(ringGeo, M.bronze, { pos: [x, y + dy, z], rot: [Math.PI / 2, 0, 0], shadow: false });
        const n = dy ? 5 : 8;
        for (let q = 0; q < n; q++) {
          const a = (q / n) * Math.PI * 2 + dy, rr = dy ? 0.22 : 0.34;
          // 굽은 가지: 가운데 기둥에서 바깥 고리까지 반원으로 처졌다 올라온다
          kit.add(dy ? branchSmall : branchBig, M.bronze, { pos: [x + Math.cos(a) * rr / 2, y + dy, z + Math.sin(a) * rr / 2], rot: [0, -a, Math.PI], shadow: false });
          kit.add(cupGeo, M.wax, { pos: [x + Math.cos(a) * rr, y + dy + 0.07, z + Math.sin(a) * rr], shadow: false });
          kit.add(bulbGeo, bulbMat, { pos: [x + Math.cos(a) * rr, y + dy + 0.17, z + Math.sin(a) * rr], shadow: false });
        }
      }
    }
    // 신랑 양옆 따뜻한 빛(촛대 둘씩 묶어 하나의 점광원)
    for (const side of [1, -1]) for (const z of [(piers[1] + piers[2]) / 2, (piers[3] + piers[4]) / 2]) {
      const l = new THREE.PointLight(0xffd8a8, 6, 11, 1.8); // 촛대는 은은히(실내를 고르게 밝히지 않게)
      l.position.set(side * (NAVE_IN - 0.9), F + 5.4, z);
      kit.root.add(l);
    }
  }

  // ── 샹들리에 ──────────────────────────────────────────────
  for (const z of [-11, -20, -28]) {
    const pl = new THREE.PointLight(0xffd9a0, 22, 26, 1.6); // 실내를 더 어둡게(사장님 확정)
    pl.position.set(0, 11, z);
    kit.root.add(pl);
  }
  const pl2 = new THREE.PointLight(0xffd9a0, 22, 22, 1.6);
  pl2.position.set(0, 10, APSE_C + 1);
  kit.root.add(pl2);
  for (const side of [1, -1]) {
    const tl = new THREE.PointLight(0xffe2b8, 10, 18, 1.6);
    tl.position.set(side * 10.5, 7.5, transMid);
    kit.root.add(tl);
  }

  // ── 신도석 · 봉헌초 · 성수대 · 종 줄 ─────────────────────────
  const pewSpots: { x: number; y: number; z: number }[] = [];
  // v3-8: 신도석 줄이 틈 없이 이어져 중앙 통로에서 옆(측랑·십자가의 길)으로 못 나갔다 — 아케이드 열린 자리(베이 가운데)마다 가로 통로를 낸다
  const crossAisles = openings.map(([a, b]) => NAVE_Z0 - (a + b) / 2);
  for (let z = NAVE_Z0 - 4.6; z > TRANS0 + 0.8; z -= 1.25) {
    if (crossAisles.some((c) => Math.abs(z - c) < 1.05)) continue;
    for (const x of [-3.0, 3.0]) pewSpots.push({ x, y: F, z });
  }
  pews(kit, M, reg, pewSpots, 0, 3.6);
  // 봉헌초 — 실내는 제대 앞(교차부, 성소 계단 앞 왼쪽)의 봉헌대, 바깥은 성모상 옆(아래 «성모 동산»)
  const allIds = SPACES.cathedral.candles;
  const candles = candleStand(kit, M, reg, v3(-3.4, F, SAN + 1.9), 0, allIds.slice(0, 6),
    '제대 앞 봉헌대', '제대를 바라보며 초를 하나 켜고 지향을 고릅니다. 켜진 초는 함께 있는 모두에게 보입니다.', '🕯️ 제대 앞 초 봉헌');
  {
    // 봉헌대 받침: 짙은 나무 탁자 + 앞판
    kit.add(box(1.7, 0.86, 0.6), M.woodDark, { pos: [-3.4, F + 0.43, SAN + 1.95], collide: true });
  }

  // v3-6 성수대 — 실제 명동대성당 사진(입구 왼쪽 벽 옆): 거칠게 다듬은 회색 화강암, 팔각으로 깎아 위로 좁아지는 받침,
  // 그 위 두툼한 둥근 물그릇(평평한 테두리 안에 매끈한 둥근 우묵)과 성수. 손을 담그면 물결이 번진다
  const FX = -4.3, FZ = NAVE_Z0 - 1.6;
  // 회색 화강암 잔점(줄눈 없음 — 한 덩이 돌) : 밝은 장석·어두운 운모 알갱이 + 고운 결
  const graniteMat = (() => {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d')!, r = T.rng(31);
    g.fillStyle = 'rgb(206,202,192)'; g.fillRect(0, 0, S, S); // 실제 사진: 밝은 회색 화강암(그늘에서도 밝게 보인다)
    for (let i = 0; i < 9000; i++) {
      const t = r(), sz = 1 + r() * 2;
      g.fillStyle = t < 0.38 ? `rgba(80,76,72,${0.25 + r() * 0.4})` : t < 0.88 ? `rgba(240,238,230,${0.3 + r() * 0.4})` : `rgba(200,170,160,${0.25 + r() * 0.3})`;
      g.fillRect(r() * S, r() * S, sz, sz);
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 2);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 });
  })();
  const basinMat = new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.3, metalness: 0.05 }); // 물에 닳아 매끈해진 안쪽
  const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x9fb9c6, roughness: 0.03, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.72 });
  const fontParts = [
    kit.add(cyl(0.31, 0.35, 0.08, 8), graniteMat, { pos: [FX, F + 0.04, FZ], collide: true, dynamic: true }),         // 바닥 굽
    kit.add(cyl(0.19, 0.26, 0.5, 8), graniteMat, { pos: [FX, F + 0.33, FZ], rot: [0, Math.PI / 8, 0], collide: true, dynamic: true }), // 팔각 받침(위로 좁게)
    kit.add(cyl(0.25, 0.2, 0.07, 8), graniteMat, { pos: [FX, F + 0.615, FZ], rot: [0, Math.PI / 8, 0], dynamic: true }), // 목
    kit.add(cyl(0.37, 0.31, 0.24, 18), graniteMat, { pos: [FX, F + 0.77, FZ], collide: true, dynamic: true }),         // 물그릇 몸
    kit.add(cyl(0.25, 0.2, 0.05, 24, true), basinMat, { pos: [FX, F + 0.865, FZ], dynamic: true, shadow: false }),      // 우묵한 안쪽 벽
    kit.add(new THREE.CircleGeometry(0.2, 24), basinMat, { pos: [FX, F + 0.842, FZ], rot: [-Math.PI / 2, 0, 0], dynamic: true, shadow: false }), // 바닥
  ];
  kit.add(new THREE.RingGeometry(0.25, 0.37, 24), graniteMat, { pos: [FX, F + 0.891, FZ], rot: [-Math.PI / 2, 0, 0], dynamic: true, shadow: false }); // 평평한 테두리
  const water = kit.add(new THREE.CircleGeometry(0.245, 24), waterMat, { pos: [FX, F + 0.875, FZ], rot: [-Math.PI / 2, 0, 0], dynamic: true, shadow: false });
  fontParts.push(water);
  // 물결: 손끝이 닿은 자리에서 번지는 얇은 고리(최대 셋)
  const ripples: { m: THREE.Mesh; mat: THREE.MeshBasicMaterial; t: number }[] = [];
  const fontDip = () => {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const m = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.035, 24), mat);
    m.position.set(FX + 0.05, F + 0.878, FZ - 0.03); m.rotation.x = -Math.PI / 2; m.userData.dynamic = true;
    kit.root.add(m); ripples.push({ m, mat, t: 0 });
    if (ripples.length > 3) { const r = ripples.shift()!; kit.root.remove(r.m); r.m.geometry.dispose(); r.mat.dispose(); }
  };
  reg.add(fontParts, { kind: 'font', id: 'font', title: '성수대', badge: '💧 성수 찍기',
    body: '성당에 들어서며 손끝에 성수를 찍고 십자성호를 긋습니다 — 세례 때 받은 은총을 기억하는 전통입니다. 실제 명동대성당 입구의 화강암 성수대를 참고해 만들었습니다.',
    anchor: v3(FX, F + 1, FZ) });

  // v3-7: 줄은 천장 고리(꼭대기)에 매달려 있고, 놀이 중에는 캐릭터의 손을 지나가도록 기울고 늘어난다(ropeGrab).
  // 놀이가 아닐 때(남이 울릴 때)는 bellPull 로 줄이 내려갔다 올라온다. 줄은 충돌에서 뺀다(붙잡는 것).
  const ROPE_X = 3.6, ROPE_Z = 4.0, ROPE_TOP = 7.0, ROPE_LEN = 6.2, GRIP_Y = 1.2, PULL_MAX = 0.6;
  const rope = new THREE.Group();
  rope.position.set(ROPE_X, F + ROPE_TOP, ROPE_Z); rope.userData.dynamic = true; rope.userData.noCollide = true; kit.root.add(rope);
  const ropeLine = kit.add(cyl(0.025, 0.025, 1, 6), M.wood, { parent: rope, pos: [0, -ROPE_LEN / 2, 0], scale: [1, ROPE_LEN, 1], dynamic: true });
  const ropeGrip = kit.add(cyl(0.07, 0.07, 0.5, 10), M.red, { parent: rope, pos: [0, -(ROPE_TOP - GRIP_Y), 0], dynamic: true });
  kit.add(new THREE.TorusGeometry(0.09, 0.02, 6, 12), M.iron, { parent: rope, pos: [0, 0.08, 0], rot: [Math.PI / 2, 0, 0], dynamic: true, shadow: false }); // 천장 고리
  const ropeMeshes = [ropeLine, ropeGrip];
  const pull = { t: 9, k: 0 }; // t: 당긴 뒤 지난 시간, k: 세기(0~1)
  const bellPull = (strength: number) => { pull.t = 0; pull.k = THREE.MathUtils.clamp(strength, 0, 1); };
  const grab = { on: false, p: new THREE.Vector3(), len: ROPE_LEN, tilt: new THREE.Quaternion() };
  const DOWN = new THREE.Vector3(0, -1, 0), tmpDir = new THREE.Vector3();
  /** 놀이 중 손 위치(세계 좌표)를 주면 줄이 그 점을 지나가고 손잡이가 손에 붙는다. null 이면 놓는다 */
  const ropeGrab = (p: THREE.Vector3 | null) => { grab.on = !!p; if (p) grab.p.copy(p); };
  const setRope = (len: number, q: THREE.Quaternion | null) => {
    ropeLine.scale.y = len; ropeLine.position.y = -len / 2;
    if (q) rope.quaternion.copy(q); else rope.rotation.set(0, 0, 0);
  };
  reg.add(ropeMeshes, { kind: 'bell', id: 'tower', title: '종 줄', body: '줄을 박자에 맞춰 세 번 당기면 종탑의 종이 크게 울립니다. 이 공간에 있는 모두에게 들립니다(5초에 한 번).', anchor: v3(ROPE_X, F + 1.3, ROPE_Z) });
  // 종지기 자리: 줄 바로 뒤(문 쪽)에서 신랑 쪽을 보고 선다. 카메라는 신랑 쪽 왼쪽 앞(열린 문짝이 가리지 않는 자리)에서
  // 캐릭터의 앞모습과 줄을 함께 본다 — 놀이판은 화면 오른쪽 아래라 캐릭터는 가운데 왼쪽에 온다
  const bellRinger = { pos: v3(ROPE_X, F, ROPE_Z + 0.42), yaw: 0, camPos: v3(ROPE_X - 1.55, F + 1.65, ROPE_Z - 1.4), camTarget: v3(ROPE_X - 0.1, F + 1.3, ROPE_Z + 0.25) };
  const bellPos = v3(0, 24, (TOWER_FRONT + TOWER_BACK) / 2);

  // ── 십자가의 길 표지 ─────────────────────────────────────────
  // v3-8: 실제 명동성당 십자가의 길은 양쪽 벽의 청동 부조(최종태 작, 1989, 약 50×60 cm, 14처 + 제15처 부활) — 판의 크기·색을 따르고 장면은 단순한 도형으로 새긴 표지
  // 측랑 벽의 기둥(piers)은 벽 앞으로 나와 있어 그 자리에 걸면 파묻힌다 — 기둥 사이 칸(베이)의 가운데에 건다(첫 칸에는 둘)
  const stationZ = [NAVE_Z0 - 0.7, NAVE_Z0 - 3.1, ...[1, 2, 3, 4].map((k) => (piers[k] + piers[k + 1]) / 2)];
  const bronzeFrame = new THREE.MeshStandardMaterial({ color: 0x5b4630, roughness: 0.6, metalness: 0.2 });
  const STATION_BODY = '최종태 조각가의 청동 부조(1989년, 약 50×60 cm)가 양쪽 벽에 이어지고 제15처 「부활」까지 있습니다. 이 판은 작품을 옮긴 것이 아니라 장면의 뜻만 단순한 도형으로 새긴 표지입니다.';
  const plaque = (idx: number, x: number, z: number, rotY: number, ax: number, az: number) => {
    const rel = stationRelief(idx);
    const mat = new THREE.MeshStandardMaterial({ map: rel.map, bumpMap: rel.bump, bumpScale: 3.2, roughness: 0.6, metalness: 0.15, emissive: 0x6b4a2a, emissiveMap: rel.map, emissiveIntensity: 0.85 }); // 실내가 어두워도 부조의 윤곽이 보이도록 은은히 스스로 빛난다
    const cy = F + 1.85, d = 0.045;
    const dir = v3(Math.sin(rotY), 0, Math.cos(rotY));                       // 판이 바라보는 쪽(실내)
    const at = (back: number) => [x + dir.x * back, cy, z + dir.z * back] as [number, number, number];
    kit.add(box(0.56, 0.66, d), bronzeFrame, { pos: at(d / 2), rot: [0, rotY, 0], noCollide: true, dynamic: true, shadow: false });      // 청동 틀(벽에 붙는 두께)
    const p = kit.add(new THREE.PlaneGeometry(0.5, 0.6), mat, { pos: at(d + 0.002), rot: [0, rotY, 0], dynamic: true, shadow: false, noCollide: true });
    const tagTex = textPanel([`제${idx + 1}처`], 256, 150, '#3a2f25', '#e6cf9a');                                                   // 판 아래 작은 번호 명판
    kit.add(new THREE.PlaneGeometry(0.22, 0.13), new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.6, metalness: 0.1, emissive: 0x6b4a2a, emissiveMap: tagTex, emissiveIntensity: 0.6 }), { pos: [x + dir.x * (d + 0.004), cy - 0.43, z + dir.z * (d + 0.004)], rot: [0, rotY, 0], dynamic: true, shadow: false, noCollide: true });
    reg.add(p, { kind: 'info', id: `station${idx}`, title: `십자가의 길 제${idx + 1}처 — ${STATION_NAMES[idx]}`, body: STATION_BODY, anchor: v3(ax, F + 1.6, az) });
  };
  stationZ.forEach((z, k) => plaque(k, AISLE_IN - 0.02, z, -Math.PI / 2, AISLE_IN - 0.9, z));
  plaque(6, AISLE_IN - 0.02, transMid + 2.5, -Math.PI / 2, AISLE_IN - 0.9, transMid + 2.5);
  plaque(7, -AISLE_IN + 0.02, transMid + 2.5, Math.PI / 2, -AISLE_IN + 0.9, transMid + 2.5);
  [...stationZ].reverse().forEach((z, k) => plaque(8 + k, -AISLE_IN + 0.02, z, Math.PI / 2, -AISLE_IN + 0.9, z));
  plaque(14, -10.5, NAVE_Z0 - 0.03, Math.PI, -10.5, NAVE_Z0 - 1.3); // 제15처 부활 — 마지막 처(제14처) 옆, 정면 현관 쪽 벽(실제 위치는 확인 못 함: 추측)

  // ── 안내대 ────────────────────────────────────────────────
  floorPlate(kit, M, reg, v3(4.3, F, NAVE_Z0 - 2.0), 0, '고딕 리바이벌 양식', '19세기에 유럽에서 중세 고딕을 다시 해석한 양식입니다. 뾰족한 첨두아치, 높은 신랑, 갈비뼈 같은 리브가 이어지는 볼트 천장, 빛이 드는 높은 창이 특징입니다. 이 실내는 그 양식을 참고해 다시 지은 시범 모델입니다.', ['고딕 리바이벌', '첨두아치 · 리브 볼트']);
  floorPlate(kit, M, reg, v3(AISLE_IN - 1.6, F, -20.5), -Math.PI / 2, '스테인드글라스', '색유리 조각을 납 테두리로 이어 만든 창입니다. 시간에 따라 해가 들어오는 각도가 바뀌어 바닥에 비치는 색 무늬가 움직입니다. 화면 위 [시간] 조절로 바꿔 보세요. 이 공간의 창 문양은 특정 작품을 옮기지 않은 기하 문양입니다.', ['스테인드글라스', '시간에 따라 바뀌는 빛']);
  floorPlate(kit, M, reg, v3(AISLE_IN - 2.4, F, transMid), -Math.PI / 2, '익랑과 장미창', '신랑과 직각으로 가로지르는 날개 부분을 익랑이라 합니다. 위에서 보면 건물이 십자 모양이 됩니다. 익랑 끝벽 높은 곳에 둥근 장미창이 있습니다.', ['익랑', '끝벽의 장미창']);
  floorPlate(kit, M, reg, v3(-7.6, F, SAN + 1.6), Math.PI / 5, '후진과 회랑', '제대 뒤의 반원형 공간을 후진(앱스)이라 합니다. 그 바깥을 낮은 회랑이 한 바퀴 돌아, 제대 뒤를 걸어서 지나갈 수 있습니다. 회랑 쪽 아치로 들어가 보세요.', ['후진 · 회랑', '제대 뒤를 도는 길']);
  floorPlate(kit, M, reg, v3(-2.8, F, 4.4), 0, '종탑', '정면 가운데에 높은 종탑을 세우고 그 아래를 현관으로 썼습니다. 탑 꼭대기 종실에 종이 걸려 있습니다. 옆의 붉은 줄을 박자에 맞춰 세 번 당겨 보세요.', ['종탑', '종 줄을 당겨 보세요']);

  // v3-6: 현관 좌우의 견본 어린이 그림 액자는 뺐다(사장님 지시 — 실사 분위기를 해친다). 어린이 그림은 언덕 위 경당에만 남는다

  // ── 대체 외관(상세 외관이 없을 때만) — 실내를 덮는 지붕 · 종탑 · 첨탑 ──
  if (!shell) {
    const ext = M.brick;
    kit.add(extrude(shapeFrom([[-NAVE_HW_OUT - 0.4, WALL_TOP - 0.1], [NAVE_HW_OUT + 0.4, WALL_TOP - 0.1], [0, RIDGE]]), TOWER_BACK - APSE_C + 0.6), M.slate, { pos: [0, 0, APSE_C - 0.3] });
    kit.add(extrude(shapeFrom([[-0.1, WALL_TOP - 0.1], [transW + 0.8, WALL_TOP - 0.1], [transW / 2 + 0.35, RIDGE]]), AISLE_HW_OUT * 2 + 0.4), M.slate, { pos: [-AISLE_HW_OUT - 0.2, 0, TRANS0 + 0.4], rot: [0, Math.PI / 2, 0] });
    for (const s of [1, -1]) {
      const pts: V2[] = [[s * NAVE_IN, AISLE_TOP + 0.1], [s * (AISLE_HW_OUT + 0.2), AISLE_TOP_IN - 0.1], [s * (AISLE_HW_OUT + 0.2), AISLE_TOP_IN - 0.35], [s * NAVE_IN, AISLE_TOP - 0.15]];
      kit.add(extrude(shapeFrom(pts), NAVE_Z0 - TRANS0 + 0.3), M.slate, { pos: [0, 0, TRANS0] });
      kit.add(box(0.9, 7.5, 1.0), ext, { pos: [s * (AISLE_IN + OT + 0.45), 3.75, piers[2]], collide: true });
    }
    kit.add(new THREE.ConeGeometry(AMB_R + 0.3, 3.2, 40, 1, true, Math.PI / 2, Math.PI), M.slate, { pos: [0, AISLE_TOP_IN + 1.5, APSE_C] });
    kit.add(new THREE.ConeGeometry(APSE_R + 0.2, 5.5, 32, 1, true, Math.PI / 2, Math.PI), M.slate, { pos: [0, WALL_TOP + 2.6, APSE_C] });
    // 종탑 몸체(현관 위) · 첨탑
    const tz = (TOWER_FRONT + TOWER_BACK) / 2, td = TOWER_FRONT - TOWER_BACK;
    kit.add(box(TOWER_HW * 2, TOWER_H - 8, td), ext, { pos: [0, 8 + (TOWER_H - 8) / 2, tz] });
    kit.add(box(TOWER_HW * 2 + 0.4, 0.6, td + 0.4), M.stone, { pos: [0, TOWER_H + 0.3, tz] });
    kit.add(new THREE.ConeGeometry(TOWER_HW * 0.86, 14, 8), M.slate, { pos: [0, TOWER_H + 0.6 + 7, tz], rot: [0, Math.PI / 8, 0] });
    kit.add(box(0.2, 2.4, 0.2), M.gold, { pos: [0, TOWER_H + 0.6 + 14 + 1.1, tz] });
    kit.add(box(1.2, 0.2, 0.2), M.gold, { pos: [0, TOWER_H + 0.6 + 14 + 1.6, tz] });
    const bell = bellMesh(M);
    bell.scale.setScalar(1.3);
    bell.position.set(0, 23, tz);
    kit.root.add(bell);
  }

  // ── 바깥 소품(실내에서는 숨긴다) ─────────────────────────────
  const outdoor = new THREE.Group();
  outdoor.userData.dynamic = true;
  kit.root.add(outdoor);
  if (placed?.landscape) { placed.landscape.userData.noCollide = true; outdoor.add(placed.landscape); } // 실내에서는 풍경도 숨긴다. 풍경 충돌(땅·나무 줄기)은 site.ts 가 따로 넣는다
  const treeSpots: [number, number][] = [];
  if (!placed?.landscape) for (let z = 12; z <= 34; z += 6) treeSpots.push([-18, z], [18, z], [-25, z + 3], [25, z + 3]);
  for (let i = treeSpots.length - 1; i >= 0; i--) if (!free(treeSpots[i][0], treeSpots[i][1], 2.2)) treeSpots.splice(i, 1);
  if (treeSpots.length) {
    const trunk = new THREE.InstancedMesh(cyl(0.18, 0.25, 2.4, 8), M.bark, treeSpots.length);
    const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 4.2, 9), M.leaf, treeSpots.length);
    const mtx = new THREE.Matrix4();
    treeSpots.forEach(([x, z], i) => {
      const s = 0.85 + ((i * 37) % 10) / 25;
      trunk.setMatrixAt(i, mtx.compose(v3(x, 1.2 * s, z), new THREE.Quaternion(), v3(s, s, s)));
      crown.setMatrixAt(i, mtx.compose(v3(x, 4.5 * s, z), new THREE.Quaternion(), v3(s, s, s)));
      kit.add(cyl(0.3, 0.3, 2, 6), M.bark, { pos: [x, 1, z], colliderOnly: true });
    });
    trunk.castShadow = crown.castShadow = true;
    outdoor.add(trunk, crown);
  }
  for (const [x, z] of ([[-6, 13], [6, 13], [-6, 26], [6, 26], [-12, 19], [12, 19]] as [number, number][]).filter(([x, z]) => free(x, z, 0.5))) {
    kit.add(cyl(0.06, 0.09, 3.6, 8), M.iron, { parent: outdoor, pos: [x, 1.8, z], collide: true, dynamic: true });
    kit.add(new THREE.SphereGeometry(0.2, 12, 8), M.lampGlow, { parent: outdoor, pos: [x, 3.75, z], dynamic: true, shadow: false });
  }
  for (const x of [-9, 9].filter((x) => free(x, 16, 1.4))) {
    kit.add(box(2.2, 0.08, 0.5), M.wood, { parent: outdoor, pos: [x, 0.45, 16], collide: true, dynamic: true });
    kit.add(box(2.2, 0.45, 0.06), M.wood, { parent: outdoor, pos: [x, 0.75, 16.25], dynamic: true });
  }

  floorPlate(kit, M, reg, v3(5.0, 0.02, 14.0), Math.PI * 0.08, '이 공간에 대하여',
    placed
      ? `Visit Holy Korea 첫 사례 — 명동대성당 구내입니다. 둘레 건물의 자리·윤곽·높이와 성당의 평면 치수(길이·폭·익랑·후진)는 OpenStreetMap 자료(${placed.attribution})에서 왔습니다. 성당의 모양과 실내는 고딕 리바이벌 양식을 참고해 다시 지은 시범 모델로, 실측 복제가 아니며 명동대성당의 공식 콘텐츠도 아닙니다. 땅의 높낮이는 평지로 단순화했습니다.`
      : 'Visit Holy Korea 시범 공간입니다. 고딕 리바이벌 성당 건축을 참고해 새로 지은 가상 성당이며, 실제 성당을 실측·복제하지 않았고 그 성당의 공식 콘텐츠도 아닙니다.',
    placed ? ['명동대성당 구내', '첫 사례 · 시범 재구성'] : ['Visit Holy Korea', '시범 공간 · 실제 성당 복제 아님']);

  // ── 경당으로 가는 문(포털) ──────────────────────────────────
  const [gx, gz] = ([[-20, 30], [16, 30], [-14, 34], [12, 34], [0, 36]] as [number, number][]).find(([x, z]) => free(x, z, 2.5)) ?? [0, 36];
  for (const dx of [-1.6, 1.6]) kit.add(box(0.6, 3.4, 0.6), M.stone, { pos: [gx + dx, 1.7, gz], collide: true });
  kit.add(box(3.8, 0.5, 0.7), M.stone, { pos: [gx, 3.65, gz] });
  const portalMat = M.additive(0x9cc8ff, 0.55);
  const portalPlane = kit.add(new THREE.PlaneGeometry(2.6, 3.3), portalMat, { pos: [gx, 1.68, gz], dynamic: true, shadow: false });
  const sign = new THREE.MeshStandardMaterial({ map: textPanel(['언덕 위 경당', '이곳으로 이동'], 512, 200), roughness: 0.8 });
  kit.add(box(2.2, 0.8, 0.06), sign, { pos: [gx, 4.4, gz + 0.36] });
  reg.add(portalPlane, { kind: 'portal', id: 'to-chapel', title: '언덕 위 경당으로', body: '작은 팔각 경당으로 이동합니다. 그곳에는 견본 어린이 그림이 걸려 있습니다.', target: 'chapel', anchor: v3(gx, 1.6, gz) });

  const zones: Zone[] = [
    { name: '종탑 현관', box: new THREE.Box3(v3(-NAR_IN, -2, XWALL), v3(NAR_IN, 12, FRONT_IN + FRONT_T)), outdoor: 0.45 },
    { name: '성소', box: new THREE.Box3(v3(-APSE_IN, -2, APSE_C - APSE_IN), v3(APSE_IN, 30, SAN)), outdoor: 0 },
    { name: '회랑', box: new THREE.Box3(v3(-AMB_IN, -2, APSE_C - AMB_IN), v3(AMB_IN, 30, APSE_C)), outdoor: 0 },
    { name: '교차부', box: new THREE.Box3(v3(-NAVE_IN, -2, SAN), v3(NAVE_IN, 30, TRANS0)), outdoor: 0 },
    { name: '오른쪽 익랑', box: new THREE.Box3(v3(NAVE_IN, -2, TRANS_REAR), v3(AISLE_IN, 30, TRANS0)), outdoor: 0 },
    { name: '왼쪽 익랑', box: new THREE.Box3(v3(-AISLE_IN, -2, TRANS_REAR), v3(-NAVE_IN, 30, TRANS0)), outdoor: 0 },
    { name: '신랑', box: new THREE.Box3(v3(-NAVE_IN, -2, TRANS0), v3(NAVE_IN, 30, XWALL)), outdoor: 0 },
    { name: '오른쪽 측랑', box: new THREE.Box3(v3(NAVE_IN, -2, TRANS0), v3(AISLE_IN, 30, XWALL)), outdoor: 0 },
    { name: '왼쪽 측랑', box: new THREE.Box3(v3(-AISLE_IN, -2, TRANS0), v3(-NAVE_IN, 30, XWALL)), outdoor: 0 },
    { name: '앞마당', box: new THREE.Box3(v3(-300, -10, -300), v3(300, 100, 300)), outdoor: 1 },
  ];

  const stations: Station[] = [
    { pos: v3(0, 0.02, 25), yaw: 0, pitch: 0.3, caption: '앞마당 — 정면 종탑과 첨탑을 올려다봅니다.' },
    { pos: v3(0, F, 3.2), yaw: 0, pitch: 0.05, caption: '종탑 현관 — 붉은 종 줄을 당기면 모두에게 종소리가 들립니다.' },
    { pos: v3(0, F, NAVE_Z0 - 2.4), yaw: 0, pitch: 0.28, caption: '신랑 입구 — 리브 볼트 천장이 제단까지 이어집니다.' },
    { pos: v3(AISLE_IN - 2.2, F, -12), yaw: -Math.PI / 2, pitch: -0.15, caption: '봉헌초 — 초를 켜고 지향을 고를 수 있습니다.' },
    { pos: v3(0, F, -19), yaw: 0, pitch: 0.75, caption: '볼트 천장 — 첨두아치와 리브가 같은 간격으로 반복됩니다.' },
    { pos: v3(7.5, F, transMid), yaw: -Math.PI / 2, pitch: 0.4, caption: '익랑 — 끝벽 높은 곳의 장미창을 올려다봅니다.' },
    { pos: v3(0, F, SAN + 2.2), yaw: 0, pitch: 0.18, caption: '교차부에서 성소 — 둥근 후진이 제대를 감쌉니다.' },
    { pos: v3(9.2, F, APSE_C - 5.6), yaw: Math.atan2(9.2, -5.6), pitch: 0.05, caption: '회랑 — 제대 뒤를 한 바퀴 도는 낮은 길입니다.' },
  ];

  // 출발점 — 언덕이 있으면 정면 쪽 언덕 아래(성당을 올려다보며 걸어 올라온다)
  let spawnPos = v3(0, 0.02, 28);
  if (hill && placed) {
    // 언덕 아래이면서 나무 줄기에서 4 m 넘게 떨어져 앞이 트인 자리(성당 쪽이 보이게)를 고른다
    const clear = (x: number, z: number) => placed!.trunks.every((t) => Math.hypot(t.x - x, t.y - z) > 3)
      && [6, 12, 18].every((d) => placed!.trunks.every((t) => Math.hypot(t.x - x, t.y - (z - d)) > 2.5));
    outer: for (let z = 74; z <= 130; z += 2) { // 2026-11-22: 계단 가운데 화단(덤불) 대신 계단 앞 넓은 바닥에서 시작한다
      for (const x of [3.5, 3, 4, 2.5, 4.5, 0, -3, 6, 10, -10, 14, -14]) { // 정면 오르막 길(가운데 x≈3.5) 위를 먼저 찾는다
        if (placed.groundAt(x, z) <= -HILL + 0.1 && free(x, z, 2) && clear(x, z)) { spawnPos = v3(x, placed.groundAt(x, z) + 0.02, z); break outer; }
      }
    }
    const sp = spawnPos.clone();
    stations.unshift({ pos: sp, yaw: Math.atan2(-sp.x, sp.z - 0) * 0, pitch: 0.22, caption: '언덕 아래 — 종현 언덕 위의 성당을 올려다봅니다. 길을 따라 올라가 보세요.' });
  }
  // ── 성모 동굴(루르드) — 명동대성당 영상: 회색 바위를 넓게 쌓은 벽에 담쟁이가 덮이고, 오른쪽 높은 벽감에 흰 성모상,
  //    앞에 돌 제대 탁자와 꽃, 왼쪽에 유리로 둘러싼 봉헌함(붉은 유리컵 초). 위치·크기는 실측이 아니다 ──
  let outdoorCandles: ReturnType<typeof candleStand> = [];
  {
    const mx = 17.5, mz = 27, myaw = -1.1; // 앞마당 오른쪽 끝에서 마당 가운데를 바라본다
    const g = new THREE.Group(); g.position.set(mx, 0, mz); g.rotation.y = myaw; g.userData.dynamic = true;
    kit.root.add(g);
    const rr = (() => { let t = 11; return () => ((t = (t * 1664525 + 1013904223) >>> 0) / 4294967296); })();
    const W = 8.5, Hh = 4.6;
    // 뒤판(동굴 안쪽 그늘) + 바위 무더기
    kit.add(box(W * 0.62, Hh * 0.92, 1.2), new THREE.MeshStandardMaterial({ map: (M.stone.map as THREE.Texture), color: 0x7a7266, roughness: 1 }), { parent: g, pos: [0, Hh * 0.46, -1.3], collide: true, dynamic: true });
    kit.add(box(W, 3.0, 1.3), M.stone, { parent: g, pos: [0, 1.5, -0.75], colliderOnly: true }); // 바위벽 전체
    kit.add(box(4.3, 1.0, 0.12), M.stone, { parent: g, pos: [-0.2, 0.5, 1.6], colliderOnly: true }); // 기도 자리 줄
    { // 동굴 안이 새까맣지 않게 — 안쪽에서 바위를 은은히 비춘다(사장님 확정: 어둑기 줄이기)
      const fill = new THREE.PointLight(0xffe6c8, 2.2, 4.5, 1.6); fill.position.set(-1.2, 1.0, 0.4); g.add(fill);
      const nfill = new THREE.PointLight(0xfff2e0, 0.45, 2.6, 1.6); nfill.position.set(1.9, 3.0, -0.1); g.add(nfill);
    }
    {
      // v3-5: 매끈한 상자 대신 꼭짓점을 흩은 울퉁불퉁한 돌 + 거친 바위 텍스처·요철(T.rock)
      const rockGeo = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3);
      { const pa = rockGeo.attributes.position as THREE.BufferAttribute; const jr = T.rng(61); const seen = new Map<string, [number, number, number]>();
        for (let i = 0; i < pa.count; i++) { const key = `${pa.getX(i).toFixed(3)},${pa.getY(i).toFixed(3)},${pa.getZ(i).toFixed(3)}`; let d = seen.get(key); if (!d) { d = [(jr() - 0.5) * 0.16, (jr() - 0.5) * 0.16, (jr() - 0.5) * 0.16]; seen.set(key, d); } pa.setXYZ(i, pa.getX(i) + d[0], pa.getY(i) + d[1], pa.getZ(i) + d[2]); }
        rockGeo.computeVertexNormals(); }
      const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ map: T.rock(), bumpMap: T.rockBump(), bumpScale: 0.5, color: 0xffffff, roughness: 0.96, flatShading: true }), 620); // 실제 사진: 네모난 돌을 쌓았다
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
      let n = 0;
      const cave = (x: number, y: number) => ((x + 1.2) / 1.5) ** 2 + (y / 1.9) ** 2 < 1;          // 왼쪽 아래 동굴 입
      const niche = (x: number, y: number) => ((x - 1.9) / 0.75) ** 2 + ((y - 2.8) / 1.25) ** 2 < 1; // 오른쪽 높은 벽감
      for (let tries = 0; tries < 5000 && n < 590; tries++) {
        const x = (rr() - 0.5) * W, y = rr() * Hh * Math.min(1, 0.55 + 0.6 * (1 - Math.abs(x) / (W / 2)));
        if (cave(x, y) || niche(x, y)) continue;
        const s0 = 0.2 + rr() * 0.16; // 네모난 돌을 가로로 길게 차곡차곡(사진: 갈색·회색·붉은 기)
        m4.compose(new THREE.Vector3(x, y, -0.7 + rr() * 0.25 - (y > 3.6 ? 0.25 : 0)), q.setFromEuler(e.set((rr() - 0.5) * 0.12, (rr() - 0.5) * 0.3, (rr() - 0.5) * 0.14)), new THREE.Vector3(s0 * (1.5 + rr() * 0.9), s0 * (0.7 + rr() * 0.35), s0 * 1.1));
        rocks.setMatrixAt(n, m4);
        rocks.setColorAt(n, col.setHex([0x7d766c, 0x8a7a68, 0x6e6a64, 0x9a7e66, 0x8c5e48, 0x5e5a56, 0xa39a8a, 0x7a6450][(rr() * 8) | 0]).multiplyScalar(1.05 + rr() * 0.3));
        n++;
      }
      // 동굴 입·벽감 테두리 돌
      for (let k = 0; k < 18; k++) { const a = (k / 17) * Math.PI; const s0 = 0.26 + rr() * 0.1; m4.compose(new THREE.Vector3(-1.2 + Math.cos(a) * 1.6, Math.sin(a) * 2.0, -0.55), q.setFromEuler(e.set(0, 0, a - Math.PI / 2 + (rr() - 0.5) * 0.15)), new THREE.Vector3(s0 * 0.9, s0 * 1.4, s0 * 1.1)); if (n < 620) { rocks.setMatrixAt(n, m4); rocks.setColorAt(n, col.setHex([0x7d766c, 0x8a7a68, 0x6e6a64, 0x9a7e66][k % 4]).multiplyScalar(1.15)); n++; } } // 동굴 입 아치 돌
      rocks.count = n; rocks.castShadow = true; rocks.receiveShadow = true; rocks.userData.dynamic = true;
      g.add(rocks);
      // 담쟁이 — 잎 무리 카드를 바위 겉에 붙인다(윗부분과 오른쪽에 무성하게)
      const ivyMat = new THREE.MeshStandardMaterial({ map: clusterTex('shrubGreen'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
      const ivy = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), ivyMat, 260);
      let iv = 0;
      for (let tries = 0; tries < 2000 && iv < 50; tries++) { // 담쟁이는 거의 없다(사진)
        const x = (rr() - 0.5) * W, y = rr() * Hh;
        if (cave(x, y) || niche(x, y)) continue;
        if (y < Hh * 0.75) continue; // 꼭대기 가장자리에만 조금
        const s0 = 0.6 + rr() * 0.7;
        m4.compose(new THREE.Vector3(x, y, -0.35 + rr() * 0.25), q.setFromEuler(e.set((rr() - 0.5) * 0.9, (rr() - 0.5) * 0.9, rr() * 6)), new THREE.Vector3(s0, s0, s0));
        ivy.setMatrixAt(iv, m4); ivy.setColorAt(iv, col.setRGB(0.85 + rr() * 0.3, 1, 0.85 + rr() * 0.2)); iv++;
      }
      ivy.count = iv; ivy.receiveShadow = true; ivy.userData.dynamic = true;
      g.add(ivy);
    }
    // 성모상(오른쪽 높은 벽감) — 흰 옷 · 흰 너울 · 허리의 하늘색 띠, 두 손 모음
    // 실제 명동 성모동굴 성모상(사진 참고): 색칠 없는 흰 대리석 한 덩어리 — 띠·얼굴·손·묵주까지 모두 흰색
    const white = new THREE.MeshStandardMaterial({ color: 0xebe7df, roughness: 0.5, side: THREE.DoubleSide }); // 너울 안쪽도 보이게
    const blue = white;
    kit.add(box(1.0, 0.35, 0.8), new THREE.MeshStandardMaterial({ map: (M.stone.map as THREE.Texture), color: 0xa59e8e }), { parent: g, pos: [1.9, 1.65, -0.75], dynamic: true });
    const mary = new THREE.Group(); mary.position.set(1.9, 1.82, -0.75); mary.scale.set(0.88, 1.0, 0.88); g.add(mary); mary.userData.dynamic = true;
    {
      // 루르드 성모 양식: 흰 옷(아래로 갈수록 깊은 세로 주름) · 머리부터 발까지 덮는 흰 너울 · 허리의 하늘색 띠와 앞으로 늘어진 긴 끈
      //   · 가슴 앞에 모은 두 손 · 옷 앞으로 길게 늘어진 묵주 · 두 발 위 장미 · 하늘을 우러르는 얼굴 (모두 흰 대리석)
      const fold = (geo: THREE.BufferGeometry, k: number, n: number) => {
        const p = geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x);
          const d = 1 + k * Math.max(0, 1.3 - y) * (Math.sin(a * n) * 0.7 + Math.sin(a * n * 2.3 + 1.1) * 0.3);
          p.setXYZ(i, x * d, y, z * d);
        }
        geo.computeVertexNormals(); return geo;
      };
      const skin = new THREE.MeshStandardMaterial({ color: 0xefebe3, roughness: 0.45 });
      const gold = white; // 묵주·장미도 대리석
      // 옷(몸)
      mary.add(new THREE.Mesh(fold(new THREE.LatheGeometry([[0.22, 0], [0.23, 0.08], [0.2, 0.5], [0.15, 0.95], [0.142, 1.0], [0.168, 1.22], [0.15, 1.33], [0.11, 1.41], [0.06, 1.455], [0, 1.47]].map(([r, y]) => new THREE.Vector2(r, y)), 48), 0.05, 9), white));
      // 너울: 머리를 감싸고 어깨를 지나 등 뒤로 바닥 가까이 흘러내린다(앞은 열림)
      mary.add(new THREE.Mesh(fold(new THREE.LatheGeometry([[0.0, 1.69], [0.09, 1.66], [0.125, 1.58], [0.13, 1.5], [0.19, 1.38], [0.215, 1.15], [0.24, 0.6], [0.265, 0.04]].map(([r, y]) => new THREE.Vector2(r, y)), 40, Math.PI * 0.2, Math.PI * 1.6), 0.04, 7), white)); // 열린 쪽이 앞(+z) — 너울이 머리부터 발까지 몸 양옆을 덮는다
      // 얼굴(하늘을 살짝 우러른다) · 이마를 덮은 너울 가장자리
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 16).scale(0.86, 1.1, 0.95), skin); head.position.set(0, 1.56, 0.03); head.rotation.x = -0.12; head.rotation.z = 0.06; mary.add(head);
      // 머리를 감싼 너울 — 얼굴만 열어 두고 정수리·옆머리·턱 옆까지 덮는다
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.105, 28, 18, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, 2.25).scale(0.95, 1.12, 1), white);
      hood.position.set(0, 1.565, 0.02); hood.rotation.x = -0.18; mary.add(hood);
      const veilTop = new THREE.Mesh(new THREE.SphereGeometry(0.106, 24, 10, 0, Math.PI * 2, 0, 0.75).scale(0.95, 1.12, 1), white);
      veilTop.position.copy(hood.position); veilTop.rotation.x = -0.18; mary.add(veilTop);
      // 얼굴(머리 지역 좌표에 붙여 함께 우러른다): 아몬드 눈 · 가는 눈썹 · 콧날 · 작은 입술 · 엷은 볼
      const eyeM = new THREE.MeshStandardMaterial({ color: 0xa8a096, roughness: 0.7 }); // 조각된 눈 — 그늘만 살짝
      const browM = new THREE.MeshStandardMaterial({ color: 0xc8c0b4, roughness: 0.8 });
      for (const sx of [-1, 1]) {
        // 인자한 눈 — 살며시 내려 감아 웃는 초승달 모양(◠)
        const ey = new THREE.Mesh(new THREE.TorusGeometry(0.0105, 0.0019, 5, 14, Math.PI), eyeM); ey.position.set(sx * 0.026, 0.008, 0.08); ey.scale.set(1.25, 0.55, 1); head.add(ey);
        // 온화하게 풀린 눈썹 — 높고 부드러운 아치
        const br = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0016, 4, 12, Math.PI * 0.7), browM); br.position.set(sx * 0.026, 0.02, 0.079); br.rotation.z = Math.PI * 0.15; br.scale.set(1, 0.6, 1); head.add(br);
      }
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.03, 6), skin); nose.position.set(0, -0.002, 0.086); nose.rotation.x = 0.35; head.add(nose);
      // 온화한 미소 — 입꼬리가 살짝 올라간 입(◡)과 아랫입술의 작은 도톰함
      const smileM = new THREE.MeshStandardMaterial({ color: 0xc6bbae, roughness: 0.6 }); // 은은한 미소(사장님 확정)
      const smile = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0014, 5, 16, Math.PI), smileM); smile.position.set(0, -0.034, 0.077); smile.rotation.z = Math.PI; smile.scale.set(1, 0.28, 1); head.add(smile);
      const lip = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 6).scale(1.6, 0.5, 0.5), skin); lip.position.set(0, -0.042, 0.078); head.add(lip);
      for (const sx of [-1, 1]) { const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8).scale(1, 0.75, 0.4), skin); cheek.position.set(sx * 0.033, -0.02, 0.058); head.add(cheek); } // 웃을 때 올라오는 볼
      // 목 · 목 앞 옷깃
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.055, 0.16, 14), skin); neck.position.set(0, 1.47, 0.02); mary.add(neck);
      // 하늘색 띠 + 앞으로 늘어진 두 끈(무릎 아래까지)
      const sash = new THREE.Mesh(new THREE.TorusGeometry(0.146, 0.016, 8, 32), blue); sash.position.set(0, 0.98, 0); sash.rotation.x = Math.PI / 2; mary.add(sash);
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8).scale(1.3, 1, 0.6), blue); knot.position.set(0.01, 0.98, 0.145); mary.add(knot);
      for (const [sx, len, rz] of [[-0.03, 0.62, 0.04], [0.045, 0.52, -0.06]] as const) {
        const rb = new THREE.Mesh(new THREE.BoxGeometry(0.032, len, 0.01), blue); rb.position.set(sx, 0.98 - len / 2, 0.165 + len * 0.04); rb.rotation.set(-0.1, 0, rz); mary.add(rb);
      }
      // 소매 + 가슴 앞에 모은 두 손
      for (const sx of [-1, 1]) {
        const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.065, 0.3, 12, 1, true), white); sl.position.set(sx * 0.1, 1.2, 0.1); sl.rotation.set(-1.0, 0, -sx * 0.55); sl.material = white; mary.add(sl);
        const hand = new THREE.Group(); hand.position.set(sx * 0.009, 1.27, 0.2); hand.rotation.set(-0.35, 0, sx * 0.1); mary.add(hand);
        hand.add(new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.05, 0.034).translate(0, 0.0, 0), skin)); // 손바닥
        for (let f = 0; f < 4; f++) {
          const L = [0.036, 0.042, 0.04, 0.032][f];
          const fg = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, L, 3, 6), skin); fg.position.set(0, 0.025 + L / 2, -0.013 + f * 0.0088); hand.add(fg);
        }
        const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.005, 0.026, 3, 6), skin); th.position.set(-sx * 0.004, 0.012, 0.02); th.rotation.x = -0.5; hand.add(th);
      }
      // 묵주 — 모은 손에서 옷 앞 가운데를 따라 무릎 아래까지 길게 늘어진다(사진: 흰 구슬 줄)
      {
        const prof: [number, number][] = [[0.22, 0], [0.23, 0.08], [0.2, 0.5], [0.15, 0.95], [0.142, 1.0], [0.168, 1.22]];
        const rAt = (y: number) => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0); } return 0.168; };
        const bead = new THREE.SphereGeometry(0.0085, 6, 5);
        for (let k = 0; k < 46; k++) {
          const y = 1.22 - k * 0.0145, b = new THREE.Mesh(bead, gold);
          b.position.set(0.012 + Math.sin(k * 0.21) * 0.006, y, rAt(y) + 0.02); mary.add(b);
        }
        const yc = 1.22 - 46 * 0.0145;
        const cr = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.05, 0.007), gold); cr.position.set(0.012, yc - 0.02, rAt(yc) + 0.02); mary.add(cr);
        const crb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.009, 0.007), gold); crb.position.set(0.012, yc - 0.008, rAt(yc) + 0.02); mary.add(crb);
      }
      // 두 발과 발등의 금빛 장미
      for (const sx of [-0.06, 0.06]) {
        const ft = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8).scale(0.8, 0.45, 1.4), skin); ft.position.set(sx, 0.02, 0.22); mary.add(ft);
        const rose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.022, 0), gold); rose.position.set(sx, 0.045, 0.235); mary.add(rose);
      }
    }
    mary.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    reg.add(mary.children as THREE.Object3D[], { kind: 'info', id: 'mary', title: '성모 동굴', badge: '🙏 성모 동굴',
      body: '프랑스 루르드의 성모 발현 동굴을 본뜬 성모 동굴입니다. 순례자들은 이 앞에서 기도하고, 옆 유리 봉헌함에 초를 켭니다. (시범 모델 — 실제 동굴의 모양·크기·위치를 그대로 옮긴 것은 아닙니다)',
      anchor: new THREE.Vector3(mx, 3.9, mz) });
    // 돌 제대 탁자 + 꽃(동굴 입 앞)
    // 제단 — 실제 사진처럼 회색 결이 있는 흰 대리석 상자 + 조금 튀어나온 윗판, 위에 꽃병(사장님 확정)
    const whiteMarble = (() => { // 흰 바탕에 엷은 회색 결이 흐르는 대리석(바닥용 체크 대리석과 다름)
      const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d')!;
      x.fillStyle = '#efece6'; x.fillRect(0, 0, 512, 512);
      for (let k = 0; k < 28; k++) {
        x.strokeStyle = `rgba(120,115,108,${0.12 + rr() * 0.25})`; x.lineWidth = 0.6 + rr() * 2.2;
        x.beginPath(); let px = rr() * 512, py = rr() * 512; x.moveTo(px, py);
        for (let t = 0; t < 8; t++) { px += 20 + rr() * 50; py += (rr() - 0.5) * 60; x.lineTo(px, py); }
        x.stroke();
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.3 });
    })();
    kit.add(box(1.5, 0.88, 0.7), whiteMarble, { parent: g, pos: [-0.2, 0.44, 0.35], collide: true, dynamic: true });
    kit.add(box(1.66, 0.07, 0.82), whiteMarble, { parent: g, pos: [-0.2, 0.915, 0.35], dynamic: true });
    {
      const vase = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.07, 0], [0.09, 0.08], [0.06, 0.2], [0.05, 0.24], [0.065, 0.28]].map(([r, y]) => new THREE.Vector2(r, y)), 20),
        new THREE.MeshPhysicalMaterial({ color: 0xdfe8e6, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.55, depthWrite: false }));
      vase.position.set(-0.2, 0.95, 0.35); g.add(vase);
      const stemM = new THREE.MeshStandardMaterial({ color: 0x4a6a2c, roughness: 0.8 });
      for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.3, 4), stemM); st.position.set(-0.2 + Math.cos(a) * 0.03, 1.3, 0.35 + Math.sin(a) * 0.03); st.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); g.add(st); }
    }
    for (let k = 0; k < 14; k++) kit.add(new THREE.IcosahedronGeometry(0.06, 0), new THREE.MeshStandardMaterial({ color: [0xf4f0e8, 0xf2a0b8, 0xe8c547, 0xd0505a][k % 4], roughness: 0.8 }), { parent: g, pos: [-0.2 + (k % 7 - 3) * 0.045, 1.42 + (k % 3) * 0.04, 0.35 + (k > 6 ? 0.05 : -0.04)], dynamic: true, shadow: false }); // 꽃병에 꽂힌 꽃
    {
      const bw = new THREE.MeshStandardMaterial({ color: 0xebe7df, roughness: 0.5 });
      const bern = new THREE.Group(); bern.position.set(-2.9, 0, 2.4);
      bern.rotation.y = Math.atan2(1.9 - -2.9, -0.75 - 2.4); // 성모상 쪽을 본다
      g.add(bern); bern.userData.dynamic = true;
      // 받침 · 무릎 꿇은 다리(정강이는 바닥에, 넓적다리는 곧게) · 치마 · 몸 · 머릿수건 · 우러른 얼굴 · 가슴 앞 모은 손
      bern.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.8), bw).translateY(0.06));
      bern.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.55), bw).translateY(0.19).translateZ(-0.12));
      const bfold = (geo: THREE.BufferGeometry, k: number, n: number) => {
        const p = geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x); const d = 1 + k * Math.max(0, 0.6 - y) * (Math.sin(a * n) * 0.7 + Math.sin(a * n * 2.1 + 0.7) * 0.3); p.setXYZ(i, x * d, y, z * d); }
        geo.computeVertexNormals(); return geo;
      };
      // 치마: 무릎 꿇어 바닥에 펼쳐진 주름
      bern.add(new THREE.Mesh(bfold(new THREE.LatheGeometry([[0.26, 0], [0.23, 0.12], [0.2, 0.28], [0.15, 0.48], [0.13, 0.55]].map(([r, y]) => new THREE.Vector2(r, y)), 40), 0.12, 8), bw).translateY(0.18).translateZ(0.03));
      // 앞치마
      { const ap = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.42), bw); ap.position.set(0, 0.5, 0.2); ap.rotation.x = -0.18; bern.add(ap); }
      const torso = new THREE.Mesh(new THREE.LatheGeometry([[0.13, 0], [0.14, 0.18], [0.13, 0.3], [0.07, 0.36], [0, 0.37]].map(([r, y]) => new THREE.Vector2(r, y)), 20), bw); torso.position.set(0, 0.74, 0.05); torso.rotation.x = -0.1; bern.add(torso);
      const bh = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 16).scale(0.9, 1.08, 1), bw); bh.position.set(0, 1.17, 0.08); bh.rotation.x = -0.45; bern.add(bh);
      { // 얼굴 — 성모를 우러러보는 눈(뜬 눈), 콧날, 다문 입, 목
        const fm = new THREE.MeshStandardMaterial({ color: 0xa8a096, roughness: 0.7 });
        for (const sx of [-1, 1]) {
          const ey = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 6).scale(1.4, 0.7, 0.4), fm); ey.position.set(sx * 0.025, 0.014, 0.08); bh.add(ey);
          const br = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0015, 4, 12, Math.PI * 0.7), fm); br.position.set(sx * 0.025, 0.03, 0.078); br.rotation.z = Math.PI * 0.15; br.scale.set(1, 0.55, 1); bh.add(br);
        }
        const ns = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.028, 6), bw); ns.position.set(0, 0, 0.087); ns.rotation.x = 0.35; bh.add(ns);
        const mo = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0013, 4, 12, Math.PI), fm); mo.position.set(0, -0.036, 0.078); mo.rotation.z = Math.PI; mo.scale.set(1, 0.25, 1); bh.add(mo);
        const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 12), bw); nk.position.set(0, 1.08, 0.06); nk.rotation.x = -0.2; bern.add(nk);
      }
      const scarf = new THREE.Mesh(new THREE.SphereGeometry(0.108, 24, 14, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5, 0, 2.5).scale(0.97, 1.12, 1.05), new THREE.MeshStandardMaterial({ color: 0xebe7df, roughness: 0.5, side: THREE.DoubleSide }));
      scarf.position.copy(bh.position); scarf.rotation.x = -0.45; bern.add(scarf);
      // 머릿수건이 어깨와 등으로 흘러내린다(앞은 열림)
      { const sh = new THREE.Mesh(bfold(new THREE.LatheGeometry([[0.06, 0.32], [0.13, 0.26], [0.17, 0.12], [0.19, 0]].map(([r, y]) => new THREE.Vector2(r, y)), 28, Math.PI * 0.3, Math.PI * 1.4), 0.1, 6), new THREE.MeshStandardMaterial({ color: 0xebe7df, roughness: 0.5, side: THREE.DoubleSide }));
        sh.position.set(0, 0.8, 0.04); bern.add(sh); }
      { // 팔: 어깨 → 팔꿈치(옆구리) → 가슴 앞 모은 손. 소매는 넓게
        const limb = (a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number) => {
          const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, d.length(), 12, 1, true), bw);
          m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); bern.add(m);
        };
        for (const sx of [-1, 1]) {
          const sh = new THREE.Vector3(sx * 0.13, 1.02, 0.05), el = new THREE.Vector3(sx * 0.15, 0.84, 0.12), hd = new THREE.Vector3(sx * 0.02, 1.0, 0.25);
          limb(sh, el, 0.042, 0.04); limb(el, hd, 0.04, 0.05);
          const j = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), bw); j.position.copy(el); bern.add(j);
        }
      }
      // 모은 두 손 — 손바닥을 맞대고 손가락이 위로
      for (const sx of [-1, 1]) {
        const hd = new THREE.Group(); hd.position.set(sx * 0.009, 1.04, 0.27); hd.rotation.set(-0.3, 0, sx * 0.08); bern.add(hd);
        hd.add(new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.05, 0.034), bw));
        for (let f = 0; f < 4; f++) { const L = [0.034, 0.04, 0.038, 0.03][f]; const fg = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, L, 3, 6), bw); fg.position.set(0, 0.025 + L / 2, -0.013 + f * 0.0088); hd.add(fg); }
        const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.005, 0.024, 3, 6), bw); th.position.set(-sx * 0.004, 0.012, 0.02); th.rotation.x = -0.5; hd.add(th);
      }
      bern.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      kit.add(box(0.6, 1.2, 0.8), M.stone, { parent: bern, pos: [0, 0.6, 0], colliderOnly: true });
    }
    // 기도 자리를 두른 붉은 줄
    for (const sx of [-2.3, 1.9]) kit.add(cyl(0.03, 0.04, 0.95, 8), M.iron, { parent: g, pos: [sx, 0.47, 1.6], dynamic: true });
    kit.add(cyl(0.012, 0.012, 4.2, 6), new THREE.MeshStandardMaterial({ color: 0xa81c22, roughness: 0.7 }), { parent: g, pos: [-0.2, 0.86, 1.6], rot: [0, 0, Math.PI / 2], dynamic: true, shadow: false });
    // 유리 봉헌함 — 동굴 왼쪽 앞
    const off = new THREE.Vector3(-3.4, 0, 0.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), myaw);
    const cpos = new THREE.Vector3(mx + off.x, 0, mz + off.z);
    outdoorCandles = candleStand(kit, M, reg, cpos, myaw, allIds.slice(6),
      '성모 동굴 봉헌초', '성모님께 지향을 맡기며 붉은 유리컵 초를 하나 켭니다. 켜진 초는 이곳에 함께 있는 모두에게 보입니다.', '🕯️ 성모님께 초 봉헌', true);
  }

  // ── 앞마당 가을 꽃밭 — 국화·코스모스·맨드라미가 핀 낮은 화단(돌 테두리) ──
  if (hill) {
    // ── 언덕 돌계단 · 붉은 벽돌 난간벽 · 검은 쌍등 가로등(실제 사진: 성당 앞 언덕길) ──
    //    단 윗면은 그 단이 시작하는 곳의 땅 높이(풀·포석이 비치지 않게). 걷는 면은 단 코를 잇는 보이지 않는 비탈(충돌)이다.
    {
      const g = placed!.groundAt, SX = 3.0, HW = 3.1, RISE = 0.175;
      const zAt = (y: number) => { let lo = 40, hi = 72; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (g(SX, m) > y) lo = m; else hi = m; } return (lo + hi) / 2; };
      const steps = Math.round(HILL / RISE), stepG: THREE.BufferGeometry[] = [], noseG: THREE.BufferGeometry[] = [], wallG: THREE.BufferGeometry[] = [], capG: THREE.BufferGeometry[] = [];
      let zPrev = zAt(-0.02);
      const noses: [number, number][] = [];
      for (let k = 1; k <= steps; k++) {
        const yTop = g(SX, zPrev) + 0.03, z1 = zAt(-k * RISE + 0.01);
        noses.push([zPrev, yTop]);
        const d = Math.max(0.3, z1 - zPrev), zc = (zPrev + z1) / 2;
        stepG.push(new THREE.BoxGeometry(HW * 2, 0.45, d + 0.02).translate(SX, yTop - 0.225, zc));
        noseG.push(new THREE.BoxGeometry(HW * 2, 0.03, 0.05).translate(SX, yTop - 0.015, zPrev + 0.025)); // 단 코(밝은 돌 줄)
        for (const sx of [-1, 1]) {
          const wx = SX + sx * (HW + 0.22);
          wallG.push(new THREE.BoxGeometry(0.44, 1.5, d + 0.03).translate(wx, yTop + 0.9 - 0.75 + 0.15, zc));
          capG.push(new THREE.BoxGeometry(0.56, 0.1, d + 0.04).translate(wx, yTop + 1.1, zc));
        }
        zPrev = z1;
      }
      const stepMat = new THREE.MeshStandardMaterial({ color: 0xb9b4aa, roughness: 0.85, map: (M.stone as THREE.MeshStandardMaterial).map ?? null });
      for (const [list, mat, nm] of [[stepG, stepMat, 'hill-steps'], [noseG, new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.7 }), 'hill-step-nose'], [wallG, M.brick, 'hill-stair-wall'], [capG, M.stone, 'hill-stair-cap']] as const) {
        const mesh = new THREE.Mesh(mergeGeometries(list as THREE.BufferGeometry[])!, mat as THREE.Material);
        mesh.name = nm; mesh.receiveShadow = true; mesh.castShadow = nm === 'hill-stair-wall'; mesh.userData.dynamic = true;
        outdoor.add(mesh);
      }
      { // 걷는 면: 단 코를 잇는 비탈(보이지 않음)
        noses.push([zPrev, g(SX, zPrev) + 0.03]);
        const pos: number[] = [], idx: number[] = [];
        noses.forEach(([z, y], i) => { pos.push(SX - HW, y, z, SX + HW, y, z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
        const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
        kit.add(rg, M.stone, { colliderOnly: true });
      }
      // 난간벽은 지나가지 못한다(충돌)
      for (const sx of [-1, 1]) {
        const z0 = zAt(-0.02), z1 = zAt(-HILL + 0.05), L = z1 - z0, ang = Math.atan2(HILL, L);
        const wx = SX + sx * (HW + 0.22);
        kit.add(new THREE.BoxGeometry(0.44, 1.6, Math.hypot(L, HILL)).rotateX(ang).translate(wx, -HILL / 2 + 0.6, (z0 + z1) / 2), M.brick, { colliderOnly: true });
      }
      // 검은 쌍등 가로등 — 난간벽 바깥 양쪽, 약 7 m 마다
      const lantern = (x: number, y: number, z: number) => {
        kit.add(cyl(0.07, 0.11, 3.4, 10), M.iron, { parent: outdoor, pos: [x, y + 1.7, z], dynamic: true });
        kit.add(cyl(0.16, 0.2, 0.35, 10), M.iron, { parent: outdoor, pos: [x, y + 0.18, z], dynamic: true });
        kit.add(box(1.0, 0.06, 0.06), M.iron, { parent: outdoor, pos: [x, y + 3.35, z], dynamic: true });
        for (const dx of [-0.48, 0.48]) {
          kit.add(box(0.26, 0.04, 0.26), M.iron, { parent: outdoor, pos: [x + dx, y + 3.15, z], dynamic: true });
          kit.add(box(0.2, 0.36, 0.2), M.lampGlow, { parent: outdoor, pos: [x + dx, y + 2.95, z], dynamic: true, shadow: false });
          kit.add(new THREE.ConeGeometry(0.2, 0.22, 4).rotateY(Math.PI / 4), M.iron, { parent: outdoor, pos: [x + dx, y + 3.3 + 0.08, z], dynamic: true });
          kit.add(cyl(0.012, 0.012, 0.36, 4), M.iron, { parent: outdoor, pos: [x + dx, y + 2.95, z], dynamic: true });
          kit.add(cyl(0.02, 0.02, 0.2, 6), M.iron, { parent: outdoor, pos: [x + dx, y + 3.25, z], dynamic: true });
        }
        kit.add(new THREE.SphereGeometry(0.06, 8, 6), M.iron, { parent: outdoor, pos: [x, y + 3.5, z], dynamic: true });
        kit.add(cyl(0.2, 0.2, 3.6, 6), M.iron, { pos: [x, y + 1.8, z], colliderOnly: true });
      };
      for (let zz = zAt(-0.3); zz < zAt(-HILL + 0.3) + 0.1; zz += 6.8) for (const sx of [-1, 1]) {
        const lx = SX + sx * (HW + 0.95);
        if (free(lx, zz, 0.3)) lantern(lx, g(lx, zz), zz);
      }
    }
    const flowerGeo = new THREE.IcosahedronGeometry(0.075, 0);
    const beds: [number, number, number, number][] = [[-11, 14, 3.2, 9], [11, 14, 3.2, 9], [-11, 25, 3.2, 7], [11, 25, 3.2, 7]];
    const cols = [0xf2c230, 0xffffff, 0xb04aa8, 0xe8762a, 0xf28ab2, 0xc8202e, 0xf7e27a];
    const okBeds = beds.filter(([x, z, w, d]) => free(x, z, Math.max(w, d) / 2));
    const n = okBeds.length * 260;
    if (n) {
      const inst = new THREE.InstancedMesh(flowerGeo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), n);
      const leaves = new THREE.InstancedMesh(new THREE.ConeGeometry(0.11, 0.32, 5), new THREE.MeshStandardMaterial({ color: 0x3f6b2e, roughness: 0.9 }), n);
      const m4 = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion();
      let k = 0, seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (const [x, z, w, d] of okBeds) {
        const gy = placed!.groundAt(x, z);
        kit.add(box(w + 0.3, 0.22, d + 0.3), M.stone, { parent: outdoor, pos: [x, gy + 0.11, z], dynamic: true });
        kit.add(box(w + 0.3, 1.2, d + 0.3), M.stone, { pos: [x, gy + 0.6, z], colliderOnly: true }); // 꽃밭은 밟고 지나가지 않는다
        kit.add(box(w, 0.06, d), M.voidDark, { parent: outdoor, pos: [x, gy + 0.2, z], dynamic: true });
        const tone = cols[(k / 7) % cols.length | 0];
        for (let i = 0; i < 260; i++) {
          const fx = x + (rnd() - 0.5) * w * 0.95, fz = z + (rnd() - 0.5) * d * 0.95, h = 0.25 + rnd() * 0.25;
          const c = rnd() < 0.55 ? tone : cols[(rnd() * cols.length) | 0];
          m4.compose(new THREE.Vector3(fx, gy + 0.22 + h, fz), q, new THREE.Vector3(1, 0.7, 1).multiplyScalar(0.8 + rnd() * 0.6));
          inst.setMatrixAt(k, m4); inst.setColorAt(k, col.setHex(c));
          m4.compose(new THREE.Vector3(fx, gy + 0.22 + h * 0.45, fz), q, new THREE.Vector3(1, h / 0.32, 1));
          leaves.setMatrixAt(k, m4);
          k++;
        }
      }
      inst.castShadow = true;
      outdoor.add(inst, leaves);
    }
  }

  // ── 실내 먼지 — 햇살 속에 반짝이며 천천히 떠다니는 작은 티끌 ──
  const dustN = opts.light ? 300 : 900;
  const dustPos = new Float32Array(dustN * 3), dustSeed = new Float32Array(dustN);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * (AISLE_IN * 2 - 2);
    dustPos[i * 3 + 1] = F + 0.5 + Math.random() * 12;
    dustPos[i * 3 + 2] = NAVE_Z0 - Math.random() * (NAVE_Z0 - APSE_C);
    dustSeed[i] = Math.random() * 100;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  // 먼지 한 알 — 네모로 보이지 않게 둥글고 가장자리가 흐린 점(카메라 가까이 와도 하얀 네모가 안 생긴다)
  const dustDot = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d')!; const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: dustDot, color: 0xffe9c0, size: 0.06, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  dust.userData.dynamic = true; dust.frustumCulled = false;
  kit.root.add(dust);

  // ── 길 안내 화살표 — 출발점에서 정문까지 땅 위 금빛 화살표가 차례로 반짝인다 ──
  const arrows: THREE.MeshBasicMaterial[] = [];
  {
    const chev = new THREE.Shape();
    chev.moveTo(0, 0.55); chev.lineTo(0.55, -0.15); chev.lineTo(0.32, -0.15); chev.lineTo(0, 0.18); chev.lineTo(-0.32, -0.15); chev.lineTo(-0.55, -0.15); chev.closePath();
    const chevGeo = new THREE.ShapeGeometry(chev).rotateX(-Math.PI / 2); // v3-14: 뾰족한 끝이 -Z(성당 쪽). 이전에는 반대(+Z)로 그려져 정문 반대 방향을 가리켰다
    const goal = v3(0, 0, TOWER_FRONT + 3.2);
    const from = spawnPos.clone();
    const L = Math.hypot(goal.x - from.x, goal.z - from.z);
    const yaw = Math.atan2(-(goal.x - from.x), -(goal.z - from.z));
    for (let d = 1.8; d < L - 1; d += 2.4) { // 2026-11-17: 눈에 잘 안 띄어 더 촘촘히(3.2 → 2.4 m) · 크게 · 또렷하게
      const x = from.x + ((goal.x - from.x) * d) / L, z = from.z + ((goal.z - from.z) * d) / L;
      // 보이는 지형 메시는 격자라 계산 높이보다 조금 높을 수 있다 — 넉넉히 띄운다
      // 계단에서는 평평한 화살표가 디딤판에 잘려 안 보였다 — 앞뒤 땅 높이로 비탈에 맞춰 눕힌다(2026-11-17)
      const gAt = (k: number) => (hill && placed ? placed.groundAt(x + ((goal.x - from.x) * k) / L, z + ((goal.z - from.z) * k) / L) : 0);
      const yTip = gAt(0.9), yTail = gAt(-0.9);
      const y = Math.max(gAt(0), (yTip + yTail) / 2) + 0.34;
      const pitch = Math.atan2(yTip - yTail, 1.8);
      const m = new THREE.MeshBasicMaterial({ color: 0xffb400, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      arrows.push(m);
      const a = kit.add(chevGeo, m, { parent: outdoor, pos: [x, y, z], rot: [0, yaw, 0], dynamic: true, shadow: false });
      a.renderOrder = 4; a.scale.setScalar(2.1);
      a.rotation.set(pitch, yaw, 0, 'YXZ');
    }
  }
  const portalT = { t: 0 };
  // 충돌·합치기는 맨 끝에 — 그 뒤에 더한 물건(성모 동굴·꽃밭·봉헌함·화살표)도 충돌에 들어가고, 충돌 전용 상자는 그려지지 않는다
  const bvh = kit.finalize();

  return {
    id: 'cathedral', title: placed ? '명동대성당' : SPACES.cathedral.title, root: kit.root, bvh,
    attribution: placed ? `구내 건물·평면 © OpenStreetMap contributors (ODbL) · 성당 모양·실내는 양식 참고 재구성(실측 복제 아님)` : undefined,
    interactables: reg.interactables, pickables: reg.pickables,
    doors, candles: [...candles, ...outdoorCandles], zones, stations, windows,
    spawn: { pos: spawnPos, yaw: 0 },
    outdoorGroup: outdoor, shellGroup: shell ?? undefined, organPos, bellPos, floorY: F,
    interior: new THREE.Box3(v3(-AISLE_IN, -1, APSE_C - AMB_IN), v3(AISLE_IN, 30, XWALL)),
    fx: { bellPull, fontDip, ropeGrab },
    bellRinger,
    update(dt) {
      portalT.t += dt;
      if (grab.on) {
        // 놀이 중: 줄이 천장 고리에서 손까지 곧게 이어지고(기울기·길이 모두 손을 따른다) 손잡이는 손에, 줄 꼬리는 손 아래로 0.9 m
        tmpDir.subVectors(grab.p, rope.position);
        const dist = Math.max(0.5, tmpDir.length());
        grab.tilt.setFromUnitVectors(DOWN, tmpDir.normalize());
        setRope(dist + 0.9, grab.tilt);
        ropeGrip.position.y = -dist;
        pull.t = 9;
      } else if (pull.t < 3) {
        // 남이 울릴 때·놓은 직후: 0.22초 만에 끝까지 내려갔다가 1.2초쯤에 걸쳐 되돌아온다, 돌아오며 조금 흔들린다
        pull.t += dt;
        const down = pull.t < 0.22 ? pull.t / 0.22 : Math.exp(-(pull.t - 0.22) * 2.6);
        const d = down * down * (3 - 2 * down) * PULL_MAX * pull.k;
        setRope(ROPE_LEN + d, null);
        ropeGrip.position.y = -(ROPE_TOP - GRIP_Y) - d;
        rope.rotation.z = Math.sin(pull.t * 7) * 0.025 * Math.exp(-pull.t * 1.5) * pull.k;
      } else if (ropeLine.scale.y !== ROPE_LEN) { setRope(ROPE_LEN, null); ropeGrip.position.y = -(ROPE_TOP - GRIP_Y); }
      // 성수 물결: 0.9초 동안 번지며 사라진다
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]; r.t += dt;
        const u = r.t / 0.9;
        if (u >= 1) { kit.root.remove(r.m); r.m.geometry.dispose(); r.mat.dispose(); ripples.splice(i, 1); continue; }
        r.m.scale.setScalar(1 + u * 6); r.mat.opacity = 0.55 * (1 - u);
      }
      portalMat.opacity = 0.4 + Math.sin(portalT.t * 2) * 0.15;
      // 먼지: 아주 천천히 가라앉고 흔들린다
      const dp = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustN; i++) {
        const sd = dustSeed[i];
        let y = dp.getY(i) - dt * 0.05;
        if (y < F + 0.3) y = F + 12;
        dp.setXYZ(i, dp.getX(i) + Math.sin(portalT.t * 0.3 + sd) * dt * 0.06, y, dp.getZ(i) + Math.cos(portalT.t * 0.27 + sd) * dt * 0.06);
      }
      dp.needsUpdate = true;
      // 화살표가 정문 쪽으로 흘러가듯 차례로 밝아진다
      arrows.forEach((m, i) => { m.opacity = 0.7 + 0.3 * Math.max(0, Math.sin(portalT.t * 3.2 - i * 0.55)); });
    },
  };
}
