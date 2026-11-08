// VL10-M2 geometry: a test road with distance posts, a car that opens up (motor, battery, encoder disc on the rear
// axle), strobe copies of the car every second, and the v and a arrows. update(readout, model, td) poses everything.
import * as THREE from 'three';
import {SLOTS, T_MAX, WHEEL_R, dAt} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, body: 0x1f6d78};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const box = (p, w, h, d, m, x, y, z, s) => add(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
const cylZ = (p, r, len, m, x, y, z, seg = 32) => { const o = add(p, new THREE.CylinderGeometry(r, r, len, seg), m, x, y, z); o.rotation.x = Math.PI / 2; return o; };
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const roadTexture = () => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#434c56'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#e8e2c8'; g.fillRect(0, 60, 256, 8);
  g.fillStyle = '#c9d2d8'; g.fillRect(0, 0, 512, 5); g.fillRect(0, 123, 512, 5);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(1600 / 12, 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const signTexture = (txt) => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#14303c'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#fff'; g.font = '800 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 52);
  g.font = '600 34px sans-serif'; g.fillText('m', 128, 104);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
function makeArrow(color) {
  const g = new THREE.Group(), m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10).rotateZ(-Math.PI / 2), m);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 14).rotateZ(-Math.PI / 2), m); g.add(shaft, head);
  g.userData.set = (len) => { const sg = len < 0 ? -1 : 1, l = Math.abs(len); g.visible = l > 0.02; const hl = Math.min(0.34, l * 0.5);
    shaft.scale.x = Math.max(0.001, l - hl); shaft.position.x = sg * (l - hl) / 2; head.scale.setScalar(hl / 0.34); head.position.x = sg * (l - hl / 2); head.rotation.y = sg < 0 ? Math.PI : 0; g.userData.tip.position.x = sg * l; };
  g.userData.tip = marker(g); return g;
}

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root);
  // road, kerbs, posts every 10 m, signs every 50 m
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1600, 8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({map: roadTexture(), roughness: 0.9, metalness: 0}));
  road.position.set(500, 0.004, 0); road.receiveShadow = true; root.add(road);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), mat(0xe8590c, {metalness: 0.2}), 161), m4 = new THREE.Matrix4();
  for (let i = 0; i < 161; i++) posts.setMatrixAt(i, m4.makeTranslation(-200 + i * 10, 0.35, -4.4)); posts.castShadow = true; root.add(posts);
  for (let x = -200; x <= 1400; x += 50) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({map: signTexture(String(x))})); s.position.set(x, 1.5, -4.6); root.add(s); add(root, new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), mat(0x667380), x, 0.75, -4.62, false); }
  // start line O
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 8).rotateX(-Math.PI / 2), flat(0xe8590c)); line.position.set(0, 0.012, 0); root.add(line);
  const ptO = marker(root, 0, 0.1, 4.4);

  // the car: faces +x, 2.3 m long
  const car = new THREE.Group(); root.add(car);
  const shell = gmat(COL.body, {metalness: 0.6, roughness: 0.4}), glass = gmat(0x9fd8df, {metalness: 0.1, roughness: 0.1, opacity: 0.55});
  const lower = mat(0x2a3138, {metalness: 0.4, roughness: 0.7});
  box(car, 2.2, 0.1, 0.9, lower, 0, 0.34, 0);
  const body = new THREE.Group(); car.add(body);
  const hull = box(body, 2.3, 0.45, 1.05, shell, 0, 0.62, 0), cab = box(body, 1.05, 0.32, 0.9, glass, -0.1, 1.0, 0);
  box(body, 0.14, 0.1, 0.9, mat(0xffe08a, {emissive: 0x6a5a20, emissiveIntensity: 0.6, metalness: 0}), 1.14, 0.7, 0, false);
  const edges = [hull, cab].map((m) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); m.add(e); return e; });
  // inside: battery, motor, gearbox
  box(car, 0.7, 0.22, 0.62, mat(0xe8590c, {metalness: 0.3}), -0.1, 0.51, 0);
  cylZ(car, 0.13, 0.42, mat(0x0b8f8c, {metalness: 0.6}), 0.45, 0.5, 0);
  cylZ(car, 0.05, 0.9, mat(COL.steel, {metalness: 0.9}), -0.8, 0.3, 0); // rear axle
  // wheels
  const wheels = [];
  for (const [x, z] of [[0.8, 0.6], [0.8, -0.6], [-0.8, 0.6], [-0.8, -0.6]]) {
    const w = new THREE.Group(); w.position.set(x, WHEEL_R, z); car.add(w);
    const tire = add(w, new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.18, 36), mat(0x20252b, {metalness: 0.1, roughness: 0.9})); tire.rotation.x = Math.PI / 2;
    const rim = add(w, new THREE.CylinderGeometry(0.2, 0.2, 0.2, 24), mat(0xc2cbd2, {metalness: 0.85, roughness: 0.4}), 0, 0, 0); rim.rotation.x = Math.PI / 2;
    for (let k = 0; k < 5; k++) { const sp = box(w, 0.36, 0.03, 0.22, mat(0x7b8591), 0, 0, 0, false); sp.rotation.z = (k / 5) * Math.PI; }
    add(w, new THREE.BoxGeometry(0.06, 0.06, 0.22), mat(0xe8590c, {metalness: 0.2}), 0.17, 0, 0, false); // a marked point on the rim: lets you see the turning
    wheels.push(w);
  }
  // encoder disc on the rear axle (rolls with the rear wheels) and its optical fork
  const enc = new THREE.Group(); enc.position.set(-0.8, WHEEL_R, 0.3); car.add(enc);
  add(enc, new THREE.CylinderGeometry(0.2, 0.2, 0.012, 48).rotateX(Math.PI / 2), mat(0xdfe6ea, {metalness: 0.2, roughness: 0.5}), 0, 0, 0, false);
  const slotGeo = new THREE.BoxGeometry(0.05, 0.03, 0.014), slots = new THREE.InstancedMesh(slotGeo, mat(0x14303c), SLOTS), mm = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < SLOTS; i++) { const a = (i / SLOTS) * Math.PI * 2; mm.compose(new THREE.Vector3(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0), q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a), new THREE.Vector3(1, 1, 1)); slots.setMatrixAt(i, mm); }
  enc.add(slots);
  const fork = new THREE.Group(); fork.position.set(-0.8, WHEEL_R + 0.16, 0.3); car.add(fork);
  box(fork, 0.07, 0.07, 0.05, mat(0x14303c), 0, 0, 0, false); box(fork, 0.07, 0.015, 0.015, flat(0xe8590c), 0, -0.04, 0.026, false);
  const ptEnc = marker(car, -0.8, WHEEL_R + 0.22, 0.32), ptMotor = marker(car, 0.45, 0.66, 0.2), ptBat = marker(car, -0.1, 0.66, 0.2);
  const ptCar = marker(car, 0, 1.6, 0);

  // strobe copies, one per second
  const strobeMat = flat(COL.teal, {transparent: true, opacity: 0.2}), strobe = [];
  for (let k = 0; k <= T_MAX; k++) { const g = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.78, 1.05), strobeMat); g.position.y = 0.55; g.visible = false; const e = new THREE.LineSegments(new THREE.EdgesGeometry(g.geometry), new THREE.LineBasicMaterial({color: COL.teal})); g.add(e); root.add(g); strobe.push(g); }
  // arrows
  const arrV = makeArrow(COL.teal), arrA = makeArrow(COL.orange); root.add(arrV, arrA);
  const pts = {O: ptO, enc: ptEnc, motor: ptMotor, bat: ptBat, car: ptCar, vTip: arrV.userData.tip, aTip: arrA.userData.tip};

  const e3 = (x) => x * x * (3 - 2 * x);
  function update(r, s, td, sc = 1) {
    const e = e3(td);
    car.position.x = r.d; car.scale.setScalar(sc);
    for (const w of wheels) w.rotation.z = -r.wheelAng; // rolling: the angle is the distance over the radius, the same d as everywhere
    enc.rotation.z = -r.wheelAng;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    for (const l of edges) l.material.opacity = 0.55 * e;
    body.position.y = 0.95 * e;
    for (let k = 0; k <= T_MAX; k++) { const on = k <= r.t + 1e-9 && k > 0; strobe[k].visible = on; strobe[k].scale.setScalar(sc); if (on) strobe[k].position.x = dAt(s, k); }
    strobe[0].visible = r.t > 0.001; strobe[0].position.x = dAt(s, 0); strobe[0].scale.setScalar(sc);
    arrV.position.set(r.d, 1.85 * sc, 0); arrV.userData.set(0.12 * r.v * sc); arrV.scale.setScalar(sc > 1 ? 1 : 1);
    arrA.position.set(r.d, 2.15 * sc, 0); arrA.userData.set(0.6 * r.a * sc);
    car.updateMatrixWorld(true); root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, car, update, pts, worldPt};
}
