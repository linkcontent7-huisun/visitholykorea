import * as THREE from 'three';
import * as T from './textures.ts';

export type Mats = ReturnType<typeof makeMaterials>;

/** 공간마다 새로 만든다(공간을 바꿀 때 함께 해제된다) */
export function makeMaterials() {
  const std = (map: THREE.Texture, rough = 0.85, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0, ...extra });
  const glowTex = T.glow();
  return {
    brick: std(T.brick(), 0.9),
    stone: std(T.stone(), 0.8),
    stoneDark: std(T.stone(9, [120, 114, 104]), 0.85),
    marble: std(T.marble(), 0.35),
    // 명동대성당 실내 참고(2026-11-09): 회색 벽돌 기둥·리브, 베이지 타일 바닥, 크림색 볼트, 붉은 카펫, 적갈색 신자석
    greyBrick: std(T.greyBrick(), 0.88, { bumpMap: T.greyBrickBump(), bumpScale: 2.2 }),
    tiles: std(T.floorTiles(), 0.3, { envMapIntensity: 1.4, roughnessMap: T.floorRough() }), // v3-4: 닦인 석재 — 타일마다 광택이 다르고 줄눈은 거칠다
    vault: std(T.plaster([196, 178, 148]), 0.95, { side: THREE.DoubleSide, emissive: 0x0c0906 }), // VR: 따뜻한 황갈 베이지
    wallWhite: std(T.plaster([214, 206, 190]), 0.95, { side: THREE.DoubleSide }), // VR: 회기 도는 크림색 회벽
    carpet: std(T.carpet(), 1), // v3-4: 짠 결이 있는 붉은 카펫
    // VR: 붉은 기가 도는 마호가니, 니스 칠로 반짝인다
    pew: new THREE.MeshPhysicalMaterial({ map: T.wood(), color: 0xffb08a, roughness: 0.38, clearcoat: 0.9, clearcoatRoughness: 0.12, emissive: 0x2a0c04 }),
    // 트리포리움 아치 안쪽의 어둠
    voidDark: new THREE.MeshBasicMaterial({ color: 0x2a1f16, side: THREE.DoubleSide }),
    // 볼트 천장은 샹들리에 위에 있어 빛을 덜 받는다 → 약하게 스스로 밝힌다
    plaster: std(T.plaster(), 0.95, { side: THREE.DoubleSide, emissive: 0x2a2e36 }),
    cream: std(T.plaster([214, 204, 186]), 0.95, { side: THREE.DoubleSide }),
    wood: std(T.wood(), 0.7),
    woodDark: std(T.wood(true), 0.6),
    slate: std(T.slate(), 0.8, { side: THREE.DoubleSide }),
    paving: std(T.paving(), 0.9),
    grass: std(T.grass(), 1),
    gold: new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.9, roughness: 0.3 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.7, roughness: 0.5 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x8c6a3a, metalness: 0.85, roughness: 0.35 }),
    wax: new THREE.MeshStandardMaterial({ color: 0xf4efe2, roughness: 0.6, emissive: 0x221a10 }),
    flame: new THREE.MeshBasicMaterial({ color: 0xffc35a }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x2f5a2a, roughness: 1 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 }),
    lampGlow: new THREE.MeshBasicMaterial({ color: 0xfff1c9 }),
    pipe: new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 1, roughness: 0.25 }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.9 }),
    red: new THREE.MeshStandardMaterial({ color: 0x7a1f24, roughness: 0.9 }),
    glowTex,
    glass: (tex: THREE.Texture) => new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false }),
    additive: (color: THREE.ColorRepresentation, opacity = 1) =>
      new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    picture: (tex: THREE.Texture) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
  };
}
