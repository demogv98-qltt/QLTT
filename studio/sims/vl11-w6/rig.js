// W6 geometry: a vertical glass tube on a stand, a water bottle on a sliding platform joined to the tube by a hose, a loudspeaker above the open end,
// and a cm scale along the tube. Standing-wave air particles inside the tube. update(readout, model, td) poses everything.
import * as THREE from 'three';
import {LT, E_CORR} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, blue: 0x2b59c3, red: 0xd62839};
export const YB = 0.62, YT = YB + LT; // tube bottom, top (open end)
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const scaleTex = () => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 2048; const g = c.getContext('2d'), PX = 2048 / 105; g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 128, 2048); g.fillStyle = '#14303c'; g.strokeStyle = '#14303c'; g.font = 'bold 26px monospace';
  for (let cm = 0; cm <= 100; cm++) { const y = 10 + cm * PX, big = cm % 10 === 0, mid = cm % 5 === 0; g.lineWidth = big ? 4 : mid ? 3 : 1.5; g.beginPath(); g.moveTo(128, y); g.lineTo(128 - (big ? 56 : mid ? 40 : 24), y); g.stroke(); if (big) g.fillText(String(cm), 8, y + 9); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  add(root, new THREE.BoxGeometry(1.5, 0.05, 0.9), mat(0x353a42, {metalness: 0.35, roughness: 0.78}), 0.1, 0.025, 0);
  // stand: rod behind the tube, clamps to the tube, arm to the speaker
  add(root, new THREE.CylinderGeometry(0.018, 0.018, 2.35, 16), mat(COL.steel, {metalness: 0.9, roughness: 0.3}), -0.24, 1.2, -0.02);
  for (const y of [0.78, 1.42]) { add(root, new THREE.BoxGeometry(0.07, 0.05, 0.07), mat(COL.dark, {metalness: 0.4}), -0.24, y, -0.02); add(root, new THREE.CylinderGeometry(0.008, 0.008, 0.22, 10).rotateZ(Math.PI / 2), mat(COL.steel, {metalness: 0.9}), -0.14, y, -0.02, false); add(root, new THREE.TorusGeometry(0.04, 0.007, 8, 24).rotateX(Math.PI / 2), mat(COL.dark, {metalness: 0.4}), 0, y, 0, false); }
  add(root, new THREE.BoxGeometry(0.07, 0.05, 0.07), mat(COL.dark, {metalness: 0.4}), -0.24, YT + 0.28, -0.02); add(root, new THREE.CylinderGeometry(0.008, 0.008, 0.28, 10).rotateZ(Math.PI / 2), mat(COL.steel, {metalness: 0.9}), -0.1, YT + 0.28, -0.02, false);
  // glass tube (open top), inner water
  const glass = gmat(0xcfe8ee, {opacity: 0.2, metalness: 0, roughness: 0.08}); glass.side = THREE.DoubleSide; glass.depthWrite = false;
  const tube = add(root, new THREE.CylinderGeometry(0.0384, 0.0384, LT + 0.04, 36, 1, true), glass, 0, (YB + YT) / 2, 0, false); tube.renderOrder = 2;
  const tEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.0384, 0.0384, LT, 12, 1, true), 1), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); tEdge.position.set(0, (YB + YT) / 2, 0); root.add(tEdge);
  add(root, new THREE.CylinderGeometry(0.05, 0.05, 0.05, 28), mat(COL.dark, {metalness: 0.4}), 0, YB - 0.03, 0); add(root, new THREE.CylinderGeometry(0.02, 0.02, YB - 0.05, 12), mat(COL.dark, {metalness: 0.4}), 0, (YB - 0.05) / 2 + 0.025, 0.0);
  const waterM = new THREE.MeshStandardMaterial({color: 0x3b9fd9, transparent: true, opacity: 0.55, roughness: 0.2}), water = add(root, new THREE.CylinderGeometry(0.0374, 0.0374, 1, 28), waterM, 0, YB, 0, false);
  // scale on the front of the tube (0 at the open end, increasing downwards)
  const scale = add(root, new THREE.BoxGeometry(0.07, 1.05, 0.006), new THREE.MeshStandardMaterial({map: scaleTex(), roughness: 0.6}), 0.09, YT + 0.005 - 0.5025, 0.045, false);
  // speaker above the open end
  const sp = new THREE.Group(); sp.position.set(0, YT + 0.16, 0); root.add(sp); const spM = gmat(0x2d6470, {metalness: 0.5, roughness: 0.5}), spBody = add(sp, new THREE.CylinderGeometry(0.1, 0.1, 0.16, 28), spM, 0, 0.1, 0); const spEdge = new THREE.LineSegments(new THREE.EdgesGeometry(spBody.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); spBody.add(spEdge);
  const cone = add(sp, new THREE.CylinderGeometry(0.075, 0.03, 0.05, 28), mat(0xdfe6ea, {metalness: 0.2}), 0, 0.0, 0, false); add(sp, new THREE.BoxGeometry(0.06, 0.04, 0.06), mat(COL.dark), -0.14, 0.12, -0.02, false); add(sp, new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8).rotateZ(Math.PI / 2), mat(COL.steel), -0.1, 0.12, -0.02, false);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.004, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xe8590c, transparent: true, opacity: 0})); ring.position.set(0, YT, 0); root.add(ring);
  // air particles in the tube
  const NP = 60, pm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({color: 0xffffff}), NP); pm.frustumCulled = false; root.add(pm); const dummy = new THREE.Object3D();
  // bottle on a sliding platform, hose
  const BX = 0.5; add(root, new THREE.CylinderGeometry(0.02, 0.02, 2.0, 14), mat(COL.steel, {metalness: 0.9, roughness: 0.3}), BX + 0.14, 1.025, 0); add(root, new THREE.BoxGeometry(0.4, 0.05, 0.4), mat(0x353a42, {metalness: 0.35, roughness: 0.78}), BX + 0.14, 0.025 + 0.0, 0, false).position.y = 0.025;
  const bot = new THREE.Group(); root.add(bot); const bM = gmat(0xcfe8ee, {opacity: 0.3, metalness: 0, roughness: 0.08}); bM.depthWrite = false; const bottle = add(bot, new THREE.CylinderGeometry(0.085, 0.085, 0.36, 28, 1, true), bM, 0, 0.0, 0, false); bottle.renderOrder = 2;
  const bW = new THREE.Mesh(new THREE.CylinderGeometry(0.081, 0.081, 0.18, 28), waterM); bot.add(bW); add(bot, new THREE.CylinderGeometry(0.087, 0.087, 0.02, 28), mat(COL.dark, {metalness: 0.4}), 0, -0.19, 0, false);
  const plat = add(bot, new THREE.BoxGeometry(0.3, 0.03, 0.22), mat(COL.steel, {metalness: 0.8, roughness: 0.4}), 0.075, -0.215, 0, false); add(bot, new THREE.BoxGeometry(0.05, 0.12, 0.08), mat(COL.dark, {metalness: 0.4}), 0.14 - 0.14 + 0.0, 0, 0, false).visible = false; void plat;
  const collar = add(bot, new THREE.BoxGeometry(0.06, 0.07, 0.06), mat(COL.dark, {metalness: 0.4}), 0.14 - 0.0, -0.215, 0, false); collar.position.x = 0.14;
  const hoseM = new THREE.MeshStandardMaterial({color: 0x2b59c3, roughness: 0.5}), hose = new THREE.Mesh(new THREE.BufferGeometry(), hoseM); hose.castShadow = true; hose.frustumCulled = false; root.add(hose); let hKey = '';
  pts.speaker = marker(sp, 0, 0.22, 0); pts.tube = marker(root, 0.05, YT - 0.15, 0); pts.water = marker(root, 0.0, YB + 0.1, 0); pts.bottle = marker(bot, 0.09, 0.0, 0); pts.scale = marker(root, 0.1, YT - 0.7, 0.05); pts.hose = marker(root, 0.25, 0.45, 0); pts.node = marker(root, 0, YB, 0); pts.mouth = marker(root, 0, YT, 0);
  void E_CORR;
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td), yw = YT - r.l; // water surface in the tube
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.88 * e); m.depthWrite = false; }
    tEdge.material.opacity = spEdge.material.opacity = 0.55 * e;
    const hw = Math.max(0.001, yw - YB); water.scale.y = hw; water.position.y = YB + hw / 2;
    // bottle: its water level equals the tube's (communicating vessels)
    const by = yw; bot.position.set(BX, by, 0); bW.scale.y = 1; bW.position.y = -0.09 + 0; const bot0 = by - 0.19; void bot0;
    // hose: from the tube port to the bottle's bottom port
    const k = yw.toFixed(3); if (k !== hKey) { hKey = k; const pts3 = [new THREE.Vector3(0.036, YB + 0.03, 0), new THREE.Vector3(0.12, YB - 0.05, 0), new THREE.Vector3(0.26, Math.min(YB - 0.1, by - 0.4) , 0), new THREE.Vector3(BX - 0.0 + 0.0, by - 0.15, 0)]; hose.geometry.dispose(); hose.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts3, false, 'catmullrom', 0.5), 40, 0.011, 8, false); }
    // speaker cone and air particles: displacement ∝ sin(k·y)·cos(ωt), amplitude set by the loudness
    const w = 2 * Math.PI * Math.min(s.f, 120) / 12, A = 0.014 * Math.sqrt(r.I) + 0.0006; cone.position.y = 0.0 - 0.006 * Math.cos(w * r.t) * (0.4 + 0.6 * r.I);
    const kk = (2 * Math.PI) / r.lam; for (let i = 0; i < NP; i++) { const d = ((i + 0.5) / NP) * r.l, y0 = YT - d, yy = r.l - d + 0 * E_CORR; const u = A * Math.sin(kk * (yy + 0.0)) * Math.cos(w * r.t); dummy.position.set(((i * 37) % 11 - 5) * 0.005, y0 + u * 1.0, ((i * 53) % 9 - 4) * 0.005); dummy.scale.setScalar(1); dummy.updateMatrix(); pm.setMatrixAt(i, dummy.matrix); }
    pm.instanceMatrix.needsUpdate = true; ring.material.opacity = r.I > 0.85 ? 0.35 + 0.35 * Math.sin(4 * r.t) : 0;
    pts.water.position.y = yw - 0.1; pts.node.position.y = yw; pts.bottle.position.set(BX + 0.09, by, 0); pts.hose.position.set(0.25, Math.min(YB - 0.1, by - 0.4), 0);
    root.updateMatrixWorld(true);
  }
  void scale;
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
