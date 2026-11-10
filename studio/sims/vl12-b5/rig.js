// VL12-B5 geometry: bình thuỷ tinh trụ (trục z, hướng ra người xem) đặt giữa hai cuộn dây Helmholtz nằm trên giá; súng electron gắn vào thành bình; quỹ đạo vẽ từ nghiệm giải tích.
import * as THREE from 'three';
import {CH, PARTICLES, center, path, posAt} from './physics.js';

const COL = {orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, wood: 0xcdb892, cu: 0xc77a3a};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.4, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
export const TABLE = 0.45, YC = TABLE + 0.28, CZ = 0.07, CR = 0.14;

function fieldTexture(dir) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.clearRect(0, 0, 512, 512); g.strokeStyle = 'rgba(20,48,60,.55)'; g.fillStyle = 'rgba(20,48,60,.55)'; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { const x = 32 + i * 56, y = 32 + j * 56; g.beginPath(); g.arc(x, y, 13, 0, 7); g.stroke(); if (dir > 0) { g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); } else { g.beginPath(); g.moveTo(x - 8, y - 8); g.lineTo(x + 8, y + 8); g.moveTo(x + 8, y - 8); g.lineTo(x - 8, y + 8); g.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  add(root, new THREE.BoxGeometry(1.3, 0.04, 0.9), mat(COL.wood, {metalness: 0.05, roughness: 0.8}), 0.0, TABLE - 0.02, 0);
  for (const [x, z] of [[-0.58, -0.38], [0.58, -0.38], [-0.58, 0.38], [0.58, 0.38]]) add(root, new THREE.BoxGeometry(0.05, TABLE - 0.04, 0.05), mat(COL.dark, {metalness: 0.3}), x, (TABLE - 0.04) / 2, z);
  // bình
  const glass = gmat(0xbcd4dc, {metalness: 0, roughness: 0.1, opacity: 0.22, side: THREE.DoubleSide});
  add(root, new THREE.CylinderGeometry(CH.R, CH.R, 2 * CH.half, 72, 1, true).rotateX(Math.PI / 2), glass, 0, YC, 0, false);
  for (const sz of [-1, 1]) add(root, new THREE.CylinderGeometry(CH.R, CH.R, 0.004, 72).rotateX(Math.PI / 2), glass, 0, YC, sz * CH.half, false);
  const chH = YC - CH.R - TABLE; for (const sz of [-1, 1]) add(root, new THREE.BoxGeometry(0.1, chH, 0.02), mat(COL.dark, {metalness: 0.3}), 0, TABLE + chH / 2, sz * 0.03);
  // cuộn dây Helmholtz
  const cuM = gmat(COL.cu, {metalness: 0.8, roughness: 0.35}); for (const sz of [-1, 1]) { add(root, new THREE.TorusGeometry(CR, 0.018, 20, 72), cuM, 0, YC, sz * CZ); add(root, new THREE.CylinderGeometry(0.012, 0.012, YC - CR - 0.018 - TABLE, 12), mat(COL.steel, {metalness: 0.8}), 0, (YC - CR - 0.018 + TABLE) / 2, sz * CZ); add(root, new THREE.BoxGeometry(0.1, 0.012, 0.05), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.006, sz * CZ); }
  // chỉ báo B
  const ft = {p: fieldTexture(1), n: fieldTexture(-1)}; const fm = new THREE.MeshBasicMaterial({map: ft.p, transparent: true, depthWrite: false}); const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.19), fm); fp.position.set(0, YC, -CH.half + 0.002); root.add(fp);
  // súng electron (gắn vào thành bình)
  const gun = new THREE.Group(); root.add(gun); add(gun, new THREE.CylinderGeometry(0.006, 0.006, 0.04, 16).rotateZ(Math.PI / 2), gmat(0x5d6a75, {metalness: 0.6}), -0.02, 0, 0); add(gun, new THREE.SphereGeometry(0.008, 14, 10), gmat(COL.steel, {metalness: 0.8}), -0.04, 0, 0);
  const mount = add(root, new THREE.CylinderGeometry(0.003, 0.003, 1, 8).rotateZ(Math.PI / 2), gmat(COL.steel, {metalness: 0.8}), -0.24, YC, CH.z0, false);
  // quỹ đạo + hạt
  const beam = new THREE.Group(); root.add(beam); let key = ''; let curve = null, dur = 1;
  const bm = new THREE.MeshBasicMaterial({color: 0x2b59c3, transparent: true, opacity: 0.55}), pm = new THREE.MeshBasicMaterial({color: 0x2b59c3}), comet = [];
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0045 * (1 - i * 0.06), 12, 8), new THREE.MeshBasicMaterial({color: 0x2b59c3, transparent: true, opacity: 1 - i * 0.075})); root.add(m); comet.push(m); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.0015, 8, 90), flat(COL.orange)); root.add(ring);
  const cm = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), flat(COL.orange)); root.add(cm);
  pts.gun = marker(root, CH.x0 - 0.04, YC + 0.01, CH.z0); pts.chamber = marker(root, 0.09, YC + 0.06, 0.05); pts.coil = marker(root, 0.12, YC - 0.1, CZ); pts.post = marker(root, 0, (TABLE + YC - CR) / 2, CZ); pts.cradle = marker(root, 0, TABLE + 0.05, 0.03); pts.field = marker(root, -0.09, YC + 0.1, -CH.half); pts.particle = marker(root, 0, YC, 0);
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td); for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    const k = `${s.pt}|${s.V}|${s.B}|${s.alpha}|${s.dirB}`; const colr = PARTICLES[s.pt].color;
    if (k !== key) { key = k; beam.clear(); const p = path(s, 220); dur = Math.max(p.duration, 1e-12); curve = p; if (p.pts.length > 3) { const c = new THREE.CatmullRomCurve3(p.pts.map((q) => new THREE.Vector3(q[0], YC + q[1], q[2])), false, 'centripetal'); bm.color.setHex(colr); beam.add(new THREE.Mesh(new THREE.TubeGeometry(c, 300, 0.0018, 6), bm)); } comet.forEach((m) => m.material.color.setHex(colr)); fm.map = s.dirB > 0 ? ft.p : ft.n; fm.needsUpdate = true;
      const a = s.alpha * Math.PI / 180; gun.position.set(CH.x0, YC, CH.z0); gun.rotation.set(0, -(Math.PI / 2 - a), 0); const tailX = CH.x0 - 0.04 * Math.sin(a), tailZ = CH.z0 - 0.04 * Math.cos(a); mount.scale.x = Math.max(0.001, tailX + CH.R); mount.position.set(-CH.R + (tailX + CH.R) / 2, YC, tailZ); }
    if (curve && curve.pts.length > 1) { const Tp = r.T, tt = (s.u * Tp) % dur; for (let i = 0; i < comet.length; i++) { const t = ((tt - i * 0.012 * Tp) % dur + dur) % dur; const q = posAt(s, t); comet[i].position.set(q[0], YC + q[1], q[2]); } pts.particle.position.copy(comet[0].position); }
    ring.visible = cm.visible = !!s.showRing; const c = center(s); ring.position.set(c[0], YC + c[1], CH.z0 + 0.003); ring.scale.set(s.rt, s.rt, 1); cm.position.set(c[0], YC + c[1], CH.z0 + 0.003);
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
