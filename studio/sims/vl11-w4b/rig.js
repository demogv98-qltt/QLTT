// W4B geometry (Young's experiment as in the textbook): laser → SINGLE slit S0 (diffraction makes a cylindrical wave) → DOUBLE slit S1,S2 → the two waves overlap
// and form the fringes on the screen. A translucent sheet at beam height shows the wave fronts and the overlap zone (wavelength drawn LARGE: not to scale).
import * as THREE from 'three';
import {HALF, pixel, wlRGB} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, red: 0xd62839};
export const BY = 0.78, AX = 1.05; // bench top, optical axis height
export const SW = 0.34, SH = 0.3; // screen half-width (3D) and half-height
export const XL = -1.25, X0 = -0.8; // laser x and single-slit x (the double slit is at x = 0, the screen at x = D)
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
const mmTex = () => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#f4e9b8'; g.fillRect(0, 0, 1024, 64); g.fillStyle = '#14303c'; g.strokeStyle = '#14303c'; g.font = 'bold 22px monospace'; g.textAlign = 'center';
  for (let mm = -30; mm <= 30; mm++) { const X = 512 + (mm / 30) * 512 * 0.998, big = mm % 10 === 0, mid = mm % 5 === 0; g.lineWidth = big ? 3 : 1.5; g.beginPath(); g.moveTo(X, 0); g.lineTo(X, big ? 30 : mid ? 22 : 14); g.stroke(); if (big) g.fillText(String(mm) + ' mm', Math.min(990, Math.max(34, X)), 54); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const VERT = /* glsl */ `varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FRAG = /* glsl */ `uniform float uT, uK, uSep, uD, uX0, uOpp; uniform vec3 uCol; varying vec2 vP;
void main(){
  float a = 0.0, wv = 6.2831853 * 0.55;
  if (vP.x < 0.0) {                                  // from the single slit S0 to the double slit: one cylindrical wave
    vec2 d0 = vP - vec2(uX0, 0.0); float r0 = length(d0) + 1e-4, cs = d0.x / r0; if (vP.x < uX0 + 0.012) discard;
    float w0 = cos(uK * r0 - wv * uT), env = smoothstep(0.15, 0.7, cs) / sqrt(1.0 + 3.0 * r0);
    a = (0.12 + 0.75 * (0.5 + 0.5 * w0)) * env * 1.2;
  } else {                                           // after the double slit: two waves overlap
    vec2 s1 = vec2(0.0, -uSep * 0.5), s2 = vec2(0.0, uSep * 0.5); vec2 d1 = vP - s1, d2 = vP - s2; float r1 = length(d1) + 1e-4, r2 = length(d2) + 1e-4;
    float c1 = d1.x / r1, c2 = d2.x / r2, e1 = smoothstep(0.1, 0.6, c1), e2 = smoothstep(0.1, 0.6, c2);
    float w1 = cos(uK * r1 - wv * uT) * e1, w2 = cos(uK * r2 - wv * uT + 3.14159265 * uOpp) * e2;
    float inst = 0.5 + 0.5 * clamp((w1 + w2) * 0.5, -1.0, 1.0);
    float avg = cos(0.5 * uK * (r2 - r1)) * cos(0.5 * uK * (r2 - r1)) * min(e1, e2);
    float fade = 1.0 / sqrt(1.0 + 0.55 * min(r1, r2)); float one = max(e1, e2);
    a = (0.1 * one + 0.62 * mix(inst * one, avg, 0.55)) * (0.6 + 0.6 * fade);
  }
  float edge = smoothstep(0.0, 0.05, 0.62 - abs(vP.y)) * smoothstep(0.0, 0.06, uD - 0.02 - vP.x);
  gl_FragColor = vec4(uCol, clamp(a, 0.0, 0.85) * edge);
}`;

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  const rail = add(root, new THREE.BoxGeometry(1, 0.06, 0.16), mat(COL.dark, {metalness: 0.4}), 0, BY - 0.03, 0);
  const legs = [0, 1].map(() => add(root, new THREE.BoxGeometry(0.08, BY - 0.06, 0.2), mat(0x353a42, {metalness: 0.4}), 0, (BY - 0.06) / 2, 0));
  const carrier = (w = 0.2) => add(root, new THREE.BoxGeometry(w, 0.08, 0.2), mat(COL.steel, {metalness: 0.8, roughness: 0.4}), 0, BY + 0.04, 0);
  const cL = carrier(0.3), c0 = carrier(), cS = carrier(), cM = carrier(0.34);
  // laser (ghost body) on a post
  const lg = new THREE.Group(); root.add(lg); add(lg, new THREE.BoxGeometry(0.07, AX - BY - 0.15, 0.07), mat(COL.steel), 0.05, BY + 0.08 + (AX - BY - 0.15) / 2, 0);
  const lM = gmat(0x2d6470, {metalness: 0.55, roughness: 0.45}), lbody = add(lg, new THREE.CylinderGeometry(0.07, 0.07, 0.34, 28).rotateZ(Math.PI / 2), lM, 0.05, AX, 0);
  const lEdge = new THREE.LineSegments(new THREE.EdgesGeometry(lbody.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); lbody.add(lEdge);
  const win = add(lg, new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xff3b30}), 0.225, AX, 0, false);
  add(lg, new THREE.BoxGeometry(0.05, 0.04, 0.04), mat(0x20252b), 0.0, AX, 0, false); add(lg, new THREE.CylinderGeometry(0.045, 0.045, 0.08, 20).rotateZ(Math.PI / 2), mat(0xb87333, {metalness: 0.8}), -0.05, AX, 0, false);
  // plates: S0 (one gap) and S1,S2 (two gaps); bars are re-sized every frame
  const pM = gmat(0x20252b, {metalness: 0.3, roughness: 0.6});
  const mkPlate = (n) => { const g = new THREE.Group(); root.add(g); const bars = Array.from({length: n}, () => add(g, new THREE.BoxGeometry(0.02, 0.46, 0.1), pM, 0, AX, 0)); for (const sy of [-1, 1]) add(g, new THREE.BoxGeometry(0.02, 0.03, 0.62), pM, 0, AX + sy * 0.225, 0); // top and bottom rails hold the bars together into one plate
    add(g, new THREE.BoxGeometry(0.06, AX - 0.23 - BY - 0.08, 0.04), mat(COL.steel), 0, BY + 0.08 + (AX - 0.23 - BY - 0.08) / 2, 0); return {g, bars}; };
  const P0 = mkPlate(2), P1 = mkPlate(3);
  // screen
  const scr = new THREE.Group(); root.add(scr);
  add(scr, new THREE.BoxGeometry(0.03, SH * 2 + 0.06, SW * 2 + 0.06), mat(0xd8dde2, {roughness: 0.8, metalness: 0}), 0, AX, 0);
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 8; const cx = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(SW * 2, SH * 2).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({map: tex})); pic.position.set(-0.0165, AX, 0); scr.add(pic);
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(SW * 2, 0.07).rotateY(-Math.PI / 2), new THREE.MeshStandardMaterial({map: mmTex(), roughness: 0.7})); ruler.position.set(-0.019, AX - SH - 0.065, 0); scr.add(ruler);
  add(scr, new THREE.BoxGeometry(0.06, AX - SH - 0.03 - BY - 0.08, 0.06), mat(COL.steel), 0, BY + 0.08 + (AX - SH - 0.03 - BY - 0.08) / 2, 0);
  const cur = new THREE.Mesh(new THREE.BoxGeometry(0.006, SH * 2, 0.008), new THREE.MeshBasicMaterial({color: 0xd62839})); cur.position.set(-0.022, AX, 0); scr.add(cur);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), new THREE.MeshBasicMaterial({color: 0xd62839})); dot.position.set(-0.03, AX, 0); scr.add(dot);
  // light: the beam to S0, and the wave sheet
  const beamMat = new THREE.MeshBasicMaterial({color: 0xff3b30, transparent: true, opacity: 0.85}), beam1 = add(root, new THREE.CylinderGeometry(0.006, 0.006, 1, 8), beamMat, 0, AX, 0, false);
  const U = {uT: {value: 0}, uK: {value: 100}, uSep: {value: 0.2}, uD: {value: 2}, uX0: {value: X0}, uOpp: {value: 0}, uCol: {value: new THREE.Color(1, 0.2, 0.2)}};
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.24).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: FRAG, uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide})); sheet.renderOrder = 3; sheet.frustumCulled = false; root.add(sheet);
  const pathM = [COL.teal, COL.orange].map((c) => add(root, new THREE.CylinderGeometry(0.004, 0.004, 1, 6), new THREE.MeshBasicMaterial({color: c}), 0, AX, 0, false));
  pts.laser = marker(root); pts.s0 = marker(root); pts.plate = marker(root); pts.screen = marker(root); pts.cursor = marker(root); pts.ruler = marker(root); pts.sheet = marker(root);
  let key = '';
  function seg(m, a, b) { const d = b.clone().sub(a), len = d.length(); m.scale.y = len; m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
  function setBars(plate, edges) { plate.bars.forEach((b, i) => { b.geometry.dispose(); b.geometry = new THREE.BoxGeometry(0.02, 0.46, edges[i][1] - edges[i][0]); b.position.set(0, AX, (edges[i][0] + edges[i][1]) / 2); }); }
  function update(r, s, td) {
    const e = td * td * (3 - 2 * td), D = s.D, g = 0.05, half = 0.3, sep = 0.12 + (0.3 * (s.a - 0.2)) / 0.8;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.88 * e); m.depthWrite = e < 0.04 && m.userData.base >= 1; }
    lEdge.material.opacity = 0.55 * e;
    lg.position.x = XL; cL.position.x = XL; P0.g.position.x = X0; c0.position.x = X0; P1.g.position.x = 0; cS.position.x = 0; scr.position.x = D; cM.position.x = D;
    const xa = XL - 0.4, xb = D + 0.5; rail.scale.x = xb - xa; rail.position.x = (xa + xb) / 2; legs[0].position.x = xa + 0.15; legs[1].position.x = xb - 0.15;
    setBars(P0, [[-half, -g / 2], [g / 2, half]]); setBars(P1, [[-half, -sep / 2 - g / 2], [-sep / 2 + g / 2, sep / 2 - g / 2], [sep / 2 + g / 2, half]]);
    const col = s.white ? new THREE.Color(1, 1, 1) : new THREE.Color(...wlRGB(s.wl)); beamMat.color.copy(col); win.material.color.copy(col); U.uCol.value.copy(col);
    seg(beam1, new THREE.Vector3(XL + 0.235, AX, 0), new THREE.Vector3(X0 - 0.012, AX, 0));
    sheet.scale.set(D + 0.8 + 0.0, 1, 1); sheet.position.set((X0 + D) / 2 - 0.0, AX, 0); sheet.scale.set(D - X0, 1, 1);
    U.uT.value = r.t; U.uK.value = (2 * Math.PI) / 0.07; U.uSep.value = sep; U.uD.value = D; U.uOpp.value = 0;
    const k = [s.wl, s.a, s.D, s.white].join('|'); if (k !== key) { key = k; const img = cx.createImageData(1024, 8); for (let px = 0; px < 1024; px++) { const x = ((px / 1023) * 2 - 1) * HALF, c = pixel(s, x); for (let y = 0; y < 8; y++) { const o = (y * 1024 + px) * 4; img.data[o] = c[0] * 255; img.data[o + 1] = c[1] * 255; img.data[o + 2] = c[2] * 255; img.data[o + 3] = 255; } } cx.putImageData(img, 0, 0); tex.needsUpdate = true; }
    const zc = (s.x / (HALF * 1e3)) * SW; cur.position.z = zc; dot.position.z = zc;
    const P = new THREE.Vector3(D - 0.03, AX + 0.002, zc), S1 = new THREE.Vector3(0.015, AX + 0.002, -sep / 2), S2 = new THREE.Vector3(0.015, AX + 0.002, sep / 2); seg(pathM[0], S1, P); seg(pathM[1], S2, P);
    pts.laser.position.set(XL, AX + 0.14, 0); pts.s0.position.set(X0, AX + 0.3, g * 6); pts.plate.position.set(0, AX + 0.3, sep / 2 + 0.05); pts.screen.position.set(D, AX + SH + 0.06, SW * 0.6); pts.cursor.position.set(D - 0.03, AX, zc); pts.ruler.position.set(D, AX - SH - 0.065, -SW * 0.5); pts.sheet.position.set(D * 0.45, AX, sep * 0.9 + 0.1);
    root.updateMatrixWorld(true);
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt};
}
