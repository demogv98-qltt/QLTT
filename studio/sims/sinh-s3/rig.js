// S3 geometry: a stylised but anatomically arranged heart (4 chambers with muscle walls, valves, great vessels, coronary arteries)
// plus blood particles that follow the real circulation. update(readout, model, td, dt) poses everything from the cardiac-cycle state.
import * as THREE from 'three';

const COL = {red: 0xe63946, blue: 0x2b59c3, ink: 0x14303c, teal: 0x0b8f8c, orange: 0xe8590c};
export const HY = 1.35; // heart centre height above the floor
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.05, roughness: 0.55, envMapIntensity: 0.5, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 5);
const cut = (m) => { m.clippingPlanes = [plane]; m.clipShadows = true; return m; };

/** organic ellipsoid: a sphere displaced by a smooth deterministic noise so that the walls look like muscle, not like a mathematical shape */
function organic(seed, amp = 0.03, seg = 56) {
  const g = new THREE.SphereGeometry(1, seg, seg * 0.75), p = g.attributes.position, n = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    n.fromBufferAttribute(p, i); const x = n.x, y = n.y, z = n.z;
    const d = amp * (Math.sin(4.1 * x + seed) * Math.sin(3.3 * y + 1.7 * seed) + Math.sin(5.2 * z + 0.6 * seed) * Math.cos(3.7 * x - seed) + 0.6 * Math.sin(9 * y + 3 * z + seed));
    p.setXYZ(i, x * (1 + d), y * (1 + d), z * (1 + d));
  }
  g.computeVertexNormals(); return g;
}
function tube(pts, r, closed = false, seg = 80) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed, 'centripetal'), seg, r, 20, false); }

export function createRig(scene) {
  const root = new THREE.Group(); root.position.y = HY; scene.add(root); const pts = {};
  // ---------------------------------------------------------------- chambers: wall (outer + inner face) and the blood in the cavity
  const chambers = {};
  const makeChamber = (id, c, r, tilt, wallCol, bloodCol, seed) => {
    const g = new THREE.Group(); g.position.set(...c); g.rotation.z = tilt; root.add(g);
    const geo = organic(seed), wallM = cut(mat(wallCol, {roughness: 0.5})), inM = cut(mat(0xe8a79f, {side: THREE.BackSide, roughness: 0.7})), bloodM = cut(mat(bloodCol, {roughness: 0.25, metalness: 0.0, side: THREE.DoubleSide, emissive: bloodCol, emissiveIntensity: 0.18}));
    const outer = new THREE.Mesh(geo, wallM), inner = new THREE.Mesh(geo, inM), blood = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 26), bloodM);
    outer.castShadow = true; g.add(outer, inner, blood); g.userData = {r, wallM, bloodM}; g.scale.set(...r); chambers[id] = {g, outer, inner, blood, r: new THREE.Vector3(...r), wallM, bloodM};
    return g;
  };
  makeChamber('RV', [-0.30, -0.22, 0.10], [0.34, 0.50, 0.31], 0.30, 0xa83a3a, COL.blue, 1);
  makeChamber('LV', [0.30, -0.24, -0.02], [0.38, 0.62, 0.38], 0.36, 0x9c2f33, COL.red, 7);
  makeChamber('RA', [-0.50, 0.24, 0.0], [0.27, 0.34, 0.27], 0, 0xb85a55, COL.blue, 3);
  makeChamber('LA', [0.28, 0.32, -0.12], [0.31, 0.22, 0.25], 0, 0xb85a55, COL.red, 5);
  // ---------------------------------------------------------------- great vessels (walls only, tubes with a lumen)
  const vesselM = (c) => cut(mat(c, {roughness: 0.45, side: THREE.DoubleSide, emissive: c, emissiveIntensity: 0.0}));
  const aoM = vesselM(0xd44a4a), pulM = vesselM(0x4a6fd0), venM = vesselM(0x4a6fd0), pvM = vesselM(0xd44a4a);
  const aortaPts = [V(0.10, 0.28, -0.01), V(0.10, 0.62, -0.02), V(0.08, 0.95, -0.04), V(0.20, 1.17, -0.14), V(0.46, 1.06, -0.25), V(0.56, 0.62, -0.30), V(0.56, 0.0, -0.35), V(0.56, -0.7, -0.35)];
  const mk = (geo, m) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; root.add(o); return o; };
  mk(tube(aortaPts, 0.115, false, 100), aoM);
  for (const [a, b, c] of [[V(0.10, 1.08, -0.04), V(0.1, 1.3, -0.02), 0.045], [V(0.20, 1.17, -0.14), V(0.25, 1.38, -0.12), 0.04], [V(0.30, 1.14, -0.19), V(0.42, 1.34, -0.2), 0.035]]) mk(tube([a, b], c, false, 8), aoM);
  const pulPts = [V(-0.10, 0.30, 0.15), V(-0.07, 0.56, 0.16), V(-0.10, 0.78, 0.10)];
  mk(tube(pulPts, 0.10, false, 30), pulM); mk(tube([V(-0.10, 0.78, 0.10), V(-0.55, 0.90, 0.02), V(-0.92, 0.78, -0.08)], 0.07, false, 30), pulM); mk(tube([V(-0.10, 0.78, 0.10), V(0.28, 0.88, 0.0), V(0.78, 0.80, -0.06)], 0.07, false, 30), pulM);
  mk(tube([V(-0.52, 1.28, -0.02), V(-0.52, 0.8, 0.0), V(-0.50, 0.42, 0.0)], 0.095, false, 30), venM); mk(tube([V(-0.50, 0.05, 0.0), V(-0.50, -0.5, -0.04), V(-0.50, -0.95, -0.06)], 0.105, false, 30), venM);
  for (const [a, b, c] of [[V(-0.20, 0.38, -0.28), V(-0.80, 0.36, -0.22), 0.055], [V(-0.15, 0.30, -0.30), V(-0.78, 0.18, -0.26), 0.05], [V(0.50, 0.38, -0.20), V(0.98, 0.42, -0.22), 0.055], [V(0.50, 0.28, -0.22), V(0.96, 0.26, -0.28), 0.05]]) mk(tube([a, b], c, false, 12), pvM);
  // coronary arteries along the surface (thin red tubes) — they stay on the beating wall because they are parented to the ventricles
  const coronM = mat(0xff5a4f, {roughness: 0.4, emissive: 0xff2d20, emissiveIntensity: 0.25});
  const coronary = (parent, p) => { const o = new THREE.Mesh(tube(p, 0.012, false, 40), coronM); o.castShadow = true; parent.add(o); return o; };
  coronary(chambers.LV.g, [V(-0.16, 1.08, 0.72), V(-0.30, 0.55, 0.92), V(-0.32, 0.0, 0.99), V(-0.18, -0.55, 0.88), V(0.0, -0.95, 0.30)].map((p) => p.multiply(V(1, 0.62 * 1.0, 0.38)).multiplyScalar(1.01)));
  coronary(chambers.LV.g, [V(0.28, 1.0, 0.8), V(0.72, 0.5, 0.78), V(0.9, 0.0, 0.5), V(0.78, -0.6, 0.44)].map((p) => p.multiply(V(0.5, 0.62, 0.38)).multiplyScalar(1.02)));
  coronary(chambers.RV.g, [V(0.2, 0.9, 0.8), V(-0.3, 0.45, 0.93), V(-0.5, 0.0, 0.86), V(-0.3, -0.6, 0.78)].map((p) => p.multiply(V(1, 0.5, 0.31)).multiplyScalar(1.015)));
  // ---------------------------------------------------------------- valves (leaflets hinge at the ring; open amount 0 closed … 1 open)
  const valves = {};
  const makeValve = (id, pos, R, n, openDir, color) => {
    const g = new THREE.Group(); g.position.set(...pos); root.add(g); const leaf = [];
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 28).rotateX(Math.PI / 2), cut(mat(0xd9d2c0, {roughness: 0.5}))); g.add(ring);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, pivot = new THREE.Object3D(); pivot.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); pivot.rotation.y = -a; g.add(pivot);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 1.02, 2 * R * Math.sin(Math.PI / n) * 0.97).rotateX(-Math.PI / 2).translate(-R * 0.51, 0, 0), cut(mat(color, {side: THREE.DoubleSide, roughness: 0.45, emissive: 0x442200, emissiveIntensity: 0.1}))); pivot.add(m); leaf.push(pivot);
    }
    valves[id] = {g, leaf, o: openDir < 0 ? 0 : 0, dir: openDir, R}; return g;
  };
  makeValve('tri', [-0.40, 0.11, 0.05], 0.13, 3, 1, 0xf0e2b8); makeValve('mit', [0.28, 0.10, -0.04], 0.12, 2, 1, 0xf0e2b8);
  makeValve('ao', [0.10, 0.27, -0.01], 0.10, 3, -1, 0xf6efe0); makeValve('pul', [-0.10, 0.31, 0.15], 0.095, 3, -1, 0xf6efe0);
  // ---------------------------------------------------------------- blood particles along the whole circulation (LV → body → RV → lungs → LV)
  const loopPts = [V(0.30, -0.28, -0.05), V(0.18, 0.05, -0.02), V(0.10, 0.28, -0.01), V(0.10, 0.62, -0.02), V(0.08, 0.95, -0.04), V(0.20, 1.17, -0.14), V(0.46, 1.06, -0.25), V(0.56, 0.62, -0.30), V(0.56, 0.0, -0.35), V(0.56, -0.7, -0.35),
    V(0.40, -1.15, -0.30), V(0.0, -1.28, -0.2), V(-0.40, -1.15, -0.1), V(-0.50, -0.7, -0.05), V(-0.50, -0.2, 0.0), V(-0.50, 0.24, 0.0), V(-0.40, 0.11, 0.05), V(-0.30, -0.2, 0.1), V(-0.14, 0.2, 0.15), V(-0.10, 0.31, 0.15),
    V(-0.07, 0.56, 0.16), V(-0.10, 0.78, 0.10), V(-0.55, 0.90, 0.02), V(-0.95, 0.72, -0.10), V(-0.80, 0.36, -0.22), V(-0.20, 0.38, -0.28), V(0.28, 0.32, -0.12), V(0.28, 0.10, -0.04)];
  const loop = new THREE.CatmullRomCurve3(loopPts, true, 'centripetal'), N = loopPts.length, LEN = loop.getLengths(400);
  const lerpS0 = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const arc = (i) => LEN[Math.round((i / N) * 400)] / LEN[400];
  const uBed1 = arc(11), uBed2 = arc(23), uPulV = arc(18), uAo = arc(2);
  // organs on the loop (decorative): the body's capillary bed and the lungs, plus a faint tube that shows the whole circuit coloured by oxygen content
  const organM = new THREE.MeshStandardMaterial({color: 0xe9b7ae, transparent: true, opacity: 0.55, roughness: 0.7}), lungM = new THREE.MeshStandardMaterial({color: 0xf0a8b0, transparent: true, opacity: 0.6, roughness: 0.8});
  const organs = new THREE.Group(); root.add(organs);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), organM); body.scale.set(0.75, 0.13, 0.26); body.position.set(0.0, -1.28, -0.2); organs.add(body);
  for (const [x, y, z, rx, ry, rz] of [[-1.05, 0.62, -0.12, 0.3, 0.46, 0.22], [1.12, 0.58, -0.16, 0.3, 0.46, 0.22]]) { const lung = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), lungM); lung.scale.set(rx, ry, rz); lung.position.set(x, y, z); organs.add(lung); }
  const circuit = new THREE.Mesh(new THREE.TubeGeometry(loop, 400, 0.024, 6, true), new THREE.MeshBasicMaterial({vertexColors: true, transparent: true, opacity: 0.8}));
  { const pos = circuit.geometry.attributes.position, col = new Float32Array(pos.count * 3), cl = new THREE.Color(), per = 7; for (let i = 0; i < pos.count; i++) { const u = Math.min(1, Math.floor(i / per) / 400); const b = lerpS0(uBed1 - 0.04, uBed1 + 0.04, u) - lerpS0(uBed2 - 0.04, uBed2 + 0.04, u); cl.setHex(COL.red).lerp(new THREE.Color(COL.blue), Math.max(0, Math.min(1, b))); col.set([cl.r, cl.g, cl.b], i * 3); } circuit.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  organs.add(circuit);
  const NP = 90, bloodMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.036, 12, 10), new THREE.MeshBasicMaterial({color: 0xffffff}), NP); bloodMesh.frustumCulled = false; root.add(bloodMesh);
  const up = Array.from({length: NP}, (_, i) => (i + 0.5) / NP), tmp = new THREE.Object3D(), c1 = new THREE.Color(COL.red).lerp(new THREE.Color(0xff8a8a), 0.2), c2 = new THREE.Color(COL.blue).lerp(new THREE.Color(0x8aa4ff), 0.2), cc = new THREE.Color();
  const wrap = (x) => x - Math.floor(x), lerpS = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const colorAt = (u) => { // red after the lungs (uBed2 … 1 … uBed1), blue after the body (uBed1 … uBed2), blending over the capillary beds
    const b = lerpS(uBed1 - 0.04, uBed1 + 0.04, u) - lerpS(uBed2 - 0.04, uBed2 + 0.04, u); return cc.copy(c1).lerp(c2, Math.max(0, Math.min(1, b))); };
  // legend markers for the labels
  pts.RV = marker(chambers.RV.g, -0.2, 0.0, 1.0); pts.LV = marker(chambers.LV.g, 0.3, -0.1, 1.0); pts.RA = marker(chambers.RA.g, -0.2, 0.2, 1.0); pts.LA = marker(chambers.LA.g, 0.5, 0.4, 0.9);
  pts.aorta = marker(root, 0.2, 1.17, -0.14); pts.pul = marker(root, -0.07, 0.62, 0.16); pts.svc = marker(root, -0.52, 1.0, -0.02); pts.ivc = marker(root, -0.5, -0.6, -0.04); pts.pv = marker(root, 0.85, 0.40, -0.22); pts.pvr = marker(root, -0.7, 0.37, -0.22);
  pts.tri = marker(valves.tri.g, 0, 0.02, 0); pts.mit = marker(valves.mit.g, 0, 0.02, 0); pts.aov = marker(valves.ao.g, 0, 0.02, 0); pts.pulv = marker(valves.pul.g, 0, 0.02, 0); pts.septum = marker(root, 0.0, -0.3, 0.0); pts.coronary = marker(chambers.LV.g, -0.2, 0.2, 1.0); pts.body = marker(root, 0.0, -1.28, -0.2); pts.lung = marker(root, -0.95, 0.72, -0.1);
  const lv = chambers.LV, rv = chambers.RV, ra = chambers.RA, la = chambers.LA, vo = {tri: 1, mit: 1, ao: 0, pul: 0};
  const setV = (id, o) => { const v = valves[id]; for (const p of v.leaf) p.rotation.z = (v.dir > 0 ? 1 : -1) * o * 1.15; };
  let pulseSm = 0;
  function update(r, s, td, dt) {
    const e = td * td * (3 - 2 * td); organs.visible = !!s.showCircuit;
    plane.constant = 0.03 + (1 - e) * 4.0;
    // chamber walls: ventricles contract (outer radius changes a little, the cavity changes a lot, so the wall visibly thickens)
    const kv = (r.vol - 50) / 70, sv = 0.84 + 0.16 * kv, sa = 0.93 + 0.07 * r.atr;
    for (const c of [lv, rv]) { c.g.scale.copy(c.r).multiplyScalar(sv); c.blood.scale.setScalar(0.66 + 0.22 * kv); }
    for (const c of [la, ra]) { c.g.scale.copy(c.r).multiplyScalar(sa); c.blood.scale.setScalar(0.6 + 0.28 * r.atr); }
    // the heart as a whole: a slight lift and twist during ventricular contraction, and a gentle thump of the great vessels
    const sys = r.ven; root.rotation.y = -0.06 * sys; root.position.y = HY + 0.022 * sys; root.scale.setScalar(1 + 0.008 * sys);
    pulseSm += ((r.pao - 80) / 40 - pulseSm) * Math.min(1, dt / 0.06);
    aoM.emissiveIntensity = 0.22 * pulseSm; pulM.emissiveIntensity = 0.16 * pulseSm; coronM.emissiveIntensity = 0.2 + 0.25 * pulseSm;
    for (const c of [lv, rv, la, ra]) c.wallM.opacity = 1;
    // valves follow the pressures: AV valves open while the ventricles fill, semilunar valves open only during ejection
    const tgt = {tri: r.avOpen ? 1 : 0, mit: r.avOpen ? 1 : 0, ao: r.slOpen ? 1 : 0, pul: r.slOpen ? 1 : 0}, k = Math.min(1, dt / 0.045);
    for (const id of Object.keys(vo)) { vo[id] += (tgt[id] - vo[id]) * k; setV(id, vo[id]); }
    // blood flow: pulsatile speed, frozen while the heart is paused
    if (!s.paused && s.flow === 'on') {
      const pulse = r.ph.id === 'ventricular' ? Math.sin(Math.PI * r.ph.k) : 0.15, speed = (0.035 + 0.12 * pulse) * (r.hr / 75) * s.speed;
      for (let i = 0; i < NP; i++) up[i] = wrap(up[i] + speed * dt);
    }
    bloodMesh.visible = s.flow === 'on';
    if (bloodMesh.visible) for (let i = 0; i < NP; i++) { const u = up[i]; loop.getPointAt(u, tmp.position); tmp.scale.setScalar(1); tmp.updateMatrix(); bloodMesh.setMatrixAt(i, tmp.matrix); bloodMesh.setColorAt(i, colorAt(u)); }
    bloodMesh.instanceMatrix.needsUpdate = true; if (bloodMesh.instanceColor) bloodMesh.instanceColor.needsUpdate = true;
    root.updateMatrixWorld(true);
    void uPulV; void uAo; void marker;
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt, plane};
}
