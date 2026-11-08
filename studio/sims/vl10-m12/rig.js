// VL10-M12 geometry: an air-table with a turntable, a centre force sensor, a string and a ball. update(readout, model, td) poses everything.
import * as THREE from 'three';
import {R_DISC} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, purple: 0x5b3cc4};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({color: c, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
function makeArrow(color) {
  const g = new THREE.Group(), m = flat(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 10).rotateZ(-Math.PI / 2), m), head = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 14).rotateZ(-Math.PI / 2), m); g.add(shaft, head);
  g.userData.set = (len) => { const l = Math.max(0, len); g.visible = l > 0.02; const hl = Math.min(0.24, l * 0.5); shaft.scale.x = Math.max(0.001, l - hl); shaft.position.x = (l - hl) / 2; head.scale.setScalar(hl / 0.24); head.position.x = l - hl / 2; };
  return g;
}
const pointArrow = (a, dx, dz, len) => { a.rotation.y = -Math.atan2(dz, dx); a.userData.set(len); };
const discTexture = () => {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'), S = 1024 / (2 * R_DISC);
  g.fillStyle = '#dde6ec'; g.fillRect(0, 0, 1024, 1024); g.translate(1024, 0); g.scale(-1, 1); g.translate(512, 512);
  g.strokeStyle = '#6a8190'; g.fillStyle = '#14303c'; g.lineWidth = 3; g.font = 'bold 30px monospace'; g.textAlign = 'center';
  for (let r = 0.5; r <= 2.0; r += 0.5) { g.beginPath(); g.arc(0, 0, r * S, 0, 7); g.stroke(); g.fillText(r.toFixed(1).replace('.', ',') + ' m', r * S, -6); }
  g.lineWidth = 2; for (let a = 0; a < 12; a++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos((a * Math.PI) / 6) * R_DISC * S, Math.sin((a * Math.PI) / 6) * R_DISC * S); g.stroke(); }
  g.fillStyle = '#e8590c'; g.beginPath(); g.arc(R_DISC * S - 28, 0, 14, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
export const TY = 0.8;

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  // table (ghost in teardown) on legs, motor underneath
  const tableM = gmat(0xb9c5cd, {metalness: 0.2, roughness: 0.8});
  const table = add(root, new THREE.BoxGeometry(40, 0.2, 40), tableM, 0, TY - 0.1, 0); table.castShadow = false;
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(table.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); table.add(edge);
  for (const [x, z] of [[-19, -19], [19, -19], [-19, 19], [19, 19]]) add(root, new THREE.CylinderGeometry(0.2, 0.2, TY - 0.2, 16), mat(0x5a6670), x, (TY - 0.2) / 2, z);
  const motorM = mat(COL.dark, {metalness: 0.5}); add(root, new THREE.CylinderGeometry(0.34, 0.34, 0.5, 28), motorM, 0, 0.35, 0);
  add(root, new THREE.CylinderGeometry(0.05, 0.05, 0.55, 14), mat(0xdfe6ea, {metalness: 0.9}), 0, 0.7, 0);
  const fins = add(root, new THREE.CylinderGeometry(0.36, 0.36, 0.06, 28), mat(COL.orange, {metalness: 0.3}), 0, 0.12, 0);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R_DISC, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({map: discTexture(), roughness: 0.6, metalness: 0.05})); disc.position.y = TY + 0.005; disc.receiveShadow = true; root.add(disc);
  const rim = add(root, new THREE.TorusGeometry(R_DISC, 0.025, 8, 80).rotateX(Math.PI / 2), mat(COL.steel), 0, TY + 0.01, 0, false);
  // force sensor on the axis: ghost housing + strain beam + spring
  const sensG = new THREE.Group(); sensG.position.set(0, TY + 0.005, 0); root.add(sensG);
  const hous = add(sensG, new THREE.CylinderGeometry(0.16, 0.16, 0.55, 30), gmat(0xdfe6ea, {metalness: 0.3, roughness: 0.4}), 0, 0.275, 0);
  const hedge = new THREE.LineSegments(new THREE.EdgesGeometry(hous.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); hous.add(hedge);
  add(sensG, new THREE.BoxGeometry(0.08, 0.34, 0.08), mat(COL.steel), 0, 0.28, 0, false);
  add(sensG, new THREE.BoxGeometry(0.12, 0.06, 0.12), mat(COL.orange, {metalness: 0.2}), 0, 0.28, 0, false);
  add(sensG, new THREE.CylinderGeometry(0.17, 0.17, 0.04, 30), mat(COL.teal), 0, 0.57, 0, false);
  pts.sensor = marker(sensG, 0, 0.6, 0); pts.motor = marker(root, 0, 0.2, 0); pts.disc = marker(root, 1.5, TY + 0.05, 0.4); pts.table = marker(root, -2.7, TY, 1.6);
  // ball and string
  const ball = new THREE.Group(); root.add(ball);
  const ballM = mat(COL.teal, {metalness: 0.7, roughness: 0.25}), bm = add(ball, new THREE.SphereGeometry(1, 40, 24), ballM, 0, 0, 0);
  const strM = mat(0x14303c, {metalness: 0.1, roughness: 0.9}), str = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6).rotateZ(Math.PI / 2), strM); root.add(str);
  const trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: COL.orange, transparent: true, opacity: 0.55})); trail.frustumCulled = false; root.add(trail);
  const TR = []; let lastTh = -1e9;
  const arrV = makeArrow(COL.teal), arrF = makeArrow(COL.orange); root.add(arrV, arrF);
  pts.ball = marker(ball, 0, 0.3, 0); pts.str = marker(root);
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td);
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.85 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    edge.material.opacity = hedge.material.opacity = 0.55 * e;
    disc.rotation.y = r.th; fins.rotation.y = r.th;
    const rb = 0.1 + 0.09 * Math.cbrt((s.m - 0.1) / 0.9), by = TY + 0.005 + rb, bx = r.x, bz = -r.y;
    bm.scale.setScalar(rb); ball.position.set(bx, by, bz);
    const hide = r.off && r.cut && Math.hypot(bx, bz) > 19; ball.visible = !hide;
    str.visible = !r.cut; const L = Math.max(0.01, Math.hypot(bx, bz) - 0.16); str.scale.x = L; str.position.set((bx / Math.hypot(bx, bz)) * (0.16 + L / 2), by, (bz / Math.hypot(bx, bz)) * (0.16 + L / 2)); str.rotation.y = -Math.atan2(bz, bx);
    arrV.position.set(bx, by + rb + 0.05, bz); pointArrow(arrV, r.vx, -r.vy, 0.26 * r.speed);
    arrF.position.set(bx, by + rb + 0.05, bz);
    if (r.cut) arrF.userData.set(0); else pointArrow(arrF, -bx, -bz, 0.1 * r.F);
    // trail of the ball
    if (Math.abs(r.th - lastTh) > 0.04 || r.cut) { if (r.th < lastTh) TR.length = 0; lastTh = r.th; if (r.t === 0) TR.length = 0; TR.push(bx, by, bz); if (TR.length > 3 * 900) TR.splice(0, 3); trail.geometry.setAttribute('position', new THREE.Float32BufferAttribute(TR, 3)); trail.geometry.setDrawRange(0, TR.length / 3); }
    root.updateMatrixWorld(true);
  }
  void rim;
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt, ball};
}
