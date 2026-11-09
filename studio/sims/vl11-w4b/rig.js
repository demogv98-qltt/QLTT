// W4B geometry: an optical bench with a laser, a double-slit plate and a screen that shows the fringes (texture computed from physics.js).
// The 3D drawing is NOT to scale: the slits are drawn far wider apart than a real a ≈ 0.5 mm so that they can be seen.
import * as THREE from 'three';
import {HALF, fringe, pixel, wlRGB} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, red: 0xd62839};
export const BY = 0.78, AX = 1.05; // bench top, optical axis height
export const SW = 0.34, SH = 0.3; // screen half-width (3D) and half-height
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const mmTex = () => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 1024, 64); g.fillStyle = '#14303c'; g.strokeStyle = '#14303c'; g.font = 'bold 22px monospace'; g.textAlign = 'center';
  for (let mm = -30; mm <= 30; mm++) { const X = 512 + (mm / 30) * 512 * 0.998, big = mm % 10 === 0, mid = mm % 5 === 0; g.lineWidth = big ? 3 : 1.5; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, big ? 30 : mid ? 22 : 14); g.stroke(); if (big) g.fillText(String(mm) + ' mm', Math.min(990, Math.max(34, X)), 54); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  // bench: rail, legs to the floor, three carriers
  const rail = add(root, new THREE.BoxGeometry(1, 0.06, 0.16), mat(COL.dark, {metalness: 0.4}), 0, BY - 0.03, 0);
  const legs = [0, 1].map(() => add(root, new THREE.BoxGeometry(0.08, BY - 0.06, 0.2), mat(0x353a42, {metalness: 0.4}), 0, (BY - 0.06) / 2, 0));
  const carrier = (w = 0.2) => add(root, new THREE.BoxGeometry(w, 0.08, 0.2), mat(COL.steel, {metalness: 0.8, roughness: 0.4}), 0, BY + 0.04, 0);
  const cL = carrier(0.3), cS = carrier(), cM = carrier(0.34);
  // laser: ghost body, lens and a colour window
  const lg = new THREE.Group(); root.add(lg); add(lg, new THREE.BoxGeometry(0.07, AX - BY - 0.08 - 0.07, 0.07), mat(COL.steel), 0.05, BY + 0.08 + (AX - BY - 0.15) / 2, 0); // post from the carrier up to the laser body
  const lM = gmat(0x2d6470, {metalness: 0.55, roughness: 0.45}), lbody = add(lg, new THREE.CylinderGeometry(0.07, 0.07, 0.34, 28).rotateZ(Math.PI / 2), lM, 0.05, AX, 0);
  const lEdge = new THREE.LineSegments(new THREE.EdgesGeometry(lbody.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); lbody.add(lEdge);
  const win = add(lg, new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xff3b30}), 0.225, AX, 0, false);
  const diode = add(lg, new THREE.BoxGeometry(0.05, 0.04, 0.04), mat(0x20252b), 0.0, AX, 0, false); diode.visible = true; const lcoil = add(lg, new THREE.CylinderGeometry(0.045, 0.045, 0.08, 20).rotateZ(Math.PI / 2), mat(0xb87333, {metalness: 0.8}), -0.05, AX, 0, false); void lcoil;
  // slit plate: three bars with two gaps (resized every frame), plus a post to the carrier
  const plate = new THREE.Group(); root.add(plate); const pM = gmat(0x20252b, {metalness: 0.3, roughness: 0.6});
  const bars = [0, 1, 2].map(() => add(plate, new THREE.BoxGeometry(1, 0.46, 0.02), pM, 0, AX, 0)), post = add(plate, new THREE.BoxGeometry(0.06, AX - 0.23 - BY - 0.08, 0.04), mat(COL.steel), 0, BY + 0.08 + (AX - 0.23 - BY - 0.08) / 2, 0);
  // screen: frame, picture, millimetre ruler, post
  const scr = new THREE.Group(); root.add(scr);
  add(scr, new THREE.BoxGeometry(0.03, SH * 2 + 0.06, SW * 2 + 0.06), mat(0xd8dde2, {roughness: 0.8, metalness: 0}), 0, AX, 0);
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 8; const cx = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(SW * 2, SH * 2).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({map: tex})); pic.position.set(-0.0165, AX, 0); scr.add(pic);
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(SW * 2, 0.07).rotateY(-Math.PI / 2), new THREE.MeshStandardMaterial({map: mmTex(), roughness: 0.7})); ruler.position.set(-0.019, AX - SH - 0.065, 0); scr.add(ruler);
  add(scr, new THREE.BoxGeometry(0.06, AX - SH - 0.03 - BY - 0.08, 0.06), mat(COL.steel), 0, BY + 0.08 + (AX - SH - 0.03 - BY - 0.08) / 2, 0);
  const cur = new THREE.Mesh(new THREE.BoxGeometry(0.006, SH * 2, 0.008), new THREE.MeshBasicMaterial({color: 0xd62839})); cur.position.set(-0.022, AX, 0); scr.add(cur);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), new THREE.MeshBasicMaterial({color: 0xd62839})); dot.position.set(-0.03, AX, 0); scr.add(dot);
  // light: laser beam, wedge beams from the slits to the screen, and the two paths S1P and S2P to the cursor point
  const beamMat = new THREE.MeshBasicMaterial({color: 0xff3b30, transparent: true, opacity: 0.85}), beam1 = add(root, new THREE.CylinderGeometry(0.006, 0.006, 1, 8), beamMat, 0, AX, 0, false);
  const wedgeMat = new THREE.MeshBasicMaterial({color: 0xff3b30, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false}); const wedge = new THREE.Mesh(new THREE.BufferGeometry(), wedgeMat); wedge.frustumCulled = false; root.add(wedge);
  const wpos = new Float32Array(18); wedge.geometry.setAttribute('position', new THREE.BufferAttribute(wpos, 3));
  const pathM = [COL.teal, COL.orange].map((c) => add(root, new THREE.CylinderGeometry(0.004, 0.004, 1, 6), new THREE.MeshBasicMaterial({color: c}), 0, AX, 0, false));
  pts.laser = marker(root); pts.plate = marker(root); pts.screen = marker(root); pts.cursor = marker(root); pts.ruler = marker(root); pts.bench = marker(root); pts.win = marker(root);
  let key = '', last = {};
  const tmpUp = new THREE.Vector3(1, 0, 0);
  function seg(m, a, b) { const d = b.clone().sub(a), len = d.length(); m.scale.y = len; m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td), D = s.D;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.88 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    lEdge.material.opacity = 0.55 * e;
    // layout along x: laser at -0.55, slits at 0, screen at D (metres)
    lg.position.x = -0.55; cL.position.x = -0.55; plate.position.x = 0; cS.position.x = 0; scr.position.x = D; cM.position.x = D;
    const x0 = -0.8, x1 = D + 0.5; rail.scale.x = x1 - x0; rail.position.x = (x0 + x1) / 2; legs[0].position.x = x0 + 0.15; legs[1].position.x = x1 - 0.15;
    // slits: visual separation grows with a
    const sep = 0.1 + (0.3 * (s.a - 0.2)) / 0.8, g = 0.014, half = 0.3;
    const edges = [[-half, -sep / 2 - g / 2], [-sep / 2 + g / 2, sep / 2 - g / 2], [sep / 2 + g / 2, half]];
    bars.forEach((b, i) => { b.geometry.dispose(); b.geometry = new THREE.BoxGeometry(0.02, 0.46, edges[i][1] - edges[i][0]); b.position.set(0, AX, (edges[i][0] + edges[i][1]) / 2); });
    // light colour
    const col = s.white ? new THREE.Color(1, 1, 1) : new THREE.Color(...wlRGB(s.wl).map((v) => v)); beamMat.color.copy(col); wedgeMat.color.copy(col); win.material.color.copy(col);
    // beams
    seg(beam1, new THREE.Vector3(-0.51, AX, 0), new THREE.Vector3(-0.012, AX, 0));
    const mid = new THREE.Vector3(0.012, AX, 0), L = new THREE.Vector3(D - 0.02, AX, -SW), R = new THREE.Vector3(D - 0.02, AX, SW);
    [mid.x, mid.y, mid.z, L.x, L.y, L.z, R.x, R.y, R.z, mid.x, mid.y, mid.z, R.x, R.y, R.z, L.x, L.y, L.z].forEach((v, i) => (wpos[i] = v)); wedge.geometry.attributes.position.needsUpdate = true;
    // screen picture: only rebuilt when the optics change
    const k = [s.wl, s.a, s.D, s.white].join('|'); if (k !== key) { key = k; const img = cx.createImageData(1024, 8); for (let px = 0; px < 1024; px++) { const x = ((px / 1023) * 2 - 1) * HALF, c = pixel(s, x); for (let y = 0; y < 8; y++) { const o = (y * 1024 + px) * 4; img.data[o] = c[0] * 255; img.data[o + 1] = c[1] * 255; img.data[o + 2] = c[2] * 255; img.data[o + 3] = 255; } } cx.putImageData(img, 0, 0); tex.needsUpdate = true; }
    // cursor on the screen (x in mm over the ±30 mm window)
    const zc = (s.x / (HALF * 1e3)) * SW; cur.position.z = zc; dot.position.z = zc; cur.position.y = AX; dot.position.y = AX;
    const P = new THREE.Vector3(D - 0.03, AX, zc), S1 = new THREE.Vector3(0.015, AX, -sep / 2), S2 = new THREE.Vector3(0.015, AX, sep / 2); seg(pathM[0], S1, P); seg(pathM[1], S2, P);
    pts.laser.position.set(-0.55, AX + 0.14, 0); pts.plate.position.set(0, AX + 0.3, sep / 2 + 0.05); pts.screen.position.set(D, AX + SH + 0.06, SW * 0.6); pts.cursor.position.set(D - 0.03, AX, zc); pts.ruler.position.set(D, AX - SH - 0.065, -SW * 0.5); pts.bench.position.set(D * 0.5, BY, 0.12); pts.win.position.set(-0.32, AX, 0.0);
    root.updateMatrixWorld(true); void last; void tmpUp; void fringe;
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
