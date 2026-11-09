// VL10-M14 geometry: a glass tank with liquid, a depth scale, a pressure probe (sensor head + display) and a floating/sinking cube.
import * as THREE from 'three';
import {A_MAX, H_TANK, LIQUIDS, SOLIDS} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, blue: 0x2a6fdb};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function makeArrow(color, w = 0.012) {
  const g = new THREE.Group(), m = flat(color), hl0 = w * 5;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(w, w, 1, 10).rotateZ(-Math.PI / 2), m), head = new THREE.Mesh(new THREE.ConeGeometry(w * 3, hl0, 14).rotateZ(-Math.PI / 2), m); g.add(shaft, head);
  g.userData.set = (len) => { const l = Math.max(0, len); g.visible = l > 0.004; const hl = Math.min(hl0, l * 0.5); shaft.scale.x = Math.max(0.001, l - hl); shaft.position.x = (l - hl) / 2; head.scale.setScalar(hl / hl0); head.position.x = l - hl / 2; };
  return g;
}
const aim = (g, dx, dy, dz) => { const d = new THREE.Vector3(dx, dy, dz).normalize(); g.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d); };
const scaleTex = () => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 1536; const g = c.getContext('2d'); g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 128, 1536);
  const PX = 1536 / 120; g.strokeStyle = '#14303c'; g.fillStyle = '#14303c'; g.font = 'bold 26px monospace';
  for (let cm = 0; cm <= 120; cm++) { const y = cm * PX, big = cm % 10 === 0; g.lineWidth = big ? 4 : 2; g.beginPath(); g.moveTo(128, y); g.lineTo(big ? 70 : cm % 5 === 0 ? 90 : 106, y); g.stroke(); if (big && cm < 120) g.fillText(String(cm), 6, y + 24); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
export const TB = 0.05, YS = TB + H_TANK, TW = 1.6, TD = 0.8, XB = 0.38, XP = -0.4;

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  add(root, new THREE.BoxGeometry(2.2, 0.05, 1.2), mat(0x5a6670, {roughness: 0.8}), 0, 0.025, 0);
  // glass tank (open top): floor + 4 walls
  const glass = gmat(0xcfe6f2, {transparent: true, opacity: 0.16, metalness: 0.0, roughness: 0.1}); glass.depthWrite = false;
  const parts = [[TW, 0.012, TD, 0, TB, 0], [TW, 1.5, 0.012, 0, TB + 0.75, TD / 2], [TW, 1.5, 0.012, 0, TB + 0.75, -TD / 2], [0.012, 1.5, TD, -TW / 2, TB + 0.75, 0], [0.012, 1.5, TD, TW / 2, TB + 0.75, 0]];
  for (const [w, h, d, x, y, z] of parts) { const o = add(root, new THREE.BoxGeometry(w, h, d), glass, x, y, z, false); o.renderOrder = 2; }
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(TW, 1.5, TD)), new THREE.LineBasicMaterial({color: 0x6f8794, transparent: true, opacity: 0.7})); edges.position.set(0, TB + 0.75, 0); root.add(edges);
  const liqM = new THREE.MeshStandardMaterial({color: 0x3b9fd9, transparent: true, opacity: 0.42, metalness: 0, roughness: 0.2, depthWrite: false}); const liq = add(root, new THREE.BoxGeometry(TW - 0.03, H_TANK, TD - 0.03), liqM, 0, TB + H_TANK / 2, 0, false); liq.renderOrder = 1;
  const surf = add(root, new THREE.PlaneGeometry(TW - 0.03, TD - 0.03).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false}), 0, YS + 0.002, 0, false);
  // depth scale on the left of the tank (0 at the surface)
  const scale = add(root, new THREE.BoxGeometry(0.07, H_TANK, 0.008), new THREE.MeshStandardMaterial({map: scaleTex(), roughness: 0.6, metalness: 0}), -TW / 2 - 0.07, YS - H_TANK / 2, TD / 2 + 0.01, false); void scale;
  // probe: rod from a bridge, sensor head at depth h
  const bridge = add(root, new THREE.BoxGeometry(0.1, 0.03, TD + 0.1), mat(COL.dark), XP, TB + 1.52, 0);
  add(root, new THREE.BoxGeometry(XB - XP + 0.3, 0.03, 0.1), mat(COL.dark), (XB + XP) / 2, TB + 1.52, 0); // overhead beam that also carries the cube
  const cord = add(root, new THREE.CylinderGeometry(0.006, 0.006, 1, 8), mat(0x1a1a1a), XB, 0, 0, false);
  const rod = add(root, new THREE.CylinderGeometry(0.008, 0.008, 1, 12), mat(0xdfe6ea, {metalness: 0.9}), XP, 0, 0);
  const headG = new THREE.Group(); root.add(headG); const headM = gmat(0xdfe6ea, {metalness: 0.5, roughness: 0.3});
  const head = add(headG, new THREE.CylinderGeometry(0.035, 0.035, 0.07, 28).rotateX(Math.PI / 2), headM, 0, 0, 0);
  const hedge = new THREE.LineSegments(new THREE.EdgesGeometry(head.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); head.add(hedge);
  const diaph = add(headG, new THREE.CylinderGeometry(0.028, 0.028, 0.004, 24).rotateX(Math.PI / 2), mat(COL.orange, {metalness: 0.2}), 0, 0, 0.036, false);
  add(headG, new THREE.BoxGeometry(0.02, 0.02, 0.05), mat(COL.steel), 0, 0, -0.01, false);
  const gauge = add(root, new THREE.BoxGeometry(0.34, 0.16, 0.1), mat(0x1f2a33), XP, TB + 1.62, 0.12);
  const scr = add(root, new THREE.BoxGeometry(0.28, 0.09, 0.004), flat(0x9adbb0), XP, TB + 1.62, 0.172, false); void gauge; void scr;
  const pArr = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1]].map((d) => { const a = makeArrow(COL.blue, 0.01); root.add(a); aim(a, -d[0], -d[1], -d[2]); a.userData.d = d; return a; });
  // block
  const blk = new THREE.Group(); root.add(blk); const bm = gmat(0xb07a3f, {metalness: 0.2, roughness: 0.7}); const bcube = add(blk, new THREE.BoxGeometry(1, 1, 1), bm, 0, 0, 0);
  const bedge = new THREE.LineSegments(new THREE.EdgesGeometry(bcube.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0.35})); bcube.add(bedge);
  const aP = makeArrow(COL.teal, 0.012), aB = makeArrow(COL.blue, 0.012); root.add(aP, aB);
  pts.head = marker(headG, 0.06, 0, 0); pts.gauge = marker(root, XP, TB + 1.7, 0.12); pts.block = marker(blk, 0, 0.5, 0); pts.tank = marker(root, TW / 2 - 0.05, TB + 1.0, TD / 2); pts.liq = marker(root, TW / 2 - 0.4, TB + 0.25, TD / 2); pts.scale = marker(root, -TW / 2 - 0.07, YS - 0.4, TD / 2 + 0.01); pts.rod = marker(root, XP, TB + 1.4, 0);
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td), L = LIQUIDS[s.liq], S = SOLIDS[s.sol];
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - (m === bm ? 0.55 : 0.85) * e); m.depthWrite = false; }
    glass.opacity = 0.16 * (1 - 0.8 * e); hedge.material.opacity = 0.55 * e; liqM.color.setHex(L.col); liqM.opacity = 0.42 - 0.18 * e;
    const yh = YS - s.h; headG.position.set(XP, yh, 0); rod.scale.y = TB + 1.52 - yh; rod.position.set(XP, (TB + 1.52 + yh) / 2, 0);
    bm.color.setHex(S.col); blk.scale.set(s.a, s.a, s.a); blk.position.set(XB, YS - r.z + s.a / 2, 0);
    // arrows at the probe head: pressure pushes from every direction with the same size
    const pl = r.pl, len = Math.min(0.5, pl * 0.00006);
    for (const a of pArr) { const d = a.userData.d; a.position.set(XP + d[0] * (0.05 + len), yh + d[1] * (0.05 + len), d[2] * (0.05 + len)); a.userData.set(len); a.visible = a.visible && s.h > 0.02; }
    const wl = 0.55, topY = YS - r.z + s.a + 0.03; cord.visible = !s.released; if (cord.visible) { const yt = YS - r.z + s.a, yb = TB + 1.52; cord.scale.y = Math.max(0.01, yb - yt); cord.position.set(XB, (yt + yb) / 2, 0); }
    aP.position.set(XB + s.a / 2 + 0.07, YS - r.z + s.a / 2, 0.0); aim(aP, 0, -1, 0); aP.userData.set(wl);
    aB.position.set(XB + s.a / 2 + 0.15, YS - r.z + s.a / 2, 0.0); aim(aB, 0, 1, 0); aB.userData.set(r.P > 0 ? wl * r.Fb / r.P : 0);
    void topY; void A_MAX; void H_TANK;
    root.updateMatrixWorld(true);
  }
  void bridge; void diaph; void surf;
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
