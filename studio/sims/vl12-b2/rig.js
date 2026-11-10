// VL12-B2 geometry: bàn, tấm bìa trong suốt trên 4 trụ, nguồn từ trường (dây thẳng đứng / khung dây tròn / ống dây) đi xuyên qua tấm bìa, nguồn điện,
// 48 kim la bàn + kim thử, mạt sắt (InstancedMesh), đường sức (dây thẳng: đường tròn; khung/ống: tích phân RK4 từ mô hình).
import * as THREE from 'three';
import {D2R, SOL, WIRE, probePos, srcHoriz, traceCoil} from './physics.js';
import {createRightHand} from '../kit-su-pham/tay_phai.js';

const COL = {orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, N: 0xc0392b, S: 0x2b59c3, wood: 0xcdb892, line: 0x1d4ed8, cu: 0xc77a3a};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.4, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
export const TABLE = 0.45, YS = TABLE + 0.25, SX = 0.72; // SX: vị trí nguồn điện
export const GRID = (() => { const g = []; for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const x = i * 0.14, z = j * 0.14; if (Math.hypot(x, z) > 0.1) g.push([x, z]); } return g; })();
function makeNeedle(scale = 1) { const g = new THREE.Group(); add(g, new THREE.ConeGeometry(0.0065, 0.034, 12).rotateZ(-Math.PI / 2), mat(COL.N, {metalness: 0.2}), 0.017, 0, 0, false); add(g, new THREE.ConeGeometry(0.0065, 0.034, 12).rotateZ(Math.PI / 2), mat(0xf2f2ee, {metalness: 0.1}), -0.017, 0, 0, false); g.scale.setScalar(scale); return g; }
const tube = (pts, r, m, seg) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal'), seg || Math.max(8, pts.length * 3), r, 6), m);
const cone = (m, len = 0.03, r = 0.009) => new THREE.Mesh(new THREE.ConeGeometry(r, len, 10), m);

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  add(root, new THREE.BoxGeometry(1.7, 0.04, 1.3), mat(COL.wood, {metalness: 0.05, roughness: 0.8}), 0.05, TABLE - 0.02, 0);
  for (const [x, z] of [[-0.75, -0.58], [0.85, -0.58], [-0.75, 0.58], [0.85, 0.58]]) add(root, new THREE.BoxGeometry(0.05, TABLE - 0.04, 0.05), mat(COL.dark, {metalness: 0.3}), x, (TABLE - 0.04) / 2, z);
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0.09); s.lineTo(0.05, 0); s.lineTo(0.015, 0); s.lineTo(0.015, -0.1); s.lineTo(-0.015, -0.1); s.lineTo(-0.015, 0); s.lineTo(-0.05, 0); s.closePath(); return s; })()), flat(COL.ink)); arrow.rotation.x = -Math.PI / 2; arrow.position.set(-0.62, TABLE + 0.001, -0.5); root.add(arrow);
  const sheetM = gmat(0xdfe9ee, {metalness: 0.0, roughness: 0.3, opacity: 0.38}); const sheet = add(root, new THREE.BoxGeometry(1.04, 0.003, 1.04), sheetM, 0, YS, 0, false); sheet.castShadow = false;
  const legM = gmat(COL.steel, {metalness: 0.8, roughness: 0.3}); for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) add(root, new THREE.CylinderGeometry(0.012, 0.012, YS - 0.0015 - TABLE, 12), legM, x, (YS - 0.0015 + TABLE) / 2, z);
  // nguồn điện + 2 cọc nối
  const supply = add(root, new THREE.BoxGeometry(0.2, 0.12, 0.2), mat(0x3e5666, {metalness: 0.3}), SX, TABLE + 0.06, 0);
  const tP = add(root, new THREE.CylinderGeometry(0.014, 0.014, 0.03, 14), mat(COL.N, {metalness: 0.5}), SX, TABLE + 0.135, 0.05, false), tM = add(root, new THREE.CylinderGeometry(0.014, 0.014, 0.03, 14), mat(COL.ink, {metalness: 0.5}), SX, TABLE + 0.135, -0.05, false);
  const leadM = mat(0x2a2f36, {metalness: 0.1, roughness: 0.7}), leadR = mat(COL.N, {metalness: 0.1, roughness: 0.7}), cuM = gmat(COL.cu, {metalness: 0.85, roughness: 0.3});
  const dirM = flat(0x2c9a4b);
  // ===== dây thẳng đứng =====
  const wireG = new THREE.Group(); root.add(wireG); const yTop = YS + WIRE.d2, yBot = YS - WIRE.d1;
  add(wireG, new THREE.CylinderGeometry(0.004, 0.004, yTop - TABLE - 0.02, 12), cuM, 0, (yTop + TABLE + 0.02) / 2, 0);
  add(wireG, new THREE.BoxGeometry(0.07, 0.02, 0.07), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.01, 0); add(wireG, new THREE.SphereGeometry(0.008, 12, 10), mat(COL.steel), 0, yTop, 0);
  wireG.add(tube([[0, TABLE + 0.02, 0], [0.1, TABLE + 0.012, 0.03], [0.5, TABLE + 0.01, 0.05], [SX, TABLE + 0.01, 0.05], [SX, TABLE + 0.135, 0.05]], 0.0035, leadR));
  wireG.add(tube([[0, yTop, 0], [0.25, yTop + 0.05, -0.05], [0.65, yTop - 0.15, -0.05], [SX + 0.0, TABLE + 0.3, -0.05], [SX, TABLE + 0.135, -0.05]], 0.0035, leadM));
  const wireDirs = []; for (const y of [YS - 0.14, YS + 0.2, YS + 0.45]) { const c = cone(dirM, 0.04, 0.011); c.position.set(0, y, 0); wireG.add(c); wireDirs.push(c); }
  // ===== khung dây tròn (trục x) =====
  const loopG = new THREE.Group(); root.add(loopG); let loopKey = '';
  function buildLoop(R, N) {
    loopG.clear(); const g = 0.09, arc = []; for (let k = 0; k <= 60; k++) { const t = Math.PI + g + (k / 60) * (2 * Math.PI - 2 * g); arc.push(t); }
    for (let n = 0; n < N; n++) { const x = (n - (N - 1) / 2) * 0.008; const P = arc.map((t) => [x, YS + R * Math.cos(t), R * Math.sin(t)]); loopG.add(tube(P, 0.0035, cuM, 120));
      const yb = YS - R * Math.cos(g), zb = R * Math.sin(g); for (const sg of [-1, 1]) loopG.add(tube([[x, yb, sg * zb], [x, TABLE + 0.04, sg * zb], [x, TABLE + 0.012, sg * 0.03]], 0.0035, sg > 0 ? leadM : leadR)); }
    add(loopG, new THREE.BoxGeometry(0.07, 0.02, 0.09), mat(COL.dark, {metalness: 0.4}), 0, TABLE + 0.01, 0);
    loopG.add(tube([[0, TABLE + 0.012, -0.03], [0.2, TABLE + 0.022, 0.0], [SX - 0.1, TABLE + 0.022, 0.05], [SX, TABLE + 0.022, 0.05], [SX, TABLE + 0.135, 0.05]], 0.0035, leadR)); loopG.add(tube([[0, TABLE + 0.012, 0.03], [0.2, TABLE + 0.008, 0.0], [SX - 0.1, TABLE + 0.008, -0.05], [SX, TABLE + 0.01, -0.05], [SX, TABLE + 0.135, -0.05]], 0.0035, leadM));
    const dirs = []; for (const t of [0, Math.PI / 2, (3 * Math.PI) / 2]) { const c = cone(dirM, 0.035, 0.011); c.userData.t = t; c.position.set(0, YS + R * Math.cos(t), R * Math.sin(t)); const tg = new THREE.Vector3(0, -Math.sin(t), Math.cos(t)); c.userData.tg = tg; c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg); loopG.add(c); dirs.push(c); } loopG.userData.dirs = dirs;
  }
  // ===== ống dây (trục x) =====
  const solG = new THREE.Group(); root.add(solG); let solKey = '';
  function buildSol(N) {
    solG.clear(); const {L, R} = SOL, P = []; const steps = Math.min(40 * N, 3200); for (let k = 0; k <= steps; k++) { const f = k / steps, t = Math.PI + 2 * Math.PI * N * f; P.push([-L / 2 + L * f, YS + R * Math.cos(t), R * Math.sin(t)]); }
    solG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.0), steps, N > 100 ? 0.0006 : 0.0012, 5), cuM));
    add(solG, new THREE.CylinderGeometry(R - 0.0016, R - 0.0016, L, 28).rotateZ(Math.PI / 2), gmat(0xb9cfd8, {metalness: 0.0, roughness: 0.2, opacity: 0.55}), 0, YS, 0, false);
    for (const sx of [-1, 1]) { add(solG, new THREE.CylinderGeometry(0.01, 0.01, YS - R - 0.011 - TABLE, 12), mat(COL.steel, {metalness: 0.8}), sx * 0.14, (YS - R - 0.011 + TABLE) / 2, 0); add(solG, new THREE.BoxGeometry(0.05, 0.012, 0.05), mat(COL.dark, {metalness: 0.4}), sx * 0.14, YS - R - 0.005, 0); }
    solG.add(tube([[-L / 2, YS - R, 0], [-L / 2 - 0.02, TABLE + 0.05, 0.01], [-L / 2 - 0.05, TABLE + 0.012, 0.05], [SX - 0.1, TABLE + 0.01, 0.05], [SX, TABLE + 0.01, 0.05], [SX, TABLE + 0.135, 0.05]], 0.0035, leadR, 80));
    solG.add(tube([[L / 2, YS - R, 0], [L / 2 + 0.02, TABLE + 0.05, -0.01], [L / 2 + 0.1, TABLE + 0.012, -0.05], [SX - 0.1, TABLE + 0.01, -0.05], [SX, TABLE + 0.01, -0.05], [SX, TABLE + 0.135, -0.05]], 0.0035, leadM, 80));
    const dirs = []; for (const f of [0.2, 0.5, 0.8]) { const tt = Math.PI + 2 * Math.PI * N * f; const c = cone(dirM, 0.03, 0.007); c.position.set(-L / 2 + L * f, YS + R * Math.cos(tt), R * Math.sin(tt)); const tg = new THREE.Vector3(L / (2 * Math.PI * N), -R * Math.sin(tt), R * Math.cos(tt)).normalize(); c.userData.tg = tg; c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg); solG.add(c); dirs.push(c); } solG.userData.dirs = dirs;
  }
  // ===== la bàn =====
  const comps = []; const baseM = gmat(0x41596a, {metalness: 0.3});
  for (const [x, z] of GRID) { const g = new THREE.Group(); g.position.set(x, YS + 0.003, z); root.add(g); add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.006, 24), baseM, 0, 0.003, 0, false); add(g, new THREE.CylinderGeometry(0.002, 0.002, 0.012, 8), mat(COL.steel), 0, 0.009, 0, false); const n = makeNeedle(); n.position.y = 0.013; g.add(n); comps.push({g, n}); }
  const pg = new THREE.Group(); root.add(pg); add(pg, new THREE.CylinderGeometry(0.045, 0.045, 0.008, 28), mat(COL.orange, {metalness: 0.3}), 0, 0.004, 0, false); add(pg, new THREE.CylinderGeometry(0.003, 0.003, 0.016, 8), mat(COL.steel), 0, 0.012, 0, false); const pn = makeNeedle(1.5); pn.position.y = 0.018; pg.add(pn);
  // ===== mạt sắt =====
  const NF = 56, fil = new THREE.InstancedMesh(new THREE.BoxGeometry(0.014, 0.0012, 0.0017), mat(0x2b2f36, {metalness: 0.7, roughness: 0.4}), NF * NF); fil.castShadow = false; root.add(fil);
  const fpos = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; for (let i = 0; i < NF; i++) for (let j = 0; j < NF; j++) fpos.push([(i - 27.5) * 0.0115 + (rnd() - 0.5) * 0.008, (j - 27.5) * 0.0115 + (rnd() - 0.5) * 0.008, rnd() * 6.283]);
  const dm = new THREE.Object3D();
  function updateFilings(s) { for (let k = 0; k < fpos.length; k++) { const [x, z, a0] = fpos[k], m = srcHoriz(s, x, z, 40), bm = Math.hypot(m[0], m[1]), w = Math.min(1, Math.max(0, (bm - 4e-6) / 1.2e-5)); let ang = Math.atan2(m[1], m[0]); const d = Math.atan2(Math.sin(ang - a0), Math.cos(ang - a0)); ang = a0 + d * w; dm.position.set(x, YS + 0.0036, z); dm.rotation.set(0, -ang, 0); dm.updateMatrix(); fil.setMatrixAt(k, dm.matrix); } fil.instanceMatrix.needsUpdate = true; }
  // ===== đường sức =====
  const linesG = new THREE.Group(); root.add(linesG); let lineKey = '', lineDirs = [];
  const lm = new THREE.MeshBasicMaterial({color: COL.line});
  function buildLines(s) {
    linesG.clear(); lineDirs = [];
    if (s.src === 'wire') { for (const r of [0.05, 0.09, 0.15, 0.23, 0.33, 0.45]) { const P = []; for (let k = 0; k <= 96; k++) { const a = (k / 96) * 2 * Math.PI; P.push([r * Math.cos(a), YS + 0.003, -r * Math.sin(a)]); } linesG.add(tube(P, 0.0022, lm, 192)); for (const a of [0.8, 2.4, 4.0, 5.5]) { const c = cone(lm, 0.022, 0.008); const pa = [r * Math.cos(a), YS + 0.003, -r * Math.sin(a)], tg = new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a)); c.position.set(...pa); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg); c.userData.tg = tg; linesG.add(c); lineDirs.push(c); } } return; }
    const s1 = {...s, I: 1}, fr = s.src === 'loop' ? [0.15, 0.4, 0.65, 0.85] : [0.25, 0.55, 0.85], Rs = s.src === 'loop' ? s.R : SOL.R;
    for (const f of fr) { const t = traceCoil(s1, Rs * f); const keep = t.pts.filter((_, k) => k % 3 === 0); if (keep.length < 4) continue;
      for (const sg of [1, -1]) { const P = keep.map((p) => [p[0], YS + 0.003, sg * p[1]]); linesG.add(tube(P, 0.0022, lm, Math.min(300, keep.length * 2))); const curve = new THREE.CatmullRomCurve3(P.map((p) => new THREE.Vector3(...p)), false, 'centripetal'); for (const q of [0.2, 0.45, 0.7, 0.9]) { const p = curve.getPointAt(q), tg = curve.getTangentAt(q); if (sg < 0) { /* đường phản xạ qua trục: chiều B giữ nguyên theo u */ } const c = cone(lm, 0.022, 0.008); c.position.copy(p); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg); c.userData.tg = tg.clone(); linesG.add(c); lineDirs.push(c); } } }
  }
  // bàn tay phải (quy tắc nắm tay phải), ẩn/hiện được
  const handG = new THREE.Group(); root.add(handG); let handKey = ''; let handObj = null;
  pts.hand = marker(handG, 0, 0.2, 0);
  function placeHand(s) {
    const key = `${s.src}|${s.R.toFixed(3)}`; if (key !== handKey) { handKey = key; if (handObj) { handG.remove(handObj); handObj.traverse((o) => { o.geometry?.dispose(); }); }
      const r0 = s.src === 'wire' ? 0.034 : s.src === 'loop' ? s.R * 0.78 : SOL.R + 0.014, o = {finger: s.src === 'wire' ? 0.0075 : s.src === 'loop' ? 0.011 : 0.0075, start: s.src === 'wire' ? -80 * D2R : -100 * D2R};
      handObj = createRightHand(r0, o); handG.add(handObj); pts.hand.position.copy(handObj.userData.tip); }
    const sgn = s.I >= 0 ? 1 : -1; handG.visible = !!s.hand && Math.abs(s.I) > 0.05;
    if (s.src === 'wire') { handG.position.set(0, YS + 0.07, 0); handG.rotation.set(sgn > 0 ? 0 : Math.PI, 0, 0); if (sgn < 0) handG.position.y = YS + 0.2; }
    else { handG.position.set(s.src === 'loop' ? 0 : -0.06, YS, 0); handG.rotation.set(0, sgn > 0 ? 0 : Math.PI, -Math.PI / 2); if (sgn < 0) handG.position.x = (s.src === 'loop' ? 0 : 0.06); handG.rotation.order = 'YXZ'; }
  }
  pts.src = marker(root, 0, YS + 0.05, 0); pts.wireTop = marker(root, 0, YS + WIRE.d2, 0); pts.supply = marker(root, SX, TABLE + 0.14, 0); pts.north = marker(root, -0.62, TABLE + 0.02, -0.5); pts.sheet = marker(root, 0.45, YS + 0.003, 0.5); pts.leg = marker(root, 0.5, (YS + TABLE) / 2, 0.5); pts.probe = marker(pg, 0, 0.03, 0); pts.lead = marker(root, 0.45, TABLE + 0.012, 0.05); pts.coil = marker(root, 0, YS + 0.06, 0);
  const dirty = {fil: true};
  function update(r, s, td, cs, probe) {
    const e = td * td * (3 - 2 * td); for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    wireG.visible = s.src === 'wire'; loopG.visible = s.src === 'loop'; solG.visible = s.src === 'sol';
    const sgn = s.I >= 0 ? 1 : -1; placeHand(s);
    if (s.src === 'loop') { const k = `${s.R.toFixed(3)}|${s.N}`; if (k !== loopKey) { buildLoop(s.R, Math.min(s.N, 6)); loopKey = k; } for (const c of loopG.userData.dirs) c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.userData.tg.clone().multiplyScalar(sgn)); }
    if (s.src === 'sol') { const k = `${s.N}`; if (k !== solKey) { buildSol(s.N); solKey = k; } for (const c of solG.userData.dirs) c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.userData.tg.clone().multiplyScalar(sgn)); }
    for (const c of wireDirs) { c.rotation.set(sgn > 0 ? 0 : Math.PI, 0, 0); c.visible = Math.abs(s.I) > 0.05; }
    const lk = s.src === 'wire' ? 'wire' : `${s.src}|${s.R.toFixed(3)}|${s.N}`; if (lk !== lineKey) { lineKey = lk; s.linesDirty = performance.now(); }
    if (s.linesDirty && performance.now() - s.linesDirty > 220 && lk === lineKey && s.mode === 'lines') { buildLines(s); s.linesDirty = 0; s.linesBuilt = lk; }
    if (s.mode === 'lines' && s.linesBuilt !== lk && !s.linesDirty) s.linesDirty = performance.now();
    for (const c of lineDirs) c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.userData.tg.clone().multiplyScalar(s.src === 'wire' ? sgn : sgn));
    linesG.visible = s.mode === 'lines' && s.linesBuilt === lk;
    const [px, pz] = probePos(s); const showC = s.mode !== 'filings';
    const near = (x, z) => { if (s.src === 'wire') return Math.hypot(x, z) < 0.06; if (s.src === 'loop') return Math.abs(x) < 0.05 && Math.abs(Math.abs(z) - s.R) < 0.055 || Math.hypot(x, z) < 0.05; return Math.abs(x) < 0.25 && Math.abs(z) < 0.06; };
    cs.forEach((c, i) => { const o = comps[i]; o.g.visible = showC && Math.hypot(c.x - px, c.z - pz) > 0.075 && !near(c.x, c.z); o.n.rotation.y = -c.psi; }); pg.position.set(px, YS + 0.003, pz); pg.scale.setScalar(s.src === 'sol' && s.r < 0.06 ? 0.45 : 1); pn.rotation.y = -probe.psi; pg.visible = true;
    fil.visible = s.mode === 'filings'; if (s.mode === 'filings' && (dirty.fil || s.fdirty)) { updateFilings(s); s.fdirty = false; dirty.fil = false; }
    root.updateMatrixWorld(true);
  }
  void supply; void tP; void tM;
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt, dirty};
}
