// VL10-M10: work, energy, power, efficiency on two set-ups.
//  'E' (energy): a simple pendulum released from rest. W = Wđ + Wt is conserved when drag b = 0 and falls when b > 0.
//  'W' (work and power): an electric winch lifts a load of mass m at constant speed v = η·P/(m·g);
//      A_ích = m·g·h, A_tp = P·t, H = A_ích/A_tp.
// One state per set-up; every number on screen reads from it.
export const G = 9.8, D2R = Math.PI / 180, PIV_H = 3.4;
export const H_MAX = 3.0; // m, winch travel
export const RANGE = {m: [0.5, 5], L: [1, 3], th0: [5, 80], b: [0, 0.5], mw: [2, 20], P: [50, 500], eta: [0.5, 0.95]};
export const PRESETS = [
  {id: 'a', vi: 'Con lắc không lực cản', note: 'cơ năng bảo toàn: Wđ + Wt = hằng số', mode: 'E', m: 2, L: 2, th0: 40, b: 0},
  {id: 'b', vi: 'Con lắc có lực cản', note: 'cơ năng giảm dần vì ma sát với không khí', mode: 'E', m: 2, L: 2, th0: 40, b: 0.25},
  {id: 'c', vi: 'Tời nâng 10 kg', note: 'P = 200 W, H = 80% → v ≈ 1,63 m/s', mode: 'W', mw: 10, P: 200, eta: 0.8},
];
export function createModel() {
  return {mode: 'E', m: 2, L: 2, th0: 40, b: 0, mw: 10, P: 200, eta: 0.8, th: 40 * D2R, w: 0, t: 0, released: false, vGate: null, vGatePrev: 0, hmax: 0, prevW: 0,
    h: 0, tw: 0, running: false, speed: 1};
}
export function reset(s) { s.th = s.th0 * D2R; s.w = 0; s.t = 0; s.released = false; s.vGate = null; s.vGatePrev = 0; s.hmax = 0; s.prevW = 0; s.h = 0; s.tw = 0; s.running = false; }
export const energy = (s) => {
  const hgt = s.L * (1 - Math.cos(s.th)), v = s.L * s.w, Wt = s.m * G * hgt, Wd = 0.5 * s.m * v * v;
  return {h: hgt, v, Wt, Wd, W: Wt + Wd, W0: s.m * G * s.L * (1 - Math.cos(s.th0 * D2R)), vIdeal: Math.sqrt(2 * G * s.L * (1 - Math.cos(s.th0 * D2R)))};
};
export function step(s, dt) {
  if (s.mode === 'E') {
    if (!s.released) return;
    // velocity-Verlet (energy error ~ dt²), with the drag applied as an exact exponential factor
    const k = G / s.L; s.w += -0.5 * k * Math.sin(s.th) * dt; const thPrev = s.th; s.th += s.w * dt; s.w += -0.5 * k * Math.sin(s.th) * dt; s.w *= Math.exp(-s.b * dt); s.t += dt;
    if (thPrev * s.th < 0 || Math.abs(s.th) < 1e-9) s.vGate = Math.abs(s.L * s.w); // photogate at the lowest point
  } else if (s.running) {
    const v = (s.eta * s.P) / (s.mw * G); s.h = Math.min(H_MAX, s.h + v * dt); s.tw += dt; if (s.h >= H_MAX) s.running = false;
  }
}
export function advance(s, dt) { let left = Math.min(dt * s.speed, 0.25); while (left > 1e-9) { const h = Math.min(left, 1 / 480); step(s, h); left -= h; } }
export function readout(s) {
  if (s.mode === 'E') { const e = energy(s); return {mode: 'E', ...e, th: s.th, w: s.w, t: s.t, released: s.released, m: s.m, L: s.L, b: s.b, vGate: s.vGate, lost: e.W0 - e.W, period: 2 * Math.PI * Math.sqrt(s.L / G)}; }
  const v = (s.eta * s.P) / (s.mw * G), Ai = s.mw * G * s.h, Atp = s.P * s.tw, Pic = s.mw * G * v;
  return {mode: 'W', m: s.mw, P: s.P, eta: s.eta, v, h: s.h, t: s.tw, Ai, Atp, H: Atp > 0 ? Ai / Atp : s.eta, Pic, loss: Atp - Ai, running: s.running, done: s.h >= H_MAX - 1e-9, tReach: (s.mw * G * H_MAX) / (s.eta * s.P)};
}
/** settled answers for the lesson */
export const ideal = {
  Wmax: (m, L, th0) => m * G * L * (1 - Math.cos(th0 * D2R)), vmax: (L, th0) => Math.sqrt(2 * G * L * (1 - Math.cos(th0 * D2R))),
  vw: (P, eta, m) => (eta * P) / (m * G), Aich: (m, h) => m * G * h,
};
