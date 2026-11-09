// S3 geometry, anatomical style: ventricles as lofted conical muscle masses, atria with auricles, great vessels cut like a specimen,
// fat in the grooves, coronary arteries traced on the surface, valves with leaflets. update(readout, model, td, dt) poses everything.
import * as THREE from 'three';

const COL = {red: 0xe63946, blue: 0x2b59c3, ink: 0x14303c};
export const HY = 1.15;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 5);
const clip = (m) => { m.clippingPlanes = [plane]; m.clipShadows = true; return m; };
const sm = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

/** deterministic smooth noise in [-1,1] */
const nz = (x, y, z, s) => Math.sin(4.1 * x + s) * Math.sin(3.3 * y + 1.7 * s) * 0.5 + Math.sin(5.2 * z + 0.6 * s) * Math.cos(3.7 * x - s) * 0.35 + 0.25 * Math.sin(9 * y + 3 * z + s);
/** muscle texture: mottled red-brown with fine fibres and a few fat speckles (used as colour map; bump uses the same canvas) */
function muscleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#b5433f'; g.fillRect(0, 0, 512, 512);
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 1400; i++) { const x = rnd() * 512, y = rnd() * 512, l = 20 + rnd() * 60, a = -Math.PI / 2 + (rnd() - 0.5) * 0.5; g.strokeStyle = `rgba(${rnd() < 0.5 ? '120,30,32' : '215,110,100'},${0.05 + rnd() * 0.1})`; g.lineWidth = 1 + rnd() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(232,200,120,${0.08 + rnd() * 0.14})`; g.beginPath(); g.arc(rnd() * 512, rnd() * 512, 3 + rnd() * 9, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function wallMaterial(color, tex) { return clip(new THREE.MeshPhysicalMaterial({color, map: tex, bumpMap: tex, bumpScale: 1.4, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35, metalness: 0, envMapIntensity: 0.6})); }

/** a conical muscle mass: ellipse cross-sections stacked along a slightly tilted axis, closed at the base with a dome and at the apex with a blunt tip */
function loft({B, A, ax, az, p = 1.7, q = 0.62, seed = 1, amp = 0.012, uSeg = 56, vSeg = 64, tilt = 0}) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= uSeg; i++) {
    const t = -0.1 + 1.1 * (i / uSeg); // -0.1 (dome) … 1.0 (apex)
    const prof = t < 0 ? Math.sqrt(Math.max(0, 1 - (t / 0.1) ** 2)) : Math.pow(Math.max(0, 1 - Math.pow(t, p)), q);
    const tt = Math.max(0, t), cx = B.x + (A.x - B.x) * tt, cy = B.y + (A.y - B.y) * tt + (t < 0 ? -t * 0.0 : 0), cz = B.z + (A.z - B.z) * tt;
    for (let j = 0; j <= vSeg; j++) {
      const ph = (j / vSeg) * Math.PI * 2, cs = Math.cos(ph), sn = Math.sin(ph), n = 1 + amp * nz(cs * 2, t * 3, sn * 2, seed) * 6;
      pos.push(cx + ax * prof * cs * n, cy + (t < 0 ? 0.1 * Math.sqrt(Math.max(0, 1 - prof * prof)) * 0.9 * (ax / 0.4) * 0 : 0) + (t < 0 ? 0.12 * Math.sqrt(1 - prof * prof) : 0), cz + az * prof * sn * n);
      uv.push(j / vSeg * 2, i / uSeg * 2);
    }
  }
  for (let i = 0; i < uSeg; i++) for (let j = 0; j < vSeg; j++) { const a = i * (vSeg + 1) + j, b = a + vSeg + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); void tilt; return g;
}
/** organic ellipsoid for the atria and auricles */
function ellip(seed, amp = 0.05, seg = 48) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)), p = g.attributes.position, n = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { n.fromBufferAttribute(p, i); const d = amp * nz(n.x, n.y, n.z, seed); p.setXYZ(i, n.x * (1 + d), n.y * (1 + d), n.z * (1 + d)); }
  g.computeVertexNormals(); return g;
}
const tube = (pts, r, seg = 60, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed, 'centripetal'), seg, r, 18, false);

export function createRig(scene) {
  const root = new THREE.Group(); root.position.y = HY; scene.add(root); const pts = {};
  // display stand: a round base and a short pillar under the apex, so the specimen does not hang in the air
  { const sm = new THREE.MeshStandardMaterial({color: 0x9fb0bc, roughness: 0.5, metalness: 0.2}); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.05, 40), sm); base.position.set(0.45, 0.025, 0.02); base.receiveShadow = true; scene.add(base); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.3, 20), sm); post.position.set(0.45, 0.2, 0.02); post.castShadow = true; scene.add(post); }
  // soft studio light for the specimen: a cool rim from behind-left and a warm fill from the right
  const rim = new THREE.DirectionalLight(0xbfd8ff, 1.0); rim.position.set(-3, 2.5, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffe6d6, 0.55); fill.position.set(3.5, 0.5, 2.5); scene.add(fill);
  const tex = muscleTexture();
  // ------------------------------------------------------------------ chambers
  const chambers = {};
  const makeChamber = (id, wallGeo, cavityGeo, centroid, color, bloodCol, extra = []) => {
    const g = new THREE.Group(); g.position.copy(centroid); root.add(g); const c = centroid.clone().negate();
    const wallM = wallMaterial(color, tex), inM = clip(new THREE.MeshStandardMaterial({color: 0xe3a29a, side: THREE.BackSide, roughness: 0.75})), bloodM = clip(new THREE.MeshStandardMaterial({color: bloodCol, roughness: 0.22, side: THREE.DoubleSide, emissive: bloodCol, emissiveIntensity: 0.16}));
    const outer = new THREE.Mesh(wallGeo, wallM), inner = new THREE.Mesh(wallGeo, inM), blood = new THREE.Mesh(cavityGeo, bloodM);
    for (const o of [outer, inner, blood]) o.position.copy(c); outer.castShadow = true; g.add(outer, inner, blood);
    for (const [geo, p, s, rot] of extra) { const m = new THREE.Mesh(geo, wallM); m.position.copy(p.clone().add(c)); m.scale.set(...s); if (rot) m.rotation.set(...rot); m.castShadow = true; g.add(m); }
    chambers[id] = {g, outer, wallM, bloodM, blood, c0: centroid.clone()}; return chambers[id];
  };
  // ventricles
  const lvB = V(0.20, 0.30, -0.06), lvA = V(0.54, -1.12, 0.02), rvB = V(-0.26, 0.26, 0.17), rvA = V(0.22, -0.98, 0.16);
  const lvW = loft({B: lvB, A: lvA, ax: 0.42, az: 0.36, seed: 3}), lvC = loft({B: lvB.clone().add(V(0, -0.04, 0)), A: lvA.clone().add(V(-0.04, 0.2, 0)), ax: 0.31, az: 0.26, seed: 4, amp: 0, p: 1.5});
  const rvW = loft({B: rvB, A: rvA, ax: 0.38, az: 0.25, seed: 9, p: 1.45, q: 0.7}), rvC = loft({B: rvB.clone().add(V(0, -0.04, 0)), A: rvA.clone().add(V(-0.03, 0.22, 0)), ax: 0.29, az: 0.17, seed: 5, amp: 0, p: 1.4});
  makeChamber('LV', lvW, lvC, V(0.36, -0.40, -0.03), 0xffffff, COL.red); makeChamber('RV', rvW, rvC, V(-0.08, -0.30, 0.15), 0xffffff, COL.blue);
  // atria with auricles (ears)
  const raG = ellip(2, 0.05), laG = ellip(6, 0.05), raC = new THREE.SphereGeometry(0.82, 30, 22), laC = new THREE.SphereGeometry(0.82, 30, 22);
  const raP = V(-0.54, 0.38, 0.0), laP = V(0.22, 0.46, -0.22), raWall = raG.clone().scale(0.27, 0.31, 0.26).translate(raP.x, raP.y, raP.z), laWall = laG.clone().scale(0.34, 0.2, 0.22).translate(laP.x, laP.y, laP.z);
  makeChamber('RA', raWall, raC.clone().scale(0.27, 0.31, 0.26).translate(raP.x, raP.y, raP.z), raP, 0xffffff, COL.blue, [[ellip(8, 0.05), V(-0.26, 0.64, 0.20), [0.2, 0.13, 0.11], [0.2, 0.3, -0.5]]]);
  makeChamber('LA', laWall, laC.clone().scale(0.34, 0.2, 0.22).translate(laP.x, laP.y, laP.z), laP, 0xffffff, COL.red, [[ellip(10, 0.05), V(0.58, 0.52, 0.0), [0.15, 0.17, 0.1], [0, 0.3, 0.5]]]);
  const tint = {LV: 0xffffff, RV: 0xf2d9d4, RA: 0xf4d2c8, LA: 0xf4d2c8}; for (const k of Object.keys(tint)) chambers[k].wallM.color.setHex(tint[k]);
  // ------------------------------------------------------------------ great vessels (stubs ending in a clean cut)
  const arteryM = clip(new THREE.MeshPhysicalMaterial({color: 0xd9786d, roughness: 0.5, clearcoat: 0.3, side: THREE.DoubleSide, bumpMap: tex, bumpScale: 0.6}));
  const pulM = clip(new THREE.MeshPhysicalMaterial({color: 0x6b82c8, roughness: 0.5, clearcoat: 0.3, side: THREE.DoubleSide, bumpMap: tex, bumpScale: 0.6})), veinM = pulM, pvM = arteryM;
  const mk = (geo, m, rim = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; root.add(o); void rim; return o; };
  const aortaPts = [V(0.14, 0.30, -0.05), V(0.14, 0.62, -0.05), V(0.13, 0.9, -0.07), V(0.22, 1.12, -0.13), V(0.45, 1.05, -0.2), V(0.54, 0.80, -0.25), V(0.55, 0.50, -0.27)];
  mk(tube(aortaPts, 0.11, 80), arteryM);
  for (const [a, b, r] of [[V(0.12, 1.06, -0.08), V(0.10, 1.32, -0.06), 0.045], [V(0.22, 1.12, -0.13), V(0.26, 1.34, -0.11), 0.04], [V(0.34, 1.12, -0.18), V(0.44, 1.30, -0.17), 0.036]]) mk(tube([a, b], r, 8), arteryM);
  mk(tube([V(-0.10, 0.32, 0.17), V(-0.04, 0.6, 0.16), V(0.0, 0.82, 0.10)], 0.1, 24), pulM);
  mk(tube([V(0.0, 0.82, 0.10), V(0.30, 0.95, 0.02), V(0.62, 0.92, -0.06)], 0.07, 24), pulM); mk(tube([V(0.0, 0.82, 0.10), V(-0.3, 0.92, -0.01), V(-0.6, 0.9, -0.06)], 0.07, 24), pulM);
  mk(tube([V(-0.52, 1.22, -0.03), V(-0.52, 0.8, 0.0), V(-0.5, 0.52, 0.0)], 0.09, 24), veinM); mk(tube([V(-0.48, 0.14, 0.0), V(-0.47, -0.2, -0.03), V(-0.46, -0.42, -0.05)], 0.10, 16), veinM);
  for (const [a, b, r] of [[V(-0.3, 0.5, -0.30), V(-0.64, 0.5, -0.3), 0.05], [V(-0.28, 0.4, -0.33), V(-0.60, 0.26, -0.33), 0.045], [V(0.48, 0.5, -0.28), V(0.86, 0.54, -0.3), 0.05], [V(0.46, 0.4, -0.3), V(0.84, 0.32, -0.32), 0.045]]) mk(tube([a, b], r, 12), pvM);
  // ------------------------------------------------------------------ fat in the grooves and coronary arteries traced on the surface by ray casting
  root.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(), solid = [chambers.LV.outer, chambers.RV.outer, chambers.RA.outer, chambers.LA.outer];
  const onSurface = (xy, offset = 0.012) => { const out = []; for (const [x, y] of xy) { ray.set(new THREE.Vector3(x, y + HY, 3), new THREE.Vector3(0, 0, -1)); const h = ray.intersectObjects(solid, false)[0]; if (h) { const n = h.face.normal.clone().transformDirection(h.object.matrixWorld); out.push(h.point.clone().addScaledVector(n, offset)); } } return out; };
  const place = (parent, worldPts, r, mat) => { if (worldPts.length < 2) return; const loc = worldPts.map((p) => parent.worldToLocal(p.clone())); const m = new THREE.Mesh(tube(loc, r, 50), mat); m.castShadow = true; parent.add(m); return m; };
  const fatM = clip(new THREE.MeshStandardMaterial({color: 0xe7c76e, roughness: 0.7})), corM = clip(new THREE.MeshStandardMaterial({color: 0xd2262b, roughness: 0.35, emissive: 0x7a0a0e, emissiveIntensity: 0.35})), corV = clip(new THREE.MeshStandardMaterial({color: 0x4a62b8, roughness: 0.4}));
  const lad = [[0.10, 0.28], [0.13, 0.05], [0.17, -0.2], [0.23, -0.45], [0.31, -0.7], [0.4, -0.92]], rca = [[-0.04, 0.34], [-0.26, 0.28], [-0.5, 0.18], [-0.66, -0.02], [-0.7, -0.3], [-0.62, -0.55]], cx = [[0.34, 0.3], [0.56, 0.22], [0.72, 0.0], [0.78, -0.3], [0.74, -0.58]];
  place(chambers.LV.g, onSurface(lad, 0.02), 0.032, fatM); place(chambers.RV.g, onSurface(rca, 0.02), 0.03, fatM); place(chambers.LV.g, onSurface(cx, 0.02), 0.028, fatM);
  place(chambers.LV.g, onSurface(lad, 0.032), 0.012, corM); place(chambers.RV.g, onSurface(rca, 0.03), 0.012, corM); place(chambers.LV.g, onSurface(cx, 0.03), 0.011, corM);
  for (const k of [0.15, 0.3, 0.5, 0.7]) { const base = lad[Math.min(lad.length - 1, Math.round(k * 5))]; for (const sx of [-1, 1]) { const p = onSurface([[base[0] + sx * 0.02, base[1]], [base[0] + sx * 0.14, base[1] - 0.1], [base[0] + sx * 0.26, base[1] - 0.2]], 0.014); place(sx > 0 ? chambers.LV.g : chambers.RV.g, p, 0.006, corM); } }
  place(chambers.LV.g, onSurface([[0.62, -0.62], [0.5, -0.3], [0.3, 0.05], [0.22, 0.25]], 0.014), 0.011, corV);
  // ------------------------------------------------------------------ valves (leaflets hinge at the ring)
  const valves = {};
  const makeValve = (id, pos, R, n, dir, color) => {
    const g = new THREE.Group(); g.position.copy(pos); root.add(g); const leaf = [];
    g.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.014, 10, 32).rotateX(Math.PI / 2), clip(new THREE.MeshStandardMaterial({color: 0xe9e1cc, roughness: 0.5}))));
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, pv = new THREE.Object3D(); pv.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); pv.rotation.y = -a; g.add(pv);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 1.0, 2 * R * Math.sin(Math.PI / n) * 0.97).rotateX(-Math.PI / 2).translate(-R * 0.5, 0, 0), clip(new THREE.MeshStandardMaterial({color, side: THREE.DoubleSide, roughness: 0.4, emissive: 0x3a2a10, emissiveIntensity: 0.12}))); pv.add(m); leaf.push(pv); }
    valves[id] = {g, leaf, dir}; return g;
  };
  makeValve('tri', V(-0.36, 0.22, 0.08), 0.14, 3, 1, 0xf3e8c4); makeValve('mit', V(0.2, 0.22, -0.1), 0.13, 2, 1, 0xf3e8c4);
  makeValve('ao', V(0.14, 0.30, -0.05), 0.095, 3, -1, 0xf8f0e0); makeValve('pul', V(-0.10, 0.32, 0.17), 0.09, 3, -1, 0xf8f0e0);
  // ------------------------------------------------------------------ blood particles inside the heart and the vessel stubs
  const pathR = new THREE.CatmullRomCurve3([V(-0.52, 1.18, -0.03), V(-0.52, 0.7, 0), V(-0.54, 0.38, 0.0), V(-0.36, 0.22, 0.08), V(-0.10, -0.22, 0.15), V(-0.14, 0.18, 0.18), V(-0.10, 0.32, 0.17), V(-0.04, 0.6, 0.16), V(0.0, 0.82, 0.10), V(-0.3, 0.92, -0.01), V(-0.58, 0.9, -0.06)], false, 'centripetal');
  const pathL = new THREE.CatmullRomCurve3([V(-0.62, 0.44, -0.3), V(-0.3, 0.44, -0.3), V(0.22, 0.46, -0.22), V(0.2, 0.22, -0.1), V(0.34, -0.38, -0.02), V(0.22, 0.1, -0.05), V(0.14, 0.30, -0.05), V(0.13, 0.9, -0.07), V(0.22, 1.12, -0.13), V(0.45, 1.05, -0.2), V(0.55, 0.55, -0.27)], false, 'centripetal');
  const NP = 34, mkBlood = (col) => { const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 12, 10), new THREE.MeshBasicMaterial({color: col}), NP); m.frustumCulled = false; root.add(m); return m; };
  const bR = mkBlood(0x2f5fd0), bL = mkBlood(0xf0343f), uR = Array.from({length: NP}, (_, i) => i / NP), uL = Array.from({length: NP}, (_, i) => i / NP), tmp = new THREE.Object3D();
  const surf = (x, y) => { const p = onSurface([[x, y]], 0.0)[0] || V(x, y + HY, 0.3); return marker(root, p.x, p.y - HY, p.z); };
  pts.RV = surf(-0.3, -0.35); pts.LV = surf(0.5, -0.5); pts.RA = surf(-0.56, 0.42); pts.LA = surf(0.6, 0.5);
  pts.aorta = marker(root, 0.13, 0.9, -0.07); pts.pul = marker(root, -0.03, 0.62, 0.16); pts.svc = marker(root, -0.52, 1.0, -0.03); pts.ivc = marker(root, -0.47, -0.25, -0.03); pts.pv = marker(root, 0.72, 0.52, -0.3);
  pts.tri = marker(valves.tri.g, 0, 0, 0); pts.mit = marker(valves.mit.g, 0, 0, 0); pts.aov = marker(valves.ao.g, 0, 0, 0); pts.pulv = marker(valves.pul.g, 0, 0, 0); pts.septum = marker(root, 0.0, -0.4, 0.0); pts.coronary = surf(0.17, -0.2); pts.fat = marker(root, -0.55, 0.1, 0.3);
  const lv = chambers.LV, rv = chambers.RV, ra = chambers.RA, la = chambers.LA, vo = {tri: 1, mit: 1, ao: 0, pul: 0};
  const setV = (id, o) => { const v = valves[id]; for (const p of v.leaf) p.rotation.z = (v.dir > 0 ? 1 : -1) * o * 1.15; };
  function update(r, s, td, dt) {
    const e = td * td * (3 - 2 * td);
    plane.constant = 0.03 + (1 - e) * 4.0;
    const kv = (r.vol - 50) / 70, sv = 0.88 + 0.12 * kv, sa = 0.94 + 0.06 * r.atr;
    for (const c of [lv, rv]) { c.g.scale.setScalar(sv); c.blood.scale.setScalar(0.82 + 0.18 * kv); }
    for (const c of [la, ra]) { c.g.scale.setScalar(sa); c.blood.scale.setScalar(0.82 + 0.18 * r.atr); }
    const sys = r.ven; root.rotation.y = -0.05 * sys; root.position.y = HY + 0.02 * sys;
    const tgt = {tri: r.avOpen ? 1 : 0, mit: r.avOpen ? 1 : 0, ao: r.slOpen ? 1 : 0, pul: r.slOpen ? 1 : 0}, k = Math.min(1, dt / 0.045);
    for (const id of Object.keys(vo)) { vo[id] += (tgt[id] - vo[id]) * k; setV(id, vo[id]); }
    if (!s.paused && s.flow === 'on') { const pulse = r.ph.id === 'ventricular' ? Math.sin(Math.PI * r.ph.k) : 0.15, sp = (0.03 + 0.1 * pulse) * (r.hr / 75) * s.speed * dt; for (let i = 0; i < NP; i++) { uR[i] = (uR[i] + sp) % 1; uL[i] = (uL[i] + sp) % 1; } }
    bR.visible = bL.visible = s.flow === 'on' && td > 0.05;
    if (bR.visible) for (let i = 0; i < NP; i++) { pathR.getPointAt(uR[i], tmp.position); tmp.updateMatrix(); bR.setMatrixAt(i, tmp.matrix); pathL.getPointAt(uL[i], tmp.position); tmp.updateMatrix(); bL.setMatrixAt(i, tmp.matrix); }
    bR.instanceMatrix.needsUpdate = bL.instanceMatrix.needsUpdate = true;
    root.updateMatrixWorld(true);
  }
  void sm;
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt, plane, chambers};
}
