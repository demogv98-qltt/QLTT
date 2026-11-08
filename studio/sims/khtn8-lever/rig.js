// KHTN8-LV01 geometry. Real units (metres). rig.update(state, readout, td) poses every part from the physics state;
// td 0..1 is the teardown (0 = sealed, 1 = exploded / cut away). Nothing here is keyframed.
import * as THREE from 'three';

export const PIV = 1.2; // fulcrum O height
const BASE_TOP = 0.13;
const RP = 0.03; // pinion pitch radius
const NT = 16; // pinion teeth
const PITCH = (2 * Math.PI * RP) / NT;
export const COL = {
  ink: 0x17303d, orange: 0xe8590c, teal: 0x0b8f8c, brass: 0xc8963c, alu: 0xc2cbd2, steel: 0x7b8591,
  iron: 0x353a42, anoO: 0xc4501f, anoT: 0x137f86, housing: 0x2d6470, acrylic: 0xbfe3ea,
};
const D2R = Math.PI / 180;

const ghostMats = [];
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({color, metalness: 0.55, roughness: 0.5, envMapIntensity: 0.55, ...o});
const gmat = (color, o = {}) => {
  const m = mat(color, {transparent: true, ...o});
  m.userData.base = o.opacity ?? 1;
  ghostMats.push(m);
  return m;
};
const flat = (color, o = {}) => new THREE.MeshBasicMaterial({color, ...o});

function add(parent, geo, m, x = 0, y = 0, z = 0, shadow = true) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
const box = (p, w, h, d, m, x, y, z, s) => add(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
const cylZ = (p, r, len, m, x, y, z, seg = 40) => {
  const mesh = add(p, new THREE.CylinderGeometry(r, r, len, seg), m, x, y, z);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
};
/** Ghostable part: solid fades to 15 % in teardown and its edges come up as a wireframe. */
function edged(mesh) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0}));
  mesh.add(e);
  mesh.userData.edges = e;
  return mesh;
}
const marker = (parent, x = 0, y = 0, z = 0) => {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  parent.add(o);
  return o;
};

function gearGeo(N, rp, depth) {
  const step = (2 * Math.PI) / N;
  const rOut = rp * 1.13;
  const rRoot = rp * 0.85;
  const sh = new THREE.Shape();
  const P = (a, r) => [r * Math.cos(a), r * Math.sin(a)];
  for (let i = 0; i < N; i++) {
    const c = i * step;
    const pts = [P(c - 0.3 * step, rRoot), P(c - 0.14 * step, rOut), P(c + 0.14 * step, rOut), P(c + 0.3 * step, rRoot)];
    pts.forEach(([x, y], k) => (i === 0 && k === 0 ? sh.moveTo(x, y) : sh.lineTo(x, y)));
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, rp * 0.3, 0, Math.PI * 2, true);
  sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled: false, curveSegments: 6});
  g.translate(0, 0, -depth / 2);
  return g;
}
function sectorGeo(r0, r1, a0, a1, depth) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r1, a0, a1, false);
  s.absarc(0, 0, r0, a1, a0, true);
  const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: false, curveSegments: 24});
  g.translate(0, 0, -depth / 2);
  return g;
}
function ringGeo(r0, r1, depth) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r1, 0, Math.PI * 2, false);
  const h = new THREE.Path();
  h.absarc(0, 0, r0, 0, Math.PI * 2, true);
  s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: false, curveSegments: 40});
  g.translate(0, 0, -depth / 2);
  return g;
}

function scaleTexture() {
  const c = document.createElement('canvas');
  c.width = 4096;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#d5dbe0';
  g.fillRect(0, 0, c.width, c.height);
  const px = (m) => ((m + 1.1) / 2.2) * c.width;
  g.fillStyle = '#14303c';
  g.strokeStyle = '#14303c';
  g.font = '600 34px "JetBrains Mono", monospace';
  g.textAlign = 'center';
  for (let i = -10; i <= 10; i++) {
    const m = i / 10;
    const big = i % 5 === 0;
    g.lineWidth = big ? 4 : 2.5;
    g.beginPath();
    g.moveTo(px(m), 0);
    g.lineTo(px(m), big ? 46 : 30);
    g.stroke();
    if (i % 2 === 0) g.fillText(`${m > 0 ? '+' : m < 0 ? '−' : ''}${Math.abs(m).toFixed(1)}`, px(m), 84);
  }
  g.fillStyle = '#e8590c';
  g.beginPath();
  g.moveTo(px(0) - 12, 118);
  g.lineTo(px(0) + 12, 118);
  g.lineTo(px(0), 98);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeArrow(color) {
  const g = new THREE.Group();
  const m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 12), m);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.095, 18), m);
  g.add(shaft, head);
  g.userData.set = (len) => {
    const l = Math.max(0.001, len);
    const hl = Math.min(0.095, l * 0.5);
    shaft.scale.y = Math.max(0.001, l - hl);
    shaft.position.y = -(l - hl) / 2;
    head.scale.set(hl / 0.095, hl / 0.095, hl / 0.095);
    head.position.y = -(l - hl) - hl / 2;
    head.rotation.x = Math.PI; // apex down
    g.userData.tip.position.y = -l;
  };
  g.userData.tip = marker(g, 0, -0.1, 0);
  return g;
}

function makeBracket(color) {
  const g = new THREE.Group();
  const m = flat(color);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.006, 0.006), m);
  const t0 = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.05, 0.006), m);
  const t1 = t0.clone();
  g.add(bar, t0, t1);
  g.userData.mid = marker(g, 0, 0.05, 0);
  g.userData.set = (x0, x1) => {
    bar.scale.x = Math.max(0.001, Math.abs(x1 - x0));
    bar.position.x = (x0 + x1) / 2;
    t0.position.x = x0;
    t1.position.x = x1;
    g.userData.mid.position.x = (x0 + x1) / 2;
  };
  return g;
}

function makeArc(color, radius, sign) {
  const g = new THREE.Group();
  const m = flat(color, {side: THREE.DoubleSide});
  const holder = new THREE.Group();
  g.add(holder);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 16), m);
  holder.add(head);
  let arcMesh = null;
  let last = -1;
  const tip = marker(holder);
  g.userData.set = (sweep, phi0) => {
    const q = Math.round(sweep / (2 * D2R)) * 2 * D2R;
    if (q !== last) {
      last = q;
      if (arcMesh) {
        arcMesh.geometry.dispose();
        holder.remove(arcMesh);
      }
      arcMesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.0085, 8, Math.max(6, Math.round(q * 14)), q), m);
      holder.add(arcMesh);
      head.position.set(radius * Math.cos(q), radius * Math.sin(q), 0);
      head.rotation.z = q; // cone apex +y → tangent counter-clockwise
      tip.position.copy(head.position);
    }
    holder.rotation.z = phi0;
  };
  g.scale.x = sign; // -1 mirrors the counter-clockwise arc into a clockwise one
  g.userData.tip = tip;
  return g;
}

export function createRig(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const M = {
    iron: mat(COL.iron, {metalness: 0.35, roughness: 0.78}),
    alu: mat(COL.alu, {metalness: 0.8, roughness: 0.48}),
    steel: mat(COL.steel, {metalness: 0.85, roughness: 0.4}),
    dark: mat(0x252b33, {metalness: 0.5, roughness: 0.6}),
    brass: mat(COL.brass, {metalness: 0.9, roughness: 0.38}),
    housing: gmat(COL.housing, {metalness: 0.55, roughness: 0.5}),
    ano1: gmat(COL.anoO, {metalness: 0.6, roughness: 0.5}),
    ano2: gmat(COL.anoT, {metalness: 0.6, roughness: 0.5}),
    acrylic: gmat(COL.acrylic, {metalness: 0, roughness: 0.08, opacity: 0.3}),
    scale: new THREE.MeshStandardMaterial({map: scaleTexture(), metalness: 0.25, roughness: 0.55, envMapIntensity: 0.4}),
  };
  const pts = {};
  const ghostParts = {};

  // ------------------------------------------------ base, column, rail
  box(root, 2.5, 0.1, 0.9, M.iron, 0, 0.08, 0);
  for (const [fx, fz] of [[-1.1, -0.36], [1.1, -0.36], [-1.1, 0.36], [1.1, 0.36]]) {
    add(root, new THREE.CylinderGeometry(0.04, 0.05, 0.03, 20), M.dark, fx, 0.015, fz);
    add(root, new THREE.CylinderGeometry(0.022, 0.022, 0.02, 6), mat(COL.orange, {metalness: 0.3}), fx, 0.04, fz);
  }
  box(root, 2.2, 0.012, 0.05, M.steel, 0, BASE_TOP + 0.006, 0);
  box(root, 0.18, 0.5, 0.1, M.iron, 0, BASE_TOP + 0.25, -0.17);
  box(root, 0.36, 0.28, 0.035, M.iron, 0, PIV, -0.14);
  box(root, 0.24, 0.05, 0.12, M.iron, 0, BASE_TOP + 0.025, -0.16);

  // ------------------------------------------------ fulcrum housing (drum around O)
  const housing = new THREE.Group();
  housing.position.set(0, PIV, 0);
  root.add(housing);
  const upper = edged(add(housing, sectorGeo(0.108, 0.13, 55 * D2R, 125 * D2R, 0.17), M.housing));
  const lower = edged(add(housing, sectorGeo(0.108, 0.13, 235 * D2R, 305 * D2R, 0.17), M.housing));
  const win = edged(add(housing, new THREE.CylinderGeometry(0.135, 0.135, 0.01, 48), M.acrylic, 0, 0, 0.09));
  win.rotation.x = Math.PI / 2;
  const backCover = edged(add(housing, new THREE.CylinderGeometry(0.135, 0.135, 0.012, 48), M.housing, 0, 0, -0.095));
  backCover.rotation.x = Math.PI / 2;
  // bolts on the window rim
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const b = add(win, new THREE.CylinderGeometry(0.007, 0.007, 0.012, 6), M.steel, Math.cos(a) * 0.118, 0, Math.sin(a) * 0.118, false);
    b.rotation.x = 0;
  }
  Object.assign(ghostParts, {upper, lower, win, backCover});

  // axle and static inner race
  const axle = cylZ(housing, 0.022, 0.26, M.steel, 0, 0, -0.03);
  void axle;
  const innerRace = add(housing, ringGeo(0.022, 0.036, 0.05), M.steel);
  // everything below turns with the beam
  const beam = new THREE.Group();
  beam.position.set(0, PIV, 0);
  root.add(beam);
  const outerRace = add(beam, ringGeo(0.053, 0.078, 0.06), M.alu);
  const cage = new THREE.Group();
  housing.add(cage);
  const ballGeo = new THREE.SphereGeometry(0.0085, 14, 10);
  const balls = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    balls.push(add(cage, ballGeo, M.steel, Math.cos(a) * 0.0445, Math.sin(a) * 0.0445, 0, false));
  }
  add(cage, new THREE.TorusGeometry(0.0445, 0.0022, 6, 40), M.brass, 0, 0, 0.0075, false);
  void innerRace;
  void outerRace;

  // torsion load cell: static spokes + glowing strain-gauge ring, in front of the bearing
  const cell = new THREE.Group();
  cell.position.z = 0.062;
  housing.add(cell);
  add(cell, ringGeo(0.034, 0.062, 0.016), M.dark, 0, 0, 0, false);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const sp = box(cell, 0.03, 0.01, 0.01, M.steel, Math.cos(a) * 0.048, Math.sin(a) * 0.048, 0, false);
    sp.rotation.z = a;
  }
  const cellGlowMat = flat(0x0b8f8c, {transparent: true, opacity: 0.9});
  const cellGlow = add(cell, new THREE.TorusGeometry(0.062, 0.0045, 8, 48), cellGlowMat, 0, 0, 0.011, false);
  pts.bearing = marker(housing, 0.0445, 0.0445 * 0.2, 0.0);
  pts.cell = marker(housing, 0.0, -0.062, 0.075);

  // ------------------------------------------------ the graduated I-beam
  const L = 2.2;
  const web = box(beam, L, 0.064, 0.008, M.scale, 0, 0, 0);
  void web;
  box(beam, L, 0.012, 0.052, M.alu, 0, 0.038, 0);
  box(beam, L, 0.012, 0.052, M.alu, 0, -0.038, 0);
  for (let i = -5; i <= 5; i++) {
    if (Math.abs(i * 0.2 + 0.1) < 0.14) continue;
    box(beam, 0.008, 0.064, 0.018, M.alu, i * 0.2 + 0.1, 0, -0.013, false);
  }
  for (const s of [-1, 1]) {
    box(beam, 0.02, 0.09, 0.07, mat(COL.orange, {metalness: 0.3}), s * (L / 2 + 0.01), 0, 0);
  }
  box(beam, 0.14, 0.12, 0.012, M.alu, 0, 0, 0.034);
  box(beam, 0.14, 0.12, 0.012, M.alu, 0, 0, -0.034);
  // rack: instanced teeth on the top flange
  const nTeeth = Math.floor(L / PITCH);
  const rack = new THREE.InstancedMesh(new THREE.BoxGeometry(PITCH * 0.45, 0.009, 0.03), M.steel, nTeeth);
  const tm = new THREE.Matrix4();
  for (let i = 0; i < nTeeth; i++) rack.setMatrixAt(i, tm.makeTranslation(-L / 2 + (i + 0.5) * PITCH, 0.0485, 0));
  rack.castShadow = true;
  beam.add(rack);

  // ------------------------------------------------ sliding force carriages O1 (left) and O2 (right)
  const gearG = gearGeo(NT, RP, 0.03);
  function carriage(side, anoMat, glowColor) {
    const c = new THREE.Group(); // origin at the hook point, x = side·d
    beam.add(c);
    const body = new THREE.Group(); // clamp body, pushed outward when d is small so it clears the housing
    c.add(body);
    box(body, 0.072, 0.03, 0.098, anoMat, 0, 0.1, 0); // top bridge
    box(body, 0.072, 0.012, 0.098, anoMat, 0, -0.058, 0);
    const back = box(body, 0.072, 0.178, 0.012, anoMat, 0, 0.023, -0.043);
    const front = new THREE.Group();
    body.add(front);
    const plate = edged(box(front, 0.072, 0.178, 0.012, anoMat, 0, 0.023, 0.043));
    const lock = cylZ(front, 0.009, 0.03, M.dark, 0.0, 0.075, 0.062, 16);
    box(front, 0.02, 0.008, 0.008, mat(0xd62828, {metalness: 0.2}), 0, 0.075, 0.08, false);
    const pinion = new THREE.Mesh(gearG, M.alu);
    pinion.castShadow = true;
    pinion.position.set(0, 0.044 + RP, 0);
    body.add(pinion);
    cylZ(body, 0.006, 0.09, M.steel, 0, 0.044 + RP, 0, 12);
    const arm = box(c, 1, 0.022, 0.05, anoMat, 0, -0.07, 0); // outrigger from body back to the hook
    const hookBlock = new THREE.Group();
    c.add(hookBlock);
    box(hookBlock, 0.05, 0.05, 0.05, anoMat, 0, -0.1, 0);
    const hookCover = edged(box(hookBlock, 0.05, 0.05, 0.01, anoMat, 0, -0.1, 0.03));
    const pin = cylZ(hookBlock, 0.008, 0.07, M.steel, 0, -0.1, 0, 14);
    void pin;
    const gaugeMat = flat(glowColor, {transparent: true, opacity: 0.9});
    const gauge = cylZ(hookBlock, 0.0115, 0.014, gaugeMat, 0, -0.1, 0, 20);
    gauge.castShadow = false;
    const eye = add(hookBlock, new THREE.TorusGeometry(0.016, 0.004, 8, 20), M.steel, 0, -0.14, 0, false);
    void eye;
    return {c, body, front, plate, lock, pinion, arm, hookBlock, hookCover, gaugeMat, gauge, side, back,
      pPinion: marker(body, 0, 0.044 + RP, 0.05), pPin: marker(hookBlock, 0, -0.1, 0.045)};
  }
  const car1 = carriage(-1, M.ano1, COL.orange);
  const car2 = carriage(1, M.ano2, COL.teal);
  pts.pinion1 = car1.pPinion;
  pts.pinion2 = car2.pPinion;
  pts.pin1 = car1.pPin;
  pts.pin2 = car2.pPin;
  ghostParts.plate1 = car1.plate;
  ghostParts.plate2 = car2.plate;
  ghostParts.cover1 = car1.hookCover;
  ghostParts.cover2 = car2.hookCover;

  // ------------------------------------------------ effort module (spring-piston tension actuator) under O1
  const act = new THREE.Group();
  root.add(act);
  const sled = box(act, 0.16, 0.02, 0.1, M.dark, 0, BASE_TOP + 0.022, 0);
  void sled;
  box(act, 0.11, 0.24, 0.11, mat(COL.anoT, {metalness: 0.6}), 0, BASE_TOP + 0.152, 0);
  const rod = add(act, new THREE.CylinderGeometry(0.012, 0.012, 1, 14), M.steel);
  const headDisc = add(act, new THREE.CylinderGeometry(0.036, 0.036, 0.018, 24), mat(COL.orange, {metalness: 0.4}));
  const helix = [];
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * Math.PI * 2 * 9;
    helix.push(new THREE.Vector3(Math.cos(a) * 0.036, i / 160, Math.sin(a) * 0.036));
  }
  const spring = add(act, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 400, 0.0035, 6), M.steel, 0, 0, 0, false);
  const cable1 = add(root, new THREE.CylinderGeometry(0.0045, 0.0045, 1, 6), M.dark, 0, 0, 0, false);
  const piston = {top: BASE_TOP + 0.272};

  // ------------------------------------------------ load module (slotted brass weights) under O2
  const hanger = new THREE.Group();
  root.add(hanger);
  const rope = add(hanger, new THREE.CylinderGeometry(0.0045, 0.0045, 1, 6), M.dark, 0, 0, 0, false);
  const ROPE = 0.2;
  box(hanger, 0.15, 0.016, 0.03, M.steel, 0, -ROPE - 0.008, 0, false);
  add(hanger, new THREE.CylinderGeometry(0.008, 0.008, 0.2, 10), M.steel, 0, -ROPE - 0.1, 0, false);
  const discs = [];
  for (let i = 0; i < 10; i++) {
    const d = new THREE.Group();
    add(d, new THREE.CylinderGeometry(0.058, 0.058, 0.016, 32), M.brass);
    box(d, 0.07, 0.016, 0.012, M.dark, 0, 0, 0.056, false).scale.set(1, 1.002, 1);
    hanger.add(d);
    discs.push(d);
  }

  // ------------------------------------------------ physics overlay: vectors, brackets, torque arcs
  const ov = new THREE.Group();
  root.add(ov);
  const arrow1 = makeArrow(COL.orange);
  const arrow2 = makeArrow(COL.teal);
  ov.add(arrow1, arrow2);
  const br1 = makeBracket(COL.orange);
  const br2 = makeBracket(COL.teal);
  br1.position.set(0, 0.2, 0.09);
  br2.position.set(0, 0.2, 0.09);
  beam.add(br1, br2);
  const arc1 = makeArc(COL.orange, 0.2, 1);
  const arc2 = makeArc(COL.teal, 0.255, -1);
  arc1.position.set(0, PIV, 0.2);
  arc2.position.set(0, PIV, 0.2);
  ov.add(arc1, arc2);
  pts.F1 = arrow1.userData.tip;
  pts.F2 = arrow2.userData.tip;
  pts.d1 = br1.userData.mid;
  pts.d2 = br2.userData.mid;
  pts.tau1 = arc1.userData.tip;
  pts.tau2 = arc2.userData.tip;

  const tmp = new THREE.Vector3();
  const e3 = (x) => 1 - Math.pow(1 - x, 3);
  const edgeLines = [];
  for (const p of Object.values(ghostParts)) if (p.userData.edges) edgeLines.push(p.userData.edges);

  /** Pose everything. */
  function update(s, r, td, view = {}) {
    const th = s.theta;
    beam.rotation.z = th;
    cage.rotation.z = th / 2; // cage turns at half the race speed
    for (const b of balls) b.rotation.z = -th;
    housing.updateMatrixWorld(true);

    // the fade and the sliding of the teardown
    const e = td;
    const fade = 1 - 0.85 * e;
    for (const m of ghostMats) {
      m.opacity = m.userData.base * fade;
      m.depthWrite = e < 0.04 && m.userData.base >= 1;
    }
    for (const ln of edgeLines) ln.material.opacity = 0.55 * e;
    upper.position.y = 0.34 * e3(e);
    lower.position.y = -0.3 * e3(e);
    win.position.z = 0.09 + 0.8 * e3(e);
    backCover.position.z = -0.095 - 0.3 * e3(e);
    for (const c of [car1, car2]) {
      c.front.position.z = 0.34 * e3(e);
      c.hookCover.position.z = 0.03 + 0.3 * e3(e);
    }
    cellGlowMat.color.setRGB(0.05 + 0.87 * r.stress, 0.56 - 0.2 * r.stress, 0.55 - 0.43 * r.stress);
    cellGlow.scale.setScalar(1 + 0.04 * r.stress);

    // carriages
    for (const [c, d, F] of [[car1, s.d1, s.F1], [car2, s.d2, s.F2]]) {
      const shift = Math.max(0, 0.18 - d);
      c.c.position.set(c.side * d, 0, 0);
      c.body.position.x = c.side * shift;
      c.arm.scale.x = Math.max(0.0001, shift + 0.04);
      c.arm.position.x = (c.side * shift) / 2;
      c.pinion.rotation.z = -(c.side * (d + shift)) / RP;
      const g = 0.35 + 0.65 * (F / 100);
      c.gaugeMat.opacity = Math.min(1, g);
      c.gauge.scale.set(1 + 0.25 * (F / 100), 1, 1 + 0.25 * (F / 100));
    }

    // hook points in world space
    beam.updateMatrixWorld(true);
    const hook = (c) => c.hookBlock.localToWorld(tmp.set(0, -0.14, 0)).clone();
    const h1 = hook(car1);
    const h2 = hook(car2);

    // effort: actuator sled follows O1's hook; the spring stretches with F1
    const headY = BASE_TOP + 0.272 + 0.03 + 0.0013 * s.F1 * 1.0;
    act.position.x = h1.x;
    const bot = piston.top;
    const len = Math.max(0.02, headY - bot);
    spring.scale.y = len;
    spring.position.y = bot;
    rod.scale.y = len;
    rod.position.y = bot + len / 2;
    headDisc.position.y = headY;
    cable1.position.set(h1.x, (h1.y + headY) / 2, 0);
    cable1.scale.y = Math.max(0.01, h1.y - headY);

    // load: hanger and as many 10 N slotted weights as F2 asks for (the last one partial)
    hanger.position.copy(h2);
    rope.scale.y = ROPE;
    rope.position.y = -ROPE / 2;
    const n = r.F2 / 10;
    discs.forEach((d, i) => {
      const k = Math.min(1, Math.max(0, n - i));
      d.visible = k > 0.001;
      d.scale.y = Math.max(0.05, k);
      d.position.y = -ROPE - 0.02 - i * 0.0164 - 0.008 * k;
    });

    const vis = view.vectors ?? 1;
    // vectors: length is proportional to the force (7.5 mm per N)
    arrow1.position.set(h1.x, h1.y, 0.16);
    arrow1.userData.set(0.0075 * s.F1 * Math.min(1, vis * 1.5));
    arrow2.position.set(h2.x, h2.y, 0.16);
    arrow2.userData.set(0.0075 * s.F2 * Math.min(1, vis * 1.5));
    // lever-arm brackets (in beam frame, so they follow the beam)
    br1.userData.set(0, -s.d1);
    br2.userData.set(0, s.d2);
    // torque arcs: sweep grows with the moment
    arc1.userData.set((40 + 200 * Math.min(1, r.tau1 / 100)) * D2R, 100 * D2R);
    arc2.userData.set((40 + 200 * Math.min(1, r.tau2 / 100)) * D2R, 80 * D2R);
    ov.visible = vis > 0.01;
    br1.visible = br2.visible = vis > 0.01;
    arrow1.visible = r.F1 > 0.5;
    arc1.visible = r.tau1 > 0.5;
    ov.updateMatrixWorld(true);
    return {h1, h2};
  }

  const worldPt = (name, out = new THREE.Vector3()) => {
    pts[name].updateWorldMatrix(true, false);
    return pts[name].getWorldPosition(out);
  };
  return {root, beam, housing, update, worldPt, pts, ghostMats, parts: ghostParts, pivot: new THREE.Vector3(0, PIV, 0)};
}
