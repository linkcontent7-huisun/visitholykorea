// v3-6 놀이 — 종 줄 리듬 당기기 · 성수 찍고 십자성호 긋기.
// 화면 위 덧판(DOM)만 만들고, 3D 쪽 효과(줄 움직임·물결·캐릭터 동작·소리)는 콜백으로 바깥(main.ts)에 맡긴다.

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => {
  const el = document.createElement(tag); if (cls) el.className = cls; if (text) el.textContent = text; return el;
};

function panel(kind: string): { root: HTMLElement; close(): void } {
  const root = h('section', `rite rite-${kind}`);
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'false');
  document.body.append(root);
  return { root, close: () => root.remove() };
}

// ── 종 줄 당기기 (v3-8: 손잡이를 직접 끌어내린다) ───────────────
export interface BellGameHooks {
  /** 손잡이를 끌어내리는 중 — p: 0(맨 위) … 1(맨 아래). 손을 떼면 0으로 돌아간다 */
  onDrag(p: number): void;
  /** 손잡이가 맨 아래까지 내려와 종이 한 번 울렸다 — count: 지금까지 친 횟수(1~3) */
  onStrike(count: number): void;
  /** 세 번을 다 쳤다 */
  onSuccess(): void;
  onClose(): void;
}
const NEED = 3;
const HIT = 0.96;          // 이 이상 내려오면 맨 아래에 닿은 것

/** 종 줄 놀이를 연다. 손잡이는 이용자가 끌어내린 만큼만 내려간다(스스로 움직이지 않는다).
 *  마우스·손가락으로 끌기 · 마우스 휠 아래로 · 스페이스/↓ 키를 누르고 있기 모두 된다.
 *  scored=false 면 「점수 없음」 안내를 보이는 연습판(소리는 그대로 난다) */
export function startBellGame(hooks: BellGameHooks, opts: { scored: boolean; note?: string; bonus?: number } = { scored: true }): () => void {
  const scored = opts.scored;
  const { root, close } = panel('bell');
  root.append(h('p', 'rite-eyebrow', '종 줄 당기기'));
  const msg = h('p', 'rite-msg', '줄 손잡이를 잡고 맨 아래까지 천천히 끌어내리세요 — 세 번 치면 끝납니다');
  root.append(msg);
  if (!scored) root.append(h('p', 'rite-note', opts.note ?? '※ 이번에는 소리만 납니다(포인트 없음)'));
  const track = h('div', 'rite-pull'); const rope = h('div', 'rite-pull-rope'); const grip = h('button', 'rite-grip', '🔔'); grip.type = 'button';
  grip.setAttribute('aria-label', '종 줄 손잡이 — 아래로 끌어내리세요');
  const end = h('div', 'rite-pull-end', '▼ 여기까지');
  track.append(rope, end, grip); root.append(track);
  const dots = h('div', 'rite-dots');
  const dotEls = Array.from({ length: NEED }, () => { const d = h('span', 'rite-dot'); dots.append(d); return d; });
  root.append(dots);
  const quit = h('button', 'rite-quit', '그만두기'); quit.type = 'button';
  root.append(quit);

  let p = 0, count = 0, done = false, locked = false, dragging = false, raf = 0, keyDown = false, last = performance.now();
  const travel = () => Math.max(1, track.clientHeight - grip.offsetHeight - 4);
  const show = () => { grip.style.transform = `translate(-50%, ${p * travel()}px)`; rope.style.height = `${p * travel() + grip.offsetHeight / 2}px`; end.classList.toggle('hot', p >= HIT * 0.9); hooks.onDrag(p); };
  const setP = (v: number) => { p = Math.min(1, Math.max(0, v)); show(); if (p >= HIT) strike(); };
  const springBack = () => { // 손을 떼거나 한 번 친 뒤 손잡이는 위로 되돌아 올라간다(이용자가 잡고 있지 않을 때만)
    cancelAnimationFrame(raf);
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (done || dragging) return;
      if (keyDown) { p = Math.min(1, p + dt * 0.9); show(); if (p >= HIT) { strike(); return; } }
      else { p = Math.max(0, p - dt * (locked ? 0.9 : 1.6)); show(); if (p <= 0 && locked) { locked = false; msg.textContent = count === 1 ? '댕— 좋아요, 한 번 더 끌어내리세요 (1/3)' : '댕— 마지막 한 번! (2/3)'; } }
      if (p > 0 || keyDown) raf = requestAnimationFrame(tick);
    };
    last = performance.now(); raf = requestAnimationFrame(tick);
  };
  const strike = () => {
    if (locked || done) return;
    locked = true; dragging = false; keyDown = false;
    count += 1; dotEls.forEach((d, i) => d.classList.toggle('on', i < count));
    root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
    hooks.onStrike(count);
    if (count >= NEED) {
      done = true; cancelAnimationFrame(raf);
      msg.textContent = scored ? `종지기 완료! 종탑의 종이 크게 울립니다 🔔${opts.bonus ? ` ⭐ +${opts.bonus}` : ''}\n다시 하려면 성당 안을 둘러보고 3분 뒤에 오세요` : '종지기 완료! 종이 크게 울립니다 🔔\n포인트는 3분 뒤부터 다시 오릅니다';
      root.classList.add('win'); grip.disabled = true;
      hooks.onSuccess();
      setTimeout(() => { removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKeyUp, true); close(); hooks.onClose(); }, 2200);
    } else springBack();
  };
  const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKeyUp, true); hooks.onDrag(0); close(); hooks.onClose(); };

  // 손잡이 끌기
  let y0 = 0, p0 = 0;
  grip.addEventListener('pointerdown', (e) => {
    if (locked || done) return;
    e.preventDefault(); dragging = true; y0 = e.clientY; p0 = p; cancelAnimationFrame(raf); grip.setPointerCapture(e.pointerId); grip.classList.add('held');
  });
  grip.addEventListener('pointermove', (e) => { if (dragging && !locked) setP(p0 + (e.clientY - y0) / travel()); });
  const release = () => { if (!dragging) return; dragging = false; grip.classList.remove('held'); if (!locked && !done) springBack(); };
  grip.addEventListener('pointerup', release); grip.addEventListener('pointercancel', release);
  // 마우스 휠을 아래로 굴려도 내려온다(스크롤하듯이)
  root.addEventListener('wheel', (e) => { if (locked || done) return; e.preventDefault(); cancelAnimationFrame(raf); setP(p + e.deltaY / (travel() * 1.6)); if (!locked && !done) { clearTimeout(wheelT); wheelT = window.setTimeout(springBack, 350); } }, { passive: false });
  let wheelT = 0;
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!keyDown && !locked && !done) { keyDown = true; dragging = false; springBack(); } }
    else if (e.code === 'Escape') { e.stopPropagation(); finish(); }
  };
  const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') { e.stopPropagation(); keyDown = false; } };
  addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true); // 붙잡기 단계에서 먼저 받아 점프(Space)가 되지 않게
  quit.addEventListener('click', finish);
  show();
  return finish;
}

// ── 성수 찍고 십자성호 긋기 ──────────────────────────────────
export interface CrossHooks {
  /** 손끝을 성수에 담갔다 */
  onDip(): void;
  /** 네 자리 가운데 하나를 맞게 짚었다(0 이마 · 1 가슴 · 2 왼쪽 어깨 · 3 오른쪽 어깨) */
  onStep(i: number): void;
  /** 성호를 다 그었다 */
  onDone(): void;
  onClose(): void;
}
const CROSS_STEPS = [
  { name: '이마', word: '성부와', x: 50, y: 14 },
  { name: '가슴', word: '성자와', x: 50, y: 50 },
  { name: '왼쪽 어깨', word: '성령의', x: 28, y: 36 },
  { name: '오른쪽 어깨', word: '이름으로 아멘', x: 72, y: 36 },
];

/** 성수대 놀이를 연다 — 성수 찍기 → 네 자리를 순서대로 짚어 십자성호. 돌려주는 함수를 부르면 닫힌다 */
export function startSignOfCross(hooks: CrossHooks): () => void {
  const { root, close } = panel('cross');
  root.append(h('p', 'rite-eyebrow', '성수대'));
  const msg = h('p', 'rite-msg', '성당에 들어서며 손끝에 성수를 찍고 십자성호를 긋습니다. 먼저 성수를 찍어 보세요.');
  root.append(msg);
  const figure = h('div', 'rite-figure'); // 뒤에서 본 사람(머리·어깨·몸) — 화면 속 내 캐릭터와 같은 방향
  figure.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="14" r="9" class="fig"/>
    <path d="M28 36 Q50 26 72 36 L70 78 Q50 84 30 78 Z" class="fig"/>
    <path d="M28 36 L18 62 M72 36 L82 62" class="fig-line"/></svg>`;
  const targets = CROSS_STEPS.map((s, i) => {
    const b = h('button', 'rite-spot', ''); b.type = 'button'; b.style.left = `${s.x}%`; b.style.top = `${s.y}%`;
    b.setAttribute('aria-label', s.name); b.dataset.i = String(i); b.hidden = true;
    const lab = h('span', 'rite-spot-label', s.name); b.append(lab);
    figure.append(b); return b;
  });
  root.append(figure);
  const words = h('p', 'rite-words', ''); root.append(words);
  const dip = h('button', 'rite-btn', '💧 성수 찍기'); dip.type = 'button';
  const quit = h('button', 'rite-quit', '그만두기'); quit.type = 'button';
  root.append(dip, quit);

  let step = -1, done = false;
  const finish = () => { if (done) return; done = true; removeEventListener('keydown', onKey, true); close(); hooks.onClose(); };
  const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') { e.stopPropagation(); finish(); } };
  addEventListener('keydown', onKey, true);
  dip.addEventListener('click', () => {
    if (step >= 0) return;
    step = 0; hooks.onDip();
    dip.hidden = true;
    msg.textContent = '젖은 손끝으로 이마 → 가슴 → 왼쪽 어깨 → 오른쪽 어깨를 차례로 짚으세요.';
    targets.forEach((b) => { b.hidden = false; });
    targets[0].classList.add('next');
  });
  targets.forEach((b) => b.addEventListener('click', () => {
    if (step < 0 || done) return;
    const i = Number(b.dataset.i);
    if (i !== step) { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); msg.textContent = `다음은 ${CROSS_STEPS[step].name}입니다.`; return; }
    b.classList.remove('next'); b.classList.add('done');
    words.textContent = CROSS_STEPS.slice(0, i + 1).map((s) => s.word).join(' ');
    hooks.onStep(i);
    step++;
    if (step < CROSS_STEPS.length) { targets[step].classList.add('next'); msg.textContent = `${CROSS_STEPS[step].name}`; return; }
    done = true; root.classList.add('win');
    msg.textContent = '십자성호를 그었습니다 🙏';
    hooks.onDone();
    setTimeout(() => { removeEventListener('keydown', onKey, true); close(); hooks.onClose(); }, 1700);
  }));
  quit.addEventListener('click', finish);
  return finish;
}
