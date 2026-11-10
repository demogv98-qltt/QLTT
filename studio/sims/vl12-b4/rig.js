// VL12-B4 geometry: cân điện tử, nam châm chữ U trên đĩa cân, khung dây N vòng treo cố định vào giá (đoạn ngang trong khe từ trường), nguồn điện có màn hình.
import * as THREE from 'three';
import {P} from './physics.js';

const COL = {orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, N: 0xc0392b, S: 0x2b59c3, wood: 0xcdb892, cu: 0xc77a3a};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.4, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function makeArrow(color, w = 0.004) { const g = new THREE.Group(), m = flat(color), hl0 = w * 5; const shaft = new THREE.Mesh(new THREE.CylinderGeometry(w, w, 1, 10), m), head = new THREE.Mesh(new THREE.ConeGeometry(w * 2.6, hl0, 14), m); g.add(shaft, head); g.userData.set = (len) => { const l = Math.max(0, len); g.visible = l > 0.005; const hl = Math.min(hl0, l * 0.5); shaft.scale.y = Math.max(0.001, l - hl); shaft.position.y = (l - hl) / 2; head.scale.setScalar(hl / hl0); head.position.y = l - hl / 2; }; return g; }
function panel(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return {c, t, key: ''}; }
export const TABLE = 0.45, BAL_TOP = TABLE + 0.04, PAN = BAL_TOP + 0.034, YW = PAN + 0.012 + 0.025, YT = YW + 0.2; // YW: độ cao đoạn dây ngang trong khe

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  add(root, new THREE.BoxGeometry(1.2, 0.04, 0.9), mat(COL.wood, {metalness: 0.05, roughness: 0.8}), 0.1, TABLE - 0.02, 0);
  for (const [x, z] of [[-0.45, -0.38], [0.65, -0.38], [-0.45, 0.38], [0.65, 0.38]]) add(root, new THREE.BoxGeometry(0.05, TABLE - 0.04, 0.05), mat(COL.dark, {metalness: 0.3}), x, (TABLE - 0.04) / 2, z);
  // cân điện tử
  const balG = new THREE.Group(); root.add(balG); add(balG, new THREE.BoxGeometry(0.26, 0.04, 0.2), mat(0xdfe3e6, {metalness: 0.2, roughness: 0.5}), 0, TABLE + 0.02, 0);
  const disp = panel(256, 96), dispM = new THREE.MeshBasicMaterial({map: disp.t}); const dplane = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.04), dispM); dplane.position.set(0, TABLE + 0.022, 0.1005); balG.add(dplane);
  add(balG, new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16), mat(COL.steel), 0, BAL_TOP + 0.005, 0); add(balG, new THREE.CylinderGeometry(0.085, 0.085, 0.004, 40), mat(0xaeb7be, {metalness: 0.8, roughness: 0.3}), 0, BAL_TOP + 0.012, 0);
  // đĩa cân cao PAN: để đĩa chạm đúng đáy nam châm, đặt đĩa ở y = PAN − 0.002 và nâng cột đỡ
  const panM = add(balG, new THREE.CylinderGeometry(0.012, 0.012, PAN - BAL_TOP - 0.012, 16), mat(COL.steel), 0, (BAL_TOP + 0.012 + PAN) / 2, 0);
  add(balG, new THREE.CylinderGeometry(0.085, 0.085, 0.004, 40), mat(0xaeb7be, {metalness: 0.8, roughness: 0.3}), 0, PAN - 0.002, 0); void panM;
  // nam châm chữ U (cực N ở −x, cực S ở +x; B từ N sang S, hướng +x)
  const magG = new THREE.Group(); root.add(magG); const yokeM = gmat(0x5d6a75, {metalness: 0.5}), nM = gmat(COL.N, {metalness: 0.4}), sM = gmat(COL.S, {metalness: 0.4});
  add(magG, new THREE.BoxGeometry(0.1, 0.012, 0.05), yokeM, 0, PAN + 0.006, 0);
  add(magG, new THREE.BoxGeometry(0.04, 0.05, 0.05), nM, -0.035, PAN + 0.012 + 0.025, 0); add(magG, new THREE.BoxGeometry(0.04, 0.05, 0.05), sM, 0.035, PAN + 0.012 + 0.025, 0);
  // khung dây N vòng: mỗi vòng là hình chữ nhật trong mặt phẳng y–z; đoạn đáy dài l nằm trong khe
  const frameG = new THREE.Group(); root.add(frameG); let key = -1; const cuM = gmat(COL.cu, {metalness: 0.85, roughness: 0.3});
  function buildFrame(N) {
    frameG.clear(); const zl = P.l / 2;
    for (let n = 0; n < N; n++) { const x = (n - (N - 1) / 2) * 0.0045; const loop = [[x, YW, -zl], [x, YW, zl], [x, YT, zl], [x, YT, -zl], [x, YW, -zl]].map((p) => new THREE.Vector3(...p));
      for (let k = 0; k < 4; k++) { const a = loop[k], b = loop[k + 1], len = a.distanceTo(b), m = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, len, 8), cuM); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); frameG.add(m); }
      add(frameG, new THREE.SphereGeometry(0.0013, 8, 6), cuM, x, YW, zl, false); }
    add(frameG, new THREE.BoxGeometry(0.03 + N * 0.0045, 0.008, P.l + 0.01), mat(0xe9e2d0, {metalness: 0, roughness: 0.8}), 0, YT + 0.004, 0); // thanh nhựa giữ các vòng ở phía trên
  }
  // giá đỡ
  const stand = gmat(COL.steel, {metalness: 0.9, roughness: 0.3}); const zS = -0.2, yArm = YT + 0.07;
  add(root, new THREE.BoxGeometry(0.14, 0.02, 0.12), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.01, zS); add(root, new THREE.CylinderGeometry(0.008, 0.008, yArm - TABLE, 12), stand, 0, (yArm + TABLE) / 2, zS);
  add(root, new THREE.CylinderGeometry(0.006, 0.006, -zS, 12).rotateX(Math.PI / 2), stand, 0, yArm, zS / 2); add(root, new THREE.BoxGeometry(0.03, 0.014, 0.03), stand, 0, yArm - 0.003, 0);
  add(root, new THREE.CylinderGeometry(0.003, 0.003, yArm - 0.003 - 0.007 - (YT + 0.008), 8), mat(0xe9e2d0, {metalness: 0, roughness: 0.8}), 0, (yArm - 0.01 + YT + 0.008) / 2, 0);
  // nguồn điện
  const SX = 0.42, supply = new THREE.Group(); supply.position.set(SX, TABLE, 0.05); root.add(supply); add(supply, new THREE.BoxGeometry(0.2, 0.09, 0.16), mat(0x3e5666, {metalness: 0.3}), 0, 0.045, 0);
  const sd = panel(256, 96), sdM = new THREE.MeshBasicMaterial({map: sd.t}); const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.04), sdM); sp.position.set(0, 0.055, 0.0805); supply.add(sp);
  add(supply, new THREE.CylinderGeometry(0.012, 0.012, 0.03, 14), mat(COL.N, {metalness: 0.5}), 0.05, 0.105, -0.04, false); add(supply, new THREE.CylinderGeometry(0.012, 0.012, 0.03, 14), mat(COL.ink, {metalness: 0.5}), -0.05, 0.105, -0.04, false);
  const lead = (a, b, c, d, col) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, b, c, d].map((p) => new THREE.Vector3(...p)), false, 'centripetal'), 40, 0.0022, 6), mat(col, {metalness: 0.1, roughness: 0.7}));
  // dây nối: từ hai đầu khung (đỉnh) tới nguồn; vòng ngoài cùng nối cực +, vòng trong cùng nối cực −
  const leadG = new THREE.Group(); root.add(leadG);
  function leads(N) { leadG.clear(); const x0 = -((N - 1) / 2) * 0.0045, x1 = ((N - 1) / 2) * 0.0045, zl = P.l / 2; leadG.add(lead([x0, YT, zl], [0.05, YT + 0.04, 0.1], [0.3, TABLE + 0.2, 0.08], [SX + 0.05, TABLE + 0.12, 0.01], COL.N)); leadG.add(lead([x1, YT, -zl], [0.0, YT + 0.05, -0.12], [0.3, TABLE + 0.22, -0.06], [SX - 0.05, TABLE + 0.12, 0.01], 0x2a2f36)); }
  const aF = makeArrow(COL.orange, 0.003), aR = makeArrow(0x2c9a4b, 0.003); root.add(aF, aR);
  pts.mag = marker(magG, 0, PAN + 0.075, 0); pts.N = marker(magG, -0.035, PAN + 0.06, 0.025); pts.S = marker(magG, 0.035, PAN + 0.06, 0.025); pts.frame = marker(frameG, 0, YT, 0.02); pts.wire = marker(frameG, 0, YW, 0.02); pts.bal = marker(balG, 0.12, TABLE + 0.04, 0.1); pts.supply = marker(supply, 0.1, 0.09, 0.08); pts.stand = marker(root, 0, YT - 0.03, zS); pts.pan = marker(balG, -0.085, PAN, 0.04);
  function texDisp(p, text, sub) { if (p.key === text + sub) return; p.key = text + sub; const g = p.c.getContext('2d'); g.fillStyle = '#10211a'; g.fillRect(0, 0, p.c.width, p.c.height); g.fillStyle = '#7dffb0'; g.font = 'bold 58px monospace'; g.textAlign = 'right'; g.fillText(text, p.c.width - 70, 66); g.font = 'bold 30px monospace'; g.textAlign = 'left'; g.fillText(sub, p.c.width - 62, 66); p.t.needsUpdate = true; }
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td); for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    if (s.N !== key) { key = s.N; buildFrame(s.N); leads(s.N); }
    texDisp(disp, `${(r.disp < 0 ? '-' : '') + Math.abs(r.disp).toFixed(2)}`, 'g'); texDisp(sd, `${r.I.toFixed(2)}`, 'A');
    aF.position.set(0.0, YW + 0.004, 0.0); aF.rotation.z = r.dir >= 0 ? 0 : Math.PI; aF.userData.set(Math.min(0.1, Math.abs(r.F) * 3.5)); aF.visible = r.dir !== 0 && aF.visible;
    aR.position.set(0.0, PAN + 0.002, -0.03); aR.rotation.z = r.dir >= 0 ? Math.PI : 0; aR.userData.set(Math.min(0.1, Math.abs(r.F) * 3.5)); aR.visible = r.dir !== 0 && aR.visible;
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
