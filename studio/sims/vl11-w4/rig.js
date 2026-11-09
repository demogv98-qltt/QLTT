// W4 geometry: a ripple tank on a table (glass tray, white bottom), two dippers on a bar, a floating buoy M. The water is one grid whose
// heights, normals and the interference overlays are computed on the GPU from the same formula as physics.js.
import * as THREE from 'three';
import {TANK, u} from './physics.js';

const COL = {teal: 0x0b8f8c, orange: 0xe8590c, ink: 0x14303c, steel: 0x8a95a0, dark: 0x252b33, red: 0xd62839, blue: 0x2b59c3};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, metalness: 0.5, roughness: 0.5, envMapIntensity: 0.55, ...o});
const ghostMats = [];
const gmat = (c, o = {}) => { const m = mat(c, {transparent: true, ...o}); m.userData.base = o.opacity ?? 1; ghostMats.push(m); return m; };
function add(p, g, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; p.add(o); return o; }
const marker = (p, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); p.add(o); return o; };
export const TY = 0.3, YW = TY + 0.062, VIS = 0.011; // table top, water surface, visual height of one wave (m)

const VERT = /* glsl */ `
uniform float uT, uK, uW, uV, uVis, uPh2; uniform vec2 uS1, uS2;
varying vec3 vN; varying vec3 vP; varying vec2 vXZ; varying float vH;
float env(float r){ float arrive = 1.0 - smoothstep(uV * uT - 0.06, uV * uT, r); return smoothstep(0.0, 0.025, r) * arrive; }
void main(){
  vec2 p = position.xz; vec2 d1 = p - uS1, d2 = p - uS2; float r1 = length(d1) + 1e-5, r2 = length(d2) + 1e-5;
  float e1 = env(r1), e2 = env(r2), th1 = uW * uT - uK * r1, th2 = uW * uT - uK * r2 + uPh2;
  float h = cos(th1) * e1 + cos(th2) * e2;
  // beach: waves fade near the tank walls so that nothing reflects
  float bx = 1.0 - smoothstep(${(TANK.X - 0.18).toFixed(2)}, ${TANK.X.toFixed(2)}, abs(p.x)), bz = 1.0 - smoothstep(${(TANK.Z - 0.14).toFixed(2)}, ${TANK.Z.toFixed(2)}, abs(p.y)); float beach = bx * bz; h *= beach;
  vec2 g = (uK * sin(th1) * e1) * d1 / r1 + (uK * sin(th2) * e2) * d2 / r2; g *= beach;
  vN = normalize(vec3(-uVis * g.x, 1.0, -uVis * g.y)); vH = h; vXZ = p;
  vec3 pos = vec3(position.x, position.y + uVis * h, position.z); vP = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.0);
}`;
const FRAG = /* glsl */ `
uniform float uT, uK, uV, uPh2, uLam, uOff, uAmpMode, uLines; uniform vec2 uS1, uS2; uniform vec3 uCam;
varying vec3 vN; varying vec3 vP; varying vec2 vXZ; varying float vH;
void main(){
  vec3 N = normalize(vN), L = normalize(vec3(-0.35, 0.85, 0.4)), V = normalize(uCam - vP), H = normalize(L + V);
  float diff = 0.55 + 0.45 * max(dot(N, L), 0.0), spec = pow(max(dot(N, H), 0.0), 90.0), fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 deep = vec3(0.07, 0.36, 0.55), shallow = vec3(0.30, 0.70, 0.86);
  vec3 col = mix(deep, shallow, clamp(0.5 + 0.28 * vH, 0.0, 1.0)) * diff + vec3(0.9, 0.97, 1.0) * spec * 0.85 + vec3(0.5, 0.75, 0.9) * fres * 0.25;
  float r1 = length(vXZ - uS1), r2 = length(vXZ - uS2); float both = (1.0 - smoothstep(uV * uT - 0.06, uV * uT, max(r1, r2)));
  float q = (r2 - r1) / uLam - uOff;               // maxima where q is an integer, minima where q is a half-integer
  if (uAmpMode > 0.5) { float ratio = abs(cos(3.14159265 * q)); vec3 amp = mix(vec3(0.05, 0.12, 0.28), vec3(1.0, 0.93, 0.55), ratio); col = mix(col, amp, both * 0.96); }
  if (uLines > 0.5) {
    float w = fwidth(q) * 1.6 + 1e-4;
    float lmax = 1.0 - smoothstep(0.0, w, abs(fract(q + 0.5) - 0.5)), lmin = 1.0 - smoothstep(0.0, w, abs(fract(q) - 0.5));
    col = mix(col, vec3(1.0, 0.83, 0.1), lmax * 0.9 * both); col = mix(col, vec3(0.88, 0.16, 0.2), lmin * 0.9 * both);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export function createRig(scene) {
  const root = new THREE.Group(); scene.add(root); const pts = {};
  // table and tray
  add(root, new THREE.BoxGeometry(2.4, 0.05, 1.5), mat(0xa8865a, {roughness: 0.8}), 0, TY - 0.025, 0); for (const [x, z] of [[-1.1, -0.65], [1.1, -0.65], [-1.1, 0.65], [1.1, 0.65]]) add(root, new THREE.BoxGeometry(0.07, TY - 0.05, 0.07), mat(0x353a42, {metalness: 0.4}), x, (TY - 0.05) / 2, z);
  add(root, new THREE.BoxGeometry(TANK.X * 2 + 0.06, 0.02, TANK.Z * 2 + 0.06), mat(0xf4f6f8, {roughness: 0.6, metalness: 0}), 0, TY + 0.01, 0);
  const glass = gmat(0xcfe6f2, {opacity: 0.2, roughness: 0.1, metalness: 0}); glass.depthWrite = false;
  for (const [w, h, d, x, y, z] of [[TANK.X * 2 + 0.06, 0.1, 0.012, 0, TY + 0.07, TANK.Z + 0.03], [TANK.X * 2 + 0.06, 0.1, 0.012, 0, TY + 0.07, -TANK.Z - 0.03], [0.012, 0.1, TANK.Z * 2 + 0.06, TANK.X + 0.03, TY + 0.07, 0], [0.012, 0.1, TANK.Z * 2 + 0.06, -TANK.X - 0.03, TY + 0.07, 0]]) add(root, new THREE.BoxGeometry(w, h, d), glass, x, y, z, false).renderOrder = 2;
  const gEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(TANK.X * 2 + 0.06, 0.1, TANK.Z * 2 + 0.06)), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0.35})); gEdge.position.set(0, TY + 0.07, 0); root.add(gEdge);
  // water surface (GPU)
  const geo = new THREE.PlaneGeometry(TANK.X * 2, TANK.Z * 2, 360, 225).rotateX(-Math.PI / 2);
  const U = {uT: {value: 0}, uK: {value: 1}, uW: {value: 1}, uV: {value: 0.3}, uVis: {value: VIS}, uPh2: {value: 0}, uS1: {value: new THREE.Vector2()}, uS2: {value: new THREE.Vector2()}, uLam: {value: 0.1}, uOff: {value: 0}, uAmpMode: {value: 0}, uLines: {value: 1}, uCam: {value: new THREE.Vector3()}};
  const water = new THREE.Mesh(geo, new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: FRAG, uniforms: U})); water.position.y = YW; water.frustumCulled = false; root.add(water);
  // bar on two posts, dippers with motors
  for (const x of [-1.0, 1.0]) add(root, new THREE.BoxGeometry(0.06, 0.8, 0.06), mat(COL.steel, {metalness: 0.8, roughness: 0.4}), x, TY + 0.4, -0.58);
  const barY = TY + 0.72; add(root, new THREE.BoxGeometry(2.1, 0.04, 0.05), mat(COL.steel, {metalness: 0.8, roughness: 0.4}), 0, barY, -0.58);
  const dippers = [0, 1].map(() => {
    const g = new THREE.Group(); root.add(g);
    const hM = gmat(0x2d6470, {metalness: 0.5}), housing = add(g, new THREE.BoxGeometry(0.16, 0.16, 0.16), hM, 0, barY - 0.1, 0); const hEdge = new THREE.LineSegments(new THREE.EdgesGeometry(housing.geometry), new THREE.LineBasicMaterial({color: COL.ink, transparent: true, opacity: 0})); housing.add(hEdge);
    const ecc = add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.03, 24).rotateX(Math.PI / 2), mat(COL.steel, {metalness: 0.8}), 0, barY - 0.1, 0.0, false), pin = add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.05, 10).rotateX(Math.PI / 2), mat(COL.orange), 0.025, barY - 0.1, 0.0, false);
    const arm = add(g, new THREE.CylinderGeometry(0.007, 0.007, 0.475, 10), mat(COL.steel, {metalness: 0.9}), 0, 0, -0.3175, false); // support arm from the housing back to the bar
    const rod = add(g, new THREE.CylinderGeometry(0.0045, 0.0045, 1, 10), mat(0xdfe6ea, {metalness: 0.9}), 0, 0, 0, false), tip = add(g, new THREE.SphereGeometry(0.013, 16, 12), mat(COL.orange, {metalness: 0.3}), 0, 0, 0, false);
    return {g, housing, hEdge, ecc, pin, arm, rod, tip};
  });
  // buoy M (floats on the water; a thin line to the shore is not needed — it is only a marker) with distance lines
  const buoy = add(root, new THREE.CylinderGeometry(0.022, 0.026, 0.024, 20), mat(COL.red, {metalness: 0.2, roughness: 0.4}), 0, YW, 0, false);
  const lineM = [COL.teal, COL.orange].map((c) => add(root, new THREE.BoxGeometry(1, 0.0025, 0.004), new THREE.MeshBasicMaterial({color: c}), 0, YW + 0.004, 0, false));
  pts.s1 = marker(root); pts.s2 = marker(root); pts.m = marker(root); pts.motor = marker(root); pts.tank = marker(root, 0.55, TY + 0.12, 0.54); pts.bar = marker(root, 0.9, barY, -0.58);
  const tmp = new THREE.Vector3();
  function update(r, s, td, cam) {
    const e = td * td * (3 - 2 * td), w = 2 * Math.PI * s.f;
    for (const m of ghostMats) { m.opacity = m.userData.base * (1 - 0.8 * e); m.depthWrite = false; }
    U.uT.value = s.t; U.uK.value = (2 * Math.PI) / r.lam; U.uW.value = w; U.uV.value = s.v; U.uPh2.value = s.opp ? Math.PI : 0; U.uS1.value.set(-s.a / 2, 0); U.uS2.value.set(s.a / 2, 0); U.uLam.value = r.lam; U.uOff.value = s.opp ? 0.5 : 0; U.uAmpMode.value = s.ampMode ? 1 : 0; U.uLines.value = s.lines ? 1 : 0;
    if (cam) U.uCam.value.copy(cam);
    const xs = [-s.a / 2, s.a / 2];
    dippers.forEach((d, i) => {
      const ph = i === 1 && s.opp ? Math.PI : 0, dy = 0.007 * Math.cos(w * s.t + ph), tipY = YW + dy;
      d.tip.position.set(xs[i], tipY, 0); const topY = barY - 0.13; d.rod.scale.y = Math.max(0.01, topY - tipY); d.rod.position.set(xs[i], (topY + tipY) / 2, 0);
      d.housing.position.set(xs[i], barY - 0.1 + 0.05, 0); d.ecc.position.set(xs[i], barY - 0.1 + 0.05, 0.09); d.pin.position.set(xs[i] + 0.025, barY - 0.1 + 0.05, 0.09); d.ecc.rotation.z = w * s.t; d.hEdge.material.opacity = 0.55 * e;
      d.arm.rotation.x = Math.PI / 2; d.arm.position.set(xs[i], barY, -0.3175);
    });
    const hM = u(s, s.xM, s.zM, s.t) * VIS; buoy.position.set(s.xM, YW + hM + 0.006, s.zM);
    lineM.forEach((m, i) => { const sx = xs[i], dx = s.xM - sx, dz = s.zM, len = Math.hypot(dx, dz); m.scale.x = Math.max(0.001, len); m.position.set(sx + dx / 2, YW + 0.004, dz / 2); m.rotation.y = -Math.atan2(dz, dx); m.visible = s.lines; });
    pts.s1.position.set(xs[0], YW + 0.02, 0); pts.s2.position.set(xs[1], YW + 0.02, 0); pts.m.position.set(s.xM, YW + hM + 0.02, s.zM); pts.motor.position.set(xs[0], barY + 0.02, 0);
    root.updateMatrixWorld(true); void tmp;
  }
  const worldPt = (p, out = new THREE.Vector3()) => { p.updateWorldMatrix(true, false); return p.getWorldPosition(out); };
  return {root, update, pts, worldPt, water};
}
