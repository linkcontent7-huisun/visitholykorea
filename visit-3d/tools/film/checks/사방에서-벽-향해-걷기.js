(async () => {
  const v = __vhk, p = v.player, sp = v.space, bvh = sp.bvh;
  const V = p.pos.constructor, Ray = p.groundRay.constructor;
  const ray = new Ray();
  const cast = (o, d, far) => { ray.origin.copy(o); ray.direction.copy(d).normalize(); const h = bvh.raycastFirst(ray, 2); return h && h.distance < far ? h : null; };
  const ground = (x, z) => { const h = cast(new V(x, 60, z), new V(0, -1, 0), 200); return h ? h.point.y : null; };
  // 성당 안 지점들(안내 지점) — 그 가운데를 중심으로 본다
  const st = sp.stations.map((s) => [+s.pos.x.toFixed(1), +s.pos.y.toFixed(1), +s.pos.z.toFixed(1)]);
  const inner = sp.stations.slice(1);
  const cx = inner.reduce((a, s) => a + s.pos.x, 0) / inner.length, cz = inner.reduce((a, s) => a + s.pos.z, 0) / inner.length;
  for (const d of sp.doors) { d.open = false; d.t = 0; }
  const out = { stations: st, center: [cx, cz], doors: sp.doors.length, runs: 0, tunnels: [] };
  const targets = [[cx, cz], ...inner.map((s) => [s.pos.x, s.pos.z])];
  for (const dt of [0.016, 0.05, 0.1]) for (const run of [false, true]) for (let a = 0; a < 360; a += 6) for (const R0 of [34, 46]) {
    const sx = cx + Math.sin(a * Math.PI / 180) * R0, sz = cz + Math.cos(a * Math.PI / 180) * R0;
    const gy = ground(sx, sz); if (gy === null) continue;
    const [tx, tz] = targets[(a / 6) % targets.length];
    p.place(new V(sx, gy + 0.05, sz), 0); out.runs++;
    const prev = new V(), dir = new V();
    for (let i = 0; i < 16 / dt; i++) {
      prev.copy(p.pos);
      // 벽을 따라 미끄러지는 모서리 상황도 만들도록 목표를 향하되 조금씩 흔든다
      const wob = Math.sin(i * 0.07) * 0.5;
      p.yaw = Math.atan2(-(tx - p.pos.x), -(tz - p.pos.z)) + wob;
      p.update(dt, { x: 0, z: 1, run }, bvh, sp.doors);
      dir.subVectors(p.pos, prev); const len = dir.length(); if (len < 1e-4) continue;
      for (const hgt of [0.5, 1.0, 1.5]) {
        const o = prev.clone(); o.y += hgt; const d2 = dir.clone(); d2.y = 0; const l2 = d2.length(); if (l2 < 1e-4) continue;
        const h = cast(o, d2, l2);
        if (h && h.face && Math.abs(h.face.normal.y) < 0.5) { out.tunnels.push({ dt, run, a, R0, hgt, at: [+h.point.x.toFixed(2), +h.point.y.toFixed(2), +h.point.z.toFixed(2)], step: +len.toFixed(3) }); i = 1e9; break; }
      }
      if (p.pos.y < -20) { out.tunnels.push({ dt, run, a, R0, fell: [+prev.x.toFixed(1), +prev.y.toFixed(1), +prev.z.toFixed(1)] }); break; }
    }
  }
  return JSON.stringify(out);
})()
