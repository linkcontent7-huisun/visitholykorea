// 순례자 캐릭터 v2 (2026-11-09) — 외부 모델 없이 도형으로 만든, 조용하고 거룩한 느낌의 인물(천사 · 사람).
//
// v1(v1-게임느낌)은 큰 머리 · 웃는 얼굴 · 원통 몸의 장난감 같은 인물이었다. v2 는
//   · 실제에 가까운 비례(머리 하나가 키의 1/7.5), 가는 목과 어깨, 손
//   · 옷은 회전체(Lathe)에 세로 주름을 새겨 천이 늘어진 모양 — 걸으면 자락이 흔들린다
//   · 얼굴은 이목구비를 그리지 않는다(성상처럼 고요하게). 머리카락 · 수건 · 두건으로 사람을 나눈다
//   · 천사는 깃털을 겹겹이 단 날개, 은은히 빛나는 옷, 가는 빛의 후광
//   · 색은 채도를 낮춘 천 색(상아 · 회갈 · 감청 · 포도주색)
// 앞쪽은 -Z(플레이어 yaw 0 이 바라보는 쪽). 키 약 1.75 m × scale. 바닥 y=0 에 발이 닿는다.
// 목록의 순서 · id 는 v1 과 같게 둔다(별명 끝 번호로 다른 사람에게 캐릭터를 알리기 때문).
import * as THREE from 'three';
import { buildHanji } from './hanji.ts';

type Hair = 'short' | 'long' | 'bun' | 'bald' | 'pigtails' | 'curly' | 'veil' | 'cap' | 'hood';
type Prop = 'lily' | 'sword' | 'staff' | 'trumpet' | 'cane' | 'balloon' | 'book' | 'rosary' | 'flag' | 'candle';

export interface AvatarDef {
  id: string;
  name: string;
  emoji: string;
  angel?: boolean;
  /** 발목까지 오는 긴 옷(천사 · 수녀 · 사제 · 순례 망토) */
  robe?: boolean;
  skin: number;
  hair: number;
  hairStyle: Hair;
  /** 겉옷(또는 긴 옷) */
  top: number;
  /** 바지 · 치마 */
  bottom: number;
  /** 띠 · 망토 · 가장자리 */
  accent?: number;
  /** 어깨에 두르는 망토(천사 · 순례자) */
  mantle?: number;
  wing?: number;
  prop?: Prop;
  backpack?: boolean;
  beard?: number;
  scale: number;
}

export const AVATARS: AvatarDef[] = [
  { id: 'gabriel', name: '가브리엘 천사', emoji: '👼', angel: true, robe: true, skin: 0xe9d2bd, hair: 0xc9a25a, hairStyle: 'long', top: 0xf1ece0, bottom: 0xf1ece0, accent: 0xc9a24a, mantle: 0xdfe6ee, wing: 0xfbf8f1, scale: 1.04 },
  { id: 'michael', name: '미카엘 천사', emoji: '⚔️', angel: true, robe: true, skin: 0xe3c7ab, hair: 0x5a3c22, hairStyle: 'short', top: 0xefe8da, bottom: 0xefe8da, accent: 0xb08a3a, mantle: 0x8e2a26, wing: 0xf6f0e2, prop: 'sword', scale: 1.06 },
  { id: 'raphael', name: '라파엘 천사', emoji: '🌿', angel: true, robe: true, skin: 0xe3c7ab, hair: 0x7a5232, hairStyle: 'curly', top: 0xefeadc, bottom: 0xefeadc, accent: 0xa89a62, mantle: 0x6f8a68, wing: 0xf5f6ee, prop: 'staff', scale: 1.02 },
  { id: 'cherub', name: '아기 천사', emoji: '🎺', angel: true, robe: true, skin: 0xf0d8c4, hair: 0xd8b060, hairStyle: 'curly', top: 0xf6efe4, bottom: 0xf6efe4, accent: 0xd9b45a, wing: 0xfffaf2, prop: 'trumpet', scale: 0.62 },
  { id: 'guardian', name: '수호천사', emoji: '🕊️', angel: true, robe: true, skin: 0xe0c3a4, hair: 0x2e2218, hairStyle: 'long', top: 0xefece4, bottom: 0xefece4, accent: 0xb9a46a, mantle: 0x6f86a8, wing: 0xf4f2fa, prop: 'candle', scale: 1.02 },
  { id: 'grandpa', name: '할아버지', emoji: '👴', skin: 0xd9b596, hair: 0xd6d3cc, hairStyle: 'bald', top: 0x4a4540, bottom: 0x3a3836, accent: 0x6b5a48, beard: 0xe6e3dc, prop: 'cane', scale: 0.96 },
  { id: 'grandma', name: '할머니', emoji: '👵', skin: 0xe0bd9e, hair: 0xcfccc6, hairStyle: 'bun', top: 0x6a4458, bottom: 0x4a4048, accent: 0xb8a48a, prop: 'rosary', scale: 0.91 },
  { id: 'dad', name: '아빠', emoji: '👨', skin: 0xd9b48e, hair: 0x1e1a18, hairStyle: 'short', top: 0x2e3a52, bottom: 0x4a4e58, accent: 0x7a6a58, scale: 1.0 },
  { id: 'mom', name: '엄마', emoji: '👩', skin: 0xe8c8aa, hair: 0x32221a, hairStyle: 'long', top: 0xb08a62, bottom: 0x3a3634, accent: 0xe8e0d0, scale: 0.97 },
  { id: 'teen', name: '청소년', emoji: '🧑', skin: 0xe2c2a0, hair: 0x15120f, hairStyle: 'short', top: 0x55603e, bottom: 0x3a4658, accent: 0x8a7a5a, backpack: true, scale: 0.95 },
  { id: 'boy', name: '남자아이', emoji: '👦', skin: 0xecccad, hair: 0x2a1d14, hairStyle: 'short', top: 0xb8923a, bottom: 0x3a4658, accent: 0x8a3a2a, prop: 'balloon', scale: 0.7 },
  { id: 'girl', name: '여자아이', emoji: '👧', skin: 0xeed0b4, hair: 0x2a1a10, hairStyle: 'pigtails', top: 0xb86a72, bottom: 0x5a4a62, accent: 0xf0e6dc, prop: 'flag', scale: 0.68 },
  { id: 'sister', name: '수녀님', emoji: '🙏', robe: true, skin: 0xe2c2a0, hair: 0x1c1c22, hairStyle: 'veil', top: 0x26262c, bottom: 0x26262c, accent: 0xf2efe8, prop: 'rosary', scale: 0.95 },
  { id: 'priest', name: '신부님', emoji: '✝️', robe: true, skin: 0xd9b48e, hair: 0x2a2420, hairStyle: 'short', top: 0x18181c, bottom: 0x18181c, accent: 0xf2efe8, prop: 'book', scale: 1.0 },
  { id: 'pilgrim', name: '순례자', emoji: '🎒', robe: true, skin: 0xe8ccb2, hair: 0xb89050, hairStyle: 'hood', top: 0x6e5a44, bottom: 0x4a3c30, accent: 0xd8c8a8, mantle: 0x5a4a3a, backpack: true, prop: 'staff', scale: 0.98 },
];

const byId = new Map(AVATARS.map((a, i) => [a.id, i]));
const hash = (s: string) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
export const avatarOf = (id: string | null | undefined): AvatarDef => AVATARS[byId.get(id ?? '') ?? 0];
export const randomAvatarId = () => AVATARS[(Math.random() * AVATARS.length) | 0].id;

/**
 * 별명에 캐릭터 번호를 붙여 보낸다(방 서버는 별명만 받는다 — 서버를 바꾸지 않고 다른 사람에게 내 캐릭터를 보이기 위해).
 * 서버 규칙: 글자·숫자·공백·_- 만, 12자. 그래서 「이름_07」 꼴로, 이름은 9자까지.
 */
export function encodeNick(name: string, id: string): string {
  const n = byId.get(id) ?? 0;
  return `${name.trim().slice(0, 9)}_${String(n).padStart(2, '0')}`;
}
export function decodeNick(nick: string): { name: string; def: AvatarDef } {
  const m = /^(.*)_(\d{2})$/.exec(nick);
  if (m && Number(m[2]) < AVATARS.length) return { name: m[1] || '순례자', def: AVATARS[Number(m[2])] };
  return { name: nick, def: AVATARS[hash(nick) % AVATARS.length] };
}

// ── 재질 ──
const cache = new Map<string, THREE.Material>();
/** 천: 거친 표면 + 결 따라 은은한 광택(sheen) */
function cloth(c: number, glow = 0): THREE.MeshPhysicalMaterial {
  const k = `cloth:${c}:${glow}`;
  let m = cache.get(k) as THREE.MeshPhysicalMaterial | undefined;
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.85, sheen: 0.35, sheenRoughness: 0.7, sheenColor: new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.3),
      emissive: glow ? new THREE.Color(c).multiplyScalar(glow) : new THREE.Color(0), side: THREE.DoubleSide,
    });
    cache.set(k, m);
  }
  return m;
}
function skinMat(c: number): THREE.MeshPhysicalMaterial {
  const k = `skin:${c}`;
  let m = cache.get(k) as THREE.MeshPhysicalMaterial | undefined;
  if (!m) { m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xffd8c0), sheenRoughness: 0.5 }); cache.set(k, m); }
  return m;
}
function plain(c: number, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  const k = `plain:${c}:${JSON.stringify(extra)}`;
  let m = cache.get(k) as THREE.MeshStandardMaterial | undefined;
  if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...extra }); cache.set(k, m); }
  return m;
}
const gold = () => plain(0xc9a24a, { metalness: 0.85, roughness: 0.32 });

const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
};

/**
 * 늘어진 옷: 높이별 반지름 [y, r] 를 돌려 만들고, 아래로 갈수록 깊어지는 세로 주름을 새긴다.
 * 앞쪽(-Z)은 조금 납작하게(사람 몸통은 앞뒤가 좌우보다 얇다).
 */
function drape(profile: [number, number][], folds = 11, depth = 0.05, seed = 1): THREE.BufferGeometry {
  const pts = profile.map(([y, r]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 40);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const y0 = profile[0][0], y1 = profile[profile.length - 1][0];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const t = 1 - (y - y1) / (y0 - y1 || 1); // 위 0 → 아래 1 (profile 은 아래→위 또는 위→아래 어느 쪽이든)
    const down = Math.min(1, Math.max(0, profile[0][0] < y1 ? 1 - (y - y0) / (y1 - y0) : t));
    const f = 1 + depth * down * (Math.sin(a * folds + seed) * 0.7 + Math.sin(a * folds * 2.3 + seed * 3) * 0.3);
    pos.setXYZ(i, x * f, y, z * f * 0.86);
  }
  g.computeVertexNormals();
  return g;
}

/** 깃털 한 장(끝이 둥근 긴 잎 모양) */
function featherShape(len: number, w: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(w * 0.9, len * 0.25, w * 0.55, len * 0.85);
  s.quadraticCurveTo(w * 0.2, len * 1.02, 0, len);
  s.quadraticCurveTo(-w * 0.25, len * 0.9, -w * 0.4, len * 0.6);
  s.quadraticCurveTo(-w * 0.45, len * 0.2, 0, 0);
  return s;
}

/**
 * 날개: 어깨에서 위로 솟았다가 뒤로 접혀 내려오는 활 모양 뼈대를 따라 깃털을 세 겹(첫째깃 · 둘째깃 · 덮깃) 단다.
 * 한쪽 날개(오른쪽 +X 기준) — 왼쪽은 scale.x = -1.
 */
function buildWing(color: number, glow: number): THREE.Group {
  const g = new THREE.Group();
  const m = cloth(color, glow);
  // 뼈대: 어깨(0,0) → 관절(0.32, 0.38) → 끝(0.42, -0.55)  (y 위, x 바깥, 날개는 등 뒤 +Z 로 조금)
  const bone = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.22, 0.32, 0.06), new THREE.Vector3(0.38, 0.42, 0.12),
    new THREE.Vector3(0.5, 0.2, 0.16), new THREE.Vector3(0.52, -0.25, 0.18), new THREE.Vector3(0.46, -0.72, 0.2),
  ]);
  const layers: { n: number; len: [number, number]; w: number; z: number; from: number; to: number; tilt: number }[] = [
    { n: 20, len: [0.6, 0.3], w: 0.1, z: 0.0, from: 0.25, to: 1.0, tilt: 0.0 },   // 첫째 · 둘째깃(길다)
    { n: 18, len: [0.36, 0.2], w: 0.1, z: -0.012, from: 0.1, to: 0.85, tilt: 0.12 }, // 덮깃
    { n: 14, len: [0.2, 0.12], w: 0.09, z: -0.024, from: 0.0, to: 0.65, tilt: 0.22 },  // 작은 덮깃
  ];
  for (const L of layers) {
    for (let i = 0; i < L.n; i++) {
      const u = L.from + ((L.to - L.from) * i) / (L.n - 1);
      const p = bone.getPoint(u);
      const len = L.len[0] + (L.len[1] - L.len[0]) * (1 - u) * (u > 0.6 ? 1 : 0.5);
      const geo = new THREE.ShapeGeometry(featherShape(len, L.w), 6);
      const f = new THREE.Mesh(geo, m);
      f.castShadow = true;
      // 깃털은 아래(뒤)로 늘어진다 — 날개 끝일수록 바깥으로 벌어진다
      f.position.set(p.x, p.y, p.z + L.z);
      f.rotation.z = Math.PI + (u - 0.5) * 0.9 - L.tilt + (u > 0.75 ? (u - 0.75) * 1.6 : 0);
      f.rotation.y = 0.15 + u * 0.25;
      g.add(f);
    }
  }
  return g;
}

export interface AvatarRig {
  root: THREE.Group;
  body: THREE.Group;
  legL?: THREE.Object3D; legR?: THREE.Object3D;
  armL: THREE.Object3D; armR: THREE.Object3D;
  wingL?: THREE.Object3D; wingR?: THREE.Object3D;
  halo?: THREE.Object3D;
  balloon?: THREE.Object3D;
  skirt?: THREE.Object3D;
  kneeL?: THREE.Object3D; kneeR?: THREE.Object3D;
  footL?: THREE.Object3D; footR?: THREE.Object3D;
  elbowL: THREE.Object3D; elbowR: THREE.Object3D;
  /** v3-7: 손끝 자리 — 종 줄이 이 점을 지나가게 한다 */
  handL: THREE.Object3D; handR: THREE.Object3D;
  head: THREE.Object3D;
  def: AvatarDef;
  phase: number;
  idle: number;
  /** 잠깐 하는 동작 — 종 줄 당기기(pull, 1.5초) · 십자성호(cross, 3.2초). start 는 rig.idle 기준 시각, k 는 세기(0~1) */
  gesture?: { kind: 'pull' | 'cross'; start: number; k: number };
  /** v3-7: 종 줄을 잡고 있는 중(두 손을 머리 위 줄에 올린 채 선다). pull 동작은 이 자세에서 시작해 이 자세로 돌아온다 */
  holdRope?: boolean;
  /** v3-8: 손잡이를 끌어내리는 정도(0 위 … 1 맨 아래). holdRope 일 때 팔이 그만큼 내려온다 */
  pullAmt?: number;
}

/** 동작을 시작한다(같은 동작이 진행 중이면 처음부터 다시). k: 세기 — 종 줄은 1이면 힘껏(몸이 떠오른다), 0.45면 헛당김 */
export function startGesture(rig: AvatarRig, kind: 'pull' | 'cross', k = 1, skip = 0) { rig.gesture = { kind, start: rig.idle - skip * GESTURE_DUR[kind], k }; } // skip: 동작의 앞 몇 할을 건너뛰고 시작(손잡이를 이미 끌어내린 채 시작할 때)
const GESTURE_DUR = { pull: 1.5, cross: 3.2 } as const;
/** 줄을 잡은 자세: 두 팔을 앞 위로 뻗어(머리 높이 위, 몸 앞 0.4 m) 줄을 쥐고 위를 본다.
 *  어깨 rotation.x 는 +가 앞(다리와 같다) — 이 모델은 -z 를 바라본다 */
const HOLD_ARM = 2.3, PULL_ARM = 1.05; // 줄을 잡은 팔(위) · 끝까지 당긴 팔(가슴 앞)
function holdPose(rig: AvatarRig) {
  rig.armL.rotation.x = rig.armR.rotation.x = HOLD_ARM;
  rig.armL.rotation.z = 0.28; rig.armR.rotation.z = -0.28; // 두 손을 가운데 줄로 모은다
  rig.elbowL.rotation.x = rig.elbowR.rotation.x = 0.2;
  rig.head.rotation.x = -0.45; rig.head.rotation.y = 0;
}
/** 손잡이를 amt(0~1)만큼 끌어내린 자세 — 팔이 내려오고 몸이 살짝 내려앉는다 */
function pullPose(rig: AvatarRig, amt: number) {
  const a = THREE.MathUtils.clamp(amt, 0, 1);
  rig.armL.rotation.x = rig.armR.rotation.x = HOLD_ARM - (HOLD_ARM - PULL_ARM) * a;
  rig.elbowL.rotation.x = rig.elbowR.rotation.x = 0.2 + a * 0.5;
  rig.body.position.y += -0.07 * a; rig.body.rotation.x = -0.08 * a;
  rig.head.rotation.x = -0.45 + 0.35 * a;
  if (rig.kneeL && rig.kneeR) { rig.kneeL.rotation.x = rig.kneeR.rotation.x = -0.35 * a; }
}
const smooth = (x: number) => { const c = THREE.MathUtils.clamp(x, 0, 1); return c * c * (3 - 2 * c); };
/** 동작 중이면 팔을 덮어쓴다. 끝나면 gesture 를 지운다 */
function applyGesture(rig: AvatarRig) {
  const g = rig.gesture;
  if (!g) { if (rig.holdRope) { holdPose(rig); if (rig.pullAmt) pullPose(rig, rig.pullAmt); } return; }
  const u = (rig.idle - g.start) / GESTURE_DUR[g.kind];
  if (u >= 1) { rig.gesture = undefined; if (rig.holdRope) holdPose(rig); return; }
  if (g.kind === 'pull') {
    // 종지기 동작(1.5초): 머리 위 줄을 잡은 자세에서 힘껏 끌어내리고(0~0.22) 잠깐 버틴 뒤(~0.38),
    // 되돌아 오르는 줄에 매달려 몸이 떠올랐다가(0.38~0.78, 세기 1이면 발이 바닥에서 0.3 m) 내려와 선다(~1).
    // 세기(k)가 작으면(헛당김) 조금만 내려가고 떠오르지 않는다.
    const k = g.k;
    const down = u < 0.22 ? smooth(u / 0.22) : u < 0.38 ? 1 : u < 0.78 ? 1 - smooth((u - 0.38) / 0.4) : 0; // 1 = 팔을 아래로 다 당김
    const lift = k < 0.7 ? 0 : (u > 0.38 && u < 1 ? Math.sin(Math.PI * (u - 0.38) / 0.62) : 0) * 0.3 * k;     // 떠오르는 높이
    const land = u > 0.86 ? smooth((u - 0.86) / 0.14) : 0;                                                      // 착지하며 무릎이 살짝 꺾인다
    const ax = HOLD_ARM - (HOLD_ARM - PULL_ARM) * down * (0.55 + 0.45 * k); // 팔: 머리 위 앞(2.3) → 가슴 앞(1.05)
    rig.armL.rotation.x = rig.armR.rotation.x = ax;
    rig.armL.rotation.z = 0.28; rig.armR.rotation.z = -0.28;
    rig.elbowL.rotation.x = rig.elbowR.rotation.x = 0.2 + down * 0.5;
    rig.body.position.y += -0.07 * down * k + lift;           // 당길 때 몸이 조금 내려앉고, 줄에 끌려 떠오른다
    rig.body.rotation.x = -0.08 * down;                        // 당길 때 등을 조금 젖힌다
    if (rig.legL && rig.legR) {
      const dangle = lift > 0.02 ? Math.min(1, lift / 0.12) : 0;
      rig.legL.rotation.x = 0.35 * dangle - 0.12 * land; rig.legR.rotation.x = 0.2 * dangle - 0.12 * land; // 매달리면 다리가 앞으로 살짝 늘어진다
      if (rig.kneeL && rig.kneeR) { rig.kneeL.rotation.x = -0.55 * dangle - 0.3 * land - 0.35 * down * k; rig.kneeR.rotation.x = -0.4 * dangle - 0.3 * land - 0.35 * down * k; }
    }
    if (rig.footL && rig.footR) { rig.footL.position.y += lift * 0.1; rig.footR.position.y += lift * 0.1; }
    rig.head.rotation.x = -0.45 + 0.35 * down; rig.head.rotation.y = 0;
  } else {
    // 십자성호: 오른손 이마(0~.25) → 가슴(.25~.5) → 왼쪽 어깨(.5~.75) → 오른쪽 어깨(.75~1). 왼손은 가슴에
    const seg = Math.min(3, Math.floor(u * 4)), k = smooth((u * 4 - seg) * 1.6);
    // 어깨 rotation.x 는 +가 앞. 팔꿈치를 접어(+) 손이 몸 쪽으로 돌아오게 한다
    const pts = [[2.1, -0.05], [1.0, -0.05], [1.35, -0.6], [1.35, 0.5]]; // [어깨 x 회전, 어깨 z 회전] — 이마 · 가슴 · 왼어깨 · 오른어깨
    const from = seg === 0 ? [1.0, -0.05] : pts[seg - 1], to = pts[seg];
    rig.armR.rotation.x = from[0] + (to[0] - from[0]) * k;
    rig.armR.rotation.z = from[1] + (to[1] - from[1]) * k;
    rig.elbowR.rotation.x = 1.9;
    rig.armL.rotation.x = 1.0; rig.armL.rotation.z = 0.35; rig.elbowL.rotation.x = 1.9; // 왼손은 가슴에 모은다
    rig.head.rotation.x = 0.12; rig.head.rotation.y = 0;
  }
}

/** 지금 쓰는 캐릭터 — v3(2026-11-13)부터 한지 인형(hanji.ts). 이전 v2 는 아래 buildAvatarV2 로 남겨 둔다(태그 v3-15-순례자캐릭터) */
export function buildAvatar(def: AvatarDef): AvatarRig { return buildHanji(def); }

/** v2 순례자 · 천사(2026-11-09 ~ 11-12). 되돌리려면 위 buildAvatar 가 이것을 부르게 한다 */
export function buildAvatarV2(def: AvatarDef): AvatarRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  body.scale.setScalar(def.scale);
  const glow = def.angel ? 0.03 : 0;
  const skin = skinMat(def.skin), top = cloth(def.top, glow), bottom = cloth(def.bottom, glow), hairM = plain(def.hair, { roughness: 0.6 });
  const accent = def.accent ?? def.top;
  const seed = def.id.length;
  const child = def.scale < 0.75;

  // 비례(성인 키 1.75 m 기준)
  const hipY = 0.92, shoulderY = 1.42, headY = 1.62, headR = 0.105;

  // ── 아랫도리 ──
  let legL: THREE.Object3D | undefined, legR: THREE.Object3D | undefined, skirt: THREE.Object3D | undefined;
  let footL: THREE.Object3D | undefined, footR: THREE.Object3D | undefined, kneeL: THREE.Object3D | undefined, kneeR: THREE.Object3D | undefined;
  if (def.robe) {
    // 발목까지 늘어진 긴 옷 — 허리에서 바닥으로 넓어진다
    const robe = mesh(drape([[0.02, 0.33], [0.2, 0.3], [0.5, 0.24], [0.8, 0.19], [hipY + 0.02, 0.165], [1.12, 0.16], [1.3, 0.175], [shoulderY, 0.15]], 13, 0.07, seed), top);
    body.add(robe);
    skirt = robe;
    // 밑단 가장자리
    body.add(mesh(new THREE.TorusGeometry(0.325, 0.012, 6, 40).rotateX(Math.PI / 2).scale(1, 1, 0.86), cloth(accent, glow), 0, 0.03, 0));
    // 옷자락 밑으로 번갈아 나오는 발(걸음에 맞춰 앞뒤로 딛는다)
    for (const s of [-1, 1]) {
      const f = new THREE.Group(); f.position.set(s * 0.085, 0, -0.05);
      f.add(mesh(new THREE.SphereGeometry(0.05, 10, 8).scale(0.9, 0.5, 1.7), plain(def.angel ? 0xd8cbb0 : 0x2a2420, { roughness: 0.5 }), 0, 0.025, -0.06));
      body.add(f);
      if (s < 0) footL = f; else footR = f;
    }
  } else {
    // 다리: 허벅지에서 발목으로 가늘어지는 바지(또는 스타킹) + 신발
    for (const s of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(s * 0.085, hipY, 0);
      hip.add(mesh(new THREE.CylinderGeometry(0.07, 0.056, 0.44, 12).translate(0, -0.22, 0), bottom));       // 허벅지
      const knee = new THREE.Group(); knee.position.set(0, -0.44, 0); hip.add(knee);
      knee.add(mesh(new THREE.SphereGeometry(0.056, 10, 8), bottom));
      knee.add(mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.42, 12).translate(0, -0.21, 0), bottom));    // 정강이
      knee.add(mesh(new THREE.SphereGeometry(0.05, 10, 8).scale(1, 0.62, 2.0), plain(0x2a2420, { roughness: 0.45 }), 0, -0.43, -0.05));
      body.add(hip);
      if (s < 0) kneeL = knee; else kneeR = knee;
      if (s < 0) legL = hip; else legR = hip;
    }
    // 겉옷(엉덩이~허벅지까지 오는 코트 · 재킷) — 걸을 때 살짝 흔들린다
    const coatLen = def.id === 'mom' || def.id === 'grandma' || def.id === 'girl' ? 0.42 : def.id === 'grandpa' || def.id === 'dad' ? 0.3 : 0.12;
    const coat = mesh(drape([[hipY - coatLen, 0.215], [hipY, 0.185], [1.12, 0.165], [1.3, 0.178], [shoulderY, 0.15]], 9, 0.05, seed), top);
    body.add(coat);
    skirt = coat;
  }
  // 어깨 · 목
  body.add(mesh(new THREE.SphereGeometry(0.17, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(1.08, 0.42, 0.78), top, 0, shoulderY - 0.01, 0));
  body.add(mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.12, 12), skin, 0, shoulderY + 0.07, 0));
  // 띠
  if (def.robe && def.id !== 'pilgrim') body.add(mesh(new THREE.TorusGeometry(0.168, 0.014, 6, 32).rotateX(Math.PI / 2).scale(1, 1, 0.86), def.angel ? gold() : cloth(accent), 0, hipY + 0.06, 0));
  if (def.id === 'pilgrim') body.add(mesh(new THREE.TorusGeometry(0.17, 0.02, 6, 32).rotateX(Math.PI / 2).scale(1, 1, 0.86), plain(0x3a2a1a), 0, hipY + 0.05, 0));
  if (def.id === 'priest') body.add(mesh(new THREE.BoxGeometry(0.05, 0.035, 0.01), plain(0xffffff), 0, shoulderY + 0.06, -0.05)); // 로만 칼라
  if (def.id === 'sister' || def.id === 'priest') { // 가슴 십자가
    const cr = new THREE.Group(); cr.position.set(0, 1.2, -0.155);
    cr.add(mesh(new THREE.BoxGeometry(0.012, 0.07, 0.006), gold()), mesh(new THREE.BoxGeometry(0.045, 0.012, 0.006), gold(), 0, 0.012, 0));
    body.add(cr);
  }
  // 망토(어깨에서 등 뒤로 늘어진 천)
  if (def.mantle) {
    const g = drape([[0.25, 0.3], [0.7, 0.26], [1.1, 0.215], [shoulderY - 0.02, 0.19], [shoulderY + 0.03, 0.12]], 9, 0.08, seed + 2);
    // 뒤쪽 반만 남긴다
    body.add(mesh(keepBack(g), cloth(def.mantle, glow * 0.6)));
    g.dispose();
  }
  if (def.id === 'michael') { // 금빛 가슴받이
    body.add(mesh(new THREE.SphereGeometry(0.168, 20, 12, Math.PI * 0.62, Math.PI * 0.76, Math.PI * 0.32, Math.PI * 0.36).scale(1, 1.2, 0.86), gold(), 0, 1.18, 0));
  }
  if (def.backpack) {
    body.add(mesh(new THREE.BoxGeometry(0.26, 0.34, 0.13).translate(0, 0, 0), cloth(def.id === 'pilgrim' ? 0x4a3c2c : 0x3e4a5a), 0, 1.17, 0.19));
    if (def.id === 'pilgrim') body.add(mesh(new THREE.CircleGeometry(0.05, 12), plain(0xf0e6d2, { side: THREE.DoubleSide }), 0, 1.2, 0.257)); // 가리비 껍데기(순례 표지)
  }

  // ── 팔: 어깨에서 내려오는 소매(긴 옷은 소맷부리가 넓다) + 손 ──
  const arm = (s: number) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.19, shoulderY - 0.04, 0);
    const wide = def.robe ? 0.085 : 0.05;
    sh.add(mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.29, 12, 1, true).translate(0, -0.145, 0), top));   // 위팔
    sh.add(mesh(new THREE.SphereGeometry(0.052, 12, 10), top, 0, 0, 0));
    const el = new THREE.Group(); el.position.set(0, -0.29, 0); sh.add(el);                                    // 팔꿈치
    el.add(mesh(new THREE.SphereGeometry(0.047, 10, 8), top));
    el.add(mesh(new THREE.CylinderGeometry(0.046, wide, 0.27, 12, 1, true).translate(0, -0.135, 0), top));     // 아래팔(소맷부리)
    el.add(mesh(new THREE.SphereGeometry(0.04, 10, 8).scale(0.8, 1.2, 0.6), skin, 0, -0.31, 0));              // 손
    const hand = new THREE.Object3D(); hand.position.set(0, -0.33, 0); el.add(hand);                          // 손끝 자리(줄을 잡는 점)
    body.add(sh);
    return { sh, el, hand };
  };
  const aL = arm(-1), aR = arm(1);
  const armL = aL.sh, armR = aR.sh;

  // ── 머리: 얼굴은 그리지 않는다(고요한 성상처럼). 턱이 조금 갸름한 달걀꼴 ──
  const head = new THREE.Group(); head.position.set(0, headY + 0.03, 0); body.add(head);
  head.add(mesh(new THREE.SphereGeometry(headR, 28, 20).scale(0.92, 1.12, 1.0), skin));
  head.add(mesh(new THREE.SphereGeometry(0.018, 8, 6).scale(0.8, 1.3, 1.1), skin, 0, -0.01, -0.1)); // 콧날
  for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.02, 8, 6).scale(0.5, 1, 0.8), skin, s * 0.097, 0, 0)); // 귀
  // 따뜻하게 웃는 얼굴 — 반짝이는 눈동자 · 눈웃음 눈꺼풀 · 올라간 입꼬리 · 볼 홍조
  {
    const iris = plain(0x2a1a12, { roughness: 0.25 }), white = plain(0xf4efe8, { roughness: 0.3 });
    const brow = plain(def.hair === 0xd6d3cc || def.hair === 0xcfccc6 ? 0x9a948a : def.hair, { roughness: 0.9 });
    const lid = skinMat(new THREE.Color(def.skin).multiplyScalar(0.92).getHex());
    for (const sx of [-1, 1]) {
      const ex = sx * 0.034, ey = 0.014, ez = -0.088;
      head.add(mesh(new THREE.SphereGeometry(0.0145, 12, 10).scale(1.15, 0.85, 0.5), white, ex, ey, ez));
      head.add(mesh(new THREE.SphereGeometry(0.0095, 12, 10).scale(1, 1, 0.5), iris, ex, ey - 0.001, ez - 0.006));
      head.add(mesh(new THREE.SphereGeometry(0.0028, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), ex + 0.003, ey + 0.004, ez - 0.0105)); // 눈빛
      // 웃는 눈: 아래 눈꺼풀이 살짝 올라와 눈이 반달이 된다
      const low = mesh(new THREE.SphereGeometry(0.016, 12, 8, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38).scale(1.15, 0.9, 0.6), lid, ex, ey + 0.004, ez + 0.002);
      head.add(low);
      const b = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0032, 4, 12, Math.PI * 0.8), brow);
      b.position.set(sx * 0.036, 0.04, -0.094); b.rotation.z = Math.PI * 0.1; head.add(b);
      // 볼 홍조
      head.add(mesh(new THREE.SphereGeometry(0.018, 10, 8).scale(1.2, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0xe8908a, transparent: true, opacity: 0.35, roughness: 0.8, depthWrite: false }), sx * 0.052, -0.018, -0.085));
    }
    // 입: 위로 휜 미소(아래로 볼록한 호) + 입꼬리
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0032, 6, 16, Math.PI * 0.9), plain(0x9a4a42, { roughness: 0.5 }));
    smile.position.set(0, -0.034, -0.092); smile.rotation.z = Math.PI + Math.PI * 0.05; head.add(smile);
  }
  const cap = (r = headR * 1.06, th = 1.5) => { const m = mesh(new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, 0, th).scale(0.93, 1.1, 1.02), hairM, 0, 0.012, 0.014); m.rotation.x = 0.62; return m; }; // 뒤로 기울여 이마·얼굴이 드러나게
  switch (def.hairStyle) {
    case 'short': head.add(cap()); break;
    case 'long': {
      head.add(cap());
      // 천사(가브리엘·수호천사)는 허리까지 흘러내리는 긴 머리, 사람은 어깨 아래까지
      const lo = def.angel ? -0.62 : -0.3;
      head.add(mesh(keepBack(drape([[lo, 0.13], [-0.32, 0.12], [-0.1, 0.106], [0.06, 0.108]], 16, 0.14, seed), -0.03), hairM, 0, 0, 0.012));
      // 앞으로 흘러내린 옆머리 두 가닥
      for (const sx of [-1, 1]) head.add(mesh(new THREE.CapsuleGeometry(0.022, 0.2, 4, 8), hairM, sx * 0.085, -0.13, -0.01));
      break;
    }
    case 'bun': head.add(cap()); head.add(mesh(new THREE.SphereGeometry(0.045, 12, 10), hairM, 0, 0.06, 0.1)); break;
    case 'bald': head.add(mesh(keepBack(new THREE.SphereGeometry(headR * 1.03, 20, 10, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.22).scale(0.93, 1.1, 1.02), 0.01), hairM)); break; // 뒤통수·옆머리만
    case 'pigtails': head.add(cap()); for (const s of [-1, 1]) head.add(mesh(new THREE.CapsuleGeometry(0.03, 0.12, 4, 8), hairM, s * 0.1, -0.1, 0.04)); break;
    case 'curly': for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, up = i % 3; head.add(mesh(new THREE.SphereGeometry(0.036, 8, 6), hairM, Math.cos(a) * 0.085, 0.05 + up * 0.025, Math.sin(a) * 0.085 + 0.015)); } break;
    case 'veil':
      { const w = mesh(new THREE.SphereGeometry(headR * 1.05, 20, 12, 0, Math.PI * 2, 0, 1.75).scale(0.95, 1.1, 1.02), plain(def.accent ?? 0xffffff, { roughness: 0.8 }), 0, -0.004, 0.01); w.rotation.x = 0.75; head.add(w); } // 얼굴을 두른 흰 두건
      head.add(mesh(keepBack(drape([[-0.42, 0.2], [-0.15, 0.135], [0.05, 0.122], [0.135, 0.04]], 10, 0.08, seed), -0.04), cloth(def.hair), 0, 0, 0.02));
      break;
    case 'hood':
      head.add(cap());
      head.add(mesh(keepBack(drape([[-0.2, 0.17], [0.0, 0.135], [0.1, 0.122], [0.165, 0.04]], 8, 0.08, seed), -0.05), cloth(def.mantle ?? def.top), 0, 0, 0.03));
      break;
    case 'cap': head.add(cap()); break;
  }
  if (def.id === 'gabriel') { // 꽃관(흰·분홍 작은 꽃)
    const crown = new THREE.Group(); crown.position.set(0, 0.085, 0.01); crown.rotation.x = 0.35; head.add(crown);
    crown.add(mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 32).rotateX(Math.PI / 2), plain(0x6a8a4a)));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; crown.add(mesh(new THREE.SphereGeometry(0.016, 8, 6), plain([0xfff4f6, 0xf6b8c8, 0xffe8a8][k % 3], { roughness: 0.6 }), Math.cos(a) * 0.1, 0.006, Math.sin(a) * 0.1)); }
  }
  if (def.beard) head.add(mesh(new THREE.SphereGeometry(0.08, 14, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5).scale(0.95, 1.1, 0.9), plain(def.beard, { roughness: 0.9 }), 0, -0.035, -0.035));
  if (child) head.scale.setScalar(1.18); // 아이는 머리가 몸에 비해 조금 크다

  // 들고 있는 것은 없다 — 지팡이·풍선·막대기 등 아무것도 들지 않는다(사장님 2026-11-24). def.prop 은 쓰지 않는다.
  const balloon: THREE.Object3D | undefined = undefined;

  // ── 천사: 날개 · 후광 ──
  let wingL: THREE.Object3D | undefined, wingR: THREE.Object3D | undefined, halo: THREE.Object3D | undefined;
  if (def.angel) {
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.07, shoulderY - 0.06, 0.12);
      const w = buildWing(def.wing ?? 0xffffff, 0.05);
      w.scale.set(s * (child ? 0.62 : 0.86), child ? 0.62 : 0.86, 1);
      w.rotation.y = -s * 0.42; // 등 뒤에서 양옆으로 펼친 채(파닥이지 않는다)
      w.rotation.z = s * 0.16;
      pivot.add(w); body.add(pivot);
      if (s < 0) wingL = pivot; else wingR = pivot;
    }
    // 후광: 머리 뒤에 선 가는 빛의 고리(실내에서는 은은히 번진다)
    const hm = new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false });
    halo = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.006, 6, 48), hm);
    const disc = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.17, 48), new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.12, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }));
    halo.add(ring, disc);
    halo.position.set(0, headY + 0.06, 0.1);
    body.add(halo);
  }

  return { root, body, legL, legR, kneeL, kneeR, footL, footR, armL, armR, elbowL: aL.el, elbowR: aR.el, handL: aL.hand, handR: aR.hand, head, wingL, wingR, halo, balloon, skirt, def, phase: Math.random() * 6, idle: Math.random() * 10 };
}

/** 회전체에서 등 쪽(+Z) 반만 남긴다(망토) */
function keepBack(g: THREE.BufferGeometry, zMin = -0.02): THREE.BufferGeometry {
  const src = g.index ? g.toNonIndexed() : g;
  const p = src.attributes.position as THREE.BufferAttribute, n = src.attributes.normal as THREE.BufferAttribute;
  const P: number[] = [], N: number[] = [];
  for (let f = 0; f < p.count; f += 3) {
    const zc = (p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)) / 3;
    if (zc < zMin) continue;
    for (let k = 0; k < 3; k++) { P.push(p.getX(f + k), p.getY(f + k), p.getZ(f + k) + 0.012); N.push(n.getX(f + k), n.getY(f + k), n.getZ(f + k)); }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  return out;
}

/**
 * 걸음 · 날갯짓 · 숨쉬기. speed 는 수평 속도(m/s).
 * 사람 걸음 규칙: 왼발이 나가면 오른팔이 나간다(반대쪽 팔다리). 걸음 박자는 이동 거리에 묶어 발이 미끄러지지 않게 한다.
 * 팔꿈치는 팔이 앞으로 갈 때 더 굽고, 무릎은 다리를 앞으로 들어 올릴 때 굽는다. 몸은 한 걸음에 두 번 오르내리고,
 * 어깨는 골반과 반대로 살짝 비틀린다. 서 있을 때는 숨쉬듯 아주 조금 움직인다.
 */
export function animateAvatar(rig: AvatarRig, dt: number, speed: number, t: number, sitting = false) {
  const sc = rig.def.scale;
  const walk = THREE.MathUtils.clamp(speed / 1.6, 0, 1);       // 0 = 서 있음, 1 = 보통 걸음 이상
  const run = THREE.MathUtils.clamp((speed - 3.2) / 1.8, 0, 1); // 뛰기
  const stride = 1.8 * sc * (1 + run * 0.45);                 // 한 걸음 주기(좌우 두 발) 동안 나아가는 거리
  rig.phase += (speed * dt / stride) * Math.PI * 2;
  rig.idle += dt;
  const p = rig.phase, sw = Math.sin(p);                        // sw>0: 왼다리 앞
  const amp = walk * (0.42 + run * 0.35);
  const ease = (x: number) => x; // 직선 그대로(사인이 이미 부드럽다)

  if (rig.legL && rig.legR) {
    if (sitting) { rig.legL.rotation.x = rig.legR.rotation.x = -1.45; if (rig.kneeL && rig.kneeR) rig.kneeL.rotation.x = rig.kneeR.rotation.x = 1.45; }
    else {
      rig.legL.rotation.x = ease(sw) * amp; rig.legR.rotation.x = -ease(sw) * amp;
      // 무릎: 다리가 뒤에서 앞으로 넘어올 때(들어 올릴 때) 굽는다
      if (rig.kneeL && rig.kneeR) {
        rig.kneeL.rotation.x = -Math.max(0, Math.cos(p)) * amp * 1.3 - walk * 0.05;
        rig.kneeR.rotation.x = -Math.max(0, -Math.cos(p)) * amp * 1.3 - walk * 0.05;
      }
    }
  }
  // 긴 옷: 옷자락 아래 발이 번갈아 앞뒤로
  if (rig.footL && rig.footR) {
    rig.footL.position.z = -0.05 - sw * 0.16 * walk; rig.footR.position.z = -0.05 + sw * 0.16 * walk;
    rig.footL.position.y = Math.max(0, Math.cos(p)) * 0.03 * walk; rig.footR.position.y = Math.max(0, -Math.cos(p)) * 0.03 * walk;
  }
  // 팔: 다리와 반대로(왼다리 앞 → 왼팔 뒤 · 오른팔 앞). 서 있을 땐 자연스럽게 늘어뜨리고 숨에 맞춰 아주 조금
  const breathe = Math.sin(rig.idle * 1.6) * 0.02 * (1 - walk);
  // 천사는 팔을 활기차게(크게) 흔든다
  const armAmp = amp * (rig.def.angel ? 1.0 : rig.def.robe ? 0.75 : 0.95);
  // 천사는 들고 있는 것이 있어도 양손을 앞뒤로 자연스럽게 흔든다
  rig.armL.rotation.x = -sw * armAmp + breathe;
  rig.armR.rotation.x = sw * armAmp + breathe;
  rig.armL.rotation.z = -0.07 - walk * 0.03; rig.armR.rotation.z = 0.07 + walk * 0.03;
  // 팔꿈치: 앞으로 흔들 때 더 굽는다(사람 팔은 앞에서 굽고 뒤에서 펴진다)
  // 두 팔 똑같이: 서 있을 때는 곧게 내리고, 걸을 때 앞으로 갈 때만 살짝(0.3 이하) 굽는다 — 한쪽만 접혀 있지 않게
  rig.elbowL.rotation.x = 0.06 + Math.max(0, -sw) * armAmp * 0.45 + run * 0.35;
  rig.elbowR.rotation.x = 0.06 + Math.max(0, sw) * armAmp * 0.45 + run * 0.35;
  // 몸: 한 걸음에 두 번 오르내림 · 조금 앞으로 기울임 · 어깨가 골반 반대로 비틀림
  const bounce = Math.abs(Math.cos(p)) * 0.014 * walk * sc;
  const hover = 0; // 천사도 공중에 뜨지 않고 발이 바닥에 닿는다(사장님 2026-11-24)
  void t;
  rig.body.position.y = hover + bounce + Math.sin(rig.idle * 1.6) * 0.004;
  rig.body.rotation.x = -(0.04 * walk + 0.08 * run);
  rig.body.rotation.y = sw * 0.02 * walk;
  rig.body.rotation.z = 0; // 좌우로 기우뚱하지 않는다
  // 머리: 몸의 흔들림을 덜어 앞을 바라본다 + 서 있을 때 가끔 둘러본다
  rig.head.rotation.y = -sw * 0.05 * walk + Math.sin(rig.idle * 0.37) * 0.18 * (1 - walk);
  rig.head.rotation.z = 0; // 박자에 맞춰 갸웃
  rig.head.rotation.x = 0.04 * walk;
  // 옷자락: 걸음에 맞춰 흔들림
  if (rig.skirt) { rig.skirt.rotation.x = walk * 0.04; rig.skirt.rotation.z = Math.sin(p) * 0.02 * walk; }
  // 날개: 펼친 채로 둔다(파닥이지 않음) — 걸음에 몸이 흔들리는 만큼만 함께 움직인다
  if (rig.wingL && rig.wingR) { rig.wingL.rotation.set(0, 0, 0); rig.wingR.rotation.set(0, 0, 0); }
  if (rig.halo) rig.halo.rotation.z = Math.sin(t * 0.7) * 0.05;
  if (rig.balloon) rig.balloon.position.x = 0.05 + Math.sin(t * 1.3) * 0.06;
  applyGesture(rig);
}

export function disposeAvatar(rig: AvatarRig) {
  rig.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
}
