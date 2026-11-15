// 1인칭 이동 — 캡슐 충돌(three-mesh-bvh) · 중력 · 앉기 · 안내 투어 미끄러지기
import * as THREE from 'three';
import type { MeshBVH } from 'three-mesh-bvh';
import type { DoorRt } from './spaces/types.ts';

const R = 0.32, HEIGHT = 1.7, EYE = 1.6, SIT_EYE = 1.15, GRAVITY = -24;

export interface MoveInput { x: number; z: number; run: boolean }

export class Player {
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  onGround = false;
  sitting: { pos: THREE.Vector3; yaw: number; back: THREE.Vector3 } | null = null;
  private glide: { from: THREE.Vector3; to: THREE.Vector3; y0: number; y1: number; p0: number; p1: number; t: number; dur: number; done?: () => void } | null = null;
  private seg = new THREE.Line3();
  private tmpBox = new THREE.Box3();
  private triP = new THREE.Vector3();
  private capP = new THREE.Vector3();
  private delta = new THREE.Vector3();

  get eye() { return this.sitting ? SIT_EYE : EYE; }
  get gliding() { return !!this.glide; }

  place(p: THREE.Vector3, yaw: number) {
    this.pos.copy(p); this.vel.set(0, 0, 0); this.yaw = yaw; this.pitch = 0;
    this.sitting = null; this.glide = null;
  }

  sit(at: { pos: THREE.Vector3; yaw: number }) {
    this.sitting = { pos: at.pos.clone(), yaw: at.yaw, back: this.pos.clone() };
    this.glide = null;
    this.pos.copy(at.pos); this.yaw = at.yaw; this.pitch = 0.05; this.vel.set(0, 0, 0);
  }

  stand() {
    if (!this.sitting) return;
    this.pos.copy(this.sitting.back);
    this.sitting = null;
  }

  glideTo(to: THREE.Vector3, yaw: number, pitch: number, dur = 2.2, done?: () => void) {
    this.stand();
    // 가장 짧은 방향으로 돈다
    let y0 = this.yaw;
    while (yaw - y0 > Math.PI) y0 += Math.PI * 2;
    while (yaw - y0 < -Math.PI) y0 -= Math.PI * 2;
    this.glide = { from: this.pos.clone(), to: to.clone(), y0, y1: yaw, p0: this.pitch, p1: pitch, t: 0, dur, done };
  }

  cancelGlide() { this.glide = null; }

  look(dx: number, dy: number) {
    this.yaw -= dx;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - dy));
  }

  update(dt: number, input: MoveInput, bvh: MeshBVH, doors: DoorRt[]) {
    if (this.glide) {
      const g = this.glide;
      g.t = Math.min(1, g.t + dt / g.dur);
      const e = g.t < 0.5 ? 2 * g.t * g.t : 1 - Math.pow(-2 * g.t + 2, 2) / 2;
      this.pos.lerpVectors(g.from, g.to, e);
      this.yaw = g.y0 + (g.y1 - g.y0) * e;
      this.pitch = g.p0 + (g.p1 - g.p0) * e;
      if (g.t >= 1) { this.glide = null; g.done?.(); }
      return;
    }
    if (this.sitting) {
      if (Math.abs(input.x) > 0.2 || Math.abs(input.z) > 0.2) this.stand();
      else return;
    }
    const steps = 4, h = Math.min(dt, 0.05) / steps;
    const speed = input.run ? 5.0 : 2.4; // v2: 사람 걸음에 가깝게(2.4 m/s — 화면이 넓어 실제 1.4 보다 조금 빠르게)
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const mx = (fx * input.z + rx * input.x) * speed, mz = (fz * input.z + rz * input.x) * speed;
    for (let i = 0; i < steps; i++) {
      this.vel.y += GRAVITY * h;
      const start = this.pos.clone();
      this.pos.x += mx * h; this.pos.z += mz * h; this.pos.y += this.vel.y * h;
      this.collide(bvh);
      this.blockDoors(doors);
      this.delta.subVectors(this.pos, start);
      this.onGround = this.delta.y > Math.abs(h * this.vel.y * 0.25);
      if (!this.onGround && this.vel.y <= 0) {
        // 계단·경사를 내려갈 때 바닥에 붙인다(0.35m 이내)
        const d = this.groundDist(bvh);
        if (d !== null && d < 0.3 + 0.35) { this.pos.y -= d - 0.3; this.onGround = true; }
      }
      if (this.onGround) this.vel.y = 0;
    }
    if (this.pos.y < -20) this.vel.set(0, 0, 0); // 호출하는 쪽이 출발점으로 되돌린다
  }

  private collide(bvh: MeshBVH) {
    const s = this.seg;
    s.start.set(this.pos.x, this.pos.y + R, this.pos.z);
    s.end.set(this.pos.x, this.pos.y + HEIGHT - R, this.pos.z);
    this.tmpBox.makeEmpty().expandByPoint(s.start).expandByPoint(s.end).expandByScalar(R);
    bvh.shapecast({
      intersectsBounds: (b) => b.intersectsBox(this.tmpBox),
      intersectsTriangle: (tri) => {
        const d = tri.closestPointToSegment(s, this.triP, this.capP);
        if (d < R) {
          const dir = this.capP.sub(this.triP).normalize();
          s.start.addScaledVector(dir, R - d);
          s.end.addScaledVector(dir, R - d);
        }
      },
    });
    this.pos.set(s.start.x, s.start.y - R, s.start.z);
  }

  private groundRay = new THREE.Ray();
  /** 발 위 0.3m 에서 아래로 바닥까지 거리 */
  private groundDist(bvh: MeshBVH): number | null {
    this.groundRay.origin.set(this.pos.x, this.pos.y + 0.3, this.pos.z);
    this.groundRay.direction.set(0, -1, 0);
    const hit = bvh.raycastFirst(this.groundRay, THREE.DoubleSide);
    return hit ? hit.distance : null;
  }

  /** 닫힌 문은 문틀 영역 밖으로 밀어낸다(앞뒤 중 가까운 쪽) */
  private blockDoors(doors: DoorRt[]) {
    for (const d of doors) {
      if (d.t > 0.6) continue;
      const b = d.blocker;
      if (this.pos.x < b.min.x - R || this.pos.x > b.max.x + R || this.pos.z < b.min.z - R || this.pos.z > b.max.z + R) continue;
      const cz = (b.min.z + b.max.z) / 2;
      this.pos.z = this.pos.z > cz ? b.max.z + R : b.min.z - R;
    }
  }

  applyCamera(cam: THREE.Camera) {
    cam.position.set(this.pos.x, this.pos.y + this.eye, this.pos.z);
    cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
