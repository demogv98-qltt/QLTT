// VL10-M8 geometry: an Atwood machine (stand, pulley with a bearing that opens up, two weight stacks, tension sensors, ruler)
// and a table with a cart pulled by a hanging mass. update(readout, model, td) poses everything.
import * as THREE from 'three';
import {SMAX} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, red: 0xc0392b, ink: 0x14303c, steel: 0x8a95a0, brass: 0xc8963c, dark: 0x252b33};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const box = (p, w, h, d, m, x, y, z, s) => add(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
const cylZ = (p, r, len, m, x, y, z, seg = 36) => { const o = add(p, new THREE.CylinderGeometry(r, r, len, seg), m, x, y, z); o.rotation.x = Math.PI / 2; return o; };
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function rulerTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 1024; const g = c.getContext('2d'); g.fillStyle = '#f4f1e6'; g.fillRect(0, 0, 128, 1024); g.fillStyle = g.strokeStyle = '#14303c'; g.font = '700 26px sans-serif';
  const Y = (h) => 1024 - (h / 2.3) * 1024; for (let h = 0; h <= 2.3 + 1e-9; h += 0.05) { const big = Math.abs(h / 0.5 - Math.round(h / 0.5)) < 1e-6, mid = Math.abs(h / 0.1 - Math.round(h / 0.1)) < 1e-6; g.lineWidth = big ? 4 : mid ? 2.5 : 1.5; g.beginPath(); g.moveTo(0, Y(h)); g.lineTo(big ? 56 : mid ? 40 : 24, Y(h)); g.stroke(); if (big) g.fillText(h.toFixed(1), 60, Y(h) + 9); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function makeArrow(color) {
  const g = new THREE.Group(), m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 8), m), head = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 12), m); g.add(shaft, head);
  g.userData.set = (len) => { const sg = len < 0 ? -1 : 1, l = Math.abs(len); g.visible = l > 0.02; const hl = Math.min(0.1, l * 0.5); shaft.scale.y = Math.max(0.001, l - hl); shaft.position.y = sg * (l - hl) / 2; head.scale.setScalar(hl / 0.1); head.position.y = sg * (l - hl / 2); head.rotation.x = sg < 0 ? Math.PI : 0; g.userData.tip.position.y = sg * l; };
  g.userData.tip = marker(g); return g;
}
const PXC = 1.8, AY = 2.6, AX = 0.13, Y0 = 1.5, TY = 1.62; // Atwood pulley height / half spacing / rest height; table height
export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const iron = mat(0x353a42, {metalness: 0.35, roughness: 0.78}), pts = {};
  // ---------------- shared pulley (moves between the two set-ups)
  const pulley = new THREE.Group(); root.add(pulley);
  const wheel = new THREE.Group(); pulley.add(wheel); const pMat = gmat(0xc2cbd2, {metalness: 0.85, roughness: 0.35});
  const rim = add(wheel, new THREE.TorusGeometry(0.115, 0.022, 12, 40).rotateX(0), pMat, 0, 0, 0), hub = cylZ(wheel, 0.05, 0.06, pMat, 0, 0, 0);
  for (let k = 0; k < 6; k++) { const sp = box(wheel, 0.23, 0.014, 0.014, pMat, 0, 0, 0, false); sp.rotation.z = (k / 6) * Math.PI; }
  const pEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(0.115, 0.022, 6, 24)), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); wheel.add(pEdge);
  // bearing: static outer race + balls (visible in teardown)
  const bear = new THREE.Group(); pulley.add(bear); const balls = []; add(bear, new THREE.TorusGeometry(0.045, 0.01, 8, 24), mat(COL.steel, {metalness: 0.9}), 0, 0, 0.04, false);
  for (let k = 0; k < 8; k++) { const b = add(bear, new THREE.SphereGeometry(0.009, 8, 6), mat(COL.brass, {metalness: 0.9}), Math.cos((k / 8) * 6.283) * 0.045, Math.sin((k / 8) * 6.283) * 0.045, 0.04, false); balls.push(b); }
  pts.pulley = marker(pulley, 0.0, 0.17, 0.05); pts.bearing = marker(pulley, 0.05, 0.05, 0.08);
  // ---------------- Atwood stand
  const A = new THREE.Group(); root.add(A);
  box(A, 1.4, 0.12, 0.8, iron, 0, 0.06, 0); box(A, 0.12, 2.7, 0.12, mat(0x2d6470), 0, 1.4, -0.3); box(A, 0.12, 0.12, 0.38, mat(0x2d6470), 0, 2.7, -0.12); cylZ(A, 0.025, 0.4, mat(COL.steel), 0, AY, -0.05);
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 2.3), new THREE.MeshBasicMaterial({map: rulerTexture()})); ruler.position.set(-0.5, 0.3 + 1.15, 0.0); A.add(ruler);
  const mkMass = (color) => { const g = new THREE.Group(); const m = mat(color, {metalness: 0.8, roughness: 0.4}), body = add(g, new THREE.CylinderGeometry(1, 1, 1, 28), m); const slot = box(g, 0.02, 1, 0.2, mat(0x20252b), 0, 0, 0.0, false); g.userData = {body, slot}; return g; };
  const mA1 = mkMass(COL.brass), mA2 = mkMass(0x6b7480); A.add(mA1, mA2);
  const sMat = gmat(0x14303c, {metalness: 0.4}), sensA = [box(A, 0.07, 0.1, 0.07, sMat, -AX, 0, 0), box(A, 0.07, 0.1, 0.07, sMat, AX, 0, 0)];
  const sEdge = sensA.map((m) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); m.add(e); return e; });
  const strA1 = add(A, new THREE.CylinderGeometry(0.006, 0.006, 1, 6), mat(0x20252b), -AX, 0, 0, false), strA2 = add(A, new THREE.CylinderGeometry(0.006, 0.006, 1, 6), mat(0x20252b), AX, 0, 0, false), arcS = add(A, new THREE.TorusGeometry(AX, 0.006, 6, 24, Math.PI), mat(0x20252b), 0, AY, 0, false);
  // ---------------- table with a cart
  const C = new THREE.Group(); root.add(C);
  box(C, 3.3, 0.08, 0.8, mat(0xa8865a, {roughness: 0.8}), 0, TY - 0.04, 0); for (const [x, z] of [[-1.55, -0.32], [1.55, -0.32], [-1.55, 0.32], [1.55, 0.32]]) box(C, 0.08, TY - 0.08, 0.08, iron, x, (TY - 0.08) / 2, z); box(C, 2.9, 0.012, 0.06, mat(COL.steel, {metalness: 0.8}), 0, TY + 0.006, 0);
  const cart = new THREE.Group(); C.add(cart); const cMat = gmat(COL.teal, {metalness: 0.55}), cBody = box(cart, 0.5, 0.18, 0.34, cMat, 0, 0.17, 0); const cEdge = new THREE.LineSegments(new THREE.EdgesGeometry(cBody.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); cBody.add(cEdge);
  const cartWheels = []; for (const [x, z] of [[0.16, 0.18], [0.16, -0.18], [-0.16, 0.18], [-0.16, -0.18]]) { const w = add(cart, new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20).rotateX(Math.PI / 2), mat(0x20252b), x, 0.05, z); cartWheels.push(w); }
  const loadBlocks = box(cart, 0.3, 0.1, 0.24, mat(0x6b7480, {metalness: 0.85}), 0, 0.31, 0); const tsC = box(cart, 0.07, 0.07, 0.07, sMat, 0.28, 0.17, 0), tsEdge = new THREE.LineSegments(new THREE.EdgesGeometry(tsC.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); tsC.add(tsEdge);
  const hang = mkMass(COL.orange); C.add(hang); const strC1 = add(C, new THREE.CylinderGeometry(0.006, 0.006, 1, 6).rotateZ(Math.PI / 2), mat(0x20252b), 0, 0, 0, false), strC2 = add(C, new THREE.CylinderGeometry(0.006, 0.006, 1, 6), mat(0x20252b), 0, 0, 0, false);
  box(C, 0.14, 0.02, 0.16, iron, 1.58, TY + 0.01, -0.0); box(C, 0.2, 0.03, 0.04, iron, 1.7, TY + 0.055, -0.05); // clamp on the table edge and an arm to the pulley axle
  // ---------------- arrows
  const aT1 = makeArrow(COL.teal), aT2 = makeArrow(COL.teal), aW1 = makeArrow(COL.red), aW2 = makeArrow(COL.red); root.add(aT1, aT2, aW1, aW2);
  pts.m1 = marker(root); pts.m2 = marker(root); pts.sens1 = marker(root); pts.sens2 = marker(root); pts.cart = marker(root); pts.hang = marker(root); pts.tC = marker(root); pts.ruler = marker(root, -0.5, 1.8, 0.05);
  const e3 = (x) => x * x * (3 - 2 * x), VS = 0.075;
  function sizeMass(g, m) { const r = 0.05 + 0.04 * Math.sqrt(m), h = 0.06 + 0.12 * m; g.userData.body.scale.set(r, h, r); g.userData.slot.scale.set(1, h * 1.02, 1); g.userData.slot.scale.x = 1; return {r, h}; }
  function update(r, s, td, T) {
    const e = e3(td), isA = r.mode === 'A'; A.visible = isA; C.visible = !isA;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    pEdge.material.opacity = 0.55 * e; sEdge.forEach((x) => (x.material.opacity = 0.55 * e)); cEdge.material.opacity = 0.55 * e; tsEdge.material.opacity = 0.55 * e;
    const dist = Math.min(SMAX, Math.abs(r.s)), dir = r.dir || 0;
    if (isA) {
      pulley.position.set(0, AY, 0.0); const ang = (dir * dist) / 0.115; wheel.rotation.z = -ang; balls.forEach((b, i) => b.position.set(Math.cos((i / 8) * 6.283 - ang * 0.5) * 0.045, Math.sin((i / 8) * 6.283 - ang * 0.5) * 0.045, 0.04));
      const d1 = sizeMass(mA1, s.m1), d2 = sizeMass(mA2, s.m2); const y1 = Y0 + dir * dist, y2 = Y0 - dir * dist; // m2 heavier → goes down when dir > 0
      mA1.position.set(-AX, y1, 0); mA2.position.set(AX, y2, 0); sensA[0].position.set(-AX, y1 + d1.h / 2 + 0.05, 0); sensA[1].position.set(AX, y2 + d2.h / 2 + 0.05, 0);
      const top1 = y1 + d1.h / 2 + 0.1, top2 = y2 + d2.h / 2 + 0.1; strA1.position.set(-AX, (top1 + AY) / 2, 0); strA1.scale.y = Math.max(0.01, AY - top1); strA2.position.set(AX, (top2 + AY) / 2, 0); strA2.scale.y = Math.max(0.01, AY - top2);
      arcS.visible = true; arcS.position.set(0, AY, 0); strA1.visible = strA2.visible = true; strC1.visible = strC2.visible = false;
      aT1.position.set(-AX - 0.1, y1 + d1.h / 2, 0.15); aT1.userData.set(VS * r.T); aW1.position.set(-AX - 0.1, y1, 0.15); aW1.userData.set(-VS * r.F1);
      aT2.position.set(AX + 0.1, y2 + d2.h / 2, 0.15); aT2.userData.set(VS * r.T); aW2.position.set(AX + 0.1, y2, 0.15); aW2.userData.set(-VS * r.F2); aW2.visible = true;
      pts.m1.position.set(-AX, y1, 0.0); pts.m2.position.set(AX, y2, 0.0); pts.sens1.position.copy(sensA[0].position); pts.sens2.position.copy(sensA[1].position);
      pts.tC.position.set(0, -10, 0);
    } else {
      pulley.position.set(PXC, TY + 0.055, 0.0); const ang = dist / 0.115; wheel.rotation.z = -ang; balls.forEach((b, i) => b.position.set(Math.cos((i / 8) * 6.283 - ang * 0.5) * 0.045, Math.sin((i / 8) * 6.283 - ang * 0.5) * 0.045, 0.04));
      const x0 = -0.8, cx = x0 + dist; cart.position.set(cx, TY, 0); cartWheels.forEach((w) => (w.rotation.z = -dist / 0.05)); const dh = sizeMass(hang, s.m); sizeMass(mA1, 0.1);
      const hy = TY - 0.45 - dist; hang.position.set(PXC + 0.115, hy, 0); const topH = hy + dh.h / 2;
      const x1 = cx + 0.315, x2 = PXC + 0.115; strC1.position.set((x1 + x2) / 2, TY + 0.2 + 0.115 - 0.05 * 0, 0); strC1.scale.x = Math.max(0.01, x2 - x1); strC1.position.y = TY + 0.17; strC2.position.set(x2, (TY + 0.055 + topH) / 2, 0); strC2.scale.y = Math.max(0.01, TY + 0.055 - topH);
      strC1.visible = strC2.visible = true; strA1.visible = strA2.visible = false; arcS.visible = false; loadBlocks.visible = s.M > 0.5; loadBlocks.scale.y = Math.min(3, 0.4 + s.M * 0.6);
      aT1.position.set(cx + 0.3, TY + 0.4, 0.2); aT1.rotation.z = -Math.PI / 2; aT1.userData.set(VS * r.T); aW1.position.set(x2 + 0.14, hy, 0.15); aW1.rotation.z = 0; aW1.userData.set(-VS * r.F1); aT2.position.set(x2 + 0.14, topH, 0.15); aT2.rotation.z = 0; aT2.userData.set(VS * r.T); aW2.visible = false;
      pts.cart.position.set(cx, TY + 0.45, 0); pts.hang.position.set(x2, hy, 0); pts.tC.position.set(cx + 0.28, TY + 0.17, 0.0); pts.m1.position.set(cx, TY + 0.45, 0); pts.m2.position.set(x2, hy, 0); pts.sens1.position.set(cx + 0.28, TY + 0.25, 0.05); pts.sens2.position.set(x2, topH, 0);
    }
    if (isA) { aT1.rotation.z = 0; aT2.rotation.z = 0; aW1.rotation.z = 0; aW2.rotation.z = 0; }
    root.updateMatrixWorld(true); void T;
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
