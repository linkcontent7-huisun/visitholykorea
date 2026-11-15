// 명동대성당 구내 «외부 3D 지도» — OSM 윤곽(site.json)을 높이대로 세운다.
// 데이터: public/site/myeongdong.json (scripts/fetch-osm-site.mjs 가 생성, © OpenStreetMap contributors · ODbL)
// 경로 첫 마디를 6자 미만으로 둔다 — vite.config.ts 의 실시간 프록시 정규식(^/{6,}/{6,})에 걸리지 않게.
import * as THREE from 'three';
import { buildCathedral, worldUV, type CathedralFrame } from './cathedral.ts';
import { buildLandscape, makeHill, type LandscapeData } from './landscape.ts';
import { buildInterior, type Interior } from './interior.ts';

export interface SiteBuilding {
  osmId: number;
  name: string | null;
  nameEn: string | null;
  kind: string;
  height: number;
  heightSource: string;
  spireHeight?: number;
  spireSource?: string;
  ring: [number, number][];
}

export interface SiteData {
  id: string;
  title: string;
  origin: { lat: number; lon: number };
  attribution: string;
  mainBuilding: number;
  precinct: { osmId: number; name: string | null; ring: [number, number][] } | null;
  buildings: SiteBuilding[];
  /** 풍경용(선택) — 없으면 풍경 없이 그린다 */
  farBuildings?: LandscapeData['farBuildings'];
  roads?: LandscapeData['roads'];
  areas?: LandscapeData['areas'];
  trees?: LandscapeData['trees'];
}

export interface SiteMap {
  group: THREE.Group;
  /** 레이캐스트 대상 — mesh.userData.building 에 SiteBuilding 이 들어 있다 */
  pickables: THREE.Mesh[];
  /** 라벨을 달 위치(건물 이름이 있는 것만) */
  labels: { building: SiteBuilding; anchor: THREE.Vector3 }[];
  main: THREE.Mesh;
  /** 본당 외 둘레 건물 — 본당을 볼 때 흐리게 할 대상 */
  context: THREE.Mesh[];
  /** 풍경 통계(도로·나무 수 등) */
  landscape: Record<string, number>;
  /** 지면 높이(동산) — 월드 x,z */
  heightAt: (x: number, z: number) => number;
  /** 동산 꼭대기 높이(본당 바닥) */
  hillTop: number;
  /** 본당 외관 그룹 · 풍경 그룹 — 실내를 볼 때 숨긴다 */
  exterior: THREE.Object3D[];
  /** 실내(기본 숨김). views 는 월드 좌표로 바꿔 둔다 */
  interior: Interior;
  /** 본당 상세 모델의 정면·축 — 카메라 구도에 쓴다 */
  cathedral: CathedralFrame;
  dispose(): void;
}

export async function loadSite(url = `${import.meta.env.BASE_URL}site/myeongdong.json`): Promise<SiteData> {
  // 단일 HTML 산출물(scripts/build-sitemap-standalone.mjs)은 데이터를 페이지 안에 박아 둔다.
  // blob:·file:// 로 열리면 루트 상대 경로를 해석할 수 없어 fetch 가 실패하기 때문이다.
  const embedded = document.getElementById('site-data');
  if (embedded?.textContent) return JSON.parse(embedded.textContent) as SiteData;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`site.json ${res.status}`);
  return (await res.json()) as SiteData;
}

// OSM 링(x=동, z=남) → XY 평면 Shape. 돌려 세울 때 z 가 그대로 맞도록 y 에 -z 를 넣는다.
function shapeOf(ring: [number, number][]): THREE.Shape {
  const s = new THREE.Shape();
  ring.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)));
  s.closePath();
  return s;
}

function prism(ring: [number, number][], height: number, mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(shapeOf(ring), { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); // XY 평면 → 바닥(XZ), 압출 방향 → +Y
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function facadeTex(base: string, seed: number) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!; let x = seed;
  const r = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { g.fillStyle = r() < 0.2 ? '#d8c690' : '#3a4856'; g.fillRect(i * 128 + 18, j * 128 * 0.82 + 20, 92, 52); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

const MAT = {
  church: new THREE.MeshStandardMaterial({ map: facadeTex('#a8876f', 3), roughness: 0.9 }),
  other: new THREE.MeshStandardMaterial({ map: facadeTex('#a39c90', 5), roughness: 0.92 }),
};

const CHURCH_KINDS = new Set(['church', 'chapel', 'cathedral']);

export function buildSiteMap(site: SiteData): SiteMap {
  const group = new THREE.Group();
  group.name = `site:${site.id}`;
  const pickables: THREE.Mesh[] = [];
  const context: THREE.Mesh[] = [];
  const labels: SiteMap['labels'] = [];

  // 본당 + 종탑은 OSM 윤곽 대신 상세 모델(cathedral.ts)로 세운다
  const mainB = site.buildings.find((b) => b.osmId === site.mainBuilding);
  if (!mainB) throw new Error('site.json 에 본당이 없다');
  const towerB = site.buildings.find((b) => b.kind === 'bell_tower') ?? null;
  // walkable: 정문이 뚫려 «정문 앞» 에서 실내가 들여다보인다(실내 그룹은 바깥에서도 켜 둔다)
  const cath = buildCathedral(mainB.ring, towerB?.ring ?? null, mainB.height, towerB?.height ?? mainB.spireHeight ?? 45, { walkable: true });
  cath.meshes.forEach((m) => { m.userData.building = mainB; m.userData.noHighlight = true; pickables.push(m); });
  group.add(cath.group);
  const main: THREE.Mesh = cath.meshes[0];
  const F = cath.frame;

  // 동산: 명동대성당은 둘레 길보다 높은 언덕(종현) 위에 있다.
  //   본당 윤곽과 정면 앞마당(깊이 22 m) 둘레 12 m 는 HILL m 평지, 그 밖 30 m 에 걸쳐 길 높이로 내려간다.
  //   구역 경계 9 m 안쪽에서 0 이 되므로 구역 밖 도로 높이는 바뀌지 않는다.
  //   높이 7 m 는 SRTM(성당 55 m · 을지로 46 m · 퇴계로 51 m)의 대략값이다 — 실측 아님.
  const HILL = 7;
  const quad = (a0: number, a1: number, w: number) => [[a0, -w], [a0, w], [a1, w], [a1, -w]].map(([a, b]) => {
    const p = F.front.clone().addScaledVector(F.facing, a).addScaledVector(F.side, b);
    return [p.x, p.z] as [number, number];
  });
  const hillCore = [mainB.ring, ...(towerB ? [towerB.ring] : []), quad(-2, 22, 17)];
  const heightAt = makeHill(hillCore, site.precinct?.ring ?? null, HILL);
  cath.group.position.y = HILL;
  for (const v of [F.front, F.center]) v.y = HILL;
  labels.push({ building: mainB, anchor: F.front.clone().setY(HILL + (towerB?.height ?? 45) + 3) });

  for (const b of site.buildings) {
    if (b === mainB || b === towerB) continue;
    const mat = b.name && CHURCH_KINDS.has(b.kind) ? MAT.church : MAT.other;
    const m = prism(b.ring, b.height, mat);
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry; worldUV(g, 1 / 4); if (g !== m.geometry) { m.geometry.dispose(); m.geometry = g; } // 창 무늬가 실제 크기(4 m)로
    const base = Math.min(...b.ring.map(([x, z]) => heightAt(x, z))); // 비탈에 걸친 건물은 낮은 쪽에 앉힌다(높은 쪽은 묻힌다)
    m.position.y = base;
    m.userData.building = b;
    m.name = `osm:${b.osmId}`;
    group.add(m);
    pickables.push(m);
    context.push(m);
    const c = b.ring.reduce((s, [x, z]) => s.add(new THREE.Vector3(x, 0, z)), new THREE.Vector3()).divideScalar(b.ring.length);
    if (b.name) labels.push({ building: b, anchor: new THREE.Vector3(c.x, base + b.height + 3, c.z) });
  }

  // 풍경: 지면·도로·녹지·가을 수목·바깥 건물·원경 + 동산 지형. 본당 정면 앞마당(폭 34 m, 깊이 40 m)은 나무 없이 비운다.
  const plaza = quad(-2, 40, 17);
  const land = buildLandscape(site as LandscapeData, {
    keepClear: [plaza],
    terrain: { height: heightAt, center: [F.center.x, F.center.z], size: 230, top: HILL },
  });
  group.add(land.group);

  // 실내: 외관과 같은 변환으로 둔다(기본 숨김)
  const interior = buildInterior(cath.dims);
  interior.group.position.copy(cath.group.position);
  interior.group.rotation.copy(cath.group.rotation);
  interior.group.visible = true;
  interior.lights.visible = false;
  group.add(interior.group);
  interior.group.updateMatrixWorld(true);
  for (const v of Object.values(interior.views)) { v.pos.applyMatrix4(interior.group.matrixWorld); v.target.applyMatrix4(interior.group.matrixWorld); }

  return {
    group,
    pickables,
    landscape: land.stats,
    labels,
    main,
    context,
    cathedral: F,
    heightAt,
    hillTop: HILL,
    exterior: [cath.group, land.group, ...context],
    interior,
    dispose() {
      group.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    },
  };
}
