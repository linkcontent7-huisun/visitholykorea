// 명동대성당 3D 시연 영상 v3 (2026-11-10) — 약 60초 · 가브리엘 천사 · 8장면. 브라우저 콘솔(rec.mjs)에서 실행.
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
  const marks = []; let t0rec = 0;
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
  const camA = move(v3(-22, 20, 84), v3(-7, 9, 50), 5.5, v3(2, 16, -30), v3(0, 12, 2), 60);
  await fade(0, 1, 1.2);
  await camA;
  await fade(1, 0, 0.7);

  // 1) 언덕 돌계단을 오른다 — 천사, 어깨 뒤 낮은 카메라 (약 7.5초)
  const SX = 3.0, zStart = 55, zEnd = 44;
  const gy = groundY(SX, zStart);
  window.__cam = null; p.yaw = 0; p.pitch = -0.1; V.bodyYaw = 0;
  p.place(v3(SX, (gy ?? -4) + 0.1, zStart), 0); hide(false); await sleep(250);
  let follow = true; const camPos = v3(SX + 1.2, p.pos.y + 1.9, zStart + 4.6);
  (async () => { while (follow) { const tgt = v3(p.pos.x + 1.1, p.pos.y + 1.9, p.pos.z + 4.2); camPos.lerp(tgt, 0.08); window.__cam = { p: [camPos.x, camPos.y, camPos.z], t: [p.pos.x - 0.3, p.pos.y + 2.5, p.pos.z - 12], fov: 58 }; await raf(); } })();
  mark('1-stairs');
  await fade(0, 1, 0.8);
  await walk([v3(SX, 0, zStart - 9), v3(SX, 0, zEnd)], 8500);
  follow = false;
  await fade(1, 0, 0.7);

  // 2) 정면·종탑을 올려다보며 다가간다 (5초)
  hide(true); p.place(v3(-10, 1, 40), 0);
  mark('2-facade');
  const camF = move(v3(-2.5, 1.8, 46), v3(-1.2, 2.2, 27), 5, v3(0, 24, 6), v3(0, 9, 6), 60);
  await fade(0, 1, 0.8);
  await camF;
  await fade(1, 0, 0.7);

  // 3) 성모 동굴 — 넓게 보여 주며 걸어가 유리 봉헌함에 초를 켠다 (약 9초). 베르나데트상(동굴 좌표 -2.9, 2.4)을 피한다
  const mx = 17.5, mz = 27, yaw = -1.1;
  const rot = (x, z) => v3(mx + x * Math.cos(yaw) + z * Math.sin(yaw), 0, mz - x * Math.sin(yaw) + z * Math.cos(yaw));
  const front = rot(-0.8, 6.5), box = rot(-4.3, 2.2);
  window.__cam = null; p.place(v3(front.x, 1, front.z), 0); hide(false); await sleep(300);
  const wideEye = rot(2.5, 9.5); wideEye.y = 2.1; const wideEye2 = rot(0.5, 7.5); wideEye2.y = 1.9;
  const grot = rot(0.3, -0.6); grot.y = 2.0;
  mark('3-grotto');
  const camP = move(wideEye, wideEye2, 4.5, grot, grot, 58);
  await fade(0, 1, 0.8);
  await walk([v3(box.x, 1, box.z)], 4500);
  await camP;
  // 초를 켠다 — 봉헌함 왼쪽 앞에서(베르나데트상이 화면에 들지 않게), 한 자루씩
  const cupEye = rot(-3.9, 3.0); cupEye.y = 1.5; const cupLook = rot(-3.4, 1.0); cupLook.y = 1.05;
  const aside = rot(0.5, 1.3); p.place(v3(aside.x, 1, aside.z), 0); V.bodyYaw = yaw - Math.PI / 2; hide(true);
  const camC = move(wideEye2, cupEye, 2.2, grot, cupLook, 48);
  await sleep(800); V.sound?.ting?.(); V.applyCandle('c6', true, 0, '마리아', true);
  await sleep(750); V.applyCandle('c7', true, 2, 'Lucas', true);
  await sleep(750); V.applyCandle('c9', true, 1, 'Anna', true);
  await camC; await sleep(1000);
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
  await sleep(1400);
  await walk([v3(0.2, 1, 4), v3(0.2, 1, 1)], 6000);
  await fade(1, 0, 0.7);

  // 5) 신랑 — 사람은 측랑으로 비켜 두고, 카메라가 제대까지 천천히 나아간다(빛줄기, 8초)
  p.place(v3(-11, 1, -14), 0);
  await sleep(400);
  const navA = v3(0, 2.3, -5), navB = v3(0, 3.6, -27), lookA = v3(0, 5.5, -46), lookB = v3(0, 6.0, -46);
  mark('5-nave');
  const camN = move(navA, navB, 8, lookA, lookB, 62);
  await fade(0, 1, 1.0);
  await camN;

  // 6) 제대 앞 봉헌대 — 초가 하나씩 켜진다 (약 5.5초)
  const tbl = v3(-3.4, 1.55, -34.7);
  const tEye = v3(-1.6, 1.9, -31.6), tEye2 = v3(-2.4, 1.75, -32.6);
  mark('6-altar');
  await move(navB, tEye, 1.8, lookB, tbl, 55);
  const camT2 = move(tEye, tEye2, 3.8, tbl, tbl, 50);
  await sleep(300); V.applyCandle('c0', true, 0, 'Maria', true);
  await sleep(700); V.applyCandle('c2', true, 3, 'João', true);
  await sleep(700); V.applyCandle('c4', true, 5, '요셉', true);
  await camT2;
  await fade(1, 0, 0.7);

  // 7) 바깥 — 옆면에서 뒷면(후진)까지 하늘에서 한 바퀴 돌며 끝 (약 8초)
  hide(true); p.place(v3(-28, 1, -30), 0);
  await sleep(400);
  mark('7-exterior');
  const camX = move(v3(-46, 8, 16), v3(-32, 17, -84), 7.5, v3(0, 14, -12), v3(0, 9, -46), 58);
  await fade(0, 1, 0.8);
  await sleep(5000);
  await fade(1, 0, 1.7);
  await camX;
  mark('end');

  rec.stop(); await done;
  const blob = new Blob(chunks, { type: 'video/mp4' });
  window.__filmBlob = blob;
  await fetch('http://127.0.0.1:5299/' + (opts.name || 'vhk-film.mp4'), { method: 'POST', body: blob, headers: { 'Content-Type': 'application/octet-stream' } });
  window.__cam = null; G.uFade.value = 1; hide(false);
  return { mb: +(blob.size / 1e6).toFixed(1), marks };
};
