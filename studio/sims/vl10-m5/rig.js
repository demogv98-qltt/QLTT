// VL10-M5 geometry: a board with ruled paper and a protractor ring, a knot at O, three spring balances.
// rig.update(readout, td) poses everything from the physics readout; td 0..1 is the teardown (balance shells lift off).
import * as THREE from 'three';
import {FMAX, K} from './physics.js';

export const TOP = 0.15; // board surface height
const D2R = Math.PI / 180;
const VS = 0.02; // arrow scale: 1 N = 2 cm
const XH = 0.3; // hook distance from the knot
const COL = {orange: 0xe8590c, teal: 0x0b8f8c, purple: 0x5b3cc4, slate: 0x4d6573, ink: 0x14303c, steel: 0x8a95a0, brass: 0xc8963c};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.55, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const box = (p, w, h, d, m, x, y, z, s) => add(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };

function paperTexture() {
  const W = 2048, H = Math.round(2048 * 1.3 / 1.7), c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), ppm = W / 1.7, cx = W / 2, cy = H / 2;
  g.fillStyle = '#f7f4ea'; g.fillRect(0, 0, W, H);
  for (let k = -17; k <= 17; k++) { g.strokeStyle = k % 5 === 0 ? 'rgba(43,138,153,.45)' : 'rgba(43,138,153,.2)'; g.lineWidth = k % 5 === 0 ? 2.4 : 1.2;
    g.beginPath(); g.moveTo(cx + k * 0.05 * ppm, 0); g.lineTo(cx + k * 0.05 * ppm, H); g.stroke();
    g.beginPath(); g.moveTo(0, cy + k * 0.05 * ppm); g.lineTo(W, cy + k * 0.05 * ppm); g.stroke(); }
  g.strokeStyle = 'rgba(20,48,60,.7)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, cy); g.lineTo(W, cy); g.moveTo(cx, 0); g.lineTo(cx, H); g.stroke();
  // protractor ring r = 0.26 m: a tick every 5°, a number every 30°
  const R = 0.26 * ppm; g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.lineWidth = 2.4; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  g.font = '600 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let a = 0; a < 360; a += 5) { const r = a * D2R, big = a % 10 === 0, len = a % 30 === 0 ? 26 : big ? 18 : 10; g.lineWidth = big ? 2.4 : 1.4;
    g.beginPath(); g.moveTo(cx + Math.cos(r) * R, cy - Math.sin(r) * R); g.lineTo(cx + Math.cos(r) * (R - len), cy - Math.sin(r) * (R - len)); g.stroke();
    if (a % 30 === 0) g.fillText(a + '°', cx + Math.cos(r) * (R + 36), cy - Math.sin(r) * (R + 36)); }
  g.fillText('x', W - 24, cy - 22); g.fillText('y', cx + 24, 24);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function scaleTexture(full) {
  const c = document.createElement('canvas'); c.width = 880; c.height = 120; const g = c.getContext('2d');
  g.fillStyle = '#eef1f3'; g.fillRect(0, 0, 880, 120); g.fillStyle = g.strokeStyle = '#14303c'; g.font = '700 30px sans-serif'; g.textAlign = 'center';
  // plate covers rel 0.01..0.12 m (0.11 m → 880 px): force F sits at rel = 0.11 − F/full·0.1
  const X = (F) => ((0.11 - (F / full) * 0.1 - 0.01) / 0.11) * 880, minor = full === 20 ? 1 : 2, major = full === 20 ? 5 : 10;
  for (let F = 0; F <= full + 1e-6; F += minor) { const big = F % major === 0; g.lineWidth = big ? 4 : 2; g.beginPath(); g.moveTo(X(F), 0); g.lineTo(X(F), big ? 44 : 28); g.stroke(); if (big) g.fillText(String(F), X(F), 80); }
  g.font = '700 24px sans-serif'; g.fillText('N', 840, 108);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function helix(turns, radius) {
  const pts = []; for (let i = 0; i <= turns * 14; i++) { const a = (i / 14) * Math.PI * 2; pts.push(new THREE.Vector3(i / (turns * 14), Math.cos(a) * radius, Math.sin(a) * radius)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 18, 0.0017, 6);
}
function makeArrow(color) {
  const g = new THREE.Group(), m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 1, 10), m); shaft.rotation.z = -Math.PI / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.04, 14), m); head.rotation.z = -Math.PI / 2;
  g.add(shaft, head); const tip = marker(g);
  g.userData.set = (len) => { const l = Math.max(0.001, len), hl = Math.min(0.04, l * 0.5); shaft.scale.y = Math.max(0.001, l - hl); shaft.position.x = (l - hl) / 2; head.scale.setScalar(hl / 0.04); head.position.x = l - hl / 2; tip.position.x = l; };
  g.userData.tip = tip; return g;
}
function makeStrip(color, w = 0.0045) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.002, w), flat(color)); m.userData.set = (a, b) => { const dx = b[0] - a[0], dz = -(b[1] - a[1]), L = Math.hypot(dx, dz); m.visible = L > 0.004; m.scale.x = Math.max(0.001, L); m.position.set((a[0] + b[0]) / 2, TOP + 0.05, (-(a[1] + b[1])) / 2); m.rotation.y = Math.atan2(-dz, dx); }; return m; }

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root);
  const M = {alu: mat(0xc2cbd2, {metalness: 0.8}), iron: mat(0x353a42, {metalness: 0.35, roughness: 0.78}), steel: mat(COL.steel, {metalness: 0.85, roughness: 0.4}), dark: mat(0x252b33)};
  // ---- board
  box(root, 1.72, 0.03, 1.32, M.alu, 0, TOP - 0.015, 0);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.3).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({map: paperTexture(), roughness: 0.9, metalness: 0, envMapIntensity: 0.3}));
  paper.position.y = TOP + 0.0006; paper.receiveShadow = true; root.add(paper);
  for (const [x, z] of [[-0.78, -0.58], [0.78, -0.58], [-0.78, 0.58], [0.78, 0.58]]) add(root, new THREE.CylinderGeometry(0.035, 0.045, TOP - 0.03, 18), M.iron, x, (TOP - 0.03) / 2, z);
  // ---- knot: a brass ring on a peg, three string loops
  const knot = new THREE.Group(); knot.position.y = TOP + 0.02; root.add(knot);
  add(knot, new THREE.TorusGeometry(0.014, 0.0035, 10, 24).rotateX(Math.PI / 2), mat(COL.brass, {metalness: 0.9, roughness: 0.35}));
  add(root, new THREE.CylinderGeometry(0.004, 0.004, 0.02, 10), M.steel, 0, TOP + 0.01, 0, false);
  const pts = {O: knot};
  // ---- three spring balances
  const names = ['1', '2', '3'], cols = [COL.orange, COL.teal, COL.slate];
  const meters = names.map((_, i) => {
    const g = new THREE.Group(); g.position.y = TOP + 0.02; root.add(g);
    const body = mat(cols[i], {metalness: 0.6, roughness: 0.45}), glass = gmat(cols[i], {metalness: 0.2, roughness: 0.2, opacity: 0.4}), cap = mat(cols[i], {metalness: 0.6});
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 1, 6).rotateZ(Math.PI / 2), M.dark); string.castShadow = false; g.add(string);
    add(g, new THREE.TorusGeometry(0.007, 0.0018, 8, 16).rotateY(Math.PI / 2), M.steel, XH, 0, 0, false);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 1, 10).rotateZ(Math.PI / 2), M.steel); g.add(rod);
    const moving = new THREE.Group(); g.add(moving); // everything fixed to the case: shifts out by the spring extension
    const mk = (start, len) => new THREE.CylinderGeometry(0.022, 0.022, 0.24, 28, 1, true, start, len).rotateZ(-Math.PI / 2); // axis +x
    const lower = add(moving, mk(0, Math.PI), body, 0.12, 0, 0); lower.material.side = THREE.DoubleSide;
    const upper = add(moving, mk(Math.PI, Math.PI), glass, 0.12, 0, 0); upper.material.side = THREE.DoubleSide;
    const edgeU = new THREE.LineSegments(new THREE.EdgesGeometry(upper.geometry, 20), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); upper.add(edgeU);
    const plate = add(moving, new THREE.BoxGeometry(0.11, 0.003, 0.032), new THREE.MeshStandardMaterial({map: scaleTexture(FMAX[i]), roughness: 0.6, metalness: 0.1}), 0.065, -0.012, 0, false);
    add(moving, new THREE.CylinderGeometry(0.0235, 0.0235, 0.012, 24).rotateZ(Math.PI / 2), cap, 0.246, 0, 0);
    add(moving, new THREE.TorusGeometry(0.014, 0.0035, 8, 20).rotateY(Math.PI / 2), M.steel, 0.268, 0, 0, false);
    const spring = add(moving, helix(13, 0.011), M.steel, 0, 0, 0, false);
    const pointer = add(g, new THREE.BoxGeometry(0.006, 0.026, 0.026), mat(0xe8590c, {metalness: 0.3}), XH + 0.15, -0.002, 0, false);
    const disc = add(g, new THREE.CylinderGeometry(0.01, 0.01, 0.006, 16).rotateZ(Math.PI / 2), M.steel, XH + 0.15, 0, 0, false);
    pts['m' + i] = marker(moving, 0.06, 0.02, 0); pts['s' + i] = marker(moving, 0.18, 0, 0);
    return {g, string, rod, moving, upper, body, edgeU, spring, pointer, disc, K: K[i], pBody: body};
  });
  // ---- vectors on the paper
  const arrows = [makeArrow(COL.orange), makeArrow(COL.teal), makeArrow(COL.purple)];
  const comps = [makeArrow(COL.orange), makeArrow(COL.teal)];
  for (const a of [...arrows, ...comps]) { a.position.y = TOP + 0.05; root.add(a); }
  const strips = [makeStrip(0xe8590c), makeStrip(0x0b8f8c), makeStrip(0x5b3cc4, 0.003), makeStrip(0x5b3cc4, 0.003)];
  for (const s of strips) root.add(s);
  // angle fan between the two forces (or β from Ox)
  let fan = null, fanKey = '';
  const setFan = (a0, sweep) => {
    const key = Math.round(a0 / 2) + ':' + Math.round(sweep / 2); if (key === fanKey) return; fanKey = key;
    if (fan) { fan.traverse((o) => o.geometry?.dispose()); root.remove(fan); }
    fan = new THREE.Group(); const m = flat(0x14303c, {transparent: true, opacity: 0.35, side: THREE.DoubleSide}), m2 = flat(0x5b3cc4, {transparent: true, opacity: 0.12, side: THREE.DoubleSide});
    const a = new THREE.Mesh(new THREE.RingGeometry(0.098, 0.103, 40, 1, a0 * D2R, Math.max(0.001, sweep * D2R)), m), b = new THREE.Mesh(new THREE.CircleGeometry(0.1, 40, a0 * D2R, Math.max(0.001, sweep * D2R)), m2);
    for (const o of [a, b]) { o.rotation.x = -Math.PI / 2; o.position.y = TOP + 0.03; fan.add(o); } root.add(fan);
  };
  pts.fan = marker(root, 0, TOP + 0.03, 0);
  const tipPts = [marker(root), marker(root), marker(root)];
  const edges = [meters.map((m) => m.edgeU)].flat();

  function update(r, td) {
    const e = td * td * (3 - 2 * td), mode = r.mode;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04; }
    for (const l of edges) l.material.opacity = 0.55 * e;
    r.m.forEach((q, i) => {
      const M_ = meters[i], th = q.th * D2R, ext = q.ext;
      M_.g.rotation.y = th; // local +x along the force direction (board y → world −z)
      M_.string.scale.x = XH - 0.025; M_.string.position.x = (XH + 0.025) / 2;
      const XB = XH + 0.04 + ext; // case face: the case is pulled out by the spring extension
      M_.moving.position.x = XB;
      M_.rod.scale.x = XB + 0.11 - XH; M_.rod.position.x = (XH + XB + 0.11) / 2;
      // the spring runs from the rod end (fixed to the hook) to the closed cap (moves out with the case): length 0.13 + ext
      M_.spring.position.x = 0.11 - ext; M_.spring.scale.x = 0.13 + ext;
      M_.upper.position.y = 0.09 * e;
      M_.g.visible = q.F > 0.05 || i === 0;
    });
    // arrows and parallelogram
    const pos = (v) => [v[0] * VS, v[1] * VS];
    const set = (a, v, vis = true) => { const F = Math.hypot(v[0], v[1]); a.visible = vis && F > 0.05; a.rotation.y = Math.atan2(v[1], v[0]); a.userData.set(F * VS); };
    for (const s of strips) s.visible = false;
    comps.forEach((a) => (a.visible = false));
    if (mode === 'T') {
      const a = r.m[0].v, b = r.m[1].v, R = r.R;
      set(arrows[0], a); set(arrows[1], b); set(arrows[2], R);
      strips[0].userData.set(pos(b), pos(R)); strips[1].userData.set(pos(a), pos(R));
      let a0 = r.m[0].th, sweep = r.al; const cross = a[0] * b[1] - a[1] * b[0]; if (cross < 0) a0 = r.m[1].th;
      setFan(a0, sweep); fan.visible = r.m[0].F > 0.05 && r.m[1].F > 0.05; pts.fan.position.set(0, TOP + 0.03, 0);
      tipPts[0].position.set(a[0] * VS, TOP + 0.05, -a[1] * VS); tipPts[1].position.set(b[0] * VS, TOP + 0.05, -b[1] * VS); tipPts[2].position.set(R[0] * VS, TOP + 0.05, -R[1] * VS);
    } else {
      const f = r.m[0].v, x = [f[0], 0], y = [0, f[1]];
      set(arrows[0], f); arrows[0].children.forEach((c) => c.material && c.material.color.setHex(COL.purple));
      set(comps[0], x); set(comps[1], y); strips[2].userData.set(pos(x), pos(f)); strips[3].userData.set(pos(y), pos(f)); arrows[1].visible = arrows[2].visible = false;
      setFan(0, r.beta > 180 ? r.beta - 360 : r.beta); fan.visible = r.F > 0.05;
      tipPts[0].position.set(f[0] * VS, TOP + 0.05, -f[1] * VS); tipPts[1].position.set(x[0] * VS, TOP + 0.05, 0); tipPts[2].position.set(0, TOP + 0.05, -y[1] * VS);
    }
    if (mode === 'T') arrows[0].children.forEach((c) => c.material && c.material.color.setHex(COL.orange));
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, tipPts, worldPt, meters};
}
