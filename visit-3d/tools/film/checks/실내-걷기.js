(async () => {
  const v = __vhk, p = v.player, sp = v.space, bvh = sp.bvh;
  const V = p.pos.constructor;
  for (const d of sp.doors) { d.open = true; d.t = 1; }
  const legs = (name, pts) => { const res = []; p.place(new V(pts[0][0], pts[0][1], pts[0][2]), 0);
    for (let k = 1; k < pts.length; k++) { const [tx, , tz] = pts[k]; let ok = false;
      for (let i = 0; i < 700; i++) { p.yaw = Math.atan2(-(tx - p.pos.x), -(tz - p.pos.z)); p.update(0.033, { x: 0, z: 1, run: false }, bvh, sp.doors); if (Math.hypot(tx - p.pos.x, tz - p.pos.z) < 0.6) { ok = true; break; } }
      res.push(ok ? 'o' : 'X@' + p.pos.x.toFixed(1) + ',' + p.pos.z.toFixed(1)); if (!ok) p.place(new V(pts[k][0], pts[k][1], pts[k][2]), 0); }
    return name + ': ' + res.join(' '); };
  const F = 0.62, out = [];
  out.push(legs('정문→신랑→제대 앞', [[0, 0.05, 14], [0, 0.05, 9], [0, F, 3.2], [0, F, -7.2], [0, F, -19], [0, F, -34]]));
  out.push(legs('오른 측랑', [[0, F, -7.2], [12.8, F, -8], [13.5, F, -20], [13.5, F, -29], [14.3, F, -35], [14.3, F, -38.5]]));
  out.push(legs('왼 측랑', [[0, F, -7.2], [-12.8, F, -8], [-13.5, F, -20], [-13.5, F, -29], [-14.3, F, -35], [-14.3, F, -38.5]]));
  out.push(legs('측랑 벽에 붙어', [[14.6, F, -7], [14.6, F, -20], [14.6, F, -29]]));
  out.push(legs('회랑 한 바퀴', [[9.2, F, -45.2], [10.5, F, -44], [7.5, F, -48.5], [0, F, -50.4], [-7.5, F, -48.5], [-10.5, F, -44]]));
  out.push(legs('현관 구석', [[0, F, 3.2], [4.8, F, 5.6], [4.8, F, -3.6], [-4.8, F, -3.6], [-4.8, F, 5.6]]));
  out.push(legs('성당 바깥 한 바퀴', [[0, 0.05, 14], [12, 0.05, 12], [20, 0.05, 0], [20, 0.05, -30], [16, 0.05, -50], [0, 0.05, -58], [-16, 0.05, -50], [-20, 0.05, -30], [-20, 0.05, 0], [-12, 0.05, 12]]));
  return JSON.stringify(out);
})()
