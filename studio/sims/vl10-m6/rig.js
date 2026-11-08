// VL10-M6 geometry: the test road, a fan cart (fan, motor, battery, force sensor, stackable 1 kg weights) and a pair of
// carts with a spring plunger. update(readout, model, td) poses everything from the physics state.
import * as THREE from 'three';
import {DT_C} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const box = (p, w, h, d, m, x, y, z, s) => add(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
const cylX = (p, r, len, m, x, y, z, seg = 28) => { const o = add(p, new THREE.CylinderGeometry(r, r, len, seg), m, x, y, z); o.rotation.z = Math.PI / 2; return o; };
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const roadTexture = () => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#434c56'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#e8e2c8'; g.fillRect(0, 60, 256, 8); g.fillStyle = '#c9d2d8'; g.fillRect(0, 0, 512, 5); g.fillRect(0, 123, 512, 5); const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(1600 / 12, 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
function makeArrow(color) {
  const g = new THREE.Group(), m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 10).rotateZ(-Math.PI / 2), m), head = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 14).rotateZ(-Math.PI / 2), m); g.add(shaft, head);
  g.userData.set = (len) => { const sg = len < 0 ? -1 : 1, l = Math.abs(len); g.visible = l > 0.02; const hl = Math.min(0.24, l * 0.5); shaft.scale.x = Math.max(0.001, l - hl); shaft.position.x = sg * (l - hl) / 2; head.scale.setScalar(hl / 0.24); head.position.x = sg * (l - hl / 2); head.rotation.y = sg < 0 ? Math.PI : 0; g.userData.tip.position.x = sg * l; };
  g.userData.tip = marker(g); return g;
}
function helix(turns, radius) { const pts = []; for (let i = 0; i <= turns * 14; i++) { const a = (i / 14) * Math.PI * 2; pts.push(new THREE.Vector3(i / (turns * 14), Math.cos(a) * radius, Math.sin(a) * radius)); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 18, 0.012, 6); }

/** a cart 1.1 m long: chassis, four wheels, a lift-off shell (ghost), a force sensor at each end. */
function makeCart(color, label) {
  const g = new THREE.Group(), shell = gmat(color, {metalness: 0.55, roughness: 0.4}), lower = mat(COL.dark, {metalness: 0.4, roughness: 0.7});
  box(g, 1.1, 0.08, 0.62, lower, 0, 0.22, 0);
  const body = new THREE.Group(); g.add(body);
  const hull = box(body, 1.04, 0.26, 0.58, shell, 0, 0.4, 0);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(hull.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); hull.add(edge);
  const wheels = [];
  for (const [x, z] of [[0.38, 0.34], [0.38, -0.34], [-0.38, 0.34], [-0.38, -0.34]]) { const w = new THREE.Group(); w.position.set(x, 0.15, z); g.add(w); const t = add(w, new THREE.CylinderGeometry(0.15, 0.15, 0.1, 28), mat(0x20252b, {metalness: 0.1, roughness: 0.9})); t.rotation.x = Math.PI / 2; add(w, new THREE.BoxGeometry(0.2, 0.025, 0.12), mat(0xc2cbd2), 0, 0, 0, false); add(w, new THREE.BoxGeometry(0.04, 0.04, 0.12), mat(0xe8590c), 0.1, 0, 0, false); wheels.push(w); }
  const sensors = [-1, 1].map((sg) => { const s = cylX(g, 0.05, 0.1, mat(0xdfe6ea, {metalness: 0.4}), sg * 0.5, 0.4, 0); cylX(g, 0.058, 0.02, flat(color), sg * 0.5, 0.4, 0); return s; });
  const pts = {front: marker(g, 0.56, 0.62, 0), rear: marker(g, -0.56, 0.62, 0), top: marker(g, 0, 0.9, 0)};
  return {g, body, hull, edge, wheels, sensors, pts, shellMat: shell, label};
}

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1600, 8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({map: roadTexture(), roughness: 0.9, metalness: 0}));
  road.position.set(500, 0.004, 0); road.receiveShadow = true; root.add(road);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.6, 0.14), mat(0xe8590c, {metalness: 0.2}), 321), m4 = new THREE.Matrix4();
  for (let i = 0; i < 321; i++) posts.setMatrixAt(i, m4.makeTranslation(-200 + i * 5, 0.3, -4.4)); posts.castShadow = true; root.add(posts);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 8).rotateX(-Math.PI / 2), flat(0xe8a070)); line.position.set(0, 0.012, 0); root.add(line);

  const A = makeCart(COL.teal, 'A'), B = makeCart(COL.orange, 'B'); root.add(A.g, B.g);
  // weights on cart A: up to 9 blocks of 1 kg
  const blockMat = mat(0x7b8591, {metalness: 0.85, roughness: 0.4}), blocks = [];
  for (let i = 0; i < 9; i++) { const b = box(A.g, 0.3, 0.2, 0.3, blockMat, 0, 0, 0); b.userData.edge = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), new THREE.LineBasicMaterial({color: 0x14303c})); b.add(b.userData.edge); blocks.push(b); }
  // fan assembly at the rear of cart A
  const fan = new THREE.Group(); fan.position.set(-0.55, 0.62, 0); A.g.add(fan);
  box(fan, 0.12, 0.34, 0.34, mat(0x2a3138), 0, 0, 0); cylX(fan, 0.09, 0.2, mat(COL.teal, {metalness: 0.6}), -0.14, 0, 0);
  const blades = new THREE.Group(); blades.position.x = -0.27; fan.add(blades);
  for (let k = 0; k < 5; k++) { const b = box(blades, 0.012, 0.3, 0.07, mat(0xdfe6ea, {metalness: 0.3}), 0, 0, 0, false); b.rotation.x = (k / 5) * Math.PI; }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 32).rotateY(Math.PI / 2), mat(COL.steel)); ring.position.x = -0.27; fan.add(ring);
  const streaks = []; const streakMat = flat(0x7fb7c9, {transparent: true, opacity: 0.5});
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.012), streakMat); root.add(s); streaks.push(s); }
  A.pts.fan = marker(fan, -0.14, 0.26, 0); A.pts.motor = marker(fan, -0.14, 0.14, 0.1);
  // pair mode: a spring plunger between the carts
  const plunger = new THREE.Group(); root.add(plunger);
  const spring = add(plunger, helix(10, 0.08), mat(COL.steel, {metalness: 0.9}), 0, 0, 0, false); const rodMat = mat(0xdfe6ea, {metalness: 0.5});
  const rod = cylX(plunger, 0.03, 1, rodMat, 0, 0, 0, 12);
  const arrA = makeArrow(COL.orange), arrB = makeArrow(COL.teal), arrF = makeArrow(COL.orange); root.add(arrA, arrB, arrF);
  const pts = {};

  const e3 = (x) => x * x * (3 - 2 * x);
  let bladeAng = 0;
  function update(r, s, td, t, dt = 0) {
    const e = e3(td), n2 = r.mode === 'N2';
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    A.edge.material.opacity = B.edge.material.opacity = 0.55 * e; A.body.position.y = B.body.position.y = 0.75 * e;
    B.g.visible = !n2; plunger.visible = !n2; fan.visible = n2; blocks.forEach((b) => (b.visible = false));
    for (const st of streaks) st.visible = false;
    arrA.visible = arrB.visible = arrF.visible = false;
    if (n2) {
      A.g.position.x = r.x; const ang = r.x / 0.15; A.wheels.forEach((w) => (w.rotation.z = -ang));
      const nb = Math.max(0, Math.min(9, Math.round(r.M) - 1));
      for (let i = 0; i < nb; i++) { const b = blocks[i], j = i % 6, layer = Math.floor(i / 6); b.visible = true; b.position.set(j % 2 ? 0.22 : -0.12, 0.68 + layer * 0.21, (Math.floor(j / 2) - 1) * 0.32); }
      if (r.F > 0.01) bladeAng += dt * (8 + 3.5 * r.F); blades.rotation.x = bladeAng;
      A.sensors.forEach((s) => (s.visible = false));
      // air streaming backwards, speed and number follow the thrust
      const n = Math.round(Math.min(10, r.F * 1.2)); for (let i = 0; i < n; i++) { const ph = ((t * 1.6 + i / n) % 1), st = streaks[i]; st.visible = true; st.position.set(r.x - 0.9 - ph * 2.6, 0.62 + Math.sin(i * 2.1) * 0.12, Math.cos(i * 1.7) * 0.16); st.material = streakMat; }
      arrF.position.set(r.x + 0.6, 1.25, 0); arrF.userData.set(0.22 * r.F); pts.F = arrF.userData.tip; pts.car = A.pts.top;
      A.g.updateMatrixWorld(true);
      return;
    }
    // pair mode
    A.g.position.x = r.x1; B.g.position.x = r.x2; A.sensors.forEach((x) => (x.visible = true));
    const angA = r.x1 / 0.15, angB = r.x2 / 0.15; A.wheels.forEach((w) => (w.rotation.z = -angA)); B.wheels.forEach((w) => (w.rotation.z = -angB));
    const gap = r.x2 - r.x1 - 1.1; plunger.visible = r.phase === 'contact' || r.phase === 'ready';
    const len = Math.max(0.05, gap); plunger.position.set(r.x1 + 0.55 + len / 2, 0.4, 0); spring.scale.x = len; spring.position.x = -len / 2; rod.scale.y = Math.max(0.01, len * 0.8); rod.position.x = 0;
    const k = 0.045 * r.F0; // arrow length ∝ the force
    if (r.phase === 'contact') {
      arrA.visible = arrB.visible = true; arrA.position.set(r.x1 + 0.56, 0.95, 0.0); arrA.userData.set(-k); arrB.position.set(r.x2 - 0.56, 0.95, 0.0); arrB.userData.set(k);
    }
    pts.A = A.pts.top; pts.B = B.pts.top; pts.fA = arrA.userData.tip; pts.fB = arrB.userData.tip; pts.sA = A.pts.front; pts.sB = B.pts.rear;
    A.g.updateMatrixWorld(true); B.g.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, A, B, fan, arrA, arrB, arrF, worldPt, partPts: {fan: A.pts.fan, motor: A.pts.motor, A: A.pts, B: B.pts}};
}
void DT_C;
