// VL10-M6 geometry: the test road, a fan cart (fan, motor, battery, force sensor, stackable 1 kg weights) and a pair of
// carts with a spring plunger. update(readout, model, td) poses everything from the physics state.
import * as THREE from 'three';
import {LEN} from './physics.js';

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
  const root = new THREE.Group(); scene.add(root); const pts = {};
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1600, 8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({map: roadTexture(), roughness: 0.9, metalness: 0}));
  road.position.set(500, 0.004, 0); road.receiveShadow = true; root.add(road);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.6, 0.14), mat(0xe8590c, {metalness: 0.2}), 321), m4 = new THREE.Matrix4();
  for (let i = 0; i < 321; i++) posts.setMatrixAt(i, m4.makeTranslation(-200 + i * 2.5, 0.3, -4.4)); posts.castShadow = true; root.add(posts);
  const A = makeCart(COL.teal, 'A'), B = makeCart(COL.orange, 'B'); root.add(A.g, B.g);
  // bumpers: a spring bumper on the front of cart A (faces +x) and a Velcro pad on the rear of cart B
  const bumpA = new THREE.Group(); A.g.add(bumpA); const sp = add(bumpA, helix(7, 0.045), mat(COL.steel, {metalness: 0.9}), 0.55, 0.4, 0, false), plate = box(bumpA, 0.03, 0.18, 0.3, mat(COL.steel), 0.6, 0.4, 0, false);
  const pad = box(B.g, 0.05, 0.2, 0.36, mat(0xe8590c, {roughness: 1, metalness: 0}), -0.56, 0.4, 0, false); const hook = box(A.g, 0.04, 0.2, 0.36, mat(0x14303c, {roughness: 1, metalness: 0}), 0.57, 0.4, 0, false);
  const arrP1 = makeArrow(COL.teal), arrP2 = makeArrow(COL.orange), arrP = makeArrow(COL.ink); root.add(arrP1, arrP2, arrP);
  pts.A = A.pts.top; pts.B = B.pts.top; pts.sA = A.pts.front; pts.sB = B.pts.rear; pts.bump = marker(A.g, 0.62, 0.62, 0); pts.pad = marker(B.g, -0.58, 0.62, 0); pts.mid = marker(root);
  const wl = (m) => 0.55 + 0.12 * Math.cbrt(m); // body scale
  const e3 = (x) => x * x * (3 - 2 * x), PS = 0.07;
  function update(r, s, td) {
    const e = e3(td);
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    A.edge.material.opacity = B.edge.material.opacity = 0.55 * e; A.body.position.y = B.body.position.y = 0.75 * e;
    A.g.position.x = r.x1; B.g.position.x = r.x2; A.g.scale.set(1, wl(s.m1) / 0.7, wl(s.m1) / 0.7); B.g.scale.set(1, wl(s.m2) / 0.7, wl(s.m2) / 0.7);
    A.wheels.forEach((w) => (w.rotation.z = -r.x1 / 0.15)); B.wheels.forEach((w) => (w.rotation.z = -r.x2 / 0.15));
    const stick = s.e === 0; bumpA.visible = !stick; hook.visible = stick; pad.visible = true; pad.material.color.setHex(stick ? 0xe8590c : 0x8a95a0); sp.scale.x = 1; A.sensors.forEach((x) => (x.visible = true));
    arrP1.position.set(r.x1, 1.15 + 0.2, 0.0); arrP1.userData.set(PS * r.p1); arrP2.position.set(r.x2, 1.15 + 0.2, 0.0); arrP2.userData.set(PS * r.p2); arrP.position.set((r.x1 + r.x2) / 2, 2.0, 0.0); arrP.userData.set(PS * r.p);
    pts.mid.position.set((r.x1 + r.x2) / 2, 2.0, 0); root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  void LEN;
  return {root, update, pts, A, B, worldPt};
}
