// 시험용 보기(?demo) — 가짜 초 100개와 가짜 기도 지향 100개로 «빛·결계·떠오르는 기도»를 미리 보는 단계.
// 실제 이용자 글이 아니다. 서버에 아무것도 보내거나 저장하지 않는다(기기 안에서만 그린다). 화면에 「시험용 가짜 데이터」를 밝힌다.
import * as THREE from 'three';

const WHO = ['가족', '부모님', '아내', '남편', '자녀', '손주', '형제자매', '친구', '이웃', '은인', '수도자', '사제', '순례자', '병든 이', '돌아가신 분', '나 자신', '직장 동료', '스승님', '군에 간 아들', '유학 간 딸'];
const WHAT = ['건강을 지켜 주소서', '마음에 평화가 깃들게 하소서', '하는 일이 잘 풀리게 하소서', '믿음이 더 깊어지게 하소서', '안전하게 지내게 하소서', '기쁜 소식이 오게 하소서', '고통 가운데 위로를 얻게 하소서', '시험을 잘 치르게 하소서', '화해하게 하소서', '영원한 안식을 주소서'];
const CLOSE = ['아멘.', '주님, 들어 주소서.', '성모님, 함께 빌어 주소서.', '감사드립니다.'];

/** 가짜 기도 지향 100개 — 겹치지 않게 짜 맞춘다 */
export function fakePrayers(n = 100): { who: string; text: string }[] {
  const out: { who: string; text: string }[] = [];
  for (let i = 0; i < n; i++) {
    const w = WHO[(i * 7) % WHO.length], a = WHAT[(i * 3 + Math.floor(i / 10)) % WHAT.length], c = CLOSE[i % CLOSE.length];
    out.push({ who: `시험 순례자 ${i + 1}`, text: `${w}의 ${a} ${c}` });
  }
  return out;
}

const palette = [0xfff1b8, 0xcfeaff, 0xffd0e0, 0xd8ffd0, 0xe6d4ff, 0xffe0b0, 0xbff3ee, 0xffc9a8];
export const demoBigColors = palette;

/** 떠오르는 기도 글 — 글 한 장이 순례자 앞쪽 공중으로 천천히 올라가며 나타났다 사라진다 */
export function createPrayerFloat(opts: { count: number; prayers: { who: string; text: string }[] }) {
  const group = new THREE.Group(); group.name = 'prayer-float';
  type Item = { s: THREE.Sprite; cv: HTMLCanvasElement; tex: THREE.CanvasTexture; born: number; life: number; base: THREE.Vector3; k: number };
  const items: Item[] = [];
  let next = 0;
  const wrap = (ctx: CanvasRenderingContext2D, text: string, maxW: number) => {
    const lines: string[] = []; let cur = '';
    for (const ch of text) { const t = cur + ch; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = ch; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  };
  const paint = (it: Item, p: { who: string; text: string }) => {
    const ctx = it.cv.getContext('2d')!; const W = it.cv.width, H = it.cv.height;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2);
    g.addColorStop(0, 'rgba(40,24,6,0.32)'); g.addColorStop(1, 'rgba(40,24,6,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(255,200,100,0.95)'; ctx.shadowBlur = 14;
    ctx.font = '600 30px "Noto Serif KR", AppleMyungjo, serif'; ctx.fillStyle = '#ffd98a';
    ctx.fillText(`🕯 ${p.who}`, W / 2, 52);
    ctx.font = '700 40px "Noto Serif KR", AppleMyungjo, serif'; ctx.fillStyle = '#fff4d8';
    const lines = wrap(ctx, p.text, W - 80).slice(0, 3);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 112 + i * 52));
    it.tex.needsUpdate = true;
  };
  for (let i = 0; i < opts.count; i++) {
    const cv = document.createElement('canvas'); cv.width = 640; cv.height = 280;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, opacity: 0, toneMapped: false, fog: false }));
    s.scale.set(6.4, 2.8, 1); s.renderOrder = 30; s.visible = false;
    group.add(s);
    items.push({ s, cv, tex, born: -999, life: 11, base: new THREE.Vector3(), k: i });
  }
  const dir = new THREE.Vector3(), side = new THREE.Vector3();
  return {
    group,
    /** 매 프레임: t 초, 순례자 위치, 순례자가 바라보는 방향(그 앞쪽에 띄운다) */
    update(t: number, player: THREE.Vector3, forward: THREE.Vector3) {
      dir.copy(forward); dir.y = 0; if (dir.lengthSq() < 1e-4) dir.set(0, 0, -1); dir.normalize(); side.set(-dir.z, 0, dir.x);
      for (const it of items) {
        let age = t - it.born;
        if (age > it.life) { // 새 글을 이어 받는다 — 순례자 앞쪽 7~15 m, 좌우로 흩어서
          const p = opts.prayers[next++ % opts.prayers.length]; paint(it, p);
          it.born = t - Math.random() * 0.2; age = 0; it.life = 10 + Math.random() * 4;
          const fwd = 9 + Math.random() * 8, lat = (Math.random() - 0.5) * 16;
          it.base.copy(player).addScaledVector(dir, fwd).addScaledVector(side, lat); it.base.y = player.y + 2.6 + Math.random() * 2.2;
          it.s.visible = true;
        }
        const f = Math.min(1, age / 1.4) * Math.min(1, (it.life - age) / 2.2);
        (it.s.material as THREE.SpriteMaterial).opacity = Math.max(0, f);
        it.s.position.set(it.base.x, it.base.y + age * 0.55, it.base.z);
      }
    },
    /** 처음에 글이 한꺼번에 뜨지 않고 차례로 뜨게 한다 */
    stagger(t: number) { items.forEach((it, i) => { it.born = t - it.life + i * 1.1; }); },
    dispose() { for (const it of items) { it.tex.dispose(); (it.s.material as THREE.Material).dispose(); } },
  };
}
