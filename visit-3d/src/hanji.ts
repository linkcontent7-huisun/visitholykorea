// 한지 인형 캐릭터 v3 (2026-11-13) — 심재학 멘토 「3D 가톨릭 월드 개발계획」 2.4절을 우리 3D 에 옮긴 것.
//
// 원칙(멘토 계획 그대로):
//   · 사람을 사실적으로 만들지 않고 상징으로 — 한지를 접은 듯 각진 인형, 얼굴은 그리지 않는다
//   · 옷 무늬(깃 · 고름 · 띠 · 주름)는 따로 붙이지 않고 몸 표면 그림에 직접 그린다
//   · 옷 빛깔은 천연 염색 계열(쪽빛 · 감물색 · 소색 · 먹색)
//   · 천사는 접은 한지 날개 + 가는 후광(사장님 결정 2026-11-14: 멘토 계획과 달리 천사에게만 후광을 둔다). 사람에게는 넣지 않는다
// 가볍게: 움직이는 단위(몸 · 머리 · 팔 · 아래팔 · 든 것 · 날개)마다 부품을 한 덩어리로 합쳐,
//   한 사람이 그리기 호출 6~9번으로 끝난다(이전 v2 는 천사 한 명이 100번이 넘었다).
// 좌표: 앞쪽은 -Z(플레이어 yaw 0). AvatarRig 모양은 avatars.ts 의 것을 그대로 채운다(걷기 · 종 줄 · 십자성호 동작이 그대로 돈다).
// 원본 목업: ~/visitholykorea-integration/참고자료-멘토링/심재학-3D가톨릭월드-2026-11-12/목업/사람샘플.html 의 makeHanji
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { AvatarDef, AvatarRig } from './avatars.ts';

type Hat = 'jokduri' | 'gat' | 'satgat' | 'veil' | 'nunveil' | 'sangtu' | 'jjok' | 'daenggi' | 'cap' | 'long';
const HOLD_ITEMS = false; // 캐릭터가 무언가를 들게 하려면 사장님 허락 뒤에만 true
type Hold = '' | 'rosary' | 'flower' | 'book' | 'candle' | 'staff' | 'cane' | 'sword' | 'flag' | 'horn';
interface Look {
  /** 두루마기(남자 · 천사 · 사제) 또는 치마저고리 */
  robe: boolean;
  child?: boolean;
  hat: Hat;
  top: number;
  skirt?: number;
  belt?: number;
  ribbon?: number;
  nori?: number;
  vest?: number;
  wings?: boolean;
  hold: Hold;
  bundle?: boolean;
  collar?: 'roman';
}

// 캐릭터 15명 → 한지 인형 차림. 순서 · id 는 avatars.ts 와 같다(별명 끝 번호로 서로 알린다)
const LOOKS: Record<string, Look> = {
  gabriel:  { robe: true, hat: 'long', top: 0xf3ecdc, belt: 0xc9a85a, ribbon: 0xc9a85a, wings: true, hold: 'flower' },
  michael:  { robe: true, hat: 'cap', top: 0xefe6d2, belt: 0xb23a2e, ribbon: 0xb23a2e, wings: true, hold: 'sword' },
  raphael:  { robe: true, hat: 'cap', top: 0xefe6d2, belt: 0x5a7a4a, ribbon: 0x5a7a4a, wings: true, hold: 'staff' },
  cherub:   { robe: false, child: true, hat: 'cap', top: 0xf3ecdc, skirt: 0xd9cfb8, ribbon: 0xc9a85a, wings: true, hold: 'horn' },
  guardian: { robe: false, hat: 'long', top: 0xf3ecdc, skirt: 0x566a78, ribbon: 0x3d5a80, wings: true, hold: 'candle' },
  // 한복의 고운 빛깔(2026-11-24 사장님: 무채색 금지). 어르신은 옥색·연보라처럼 점잖은 고운 색, 아이는 노랑·분홍·다홍 같은 밝은 색
  grandpa:  { robe: true, hat: 'gat', top: 0x8cc9b8, belt: 0x2f4a8a, ribbon: 0x2f4a8a, hold: 'cane' },                       // 옥색 도포 + 남색 띠 + 갓
  grandma:  { robe: false, hat: 'jjok', top: 0xb79de0, skirt: 0x1f8f74, ribbon: 0xd8445a, nori: 0xe0a030, hold: 'rosary' },   // 연보라 저고리 + 비취 치마 + 비녀
  dad:      { robe: true, hat: 'gat', top: 0x2f6fcf, vest: 0xc8202a, ribbon: 0xe0b040, hold: '' },                             // 청색 도포 + 다홍 쾌자 + 갓
  mom:      { robe: false, hat: 'jokduri', top: 0xffc21a, skirt: 0xc8203a, ribbon: 0x2f4a8a, nori: 0xe0a030, hold: 'flower' }, // 노랑 저고리 + 다홍 치마 + 쪽두리·비녀·노리개
  teen:     { robe: true, hat: 'cap', top: 0x5fc24a, belt: 0xd9344c, ribbon: 0xd9344c, bundle: true, hold: '' },               // 연두 두루마기 + 다홍 띠
  boy:      { robe: true, child: true, hat: 'cap', top: 0xffc81a, belt: 0xd9344c, ribbon: 0x2f4a8a, hold: 'flag' },           // 노랑 + 색동 소매
  girl:     { robe: false, child: true, hat: 'daenggi', top: 0xff7aa8, skirt: 0xd91e36, ribbon: 0x2f4a8a, hold: 'flower' },  // 분홍 저고리 + 다홍 치마 + 댕기 + 색동 소매
  sister:   { robe: true, hat: 'nunveil', top: 0x2b2a2e, belt: 0x2b2a2e, ribbon: 0x2b2a2e, hold: 'rosary' },
  priest:   { robe: true, hat: 'cap', top: 0x232327, belt: 0x232327, ribbon: 0x232327, collar: 'roman', hold: 'book' },
  pilgrim:  { robe: true, hat: 'satgat', top: 0x3fa89c, belt: 0xd9344c, ribbon: 0xd9344c, bundle: true, hold: 'staff' },
};

const PAPER = 0xefe6d2, HAIR = 0x2b2420, INK = 0x1c1a19, WHITE = '#fbf7ec';
/** 목업 단위(키 약 1.55)를 우리 3D 사람 키(약 1.75)에 맞춘다 */
const UNIT = 1.13;

const css = (hex: number) => `#${new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace).getHexString()}`;
const shadeCss = (hex: number, k: number) => `#${new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace).multiplyScalar(k).getHexString()}`;
const clamp = THREE.MathUtils.clamp;

// ── 부품을 모아 한 덩어리로 ──
// 부품마다 빛깔을 정점 색으로 넣고, 위치 · 회전을 굳힌 뒤 합친다 → 그리기 호출 1번
class Batch {
  private parts: THREE.BufferGeometry[] = [];
  add(geo: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone());
    g.deleteAttribute('uv');
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1)));
    const c = new THREE.Color(color), n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.parts.push(g);
    geo.dispose();
    return this;
  }
  mesh(): THREE.Mesh | null {
    if (!this.parts.length) return null;
    const m = new THREE.Mesh(mergeGeometries(this.parts, false)!, paperMat());
    this.parts.forEach((g) => g.dispose());
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
}
let _paper: THREE.MeshStandardMaterial | null = null;
const paperMat = () => (_paper ??= new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, side: THREE.DoubleSide }));

// ── 옷 무늬를 몸 표면에 직접 그린다(목업 bodyTex 를 옮김) ──
type Prof = [number, number][];
function bodyTex(prof: Prof, paint: (p: Painter) => void): THREE.CanvasTexture {
  const S = 256, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const n = prof.length - 1;
  const at = (y: number) => {
    let i = 0;
    while (i < n - 1 && y > prof[i + 1][1]) i++;
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    const t = clamp((y - y0) / ((y1 - y0) || 1), 0, 1);
    return { v: (i + t) / n, r: r0 + (r1 - r0) * t };
  };
  const X = (x: number, y: number) => (0.5 + x / (2 * Math.PI * Math.max(0.04, at(y).r))) * S;
  const Y = (y: number) => (1 - at(y).v) * S;
  const p: Painter = {
    band(y0, y1, fill) { g.fillStyle = fill; g.fillRect(0, Y(y1), S, Y(y0) - Y(y1)); },
    poly(pts, fill) { g.fillStyle = fill; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x, y), Y(y)) : g.moveTo(X(x, y), Y(y)))); g.closePath(); g.fill(); },
    line(pts, color, width, alpha = 1) {
      g.strokeStyle = color; g.lineWidth = width; g.globalAlpha = alpha;
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x, y), Y(y)) : g.moveTo(X(x, y), Y(y)))); g.stroke();
      g.globalAlpha = 1;
    },
    folds(y0, y1, count, alpha) {
      g.fillStyle = '#000'; g.globalAlpha = alpha;
      for (let i = 0; i < count; i++) g.fillRect(((i + 0.5) / count) * S, Y(y1), 1.6, Y(y0) - Y(y1));
      g.globalAlpha = 1;
    },
  };
  paint(p);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
interface Painter {
  band(y0: number, y1: number, fill: string): void;
  poly(pts: [number, number][], fill: string): void;
  line(pts: [number, number][], color: string, width: number, alpha?: number): void;
  folds(y0: number, y1: number, count: number, alpha: number): void;
}
/** 깃: 목 양옆에서 내려와 가슴 가운데에서 만나는 V */
function paintCollar(p: Painter, yTop: number, yMeet: number, hw: number, bw: number, inner = '#f3ead8') {
  p.poly([[-hw, yTop], [hw, yTop], [0, yMeet + bw * 0.4]], inner);
  p.poly([[-hw - bw, yTop], [-hw, yTop], [bw * 0.55, yMeet], [-bw * 0.45, yMeet]], WHITE);
  p.poly([[hw, yTop], [hw + bw, yTop], [bw * 0.1, yMeet - bw * 0.5], [-bw * 0.9, yMeet - bw * 0.5]], WHITE);
  p.line([[hw + bw, yTop], [bw * 0.1, yMeet - bw * 0.5]], '#000', 1, 0.25);
}
/** 고름: 매듭에서 긴 가닥과 짧은 가닥이 늘어진다 */
function paintRibbon(p: Painter, x: number, y: number, len: number, color: string) {
  p.poly([[x, y], [x + 0.028, y], [x + 0.048, y - len], [x + 0.02, y - len]], color);
  p.poly([[x + 0.028, y], [x + 0.052, y], [x + 0.095, y - len * 0.62], [x + 0.07, y - len * 0.62]], color);
  p.poly([[x - 0.006, y + 0.018], [x + 0.058, y + 0.018], [x + 0.058, y - 0.018], [x - 0.006, y - 0.018]], color);
}

const texCache = new Map<string, THREE.CanvasTexture>();
const bodyMats = new Map<string, THREE.MeshStandardMaterial>();

export function buildHanji(def: AvatarDef): AvatarRig {
  const L = LOOKS[def.id] ?? LOOKS.pilgrim;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  body.scale.setScalar(UNIT * (L.child ? 0.72 : def.id === 'grandma' || def.id === 'grandpa' ? 0.95 : 1));
  const man = L.robe;
  const TOP_Y = 1.1, R0 = man ? 0.36 : 0.4, R1 = 0.1;

  // ── 몸: 위로 좁아지는 원뿔 하나 + 옷 그림 ──
  let mat = bodyMats.get(def.id);
  if (!mat) {
    let tex = texCache.get(def.id);
    if (!tex) {
      tex = bodyTex([[R0, 0], [R1, TOP_Y]], (p) => {
        if (man) {
          p.band(0, TOP_Y, css(L.top));
          p.folds(0.03, 0.7, 12, 0.1);
          p.band(0, 0.07, shadeCss(L.top, 0.62));
          p.line([[0.0, 0.93], [0.07, 0.0]], '#000', 2, 0.3);                       // 겹친 앞자락
          if (L.vest) {                                                               // 배자
            p.band(0.6, 1.04, css(L.vest));
            p.poly([[-0.045, 0.6], [0.045, 0.6], [0.03, 1.04], [-0.03, 1.04]], css(L.top));
          } else if (L.belt !== undefined && L.belt !== L.top) p.band(0.74, 0.79, css(L.belt));   // 띠
        } else {
          const sk = L.skirt ?? 0x3d5a80;
          p.band(0, TOP_Y, css(sk));
          p.folds(0.03, 0.86, 18, 0.15);
          p.band(0, 0.06, shadeCss(sk, 0.62));
          p.band(0.845, 0.89, WHITE);                                                 // 치마 말기
          p.band(0.89, TOP_Y, css(L.top));                                            // 저고리
          if (L.nori) {                                                               // 노리개
            p.poly([[-0.075, 0.875], [-0.055, 0.85], [-0.075, 0.825], [-0.095, 0.85]], css(L.nori));
            p.poly([[-0.085, 0.825], [-0.065, 0.825], [-0.07, 0.68], [-0.08, 0.68]], css(L.nori));
          }
        }
        if (L.collar === 'roman') p.poly([[-0.02, 1.095], [0.02, 1.095], [0.02, 1.06], [-0.02, 1.06]], WHITE);  // 로만 칼라
        else {
          paintCollar(p, 1.095, 0.94, 0.03, 0.026);
          paintRibbon(p, 0.004, 0.935, man ? 0.2 : 0.26, css(L.ribbon ?? 0xb23a2e));
        }
      });
      texCache.set(def.id, tex);
    }
    mat = new THREE.MeshStandardMaterial({ map: tex, flatShading: true, roughness: 0.92, side: THREE.DoubleSide });
    bodyMats.set(def.id, mat);
  }
  // thetaStart 0 → 그림 가운데(u 0.5)가 -Z(앞)에 온다
  const bodyGeo = new THREE.CylinderGeometry(R1, R0, TOP_Y, 12, 1, true, 0);
  bodyGeo.translate(0, TOP_Y / 2, 0);
  const cone = new THREE.Mesh(bodyGeo, mat);
  cone.castShadow = true; cone.receiveShadow = true;
  body.add(cone);

  // 어깨 덮개 · 목 · 봇짐 · 날개 뿌리 — 몸과 함께 움직이는 단단한 부품
  const torso = new Batch();
  torso.add(new THREE.CylinderGeometry(0.058, R1, 0.035, 12), L.top, 0, TOP_Y + 0.017, 0);
  torso.add(new THREE.CylinderGeometry(0.05, 0.058, 0.1, 7), PAPER, 0, TOP_Y + 0.07, 0);
  if (L.bundle) {                                                                     // 등에 멘 봇짐
    torso.add(new THREE.BoxGeometry(0.26, 0.2, 0.13), 0xb9985a, 0, 0.86, 0.2, 0.12);
    torso.add(new THREE.BoxGeometry(0.03, 0.03, 0.34), 0x4e3524, -0.09, 0.98, 0.04, 0.4);
    torso.add(new THREE.BoxGeometry(0.03, 0.03, 0.34), 0x4e3524, 0.09, 0.98, 0.04, 0.4);
  }
  body.add(torso.mesh()!);

  // 날개: 접은 한지 부채 두 장(등 뒤 +Z)
  let wingL: THREE.Object3D | undefined, wingR: THREE.Object3D | undefined;
  if (L.wings) {
    const mk = (side: number) => {
      const b = new Batch();
      for (let i = 0; i < 5; i++) {                                                   // 부채살 다섯 장, 끝이 바깥 위로 펼쳐진다
        const a = -0.15 + i * 0.32, len = 0.5 - i * 0.04;
        const blade = new THREE.BoxGeometry(0.11, len, 0.012).translate(0, len / 2, 0);
        b.add(blade, i % 2 ? 0xf6f0e2 : 0xfbf7ec, 0, 0, i * 0.004, 0, 0, -side * a);
      }
      const w = b.mesh()!;
      const g = new THREE.Group();
      g.position.set(side * 0.09, 0.95, 0.16);
      g.rotation.set(-0.25, side * 0.5, 0);
      g.add(w);
      body.add(g);
      return g;
    };
    wingL = mk(-1); wingR = mk(1);
  }

  // ── 머리: 얼굴은 그리지 않는다 ──
  const head = new THREE.Group(); head.position.set(0, 1.33, 0); body.add(head);
  if (L.child) head.scale.setScalar(1.2);
  const hb = new Batch();
  hb.add(new THREE.SphereGeometry(0.17, 10, 8), PAPER);
  const cap = () => hb.add(new THREE.SphereGeometry(0.182, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), HAIR, 0, 0.005, 0, 0.3);
  switch (L.hat) {
    case 'gat':                                                                       // 갓
      cap();
      hb.add(new THREE.CylinderGeometry(0.36, 0.36, 0.014, 12), INK, 0, 0.115, 0);
      hb.add(new THREE.CylinderGeometry(0.11, 0.15, 0.2, 9), INK, 0, 0.22, 0);
      break;
    case 'satgat':                                                                    // 삿갓(순례자)
      cap();
      hb.add(new THREE.ConeGeometry(0.34, 0.2, 10), 0xc9a85a, 0, 0.2, 0);
      break;
    case 'veil':
      hb.add(new THREE.SphereGeometry(0.2, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.76), 0xfbf7ec, 0, 0.005, 0, 0.5);
      break;
    case 'nunveil':                                                                   // 수녀 너울: 흰 띠 + 검은 너울
      hb.add(new THREE.SphereGeometry(0.205, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.8), 0x2b2a2e, 0, 0.005, 0.01, 0.5);
      hb.add(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12, 1, true), 0xfbf7ec, 0, 0.07, 0, 0.3);
      break;
    case 'sangtu':                                                                    // 상투 + 망건
      cap();
      hb.add(new THREE.SphereGeometry(0.055, 7, 5), HAIR, 0, 0.2, 0.02);
      hb.add(new THREE.CylinderGeometry(0.176, 0.18, 0.035, 9), INK, 0, 0.07, 0);
      break;
    case 'jjok':                                                                      // 쪽머리 + 비녀
      cap();
      hb.add(new THREE.SphereGeometry(0.07, 7, 5), HAIR, 0, -0.04, 0.19);
      hb.add(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 5), 0xc9a85a, 0, -0.04, 0.2, 0, 0, Math.PI / 2);
      break;
    case 'jokduri':                                                                   // 쪽두리 + 쪽머리 + 비녀 + 긴 댕기(도투락)
      cap();
      hb.add(new THREE.CylinderGeometry(0.12, 0.15, 0.1, 8), 0x23202a, 0, 0.14, 0);                    // 검은 비단 쪽두리
      hb.add(new THREE.CylinderGeometry(0.125, 0.125, 0.016, 8), 0xe0b040, 0, 0.2, 0);                 // 금박 윗면
      for (let k = 0; k < 4; k++) hb.add(new THREE.SphereGeometry(0.016, 6, 4), k % 2 ? 0xd9344c : 0x4aa0d8, Math.cos(k * 1.57) * 0.13, 0.14, Math.sin(k * 1.57) * 0.13);   // 보석
      hb.add(new THREE.SphereGeometry(0.07, 7, 5), HAIR, 0, -0.04, 0.19);
      hb.add(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 5), 0xe0b040, 0, -0.04, 0.2, 0, 0, Math.PI / 2);   // 비녀
      hb.add(new THREE.BoxGeometry(0.045, 0.34, 0.03), HAIR, 0, -0.26, 0.19, -0.08);                   // 땋은 머리
      hb.add(new THREE.BoxGeometry(0.07, 0.16, 0.02), 0xd9344c, 0, -0.46, 0.21);                       // 도투락 댕기
      break;
    case 'daenggi':                                                                   // 댕기머리
      cap();
      hb.add(new THREE.BoxGeometry(0.05, 0.36, 0.04), HAIR, 0, -0.2, 0.17, -0.12);
      hb.add(new THREE.BoxGeometry(0.07, 0.1, 0.02), 0xb23a2e, 0, -0.4, 0.2);
      break;
    case 'long':                                                                      // 길게 늘어뜨린 머리(천사)
      cap();
      hb.add(new THREE.BoxGeometry(0.26, 0.32, 0.05), def.id === 'guardian' ? HAIR : 0x8a6a3a, 0, -0.14, 0.15, -0.1);
      break;
    default:
      cap();
  }
  head.add(hb.mesh()!);

  // ── 팔: 납작하게 접은 소매. 어깨(회전) → 벌림(고정) → 팔꿈치 → 손 ──
  const SPREAD = man ? 0.5 : 0.44;
  const sleeve = (rTop: number, rBot: number, len: number) => new THREE.CylinderGeometry(rTop, rBot, len, 6).scale(1, 1, 0.5);
  const stripes = [0xb23a2e, 0xd9b44a, 0x3d5a80, 0x5a7a4a];
  const cuffHex = L.child ? 0xfbf7ec : L.top === 0x232327 || L.top === 0x2b2a2e ? 0x232327 : 0xfbf7ec;
  const arm = (s: number) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.165, 1.07, 0); body.add(sh);
    const spread = new THREE.Group(); spread.rotation.z = s * SPREAD; sh.add(spread);
    const up = new Batch();
    if (L.child && !L.wings) stripes.slice(0, 2).forEach((c, i) => up.add(sleeve(0.045 + i * 0.011, 0.045 + (i + 1) * 0.011, 0.075), c, 0, -0.04 - i * 0.075, 0));   // 색동
    else up.add(sleeve(0.045, 0.068, 0.16), L.top, 0, -0.08, 0);
    spread.add(up.mesh()!);
    const el = new THREE.Group(); el.position.set(0, -0.16, 0); spread.add(el);
    const lo = new Batch();
    if (L.child && !L.wings) stripes.slice(2).forEach((c, i) => lo.add(sleeve(0.067 + i * 0.011, 0.067 + (i + 1) * 0.011, 0.075), c, 0, -0.035 - i * 0.075, 0));
    else lo.add(sleeve(0.068, 0.092, 0.14), L.top, 0, -0.07, 0);
    lo.add(sleeve(0.094, 0.097, 0.04), cuffHex, 0, -0.16, 0);                       // 끝동
    lo.add(new THREE.SphereGeometry(0.034, 7, 5), PAPER, 0, -0.21, 0);              // 손
    el.add(lo.mesh()!);
    const hand = new THREE.Object3D(); hand.position.set(0, -0.23, 0); el.add(hand);
    return { sh, el, hand };
  };
  const aL = arm(-1), aR = arm(1);

  // 오른손에 든 것 — 사장님 2026-11-24: 지팡이·풍선·막대기 등 아무것도 들지 않는다. 그래서 만들지 않는다(L.hold 는 쓰지 않음).
  if (HOLD_ITEMS && L.hold) {
    const g = new THREE.Group(); g.position.set(0, -0.21, 0); g.rotation.z = -SPREAD; aR.el.add(g);
    const h = new Batch();
    switch (L.hold) {
      case 'rosary':
        h.add(new THREE.TorusGeometry(0.05, 0.007, 5, 16), 0x4e3524, 0, -0.05, 0);
        h.add(new THREE.BoxGeometry(0.01, 0.06, 0.008), 0x4e3524, 0, -0.14, 0);
        h.add(new THREE.BoxGeometry(0.035, 0.01, 0.008), 0x4e3524, 0, -0.13, 0);
        break;
      case 'flower':
        h.add(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 4), 0x5a7a4a, 0, 0.08, 0);
        h.add(new THREE.ConeGeometry(0.05, 0.09, 6), 0xfbf7ec, 0, 0.22, 0, Math.PI);
        break;
      case 'book':
        h.add(new THREE.BoxGeometry(0.11, 0.15, 0.03), 0x6a2f2a, 0, -0.02, -0.03);
        h.add(new THREE.BoxGeometry(0.012, 0.07, 0.004), 0xc9a85a, 0, -0.01, -0.047);
        h.add(new THREE.BoxGeometry(0.04, 0.012, 0.004), 0xc9a85a, 0, 0.005, -0.047);
        break;
      case 'candle':
        h.add(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 7), 0xfbf7ec, 0, 0.06, 0);
        h.add(new THREE.ConeGeometry(0.018, 0.05, 6), 0xffb040, 0, 0.17, 0);
        break;
      case 'staff':
        h.add(new THREE.CylinderGeometry(0.014, 0.014, 1.5, 5), 0x6a4a2e, 0, 0.32, 0);
        break;
      case 'cane':
        h.add(new THREE.CylinderGeometry(0.013, 0.013, 0.82, 5), 0x4e3524, 0, -0.38, 0);
        break;
      case 'sword':                                                                   // 한지로 접은 칼
        h.add(new THREE.BoxGeometry(0.03, 0.62, 0.008), 0xe8e2d4, 0, 0.36, 0);
        h.add(new THREE.BoxGeometry(0.13, 0.02, 0.02), 0xc9a85a, 0, 0.05, 0);
        break;
      case 'flag':
        h.add(new THREE.CylinderGeometry(0.006, 0.006, 0.42, 4), 0x6a4a2e, 0, 0.16, 0);
        h.add(new THREE.BoxGeometry(0.16, 0.11, 0.004), 0xfbf7ec, 0.08, 0.31, 0);
        break;
      case 'horn':
        h.add(new THREE.ConeGeometry(0.035, 0.24, 8, 1, true), 0xc9a85a, 0, 0.1, -0.03, 0.4);
        break;
    }
    const m = h.mesh(); if (m) g.add(m);
  }

  // 천사만 가는 빛고리(머리 뒤 위). 그리기 1번
  let halo: THREE.Object3D | undefined;
  if (def.angel) {
    halo = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 6, 40),
      new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false }));
    halo.position.set(0, 1.56, 0.08);
    body.add(halo);
  }

  return { root, body, halo, armL: aL.sh, armR: aR.sh, elbowL: aL.el, elbowR: aR.el, handL: aL.hand, handR: aR.hand, head, wingL, wingR, def, phase: Math.random() * 6, idle: Math.random() * 10 };
}
