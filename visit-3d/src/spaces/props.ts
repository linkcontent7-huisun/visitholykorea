// 두 공간이 함께 쓰는 소품 — 신도석 · 봉헌초대 · 안내대 · 액자 · 종 · 이동 문
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { box, cyl } from '../geo.ts';
import type { Kit } from '../kit.ts';
import type { Mats } from '../materials.ts';
import { textPanel, kidDrawing } from '../textures.ts';
import type { CandleRt, Interactable } from './types.ts';

export class Registry {
  interactables: Interactable[] = [];
  pickables: THREE.Object3D[] = [];
  add(objs: THREE.Object3D | THREE.Object3D[], ia: Interactable) {
    for (const o of Array.isArray(objs) ? objs : [objs]) { o.userData.ia = ia; this.pickables.push(o); }
    this.interactables.push(ia);
    return ia;
  }
}

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** 신도석 — InstancedMesh 하나 + 줄마다 충돌 상자. 앉는 방향은 yaw(기본 -Z 를 본다) */
export function pews(kit: Kit, M: Mats, reg: Registry, spots: { x: number; y: number; z: number }[], yaw = 0, width = 3.8) {
  const parts = [
    box(width, 0.08, 0.45).translate(0, 0.45, 0),
    box(width, 0.55, 0.06).translate(0, 0.78, 0.22),
    box(0.07, 0.95, 0.52).translate(-width / 2, 0.47, 0.02),
    box(0.07, 0.95, 0.52).translate(width / 2, 0.47, 0.02),
  ];
  const geo = mergeGeometries(parts.map((g) => g.toNonIndexed()))!;
  parts.forEach((g) => g.dispose());
  const inst = new THREE.InstancedMesh(geo, M.pew, spots.length);
  inst.castShadow = inst.receiveShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), one = v3(1, 1, 1);
  spots.forEach((s, i) => {
    inst.setMatrixAt(i, m.compose(v3(s.x, s.y, s.z), q, one));
    kit.add(box(width, 0.95, 0.56), M.wood, { pos: [s.x, s.y + 0.47, s.z], rot: [0, yaw, 0], colliderOnly: true });
  });
  inst.userData.dynamic = true;
  kit.root.add(inst);
  reg.add(inst, {
    kind: 'seat', id: 'pew', title: '신도석',
    body: '앉아서 정면을 바라볼 수 있습니다. 움직이면 일어납니다.',
    anchor: v3(spots[0].x, spots[0].y + 0.6, spots[0].z),
    seatAt: (i) => {
      const s = spots[Math.max(0, Math.min(spots.length - 1, i))];
      const back = v3(0, 0, -0.05).applyAxisAngle(v3(0, 1, 0), yaw);
      return { pos: v3(s.x, s.y, s.z).add(back), yaw };
    },
  });
  return inst;
}

/** 봉헌초대 — 철제 대 위에 두 줄의 초. 불꽃은 켜질 때만 보인다 */
export function candleStand(kit: Kit, M: Mats, reg: Registry, pos: THREE.Vector3, yaw: number, ids: string[], title = '봉헌초', body = '초를 하나 켜고 지향을 고릅니다. 켜진 초는 이 공간에 있는 모두에게 보입니다.', badge = '🕯️ 초 봉헌', votive = false): CandleRt[] {
  const g = new THREE.Group();
  g.position.copy(pos); g.rotation.y = yaw; g.userData.dynamic = true;
  kit.root.add(g);
  const rows = votive ? 2 : ids.length > 8 ? 2 : 1, perRow = Math.ceil(ids.length / rows), w = perRow * 0.24 + 0.2;
  // 봉헌초 컵(성모 동굴의 유리 봉헌함처럼 붉은 유리컵 안의 초) — 켜지 않은 자리에도 같은 컵이 놓여 있다
  // 2026-11-13: 투과(transmission) 유리를 쓰면 three.js 가 장면 전체를 한 번 더 그린다(바깥 그리기 호출 1,360 → 757) → 반투명 유리로 흉내 낸다
  const cupMat = new THREE.MeshPhysicalMaterial({ color: 0xb01822, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.78, emissive: 0x2a0204, depthWrite: false });
  const meshes: THREE.Object3D[] = [];
  if (!votive) {
    meshes.push(kit.add(cyl(0.05, 0.08, 0.9, 10), M.iron, { parent: g, pos: [0, 0.45, 0], collide: true, dynamic: true }));
    for (let r = 0; r < rows; r++) meshes.push(kit.add(box(w, 0.05, 0.36), M.iron, { parent: g, pos: [0, 0.92 + r * 0.2, -r * 0.22], collide: true, dynamic: true }));
  } else {
    // 유리 봉헌함: 짙은 나무 받침장 + 계단식 선반 두 단 + 유리 상자
    meshes.push(kit.add(box(w + 0.3, 0.9, 0.75), M.woodDark, { parent: g, pos: [0, 0.45, -0.1], collide: true, dynamic: true }));
    for (let r = 0; r < rows; r++) meshes.push(kit.add(box(w + 0.1, 0.05, 0.3), M.woodDark, { parent: g, pos: [0, 0.92 + r * 0.2, -r * 0.22], dynamic: true }));
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.12, depthWrite: false });
    kit.add(box(w + 0.3, 0.75, 0.02), glass, { parent: g, pos: [0, 1.3, 0.25], dynamic: true, shadow: false });
    for (const sx of [-1, 1]) kit.add(box(0.02, 0.75, 0.75), glass, { parent: g, pos: [sx * (w / 2 + 0.15), 1.3, -0.1], dynamic: true, shadow: false });
    meshes.push(kit.add(box(w + 0.36, 0.05, 0.8), M.woodDark, { parent: g, pos: [0, 1.7, -0.1], dynamic: true }));
  }
  const flameGeo = new THREE.ConeGeometry(0.022, 0.07, 8);
  const out: CandleRt[] = [];
  // 2026-11-13 가볍게: 초 · 컵을 하나씩 그리면 봉헌대 하나가 수십 번 그려진다 → 대마다 한 덩어리로 합친다(모양 · 누르기는 그대로)
  const waxParts: THREE.BufferGeometry[] = [], cupParts: THREE.BufferGeometry[] = [];
  ids.forEach((id, i) => {
    const r = Math.floor(i / perRow), k = i % perRow;
    const x = -((perRow - 1) * 0.24) / 2 + k * 0.24, y = 0.95 + r * 0.2, z = -r * 0.22;
    if (votive) cupParts.push(cyl(0.045, 0.04, 0.12, 14, true).translate(x, y + 0.06, z));
    waxParts.push(cyl(0.028, 0.028, votive ? 0.08 : 0.18, 10).translate(x, y + (votive ? 0.04 : 0.09), z));
    const flame = new THREE.Group();
    flame.position.set(x, y + (votive ? 0.12 : 0.21), z);
    const cone = new THREE.Mesh(flameGeo, M.flame);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowTex, color: 0xffa640, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(0.22, 0.3, 1);
    flame.add(cone, halo);
    flame.visible = false;
    g.add(flame);
    out.push({ id, flame, lit: false, phrase: 0, by: '' });
  });
  const merge = (list: THREE.BufferGeometry[]) => { const m = mergeGeometries(list.map((x) => (x.index ? x.toNonIndexed() : x)))!; list.forEach((x) => x.dispose()); return m; };
  if (cupParts.length) meshes.push(kit.add(merge(cupParts), cupMat, { parent: g, dynamic: true, shadow: false }));
  if (waxParts.length) meshes.push(kit.add(merge(waxParts), M.wax, { parent: g, dynamic: true }));
  const light = new THREE.PointLight(0xffb060, 0, 6, 2);
  light.position.set(0, 1.4, 0.2);
  g.add(light);
  g.userData.light = light;
  reg.add(meshes, {
    kind: 'candle', id: ids[0], title, body, group: ids, badge,
    anchor: pos.clone().setY(pos.y + 1.1),
  });
  return out;
}

/** 안내대(작은 경사 판) */
export function lectern(kit: Kit, M: Mats, reg: Registry, pos: THREE.Vector3, yaw: number, title: string, body: string, lines: string[]) {
  const g = new THREE.Group();
  g.position.copy(pos); g.rotation.y = yaw; g.userData.dynamic = true;
  kit.root.add(g);
  const post = kit.add(box(0.12, 1.0, 0.12), M.woodDark, { parent: g, pos: [0, 0.5, 0], collide: true, dynamic: true });
  const mat = new THREE.MeshStandardMaterial({ map: textPanel(lines, 512, 320), roughness: 0.8 });
  const panel = kit.add(box(0.8, 0.5, 0.04), mat, { parent: g, pos: [0, 1.15, 0], rot: [-0.6, 0, 0], dynamic: true });
  reg.add([post, panel], { kind: 'info', id: title, title, body, anchor: pos.clone().setY(pos.y + 1.1) });
}

/** v3-10: 해설 안내 — 성당에 없는 독서대 모양 팻말 대신 바닥에 눈에 안 띄게 놓이는 낮은 놋쇠 안내판(걸림 없음) */
export function floorPlate(kit: Kit, M: Mats, reg: Registry, pos: THREE.Vector3, yaw: number, title: string, body: string, lines: string[]) {
  const g = new THREE.Group();
  g.position.copy(pos); g.rotation.y = yaw; g.userData.dynamic = true;
  kit.root.add(g);
  const mat = new THREE.MeshStandardMaterial({ map: textPanel(lines, 512, 320, '#3b3020', '#ead9a8'), roughness: 0.45, metalness: 0.35 });
  const plate = kit.add(box(0.7, 0.025, 0.46), mat, { parent: g, pos: [0, 0.013, 0], rot: [0, 0, 0], dynamic: true, noCollide: true, shadow: false });
  reg.add([plate], { kind: 'info', id: title, title, body, anchor: pos.clone().setY(pos.y + 0.3) });
}

/** 벽에 거는 견본 어린이 그림. normalYaw = 그림이 바라보는 방향의 yaw */
export function artFrame(kit: Kit, M: Mats, reg: Registry, id: string, seed: number, pos: THREE.Vector3, yaw: number, w = 1.0) {
  const art = kidDrawing(seed);
  const h = w * 0.75;
  const g = new THREE.Group();
  g.position.copy(pos); g.rotation.y = yaw; g.userData.dynamic = true;
  kit.root.add(g);
  const frame = kit.add(box(w + 0.12, h + 0.12, 0.05), M.gold, { parent: g, dynamic: true });
  // 그림마다 조명을 달면 모바일에서 무거워진다 → 그림 자체를 살짝 밝힌다(emissive)
  const picMat = M.picture(art.texture);
  picMat.emissiveMap = art.texture; picMat.emissive = new THREE.Color(0x5a5248);
  const pic = kit.add(new THREE.PlaneGeometry(w, h), picMat, { parent: g, pos: [0, 0, 0.03], dynamic: true, shadow: false });
  reg.add([frame, pic], { kind: 'art', id, title: art.title, author: art.author, body: '견본 작품입니다. 실제 아이의 작품이 아니라 이 시범 공간을 위해 자동으로 그린 그림입니다.', anchor: pos.clone() });
}

/** 종 (LatheGeometry 단면) */
export function bellMesh(M: Mats) {
  const pts = [[0, 1.0], [0.16, 0.98], [0.3, 0.85], [0.36, 0.55], [0.42, 0.25], [0.55, 0.05], [0.58, 0], [0.5, 0.02]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), M.bronze);
  m.material.side = THREE.DoubleSide;
  return m;
}
