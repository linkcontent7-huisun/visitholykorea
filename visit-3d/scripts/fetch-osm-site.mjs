#!/usr/bin/env node
// 명동대성당 구내 건물 윤곽·높이를 OpenStreetMap(Overpass)에서 받아
// 성당 본당 중심 기준 로컬 좌표(1 unit = 1 m, x=동, z=남)로 바꿔 site.json 을 쓴다.
//
// 데이터 권리: © OpenStreetMap contributors, ODbL 1.0 — 화면에 출처를 표시해야 한다.
// 실행: node scripts/fetch-osm-site.mjs [출력경로]
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const OUT = resolve(process.argv[2] ?? 'public/site/myeongdong.json');
const CENTER = { lat: 37.5633, lon: 126.9872 };
const RADIUS = 140; // m
const MAIN_WAY = 210335697; // 명동대성당 본당 (building=cathedral, height=23)
const PRECINCT_WAY = 355630939; // 명동대성당 구역 (amenity=place_of_worship)

// OSM 에 종탑(tower:type=bell_tower)이 없을 때만 쓰는 보충값. 근거를 함께 남긴다.
// 2026-11-08 기준 OSM way 1139745172 가 종탑(높이 47 m)이라 이 값은 쓰이지 않는다.
const SPIRE_FALLBACK = { spireHeight: 45, spireSource: 'en.wikipedia.org/wiki/Myeongdong_Cathedral (steeple 45 m)' };

// 풍경용 반경 — 도로·녹지·나무·바깥 건물. 기존 buildings(RADIUS) 는 그대로 두고 새 필드로만 더한다.
const FAR = 350;
const A = `around:${FAR},${CENTER.lat},${CENTER.lon}`;
const query = `[out:json][timeout:90];
(
  way(${A})["building"];
  way(${PRECINCT_WAY});
  way(${A})["highway"];
  way(${A})["leisure"~"^(garden|park|pitch)$"];
  way(${A})["landuse"~"^(grass|forest|meadow)$"];
  way(${A})["natural"~"^(wood|scrub|tree_row)$"];
  way(${A})["amenity"="parking"];
  node(${A})["natural"="tree"];
);
out tags geom;`;

// 공개 Overpass 는 자주 502·429 를 낸다 — 미러를 차례로 시도한다.
const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
let osm = null;
for (const url of MIRRORS) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'visitholykorea-site-builder/0.1' },
      body: 'data=' + encodeURIComponent(query),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    osm = await res.json();
    break;
  } catch (err) {
    console.warn(`Overpass 실패 ${url}: ${err.message}`);
  }
}
if (!osm) throw new Error('모든 Overpass 미러 실패 — 잠시 뒤 다시 실행');

const main = osm.elements.find((e) => e.id === MAIN_WAY);
if (!main) throw new Error('본당 way 를 찾지 못했다 — OSM 편집으로 id 가 바뀌었는지 확인');

// 원점 = 본당 윤곽의 평균점
const pts = main.geometry.slice(0, -1);
const o = { lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lon: pts.reduce((s, p) => s + p.lon, 0) / pts.length };
const R = 6378137;
const kx = (Math.PI / 180) * R * Math.cos((o.lat * Math.PI) / 180);
const kz = (Math.PI / 180) * R;
const toLocal = (p) => [+((p.lon - o.lon) * kx).toFixed(2), +(-(p.lat - o.lat) * kz).toFixed(2)];

const heightOf = (t) => {
  if (t.height && !Number.isNaN(parseFloat(t.height))) return { h: parseFloat(t.height), src: 'osm:height' };
  if (t['building:levels']) return { h: +(parseFloat(t['building:levels']) * 3.3).toFixed(1), src: 'osm:building:levels×3.3' };
  return { h: 8, src: 'default' };
};

// Overpass «around» 와 같은 판정: 꼭짓점 하나라도 반경 안이면 포함
const distM = (p) => Math.hypot((p.lon - CENTER.lon) * kx, (p.lat - CENTER.lat) * kz);
const within = (e, r) => e.geometry.some((p) => distM(p) <= r);

const buildings = [];
const farBuildings = [];
let precinct = null;
for (const e of osm.elements) {
  if (e.type !== 'way' || !e.geometry) continue;
  if (e.id !== PRECINCT_WAY && !e.tags?.building) continue;
  if (e.tags?.building && !within(e, RADIUS)) {
    const t = e.tags;
    if (t.layer && parseFloat(t.layer) < 0) continue;
    const ring = e.geometry.map(toLocal);
    if (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]) ring.pop();
    farBuildings.push({ osmId: e.id, height: heightOf(t).h, ring });
    continue;
  }
  const t = e.tags ?? {};
  const ring = e.geometry.map(toLocal);
  if (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]) ring.pop();
  if (e.id === PRECINCT_WAY) {
    precinct = { osmId: e.id, name: t.name ?? null, ring };
    continue;
  }
  if (!t.building) continue;
  const { h, src } = heightOf(t);
  const isBellTower = t['tower:type'] === 'bell_tower';
  buildings.push({
    osmId: e.id,
    name: t.name ?? (isBellTower ? '종탑' : null),
    nameEn: t['name:en'] ?? null,
    kind: e.id === MAIN_WAY ? 'cathedral' : isBellTower ? 'bell_tower' : t.building,
    height: h,
    heightSource: src,
    ring,
  });
}
// 종탑이 OSM 에 없을 때만 본당에 보충 종탑 높이를 붙인다
if (!buildings.some((b) => b.kind === 'bell_tower')) {
  Object.assign(buildings.find((b) => b.osmId === MAIN_WAY), SPIRE_FALLBACK);
}

// ── 풍경: 도로·녹지·나무 ─────────────────────────────────────────────
// 차로 폭(m) — width·lanes 태그가 있으면 그것을 쓴다
const ROAD_W = { primary: 18, primary_link: 7, secondary: 12, secondary_link: 7, tertiary: 9, residential: 6, service: 4, pedestrian: 6, footway: 2.5, steps: 2.5, path: 2, busway: 4, living_street: 5 };
const roads = [];
const areas = [];
const trees = [];
for (const e of osm.elements) {
  const t = e.tags ?? {};
  if (e.type === 'node' && t.natural === 'tree') { trees.push({ p: toLocal(e), d: t.diameter_crown ? parseFloat(t.diameter_crown) : null }); continue; }
  if (e.type !== 'way' || !e.geometry) continue;
  const line = e.geometry.map(toLocal);
  if (t.highway) {
    if (t.tunnel === 'yes' || (t.layer && parseFloat(t.layer) < 0) || t.indoor === 'yes' || t.highway === 'corridor' || !(t.highway in ROAD_W)) continue;
    let w = ROAD_W[t.highway];
    if (t.width && !Number.isNaN(parseFloat(t.width))) w = parseFloat(t.width);
    else if (t.lanes && ['primary', 'secondary', 'tertiary'].includes(t.highway)) w = parseFloat(t.lanes) * 3.3 * (t.oneway === 'yes' ? 1 : 2);
    roads.push({ osmId: e.id, kind: t.highway, name: t.name ?? null, width: +w.toFixed(1), area: t.area === 'yes', crossing: t.footway === 'crossing', oneway: t.oneway === 'yes', line });
    continue;
  }
  if (t.natural === 'tree_row') {
    // 가로수 줄 → 6 m 간격 나무
    for (let i = 1; i < line.length; i++) {
      const [x0, z0] = line[i - 1], [x1, z1] = line[i], L = Math.hypot(x1 - x0, z1 - z0);
      for (let d = 0; d < L; d += 6) trees.push({ p: [+(x0 + ((x1 - x0) * d) / L).toFixed(2), +(z0 + ((z1 - z0) * d) / L).toFixed(2)], d: null });
    }
    continue;
  }
  const kind = t.leisure ?? t.landuse ?? t.natural ?? (t.amenity === 'parking' ? 'parking' : null);
  if (!kind) continue;
  if (line.length > 1 && line[0][0] === line.at(-1)[0] && line[0][1] === line.at(-1)[1]) line.pop();
  if (line.length >= 3) areas.push({ osmId: e.id, kind, name: t.name ?? null, ring: line });
}

const site = {
  id: 'myeongdong',
  title: '명동대성당 구내',
  origin: { lat: +o.lat.toFixed(7), lon: +o.lon.toFixed(7) },
  units: 'meter; x = east, z = south (three.js ground plane)',
  fetchedAt: new Date().toISOString(),
  attribution: '© OpenStreetMap contributors (ODbL 1.0)',
  license: { geometry: 'ODbL-1.0', url: 'https://www.openstreetmap.org/copyright' },
  mainBuilding: MAIN_WAY,
  precinct,
  buildings,
  // 풍경(반경 ${FAR} m) — 기존 필드에 영향 없이 더한 것
  farBuildings,
  roads,
  areas,
  trees,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(site, null, 1) + '\n');
console.log(`site.json: 건물 ${buildings.length}동 · 구역 ${precinct ? 'O' : 'X'} · 바깥 건물 ${farBuildings.length} · 도로 ${roads.length} · 녹지 ${areas.length} · 나무 ${trees.length} → ${OUT}`);
