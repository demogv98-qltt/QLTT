// VL10-M3 geometry: Newton's tube on a stand (glass tube, electromagnet, ruler, photogate at the bottom, vacuum pump with a
// gauge), a steel ball and a feather, and strobe copies every 0.1 s. update(readout, model, td) poses everything.
import * as THREE from 'three';
import {OBJ, G, fall} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, copper: 0xb87333, dark: 0x252b33};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const box = (p, w, h, d, m, x, y, z, s) => add(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function rulerTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 1024; const g = c.getContext('2d'); g.fillStyle = '#f4f1e6'; g.fillRect(0, 0, 128, 1024); g.fillStyle = g.strokeStyle = '#14303c'; g.font = '700 26px sans-serif';
  const Y = (h) => 1024 - (h / 2.3) * 1024;
  for (let h = 0; h <= 2.3 + 1e-9; h += 0.05) { const big = Math.abs(h / 0.5 - Math.round(h / 0.5)) < 1e-6, mid = Math.abs(h / 0.1 - Math.round(h / 0.1)) < 1e-6; g.lineWidth = big ? 4 : mid ? 2.5 : 1.5; g.beginPath(); g.moveTo(0, Y(h)); g.lineTo(big ? 56 : mid ? 40 : 24, Y(h)); g.stroke(); if (big) g.fillText(h.toFixed(1), 60, Y(h) + 9); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function makeArrow(color) {
  const g = new THREE.Group(), m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), m), head = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 12), m); g.add(shaft, head);
  g.userData.set = (len) => { const l = Math.abs(len); g.visible = l > 0.02; const hl = Math.min(0.08, l * 0.5); shaft.scale.y = Math.max(0.001, l - hl); shaft.position.y = -(l - hl) / 2; head.scale.setScalar(hl / 0.08); head.position.y = -(l - hl / 2); head.rotation.x = Math.PI; g.userData.tip.position.y = -l; };
  g.userData.tip = marker(g); return g;
}
export const FLOOR = 0.3, TUBE_TOP = 2.75;
export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root);
  const iron = mat(0x353a42, {metalness: 0.35, roughness: 0.78}), pts = {};
  box(root, 1.6, 0.14, 1.0, iron, 0, 0.07, 0); box(root, 0.35, 0.1, 0.35, mat(0xc2cbd2, {metalness: 0.8}), 0, 0.19, 0);
  // glass tube, flanged ends
  const glass = gmat(0xcfe8ee, {metalness: 0, roughness: 0.08, opacity: 0.18}); glass.side = THREE.DoubleSide;
  const tube = add(root, new THREE.CylinderGeometry(0.17, 0.17, TUBE_TOP - FLOOR + 0.05, 36, 1, true), glass, 0, (TUBE_TOP + FLOOR) / 2, 0, false);
  const tubeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.17, 0.17, TUBE_TOP - FLOOR, 12, 1, true), 1), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); tubeEdge.position.set(0, (TUBE_TOP + FLOOR) / 2, 0); root.add(tubeEdge);
  add(root, new THREE.CylinderGeometry(0.2, 0.2, 0.06, 36), mat(0xc2cbd2, {metalness: 0.8}), 0, FLOOR - 0.05, 0); add(root, new THREE.CylinderGeometry(0.2, 0.2, 0.06, 36), mat(0xc2cbd2, {metalness: 0.8}), 0, TUBE_TOP + 0.04, 0);
  // photogate at the bottom, two housings that open in teardown
  const gMat = gmat(0x2a3138, {metalness: 0.4}), gA = box(root, 0.12, 0.14, 0.08, gMat, 0.0, FLOOR + 0.12, 0.27), gB = box(root, 0.12, 0.14, 0.08, gMat, 0.0, FLOOR + 0.12, -0.27);
  const gEdges = [gA, gB].map((m) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); m.add(e); return e; });
  const led = add(root, new THREE.SphereGeometry(0.022, 12, 10), flat(0xff3b30), 0, FLOOR + 0.12, 0.24, false), diode = box(root, 0.04, 0.04, 0.03, mat(0x14303c), 0, FLOOR + 0.12, -0.24, false);
  const beamMat = flat(0xff3b30, {transparent: true, opacity: 0.75}); add(root, new THREE.CylinderGeometry(0.006, 0.006, 0.48, 8).rotateX(Math.PI / 2), beamMat, 0, FLOOR + 0.12, 0, false);
  // electromagnet slides on the tube head
  const mag = new THREE.Group(); root.add(mag); const mMat = gmat(0x2d6470, {metalness: 0.5}), magBody = box(mag, 0.34, 0.16, 0.2, mMat, 0, 0.1, 0);
  const magEdge = new THREE.LineSegments(new THREE.EdgesGeometry(magBody.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); magBody.add(magEdge);
  const coil = add(mag, new THREE.TorusGeometry(0.07, 0.025, 10, 28).rotateX(Math.PI / 2), mat(COL.copper, {metalness: 0.8, roughness: 0.35}), 0, 0.1, 0, false), glow = add(mag, new THREE.SphereGeometry(0.04, 12, 10), flat(0x2ecc71, {transparent: true, opacity: 0.9}), 0.14, 0.1, 0.11, false);
  pts.mag = marker(mag, 0, 0.22, 0); pts.coil = marker(mag, 0, 0.1, 0.1);
  add(mag, new THREE.CylinderGeometry(0.02, 0.02, 0.04, 10), mat(COL.steel), -0.07, -0.02, 0, false); add(mag, new THREE.CylinderGeometry(0.02, 0.02, 0.04, 10), mat(COL.steel), 0.07, -0.02, 0, false);
  // ruler
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 2.3), new THREE.MeshBasicMaterial({map: rulerTexture()})); ruler.position.set(-0.36, FLOOR + 1.15, 0.0); root.add(ruler); box(root, 0.03, 2.4, 0.03, iron, -0.46, FLOOR + 1.15, 0, false);
  // objects: steel ball and a feather
  const ball = add(root, new THREE.SphereGeometry(0.035, 24, 16), mat(0xc2cbd2, {metalness: 0.95, roughness: 0.2})), feather = new THREE.Group(); root.add(feather);
  const vane = add(feather, new THREE.SphereGeometry(1, 16, 12), mat(0xf0e8d8, {metalness: 0, roughness: 0.9}), 0, -0.02, 0, false); vane.scale.set(0.014, 0.075, 0.03); add(feather, new THREE.CylinderGeometry(0.004, 0.003, 0.17, 6), mat(0xd9c9a4), 0, 0, 0, false);
  for (let k = 0; k < 8; k++) { const f = add(feather, new THREE.BoxGeometry(0.05, 0.004, 0.006), mat(0xe8dfc9, {roughness: 0.9}), 0, -0.065 + k * 0.016, 0, false); f.rotation.z = (k % 2 ? 1 : -1) * 0.5; }
  // strobe copies (0.1 s)
  const sMat = [flat(COL.teal, {transparent: true, opacity: 0.35}), flat(COL.orange, {transparent: true, opacity: 0.4})], strobes = [[], []];
  for (let k = 0; k < 24; k++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), sMat[0]); a.visible = false; root.add(a); strobes[0].push(a); const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), sMat[1]); b.scale.set(0.5, 2.2, 1); b.visible = false; root.add(b); strobes[1].push(b); }
  const arrB = makeArrow(COL.teal), arrF = makeArrow(COL.orange); root.add(arrB, arrF);
  // vacuum pump + gauge + hose
  const pump = new THREE.Group(); pump.position.set(0.95, 0, 0); root.add(pump);
  const pMat = gmat(0x1f6d78, {metalness: 0.55}), pBody = box(pump, 0.5, 0.4, 0.4, pMat, 0, 0.34, 0), pEdge = new THREE.LineSegments(new THREE.EdgesGeometry(pBody.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); pBody.add(pEdge);
  const cyl = add(pump, new THREE.CylinderGeometry(0.07, 0.07, 0.3, 20), mat(COL.steel, {metalness: 0.8}), -0.1, 0.35, 0), piston = add(pump, new THREE.CylinderGeometry(0.025, 0.025, 0.3, 12), mat(COL.orange), -0.1, 0.35, 0, false), motor = add(pump, new THREE.CylinderGeometry(0.1, 0.1, 0.2, 20).rotateZ(Math.PI / 2), mat(COL.teal, {metalness: 0.7}), 0.15, 0.34, 0);
  const gauge = new THREE.Group(); gauge.position.set(0, 0.62, 0.21); pump.add(gauge); add(gauge, new THREE.CylinderGeometry(0.1, 0.1, 0.03, 32).rotateX(Math.PI / 2), mat(0xf4f1e6, {metalness: 0.1}), 0, 0, 0, false);
  const needle = box(gauge, 0.012, 0.085, 0.01, flat(0xc0392b), 0, 0.04, 0.02, false); needle.geometry.translate(0, 0.0, 0); const needlePivot = new THREE.Group(); gauge.add(needlePivot); needlePivot.add(needle); needle.position.set(0, 0.04, 0.02);
  for (let k = 0; k <= 10; k++) { const a = (-135 + k * 27) * Math.PI / 180, tk = box(gauge, 0.006, 0.014, 0.004, flat(0x14303c), Math.sin(a) * 0.082, Math.cos(a) * 0.082, 0.02, false); tk.rotation.z = -a; }
  pts.pump = marker(pump, 0, 0.75, 0); pts.gauge = marker(gauge, 0, 0.14, 0); pts.piston = marker(pump, -0.1, 0.55, 0.1);
  const hosePts = [new THREE.Vector3(0.7, 0.3, 0), new THREE.Vector3(0.45, 0.2, 0.1), new THREE.Vector3(0.2, 0.28, 0.05)];
  add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hosePts), 20, 0.018, 8), mat(0x20252b, {roughness: 0.8}), 0, 0, 0, false);
  pts.gate = marker(root, 0.0, FLOOR + 0.25, 0.27); pts.led = marker(root, 0, FLOOR + 0.17, 0.24); pts.diode = marker(root, 0, FLOOR + 0.17, -0.24); pts.ballP = marker(root); pts.featherP = marker(root); pts.ruler = marker(root, -0.36, 1.6, 0.05);

  const e3 = (x) => x * x * (3 - 2 * x);
  let lastT = 0, spin = 0;
  function update(r, s, td, T) {
    const e = e3(td);
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    for (const l of [...gEdges, magEdge, pEdge, tubeEdge]) l.material.opacity = 0.55 * e;
    const yTop = FLOOR + s.H; mag.position.set(0, yTop + 0.04, 0);
    const held = !r.released, ballY = FLOOR + 0.035 + (s.H - r.objs[0].y), featherY = FLOOR + 0.1 + (s.H - r.objs[1].y);
    ball.position.set(-0.06, ballY, 0); feather.position.set(0.06, featherY, 0);
    const flutter = r.released && !r.objs[1].landed ? Math.sin(T * 9) * Math.min(0.5, r.objs[1].b * 0.09) : 0; feather.rotation.z = flutter; feather.rotation.y = r.released ? Math.sin(T * 5) * Math.min(0.9, r.objs[1].b * 0.12) : 0;
    glow.material.color.setHex(held ? 0x2ecc71 : 0x555555); glow.material.opacity = held ? 0.95 : 0.35;
    pts.ballP.position.set(-0.06, ballY, 0); pts.featherP.position.set(0.06, featherY, 0);
    // strobe copies at every 0.1 s that has already passed
    for (let k = 0; k < 24; k++) { const tk = (k + 1) * 0.1, on = r.released && tk <= r.t + 1e-9; for (let i = 0; i < 2; i++) { const o = strobes[i][k], f = fall(r.objs[i].b, tk), yy = Math.min(s.H, f.y); o.visible = on && tk <= (r.objs[i].tFall + 0.1); if (o.visible) o.position.set(i === 0 ? -0.06 : 0.06, FLOOR + (i === 0 ? 0.035 : 0.1) + (s.H - yy), 0); } }
    arrB.position.set(-0.13, ballY, 0.0); arrB.userData.set(0.16 * r.objs[0].v * (r.objs[0].landed ? 0 : 1)); arrF.position.set(0.13, featherY, 0.0); arrF.userData.set(0.16 * r.objs[1].v * (r.objs[1].landed ? 0 : 1));
    pts.vb = arrB.userData.tip; pts.vf = arrF.userData.tip;
    // pump gauge follows the pressure (0..101.3 kPa over a 270° dial), the piston moves while the pump runs
    needlePivot.rotation.z = -((-135 + r.p * 270) * Math.PI / 180); piston.position.y = 0.35 + (Math.abs(r.p - (s.air ? 1 : 0)) > 0.01 ? Math.sin(T * 16) * 0.06 : 0); motor.rotation.x = T * (Math.abs(r.p - (s.air ? 1 : 0)) > 0.01 ? 14 : 0);
    led.material.color.setHex(r.objs[0].landed ? 0xaa2222 : 0xff3b30); beamMat.opacity = r.objs[0].landed ? 0.2 : 0.75;
    lastT = T; void lastT; void spin; void OBJ; void G;
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt, FLOOR};
}
