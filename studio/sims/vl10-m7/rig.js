// VL10-M7 geometry: a bench with a hinged plank, a protractor, a block (lifts off in teardown to show the surfaces),
// a spring scale at the top and the four force arrows. update(readout, model, td) poses everything.
import * as THREE from 'three';
import {D2R, MATERIALS} from './physics.js';

const COL = {orange: 0xe8590c, teal: 0x0b8f8c, purple: 0x5b3cc4, red: 0xc0392b, ink: 0x14303c, steel: 0x8a95a0};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const box = (p, w, h, d, m, x, y, z, s) => add(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function makeArrow(color) {
  const g = new THREE.Group(), m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 10).rotateZ(-Math.PI / 2), m), head = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.16, 14).rotateZ(-Math.PI / 2), m); g.add(shaft, head);
  g.userData.set = (len) => { const l = Math.abs(len), sg = len < 0 ? -1 : 1; g.visible = l > 0.015; const hl = Math.min(0.16, l * 0.5); shaft.scale.x = Math.max(0.001, l - hl); shaft.position.x = sg * (l - hl) / 2; head.scale.setScalar(hl / 0.16); head.position.x = sg * (l - hl / 2); head.rotation.y = sg < 0 ? Math.PI : 0; g.userData.tip.position.x = sg * l; };
  g.userData.tip = marker(g); return g;
}
function woodTexture(rough) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#d8b98a'; g.fillRect(0, 0, 1024, 128);
  for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(120,80,40,${0.08 + (i % 5) * 0.03})`; g.lineWidth = 1 + (i % 3); g.beginPath(); const y = (i / 70) * 128; g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 3); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function protractorTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d'); const cx = 20, cy = 492, R = 440;
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R + 40, -Math.PI / 3 - 0.06, 0.02); g.closePath(); g.fill();
  g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.font = '600 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let a = 0; a <= 60; a += 5) { const r = a * D2R, big = a % 10 === 0; g.lineWidth = big ? 3 : 1.6; g.beginPath(); g.moveTo(cx + Math.cos(r) * R, cy - Math.sin(r) * R); g.lineTo(cx + Math.cos(r) * (R - (big ? 34 : 20)), cy - Math.sin(r) * (R - (big ? 34 : 20))); g.stroke(); if (big) g.fillText(String(a), cx + Math.cos(r) * (R + 24), cy - Math.sin(r) * (R + 24)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function helix(turns, radius) { const pts = []; for (let i = 0; i <= turns * 14; i++) { const a = (i / 14) * Math.PI * 2; pts.push(new THREE.Vector3(i / (turns * 14), Math.cos(a) * radius, Math.sin(a) * radius)); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 18, 0.0035, 6); }

export const HINGE = new THREE.Vector3(-1.55, 0.42, 0);
export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root);
  // bench
  box(root, 3.9, 0.16, 1.1, mat(0x353a42, {metalness: 0.35, roughness: 0.8}), 0, 0.08, 0); box(root, 0.3, 0.34, 0.9, mat(0x2a3138), HINGE.x - 0.05, 0.3, 0);
  const strut = add(root, new THREE.CylinderGeometry(0.03, 0.03, 1, 12), mat(0xc2cbd2, {metalness: 0.8}), 0, 0, 0.0); add(root, new THREE.CylinderGeometry(0.06, 0.06, 0.1, 16).rotateX(Math.PI / 2), mat(COL.orange), HINGE.x, HINGE.y, 0.0);
  const proTex = protractorTexture(), pro = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({map: proTex, transparent: true, side: THREE.DoubleSide})); pro.position.set(HINGE.x + 0.47, HINGE.y + 0.47 - 0.01, 0.52); pro.scale.set(1.0, 1.0, 1); root.add(pro);
  // plank
  const plank = new THREE.Group(); plank.position.copy(HINGE); root.add(plank);
  const top = new THREE.MeshStandardMaterial({map: woodTexture(), roughness: 0.9, metalness: 0});
  const board = box(plank, 3.2, 0.07, 0.9, [mat(0xb8956a), mat(0xb8956a), top, mat(0x8a6a44), mat(0xb8956a), mat(0xb8956a)], 1.5, 0, 0);
  add(plank, new THREE.BoxGeometry(0.02, 0.012, 0.5).translate(0.7, 0.04, 0), mat(COL.orange), 0, 0, 0.0, false); // pointer on the plank, read against the protractor
  // end stops
  box(plank, 0.06, 0.14, 0.9, mat(0x2a3138), 0.0, 0.07, 0); box(plank, 0.06, 0.14, 0.9, mat(0x2a3138), 3.1, 0.07, 0);
  // the block: three pad materials
  const padMats = [mat(0xa0794a, {roughness: 0.9, metalness: 0.05}), mat(0x1c1c1c, {roughness: 1, metalness: 0}), mat(0x9fb3c0, {metalness: 0.9, roughness: 0.2})];
  const blockG = new THREE.Group(); plank.add(blockG);
  const bodyM = gmat(0x1f6d78, {metalness: 0.5, roughness: 0.45});
  const body = box(blockG, 0.5, 0.3, 0.5, bodyM, 0, 0.15, 0), pad = box(blockG, 0.5, 0.03, 0.5, padMats[0], 0, 0.015, 0);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); body.add(edge);
  add(blockG, new THREE.CylinderGeometry(0.02, 0.02, 0.08, 10), mat(COL.steel), 0.26, 0.2, 0, false).rotation.z = Math.PI / 2; // hook
  const pCenter = marker(blockG, 0, 0.15, 0.0), pBottom = marker(blockG, 0, 0, 0.0), pFront = marker(blockG, 0.3, 0.2, 0), pTop = marker(blockG, 0, 0.33, 0);
  // string and spring scale at the top of the plank
  const string = add(plank, new THREE.CylinderGeometry(0.006, 0.006, 1, 6).rotateZ(Math.PI / 2), mat(0x20252b), 0, 0.22, 0, false);
  const scale = new THREE.Group(); scale.position.set(3.0, 0.22, 0); plank.add(scale);
  const sBody = gmat(0xc4501f, {metalness: 0.5}); const tube = add(scale, new THREE.CylinderGeometry(0.035, 0.035, 0.32, 24).rotateZ(Math.PI / 2), sBody, 0.16, 0, 0);
  const tubeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(tube.geometry, 20), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); tube.add(tubeEdge);
  const spring = add(scale, helix(9, 0.02), mat(COL.steel, {metalness: 0.9}), 0, 0, 0, false), pointer = add(scale, new THREE.BoxGeometry(0.012, 0.06, 0.06), mat(COL.orange), 0, 0, 0, false), rodS = add(scale, new THREE.CylinderGeometry(0.006, 0.006, 1, 8).rotateZ(Math.PI / 2), mat(COL.steel), 0, 0, 0, false);
  const pScale = marker(scale, 0.18, 0.07, 0);
  // magnifier: the two surfaces seen up close (appears in teardown)
  const mag = new THREE.Group(); plank.add(mag);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.3, 40), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.0, side: THREE.DoubleSide})); mag.add(disc);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.29, 0.31, 48), flat(COL.ink, {transparent: true, opacity: 0, side: THREE.DoubleSide})); mag.add(ring);
  const mkLine = (c) => { const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(61 * 3), 3)); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({color: c, transparent: true, opacity: 0, linewidth: 3})); l.position.z = 0.001; mag.add(l); return l; };
  const lineLow = mkLine(0x8a6a44), lineHigh = mkLine(0x1f6d78);
  let lastAmp = -1;
  const setProfiles = (A) => { if (A === lastAmp) return; lastAmp = A; const lo = lineLow.geometry.attributes.position, hi = lineHigh.geometry.attributes.position;
    for (let i = 0; i <= 60; i++) { const x = -0.26 + (i / 60) * 0.52, ph = (i / 60) * 9, tri = Math.abs((ph % 1) * 2 - 1); lo.setXYZ(i, x, -0.02 - A * tri, 0); hi.setXYZ(i, x, 0.02 + A * (1 - tri) * 0.0 + A * (1 - Math.abs(((ph + 0.5) % 1) * 2 - 1)) - 0.0 + 0.012, 0); lo.needsUpdate = hi.needsUpdate = true; } };
  mag.position.set(0, 0.36, 0.62);
  // arrows: the weight P in the world frame, N / Fms / F in the plank frame
  const arrP = makeArrow(COL.red), arrN = makeArrow(COL.teal), arrF = makeArrow(COL.orange), arrPull = makeArrow(COL.purple);
  root.add(arrP); plank.add(arrN, arrF, arrPull);
  const pts = {P: arrP.userData.tip, N: arrN.userData.tip, Fms: arrF.userData.tip, T: arrPull.userData.tip, scale: pScale, block: pTop, mag, hinge: marker(root, HINGE.x, HINGE.y, 0.0), pro: marker(root, HINGE.x + 0.55, HINGE.y + 0.2, 0.55)};
  const e3 = (x) => x * x * (3 - 2 * x), VS = 0.011;

  function update(r, s, td) {
    const e = e3(td), a = s.alpha * D2R;
    plank.rotation.z = a;
    // strut from the plank top end down to the bench
    const topW = new THREE.Vector3(3.0 * Math.cos(a), 3.0 * Math.sin(a), 0).add(HINGE), foot = new THREE.Vector3(HINGE.x + 3.0 * Math.cos(a) + 0.0, 0.16, 0);
    const dir = topW.clone().sub(foot), len = dir.length(); strut.position.copy(foot).add(topW).multiplyScalar(0.5); strut.scale.y = Math.max(0.01, len); strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); strut.position.z = -0.4;
    // block
    const lift = 0.5 * e; blockG.position.set(r.s, 0.035 + lift, 0);
    pad.material = [padMats[0], padMats[1], padMats[2]][s.mat]; bodyM.opacity = 1 - 0.85 * e; bodyM.depthWrite = e < 0.04; edge.material.opacity = 0.55 * e;
    sBody.opacity = 1 - 0.85 * e; sBody.depthWrite = e < 0.04; tubeEdge.material.opacity = 0.55 * e;
    // string from the block's hook to the scale's hook, spring scale stretched by F
    const x0 = r.s + 0.3, ext = Math.min(0.12, (r.F / 100) * 0.12), xh = 2.93 - ext;
    string.position.set((x0 + xh) / 2, 0.22 + lift * 0, 0); string.scale.x = Math.max(0.001, xh - x0); string.visible = xh > x0 + 0.01;
    string.position.y = 0.22 + lift; scale.position.set(3.0, 0.22, 0);
    spring.scale.x = 0.2 + ext; spring.position.x = 0.0; pointer.position.x = 0.2 + ext * 0.5; rodS.scale.y = 0.1 + ext; rodS.position.x = -0.07 - ext / 2 + 0.0;
    // arrows (1 N = 1.1 cm)
    blockG.updateMatrixWorld(true);
    arrP.position.copy(pCenter.getWorldPosition(new THREE.Vector3())); arrP.position.z = 0.34; arrP.rotation.z = -Math.PI / 2; arrP.userData.set(VS * r.P);
    arrN.position.set(r.s, 0.07 + lift, 0.34); arrN.rotation.z = Math.PI / 2; arrN.userData.set(VS * r.N);
    arrF.position.set(r.s, 0.07 + lift, 0.34 + 0.12); arrF.rotation.z = 0; arrF.userData.set(VS * r.fr);
    arrPull.position.set(r.s, 0.28 + lift, 0.34); arrPull.rotation.z = 0; arrPull.userData.set(VS * r.F);
    // surfaces seen up close: roughness grows with μ
    const A = 0.012 + 0.05 * r.mat.mus; setProfiles(A); mag.position.set(r.s, 0.42, 0.62);
    const ov = Math.min(1, e * 1.6) * 0.95; disc.material.opacity = ov * 0.9; ring.material.opacity = ov; lineLow.material.opacity = lineHigh.material.opacity = ov; mag.visible = e > 0.02;
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  void MATERIALS; void board;
  return {root, plank, update, pts, worldPt};
}
