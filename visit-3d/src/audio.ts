// 효과음(초 켜는 소리·성수·헛당김)은 Web Audio 로 합성한다.
// 종소리(v3-7)는 실제 녹음 — 프라하 성 비투스 대성당 부활절 타종(Wikimedia Commons 「Prague st Vitus Easter ringing 2012」, 퍼블릭 도메인)에서
//   가장 우렁찬 14초를 잘라 public/audio/bell-peal.mp3 로 둔다. 줄을 한 번 당길 때는 같은 녹음의 다른 자리를 2.6초만 울리고 잦아들게 한다.
// 배경 음악(v2)은 저작권이 끝난 곡의 CC0 녹음 — 실내(v3-8부터): 드뷔시 「달빛」 피아노 연주(Wikimedia Commons, 퍼블릭 도메인) — 예전 바흐 오르간 녹음은 소리가 찢어지는 듯해 뺐다,
// 바깥: 그레고리오 성가 「Gaudeamus omnes」(christislord, Freesound 482679). 둘 다 CC0 1.0(출처 표기 의무 없음, 화면 아래 출처에 함께 적는다)
import * as THREE from 'three';

function bellBuffer(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate, dur = 6, n = sr * dur, buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  const f0 = 196;
  const partials: [number, number, number][] = [[0.5, 0.6, 3.6], [1, 1, 2.8], [1.19, 0.5, 2.2], [1.5, 0.45, 2.0], [2, 0.35, 1.6], [2.61, 0.2, 1.2], [3.01, 0.15, 1.0], [4.17, 0.08, 0.7]];
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, a = Math.min(1, t / 0.004);
    let s = 0;
    for (const [r, amp, dec] of partials) s += amp * Math.exp(-t / dec) * Math.sin(2 * Math.PI * f0 * r * t);
    d[i] = s * a;
    peak = Math.max(peak, Math.abs(d[i]));
  }
  for (let i = 0; i < n; i++) d[i] /= peak * 1.1;
  return buf;
}

/** 8초 고리 — 주파수를 1/8Hz 배수로 맞춰 이음매 없이 반복된다 */
function organBuffer(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate, dur = 8, n = sr * dur, buf = ctx.createBuffer(2, n, sr);
  const q = (f: number) => Math.round(f * dur) / dur;
  const notes = [130.81, 164.81, 196.0, 261.63].map(q);
  const harm: [number, number][] = [[1, 1], [2, 0.45], [3, 0.22], [4, 0.1]];
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let peak = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr, trem = 1 + 0.04 * Math.sin(2 * Math.PI * 5 * t + ch);
      let s = 0;
      for (const f of notes) for (const [h, a] of harm) s += a * Math.sin(2 * Math.PI * f * h * t + ch * 0.3);
      d[i] = s * trem;
      peak = Math.max(peak, Math.abs(d[i]));
    }
    for (let i = 0; i < n; i++) d[i] /= peak * 1.2;
  }
  return buf;
}

function tingBuffer(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate, n = Math.floor(sr * 0.6), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) { const t = i / sr; d[i] = 0.5 * Math.exp(-t / 0.15) * (Math.sin(2 * Math.PI * 1320 * t) + 0.4 * Math.sin(2 * Math.PI * 2640 * t)); }
  return buf;
}

/** 성수에 손끝이 닿는 물방울 소리 — 짧게 내려가는 사인 두 방울 */
function dropBuffer(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate, n = Math.floor(sr * 0.5), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const d1 = Math.exp(-t / 0.05) * Math.sin(2 * Math.PI * (900 + 1800 * Math.exp(-t / 0.03)) * t);
    const t2 = t - 0.14, d2 = t2 > 0 ? Math.exp(-t2 / 0.07) * Math.sin(2 * Math.PI * (700 + 1400 * Math.exp(-t2 / 0.035)) * t2) * 0.7 : 0;
    d[i] = 0.5 * (d1 + d2);
  }
  return buf;
}
/** 박자를 놓친 당김 — 줄이 헛도는 둔탁한 소리 */
function thudBuffer(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate, n = Math.floor(sr * 0.35), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  let seed = 7;
  for (let i = 0; i < n; i++) { const t = i / sr; seed = (seed * 16807) % 2147483647; const nz = seed / 2147483647 - 0.5; d[i] = Math.exp(-t / 0.06) * (0.6 * Math.sin(2 * Math.PI * 95 * t) + 0.5 * nz * Math.exp(-t / 0.02)); }
  return buf;
}

export class Sound {
  listener: THREE.AudioListener | null = null;
  enabled = true;
  private bellBuf?: AudioBuffer;
  private organBuf?: AudioBuffer;
  private tingBuf?: AudioBuffer;
  private dropBuf?: AudioBuffer;
  private thudBuf?: AudioBuffer;
  private pealBuf?: AudioBuffer;
  private organ?: THREE.PositionalAudio;
  private bgm: { el: HTMLAudioElement; gain: GainNode; level: number }[] = [];
  /** 종이 울리는 동안 배경 음악을 낮춘다 — 남은 시간(초)과 되돌아오는 시간 */
  private duckLeft = 0;
  private duckGain = 1;
  private musicHold = false; // 종 줄 놀이 중에는 음악을 완전히 멈춘다(v3-9)

  /** 사용자 동작(입장 버튼) 안에서 불러야 브라우저가 소리를 허용한다 */
  init(camera: THREE.Camera) {
    if (this.listener) return;
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    const ctx = this.listener.context;
    // 합성 종소리·오르간 지속음은 쓸 때 만든다 — 입장할 때 미리 만들면 1초쯤 화면이 멈추는데,
    // 실제 녹음(종 mp3 · 배경 음악)이 있으면 둘 다 쓰이지 않는다(2026-11-12)
    this.tingBuf = tingBuffer(ctx);
    this.dropBuf = dropBuffer(ctx);
    this.thudBuf = thudBuffer(ctx);
    void ctx.resume();
    new THREE.AudioLoader().load(`${import.meta.env.BASE_URL}audio/bell-peal.mp3`, (buf) => { this.pealBuf = buf; }, undefined, () => { /* 못 받으면 합성 종소리로 */ });
    // 배경 음악 두 곡 — 파일을 다 받기 전에도 흘려 재생(스트리밍), 반복
    const base = import.meta.env.BASE_URL;
    for (const src of [`${base}audio/calm-clairdelune.mp3`, `${base}audio/chant-gaudeamus.mp3`]) {
      const el = new Audio(src);
      el.loop = true; el.preload = 'auto'; el.crossOrigin = 'anonymous';
      const node = ctx.createMediaElementSource(el);
      const gain = ctx.createGain(); gain.gain.value = 0;
      node.connect(gain); gain.connect(this.listener.getInput());
      void el.play().catch(() => { /* 사용자 동작 뒤 다시 시도 */ });
      this.bgm.push({ el, gain, level: 0 });
    }
  }

  /** 배경 음악 섞기 — outdoor 1 = 바깥(성가), 0 = 실내(피아노). 매 프레임 부른다 */
  mixBgm(outdoor: number, dt: number) {
    if (!this.listener || this.bgm.length < 2) return;
    const want = [0.4 * (1 - outdoor), 0.3 * outdoor]; // v3-8: 실내는 잔잔한 피아노(드뷔시 「달빛」)를 아주 낮게 — 오르간은 찢어지는 느낌이라 뺐다
    // 종이 울리면 음악이 멈추다시피 낮아졌다가(0.3초) 종이 잦아들면 3초에 걸쳐 돌아온다
    this.duckLeft = Math.max(0, this.duckLeft - dt);
    const duckTo = this.duckLeft > 0 || this.musicHold ? 0 : 1;
    this.duckGain += (duckTo - this.duckGain) * Math.min(1, dt * (duckTo < this.duckGain ? 8 : 0.35));
    this.bgm.forEach((b, i) => {
      b.level += (want[i] - b.level) * Math.min(1, dt * 0.8);
      b.gain.gain.value = b.level * this.duckGain;
      if (this.enabled && b.el.paused) void b.el.play().catch(() => {});
    });
  }

  /** 종 줄 놀이가 열려 있는 동안 음악을 끈다(true) / 다시 서서히 켠다(false) */
  holdMusic(on: boolean) { this.musicHold = on; if (!on) this.duckLeft = Math.max(this.duckLeft, 1.5); }

  /** 사용자의 손짓 안에서 부른다 — 소리 장치를 깨우고 배경 음악을 다시 튼다(입장 화면을 건너뛴 경우) */
  unlock() {
    if (!this.listener) return;
    void this.listener.context.resume();
    if (this.enabled) for (const b of this.bgm) if (b.el.paused) void b.el.play().catch(() => { /* 다음 손짓에 */ });
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    this.listener?.setMasterVolume(on ? 1 : 0);
    if (on) void this.listener?.context.resume();
    for (const b of this.bgm) { if (on) void b.el.play().catch(() => {}); else b.el.pause(); }
  }

  /** 큰 종소리(세 번 성공·남이 울릴 때) — 실제 녹음 14초. 음악은 그동안 낮아진다 */
  bell(parent: THREE.Object3D, pos: THREE.Vector3, volume = 1) {
    if (!this.listener) return;
    const buf = this.pealBuf ?? (this.bellBuf ??= bellBuffer(this.listener.context)); if (!buf) return;
    const a = new THREE.PositionalAudio(this.listener);
    a.setBuffer(buf); a.setRefDistance(22); a.setRolloffFactor(0.4); a.setVolume(volume);
    a.position.copy(pos); parent.add(a); a.play();
    this.duckLeft = Math.max(this.duckLeft, buf.duration - 2.5);
    setTimeout(() => { a.stop(); parent.remove(a); a.disconnect(); }, buf.duration * 1000 + 300);
  }

  /** 줄을 한 번 당겼을 때(박자 맞음) — 같은 녹음의 다른 자리를 2.6초 울리고 잦아들게 한다. n: 몇 번째 성공(1~3) */
  bellStrike(parent: THREE.Object3D, pos: THREE.Vector3, n: number) {
    if (!this.listener) return;
    const buf = this.pealBuf ?? (this.bellBuf ??= bellBuffer(this.listener.context)); if (!buf) return;
    const a = new THREE.PositionalAudio(this.listener);
    const len = 2.6, start = this.pealBuf ? Math.min(buf.duration - len - 0.1, 0.4 + (n - 1) * 3.7) : 0;
    a.setBuffer(buf); a.setRefDistance(22); a.setRolloffFactor(0.4); a.setVolume(0.55 + n * 0.15);
    a.offset = start; a.duration = len;
    a.position.copy(pos); parent.add(a); a.play();
    const g = a.gain.gain, t0 = this.listener.context.currentTime;
    g.setValueAtTime(1, t0 + len - 1.1); g.linearRampToValueAtTime(0.0001, t0 + len);
    this.duckLeft = Math.max(this.duckLeft, len + 1.5);
    setTimeout(() => { a.stop(); parent.remove(a); a.disconnect(); }, len * 1000 + 200);
  }

  /** 짧은 효과음 — drop: 성수 물방울 · thud: 헛당김 */
  play(kind: 'drop' | 'thud', volume = 0.5) {
    const buf = kind === 'drop' ? this.dropBuf : this.thudBuf;
    if (!this.listener || !buf) return;
    const a = new THREE.Audio(this.listener);
    a.setBuffer(buf); a.setVolume(volume); a.play();
    setTimeout(() => a.disconnect(), 700);
  }

  ting() {
    if (!this.listener || !this.tingBuf) return;
    const a = new THREE.Audio(this.listener);
    a.setBuffer(this.tingBuf); a.setVolume(0.35); a.play();
    setTimeout(() => a.disconnect(), 800);
  }

  /** 오르간 지속음을 공간에 단다(없는 공간이면 null) */
  setOrgan(parent: THREE.Object3D | null, pos?: THREE.Vector3) {
    if (this.organ) { this.organ.stop(); this.organ.parent?.remove(this.organ); this.organ.disconnect(); this.organ = undefined; }
    if (!parent || !pos || !this.listener || this.bgm.length) return; // v2: 실제 오르간 녹음이 있으면 합성 지속음은 쓰지 않는다
    this.organBuf ??= organBuffer(this.listener.context);
    const a = new THREE.PositionalAudio(this.listener);
    a.setBuffer(this.organBuf); a.setLoop(true); a.setRefDistance(10); a.setRolloffFactor(1.2); a.setVolume(0.18);
    a.position.copy(pos); parent.add(a); a.play();
    this.organ = a;
  }
}
