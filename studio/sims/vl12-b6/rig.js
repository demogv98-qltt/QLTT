// VL12-B6 geometry: bàn, cột đỡ + tay đòn, ống thuỷ tinh thẳng đứng có cuộn dây quấn quanh, nam châm (N hướng xuống) treo bằng dây ròng rọc / thả rơi vào đệm xốp, điện kế nối cuộn dây.
import * as THREE from 'three';
import {COIL, MAG, S_BOT, S_TOP} from './physics.js';
import {createRightHand} from '../kit-su-pham/tay_phai.js';

const COL = {orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, N: 0xc0392b, S: 0x2b59c3, wood: 0xcdb892, cu: 0xc77a3a};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.4, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
export const TABLE = 0.45, YT0 = TABLE + 0.06, YC = YT0 + 0.36, GX = 0.42; // YC: tâm cuộn dây; GX: vị trí điện kế
const TR = 0.03; // bán kính ngoài của ống
function makeArrow(color, w = 0.008) { const g = new THREE.Group(), m = flat(color), hl0 = w * 5; const shaft = new THREE.Mesh(new THREE.CylinderGeometry(w, w, 1, 10), m), head = new THREE.Mesh(new THREE.ConeGeometry(w * 2.6, hl0, 14), m); g.add(shaft, head); g.userData.set = (len) => { const l = Math.max(0, len); g.visible = l > 0.01; const hl = Math.min(hl0, l * 0.5); shaft.scale.y = Math.max(0.001, l - hl); shaft.position.y = (l - hl) / 2; head.scale.setScalar(hl / hl0); head.position.y = l - hl / 2; }; return g; }
function dialTexture(fs) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 360; const g = c.getContext('2d'); g.fillStyle = '#f7f4e8'; g.fillRect(0, 0, 512, 360); g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.textAlign = 'center'; g.font = 'bold 26px monospace';
  const cx = 256, cy = 300, R = 220; for (let k = -10; k <= 10; k++) { const a = (k / 10) * (50 * Math.PI / 180), big = k % 5 === 0, r1 = R, r0 = R - (big ? 28 : 16); g.lineWidth = big ? 4 : 2; g.beginPath(); g.moveTo(cx + r0 * Math.sin(a), cy - r0 * Math.cos(a)); g.lineTo(cx + r1 * Math.sin(a), cy - r1 * Math.cos(a)); g.stroke(); if (big) { const v = (k / 10) * fs; g.fillText((Math.abs(v) < 1 ? v.toFixed(2) : v.toFixed(1)).replace('.', ','), cx + (R - 52) * Math.sin(a), cy - (R - 52) * Math.cos(a) + 8); } }
  g.font = 'bold 32px monospace'; g.fillText('A', cx, cy - 120); g.font = '20px monospace'; g.fillText('+ ⟲ : dòng ngược chiều kim đồng hồ (nhìn từ trên)', cx, 345);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  add(root, new THREE.BoxGeometry(1.4, 0.04, 1.0), mat(COL.wood, {metalness: 0.05, roughness: 0.8}), 0.1, TABLE - 0.02, 0);
  for (const [x, z] of [[-0.55, -0.42], [0.75, -0.42], [-0.55, 0.42], [0.75, 0.42]]) add(root, new THREE.BoxGeometry(0.05, TABLE - 0.04, 0.05), mat(COL.dark, {metalness: 0.3}), x, (TABLE - 0.04) / 2, z);
  // giá đỡ
  const steel = mat(COL.steel, {metalness: 0.9, roughness: 0.3}), frameM = gmat(COL.steel, {metalness: 0.9, roughness: 0.3});
  add(root, new THREE.BoxGeometry(0.3, 0.02, 0.22), mat(COL.dark, {metalness: 0.4}), -0.05, TABLE + 0.01, 0);
  const colX = -0.2, yArm = YC + 0.55; add(root, new THREE.CylinderGeometry(0.014, 0.014, yArm - TABLE, 16), frameM, colX, (yArm + TABLE) / 2, 0);
  add(root, new THREE.CylinderGeometry(0.01, 0.01, -colX + 0.0, 12).rotateZ(Math.PI / 2), frameM, colX / 2, yArm, 0); add(root, new THREE.CylinderGeometry(0.02, 0.02, 0.03, 20), frameM, 0, yArm - 0.0, 0); // tay đòn trên + ròng rọc
  const yClamp = YC + 0.2; add(root, new THREE.CylinderGeometry(0.008, 0.008, -colX - TR, 12).rotateZ(Math.PI / 2), frameM, (colX - TR) / 2, yClamp, 0);
  // ống thuỷ tinh + đệm xốp
  const yTubeTop = YC + 0.36 + 0.02, tubeLen = yTubeTop - YT0; add(root, new THREE.CylinderGeometry(TR, TR, tubeLen, 36, 1, true), gmat(0xbcd4dc, {metalness: 0, roughness: 0.15, opacity: 0.3, side: THREE.DoubleSide}), 0, (YT0 + yTubeTop) / 2, 0, false);
  add(root, new THREE.CylinderGeometry(TR - 0.0015, TR - 0.0015, 0.03, 28), mat(0xe9d27a, {metalness: 0, roughness: 0.95}), 0, YT0 + 0.015, 0); add(root, new THREE.CylinderGeometry(0.05, 0.05, 0.02, 24), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.01 + 0.02, 0);
  add(root, new THREE.CylinderGeometry(TR + 0.003, TR + 0.003, YT0 - TABLE - 0.03, 20), mat(COL.dark, {metalness: 0.4}), 0, (YT0 + TABLE + 0.03) / 2 - 0.0, 0);
  // cuộn dây (bobbin + khối dây)
  const cm = gmat(COL.cu, {metalness: 0.8, roughness: 0.35}), coilGrp = new THREE.Group(); coilGrp.position.y = YC; root.add(coilGrp); let coilKey = -1;
  const flangeM = gmat(COL.dark, {metalness: 0.3}); for (const sy of [-1, 1]) add(coilGrp, new THREE.CylinderGeometry(0.058, 0.058, 0.005, 36), flangeM, 0, sy * 0.0275, 0);
  function lathe(ro) { const prof = [new THREE.Vector2(TR, -0.025), new THREE.Vector2(ro, -0.025), new THREE.Vector2(ro, 0.025), new THREE.Vector2(TR, 0.025), new THREE.Vector2(TR, -0.025)]; return new THREE.LatheGeometry(prof, 48); }
  let wind = add(coilGrp, lathe(0.04), cm, 0, 0, 0); const dirs = []; const dm = flat(0x2c9a4b); for (let k = 0; k < 8; k++) { const a = (k / 8) * 2 * Math.PI, c = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.022, 10), dm); c.position.set(0.062 * Math.cos(a), 0.046, -0.062 * Math.sin(a)); c.userData.a = a; coilGrp.add(c); dirs.push(c); }
  // nam châm: N hướng xuống
  const mag = new THREE.Group(); root.add(mag); const nM = gmat(COL.N, {metalness: 0.35}), sM = gmat(COL.S, {metalness: 0.35});
  add(mag, new THREE.CylinderGeometry(MAG.a, MAG.a, MAG.L / 2, 28), sM, 0, MAG.L / 4, 0); add(mag, new THREE.CylinderGeometry(MAG.a, MAG.a, MAG.L / 2, 28), nM, 0, -MAG.L / 4, 0); add(mag, new THREE.CylinderGeometry(0.004, 0.004, 0.012, 8), steel, 0, MAG.L / 2 + 0.006, 0);
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 1, 6), flat(0x222222)); root.add(thread);
  // điện kế
  const gal = new THREE.Group(); gal.position.set(GX, TABLE, 0); root.add(gal); add(gal, new THREE.BoxGeometry(0.26, 0.16, 0.12), mat(0x3e5666, {metalness: 0.3}), 0, 0.08, 0);
  let dialM = new THREE.MeshBasicMaterial({map: dialTexture(0.5)}); const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.15), dialM); dial.position.set(0, 0.09, 0.0605); gal.add(dial);
  const needleP = new THREE.Group(); needleP.position.set(0, 0.09 - 0.15 / 2 + 0.15 * (300 / 360) - 0.015 * 0 + 0.0, 0.062); gal.add(needleP); const needle = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.1, 0.002), flat(COL.N)); needle.position.y = 0.05; needleP.add(needle); add(needleP, new THREE.CylinderGeometry(0.008, 0.008, 0.004, 14).rotateX(Math.PI / 2), mat(COL.ink), 0, 0, 0, false);
  needleP.position.y = 0.09 + 0.075 - (300 / 360) * 0.15 - 0.0; // trục kim ở y = 300/360 của mặt đồng hồ tính từ trên
  const termL = add(gal, new THREE.CylinderGeometry(0.01, 0.01, 0.02, 12), mat(COL.ink), -0.05, 0.17, 0, false), termR = add(gal, new THREE.CylinderGeometry(0.01, 0.01, 0.02, 12), mat(COL.N), 0.05, 0.17, 0, false);
  const lead = (a, b, c) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, b, c].map((p) => new THREE.Vector3(...p)), false, 'centripetal'), 40, 0.0035, 6), mat(0x2a2f36, {metalness: 0.1, roughness: 0.7}));
  root.add(lead([0.06, YC + 0.0, 0.0], [0.2, YC - 0.1, 0.07], [GX + 0.05, TABLE + 0.18, 0])); root.add(lead([0.056, YC - 0.012, 0.0], [0.15, YC - 0.2, -0.08], [GX - 0.05, TABLE + 0.18, 0]));
  // bàn tay phải: bốn ngón theo chiều dòng cảm ứng (ngược chiều kim đồng hồ khi nhìn từ trên nếu e > 0), ngón cái chỉ chiều B cảm ứng
  const handG = new THREE.Group(); root.add(handG); const handObj = createRightHand(0.068, {finger: 0.0085, start: 40 * Math.PI / 180}); handG.add(handObj); pts.hand = marker(handG, handObj.userData.tip.x, handObj.userData.tip.y, handObj.userData.tip.z);
  // mũi tên B cảm ứng (bên cạnh cuộn dây)
  const aB = makeArrow(0xe8590c, 0.007); root.add(aB);
  pts.coil = marker(root, 0.058, YC, 0); pts.magnet = marker(mag, MAG.a, 0, 0); pts.gal = marker(gal, 0.1, 0.12, 0.06); pts.tube = marker(root, -TR, YC + 0.28, 0); pts.cushion = marker(root, TR, YT0 + 0.01, 0); pts.arm = marker(root, 0, yArm, 0); pts.arrowB = marker(root, 0.09, YC, 0); pts.col = marker(root, colX, YC - 0.1, 0);
  void termL; void termR; void S_BOT; void yClamp;
  function update(r, s, td, fs, ang) {
    const e = td * td * (3 - 2 * td); for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    const key = Math.round(s.N / 10); if (key !== coilKey) { coilKey = key; wind.geometry.dispose(); wind.geometry = lathe(TR + 0.006 + 0.012 * (s.N / 500)); }
    const ym = YC + r.s; mag.position.y = ym; mag.rotation.z = s.flip ? Math.PI : 0;
    const showThread = s.mode === 'motor' || (!r.released); const yTop = YC + 0.55 - 0.0; thread.visible = showThread; if (showThread) { const len = yTop - (ym + MAG.L / 2 + 0.012); thread.scale.y = Math.max(0.001, len); thread.position.set(0, ym + MAG.L / 2 + 0.012 + len / 2, 0); }
    const sgn = r.direction; dirs.forEach((c) => { const a = c.userData.a; c.visible = Math.abs(r.i) > 5e-4 && sgn !== 0; const tg = new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a)).multiplyScalar(sgn || 1); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg); });
    aB.rotation.z = r.direction >= 0 ? 0 : Math.PI; aB.position.set(0.09, YC + (r.direction >= 0 ? -0.04 : 0.04), 0); aB.userData.set(Math.min(0.1, Math.abs(r.i) / Math.max(fs, 1e-6) * 0.1) * (s.open ? 0 : 1));
    handG.visible = !!s.hand && Math.abs(r.i) > 5e-4 && !s.open; handG.rotation.set(r.direction >= 0 ? 0 : Math.PI, 0, 0); handG.position.set(0, YC + (r.direction >= 0 ? -0.025 : 0.025), 0);
    needleP.rotation.z = -ang; root.updateMatrixWorld(true);
    if (dialM.userData.fs !== fs) { dialM.userData.fs = fs; dialM.map?.dispose(); dialM.map = dialTexture(fs); dialM.needsUpdate = true; }
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  void S_TOP; void COIL;
  return {root, update, pts, worldPt};
}
