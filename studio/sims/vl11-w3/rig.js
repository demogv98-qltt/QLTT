// W3 geometry: a dipole transmitter, a receiver antenna with a lamp that you can rotate, and the wave drawn as arrows:
// E (red, vertical) and B (blue, horizontal and perpendicular), both perpendicular to the direction of travel (+x). NOT to scale.
import * as THREE from 'three';
import {Eat, lamVis} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, red: 0xd62839, blue: 0x2b59c3};
export const AY = 1.25, DX = 4.4; // axis height, receiver distance
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const NA = 40, X0 = 0.45, X1 = DX - 0.45;

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  // transmitter: box on a table-like base, mast with a dipole
  const tx = new THREE.Group(); root.add(tx); const tM = gmat(0x2d6470, {metalness: 0.55, roughness: 0.45}), tBox = add(tx, new THREE.BoxGeometry(0.5, 0.5, 0.4), tM, 0, 0.25 + 0.05, 0); const tEdge = new THREE.LineSegments(new THREE.EdgesGeometry(tBox.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); tBox.add(tEdge);
  add(tx, new THREE.BoxGeometry(0.7, 0.05, 0.55), mat(COL.dark, {metalness: 0.4}), 0, 0.025, 0);
  add(tx, new THREE.CylinderGeometry(0.014, 0.014, AY - 0.55 - 0.06, 12), mat(COL.steel, {metalness: 0.9}), 0, 0.55 + (AY - 0.61) / 2, 0); // mast from the box to the dipole centre
  const rodM = mat(0xdfe6ea, {metalness: 0.9, roughness: 0.25}); add(tx, new THREE.CylinderGeometry(0.012, 0.012, 0.52, 12), rodM, 0, AY + 0.3, 0); add(tx, new THREE.CylinderGeometry(0.012, 0.012, 0.52, 12), rodM, 0, AY - 0.3, 0); add(tx, new THREE.BoxGeometry(0.05, 0.08, 0.05), mat(COL.orange, {metalness: 0.2}), 0, AY, 0, false);
  const ch = [0, 1, 2, 3, 4, 5].map((i) => add(tx, new THREE.SphereGeometry(0.022, 12, 8), flat(0xffffff), 0, AY, 0.04, false)); // charges oscillating along the dipole
  tx.position.x = 0;
  // receiver: post, antenna (rotates around the x axis), lamp in the middle
  const rx = new THREE.Group(); rx.position.x = DX; root.add(rx); const rM = gmat(0x2d6470, {metalness: 0.55, roughness: 0.45}), rBox = add(rx, new THREE.BoxGeometry(0.5, 0.5, 0.4), rM, 0, 0.3, 0); const rEdge = new THREE.LineSegments(new THREE.EdgesGeometry(rBox.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); rBox.add(rEdge);
  add(rx, new THREE.BoxGeometry(0.7, 0.05, 0.55), mat(COL.dark, {metalness: 0.4}), 0, 0.025, 0); add(rx, new THREE.CylinderGeometry(0.014, 0.014, AY - 0.6, 12), mat(COL.steel, {metalness: 0.9}), 0, 0.55 + (AY - 0.6 - 0.05) / 2 + 0.0, 0);
  const ant = new THREE.Group(); ant.position.set(0, AY, 0); rx.add(ant); add(ant, new THREE.CylinderGeometry(0.012, 0.012, 0.48, 12), rodM, 0, 0.3, 0); add(ant, new THREE.CylinderGeometry(0.012, 0.012, 0.48, 12), rodM, 0, -0.3, 0);
  const bulb = add(ant, new THREE.SphereGeometry(0.06, 20, 14), new THREE.MeshStandardMaterial({color: 0xfff3b0, emissive: 0xffd34d, emissiveIntensity: 0, roughness: 0.2, transparent: true, opacity: 0.9}), 0, 0, 0, false); add(ant, new THREE.CylinderGeometry(0.02, 0.02, 0.08, 14), mat(COL.dark), 0, 0.0, 0.0, false).visible = false;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), new THREE.MeshBasicMaterial({color: 0xffd34d, transparent: true, opacity: 0, depthWrite: false})); ant.add(halo);
  // wave: translucent planes for the E-plane (x–y) and the B-plane (x–z), and the arrows
  const planeM = (c) => new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false});
  const pE = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, 1.1), planeM(COL.red)); pE.position.set((X0 + X1) / 2, AY, 0); root.add(pE); const pB = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, 1.1).rotateX(Math.PI / 2), planeM(COL.blue)); pB.position.set((X0 + X1) / 2, AY, 0); root.add(pB);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, X1 - X0 + 0.3, 8).rotateZ(Math.PI / 2), flat(0x14303c)); axis.position.set((X0 + X1) / 2, AY, 0); root.add(axis); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 12).rotateZ(-Math.PI / 2), flat(0x14303c)); tip.position.set(X1 + 0.2, AY, 0); root.add(tip);
  const mk = (geo, c) => { const m = new THREE.InstancedMesh(geo, flat(c), NA); m.frustumCulled = false; root.add(m); return m; };
  const eS = mk(new THREE.CylinderGeometry(0.014, 0.014, 1, 8), COL.red), eH = mk(new THREE.ConeGeometry(0.035, 0.09, 12), COL.red), bS = mk(new THREE.CylinderGeometry(0.014, 0.014, 1, 8).rotateX(Math.PI / 2), COL.blue), bH = mk(new THREE.ConeGeometry(0.035, 0.09, 12).rotateX(Math.PI / 2), COL.blue);
  const d = new THREE.Object3D();
  pts.tx = marker(tx, 0, AY + 0.62, 0); pts.rx = marker(rx, 0, AY + 0.55, 0); pts.lamp = marker(ant, 0.0, 0, 0); pts.E = marker(root, 0, 0, 0); pts.B = marker(root, 0, 0, 0); pts.dir = marker(root, X1 + 0.15, AY, 0); pts.txBox = marker(tx, 0.28, 0.3, 0.2); pts.rxBox = marker(rx, -0.28, 0.3, 0.2); pts.dipole = marker(tx, 0.06, AY - 0.3, 0);
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td), lv = lamVis(s), V = 0.32;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.88 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    tEdge.material.opacity = rEdge.material.opacity = 0.55 * e;
    // charges slosh along the transmitter dipole in time with the field at the source
    const E0s = Eat(s, 0, r.t) / s.E0; ch.forEach((c, i) => { const y = AY + 0.28 * Math.sin((i / 6) * Math.PI * 2 + 0.6) * 0.0 + (((i + 0.5) / 6) * 0.9 - 0.45) + 0.0; c.position.y = Math.max(AY - 0.5, Math.min(AY + 0.5, y + 0.18 * E0s)); c.material.color.setHex(i % 2 ? 0xff7a7a : 0x7aa7ff); c.position.z = 0.045; });
    let k = 0, vE, vB;
    for (let i = 0; i < NA; i++) { const x = X0 + ((X1 - X0) * i) / (NA - 1), v = (Eat(s, x, r.t) / 10) * (V * 10 / 3), Y = AY;
      vE = v; vB = v * 0.8;
      d.rotation.set(0, 0, 0); d.scale.set(1, Math.max(1e-4, Math.abs(vE)), 1); d.position.set(x, Y + vE / 2, 0); d.updateMatrix(); eS.setMatrixAt(i, d.matrix);
      d.scale.set(1, 1, 1); d.rotation.set(0, 0, vE < 0 ? Math.PI : 0); d.position.set(x, Y + vE + (vE < 0 ? -0.045 : 0.045), 0); d.updateMatrix(); eH.setMatrixAt(i, d.matrix);
      d.rotation.set(0, 0, 0); d.scale.set(1, 1, Math.max(1e-4, Math.abs(vB))); d.position.set(x, Y, vB / 2); d.updateMatrix(); bS.setMatrixAt(i, d.matrix);
      d.scale.set(1, 1, 1); d.rotation.set(0, vB < 0 ? Math.PI : 0, 0); d.position.set(x, Y, vB + (vB < 0 ? -0.045 : 0.045)); d.updateMatrix(); bH.setMatrixAt(i, d.matrix); k++; }
    for (const m of [eS, eH, bS, bH]) m.instanceMatrix.needsUpdate = true;
    // receiver: the antenna turns about the x axis; the lamp glows with cos²θ of the field that reaches it
    ant.rotation.x = (s.theta * Math.PI) / 180; const field = Math.abs(Math.sin(2 * Math.PI * (DX / lv - 0.35 * r.t))) , glow = r.lamp * (0.35 + 0.65 * field) * (s.E0 / 10 * 0.6 + 0.4); bulb.material.emissiveIntensity = glow * 2.4; bulb.material.opacity = 0.55 + 0.4 * r.lamp; halo.material.opacity = 0.45 * glow;
    { let xc = lv * (0.25 + 0.35 * r.t); xc = ((xc % lv) + lv) % lv; while (xc < 1.5) xc += lv; if (xc > X1 - 0.2) xc -= lv; const len = s.E0 * 0.107; pts.E.position.set(xc, AY + len + 0.06, 0); pts.B.position.set(xc, AY, len * 0.8 + 0.06); }
    root.updateMatrixWorld(true); void k;
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
