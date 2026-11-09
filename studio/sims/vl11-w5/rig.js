// W5 geometry (Melde-style): shaker with a Scotch yoke at the left, the string, a movable bridge (fixed end) with a pulley and hanging weights at the right,
// a grid board and a metre rule. update(readout, model, td) poses everything from the standing-wave model.
import * as THREE from 'three';
import {shape} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, red: 0xd62839, blue: 0x2b59c3, green: 0x2c9a4b};
export const Y0 = 1.15;
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const BX0 = -0.9, BW = 4.4;
const boardTex = () => {
  const c = document.createElement('canvas'); c.width = 2200; c.height = 700; const g = c.getContext('2d'), PX = 2200 / BW;
  g.fillStyle = '#f7fafc'; g.fillRect(0, 0, 2200, 700); g.strokeStyle = '#d3dee6'; g.lineWidth = 1.4;
  for (let x = BX0; x <= BX0 + BW + 1e-6; x += 0.1) { const X = (x - BX0) * PX; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, 700); g.stroke(); }
  for (let y = -0.7; y <= 0.7; y += 0.1) { const Y = 350 - y * 500; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, Y); g.lineTo(2200, Y); g.stroke(); }
  g.strokeStyle = '#9fb3bf'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 350); g.lineTo(2200, 350); g.stroke(); g.fillStyle = '#5b7080'; g.font = 'bold 22px monospace';
  for (const cm of [-20, 20]) g.fillText((cm > 0 ? '+' : '−') + Math.abs(cm) + ' cm', 10, 350 - cm * 5 + 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const rulerTex = () => {
  const c = document.createElement('canvas'); c.width = 2200; c.height = 80; const g = c.getContext('2d'), PX = 2200 / BW; g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 2200, 80); g.fillStyle = '#14303c'; g.strokeStyle = '#14303c'; g.font = 'bold 28px monospace'; g.textAlign = 'center';
  for (let cm = 0; cm <= 300; cm++) { const X = (cm / 100 - BX0) * PX, big = cm % 50 === 0, mid = cm % 10 === 0; g.lineWidth = big ? 4 : mid ? 3 : 1.2; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, big ? 36 : mid ? 26 : cm % 5 === 0 ? 18 : 11); g.stroke(); if (big) g.fillText(String(cm / 100).replace('.', ',') + ' m', X, 66); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
/** a tube whose centre line follows a function of x in the xy plane; returns {mesh, set(len, yOf, y0, z)} */
function makeRope(radius, color, N = 240, R = 8) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * (R + 1) * 3), nrm = new Float32Array(pos.length), idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, mat(color, {metalness: 0.1, roughness: 0.6})); mesh.frustumCulled = false; mesh.castShadow = true;
  return {mesh, set(len, yOf, y0, z = 0) { const p = geo.attributes.position, n = geo.attributes.normal, xs = new Float32Array(N + 1), ys = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) { xs[i] = (i / N) * len; ys[i] = y0 + yOf(xs[i]); }
    for (let i = 0; i <= N; i++) { const a = Math.max(0, i - 1), b = Math.min(N, i + 1), tx = xs[b] - xs[a], ty = ys[b] - ys[a], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l;
      for (let j = 0; j <= R; j++) { const ph = (j / R) * Math.PI * 2, c = Math.cos(ph), s = Math.sin(ph), k = (i * (R + 1) + j) * 3; p.array[k] = xs[i] + nx * c * radius; p.array[k + 1] = ys[i] + ny * c * radius; p.array[k + 2] = z + s * radius; n.array[k] = nx * c; n.array[k + 1] = ny * c; n.array[k + 2] = s; } }
    p.needsUpdate = true; n.needsUpdate = true; }};
}

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  // rail, board, ruler
  add(root, new THREE.BoxGeometry(4.4, 0.06, 0.34), mat(COL.dark, {metalness: 0.4}), 1.3, 0.36, 0);
  for (const x of [-0.7, 3.3]) add(root, new THREE.BoxGeometry(0.1, 0.34, 0.34), mat(COL.dark, {metalness: 0.4}), x, 0.2, 0);
  const board = add(root, new THREE.BoxGeometry(BW, 1.4, 0.03), new THREE.MeshStandardMaterial({map: boardTex(), roughness: 0.85, metalness: 0}), BX0 + BW / 2, Y0, -0.32); board.castShadow = false;
  for (const x of [BX0 + 0.02, BX0 + BW - 0.02]) add(root, new THREE.BoxGeometry(0.05, 1.85, 0.05), mat(COL.steel), x, 0.925, -0.3); // board legs stand on the floor
  const ruler = add(root, new THREE.BoxGeometry(BW, 0.07, 0.012), new THREE.MeshStandardMaterial({map: rulerTex(), roughness: 0.6, metalness: 0}), BX0 + BW / 2, 0.43, 0.08); ruler.castShadow = false;
  // shaker with Scotch yoke (ghost housing)
  const cx = -0.5, hM = gmat(0x2d6470, {metalness: 0.55, roughness: 0.5}); const housing = add(root, new THREE.BoxGeometry(0.6, 0.6, 0.3), hM, cx, Y0, 0);
  const hEdge = new THREE.LineSegments(new THREE.EdgesGeometry(housing.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); housing.add(hEdge);
  add(root, new THREE.BoxGeometry(0.22, 0.46, 0.22), mat(COL.dark, {metalness: 0.4}), cx, 0.62, 0); // pillar that carries the shaker
  const disc = new THREE.Group(); disc.position.set(cx, Y0, 0); root.add(disc);
  add(disc, new THREE.CylinderGeometry(0.22, 0.22, 0.04, 40).rotateX(Math.PI / 2), mat(COL.steel, {metalness: 0.8, roughness: 0.3}), 0, 0, 0.02);
  const pin = add(disc, new THREE.CylinderGeometry(0.02, 0.02, 0.12, 14).rotateX(Math.PI / 2), mat(COL.orange, {metalness: 0.3}), 0.1, 0, 0.05, false);
  const yoke = new THREE.Group(); root.add(yoke);
  { const sh = new THREE.Shape(); sh.moveTo(-0.28, -0.15); sh.lineTo(0.28, -0.15); sh.lineTo(0.28, 0.15); sh.lineTo(-0.28, 0.15); sh.closePath(); const hole = new THREE.Path(); hole.moveTo(-0.2, -0.03); hole.lineTo(0.2, -0.03); hole.lineTo(0.2, 0.03); hole.lineTo(-0.2, 0.03); hole.closePath(); sh.holes.push(hole);
    add(yoke, new THREE.ExtrudeGeometry(sh, {depth: 0.03, bevelEnabled: false}), mat(COL.steel, {metalness: 0.7, roughness: 0.35}), 0, 0, 0.05, false); }
  add(yoke, new THREE.BoxGeometry(0.28, 0.022, 0.03), mat(COL.steel, {metalness: 0.7}), 0.28 + 0.14, 0, 0.065, false);
  // strings: the real one and two copies that show the incident and the reflected wave separately
  const rope = makeRope(0.02, COL.orange, 260), ropeI = makeRope(0.012, COL.blue, 160), ropeR = makeRope(0.012, COL.green, 160); root.add(rope.mesh, ropeI.mesh, ropeR.mesh);
  // right side: bridge (fixed end), pulley and weights, moved with L
  const right = new THREE.Group(); root.add(right);
  const brM = gmat(COL.dark, {metalness: 0.5}), bridge = add(right, new THREE.BoxGeometry(0.1, 0.62, 0.16), brM, 0, 0.7, 0); add(right, new THREE.BoxGeometry(0.2, 0.06, 0.3), mat(COL.dark, {metalness: 0.4}), 0, 0.42, 0);
  add(right, new THREE.BoxGeometry(0.1, 0.05, 0.1), mat(COL.orange, {metalness: 0.3}), 0, Y0 - 0.03, 0);
  const brEdge = new THREE.LineSegments(new THREE.EdgesGeometry(bridge.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); bridge.add(brEdge);
  add(right, new THREE.BoxGeometry(0.3, 0.025, 0.025), mat(0x1a1a1a), 0.15, Y0 + 0.0, 0, false);
  add(right, new THREE.CylinderGeometry(0.07, 0.07, 0.03, 28).rotateX(Math.PI / 2), mat(COL.steel, {metalness: 0.8}), 0.3, Y0 - 0.0, 0);
  add(right, new THREE.CylinderGeometry(0.01, 0.01, 0.14, 10).rotateX(Math.PI / 2), mat(COL.steel, {metalness: 0.9}), 0.3, Y0, -0.06, false); // axle
  add(right, new THREE.CylinderGeometry(0.012, 0.012, Y0 - 0.39, 10), mat(COL.steel, {metalness: 0.9}), 0.3, (Y0 + 0.39) / 2, -0.12, false); add(right, new THREE.BoxGeometry(0.14, 0.03, 0.14), mat(COL.dark, {metalness: 0.4}), 0.3, 0.405, -0.1, false); // pulley stand
  const cord = add(right, new THREE.CylinderGeometry(0.008, 0.008, 1, 8), mat(0x1a1a1a), 0.37, 0.65, 0, false);
  const hang = new THREE.Group(); hang.position.set(0.37, 0.5, 0); right.add(hang); const wM = gmat(0xc8a24a, {metalness: 0.8, roughness: 0.3}), weights = []; add(hang, new THREE.BoxGeometry(0.04, 0.04, 0.04), mat(COL.steel), 0, 0.0, 0, false);
  for (let i = 0; i < 10; i++) weights.push(add(hang, new THREE.CylinderGeometry(0.075, 0.075, 0.025, 28), wM, 0, 0.03 + i * 0.028, 0));
  // nodes, antinodes, bracket
  const nodes = [], antis = [], nM = flat(COL.red), aM = flat(COL.green);
  for (let i = 0; i < 12; i++) { const a = add(root, new THREE.SphereGeometry(0.036, 14, 10), nM, 0, Y0, 0.03, false), b = add(root, new THREE.SphereGeometry(0.036, 14, 10), aM, 0, Y0, 0.03, false); nodes.push(a); antis.push(b); }
  const bm = flat(COL.teal), bracket = new THREE.Group(); root.add(bracket); const bL = add(bracket, new THREE.BoxGeometry(1, 0.012, 0.012), bm, 0, 0, 0.03, false), b1 = add(bracket, new THREE.BoxGeometry(0.012, 0.08, 0.012), bm, 0, 0, 0.03, false), b2 = add(bracket, new THREE.BoxGeometry(0.012, 0.08, 0.012), bm, 0, 0, 0.03, false);
  pts.motor = marker(root, cx, Y0 + 0.34, 0.1); pts.crank = marker(root, cx, Y0 - 0.2, 0.1); pts.yoke = marker(root, cx + 0.2, Y0 + 0.15, 0.1); pts.bridge = marker(right, 0, 0.98, 0.0); pts.pulley = marker(right, 0.3, Y0 + 0.1, 0); pts.weights = marker(hang, 0.1, 0.1, 0); pts.node = marker(root, 0, 0, 0); pts.anti = marker(root, 0, 0, 0); pts.bracket = marker(root, 0, 0, 0); pts.inc = marker(root, 0.4, 0, 0); pts.refl = marker(root, 0.4, 0, 0); pts.ruler = marker(root, 2.6, 0.43, 0.08);
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td), w = 2 * Math.PI * s.f * r.t;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.88 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    hEdge.material.opacity = brEdge.material.opacity = 0.6 * e;
    disc.rotation.z = w; pin.position.x = Math.max(0.01, s.a0 * 3); yoke.position.set(cx, Y0 + s.a0 * Math.sin(w) * 3, 0); void pin;
    const L = s.L; right.position.x = L;
    rope.set(L, (x) => shape(s, x, r.t).u * 1, Y0, 0);
    const showC = s.showComp; ropeI.mesh.visible = ropeR.mesh.visible = showC;
    if (showC) { ropeI.set(L, (x) => shape(s, x, r.t).inc, Y0 + 0.42, 0.0); ropeR.set(L, (x) => shape(s, x, r.t).ref, Y0 - 0.42, 0.0); pts.inc.position.set(0.5, Y0 + 0.62, 0); pts.refl.position.set(0.5, Y0 - 0.62, 0); }
    // weights: one slotted weight per 50 g
    const nw = Math.round(s.mass / 0.05); weights.forEach((m, i) => (m.visible = i < nw)); const top = 0.03 + Math.max(0, nw - 1) * 0.028 + 0.0125; hang.position.y = 0.5; cord.scale.y = Math.max(0.05, Y0 - (0.5 + top)); cord.position.set(0.37, 0.5 + top + (Y0 - (0.5 + top)) / 2, 0);
    // nodes and antinodes
    nodes.forEach((m, i) => { const x = r.nodes[i]; m.visible = s.showNodes && x !== undefined; if (m.visible) m.position.set(x, Y0, 0.03); });
    antis.forEach((m, i) => { const x = r.anti[i]; m.visible = s.showNodes && x !== undefined; if (m.visible) m.position.set(x, Y0 + shape(s, x, r.t).u, 0.03); });
    const bx = r.nodes.length >= 2; bracket.visible = bx && s.showNodes; if (bx) { const x1 = r.nodes[r.nodes.length - 2], x2 = r.nodes[r.nodes.length - 1], hb = Y0 - Math.min(0.3, r.ampMax + 0.12) - 0.02; bL.scale.x = Math.abs(x2 - x1); bL.position.set((x1 + x2) / 2, hb, 0.03); b1.position.set(x1, hb, 0.03); b2.position.set(x2, hb, 0.03); pts.bracket.position.set((x1 + x2) / 2, hb, 0.03); }
    if (r.nodes.length) pts.node.position.set(r.nodes[Math.min(1, r.nodes.length - 1)], Y0, 0.03); if (r.anti.length) { const x = r.anti[r.anti.length - 1]; pts.anti.position.set(x, Y0 + shape(s, x, r.t).u, 0.03); }
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
