(async () => {
  const v = __vhk, p = v.player, sp = v.space, bvh = sp.bvh; const V = p.pos.constructor;
  const res = [];
  for (const open of [true, false]) { for (const d of sp.doors) { d.open = open; d.t = open ? 1 : 0; }
    for (const x0 of [-1.3, -0.8, 0, 0.8, 1.3, 2.0, 2.6, 3.5]) { p.place(new V(x0, 0.05, 13), 0);
      for (let i = 0; i < 400; i++) { p.yaw = 0; p.update(0.033, { x: 0, z: 1, run: false }, bvh, sp.doors); }
      res.push((open ? '문 열림' : '문 닫힘') + ' x=' + x0 + ' → 멈춘 곳 z=' + p.pos.z.toFixed(2) + ' x=' + p.pos.x.toFixed(2)); } }
  return JSON.stringify(res);
})()
