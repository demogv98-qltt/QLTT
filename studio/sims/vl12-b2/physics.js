// VL12-B2: từ trường của dòng điện — dây thẳng, khung dây tròn, ống dây (Biot–Savart, tính chính xác; không dùng công thức gần đúng để vẽ).
// Hệ toạ độ như B1: x = Đông, z hướng về người xem, Bắc = −z, y thẳng đứng. Tấm bìa nằm ngang đi qua tâm nguồn từ trường; ta xét thành phần nằm ngang tại tấm bìa.
//  • Dây thẳng: thẳng đứng qua tâm tấm bìa, dài hữu hạn (d1 = 0,25 m dưới tấm, d2 = 0,65 m trên tấm) → B = μ0·I/(4πr)·(d1/√(r²+d1²) + d2/√(r²+d2²)). Dây dẫn nối với nguồn bị bỏ qua.
//  • Khung dây: N vòng bán kính R, trục x nằm trong mặt phẳng tấm bìa → trường mỗi vòng tính bằng công thức elliptic.
//  • Ống dây: N vòng, dài Lc, bán kính Rc, trục x; cộng các vòng đặt cách đều.
import {loopField, loopFieldNumeric, MU0} from '../vl12-b1/physics.js';
export {loopField, loopFieldNumeric, MU0};
export const BE = 4e-5, D2R = Math.PI / 180;
export const WIRE = {d1: 0.25, d2: 0.65}, SOL = {L: 0.4, R: 0.025};
export const RANGE = {I: [-10, 10], N: [1, 200], R: [0.06, 0.2], r: [0, 0.5], alpha: [0, 360]};
export const SRC = ['wire', 'loop', 'sol'];
export const createModel = () => ({src: 'wire', I: 5, N: 1, R: 0.1, earth: false, hand: true, mode: 'compass', r: 0.1, alpha: 0, rows: [], t: 0, speed: 1, lines3d: false, dirty: true});
export const nTurns = (s) => (s.src === 'wire' ? 1 : s.src === 'loop' ? s.N : s.N);
export const wireB = (I, r) => MU0 * I / (4 * Math.PI * r) * (WIRE.d1 / Math.hypot(r, WIRE.d1) + WIRE.d2 / Math.hypot(r, WIRE.d2));
export const wireIdeal = (I, r) => MU0 * I / (2 * Math.PI * r);
/** từ trường (u,ρ) của N vòng cùng bán kính R tại u=0 (khung) hoặc N vòng cách đều trong ống dây */
export function coilField(s, u, rho, nl = 200) {
  if (s.src === 'loop') { const [a, b] = loopField(s.R, s.I * s.N, u, rho); return [a, b]; }
  const {L, R} = SOL, N = s.N, dI = s.I * N / nl; let bu = 0, br = 0; // chia thành nl vòng "mịn" cách đều, tổng dòng = N·I
  for (let i = 0; i < nl; i++) { const [x, y] = loopField(R, dI, u - (-L / 2 + (i + 0.5) * L / nl), rho); bu += x; br += y; }
  return [bu, br];
}
/** vectơ B nằm ngang [Bx, Bz] (T) của riêng dòng điện tại điểm (x, z) trên tấm bìa */
export function srcHoriz(s, x, z, nl = 200) {
  if (s.src === 'wire') { const r = Math.max(Math.hypot(x, z), 1e-4), b = wireB(s.I, r); return [b * z / r, -b * x / r]; } // ngược chiều kim đồng hồ nhìn từ trên khi I hướng lên
  const [bu, br] = coilField(s, x, Math.abs(z), nl); return [bu, br * Math.sign(z || 1)];
}
export const totalHoriz = (s, x, z, nl = 48) => { const m = srcHoriz(s, x, z, nl); return [m[0], m[1] - (s.earth ? BE : 0)]; };
export const probePos = (s) => [s.r * Math.cos(s.alpha * D2R), -s.r * Math.sin(s.alpha * D2R)];
export const theory = (s) => (s.src === 'wire' ? wireIdeal(s.I, Math.max(s.r, 1e-4)) : s.src === 'loop' ? MU0 * s.N * s.I / (2 * s.R) : MU0 * s.N * s.I / SOL.L);
/** B tại tâm / giữa ống (đúng, theo mô hình) */
export const centerB = (s) => (s.src === 'loop' ? Math.abs(coilField(s, 0, 0)[0]) : s.src === 'sol' ? Math.abs(coilField(s, 0, 0)[0]) : NaN);
// ---- đường sức cho khung/ống dây: tích phân RK4 theo B trong mặt phẳng chứa trục ----
export function traceCoil(s, rho0, ds = 0.005, R = 0.5) {
  const f = (u, r) => { const [a, b] = coilField(s, u, Math.max(r, 0), 40), n = Math.hypot(a, b) || 1; return [a / n, b / n]; };
  const run = (dir) => { let u = 0, r = rho0; const pts = [[u, r]]; let closed = false;
    for (let i = 0; i < 5000; i++) { const g = (uu, rr) => { const v = f(uu, rr); return [v[0] * dir, v[1] * dir]; }, k1 = g(u, r), k2 = g(u + k1[0] * ds / 2, r + k1[1] * ds / 2), k3 = g(u + k2[0] * ds / 2, r + k2[1] * ds / 2), k4 = g(u + k3[0] * ds, r + k3[1] * ds);
      u += ds * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6; r += ds * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6; pts.push([u, Math.abs(r)]); if (r < 0) r = Math.abs(r);
      if (Math.hypot(u, r) > R) break; if (i > 30 && Math.hypot(u, r - rho0) < ds * 1.3) { closed = true; break; } }
    return {pts, closed}; };
  const fw = run(1), bw = run(-1); return {pts: [...bw.pts.slice(1).reverse(), ...fw.pts], closed: fw.closed};
}
// ---- kim la bàn ----
export const W0 = 2 * Math.PI * 1.2;
export const newCompass = (x, z) => ({x, z, psi: -Math.PI / 2, w: 0, B: [0, 0], mag: 0});
export function stepCompass(c, dt) {
  const bm = Math.hypot(c.B[0], c.B[1]); c.mag = bm; if (bm < 1e-9) { c.w *= Math.exp(-dt * 3); c.psi += c.w * dt; return; }
  const psiB = Math.atan2(c.B[1], c.B[0]), w2 = Math.min(W0 * W0 * bm / BE, 900), zt = 0.3; let d = c.psi - psiB; d = Math.atan2(Math.sin(d), Math.cos(d));
  if (Math.abs(Math.sin(d)) < 1e-3 && Math.abs(c.w) < 1e-2 && Math.cos(d) < 0) c.w += 0.4 * dt * 60 * (c.psi > 0 ? 1 : -1); // kim thật luôn bị nhiễu nhỏ: cân bằng không bền (ngược hướng B) không giữ được
  c.w += (-w2 * Math.sin(d) - 2 * zt * Math.sqrt(w2) * c.w) * dt; c.psi += c.w * dt;
}
export function refresh(s, grid) { for (const c of grid) c.B = totalHoriz(s, c.x, c.z); s.dirty = false; }
export function advance(s, dt, comps) { if (s.dirty) refresh(s, comps); let left = Math.min(dt * s.speed, 0.1); while (left > 1e-9) { const h = Math.min(left, 0.004); left -= h; for (const c of comps) stepCompass(c, h); } s.t += dt * s.speed; }
export function readout(s, probe) {
  const [px, pz] = probePos(s), m = srcHoriz(s, px, pz), bm = Math.hypot(...m), th = theory(s), fixDeg = (d) => ((d + 180) % 360 + 360) % 360 - 180;
  const t = [m[0], m[1] - (s.earth ? BE : 0)], east = (vx, vz) => Math.atan2(vx, -vz) / D2R, psiEq = Math.atan2(t[1], t[0]);
  return {px, pz, bm, th, ratio: Math.abs(th) > 1e-12 ? bm / Math.abs(th) : 0, atCenter: s.src === 'wire' || s.r < 0.012, src: s.src, I: s.I, N: s.N, R: s.R, r: s.r, alpha: s.alpha, earth: s.earth, mode: s.mode, rows: s.rows, dir: east(m[0], m[1]), needle: probe ? east(Math.cos(probe.psi), Math.sin(probe.psi)) : NaN,
    settled: !probe || (Math.abs(probe.w) < 0.05 && Math.abs(fixDeg((probe.psi - psiEq) / D2R)) < 1.5)};
}
export const record = (s) => { const [px, pz] = probePos(s); s.rows.push({src: s.src, r: s.r, I: s.I, N: s.N, R: s.R, B: Math.hypot(...srcHoriz(s, px, pz))}); return true; };
export const PRESETS = [
  {id: 'w', vi: 'Dây thẳng dài, I = 5 A', note: 'đường sức là các đường tròn đồng tâm', src: 'wire', I: 5, N: 1, R: 0.1, r: 0.05, alpha: 0},
  {id: 'l', vi: 'Khung dây tròn, R = 10 cm', note: 'B tại tâm = μ₀NI/2R', src: 'loop', I: 5, N: 1, R: 0.1, r: 0, alpha: 0},
  {id: 's', vi: 'Ống dây 150 vòng, I = 2 A', note: 'trong lòng ống B ≈ μ₀NI/ℓ', src: 'sol', I: 2, N: 150, R: 0.1, r: 0, alpha: 0},
];
