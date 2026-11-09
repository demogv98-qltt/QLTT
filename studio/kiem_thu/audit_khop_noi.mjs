// Dùng: node audit_khop_noi.mjs <file.html> <tên biến window, VD M8> '[{},{"preset":0}]'
// Finds thin rods/strings whose ends touch nothing: a quick geometric check for "parts that float".
import {createRequire} from 'node:module';
const require = createRequire('/root/.claude/skills/teardown/node_modules/x.js');
const {chromium} = require('playwright');
const [file, key, poseJson] = process.argv.slice(2);
const poses = poseJson ? JSON.parse(poseJson) : [{}];
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox']});
const page = await browser.newPage({viewport: {width: 1600, height: 900}});
await page.goto('file://' + file);
await page.waitForFunction((k) => window[k] && window[k].shown, key, {timeout: 40000});
await page.waitForTimeout(1200);
for (const p of poses) {
  if (Object.keys(p).length) { await page.evaluate(([k, p]) => window[k].pose && window[k].pose(p), [key, p]); await page.waitForTimeout(1800); }
  const res = await page.evaluate((k) => {
    const sim = window[k], sc = sim.st.scene, T = sim.st.THREE, meshes = [];
    sc.updateMatrixWorld(true);
    sc.traverse((o) => { if (o.isMesh && o.geometry) { let vis = true, q = o; while (q) { if (q.visible === false) vis = false; q = q.parent; } if (!vis) return; if (o.material && o.material.opacity !== undefined && o.material.opacity < 0.05) return; meshes.push(o); } });
    const thin = [], solid = [];
    for (const m of meshes) {
      const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox, size = bb.getSize(new T.Vector3());
      const axes = ['x', 'y', 'z'].sort((a, b) => size[b] - size[a]), L = size[axes[0]], W = size[axes[1]];
      const sc2 = new T.Vector3().setFromMatrixScale(m.matrixWorld), s3 = {x: sc2.x, y: sc2.y, z: sc2.z};
      const wl = L * s3[axes[0]], ww = W * s3[axes[1]];
      if (m.material && m.material.isMeshBasicMaterial) continue;
      if (g.type === 'CylinderGeometry' && ww < 0.07 && wl > 0.06 && wl / Math.max(ww, 1e-4) > 6) {
        const c = bb.getCenter(new T.Vector3()), a = new T.Vector3(); a[axes[0]] = L / 2;
        const e1 = c.clone().add(a).applyMatrix4(m.matrixWorld), e2 = c.clone().sub(a).applyMatrix4(m.matrixWorld);
        thin.push({m, e1, e2, wl});
      } else { const box = new T.Box3().setFromObject(m); solid.push({m, box}); }
    }
    const out = [];
    const touches = (pt, self) => { for (const s of solid) { const b = s.box.clone().expandByScalar(0.03); if (b.containsPoint(pt)) return true; } for (const t of thin) { if (t.m === self) continue; const bb = new T.Box3().setFromObject(t.m).expandByScalar(0.03); if (bb.containsPoint(pt)) return true; } return false; };
    for (const t of thin) for (const [nm, e] of [['e1', t.e1], ['e2', t.e2]]) if (!touches(e, t.m)) out.push({len: +t.wl.toFixed(2), end: nm, at: [e.x, e.y, e.z].map((v) => +v.toFixed(2))});
    // floating assemblies: group lit solids/rods whose boxes touch (tolerance 2 cm); a group with nothing near the floor hangs in the air
    const items = []; for (const s of solid) { const mt = s.m.material; if (!mt || mt.isMeshBasicMaterial || mt.type === 'ShaderMaterial' || mt.type === 'ShadowMaterial') continue; items.push({box: s.box.clone().expandByScalar(0.01), name: s.m.geometry.type}); }
    for (const t of thin) items.push({box: new T.Box3().setFromObject(t.m).expandByScalar(0.01), name: 'thin'});
    const par = items.map((_, i) => i), find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (items[i].box.intersectsBox(items[j].box)) par[find(i)] = find(j);
    const groups = {}; items.forEach((it, i) => { (groups[find(i)] = groups[find(i)] || []).push(it); });
    const floating = []; for (const g of Object.values(groups)) { const u = new T.Box3(); g.forEach((it) => u.union(it.box)); if (u.min.y > 0.06) { const sz = u.getSize(new T.Vector3()); floating.push({n: g.length, min: [u.min.x, u.min.y, u.min.z].map((v) => +v.toFixed(2)), size: [sz.x, sz.y, sz.z].map((v) => +v.toFixed(2)), kinds: [...new Set(g.map((x) => x.name))].slice(0, 3).join('+')}); } }
    return {thin: thin.length, solid: solid.length, dangling: out, floating};
  }, key);
  console.log(JSON.stringify(p), '→ dây/thanh:', res.thin, '| đầu lơ lửng:', res.dangling.length, JSON.stringify(res.dangling.slice(0, 6)), '| cụm lơ lửng:', res.floating.length, JSON.stringify(res.floating.slice(0, 6)));
}
await browser.close();
