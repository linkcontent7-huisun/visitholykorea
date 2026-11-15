// 명동대성당 3D 시연 영상 — 브라우저 콘솔에서 실행(로컬 개발 화면). 캔버스만 녹화(mp4) → 127.0.0.1:5299 로 저장
window.__film = async (opts = {}) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const V = window.__vhk, p = V.player, G = V.grade.uniforms;
  const T = V.camera.position.constructor; // THREE.Vector3
  const v3 = (x, y, z) => new T(x, y, z);
  const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const lerp = (a, b, u) => a + (b - a) * u;
  const log = (m) => { (window.__filmLog ??= []).push(`${(performance.now() / 1000).toFixed(1)} ${m}`); };

  // ── 녹화 ──
  const canvas = V.renderer.domElement;
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: 'video/mp4;codecs=avc1.640028', videoBitsPerSecond: 18_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  rec.start(1000);
  log('rec start');

  // 카메라 이동: from→to 를 dur 초 동안(눈 위치·바라보는 곳 모두 보간)
  const move = async (from, to, dur, lookFrom, lookTo, fov = 60) => {
    const t0 = performance.now();
    while (true) {
      const u = Math.min(1, (performance.now() - t0) / 1000 / dur), e = ease(u);
      window.__cam = { p: [lerp(from.x, to.x, e), lerp(from.y, to.y, e), lerp(from.z, to.z, e)], t: [lerp(lookFrom.x, lookTo.x, e), lerp(lookFrom.y, lookTo.y, e), lerp(lookFrom.z, lookTo.z, e)], fov };
      if (u >= 1) break;
      await new Promise((r) => requestAnimationFrame(r));
    }
  };
  const fade = async (a, b, dur) => { const t0 = performance.now(); while (true) { const u = Math.min(1, (performance.now() - t0) / 1000 / dur); G.uFade.value = lerp(a, b, u); if (u >= 1) break; await new Promise((r) => requestAnimationFrame(r)); } };
  // 걸어가기(12 m 넘게 한 번에 주면 뛰므로 짧게 끊어 걷는다)
  const walk = async (pts, maxMs = 20000) => {
    const t0 = performance.now();
    for (const q of pts) {
      V.setMoveTarget(q);
      while (performance.now() - t0 < maxMs) { if (Math.hypot(p.pos.x - q.x, p.pos.z - q.z) < 0.6) break; await sleep(50); }
    }
  };

  // 1) 여는 장면(언덕 위 드론) — 입장하면 자동으로 10초 재생된다. 끝날 때까지 기다린다
  let k = 0; while (document.body.classList.contains('cinema') && k < 300) { await sleep(100); k++; }
  log('intro done');

  // 2) 언덕길을 걸어 오른다 — 3인칭(카메라 = 기본 어깨 뒤)
  p.yaw = 0; p.pitch = -0.12;
  p.place(v3(3.5, p.pos.y + 0.3, p.pos.z), 0); await sleep(200); // 출발점 흩어짐을 없애고 길 한가운데서
  const sp = p.pos.clone();
  // 뒤따르는 카메라(어깨 뒤 낮게, 걸음에 맞춰 부드럽게) — 소나무 가지 아래로
  let follow = true; const camPos = v3(sp.x + 1.2, sp.y + 2.0, sp.z + 4.2);
  (async () => { while (follow) { const tgt = v3(p.pos.x + 1.1, p.pos.y + 1.9, p.pos.z + 3.8); camPos.lerp(tgt, 0.08); window.__cam = { p: [camPos.x, camPos.y, camPos.z], t: [p.pos.x - 0.3, p.pos.y + 2.4, p.pos.z - 12], fov: 58 }; await new Promise((r) => requestAnimationFrame(r)); } })();
  await walk([v3(sp.x, sp.y, sp.z - 7), v3(3.5, sp.y, sp.z - 14), v3(3.5, sp.y, sp.z - 20)], 10000);
  follow = false;
  log('walked hill');
  await fade(1, 0, 0.8);

  // 3) 성모 동굴 — 넓게 보여 주고, 걸어가서 유리 봉헌함에 초를 켠다
  const mx = 17.5, mz = 27, yaw = -1.1;
  const rot = (x, z) => v3(mx + x * Math.cos(yaw) + z * Math.sin(yaw), 0, mz - x * Math.sin(yaw) + z * Math.cos(yaw));
  const front = rot(-0.5, 6.5), box = rot(-3.4, 1.9);
  p.place(v3(front.x, 1, front.z), 0); await sleep(300);
  const wideEye = rot(2.5, 9.5); wideEye.y = 2.1; const wideEye2 = rot(0.5, 7.5); wideEye2.y = 1.9;
  const grot = rot(0.3, -0.6); grot.y = 2.0;
  const camP = move(wideEye, wideEye2, 7, grot, grot, 58);
  await fade(0, 1, 0.8);
  await walk([v3(box.x, 1, box.z)], 6000);
  await camP;
  // 초를 켠다 — 한 자루씩
  const cupEye = rot(-3.4, 3.2); cupEye.y = 1.55; const cupLook = rot(-3.4, 1.7); cupLook.y = 1.05;
  // 초를 켜는 동안 사람은 봉헌함 옆(카메라 시야 밖)으로 비켜 선다
  const aside = rot(0.5, 1.3); p.place(v3(aside.x, 1, aside.z), 0); V.bodyYaw = yaw - Math.PI / 2; // 봉헌함 오른쪽에서 초를 바라본다
  V.me.root.scale.setScalar(0.0001); // 가까이 찍는 동안 카메라 앞을 가리지 않게 잠시 숨긴다
  const camC = move(wideEye2, cupEye, 3.0, grot, cupLook, 50);
  await sleep(1200); V.sound?.ting?.(); V.applyCandle('c6', true, 0, '마리아', true);
  await sleep(900); V.applyCandle('c7', true, 2, 'Lucas', true);
  await sleep(900); V.applyCandle('c9', true, 1, 'Anna', true);
  await camC; await sleep(1500);
  V.me.root.scale.setScalar(1);
  log('grotto');
  await fade(1, 0, 0.8);

  // 4) 정문 — 문 앞에서 문이 열리고 걸어 들어간다
  window.__cam = null; p.place(v3(0.4, 1, 15), 0); p.yaw = 0; p.pitch = -0.08; V.bodyYaw = 0;
  for (const d of V.space.doors) d.open = false;
  // 정면 종탑을 올려다보며 다가간다(겹 아치 정문 · 버팀벽 · 시계 · 첨탑)
  const camF = move(v3(-5.5, 1.6, 33), v3(-1.6, 2.0, 21), 6, v3(0, 22, 6), v3(0, 7, 6), 60);
  await sleep(200);
  await fade(0, 1, 0.8);
  await camF;
  window.__cam = null;
  await walk([v3(0.3, 1, 10.5)], 4000);
  await sleep(500);
  for (const d of V.space.doors) d.open = true; V.sound?.ting?.();
  await sleep(1600);
  await walk([v3(0.2, 1, 4), v3(0.2, 1, -3)], 7000);
  log('door');
  await fade(1, 0, 0.8);

  // 5) 신랑 — 사람은 측랑으로 비켜 두고, 카메라가 제대까지 천천히 나아간다(빛줄기)
  p.place(v3(-11, 1, -14), 0);
  await sleep(400);
  const navA = v3(0, 2.3, -5), navB = v3(0, 3.6, -27), lookA = v3(0, 5.5, -46), lookB = v3(0, 6.0, -46);
  const camN = move(navA, navB, 13, lookA, lookB, 62);
  await fade(0, 1, 1.0);
  await camN;
  log('nave');

  // 6) 제대 앞 봉헌대 — 초가 하나씩 켜진다
  const tbl = v3(-3.4, 1.55, -34.7);
  const tEye = v3(-1.6, 1.9, -31.6), tEye2 = v3(-2.4, 1.75, -32.6);
  const camT = move(navB, tEye, 2.5, lookB, tbl, 55);
  await camT;
  const camT2 = move(tEye, tEye2, 5, tbl, tbl, 50);
  await sleep(400); V.applyCandle('c0', true, 0, 'Maria', true);
  await sleep(800); V.applyCandle('c2', true, 3, 'João', true);
  await sleep(800); V.applyCandle('c4', true, 5, '요셉', true);
  await camT2;
  log('altar candles');

  // 7) 올려다보기 — 후진 창과 볼트를 향해 천천히 오르며 끝
  const upA = v3(0, 2.0, -29), upB = v3(0, 8.5, -24), lA = v3(0, 4, -46), lB = v3(0, 13, -44);
  const camU = move(upA, upB, 8, lA, lB, 62);
  await sleep(6000);
  await fade(1, 0, 2.0);
  await camU;
  log('end');

  rec.stop(); await done;
  const blob = new Blob(chunks, { type: 'video/mp4' });
  window.__filmBlob = blob;
  await fetch('http://127.0.0.1:5299/' + (opts.name || 'vhk-film.mp4'), { method: 'POST', body: blob, headers: { 'Content-Type': 'application/octet-stream' } });
  window.__cam = null; G.uFade.value = 1;
  return { mb: +(blob.size / 1e6).toFixed(1), log: window.__filmLog };
};
