// W2 geometry. Scene 1: a long spring lying on a smooth table (rings = coils), a hand-driven carriage at the left, a foam absorber at the right.
// Scene 2: a point loudspeaker with two sound-intensity meters at r and 2r and the spherical wave fronts they sit on.
import * as THREE from 'three';
import {D0, L, N, u} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, red: 0xd62839, blue: 0x2b59c3};
export const TY = 0.8, RY = TY + 0.092; // table top, ring centre height
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const rulerTex = () => {
  const c = document.createElement('canvas'); c.width = 2304; c.height = 80; const g = c.getContext('2d'), PX = 2304 / 5.0; g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 2304, 80); g.fillStyle = '#14303c'; g.strokeStyle = '#14303c'; g.font = 'bold 28px monospace'; g.textAlign = 'center';
  for (let cm = 0; cm <= 450; cm++) { const X = (cm / 100 + 0.25) * PX, big = cm % 50 === 0, mid = cm % 10 === 0; g.lineWidth = big ? 4 : mid ? 3 : 1.2; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, big ? 36 : mid ? 26 : cm % 5 === 0 ? 18 : 11); g.stroke(); if (big) g.fillText(String(cm / 100).replace('.', ',') + ' m', X, 66); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  // ------------------------------------------------------------ scene 1: spring on a table
  const S = new THREE.Group(); root.add(S);
  add(S, new THREE.BoxGeometry(5.6, 0.05, 0.7), mat(0xdfe6ea, {roughness: 0.25, metalness: 0.1}), L / 2, TY - 0.025, 0);
  for (const [x, z] of [[-0.2, -0.28], [L + 0.2, -0.28], [-0.2, 0.28], [L + 0.2, 0.28], [L / 2, -0.28], [L / 2, 0.28]]) add(S, new THREE.BoxGeometry(0.07, TY - 0.05, 0.07), mat(0x353a42, {metalness: 0.4}), x, (TY - 0.05) / 2, z);
  const ruler = add(S, new THREE.BoxGeometry(5.0, 0.06, 0.012), new THREE.MeshStandardMaterial({map: rulerTex(), roughness: 0.6}), L / 2, TY + 0.003, 0.37, false); ruler.rotation.x = -Math.PI / 2; ruler.position.y = TY + 0.002; ruler.position.z = 0.31;
  // spring rings (instanced) with a marked ring and a ball on it
  const ringGeo = new THREE.TorusGeometry(0.085, 0.0065, 8, 36).rotateY(Math.PI / 2), rings = new THREE.InstancedMesh(ringGeo, new THREE.MeshStandardMaterial({color: 0xffffff, metalness: 0.85, roughness: 0.3}), N); rings.castShadow = true; rings.frustumCulled = false; S.add(rings);
  const base = new THREE.Color(0xaeb8c0), red = new THREE.Color(COL.red), blue = new THREE.Color(COL.blue), gold = new THREE.Color(0xe8a317);
  for (let i = 0; i < N; i++) rings.setColorAt(i, i % 10 === 0 ? red : base);
  const sel = add(S, new THREE.TorusGeometry(0.1, 0.012, 10, 36).rotateY(Math.PI / 2), mat(COL.orange, {metalness: 0.2}), 0, RY, 0, false);
  const dummy = new THREE.Object3D();
  // carriage + handle at the left, driven by the first ring
  const car = new THREE.Group(); S.add(car); const cM = gmat(0x2d6470, {metalness: 0.55}), cBody = add(car, new THREE.BoxGeometry(0.2, 0.12, 0.3), cM, -0.12, TY + 0.06, 0); const cEdge = new THREE.LineSegments(new THREE.EdgesGeometry(cBody.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); cBody.add(cEdge);
  add(car, new THREE.CylinderGeometry(0.012, 0.012, 0.18, 10).rotateZ(Math.PI / 2), mat(COL.steel, {metalness: 0.9}), -0.05, RY, 0, false);
  add(car, new THREE.BoxGeometry(0.03, 0.2, 0.2), mat(COL.orange, {metalness: 0.3}), -0.015, RY, 0, false);
  const slide = add(S, new THREE.BoxGeometry(0.7, 0.012, 0.12), mat(COL.dark, {metalness: 0.4}), -0.14, TY + 0.006, 0, false);
  // foam absorber
  const fM = gmat(0x4a4f57, {roughness: 0.95, metalness: 0}); const foam = add(S, new THREE.BoxGeometry(0.3, 0.2, 0.34), fM, L + 0.2, TY + 0.1, 0); const fEdge = new THREE.LineSegments(new THREE.EdgesGeometry(foam.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); foam.add(fEdge);
  // wavelength bracket
  const bm = new THREE.MeshBasicMaterial({color: COL.teal}), bracket = new THREE.Group(); S.add(bracket); const bL = add(bracket, new THREE.BoxGeometry(1, 0.01, 0.01), bm, 0, 0, 0, false), b1 = add(bracket, new THREE.BoxGeometry(0.01, 0.1, 0.01), bm, 0, 0, 0, false), b2 = add(bracket, new THREE.BoxGeometry(0.01, 0.1, 0.01), bm, 0, 0, 0, false);
  pts.slinky = marker(S, 2.2, RY + 0.16, 0); pts.carriage = marker(S, -0.14, TY + 0.14, 0); pts.absorber = marker(S, L + 0.2, TY + 0.24, 0); pts.sel = marker(S, 0, RY + 0.12, 0); pts.bracket = marker(S, 0, 0, 0); pts.ruler = marker(S, 3.8, TY + 0.0, 0.31); pts.zone = marker(S, 0, RY + 0.17, 0);
  // ------------------------------------------------------------ scene 2: loudspeaker and two intensity meters
  const I = new THREE.Group(); root.add(I);
  add(I, new THREE.BoxGeometry(6.2, 0.05, 1.4), mat(0xdfe6ea, {roughness: 0.4}), 2.3, 0.025, 0, false);
  const spk = new THREE.Group(); I.add(spk); const spM = gmat(0x2d6470, {metalness: 0.5, roughness: 0.5}); const spBody = add(spk, new THREE.BoxGeometry(0.34, 0.5, 0.34), spM, 0, 0.3 + 0.25, 0); const spEdge = new THREE.LineSegments(new THREE.EdgesGeometry(spBody.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); spBody.add(spEdge);
  add(spk, new THREE.BoxGeometry(0.1, 0.3, 0.1), mat(COL.dark), 0, 0.15 + 0.0, 0); add(spk, new THREE.BoxGeometry(0.5, 0.05, 0.5), mat(COL.dark, {metalness: 0.4}), 0, 0.075, 0);
  const cone = add(spk, new THREE.CylinderGeometry(0.1, 0.05, 0.08, 28).rotateZ(Math.PI / 2), mat(0xdfe6ea, {metalness: 0.2}), 0.19, 0.58, 0, false), dust = add(spk, new THREE.SphereGeometry(0.03, 14, 10), mat(COL.orange), 0.23, 0.58, 0, false); void dust;
  const meters = [0, 1].map((i) => { const g = new THREE.Group(); I.add(g); add(g, new THREE.CylinderGeometry(0.035, 0.05, 0.5, 14), mat(COL.steel, {metalness: 0.8}), 0, 0.3, 0); add(g, new THREE.BoxGeometry(0.2, 0.05, 0.3), mat(COL.dark, {metalness: 0.4}), 0, 0.075, 0);
    const head = add(g, new THREE.BoxGeometry(0.1, 0.16, 0.16), mat(i ? COL.orange : COL.teal, {metalness: 0.3}), 0, 0.58, 0); add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16).rotateZ(Math.PI / 2), mat(0x20252b), -0.06, 0.58, 0, false); return {g, head}; });
  const shells = [0, 1].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({color: i ? COL.orange : COL.teal, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false})); m.position.y = 0.58; I.add(m); const w = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.LineBasicMaterial({color: i ? COL.orange : COL.teal, transparent: true, opacity: 0.35})); m.add(w); return m; });
  const ir = add(I, new THREE.BoxGeometry(6.0, 0.012, 0.05), new THREE.MeshStandardMaterial({map: rulerTex(), roughness: 0.6}), 2.25, 0.056, 0.55, false); ir.rotation.x = -Math.PI / 2; ir.scale.set(1.2, 1, 1); ir.visible = false;
  const rail = add(I, new THREE.BoxGeometry(5.6, 0.02, 0.06), mat(COL.dark, {metalness: 0.4}), 2.3, 0.06, 0, false);
  pts.speaker = marker(spk, 0, 0.9, 0); pts.m1 = marker(I, 0, 0.8, 0); pts.m2 = marker(I, 0, 0.8, 0); pts.spkPart = marker(spk, 0.19, 0.58, 0.18); pts.sh1 = marker(I, 0, 0.2, 0); pts.sh2 = marker(I, 0, 0.2, 0);
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td), isI = s.mode === 'I'; S.visible = !isI; I.visible = isI;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.88 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    cEdge.material.opacity = fEdge.material.opacity = spEdge.material.opacity = 0.6 * e;
    if (!isI) {
      const long = s.mode === 'L';
      for (let i = 0; i < N; i++) { const x0 = i * D0, d = u(s, x0, r.t); dummy.position.set(x0 + (long ? d : 0), RY, long ? 0 : d); dummy.updateMatrix(); rings.setMatrixAt(i, dummy.matrix); }
      rings.instanceMatrix.needsUpdate = true;
      const d0 = u(s, 0, r.t); car.position.set(long ? d0 : 0, 0, long ? 0 : d0); slide.visible = true;
      const xs = r.ip * D0 + (long ? r.uP : 0), zs = long ? 0 : r.uP; sel.position.set(xs, RY, zs); pts.sel.position.set(xs, RY + 0.14, zs);
      const cr = long ? r.nen : r.crest, hb = RY + 0.34;
      bracket.visible = cr.length >= 2; if (bracket.visible) { const a = cr[0], b = cr[1]; bL.scale.x = b - a; bL.position.set((a + b) / 2, hb, 0); b1.position.set(a, hb, 0); b2.position.set(b, hb, 0); pts.bracket.position.set((a + b) / 2, hb, 0); }
      if (long && r.nen.length) pts.zone.position.set(r.nen[Math.min(1, r.nen.length - 1)], RY + 0.2, 0); else if (r.crest.length) pts.zone.position.set(r.crest[Math.min(1, r.crest.length - 1)], RY + 0.2, 0.0);
    } else {
      const x1 = s.r, x2 = 2 * s.r; meters[0].g.position.set(x1, 0, 0); meters[1].g.position.set(x2, 0, 0);
      shells[0].scale.setScalar(x1); shells[1].scale.setScalar(x2);
      pts.m1.position.set(x1, 0.82, 0); pts.m2.position.set(x2, 0.82, 0); pts.sh1.position.set(x1 * 0.7, 0.58 + x1 * 0.7, 0); pts.sh2.position.set(x2 * 0.7, 0.58 + x2 * 0.7, 0);
      const pulse = Math.sin(2 * Math.PI * 2 * r.t); cone.position.x = 0.19 + 0.01 * pulse;
    }
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
