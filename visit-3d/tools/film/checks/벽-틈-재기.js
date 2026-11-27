(async () => {
  const v = __vhk, p = v.player, sp = v.space, bvh = sp.bvh;
  const V = p.pos.constructor, Ray = p.groundRay.constructor; const ray = new Ray();
  const rc = { ray, near: 0, far: 200, camera: v.camera, layers: { test: () => true }, params: { Mesh: {} } };
  // 껍데기: noCollide + dynamic 이 붙은 묶음 가운데 cathedral: 이름의 메시를 가진 것
  let shell = null; v.scene.traverse((o) => { if (!shell && o.userData && o.userData.noCollide && o.userData.dynamic && o.children.length) { let has = false; o.traverse((m) => { if (m.isMesh && /^cathedral:/.test(m.name || '')) has = true; }); if (has) shell = o; } });
  if (!shell) return 'no shell';
  const sm = []; shell.traverse((m) => { if (m.isMesh) sm.push(m); });
  const vis = (o, d) => { ray.origin.copy(o); ray.direction.copy(d).normalize(); let best = null; for (const m of sm) { const hs = []; try { m.raycast(rc, hs); } catch (e) {} for (const h of hs) if (!best || h.distance < best.distance) best = h; } return best; };
  const col = (o, d) => { ray.origin.copy(o); ray.direction.copy(d).normalize(); return bvh.raycastFirst(ray, 2); };
  const rows = [];
  const probe = (o, d, tag) => { const a = vis(o, d), b = col(o, d); rows.push([tag, a ? +a.distance.toFixed(2) : null, b ? +b.distance.toFixed(2) : null, a ? [+a.point.x.toFixed(1), +a.point.z.toFixed(1)] : null, b ? [+b.point.x.toFixed(1), +b.point.z.toFixed(1)] : null]); };
  const Y = 1.6;
  for (let z = 8; z >= -56; z -= 2) { probe(new V(60, Y, z), new V(-1, 0, 0), 'R z' + z); probe(new V(-60, Y, z), new V(1, 0, 0), 'L z' + z); }
  for (let x = -20; x <= 20; x += 2) { probe(new V(x, Y, 60), new V(0, 0, -1), 'F x' + x); probe(new V(x, Y, -110), new V(0, 0, 1), 'B x' + x); }
  return JSON.stringify({ shellMeshes: sm.length, shellVisible: shell.visible, rows });
})()
