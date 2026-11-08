// VL10-M13 geometry: a retort stand, a coil spring, a hanger with 100 g slotted weights, a vertical ruler with a pointer. update(readout, model, td) poses everything.
import * as THREE from 'three';
import {L0, M_W} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, brass: 0xc8a24a};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function makeArrow(color, w = 0.012) {
  const g = new THREE.Group(), m = flat(color), hl0 = w * 5;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(w, w, 1, 10).rotateZ(-Math.PI / 2), m), head = new THREE.Mesh(new THREE.ConeGeometry(w * 3, hl0, 14).rotateZ(-Math.PI / 2), m); g.add(shaft, head);
  g.userData.set = (len) => { const l = Math.max(0, len); g.visible = l > 0.004; const hl = Math.min(hl0, l * 0.5); shaft.scale.x = Math.max(0.001, l - hl); shaft.position.x = (l - hl) / 2; head.scale.setScalar(hl / hl0); head.position.x = l - hl / 2; };
  return g;
}
const rulerTexture = () => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 2048; const g = c.getContext('2d'); g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 128, 2048);
  const PX = 2048 / 85; g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.font = 'bold 26px monospace'; g.textAlign = 'left';
  for (let mm = 0; mm <= 850; mm++) { const y = (mm / 10) * PX, big = mm % 50 === 0, mid = mm % 10 === 0; g.lineWidth = big ? 4 : mid ? 3 : 1.5; const len = big ? 52 : mid ? 38 : mm % 5 === 0 ? 26 : 16; g.beginPath(); g.moveTo(0, y); g.lineTo(len, y); g.stroke(); if (big) g.fillText(String(mm / 10), 58, y + 9); }
  g.font = 'bold 22px monospace'; g.fillStyle = '#c0392b'; g.fillText('cm', 74, 40);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
function helixGeo(len, turns = 16, R = 0.04, wire = 0.0065) { const pts = [], N = turns * 14; for (let i = 0; i <= N; i++) { const a = (i / 14) * Math.PI * 2, t = i / N; pts.push(new THREE.Vector3(Math.cos(a) * R, -t * len, Math.sin(a) * R)); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, wire, 6); }
export const Y_TOP = 1.49, Y0 = Y_TOP - L0, RX = 0.2;

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  // stand
  add(root, new THREE.BoxGeometry(0.7, 0.04, 0.5), mat(COL.dark, {metalness: 0.4}), -0.2, 0.02, 0);
  add(root, new THREE.CylinderGeometry(0.014, 0.014, 1.6, 16), mat(COL.steel, {metalness: 0.9, roughness: 0.3}), -0.5, 0.82, 0);
  const clampM = gmat(COL.dark, {metalness: 0.4}); const clamp = add(root, new THREE.BoxGeometry(0.06, 0.05, 0.05), clampM, -0.5, 1.5, 0);
  add(root, new THREE.CylinderGeometry(0.008, 0.008, 0.52, 14).rotateZ(Math.PI / 2), mat(COL.steel, {metalness: 0.9, roughness: 0.3}), -0.24, 1.5, 0);
  const hook = add(root, new THREE.TorusGeometry(0.012, 0.0035, 8, 18), mat(COL.steel), 0, 1.5 - 0.01, 0, false); hook.rotation.y = Math.PI / 2;
  // ruler
  const ruler = add(root, new THREE.BoxGeometry(0.05, 0.85, 0.008), new THREE.MeshStandardMaterial({map: rulerTexture(), roughness: 0.6, metalness: 0}), RX, Y0 - 0.425, 0); ruler.material.map.wrapS = THREE.ClampToEdgeWrapping;
  const mounts = []; for (const y of [Y0 + 0.02, Y0 - 0.86]) mounts.push(add(root, new THREE.CylinderGeometry(0.008, 0.008, 0.2, 10).rotateX(Math.PI / 2), mat(COL.steel), RX + 0.02, y, -0.08, false));
  add(root, new THREE.BoxGeometry(0.01, 0.01, 0.14), mat(COL.steel), RX + 0.02, Y0 + 0.02, -0.06, false);
  const zero = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.002, 0.002), flat(COL.teal)); zero.position.set(0.0, Y0, 0.012); root.add(zero);
  // spring
  const springM = gmat(0xb8c2ca, {metalness: 0.85, roughness: 0.25}); const spring = new THREE.Mesh(helixGeo(L0), springM); spring.castShadow = true; spring.position.y = Y_TOP; root.add(spring); let lastLen = -1;
  // hanger group (moves with the spring end)
  const hang = new THREE.Group(); root.add(hang);
  add(hang, new THREE.CylinderGeometry(0.025, 0.025, 0.014, 22), mat(COL.steel), 0, 0, 0);
  const rod = add(hang, new THREE.CylinderGeometry(0.0045, 0.0045, 1, 10), mat(0xdfe6ea, {metalness: 0.9}), 0, -0.5, 0); rod.scale.y = 0.3;
  const plate = add(hang, new THREE.CylinderGeometry(0.058, 0.058, 0.01, 28), mat(COL.steel), 0, -0.3, 0);
  const needle = add(hang, new THREE.BoxGeometry(RX - 0.012, 0.004, 0.006), flat(COL.orange), RX / 2 - 0.002, 0, 0.012, false);
  const weights = []; const wM = gmat(COL.brass, {metalness: 0.8, roughness: 0.3});
  for (let i = 0; i < 10; i++) { const w = add(hang, new THREE.CylinderGeometry(0.05, 0.05, 0.02, 32), wM, 0, -0.06 - i * 0.022, 0); const slot = add(hang, new THREE.BoxGeometry(0.052, 0.014, 0.012), mat(0x6e5320, {metalness: 0.4}), 0, -0.06 - i * 0.022, 0.0, false); weights.push({w, slot}); }
  const wedge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16)), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0}));
  const aW = makeArrow(COL.teal, 0.007), aF = makeArrow(COL.orange, 0.007), aD = makeArrow(0x5b3cc4, 0.005); root.add(aW, aF, aD); aW.rotation.z = -Math.PI / 2; aF.rotation.z = Math.PI / 2; aD.rotation.z = -Math.PI / 2;
  pts.spring = marker(hang, 0.04, 0.1, 0); pts.weights = marker(hang, 0.06, -0.12, 0); pts.needle = marker(hang, RX, 0, 0.012); pts.ruler = marker(root, RX, Y0 - 0.25, 0.01); pts.clamp = marker(root, -0.5, 1.5, 0); pts.rod = marker(hang, 0, -0.32, 0); pts.arm = marker(root, 0, 1.5, 0);
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td);
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    const len = L0 + r.x; if (Math.abs(len - lastLen) > 0.0003) { spring.geometry.dispose(); spring.geometry = helixGeo(len); lastLen = len; }
    hang.position.set(0, Y_TOP - len, 0);
    const n = r.n, stack = 0.022 * n; rod.scale.y = 0.06 + stack + 0.02; rod.position.y = -rod.scale.y / 2; plate.position.y = -(0.06 + stack + 0.014);
    weights.forEach((o, i) => { o.w.visible = o.slot.visible = i < n; const y = -0.042 - i * 0.0225; o.w.position.y = y; o.slot.position.y = y; });
    // force arrows: weight at the weights, spring force on the hanger, extension dimension between zero mark and needle
    const wy = Y_TOP - len - (0.04 + stack), g = r.F, sc = 0.03;
    aW.position.set(0.075, wy - 0.012, 0.05); aW.userData.set(g * sc * (n > 0 ? 1 : 0));
    aF.position.set(-0.075, Y_TOP - len, 0.05); aF.userData.set(r.Fs * sc);
    aD.position.set(RX + 0.045, Y0, 0.012); aD.userData.set(r.x); if (r.x < 0.01) aD.visible = false;
    root.updateMatrixWorld(true);
  }
  void M_W; void clamp; void mounts; void plate; void needle; void hook; void wedge;
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
