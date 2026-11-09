// VL10-M15 geometry: a retort stand with a simple pendulum, a vertical metre ruler (1 mm ticks) and a hand stopwatch. update(readout, model, td) poses everything.
import * as THREE from 'three';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const rulerTex = () => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 3200; const g = c.getContext('2d'); g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 128, 3200);
  const PX = 3200 / 160; g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.font = 'bold 26px monospace';
  for (let mm = 0; mm <= 1600; mm++) { const y = (mm / 10) * PX, big = mm % 100 === 0, tenth = mm % 10 === 0; g.lineWidth = big ? 4 : tenth ? 3 : 1.3; const len = big ? 56 : mm % 50 === 0 ? 42 : tenth ? 30 : 16; g.beginPath(); g.moveTo(0, y); g.lineTo(len, y); g.stroke(); if (big) g.fillText(String(mm / 10), 62, y + 9); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
export const Y_P = 2.1, RX = 0, RZ = -0.07;

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  add(root, new THREE.BoxGeometry(0.9, 0.04, 0.55), mat(COL.dark, {metalness: 0.4}), -0.3, 0.02, 0);
  add(root, new THREE.CylinderGeometry(0.014, 0.014, 2.4, 16), mat(COL.steel, {metalness: 0.9, roughness: 0.3}), -0.6, 1.2, 0);
  const clampM = gmat(COL.dark, {metalness: 0.4}); add(root, new THREE.BoxGeometry(0.07, 0.05, 0.05), clampM, -0.6, Y_P + 0.02, 0);
  add(root, new THREE.CylinderGeometry(0.008, 0.008, 0.62, 14).rotateZ(Math.PI / 2), mat(COL.steel, {metalness: 0.9, roughness: 0.3}), -0.3, Y_P + 0.02, 0);
  add(root, new THREE.BoxGeometry(0.03, 0.02, 0.05), clampM, 0, Y_P + 0.012, 0); add(root, new THREE.BoxGeometry(0.03, 0.02, 0.05), clampM, 0, Y_P - 0.012, 0);
  // ruler behind the string, 0 at the pivot
  const ruler = add(root, new THREE.BoxGeometry(0.045, 1.6, 0.008), new THREE.MeshStandardMaterial({map: rulerTex(), roughness: 0.6, metalness: 0}), RX, Y_P - 0.8, RZ); ruler.castShadow = false;
  add(root, new THREE.BoxGeometry(0.02, 0.02, 0.08), mat(COL.steel), RX, Y_P + 0.0, RZ / 2, false);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.0025, 0.002), flat(COL.orange)); mark.position.set(0.12, 1, RZ + 0.01); root.add(mark);
  // pendulum
  const strM = mat(0x1a1a1a, {metalness: 0.1, roughness: 0.9}), str = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 1, 6), strM); root.add(str);
  const bob = new THREE.Group(); root.add(bob); const bobM = gmat(0xb8c2ca, {metalness: 0.9, roughness: 0.25}); const ball = add(bob, new THREE.SphereGeometry(0.04, 32, 20), bobM, 0, 0, 0);
  const bedge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(0.04, 12, 8)), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); ball.add(bedge);
  add(bob, new THREE.TorusGeometry(0.008, 0.0025, 8, 14), mat(COL.steel), 0, 0.044, 0, false); add(bob, new THREE.CylinderGeometry(0.0035, 0.0035, 0.08, 8), mat(COL.orange), 0, 0.0, 0, false);
  // stopwatch on a small stand
  const sw = new THREE.Group(); sw.position.set(0.75, 0.0, 0.1); root.add(sw);
  add(sw, new THREE.CylinderGeometry(0.16, 0.18, 0.04, 28), mat(COL.dark), 0, 0.02, 0);
  const watchM = gmat(0xe5eaee, {metalness: 0.6, roughness: 0.3}); const body = add(sw, new THREE.CylinderGeometry(0.1, 0.1, 0.035, 36).rotateX(Math.PI / 2), watchM, 0, 0.17, 0); body.rotation.x = 0;
  const fc = document.createElement('canvas'); fc.width = 256; fc.height = 128; const fg = fc.getContext('2d'), ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace;
  const draw = (txt) => { fg.fillStyle = '#9adbb0'; fg.fillRect(0, 0, 256, 128); fg.fillStyle = '#16402a'; fg.font = 'bold 58px monospace'; fg.textAlign = 'center'; fg.textBaseline = 'middle'; fg.fillText(txt, 128, 70); fg.font = 'bold 22px monospace'; fg.fillText('s', 236, 100); ftex.needsUpdate = true; }; draw('--.--');
  const face = add(sw, new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshBasicMaterial({map: ftex}), 0, 0.17, 0.0192, false); let lastTxt = '';
  add(sw, new THREE.CylinderGeometry(0.012, 0.012, 0.03, 12), mat(COL.orange), 0, 0.285, 0, false);
  add(sw, new THREE.CylinderGeometry(0.01, 0.014, 0.1, 12), mat(COL.steel), 0, 0.09, 0, false);
  const chip = add(sw, new THREE.BoxGeometry(0.1, 0.03, 0.01), mat(0x1e8c4a, {metalness: 0.3}), 0, 0.17, 0.0, false); chip.visible = false; const chipM = chip;
  pts.pivot = marker(root, 0, Y_P, 0); pts.bob = marker(bob, 0.05, 0, 0); pts.ruler = marker(root, RX + 0.04, Y_P - 0.25, RZ); pts.watch = marker(sw, 0, 0.3, 0); pts.clamp = marker(root, -0.6, Y_P + 0.02, 0); pts.read = marker(root, 0.18, 1, RZ);
  let wtxt = '';
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td);
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    bedge.material.opacity = 0.5 * e; chipM.visible = e > 0.3;
    const L = s.l, th = r.theta, bx = L * Math.sin(th), by = Y_P - L * Math.cos(th);
    bob.position.set(bx, by, 0); str.scale.y = L; str.position.set(bx / 2, (Y_P + by) / 2, 0); str.rotation.z = th;
    mark.position.y = Y_P - L; pts.read.position.y = Y_P - L; void wtxt; void face;
    const txt = r.last == null ? '--.--' : r.last.toFixed(2); if (txt !== lastTxt) { draw(txt); lastTxt = txt; }
    root.updateMatrixWorld(true);
  }
  void ruler;
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
