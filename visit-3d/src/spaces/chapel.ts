// 언덕 위 경당 — 작은 팔각 실내. 견본 어린이 그림 10점 · 봉헌초 · 작은 제대.
// 좌표: 가운데가 원점, 바닥 y=0, 벽 안쪽 면까지 거리(내접 반지름) R.
import * as THREE from 'three';
import { Kit } from '../kit.ts';
import type { Mats } from '../materials.ts';
import { wall, rect, archPane, box, type ArchHole } from '../geo.ts';
import { stainedGlass } from '../textures.ts';
import { Registry, pews, candleStand, lectern, artFrame } from './props.ts';
import { SPACES } from '../../shared/spaces.ts';
import type { SpaceBuild, Station, WindowLight } from './types.ts';

const R = 7, H = 6.5, T = 0.5;
const SIDE = 2 * R * Math.tan(Math.PI / 8);
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function buildChapel(M: Mats): SpaceBuild {
  const kit = new Kit();
  const reg = new Registry();
  const windows: WindowLight[] = [];
  const glass = [5, 6, 7].map((s) => M.glass(stainedGlass(s * 17)));

  // 벽 i 의 기준: 가운데 c, 접선 t(로컬 X), 바깥 법선 n(로컬 Z)
  const frame = (i: number) => {
    const th = (i * Math.PI) / 4;
    return { th, c: v3(R * Math.sin(th), 0, R * Math.cos(th)), t: v3(Math.cos(th), 0, -Math.sin(th)), n: v3(Math.sin(th), 0, Math.cos(th)) };
  };
  /** 벽 i 위의 점: 접선 방향 u, 높이 y, 안쪽으로 inset */
  const onWall = (i: number, u: number, y: number, inset = 0.03) => {
    const f = frame(i);
    return f.c.clone().addScaledVector(f.t, u).addScaledVector(f.n, -inset).setY(y);
  };

  kit.add(new THREE.CylinderGeometry(R / Math.cos(Math.PI / 8) + 0.6, R / Math.cos(Math.PI / 8) + 0.6, 0.2, 8), M.marble, { pos: [0, -0.1, 0], rot: [0, Math.PI / 8, 0], collide: true });

  const W = SIDE + 0.5;
  for (let i = 0; i < 8; i++) {
    const f = frame(i);
    const holes: ArchHole[] = [];
    if (i % 2 === 1) holes.push({ cx: W / 2, w: 1.4, bottom: 2.3, spring: 4.6, rise: 1.0 });
    if (i === 4) holes.push({ cx: W / 2, w: 1.8, bottom: 2.6, spring: 5.0, rise: 1.1 });
    const origin = f.c.clone().addScaledVector(f.t, -W / 2);
    kit.add(wall(rect(0, 0, W, H), holes, T), M.cream, { pos: [origin.x, 0, origin.z], rot: [0, f.th, 0], collide: true });
    for (const h of holes) {
      const p = f.c.clone().addScaledVector(f.t, h.cx - W / 2).addScaledVector(f.n, T / 2);
      kit.add(archPane(h.w, h.spring - h.bottom, h.rise), glass[i % glass.length], { pos: [p.x, h.bottom, p.z], rot: [0, f.th, 0], shadow: false });
      windows.push({ pos: p.clone().setY((h.spring + h.spring + h.rise) / 2), inward: f.n.clone().negate(), color: new THREE.Color([0x2856c9, 0xb3122e, 0xd4a017][i % 3]) });
    }
    kit.add(box(W, 0.3, T + 0.2), M.stoneDark, { pos: [f.c.x + f.n.x * T / 2, H - 0.15, f.c.z + f.n.z * T / 2], rot: [0, f.th, 0] });
  }
  kit.add(new THREE.ConeGeometry(R / Math.cos(Math.PI / 8) + 0.4, 4.2, 8, 1, true), M.plaster, { pos: [0, H + 2.1, 0], rot: [0, Math.PI / 8, 0], shadow: false });
  kit.add(new THREE.TorusGeometry(0.7, 0.04, 8, 24), M.gold, { pos: [0, 5.2, 0], rot: [Math.PI / 2, 0, 0], shadow: false });
  const light = new THREE.PointLight(0xffdcae, 30, 18, 1.5);
  light.position.set(0, 5, 0);
  kit.root.add(light);
  const hemi = new THREE.HemisphereLight(0xfff4e0, 0x3a3026, 0.6);
  kit.root.add(hemi);

  // 정문(대성당으로 돌아가는 문) — 벽 0
  const doorPos = onWall(0, 0, 1.4, 0.06);
  const doorMesh = kit.add(box(1.6, 2.8, 0.1), M.woodDark, { pos: [doorPos.x, 1.4, doorPos.z], rot: [0, 0, 0], dynamic: true });
  kit.add(box(1.9, 0.2, 0.14), M.stoneDark, { pos: [doorPos.x, 2.9, doorPos.z] });
  reg.add(doorMesh, { kind: 'portal', id: 'to-cathedral', title: '대성당으로', body: '대성당 앞마당으로 돌아갑니다.', target: 'cathedral', anchor: doorPos.clone() });

  // 제대 · 십자가 · 봉헌초 (벽 4 쪽)
  const altarPos = onWall(4, 0, 0, 1.4);
  const altar = kit.add(box(1.8, 1.0, 0.8), M.stone, { pos: [altarPos.x, 0.5, altarPos.z], collide: true, dynamic: true });
  kit.add(box(1.9, 0.04, 0.9), M.cloth, { pos: [altarPos.x, 1.02, altarPos.z] });
  reg.add(altar, { kind: 'info', id: 'altar', title: '작은 제대', body: '경당의 제대입니다. 이 시범 공간에서는 감상과 설명만 둡니다.', anchor: altarPos.clone().setY(1) });
  const crossP = onWall(4, 0, 0, 0.12);
  kit.add(box(0.16, 1.6, 0.08), M.gold, { pos: [crossP.x, 2.0, crossP.z] });
  kit.add(box(0.9, 0.16, 0.08), M.gold, { pos: [crossP.x, 2.35, crossP.z] });
  const candles = candleStand(kit, M, reg, onWall(3, 0.4, 0, 1.0), frame(3).th + Math.PI, SPACES.chapel.candles);

  // 견본 그림 10점: 벽 2 · 6 에 3점씩, 창이 있는 벽 1 · 5 · 7 아래에 1점씩, 벽 3 은 봉헌초 자리라 비우고 벽 1 에 하나 더
  const spots: [number, number][] = [[2, -1.7], [2, 0], [2, 1.7], [6, -1.7], [6, 0], [6, 1.7], [1, -0.8], [1, 1.1], [5, 0], [7, 0]];
  spots.forEach(([wi, u], k) => {
    const y = wi % 2 === 1 ? 1.35 : 1.75;
    artFrame(kit, M, reg, SPACES.chapel.arts[k], 11 + k, onWall(wi, u, y, 0.05), frame(wi).th + Math.PI, wi % 2 === 1 ? 0.8 : 1.2);
  });

  // 작은 신도석 4줄 (제대를 본다 = -Z)
  const spotsPew: { x: number; y: number; z: number }[] = [];
  for (const z of [-1.2, 0.2, 1.6]) for (const x of [-1.9, 1.9]) spotsPew.push({ x, y: 0, z });
  pews(kit, M, reg, spotsPew, 0, 2.6);

  lectern(kit, M, reg, v3(3.6, 0, 3.4), Math.PI + 0.7, '어린이 그림 특별전 (견본)', '벽에 걸린 그림 10점은 이 시범 공간을 위해 자동으로 그린 견본입니다. 그림 앞에 다가가면 제목을 보고 마음 · 박수 · 기도로 반응을 남길 수 있습니다. 반응 수는 이 공간에 있는 모두에게 함께 보입니다.', ['어린이 그림 특별전', '견본 10점']);

  const bvh = kit.finalize();

  const stations: Station[] = [
    { pos: v3(0, 0, 4.4), yaw: 0, pitch: 0.05, caption: '경당 — 팔각 공간 가운데서 제대를 바라봅니다.' },
    { pos: v3(-3.2, 0, 0), yaw: Math.PI / 2, pitch: 0, caption: '그림 벽 — 견본 어린이 그림이 걸려 있습니다.' },
    { pos: v3(3.2, 0, 0), yaw: -Math.PI / 2, pitch: 0, caption: '반대편 그림 벽 — 다가가면 반응을 남길 수 있습니다.' },
    { pos: v3(2.2, 0, -2.6), yaw: -Math.PI * 0.75, pitch: -0.1, caption: '봉헌초 — 지향을 고르고 초를 켭니다.' },
  ];

  return {
    id: 'chapel', title: SPACES.chapel.title, root: kit.root, bvh,
    interactables: reg.interactables, pickables: reg.pickables,
    doors: [], candles, stations, windows,
    zones: [{ name: '언덕 위 경당', box: new THREE.Box3(v3(-50, -10, -50), v3(50, 50, 50)), outdoor: 0 }],
    spawn: { pos: v3(0, 0, 5), yaw: 0 },
    floorY: 0,
    interior: new THREE.Box3(v3(-R, -1, -R), v3(R, 10, R)),
    update() {},
  };
}
