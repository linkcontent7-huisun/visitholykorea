(async () => {
  const v = __vhk, p = v.player, sp = v.space, bvh = sp.bvh;
  const V = p.pos.constructor, Ray = p.groundRay.constructor; const ray = new Ray();
  const gcast = (o, d) => { ray.origin.copy(o); ray.direction.copy(d).normalize(); return bvh.raycastFirst(ray, 2); };
  const ground = (x, z) => { const h = gcast(new V(x, 60, z), new V(0, -1, 0)); return h ? h.point.y : null; };
  for (const d of sp.doors) { d.open = false; d.t = 0; }
  const inner = sp.stations.slice(2);
  const out = { runs: 0, inside: [], ends: [] };
  for (const dt of [0.033, 0.1]) for (let a = 0; a < 360; a += 3) for (const s of inner) {
    const R0 = 40, cx = 0, cz = -18;
    const sx = cx + Math.sin(a * Math.PI / 180) * R0, sz = cz + Math.cos(a * Math.PI / 180) * R0;
    const gy = ground(sx, sz); if (gy === null) continue;
    p.place(new V(sx, gy + 0.05, sz), 0); out.runs++;
    for (let i = 0; i < 14 / dt; i++) { p.yaw = Math.atan2(-(s.pos.x - p.pos.x), -(s.pos.z - p.pos.z)) + Math.sin(i * 0.05) * 0.7; p.update(dt, { x: 0, z: 1, run: true }, bvh, sp.doors); }
    const e = [+p.pos.x.toFixed(1), +p.pos.y.toFixed(1), +p.pos.z.toFixed(1)];
    // 실내 판정: 머리 위 12 m 안에 천장이 있고 발밑이 실내 바닥 높이(0.6 안팎)
    const up = gcast(new V(p.pos.x, p.pos.y + 1.7, p.pos.z), new V(0, 1, 0));
    if (up && up.distance < 40 && Math.abs(p.pos.y - 0.6) < 0.3 && p.pos.z < 6.2) out.inside.push({ a, dt, to: [+s.pos.x.toFixed(1), +s.pos.z.toFixed(1)], end: e, roof: +up.distance.toFixed(1) });
    if (a % 30 === 0 && s === inner[0] && dt === 0.033) out.ends.push({ a, e });
  }
  return JSON.stringify(out);
})()
