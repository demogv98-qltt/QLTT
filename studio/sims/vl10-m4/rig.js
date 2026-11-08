// VL10-M4 geometry: a spring gun (barrel that opens up), a protractor, a long ruler on the ground, a target bucket,
// the ball with its trail, strobe copies every 0.1 s, optional predicted paths, and the velocity arrows.
import * as THREE from 'three';
import {D2R, SPRING, flight, pos} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const box = (p, w, h, d, m, x, y, z, s) => add(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function rulerTexture() {
  const c = document.createElement('canvas'); c.width = 4096; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#f4f1e6'; g.fillRect(0, 0, 4096, 64); g.fillStyle = g.strokeStyle = '#14303c'; g.font = '700 22px sans-serif'; g.textAlign = 'center';
  const X = (m) => ((m + 2) / 36) * 4096;
  for (let m = -2; m <= 34 + 1e-9; m += 0.5) { const big = Math.abs(m / 5 - Math.round(m / 5)) < 1e-6, one = Math.abs(m - Math.round(m)) < 1e-6; g.lineWidth = big ? 4 : one ? 2.5 : 1.4; g.beginPath(); g.moveTo(X(m), 0); g.lineTo(X(m), big ? 34 : one ? 24 : 14); g.stroke(); if (big || (one && Math.abs(m) % 2 < 1e-6 && m > -1)) g.fillText(String(Math.round(m)), X(m), 56); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function protractorTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const g = c.getContext('2d'), cx = 40, cy = 984, R = 900; g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R + 40, -Math.PI / 2, 0); g.closePath(); g.fill();
  g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.font = '600 38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let a = 0; a <= 90; a += 5) { const r = a * D2R, big = a % 10 === 0; g.lineWidth = big ? 4 : 2; g.beginPath(); g.moveTo(cx + Math.cos(r) * R, cy - Math.sin(r) * R); g.lineTo(cx + Math.cos(r) * (R - (big ? 50 : 28)), cy - Math.sin(r) * (R - (big ? 50 : 28))); g.stroke(); if (big) g.fillText(String(a), cx + Math.cos(r) * (R - 82), cy - Math.sin(r) * (R - 82)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function helix(turns, radius) { const pts = []; for (let i = 0; i <= turns * 14; i++) { const a = (i / 14) * Math.PI * 2; pts.push(new THREE.Vector3(i / (turns * 14), Math.cos(a) * radius, Math.sin(a) * radius)); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 18, 0.006, 6); }
function makeArrow(color) {
  const g = new THREE.Group(), m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 8).rotateZ(-Math.PI / 2), m), head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 12).rotateZ(-Math.PI / 2), m); g.add(shaft, head);
  g.userData.set = (len) => { const sg = len < 0 ? -1 : 1, l = Math.abs(len); g.visible = l > 0.02; const hl = Math.min(0.15, l * 0.5); shaft.scale.x = Math.max(0.001, l - hl); shaft.position.x = sg * (l - hl) / 2; head.scale.setScalar(hl / 0.15); head.position.x = sg * (l - hl / 2); head.rotation.y = sg < 0 ? Math.PI : 0; g.userData.tip.position.x = sg * l; };
  g.userData.tip = marker(g); return g;
}
const MAXPTS = 160;
function makeLine(color, dashed) {
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXPTS * 3), 3)); geo.setDrawRange(0, 0);
  const l = new THREE.Line(geo, dashed ? new THREE.LineDashedMaterial({color, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.9}) : new THREE.LineBasicMaterial({color})); l.frustumCulled = false; return l;
}

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root);
  const iron = mat(0x353a42, {metalness: 0.35, roughness: 0.78}), pts = {};
  // ruler on the ground (z = +1.1)
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(36, 0.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: rulerTexture()})); ruler.position.set(16, 0.006, 1.2); root.add(ruler);
  // a round pit in the floor for the gun (the stage cuts a hole of this radius), with a wall and a floor
  const pitWall = add(root, new THREE.CylinderGeometry(0.62, 0.62, 1.0, 36, 1, true), mat(0x2a3138, {roughness: 0.9, metalness: 0.1}), 0, -0.5, 0, false); pitWall.material.side = THREE.BackSide; add(root, new THREE.CylinderGeometry(0.62, 0.62, 0.04, 36), mat(0x1b2026, {roughness: 0.95}), 0, -1.0, 0, false); add(root, new THREE.TorusGeometry(0.64, 0.03, 8, 40).rotateX(Math.PI / 2), mat(COL.orange, {metalness: 0.3}), 0, 0.01, 0, false);
  // gun: stand, protractor, barrel
  const stand = new THREE.Group(); root.add(stand); const col = box(stand, 0.3, 1, 0.3, iron, 0, 0.5, 0), plate = box(stand, 0.7, 0.06, 0.5, mat(0x2d6470), 0.0, 0, 0);
  const pro = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({map: protractorTexture(), transparent: true, side: THREE.DoubleSide})); root.add(pro);
  const barrelG = new THREE.Group(); root.add(barrelG);
  const bMat = gmat(0x1f6d78, {metalness: 0.6, roughness: 0.4}), barrel = add(barrelG, new THREE.CylinderGeometry(0.06, 0.06, 0.7, 28, 1, true).rotateZ(Math.PI / 2), bMat, -0.35, 0, 0); bMat.side = THREE.DoubleSide;
  const bEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 10, 1, true).rotateZ(Math.PI / 2)), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); bEdge.position.set(-0.35, 0, 0); barrelG.add(bEdge);
  add(barrelG, new THREE.CylinderGeometry(0.075, 0.075, 0.05, 28).rotateZ(Math.PI / 2), mat(COL.steel, {metalness: 0.8}), -0.7, 0, 0); // breech cap
  const spring = add(barrelG, helix(12, 0.04), mat(COL.steel, {metalness: 0.9}), -0.68, 0, 0, false), piston = add(barrelG, new THREE.CylinderGeometry(0.05, 0.05, 0.025, 20).rotateZ(Math.PI / 2), mat(COL.orange), -0.2, 0, 0, false);
  const trigger = box(barrelG, 0.05, 0.08, 0.03, mat(0xc0392b), -0.5, -0.08, 0.0, false);
  pts.spring = marker(barrelG, -0.4, 0.07, 0.0); pts.trigger = marker(barrelG, -0.5, -0.12, 0.05);
  // target bucket
  const bucket = new THREE.Group(); root.add(bucket); const bm = mat(COL.orange, {metalness: 0.3}), bmHit = mat(0x2ecc71, {metalness: 0.3});
  const bBase = box(bucket, 0.7, 0.04, 0.5, bm, 0, 0.02, 0), walls = [box(bucket, 0.04, 0.4, 0.5, bm, -0.33, 0.2, 0), box(bucket, 0.04, 0.4, 0.5, bm, 0.33, 0.2, 0), box(bucket, 0.7, 0.4, 0.04, bm, 0, 0.2, -0.23), box(bucket, 0.7, 0.4, 0.04, bm, 0, 0.2, 0.23)]; pts.bucket = marker(bucket, 0, 0.5, 0);
  // ball, trail, strobes, predicted paths
  const ball = add(root, new THREE.SphereGeometry(0.05, 20, 14), mat(0xc2cbd2, {metalness: 0.95, roughness: 0.2})), trail = makeLine(COL.ink, false), predLine = makeLine(COL.teal, true), compLine = makeLine(COL.orange, true); root.add(trail, predLine, compLine);
  const sMat = flat(COL.teal, {transparent: true, opacity: 0.4}), strobes = []; for (let k = 0; k < 60; k++) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), sMat); o.visible = false; root.add(o); strobes.push(o); }
  const arrX = makeArrow(COL.orange), arrY = makeArrow(COL.teal), arrV = makeArrow(COL.ink); arrY.rotation.z = Math.PI / 2; const arrYw = new THREE.Group(); arrYw.add(arrY); root.add(arrX, arrYw, arrV);
  const apex = marker(root), land = marker(root); pts.ball = marker(root); pts.apex = apex; pts.land = land; pts.pro = marker(root); pts.muzzle = marker(root);
  const fillLine = (line, a, v0, h0, from, to, n = 90) => { const p = line.geometry.attributes.position; const tl = flight(a, v0, h0); const t1 = Math.min(to, tl); let c = 0; for (let i = 0; i <= n && c < MAXPTS; i++) { const t = from + ((t1 - from) * i) / n, q = pos(a, v0, h0, t); p.setXYZ(c++, q.x, Math.max(0, q.y), 0); } p.needsUpdate = true; line.geometry.setDrawRange(0, c); line.computeLineDistances?.(); };
  const e3 = (x) => x * x * (3 - 2 * x);
  function update(r, s, td, sc = 1) {
    const e = e3(td), a = s.alpha * D2R, h0 = s.h0; ball.scale.setScalar(sc);
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; } bEdge.material.opacity = 0.55 * e;
    col.scale.y = h0 + 0.9; col.position.y = (h0 - 0.9) / 2; plate.position.y = h0 - 0.1 + 0.03;
    barrelG.position.set(0, h0, 0); barrelG.rotation.z = a; pro.position.set(0.5, h0 + 0.5, 0.2); pts.pro.position.set(0.5, h0 + 0.22, 0.2); pts.muzzle.position.set(0, h0, 0);
    const cmp = r.compress, slen = Math.max(0.1, 0.55 - 2.0 * cmp); spring.scale.x = slen; piston.position.x = -0.68 + slen; // a stronger shot = a more compressed spring
    // target
    bucket.position.set(s.D, 0, 0); const hit = r.landed && r.hit; for (const w of [bBase, ...walls]) w.material = hit ? bmHit : bm;
    // ball
    const q = pos(s.alpha, s.v0, h0, r.t), at = r.fired ? q : {x: 0, y: h0, vx: s.v0 * Math.cos(a), vy: s.v0 * Math.sin(a)}; ball.position.set(at.x, Math.max(0.05, at.y), 0); pts.ball.position.set(at.x, Math.max(0.05, at.y), 0.0);
    fillLine(trail, s.alpha, s.v0, h0, 0, r.fired ? r.t : 0); trail.visible = r.fired;
    const showPred = s.pred || false, showComp = s.comp; predLine.visible = showPred; if (showPred) fillLine(predLine, s.alpha, s.v0, h0, 0, 1e9); compLine.visible = showComp; if (showComp) fillLine(compLine, 90 - s.alpha, s.v0, h0, 0, 1e9);
    for (let k = 0; k < strobes.length; k++) { const tk = (k + 1) * 0.1, on = r.fired && tk <= r.t + 1e-9 && tk < r.tFlight; strobes[k].visible = on; strobes[k].scale.setScalar(sc); if (on) { const pp = pos(s.alpha, s.v0, h0, tk); strobes[k].position.set(pp.x, Math.max(0.05, pp.y), 0); } }
    const vs = 0.1; arrX.position.set(at.x, Math.max(0.05, at.y), 0.08); arrX.userData.set(r.fired ? vs * at.vx : 0); arrYw.position.set(at.x, Math.max(0.05, at.y), 0.08); arrY.userData.set(r.fired && !r.landed ? vs * at.vy * 1 : 0);
    arrV.position.set(at.x, Math.max(0.05, at.y), -0.08); arrV.rotation.z = Math.atan2(at.vy, at.vx); arrV.userData.set(r.fired && !r.landed ? vs * Math.hypot(at.vx, at.vy) : 0);
    // labelled points: the top of the path and the landing spot
    const pa = pos(s.alpha, s.v0, h0, r.tTop); apex.position.set(pa.x, pa.y + 0.15, 0); const pl = pos(s.alpha, s.v0, h0, r.tFlight); land.position.set(pl.x, 0.25, 0);
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  void SPRING;
  return {root, update, pts, worldPt};
}
