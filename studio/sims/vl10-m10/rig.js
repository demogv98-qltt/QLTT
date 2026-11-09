// VL10-M10 geometry: a pendulum (stand, protractor, height ruler, photogate that opens up) and an electric winch
// (pillar, drum, motor, gearbox with meshing gears, load blocks, a heat glow for the lost power).
import * as THREE from 'three';
import {D2R, H_MAX, PIV_H} from './physics.js';

const COL = {orange: 0xe8590c, teal: 0x0b8f8c, ink: 0x14303c, steel: 0x8a95a0, brass: 0xc8963c, dark: 0x252b33};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const box = (p, w, h, d, m, x, y, z, s) => add(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
const cylZ = (p, r, len, m, x, y, z, seg = 32) => { const o = add(p, new THREE.CylinderGeometry(r, r, len, seg), m, x, y, z); o.rotation.x = Math.PI / 2; return o; };
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function gearGeo(N, rp, depth) {
  const step = (2 * Math.PI) / N, rOut = rp * 1.13, rRoot = rp * 0.85, sh = new THREE.Shape(), P = (a, r) => [r * Math.cos(a), r * Math.sin(a)];
  for (let i = 0; i < N; i++) { const c = i * step; [P(c - 0.3 * step, rRoot), P(c - 0.14 * step, rOut), P(c + 0.14 * step, rOut), P(c + 0.3 * step, rRoot)].forEach(([x, y], k) => (i === 0 && k === 0 ? sh.moveTo(x, y) : sh.lineTo(x, y))); }
  const hole = new THREE.Path(); hole.absarc(0, 0, rp * 0.25, 0, Math.PI * 2, true); sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled: false, curveSegments: 6}); g.translate(0, 0, -depth / 2); return g;
}
function rulerTexture(h0, h1, major) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 1024; const g = c.getContext('2d'); g.fillStyle = '#f4f1e6'; g.fillRect(0, 0, 128, 1024); g.fillStyle = g.strokeStyle = '#14303c'; g.font = '700 26px sans-serif'; g.textAlign = 'left';
  const Y = (h) => 1024 - ((h - h0) / (h1 - h0)) * 1024;
  for (let h = Math.ceil(h0 * 10) / 10; h <= h1 + 1e-9; h += 0.1) { const big = Math.abs(h / major - Math.round(h / major)) < 1e-6; g.lineWidth = big ? 4 : 2; g.beginPath(); g.moveTo(0, Y(h)); g.lineTo(big ? 56 : 32, Y(h)); g.stroke(); if (big) g.fillText(h.toFixed(1), 60, Y(h) + 9); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function protractorTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const g = c.getContext('2d'), cx = 512, cy = 40, R = 470; g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.font = '600 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let a = -80; a <= 80; a += 5) { const r = (a - 90) * D2R, big = a % 10 === 0; g.lineWidth = big ? 3 : 1.5; g.beginPath(); g.moveTo(cx + Math.cos(r) * R, cy - Math.sin(r) * R); g.lineTo(cx + Math.cos(r) * (R - (big ? 40 : 22)), cy - Math.sin(r) * (R - (big ? 40 : 22))); g.stroke(); if (a % 20 === 0) g.fillText(String(Math.abs(a)), cx + Math.cos(r) * (R + 36), cy - Math.sin(r) * (R + 36)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeArrow(color) {
  const g = new THREE.Group(), m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 10).rotateZ(-Math.PI / 2), m), head = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 14).rotateZ(-Math.PI / 2), m); g.add(shaft, head);
  g.userData.set = (len) => { const l = Math.abs(len), sg = len < 0 ? -1 : 1; g.visible = l > 0.02; const hl = Math.min(0.16, l * 0.5); shaft.scale.x = Math.max(0.001, l - hl); shaft.position.x = sg * (l - hl) / 2; head.scale.setScalar(hl / 0.16); head.position.x = sg * (l - hl / 2); head.rotation.y = sg < 0 ? Math.PI : 0; g.userData.tip.position.x = sg * l; };
  g.userData.tip = marker(g); return g;
}

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root);
  const pts = {};
  // ============================================================ pendulum
  const pend = new THREE.Group(); root.add(pend);
  const iron = mat(0x353a42, {metalness: 0.35, roughness: 0.78});
  box(pend, 3.6, 0.1, 1.1, iron, 0, 0.05, 0); for (const x of [-1.6, 1.6]) box(pend, 0.12, 3.6, 0.12, mat(0xc2cbd2, {metalness: 0.8}), x, 1.85, 0); box(pend, 3.4, 0.12, 0.14, mat(0xc2cbd2, {metalness: 0.8}), 0, 3.6, 0);
  cylZ(pend, 0.05, 0.3, mat(COL.orange), 0, PIV_H, 0); box(pend, 0.04, 0.2, 0.04, iron, 0, 3.5, 0);
  const prot = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({map: protractorTexture(), transparent: true})); prot.position.set(0, PIV_H - 1.0 + 0.04 + 0.0, -0.42); prot.position.y = PIV_H - 0.95; pend.add(prot);
  prot.scale.set(1, 1, 1); prot.position.set(0, PIV_H - 1.0 + 0.0, -0.42);
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.2), new THREE.MeshBasicMaterial({map: rulerTexture(0, 3.2, 0.5)})); ruler.position.set(1.15, 1.7, 0.05); pend.add(ruler);
  box(pend, 0.04, 3.3, 0.04, iron, 1.28, 1.7, 0.05);
  const string = add(pend, new THREE.CylinderGeometry(0.008, 0.008, 1, 8), mat(0x20252b), 0, 0, 0, false), bobMat = mat(COL.brass, {metalness: 0.9, roughness: 0.32});
  const bob = add(pend, new THREE.SphereGeometry(1, 32, 24), bobMat), ghostBob = add(pend, new THREE.SphereGeometry(1, 24, 16), flat(COL.teal, {transparent: true, opacity: 0.25}), 0, 0, 0, false);
  const refLine = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.012, 0.012), flat(COL.orange)); pend.add(refLine);
  const hLine = new THREE.Mesh(new THREE.BoxGeometry(1, 0.01, 0.01), flat(COL.ink)); pend.add(hLine);
  const velArrow = makeArrow(COL.teal); pend.add(velArrow);
  // photogate at the lowest point
  const gateG = new THREE.Group(); pend.add(gateG); const gMat = gmat(0x2a3138, {metalness: 0.4});
  const gA = box(gateG, 0.16, 0.2, 0.1, gMat, 0, 0, 0.32), gB = box(gateG, 0.16, 0.2, 0.1, gMat, 0, 0, -0.32);
  const gEdges = [gA, gB].map((m) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); m.add(e); return e; });
  const led = add(gateG, new THREE.SphereGeometry(0.03, 12, 10), flat(0xff3b30), 0, 0, 0.27, false), diode = box(gateG, 0.05, 0.05, 0.03, mat(0x14303c), 0, 0, -0.27, false);
  const beamMat = flat(0xff3b30, {transparent: true, opacity: 0.8}), beam = add(gateG, new THREE.CylinderGeometry(0.008, 0.008, 0.54, 8).rotateX(Math.PI / 2), beamMat, 0, 0, 0, false);
  pts.bob = marker(pend); pts.gate = marker(gateG, 0, 0.12, 0.3); pts.led = marker(gateG, 0, 0.06, 0.27); pts.diode = marker(gateG, 0, 0.06, -0.27); pts.vTip = velArrow.userData.tip; pts.ruler = marker(pend, 1.15, 1.0, 0.1); pts.refl = marker(pend, -1.1, 0, 0);
  // ============================================================ winch
  const wn = new THREE.Group(); root.add(wn);
  box(wn, 3.0, 0.1, 1.2, iron, 0, 0.05, 0); box(wn, 0.3, 3.6, 0.3, mat(0x2d6470), -0.8, 1.9, 0); box(wn, 1.6, 0.18, 0.3, mat(0x2d6470), -0.05, 3.62, 0);
  const wMat = gmat(0x1f6d78, {metalness: 0.55}), motorBox = box(wn, 0.5, 0.4, 0.4, wMat, -0.55, 3.15, 0.0), gearBox = box(wn, 0.5, 0.5, 0.4, wMat, -0.1, 3.12, 0.0);
  const wEdges = [motorBox, gearBox].map((m) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); m.add(e); return e; });
  const motorRot = cylZ(wn, 0.12, 0.34, mat(COL.orange, {metalness: 0.7}), -0.55, 3.15, 0);
  const gearA = new THREE.Mesh(gearGeo(14, 0.14, 0.1), mat(0xdfe6ea, {metalness: 0.7})), gearB = new THREE.Mesh(gearGeo(28, 0.28, 0.1), mat(COL.steel, {metalness: 0.7})); gearA.position.set(-0.28, 3.12, 0.0); gearB.position.set(0.0, 3.12, 0.0); gearA.castShadow = gearB.castShadow = true; wn.add(gearA, gearB);
  const drum = cylZ(wn, 0.2, 0.34, mat(0x7b8591, {metalness: 0.8}), 0.3, 3.12, 0); const drumMark = box(wn, 0.05, 0.05, 0.36, mat(COL.orange), 0.3, 3.32, 0, false);
  const heat = add(wn, new THREE.SphereGeometry(0.24, 20, 14), flat(0xff5a1f, {transparent: true, opacity: 0}), -0.1, 3.12, 0.0, false);
  const rope = add(wn, new THREE.CylinderGeometry(0.012, 0.012, 1, 8), mat(0x20252b), 0.5, 0, 0, false);
  const wruler = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.2), new THREE.MeshBasicMaterial({map: rulerTexture(0.35, 3.55, 0.5)})); wruler.position.set(1.0, 1.95, 0.1); wn.add(wruler);
  const load = new THREE.Group(); wn.add(load); const blocks = []; const bm = mat(0x6b7480, {metalness: 0.85, roughness: 0.4});
  for (let i = 0; i < 10; i++) { const b = box(load, 0.4, 0.2, 0.4, bm, 0, 0.1 + i * 0.205, 0); b.userData.e = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), new THREE.LineBasicMaterial({color: 0x14303c})); b.add(b.userData.e); blocks.push(b); }
  const hook = box(load, 0.06, 0.12, 0.06, mat(COL.steel), 0, 0.0, 0, false), loadTopY = () => 0.2 * 10;
  pts.load = marker(load, 0.25, 0.1, 0); pts.motor = marker(wn, -0.55, 3.4, 0.2); pts.gear = marker(wn, -0.14, 3.42, 0.2); pts.drum = marker(wn, 0.3, 3.35, 0.2); pts.heat = marker(wn, -0.1, 2.85, 0.1); pts.wruler = marker(wn, 1.0, 2.0, 0.1);
  const e3 = (x) => x * x * (3 - 2 * x);
  const hoistX = 0.5, hookY0 = 0.12;

  function update(r, s, td) {
    const e = e3(td), E = r.mode === 'E';
    pend.visible = E; wn.visible = !E;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    for (const l of gEdges) l.material.opacity = 0.55 * e; for (const l of wEdges) l.material.opacity = 0.55 * e;
    if (E) {
      const th = s.th, L = s.L, br = 0.1 + 0.035 * s.m, bx = L * Math.sin(th), by = PIV_H - L * Math.cos(th);
      bob.scale.setScalar(br); bob.position.set(bx, by, 0); string.position.set(bx / 2, (PIV_H + by) / 2, 0); string.scale.y = L; string.rotation.z = th;
      const th0 = s.th0 * D2R; ghostBob.scale.setScalar(br); ghostBob.position.set(L * Math.sin(th0), PIV_H - L * Math.cos(th0), 0); ghostBob.visible = !r.released || Math.abs(r.th) < th0 * 0.97;
      const low = PIV_H - L; refLine.position.set(0, low, 0); hLine.position.set(0.5 + (bx) / 2, by, 0.05); hLine.scale.x = Math.max(0.001, 1.15 - bx - 0.0); hLine.position.x = (bx + 1.15) / 2; hLine.visible = true;
      gateG.position.set(0, low, 0); gateG.visible = true; led.material.color.setHex(Math.abs(bx) < br * 1.1 ? 0xaa2222 : 0xff3b30); beamMat.opacity = Math.abs(bx) < br * 1.1 ? 0.15 : 0.85;
      const vt = r.v; velArrow.position.set(bx, by, 0.0); velArrow.rotation.z = th; velArrow.userData.set(0.12 * vt);
      pts.bob.position.set(bx, by - br - 0.05, 0); pts.refl.position.set(-1.1, low, 0);
      prot.position.set(0, PIV_H - 1.0 - 0.0, -0.42); prot.scale.setScalar(1);
    } else {
      const h = s.h, loadY = 0.35 + h, nb = Math.max(1, Math.min(10, Math.round(s.mw / 2)));
      load.position.set(hoistX, loadY, 0); blocks.forEach((b, i) => (b.visible = i < nb)); hook.position.y = nb * 0.205 + 0.05;
      const topY = loadY + nb * 0.205 + 0.1; rope.position.set(hoistX, (topY + 3.12 + 0.0) / 2 - 0.0, 0); rope.scale.y = Math.max(0.01, 3.12 - topY + 0.2); rope.position.y = (topY + 3.32) / 2; rope.scale.y = Math.max(0.01, 3.32 - topY);
      const ang = h / 0.2; drum.rotation.x = Math.PI / 2; drumMark.position.set(0.3 + 0.2 * Math.sin(ang), 3.12 + 0.2 * Math.cos(ang), 0); gearB.rotation.z = -ang * 0.2 / 0.28 * 0.5 + 0; gearA.rotation.z = ang * 0.5 * 0.2 / 0.14 + 0.1; motorRot.rotation.y = ang * 4;
      const lossFrac = 1 - s.eta; heat.material.opacity = (r.running || s.h > 0 ? 0.55 : 0.15) * Math.min(1, lossFrac * 2.2) * (0.6 + 0.4 * Math.sin(performance.now() / 160 + 1.0));
      pts.load.position.y = nb * 0.2 + 0.05;
    }
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  void H_MAX; void hookY0; void loadTopY; void diode;
  return {root, update, pts, worldPt};
}
