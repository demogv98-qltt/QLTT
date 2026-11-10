// VL12-B1 geometry: bàn, tấm bìa trong suốt đặt trên 4 trụ, nam châm thanh nằm dưới tấm bìa, 48 kim la bàn + kim thử, mạt sắt (InstancedMesh), đường sức (tính từ mô hình).
import * as THREE from 'three';
import {D2R, H_FIL, MAG, magnetField, probePos, traceLine, magnetHoriz} from './physics.js';

const COL = {orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, N: 0xc0392b, S: 0x2b59c3, wood: 0xcdb892, line: 0x1d4ed8};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.4, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
export const TABLE = 0.45, YA = TABLE + MAG.a, YS = YA + MAG.a + 0.0015; // trục nam châm, mặt dưới tấm bìa = đỉnh nam châm
export const GRID = (() => { const g = []; for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const x = i * 0.14, z = j * 0.14; if (Math.hypot(x, z) > 0.1) g.push([x, z]); } return g; })();

function makeNeedle(scale = 1) {
  const g = new THREE.Group();
  g.add(add(g, new THREE.ConeGeometry(0.0065, 0.034, 12).rotateZ(-Math.PI / 2), mat(COL.N, {metalness: 0.2}), 0.017, 0, 0, false));
  g.add(add(g, new THREE.ConeGeometry(0.0065, 0.034, 12).rotateZ(Math.PI / 2), mat(0xf2f2ee, {metalness: 0.1}), -0.017, 0, 0, false));
  g.scale.setScalar(scale); return g;
}
const SEEDS = (() => { const n = 8, N = 400, a = MAG.a, u = MAG.L / 2 + 0.002, cum = [0]; for (let i = 1; i <= N; i++) { const rho = (i - 0.5) / N * a; cum.push(cum[i - 1] + Math.max(0, magnetField(0.25, u, rho)[0]) * 2 * Math.PI * rho * (a / N)); } const out = []; for (let k = 0; k < n; k++) { const tgt = cum[N] * (k + 0.5) / n; let i = 1; while (i < N && cum[i] < tgt) i++; out.push((i - 0.5) / N * a); } return out; })();
function lineGroup(Br, sign) {
  const grp = new THREE.Group(), lm = new THREE.MeshBasicMaterial({color: COL.line}), cm = new THREE.MeshBasicMaterial({color: COL.line});
  for (const rho0 of SEEDS) {
    const t = traceLine(Br, rho0); const keep = t.pts.filter((_, k) => k % 5 === 0 || k === t.pts.length - 1);
    const v = keep.map((p) => new THREE.Vector3(p[0], 0, sign * p[1])); if (v.length < 4) continue;
    const curve = new THREE.CatmullRomCurve3(v, false, 'centripetal'); grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(300, v.length * 2), 0.0016, 5), lm));
    for (const f of [0.3, 0.7]) { const p = curve.getPointAt(f), d = curve.getTangentAt(f); const c = new THREE.Mesh(new THREE.ConeGeometry(0.0065, 0.018, 10), cm); c.position.copy(p); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); grp.add(c); }
  }
  return grp;
}
export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  add(root, new THREE.BoxGeometry(1.3, 0.04, 1.3), mat(COL.wood, {metalness: 0.05, roughness: 0.8}), 0, TABLE - 0.02, 0);
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) add(root, new THREE.BoxGeometry(0.05, TABLE - 0.04, 0.05), mat(COL.dark, {metalness: 0.3}), x, (TABLE - 0.04) / 2, z);
  // mũi tên hướng Bắc vẽ trên bàn (phía −z)
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0.09); s.lineTo(0.05, 0); s.lineTo(0.015, 0); s.lineTo(0.015, -0.1); s.lineTo(-0.015, -0.1); s.lineTo(-0.015, 0); s.lineTo(-0.05, 0); s.closePath(); return s; })()), flat(COL.ink)); arrow.rotation.x = -Math.PI / 2; arrow.position.set(0, TABLE + 0.001, -0.58); root.add(arrow);
  // tấm bìa trong suốt + 4 trụ
  const sheetM = gmat(0xdfe9ee, {metalness: 0.0, roughness: 0.3, opacity: 0.38}); const sheet = add(root, new THREE.BoxGeometry(1.04, 0.003, 1.04), sheetM, 0, YS + 0.0015, 0, false); sheet.castShadow = false;
  const legM = gmat(COL.steel, {metalness: 0.8, roughness: 0.3});
  for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) add(root, new THREE.CylinderGeometry(0.012, 0.012, YS - TABLE, 12), legM, x, (YS + TABLE) / 2, z);
  // nam châm (trục cục bộ x)
  const mag = new THREE.Group(); mag.position.y = YA; root.add(mag);
  const nM = gmat(COL.N, {metalness: 0.35}), sM = gmat(COL.S, {metalness: 0.35});
  add(mag, new THREE.CylinderGeometry(MAG.a, MAG.a, MAG.L / 2, 36).rotateZ(Math.PI / 2), nM, MAG.L / 4, 0, 0); add(mag, new THREE.CylinderGeometry(MAG.a, MAG.a, MAG.L / 2, 36).rotateZ(Math.PI / 2), sM, -MAG.L / 4, 0, 0);
  const rings = []; const rm = new THREE.MeshBasicMaterial({color: 0xe8a50c, transparent: true, opacity: 0}); for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(MAG.a * 1.02, 0.0009, 6, 40).rotateY(Math.PI / 2), rm); r.position.x = -MAG.L / 2 + (i + 0.5) * MAG.L / 12; mag.add(r); rings.push(r); }
  const lines0 = new THREE.Group(); mag.add(lines0); const L0 = lineGroup(0.25, 1), L1 = lineGroup(0.25, -1); lines0.add(L0, L1);
  const lines60 = new THREE.Group(), lines120 = new THREE.Group(); for (const [g, ang] of [[lines60, 60], [lines120, 120]]) { g.rotation.x = ang * D2R; g.add(lineGroup(0.25, 1), lineGroup(0.25, -1)); mag.add(g); }
  // la bàn
  const comps = []; const baseM = gmat(0x41596a, {metalness: 0.3});
  for (const [x, z] of GRID) { const g = new THREE.Group(); g.position.set(x, YS + 0.003, z); root.add(g); add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.006, 24), baseM, 0, 0.003, 0, false); add(g, new THREE.CylinderGeometry(0.002, 0.002, 0.012, 8), mat(COL.steel), 0, 0.009, 0, false); const n = makeNeedle(); n.position.y = 0.013; g.add(n); comps.push({g, n}); }
  const pg = new THREE.Group(); root.add(pg); const pbase = add(pg, new THREE.CylinderGeometry(0.045, 0.045, 0.008, 28), mat(COL.orange, {metalness: 0.3}), 0, 0.004, 0, false); add(pg, new THREE.CylinderGeometry(0.003, 0.003, 0.016, 8), mat(COL.steel), 0, 0.012, 0, false); const pn = makeNeedle(1.5); pn.position.y = 0.018; pg.add(pn); void pbase;
  // mạt sắt
  const NF = 56, fgeo = new THREE.BoxGeometry(0.014, 0.0012, 0.0017), fil = new THREE.InstancedMesh(fgeo, mat(0x2b2f36, {metalness: 0.7, roughness: 0.4}), NF * NF); fil.castShadow = false; root.add(fil);
  const fpos = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; for (let i = 0; i < NF; i++) for (let j = 0; j < NF; j++) fpos.push([(i - 27.5) * 0.0115 + (rnd() - 0.5) * 0.008, (j - 27.5) * 0.0115 + (rnd() - 0.5) * 0.008, rnd() * 6.283]);
  const dm = new THREE.Object3D();
  pts.N = marker(mag, MAG.L / 2, 0.02, 0); pts.S = marker(mag, -MAG.L / 2, 0.02, 0); pts.mag = marker(mag, 0, -0.012, 0); pts.north = marker(root, 0, TABLE + 0.02, -0.58); pts.sheet = marker(root, 0.45, YS + 0.003, 0.5); pts.probe = marker(pg, 0, 0.03, 0); pts.rings = marker(mag, 0, 0.02, 0.02); pts.leg = marker(root, 0.5, (YS + TABLE) / 2, 0.5); pts.field = marker(mag, 0.15, 0, 0);
  const dirty = {fil: true};
  function updateFilings(s) { for (let k = 0; k < fpos.length; k++) { const [x, z, a0] = fpos[k], m = magnetHoriz(s, x, z, H_FIL), bm = Math.hypot(m[0], m[1]), w = Math.min(1, Math.max(0, (bm - 1.2e-4) / 2.4e-4)); let ang = Math.atan2(-m[1], m[0]); const d = Math.atan2(Math.sin(ang - a0), Math.cos(ang - a0)); ang = a0 + d * w; dm.position.set(x, YS + 0.0036, z); dm.rotation.set(0, -ang, 0); dm.updateMatrix(); fil.setMatrixAt(k, dm.matrix); } fil.instanceMatrix.needsUpdate = true; dirty.fil = false; }
  function update(r, s, td, cs, probe) {
    const e = td * td * (3 - 2 * td); for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    mag.visible = s.magnet; mag.rotation.y = s.phi * D2R; rm.opacity = 0.9 * e; rings.forEach((x) => (x.visible = s.magnet));
    lines0.visible = s.mode === 'lines' && s.magnet; lines60.visible = lines120.visible = lines0.visible && s.lines3d;
    const showC = s.mode !== 'filings'; const [px, pz] = probePos(s);
    cs.forEach((c, i) => { const o = comps[i]; o.g.visible = showC && Math.hypot(c.x - px, c.z - pz) > 0.075; o.n.rotation.y = -c.psi; }); pg.position.set(px, YS + 0.003, pz); pn.rotation.y = -probe.psi;
    fil.visible = s.mode === 'filings'; if (s.mode === 'filings' && (dirty.fil || s.fdirty)) { updateFilings(s); s.fdirty = false; }
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt, dirty};
}
