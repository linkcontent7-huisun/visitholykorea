// node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { Nav } from '../src/nav.ts';

/** 바닥 + 가운데 벽(x=0, z -4..4)이 있는 방 — 벽 끝(z>4)으로 돌아가야 반대편에 닿는다 */
function room() {
  const floor = new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2);
  const wall = new THREE.BoxGeometry(0.4, 3, 8).translate(0, 1.5, 0);
  const geo = mergeGeometries([floor.toNonIndexed(), wall.toNonIndexed()])!;
  return new MeshBVH(geo);
}

test('벽이 가로막으면 곧게 가지 않고 벽 끝을 돌아가는 길을 낸다', () => {
  const nav = new Nav(room());
  const path = nav.find(new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0));
  assert.ok(path && path.length >= 2, '돌아가는 길(중간 지점이 있어야 한다)');
  // 모든 중간 지점이 벽 안(|x|<0.5 이고 |z|<4.5)에 있으면 안 된다
  for (const p of path!) assert.ok(!(Math.abs(p.x) < 0.5 && Math.abs(p.z) < 4.5), `벽 속 지점: ${p.x},${p.z}`);
  // 길이 벽 끝(|z| > 4)을 지난다
  assert.ok(path!.some((p) => Math.abs(p.z) > 3.9), '벽 끝을 돌아야 한다');
  const last = path![path!.length - 1]!;
  assert.ok(Math.hypot(last.x - 4, last.z) < 0.6, '목적지에 닿아야 한다');
});

test('막힘이 없으면 곧은 한 구간이다', () => {
  const nav = new Nav(room());
  const path = nav.find(new THREE.Vector3(-4, 0, 8), new THREE.Vector3(4, 0, 8));
  assert.equal(path?.length, 1);
});

test('목적지가 벽 속이면 가장 가까이 갈 수 있는 곳까지 간다', () => {
  const nav = new Nav(room());
  const path = nav.find(new THREE.Vector3(-4, 0, 0), new THREE.Vector3(0, 0, 0));
  assert.ok(path && path.length >= 1);
  const last = path![path!.length - 1]!;
  assert.ok(Math.abs(last.x) > 0.3, '벽 속으로 들어가지 않는다');
});
