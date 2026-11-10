// VL12-B3 geometry (mét): bàn thí nghiệm, bàn xoay mang nam châm (hai cực dạng đĩa), thanh đồng treo bằng 2 lò xo từ thanh ngang,
// thước đo độ dịch, nguồn điện nối dây đến hai trụ đỡ. update(readout, model, td) đặt toàn bộ tư thế từ MỘT trạng thái mô hình.
import * as THREE from 'three';
import {D2R, sag0} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, brass: 0xc8a24a, N: 0xc0392b, S: 0x2b59c3, wood: 0xcdb892};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function makeArrow(color, w = 0.008) {
  const g = new THREE.Group(), m = flat(color), hl0 = w * 5;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(w, w, 1, 10).rotateZ(-Math.PI / 2), m), head = new THREE.Mesh(new THREE.ConeGeometry(w * 2.6, hl0, 14).rotateZ(-Math.PI / 2), m); g.add(shaft, head);
  g.userData.set = (len) => { const l = Math.max(0, len); g.visible = l > 0.01; const hl = Math.min(hl0, l * 0.5); shaft.scale.x = Math.max(0.001, l - hl); shaft.position.x = (l - hl) / 2; head.scale.setScalar(hl / hl0); head.position.x = l - hl / 2; };
  return g;
}
const X = new THREE.Vector3(1, 0, 0);
function aim(g, from, dir, len) { g.position.set(...from); const d = new THREE.Vector3(...dir); if (d.lengthSq() < 1e-12) { g.visible = false; return; } g.quaternion.setFromUnitVectors(X, d.normalize()); g.userData.set(len); }
function helixGeo(len, turns = 18, R = 0.022, wire = 0.0035) { const pts = [], N = turns * 12; for (let i = 0; i <= N; i++) { const a = (i / 12) * Math.PI * 2, t = i / N; pts.push(new THREE.Vector3(Math.cos(a) * R, -t * len, Math.sin(a) * R)); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, wire, 6); }
function rulerTexture() {
  const c = document.createElement('canvas'); c.width = 96; c.height = 1024; const g = c.getContext('2d'); g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 96, 1024);
  const PX = 1024 / 200; g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.font = 'bold 24px monospace';
  for (let mm = -100; mm <= 100; mm += 1) { const y = (100 - mm) * PX, big = mm % 10 === 0; if (!big && mm % 5 && mm % 1) continue; g.lineWidth = big ? 3 : 1.4; const len = big ? 44 : mm % 5 === 0 ? 30 : 16; g.beginPath(); g.moveTo(0, y); g.lineTo(len, y); g.stroke(); if (big && mm % 20 === 0) g.fillText(String(mm / 10), 48, y + 8); }
  g.strokeStyle = '#c0392b'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 512); g.lineTo(96, 512); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function ringTexture() {
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); g.clearRect(0, 0, N, N);
  const R0 = 0.335, R1 = 0.37, S = N / 0.8; g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.font = 'bold 20px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const pt = (th, R) => [N / 2 + R * Math.sin(th * D2R) * S, N / 2 + R * Math.cos(th * D2R) * S];
  for (const sg of [1, -1]) for (let th = 35; th <= 90; th += 5) { const big = th % 10 === 0 || th === 35; g.lineWidth = big ? 3 : 1.5; const [x0, y0] = pt(th, R0), [x1, y1] = pt(th, big ? R1 : (R0 + R1) / 2); const px = N / 2 + (x0 - N / 2) * sg, py = N / 2 + (y0 - N / 2) * sg, qx = N / 2 + (x1 - N / 2) * sg, qy = N / 2 + (y1 - N / 2) * sg; g.beginPath(); g.moveTo(px, py); g.lineTo(qx, qy); g.stroke(); if (sg === 1 && (th % 10 === 0)) { const [tx, ty] = pt(th, R1 + 0.022); g.fillText(th + '°', tx, ty); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export const YC = 0.9, YTOP = 1.5, GAP = 0.36, TH = 0.05, ZS = 0.42, ZP = 0.55, TABLE = 0.45;

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  const steel = mat(COL.steel, {metalness: 0.9, roughness: 0.3});
  // bàn
  add(root, new THREE.BoxGeometry(1.7, 0.04, 1.5), mat(COL.wood, {metalness: 0.05, roughness: 0.8}), 0, TABLE - 0.02, 0);
  for (const [x, z] of [[-0.78, -0.68], [0.78, -0.68], [-0.78, 0.68], [0.78, 0.68]]) add(root, new THREE.BoxGeometry(0.05, TABLE - 0.04, 0.05), mat(COL.dark, {metalness: 0.3}), x, (TABLE - 0.04) / 2, z);
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: ringTexture(), transparent: true})); ring.position.y = TABLE + 0.0015; root.add(ring);
  // trụ đỡ và thanh ngang
  const gp = [];
  for (const z of [-ZP, ZP]) { add(root, new THREE.CylinderGeometry(0.014, 0.014, YTOP + 0.015 - TABLE, 16), steel, 0, (YTOP + 0.015 + TABLE) / 2, z); add(root, new THREE.CylinderGeometry(0.05, 0.05, 0.02, 24), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.01, z); }
  gp.push(gmat(COL.dark, {metalness: 0.4})); add(root, new THREE.BoxGeometry(0.03, 0.03, 2 * ZP + 0.05), gp[0], 0, YTOP, 0);
  const term = []; for (const z of [-ZP, ZP]) term.push(add(root, new THREE.CylinderGeometry(0.014, 0.014, 0.03, 14).rotateZ(Math.PI / 2), mat(COL.brass, {metalness: 0.8}), -0.03, 0.6, z, false));
  // nguồn điện
  add(root, new THREE.BoxGeometry(0.26, 0.12, 0.22), mat(0x3e5666, {metalness: 0.3}), -0.85, TABLE + 0.06, 0);
  const sterm = []; for (const z of [-0.06, 0.06]) sterm.push(add(root, new THREE.CylinderGeometry(0.014, 0.014, 0.03, 14), mat(z > 0 ? COL.N : COL.ink, {metalness: 0.5}), -0.85, TABLE + 0.135, z, false));
  for (const [i, z] of [-1, 1].entries()) { const A = new THREE.Vector3(-0.85, TABLE + 0.15, z * 0.06), B = new THREE.Vector3(-0.045, 0.6, z * ZP); const mid1 = new THREE.Vector3(-0.72, 0.7, z * 0.25), mid2 = new THREE.Vector3(-0.3, 0.64, z * 0.5); add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([A, mid1, mid2, B]), 40, 0.004, 6), mat(i ? COL.N : COL.ink, {metalness: 0.2, roughness: 0.6}), 0, 0, 0, false); }
  void term; void sterm;
  // bàn xoay + nam châm (trục x cục bộ = hướng B)
  const mag = new THREE.Group(); mag.position.y = 0; root.add(mag);
  const mm = gmat(0x5d6a75, {metalness: 0.5});
  add(mag, new THREE.CylinderGeometry(0.32, 0.32, 0.02, 48), mm, 0, TABLE + 0.01, 0);
  add(mag, new THREE.BoxGeometry(2 * (GAP / 2 + TH) + 0.06, 0.04, 0.08), mm, 0, TABLE + 0.04, 0);
  const pointer = add(mag, new THREE.BoxGeometry(0.07, 0.006, 0.012), flat(COL.orange), 0.3, TABLE + 0.023, 0, false);
  const poleN = gmat(COL.N, {metalness: 0.45, roughness: 0.4}), poleS = gmat(COL.S, {metalness: 0.45, roughness: 0.4}); const discs = [];
  for (const sg of [-1, 1]) {
    const xa = sg * (GAP / 2 + TH);
    add(mag, new THREE.CylinderGeometry(0.03, 0.03, YC - (TABLE + 0.06), 20), mm, xa, (YC + TABLE + 0.06) / 2, 0);
    discs.push(add(mag, new THREE.CylinderGeometry(1, 1, TH, 40).rotateZ(Math.PI / 2), sg < 0 ? poleN : poleS, sg * (GAP / 2 + TH / 2), YC, 0));
  }
  // đường sức (đều) giữa hai cực
  const lines = []; const lm = new THREE.MeshBasicMaterial({color: 0x2b59c3, transparent: true, opacity: 0.6});
  const spots = [[0, 0]]; for (let k = 0; k < 8; k++) spots.push([Math.cos((k / 8) * 6.2832) * 0.6, Math.sin((k / 8) * 6.2832) * 0.6]); spots.push([0, 0.3], [0, -0.3]);
  for (const [a, b] of spots) { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, GAP, 6).rotateZ(Math.PI / 2), lm); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.03, 10).rotateZ(-Math.PI / 2), lm); g.add(sh, hd); g.userData = {a, b}; mag.add(g); lines.push(g); }
  // thanh đồng + lò xo
  const rod = add(root, new THREE.CylinderGeometry(0.008, 0.008, 2 * ZS + 0.02, 16).rotateX(Math.PI / 2), mat(0xc77a3a, {metalness: 0.85, roughness: 0.3}), 0, YC, 0);
  const collars = [], springs = [], sm = gmat(0xb8c2ca, {metalness: 0.85, roughness: 0.25});
  for (const z of [-ZS, ZS]) { collars.push(add(root, new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16).rotateX(Math.PI / 2), mat(COL.brass, {metalness: 0.8}), 0, YC, z)); const sp = new THREE.Mesh(helixGeo(0.5), sm); sp.castShadow = true; sp.position.set(0, YTOP - 0.015, z); root.add(sp); springs.push(sp); }
  let lastLen = -1;
  // thước đo
  const rulerM = new THREE.MeshStandardMaterial({map: rulerTexture(), roughness: 0.6, metalness: 0});
  add(root, new THREE.BoxGeometry(0.05, 0.2, 0.006), rulerM, 0.2, YC, ZS);
  add(root, new THREE.CylinderGeometry(0.01, 0.01, YC - 0.1 - TABLE, 12), steel, 0.2, (YC - 0.1 + TABLE) / 2, ZS);
  add(root, new THREE.CylinderGeometry(0.045, 0.045, 0.012, 20), mat(COL.dark, {metalness: 0.4}), 0.2, TABLE + 0.006, ZS);
  const ptr = add(root, new THREE.BoxGeometry(0.19, 0.004, 0.004), flat(COL.orange), 0.1, YC, ZS, false);
  // mũi tên
  const aB = makeArrow(0x2b59c3, 0.008), aI = makeArrow(0x2c9a4b, 0.008), aF = makeArrow(COL.orange, 0.01); root.add(aB, aI, aF);
  pts.rod = marker(root, 0, YC, 0.2); pts.N = marker(mag, -(GAP / 2 + TH), YC + 0.12, 0); pts.S = marker(mag, GAP / 2 + TH, YC + 0.12, 0); pts.spring = marker(root, 0, 1.2, ZS); pts.top = marker(root, 0, YTOP, 0.35);
  pts.ruler = marker(root, 0.2, YC + 0.12, ZS); pts.table = marker(mag, 0.3, TABLE + 0.03, 0); pts.supply = marker(root, -0.85, TABLE + 0.14, 0); pts.field = marker(root, 0, YC - 0.12, 0); pts.arrowF = marker(root, 0, YC, 0);
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td);
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    mag.rotation.y = (r.th - 90) * D2R;
    const rr = r.l / 2; discs.forEach((d) => d.scale.set(1, rr, rr));
    const y = YC + r.up; rod.position.y = y; collars.forEach((c) => (c.position.y = y)); ptr.position.y = y;
    const len = YTOP - 0.015 - (y + 0.012); if (Math.abs(len - lastLen) > 0.0003) { springs.forEach((sp) => { sp.geometry.dispose(); sp.geometry = helixGeo(len); }); lastLen = len; }
    const k = Math.min(1, r.B / 0.3);
    lines.forEach((g) => { const a = g.userData.a * rr, b = g.userData.b * rr; g.position.set(0, YC + b, a); g.children[1].position.x = 0; g.visible = Math.hypot(a, b) <= rr * 1.01; g.children[0].material.opacity = 0.25 + 0.6 * k; g.children[0].scale.set(1, 0.6 + 1.2 * k, 0.6 + 1.2 * k); g.children[1].scale.setScalar(0.7 + 0.8 * k); });
    aim(aB, [0, YC - 0.07, 0], r.b, 0.06 + 0.5 * r.B); aB.visible = false;
    aim(aI, [0, y + 0.03, -0.1 * Math.sign(r.I || 1)], [0, 0, Math.sign(r.I || 1)], Math.abs(r.I) > 0.1 ? 0.2 : 0);
    aim(aF, [0, y, 0], r.fv, Math.hypot(...r.fv) * 1.5);
    root.updateMatrixWorld(true);
  }
  void sag0; void pointer;
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
