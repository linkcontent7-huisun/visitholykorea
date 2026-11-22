// 공간 조립 도구 — 메시를 모으고, 충돌용 BVH 를 만들고, 같은 재질끼리 합쳐 드로콜을 줄인다.
import * as THREE from 'three';
import { MeshBVH, acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
(THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;

export interface AddOpts {
  pos?: [number, number, number];
  rot?: [number, number, number];
  scale?: [number, number, number];
  /** 충돌에 넣는다 */
  collide?: boolean;
  /** 충돌에만 쓰고 그리지 않는다(계단 대신 경사로 등) */
  colliderOnly?: boolean;
  /** 합치지 않는다(움직이거나 상호작용하는 것) */
  dynamic?: boolean;
  /** 충돌에서 뺀다(문짝처럼 지나가야 하는 것) — 영구 규칙: 문 말고는 쓰지 않는다 */
  noCollide?: boolean;
  parent?: THREE.Object3D;
  shadow?: boolean;
}

export class Kit {
  readonly root = new THREE.Group();
  private colliderMeshes: THREE.Mesh[] = [];
  /** 자동 충돌에 넣는 높이 범위(세계 y). 언덕 아래 바깥 땅(-HILL)까지 포함하도록 공간이 정한다 */
  walkBottom = -40;
  walkTop = 2.6;

  add(geo: THREE.BufferGeometry, mat: THREE.Material, o: AddOpts = {}): THREE.Mesh {
    const m = new THREE.Mesh(geo, mat);
    if (o.pos) m.position.set(...o.pos);
    if (o.rot) m.rotation.set(...o.rot);
    if (o.scale) m.scale.set(...o.scale);
    (o.parent ?? this.root).add(m);
    if (o.collide || o.colliderOnly) this.colliderMeshes.push(m);
    m.userData.colliderOnly = !!o.colliderOnly;
    m.userData.dynamic = !!o.dynamic;
    if (o.noCollide) m.userData.noCollide = true;
    m.castShadow = m.receiveShadow = o.shadow ?? true;
    return m;
  }

  /** 충돌 BVH 를 만들고, 정적인 메시는 재질별로 합친다.
   *  v3-7 영구 규칙(사장님 2026-11-10): 캐릭터는 문 외에는 벽·물체를 통과할 수 없다 → collide 표시가 없어도
   *  걷는 높이(바닥 위 ~2.6 m)에 걸치는 메시는 dynamic(합치지 않는 것)이라도 모두 충돌에 넣는다. 빠지는 것:
   *  투명·가산 재질(빛줄기·후광·물·화살표), 아주 얇은 바닥 무늬(두께 5 cm 미만), userData.noCollide 가 붙은 것과 그 자식(문짝·종 줄·풍경). */
  finalize(): MeshBVH {
    this.root.updateMatrixWorld(true);
    const flagged = new Set(this.colliderMeshes);
    const bb = new THREE.Box3();
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || (m as any).isInstancedMesh || flagged.has(m) || m.userData.colliderOnly) return;
      if (m.userData.noCollide || hasFlagAncestor(m, this.root, 'noCollide')) return; // 문짝·종 줄·풍경(나무는 줄기 충돌이 따로 있다) 등
      const mat = m.material as THREE.Material & { transparent?: boolean; blending?: number; opacity?: number };
      if (mat.transparent || mat.blending === THREE.AdditiveBlending || (mat.opacity ?? 1) < 0.99) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      bb.copy(m.geometry.boundingBox!).applyMatrix4(m.matrixWorld);
      if (bb.max.y - bb.min.y < 0.05) return;                 // 바닥 무늬·카펫
      if (bb.min.y > this.walkTop || bb.max.y < this.walkBottom) return; // 머리 위(볼트·샹들리에) 또는 바닥 아래
      this.colliderMeshes.push(m);
    });
    const geos: THREE.BufferGeometry[] = [];
    for (const m of this.colliderMeshes) {
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
      geos.push(g.index ? g.toNonIndexed() : g);
    }
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    const bvh = new MeshBVH(merged ?? new THREE.BoxGeometry(0.01, 0.01, 0.01));

    // 그리는 쪽: 정적 메시를 재질별로 하나로
    const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const remove: THREE.Mesh[] = [];
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || (m as any).isInstancedMesh) return;
      if (m.userData.colliderOnly) { remove.push(m); return; }
      if (m.userData.dynamic || hasDynamicAncestor(m, this.root)) return;
      const mat = m.material as THREE.Material;
      const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      (byMat.get(mat) ?? byMat.set(mat, []).get(mat)!).push(g.index ? g.toNonIndexed() : g);
      remove.push(m);
    });
    for (const m of remove) { m.parent?.remove(m); m.geometry.dispose(); }
    for (const [mat, list] of byMat) {
      const g = mergeGeometries(list, false);
      list.forEach((x) => x.dispose());
      if (!g) continue;
      const mesh = new THREE.Mesh(g, mat);
      const transparent = (mat as any).transparent || (mat as any).blending === THREE.AdditiveBlending;
      mesh.castShadow = !transparent;
      mesh.receiveShadow = true;
      this.root.add(mesh);
    }
    return bvh;
  }
}

function hasDynamicAncestor(o: THREE.Object3D, stop: THREE.Object3D): boolean {
  for (let p = o.parent; p && p !== stop; p = p.parent) if (p.userData.dynamic) return true;
  return false;
}
function hasFlagAncestor(o: THREE.Object3D, root: THREE.Object3D, flag: 'dynamic' | 'noCollide'): boolean {
  for (let p = o.parent; p && p !== root; p = p.parent) if (p.userData[flag]) return true;
  return false;
}

export function disposeTree(root: THREE.Object3D) {
  const mats = new Set<THREE.Material>();
  root.traverse((o) => {
    if ((o as any).isCSS2DObject) (o as any).element?.remove();
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const list = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    list.forEach((x) => mats.add(x));
  });
  for (const mat of mats) {
    for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
    mat.dispose();
  }
}

/**
 * 2026-11-22 가볍게: 한 묶음(group) 안의 움직이지 않는 메시를 재질·그림자 설정이 같은 것끼리 하나로 합친다.
 * 충돌 BVH 를 만든 **뒤에** 부른다(충돌은 이미 따로 복사돼 있어 그대로다). 모습은 같고 그리는 횟수만 줄어든다.
 * 묶음 안에 코드가 따로 움직이거나 숨기는 물체가 있으면 쓰지 않는다.
 */
export function mergeStaticGroup(group: THREE.Object3D): number {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map<string, { mat: THREE.Material; cast: boolean; recv: boolean; geos: THREE.BufferGeometry[] }>();
  const remove: THREE.Mesh[] = [];
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as any).isInstancedMesh || !m.visible || Array.isArray(m.material)) return;
    const mat = m.material as THREE.Material;
    const key = `${mat.uuid}:${m.castShadow ? 1 : 0}:${m.receiveShadow ? 1 : 0}`;
    const g = m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const b = buckets.get(key) ?? buckets.set(key, { mat, cast: m.castShadow, recv: m.receiveShadow, geos: [] }).get(key)!;
    b.geos.push(g.index ? g.toNonIndexed() : g);
    remove.push(m);
  });
  for (const m of remove) { m.parent?.remove(m); m.geometry.dispose(); }
  let n = 0;
  for (const b of buckets.values()) {
    const g = mergeGeometries(b.geos, false);
    b.geos.forEach((x) => x.dispose());
    if (!g) continue;
    const mesh = new THREE.Mesh(g, b.mat);
    mesh.castShadow = b.cast; mesh.receiveShadow = b.recv; mesh.userData.dynamic = true;
    group.add(mesh); n++;
  }
  return remove.length - n; // 줄어든 메시 수
}
