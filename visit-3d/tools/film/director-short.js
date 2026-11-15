// 명동대성당 3D 시연 영상 v3 (2026-11-10) — 약 78초 · 가브리엘 천사 · 10장면(v4: 종 줄 당기기·십자가의 길 추가). 브라우저 콘솔(rec.mjs)에서 실행.
// 캔버스만 녹화(mp4) → 127.0.0.1:5299 로 저장. 장면 시작 시각(marks)을 돌려줘 finish.swift 자막 시각으로 쓴다.
// 장면: 0 하늘에서 → 1 언덕 돌계단 → 2 정면·종탑 → 3 성모 동굴 초 봉헌 → 4 정문 열림 → 5 햇살 신랑 → 6 제대 봉헌초 → 7 옆면→뒷면 한 바퀴
// URL 은 ?nointro&avatar=gabriel 로 연다(인트로 생략 · 천사 고정).
window.__film = async (opts = {}) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  const V = window.__vhk, p = V.player, G = V.grade.uniforms;
  const T = V.camera.position.constructor; // THREE.Vector3
  const v3 = (x, y, z) => new T(x, y, z);
  const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const lerp = (a, b, u) => a + (b - a) * u;
  const marks = [], strikes = []; let t0rec = 0;
  const mark = (name) => marks.push({ t: +((performance.now() - t0rec) / 1000).toFixed(2), name });
  const hide = (on) => V.me.root.scale.setScalar(on ? 0.0001 : 1);
  // 땅 높이: 위에서 광선을 쏴 첫 물체(계단·땅)의 높이. 아바타는 뺀다
  const groundY = (x, z) => {
    const rc = new V.raycaster.constructor(v3(x, 30, z), v3(0, -1, 0), 0, 100); rc.camera = V.camera; // 스프라이트(이름표)는 camera 가 있어야 한다
    const mine = (o) => { for (let q = o; q; q = q.parent) if (q === V.me.root) return true; return false; };
    const h = rc.intersectObjects(V.scene.children, true).find((h) => !mine(h.object) && h.object.visible && !h.object.isSprite);
    return h ? h.point.y : null;
  };

  // ── 녹화 ──
  const canvas = V.renderer.domElement;
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: 'video/mp4;codecs=avc1.640028', videoBitsPerSecond: 18_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  G.uFade.value = 0; hide(true);
  // 노란 이동 고리(renderOrder 5 고리)와 금빛 길 안내 화살표(renderOrder 4, 0xffc21a)는 영상에서 숨긴다
  V.scene.traverse((o) => { if (o.isMesh && o.renderOrder === 5 && o.geometry?.type === 'RingGeometry') o.material.visible = false; if (o.isMesh && o.renderOrder === 4 && o.material?.color?.getHex?.() === 0xffc21a) o.visible = false; });
  rec.start(1000); t0rec = performance.now();

  // 카메라 이동: from→to 를 dur 초 동안(눈 위치·바라보는 곳 모두 보간)
  const move = async (from, to, dur, lookFrom, lookTo, fov = 60) => {
    const t0 = performance.now();
    while (true) {
      const u = Math.min(1, (performance.now() - t0) / 1000 / dur), e = ease(u);
      window.__cam = { p: [lerp(from.x, to.x, e), lerp(from.y, to.y, e), lerp(from.z, to.z, e)], t: [lerp(lookFrom.x, lookTo.x, e), lerp(lookFrom.y, lookTo.y, e), lerp(lookFrom.z, lookTo.z, e)], fov };
      if (u >= 1) break;
      await raf();
    }
  };
  const fade = async (a, b, dur) => { const t0 = performance.now(); while (true) { const u = Math.min(1, (performance.now() - t0) / 1000 / dur); G.uFade.value = lerp(a, b, u); if (u >= 1) break; await raf(); } };
  // 걸어가기(12 m 넘게 한 번에 주면 뛰므로 짧게 끊어 걷는다)
  const walk = async (pts, maxMs = 20000) => {
    const t0 = performance.now();
    for (const q of pts) {
      V.setMoveTarget(q);
      while (performance.now() - t0 < maxMs) { if (Math.hypot(p.pos.x - q.x, p.pos.z - q.z) < 0.6) break; await sleep(50); }
    }
  };

  // 0) 하늘에서 — 언덕 위를 지나 성당 정면으로 내려온다 (5.5초)
  mark('0-aerial');
  const camA = move(v3(-18, 16, 70), v3(-7, 9, 50), 3.6, v3(2, 16, -30), v3(0, 12, 2), 60);
  await fade(0, 1, 0.8);
  await camA;
  await fade(1, 0, 0.7);

  // 1) 언덕 돌계단을 오른다 — 천사, 어깨 뒤 낮은 카메라 (약 7.5초)
  const SX = 3.0, zStart = 51, zEnd = 44;
  const gy = groundY(SX, zStart);
  window.__cam = null; p.yaw = 0; p.pitch = -0.1; V.bodyYaw = 0;
  p.place(v3(SX, (gy ?? -4) + 0.1, zStart), 0); hide(false); await sleep(250);
  let follow = true; const camPos = v3(SX + 1.2, p.pos.y + 1.9, zStart + 4.6);
  (async () => { while (follow) { const tgt = v3(p.pos.x + 1.1, p.pos.y + 1.9, p.pos.z + 4.2); camPos.lerp(tgt, 0.08); window.__cam = { p: [camPos.x, camPos.y, camPos.z], t: [p.pos.x - 0.3, p.pos.y + 2.5, p.pos.z - 12], fov: 58 }; await raf(); } })();
  mark('1-stairs');
  await fade(0, 1, 0.8);
  await walk([v3(SX, 0, zEnd)], 5500);
  follow = false;
  await fade(1, 0, 0.7);

  // 4) 정문 — 문 앞에서 문이 열리고 걸어 들어간다 (약 8.5초, 3인칭 기본 카메라)
  window.__cam = null; p.place(v3(0.4, 1, 13.5), 0); p.yaw = 0; p.pitch = -0.08; V.bodyYaw = 0; hide(false);
  for (const d of V.space.doors) d.open = false;
  mark('4-door');
  await sleep(200);
  await fade(0, 1, 0.8);
  await walk([v3(0.3, 1, 10.5)], 3000);
  await sleep(400);
  for (const d of V.space.doors) d.open = true; V.sound?.ting?.();
  await sleep(1000);
  await walk([v3(0.3, 1, 6.5)], 3500);
  await fade(1, 0, 0.7);

  // 4b) 종 줄 — 줄 앞에서 줄 손잡이를 끌어내려 세 번 울린다(약 8초). 놀이판(HTML)은 캔버스 밖이라 안 찍히므로 팔 동작만 보여 준다
  {
    const r = V.space.bellRinger;
    p.place(r.pos, r.yaw); V.bodyYaw = r.yaw; hide(false); V.me.holdRope = true; V.me.pullAmt = 0;
    window.__cam = { p: [r.camPos.x, r.camPos.y, r.camPos.z], t: [r.camTarget.x, r.camTarget.y, r.camTarget.z], fov: 55 };
    mark('4b-bell');
    // 줄이 두 손 사이를 지나가게 — 앱(main.ts)이 놀이 중 매 프레임 하는 일을 그대로 한다
    const hA = v3(0, 0, 0), hB = v3(0, 0, 0); let ropeOn = true;
    (async () => { while (ropeOn) { V.me.root.updateMatrixWorld(true); V.me.handL.getWorldPosition(hA); V.me.handR.getWorldPosition(hB); V.space.fx.ropeGrab(hA.add(hB).multiplyScalar(0.5)); await raf(); } })();
    await sleep(300);
    await fade(0, 1, 0.8);
    for (let n = 1; n <= 3; n++) {
      let t0 = performance.now(); while (true) { const u = Math.min(1, (performance.now() - t0) / 900); V.me.pullAmt = ease(u); if (u >= 1) break; await raf(); }
      V.sound?.bellStrike?.(V.space.root, V.space.bellPos, n); strikes.push({ n, t: +((performance.now() - t0rec) / 1000).toFixed(2) });
      await sleep(350);
      t0 = performance.now(); while (true) { const u = Math.min(1, (performance.now() - t0) / 700); V.me.pullAmt = 1 - ease(u); if (u >= 1) break; await raf(); }
      await sleep(250);
    }
    V.me.holdRope = false; V.me.pullAmt = 0; ropeOn = false; V.space.fx.ropeGrab(null);
    await fade(1, 0, 0.7);
  }

  // 4d) 성수대 — 성수를 찍고 십자성호를 긋는다(약 6초). 놀이판(HTML)은 안 찍히므로 몸 동작과 물결만 보여 준다
  {
    const a = V.space.interactables.find((i) => i.kind === 'font').anchor;
    window.__cam = null; p.place(v3(a.x, 1, a.z + 0.9), 0); V.bodyYaw = 0; p.yaw = 0; hide(false); await sleep(300);
    const eye = v3(a.x - 0.3, a.y + 0.3, a.z - 1.0), look = v3(a.x - 0.2, a.y + 0.1, a.z + 0.9); // 성수대 맞은편에서 정면으로(기둥 촛대 사슬이 팔과 겹쳐 화살처럼 보이는 각도를 피함)
    window.__cam = { p: [eye.x, eye.y, eye.z], t: [look.x, look.y, look.z], fov: 55 };
    mark('4d-font');
    await fade(0, 1, 0.7);
    await sleep(600);
    V.sound?.play?.('drop', 0.7); V.space.fx.fontDip?.();
    await sleep(500);
    V.me.gesture = { kind: 'cross', start: V.me.idle, k: 1 };
    await sleep(3200);
    V.me.gesture = undefined;
    await fade(1, 0, 0.6);
  }

  // 4c) 십자가의 길 — 오른쪽 측랑 벽의 청동 부조 네 곳을 차례로 가까이서 훑는다(약 10초)
  {
    const zs = V.space.interactables.filter((i) => /^station\d+$/.test(i.id) && i.anchor.x > 0).sort((a, b) => b.anchor.z - a.anchor.z).map((i) => i.anchor.z);
    const pick = [zs[0], zs[3]].filter((z) => z != null);
    hide(true); window.__cam = null; p.place(v3(11.8, 1, zs[0] ?? -5.5), -Math.PI / 2);
    mark('4c-stations');
    let first = true;
    for (const z of pick) {
      const from = v3(12.6, 2.05, z + 1.7), to = v3(12.7, 2.15, z - 0.9);
      const cm = move(from, to, 1.7, v3(15, 2.45, z + 0.2), v3(15, 2.45, z - 0.2), 46);
      if (first) { await fade(0, 1, 0.6); first = false; } else await fade(0, 1, 0.25);
      await cm;
      await fade(1, 0, 0.25);
    }
    hide(false);
  }

  // 5) 신랑 — 사람은 측랑으로 비켜 두고, 카메라가 제대까지 천천히 나아간다(빛줄기, 8초)
  p.place(v3(-11, 1, -14), 0);
  await sleep(400);
  const navA = v3(0, 2.3, -8), navB = v3(0, 3.0, -18), lookA = v3(0, 5.5, -46), lookB = v3(0, 6.0, -46);
  mark('5-nave');
  const camN = move(navA, navB, 3, lookA, lookB, 62);
  await fade(0, 1, 0.5);
  await camN;

  // 6) 제대 — 3초. 봉헌대 앞에서 초가 켜진다
  const tbl = v3(-3.4, 1.55, -34.7);
  const tEye = v3(-1.6, 1.9, -31.6), tEye2 = v3(-2.4, 1.75, -32.6);
  mark('6-altar');
  await fade(1, 0, 0.01);
  const camT2 = move(tEye, tEye2, 3.0, tbl, tbl, 50);
  await fade(0, 1, 0.4);
  await sleep(500); V.applyCandle('c0', true, 0, 'Maria', true);
  await sleep(600); V.applyCandle('c2', true, 3, 'João', true);
  await camT2;
  await fade(1, 0, 0.5);

  // 7) 바깥 — 옆면에서 뒷면(후진)까지 하늘에서 한 바퀴 돌며 끝 (약 8초)
  hide(true); p.place(v3(-28, 1, -30), 0);
  await sleep(400);
  mark('7-exterior');
  const camX = move(v3(-46, 8, 16), v3(-34, 16, -62), 5.2, v3(0, 14, -12), v3(0, 9, -46), 58);
  await fade(0, 1, 0.8);
  await sleep(3600);
  await fade(1, 0, 1.2);
  await camX;
  mark('end');

  rec.stop(); await done;
  const blob = new Blob(chunks, { type: 'video/mp4' });
  window.__filmBlob = blob;
  await fetch('http://127.0.0.1:5299/' + (opts.name || 'vhk-film.mp4'), { method: 'POST', body: blob, headers: { 'Content-Type': 'application/octet-stream' } });
  window.__cam = null; G.uFade.value = 1; hide(false);
  return { mb: +(blob.size / 1e6).toFixed(1), marks, strikes };
};
