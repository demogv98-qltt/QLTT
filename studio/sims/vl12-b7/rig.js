// VL12-B7 geometry: (1) máy phát điện xoay chiều — nam châm, khung dây quay trên trục thẳng đứng, vành khuyên + chổi than, tay quay, đèn; (2) máy biến áp — lõi thép, hai cuộn, nguồn xoay chiều, đèn tải, vôn kế.
import * as THREE from 'three';
import {GEN} from './physics.js';

const COL = {orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, N: 0xc0392b, S: 0x2b59c3, wood: 0xcdb892, cu: 0xc77a3a, iron: 0x6d7a86};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.4, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function panel(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return {c, t, key: ''}; }
function disp(p, text, unit, col = '#7dffb0') { const k = text + unit; if (p.key === k) return; p.key = k; const g = p.c.getContext('2d'); g.fillStyle = '#10211a'; g.fillRect(0, 0, p.c.width, p.c.height); g.fillStyle = col; g.font = 'bold 56px monospace'; g.textAlign = 'right'; g.fillText(text, p.c.width - 62, 66); g.font = 'bold 28px monospace'; g.textAlign = 'left'; g.fillText(unit, p.c.width - 56, 66); p.t.needsUpdate = true; }
const tube = (pts, r, m, seg) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal'), seg || Math.max(10, pts.length * 4), r, 6), m);
export const TABLE = 0.45;
export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  add(root, new THREE.BoxGeometry(1.3, 0.04, 0.8), mat(COL.wood, {metalness: 0.05, roughness: 0.8}), 0.0, TABLE - 0.02, 0);
  for (const [x, z] of [[-0.58, -0.33], [0.58, -0.33], [-0.58, 0.33], [0.58, 0.33]]) add(root, new THREE.BoxGeometry(0.05, TABLE - 0.04, 0.05), mat(COL.dark, {metalness: 0.3}), x, (TABLE - 0.04) / 2, z);
  const steel = gmat(COL.steel, {metalness: 0.9, roughness: 0.3}), lead = mat(0x2a2f36, {metalness: 0.1, roughness: 0.7}), leadR = mat(COL.N, {metalness: 0.1, roughness: 0.7}), cuM = gmat(COL.cu, {metalness: 0.85, roughness: 0.3});
  // đèn (dùng chung hai chế độ): thân đế + bóng thuỷ tinh; độ sáng điều khiển bằng emissive
  function makeLamp(x) { const g = new THREE.Group(); g.position.set(x, TABLE, 0); root.add(g); add(g, new THREE.CylinderGeometry(0.05, 0.055, 0.02, 24), mat(COL.dark, {metalness: 0.4}), 0, 0.01, 0); add(g, new THREE.CylinderGeometry(0.016, 0.016, 0.05, 16), mat(COL.steel, {metalness: 0.8}), 0, 0.045, 0);
    const bulbM = new THREE.MeshStandardMaterial({color: 0xfff3c4, emissive: 0xffc24a, emissiveIntensity: 0, transparent: true, opacity: 0.85, roughness: 0.2}); const bulb = add(g, new THREE.SphereGeometry(0.045, 24, 18), bulbM, 0, 0.1, 0, false); const light = new THREE.PointLight(0xffc24a, 0, 1.2); light.position.set(0, 0.1, 0); g.add(light);
    for (const sx of [-1, 1]) add(g, new THREE.CylinderGeometry(0.0035, 0.0035, 0.045, 8), mat(COL.cu), sx * 0.014, 0.075, 0, false); return {g, bulbM, light, bulb}; }
  const lampG = makeLamp(0.45); pts.lamp = marker(lampG.g, 0.06, 0.12, 0);
  // ======================= MÁY PHÁT =======================
  const gen = new THREE.Group(); root.add(gen); const YP = TABLE + 0.02 + 0.07; // tâm cực từ
  const yoke = gmat(0x5d6a75, {metalness: 0.5}), nM = gmat(COL.N, {metalness: 0.4}), sM = gmat(COL.S, {metalness: 0.4});
  add(gen, new THREE.BoxGeometry(0.34, 0.02, 0.26), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.01, 0.0); add(gen, new THREE.BoxGeometry(0.28, 0.02, 0.14), yoke, 0, TABLE + 0.03, 0);
  add(gen, new THREE.BoxGeometry(0.06, 0.14, 0.14), nM, -0.1, YP + 0.01, 0); add(gen, new THREE.BoxGeometry(0.06, 0.14, 0.14), sM, 0.1, YP + 0.01, 0);
  const shaftTop = TABLE + 0.30; add(gen, new THREE.CylinderGeometry(0.005, 0.005, shaftTop - (TABLE + 0.04), 12), steel, 0, (shaftTop + TABLE + 0.04) / 2, 0); // trục (đứng yên về hình, quay = nhóm con)
  add(gen, new THREE.BoxGeometry(0.04, 0.02, 0.04), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.04, 0); // ổ đỡ dưới trên đế
  add(gen, new THREE.CylinderGeometry(0.01, 0.01, TABLE + 0.27 - TABLE - 0.02, 12), steel, 0, (TABLE + 0.27 + TABLE + 0.02) / 2, -0.09); // cột đỡ phía sau
  add(gen, new THREE.CylinderGeometry(0.006, 0.006, 0.09, 10).rotateX(Math.PI / 2), steel, 0, TABLE + 0.27, -0.045); add(gen, new THREE.BoxGeometry(0.03, 0.016, 0.03), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.27, 0); // ổ đỡ trên + tay đòn
  const rot = new THREE.Group(); rot.position.set(0, YP, 0); gen.add(rot);
  // khung dây: mặt phẳng y–z (pháp tuyến +x khi θ = 0), cao 0,10 m, rộng 0,08 m
  const hh = 0.05, ww = 0.04, coilPts = [[0, hh, ww], [0, hh, -ww], [0, -hh, -ww], [0, -hh, ww], [0, hh, ww]]; const coilM = cuM;
  for (let k = 0; k < 4; k++) { const a = new THREE.Vector3(...coilPts[k]), b = new THREE.Vector3(...coilPts[k + 1]), len = a.distanceTo(b), m = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, len, 10), coilM); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); m.castShadow = true; rot.add(m); }
  for (const sy of [-1, 1]) add(rot, new THREE.CylinderGeometry(0.0028, 0.0028, 2 * ww, 8).rotateX(Math.PI / 2), mat(COL.steel, {metalness: 0.8}), 0, sy * hh, 0, false); // thanh ngang nối khung với trục (ở cạnh trên/dưới) — trục đi qua tâm
  add(rot, new THREE.CylinderGeometry(0.006, 0.006, 2 * hh + 0.03, 12), steel, 0, 0, 0);
  const dirs = []; const dm = flat(0x2c9a4b); for (const [i, p] of [[0, [0, 0, ww]], [1, [0, 0, -ww]], [2, [0, hh, 0]], [3, [0, -hh, 0]]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.022, 10), dm); c.position.set(...p); c.userData.k = i; rot.add(c); dirs.push(c); }
  // vành khuyên + chổi than + tay quay
  const sr = new THREE.Group(); sr.position.y = TABLE + 0.205; gen.add(sr); for (const dy of [0, 0.025]) add(sr, new THREE.CylinderGeometry(0.014, 0.014, 0.012, 24), mat(COL.cu, {metalness: 0.9, roughness: 0.25}), 0, dy, 0, false);
  for (const [dy, col] of [[0, leadR], [0.025, lead]]) { add(gen, new THREE.BoxGeometry(0.01, 0.01, 0.012), mat(0x333333), 0, TABLE + 0.205 + dy, 0.0 + 0.017, false); add(gen, new THREE.CylinderGeometry(0.0025, 0.0025, 0.09, 8).rotateX(Math.PI / 2), mat(COL.steel), 0, TABLE + 0.205 + dy, 0.0 + 0.062, false); gen.add(tube([[0, TABLE + 0.205 + dy, 0.105], [0.1, TABLE + 0.15 + dy * 2, 0.14], [0.3, TABLE + 0.08, 0.06 + dy], [0.42, TABLE + 0.1, 0.0 + (dy ? 0.014 : -0.014)]], 0.0032, col)); }
  add(gen, new THREE.CylinderGeometry(0.01, 0.01, 0.23 - 0.02, 12), mat(COL.steel), 0, (TABLE + 0.02 + TABLE + 0.23) / 2, 0.105);
  const crank = new THREE.Group(); crank.position.y = shaftTop; gen.add(crank); add(crank, new THREE.CylinderGeometry(0.03, 0.03, 0.01, 24), mat(COL.dark, {metalness: 0.4}), 0, 0.005, 0); add(crank, new THREE.CylinderGeometry(0.003, 0.003, 0.05, 8).rotateZ(Math.PI / 2), steel, 0.025, 0.01, 0); add(crank, new THREE.CylinderGeometry(0.007, 0.007, 0.04, 12), mat(COL.orange, {metalness: 0.3}), 0.05, 0.03, 0);
  pts.coil = marker(rot, 0, hh + 0.01, ww); pts.N = marker(gen, -0.1, YP + 0.09, 0); pts.S = marker(gen, 0.1, YP + 0.09, 0); pts.crank = marker(crank, 0.05, 0.06, 0); pts.rings = marker(gen, 0.02, TABLE + 0.225, 0); pts.brush = marker(gen, 0, TABLE + 0.205, 0.017); pts.shaft = marker(gen, 0, TABLE + 0.12, 0.0); pts.post = marker(gen, 0, TABLE + 0.15, -0.09);
  // ======================= BIẾN ÁP =======================
  const tr = new THREE.Group(); root.add(tr); const Y0 = TABLE + 0.02, CH = 0.24, CW = 0.30, LG = 0.05, ironM = gmat(COL.iron, {metalness: 0.7, roughness: 0.4});
  add(tr, new THREE.BoxGeometry(0.36, 0.02, 0.14), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.01, 0);
  add(tr, new THREE.BoxGeometry(CW, LG, 0.05), ironM, 0, Y0 + LG / 2, 0); add(tr, new THREE.BoxGeometry(CW, LG, 0.05), ironM, 0, Y0 + CH - LG / 2, 0);
  add(tr, new THREE.BoxGeometry(LG, CH - 2 * LG, 0.05), ironM, -CW / 2 + LG / 2, Y0 + CH / 2, 0); add(tr, new THREE.BoxGeometry(LG, CH - 2 * LG, 0.05), ironM, CW / 2 - LG / 2, Y0 + CH / 2, 0);
  const prim = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cuM), sec = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cuM); for (const o of [prim, sec]) { o.castShadow = true; tr.add(o); }
  const lx = -CW / 2 + LG / 2, rx = CW / 2 - LG / 2, wy = Y0 + CH / 2, wh = CH - 2 * LG - 0.01;
  const flux = []; const fm = new THREE.MeshBasicMaterial({color: 0x2b59c3, transparent: true, opacity: 0.85}); for (let i = 0; i < 28; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), fm.clone()); tr.add(m); flux.push(m); }
  const loopPath = (u) => { const L1 = CH - LG, L2 = CW - LG, per = 2 * (L1 + L2); let d = ((u % 1) + 1) % 1 * per; const x0 = -L2 / 2, x1 = L2 / 2, y0 = Y0 + LG / 2, y1 = Y0 + CH - LG / 2; if (d < L1) return [x0, y0 + d]; d -= L1; if (d < L2) return [x0 + d, y1]; d -= L2; if (d < L1) return [x1, y1 - d]; d -= L1; return [x1 - d, y0]; };
  const srcBox = new THREE.Group(); srcBox.position.set(-0.45, TABLE, 0); tr.add(srcBox); add(srcBox, new THREE.BoxGeometry(0.16, 0.1, 0.12), mat(0x3e5666, {metalness: 0.3}), 0, 0.05, 0); const d1 = panel(256, 96); const p1 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.04), new THREE.MeshBasicMaterial({map: d1.t})); p1.position.set(0, 0.06, 0.0605); srcBox.add(p1);
  const vm2 = new THREE.Group(); vm2.position.set(0.3, TABLE, 0.12); tr.add(vm2); add(vm2, new THREE.BoxGeometry(0.12, 0.08, 0.08), mat(0x3e5666, {metalness: 0.3}), 0, 0.04, 0); const d2 = panel(256, 96); const p2 = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.034), new THREE.MeshBasicMaterial({map: d2.t})); p2.position.set(0, 0.05, 0.0405); vm2.add(p2);
  let trKey = ''; const trLeads = new THREE.Group(); tr.add(trLeads);
  function buildTr(N1, N2) {
    const t1 = 0.012 + 0.028 * (N1 / 1000), t2 = 0.012 + 0.028 * (N2 / 2000); prim.scale.set(LG + 2 * t1, wh, 0.05 + 2 * t1); prim.position.set(lx, wy, 0); sec.scale.set(LG + 2 * t2, wh, 0.05 + 2 * t2); sec.position.set(rx, wy, 0);
    trLeads.clear(); const top1 = wy + wh / 2; trLeads.add(tube([[lx - 0.01, top1, 0.0], [-0.25, TABLE + 0.2, 0.02], [-0.4, TABLE + 0.12, 0.02], [-0.44, TABLE + 0.1, 0.02]], 0.0032, leadR)); trLeads.add(tube([[lx + 0.01, wy - wh / 2, 0.0], [-0.2, TABLE + 0.06, 0.05], [-0.4, TABLE + 0.04, 0.05], [-0.46, TABLE + 0.1, -0.02]], 0.0032, lead));
    trLeads.add(tube([[rx + 0.01, wy + wh / 2, 0.0], [0.25, TABLE + 0.22, 0.0], [0.42, TABLE + 0.14, 0.0], [0.436, TABLE + 0.075, 0.0]], 0.0032, leadR)); trLeads.add(tube([[rx - 0.01, wy - wh / 2, 0.0], [0.2, TABLE + 0.05, -0.04], [0.4, TABLE + 0.04, -0.04], [0.464, TABLE + 0.075, 0.0]], 0.0032, lead));
  }
  pts.core = marker(tr, 0, Y0 + CH + 0.01, 0); pts.prim = marker(tr, lx - 0.04, wy + 0.05, 0.03); pts.sec = marker(tr, rx + 0.04, wy + 0.05, 0.03); pts.src = marker(srcBox, 0.08, 0.1, 0); pts.vm = marker(vm2, 0.06, 0.08, 0); pts.flux = marker(tr, 0, Y0 + CH - LG / 2 + 0.02, 0.03); pts.lamp2 = marker(lampG.g, 0.0, 0.17, 0);
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td); for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    gen.visible = s.mode === 'gen'; tr.visible = s.mode === 'tr';
    let P = 0, rated = 0.4;
    if (s.mode === 'gen') { rot.rotation.y = r.g.th; crank.rotation.y = r.g.th; const sg = Math.sign(r.g.e) || 1; dirs.forEach((c) => { const k = c.userData.k; c.visible = Math.abs(r.g.i) > 1e-3; const tg = [new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0)][k].clone().multiplyScalar(sg); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg); }); P = r.g.P; rated = 0.5; }
    else { buildTrMaybe(s); const t = r.t; P = t.P2; rated = 1.5; const phase = Math.sin(r.ph), amp = Math.min(1, t.Vm / 25); flux.forEach((m, i) => { const [x, y] = loopPath(i / flux.length + 0.03 * phase * 6 * amp); m.position.set(x, y, 0.03 + 0.0); m.material.opacity = 0.35 + 0.6 * amp; m.scale.setScalar(0.6 + 0.8 * amp); }); disp(d1, t.U1.toFixed(1), 'V'); disp(d2, t.U2.toFixed(1), 'V', '#ffd27d'); }
    const b = Math.min(1, Math.sqrt(Math.max(P, 0) / rated)); lampG.bulbM.emissiveIntensity = 2.2 * b; lampG.light.intensity = 0.8 * b;
    root.updateMatrixWorld(true);
  }
  function buildTrMaybe(s) { const k = `${s.N1}|${s.N2}`; if (k !== trKey) { trKey = k; buildTr(s.N1, s.N2); } }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  void GEN;
  return {root, update, pts, worldPt};
}
