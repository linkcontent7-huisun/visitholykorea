// 명동 바깥을 단순하고 깔끔하게 — 사장님(2026-11-22): 「겉은 심재학 목업이 좋고 안은 지금이 예쁘다. 단순하고 깔끔하게」
// 성당 건물 겉모습과 실내는 건드리지 않는다. 둘레(풀·낙엽·덤불·나무)만 덜어 낸다.
// 덜어 낸 것은 지우지 않고 그리지만 않는다(visible=false). 주소에 ?full 을 붙이면 전부 되살아난다(전·후 비교).
// 건마다 아래 표의 한 줄 — 「이건 되살려」 하시면 그 줄을 false 로.
import * as THREE from 'three';

const tmpScale = new THREE.Vector3(), tmpPos = new THREE.Vector3();

export const SIMPLE = {
  /** 바닥 낙엽 — 수관 아래·잔디 위 낙엽 카드 */
  litter: true,
  /** 잔디 위 풀 포기 — 두 장 엇갈린 풀 카드 */
  grassTufts: true,
  /** 덤불의 가지 — 잎 뭉치 속에 묻혀 거의 보이지 않는 가지(잎은 남긴다) */
  shrubBranches: true,
  /** 덤불 전체(빨간·초록 덤불의 잎까지) — 계단 가운데 화단·길가의 덤불이 사라져 목업처럼 트인다 */
  shrubs: true,
  /** 작은 물체(가로등·조각·난간 장식 등, 지름 2 m 아래)는 그림자를 드리우지 않는다 — 높은 화질의 그림자 패스에서 300여 번을 덜 그린다.
   *  큰 물체(성당·나무·건물)의 그림자는 그대로. 성당 실내는 건드리지 않는다 */
  smallShadows: true,
};

/** 덜어 낸 것을 아예 짓지 않아도 되는가(?full 이면 전부 짓는다) — 짓고 숨기면 시간만 들고, 덤불은 보이지 않는 충돌까지 남았다 */
export function skipBuild(key: keyof typeof SIMPLE): boolean {
  try { if (new URLSearchParams(location.search).has('full')) return false; } catch { /* 주소 없음 */ }
  return SIMPLE[key];
}

/** 공간을 지은 뒤 한 번 부른다. 숨긴 것의 이름 목록을 돌려준다 */
export function simplifyOutdoor(root: THREE.Object3D): string[] {
  try { if (new URLSearchParams(location.search).has('full')) return []; } catch { /* 주소 없음 */ }
  const hidden: string[] = [];
  // 성당 건물이 차지하는 상자(+2 m) — 그 안의 물체(실내 촛대·성물 등)는 그림자를 그대로 둔다(실내 모습은 바꾸지 않는다)
  root.updateMatrixWorld(true);
  const church = new THREE.Box3();
  root.traverse((o) => { if (/^cathedral/.test(o.name) && (o as THREE.Mesh).isMesh) church.expandByObject(o); });
  if (!church.isEmpty()) church.expandByScalar(2);
  const inChurch = (o: THREE.Object3D) => !church.isEmpty() && church.containsPoint(o.getWorldPosition(tmpPos));
  root.traverse((o) => {
    const n = o.name || '';
    const hide = (SIMPLE.litter && n === 'litter')
      || (SIMPLE.grassTufts && n === 'grass-tufts')
      || (SIMPLE.shrubBranches && n.startsWith('bark-shrub'))
      || (SIMPLE.shrubs && n.startsWith('leaves-shrub'));
    if (hide) { o.visible = false; hidden.push(n); return; }
    const m = o as THREE.Mesh;
    if (SIMPLE.smallShadows && m.isMesh && m.castShadow && !n && !inChurch(o)) {
      const g = m.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
      const s = o.getWorldScale(tmpScale), r = (g.boundingSphere?.radius ?? 0) * Math.max(s.x, s.y, s.z);
      if (r < 1) m.castShadow = false;
    }
  });
  return hidden;
}
