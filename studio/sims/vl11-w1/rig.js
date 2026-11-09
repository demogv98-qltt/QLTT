// W1 geometry: a long string stretched between a crank-driven shaker (Scotch yoke) and a foam absorber, in front of a grid board,
// with a metre rule and marker beads. update(readout, model, td) poses everything from the wave model.
import * as THREE from 'three';
import {L, u} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, red: 0xd62839, blue: 0x2b59c3};
export const Y0 = 1.05;
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const boardTex = () => {
  const c = document.createElement('canvas'); c.width = 2304; c.height = 640; const g = c.getContext('2d'), PX = 2304 / 5.2, py = (m) => 320 - m * 1000 * 0.64 * 1.0; // 640 px for 1.0 m → 640 px/m
  g.fillStyle = '#f7fafc'; g.fillRect(0, 0, 2304, 640);
  g.lineWidth = 1.5; g.strokeStyle = '#d3dee6'; for (let x = -0.3; x <= 4.95; x += 0.1) { const X = (x + 0.35) * PX; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, 640); g.stroke(); }
  for (let y = -0.5; y <= 0.5; y += 0.05) { const Y = 320 - y * 640; g.lineWidth = Math.abs(y * 100 % 10) < 1e-6 ? 2 : 1; g.beginPath(); g.moveTo(0, Y); g.lineTo(2304, Y); g.stroke(); }
  g.strokeStyle = '#7d93a0'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 320); g.lineTo(2304, 320); g.stroke();
  g.fillStyle = '#14303c'; g.font = 'bold 26px monospace'; g.textAlign = 'left'; for (let cm = -30; cm <= 30; cm += 10) { if (cm === 0) continue; g.fillText((cm > 0 ? '+' : '−') + Math.abs(cm) + ' cm', 14, 320 - cm * 6.4 + 9); }
  void py; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const rulerTex = () => {
  const c = document.createElement('canvas'); c.width = 2304; c.height = 96; const g = c.getContext('2d'), PX = 2304 / 5.2; g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 2304, 96); g.fillStyle = '#14303c'; g.strokeStyle = '#14303c'; g.font = 'bold 30px monospace'; g.textAlign = 'center';
  for (let cm = 0; cm <= 450; cm += 1) { const X = (cm / 100 + 0.35) * PX, big = cm % 50 === 0, mid = cm % 10 === 0; g.lineWidth = big ? 4 : mid ? 3 : 1.3; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, big ? 42 : mid ? 30 : cm % 5 === 0 ? 20 : 12); g.stroke(); if (big) g.fillText(String(cm / 100).replace('.', ',') + ' m', X, 78); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  // rail, stands, board, ruler
  add(root, new THREE.BoxGeometry(6.1, 0.06, 0.34), mat(COL.dark, {metalness: 0.4}), 2.2, 0.36, 0);
  for (const x of [-0.8, 5.2]) { add(root, new THREE.BoxGeometry(0.5, 0.06, 0.5), mat(COL.dark, {metalness: 0.4}), x, 0.03, 0); add(root, new THREE.CylinderGeometry(0.02, 0.02, 0.9, 12), mat(COL.steel, {metalness: 0.9}), x, 0.5, 0); }
  for (const x of [-0.35, 4.75]) add(root, new THREE.BoxGeometry(0.1, 0.34, 0.34), mat(COL.dark, {metalness: 0.4}), x, 0.2, 0);
  const board = add(root, new THREE.BoxGeometry(5.2, 1.0, 0.03), new THREE.MeshStandardMaterial({map: boardTex(), roughness: 0.85, metalness: 0}), 2.25, Y0, -0.32); board.castShadow = false;
  for (const x of [-0.35, 4.85]) add(root, new THREE.BoxGeometry(0.05, 1.6, 0.05), mat(COL.steel), x, 0.8, -0.3); // board legs stand on the floor
  add(root, new THREE.BoxGeometry(0.16, 0.45, 0.16), mat(COL.dark, {metalness: 0.4}), L + 0.2, 0.615, 0); // pillar under the absorber
  const ruler = add(root, new THREE.BoxGeometry(5.2, 0.075, 0.012), new THREE.MeshStandardMaterial({map: rulerTex(), roughness: 0.6, metalness: 0}), 2.25, 0.43, 0.08); ruler.castShadow = false;
  // shaker: housing (ghost) around a Scotch yoke driven by a rotating crank
  const hM = gmat(0x2d6470, {metalness: 0.55, roughness: 0.5}); const housing = add(root, new THREE.BoxGeometry(0.62, 0.62, 0.3), hM, -0.55, Y0, 0);
  const hEdge = new THREE.LineSegments(new THREE.EdgesGeometry(housing.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); housing.add(hEdge);
  const cx = -0.55, disc = new THREE.Group(); disc.position.set(cx, Y0, 0.0); root.add(disc);
  add(disc, new THREE.CylinderGeometry(0.26, 0.26, 0.04, 40).rotateX(Math.PI / 2), mat(COL.steel, {metalness: 0.8, roughness: 0.3}), 0, 0, 0.02);
  for (const a of [0, 1, 2, 3, 4, 5]) add(disc, new THREE.CylinderGeometry(0.018, 0.018, 0.045, 10).rotateX(Math.PI / 2), mat(0x20252b), Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0.022, false);
  const pin = add(disc, new THREE.CylinderGeometry(0.022, 0.022, 0.12, 14).rotateX(Math.PI / 2), mat(COL.orange, {metalness: 0.3}), 0.1, 0, 0.05, false);
  add(root, new THREE.CylinderGeometry(0.05, 0.05, 0.3, 24).rotateX(Math.PI / 2), mat(COL.dark), cx, Y0, -0.2);
  const yoke = new THREE.Group(); root.add(yoke);
  { const sh = new THREE.Shape(); sh.moveTo(-0.32, -0.17); sh.lineTo(0.32, -0.17); sh.lineTo(0.32, 0.17); sh.lineTo(-0.32, 0.17); sh.closePath(); const hole = new THREE.Path(); hole.moveTo(-0.26, -0.032); hole.lineTo(0.26, -0.032); hole.lineTo(0.26, 0.032); hole.lineTo(-0.26, 0.032); hole.closePath(); sh.holes.push(hole);
    const m = add(yoke, new THREE.ExtrudeGeometry(sh, {depth: 0.03, bevelEnabled: false}), mat(COL.steel, {metalness: 0.7, roughness: 0.35}), 0, 0, 0.05, false); void m; }
  add(yoke, new THREE.BoxGeometry(0.26, 0.025, 0.03), mat(COL.steel, {metalness: 0.7}), 0.32 + 0.13, 0, 0.065, false);
  // the string: a tube whose centre line follows u(x,t) in the xy plane
  const N = 320, R = 8, ropeGeo = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * (R + 1) * 3), idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  ropeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); ropeGeo.setIndex(idx); const rope = new THREE.Mesh(ropeGeo, mat(0xe8590c, {metalness: 0.1, roughness: 0.6})); rope.castShadow = true; rope.frustumCulled = false; root.add(rope);
  const nrm = new Float32Array(pos.length); ropeGeo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  // absorber: foam wedge block at the far end (ghost)
  const fM = gmat(0x4a4f57, {roughness: 0.95, metalness: 0}); const foam = add(root, new THREE.BoxGeometry(0.4, 0.42, 0.26), fM, L + 0.2, Y0, 0);
  const fEdge = new THREE.LineSegments(new THREE.EdgesGeometry(foam.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); foam.add(fEdge);
  // beads that stand for pieces of the string
  const beads = [], bM = mat(0xf2f5f7, {metalness: 0.2, roughness: 0.35}); for (let i = 0; i <= 18; i++) { const b = add(root, new THREE.SphereGeometry(0.04, 16, 12), bM, i * 0.25, Y0, 0.0, false); beads.push(b); }
  const bP = add(root, new THREE.SphereGeometry(0.065, 20, 14), mat(COL.red, {metalness: 0.2, roughness: 0.35}), 0, Y0, 0.0, false), bQ = add(root, new THREE.SphereGeometry(0.065, 20, 14), mat(COL.blue, {metalness: 0.2, roughness: 0.35}), 0, Y0, 0.0, false);
  const dropM = (c) => new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: 0.6}), dP = add(root, new THREE.CylinderGeometry(0.006, 0.006, 1, 6), dropM(COL.red), 0, 0, 0, false), dQ = add(root, new THREE.CylinderGeometry(0.006, 0.006, 1, 6), dropM(COL.blue), 0, 0, 0, false);
  // wavelength bracket and amplitude gauge
  const bracket = new THREE.Group(); root.add(bracket); const bm = flat(COL.teal); const bLine = add(bracket, new THREE.BoxGeometry(1, 0.012, 0.012), bm, 0, 0, 0.02, false), bT1 = add(bracket, new THREE.BoxGeometry(0.012, 0.09, 0.012), bm, 0, 0, 0.02, false), bT2 = add(bracket, new THREE.BoxGeometry(0.012, 0.09, 0.012), bm, 0, 0, 0.02, false);
  const ampL = add(root, new THREE.BoxGeometry(0.012, 1, 0.012), flat(COL.ink), 0, 0, 0.03, false), ampT = add(root, new THREE.BoxGeometry(0.1, 0.012, 0.012), flat(COL.ink), 0, 0, 0.03, false), ampB = add(root, new THREE.BoxGeometry(0.1, 0.012, 0.012), flat(COL.ink), 0, 0, 0.03, false);
  pts.crank = marker(root, -0.55, Y0 - 0.2, 0.1); pts.yoke = marker(root, -0.3, Y0 + 0.17, 0.1); pts.motor = marker(root, -0.55, Y0 + 0.36, 0.1); pts.bracket = marker(root, 0, 0, 0); pts.amp = marker(root, 0, 0, 0); pts.P = marker(root, 0, 0, 0); pts.Q = marker(root, 0, 0, 0); pts.absorber = marker(root, L + 0.2, Y0 + 0.28, 0); pts.ruler = marker(root, 3.6, 0.43, 0.08); pts.board = marker(root, 3.3, Y0 + 0.45, -0.3);
  const tmp = new THREE.Vector3();
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td);
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.88 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    hEdge.material.opacity = fEdge.material.opacity = 0.6 * e;
    // crank angle is ωt, so the yoke (and the string end) moves like A·sin(ωt)
    const th = r.w * r.t; disc.rotation.z = th - 0; const crankR = 0.1 + 0.9 * (s.A - 0.02) / 0.18 * 0.1; pin.position.x = Math.max(0.02, s.A); void crankR;
    const y = s.A * Math.sin(th); yoke.position.set(cx, Y0 + y, 0);
    // rope
    const p = ropeGeo.attributes.position, n = ropeGeo.attributes.normal, rad = 0.02; const cxs = new Float32Array(N + 1), cys = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) { const x = (i / N) * L; cxs[i] = x; cys[i] = Y0 + u(s, x, r.t); }
    for (let i = 0; i <= N; i++) { const a = Math.max(0, i - 1), b = Math.min(N, i + 1), tx = cxs[b] - cxs[a], ty = cys[b] - cys[a], len = Math.hypot(tx, ty) || 1, nx = -ty / len, ny = tx / len;
      for (let j = 0; j <= R; j++) { const ph = (j / R) * Math.PI * 2, c = Math.cos(ph), sn = Math.sin(ph), k = (i * (R + 1) + j) * 3; p.array[k] = cxs[i] + nx * c * rad; p.array[k + 1] = cys[i] + ny * c * rad; p.array[k + 2] = sn * rad; n.array[k] = nx * c; n.array[k + 1] = ny * c; n.array[k + 2] = sn; } }
    p.needsUpdate = true; n.needsUpdate = true;
    beads.forEach((b, i) => b.position.set(i * 0.25, Y0 + u(s, i * 0.25, r.t), 0));
    const yp = Y0 + u(s, s.xP, r.t), yq = Y0 + u(s, s.xQ, r.t); bP.position.set(s.xP, yp, 0.0); bQ.position.set(s.xQ, yq, 0.0);
    const drop = (m, x, yy) => { const h = yy - 0.47; m.scale.y = Math.max(0.01, h); m.position.set(x, 0.47 + h / 2, 0.08); }; drop(dP, s.xP, yp); drop(dQ, s.xQ, yq);
    // bracket between two consecutive crests, amplitude gauge at the first crest
    const cr = r.crests, hb = Y0 + s.A + 0.2;
    bracket.visible = cr.length >= 2; if (bracket.visible) { const x1 = cr[0], x2 = cr[1]; bLine.scale.x = x2 - x1; bLine.position.set((x1 + x2) / 2, hb, 0.02); bT1.position.set(x1, hb, 0.02); bT2.position.set(x2, hb, 0.02); pts.bracket.position.set((x1 + x2) / 2, hb, 0.02); }
    const gx = cr.length ? cr[0] + 0.12 : 0, show = cr.length >= 1; for (const m of [ampL, ampT, ampB]) m.visible = show;
    if (show) { ampL.scale.y = s.A; ampL.position.set(gx, Y0 + s.A / 2, 0.03); ampT.position.set(gx, Y0 + s.A, 0.03); ampB.position.set(gx, Y0, 0.03); pts.amp.position.set(gx, Y0 + s.A / 2, 0.03); }
    pts.P.position.set(s.xP, yp, 0); pts.Q.position.set(s.xQ, yq, 0);
    root.updateMatrixWorld(true); void tmp;
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
