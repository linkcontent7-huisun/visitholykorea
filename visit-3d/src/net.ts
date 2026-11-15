// 실시간 동기화 — 공간마다 Colyseus 방 하나. 위치는 10Hz 로 보내고 받는 쪽에서 보간한다.
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Client, Callbacks, type Room } from '@colyseus/sdk';
import type { SpaceId } from '../shared/spaces.ts';
import { buildAvatar, animateAvatar, decodeNick, type AvatarRig } from './avatars.ts';

interface VisitorState { nick: string; color: string; x: number; y: number; z: number; yaw: number; sit: boolean }
interface CandleState { lit: boolean; phrase: number; by: string; at: number; text?: string }

export interface NetHandlers {
  onCount(n: number): void;
  onDoor(id: string, open: boolean): void;
  onCandle(id: string, c: CandleState): void;
  onReactCount(key: string, n: number): void;
  onBell(id: string): void;
  onReact(art: string, kind: string, from: string): void;
  onSay(from: string, idx: number): void;
  onStatus(s: 'online' | 'offline' | 'connecting'): void;
}

class Avatar {
  group = new THREE.Group();
  target = new THREE.Vector3();
  targetYaw = 0;
  sit = false;
  label: HTMLDivElement;
  bubble: HTMLDivElement;
  private bubbleTimer = 0;

  rig: AvatarRig;
  private last = new THREE.Vector3();
  private speed = 0;
  private t = 0;
  constructor(v: VisitorState) {
    // 별명 끝의 번호로 그 사람이 고른 캐릭터를 그린다(없으면 별명으로 정해지는 캐릭터)
    this.rig = buildAvatar(decodeNick(v.nick).def);
    this.group.add(this.rig.root);

    const tag = document.createElement('div');
    tag.className = 'tag';
    this.label = document.createElement('div');
    this.label.className = 'nick';
    this.label.textContent = decodeNick(v.nick).name;
    this.bubble = document.createElement('div');
    this.bubble.className = 'bubble';
    tag.append(this.bubble, this.label);
    const obj = new CSS2DObject(tag);
    obj.position.set(0, 2.15, 0);
    this.group.add(obj);
    this.set(v, true);
  }

  set(v: VisitorState, snap = false) {
    this.target.set(v.x, v.y, v.z);
    this.targetYaw = v.yaw;
    this.sit = v.sit;
    this.label.textContent = decodeNick(v.nick).name;
    if (snap) { this.group.position.copy(this.target); this.group.rotation.y = v.yaw; }
  }

  say(text: string) {
    this.bubble.textContent = text;
    this.bubble.classList.add('show');
    clearTimeout(this.bubbleTimer);
    this.bubbleTimer = window.setTimeout(() => this.bubble.classList.remove('show'), 4000);
  }

  update(dt: number) {
    const k = 1 - Math.exp(-10 * dt);
    this.group.position.lerp(this.target, k);
    let dy = this.targetYaw - this.group.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    this.group.rotation.y += dy * k;
    // 걸음 속도로 팔다리·날개를 움직인다
    this.t += dt;
    const moved = Math.hypot(this.group.position.x - this.last.x, this.group.position.z - this.last.z) / Math.max(dt, 1e-3);
    this.speed += (moved - this.speed) * Math.min(1, dt * 8);
    this.last.copy(this.group.position);
    animateAvatar(this.rig, dt, this.speed, this.t, this.sit);
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose?.();
      if (o instanceof CSS2DObject) o.element.remove();
    });
  }
}

/**
 * 실시간 방 서버 주소. 빌드 때 VITE_ROOM_URL 로 정한다(예: https://visitholykorea.axcamp.com).
 * 비우면 페이지와 같은 곳(location.origin) — host-server 처럼 정적 파일과 방 서버를 한 프로세스가 맡을 때.
 * Vercel 처럼 정적 파일만 올리는 곳에서는 반드시 넣는다(Vercel 은 WebSocket 서버를 띄우지 못한다).
 * 방 서버에 닿지 못하면 혼자 보기(오프라인)로 계속 동작한다.
 */
const ROOM_URL = ((import.meta.env.VITE_ROOM_URL as string | undefined) ?? '').trim().replace(/\/+$/, '') || location.origin;

export class Net {
  private client = new Client(ROOM_URL);
  room: Room | null = null;
  avatars = new Map<string, Avatar>();
  private lastSent = 0;
  private lastPose = '';
  private joinSeq = 0;

  constructor(private scene: THREE.Scene, private h: NetHandlers) {}

  get online() { return !!this.room; }
  get sessionId() { return this.room?.sessionId ?? ''; }

  async join(spaceId: SpaceId, nick: string): Promise<boolean> {
    const seq = ++this.joinSeq;
    await this.leave();
    this.h.onStatus('connecting');
    try {
      const room = await this.client.joinOrCreate('space', { spaceId, nick });
      if (seq !== this.joinSeq) { void room.leave(); return false; }
      this.room = room;
      this.bind(room);
      this.h.onStatus('online');
      return true;
    } catch (e) {
      console.warn('[net] 실시간 방에 들어가지 못했다 — 혼자 보기로 진행', e);
      this.h.onStatus('offline');
      return false;
    }
  }

  async leave() {
    const r = this.room;
    this.room = null;
    for (const a of this.avatars.values()) { this.scene.remove(a.group); a.dispose(); }
    this.avatars.clear();
    if (r) { try { await r.leave(); } catch { /* 이미 끊김 */ } }
  }

  private bind(room: Room) {
    const cb: any = Callbacks.get(room as any);
    const count = () => this.h.onCount((room.state as any).visitors?.size ?? 1);
    cb.onAdd('visitors', (v: VisitorState, id: string) => {
      count();
      if (id === room.sessionId) return;
      const a = new Avatar(v);
      this.avatars.set(id, a);
      this.scene.add(a.group);
      cb.onChange(v, () => a.set(v));
    });
    cb.onRemove('visitors', (_v: VisitorState, id: string) => {
      count();
      const a = this.avatars.get(id);
      if (a) { this.scene.remove(a.group); a.dispose(); this.avatars.delete(id); }
    });
    cb.onAdd('doors', (open: boolean, id: string) => this.h.onDoor(id, open));
    cb.onChange('doors', (id: string, open: boolean) => this.h.onDoor(id, open));
    cb.onAdd('candles', (c: CandleState, id: string) => {
      this.h.onCandle(id, c);
      cb.onChange(c, () => this.h.onCandle(id, c));
    });
    cb.onAdd('reacts', (n: number, key: string) => this.h.onReactCount(key, n));
    cb.onChange('reacts', (key: string, n: number) => this.h.onReactCount(key, n));
    room.onMessage('bell', (m: { id: string }) => this.h.onBell(m.id));
    room.onMessage('react', (m: { art: string; kind: string; from: string }) => this.h.onReact(m.art, m.kind, m.from));
    room.onMessage('say', (m: { from: string; idx: number }) => this.h.onSay(m.from, m.idx));
    room.onLeave(() => {
      if (this.room === room) { this.room = null; this.h.onStatus('offline'); }
    });
  }

  send(type: string, msg: unknown) { this.room?.send(type, msg); }

  sendPose(p: THREE.Vector3, yaw: number, sit: boolean, now: number) {
    if (!this.room || now - this.lastSent < 100) return;
    const key = `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)},${yaw.toFixed(2)},${sit}`;
    if (key === this.lastPose && now - this.lastSent < 2000) return;
    this.lastSent = now; this.lastPose = key;
    this.room.send('move', { x: p.x, y: p.y, z: p.z, yaw, sit });
  }

  avatarOf(id: string) { return this.avatars.get(id); }

  update(dt: number) { for (const a of this.avatars.values()) a.update(dt); }
}
