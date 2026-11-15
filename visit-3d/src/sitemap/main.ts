// 단독 확인 페이지(sitemap.html) — 구내 외부 지도 + 건물 선택 + 본당 «들어가기».
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { buildSiteMap, loadSite, type SiteBuilding } from './siteMap.ts';

// 실내로 들어갈 때 이동할 주소 — 본 서비스(index.html)의 성당 공간.
// 단일 HTML 로 열린 경우(blob:·file://)에는 상대 주소가 무의미하므로 서비스 도메인으로 보낸다.
const STANDALONE = !/^https?:$/.test(location.protocol);
const ENTER_URL = STANDALONE ? 'https://visitholykorea.axcamp.com/?space=cathedral' : `${import.meta.env.BASE_URL}?space=cathedral`;
// 실제 사진(360°)은 외부 링크로만 연다. 화면 안에 넣지 않는다(All rights reserved).
const PHOTO_TOUR_URL = 'https://look360.kr/place/mdsd';

const app = document.getElementById('app')!;
const card = document.getElementById('card')!;
const attribution = document.getElementById('attribution')!;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; // r187 에서 PCFSoftShadowMap 은 제거됐다
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.55;
app.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
app.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();

// 물리 기반 하늘(늦은 오후, 서남서 해) — 같은 하늘을 환경광(PMREM)으로도 쓴다
const SUN_ELEV = 27, SUN_AZIM = 235; // 가을 늦은 오후 // 도(°). 방위는 북=0, 동=90
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - SUN_ELEV), THREE.MathUtils.degToRad(180 - SUN_AZIM));
// setFromSphericalCoords: theta=0 → +z(남). 위 식으로 방위각을 x=동, z=남 좌표에 맞춘다
const sky = new Sky();
sky.scale.setScalar(3000);
const su = sky.material.uniforms;
su.turbidity.value = 6.5;
su.rayleigh.value = 1.9;
su.mieCoefficient.value = 0.004;
su.mieDirectionalG.value = 0.82;
su.sunPosition.value.copy(sunDir);
scene.add(sky);
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
const envSky = new Sky();
envSky.scale.setScalar(3000);
Object.entries(su).forEach(([k, u]) => { (envSky.material.uniforms as Record<string, { value: unknown }>)[k].value = (u as { value: unknown }).value; });
envScene.add(envSky);
const skyEnv = pmrem.fromScene(envScene).texture;
scene.environment = skyEnv;
scene.environmentIntensity = 0.9;
const outFog = new THREE.Fog(0xcdd2d4, 450, 3400);
const inFog = new THREE.Fog(0x6a5a48, 30, 160); // 실내 공기(먼지·향 연기)의 옅은 깊이감
scene.fog = outFog; // 원경(남산 1.3 km)이 옅은 대기 속에 보이도록

const sun = new THREE.DirectionalLight(0xffdcb0, 3.4);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 6000);
const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 12;
controls.maxDistance = 1400;

const site = await loadSite();
const map = buildSiteMap(site);
scene.add(map.group);
attribution.textContent = site.attribution + ' · 본당 외관: 양식 재구성(실측 아님)';

// 그림자는 본당 둘레에 집중한다(선명도)
const F = map.cathedral;
sun.target.position.copy(F.center);
sun.position.copy(F.center).addScaledVector(sunDir, 200);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 50, far: 420 });
sun.shadow.camera.updateProjectionMatrix();

// 시점 프리셋 — 사진 찍듯 본당을 보는 구도. 높이는 그 자리 지면(동산) 기준이다.
type View = { pos: THREE.Vector3; target: THREE.Vector3 };
const at = (fwd: number, side: number, up: number) => {
  const p = F.front.clone().addScaledVector(F.facing, fwd).addScaledVector(F.side, side);
  return p.setY(map.heightAt(p.x, p.z) + up);
};
const VIEWS: Record<string, View> = {
  front: { pos: at(78, -18, 5), target: at(-8, 0, 22) },
  side: { pos: at(10, -70, 9), target: at(-F.length / 2, 0, 14) },
  rear: { pos: at(-F.length - 45, 40, 22), target: at(-F.length / 2, 0, 12) },
  street: { pos: at(105, 6, 1.7), target: at(0, 0, 16) }, // 동산 아래 길에서 올려다봄(눈높이 1.7 m)
  door: { pos: at(14, 0, 1.7), target: at(-1, 0, 3.6) }, // 정문 앞 14 m — 열린 정문으로 신랑이 들여다보인다
  site: { pos: at(260, -210, 170), target: at(-F.length / 2, 0, 5) },
  namsan: { pos: at(330, 40, 90), target: at(-F.length - 600, 0, 120) }, // 북쪽에서 성당 너머 남산
};
for (const [k, v] of Object.entries(map.interior.views)) VIEWS[`in-${k}`] = v;

// 창빛: 실제 해 방향을 실내 지역 좌표로 바꿔 넘긴다(빛줄기·바닥의 색 빛이 해를 따른다)
{
  const q = map.interior.group.getWorldQuaternion(new THREE.Quaternion()).invert();
  const dl = sunDir.clone().applyQuaternion(q);
  map.interior.setSun(dl);
}

// 실내 반사(환경광): 실내를 한 번 큐브맵으로 찍어 PMREM 으로 — 바닥 대리석·금속이 실내를 비춘다
let interiorEnv: THREE.Texture | null = null;
function captureInterior() {
  const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cube = new THREE.CubeCamera(0.3, 300, rt);
  cube.position.copy(map.interior.probe).applyMatrix4(map.interior.group.matrixWorld);
  scene.add(cube);
  const env = scene.environment; scene.environment = null;
  const sv = map.interior.sunlight.visible; map.interior.sunlight.visible = false;
  cube.update(renderer, scene);
  map.interior.sunlight.visible = sv; scene.environment = env;
  scene.remove(cube);
  interiorEnv = pmrem.fromCubemap(rt.texture).texture;
  rt.dispose();
}
const isInside = (name: string) => name.startsWith('in-');

// 본당 가까이 볼 때만 둘레 건물을 반투명으로 흐린다(실제 구내가 빽빽해 시야를 가린다)
const GHOST = new Set(['front', 'side', 'rear']);
const contextMats = [...new Set(map.context.map((m) => m.material as THREE.MeshStandardMaterial))];
function ghost(on: boolean) {
  for (const m of contextMats) {
    m.transparent = on;
    m.opacity = on ? 0.16 : 1;
    m.depthWrite = !on;
    m.needsUpdate = true;
  }
  map.context.forEach((m) => (m.castShadow = !on));
  document.querySelectorAll<HTMLElement>('.label:not(.main)').forEach((el) => (el.style.visibility = on ? 'hidden' : ''));
}

// 바깥 ↔ 실내 전환: 실내에서는 외관·풍경을 숨기고 실내 조명을 켠다
let inside = false;
function setInside(on: boolean) {
  inside = on;
  map.exterior.forEach((o) => (o.visible = !on));
  map.interior.lights.visible = on;
  sky.visible = !on; // 실내에서는 하늘 대신 석재색 배경 — 부재 사이 실틈이 «하늘» 로 보이지 않게
  scene.background = on ? new THREE.Color(0x3a3128) : null;
  scene.fog = on ? inFog : outFog;
  sun.intensity = on ? 0.3 : 3.4;
  if (on && !interiorEnv) captureInterior();
  scene.environment = on ? (interiorEnv ?? skyEnv) : skyEnv;
  scene.environmentIntensity = on ? 0.9 : 0.9;
  renderer.toneMappingExposure = on ? 0.9 : 0.55;
  labelObjs.forEach((o) => (o.visible = !on)); // CSS2DRenderer 는 매 프레임 display 를 다시 쓰므로 객체를 숨긴다
  if (on) select(null);
  Object.assign(controls, on ? { minDistance: 0.3, maxDistance: 4, maxPolarAngle: Math.PI * 0.95 } : { minDistance: 12, maxDistance: 1400, maxPolarAngle: Math.PI * 0.495 });
  document.querySelectorAll<HTMLButtonElement>('#views button').forEach((b) => b.classList.toggle('active', false));
}

function fly(v: View, ms: number, done?: () => void, look = false) {
  // look=true: 실내처럼 «고개 돌리기» — 궤도 중심을 눈앞 1 m 에 둔다
  const target = look ? v.pos.clone().add(v.target.clone().sub(v.pos).normalize()) : v.target;
  const p0 = camera.position.clone(), t0 = controls.target.clone(), start = performance.now();
  const step = () => {
    const k = Math.min(1, (performance.now() - start) / ms), e = k * k * (3 - 2 * k);
    camera.position.lerpVectors(p0, v.pos, e);
    controls.target.lerpVectors(t0, target, e);
    if (k < 1) requestAnimationFrame(step); else done?.();
  };
  step();
}

let busy = false;
function goto(name: string, instant = false) {
  const v = VIEWS[name];
  if (!v || busy) return;
  document.querySelectorAll<HTMLButtonElement>('#views button').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  if (instant) { setInside(isInside(name)); ghost(GHOST.has(name)); camera.position.copy(v.pos); controls.target.copy(v.target); return; }
  if (isInside(name) && !inside) {
    // 정문 앞까지 날아간 뒤 문을 지나 신랑으로 들어간다
    ghost(false);
    busy = true;
    fly(VIEWS.door, 1400, () => fly({ pos: at(-1.5, 0, 1.7), target: at(-12, 0, 2.5) }, 700, () => {
      setInside(true);
      fly(v, 1300, () => (busy = false), true);
    }));
    return;
  }
  if (!isInside(name) && inside) {
    // 정문으로 나와 바깥 시점으로
    setInside(false);
    camera.position.copy(VIEWS.door.pos); controls.target.copy(VIEWS.door.target);
  }
  ghost(GHOST.has(name));
  fly(v, 1200, undefined, isInside(name));
}
document.querySelectorAll<HTMLButtonElement>('#views button').forEach((b) => (b.onclick = () => goto(b.dataset.view ?? '')));

const labelOf = new WeakMap<Element, SiteBuilding>();
const labelObjs: CSS2DObject[] = [];
for (const { building, anchor } of map.labels) {
  const el = document.createElement('button');
  el.className = building.osmId === site.mainBuilding ? 'label main' : 'label';
  el.textContent = building.name ?? '';
  el.onclick = () => select(building);
  labelOf.set(el, building);
  const obj = new CSS2DObject(el);
  obj.position.copy(anchor);
  map.group.add(obj);
  labelObjs.push(obj);
}
goto('front', true); // 이름표를 만든 뒤에 불러야 둘레 이름표 숨김이 적용된다

let selected: THREE.Mesh | null = null;
const highlight = new THREE.Color(0xf2c14e);

function select(b: SiteBuilding | null) {
  if (selected) (selected.material as THREE.MeshStandardMaterial).emissive?.setHex(0);
  selected = null;
  if (!b) { card.hidden = true; return; }
  const mesh = map.pickables.find((m) => m.userData.building === b) ?? null;
  if (mesh && !mesh.userData.noHighlight) {
    mesh.material = (mesh.material as THREE.MeshStandardMaterial).clone();
    (mesh.material as THREE.MeshStandardMaterial).emissive.copy(highlight).multiplyScalar(0.25);
    selected = mesh;
  }
  const isMain = b.osmId === site.mainBuilding;
  card.hidden = false;
  card.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = b.name ?? '이름 없는 건물';
  const p = document.createElement('p');
  p.textContent = [b.nameEn, `높이 ${b.height} m (${b.heightSource})`, b.spireHeight ? `종탑 ${b.spireHeight} m` : null]
    .filter(Boolean)
    .join(' · ');
  card.append(h, p);
  if (isMain || b.kind === 'bell_tower') {
    const enter = document.createElement('a');
    enter.href = ENTER_URL;
    enter.className = 'primary';
    enter.textContent = '성당 안으로 들어가기';
    if (STANDALONE) { enter.target = '_blank'; enter.rel = 'noopener'; }
    const photo = document.createElement('a');
    photo.href = PHOTO_TOUR_URL;
    photo.target = '_blank';
    photo.rel = 'noopener';
    photo.textContent = '실제 모습 보기 (외부 360° 투어)';
    card.append(enter, photo);
  }
}

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let down = { x: 0, y: 0 };
// OrbitControls 가 pointerdown 에서 포인터를 컨테이너로 캡처하므로 pointerup·click 의 target 은 라벨이 아니다.
// 그래서 «어디서 눌렀는가» 를 pointerdown 에서 기억한다.
let downLabel: SiteBuilding | null = null;
labelRenderer.domElement.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY };
  const el = (e.target as Element | null)?.closest?.('.label');
  downLabel = el ? labelOf.get(el) ?? null : null;
}, { capture: true });
labelRenderer.domElement.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return; // 드래그는 선택 아님
  if (downLabel) { select(downLabel); return; }
  const r = labelRenderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(map.pickables, false)[0];
  select((hit?.object.userData.building as SiteBuilding | undefined) ?? null);
});

function resize() {
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});
