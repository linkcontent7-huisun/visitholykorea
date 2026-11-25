import type * as THREE from 'three';
import type { MeshBVH } from 'three-mesh-bvh';
import type { SpaceId } from '../../shared/spaces.ts';

export type InteractKind = 'door' | 'candle' | 'bell' | 'info' | 'seat' | 'art' | 'portal' | 'font';

export interface Interactable {
  kind: InteractKind;
  id: string;
  title: string;
  body?: string;
  /** portal 의 목적지 */
  target?: SpaceId;
  /** seat: 인스턴스 번호 → 앉는 자리 */
  seatAt?: (instanceId: number) => { pos: THREE.Vector3; yaw: number };
  /** art: 작가 표시 */
  author?: string;
  /** candle: 이 촛대에 꽂힌 초 id 들(촛대가 여럿일 때 촛대별로 켠다) */
  group?: string[];
  /** 머리 위 떠 있는 안내 표지(아이콘 + 짧은 말) */
  badge?: string;
  /** 하이라이트 · 거리 계산 기준점 */
  anchor: THREE.Vector3;
}

export interface DoorRt {
  id: string;
  leaves: { pivot: THREE.Object3D; sign: number }[];
  /** 닫혀 있을 때 막는 영역(xz) */
  blocker: THREE.Box3;
  open: boolean;
  t: number;
}

export interface CandleRt {
  id: string;
  flame: THREE.Object3D;
  lit: boolean;
  phrase: number;
  by: string;
  /** v3-6: 직접 쓴 기도(비면 phrase 의 정해진 문구) */
  text?: string;
}

export interface Zone {
  name: string;
  box: THREE.Box3;
  /** 1 = 바깥(햇빛), 0 = 실내 */
  outdoor: number;
}

export interface Station {
  pos: THREE.Vector3;
  yaw: number;
  pitch: number;
  caption: string;
}

export interface WindowLight {
  pos: THREE.Vector3;
  /** 실내 쪽 법선 */
  inward: THREE.Vector3;
  color: THREE.Color;
}

export interface SpaceBuild {
  id: SpaceId;
  title: string;
  root: THREE.Group;
  bvh: MeshBVH;
  interactables: Interactable[];
  /** 레이캐스트 대상(userData.ia 로 Interactable 을 가리킨다) */
  pickables: THREE.Object3D[];
  doors: DoorRt[];
  candles: CandleRt[];
  zones: Zone[];
  spawn: { pos: THREE.Vector3; yaw: number };
  /** 여는 장면(드론샷)이 시작하는 자리 — 언덕 아래 ㄷ 계단 맨 아래. 있으면 입장할 때 여기서 날아올라 spawn(계단 위)의 캐릭터에게 내려앉는다 */
  introFrom?: THREE.Vector3;
  stations: Station[];
  windows: WindowLight[];
  /** 실내에 있을 때 숨겨도 되는 바깥 소품 */
  outdoorGroup?: THREE.Group;
  /** 바깥에서만 보이는 외관 외피(구내 지도 세션의 걸어 들어갈 수 있는 상세 외관) — 실내에서는 숨긴다 */
  shellGroup?: THREE.Object3D;
  organPos?: THREE.Vector3;
  bellPos?: THREE.Vector3;
  /** 실내 기준 바닥 높이(창 빛 무늬용) */
  floorY: number;
  /** 실내 범위(창 빛 무늬가 이 안에서만 보인다) */
  interior?: THREE.Box3;
  /** 화면에 늘 보여야 하는 자료 출처(OSM ODbL 등) */
  attribution?: string;
  /** v3-6 놀이 효과 — 종 줄 당기기(힘 0~1) · 성수에 손을 담글 때 물결 */
  fx?: { bellPull?(strength: number): void; fontDip?(): void; ropeGrab?(hand: THREE.Vector3 | null): void };
  /** v3-7 종지기 자리 — 놀이 때 캐릭터가 서는 곳·바라보는 방향과 옆에서 보는 카메라 */
  bellRinger?: { pos: THREE.Vector3; yaw: number; camPos: THREE.Vector3; camTarget: THREE.Vector3 };
  update(dt: number, t: number): void;
}
