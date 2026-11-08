// VL10-M11: collisions in one dimension of two carts on a frictionless track.
//   v1' = ((m1 − e·m2)·v1 + (1 + e)·m2·v2)/(m1 + m2) ;  v2' = ((m2 − e·m1)·v2 + (1 + e)·m1·v1)/(m1 + m2)
// e = 0: perfectly inelastic (the carts stick), e = 1: elastic. The impact is idealised as instantaneous.
// Total momentum is conserved for every e; kinetic energy only for e = 1. One state drives everything on screen.
export const T_MAX = 9;
export const LEN = 1.1; // cart length
export const X1 = -4.2, X2 = 4.2; // start positions
export const RANGE = {m1: [1, 4], m2: [1, 4], v1: [0, 6], v2: [-4, 3], e: [0, 1]};
export const PRESETS = [
  {id: 'a', vi: 'Va chạm mềm (dính)', note: '2 kg · 3 m/s va 1 kg đứng yên → v′ = 2 m/s', m1: 2, m2: 1, v1: 3, v2: 0, e: 0},
  {id: 'b', vi: 'Va chạm đàn hồi, khối bằng nhau', note: 'xe 1 dừng lại, xe 2 đi tiếp với v₁', m1: 1, m2: 1, v1: 2, v2: 0, e: 1},
  {id: 'c', vi: 'Xe nặng đâm xe nhẹ (đàn hồi)', note: '3 kg · 2 m/s va 1 kg đứng yên', m1: 3, m2: 1, v1: 2, v2: 0, e: 1},
];
export const createModel = () => ({m1: 2, m2: 1, v1: 3, v2: 0, e: 0, t: 0, running: false, speed: 1, tc: null});
export const after = (s) => { const M = s.m1 + s.m2; return {v1: ((s.m1 - s.e * s.m2) * s.v1 + (1 + s.e) * s.m2 * s.v2) / M, v2: ((s.m2 - s.e * s.m1) * s.v2 + (1 + s.e) * s.m1 * s.v1) / M}; };
export const collides = (s) => s.v1 - s.v2 > 0.05;
export const tCollide = (s) => (collides(s) ? (X2 - X1 - LEN) / (s.v1 - s.v2) : Infinity);
export function reset(s) { s.t = 0; s.running = false; }
export function advance(s, dt) { if (s.running) { s.t = Math.min(T_MAX, s.t + Math.min(dt * s.speed, 0.25)); if (s.t >= T_MAX) s.running = false; } }
export function readout(s) {
  const tc = tCollide(s), a = after(s), t = s.t, hit = t >= tc, vA = hit ? a.v1 : s.v1, vB = hit ? a.v2 : s.v2;
  const x1 = hit ? X1 + s.v1 * tc + a.v1 * (t - tc) : X1 + s.v1 * t, x2 = hit ? X2 + s.v2 * tc + a.v2 * (t - tc) : X2 + s.v2 * t;
  const pB = s.m1 * s.v1 + s.m2 * s.v2, pA = s.m1 * a.v1 + s.m2 * a.v2, kB = 0.5 * s.m1 * s.v1 ** 2 + 0.5 * s.m2 * s.v2 ** 2, kA = 0.5 * s.m1 * a.v1 ** 2 + 0.5 * s.m2 * a.v2 ** 2;
  return {t, tc, hit, collides: collides(s), x1, x2, v1: vA, v2: vB, p1: s.m1 * vA, p2: s.m2 * vB, p: s.m1 * vA + s.m2 * vB, pBefore: pB, pAfter: pA, kBefore: kB, kAfter: kA, kLost: kB - kA, kNow: 0.5 * s.m1 * vA ** 2 + 0.5 * s.m2 * vB ** 2,
    v1After: a.v1, v2After: a.v2, eMeasured: collides(s) ? (a.v2 - a.v1) / (s.v1 - s.v2) : null, stick: s.e === 0, kind: s.e === 0 ? 'va chạm mềm (dính)' : s.e === 1 ? 'va chạm đàn hồi' : 'va chạm không đàn hồi một phần', m1: s.m1, m2: s.m2, e: s.e};
}
export const ideal = {pBefore: (s) => s.m1 * s.v1 + s.m2 * s.v2, vStick: (s) => (s.m1 * s.v1 + s.m2 * s.v2) / (s.m1 + s.m2), after: (s) => after(s)};
