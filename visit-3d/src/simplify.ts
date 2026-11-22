// 명동 바깥을 단순하고 깔끔하게 — 사장님(2026-11-22): 「겉은 심재학 목업이 좋고 안은 지금이 예쁘다. 단순하고 깔끔하게」
// 성당 건물 겉모습과 실내는 건드리지 않는다. 둘레(풀·낙엽·덤불·나무)만 덜어 낸다.
// 덜어 낸 것은 지우지 않고 그리지만 않는다(visible=false). 주소에 ?full 을 붙이면 전부 되살아난다(전·후 비교).
// 건마다 아래 표의 한 줄 — 「이건 되살려」 하시면 그 줄을 false 로.
import type * as THREE from 'three';

export const SIMPLE = {
  /** 바닥 낙엽 — 수관 아래·잔디 위 낙엽 카드 */
  litter: true,
  /** 잔디 위 풀 포기 — 두 장 엇갈린 풀 카드 */
  grassTufts: true,
  /** 덤불의 가지 — 잎 뭉치 속에 묻혀 거의 보이지 않는 가지(잎은 남긴다) */
  shrubBranches: false,
  /** 덤불 전체(빨간·초록 덤불의 잎까지) — 계단 가운데 화단·길가의 덤불이 사라져 목업처럼 트인다 */
  shrubs: false,
};

/** 공간을 지은 뒤 한 번 부른다. 숨긴 것의 이름 목록을 돌려준다 */
export function simplifyOutdoor(root: THREE.Object3D): string[] {
  try { if (new URLSearchParams(location.search).has('full')) return []; } catch { /* 주소 없음 */ }
  const hidden: string[] = [];
  root.traverse((o) => {
    const n = o.name || '';
    const hide = (SIMPLE.litter && n === 'litter')
      || (SIMPLE.grassTufts && n === 'grass-tufts')
      || (SIMPLE.shrubBranches && n.startsWith('bark-shrub'))
      || (SIMPLE.shrubs && n.startsWith('leaves-shrub'));
    if (hide) { o.visible = false; hidden.push(n); }
  });
  return hidden;
}
